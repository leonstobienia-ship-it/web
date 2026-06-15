import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';

type NotaEntradaStatus = 'RASCUNHO' | 'CONFERIDA' | 'DIVERGENTE' | 'APROVADA' | 'PROVISIONADA' | 'CANCELADA';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface PedidoRow extends QueryResultRow {
  id: string;
  company_id: string;
  fornecedor_id: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  codigo: string;
  status: string;
  valor_total: string;
}

interface PedidoItemRow extends QueryResultRow {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  observacoes: string | null;
  ordem: number;
}

interface NotaRow extends QueryResultRow {
  id: string;
  status: NotaEntradaStatus;
}

interface NotaItemInput {
  pedido_item_id: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes: string | null;
  ordem: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses: NotaEntradaStatus[] = ['RASCUNHO', 'CONFERIDA', 'DIVERGENTE', 'APROVADA', 'PROVISIONADA', 'CANCELADA'];
const editableStatuses: NotaEntradaStatus[] = ['RASCUNHO'];
const transitions: Record<string, { from: NotaEntradaStatus[]; to: NotaEntradaStatus }> = {
  conferir: { from: ['RASCUNHO'], to: 'CONFERIDA' },
  'marcar-divergente': { from: ['RASCUNHO'], to: 'DIVERGENTE' },
  'reabrir-rascunho': { from: ['DIVERGENTE'], to: 'RASCUNHO' },
  aprovar: { from: ['CONFERIDA'], to: 'APROVADA' },
  cancelar: { from: ['RASCUNHO', 'CONFERIDA', 'DIVERGENTE'], to: 'CANCELADA' },
  lancar: { from: ['RASCUNHO'], to: 'CONFERIDA' },
  'aprovar-financeiro': { from: ['CONFERIDA'], to: 'APROVADA' }
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

const requiredDate = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = requiredText(payload, fieldName);
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
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

const normalizeNumber = (value: unknown, fieldName: string): number => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 0;
  }
  const normalized = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo numerico invalido: ${fieldName}.`);
  }
  return Number(normalized.toFixed(2));
};

const normalizePositiveNumber = (value: unknown, fieldName: string): number => {
  const normalized = normalizeNumber(value, fieldName);
  if (normalized <= 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser maior que zero.`);
  }
  return normalized;
};

