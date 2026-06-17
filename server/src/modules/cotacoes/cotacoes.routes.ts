import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
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

type CotacaoStatus =
  | 'RASCUNHO'
  | 'ENVIADA_FORNECEDORES'
  | 'RESPOSTAS_RECEBIDAS'
  | 'MAPA_GERADO'
  | 'FORNECEDOR_ESCOLHIDO'
  | 'CANCELADA';

type FornecedorCotacaoStatus = 'CONVIDADO' | 'RESPOSTA_RECEBIDA' | 'DESCLASSIFICADO' | 'ESCOLHIDO' | 'CANCELADO';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface SolicitacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  codigo: string;
  titulo: string;
  status: string;
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

interface CotacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  solicitacao_compra_id: string;
  status: CotacaoStatus;
  valor_total: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  aprovacao_status: string | null;
}

interface CotacaoFornecedorRow extends QueryResultRow {
  id: string;
  cotacao_id: string;
  fornecedor_id: string;
  status: FornecedorCotacaoStatus;
  valor_total: string;
}

interface RespostaItemPayload {
  solicitacao_item_id: string;
  valor_unitario: number;
  marca_modelo: string | null;
  prazo_entrega_dias: number | null;
  observacoes: string | null;
}

interface RespostaFornecedorPayload {
  fornecedor_id: string;
  prazo_entrega_dias: number | null;
  condicao_pagamento: string | null;
  observacoes: string | null;
  itens: RespostaItemPayload[];
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const formalStatuses: CotacaoStatus[] = [
  'RASCUNHO',
  'ENVIADA_FORNECEDORES',
  'RESPOSTAS_RECEBIDAS',
  'MAPA_GERADO',
  'FORNECEDOR_ESCOLHIDO',
  'CANCELADA'
];
const cancelableStatuses: CotacaoStatus[] = ['RASCUNHO', 'ENVIADA_FORNECEDORES', 'RESPOSTAS_RECEBIDAS', 'MAPA_GERADO'];

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

const normalizeStatus = (value: string): CotacaoStatus => {
  const normalized = value.trim().toUpperCase();
  if (!formalStatuses.includes(normalized as CotacaoStatus)) {
    throw new HttpError(400, 'validation_error', `Status invalido. Use: ${formalStatuses.join(', ')}.`);
  }
  return normalized as CotacaoStatus;
};

const generateCodigo = (): string => {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `COT-${datePart}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const getSolicitacaoId = (payload: Record<string, unknown>): string => {
  const value = payload.solicitacao_id ?? payload.solicitacao_compra_id;
  return assertUuid(value, 'solicitacao_id');
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

const assertSolicitacaoCanCreateCotacao = (solicitacao: SolicitacaoRow): void => {
  if (solicitacao.status === 'CANCELADA') {
    throw new HttpError(409, 'status_conflict', 'Solicitacao cancelada nao permite cotacao.');
  }
};

const validateFornecedorIds = async (client: PoolClient, companyId: string, fornecedorIds: string[]): Promise<void> => {
  const result = await client.query<{ id: string }>(
    `
    select id
    from fornecedores
    where company_id = $1 and status = 'ativo' and id = any($2::uuid[])
    `,
    [companyId, fornecedorIds]
  );
  const found = new Set(result.rows.map((row) => row.id));
  const missing = fornecedorIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, 'validation_error', 'Fornecedor invalido ou inativo para a empresa.', missing);
  }
};

const normalizeFornecedorIds = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'validation_error', 'Cotacao deve ter pelo menos 1 fornecedor.');
  }

  const ids = value.map((entry, index) => {
    if (typeof entry === 'string') {
      return assertUuid(entry, `fornecedores[${index}]`);
    }
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      return assertUuid((entry as Record<string, unknown>).fornecedor_id, `fornecedores[${index}].fornecedor_id`);
    }
    throw new HttpError(400, 'validation_error', `Fornecedor ${index + 1} invalido.`);
  });

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length !== ids.length) {
    throw new HttpError(400, 'validation_error', 'Fornecedor duplicado na cotacao.');
  }
  return uniqueIds;
};

const fetchCotacaoForUpdate = async (client: PoolClient, id: string): Promise<CotacaoRow | undefined> => {
  const result = await client.query<CotacaoRow>(
    `
    select
      c.id,
      c.company_id,
      c.solicitacao_compra_id,
      c.status,
      c.valor_total,
      s.obra_id,
      s.centro_custo_id,
      c.aprovacao_status
    from cotacoes c
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    where c.id = $1 and c.titulo is not null
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const insertFornecedorItens = async (
  client: PoolClient,
  cotacaoId: string,
  cotacaoFornecedorId: string,
  solicitacaoItems: SolicitacaoItemRow[]
): Promise<void> => {
  for (const item of solicitacaoItems) {
    await client.query(
      `
      insert into cotacoes_itens (
        cotacao_id,
        cotacao_fornecedor_id,
        solicitacao_item_id,
        descricao,
        unidade,
        quantidade,
        valor_unitario,
        valor_total,
        ordem,
        status
      )
      values ($1, $2, $3, $4, $5, $6, 0, 0, $7, 'ATIVO')
      `,
      [cotacaoId, cotacaoFornecedorId, item.id, item.descricao, item.unidade, item.quantidade, item.ordem]
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
      c.solicitacao_compra_id as solicitacao_id,
      c.fornecedor_id,
      c.codigo,
      c.titulo,
      c.status,
      c.aprovacao_status,
      c.aprovado_por,
      c.aprovado_em,
      c.aprovacao_observacoes,
      c.bloqueio_alcada_motivo,
      c.valor_total,
      c.prazo_resposta,
      c.observacoes,
      c.justificativa,
      c.created_at,
      c.updated_at,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo,
      m.id as mapa_id,
      m.fornecedor_vencedor_id,
      m.criterio_decisao,
      m.justificativa as mapa_justificativa,
      m.valor_vencedor,
      m.status as mapa_status
      , aprovador.nome as aprovado_por_nome
    from cotacoes c
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    left join mapa_comparativo_cotacao m on m.cotacao_id = c.id
    left join usuarios aprovador on aprovador.id = c.aprovado_por
    where c.id = $1 and c.titulo is not null
    `,
    [id]
  );

  const cotacao = header.rows[0];
  if (!cotacao) {
    return undefined;
  }

  const fornecedores = await client.query(
    `
    select
      cf.id,
      cf.cotacao_id,
      cf.fornecedor_id,
      f.nome as fornecedor_nome,
      f.cpf_cnpj as fornecedor_cpf_cnpj,
      cf.status,
      cf.valor_total,
      cf.prazo_entrega_dias,
      cf.condicao_pagamento,
      cf.observacoes,
      cf.created_at,
      cf.updated_at
    from cotacoes_fornecedores cf
    join fornecedores f on f.id = cf.fornecedor_id
    where cf.cotacao_id = $1 and cf.status <> 'CANCELADO'
    order by cf.created_at
    `,
    [id]
  );

  const itens = await client.query(
    `
    select
      i.id,
      i.cotacao_id,
      i.cotacao_fornecedor_id,
      cf.fornecedor_id,
      i.solicitacao_item_id,
      i.descricao,
      i.unidade,
      i.quantidade,
      i.valor_unitario,
      i.valor_total,
      i.marca_modelo,
      i.prazo_entrega_dias,
      i.observacoes,
      i.ordem,
      i.created_at,
      i.updated_at
    from cotacoes_itens i
    join cotacoes_fornecedores cf on cf.id = i.cotacao_fornecedor_id
    where i.cotacao_id = $1 and i.status = 'ATIVO'
    order by i.ordem, cf.created_at
    `,
    [id]
  );

  return {
    ...cotacao,
    mapa: cotacao.mapa_id ? {
      id: cotacao.mapa_id,
      cotacao_id: cotacao.id,
      fornecedor_vencedor_id: cotacao.fornecedor_vencedor_id,
      criterio_decisao: cotacao.criterio_decisao,
      justificativa: cotacao.mapa_justificativa,
      valor_vencedor: cotacao.valor_vencedor,
      status: cotacao.mapa_status
    } : null,
    fornecedores: fornecedores.rows,
    itens: itens.rows
  };
};

const listCotacoes = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = ['c.titulo is not null'];

  const solicitacaoId = url.searchParams.get('solicitacao_id') || url.searchParams.get('solicitacao_compra_id');
  if (solicitacaoId) {
    params.push(assertUuid(solicitacaoId, 'solicitacao_id'));
    conditions.push(`c.solicitacao_compra_id = $${params.length}`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    params.push(normalizeStatus(status));
    conditions.push(`c.status = $${params.length}`);
  }

  const where = `where ${conditions.join(' and ')}`;
  const result = await getPool().query(
    `
    select
      c.id,
      c.company_id,
      c.solicitacao_compra_id,
      c.solicitacao_compra_id as solicitacao_id,
      c.fornecedor_id,
      c.codigo,
      c.titulo,
      c.status,
      c.aprovacao_status,
      c.aprovado_por,
      c.aprovado_em,
      c.aprovacao_observacoes,
      c.bloqueio_alcada_motivo,
      c.valor_total,
      c.prazo_resposta,
      c.observacoes,
      c.justificativa,
      c.created_at,
      c.updated_at,
      s.codigo as solicitacao_codigo,
      s.titulo as solicitacao_titulo,
      count(distinct cf.id)::int as fornecedores_count,
      count(distinct i.id)::int as itens_count,
      m.fornecedor_vencedor_id,
      f.nome as fornecedor_vencedor_nome
      , aprovador.nome as aprovado_por_nome
    from cotacoes c
    join solicitacoes_compra s on s.id = c.solicitacao_compra_id
    left join cotacoes_fornecedores cf on cf.cotacao_id = c.id and cf.status <> 'CANCELADO'
    left join cotacoes_itens i on i.cotacao_id = c.id and i.status = 'ATIVO'
    left join mapa_comparativo_cotacao m on m.cotacao_id = c.id
    left join fornecedores f on f.id = m.fornecedor_vencedor_id
    left join usuarios aprovador on aprovador.id = c.aprovado_por
    ${where}
    group by c.id, s.codigo, s.titulo, m.fornecedor_vencedor_id, f.nome, aprovador.nome
    order by c.created_at desc
    `,
    params
  );
  return result.rows;
};

const createCotacao = async (payload: Record<string, unknown>) => {
  const companyId = assertUuid(payload.company_id, 'company_id');
  const solicitacaoId = getSolicitacaoId(payload);
  const fornecedorIds = normalizeFornecedorIds(payload.fornecedores);
  const titulo = requiredText(payload, 'titulo');
  const prazoResposta = optionalDate(payload, 'prazo_resposta');
  const observacoes = optionalText(payload, 'observacoes');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const solicitacao = await fetchSolicitacao(client, solicitacaoId);
    if (!solicitacao || solicitacao.company_id !== companyId) {
      throw new HttpError(400, 'validation_error', 'Solicitacao invalida para a empresa.');
    }
    assertSolicitacaoCanCreateCotacao(solicitacao);

    const solicitacaoItems = await fetchSolicitacaoItems(client, solicitacaoId);
    if (solicitacaoItems.length === 0) {
      throw new HttpError(400, 'validation_error', 'Solicitacao deve ter ao menos 1 item ativo para cotacao.');
    }

    await validateFornecedorIds(client, companyId, fornecedorIds);

    const created = await client.query<{ id: string }>(
      `
      insert into cotacoes (
        company_id,
        solicitacao_compra_id,
        codigo,
        titulo,
        prazo_resposta,
        data_recebimento,
        valor_total,
        recomendada,
        status,
        observacoes
      )
      values ($1, $2, $3, $4, $5, current_date, 0, false, 'RASCUNHO', $6)
      returning id
      `,
      [companyId, solicitacaoId, generateCodigo(), titulo, prazoResposta, observacoes]
    );

    for (const fornecedorId of fornecedorIds) {
      const fornecedor = await client.query<{ id: string }>(
        `
        insert into cotacoes_fornecedores (cotacao_id, fornecedor_id, status)
        values ($1, $2, 'CONVIDADO')
        returning id
        `,
        [created.rows[0].id, fornecedorId]
      );
      await insertFornecedorItens(client, created.rows[0].id, fornecedor.rows[0].id, solicitacaoItems);
    }

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

const updateCotacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const allowedFields = ['titulo', 'prazo_resposta', 'observacoes'];
  const unknownFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknownFields);
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const existing = await fetchCotacaoForUpdate(client, id);
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }
    if (existing.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Cotacao em status ${existing.status} nao permite edicao.`);
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    if (payload.titulo !== undefined) {
      updates.push({ column: 'titulo', value: requiredText(payload, 'titulo') });
    }
    if (payload.prazo_resposta !== undefined) {
      updates.push({ column: 'prazo_resposta', value: optionalDate(payload, 'prazo_resposta') });
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

const aprovarCotacao = async (id: string, action: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const acao = normalizarAcaoAprovacao(action);
  const decisao = getPayloadDecisaoAprovacao(payload);
  const aprovacaoStatus = statusAprovacaoPorAcao(acao);
  const client = await getPool().connect();
  let committed = false;

  try {
    await client.query('begin');
    const cotacao = await fetchCotacaoForUpdate(client, id);
    if (!cotacao) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }
    if (!['MAPA_GERADO', 'FORNECEDOR_ESCOLHIDO'].includes(cotacao.status)) {
      throw new HttpError(409, 'status_conflict', `Cotacao em status ${cotacao.status} nao permite aprovacao.`);
    }

    const valor = Number(cotacao.valor_total);
    const validacao = await validarAlcadaDocumento(client, {
      companyId: cotacao.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'cotacoes',
      tipoDocumento: 'COTACAO',
      acao,
      valor,
      obraId: cotacao.obra_id,
      centroCustoId: cotacao.centro_custo_id
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'cotacoes',
      tipo_documento: 'COTACAO',
      acao,
      valor,
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      observacoes: decisao.observacoes
    };

    if (!validacao.aprovado) {
      await persistirBloqueioAlcada(client, 'cotacoes', id, validacao.motivo, decisao.observacoes, decisao.usuarioId);
      await registrarAuditoria(client, cotacao.company_id, 'cotacao', id, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update cotacoes
      set
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
    await registrarAuditoria(client, cotacao.company_id, 'cotacao', id, acao, auditPayload, decisao.usuarioId);
    const updated = await fetchCotacao(client, id);
    await client.query('commit');
    committed = true;
    return updated;
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const normalizeRespostaItens = (
  value: unknown,
  solicitationItems: SolicitacaoItemRow[],
  fornecedorIndex: number
): RespostaItemPayload[] => {
  if (!Array.isArray(value) || value.length !== solicitationItems.length) {
    throw new HttpError(400, 'validation_error', `Fornecedor ${fornecedorIndex + 1} deve informar todos os itens da solicitacao.`);
  }

  const itemById = new Map(solicitationItems.map((item) => [item.id, item]));
  const usedIds = new Set<string>();

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} da resposta ${fornecedorIndex + 1} invalido.`);
    }

    const itemPayload = entry as Record<string, unknown>;
    const solicitacaoItemId = assertUuid(itemPayload.solicitacao_item_id, `fornecedores[${fornecedorIndex}].itens[${index}].solicitacao_item_id`);
    if (!itemById.has(solicitacaoItemId)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} nao pertence a solicitacao.`);
    }
    if (usedIds.has(solicitacaoItemId)) {
      throw new HttpError(400, 'validation_error', `Item ${index + 1} duplicado na resposta do fornecedor.`);
    }
    usedIds.add(solicitacaoItemId);

    const valorUnitario = normalizeNumber(itemPayload.valor_unitario, `fornecedores[${fornecedorIndex}].itens[${index}].valor_unitario`);
    if (valorUnitario < 0) {
      throw new HttpError(400, 'validation_error', 'valor_unitario deve ser maior ou igual a zero.');
    }

    return {
      solicitacao_item_id: solicitacaoItemId,
      valor_unitario: valorUnitario,
      marca_modelo: optionalText(itemPayload, 'marca_modelo'),
      prazo_entrega_dias: normalizeOptionalInteger(itemPayload.prazo_entrega_dias, `fornecedores[${fornecedorIndex}].itens[${index}].prazo_entrega_dias`),
      observacoes: optionalText(itemPayload, 'observacoes')
    };
  });
};

const normalizeRespostas = (
  value: unknown,
  solicitationItems: SolicitacaoItemRow[],
  expectedFornecedorIds: Set<string>
): RespostaFornecedorPayload[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'validation_error', 'Informe respostas de fornecedores.');
  }

  const usedIds = new Set<string>();
  const respostas = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new HttpError(400, 'validation_error', `Resposta ${index + 1} invalida.`);
    }
    const responsePayload = entry as Record<string, unknown>;
    const fornecedorId = assertUuid(responsePayload.fornecedor_id, `fornecedores[${index}].fornecedor_id`);
    if (!expectedFornecedorIds.has(fornecedorId)) {
      throw new HttpError(400, 'validation_error', `Fornecedor ${index + 1} nao participa da cotacao.`);
    }
    if (usedIds.has(fornecedorId)) {
      throw new HttpError(400, 'validation_error', `Fornecedor ${index + 1} duplicado nas respostas.`);
    }
    usedIds.add(fornecedorId);

    return {
      fornecedor_id: fornecedorId,
      prazo_entrega_dias: normalizeOptionalInteger(responsePayload.prazo_entrega_dias, `fornecedores[${index}].prazo_entrega_dias`),
      condicao_pagamento: optionalText(responsePayload, 'condicao_pagamento'),
      observacoes: optionalText(responsePayload, 'observacoes'),
      itens: normalizeRespostaItens(responsePayload.itens, solicitationItems, index)
    };
  });

  const missing = Array.from(expectedFornecedorIds).filter((id) => !usedIds.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, 'validation_error', 'Todas as respostas de fornecedores devem ser registradas antes do mapa.', missing);
  }

  return respostas;
};

