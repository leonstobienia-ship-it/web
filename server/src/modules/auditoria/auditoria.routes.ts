import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, sendError, sendJson } from '../../http.js';
import { assertUuid } from '../aprovacoes/aprovacoes.service.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const safeTextPattern = /^[a-zA-Z0-9_.:/ -]{1,120}$/;

const moduleExpression = `
  coalesce(
    nullif(ae.payload->>'modulo', ''),
    nullif(ae.payload->>'module', ''),
    case
      when ae.entidade in ('solicitacao_compra') then 'solicitacoes-compra'
      when ae.entidade in ('cotacao') then 'cotacoes'
      when ae.entidade in ('pedido_compra') then 'pedidos-compra'
      when ae.entidade in ('nota_fiscal_entrada') then 'notas-entrada'
      when ae.entidade in ('conta_pagar') then 'contas-pagar'
      when ae.entidade in ('programacao_pagamento') then 'programacoes-pagamento'
      when ae.entidade in ('contrato_obra', 'contrato_obra_item', 'contrato_obra_aditivo') then 'contratos-obra'
      when ae.entidade in ('orcamento_obra', 'orcamento_obra_pacote', 'orcamento_obra_item', 'orcamento_obra_cronograma', 'planejamento_executivo') then 'orcamentos-planejamento'
      when ae.entidade in ('medicao_obra', 'pedido_faturamento') then 'medicoes-faturamento'
      when ae.entidade in ('risco_pendencia') then 'riscos-pendencias'
      when ae.entidade in ('central_tarefa_manual') then 'central-tarefas'
      when ae.entidade in ('perfil', 'escopo', 'alcada', 'usuario', 'usuario_perfil') then 'administracao'
      else ae.entidade
    end
  )
`;

const resultExpression = `
  case
    when lower(ae.acao) like '%bloquear%' or upper(coalesce(ae.payload->>'decisao', '')) = 'NEGADO' then 'BLOQUEADO'
    when lower(ae.acao) like '%reprovar%' then 'REPROVADO'
    when lower(ae.acao) like '%cancelar%' then 'CANCELADO'
    when lower(ae.acao) like '%devolver%' then 'DEVOLVIDO'
    when lower(ae.acao) like '%aprovar%' then 'APROVADO'
    when lower(ae.acao) like '%liberar%' then 'LIBERADO'
    when lower(ae.acao) like '%conferir%' then 'CONFERIDO'
    when lower(ae.acao) like '%baixar_manual%' then 'BAIXA_MANUAL'
    when lower(ae.acao) like '%estornar_baixa%' then 'ESTORNO_BAIXA'
    else coalesce(nullif(upper(ae.payload->>'resultado'), ''), nullif(upper(ae.payload->>'decisao'), ''), 'REGISTRADO')
  end
`;

const severityExpression = `
  case
    when lower(ae.acao) like '%bloquear%'
      or upper(coalesce(ae.payload->>'decisao', '')) = 'NEGADO'
      or ae.payload::text ilike '%BLOQUEADO_ALCADA%'
      then 'CRITICA'
    when lower(ae.acao) like '%reprovar%'
      or lower(ae.acao) like '%cancelar%'
      or lower(ae.acao) like '%estornar_baixa%'
      or lower(ae.acao) like '%baixar_manual%'
      then 'ALTA'
    when lower(ae.acao) like '%aprovar%'
      or lower(ae.acao) like '%liberar%'
      or lower(ae.acao) like '%conferir%'
      or lower(ae.acao) like '%submeter%'
      then 'MEDIA'
    else 'INFO'
  end
`;

