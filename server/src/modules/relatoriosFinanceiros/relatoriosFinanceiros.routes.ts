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

const assertNumber = (value: string, fieldName: string): number => {
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized)) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser numerico.`);
  }
  return Number(normalized.toFixed(2));
};

const buildContaFilter = (url: URL, alias = 'cp'): SqlFilter => {
  const filter: SqlFilter = {
    conditions: [`${alias}.nota_entrada_id is not null`],
    params: []
  };

  const status = url.searchParams.get('status');
  if (status) {
    filter.conditions.push(`${alias}.status = ${addParam(filter, status.trim().toUpperCase())}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    filter.conditions.push(`${alias}.fornecedor_id = ${addParam(filter, assertUuid(fornecedorId, 'fornecedor_id'))}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    filter.conditions.push(`${alias}.obra_id = ${addParam(filter, assertUuid(obraId, 'obra_id'))}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    filter.conditions.push(`${alias}.centro_custo_id = ${addParam(filter, assertUuid(centroCustoId, 'centro_custo_id'))}`);
  }

  const periodoDe = url.searchParams.get('periodo_de');
  if (periodoDe) {
    filter.conditions.push(`${alias}.data_vencimento >= ${addParam(filter, assertDate(periodoDe, 'periodo_de'))}`);
  }

  const periodoAte = url.searchParams.get('periodo_ate');
  if (periodoAte) {
    filter.conditions.push(`${alias}.data_vencimento <= ${addParam(filter, assertDate(periodoAte, 'periodo_ate'))}`);
  }

  const vencimentoDe = url.searchParams.get('vencimento_de');
  if (vencimentoDe) {
    filter.conditions.push(`${alias}.data_vencimento >= ${addParam(filter, assertDate(vencimentoDe, 'vencimento_de'))}`);
  }

  const vencimentoAte = url.searchParams.get('vencimento_ate');
  if (vencimentoAte) {
    filter.conditions.push(`${alias}.data_vencimento <= ${addParam(filter, assertDate(vencimentoAte, 'vencimento_ate'))}`);
  }

  const valorMin = url.searchParams.get('valor_min');
  if (valorMin) {
    filter.conditions.push(`${alias}.valor_original >= ${addParam(filter, assertNumber(valorMin, 'valor_min'))}`);
  }

  const valorMax = url.searchParams.get('valor_max');
  if (valorMax) {
    filter.conditions.push(`${alias}.valor_original <= ${addParam(filter, assertNumber(valorMax, 'valor_max'))}`);
  }

  return filter;
};

