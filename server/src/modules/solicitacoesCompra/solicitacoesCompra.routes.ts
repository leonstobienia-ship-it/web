import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type Prioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
type SolicitacaoStatus =
  | 'RASCUNHO'
  | 'ENVIADA'
  | 'EM_ANALISE'
  | 'APROVADA_PARA_COTACAO'
  | 'DEVOLVIDA'
  | 'CANCELADA';

interface NormalizedItem {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_estimado_unitario: number;
  valor_estimado_total: number;
  observacoes: string | null;
  ordem: number;
}

interface CreateSolicitacaoPayload {
  company_id: string;
  obra_id: string;
  centro_custo_id: string;
  solicitante_id: string;
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  data_necessidade: string;
  observacoes: string | null;
  itens: NormalizedItem[];
  valor_estimado_total: number;
}

interface ExistingSolicitacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  obra_id: string;
  centro_custo_id: string;
  solicitante_id: string;
  status: SolicitacaoStatus;
}

interface PgErrorLike {
  code?: string;
  detail?: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const priorities: Prioridade[] = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'];
const statuses: SolicitacaoStatus[] = ['RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'APROVADA_PARA_COTACAO', 'DEVOLVIDA', 'CANCELADA'];
const lockedForEdit: SolicitacaoStatus[] = ['CANCELADA', 'APROVADA_PARA_COTACAO'];

const transitions: Record<string, { from: SolicitacaoStatus[]; to: SolicitacaoStatus }> = {
  enviar: { from: ['RASCUNHO'], to: 'ENVIADA' },
  'em-analise': { from: ['ENVIADA'], to: 'EM_ANALISE' },
  devolver: { from: ['EM_ANALISE'], to: 'DEVOLVIDA' },
  'reabrir-rascunho': { from: ['DEVOLVIDA'], to: 'RASCUNHO' },
  cancelar: { from: ['RASCUNHO', 'ENVIADA', 'EM_ANALISE'], to: 'CANCELADA' }
};

const assertUuid = (value: unknown, fieldName: string): string => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
  }
  return normalized;
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
  const value = payload[fieldName];
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeDate = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = requiredText(payload, fieldName);
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const normalizeNumber = (value: unknown, fieldName: string): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo numerico invalido: ${fieldName}.`);
  }
  return normalized;
};

const normalizePriority = (value: unknown): Prioridade => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!priorities.includes(normalized as Prioridade)) {
    throw new HttpError(400, 'validation_error', `Prioridade invalida. Use: ${priorities.join(', ')}.`);
  }
  return normalized as Prioridade;
};

const normalizeStatus = (value: unknown): SolicitacaoStatus => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!statuses.includes(normalized as SolicitacaoStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${statuses.join(', ')}.`);
  }
  return normalized as SolicitacaoStatus;
};

const normalizeItems = (value: unknown, required: boolean): NormalizedItem[] | undefined => {
  if (value === undefined) {
    if (required) {
      throw new HttpError(400, 'validation_error', 'Pelo menos 1 item e obrigatorio.');
    }
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'validation_error', 'Pelo menos 1 item e obrigatorio.');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} invalido.`);
    }

    const itemPayload = item as Record<string, unknown>;
    const quantidade = normalizeNumber(itemPayload.quantidade, `itens[${index}].quantidade`);
    const valorUnitario = itemPayload.valor_estimado_unitario === null || itemPayload.valor_estimado_unitario === undefined
      ? 0
      : normalizeNumber(itemPayload.valor_estimado_unitario, `itens[${index}].valor_estimado_unitario`);

    if (quantidade <= 0) {
      throw new HttpError(400, 'validation_error', `Quantidade deve ser maior que zero no item ${index + 1}.`);
    }

    if (valorUnitario < 0) {
      throw new HttpError(400, 'validation_error', `Valor unitario deve ser maior ou igual a zero no item ${index + 1}.`);
    }

    return {
      descricao: requiredText(itemPayload, 'descricao'),
      unidade: requiredText(itemPayload, 'unidade'),
      quantidade,
      valor_estimado_unitario: valorUnitario,
      valor_estimado_total: Number((quantidade * valorUnitario).toFixed(2)),
      observacoes: optionalText(itemPayload, 'observacoes'),
      ordem: index + 1
    };
  });
};

const sumItems = (items: NormalizedItem[]): number =>
  Number(items.reduce((total, item) => total + item.valor_estimado_total, 0).toFixed(2));

const normalizeCreatePayload = (payload: Record<string, unknown>): CreateSolicitacaoPayload => {
  const itens = normalizeItems(payload.itens, true) as NormalizedItem[];

  return {
    company_id: assertUuid(payload.company_id, 'company_id'),
    obra_id: assertUuid(payload.obra_id, 'obra_id'),
    centro_custo_id: assertUuid(payload.centro_custo_id, 'centro_custo_id'),
    solicitante_id: assertUuid(payload.solicitante_id, 'solicitante_id'),
    titulo: requiredText(payload, 'titulo'),
    descricao: requiredText(payload, 'descricao'),
    prioridade: normalizePriority(payload.prioridade),
    data_necessidade: normalizeDate(payload, 'data_necessidade'),
    observacoes: optionalText(payload, 'observacoes'),
    itens,
    valor_estimado_total: sumItems(itens)
  };
};

const validateReferences = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  centroCustoId: string,
  solicitanteId: string
): Promise<void> => {
  const refs = await client.query<{
    obra_exists: boolean;
    centro_custo_exists: boolean;
    solicitante_exists: boolean;
  }>(
    `
    select
      exists(select 1 from obras where id = $1 and company_id = $4) as obra_exists,
      exists(select 1 from centros_custo where id = $2 and company_id = $4) as centro_custo_exists,
      exists(select 1 from usuarios where id = $3 and company_id = $4) as solicitante_exists
    `,
    [obraId, centroCustoId, solicitanteId, companyId]
  );

  const row = refs.rows[0];
  const missing = [
    row?.obra_exists ? '' : 'obra_id',
    row?.centro_custo_exists ? '' : 'centro_custo_id',
    row?.solicitante_exists ? '' : 'solicitante_id'
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new HttpError(400, 'validation_error', 'Referencias invalidas para a solicitacao.', missing);
  }
};

const generateCodigo = (): string => {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `SC-${datePart}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const insertItems = async (client: PoolClient, solicitacaoId: string, items: NormalizedItem[]): Promise<void> => {
  for (const item of items) {
    await client.query(
      `
      insert into solicitacoes_compra_itens (
        solicitacao_id, descricao, unidade, quantidade, valor_estimado_unitario,
        valor_estimado_total, observacoes, ordem, status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 'ATIVO')
      `,
      [
        solicitacaoId,
        item.descricao,
        item.unidade,
        item.quantidade,
        item.valor_estimado_unitario,
        item.valor_estimado_total,
        item.observacoes,
        item.ordem
      ]
    );
  }
};

