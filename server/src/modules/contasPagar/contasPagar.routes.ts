import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import {
  getPayloadDecisaoAprovacao,
  normalizarAcaoAprovacao,
  persistirBloqueioAlcada,
  registrarAuditoria,
  statusAprovacaoPorAcao,
  validarAlcadaDocumento
} from '../aprovacoes/aprovacoes.service.js';

type ContaPagarStatus = 'PROVISIONADA' | 'APROVADA' | 'AGUARDANDO_PROGRAMACAO' | 'PROGRAMADA' | 'PAGA' | 'CANCELADA';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface NotaEntradaRow extends QueryResultRow {
  id: string;
  company_id: string;
  pedido_id: string;
  fornecedor_id: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  numero: string;
  serie: string | null;
  data_emissao: string;
  valor_total: string;
  status: string;
}

interface ContaRow extends QueryResultRow {
  id: string;
  company_id: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  status: ContaPagarStatus;
  valor_original: string;
  aprovacao_status: string | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses: ContaPagarStatus[] = ['PROVISIONADA', 'APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA', 'PAGA', 'CANCELADA'];
const editableStatuses: ContaPagarStatus[] = ['PROVISIONADA'];
const transitions: Record<string, { from: ContaPagarStatus[]; to: ContaPagarStatus }> = {
  cancelar: { from: ['PROVISIONADA'], to: 'CANCELADA' }
};

const assertUuid = (value: unknown, fieldName: string): string => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
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
  const value = optionalText(payload, fieldName);
  if (!value) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
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

const normalizePositiveNumber = (value: unknown, fieldName: string): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser maior que zero.`);
  }
  return Number(normalized.toFixed(2));
};

const normalizeOptionalInteger = (value: unknown, fieldName: string, fallback: number): number => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser inteiro maior ou igual a 1.`);
  }
  return normalized;
};

