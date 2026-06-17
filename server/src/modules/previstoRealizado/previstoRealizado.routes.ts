import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, sendError, sendJson } from '../../http.js';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface SqlFilter {
  conditions: string[];
  params: unknown[];
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const competenciaPattern = /^\d{4}-\d{2}$/;

const assertUuid = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
  }
  return normalized;
};

const assertCompetencia = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (!competenciaPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Competencia invalida em ${fieldName}. Use YYYY-MM.`);
  }
  return normalized;
};

const addParam = (filter: SqlFilter, value: unknown): string => {
  filter.params.push(value);
  return `$${filter.params.length}`;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const buildObrasFilter = (url: URL): SqlFilter => {
  const filter: SqlFilter = { conditions: ['1 = 1'], params: [] };

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    filter.conditions.push(`o.id = ${addParam(filter, assertUuid(obraId, 'obra_id'))}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    filter.conditions.push(`o.cliente_id = ${addParam(filter, assertUuid(clienteId, 'cliente_id'))}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    filter.conditions.push(`o.centro_custo_id = ${addParam(filter, assertUuid(centroCustoId, 'centro_custo_id'))}`);
  }

  const contratoId = url.searchParams.get('contrato_id');
  if (contratoId) {
    filter.conditions.push(`exists (
      select 1
      from contratos_obra filtro_contrato
      where filtro_contrato.obra_id = o.id
        and filtro_contrato.id = ${addParam(filter, assertUuid(contratoId, 'contrato_id'))}
    )`);
  }

  return filter;
};

const getResumoRows = async (url: URL, obraId?: string): Promise<QueryResultRow[]> => {
  const filter = buildObrasFilter(url);
  if (obraId) {
    filter.conditions.push(`o.id = ${addParam(filter, assertUuid(obraId, 'obraId'))}`);
  }

  const result = await getPool().query<QueryResultRow>(
    `
    with obras_base as (
      select
        o.id as obra_id,
        o.company_id,
        o.codigo as obra_codigo,
        o.nome as obra_nome,
        o.status as obra_status,
        o.cliente_id,
        c.nome as cliente_nome,
        o.centro_custo_id,
        cc.codigo as centro_custo_codigo,
        cc.nome as centro_custo_nome
      from obras o
      left join clientes c on c.id = o.cliente_id
      left join centros_custo cc on cc.id = o.centro_custo_id
      where ${filter.conditions.join(' and ')}
    ),
    orcamento_vigente as (
      select distinct on (oo.obra_id)
        oo.id as orcamento_id,
        oo.obra_id,
        oo.codigo as orcamento_codigo,
        oo.versao as orcamento_versao,
        oo.valor_previsto_total,
        oo.margem_prevista_percentual,
        oo.competencia_base,
        oo.aprovado_em
      from orcamentos_obra oo
      join obras_base ob on ob.obra_id = oo.obra_id
      where oo.status = 'APROVADO'
      order by oo.obra_id, oo.aprovado_em desc nulls last, oo.created_at desc
    ),
    contratos as (
      select
        co.obra_id,
        count(*)::int as quantidade_contratos,
        coalesce(sum(co.valor_original), 0)::numeric(14,2) as valor_contratado
      from contratos_obra co
      join obras_base ob on ob.obra_id = co.obra_id
      where co.status in ('ATIVO', 'ENCERRADO')
      group by co.obra_id
    ),
    aditivos as (
      select
        co.obra_id,
        coalesce(sum(ca.valor_delta), 0)::numeric(14,2) as valor_aditado,
        count(ca.id)::int as quantidade_aditivos
      from contratos_obra co
      join obras_base ob on ob.obra_id = co.obra_id
      join contratos_obra_aditivos ca on ca.contrato_id = co.id
      where ca.status = 'APROVADO'
      group by co.obra_id
    ),
    pedidos as (
      select
        pc.obra_id,
        coalesce(sum(pc.valor_total), 0)::numeric(14,2) as valor_pedidos_confirmados,
        count(*)::int as quantidade_pedidos
      from pedidos_compra pc
      join obras_base ob on ob.obra_id = pc.obra_id
      where pc.status in ('CONFIRMADO', 'PARCIALMENTE_RECEBIDO', 'RECEBIDO')
      group by pc.obra_id
    ),
    notas as (
      select
        nf.obra_id,
        coalesce(sum(nf.valor_total), 0)::numeric(14,2) as valor_notas_aprovadas,
        count(*)::int as quantidade_notas
      from notas_fiscais_entrada nf
      join obras_base ob on ob.obra_id = nf.obra_id
      where nf.status in ('APROVADA', 'PROVISIONADA')
      group by nf.obra_id
    ),
    contas as (
      select
        cp.obra_id,
        coalesce(sum(cp.valor_original) filter (where cp.status <> 'CANCELADA'), 0)::numeric(14,2) as valor_contas_nao_canceladas,
        coalesce(sum(cp.valor_original) filter (where cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')), 0)::numeric(14,2) as valor_contas_realizadas,
        count(*) filter (where cp.status <> 'CANCELADA')::int as quantidade_contas
      from contas_pagar cp
      join obras_base ob on ob.obra_id = cp.obra_id
      group by cp.obra_id
    ),
    baixas as (
      select
        cp.obra_id,
        coalesce(sum(cb.valor_baixado), 0)::numeric(14,2) as valor_baixado_manual,
        count(cb.id)::int as quantidade_baixas
      from contas_pagar_baixas cb
      join contas_pagar cp on cp.id = cb.conta_pagar_id
      join obras_base ob on ob.obra_id = cp.obra_id
      where cb.acao = 'BAIXAR_MANUAL' and cb.resultado = 'PERMITIDO'
      group by cp.obra_id
    ),
    medicoes as (
      select
        m.obra_id,
        coalesce(sum(m.valor_liquido_previsto), 0)::numeric(14,2) as receita_medida,
        count(*)::int as quantidade_medicoes
      from medicoes_obra m
      join obras_base ob on ob.obra_id = m.obra_id
      where m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')
      group by m.obra_id
    ),
    faturamento as (
      select
        pf.obra_id,
        coalesce(sum(pf.valor_solicitado) filter (where pf.status = 'FATURADO_MANUALMENTE'), 0)::numeric(14,2) as receita_faturada_manual,
        count(*) filter (where pf.status = 'FATURADO_MANUALMENTE')::int as quantidade_faturamentos
      from pedidos_faturamento pf
      join obras_base ob on ob.obra_id = pf.obra_id
      group by pf.obra_id
    ),
    base as (
      select
        ob.*,
        ov.orcamento_id,
        ov.orcamento_codigo,
        ov.orcamento_versao,
        ov.competencia_base,
        ov.margem_prevista_percentual,
        coalesce(ov.valor_previsto_total, 0)::numeric(14,2) as orcamento_previsto,
        coalesce(ct.quantidade_contratos, 0) as quantidade_contratos,
        coalesce(ct.valor_contratado, 0)::numeric(14,2) as valor_contratado,
        coalesce(ad.valor_aditado, 0)::numeric(14,2) as valor_aditado,
        coalesce(ad.quantidade_aditivos, 0) as quantidade_aditivos,
        (coalesce(ct.valor_contratado, 0) + coalesce(ad.valor_aditado, 0))::numeric(14,2) as valor_total_contratado,
        greatest(coalesce(pd.valor_pedidos_confirmados, 0), coalesce(cp.valor_contas_nao_canceladas, 0))::numeric(14,2) as custo_comprometido,
        greatest(coalesce(cp.valor_contas_realizadas, 0), coalesce(nf.valor_notas_aprovadas, 0))::numeric(14,2) as custo_realizado,
        coalesce(bx.valor_baixado_manual, 0)::numeric(14,2) as custo_baixado_manual,
        coalesce(md.receita_medida, 0)::numeric(14,2) as receita_medida,
        coalesce(ft.receita_faturada_manual, 0)::numeric(14,2) as receita_faturada_manual,
        coalesce(pd.valor_pedidos_confirmados, 0)::numeric(14,2) as custo_pedidos_confirmados,
        coalesce(nf.valor_notas_aprovadas, 0)::numeric(14,2) as custo_notas_aprovadas,
        coalesce(cp.valor_contas_realizadas, 0)::numeric(14,2) as custo_contas_realizadas,
        coalesce(pd.quantidade_pedidos, 0) as quantidade_pedidos,
        coalesce(nf.quantidade_notas, 0) as quantidade_notas,
        coalesce(cp.quantidade_contas, 0) as quantidade_contas,
        coalesce(bx.quantidade_baixas, 0) as quantidade_baixas,
        coalesce(md.quantidade_medicoes, 0) as quantidade_medicoes,
        coalesce(ft.quantidade_faturamentos, 0) as quantidade_faturamentos
      from obras_base ob
      left join orcamento_vigente ov on ov.obra_id = ob.obra_id
      left join contratos ct on ct.obra_id = ob.obra_id
      left join aditivos ad on ad.obra_id = ob.obra_id
      left join pedidos pd on pd.obra_id = ob.obra_id
      left join notas nf on nf.obra_id = ob.obra_id
      left join contas cp on cp.obra_id = ob.obra_id
      left join baixas bx on bx.obra_id = ob.obra_id
      left join medicoes md on md.obra_id = ob.obra_id
      left join faturamento ft on ft.obra_id = ob.obra_id
    )
    select
      *,
      (valor_total_contratado - orcamento_previsto)::numeric(14,2) as margem_prevista,
      ((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado)::numeric(14,2) as margem_realizada,
      (((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado) - (valor_total_contratado - orcamento_previsto))::numeric(14,2) as desvio_absoluto,
      case
        when (valor_total_contratado - orcamento_previsto) <> 0 then round(((((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado) - (valor_total_contratado - orcamento_previsto)) / abs(valor_total_contratado - orcamento_previsto)) * 100, 2)
        else null
      end as desvio_percentual,
      (valor_total_contratado - receita_medida)::numeric(14,2) as saldo_contratual,
      (orcamento_previsto - custo_realizado)::numeric(14,2) as saldo_orcamentario,
      (receita_medida - receita_faturada_manual)::numeric(14,2) as saldo_a_faturar,
      (orcamento_id is null) as alerta_sem_orcamento_aprovado,
      (quantidade_contratos = 0) as alerta_sem_contrato_ativo,
      (custo_realizado > orcamento_previsto and orcamento_previsto > 0) as alerta_custo_acima_previsto,
      (receita_faturada_manual < receita_medida and receita_medida > 0) as alerta_faturamento_abaixo_previsto,
      (((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado) < 0) as alerta_margem_negativa
    from base
    order by obra_codigo asc, obra_nome asc
    `,
    filter.params
  );
  return result.rows;
};

const getResumoObra = async (obraId: string, url: URL): Promise<QueryResultRow> => {
  const row = (await getResumoRows(url, obraId))[0];
  if (!row) {
    throw new HttpError(404, 'not_found', 'Obra nao encontrada para previsto x realizado.');
  }
  return row;
};

const getCurvaObra = async (obraId: string, url: URL): Promise<QueryResultRow[]> => {
  assertUuid(obraId, 'obraId');
  const filter: SqlFilter = { conditions: ['1 = 1'], params: [obraId] };
  const competenciaDe = url.searchParams.get('competencia_de');
  if (competenciaDe) {
    filter.conditions.push(`competencia >= ${addParam(filter, assertCompetencia(competenciaDe, 'competencia_de'))}`);
  }
  const competenciaAte = url.searchParams.get('competencia_ate');
  if (competenciaAte) {
    filter.conditions.push(`competencia <= ${addParam(filter, assertCompetencia(competenciaAte, 'competencia_ate'))}`);
  }

  const result = await getPool().query<QueryResultRow>(
    `
    with orcamento as (
      select id
      from orcamentos_obra
      where obra_id = $1 and status = 'APROVADO'
      order by aprovado_em desc nulls last, created_at desc
      limit 1
    ),
    previsto as (
      select c.competencia, coalesce(sum(c.valor_previsto), 0)::numeric(14,2) as previsto
      from orcamentos_obra_cronograma c
      join orcamento o on o.id = c.orcamento_id
      where c.status = 'ATIVO'
      group by c.competencia
    ),
    contas_realizadas as (
      select to_char(cp.data_vencimento, 'YYYY-MM') as competencia,
             coalesce(sum(cp.valor_original), 0)::numeric(14,2) as realizado_contas
      from contas_pagar cp
      where cp.obra_id = $1
        and cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')
      group by to_char(cp.data_vencimento, 'YYYY-MM')
    ),
    notas_realizadas as (
      select to_char(nf.data_entrada, 'YYYY-MM') as competencia,
             coalesce(sum(nf.valor_total), 0)::numeric(14,2) as realizado_notas
      from notas_fiscais_entrada nf
      where nf.obra_id = $1 and nf.status in ('APROVADA', 'PROVISIONADA')
      group by to_char(nf.data_entrada, 'YYYY-MM')
    ),
    baixas as (
      select to_char(cb.data_baixa, 'YYYY-MM') as competencia,
             coalesce(sum(cb.valor_baixado), 0)::numeric(14,2) as baixado_manual
      from contas_pagar_baixas cb
      join contas_pagar cp on cp.id = cb.conta_pagar_id
      where cp.obra_id = $1
        and cb.acao = 'BAIXAR_MANUAL'
        and cb.resultado = 'PERMITIDO'
        and cb.data_baixa is not null
      group by to_char(cb.data_baixa, 'YYYY-MM')
    ),
    faturado as (
      select to_char(coalesce(pf.faturado_manual_data, pf.data_solicitacao), 'YYYY-MM') as competencia,
             coalesce(sum(pf.valor_solicitado), 0)::numeric(14,2) as faturado
      from pedidos_faturamento pf
      where pf.obra_id = $1 and pf.status = 'FATURADO_MANUALMENTE'
      group by to_char(coalesce(pf.faturado_manual_data, pf.data_solicitacao), 'YYYY-MM')
    ),
    competencias as (
      select competencia from previsto
      union select competencia from contas_realizadas
      union select competencia from notas_realizadas
      union select competencia from baixas
      union select competencia from faturado
    ),
    linhas as (
      select
        c.competencia,
        coalesce(p.previsto, 0)::numeric(14,2) as previsto,
        greatest(coalesce(cr.realizado_contas, 0), coalesce(nr.realizado_notas, 0))::numeric(14,2) as realizado,
        coalesce(bx.baixado_manual, 0)::numeric(14,2) as baixado_manual,
        coalesce(ft.faturado, 0)::numeric(14,2) as faturado
      from competencias c
      left join previsto p on p.competencia = c.competencia
      left join contas_realizadas cr on cr.competencia = c.competencia
      left join notas_realizadas nr on nr.competencia = c.competencia
      left join baixas bx on bx.competencia = c.competencia
      left join faturado ft on ft.competencia = c.competencia
      where ${filter.conditions.join(' and ')}
    )
    select
      competencia,
      previsto,
      realizado,
      faturado,
      baixado_manual,
      (previsto - realizado)::numeric(14,2) as diferenca_mensal,
      sum(previsto) over (order by competencia)::numeric(14,2) as acumulado_previsto,
      sum(realizado) over (order by competencia)::numeric(14,2) as acumulado_realizado,
      sum(faturado) over (order by competencia)::numeric(14,2) as acumulado_faturado
    from linhas
    order by competencia asc
    `,
    filter.params
  );
  return result.rows;
};

const getPacotesObra = async (obraId: string): Promise<QueryResultRow[]> => {
  assertUuid(obraId, 'obraId');
  const result = await getPool().query<QueryResultRow>(
    `
    with orcamento as (
      select id
      from orcamentos_obra
      where obra_id = $1 and status = 'APROVADO'
      order by aprovado_em desc nulls last, created_at desc
      limit 1
    ),
    itens_pacote as (
      select
        i.pacote_id,
        (max(i.centro_custo_id::text) filter (where i.centro_custo_id is not null))::uuid as centro_custo_id,
        coalesce(sum(i.valor_total_previsto) filter (where i.status = 'ATIVO'), 0)::numeric(14,2) as valor_previsto
      from orcamentos_obra_itens i
      join orcamento o on o.id = i.orcamento_id
      group by i.pacote_id
    ),
    pacote_base as (
      select
        p.id as pacote_id,
        p.codigo as pacote_codigo,
        p.nome as pacote_nome,
        p.etapa,
        coalesce(p.centro_custo_id, ip.centro_custo_id) as centro_custo_id,
        coalesce(ip.valor_previsto, 0)::numeric(14,2) as valor_previsto
      from orcamentos_obra_pacotes p
      join orcamento o on o.id = p.orcamento_id
      left join itens_pacote ip on ip.pacote_id = p.id
      where p.status = 'ATIVO'
    )
    select
      p.pacote_id,
      p.pacote_codigo,
      p.pacote_nome,
      p.etapa,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      p.valor_previsto,
      coalesce((
        select sum(cp.valor_original)
        from contas_pagar cp
        where cp.obra_id = $1
          and cp.centro_custo_id = p.centro_custo_id
          and cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')
      ), 0)::numeric(14,2) as custo_realizado,
      coalesce((
        select sum(mi.valor_total)
        from medicoes_obra_itens mi
        join medicoes_obra m on m.id = mi.medicao_id
        where m.obra_id = $1
          and mi.centro_custo_id = p.centro_custo_id
          and mi.status = 'ATIVO'
          and m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')
      ), 0)::numeric(14,2) as receita_medida
    from pacote_base p
    left join centros_custo cc on cc.id = p.centro_custo_id
    order by p.pacote_codigo asc, p.pacote_nome asc
    `,
    [obraId]
  );
  return result.rows.map((row) => ({
    ...row,
    saldo_orcamentario: Number((toNumber(row.valor_previsto) - toNumber(row.custo_realizado)).toFixed(2)),
    margem_realizada: Number((toNumber(row.receita_medida) - toNumber(row.custo_realizado)).toFixed(2))
  }));
};

const getCentrosCustoObra = async (obraId: string): Promise<QueryResultRow[]> => {
  assertUuid(obraId, 'obraId');
  const result = await getPool().query<QueryResultRow>(
    `
    with centros as (
      select o.centro_custo_id from obras o where o.id = $1 and o.centro_custo_id is not null
      union select oi.centro_custo_id from orcamentos_obra oo join orcamentos_obra_itens oi on oi.orcamento_id = oo.id where oo.obra_id = $1 and oo.status = 'APROVADO' and oi.centro_custo_id is not null
      union select centro_custo_id from pedidos_compra where obra_id = $1 and centro_custo_id is not null
      union select centro_custo_id from contas_pagar where obra_id = $1 and centro_custo_id is not null
      union select centro_custo_id from medicoes_obra where obra_id = $1 and centro_custo_id is not null
    )
    select
      cc.id as centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      coalesce((select sum(oi.valor_total_previsto) from orcamentos_obra oo join orcamentos_obra_itens oi on oi.orcamento_id = oo.id where oo.obra_id = $1 and oo.status = 'APROVADO' and oi.status = 'ATIVO' and oi.centro_custo_id = cc.id), 0)::numeric(14,2) as valor_previsto,
      coalesce((select sum(pc.valor_total) from pedidos_compra pc where pc.obra_id = $1 and pc.centro_custo_id = cc.id and pc.status in ('CONFIRMADO', 'PARCIALMENTE_RECEBIDO', 'RECEBIDO')), 0)::numeric(14,2) as custo_comprometido,
      coalesce((select sum(cp.valor_original) from contas_pagar cp where cp.obra_id = $1 and cp.centro_custo_id = cc.id and cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')), 0)::numeric(14,2) as custo_realizado,
      coalesce((select sum(mi.valor_total) from medicoes_obra_itens mi join medicoes_obra m on m.id = mi.medicao_id where m.obra_id = $1 and mi.centro_custo_id = cc.id and mi.status = 'ATIVO' and m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')), 0)::numeric(14,2) as receita_medida,
      coalesce((select sum(pf.valor_solicitado) from pedidos_faturamento pf join medicoes_obra m on m.id = pf.medicao_id where pf.obra_id = $1 and m.centro_custo_id = cc.id and pf.status = 'FATURADO_MANUALMENTE'), 0)::numeric(14,2) as receita_faturada_manual
    from centros c
    join centros_custo cc on cc.id = c.centro_custo_id
    order by cc.codigo asc, cc.nome asc
    `,
    [obraId]
  );
  return result.rows.map((row) => ({
    ...row,
    saldo_orcamentario: Number((toNumber(row.valor_previsto) - toNumber(row.custo_realizado)).toFixed(2))
  }));
};

const getContratosObra = async (obraId: string): Promise<QueryResultRow[]> => {
  assertUuid(obraId, 'obraId');
  const result = await getPool().query<QueryResultRow>(
    `
    select
      co.id,
      co.numero,
      co.status,
      co.valor_original::numeric(14,2) as valor_contratado,
      coalesce(ad.valor_aditado, 0)::numeric(14,2) as valor_aditado,
      (co.valor_original + coalesce(ad.valor_aditado, 0))::numeric(14,2) as valor_total_contratado,
      coalesce(md.receita_medida, 0)::numeric(14,2) as receita_medida,
      coalesce(ft.receita_faturada_manual, 0)::numeric(14,2) as receita_faturada_manual,
      ((co.valor_original + coalesce(ad.valor_aditado, 0)) - coalesce(md.receita_medida, 0))::numeric(14,2) as saldo_contratual,
      coalesce(ad.quantidade_aditivos, 0) as quantidade_aditivos
    from contratos_obra co
    left join (
      select contrato_id, coalesce(sum(valor_delta), 0) as valor_aditado, count(*)::int as quantidade_aditivos
      from contratos_obra_aditivos
      where status = 'APROVADO'
      group by contrato_id
    ) ad on ad.contrato_id = co.id
    left join (
      select contrato_obra_id, coalesce(sum(valor_liquido_previsto), 0) as receita_medida
      from medicoes_obra
      where status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')
      group by contrato_obra_id
    ) md on md.contrato_obra_id = co.id
    left join (
      select contrato_obra_id, coalesce(sum(valor_solicitado), 0) as receita_faturada_manual
      from pedidos_faturamento
      where status = 'FATURADO_MANUALMENTE'
      group by contrato_obra_id
    ) ft on ft.contrato_obra_id = co.id
    where co.obra_id = $1 and co.status in ('ATIVO', 'ENCERRADO', 'SUSPENSO')
    order by co.created_at desc
    `,
    [obraId]
  );
  return result.rows;
};

const getFaturamentoObra = async (obraId: string): Promise<Record<string, unknown>> => {
  assertUuid(obraId, 'obraId');
  const pool = getPool();
  const [totais, medicoes, pedidos] = await Promise.all([
    pool.query<QueryResultRow>(
      `
      select
        coalesce(sum(m.valor_liquido_previsto) filter (where m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')), 0)::numeric(14,2) as receita_medida,
        coalesce(sum(pf.valor_solicitado) filter (where pf.status = 'FATURADO_MANUALMENTE'), 0)::numeric(14,2) as receita_faturada_manual,
        count(distinct m.id) filter (where m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE'))::int as quantidade_medicoes,
        count(distinct pf.id) filter (where pf.status = 'FATURADO_MANUALMENTE')::int as quantidade_faturamentos
      from medicoes_obra m
      left join pedidos_faturamento pf on pf.medicao_id = m.id
      where m.obra_id = $1
      `,
      [obraId]
    ),
    pool.query<QueryResultRow>(
      `
      select id, numero, competencia, status, valor_liquido_previsto, contrato_obra_id
      from medicoes_obra
      where obra_id = $1
      order by competencia desc, created_at desc
      limit 100
      `,
      [obraId]
    ),
    pool.query<QueryResultRow>(
      `
      select id, codigo, status, valor_solicitado, data_solicitacao, faturado_manual_data, contrato_obra_id
      from pedidos_faturamento
      where obra_id = $1
      order by data_solicitacao desc, created_at desc
      limit 100
      `,
      [obraId]
    )
  ]);

  return {
    totais: totais.rows[0],
    medicoes: medicoes.rows,
    pedidos_faturamento: pedidos.rows
  };
};

const getCustosObra = async (obraId: string): Promise<Record<string, unknown>> => {
  assertUuid(obraId, 'obraId');
  const pool = getPool();
  const [totais, pedidos, notas, contas, baixas] = await Promise.all([
    pool.query<QueryResultRow>(
      `
      select
        coalesce((select sum(valor_total) from pedidos_compra where obra_id = $1 and status in ('CONFIRMADO', 'PARCIALMENTE_RECEBIDO', 'RECEBIDO')), 0)::numeric(14,2) as custo_pedidos_confirmados,
        coalesce((select sum(valor_total) from notas_fiscais_entrada where obra_id = $1 and status in ('APROVADA', 'PROVISIONADA')), 0)::numeric(14,2) as custo_notas_aprovadas,
        coalesce((select sum(valor_original) from contas_pagar where obra_id = $1 and status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')), 0)::numeric(14,2) as custo_contas_realizadas,
        coalesce((select sum(cb.valor_baixado) from contas_pagar_baixas cb join contas_pagar cp on cp.id = cb.conta_pagar_id where cp.obra_id = $1 and cb.acao = 'BAIXAR_MANUAL' and cb.resultado = 'PERMITIDO'), 0)::numeric(14,2) as custo_baixado_manual
      `,
      [obraId]
    ),
    pool.query<QueryResultRow>('select id, codigo, status, valor_total, data_emissao, fornecedor_id, centro_custo_id from pedidos_compra where obra_id = $1 order by created_at desc limit 100', [obraId]),
    pool.query<QueryResultRow>('select id, numero, serie, status, valor_total, data_entrada, fornecedor_id, centro_custo_id from notas_fiscais_entrada where obra_id = $1 order by data_entrada desc, created_at desc limit 100', [obraId]),
    pool.query<QueryResultRow>('select id, numero_documento, status, valor_original, valor_aberto, baixa_status, baixa_manual_valor, data_vencimento, fornecedor_id, centro_custo_id from contas_pagar where obra_id = $1 order by data_vencimento desc, created_at desc limit 100', [obraId]),
    pool.query<QueryResultRow>('select cb.id, cb.conta_pagar_id, cb.acao, cb.resultado, cb.valor_baixado, cb.data_baixa, cb.created_at from contas_pagar_baixas cb join contas_pagar cp on cp.id = cb.conta_pagar_id where cp.obra_id = $1 order by cb.created_at desc limit 100', [obraId])
  ]);

  return {
    totais: totais.rows[0],
    pedidos_compra: pedidos.rows,
    notas_fiscais_entrada: notas.rows,
    contas_pagar: contas.rows,
    baixas_manuais: baixas.rows
  };
};

const getPortfolioResumo = async (url: URL): Promise<Record<string, unknown>> => {
  const obras = await getResumoRows(url);
  const totais = obras.reduce(
    (acc, row) => {
      acc.quantidade_obras += 1;
      acc.valor_total_contratado += toNumber(row.valor_total_contratado);
      acc.orcamento_previsto += toNumber(row.orcamento_previsto);
      acc.custo_comprometido += toNumber(row.custo_comprometido);
      acc.custo_realizado += toNumber(row.custo_realizado);
      acc.receita_medida += toNumber(row.receita_medida);
      acc.receita_faturada_manual += toNumber(row.receita_faturada_manual);
      acc.margem_prevista += toNumber(row.margem_prevista);
      acc.margem_realizada += toNumber(row.margem_realizada);
      acc.desvio_absoluto += toNumber(row.desvio_absoluto);
      return acc;
    },
    {
      quantidade_obras: 0,
      valor_total_contratado: 0,
      orcamento_previsto: 0,
      custo_comprometido: 0,
      custo_realizado: 0,
      receita_medida: 0,
      receita_faturada_manual: 0,
      margem_prevista: 0,
      margem_realizada: 0,
      desvio_absoluto: 0
    }
  );

  return {
    totais,
    alertas: {
      sem_orcamento_aprovado: obras.filter((row) => row.alerta_sem_orcamento_aprovado).length,
      sem_contrato_ativo: obras.filter((row) => row.alerta_sem_contrato_ativo).length,
      custo_acima_previsto: obras.filter((row) => row.alerta_custo_acima_previsto).length,
      faturamento_abaixo_previsto: obras.filter((row) => row.alerta_faturamento_abaixo_previsto).length,
      margem_negativa: obras.filter((row) => row.alerta_margem_negativa).length
    },
    formulas: {
      margem_prevista: 'valor_total_contratado - orcamento_previsto',
      margem_realizada: '(receita_faturada_manual quando existir, senao receita_medida) - custo_realizado',
      custo_comprometido: 'maior valor entre pedidos confirmados e contas nao canceladas',
      custo_realizado: 'maior valor entre contas realizadas e notas aprovadas/provisionadas',
      saldo_a_faturar: 'receita_medida - receita_faturada_manual'
    },
    obras
  };
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const pgError = toPgError(error);
  if (pgError.code === '22P02') {
    sendError(res, 400, 'invalid_filter', 'Filtro invalido para previsto x realizado.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handlePrevistoRealizado = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/previsto-realizado';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 2 && parts[0] === 'portfolio' && parts[1] === 'resumo') {
      sendJson(res, 200, { data: await getPortfolioResumo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'obras') {
      sendJson(res, 200, { data: await getResumoRows(url) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'resumo') {
      sendJson(res, 200, { data: await getResumoObra(parts[1], url) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'curva') {
      sendJson(res, 200, { data: await getCurvaObra(parts[1], url) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'pacotes') {
      sendJson(res, 200, { data: await getPacotesObra(parts[1]) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'centros-custo') {
      sendJson(res, 200, { data: await getCentrosCustoObra(parts[1]) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'contratos') {
      sendJson(res, 200, { data: await getContratosObra(parts[1]) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'faturamento') {
      sendJson(res, 200, { data: await getFaturamentoObra(parts[1]) });
      return;
    }

    if (parts.length === 3 && parts[0] === 'obras' && parts[2] === 'custos') {
      sendJson(res, 200, { data: await getCustosObra(parts[1]) });
      return;
    }

    sendError(res, 404, 'not_found', 'Relatorio previsto x realizado nao encontrado.');
  } catch (error) {
    handleError(res, error);
  }
};