const buildProgramacaoFilter = (url: URL, alias = 'pp'): SqlFilter => {
  const filter: SqlFilter = { conditions: ['1 = 1'], params: [] };

  const status = url.searchParams.get('status');
  if (status) {
    filter.conditions.push(`${alias}.status = ${addParam(filter, status.trim().toUpperCase())}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    filter.conditions.push(`${alias}.fornecedor_id = ${addParam(filter, assertUuid(fornecedorId, 'fornecedor_id'))}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    filter.conditions.push(`${alias}.obra_id = ${addParam(filter, assertUuid(obraId, 'obra_id'))}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    filter.conditions.push(`${alias}.centro_custo_id = ${addParam(filter, assertUuid(centroCustoId, 'centro_custo_id'))}`);
  }

  const periodoDe = url.searchParams.get('periodo_de');
  if (periodoDe) {
    filter.conditions.push(`${alias}.data_prevista >= ${addParam(filter, assertDate(periodoDe, 'periodo_de'))}`);
  }

  const periodoAte = url.searchParams.get('periodo_ate');
  if (periodoAte) {
    filter.conditions.push(`${alias}.data_prevista <= ${addParam(filter, assertDate(periodoAte, 'periodo_ate'))}`);
  }

  const valorMin = url.searchParams.get('valor_min');
  if (valorMin) {
    filter.conditions.push(`${alias}.valor_total >= ${addParam(filter, assertNumber(valorMin, 'valor_min'))}`);
  }

  const valorMax = url.searchParams.get('valor_max');
  if (valorMax) {
    filter.conditions.push(`${alias}.valor_total <= ${addParam(filter, assertNumber(valorMax, 'valor_max'))}`);
  }

  return filter;
};

const getContaResumo = async (url: URL): Promise<Record<string, unknown>> => {
  const filter = buildContaFilter(url);
  const where = `where ${filter.conditions.join(' and ')}`;
  const pool = getPool();

  const [totais, porStatus, porVencimento, baixasPorPeriodo] = await Promise.all([
    pool.query<QueryResultRow>(
      `
      select
        count(*)::int as quantidade_contas,
        coalesce(sum(cp.valor_original), 0)::numeric(14,2) as total_original,
        coalesce(sum(cp.valor_original) filter (where cp.status = 'PROVISIONADA'), 0)::numeric(14,2) as total_provisionado,
        coalesce(sum(cp.valor_original) filter (where cp.status = 'APROVADA'), 0)::numeric(14,2) as total_aprovado,
        coalesce(sum(cp.valor_original) filter (where programacao_ativa.programacao_id is not null), 0)::numeric(14,2) as total_programado,
        coalesce(sum(cp.valor_original) filter (where programacao_ativa.status = 'LIBERADA' and programacao_ativa.liberacao_status = 'LIBERADA'), 0)::numeric(14,2) as total_liberado,
        coalesce(sum(cp.valor_original) filter (where programacao_ativa.conferencia_status = 'CONFERIDA'), 0)::numeric(14,2) as total_conferido,
        coalesce(sum(cp.baixa_manual_valor) filter (where cp.baixa_status = 'BAIXADA_MANUAL'), 0)::numeric(14,2) as total_baixado_manual,
        coalesce(sum(cp.valor_aberto) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL')), 0)::numeric(14,2) as saldo_aberto,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL') and cp.valor_aberto > 0 and cp.data_vencimento < current_date)::int as contas_vencidas,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL') and cp.valor_aberto > 0 and cp.data_vencimento between current_date and current_date + interval '7 days')::int as contas_a_vencer_7,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL') and cp.valor_aberto > 0 and cp.data_vencimento between current_date and current_date + interval '15 days')::int as contas_a_vencer_15,
        count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL') and cp.valor_aberto > 0 and cp.data_vencimento between current_date and current_date + interval '30 days')::int as contas_a_vencer_30
      from contas_pagar cp
      left join lateral (
        select pp.id as programacao_id, pp.status, pp.liberacao_status, pp.conferencia_status
        from programacoes_pagamento_itens ppi
        join programacoes_pagamento pp on pp.id = ppi.programacao_id
        where ppi.conta_pagar_id = cp.id and ppi.status = 'ATIVA'
        order by ppi.created_at desc
        limit 1
      ) programacao_ativa on true
      ${where}
      `,
      filter.params
    ),
    pool.query<QueryResultRow>(
      `
      select
        cp.status,
        count(*)::int as quantidade,
        coalesce(sum(cp.valor_original), 0)::numeric(14,2) as total_original,
        coalesce(sum(cp.valor_aberto), 0)::numeric(14,2) as saldo_aberto,
        coalesce(sum(cp.baixa_manual_valor) filter (where cp.baixa_status = 'BAIXADA_MANUAL'), 0)::numeric(14,2) as total_baixado_manual
      from contas_pagar cp
      ${where}
      group by cp.status
      order by cp.status
      `,
      filter.params
    ),
    pool.query<QueryResultRow>(
      `
      select
        cp.id,
        cp.numero_documento,
        cp.status,
        cp.data_vencimento,
        cp.valor_original,
        cp.valor_aberto,
        f.nome as fornecedor_nome,
        o.codigo as obra_codigo,
        cc.codigo as centro_custo_codigo,
        (cp.data_vencimento < current_date and cp.valor_aberto > 0 and cp.status not in ('CANCELADA', 'BAIXADA_MANUAL')) as vencida
      from contas_pagar cp
      join fornecedores f on f.id = cp.fornecedor_id
      left join obras o on o.id = cp.obra_id
      left join centros_custo cc on cc.id = cp.centro_custo_id
      ${where}
      order by cp.data_vencimento asc, cp.created_at desc
      limit 100
      `,
      filter.params
    ),
    pool.query<QueryResultRow>(
      `
      select
        cb.data_baixa,
        count(*)::int as quantidade,
        coalesce(sum(cb.valor_baixado), 0)::numeric(14,2) as total_baixado
      from contas_pagar_baixas cb
      join contas_pagar cp on cp.id = cb.conta_pagar_id
      ${where}
        and cb.acao = 'BAIXAR_MANUAL'
        and cb.resultado = 'PERMITIDO'
      group by cb.data_baixa
      order by cb.data_baixa desc
      limit 60
      `,
      filter.params
    )
  ]);

  return {
    totais: totais.rows[0],
    por_status: porStatus.rows,
    por_vencimento: porVencimento.rows,
    baixas_manuais_por_periodo: baixasPorPeriodo.rows
  };
};

const getAging = async (url: URL): Promise<QueryResultRow[]> => {
  const filter = buildContaFilter(url);
  filter.conditions.push(`cp.status not in ('CANCELADA', 'BAIXADA_MANUAL')`);
  filter.conditions.push('cp.valor_aberto > 0');
  const result = await getPool().query<QueryResultRow>(
    `
    select
      bucket,
      count(*)::int as quantidade,
      coalesce(sum(valor_aberto), 0)::numeric(14,2) as saldo_aberto
    from (
      select
        cp.valor_aberto,
        case
          when cp.data_vencimento < current_date - interval '90 days' then 'VENCIDO_90_MAIS'
          when cp.data_vencimento < current_date - interval '60 days' then 'VENCIDO_61_90'
          when cp.data_vencimento < current_date - interval '30 days' then 'VENCIDO_31_60'
          when cp.data_vencimento < current_date - interval '15 days' then 'VENCIDO_16_30'
          when cp.data_vencimento < current_date then 'VENCIDO_1_15'
          when cp.data_vencimento = current_date then 'VENCE_HOJE'
          when cp.data_vencimento <= current_date + interval '7 days' then 'A_VENCER_1_7'
          when cp.data_vencimento <= current_date + interval '15 days' then 'A_VENCER_8_15'
          when cp.data_vencimento <= current_date + interval '30 days' then 'A_VENCER_16_30'
          else 'A_VENCER_31_MAIS'
        end as bucket,
        case
          when cp.data_vencimento < current_date - interval '90 days' then 1
          when cp.data_vencimento < current_date - interval '60 days' then 2
          when cp.data_vencimento < current_date - interval '30 days' then 3
          when cp.data_vencimento < current_date - interval '15 days' then 4
          when cp.data_vencimento < current_date then 5
          when cp.data_vencimento = current_date then 6
          when cp.data_vencimento <= current_date + interval '7 days' then 7
          when cp.data_vencimento <= current_date + interval '15 days' then 8
          when cp.data_vencimento <= current_date + interval '30 days' then 9
          else 10
        end as ordem
      from contas_pagar cp
      where ${filter.conditions.join(' and ')}
    ) aging
    group by bucket, ordem
    order by ordem
    `,
    filter.params
  );
  return result.rows;
};

const getContaAgrupada = async (url: URL, group: 'fornecedor' | 'obra' | 'centro-custo'): Promise<QueryResultRow[]> => {
  const filter = buildContaFilter(url);
  const config = {
    fornecedor: {
      join: 'join fornecedores grp on grp.id = cp.fornecedor_id',
      id: 'grp.id',
      codigo: 'null::text',
      nome: 'grp.nome'
    },
    obra: {
      join: 'left join obras grp on grp.id = cp.obra_id',
      id: 'grp.id',
      codigo: 'grp.codigo',
      nome: "coalesce(grp.nome, 'Sem obra')"
    },
    'centro-custo': {
      join: 'left join centros_custo grp on grp.id = cp.centro_custo_id',
      id: 'grp.id',
      codigo: 'grp.codigo',
      nome: "coalesce(grp.nome, 'Sem centro de custo')"
    }
  }[group];

  const result = await getPool().query<QueryResultRow>(
    `
    select
      ${config.id} as id,
      ${config.codigo} as codigo,
      ${config.nome} as nome,
      count(*)::int as quantidade,
      coalesce(sum(cp.valor_original), 0)::numeric(14,2) as total_original,
      coalesce(sum(cp.valor_aberto), 0)::numeric(14,2) as saldo_aberto,
      coalesce(sum(cp.baixa_manual_valor) filter (where cp.baixa_status = 'BAIXADA_MANUAL'), 0)::numeric(14,2) as total_baixado_manual,
      count(*) filter (where cp.status not in ('CANCELADA', 'BAIXADA_MANUAL') and cp.valor_aberto > 0 and cp.data_vencimento < current_date)::int as vencidas
    from contas_pagar cp
    ${config.join}
    where ${filter.conditions.join(' and ')}
    group by ${config.id}, ${config.codigo}, ${config.nome}
    order by saldo_aberto desc, nome asc
    limit 100
    `,
    filter.params
  );
  return result.rows;
};

const getProgramacoesResumo = async (url: URL): Promise<Record<string, unknown>> => {
  const filter = buildProgramacaoFilter(url);
  const where = `where ${filter.conditions.join(' and ')}`;
  const pool = getPool();

  const [totais, porStatus, programacoes] = await Promise.all([
    pool.query<QueryResultRow>(
      `
      select
        count(*)::int as quantidade_programacoes,
        coalesce(sum(valor_total), 0)::numeric(14,2) as total_programado,
        coalesce(sum(valor_total) filter (where status = 'LIBERADA' and liberacao_status = 'LIBERADA'), 0)::numeric(14,2) as total_liberado,
        coalesce(sum(valor_total) filter (where conferencia_status = 'CONFERIDA'), 0)::numeric(14,2) as total_conferido,
        count(*) filter (where status = 'LIBERADA')::int as programacoes_liberadas,
        count(*) filter (where conferencia_status = 'CONFERIDA')::int as programacoes_conferidas
      from programacoes_pagamento pp
      ${where}
      `,
      filter.params
    ),
    pool.query<QueryResultRow>(
      `
      select
        pp.status,
        pp.liberacao_status,
        pp.conferencia_status,
        count(*)::int as quantidade,
        coalesce(sum(pp.valor_total), 0)::numeric(14,2) as total
      from programacoes_pagamento pp
      ${where}
      group by pp.status, pp.liberacao_status, pp.conferencia_status
      order by pp.status, pp.liberacao_status, pp.conferencia_status
      `,
      filter.params
    ),
    pool.query<QueryResultRow>(
      `
      select
        pp.id,
        pp.codigo,
        pp.status,
        pp.liberacao_status,
        pp.conferencia_status,
        pp.data_prevista,
        pp.valor_total,
        pp.quantidade_contas,
        f.nome as fornecedor_nome,
        o.codigo as obra_codigo,
        cc.codigo as centro_custo_codigo
      from programacoes_pagamento pp
      left join fornecedores f on f.id = pp.fornecedor_id
      left join obras o on o.id = pp.obra_id
      left join centros_custo cc on cc.id = pp.centro_custo_id
      ${where}
      order by pp.data_prevista asc, pp.created_at desc
      limit 100
      `,
      filter.params
    )
  ]);

  return {
    totais: totais.rows[0],
    por_status: porStatus.rows,
    programacoes: programacoes.rows
  };
};

const getFluxoPrevisto = async (url: URL): Promise<QueryResultRow[]> => {
  const filter = buildContaFilter(url);
  filter.conditions.push(`cp.status not in ('CANCELADA', 'BAIXADA_MANUAL')`);
  filter.conditions.push('cp.valor_aberto > 0');
  const result = await getPool().query<QueryResultRow>(
    `
    select
      cp.data_vencimento as data_prevista,
      count(*)::int as quantidade_contas,
      coalesce(sum(cp.valor_aberto), 0)::numeric(14,2) as saida_prevista,
      coalesce(sum(cp.valor_aberto) filter (where programacao_ativa.programacao_id is not null), 0)::numeric(14,2) as valor_programado,
      coalesce(sum(cp.valor_aberto) filter (where programacao_ativa.status = 'LIBERADA' and programacao_ativa.liberacao_status = 'LIBERADA'), 0)::numeric(14,2) as valor_liberado,
      coalesce(sum(cp.valor_aberto) filter (where programacao_ativa.conferencia_status = 'CONFERIDA'), 0)::numeric(14,2) as valor_conferido
    from contas_pagar cp
    left join lateral (
      select pp.id as programacao_id, pp.status, pp.liberacao_status, pp.conferencia_status
      from programacoes_pagamento_itens ppi
      join programacoes_pagamento pp on pp.id = ppi.programacao_id
      where ppi.conta_pagar_id = cp.id and ppi.status = 'ATIVA'
      order by ppi.created_at desc
      limit 1
    ) programacao_ativa on true
    where ${filter.conditions.join(' and ')}
    group by cp.data_vencimento
    order by cp.data_vencimento asc
    limit 120
    `,
    filter.params
  );
  return result.rows;
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
    sendError(res, 400, 'invalid_filter', 'Filtro invalido para relatorio financeiro.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleRelatoriosFinanceiros = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/relatorios-financeiros';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 2 && parts[0] === 'contas-pagar' && parts[1] === 'resumo') {
      sendJson(res, 200, { data: await getContaResumo(url) });
      return;
    }

    if (parts.length === 2 && parts[0] === 'contas-pagar' && parts[1] === 'aging') {
      sendJson(res, 200, { data: await getAging(url) });
      return;
    }

    if (parts.length === 2 && parts[0] === 'contas-pagar' && parts[1] === 'por-fornecedor') {
      sendJson(res, 200, { data: await getContaAgrupada(url, 'fornecedor') });
      return;
    }

    if (parts.length === 2 && parts[0] === 'contas-pagar' && parts[1] === 'por-obra') {
      sendJson(res, 200, { data: await getContaAgrupada(url, 'obra') });
      return;
    }

    if (parts.length === 2 && parts[0] === 'contas-pagar' && parts[1] === 'por-centro-custo') {
      sendJson(res, 200, { data: await getContaAgrupada(url, 'centro-custo') });
      return;
    }

    if (parts.length === 2 && parts[0] === 'programacoes' && parts[1] === 'resumo') {
      sendJson(res, 200, { data: await getProgramacoesResumo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'fluxo-previsto') {
      sendJson(res, 200, { data: await getFluxoPrevisto(url) });
      return;
    }

    sendError(res, 404, 'not_found', 'Relatorio financeiro nao encontrado.');
  } catch (error) {
    handleError(res, error);
  }
};
