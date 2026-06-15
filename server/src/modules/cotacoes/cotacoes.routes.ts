import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type CotacaoStatus = 'RASCUNHO' | 'RECEBIDA' | 'DESCLASSIFICADA' | 'SELECIONADA' | 'CANCELADA';
type SolicitacaoStatus =
  | 'RASCUNHO'
  | 'ENVIADA'
  | 'EM_ANALISE'
  | 'APROVADA_PARA_COTACAO'
  | 'DEVOLVIDA'
  | 'CANCELADA';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface SolicitacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  codigo: string;
  titulo: string;
  status: SolicitacaoStatus;
  obra_codigo: string | null;
  obra_nome: string | null;
  centro_custo_codigo: string | null;
  centro_custo_nome: string | null;
}

interface SolicitacaoItemRow extends QueryResultRow {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  ordem: number;
}

interface ExistingCotacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  solicitacao_compra_id: string;
  fornecedor_id: string;
  status: CotacaoStatus;
}

interface NormalizedCotacaoItem {
  solicitacao_item_id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes: string | null;
  ordem: number;
}

interface NormalizedCotacaoPayload {
  company_id: string;
  solicitacao_compra_id: string;
  fornecedor_id: string;
  data_recebimento: string;
  validade_proposta: string | null;
  prazo_entrega_dias: number | null;
  condicao_pagamento: string | null;
  frete: string | null;
  observacoes: string | null;
  itens: NormalizedCotacaoItem[];
  valor_total: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses: CotacaoStatus[] = ['RASCUNHO', 'RECEBIDA', 'DESCLASSIFICADA', 'SELECIONADA', 'CANCELADA'];
const lockedForEdit: CotacaoStatus[] = ['DESCLASSIFICADA', 'SELECIONADA', 'CANCELADA'];

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

const normalizeDate = (payload: Record<string, unknown>, fieldName: string, required: boolean): string | null => {
  const rawValue = required ? requiredText(payload, fieldName) : optionalText(payload, fieldName);
  if (!rawValue) {
    return null;
  }
  if (!datePattern.test(rawValue)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return rawValue;
};

const normalizeNumber = (value: unknown, fieldName: string): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo numerico invalido: ${fieldName}.`);
  }
  return normalized;
};

const normalizeOptionalInteger = (value: unknown, fieldName: string): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const parsed = normalizeNumber(value, fieldName);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser inteiro maior ou igual a zero.`);
  }
  return parsed;
};