const normalizeStatus = (value: string): NotaEntradaStatus => {
  const normalized = value.trim().toUpperCase();
  if (!statuses.includes(normalized as NotaEntradaStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${statuses.join(', ')}.`);
  }
  return normalized as NotaEntradaStatus;
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

const buildCalculatedTotal = (payload: Record<string, unknown>): number => {
  const valorProdutos = normalizeNumber(payload.valor_produtos, 'valor_produtos');
  const valorServicos = normalizeNumber(payload.valor_servicos, 'valor_servicos');
  const valorFrete = normalizeNumber(payload.valor_frete, 'valor_frete');
  const valorDesconto = normalizeNumber(payload.valor_desconto, 'valor_desconto');
  const valorImpostos = normalizeNumber(payload.valor_impostos, 'valor_impostos');
  return roundMoney(valorProdutos + valorServicos + valorFrete + valorImpostos - valorDesconto);
};

const resolveValorTotal = (payload: Record<string, unknown>): number => {
  const calculated = buildCalculatedTotal(payload);
  const provided = payload.valor_total === undefined || payload.valor_total === null || String(payload.valor_total).trim() === ''
    ? calculated
    : normalizeNumber(payload.valor_total, 'valor_total');
  if (provided < 0) {
    throw new HttpError(400, 'validation_error', 'valor_total deve ser maior ou igual a zero.');
  }
  if (calculated > 0 && Math.abs(provided - calculated) > 0.01) {
    throw new HttpError(400, 'validation_error', 'valor_total diverge da soma dos campos da nota.');
  }
  return provided;
};

const fetchPedido = async (client: PoolClient, pedidoId: string, companyId: string): Promise<PedidoRow> => {
  const result = await client.query<PedidoRow>(
    `
    select id, company_id, fornecedor_id, obra_id, centro_custo_id, codigo, status, valor_total
    from pedidos_compra
    where id = $1 and company_id = $2
    `,
    [pedidoId, companyId]
  );
  const pedido = result.rows[0];
  if (!pedido) {
    throw new HttpError(404, 'not_found', 'Pedido de compra nao encontrado.');
  }
  if (pedido.status === 'CANCELADO') {
    throw new HttpError(409, 'status_conflict', 'Pedido cancelado nao permite nota de entrada.');
  }
  if (!['EMITIDO', 'ENVIADO_FORNECEDOR', 'CONFIRMADO', 'PARCIALMENTE_RECEBIDO', 'RECEBIDO'].includes(pedido.status)) {
    throw new HttpError(409, 'status_conflict', 'Pedido deve estar emitido, enviado ao fornecedor ou confirmado para receber nota fiscal de entrada.');
  }
  return pedido;
};

const fetchPedidoItems = async (client: PoolClient, pedidoId: string): Promise<PedidoItemRow[]> => {
  const result = await client.query<PedidoItemRow>(
    `
    select id, descricao, unidade, quantidade, valor_unitario, valor_total, observacoes, ordem
    from pedidos_compra_itens
    where pedido_id = $1
    order by ordem, created_at
    `,
    [pedidoId]
  );
  if (result.rows.length === 0) {
    throw new HttpError(400, 'validation_error', 'Pedido deve ter ao menos 1 item para nota de entrada.');
  }
  return result.rows;
};

const normalizeItems = (value: unknown, pedidoItems: PedidoItemRow[]): NotaItemInput[] => {
  if (value === undefined || value === null) {
    return pedidoItems.map((item) => ({
      pedido_item_id: item.id,
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      valor_total: Number(item.valor_total),
      observacoes: item.observacoes,
      ordem: item.ordem
    }));
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'validation_error', 'Nota deve ter ao menos 1 item.');
  }

  const pedidoItemIds = new Set(pedidoItems.map((item) => item.id));
  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} invalido.`);
    }
    const item = entry as Record<string, unknown>;
    const pedidoItemId = item.pedido_item_id ? assertUuid(item.pedido_item_id, `itens[${index}].pedido_item_id`) : null;
    if (pedidoItemId && !pedidoItemIds.has(pedidoItemId)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} nao pertence ao pedido.`);
    }
    const quantidade = normalizePositiveNumber(item.quantidade, `itens[${index}].quantidade`);
    const valorUnitario = normalizeNumber(item.valor_unitario, `itens[${index}].valor_unitario`);
    if (valorUnitario < 0) {
      throw new HttpError(400, 'validation_error', 'valor_unitario deve ser maior ou igual a zero.');
    }
    const valorTotal = item.valor_total === undefined || item.valor_total === null || String(item.valor_total).trim() === ''
      ? roundMoney(quantidade * valorUnitario)
      : normalizeNumber(item.valor_total, `itens[${index}].valor_total`);
    if (valorTotal < 0) {
      throw new HttpError(400, 'validation_error', 'valor_total do item deve ser maior ou igual a zero.');
    }

    return {
      pedido_item_id: pedidoItemId,
      descricao: requiredText(item, 'descricao'),
      unidade: requiredText(item, 'unidade'),
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      observacoes: optionalText(item, 'observacoes'),
      ordem: Number.isInteger(Number(item.ordem)) ? Number(item.ordem) : index + 1
    };
  });
};

const assertNotaTotal = (notaTotal: number, itemTotal: number): void => {
  if (Math.abs(notaTotal - itemTotal) > 0.01) {
    throw new HttpError(400, 'validation_error', 'valor_total da nota diverge do total dos itens.');
  }
};

const insertNotaItems = async (client: PoolClient, notaId: string, items: NotaItemInput[]): Promise<void> => {
  for (const item of items) {
    await client.query(
      `
      insert into notas_fiscais_entrada_itens (
        nota_id,
        nota_fiscal_id,
        pedido_item_id,
        descricao,
        unidade,
        quantidade,
        valor_unitario,
        valor_total,
        observacoes,
        ordem
      )
      values ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        notaId,
        item.pedido_item_id,
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

const fetchNota = async (client: PoolClient, id: string) => {
  const header = await client.query(
    `
    select
      n.id,
      n.company_id,
      n.pedido_id,
      n.fornecedor_id,
      n.obra_id,
      n.centro_custo_id,
      n.numero,
      n.serie,
      n.chave_acesso,
      n.tipo_documento,
      n.data_emissao,
      n.data_entrada,
      n.valor_produtos,
      n.valor_servicos,
      n.valor_frete,
      n.valor_desconto,
      n.valor_impostos,
      n.valor_total,
      n.status,
      n.observacoes,
      n.created_at,
      n.updated_at,
      p.codigo as pedido_codigo,
      p.titulo as pedido_titulo,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome
    from notas_fiscais_entrada n
    join pedidos_compra p on p.id = n.pedido_id
    join fornecedores f on f.id = n.fornecedor_id
    left join obras o on o.id = n.obra_id
    left join centros_custo cc on cc.id = n.centro_custo_id
    where n.id = $1
    `,
    [id]
  );
  const nota = header.rows[0];
  if (!nota) {
    return undefined;
  }

  const items = await client.query(
    `
    select
      id,
      nota_id,
      coalesce(nota_fiscal_id, nota_id) as nota_fiscal_id,
      pedido_item_id,
      descricao,
      unidade,
      quantidade,
      valor_unitario,
      valor_total,
      observacoes,
      ordem,
      created_at,
      updated_at
    from notas_fiscais_entrada_itens
    where coalesce(nota_fiscal_id, nota_id) = $1
    order by ordem, created_at
    `,
    [id]
  );

  return {
    ...nota,
    itens: items.rows
  };
};

const listNotas = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`n.status = $${params.length}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    params.push(assertUuid(fornecedorId, 'fornecedor_id'));
    conditions.push(`n.fornecedor_id = $${params.length}`);
  }

  const pedidoId = url.searchParams.get('pedido_id');
  if (pedidoId) {
    params.push(assertUuid(pedidoId, 'pedido_id'));
    conditions.push(`n.pedido_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`n.obra_id = $${params.length}`);
  }

  const centroCustoId = url.searchParams.get('centro_custo_id');
  if (centroCustoId) {
    params.push(assertUuid(centroCustoId, 'centro_custo_id'));
    conditions.push(`n.centro_custo_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      n.id,
      n.company_id,
      n.pedido_id,
      n.fornecedor_id,
      n.obra_id,
      n.centro_custo_id,
      n.numero,
      n.serie,
      n.chave_acesso,
      n.tipo_documento,
      n.data_emissao,
      n.data_entrada,
      n.valor_total,
      n.status,
      n.observacoes,
      n.created_at,
      n.updated_at,
      p.codigo as pedido_codigo,
      f.nome as fornecedor_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      count(i.id)::int as itens_count
    from notas_fiscais_entrada n
    join pedidos_compra p on p.id = n.pedido_id
    join fornecedores f on f.id = n.fornecedor_id
    left join obras o on o.id = n.obra_id
    left join centros_custo cc on cc.id = n.centro_custo_id
    left join notas_fiscais_entrada_itens i on i.nota_id = n.id
    ${where}
    group by n.id, p.codigo, f.nome, o.codigo, o.nome, cc.codigo, cc.nome
    order by n.created_at desc
    `,
    params
  );
  return result.rows;
};