const normalizeStatus = (value: string): ContaPagarStatus => {
  const normalized = value.trim().toUpperCase();
  if (!statuses.includes(normalized as ContaPagarStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${statuses.join(', ')}.`);
  }
  return normalized as ContaPagarStatus;
};

const fetchNotaEntrada = async (client: PoolClient, notaEntradaId: string): Promise<NotaEntradaRow> => {
  const result = await client.query<NotaEntradaRow>(
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
      valor_total,
      status
    from notas_fiscais_entrada
    where id = $1
    `,
    [notaEntradaId]
  );
  const nota = result.rows[0];
  if (!nota) {
    throw new HttpError(404, 'not_found', 'Nota de entrada nao encontrada.');
  }
  if (nota.status !== 'APROVADA') {
    throw new HttpError(409, 'status_conflict', 'Nota deve estar APROVADA para provisionar conta a pagar.');
  }
  return nota;
};

const assertNoActiveConta = async (client: PoolClient, notaEntradaId: string, parcela: number): Promise<void> => {
  const result = await client.query(
    `
    select id, numero_documento
    from contas_pagar
    where nota_entrada_id = $1 and parcela = $2 and status <> 'CANCELADA'
    limit 1
    `,
    [notaEntradaId, parcela]
  );
  const existing = result.rows[0];
  if (existing) {
    throw new HttpError(409, 'duplicate_active_payable', 'Nota ja possui conta a pagar ativa para esta parcela.', existing);
  }
};

const fetchConta = async (client: PoolClient, id: string) => {
  const result = await client.query(
    `
    select
      cp.id,
      cp.company_id,
      cp.nota_entrada_id,
      cp.pedido_id,
      cp.fornecedor_id,
      cp.obra_id,
      cp.centro_custo_id,
      cp.numero_documento,
      cp.parcela,
      cp.total_parcelas,
      cp.data_emissao,
      cp.data_vencimento,
      cp.valor_original,
      cp.valor_aberto,
      cp.status,
      cp.aprovacao_status,
      cp.aprovado_por,
      cp.aprovado_em,
      cp.aprovacao_observacoes,
      cp.bloqueio_alcada_motivo,
      cp.forma_pagamento_prevista,
      cp.observacoes,
      cp.created_at,
      cp.updated_at,
      n.numero as nota_numero,
      n.serie as nota_serie,
      p.codigo as pedido_codigo,
      p.titulo as pedido_titulo,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      aprovador.nome as aprovado_por_nome
    from contas_pagar cp
    join notas_fiscais_entrada n on n.id = cp.nota_entrada_id
    join pedidos_compra p on p.id = cp.pedido_id
    join fornecedores f on f.id = cp.fornecedor_id
    left join obras o on o.id = cp.obra_id
    left join centros_custo cc on cc.id = cp.centro_custo_id
    left join usuarios aprovador on aprovador.id = cp.aprovado_por
    where cp.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const listContas = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = ['cp.nota_entrada_id is not null'];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`cp.status = $${params.length}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    params.push(assertUuid(fornecedorId, 'fornecedor_id'));
    conditions.push(`cp.fornecedor_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`cp.obra_id = $${params.length}`);
  }

  const vencimentoDe = url.searchParams.get('vencimento_de');
  if (vencimentoDe) {
    params.push(requiredDate({ vencimento_de: vencimentoDe }, 'vencimento_de'));
    conditions.push(`cp.data_vencimento >= $${params.length}`);
  }

  const vencimentoAte = url.searchParams.get('vencimento_ate');
  if (vencimentoAte) {
    params.push(requiredDate({ vencimento_ate: vencimentoAte }, 'vencimento_ate'));
    conditions.push(`cp.data_vencimento <= $${params.length}`);
  }

  const where = `where ${conditions.join(' and ')}`;
  const result = await getPool().query(
    `
    select
      cp.id,
      cp.company_id,
      cp.nota_entrada_id,
      cp.pedido_id,
      cp.fornecedor_id,
      cp.obra_id,
      cp.centro_custo_id,
      cp.numero_documento,
      cp.parcela,
      cp.total_parcelas,
      cp.data_emissao,
      cp.data_vencimento,
      cp.valor_original,
      cp.valor_aberto,
      cp.status,
      cp.aprovacao_status,
      cp.aprovado_por,
      cp.aprovado_em,
      cp.aprovacao_observacoes,
      cp.bloqueio_alcada_motivo,
      cp.forma_pagamento_prevista,
      cp.observacoes,
      cp.created_at,
      cp.updated_at,
      n.numero as nota_numero,
      n.serie as nota_serie,
      p.codigo as pedido_codigo,
      f.nome as fornecedor_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      aprovador.nome as aprovado_por_nome
    from contas_pagar cp
    join notas_fiscais_entrada n on n.id = cp.nota_entrada_id
    join pedidos_compra p on p.id = cp.pedido_id
    join fornecedores f on f.id = cp.fornecedor_id
    left join obras o on o.id = cp.obra_id
    left join centros_custo cc on cc.id = cp.centro_custo_id
    left join usuarios aprovador on aprovador.id = cp.aprovado_por
    ${where}
    order by cp.data_vencimento asc, cp.created_at desc
    `,
    params
  );
  return result.rows;
};

const gerarContaDaNota = async (payload: Record<string, unknown>) => {
  const notaEntradaId = assertUuid(payload.nota_entrada_id, 'nota_entrada_id');
  const dataVencimento = requiredDate(payload, 'data_vencimento');
  const parcela = normalizeOptionalInteger(payload.parcela, 'parcela', 1);
  const totalParcelas = normalizeOptionalInteger(payload.total_parcelas, 'total_parcelas', 1);
  if (parcela > totalParcelas) {
    throw new HttpError(400, 'validation_error', 'parcela nao pode ser maior que total_parcelas.');
  }
  if (parcela !== 1 || totalParcelas !== 1) {
    throw new HttpError(400, 'validation_error', 'V3.5A permite apenas parcela unica.');
  }

  const formaPagamentoPrevista = optionalText(payload, 'forma_pagamento_prevista');
  const observacoes = optionalText(payload, 'observacoes');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const nota = await fetchNotaEntrada(client, notaEntradaId);
    await assertNoActiveConta(client, nota.id, parcela);

    const valorOriginal = normalizePositiveNumber(nota.valor_total, 'valor_original');
    const numeroDocumento = `${nota.numero}${nota.serie ? `/${nota.serie}` : ''}`;
    const created = await client.query<{ id: string }>(
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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $12, $12, 'PROVISIONADA', $13, $13, $14)
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
        parcela,
        totalParcelas,
        nota.data_emissao,
        dataVencimento,
        valorOriginal,
        formaPagamentoPrevista,
        observacoes
      ]
    );

    const conta = await fetchConta(client, created.rows[0].id);
    await client.query('commit');
    return conta;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const fetchContaForUpdate = async (client: PoolClient, id: string): Promise<ContaRow | undefined> => {
  const result = await client.query<ContaRow>(
    `
    select id, company_id, obra_id, centro_custo_id, status, valor_original, aprovacao_status
    from contas_pagar
    where id = $1 and nota_entrada_id is not null
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const updateConta = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = ['data_vencimento', 'forma_pagamento_prevista', 'observacoes'];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchContaForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Conta a pagar nao encontrada.');
    }
    if (!editableStatuses.includes(existing.status)) {
      throw new HttpError(409, 'status_conflict', `Conta em status ${existing.status} nao permite edicao.`);
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    if (payload.data_vencimento !== undefined) {
      const vencimento = requiredDate(payload, 'data_vencimento');
      updates.push({ column: 'data_vencimento', value: vencimento });
      updates.push({ column: 'vencimento', value: vencimento });
    }
    if (payload.forma_pagamento_prevista !== undefined) {
      const forma = optionalText(payload, 'forma_pagamento_prevista');
      updates.push({ column: 'forma_pagamento_prevista', value: forma });
      updates.push({ column: 'forma_pagamento', value: forma });
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
      update contas_pagar
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${updates.length + 1}
      `,
      [...updates.map((update) => update.value), id]
    );
    const conta = await fetchConta(client, id);
    await client.query('commit');
    return conta;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const aprovarContaPagar = async (id: string, action: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const acao = normalizarAcaoAprovacao(action);
  const decisao = getPayloadDecisaoAprovacao(payload);
  const aprovacaoStatus = statusAprovacaoPorAcao(acao);
  const client = await getPool().connect();
  let committed = false;

  try {
    await client.query('begin');
    const existing = await fetchContaForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Conta a pagar nao encontrada.');
    }
    if (existing.status !== 'PROVISIONADA') {
      throw new HttpError(409, 'status_conflict', `Conta em status ${existing.status} nao permite aprovacao.`);
    }

    const valor = Number(existing.valor_original);
    const validacao = await validarAlcadaDocumento(client, {
      companyId: existing.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'contas-pagar',
      tipoDocumento: 'CONTA_PAGAR',
      acao,
      valor,
      obraId: existing.obra_id,
      centroCustoId: existing.centro_custo_id
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'contas-pagar',
      tipo_documento: 'CONTA_PAGAR',
      acao,
      valor,
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      observacoes: decisao.observacoes
    };

    if (!validacao.aprovado) {
      await persistirBloqueioAlcada(client, 'contas_pagar', id, validacao.motivo, decisao.observacoes, decisao.usuarioId);
      await registrarAuditoria(client, existing.company_id, 'conta_pagar', id, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update contas_pagar
      set
        status = 'APROVADA',
        aprovacao_status = $1,
        aprovado_por = $2,
        aprovado_em = now(),
        aprovacao_observacoes = $3,
        bloqueio_alcada_motivo = null,
        updated_at = now()
      where id = $4
      `,
      [aprovacaoStatus, decisao.usuarioId, decisao.observacoes, id]
    );
    await registrarAuditoria(client, existing.company_id, 'conta_pagar', id, acao, auditPayload, decisao.usuarioId);
    const conta = await fetchConta(client, id);
    await client.query('commit');
    committed = true;
    return conta;
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const transitionConta = async (id: string, action: string) => {
  assertUuid(id, 'id');
  const transition = transitions[action];
  if (!transition) {
    throw new HttpError(404, 'not_found', 'Acao de conta a pagar nao encontrada.');
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchContaForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Conta a pagar nao encontrada.');
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
      update contas_pagar
      set status = $1, updated_at = now()
      where id = $2
      `,
      [transition.to, id]
    );
    const conta = await fetchConta(client, id);
    await client.query('commit');
    return conta;
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
    sendError(res, 409, 'unique_violation', 'Conta a pagar duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para conta a pagar.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleContasPagar = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/contas-pagar';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && ['gerar-da-nota', 'provisionar-da-nota'].includes(parts[0])) {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 201, { data: await gerarContaDaNota(payload) });
      return;
    }

    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listContas(url) });
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
          const conta = await fetchConta(client, id);
          if (!conta) {
            sendError(res, 404, 'not_found', 'Conta a pagar nao encontrada.');
            return;
          }
          sendJson(res, 200, { data: conta });
        } finally {
          client.release();
        }
        return;
      }

      if (method === 'PATCH') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await updateConta(id, payload) });
        return;
      }

      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (['aprovar-tecnico', 'aprovar-diretoria'].includes(action)) {
        const payload = await readJsonBody(req);
        sendJson(res, 200, { data: await aprovarContaPagar(id, action, payload) });
        return;
      }
      sendJson(res, 200, { data: await transitionConta(id, action) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de conta a pagar nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
