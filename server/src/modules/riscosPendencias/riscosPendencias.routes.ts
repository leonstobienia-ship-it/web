import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import { assertUuid, optionalText, registrarAuditoria } from '../aprovacoes/aprovacoes.service.js';

type PendenciaStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_TERCEIRO' | 'BLOQUEADA' | 'RESOLVIDA' | 'CANCELADA';
type PendenciaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
type PendenciaTipo = 'FINANCEIRO' | 'COMPRA' | 'CONTRATO' | 'OBRA' | 'MEDICAO' | 'FATURAMENTO' | 'ORCAMENTO' | 'MARGEM' | 'DOCUMENTACAO' | 'OUTROS';
type PendenciaOrigem = 'MANUAL' | 'DASHBOARD_ALERTA' | 'OPERACIONAL';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface PendenciaRow extends QueryResultRow {
  id: string;
  company_id: string;
  codigo: string;
  status: PendenciaStatus;
  prioridade: PendenciaPrioridade;
  tipo: PendenciaTipo;
  prazo: string | null;
}

interface MutationContext {
  usuarioId: string | null;
  comentario: string | null;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statusValues: PendenciaStatus[] = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA', 'RESOLVIDA', 'CANCELADA'];
const activeStatusValues: PendenciaStatus[] = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA'];
const prioridadeValues: PendenciaPrioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const tipoValues: PendenciaTipo[] = ['FINANCEIRO', 'COMPRA', 'CONTRATO', 'OBRA', 'MEDICAO', 'FATURAMENTO', 'ORCAMENTO', 'MARGEM', 'DOCUMENTACAO', 'OUTROS'];
const origemValues: PendenciaOrigem[] = ['MANUAL', 'DASHBOARD_ALERTA', 'OPERACIONAL'];

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const nestedPayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : payload;

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
};

const normalizeText = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
  return value;
};

const optionalUuid = (payload: Record<string, unknown>, fieldName: string): string | null => {
  if (!hasOwn(payload, fieldName) || payload[fieldName] === null || payload[fieldName] === undefined || String(payload[fieldName]).trim() === '') {
    return null;
  }
  return assertUuid(payload[fieldName], fieldName);
};

const getUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const optionalDate = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    return null;
  }
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const optionalEnum = <T extends string>(payload: Record<string, unknown>, fieldName: string, values: readonly T[], fallback: T): T => {
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    return fallback;
  }
  const normalized = value.toUpperCase() as T;
  if (!values.includes(normalized)) {
    throw new HttpError(400, 'validation_error', `Valor invalido em ${fieldName}.`, values);
  }
  return normalized;
};

const requiredEnum = <T extends string>(payload: Record<string, unknown>, fieldName: string, values: readonly T[]): T | null => {
  if (!hasOwn(payload, fieldName)) {
    return null;
  }
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    return null;
  }
  const normalized = value.toUpperCase() as T;
  if (!values.includes(normalized)) {
    throw new HttpError(400, 'validation_error', `Valor invalido em ${fieldName}.`, values);
  }
  return normalized;
};

const normalizeCodigo = (): string => {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `RP-${stamp}-${suffix}`;
};