const registrarRespostas = async (client: PoolClient, cotacao: CotacaoRow, payload: Record<string, unknown>) => {
  if (cotacao.status !== 'ENVIADA_FORNECEDORES') {
    throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${cotacao.status} -> RESPOSTAS_RECEBIDAS.`);
  }

  const solicitationItems = await fetchSolicitacaoItems(client, cotacao.solicitacao_compra_id);
  const fornecedores = await client.query<CotacaoFornecedorRow>(
    `
    select id, cotacao_id, fornecedor_id, status, valor_total
    from cotacoes_fornecedores
    where cotacao_id = $1 and status <> 'CANCELADO'
    order by created_at
    `,
    [cotacao.id]
  );
  if (fornecedores.rows.length === 0) {
    throw new HttpError(400, 'validation_error', 'Cotacao deve ter pelo menos 1 fornecedor.');
  }

  const fornecedoresById = new Map(fornecedores.rows.map((row) => [row.fornecedor_id, row]));
  const respostas = normalizeRespostas(payload.fornecedores, solicitationItems, new Set(fornecedoresById.keys()));
  const itemById = new Map(solicitationItems.map((item) => [item.id, item]));
  const totals: number[] = [];

  for (const resposta of respostas) {
    const cotacaoFornecedor = fornecedoresById.get(resposta.fornecedor_id);
    if (!cotacaoFornecedor) {
      throw new HttpError(400, 'validation_error', 'Fornecedor nao participa da cotacao.');
    }

    let totalFornecedor = 0;
    for (const item of resposta.itens) {
      const sourceItem = itemById.get(item.solicitacao_item_id);
      if (!sourceItem) {
        throw new HttpError(400, 'validation_error', 'Item da solicitacao nao encontrado.');
      }
      const quantidade = Number(sourceItem.quantidade);
      const valorTotal = Number((quantidade * item.valor_unitario).toFixed(2));
      totalFornecedor = Number((totalFornecedor + valorTotal).toFixed(2));
      await client.query(
        `
        update cotacoes_itens
        set
          valor_unitario = $1,
          valor_total = $2,
          marca_modelo = $3,
          prazo_entrega_dias = $4,
          observacoes = $5,
          updated_at = now()
        where cotacao_id = $6
          and cotacao_fornecedor_id = $7
          and solicitacao_item_id = $8
          and status = 'ATIVO'
        `,
        [
          item.valor_unitario,
          valorTotal,
          item.marca_modelo,
          item.prazo_entrega_dias,
          item.observacoes,
          cotacao.id,
          cotacaoFornecedor.id,
          item.solicitacao_item_id
        ]
      );
    }

    totals.push(totalFornecedor);
    await client.query(
      `
      update cotacoes_fornecedores
      set
        status = 'RESPOSTA_RECEBIDA',
        valor_total = $1,
        prazo_entrega_dias = $2,
        condicao_pagamento = $3,
        observacoes = $4,
        updated_at = now()
      where id = $5
      `,
      [
        totalFornecedor,
        resposta.prazo_entrega_dias,
        resposta.condicao_pagamento,
        resposta.observacoes,
        cotacaoFornecedor.id
      ]
    );
  }

  await client.query(
    `
    update cotacoes
    set status = 'RESPOSTAS_RECEBIDAS', valor_total = $1, updated_at = now()
    where id = $2
    `,
    [Math.min(...totals), cotacao.id]
  );
};

const upsertMapa = async (
  client: PoolClient,
  cotacaoId: string,
  fornecedorId: string | null,
  criterio: string,
  justificativa: string | null,
  valor: number,
  status: 'GERADO' | 'FORNECEDOR_ESCOLHIDO' | 'CANCELADO'
): Promise<void> => {
  await client.query(
    `
    insert into mapa_comparativo_cotacao (
      cotacao_id,
      fornecedor_vencedor_id,
      criterio_decisao,
      justificativa,
      valor_vencedor,
      status
    )
    values ($1, $2, $3, $4, $5, $6)
    on conflict (cotacao_id)
    do update set
      fornecedor_vencedor_id = excluded.fornecedor_vencedor_id,
      criterio_decisao = excluded.criterio_decisao,
      justificativa = excluded.justificativa,
      valor_vencedor = excluded.valor_vencedor,
      status = excluded.status,
      updated_at = now()
    `,
    [cotacaoId, fornecedorId, criterio, justificativa, valor, status]
  );
};

const getFornecedorMenorValor = async (client: PoolClient, cotacaoId: string): Promise<QueryResultRow> => {
  const result = await client.query(
    `
    select cf.id, cf.fornecedor_id, cf.valor_total, f.nome as fornecedor_nome
    from cotacoes_fornecedores cf
    join fornecedores f on f.id = cf.fornecedor_id
    where cf.cotacao_id = $1 and cf.status in ('RESPOSTA_RECEBIDA', 'ESCOLHIDO')
    order by cf.valor_total asc, cf.created_at asc
    limit 1
    `,
    [cotacaoId]
  );
  const winner = result.rows[0];
  if (!winner) {
    throw new HttpError(400, 'validation_error', 'Mapa comparativo exige ao menos 1 resposta de fornecedor.');
  }
  return winner;
};

const transitionCotacao = async (id: string, action: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const cotacao = await fetchCotacaoForUpdate(client, id);
    if (!cotacao) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }

    if (action === 'enviar-fornecedores') {
      if (cotacao.status !== 'RASCUNHO') {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${cotacao.status} -> ENVIADA_FORNECEDORES.`);
      }
      await client.query(
        "update cotacoes set status = 'ENVIADA_FORNECEDORES', updated_at = now() where id = $1",
        [id]
      );
    } else if (action === 'registrar-respostas') {
      await registrarRespostas(client, cotacao, payload);
    } else if (action === 'gerar-mapa') {
      if (cotacao.status !== 'RESPOSTAS_RECEBIDAS') {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${cotacao.status} -> MAPA_GERADO.`);
      }
      const winner = await getFornecedorMenorValor(client, id);
      await upsertMapa(
        client,
        id,
        String(winner.fornecedor_id),
        optionalText(payload, 'criterio_decisao') || 'MENOR_PRECO',
        optionalText(payload, 'justificativa') || 'Mapa gerado por menor valor total na V3.4B local.',
        Number(winner.valor_total),
        'GERADO'
      );
      await client.query(
        "update cotacoes set status = 'MAPA_GERADO', valor_total = $1, updated_at = now() where id = $2",
        [winner.valor_total, id]
      );
    } else if (action === 'escolher-fornecedor') {
      if (cotacao.status !== 'MAPA_GERADO') {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${cotacao.status} -> FORNECEDOR_ESCOLHIDO.`);
      }
      const fornecedorId = assertUuid(payload.fornecedor_id, 'fornecedor_id');
      const justificativa = requiredText(payload, 'justificativa');
      const chosen = await client.query<CotacaoFornecedorRow>(
        `
        select id, cotacao_id, fornecedor_id, status, valor_total
        from cotacoes_fornecedores
        where cotacao_id = $1 and fornecedor_id = $2 and status = 'RESPOSTA_RECEBIDA'
        `,
        [id, fornecedorId]
      );
      const chosenRow = chosen.rows[0];
      if (!chosenRow) {
        throw new HttpError(400, 'validation_error', 'Fornecedor vencedor deve participar da cotacao e ter resposta recebida.');
      }

      await client.query(
        `
        update cotacoes_fornecedores
        set status = case when fornecedor_id = $1 then 'ESCOLHIDO' else 'RESPOSTA_RECEBIDA' end,
            updated_at = now()
        where cotacao_id = $2 and status in ('RESPOSTA_RECEBIDA', 'ESCOLHIDO')
        `,
        [fornecedorId, id]
      );
      await upsertMapa(
        client,
        id,
        fornecedorId,
        optionalText(payload, 'criterio_decisao') || 'MENOR_PRECO',
        justificativa,
        Number(chosenRow.valor_total),
        'FORNECEDOR_ESCOLHIDO'
      );
      await client.query(
        `
        update cotacoes
        set
          status = 'FORNECEDOR_ESCOLHIDO',
          fornecedor_id = $1,
          valor_total = $2,
          recomendada = true,
          justificativa = $3,
          updated_at = now()
        where id = $4
        `,
        [fornecedorId, chosenRow.valor_total, justificativa, id]
      );
    } else if (action === 'cancelar') {
      if (!cancelableStatuses.includes(cotacao.status)) {
        throw new HttpError(409, 'invalid_status_transition', `Transicao ilegal: ${cotacao.status} -> CANCELADA.`);
      }
      await client.query("update cotacoes set status = 'CANCELADA', recomendada = false, updated_at = now() where id = $1", [id]);
      await client.query("update cotacoes_fornecedores set status = 'CANCELADO', updated_at = now() where cotacao_id = $1", [id]);
      await upsertMapa(client, id, null, 'CANCELAMENTO', optionalText(payload, 'justificativa'), 0, 'CANCELADO');
    } else {
      throw new HttpError(404, 'not_found', 'Acao de cotacao nao encontrada.');
    }

    const updated = await fetchCotacao(client, id);
    await client.query('commit');
    return updated;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const resolveCotacaoForMapa = async (client: PoolClient, url: URL): Promise<string> => {
  const cotacaoId = url.searchParams.get('cotacao_id');
  if (cotacaoId) {
    return assertUuid(cotacaoId, 'cotacao_id');
  }

  const solicitacaoId = url.searchParams.get('solicitacao_id') || url.searchParams.get('solicitacao_compra_id');
  if (!solicitacaoId) {
    throw new HttpError(400, 'validation_error', 'Informe cotacao_id ou solicitacao_id.');
  }

  const result = await client.query<{ id: string }>(
    `
    select id
    from cotacoes
    where solicitacao_compra_id = $1 and titulo is not null
    order by created_at desc
    limit 1
    `,
    [assertUuid(solicitacaoId, 'solicitacao_id')]
  );
  const cotacao = result.rows[0];
  if (!cotacao) {
    throw new HttpError(404, 'not_found', 'Cotacao nao encontrada para a solicitacao.');
  }
  return cotacao.id;
};