const fetchSolicitacao = async (client: PoolClient, id: string) => {
  const header = await client.query(
    `
    select
      s.id,
      s.company_id,
      s.obra_id,
      s.centro_custo_id,
      s.solicitante_id,
      s.codigo,
      s.titulo,
      s.descricao,
      s.prioridade,
      s.data_necessidade,
      s.status,
      s.valor_estimado_total,
      s.observacoes,
      s.created_at,
      s.updated_at,
      s.created_by,
      s.updated_by,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      u.nome as solicitante_nome
    from solicitacoes_compra s
    left join obras o on o.id = s.obra_id
    left join centros_custo cc on cc.id = s.centro_custo_id
    left join usuarios u on u.id = s.solicitante_id
    where s.id = $1
    `,
    [id]
  );

  const solicitacao = header.rows[0];
  if (!solicitacao) {
    return undefined;
  }

  const items = await client.query(
    `
    select
      id,
      solicitacao_id,
      descricao,
      unidade,
      quantidade,
      valor_estimado_unitario,
      valor_estimado_total,
      observacoes,
      ordem,
      created_at,
      updated_at
    from solicitacoes_compra_itens
    where solicitacao_id = $1 and status = 'ATIVO'
    order by ordem, created_at
    `,
    [id]
  );

  return {
    ...solicitacao,
    itens: items.rows
  };
};