const isUuidString = (value: string): boolean => uuidPattern.test(value);

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const pgError = toPgError(error);
  if (pgError.code === '23505') {
    sendError(res, 409, 'unique_violation', 'Risco ou pendencia duplicado para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para risco ou pendencia.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor fora do contrato permitido para risco ou pendencia.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

const getDefaultCompanyId = async (client: PoolClient, payload: Record<string, unknown>): Promise<string> => {
  const explicit = optionalUuid(payload, 'company_id');
  if (explicit) {
    return explicit;
  }

  const result = await client.query<{ id: string }>(
    `select id from empresas where cnpj = '00.000.000/0001-33' order by created_at asc limit 1`
  );
  const company = result.rows[0];
  if (!company) {
    throw new HttpError(404, 'not_found', 'Empresa local DEV nao encontrada.');
  }
  return company.id;
};

const buildContextPayload = (payload: Record<string, unknown>) => ({
  obra_id: optionalUuid(payload, 'obra_id'),
  cliente_id: optionalUuid(payload, 'cliente_id'),
  contrato_obra_id: optionalUuid(payload, 'contrato_obra_id') || optionalUuid(payload, 'contrato_id'),
  contrato_obra_aditivo_id: optionalUuid(payload, 'contrato_obra_aditivo_id') || optionalUuid(payload, 'aditivo_id'),
  orcamento_id: optionalUuid(payload, 'orcamento_id'),
  solicitacao_compra_id: optionalUuid(payload, 'solicitacao_compra_id') || optionalUuid(payload, 'solicitacao_id'),
  cotacao_id: optionalUuid(payload, 'cotacao_id'),
  pedido_compra_id: optionalUuid(payload, 'pedido_compra_id') || optionalUuid(payload, 'pedido_id'),
  nota_fiscal_entrada_id: optionalUuid(payload, 'nota_fiscal_entrada_id') || optionalUuid(payload, 'nota_id'),
  conta_pagar_id: optionalUuid(payload, 'conta_pagar_id'),
  programacao_pagamento_id: optionalUuid(payload, 'programacao_pagamento_id') || optionalUuid(payload, 'programacao_id'),
  medicao_id: optionalUuid(payload, 'medicao_id'),
  pedido_faturamento_id: optionalUuid(payload, 'pedido_faturamento_id')
});

const getMutationContext = (payload: Record<string, unknown>): MutationContext => ({
  usuarioId: getUsuarioId(payload),
  comentario: optionalText(payload, 'comentario') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa')
});

const fetchPendenciaForUpdate = async (client: PoolClient, id: string): Promise<PendenciaRow | undefined> => {
  const result = await client.query<PendenciaRow>(
    `select id, company_id, codigo, status, prioridade, tipo, prazo from riscos_pendencias where id = $1 for update`,
    [id]
  );
  return result.rows[0];
};

const insertHistorico = async (
  client: PoolClient,
  pendencia: Pick<PendenciaRow, 'id' | 'company_id' | 'status'>,
  acao: string,
  statusNovo: PendenciaStatus,
  usuarioId: string | null,
  comentario: string | null,
  payload: Record<string, unknown>
): Promise<void> => {
  await client.query(
    `
    insert into riscos_pendencias_historico (
      pendencia_id, company_id, acao, status_anterior, status_novo, usuario_id, comentario, payload
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [pendencia.id, pendencia.company_id, acao, pendencia.status, statusNovo, usuarioId, comentario, JSON.stringify(payload)]
  );
};

const fetchComentarios = async (id: string): Promise<QueryResultRow[]> => {
  const result = await getPool().query(
    `
    select rpc.id, rpc.pendencia_id, rpc.comentario, rpc.created_at, rpc.created_by, u.nome as created_by_nome
    from riscos_pendencias_comentarios rpc
    left join usuarios u on u.id = rpc.created_by
    where rpc.pendencia_id = $1
    order by rpc.created_at desc
    `,
    [id]
  );
  return result.rows;
};

const fetchHistorico = async (id: string): Promise<QueryResultRow[]> => {
  const result = await getPool().query(
    `
    select rph.id, rph.pendencia_id, rph.acao, rph.status_anterior, rph.status_novo,
           rph.usuario_id, u.nome as usuario_nome, rph.comentario, rph.payload, rph.created_at
    from riscos_pendencias_historico rph
    left join usuarios u on u.id = rph.usuario_id
    where rph.pendencia_id = $1
    order by rph.created_at desc
    `,
    [id]
  );
  return result.rows;
};

const fetchPendencia = async (id: string, includeChildren = false): Promise<Record<string, unknown> | undefined> => {
  const result = await getPool().query(
    `
    select
      rp.*,
      resp.nome as responsavel_nome,
      criador.nome as created_by_nome,
      atualizador.nome as updated_by_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      c.nome as cliente_nome,
      co.numero as contrato_numero,
      oo.codigo as orcamento_codigo,
      pc.codigo as pedido_compra_codigo,
      nf.numero as nota_fiscal_numero,
      cp.numero_documento as conta_pagar_numero,
      pp.codigo as programacao_pagamento_codigo,
      mo.numero as medicao_numero,
      pf.codigo as pedido_faturamento_codigo,
      (rp.status in ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA') and rp.prazo is not null and rp.prazo < current_date) as vencida,
      (rp.status in ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA') and rp.prazo between current_date and current_date + interval '7 days') as a_vencer
    from riscos_pendencias rp
    left join usuarios resp on resp.id = rp.responsavel_id
    left join usuarios criador on criador.id = rp.created_by
    left join usuarios atualizador on atualizador.id = rp.updated_by
    left join obras o on o.id = rp.obra_id
    left join clientes c on c.id = rp.cliente_id
    left join contratos_obra co on co.id = rp.contrato_obra_id
    left join orcamentos_obra oo on oo.id = rp.orcamento_id
    left join pedidos_compra pc on pc.id = rp.pedido_compra_id
    left join notas_fiscais_entrada nf on nf.id = rp.nota_fiscal_entrada_id
    left join contas_pagar cp on cp.id = rp.conta_pagar_id
    left join programacoes_pagamento pp on pp.id = rp.programacao_pagamento_id
    left join medicoes_obra mo on mo.id = rp.medicao_id
    left join pedidos_faturamento pf on pf.id = rp.pedido_faturamento_id
    where rp.id = $1
    `,
    [id]
  );
  const pendencia = result.rows[0];
  if (!pendencia || !includeChildren) {
    return pendencia;
  }

  return {
    ...pendencia,
    comentarios: await fetchComentarios(id),
    historico: await fetchHistorico(id)
  };
};

const listPendencias = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const addParam = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  const companyId = url.searchParams.get('company_id');
  if (companyId) {
    conditions.push(`rp.company_id = ${addParam(assertUuid(companyId, 'company_id'))}`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    conditions.push(`rp.status = ${addParam(status.trim().toUpperCase())}`);
  }

  const prioridade = url.searchParams.get('prioridade');
  if (prioridade) {
    conditions.push(`rp.prioridade = ${addParam(prioridade.trim().toUpperCase())}`);
  }

  const tipo = url.searchParams.get('tipo');
  if (tipo) {
    conditions.push(`rp.tipo = ${addParam(tipo.trim().toUpperCase())}`);
  }

  const responsavelId = url.searchParams.get('responsavel_id');
  if (responsavelId) {
    conditions.push(`rp.responsavel_id = ${addParam(assertUuid(responsavelId, 'responsavel_id'))}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    conditions.push(`rp.obra_id = ${addParam(assertUuid(obraId, 'obra_id'))}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    conditions.push(`rp.cliente_id = ${addParam(assertUuid(clienteId, 'cliente_id'))}`);
  }

  if (url.searchParams.get('vencida') === 'true') {
    conditions.push(`rp.status = any(${addParam(activeStatusValues)}::text[]) and rp.prazo is not null and rp.prazo < current_date`);
  }

  const texto = url.searchParams.get('texto');
  if (texto) {
    conditions.push(`(rp.codigo ilike ${addParam(`%${texto.trim()}%`)} or rp.titulo ilike $${params.length} or coalesce(rp.descricao, '') ilike $${params.length})`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      rp.*,
      resp.nome as responsavel_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      c.nome as cliente_nome,
      co.numero as contrato_numero,
      (rp.status in ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA') and rp.prazo is not null and rp.prazo < current_date) as vencida,
      (rp.status in ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA') and rp.prazo between current_date and current_date + interval '7 days') as a_vencer
    from riscos_pendencias rp
    left join usuarios resp on resp.id = rp.responsavel_id
    left join obras o on o.id = rp.obra_id
    left join clientes c on c.id = rp.cliente_id
    left join contratos_obra co on co.id = rp.contrato_obra_id
    ${where}
    order by
      case rp.prioridade when 'CRITICA' then 0 when 'ALTA' then 1 when 'MEDIA' then 2 else 3 end,
      rp.prazo asc nulls last,
      rp.created_at desc
    limit 300
    `,
    params
  );
  return result.rows;
};

const createPendencia = async (rawPayload: Record<string, unknown>) => {
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'company_id', 'codigo', 'titulo', 'descricao', 'tipo', 'prioridade', 'responsavel_id', 'prazo',
    'obra_id', 'cliente_id', 'contrato_obra_id', 'contrato_id', 'contrato_obra_aditivo_id', 'aditivo_id',
    'orcamento_id', 'solicitacao_compra_id', 'solicitacao_id', 'cotacao_id', 'pedido_compra_id', 'pedido_id',
    'nota_fiscal_entrada_id', 'nota_id', 'conta_pagar_id', 'programacao_pagamento_id', 'programacao_id',
    'medicao_id', 'pedido_faturamento_id', 'dashboard_alerta_tipo', 'dashboard_alerta_payload', 'origem',
    'usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa'
  ]);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const companyId = await getDefaultCompanyId(client, payload);
    const context = buildContextPayload(payload);
    const mutation = getMutationContext(payload);
    const codigo = normalizeText(payload.codigo) || normalizeCodigo();
    const titulo = requiredText(payload, 'titulo');
    const descricao = optionalText(payload, 'descricao') || optionalText(payload, 'observacoes');
    const tipo = optionalEnum(payload, 'tipo', tipoValues, 'OUTROS');
    const prioridade = optionalEnum(payload, 'prioridade', prioridadeValues, 'MEDIA');
    const origem = optionalEnum(payload, 'origem', origemValues, 'MANUAL');
    const dashboardAlertaPayload = payload.dashboard_alerta_payload && typeof payload.dashboard_alerta_payload === 'object'
      ? payload.dashboard_alerta_payload as Record<string, unknown>
      : {};

    const inserted = await client.query<{ id: string }>(
      `
      insert into riscos_pendencias (
        company_id, codigo, titulo, descricao, tipo, prioridade, status, responsavel_id, prazo,
        obra_id, cliente_id, contrato_obra_id, contrato_obra_aditivo_id, orcamento_id,
        solicitacao_compra_id, cotacao_id, pedido_compra_id, nota_fiscal_entrada_id, conta_pagar_id,
        programacao_pagamento_id, medicao_id, pedido_faturamento_id, dashboard_alerta_tipo,
        dashboard_alerta_payload, origem, created_by, updated_by
      )
      values (
        $1, $2, $3, $4, $5, $6, 'ABERTA', $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23::jsonb, $24, $25, $25
      )
      returning id
      `,
      [
        companyId,
        codigo,
        titulo,
        descricao,
        tipo,
        prioridade,
        optionalUuid(payload, 'responsavel_id'),
        optionalDate(payload, 'prazo'),
        context.obra_id,
        context.cliente_id,
        context.contrato_obra_id,
        context.contrato_obra_aditivo_id,
        context.orcamento_id,
        context.solicitacao_compra_id,
        context.cotacao_id,
        context.pedido_compra_id,
        context.nota_fiscal_entrada_id,
        context.conta_pagar_id,
        context.programacao_pagamento_id,
        context.medicao_id,
        context.pedido_faturamento_id,
        normalizeText(payload.dashboard_alerta_tipo),
        JSON.stringify(dashboardAlertaPayload),
        origem,
        mutation.usuarioId
      ]
    );

    const pendencia = await fetchPendenciaForUpdate(client, inserted.rows[0].id);
    if (!pendencia) {
      throw new HttpError(500, 'not_found', 'Pendencia criada nao encontrada.');
    }
    await insertHistorico(client, { ...pendencia, status: 'ABERTA' }, 'criar', 'ABERTA', mutation.usuarioId, mutation.comentario, {
      titulo,
      tipo,
      prioridade,
      origem
    });
    await registrarAuditoria(client, companyId, 'risco_pendencia', pendencia.id, 'criar', {
      codigo,
      titulo,
      tipo,
      prioridade,
      origem,
      context
    }, mutation.usuarioId);
    await client.query('commit');
    return fetchPendencia(inserted.rows[0].id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updatePendencia = async (id: string, rawPayload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'titulo', 'descricao', 'tipo', 'prioridade', 'status', 'responsavel_id', 'prazo',
    'obra_id', 'cliente_id', 'contrato_obra_id', 'contrato_id', 'contrato_obra_aditivo_id', 'aditivo_id',
    'orcamento_id', 'solicitacao_compra_id', 'solicitacao_id', 'cotacao_id', 'pedido_compra_id', 'pedido_id',
    'nota_fiscal_entrada_id', 'nota_id', 'conta_pagar_id', 'programacao_pagamento_id', 'programacao_id',
    'medicao_id', 'pedido_faturamento_id', 'dashboard_alerta_tipo', 'dashboard_alerta_payload',
    'usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa'
  ]);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const pendencia = await fetchPendenciaForUpdate(client, id);
    if (!pendencia) {
      throw new HttpError(404, 'not_found', 'Risco ou pendencia nao encontrado.');
    }
    if (['RESOLVIDA', 'CANCELADA'].includes(pendencia.status)) {
      throw new HttpError(409, 'status_conflict', `Pendencia em status ${pendencia.status} nao permite edicao.`);
    }

    const mutation = getMutationContext(payload);
    const context = buildContextPayload(payload);
    const nextStatus = requiredEnum(payload, 'status', statusValues);
    if (nextStatus && !activeStatusValues.includes(nextStatus)) {
      throw new HttpError(400, 'validation_error', 'Use os endpoints dedicados para resolver ou cancelar pendencias.');
    }

    await client.query(
      `
      update riscos_pendencias
      set
        titulo = coalesce($1, titulo),
        descricao = case when $2::boolean then $3 else descricao end,
        tipo = coalesce($4, tipo),
        prioridade = coalesce($5, prioridade),
        status = coalesce($6, status),
        responsavel_id = case when $7::boolean then $8 else responsavel_id end,
        prazo = case when $9::boolean then $10 else prazo end,
        obra_id = case when $11::boolean then $12 else obra_id end,
        cliente_id = case when $13::boolean then $14 else cliente_id end,
        contrato_obra_id = case when $15::boolean then $16 else contrato_obra_id end,
        contrato_obra_aditivo_id = case when $17::boolean then $18 else contrato_obra_aditivo_id end,
        orcamento_id = case when $19::boolean then $20 else orcamento_id end,
        solicitacao_compra_id = case when $21::boolean then $22 else solicitacao_compra_id end,
        cotacao_id = case when $23::boolean then $24 else cotacao_id end,
        pedido_compra_id = case when $25::boolean then $26 else pedido_compra_id end,
        nota_fiscal_entrada_id = case when $27::boolean then $28 else nota_fiscal_entrada_id end,
        conta_pagar_id = case when $29::boolean then $30 else conta_pagar_id end,
        programacao_pagamento_id = case when $31::boolean then $32 else programacao_pagamento_id end,
        medicao_id = case when $33::boolean then $34 else medicao_id end,
        pedido_faturamento_id = case when $35::boolean then $36 else pedido_faturamento_id end,
        dashboard_alerta_tipo = case when $37::boolean then $38 else dashboard_alerta_tipo end,
        dashboard_alerta_payload = case when $39::boolean then $40::jsonb else dashboard_alerta_payload end,
        updated_by = $41,
        updated_at = now()
      where id = $42
      `,
      [
        hasOwn(payload, 'titulo') ? requiredText(payload, 'titulo') : null,
        hasOwn(payload, 'descricao'), optionalText(payload, 'descricao'),
        hasOwn(payload, 'tipo') ? requiredEnum(payload, 'tipo', tipoValues) : null,
        hasOwn(payload, 'prioridade') ? requiredEnum(payload, 'prioridade', prioridadeValues) : null,
        nextStatus,
        hasOwn(payload, 'responsavel_id'), optionalUuid(payload, 'responsavel_id'),
        hasOwn(payload, 'prazo'), optionalDate(payload, 'prazo'),
        hasOwn(payload, 'obra_id'), context.obra_id,
        hasOwn(payload, 'cliente_id'), context.cliente_id,
        hasOwn(payload, 'contrato_obra_id') || hasOwn(payload, 'contrato_id'), context.contrato_obra_id,
        hasOwn(payload, 'contrato_obra_aditivo_id') || hasOwn(payload, 'aditivo_id'), context.contrato_obra_aditivo_id,
        hasOwn(payload, 'orcamento_id'), context.orcamento_id,
        hasOwn(payload, 'solicitacao_compra_id') || hasOwn(payload, 'solicitacao_id'), context.solicitacao_compra_id,
        hasOwn(payload, 'cotacao_id'), context.cotacao_id,
        hasOwn(payload, 'pedido_compra_id') || hasOwn(payload, 'pedido_id'), context.pedido_compra_id,
        hasOwn(payload, 'nota_fiscal_entrada_id') || hasOwn(payload, 'nota_id'), context.nota_fiscal_entrada_id,
        hasOwn(payload, 'conta_pagar_id'), context.conta_pagar_id,
        hasOwn(payload, 'programacao_pagamento_id') || hasOwn(payload, 'programacao_id'), context.programacao_pagamento_id,
        hasOwn(payload, 'medicao_id'), context.medicao_id,
        hasOwn(payload, 'pedido_faturamento_id'), context.pedido_faturamento_id,
        hasOwn(payload, 'dashboard_alerta_tipo'), normalizeText(payload.dashboard_alerta_tipo),
        hasOwn(payload, 'dashboard_alerta_payload'), JSON.stringify(payload.dashboard_alerta_payload && typeof payload.dashboard_alerta_payload === 'object' ? payload.dashboard_alerta_payload : {}),
        mutation.usuarioId,
        id
      ]
    );

    const novoStatus = nextStatus || pendencia.status;
    await insertHistorico(client, pendencia, 'editar', novoStatus, mutation.usuarioId, mutation.comentario, {
      campos: Object.keys(payload).filter((key) => !['usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa'].includes(key))
    });
    await registrarAuditoria(client, pendencia.company_id, 'risco_pendencia', id, 'editar', {
      status_anterior: pendencia.status,
      status_novo: novoStatus,
      campos: Object.keys(payload)
    }, mutation.usuarioId);
    await client.query('commit');
    return fetchPendencia(id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const changeStatus = async (
  id: string,
  rawPayload: Record<string, unknown>,
  action: 'iniciar' | 'bloquear' | 'resolver' | 'cancelar'
) => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa', 'resolucao', 'motivo']);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const pendencia = await fetchPendenciaForUpdate(client, id);
    if (!pendencia) {
      throw new HttpError(404, 'not_found', 'Risco ou pendencia nao encontrado.');
    }
    if (['RESOLVIDA', 'CANCELADA'].includes(pendencia.status)) {
      throw new HttpError(409, 'status_conflict', `Pendencia em status ${pendencia.status} nao permite a acao ${action}.`);
    }

    const mutation = getMutationContext(payload);
    const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes') || mutation.comentario;
    const resolucao = optionalText(payload, 'resolucao') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
    let statusNovo: PendenciaStatus = 'EM_ANDAMENTO';
    let setClause = `status = 'EM_ANDAMENTO', iniciado_por = $1, iniciado_em = coalesce(iniciado_em, now()), updated_by = $1, updated_at = now()`;
    let params: unknown[] = [mutation.usuarioId, id];

    if (action === 'bloquear') {
      if (!motivo) {
        throw new HttpError(400, 'validation_error', 'Motivo, observacao ou justificativa obrigatoria para bloquear.');
      }
      statusNovo = 'BLOQUEADA';
      setClause = `status = 'BLOQUEADA', bloqueio_motivo = $2, bloqueado_por = $1, bloqueado_em = now(), updated_by = $1, updated_at = now()`;
      params = [mutation.usuarioId, motivo, id];
    } else if (action === 'resolver') {
      if (!resolucao) {
        throw new HttpError(400, 'validation_error', 'Resolucao ou observacao obrigatoria para resolver.');
      }
      statusNovo = 'RESOLVIDA';
      setClause = `status = 'RESOLVIDA', resolucao = $2, resolvido_por = $1, resolvido_em = now(), updated_by = $1, updated_at = now()`;
      params = [mutation.usuarioId, resolucao, id];
    } else if (action === 'cancelar') {
      if (!motivo) {
        throw new HttpError(400, 'validation_error', 'Motivo, observacao ou justificativa obrigatoria para cancelar.');
      }
      statusNovo = 'CANCELADA';
      setClause = `status = 'CANCELADA', cancelamento_motivo = $2, cancelado_por = $1, cancelado_em = now(), updated_by = $1, updated_at = now()`;
      params = [mutation.usuarioId, motivo, id];
    }

    await client.query(`update riscos_pendencias set ${setClause} where id = $${params.length}`, params);
    await insertHistorico(client, pendencia, action, statusNovo, mutation.usuarioId, mutation.comentario || motivo || resolucao, {
      motivo,
      resolucao
    });
    await registrarAuditoria(client, pendencia.company_id, 'risco_pendencia', id, action, {
      status_anterior: pendencia.status,
      status_novo: statusNovo,
      motivo,
      resolucao
    }, mutation.usuarioId);
    await client.query('commit');
    return fetchPendencia(id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const addComentario = async (id: string, rawPayload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'comentario']);
  const comentario = requiredText(payload, 'comentario');
  const usuarioId = getUsuarioId(payload);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const pendencia = await fetchPendenciaForUpdate(client, id);
    if (!pendencia) {
      throw new HttpError(404, 'not_found', 'Risco ou pendencia nao encontrado.');
    }

    await client.query(
      `
      insert into riscos_pendencias_comentarios (pendencia_id, company_id, comentario, created_by)
      values ($1, $2, $3, $4)
      `,
      [id, pendencia.company_id, comentario, usuarioId]
    );
    await insertHistorico(client, pendencia, 'comentar', pendencia.status, usuarioId, comentario, {});
    await registrarAuditoria(client, pendencia.company_id, 'risco_pendencia', id, 'comentar', { comentario }, usuarioId);
    await client.query('commit');
    return fetchPendencia(id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const mapAlertToTipo = (alertType: string): PendenciaTipo => {
  if (alertType.includes('MARGEM')) return 'MARGEM';
  if (alertType.includes('FATURAMENTO') || alertType.includes('MEDICAO')) return alertType.includes('MEDICAO') ? 'MEDICAO' : 'FATURAMENTO';
  if (alertType.includes('ORCAMENTO') || alertType.includes('PLANEJAMENTO')) return 'ORCAMENTO';
  if (alertType.includes('CONTRATO')) return 'CONTRATO';
  if (alertType.includes('CONTAS') || alertType.includes('PROGRAMACAO')) return 'FINANCEIRO';
  return 'OUTROS';
};

const mapAlertToPrioridade = (severity: string): PendenciaPrioridade => {
  if (severity === 'CRITICO' || severity === 'CRITICA') return 'CRITICA';
  if (severity === 'ALTO' || severity === 'ALTA') return 'ALTA';
  if (severity === 'BAIXO' || severity === 'BAIXA') return 'BAIXA';
  return 'MEDIA';
};

const gerarDeAlerta = async (rawPayload: Record<string, unknown>) => {
  const payload = nestedPayload(rawPayload);
  const alertaRaw = payload.alerta && typeof payload.alerta === 'object' && !Array.isArray(payload.alerta)
    ? payload.alerta as Record<string, unknown>
    : payload;
  const alertaTipo = requiredText(alertaRaw, 'tipo').toUpperCase();
  const severidade = normalizeText(alertaRaw.severidade)?.toUpperCase() || 'MEDIO';
  const mensagem = requiredText(alertaRaw, 'mensagem');

  return createPendencia({
    company_id: payload.company_id,
    titulo: normalizeText(payload.titulo) || `Alerta dashboard: ${alertaTipo}`,
    descricao: mensagem,
    tipo: mapAlertToTipo(alertaTipo),
    prioridade: mapAlertToPrioridade(severidade),
    responsavel_id: payload.responsavel_id,
    prazo: payload.prazo,
    obra_id: alertaRaw.obra_id || payload.obra_id,
    cliente_id: alertaRaw.cliente_id || payload.cliente_id,
    dashboard_alerta_tipo: alertaTipo,
    dashboard_alerta_payload: alertaRaw,
    origem: 'DASHBOARD_ALERTA',
    usuario_id: payload.usuario_id ?? payload.usuarioId,
    comentario: payload.comentario || 'Pendencia gerada a partir de alerta executivo.'
  });
};

export const handleRiscosPendencias = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/riscos-pendencias';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listPendencias(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createPendencia(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1 && parts[0] === 'gerar-de-alerta') {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 201, { data: await gerarDeAlerta(await readJsonBody(req)) });
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (!isUuidString(id)) {
        sendError(res, 404, 'not_found', 'Rota de riscos e pendencias nao encontrada.');
        return;
      }
      assertUuid(id, 'id');
      if (method === 'GET') {
        const pendencia = await fetchPendencia(id, true);
        if (!pendencia) {
          sendError(res, 404, 'not_found', 'Risco ou pendencia nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: pendencia });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updatePendencia(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && parts[1] === 'historico') {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await fetchHistorico(id) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'comentarios') {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 200, { data: await addComentario(id, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'iniciar' || action === 'bloquear' || action === 'resolver' || action === 'cancelar') {
        sendJson(res, 200, { data: await changeStatus(id, await readJsonBody(req), action) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de risco ou pendencia nao encontrada.');
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de riscos e pendencias nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
