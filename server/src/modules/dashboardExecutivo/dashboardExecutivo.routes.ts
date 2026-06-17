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
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const addParam = (filter: SqlFilter, value: unknown): string => {
  filter.params.push(value);
  return `$${filter.params.length}`;
};

const assertUuid = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
  }
  return normalized;
};

const assertDate = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (!datePattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return normalized;
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const buildObraFilter = (url: URL, alias = 'o'): SqlFilter => {
  const filter: SqlFilter = { conditions: ['1 = 1'], params: [] };

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    filter.conditions.push(`${alias}.id = ${addParam(filter, assertUuid(obraId, 'obra_id'))}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    filter.conditions.push(`${alias}.cliente_id = ${addParam(filter, assertUuid(clienteId, 'cliente_id'))}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    filter.conditions.push(`${alias}.centro_custo_id = ${addParam(filter, assertUuid(centroCustoId, 'centro_custo_id'))}`);
  }

  const statusObra = url.searchParams.get('status_obra');
  if (statusObra) {
    filter.conditions.push(`${alias}.status = ${addParam(filter, statusObra.trim())}`);
  }

  const contratoId = url.searchParams.get('contrato_id');
  if (contratoId) {
    filter.conditions.push(`exists (
      select 1
      from contratos_obra filtro_contrato
      where filtro_contrato.obra_id = ${alias}.id
        and filtro_contrato.id = ${addParam(filter, assertUuid(contratoId, 'contrato_id'))}
    )`);
  }

  return filter;
};

const appendDateRange = (filter: SqlFilter, url: URL, column: string): string => {
  const conditions: string[] = [];
  const periodoDe = url.searchParams.get('periodo_de');
  if (periodoDe) {
    conditions.push(`${column} >= ${addParam(filter, assertDate(periodoDe, 'periodo_de'))}`);
  }
  const periodoAte = url.searchParams.get('periodo_ate');
  if (periodoAte) {
    conditions.push(`${column} <= ${addParam(filter, assertDate(periodoAte, 'periodo_ate'))}`);
  }
  return conditions.length > 0 ? ` and ${conditions.join(' and ')}` : '';
};

const appendCompetenciaRange = (filter: SqlFilter, url: URL, column: string): string => {
  const conditions: string[] = [];
  const periodoDe = url.searchParams.get('periodo_de');
  if (periodoDe) {
    conditions.push(`${column} >= ${addParam(filter, assertDate(periodoDe, 'periodo_de').slice(0, 7))}`);
  }
  const periodoAte = url.searchParams.get('periodo_ate');
  if (periodoAte) {
    conditions.push(`${column} <= ${addParam(filter, assertDate(periodoAte, 'periodo_ate').slice(0, 7))}`);
  }
  return conditions.length > 0 ? ` and ${conditions.join(' and ')}` : '';
};

const getObrasDashboard = async (url: URL): Promise<QueryResultRow[]> => {
  const filter = buildObraFilter(url);
  const pedidosPeriodo = appendDateRange(filter, url, 'pc.data_emissao');
  const notasPeriodo = appendDateRange(filter, url, 'nf.data_entrada');
  const contasPeriodo = appendDateRange(filter, url, 'cp.data_vencimento');
  const baixasPeriodo = appendDateRange(filter, url, 'cb.data_baixa');
  const medicoesPeriodo = appendCompetenciaRange(filter, url, "to_char(m.competencia, 'YYYY-MM')");
  const faturamentoPeriodo = appendDateRange(filter, url, 'coalesce(pf.faturado_manual_data, pf.data_solicitacao)');
  const pedidoFaturamentoPeriodo = appendDateRange(filter, url, 'pf.data_solicitacao');

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
        oo.valor_previsto_total,
        oo.aprovado_em
      from orcamentos_obra oo
      join obras_base ob on ob.obra_id = oo.obra_id
      where oo.status = 'APROVADO'
      order by oo.obra_id, oo.aprovado_em desc nulls last, oo.created_at desc
    ),
    orcamento_cronograma as (
      select oo.obra_id, count(oc.id)::int as quantidade_cronograma
      from orcamentos_obra oo
      join obras_base ob on ob.obra_id = oo.obra_id
      left join orcamentos_obra_cronograma oc on oc.orcamento_id = oo.id and oc.status = 'ATIVO'
      where oo.status = 'APROVADO'
      group by oo.obra_id
    ),
    contratos as (
      select
        co.obra_id,
        count(*) filter (where co.status = 'ATIVO')::int as contratos_ativos,
        count(*) filter (where co.status = 'ENCERRADO')::int as contratos_encerrados,
        count(*) filter (where co.status = 'SUSPENSO')::int as contratos_suspensos,
        coalesce(sum(co.valor_original) filter (where co.status in ('ATIVO', 'ENCERRADO', 'SUSPENSO')), 0)::numeric(14,2) as valor_contratado
      from contratos_obra co
      join obras_base ob on ob.obra_id = co.obra_id
      where co.status in ('ATIVO', 'ENCERRADO', 'SUSPENSO')
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
        ${pedidosPeriodo}
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
        ${notasPeriodo}
      group by nf.obra_id
    ),
    contas as (
      select
        cp.obra_id,
        coalesce(sum(cp.valor_original) filter (where cp.status <> 'CANCELADA'), 0)::numeric(14,2) as valor_contas_nao_canceladas,
        coalesce(sum(cp.valor_original) filter (where cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')), 0)::numeric(14,2) as valor_contas_realizadas,
        coalesce(sum(cp.valor_aberto) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL', 'PAGA') and cp.valor_aberto > 0), 0)::numeric(14,2) as contas_abertas_valor,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL', 'PAGA') and cp.valor_aberto > 0)::int as contas_abertas,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL', 'PAGA') and cp.valor_aberto > 0 and cp.data_vencimento < current_date)::int as contas_vencidas,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL', 'PAGA') and cp.valor_aberto > 0 and cp.data_vencimento between current_date and current_date + interval '30 days')::int as contas_a_vencer
      from contas_pagar cp
      join obras_base ob on ob.obra_id = cp.obra_id
      where 1 = 1
        ${contasPeriodo}
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
      where cb.acao = 'BAIXAR_MANUAL'
        and cb.resultado = 'PERMITIDO'
        ${baixasPeriodo}
      group by cp.obra_id
    ),
    medicoes as (
      select
        m.obra_id,
        coalesce(sum(m.valor_liquido_previsto) filter (where m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')), 0)::numeric(14,2) as receita_medida,
        count(*) filter (where m.status in ('SUBMETIDA', 'EM_ANALISE'))::int as medicoes_pendentes,
        count(*) filter (where m.status = 'APROVADA' and pf.id is null)::int as medicoes_aprovadas_sem_pedido
      from medicoes_obra m
      join obras_base ob on ob.obra_id = m.obra_id
      left join pedidos_faturamento pf on pf.medicao_id = m.id and pf.status <> 'CANCELADO'
      where 1 = 1
        ${medicoesPeriodo}
      group by m.obra_id
    ),
    faturamento as (
      select
        pf.obra_id,
        coalesce(sum(pf.valor_solicitado) filter (where pf.status = 'FATURADO_MANUALMENTE'), 0)::numeric(14,2) as receita_faturada_manual,
        coalesce(sum(pf.valor_solicitado) filter (where pf.status = 'APROVADO'), 0)::numeric(14,2) as faturamento_pendente,
        count(*) filter (where pf.status = 'APROVADO')::int as pedidos_faturamento_pendentes,
        count(*) filter (where pf.status = 'APROVADO' and pf.faturado_manual_data is null)::int as pedidos_aprovados_nao_faturados
      from pedidos_faturamento pf
      join obras_base ob on ob.obra_id = pf.obra_id
      where 1 = 1
        ${faturamentoPeriodo}
        ${pedidoFaturamentoPeriodo}
      group by pf.obra_id
    ),
    programacoes as (
      select
        pp.obra_id,
        count(*) filter (where pp.status = 'LIBERADA' and pp.liberacao_status = 'LIBERADA')::int as programacoes_liberadas,
        count(*) filter (where pp.conferencia_status = 'CONFERIDA')::int as programacoes_conferidas,
        count(*) filter (where pp.status in ('APROVADA', 'LIBERADA') and coalesce(pp.conferencia_status, 'PENDENTE_CONFERENCIA') <> 'CONFERIDA')::int as programacoes_pendentes,
        count(*) filter (where pp.status = 'LIBERADA' and pp.liberacao_status = 'LIBERADA' and coalesce(pp.conferencia_status, 'PENDENTE_CONFERENCIA') <> 'CONFERIDA')::int as programacoes_liberadas_nao_conferidas
      from programacoes_pagamento pp
      join obras_base ob on ob.obra_id = pp.obra_id
      group by pp.obra_id
    ),
    planejamento as (
      select
        pe.obra_id,
        count(*) filter (where pe.status in ('ATIVO', 'REVISADO') and pe.data_fim_prevista < current_date)::int as planejamentos_atrasados
      from planejamento_executivo pe
      join obras_base ob on ob.obra_id = pe.obra_id
      group by pe.obra_id
    ),
    base as (
      select
        ob.*,
        ov.orcamento_id,
        ov.orcamento_codigo,
        coalesce(ov.valor_previsto_total, 0)::numeric(14,2) as orcamento_previsto,
        coalesce(oc.quantidade_cronograma, 0) as quantidade_cronograma,
        coalesce(ct.contratos_ativos, 0) as contratos_ativos,
        coalesce(ct.contratos_encerrados, 0) as contratos_encerrados,
        coalesce(ct.contratos_suspensos, 0) as contratos_suspensos,
        coalesce(ct.valor_contratado, 0)::numeric(14,2) as valor_contratado,
        coalesce(ad.valor_aditado, 0)::numeric(14,2) as valor_aditado,
        coalesce(ad.quantidade_aditivos, 0) as quantidade_aditivos,
        (coalesce(ct.valor_contratado, 0) + coalesce(ad.valor_aditado, 0))::numeric(14,2) as valor_total_contratado,
        greatest(coalesce(pd.valor_pedidos_confirmados, 0), coalesce(cp.valor_contas_nao_canceladas, 0))::numeric(14,2) as custo_comprometido,
        greatest(coalesce(cp.valor_contas_realizadas, 0), coalesce(nf.valor_notas_aprovadas, 0))::numeric(14,2) as custo_realizado,
        coalesce(bx.valor_baixado_manual, 0)::numeric(14,2) as custo_baixado_manual,
        coalesce(md.receita_medida, 0)::numeric(14,2) as receita_medida,
        coalesce(ft.receita_faturada_manual, 0)::numeric(14,2) as receita_faturada_manual,
        coalesce(ft.faturamento_pendente, 0)::numeric(14,2) as faturamento_pendente,
        coalesce(cp.contas_abertas_valor, 0)::numeric(14,2) as contas_abertas_valor,
        coalesce(cp.contas_abertas, 0) as contas_abertas,
        coalesce(cp.contas_vencidas, 0) as contas_vencidas,
        coalesce(cp.contas_a_vencer, 0) as contas_a_vencer,
        coalesce(pg.programacoes_liberadas, 0) as programacoes_liberadas,
        coalesce(pg.programacoes_conferidas, 0) as programacoes_conferidas,
        coalesce(pg.programacoes_pendentes, 0) as programacoes_pendentes,
        coalesce(pg.programacoes_liberadas_nao_conferidas, 0) as programacoes_liberadas_nao_conferidas,
        coalesce(bx.quantidade_baixas, 0) as baixas_manuais,
        coalesce(md.medicoes_pendentes, 0) as medicoes_pendentes,
        coalesce(md.medicoes_aprovadas_sem_pedido, 0) as medicoes_aprovadas_sem_pedido,
        coalesce(ft.pedidos_faturamento_pendentes, 0) as pedidos_faturamento_pendentes,
        coalesce(ft.pedidos_aprovados_nao_faturados, 0) as pedidos_aprovados_nao_faturados,
        coalesce(pl.planejamentos_atrasados, 0) as planejamentos_atrasados
      from obras_base ob
      left join orcamento_vigente ov on ov.obra_id = ob.obra_id
      left join orcamento_cronograma oc on oc.obra_id = ob.obra_id
      left join contratos ct on ct.obra_id = ob.obra_id
      left join aditivos ad on ad.obra_id = ob.obra_id
      left join pedidos pd on pd.obra_id = ob.obra_id
      left join notas nf on nf.obra_id = ob.obra_id
      left join contas cp on cp.obra_id = ob.obra_id
      left join baixas bx on bx.obra_id = ob.obra_id
      left join medicoes md on md.obra_id = ob.obra_id
      left join faturamento ft on ft.obra_id = ob.obra_id
      left join programacoes pg on pg.obra_id = ob.obra_id
      left join planejamento pl on pl.obra_id = ob.obra_id
    )
    select
      *,
      (valor_total_contratado - orcamento_previsto)::numeric(14,2) as margem_prevista,
      ((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado)::numeric(14,2) as margem_realizada,
      (custo_realizado - orcamento_previsto)::numeric(14,2) as desvio_orcamento,
      case
        when orcamento_previsto > 0 then round(((custo_realizado - orcamento_previsto) / orcamento_previsto) * 100, 2)
        else null
      end as desvio_percentual,
      (valor_total_contratado - receita_faturada_manual)::numeric(14,2) as saldo_a_faturar,
      (orcamento_previsto - custo_realizado)::numeric(14,2) as saldo_orcamentario,
      (valor_total_contratado - receita_medida)::numeric(14,2) as saldo_contratual,
      (orcamento_id is null) as alerta_sem_orcamento_aprovado,
      (contratos_ativos = 0) as alerta_sem_contrato_ativo,
      (custo_realizado > orcamento_previsto and orcamento_previsto > 0) as alerta_custo_acima_previsto,
      (((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado) < 0) as alerta_margem_negativa,
      (contas_vencidas > 0) as alerta_contas_vencidas,
      (programacoes_liberadas_nao_conferidas > 0) as alerta_programacao_liberada_nao_conferida,
      (medicoes_aprovadas_sem_pedido > 0) as alerta_medicao_aprovada_sem_pedido,
      (pedidos_aprovados_nao_faturados > 0) as alerta_pedido_faturamento_aprovado_nao_faturado,
      (valor_total_contratado > 0 and (valor_total_contratado - receita_medida) <= valor_total_contratado * 0.1) as alerta_saldo_contratual_baixo,
      (orcamento_id is not null and quantidade_cronograma = 0) as alerta_orcamento_sem_cronograma,
      (planejamentos_atrasados > 0) as alerta_planejamento_atrasado
    from base
    order by obra_codigo asc, obra_nome asc
    `,
    filter.params
  );

  return result.rows;
};

const sumRows = (rows: QueryResultRow[], key: string): number =>
  Number(rows.reduce((acc, row) => acc + toNumber(row[key]), 0).toFixed(2));

const countRows = (rows: QueryResultRow[], key: string): number =>
  rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

const getResumo = async (url: URL): Promise<Record<string, unknown>> => {
  const rows = await getObrasDashboard(url);
  const kpis = {
    obras_ativas: rows.filter((row) => String(row.obra_status || '').toLowerCase() === 'ativo').length,
    obras_total: rows.length,
    contratos_ativos: countRows(rows, 'contratos_ativos'),
    contratos_encerrados: countRows(rows, 'contratos_encerrados'),
    contratos_suspensos: countRows(rows, 'contratos_suspensos'),
    valor_contratado: sumRows(rows, 'valor_contratado'),
    valor_aditado: sumRows(rows, 'valor_aditado'),
    valor_total_contratado: sumRows(rows, 'valor_total_contratado'),
    orcamento_previsto: sumRows(rows, 'orcamento_previsto'),
    custo_comprometido: sumRows(rows, 'custo_comprometido'),
    custo_realizado: sumRows(rows, 'custo_realizado'),
    receita_medida: sumRows(rows, 'receita_medida'),
    receita_faturada_manual: sumRows(rows, 'receita_faturada_manual'),
    margem_prevista: sumRows(rows, 'margem_prevista'),
    margem_realizada: sumRows(rows, 'margem_realizada'),
    contas_a_pagar_abertas: countRows(rows, 'contas_abertas'),
    contas_vencidas: countRows(rows, 'contas_vencidas'),
    contas_a_vencer: countRows(rows, 'contas_a_vencer'),
    programacoes_liberadas: countRows(rows, 'programacoes_liberadas'),
    programacoes_conferidas: countRows(rows, 'programacoes_conferidas'),
    programacoes_pendentes: countRows(rows, 'programacoes_pendentes'),
    baixas_manuais: countRows(rows, 'baixas_manuais'),
    medicoes_pendentes: countRows(rows, 'medicoes_pendentes'),
    pedidos_faturamento_pendentes: countRows(rows, 'pedidos_faturamento_pendentes')
  };

  return {
    kpis,
    alertas_resumo: {
      obras_sem_orcamento_aprovado: rows.filter((row) => row.alerta_sem_orcamento_aprovado).length,
      obras_sem_contrato_ativo: rows.filter((row) => row.alerta_sem_contrato_ativo).length,
      obras_custo_acima_previsto: rows.filter((row) => row.alerta_custo_acima_previsto).length,
      obras_margem_negativa: rows.filter((row) => row.alerta_margem_negativa).length,
      programacoes_liberadas_nao_conferidas: rows.filter((row) => row.alerta_programacao_liberada_nao_conferida).length,
      planejamentos_atrasados: rows.filter((row) => row.alerta_planejamento_atrasado).length
    },
    formulas: {
      valor_total_contratado: 'contrato original + aditivos aprovados',
      margem_prevista: 'valor_total_contratado - orcamento_previsto',
      margem_realizada: '(receita_faturada_manual quando existir, senao receita_medida) - custo_realizado',
      desvio_orcamento: 'custo_realizado - orcamento_previsto',
      saldo_a_faturar: 'valor_total_contratado - receita_faturada_manual',
      saldo_orcamentario: 'orcamento_previsto - custo_realizado'
    }
  };
};

const topRows = (rows: QueryResultRow[], key: string, direction: 'asc' | 'desc' = 'desc'): QueryResultRow[] =>
  [...rows]
    .sort((a, b) => direction === 'desc' ? toNumber(b[key]) - toNumber(a[key]) : toNumber(a[key]) - toNumber(b[key]))
    .slice(0, 10);

const getRankingObras = async (url: URL): Promise<Record<string, unknown>> => {
  const rows = await getObrasDashboard(url);
  return {
    maior_faturamento: topRows(rows, 'receita_faturada_manual'),
    maior_custo_realizado: topRows(rows, 'custo_realizado'),
    maior_desvio_orcamento: topRows(rows, 'desvio_orcamento'),
    menor_margem: topRows(rows, 'margem_realizada', 'asc'),
    maior_saldo_a_faturar: topRows(rows, 'saldo_a_faturar'),
    maiores_contas_em_aberto: topRows(rows, 'contas_abertas_valor')
  };
};

const severityRank: Record<string, number> = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAIXO: 3 };

const getAlertas = async (url: URL): Promise<QueryResultRow[]> => {
  const rows = await getObrasDashboard(url);
  const alertas: QueryResultRow[] = [];

  const add = (row: QueryResultRow, tipo: string, severidade: string, mensagem: string, valor?: unknown): void => {
    alertas.push({
      tipo,
      severidade,
      obra_id: row.obra_id,
      obra_codigo: row.obra_codigo,
      obra_nome: row.obra_nome,
      cliente_nome: row.cliente_nome,
      valor: valor ?? null,
      mensagem
    });
  };

  rows.forEach((row) => {
    if (row.alerta_sem_orcamento_aprovado) add(row, 'OBRA_SEM_ORCAMENTO_APROVADO', 'ALTO', 'Obra sem orcamento aprovado.');
    if (row.alerta_sem_contrato_ativo) add(row, 'OBRA_SEM_CONTRATO_ATIVO', 'ALTO', 'Obra sem contrato ativo.');
    if (row.alerta_custo_acima_previsto) add(row, 'CUSTO_ACIMA_PREVISTO', 'CRITICO', 'Custo realizado acima do orcamento previsto.', row.desvio_orcamento);
    if (row.alerta_margem_negativa) add(row, 'MARGEM_NEGATIVA', 'CRITICO', 'Margem realizada negativa.', row.margem_realizada);
    if (row.alerta_contas_vencidas) add(row, 'CONTAS_VENCIDAS', 'ALTO', 'Obra possui contas vencidas.', row.contas_vencidas);
    if (row.alerta_programacao_liberada_nao_conferida) add(row, 'PROGRAMACAO_LIBERADA_NAO_CONFERIDA', 'MEDIO', 'Programacao liberada ainda nao conferida.', row.programacoes_liberadas_nao_conferidas);
    if (row.alerta_medicao_aprovada_sem_pedido) add(row, 'MEDICAO_APROVADA_SEM_PEDIDO_FATURAMENTO', 'MEDIO', 'Medicao aprovada sem pedido de faturamento.', row.medicoes_aprovadas_sem_pedido);
    if (row.alerta_pedido_faturamento_aprovado_nao_faturado) add(row, 'PEDIDO_FATURAMENTO_APROVADO_NAO_FATURADO', 'MEDIO', 'Pedido de faturamento aprovado nao marcado como faturado manualmente.', row.pedidos_aprovados_nao_faturados);
    if (row.alerta_saldo_contratual_baixo) add(row, 'SALDO_CONTRATUAL_BAIXO', 'MEDIO', 'Contrato com saldo contratual baixo.', row.saldo_contratual);
    if (row.alerta_orcamento_sem_cronograma) add(row, 'ORCAMENTO_SEM_CRONOGRAMA', 'MEDIO', 'Orcamento aprovado sem cronograma ativo.');
    if (row.alerta_planejamento_atrasado) add(row, 'PLANEJAMENTO_EXECUTIVO_ATRASADO', 'ALTO', 'Planejamento executivo atrasado.', row.planejamentos_atrasados);
  });

  return alertas.sort((a, b) => (severityRank[String(a.severidade)] ?? 9) - (severityRank[String(b.severidade)] ?? 9));
};

const getTendenciaMensal = async (url: URL): Promise<QueryResultRow[]> => {
  const filter = buildObraFilter(url);
  const cronogramaPeriodo = appendCompetenciaRange(filter, url, 'oc.competencia');
  const medicoesPeriodo = appendCompetenciaRange(filter, url, "to_char(m.competencia, 'YYYY-MM')");
  const contasPeriodo = appendDateRange(filter, url, 'cp.data_vencimento');
  const notasPeriodo = appendDateRange(filter, url, 'nf.data_entrada');
  const faturamentoPeriodo = appendDateRange(filter, url, 'coalesce(pf.faturado_manual_data, pf.data_solicitacao)');

  const result = await getPool().query<QueryResultRow>(
    `
    with obras_base as (
      select o.id as obra_id
      from obras o
      where ${filter.conditions.join(' and ')}
    ),
    orcamentos as (
      select distinct on (oo.obra_id) oo.id, oo.obra_id
      from orcamentos_obra oo
      join obras_base ob on ob.obra_id = oo.obra_id
      where oo.status = 'APROVADO'
      order by oo.obra_id, oo.aprovado_em desc nulls last, oo.created_at desc
    ),
    previsto as (
      select oc.competencia, coalesce(sum(oc.valor_previsto), 0)::numeric(14,2) as faturamento_previsto
      from orcamentos_obra_cronograma oc
      join orcamentos oo on oo.id = oc.orcamento_id
      where oc.status = 'ATIVO'
        ${cronogramaPeriodo}
      group by oc.competencia
    ),
    medicoes as (
      select to_char(m.competencia, 'YYYY-MM') as competencia, coalesce(sum(m.valor_liquido_previsto), 0)::numeric(14,2) as receita_medida
      from medicoes_obra m
      join obras_base ob on ob.obra_id = m.obra_id
      where m.status in ('APROVADA', 'FATURAMENTO_SOLICITADO', 'FATURADO_MANUALMENTE')
        ${medicoesPeriodo}
      group by to_char(m.competencia, 'YYYY-MM')
    ),
    faturado as (
      select to_char(coalesce(pf.faturado_manual_data, pf.data_solicitacao), 'YYYY-MM') as competencia,
             coalesce(sum(pf.valor_solicitado), 0)::numeric(14,2) as receita_faturada_manual
      from pedidos_faturamento pf
      join obras_base ob on ob.obra_id = pf.obra_id
      where pf.status = 'FATURADO_MANUALMENTE'
        ${faturamentoPeriodo}
      group by to_char(coalesce(pf.faturado_manual_data, pf.data_solicitacao), 'YYYY-MM')
    ),
    contas as (
      select to_char(cp.data_vencimento, 'YYYY-MM') as competencia,
             coalesce(sum(cp.valor_original), 0)::numeric(14,2) as custo_contas
      from contas_pagar cp
      join obras_base ob on ob.obra_id = cp.obra_id
      where cp.status in ('APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'BAIXADA_MANUAL', 'PAGA')
        ${contasPeriodo}
      group by to_char(cp.data_vencimento, 'YYYY-MM')
    ),
    notas as (
      select to_char(nf.data_entrada, 'YYYY-MM') as competencia,
             coalesce(sum(nf.valor_total), 0)::numeric(14,2) as custo_notas
      from notas_fiscais_entrada nf
      join obras_base ob on ob.obra_id = nf.obra_id
      where nf.status in ('APROVADA', 'PROVISIONADA')
        ${notasPeriodo}
      group by to_char(nf.data_entrada, 'YYYY-MM')
    ),
    competencias as (
      select competencia from previsto
      union select competencia from medicoes
      union select competencia from faturado
      union select competencia from contas
      union select competencia from notas
    ),
    linhas as (
      select
        c.competencia,
        coalesce(p.faturamento_previsto, 0)::numeric(14,2) as faturamento_previsto,
        coalesce(m.receita_medida, 0)::numeric(14,2) as receita_medida,
        coalesce(f.receita_faturada_manual, 0)::numeric(14,2) as receita_faturada_manual,
        greatest(coalesce(ct.custo_contas, 0), coalesce(nt.custo_notas, 0))::numeric(14,2) as custo_realizado
      from competencias c
      left join previsto p on p.competencia = c.competencia
      left join medicoes m on m.competencia = c.competencia
      left join faturado f on f.competencia = c.competencia
      left join contas ct on ct.competencia = c.competencia
      left join notas nt on nt.competencia = c.competencia
    )
    select
      competencia,
      faturamento_previsto,
      receita_medida,
      receita_faturada_manual,
      custo_realizado,
      ((case when receita_faturada_manual > 0 then receita_faturada_manual else receita_medida end) - custo_realizado)::numeric(14,2) as margem_mensal,
      sum(faturamento_previsto) over (order by competencia)::numeric(14,2) as acumulado_previsto,
      sum(receita_faturada_manual) over (order by competencia)::numeric(14,2) as acumulado_faturado,
      sum(custo_realizado) over (order by competencia)::numeric(14,2) as acumulado_custo
    from linhas
    order by competencia asc
    `,
    filter.params
  );

  return result.rows;
};

const getFinanceiro = async (url: URL): Promise<Record<string, unknown>> => {
  const rows = await getObrasDashboard(url);
  return {
    totais: {
      contas_abertas: countRows(rows, 'contas_abertas'),
      contas_abertas_valor: sumRows(rows, 'contas_abertas_valor'),
      contas_vencidas: countRows(rows, 'contas_vencidas'),
      contas_a_vencer: countRows(rows, 'contas_a_vencer'),
      programacoes_liberadas: countRows(rows, 'programacoes_liberadas'),
      programacoes_conferidas: countRows(rows, 'programacoes_conferidas'),
      programacoes_pendentes: countRows(rows, 'programacoes_pendentes'),
      baixas_manuais: countRows(rows, 'baixas_manuais'),
      custo_baixado_manual: sumRows(rows, 'custo_baixado_manual')
    },
    por_obra: topRows(rows, 'contas_abertas_valor')
  };
};

const getFaturamento = async (url: URL): Promise<Record<string, unknown>> => {
  const rows = await getObrasDashboard(url);
  return {
    totais: {
      receita_medida: sumRows(rows, 'receita_medida'),
      receita_faturada_manual: sumRows(rows, 'receita_faturada_manual'),
      faturamento_pendente: sumRows(rows, 'faturamento_pendente'),
      pedidos_faturamento_pendentes: countRows(rows, 'pedidos_faturamento_pendentes'),
      saldo_a_faturar: sumRows(rows, 'saldo_a_faturar')
    },
    maiores_saldos_a_faturar: topRows(rows, 'saldo_a_faturar'),
    maiores_faturamentos: topRows(rows, 'receita_faturada_manual')
  };
};

const getOperationalStatusCounts = async (tableName: string): Promise<QueryResultRow[]> => {
  const result = await getPool().query<QueryResultRow>(
    `select status, count(*)::int as quantidade from ${tableName} group by status order by status asc`
  );
  return result.rows;
};

const getOperacional = async (url: URL): Promise<Record<string, unknown>> => {
  const rows = await getObrasDashboard(url);
  const [solicitacoes, cotacoes, pedidos, notas] = await Promise.all([
    getOperationalStatusCounts('solicitacoes_compra'),
    getOperationalStatusCounts('cotacoes'),
    getOperationalStatusCounts('pedidos_compra'),
    getOperationalStatusCounts('notas_fiscais_entrada')
  ]);

  return {
    totais: {
      obras_total: rows.length,
      obras_ativas: rows.filter((row) => String(row.obra_status || '').toLowerCase() === 'ativo').length,
      medicoes_pendentes: countRows(rows, 'medicoes_pendentes'),
      medicoes_aprovadas_sem_pedido: countRows(rows, 'medicoes_aprovadas_sem_pedido'),
      pedidos_faturamento_pendentes: countRows(rows, 'pedidos_faturamento_pendentes'),
      planejamentos_atrasados: countRows(rows, 'planejamentos_atrasados'),
      orcamentos_sem_cronograma: rows.filter((row) => row.alerta_orcamento_sem_cronograma).length
    },
    status_solicitacoes: solicitacoes,
    status_cotacoes: cotacoes,
    status_pedidos_compra: pedidos,
    status_notas_fiscais_entrada: notas
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
    sendError(res, 400, 'invalid_filter', 'Filtro invalido para dashboard executivo.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleDashboardExecutivo = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/dashboard-executivo';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 1 && parts[0] === 'resumo') {
      sendJson(res, 200, { data: await getResumo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'obras') {
      sendJson(res, 200, { data: await getObrasDashboard(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'alertas') {
      sendJson(res, 200, { data: await getAlertas(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'tendencia-mensal') {
      sendJson(res, 200, { data: await getTendenciaMensal(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'ranking-obras') {
      sendJson(res, 200, { data: await getRankingObras(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'financeiro') {
      sendJson(res, 200, { data: await getFinanceiro(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'faturamento') {
      sendJson(res, 200, { data: await getFaturamento(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'operacional') {
      sendJson(res, 200, { data: await getOperacional(url) });
      return;
    }

    sendError(res, 404, 'not_found', 'Dashboard executivo nao encontrado.');
  } catch (error) {
    handleError(res, error);
  }
};