const normalizeStatus = (value: unknown): CotacaoStatus => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!statuses.includes(normalized as CotacaoStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${statuses.join(', ')}.`);
  }
  return normalized as CotacaoStatus;
};

const sumItems = (items: NormalizedCotacaoItem[]): number =>
  Number(items.reduce((total, item) => total + item.valor_total, 0).toFixed(2));

const generateCodigo = (): string => {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `COT-${datePart}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const fetchSolicitacao = async (client: PoolClient, solicitacaoId: string): Promise<SolicitacaoRow | undefined> => {
  const result = await client.query<SolicitacaoRow>(
    `
    select
      s.id,
      s.company_id,
      s.codigo,
      s.titulo,
      s.status,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome
    from solicitacoes_compra s
    left join obras o on o.id = s.obra_id
    left join centros_custo cc on cc.id = s.centro_custo_id
    where s.id = $1
    `,
    [solicitacaoId]
  );
  return result.rows[0];
};

const fetchSolicitacaoItems = async (client: PoolClient, solicitacaoId: string): Promise<SolicitacaoItemRow[]> => {
  const result = await client.query<SolicitacaoItemRow>(
    `
    select id, descricao, unidade, quantidade, ordem
    from solicitacoes_compra_itens
    where solicitacao_id = $1 and status = 'ATIVO'
    order by ordem, created_at
    `,
    [solicitacaoId]
  );
  return result.rows;
};

const assertSolicitacaoCanQuote = (solicitacao: SolicitacaoRow): void => {
  if (solicitacao.status !== 'EM_ANALISE') {
    throw new HttpError(
      409,
      'status_conflict',
      `Solicitacao em status ${solicitacao.status} nao permite cotacao. Use EM_ANALISE.`
    );
  }
};

const validateFornecedor = async (client: PoolClient, companyId: string, fornecedorId: string): Promise<void> => {
  const result = await client.query(
    'select id from fornecedores where id = $1 and company_id = $2 and status = $3',
    [fornecedorId, companyId, 'ativo']
  );
  if (!result.rows[0]) {
    throw new HttpError(400, 'validation_error', 'Fornecedor invalido ou inativo para a empresa.');
  }
};

const normalizeItems = (
  value: unknown,
  solicitationItems: SolicitacaoItemRow[],
  required: boolean
): NormalizedCotacaoItem[] | undefined => {
  if (value === undefined) {
    if (required) {
      throw new HttpError(400, 'validation_error', 'Todos os itens da solicitacao devem ser cotados.');
    }
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'validation_error', 'Todos os itens da solicitacao devem ser cotados.');
  }

  if (value.length !== solicitationItems.length) {
    throw new HttpError(400, 'validation_error', 'Cotacao deve conter exatamente os itens ativos da solicitacao.');
  }

  const itemById = new Map(solicitationItems.map((item) => [item.id, item]));
  const usedIds = new Set<string>();

  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} invalido.`);
    }

    const itemPayload = item as Record<string, unknown>;
    const solicitacaoItemId = assertUuid(itemPayload.solicitacao_item_id, `itens[${index}].solicitacao_item_id`);
    const sourceItem = itemById.get(solicitacaoItemId);
    if (!sourceItem) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} nao pertence a solicitacao.`);
    }
    if (usedIds.has(solicitacaoItemId)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} duplicado na cotacao.`);
    }
    usedIds.add(solicitacaoItemId);

    const valorUnitario = normalizeNumber(itemPayload.valor_unitario, `itens[${index}].valor_unitario`);
    if (valorUnitario < 0) {
      throw new HttpError(400, 'validation_error', `Valor unitario deve ser maior ou igual a zero no item ${index + 1}.`);
    }

    const quantidade = Number(sourceItem.quantidade);
    const valorTotal = Number((quantidade * valorUnitario).toFixed(2));

    return {
      solicitacao_item_id: solicitacaoItemId,
      descricao: sourceItem.descricao,
      unidade: sourceItem.unidade,
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      observacoes: optionalText(itemPayload, 'observacoes'),
      ordem: sourceItem.ordem
    };
  });
};

const normalizeCreatePayload = async (client: PoolClient, payload: Record<string, unknown>): Promise<NormalizedCotacaoPayload> => {
  const companyId = assertUuid(payload.company_id, 'company_id');
  const solicitacaoId = assertUuid(payload.solicitacao_compra_id, 'solicitacao_compra_id');
  const fornecedorId = assertUuid(payload.fornecedor_id, 'fornecedor_id');
  const solicitacao = await fetchSolicitacao(client, solicitacaoId);
  if (!solicitacao || solicitacao.company_id !== companyId) {
    throw new HttpError(400, 'validation_error', 'Solicitacao invalida para a empresa.');
  }
  assertSolicitacaoCanQuote(solicitacao);
  await validateFornecedor(client, companyId, fornecedorId);

  const solicitationItems = await fetchSolicitacaoItems(client, solicitacaoId);
  const itens = normalizeItems(payload.itens, solicitationItems, true) as NormalizedCotacaoItem[];

  return {
    company_id: companyId,
    solicitacao_compra_id: solicitacaoId,
    fornecedor_id: fornecedorId,
    data_recebimento: normalizeDate(payload, 'data_recebimento', true) as string,
    validade_proposta: normalizeDate(payload, 'validade_proposta', false),
    prazo_entrega_dias: normalizeOptionalInteger(payload.prazo_entrega_dias, 'prazo_entrega_dias'),
    condicao_pagamento: optionalText(payload, 'condicao_pagamento'),
    frete: optionalText(payload, 'frete'),
    observacoes: optionalText(payload, 'observacoes'),
    itens,
    valor_total: sumItems(itens)
  };
};

const insertItems = async (client: PoolClient, cotacaoId: string, items: NormalizedCotacaoItem[]): Promise<void> => {
  for (const item of items) {
    await client.query(
      `
      insert into cotacoes_itens (
        cotacao_id, solicitacao_item_id, descricao, unidade, quantidade,
        valor_unitario, valor_total, observacoes, ordem, status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ATIVO')
      `,
      [
        cotacaoId,
        item.solicitacao_item_id,
        item.descricao,
        item.unidade,
        item.quantidade,
        item.valor_unitario,
        item.valor_total,
        item.observacoes,
        item.ordem
      ]
    );
  }
};

const fetchCotacao = async (client: PoolClient, id: string) => {
  const header = await client.query(
    `
    select
      c.id,
      c.company_id,
      c.solicitacao_compra_id,
      c.fornecedor_id,
      c.codigo,
      c.valor_total,
      c.prazo_entrega,
      c.prazo_entrega_dias,
      c.condicao_pagamento,
      c.frete,
      c.recomendada,
      c.justificativa,
      c.data_recebimento,
      c.validade_proposta,
      c.status,
      c.observacoes,
      c.motivo_desclassificacao,
      c.selecionada_em,
      c.created_at,
      c.updated_at,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo
    from cotacoes c
    join fornecedores f on f.id = c.fornecedor_id
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    where c.id = $1
    `,
    [id]
  );

  const cotacao = header.rows[0];
  if (!cotacao) {
    return undefined;
  }

  const items = await client.query(
    `
    select
      id,
      cotacao_id,
      solicitacao_item_id,
      descricao,
      unidade,
      quantidade,
      valor_unitario,
      valor_total,
      observacoes,
      ordem,
      created_at,
      updated_at
    from cotacoes_itens
    where cotacao_id = $1 and status = 'ATIVO'
    order by ordem, created_at
    `,
    [id]
  );

  return {
    ...cotacao,
    itens: items.rows
  };
};

const listCotacoes = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const solicitacaoId = url.searchParams.get('solicitacao_compra_id');
  if (solicitacaoId) {
    params.push(assertUuid(solicitacaoId, 'solicitacao_compra_id'));
    conditions.push(`c.solicitacao_compra_id = $${params.length}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    params.push(assertUuid(fornecedorId, 'fornecedor_id'));
    conditions.push(`c.fornecedor_id = $${params.length}`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`c.status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      c.id,
      c.company_id,
      c.solicitacao_compra_id,
      c.fornecedor_id,
      c.codigo,
      c.valor_total,
      c.prazo_entrega_dias,
      c.condicao_pagamento,
      c.frete,
      c.recomendada,
      c.data_recebimento,
      c.validade_proposta,
      c.status,
      c.created_at,
      c.updated_at,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo,
      count(i.id)::int as itens_count
    from cotacoes c
    join fornecedores f on f.id = c.fornecedor_id
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    left join cotacoes_itens i on i.cotacao_id = c.id and i.status = 'ATIVO'
    ${where}
    group by c.id, f.nome, f.cpf_cnpj, s.codigo, s.titulo
    order by c.created_at desc
    `,
    params
  );
  return result.rows;
};