const buildMapaComparativo = async (url: URL) => {
  const client = await getPool().connect();

  try {
    const cotacaoId = await resolveCotacaoForMapa(client, url);
    const cotacao = await fetchCotacao(client, cotacaoId);
    if (!cotacao) {
      throw new HttpError(404, 'not_found', 'Cotacao nao encontrada.');
    }

    const solicitacao = await fetchSolicitacao(client, String(cotacao.solicitacao_compra_id));
    if (!solicitacao) {
      throw new HttpError(404, 'not_found', 'Solicitacao de compra nao encontrada.');
    }

    const solicitationItems = await fetchSolicitacaoItems(client, String(cotacao.solicitacao_compra_id));
    const fornecedores = (cotacao.fornecedores || []) as QueryResultRow[];
    const itens = (cotacao.itens || []) as QueryResultRow[];
    const fornecedoresComparaveis = fornecedores
      .filter((fornecedor) => ['RESPOSTA_RECEBIDA', 'ESCOLHIDO'].includes(String(fornecedor.status)))
      .sort((left, right) => Number(left.valor_total) - Number(right.valor_total));
    const menorTotal = fornecedoresComparaveis[0] || null;
    const mapa = cotacao.mapa as QueryResultRow | null;
    const fornecedorVencedorId = mapa?.fornecedor_vencedor_id ? String(mapa.fornecedor_vencedor_id) : null;
    const vencedor = fornecedorVencedorId
      ? fornecedores.find((fornecedor) => fornecedor.fornecedor_id === fornecedorVencedorId) || null
      : null;

    return {
      cotacao,
      solicitacao,
      resumo: {
        total_fornecedores: fornecedores.length,
        total_respostas: fornecedoresComparaveis.length,
        fornecedor_menor_total: menorTotal,
        fornecedor_vencedor: vencedor,
        mapa
      },
      fornecedores,
      itens: solicitationItems.map((item) => {
        const itemComparativos = itens
          .filter((cotacaoItem) => cotacaoItem.solicitacao_item_id === item.id)
          .map((cotacaoItem) => {
            const fornecedor = fornecedores.find((row) => row.id === cotacaoItem.cotacao_fornecedor_id);
            return {
              cotacao_fornecedor_id: cotacaoItem.cotacao_fornecedor_id,
              fornecedor_id: cotacaoItem.fornecedor_id,
              fornecedor_nome: fornecedor?.fornecedor_nome || null,
              status: fornecedor?.status || null,
              valor_unitario: cotacaoItem.valor_unitario,
              valor_total: cotacaoItem.valor_total,
              marca_modelo: cotacaoItem.marca_modelo,
              prazo_entrega_dias: cotacaoItem.prazo_entrega_dias
            };
          });
        const comparableItems = itemComparativos
          .filter((cotacaoItem) => ['RESPOSTA_RECEBIDA', 'ESCOLHIDO'].includes(String(cotacaoItem.status)))
          .sort((left, right) => Number(left.valor_total) - Number(right.valor_total));
        const bestItem = comparableItems[0];

        return {
          id: item.id,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          ordem: item.ordem,
          melhor_fornecedor_id: bestItem?.fornecedor_id || null,
          comparativos: itemComparativos.map((cotacaoItem) => ({
            ...cotacaoItem,
            melhor_valor: Boolean(bestItem && bestItem.fornecedor_id === cotacaoItem.fornecedor_id)
          }))
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
      sendJson(res, 200, { data: await buildMapaComparativo(url) });
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
      if (['aprovar-tecnico', 'aprovar-diretoria'].includes(action)) {
        sendJson(res, 200, { data: await aprovarCotacao(id, action, payload) });
        return;
      }
      sendJson(res, 200, { data: await transitionCotacao(id, action, payload) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de cotacao nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
