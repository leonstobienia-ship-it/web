import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QueryResultRow } from 'pg';
import { query } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type FieldKind = 'text' | 'uuid' | 'status' | 'tipo_pessoa' | 'uf' | 'number' | 'date' | 'enum';

export interface MasterField {
  column: string;
  required?: boolean;
  kind?: FieldKind;
  enumValues?: string[];
}

export interface MasterCadastroConfig {
  entityName: string;
  table: string;
  basePath: string;
  selectColumns: string[];
  fields: MasterField[];
  orderBy: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validStatuses = ['ativo', 'inativo'];
const validTiposPessoa = ['fisica', 'juridica'];
const validUfs = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
];

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const validateId = (id: string): void => {
  if (!uuidPattern.test(id)) {
    throw new HttpError(400, 'invalid_id', 'Id invalido. Use UUID.');
  }
};

const normalizeValue = (field: MasterField, rawValue: unknown): unknown => {
  if (rawValue === null || rawValue === undefined) {
    if (field.required) {
      throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${field.column}.`);
    }
    return null;
  }

  if (typeof rawValue === 'string' && rawValue.trim() === '') {
    if (field.required) {
      throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${field.column}.`);
    }
    return null;
  }

  const kind = field.kind || 'text';

  if (kind === 'number') {
    const value = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(',', '.'));
    if (!Number.isFinite(value)) {
      throw new HttpError(400, 'validation_error', `Campo numerico invalido: ${field.column}.`);
    }
    return value;
  }

  const value = String(rawValue).trim();

  if (kind === 'uuid') {
    if (!uuidPattern.test(value)) {
      throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${field.column}.`);
    }
    return value;
  }

  if (kind === 'status') {
    const normalized = value.toLowerCase();
    if (!validStatuses.includes(normalized)) {
      throw new HttpError(400, 'validation_error', `Status invalido. Use: ${validStatuses.join(', ')}.`);
    }
    return normalized;
  }

  if (kind === 'tipo_pessoa') {
    const normalized = value.toLowerCase();
    if (!validTiposPessoa.includes(normalized)) {
      throw new HttpError(400, 'validation_error', `tipo_pessoa invalido. Use: ${validTiposPessoa.join(', ')}.`);
    }
    return normalized;
  }

  if (kind === 'uf') {
    const normalized = value.toUpperCase();
    if (!validUfs.includes(normalized)) {
      throw new HttpError(400, 'validation_error', 'UF invalida. Use uma sigla brasileira com 2 caracteres.');
    }
    return normalized;
  }

  if (kind === 'date') {
    if (!datePattern.test(value)) {
      throw new HttpError(400, 'validation_error', `Data invalida em ${field.column}. Use YYYY-MM-DD.`);
    }
    return value;
  }

  if (kind === 'enum') {
    const normalized = value.toLowerCase();
    const allowed = field.enumValues || [];
    if (!allowed.includes(normalized)) {
      throw new HttpError(400, 'validation_error', `${field.column} invalido. Use: ${allowed.join(', ')}.`);
    }
    return normalized;
  }

  return value;
};

const normalizePayload = (
  config: MasterCadastroConfig,
  payload: Record<string, unknown>,
  mode: 'create' | 'update'
): Map<string, unknown> => {
  const fieldsByColumn = new Map(config.fields.map((field) => [field.column, field]));
  const unknownFields = Object.keys(payload).filter((key) => !fieldsByColumn.has(key));

  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const normalized = new Map<string, unknown>();

  for (const field of config.fields) {
    if (mode === 'create' && field.column === 'status' && !hasOwn(payload, 'status')) {
      normalized.set('status', 'ativo');
      continue;
    }

    if (!hasOwn(payload, field.column)) {
      if (mode === 'create' && field.required) {
        throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${field.column}.`);
      }
      continue;
    }

    normalized.set(field.column, normalizeValue(field, payload[field.column]));
  }

  if (normalized.size === 0) {
    throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
  }

  return normalized;
};

const buildReturning = (config: MasterCadastroConfig): string => config.selectColumns.join(', ');

const listRecords = async (config: MasterCadastroConfig): Promise<QueryResultRow[]> => {
  const result = await query(`
    select ${buildReturning(config)}
    from ${config.table}
    order by ${config.orderBy}
  `);
  return result.rows;
};

