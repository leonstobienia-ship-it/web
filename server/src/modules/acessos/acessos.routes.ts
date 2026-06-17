import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type StatusCadastro = 'ativo' | 'inativo';
type EfeitoAlcada = 'PERMITIR' | 'NEGAR';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface BaseHandlerOptions {
  basePath: string;
  entityName: string;
}

interface UsuarioPerfilRow extends QueryResultRow {
  perfil_id: string;
  principal: boolean;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statusValues: StatusCadastro[] = ['ativo', 'inativo'];
const efeitoValues: EfeitoAlcada[] = ['PERMITIR', 'NEGAR'];
const allowedModules = [
  'cadastros',
  'solicitacoes-compra',
  'cotacoes',
  'pedidos-compra',
  'notas-fiscais-entrada',
  'contas-pagar',
  'programacoes-pagamento',
  'usuarios',
  'perfis',
  'alcadas',
  'auditoria'
];
const allowedActions = [
  'visualizar',
  'criar',
  'editar',
  'inativar',
  'reativar',
  'enviar',
  'aprovar_tecnico',
  'aprovar_diretoria',
  'conferir',
  'adicionar_conta',
  'remover_conta',
  'submeter',
  'liberar',
  'cancelar',
  'reprovar',
  'administrar'
];

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const assertUuid = (value: unknown, fieldName: string): string => {
  const normalized = String(value ?? '').trim();
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
  }
  return normalized;
};

const optionalUuid = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = payload[fieldName];
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  return assertUuid(value, fieldName);
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = payload[fieldName];
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
  return normalized;
};

const optionalText = (payload: Record<string, unknown>, fieldName: string): string | null => {
  if (!hasOwn(payload, fieldName)) {
    return null;
  }
  const value = payload[fieldName];
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeStatus = (value: unknown, fieldName = 'status'): StatusCadastro => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!statusValues.includes(normalized as StatusCadastro)) {
    throw new HttpError(400, 'validation_error', `${fieldName} invalido. Use: ${statusValues.join(', ')}.`);
  }
  return normalized as StatusCadastro;
};

const normalizeModule = (value: unknown): string => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!allowedModules.includes(normalized)) {
    throw new HttpError(400, 'validation_error', `modulo invalido. Use: ${allowedModules.join(', ')}.`);
  }
  return normalized;
};

const normalizeAction = (value: unknown): string => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!allowedActions.includes(normalized)) {
    throw new HttpError(400, 'validation_error', `acao invalida. Use: ${allowedActions.join(', ')}.`);
  }
  return normalized;
};

const normalizeTipoDocumento = (value: unknown): string => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) {
    throw new HttpError(400, 'validation_error', 'Campo obrigatorio ausente: tipo_documento.');
  }
  if (!/^[A-Z0-9_ -]{3,60}$/.test(normalized)) {
    throw new HttpError(400, 'validation_error', 'tipo_documento invalido.');
  }
  return normalized.replace(/\s+/g, '_');
};

const normalizeMoney = (value: unknown, fieldName: string, required = true): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    if (required) {
      throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
    }
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser numerico maior ou igual a zero.`);
  }
  return Number(parsed.toFixed(2));
};

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown, entityName: string): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const pgError = toPgError(error);
  if (pgError.code === '23505') {
    sendError(res, 409, 'unique_violation', `${entityName} duplicado para uma chave unica.`, pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', `Referencia invalida para ${entityName}.`, pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

const audit = async (
  client: PoolClient,
  companyId: string | null,
  entidade: string,
  entidadeId: string | null,
  acao: string,
  payload: Record<string, unknown>
): Promise<void> => {
  await client.query(
    `
    insert into auditoria_eventos (company_id, entidade, entidade_id, acao, payload)
    values ($1, $2, $3, $4, $5::jsonb)
    `,
    [companyId, entidade, entidadeId, acao, JSON.stringify(payload)]
  );
};

const changeSimpleStatus = async (
  table: string,
  id: string,
  status: StatusCadastro,
  returning: string,
  auditEntity: string
) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update ${table}
      set status = $1, updated_at = now()
      where id = $2
      returning ${returning}
      `,
      [status, id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', `${auditEntity} nao encontrado.`);
    }
    await audit(client, row.company_id || null, auditEntity, row.id, status === 'ativo' ? 'reativar' : 'inativar', { status });
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listPerfis = async (url: URL) => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`p.status = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      p.id,
      p.company_id,
      p.nome,
      p.descricao,
      p.escopo_padrao,
      p.status,
      p.created_at,
      p.updated_at,
      coalesce(count(pe.id) filter (where pe.status = 'ativo'), 0)::int as escopos_count
    from perfis p
    left join perfis_escopos pe on pe.perfil_id = p.id
    ${where}
    group by p.id
    order by p.nome
    `,
    params
  );
  return result.rows;
};