const listSolicitacoes = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`s.status = $${params.length}`);
  }

  const prioridade = url.searchParams.get('prioridade');
  if (prioridade) {
    params.push(normalizePriority(prioridade));
    conditions.push(`s.prioridade = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`s.obra_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const pool = getPool();
  const result = await pool.query(
    `
    select
      s.id,
      s.company_id,
      s.obra_id,
      s.centro_custo_id,
      s.solicitante_id,
      s.codigo,
      s.titulo,
      s.prioridade,
      s.data_necessidade,
      s.status,
      s.valor_estimado_total,
      s.created_at,
      s.updated_at,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      u.nome as solicitante_nome,
      count(i.id)::int as itens_count
    from solicitacoes_compra s
    left join obras o on o.id = s.obra_id
    left join centros_custo cc on cc.id = s.centro_custo_id
    left join usuarios u on u.id = s.solicitante_id
    left join solicitacoes_compra_itens i on i.solicitacao_id = s.id and i.status = 'ATIVO'
    ${where}
    group by s.id, o.codigo, o.nome, cc.codigo, cc.nome, u.nome
    order by s.created_at desc
    `,
    params
  );
  return result.rows;
};

const createSolicitacao = async (payload: Record<string, unknown>) => {
  const normalized = normalizeCreatePayload(payload);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    await validateReferences(client, normalized.company_id, normalized.obra_id, normalized.centro_custo_id, normalized.solicitante_id);

    const created = await client.query<{ id: string }>(
      `
      insert into solicitacoes_compra (
        company_id, obra_id, centro_custo_id, solicitante_id, tipo, codigo,
        titulo, descricao, prioridade, data_necessidade, data_necessaria,
        status, valor_estimado_total, observacoes
      )
      values ($1, $2, $3, $4, 'COMPRA', $5, $6, $7, $8, $9, $9, 'RASCUNHO', $10, $11)
      returning id
      `,
      [
        normalized.company_id,
        normalized.obra_id,
        normalized.centro_custo_id,
        normalized.solicitante_id,
        generateCodigo(),
        normalized.titulo,
        normalized.descricao,
        normalized.prioridade,
        normalized.data_necessidade,
        normalized.valor_estimado_total,
        normalized.observacoes
      ]
    );

    await insertItems(client, created.rows[0].id, normalized.itens);
    const solicitacao = await fetchSolicitacao(client, created.rows[0].id);
    await client.query('commit');
    return solicitacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const getExistingForUpdate = async (client: PoolClient, id: string): Promise<ExistingSolicitacaoRow | undefined> => {
  const result = await client.query<ExistingSolicitacaoRow>(
    `
    select id, company_id, obra_id, centro_custo_id, solicitante_id, status
    from solicitacoes_compra
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const updateSolicitacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = ['obra_id', 'centro_custo_id', 'solicitante_id', 'titulo', 'descricao', 'prioridade', 'data_necessidade', 'observacoes', 'itens'];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();

  try {
    await client.query('begin');
    const existing = await getExistingForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Solicitacao de compra nao encontrada.');
    }

    if (lockedForEdit.includes(existing.status)) {
      throw new HttpError(409, 'status_conflict', `Solicitacao em status ${existing.status} nao permite edicao.`);
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    const finalObraId = payload.obra_id === undefined ? existing.obra_id : assertUuid(payload.obra_id, 'obra_id');
    const finalCentroCustoId = payload.centro_custo_id === undefined ? existing.centro_custo_id : assertUuid(payload.centro_custo_id, 'centro_custo_id');
    const finalSolicitanteId = payload.solicitante_id === undefined ? existing.solicitante_id : assertUuid(payload.solicitante_id, 'solicitante_id');
    const items = normalizeItems(payload.itens, false);

    if (payload.obra_id !== undefined) {
      updates.push({ column: 'obra_id', value: finalObraId });
    }
    if (payload.centro_custo_id !== undefined) {
      updates.push({ column: 'centro_custo_id', value: finalCentroCustoId });
    }
    if (payload.solicitante_id !== undefined) {
      updates.push({ column: 'solicitante_id', value: finalSolicitanteId });
    }
    if (payload.titulo !== undefined) {
      updates.push({ column: 'titulo', value: requiredText(payload, 'titulo') });
    }
    if (payload.descricao !== undefined) {
      updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
    }
    if (payload.prioridade !== undefined) {
      updates.push({ column: 'prioridade', value: normalizePriority(payload.prioridade) });
    }
    if (payload.data_necessidade !== undefined) {
      const dataNecessidade = normalizeDate(payload, 'data_necessidade');
      updates.push({ column: 'data_necessidade', value: dataNecessidade });
      updates.push({ column: 'data_necessaria', value: dataNecessidade });
    }
    if (payload.observacoes !== undefined) {
      updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    }

    await validateReferences(client, existing.company_id, finalObraId, finalCentroCustoId, finalSolicitanteId);

    if (items) {
      await client.query(
        `
        update solicitacoes_compra_itens
        set status = 'SUBSTITUIDO', updated_at = now()
        where solicitacao_id = $1 and status = 'ATIVO'
        `,
        [id]
      );
      await insertItems(client, id, items);
      updates.push({ column: 'valor_estimado_total', value: sumItems(items) });
    }

    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update solicitacoes_compra
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      `,
      [...updates.map((update) => update.value), id]
    );

    const solicitacao = await fetchSolicitacao(client, id);
    await client.query('commit');
    return solicitacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const transitionSolicitacao = async (id: string, action: string) => {
  assertUuid(id, 'id');
  const transition = transitions[action];
  if (!transition) {
    throw new HttpError(404, 'not_found', 'Acao de solicitacao nao encontrada.');
  }

  const client = await getPool().connect();

  try {
    await client.query('begin');
    const existing = await getExistingForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Solicitacao de compra nao encontrada.');
    }

    if (!transition.from.includes(existing.status)) {
      throw new HttpError(
        409,
        'invalid_status_transition',
        `Transicao ilegal: ${existing.status} -> ${transition.to}.`
      );
    }

    await client.query(
      `
      update solicitacoes_compra
      set status = $1, updated_at = now()
      where id = $2
      `,
      [transition.to, id]
    );

    const solicitacao = await fetchSolicitacao(client, id);
    await client.query('commit');
    return solicitacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown): void => {
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
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para a solicitacao de compra.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleSolicitacoesCompra = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/solicitacoes-compra';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listSolicitacoes(url) });
        return;
      }

      if (method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, 201, { data: await createSolicitacao(payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');

      if (method === 'GET') {
        const client = await getPool().connect();
        try {
          const solicitacao = await fetchSolicitacao(client, id);
          if (!solicitacao) {
            sendError(res, 404, 'not_found', 'Solicitacao de compra nao encontrada.');
            return;
          }
          sendJson(res, 200, { data: solicitacao });
        } finally {
          client.release();
        }
        return;
      }

      if (method === 'PATCH') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await updateSolicitacao(id, payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      sendJson(res, 200, { data: await transitionSolicitacao(id, action) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de solicitacao de compra nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