const auditEventsCte = `
with auditoria_normalizada as (
  select
    ae.id,
    ae.company_id,
    e.nome_fantasia as empresa_nome,
    ae.entidade,
    ae.entidade_id,
    ae.acao,
    ae.payload,
    ae.created_at,
    ae.created_by,
    u.nome as usuario_nome,
    u.email as usuario_email,
    ${moduleExpression} as modulo,
    coalesce(
      nullif(ae.payload->>'tipo_documento', ''),
      nullif(ae.payload->>'tipo', ''),
      nullif(ae.payload->>'documento', ''),
      ae.entidade
    ) as tipo_documento,
    ${resultExpression} as resultado,
    ${severityExpression} as severidade,
    coalesce(
      nullif(ae.payload #>> '{context,obra_id}', ''),
      nullif(ae.payload->>'obra_id', '')
    ) as obra_id,
    coalesce(
      nullif(ae.payload #>> '{context,contrato_obra_id}', ''),
      nullif(ae.payload #>> '{context,contrato_id}', ''),
      nullif(ae.payload->>'contrato_obra_id', ''),
      nullif(ae.payload->>'contrato_id', '')
    ) as contrato_id,
    coalesce(
      nullif(ae.payload #>> '{context,centro_custo_id}', ''),
      nullif(ae.payload->>'centro_custo_id', '')
    ) as centro_custo_id,
    coalesce(
      nullif(ae.payload->>'status_anterior', ''),
      nullif(ae.payload->>'status_de', '')
    ) as status_anterior,
    coalesce(
      nullif(ae.payload->>'status_novo', ''),
      nullif(ae.payload->>'status_para', '')
    ) as status_novo,
    coalesce(
      nullif(ae.payload->>'motivo', ''),
      nullif(ae.payload->>'observacoes', ''),
      nullif(ae.payload->>'comentario', ''),
      nullif(ae.payload->>'justificativa', '')
    ) as descricao_resumida
  from auditoria_eventos ae
  left join empresas e on e.id = ae.company_id
  left join usuarios u on u.id = ae.created_by
)
`;

const addParam = (params: unknown[], value: unknown): string => {
  params.push(value);
  return `$${params.length}`;
};

const assertDate = (value: string, fieldName: string): string => {
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const assertSafeText = (value: string, fieldName: string): string => {
  const normalized = value.trim();
  if (!safeTextPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Valor invalido em ${fieldName}.`);
  }
  return normalized;
};

const addCommonFilters = (url: URL, params: unknown[], conditions: string[]): void => {
  const periodoDe = url.searchParams.get('periodo_de');
  if (periodoDe) {
    conditions.push(`a.created_at >= ${addParam(params, assertDate(periodoDe, 'periodo_de'))}::date`);
  }

  const periodoAte = url.searchParams.get('periodo_ate');
  if (periodoAte) {
    conditions.push(`a.created_at < (${addParam(params, assertDate(periodoAte, 'periodo_ate'))}::date + interval '1 day')`);
  }

  const usuarioId = url.searchParams.get('usuario_id');
  if (usuarioId) {
    conditions.push(`a.created_by = ${addParam(params, assertUuid(usuarioId, 'usuario_id'))}`);
  }

  const modulo = url.searchParams.get('modulo');
  if (modulo) {
    conditions.push(`a.modulo = ${addParam(params, assertSafeText(modulo, 'modulo'))}`);
  }

  const acao = url.searchParams.get('acao');
  if (acao) {
    conditions.push(`a.acao = ${addParam(params, assertSafeText(acao, 'acao'))}`);
  }

  const entidade = url.searchParams.get('entidade');
  if (entidade) {
    conditions.push(`a.entidade = ${addParam(params, assertSafeText(entidade, 'entidade'))}`);
  }

  const entidadeId = url.searchParams.get('entidade_id');
  if (entidadeId) {
    conditions.push(`a.entidade_id = ${addParam(params, assertUuid(entidadeId, 'entidade_id'))}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    conditions.push(`a.obra_id = ${addParam(params, assertUuid(obraId, 'obra_id'))}`);
  }

  const contratoId = url.searchParams.get('contrato_id');
  if (contratoId) {
    conditions.push(`a.contrato_id = ${addParam(params, assertUuid(contratoId, 'contrato_id'))}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    conditions.push(`a.centro_custo_id = ${addParam(params, assertUuid(centroCustoId, 'centro_custo_id'))}`);
  }

  const severidade = url.searchParams.get('severidade');
  if (severidade) {
    conditions.push(`a.severidade = ${addParam(params, assertSafeText(severidade, 'severidade').toUpperCase())}`);
  }

  const resultado = url.searchParams.get('resultado');
  if (resultado) {
    conditions.push(`a.resultado = ${addParam(params, assertSafeText(resultado, 'resultado').toUpperCase())}`);
  }

  const texto = url.searchParams.get('texto');
  if (texto) {
    const search = addParam(params, `%${texto.trim()}%`);
    conditions.push(`(
      a.entidade ilike ${search}
      or a.acao ilike ${search}
      or a.modulo ilike ${search}
      or coalesce(a.usuario_nome, '') ilike ${search}
      or a.payload::text ilike ${search}
    )`);
  }
};

const buildWhere = (url: URL, params: unknown[]): string => {
  const conditions: string[] = [];
  addCommonFilters(url, params, conditions);
  return conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
};

const safeLimit = (url: URL, fallback = 300): number => {
  const raw = Number(url.searchParams.get('limit') || fallback);
  return Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 500) : fallback;
};

const listEventos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const where = buildWhere(url, params);
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select *
    from auditoria_normalizada a
    ${where}
    order by a.created_at desc
    limit ${safeLimit(url)}
    `,
    params
  );
  return result.rows;
};

const listEventosCriticos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [`a.severidade = 'CRITICA'`];
  addCommonFilters(url, params, conditions);
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select *
    from auditoria_normalizada a
    where ${conditions.join(' and ')}
    order by a.created_at desc
    limit ${safeLimit(url, 100)}
    `,
    params
  );
  return result.rows;
};

const getResumo = async (url: URL): Promise<QueryResultRow> => {
  const params: unknown[] = [];
  const where = buildWhere(url, params);
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select
      count(*)::int as total,
      count(*) filter (where a.severidade = 'CRITICA')::int as criticos,
      count(*) filter (where a.resultado = 'BLOQUEADO')::int as bloqueios_alcada,
      count(*) filter (where a.resultado = 'APROVADO')::int as aprovacoes,
      count(*) filter (where a.resultado = 'REPROVADO')::int as reprovacoes,
      count(*) filter (where a.resultado = 'CANCELADO')::int as cancelamentos,
      count(*) filter (where a.resultado in ('BAIXA_MANUAL', 'ESTORNO_BAIXA'))::int as baixas_manuais,
      count(distinct a.created_by) filter (where a.created_by is not null)::int as usuarios_distintos,
      count(distinct a.modulo)::int as modulos_distintos,
      min(a.created_at) as primeiro_evento,
      max(a.created_at) as ultimo_evento
    from auditoria_normalizada a
    ${where}
    `,
    params
  );
  return result.rows[0];
};