const getPerfil = async (id: string) => {
  assertUuid(id, 'id');
  const result = await getPool().query(
    `
    select
      p.id,
      p.company_id,
      p.nome,
      p.descricao,
      p.escopo_padrao,
      p.status,
      p.created_at,
      p.updated_at,
      coalesce(json_agg(json_build_object(
        'id', e.id,
        'modulo', e.modulo,
        'acao', e.acao,
        'descricao', e.descricao,
        'status', e.status
      ) order by e.modulo, e.acao) filter (where e.id is not null and pe.status = 'ativo'), '[]'::json) as escopos
    from perfis p
    left join perfis_escopos pe on pe.perfil_id = p.id
    left join escopos_acesso e on e.id = pe.escopo_id
    where p.id = $1
    group by p.id
    `,
    [id]
  );
  return result.rows[0];
};

const createPerfil = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['company_id', 'nome', 'descricao', 'escopo_padrao', 'status']);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const nome = requiredText(payload, 'nome').toUpperCase();
  const descricao = optionalText(payload, 'descricao');
  const escopoPadrao = optionalText(payload, 'escopo_padrao') || 'empresa';
  const status = hasOwn(payload, 'status') ? normalizeStatus(payload.status) : 'ativo';
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      insert into perfis (company_id, nome, descricao, permissoes, escopo_padrao, status)
      values ($1, $2, $3, '[]'::jsonb, $4, $5)
      returning id, company_id, nome, descricao, escopo_padrao, status, created_at, updated_at
      `,
      [companyId, nome, descricao, escopoPadrao, status]
    );
    const row = result.rows[0];
    await audit(client, companyId, 'perfil', row.id, 'criar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updatePerfil = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['nome', 'descricao', 'escopo_padrao', 'status']);
  const updates: Array<{ column: string; value: unknown }> = [];
  if (hasOwn(payload, 'nome')) {
    updates.push({ column: 'nome', value: requiredText(payload, 'nome').toUpperCase() });
  }
  if (hasOwn(payload, 'descricao')) {
    updates.push({ column: 'descricao', value: optionalText(payload, 'descricao') });
  }
  if (hasOwn(payload, 'escopo_padrao')) {
    updates.push({ column: 'escopo_padrao', value: optionalText(payload, 'escopo_padrao') || 'empresa' });
  }
  if (hasOwn(payload, 'status')) {
    updates.push({ column: 'status', value: normalizeStatus(payload.status) });
  }
  if (updates.length === 0) {
    throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
  }
  const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update perfis
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      returning id, company_id, nome, descricao, escopo_padrao, status, created_at, updated_at
      `,
      [...updates.map((update) => update.value), id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', 'Perfil nao encontrado.');
    }
    await audit(client, row.company_id, 'perfil', row.id, 'editar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listEscopos = async (url: URL) => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const status = url.searchParams.get('status');
  const modulo = url.searchParams.get('modulo');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`status = $${params.length}`);
  }
  if (modulo) {
    params.push(normalizeModule(modulo));
    conditions.push(`modulo = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select id, company_id, modulo, acao, descricao, status, created_at, updated_at
    from escopos_acesso
    ${where}
    order by modulo, acao
    `,
    params
  );
  return result.rows;
};