const createCotacao = async (payload: Record<string, unknown>) => {
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const normalized = await normalizeCreatePayload(client, payload);

    const created = await client.query<{ id: string }>(
      `
      insert into cotacoes (
        company_id, solicitacao_compra_id, fornecedor_id, codigo, valor_total,
        prazo_entrega, prazo_entrega_dias, condicao_pagamento, frete,
        data_recebimento, validade_proposta, status, observacoes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'RECEBIDA', $12)
      returning id
      `,
      [
        normalized.company_id,
        normalized.solicitacao_compra_id,
        normalized.fornecedor_id,
        generateCodigo(),
        normalized.valor_total,
        normalized.prazo_entrega_dias === null ? null : `${normalized.prazo_entrega_dias} dias`,
        normalized.prazo_entrega_dias,
        normalized.condicao_pagamento,
        normalized.frete,
        normalized.data_recebimento,
        normalized.validade_proposta,
        normalized.observacoes
      ]
    );

    await insertItems(client, created.rows[0].id, normalized.itens);
    const cotacao = await fetchCotacao(client, created.rows[0].id);
    await client.query('commit');
    return cotacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const getExistingForUpdate = async (client: PoolClient, id: string): Promise<ExistingCotacaoRow | undefined> => {
  const result = await client.query<ExistingCotacaoRow>(
    `
    select id, company_id, solicitacao_compra_id, fornecedor_id, status
    from cotacoes
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const updateCotacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = [
    'fornecedor_id',
    'data_recebimento',
    'validade_proposta',
    'prazo_entrega_dias',
    'condicao_pagamento',
    'frete',
    'observacoes',
    'itens'
  ];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();

  try {
    await client.query('begin');
    const existing = await getExistingForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }
    if (lockedForEdit.includes(existing.status)) {
      throw new HttpError(409, 'status_conflict', `Cotacao em status ${existing.status} nao permite edicao.`);
    }

    const solicitacao = await fetchSolicitacao(client, existing.solicitacao_compra_id);
    if (!solicitacao) {
      throw new HttpError(400, 'validation_error', 'Solicitacao vinculada nao encontrada.');
    }
    assertSolicitacaoCanQuote(solicitacao);

    const updates: Array<{ column: string; value: unknown }> = [];
    const finalFornecedorId = payload.fornecedor_id === undefined
      ? existing.fornecedor_id
      : assertUuid(payload.fornecedor_id, 'fornecedor_id');

    if (payload.fornecedor_id !== undefined) {
      await validateFornecedor(client, existing.company_id, finalFornecedorId);
      updates.push({ column: 'fornecedor_id', value: finalFornecedorId });
    }

    if (payload.data_recebimento !== undefined) {
      updates.push({ column: 'data_recebimento', value: normalizeDate(payload, 'data_recebimento', true) });
    }
    if (payload.validade_proposta !== undefined) {
      updates.push({ column: 'validade_proposta', value: normalizeDate(payload, 'validade_proposta', false) });
    }
    if (payload.prazo_entrega_dias !== undefined) {
      const prazo = normalizeOptionalInteger(payload.prazo_entrega_dias, 'prazo_entrega_dias');
      updates.push({ column: 'prazo_entrega_dias', value: prazo });
      updates.push({ column: 'prazo_entrega', value: prazo === null ? null : `${prazo} dias` });
    }
    if (payload.condicao_pagamento !== undefined) {
      updates.push({ column: 'condicao_pagamento', value: optionalText(payload, 'condicao_pagamento') });
    }
    if (payload.frete !== undefined) {
      updates.push({ column: 'frete', value: optionalText(payload, 'frete') });
    }
    if (payload.observacoes !== undefined) {
      updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    }

    if (payload.itens !== undefined) {
      const solicitationItems = await fetchSolicitacaoItems(client, existing.solicitacao_compra_id);
      const items = normalizeItems(payload.itens, solicitationItems, true) as NormalizedCotacaoItem[];
      await client.query(
        `
        update cotacoes_itens
        set status = 'SUBSTITUIDO', updated_at = now()
        where cotacao_id = $1 and status = 'ATIVO'
        `,
        [id]
      );
      await insertItems(client, id, items);
      updates.push({ column: 'valor_total', value: sumItems(items) });
    }

    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update cotacoes
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      `,
      [...updates.map((update) => update.value), id]
    );

    const cotacao = await fetchCotacao(client, id);
    await client.query('commit');
    return cotacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const transitionCotacao = async (id: string, action: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const existing = await getExistingForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }

    if (action === 'receber') {
      if (existing.status !== 'RASCUNHO') {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${existing.status} -> RECEBIDA.`);
      }
      await client.query('update cotacoes set status = $1, updated_at = now() where id = $2', ['RECEBIDA', id]);
    } else if (action === 'desclassificar') {
      if (!['RASCUNHO', 'RECEBIDA'].includes(existing.status)) {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${existing.status} -> DESCLASSIFICADA.`);
      }
      await client.query(
        `
        update cotacoes
        set status = 'DESCLASSIFICADA', motivo_desclassificacao = $1, recomendada = false, updated_at = now()
        where id = $2
        `,
        [optionalText(payload, 'motivo_desclassificacao') || 'Desclassificada na V3.4B local.', id]
      );
    } else if (action === 'selecionar') {
      if (existing.status !== 'RECEBIDA') {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${existing.status} -> SELECIONADA.`);
      }
      const solicitacao = await fetchSolicitacao(client, existing.solicitacao_compra_id);
      if (!solicitacao) {
        throw new HttpError(400, 'validation_error', 'Solicitacao vinculada nao encontrada.');
      }
      assertSolicitacaoCanQuote(solicitacao);

      await client.query(
        `
        update cotacoes
        set status = 'RECEBIDA', recomendada = false, selecionada_em = null, updated_at = now()
        where solicitacao_compra_id = $1 and status = 'SELECIONADA'
        `,
        [existing.solicitacao_compra_id]
      );
      await client.query(
        `
        update cotacoes
        set status = 'SELECIONADA', recomendada = true, justificativa = $1, selecionada_em = now(), updated_at = now()
        where id = $2
        `,
        [optionalText(payload, 'justificativa') || 'Selecionada no mapa comparativo V3.4B local.', id]
      );
    } else if (action === 'cancelar') {
      if (!['RASCUNHO', 'RECEBIDA'].includes(existing.status)) {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${existing.status} -> CANCELADA.`);
      }
      await client.query(
        `
        update cotacoes
        set status = 'CANCELADA', recomendada = false, updated_at = now()
        where id = $1
        `,
        [id]
      );
    } else {
      throw new HttpError(404, 'not_found', 'Acao de cotacao nao encontrada.');
    }

    const cotacao = await fetchCotacao(client, id);
    await client.query('commit');
    return cotacao;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const buildMapaComparativo = async (solicitacaoId: string) => {
  assertUuid(solicitacaoId, 'solicitacao_compra_id');
  const client = await getPool().connect();

  try {
    const solicitacao = await fetchSolicitacao(client, solicitacaoId);
    if (!solicitacao) {
      throw new HttpError(404, 'not_found', 'Solicitacao de compra nao encontrada.');
    }

    const solicitationItems = await fetchSolicitacaoItems(client, solicitacaoId);
    const cotacoes = await client.query(
      `
      select
        c.id,
        c.codigo,
        c.fornecedor_id,
        f.nome as fornecedor_nome,
        f.cpf_cnpj as fornecedor_cpf_cnpj,
        c.valor_total,
        c.prazo_entrega_dias,
        c.condicao_pagamento,
        c.frete,
        c.status,
        c.recomendada,
        c.data_recebimento,
        c.validade_proposta
      from cotacoes c
      join fornecedores f on f.id = c.fornecedor_id
      where c.solicitacao_compra_id = $1
      order by c.valor_total asc, c.created_at asc
      `,
      [solicitacaoId]
    );

    const cotacaoItems = await client.query(
      `
      select
        i.cotacao_id,
        i.solicitacao_item_id,
        i.valor_unitario,
        i.valor_total
      from cotacoes_itens i
      join cotacoes c on c.id = i.cotacao_id
      where c.solicitacao_compra_id = $1 and i.status = 'ATIVO'
      `,
      [solicitacaoId]
    );

    const quoteItemsBySolicitationItem = new Map<string, QueryResultRow[]>();
    cotacaoItems.rows.forEach((item) => {
      const key = String(item.solicitacao_item_id);
      const current = quoteItemsBySolicitationItem.get(key) || [];
      current.push(item);
      quoteItemsBySolicitationItem.set(key, current);
    });

    const comparableQuotes = cotacoes.rows.filter((cotacao) => !['DESCLASSIFICADA', 'CANCELADA'].includes(String(cotacao.status)));
    const menorTotal = comparableQuotes[0];
    const selecionada = cotacoes.rows.find((cotacao) => cotacao.status === 'SELECIONADA');

    return {
      solicitacao,
      resumo: {
        total_cotacoes: cotacoes.rows.length,
        total_cotacoes_comparaveis: comparableQuotes.length,
        cotacao_menor_total: menorTotal || null,
        cotacao_selecionada: selecionada || null
      },
      cotacoes: cotacoes.rows,
      itens: solicitationItems.map((item) => {
        const itemQuotes = quoteItemsBySolicitationItem.get(item.id) || [];
        const comparableItems = itemQuotes
          .filter((quoteItem) => {
            const cotacao = cotacoes.rows.find((row) => row.id === quoteItem.cotacao_id);
            return cotacao && !['DESCLASSIFICADA', 'CANCELADA'].includes(String(cotacao.status));
          })
          .sort((left, right) => Number(left.valor_total) - Number(right.valor_total));
        const bestItem = comparableItems[0];

        return {
          id: item.id,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          ordem: item.ordem,
          melhor_cotacao_id: bestItem?.cotacao_id || null,
          comparativos: itemQuotes.map((quoteItem) => {
            const cotacao = cotacoes.rows.find((row) => row.id === quoteItem.cotacao_id);
            return {
              cotacao_id: quoteItem.cotacao_id,
              cotacao_codigo: cotacao?.codigo || null,
              fornecedor_nome: cotacao?.fornecedor_nome || null,
              status: cotacao?.status || null,
              valor_unitario: quoteItem.valor_unitario,
              valor_total: quoteItem.valor_total,
              melhor_valor: bestItem?.cotacao_id === quoteItem.cotacao_id
            };
          })
        };
      })
    };
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
    sendError(res, 409, 'unique_violation', 'Cotacao duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para cotacao.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleCotacoes = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/cotacoes';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'mapa-comparativo') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      const solicitacaoId = url.searchParams.get('solicitacao_compra_id');
      if (!solicitacaoId) {
        throw new HttpError(400, 'validation_error', 'Informe solicitacao_compra_id.');
      }
      sendJson(res, 200, { data: await buildMapaComparativo(solicitacaoId) });
      return;
    }

    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listCotacoes(url) });
        return;
      }

      if (method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, 201, { data: await createCotacao(payload) });
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
          const cotacao = await fetchCotacao(client, id);
          if (!cotacao) {
            sendError(res, 404, 'not_found', 'Cotacao nao encontrada.');
            return;
          }
          sendJson(res, 200, { data: cotacao });
        } finally {
          client.release();
        }
        return;
      }

      if (method === 'PATCH') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await updateCotacao(id, payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      const payload = await readJsonBody(req);
      sendJson(res, 200, { data: await transitionCotacao(id, action, payload) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de cotacao nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