const createNota = async (payload: Record<string, unknown>) => {
  const companyId = assertUuid(payload.company_id, 'company_id');
  const pedidoId = assertUuid(payload.pedido_id, 'pedido_id');
  const numero = requiredText(payload, 'numero');
  const serie = optionalText(payload, 'serie');
  const chaveAcesso = optionalText(payload, 'chave_acesso');
  const tipoDocumento = optionalText(payload, 'tipo_documento') || 'NOTA_FISCAL';
  const dataEmissao = requiredDate(payload, 'data_emissao');
  const dataEntrada = requiredDate(payload, 'data_entrada');
  const valorProdutos = normalizeNumber(payload.valor_produtos, 'valor_produtos');
  const valorServicos = normalizeNumber(payload.valor_servicos, 'valor_servicos');
  const valorFrete = normalizeNumber(payload.valor_frete, 'valor_frete');
  const valorDesconto = normalizeNumber(payload.valor_desconto, 'valor_desconto');
  const valorImpostos = normalizeNumber(payload.valor_impostos, 'valor_impostos');
  const valorTotal = resolveValorTotal(payload);
  const observacoes = optionalText(payload, 'observacoes');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const pedido = await fetchPedido(client, pedidoId, companyId);
    const pedidoItems = await fetchPedidoItems(client, pedidoId);
    const notaItems = normalizeItems(payload.itens, pedidoItems);
    const itensTotal = roundMoney(notaItems.reduce((total, item) => total + item.valor_total, 0));
    assertNotaTotal(valorTotal, itensTotal);

    const created = await client.query<{ id: string }>(
      `
      insert into notas_fiscais_entrada (
        company_id,
        pedido_id,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        numero,
        serie,
        chave_acesso,
        tipo_documento,
        data_emissao,
        data_entrada,
        valor_produtos,
        valor_servicos,
        valor_frete,
        valor_desconto,
        valor_impostos,
        valor_total,
        status,
        observacoes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'RASCUNHO', $18)
      returning id
      `,
      [
        companyId,
        pedido.id,
        pedido.fornecedor_id,
        pedido.obra_id,
        pedido.centro_custo_id,
        numero,
        serie,
        chaveAcesso,
        tipoDocumento,
        dataEmissao,
        dataEntrada,
        valorProdutos,
        valorServicos,
        valorFrete,
        valorDesconto,
        valorImpostos,
        valorTotal,
        observacoes
      ]
    );

    await insertNotaItems(client, created.rows[0].id, notaItems);
    const nota = await fetchNota(client, created.rows[0].id);
    await client.query('commit');
    return nota;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const fetchNotaForUpdate = async (client: PoolClient, id: string): Promise<NotaRow | undefined> => {
  const result = await client.query<NotaRow>(
    `
    select id, status
    from notas_fiscais_entrada
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const updateNota = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = [
    'numero',
    'serie',
    'chave_acesso',
    'tipo_documento',
    'data_emissao',
    'data_entrada',
    'valor_produtos',
    'valor_servicos',
    'valor_frete',
    'valor_desconto',
    'valor_impostos',
    'valor_total',
    'observacoes'
  ];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchNotaForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Nota de entrada nao encontrada.');
    }
    if (!editableStatuses.includes(existing.status)) {
      throw new HttpError(409, 'status_conflict', `Nota em status ${existing.status} nao permite edicao.`);
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    if (payload.numero !== undefined) updates.push({ column: 'numero', value: requiredText(payload, 'numero') });
    if (payload.serie !== undefined) updates.push({ column: 'serie', value: optionalText(payload, 'serie') });
    if (payload.chave_acesso !== undefined) updates.push({ column: 'chave_acesso', value: optionalText(payload, 'chave_acesso') });
    if (payload.tipo_documento !== undefined) updates.push({ column: 'tipo_documento', value: optionalText(payload, 'tipo_documento') || 'NOTA_FISCAL' });
    if (payload.data_emissao !== undefined) updates.push({ column: 'data_emissao', value: requiredDate(payload, 'data_emissao') });
    if (payload.data_entrada !== undefined) updates.push({ column: 'data_entrada', value: requiredDate(payload, 'data_entrada') });
    if (payload.valor_produtos !== undefined) updates.push({ column: 'valor_produtos', value: normalizeNumber(payload.valor_produtos, 'valor_produtos') });
    if (payload.valor_servicos !== undefined) updates.push({ column: 'valor_servicos', value: normalizeNumber(payload.valor_servicos, 'valor_servicos') });
    if (payload.valor_frete !== undefined) updates.push({ column: 'valor_frete', value: normalizeNumber(payload.valor_frete, 'valor_frete') });
    if (payload.valor_desconto !== undefined) updates.push({ column: 'valor_desconto', value: normalizeNumber(payload.valor_desconto, 'valor_desconto') });
    if (payload.valor_impostos !== undefined) updates.push({ column: 'valor_impostos', value: normalizeNumber(payload.valor_impostos, 'valor_impostos') });
    if (payload.valor_total !== undefined) updates.push({ column: 'valor_total', value: normalizePositiveNumber(payload.valor_total, 'valor_total') });
    if (payload.observacoes !== undefined) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });

    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update notas_fiscais_entrada
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      `,
      [...updates.map((update) => update.value), id]
    );
    const nota = await fetchNota(client, id);
    await client.query('commit');
    return nota;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const transitionNota = async (id: string, action: string) => {
  assertUuid(id, 'id');
  const transition = transitions[action];
  if (!transition) {
    throw new HttpError(404, 'not_found', 'Acao de nota de entrada nao encontrada.');
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchNotaForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Nota de entrada nao encontrada.');
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
      update notas_fiscais_entrada
      set status = $1, updated_at = now()
      where id = $2
      `,
      [transition.to, id]
    );
    const nota = await fetchNota(client, id);
    await client.query('commit');
    return nota;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const provisionarContaPagar = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const notaResult = await client.query<{
      id: string;
      company_id: string;
      pedido_id: string;
      fornecedor_id: string;
      obra_id: string | null;
      centro_custo_id: string | null;
      numero: string;
      serie: string | null;
      data_emissao: string;
      data_entrada: string;
      valor_total: string;
      status: NotaEntradaStatus;
    }>(
      `
      select
        id,
        company_id,
        pedido_id,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        numero,
        serie,
        data_emissao,
        data_entrada,
        valor_total,
        status
      from notas_fiscais_entrada
      where id = $1
      for update
      `,
      [id]
    );
    const nota = notaResult.rows[0];
    if (!nota) {
      throw new HttpError(404, 'not_found', 'Nota fiscal de entrada nao encontrada.');
    }
    if (nota.status !== 'APROVADA') {
      throw new HttpError(409, 'status_conflict', 'Nota deve estar APROVADA para provisionar conta a pagar.');
    }

    const existingConta = await client.query(
      `
      select id, numero_documento
      from contas_pagar
      where nota_entrada_id = $1 and parcela = 1 and status <> 'CANCELADA'
      limit 1
      `,
      [nota.id]
    );
    if (existingConta.rows[0]) {
      throw new HttpError(409, 'duplicate_active_payable', 'Nota ja possui conta a pagar ativa.', existingConta.rows[0]);
    }

    const dataVencimento = optionalDate(payload, 'data_vencimento') || String(nota.data_entrada).slice(0, 10);
    const formaPagamentoPrevista = optionalText(payload, 'forma_pagamento_prevista');
    const observacoes = optionalText(payload, 'observacoes');
    const valorOriginal = normalizePositiveNumber(nota.valor_total, 'valor_original');
    const numeroDocumento = `${nota.numero}${nota.serie ? `/${nota.serie}` : ''}`;

    const createdConta = await client.query<{ id: string }>(
      `
      insert into contas_pagar (
        company_id,
        nota_entrada_id,
        pedido_id,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        numero_documento,
        parcela,
        total_parcelas,
        data_emissao,
        data_vencimento,
        vencimento,
        valor_original,
        valor_aberto,
        saldo,
        status,
        forma_pagamento_prevista,
        forma_pagamento,
        observacoes
      )
      values ($1, $2, $3, $4, $5, $6, $7, 1, 1, $8, $9, $9, $10, $10, $10, 'PROVISIONADA', $11, $11, $12)
      returning id
      `,
      [
        nota.company_id,
        nota.id,
        nota.pedido_id,
        nota.fornecedor_id,
        nota.obra_id,
        nota.centro_custo_id,
        numeroDocumento,
        nota.data_emissao,
        dataVencimento,
        valorOriginal,
        formaPagamentoPrevista,
        observacoes
      ]
    );

    await client.query(
      `
      update notas_fiscais_entrada
      set status = 'PROVISIONADA', updated_at = now()
      where id = $1
      `,
      [nota.id]
    );

    const conta = await client.query(
      `
      select
        id,
        company_id,
        nota_entrada_id,
        pedido_id,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        numero_documento,
        parcela,
        total_parcelas,
        data_emissao,
        data_vencimento,
        valor_original,
        valor_aberto,
        status,
        forma_pagamento_prevista,
        observacoes,
        created_at,
        updated_at
      from contas_pagar
      where id = $1
      `,
      [createdConta.rows[0].id]
    );
    const updatedNota = await fetchNota(client, nota.id);
    await client.query('commit');
    return {
      nota: updatedNota,
      conta_pagar: conta.rows[0]
    };
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
    sendError(res, 409, 'unique_violation', 'Nota de entrada duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para nota de entrada.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleNotasEntrada = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = url.pathname.startsWith('/notas-fiscais-entrada') ? '/notas-fiscais-entrada' : '/notas-entrada';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'gerar-do-pedido') {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 201, { data: await createNota(payload) });
      return;
    }

    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listNotas(url) });
        return;
      }
      if (method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, 201, { data: await createNota(payload) });
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
          const nota = await fetchNota(client, id);
          if (!nota) {
            sendError(res, 404, 'not_found', 'Nota de entrada nao encontrada.');
            return;
          }
          sendJson(res, 200, { data: nota });
        } finally {
          client.release();
        }
        return;
      }

      if (method === 'PATCH') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await updateNota(id, payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'provisionar-conta-pagar') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await provisionarContaPagar(id, payload) });
        return;
      }
      sendJson(res, 200, { data: await transitionNota(id, action) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de nota de entrada nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