const listModulos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const where = buildWhere(url, params);
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select
      a.modulo,
      count(*)::int as total,
      count(*) filter (where a.severidade = 'CRITICA')::int as criticos,
      count(*) filter (where a.resultado = 'BLOQUEADO')::int as bloqueios,
      count(*) filter (where a.resultado = 'APROVADO')::int as aprovacoes,
      count(*) filter (where a.resultado in ('REPROVADO', 'CANCELADO'))::int as negativas,
      max(a.created_at) as ultimo_evento
    from auditoria_normalizada a
    ${where}
    group by a.modulo
    order by criticos desc, total desc, a.modulo
    `,
    params
  );
  return result.rows;
};

const getEvento = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select *
    from auditoria_normalizada a
    where a.id = $1
    `,
    [assertUuid(id, 'id')]
  );
  return result.rows[0];
};

const getTimeline = async (entidade: string, id: string, url?: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [assertSafeText(entidade, 'tipo'), assertUuid(id, 'id')];
  const conditions: string[] = [`a.entidade = $1`, `a.entidade_id = $2`];
  if (url) {
    addCommonFilters(url, params, conditions);
  }
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select *
    from auditoria_normalizada a
    where ${conditions.join(' and ')}
    order by a.created_at asc
    limit ${url ? safeLimit(url, 200) : 200}
    `,
    params
  );
  return result.rows;
};

const getEventoDetalhado = async (id: string): Promise<Record<string, unknown> | undefined> => {
  const evento = await getEvento(id);
  if (!evento) {
    return undefined;
  }
  const timeline = evento.entidade_id ? await getTimeline(String(evento.entidade), String(evento.entidade_id)) : [];
  return { evento, timeline };
};

const getEventosUsuario = async (usuarioId: string, url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [assertUuid(usuarioId, 'usuarioId')];
  const conditions: string[] = [`a.created_by = $1`];
  addCommonFilters(url, params, conditions);
  const result = await getPool().query(
    `
    ${auditEventsCte}
    select *
    from auditoria_normalizada a
    where ${conditions.join(' and ')}
    order by a.created_at desc
    limit ${safeLimit(url)}
    `,
    params
  );
  return result.rows;
};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleAuditoria = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/auditoria';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'eventos') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listEventos(url) });
      return;
    }

    if (parts.length === 2 && parts[0] === 'eventos') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      const detalhe = await getEventoDetalhado(parts[1]);
      if (!detalhe) {
        sendError(res, 404, 'not_found', 'Evento de auditoria nao encontrado.');
        return;
      }
      sendJson(res, 200, { data: detalhe });
      return;
    }

    if (parts.length === 3 && parts[0] === 'entidade') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await getTimeline(parts[1], parts[2], url) });
      return;
    }

    if (parts.length === 2 && parts[0] === 'usuario') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await getEventosUsuario(parts[1], url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'modulos') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listModulos(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'resumo') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await getResumo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'eventos-criticos') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listEventosCriticos(url) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de auditoria nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