const createEscopo = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['company_id', 'modulo', 'acao', 'descricao', 'status']);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const modulo = normalizeModule(payload.modulo);
  const acao = normalizeAction(payload.acao);
  const descricao = optionalText(payload, 'descricao');
  const status = hasOwn(payload, 'status') ? normalizeStatus(payload.status) : 'ativo';
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      insert into escopos_acesso (company_id, modulo, acao, descricao, status)
      values ($1, $2, $3, $4, $5)
      returning id, company_id, modulo, acao, descricao, status, created_at, updated_at
      `,
      [companyId, modulo, acao, descricao, status]
    );
    const row = result.rows[0];
    await audit(client, companyId, 'escopo', row.id, 'criar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateEscopo = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['modulo', 'acao', 'descricao', 'status']);
  const updates: Array<{ column: string; value: unknown }> = [];
  if (hasOwn(payload, 'modulo')) {
    updates.push({ column: 'modulo', value: normalizeModule(payload.modulo) });
  }
  if (hasOwn(payload, 'acao')) {
    updates.push({ column: 'acao', value: normalizeAction(payload.acao) });
  }
  if (hasOwn(payload, 'descricao')) {
    updates.push({ column: 'descricao', value: optionalText(payload, 'descricao') });
  }
  if (hasOwn(payload, 'status')) {
    updates.push({ column: 'status', value: normalizeStatus(payload.status) });
  }
  if (updates.length === 0) {
    throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
  }
  const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update escopos_acesso
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      returning id, company_id, modulo, acao, descricao, status, created_at, updated_at
      `,
      [...updates.map((update) => update.value), id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', 'Escopo nao encontrado.');
    }
    await audit(client, row.company_id, 'escopo', row.id, 'editar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const refreshUsuarioPerfis = async (client: PoolClient, usuarioId: string): Promise<void> => {
  const rels = await client.query<UsuarioPerfilRow>(
    `
    select perfil_id, principal
    from usuarios_perfis
    where usuario_id = $1 and status = 'ativo'
    order by principal desc, updated_at desc
    `,
    [usuarioId]
  );
  const perfilIds = rels.rows.map((row) => row.perfil_id);
  const principal = rels.rows.find((row) => row.principal)?.perfil_id || perfilIds[0] || null;
  await client.query(
    `
    update usuarios
    set perfil_principal_id = $1, perfil_ids = $2::uuid[], updated_at = now()
    where id = $3
    `,
    [principal, perfilIds, usuarioId]
  );
};

const listUsuariosPerfis = async () => {
  const result = await getPool().query(
    `
    select
      up.id,
      up.usuario_id,
      u.nome as usuario_nome,
      u.email as usuario_email,
      up.perfil_id,
      p.nome as perfil_nome,
      up.principal,
      up.status,
      up.created_at,
      up.updated_at
    from usuarios_perfis up
    join usuarios u on u.id = up.usuario_id
    join perfis p on p.id = up.perfil_id
    order by u.nome, up.principal desc, p.nome
    `
  );
  return result.rows;
};