const getRecord = async (config: MasterCadastroConfig, id: string): Promise<QueryResultRow | undefined> => {
  validateId(id);
  const result = await query(
    `
    select ${buildReturning(config)}
    from ${config.table}
    where id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const createRecord = async (config: MasterCadastroConfig, payload: Record<string, unknown>): Promise<QueryResultRow> => {
  const normalized = normalizePayload(config, payload, 'create');
  const columns = Array.from(normalized.keys());
  const values = Array.from(normalized.values());
  const placeholders = columns.map((_column, index) => `$${index + 1}`);
  const result = await query(
    `
    insert into ${config.table} (${columns.join(', ')})
    values (${placeholders.join(', ')})
    returning ${buildReturning(config)}
    `,
    values
  );
  return result.rows[0];
};

const updateRecord = async (
  config: MasterCadastroConfig,
  id: string,
  payload: Record<string, unknown>
): Promise<QueryResultRow | undefined> => {
  validateId(id);
  const normalized = normalizePayload(config, payload, 'update');
  const columns = Array.from(normalized.keys());
  const values = Array.from(normalized.values());
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  const result = await query(
    `
    update ${config.table}
    set ${assignments.join(', ')}, updated_at = now()
    where id = $${columns.length + 1}
    returning ${buildReturning(config)}
    `,
    [...values, id]
  );
  return result.rows[0];
};

const changeStatus = async (
  config: MasterCadastroConfig,
  id: string,
  status: 'ativo' | 'inativo'
): Promise<QueryResultRow | undefined> => {
  validateId(id);
  const result = await query(
    `
    update ${config.table}
    set status = $1, updated_at = now()
    where id = $2
    returning ${buildReturning(config)}
    `,
    [status, id]
  );
  return result.rows[0];
};

const toPgError = (error: unknown): { code?: string; detail?: string } =>
  typeof error === 'object' && error !== null ? error as { code?: string; detail?: string } : {};

const handleCrudError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const pgError = toPgError(error);
  if (pgError.code === '23505') {
    sendError(res, 409, 'unique_violation', 'Registro duplicado para uma chave unica.', pgError.detail);
    return;
  }

  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para empresa, cliente ou centro de custo.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const createMasterCadastroHandler = (config: MasterCadastroConfig) =>
  async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
    const method = req.method || 'GET';
    const relativePath = url.pathname === config.basePath ? '' : url.pathname.slice(config.basePath.length);
    const parts = relativePath.split('/').filter(Boolean);

    try {
      if (parts.length === 0) {
        if (method === 'GET') {
          sendJson(res, 200, { data: await listRecords(config) });
          return;
        }

        if (method === 'POST') {
          const payload = await readJsonBody(req);
          sendJson(res, 201, { data: await createRecord(config, payload) });
          return;
        }

        methodNotAllowed(res, ['GET', 'POST']);
        return;
      }

      if (parts.length === 1) {
        const [id] = parts;

        if (method === 'GET') {
          const record = await getRecord(config, id);
          if (!record) {
            sendError(res, 404, 'not_found', `${config.entityName} nao encontrado.`);
            return;
          }
          sendJson(res, 200, { data: record });
          return;
        }

        if (method === 'PATCH') {
          const payload = await readJsonBody(req);
          const record = await updateRecord(config, id, payload);
          if (!record) {
            sendError(res, 404, 'not_found', `${config.entityName} nao encontrado.`);
            return;
          }
          sendJson(res, 200, { data: record });
          return;
        }

        methodNotAllowed(res, ['GET', 'PATCH']);
        return;
      }

      if (parts.length === 2 && method === 'PATCH') {
        const [id, action] = parts;
        if (action !== 'inativar' && action !== 'reativar') {
          sendError(res, 404, 'not_found', 'Acao de cadastro nao encontrada.');
          return;
        }

        const record = await changeStatus(config, id, action === 'inativar' ? 'inativo' : 'ativo');
        if (!record) {
          sendError(res, 404, 'not_found', `${config.entityName} nao encontrado.`);
          return;
        }

        sendJson(res, 200, { data: record });
        return;
      }

      sendError(res, 404, 'not_found', 'Rota de cadastro nao encontrada.');
    } catch (error) {
      handleCrudError(res, error);
    }
  };
