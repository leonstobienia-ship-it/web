import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type PedidoStatus =
  | 'RASCUNHO'
  | 'EMITIDO'
  | 'ENVIADO_FORNECEDOR'
  | 'CONFIRMADO'
  | 'PARCIALMENTE_RECEBIDO'
  | 'RECEBIDO'
  | 'CANCELADO';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface PedidoRow extends QueryResultRow {
  id: string;
  status: PedidoStatus;
}

interface CotacaoSourceRow extends QueryResultRow {
  cotacao_id: string;
  company_id: string;
  cotacao_status: string;
  cotacao_codigo: string;
  cotacao_titulo: string;
  solicitacao_id: string;
  solicitacao_codigo: string;
  solicitacao_titulo: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  fornecedor_vencedor_id: string | null;
  fornecedor_nome: string | null;
}

interface CotacaoFornecedorRow extends QueryResultRow {
  id: string;
  fornecedor_id: string;
  valor_total: string;
  prazo_entrega_dias: number | null;
  condicao_pagamento: string | null;
  status: string;
}

interface CotacaoItemRow extends QueryResultRow {
  id: string;
  solicitacao_item_id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  observacoes: string | null;
  ordem: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses: PedidoStatus[] = [
  'RASCUNHO',
  'EMITIDO',
  'ENVIADO_FORNECEDOR',
  'CONFIRMADO',
  'PARCIALMENTE_RECEBIDO',
  'RECEBIDO',
  'CANCELADO'
];
const editableStatuses: PedidoStatus[] = ['RASCUNHO'];
const cancelableStatuses: PedidoStatus[] = ['RASCUNHO', 'EMITIDO', 'ENVIADO_FORNECEDOR'];

const transitions: Record<string, { from: PedidoStatus[]; to: PedidoStatus }> = {
  emitir: { from: ['RASCUNHO'], to: 'EMITIDO' },
  'enviar-fornecedor': { from: ['EMITIDO'], to: 'ENVIADO_FORNECEDOR' },
  confirmar: { from: ['ENVIADO_FORNECEDOR'], to: 'CONFIRMADO' },
  cancelar: { from: cancelableStatuses, to: 'CANCELADO' }
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

const optionalDate = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = optionalText(payload, fieldName);
  if (!value) {
    return null;
  }
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const normalizeStatus = (value: string): PedidoStatus => {
  const normalized = value.trim().toUpperCase();
  if (!statuses.includes(normalized as PedidoStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${statuses.join(', ')}.`);
  }
  return normalized as PedidoStatus;
};

const generateCodigo = (): string => {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `PC-${datePart}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const sumItems = (items: CotacaoItemRow[]): number =>
  Number(items.reduce((total, item) => total + Number(item.valor_total), 0).toFixed(2));

const addDays = (date: string, days: number | null): string | null => {
  if (days === null) {
    return null;
  }
  const base = new Date(`${date}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
};

const fetchPedido = async (client: PoolClient, id: string) => {
  const header = await client.query(
    `
    select
      p.id,
      p.company_id,
      p.solicitacao_id,
      p.solicitacao_compra_id,
      p.cotacao_id,
      p.fornecedor_id,
      p.obra_id,
      p.centro_custo_id,
      p.codigo,
      p.numero,
      p.titulo,
      p.status,
      p.data_emissao,
      p.data_entrega_prevista,
      p.condicao_pagamento,
      p.valor_total,
      p.observacoes,
      p.created_at,
      p.updated_at,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo,
      c.codigo as cotacao_codigo,
      c.titulo as cotacao_titulo,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome
    from pedidos_compra p
    left join solicitacoes_compra s on s.id = p.solicitacao_id
    left join cotacoes c on c.id = p.cotacao_id
    join fornecedores f on f.id = p.fornecedor_id
    left join obras o on o.id = p.obra_id
    left join centros_custo cc on cc.id = p.centro_custo_id
    where p.id = $1
    `,
    [id]
  );

  const pedido = header.rows[0];
  if (!pedido) {
    return undefined;
  }

  const items = await client.query(
    `
    select
      id,
      pedido_id,
      solicitacao_item_id,
      cotacao_item_id,
      descricao,
      unidade,
      quantidade,
      valor_unitario,
      valor_total,
      observacoes,
      ordem,
      created_at,
      updated_at
    from pedidos_compra_itens
    where pedido_id = $1
    order by ordem, created_at
    `,
    [id]
  );

  return {
    ...pedido,
    itens: items.rows
  };
};

const listPedidos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`p.status = $${params.length}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    params.push(assertUuid(fornecedorId, 'fornecedor_id'));
    conditions.push(`p.fornecedor_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`p.obra_id = $${params.length}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    params.push(assertUuid(centroCustoId, 'centro_custo_id'));
    conditions.push(`p.centro_custo_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      p.id,
      p.company_id,
      p.solicitacao_id,
      p.solicitacao_compra_id,
      p.cotacao_id,
      p.fornecedor_id,
      p.obra_id,
      p.centro_custo_id,
      p.codigo,
      p.numero,
      p.titulo,
      p.status,
      p.data_emissao,
      p.data_entrega_prevista,
      p.condicao_pagamento,
      p.valor_total,
      p.observacoes,
      p.created_at,
      p.updated_at,
      s.codigo as solicitacao_codigo,
      c.codigo as cotacao_codigo,
      f.nome as fornecedor_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      count(i.id)::int as itens_count
    from pedidos_compra p
    left join solicitacoes_compra s on s.id = p.solicitacao_id
    left join cotacoes c on c.id = p.cotacao_id
    join fornecedores f on f.id = p.fornecedor_id
    left join obras o on o.id = p.obra_id
    left join centros_custo cc on cc.id = p.centro_custo_id
    left join pedidos_compra_itens i on i.pedido_id = p.id
    ${where}
    group by p.id, s.codigo, c.codigo, f.nome, o.codigo, o.nome, cc.codigo, cc.nome
    order by p.created_at desc
    `,
    params
  );
  return result.rows;
};

const fetchCotacaoSource = async (
  client: PoolClient,
  companyId: string,
  cotacaoId: string
): Promise<CotacaoSourceRow> => {
  const result = await client.query<CotacaoSourceRow>(
    `
    select
      c.id as cotacao_id,
      c.company_id,
      c.status as cotacao_status,
      c.codigo as cotacao_codigo,
      c.titulo as cotacao_titulo,
      c.solicitacao_compra_id as solicitacao_id,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo,
      s.obra_id,
      s.centro_custo_id,
      coalesce(m.fornecedor_vencedor_id, c.fornecedor_id) as fornecedor_vencedor_id,
      f.nome as fornecedor_nome
    from cotacoes c
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    left join mapa_comparativo_cotacao m on m.cotacao_id = c.id
    left join fornecedores f on f.id = coalesce(m.fornecedor_vencedor_id, c.fornecedor_id)
    where c.id = $1 and c.company_id = $2 and c.titulo is not null
    `,
    [cotacaoId, companyId]
  );

  const cotacao = result.rows[0];
  if (!cotacao) {
    throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
  }
  if (cotacao.cotacao_status === 'CANCELADA') {
    throw new HttpError(409, 'status_conflict', 'Cotacao cancelada nao permite pedido de compra.');
  }
  if (cotacao.cotacao_status !== 'FORNECEDOR_ESCOLHIDO') {
    throw new HttpError(409, 'status_conflict', 'Cotacao precisa estar com fornecedor vencedor escolhido.');
  }
  if (!cotacao.fornecedor_vencedor_id) {
    throw new HttpError(400, 'validation_error', 'Cotacao nao possui fornecedor vencedor.');
  }
  return cotacao;
};

const fetchCotacaoFornecedor = async (
  client: PoolClient,
  cotacaoId: string,
  fornecedorId: string
): Promise<CotacaoFornecedorRow> => {
  const result = await client.query<CotacaoFornecedorRow>(
    `
    select id, fornecedor_id, valor_total, prazo_entrega_dias, condicao_pagamento, status
    from cotacoes_fornecedores
    where cotacao_id = $1 and fornecedor_id = $2 and status = 'ESCOLHIDO'
    `,
    [cotacaoId, fornecedorId]
  );
  const fornecedor = result.rows[0];
  if (!fornecedor) {
    throw new HttpError(400, 'validation_error', 'Fornecedor vencedor nao possui resposta escolhida na cotacao.');
  }
  return fornecedor;
};

const fetchCotacaoItems = async (
  client: PoolClient,
  cotacaoId: string,
  cotacaoFornecedorId: string
): Promise<CotacaoItemRow[]> => {
  const result = await client.query<CotacaoItemRow>(
    `
    select
      id,
      solicitacao_item_id,
      descricao,
      unidade,
      quantidade,
      valor_unitario,
      valor_total,
      observacoes,
      ordem
    from cotacoes_itens
    where cotacao_id = $1 and cotacao_fornecedor_id = $2 and status = 'ATIVO'
    order by ordem, created_at
    `,
    [cotacaoId, cotacaoFornecedorId]
  );
  if (result.rows.length === 0) {
    throw new HttpError(400, 'validation_error', 'Fornecedor vencedor nao possui itens cotados.');
  }
  return result.rows;
};

const assertNoActivePedido = async (client: PoolClient, cotacaoId: string): Promise<void> => {
  const result = await client.query(
    `
    select id, codigo
    from pedidos_compra
    where cotacao_id = $1 and status <> 'CANCELADO'
    limit 1
    `,
    [cotacaoId]
  );
  const existing = result.rows[0];
  if (existing) {
    throw new HttpError(409, 'duplicate_active_order', 'Cotacao ja possui pedido de compra ativo.', existing);
  }
};

const insertPedidoItems = async (client: PoolClient, pedidoId: string, items: CotacaoItemRow[]): Promise<void> => {
  for (const item of items) {
    await client.query(
      `
      insert into pedidos_compra_itens (
        pedido_id,
        solicitacao_item_id,
        cotacao_item_id,
        descricao,
        unidade,
        quantidade,
        valor_unitario,
        valor_total,
        observacoes,
        ordem
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        pedidoId,
        item.solicitacao_item_id,
        item.id,
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

const gerarPedidoDaCotacao = async (payload: Record<string, unknown>) => {
  const companyId = assertUuid(payload.company_id, 'company_id');
  const cotacaoId = assertUuid(payload.cotacao_id, 'cotacao_id');
  const dataEmissao = optionalDate(payload, 'data_emissao') || new Date().toISOString().slice(0, 10);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const source = await fetchCotacaoSource(client, companyId, cotacaoId);
    const fornecedor = await fetchCotacaoFornecedor(client, source.cotacao_id, source.fornecedor_vencedor_id as string);
    const cotacaoItems = await fetchCotacaoItems(client, source.cotacao_id, fornecedor.id);
    await assertNoActivePedido(client, cotacaoId);

    const codigo = generateCodigo();
    const valorTotal = sumItems(cotacaoItems);
    const titulo = optionalText(payload, 'titulo') ||
      `Pedido ${source.cotacao_codigo} - ${source.fornecedor_nome || 'fornecedor vencedor'}`;
    const dataEntregaPrevista = optionalDate(payload, 'data_entrega_prevista') ||
      addDays(dataEmissao, fornecedor.prazo_entrega_dias);
    const condicaoPagamento = optionalText(payload, 'condicao_pagamento') || fornecedor.condicao_pagamento;
    const observacoes = optionalText(payload, 'observacoes');

    const created = await client.query<{ id: string }>(
      `
      insert into pedidos_compra (
        company_id,
        solicitacao_compra_id,
        solicitacao_id,
        cotacao_id,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        numero,
        codigo,
        titulo,
        status,
        data_emissao,
        data_entrega_prevista,
        prazo_entrega,
        condicao_pagamento,
        valor_total,
        observacoes
      )
      values ($1, $2, $2, $3, $4, $5, $6, $7, $7, $8, 'RASCUNHO', $9, $10, $11, $12, $13, $14)
      returning id
      `,
      [
        companyId,
        source.solicitacao_id,
        source.cotacao_id,
        source.fornecedor_vencedor_id,
        source.obra_id,
        source.centro_custo_id,
        codigo,
        titulo,
        dataEmissao,
        dataEntregaPrevista,
        fornecedor.prazo_entrega_dias === null ? null : `${fornecedor.prazo_entrega_dias} dias`,
        condicaoPagamento,
        valorTotal,
        observacoes
      ]
    );

    await insertPedidoItems(client, created.rows[0].id, cotacaoItems);
    const pedido = await fetchPedido(client, created.rows[0].id);
    await client.query('commit');
    return pedido;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const fetchPedidoForUpdate = async (client: PoolClient, id: string): Promise<PedidoRow | undefined> => {
  const result = await client.query<PedidoRow>(
    `
    select id, status
    from pedidos_compra
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const updatePedido = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = ['titulo', 'data_emissao', 'data_entrega_prevista', 'condicao_pagamento', 'observacoes'];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchPedidoForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Pedido de compra nao encontrado.');
    }
    if (!editableStatuses.includes(existing.status)) {
      throw new HttpError(409, 'status_conflict', `Pedido em status ${existing.status} nao permite edicao.`);
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    if (payload.titulo !== undefined) {
      updates.push({ column: 'titulo', value: requiredText(payload, 'titulo') });
    }
    if (payload.data_emissao !== undefined) {
      updates.push({ column: 'data_emissao', value: optionalDate(payload, 'data_emissao') });
    }
    if (payload.data_entrega_prevista !== undefined) {
      updates.push({ column: 'data_entrega_prevista', value: optionalDate(payload, 'data_entrega_prevista') });
    }
    if (payload.condicao_pagamento !== undefined) {
      updates.push({ column: 'condicao_pagamento', value: optionalText(payload, 'condicao_pagamento') });
    }
    if (payload.observacoes !== undefined) {
      updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    }
    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update pedidos_compra
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      `,
      [...updates.map((update) => update.value), id]
    );
    const pedido = await fetchPedido(client, id);
    await client.query('commit');
    return pedido;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const transitionPedido = async (id: string, action: string) => {
  assertUuid(id, 'id');
  const transition = transitions[action];
  if (!transition) {
    throw new HttpError(404, 'not_found', 'Acao de pedido de compra nao encontrada.');
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchPedidoForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Pedido de compra nao encontrado.');
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
      update pedidos_compra
      set status = $1, updated_at = now()
      where id = $2
      `,
      [transition.to, id]
    );
    const pedido = await fetchPedido(client, id);
    await client.query('commit');
    return pedido;
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
    sendError(res, 409, 'unique_violation', 'Pedido de compra duplicado para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para pedido de compra.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handlePedidosCompra = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/pedidos-compra';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'gerar-da-cotacao') {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 201, { data: await gerarPedidoDaCotacao(payload) });
      return;
    }

    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listPedidos(url) });
        return;
      }
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');

      if (method === 'GET') {
        const client = await getPool().connect();
        try {
          const pedido = await fetchPedido(client, id);
          if (!pedido) {
            sendError(res, 404, 'not_found', 'Pedido de compra nao encontrado.');
            return;
          }
          sendJson(res, 200, { data: pedido });
        } finally {
          client.release();
        }
        return;
      }

      if (method === 'PATCH') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await updatePedido(id, payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      sendJson(res, 200, { data: await transitionPedido(id, action) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de pedido de compra nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