const createUsuarioPerfil = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['usuario_id', 'perfil_id', 'principal', 'status']);
  const usuarioId = assertUuid(payload.usuario_id, 'usuario_id');
  const perfilId = assertUuid(payload.perfil_id, 'perfil_id');
  const principal = payload.principal === true;
  const status = hasOwn(payload, 'status') ? normalizeStatus(payload.status) : 'ativo';
  const client = await getPool().connect();
  try {
    await client.query('begin');
    if (principal) {
      await client.query('update usuarios_perfis set principal = false, updated_at = now() where usuario_id = $1', [usuarioId]);
    }
    const result = await client.query(
      `
      insert into usuarios_perfis (usuario_id, perfil_id, principal, status)
      values ($1, $2, $3, $4)
      on conflict (usuario_id, perfil_id)
      do update set principal = excluded.principal, status = excluded.status, updated_at = now()
      returning id, usuario_id, perfil_id, principal, status, created_at, updated_at
      `,
      [usuarioId, perfilId, principal, status]
    );
    await refreshUsuarioPerfis(client, usuarioId);
    const row = result.rows[0];
    const company = await client.query('select company_id from usuarios where id = $1', [usuarioId]);
    await audit(client, company.rows[0]?.company_id || null, 'usuario_perfil', row.id, 'vincular', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateUsuarioPerfilStatus = async (id: string, status: StatusCadastro) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update usuarios_perfis
      set status = $1, updated_at = now()
      where id = $2
      returning id, usuario_id, perfil_id, principal, status, created_at, updated_at
      `,
      [status, id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', 'Vinculo usuario-perfil nao encontrado.');
    }
    await refreshUsuarioPerfis(client, row.usuario_id);
    const company = await client.query('select company_id from usuarios where id = $1', [row.usuario_id]);
    await audit(client, company.rows[0]?.company_id || null, 'usuario_perfil', row.id, status === 'ativo' ? 'reativar' : 'inativar', { status });
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listPerfisEscopos = async () => {
  const result = await getPool().query(
    `
    select
      pe.id,
      pe.perfil_id,
      p.nome as perfil_nome,
      pe.escopo_id,
      e.modulo,
      e.acao,
      e.descricao as escopo_descricao,
      pe.status,
      pe.created_at,
      pe.updated_at
    from perfis_escopos pe
    join perfis p on p.id = pe.perfil_id
    join escopos_acesso e on e.id = pe.escopo_id
    order by p.nome, e.modulo, e.acao
    `
  );
  return result.rows;
};

const createPerfilEscopo = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['perfil_id', 'escopo_id', 'status']);
  const perfilId = assertUuid(payload.perfil_id, 'perfil_id');
  const escopoId = assertUuid(payload.escopo_id, 'escopo_id');
  const status = hasOwn(payload, 'status') ? normalizeStatus(payload.status) : 'ativo';
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      insert into perfis_escopos (perfil_id, escopo_id, status)
      values ($1, $2, $3)
      on conflict (perfil_id, escopo_id)
      do update set status = excluded.status, updated_at = now()
      returning id, perfil_id, escopo_id, status, created_at, updated_at
      `,
      [perfilId, escopoId, status]
    );
    const row = result.rows[0];
    const company = await client.query('select company_id from perfis where id = $1', [perfilId]);
    await audit(client, company.rows[0]?.company_id || null, 'perfil_escopo', row.id, 'vincular', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updatePerfilEscopoStatus = async (id: string, status: StatusCadastro) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update perfis_escopos
      set status = $1, updated_at = now()
      where id = $2
      returning id, perfil_id, escopo_id, status, created_at, updated_at
      `,
      [status, id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', 'Vinculo perfil-escopo nao encontrado.');
    }
    const company = await client.query('select company_id from perfis where id = $1', [row.perfil_id]);
    await audit(client, company.rows[0]?.company_id || null, 'perfil_escopo', row.id, status === 'ativo' ? 'reativar' : 'inativar', { status });
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listAlcadas = async (url: URL) => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const status = url.searchParams.get('status');
  const modulo = url.searchParams.get('modulo');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`a.status = $${params.length}`);
  }
  if (modulo) {
    params.push(normalizeModule(modulo));
    conditions.push(`a.modulo = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      a.id,
      a.company_id,
      a.usuario_id,
      u.nome as usuario_nome,
      a.perfil_id,
      p.nome as perfil_nome,
      a.modulo,
      a.tipo_documento,
      a.acao,
      a.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      a.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      a.valor_minimo,
      a.valor_maximo,
      a.efeito,
      a.observacoes,
      a.status,
      a.created_at,
      a.updated_at
    from alcadas_aprovacao a
    left join usuarios u on u.id = a.usuario_id
    left join perfis p on p.id = a.perfil_id
    left join obras o on o.id = a.obra_id
    left join centros_custo cc on cc.id = a.centro_custo_id
    ${where}
    order by a.modulo, a.tipo_documento, a.acao, a.valor_minimo
    `,
    params
  );
  return result.rows;
};

const createAlcada = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'usuario_id',
    'perfil_id',
    'modulo',
    'tipo_documento',
    'acao',
    'obra_id',
    'centro_custo_id',
    'valor_minimo',
    'valor_maximo',
    'efeito',
    'observacoes',
    'status'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const usuarioId = optionalUuid(payload, 'usuario_id');
  const perfilId = optionalUuid(payload, 'perfil_id');
  if (!usuarioId && !perfilId) {
    throw new HttpError(400, 'validation_error', 'Informe usuario_id ou perfil_id para a alcada.');
  }
  const modulo = normalizeModule(payload.modulo);
  const tipoDocumento = normalizeTipoDocumento(payload.tipo_documento);
  const acao = normalizeAction(payload.acao);
  const obraId = optionalUuid(payload, 'obra_id');
  const centroCustoId = optionalUuid(payload, 'centro_custo_id');
  const valorMinimo = normalizeMoney(payload.valor_minimo ?? 0, 'valor_minimo') ?? 0;
  const valorMaximo = normalizeMoney(payload.valor_maximo, 'valor_maximo', false);
  if (valorMaximo !== null && valorMaximo < valorMinimo) {
    throw new HttpError(400, 'validation_error', 'valor_maximo nao pode ser menor que valor_minimo.');
  }
  const efeito = hasOwn(payload, 'efeito') ? String(payload.efeito).trim().toUpperCase() : 'PERMITIR';
  if (!efeitoValues.includes(efeito as EfeitoAlcada)) {
    throw new HttpError(400, 'validation_error', `efeito invalido. Use: ${efeitoValues.join(', ')}.`);
  }
  const observacoes = optionalText(payload, 'observacoes');
  const status = hasOwn(payload, 'status') ? normalizeStatus(payload.status) : 'ativo';
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      insert into alcadas_aprovacao (
        company_id,
        usuario_id,
        perfil_id,
        modulo,
        tipo_documento,
        acao,
        obra_id,
        centro_custo_id,
        valor_minimo,
        valor_maximo,
        efeito,
        observacoes,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *
      `,
      [
        companyId,
        usuarioId,
        perfilId,
        modulo,
        tipoDocumento,
        acao,
        obraId,
        centroCustoId,
        valorMinimo,
        valorMaximo,
        efeito,
        observacoes,
        status
      ]
    );
    const row = result.rows[0];
    await audit(client, companyId, 'alcada', row.id, 'criar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateAlcada = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, [
    'usuario_id',
    'perfil_id',
    'modulo',
    'tipo_documento',
    'acao',
    'obra_id',
    'centro_custo_id',
    'valor_minimo',
    'valor_maximo',
    'efeito',
    'observacoes',
    'status'
  ]);
  const updates: Array<{ column: string; value: unknown }> = [];
  if (hasOwn(payload, 'usuario_id')) updates.push({ column: 'usuario_id', value: optionalUuid(payload, 'usuario_id') });
  if (hasOwn(payload, 'perfil_id')) updates.push({ column: 'perfil_id', value: optionalUuid(payload, 'perfil_id') });
  if (hasOwn(payload, 'modulo')) updates.push({ column: 'modulo', value: normalizeModule(payload.modulo) });
  if (hasOwn(payload, 'tipo_documento')) updates.push({ column: 'tipo_documento', value: normalizeTipoDocumento(payload.tipo_documento) });
  if (hasOwn(payload, 'acao')) updates.push({ column: 'acao', value: normalizeAction(payload.acao) });
  if (hasOwn(payload, 'obra_id')) updates.push({ column: 'obra_id', value: optionalUuid(payload, 'obra_id') });
  if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
  if (hasOwn(payload, 'valor_minimo')) updates.push({ column: 'valor_minimo', value: normalizeMoney(payload.valor_minimo, 'valor_minimo') });
  if (hasOwn(payload, 'valor_maximo')) updates.push({ column: 'valor_maximo', value: normalizeMoney(payload.valor_maximo, 'valor_maximo', false) });
  if (hasOwn(payload, 'efeito')) {
    const efeito = String(payload.efeito).trim().toUpperCase();
    if (!efeitoValues.includes(efeito as EfeitoAlcada)) {
      throw new HttpError(400, 'validation_error', `efeito invalido. Use: ${efeitoValues.join(', ')}.`);
    }
    updates.push({ column: 'efeito', value: efeito });
  }
  if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
  if (hasOwn(payload, 'status')) updates.push({ column: 'status', value: normalizeStatus(payload.status) });
  if (updates.length === 0) {
    throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
  }
  const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(
      `
      update alcadas_aprovacao
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      returning *
      `,
      [...updates.map((update) => update.value), id]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(404, 'not_found', 'Alcada nao encontrada.');
    }
    await audit(client, row.company_id, 'alcada', row.id, 'editar', payload);
    await client.query('commit');
    return row;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const validateAlcada = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['usuario_id', 'modulo', 'tipo_documento', 'acao', 'obra_id', 'centro_custo_id', 'valor']);
  const usuarioId = assertUuid(payload.usuario_id, 'usuario_id');
  const modulo = normalizeModule(payload.modulo);
  const tipoDocumento = normalizeTipoDocumento(payload.tipo_documento);
  const acao = normalizeAction(payload.acao);
  const obraId = optionalUuid(payload, 'obra_id');
  const centroCustoId = optionalUuid(payload, 'centro_custo_id');
  const valor = normalizeMoney(payload.valor, 'valor') ?? 0;
  const client = await getPool().connect();
  try {
    const usuario = await client.query(
      `
      select id, company_id, nome, email
      from usuarios
      where id = $1 and status = 'ativo' and ativo = true
      `,
      [usuarioId]
    );
    const user = usuario.rows[0];
    if (!user) {
      throw new HttpError(404, 'not_found', 'Usuario ativo nao encontrado.');
    }

    const perfis = await client.query(
      `
      select p.id, p.nome
      from usuarios_perfis up
      join perfis p on p.id = up.perfil_id
      where up.usuario_id = $1 and up.status = 'ativo' and p.status = 'ativo'
      order by up.principal desc, p.nome
      `,
      [usuarioId]
    );
    const perfilIds = perfis.rows.map((perfil) => perfil.id);

    const params: unknown[] = [user.company_id, modulo, tipoDocumento, acao, valor, usuarioId, perfilIds, obraId, centroCustoId];
    const rules = await client.query(
      `
      select
        a.id,
        a.usuario_id,
        u.nome as usuario_nome,
        a.perfil_id,
        p.nome as perfil_nome,
        a.modulo,
        a.tipo_documento,
        a.acao,
        a.obra_id,
        a.centro_custo_id,
        a.valor_minimo,
        a.valor_maximo,
        a.efeito,
        a.observacoes
      from alcadas_aprovacao a
      left join usuarios u on u.id = a.usuario_id
      left join perfis p on p.id = a.perfil_id
      where a.company_id = $1
        and a.status = 'ativo'
        and a.modulo = $2
        and a.tipo_documento = $3
        and a.acao = $4
        and a.valor_minimo <= $5
        and (a.valor_maximo is null or a.valor_maximo >= $5)
        and (a.usuario_id = $6 or a.perfil_id = any($7::uuid[]))
        and (a.obra_id is null or a.obra_id = $8)
        and (a.centro_custo_id is null or a.centro_custo_id = $9)
      order by
        (a.usuario_id is not null) desc,
        (a.obra_id is not null) desc,
        (a.centro_custo_id is not null) desc,
        a.valor_minimo desc,
        a.valor_maximo asc nulls last,
        a.created_at desc
      limit 1
      `,
      params
    );
    const rule = rules.rows[0];
    const aprovado = Boolean(rule && rule.efeito === 'PERMITIR');
    await audit(client, user.company_id, 'alcada_validacao', rule?.id || null, 'validar', {
      usuario_id: usuarioId,
      modulo,
      tipo_documento: tipoDocumento,
      acao,
      valor,
      resultado: aprovado ? 'PERMITIDO' : 'NEGADO'
    });
    return {
      aprovado,
      decisao: aprovado ? 'PERMITIDO' : 'NEGADO',
      motivo: rule ? `Regra ${rule.efeito} encontrada.` : 'Nenhuma alcada ativa cobre usuario, perfil, modulo, acao, tipo de documento e valor.',
      usuario: user,
      perfis: perfis.rows,
      regra: rule || null
    };
  } finally {
    client.release();
  }
};

const handleSimpleCollection = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  options: BaseHandlerOptions,
  handlers: {
    list: (url: URL) => Promise<QueryResultRow[]>;
    get?: (id: string) => Promise<QueryResultRow | undefined>;
    create: (payload: Record<string, unknown>) => Promise<QueryResultRow>;
    update?: (id: string, payload: Record<string, unknown>) => Promise<QueryResultRow>;
    inativar?: (id: string) => Promise<QueryResultRow>;
    reativar?: (id: string) => Promise<QueryResultRow>;
  }
): Promise<void> => {
  const method = req.method || 'GET';
  const relativePath = url.pathname === options.basePath ? '' : url.pathname.slice(options.basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await handlers.list(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await handlers.create(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (method === 'GET' && handlers.get) {
        const row = await handlers.get(id);
        if (!row) {
          sendError(res, 404, 'not_found', `${options.entityName} nao encontrado.`);
          return;
        }
        sendJson(res, 200, { data: row });
        return;
      }
      if (method === 'PATCH' && handlers.update) {
        sendJson(res, 200, { data: await handlers.update(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, handlers.get ? ['GET', 'PATCH'] : ['PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'inativar' && handlers.inativar) {
        sendJson(res, 200, { data: await handlers.inativar(id) });
        return;
      }
      if (action === 'reativar' && handlers.reativar) {
        sendJson(res, 200, { data: await handlers.reativar(id) });
        return;
      }
      sendError(res, 404, 'not_found', `Acao de ${options.entityName} nao encontrada.`);
      return;
    }

    sendError(res, 404, 'not_found', `Rota de ${options.entityName} nao encontrada.`);
  } catch (error) {
    handleError(res, error, options.entityName);
  }
};

export const handlePerfis = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> =>
  handleSimpleCollection(req, res, url, { basePath: '/perfis', entityName: 'Perfil' }, {
    list: listPerfis,
    get: getPerfil,
    create: createPerfil,
    update: updatePerfil,
    inativar: (id) =>
      changeSimpleStatus('perfis', id, 'inativo', 'id, company_id, nome, descricao, escopo_padrao, status, created_at, updated_at', 'perfil'),
    reativar: (id) =>
      changeSimpleStatus('perfis', id, 'ativo', 'id, company_id, nome, descricao, escopo_padrao, status, created_at, updated_at', 'perfil')
  });

export const handleEscopos = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> =>
  handleSimpleCollection(req, res, url, { basePath: '/escopos', entityName: 'Escopo' }, {
    list: listEscopos,
    create: createEscopo,
    update: updateEscopo,
    inativar: (id) =>
      changeSimpleStatus('escopos_acesso', id, 'inativo', 'id, company_id, modulo, acao, descricao, status, created_at, updated_at', 'escopo'),
    reativar: (id) =>
      changeSimpleStatus('escopos_acesso', id, 'ativo', 'id, company_id, modulo, acao, descricao, status, created_at, updated_at', 'escopo')
  });

export const handleUsuariosPerfis = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> =>
  handleSimpleCollection(req, res, url, { basePath: '/usuarios-perfis', entityName: 'Vinculo usuario-perfil' }, {
    list: async () => listUsuariosPerfis(),
    create: createUsuarioPerfil,
    inativar: (id) => updateUsuarioPerfilStatus(id, 'inativo'),
    reativar: (id) => updateUsuarioPerfilStatus(id, 'ativo')
  });

export const handlePerfisEscopos = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> =>
  handleSimpleCollection(req, res, url, { basePath: '/perfis-escopos', entityName: 'Vinculo perfil-escopo' }, {
    list: async () => listPerfisEscopos(),
    create: createPerfilEscopo,
    inativar: (id) => updatePerfilEscopoStatus(id, 'inativo'),
    reativar: (id) => updatePerfilEscopoStatus(id, 'ativo')
  });

export const handleAlcadas = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/alcadas';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'validar') {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 200, { data: await validateAlcada(await readJsonBody(req)) });
      return;
    }

    await handleSimpleCollection(req, res, url, { basePath, entityName: 'Alcada' }, {
      list: listAlcadas,
      create: createAlcada,
      update: updateAlcada,
      inativar: (id) =>
        changeSimpleStatus('alcadas_aprovacao', id, 'inativo', 'id, company_id, usuario_id, perfil_id, modulo, tipo_documento, acao, obra_id, centro_custo_id, valor_minimo, valor_maximo, efeito, observacoes, status, created_at, updated_at', 'alcada'),
      reativar: (id) =>
        changeSimpleStatus('alcadas_aprovacao', id, 'ativo', 'id, company_id, usuario_id, perfil_id, modulo, tipo_documento, acao, obra_id, centro_custo_id, valor_minimo, valor_maximo, efeito, observacoes, status, created_at, updated_at', 'alcada')
    });
  } catch (error) {
    handleError(res, error, 'Alcada');
  }
};
