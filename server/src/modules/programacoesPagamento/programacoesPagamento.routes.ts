import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import {
  assertUuid,
  getPayloadDecisaoAprovacao,
  optionalText,
  persistirBloqueioAlcada,
  registrarAuditoria,
  statusAprovacaoPorAcao,
  validarAlcadaDocumento,
  type AcaoAprovacao
} from '../aprovacoes/aprovacoes.service.js';

type ProgramacaoStatus = 'RASCUNHO' | 'SUBMETIDA' | 'APROVADA' | 'LIBERADA' | 'REPROVADA' | 'CANCELADA';
type ItemStatus = 'ATIVA' | 'REMOVIDA' | 'CANCELADA';
type LiberacaoStatus = 'PENDENTE_LIBERACAO' | 'LIBERADA' | 'BLOQUEADA_LIBERACAO' | 'CANCELADA';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface ProgramacaoForUpdate extends QueryResultRow {
  id: string;
  company_id: string;
  status: ProgramacaoStatus;
  liberacao_status: LiberacaoStatus;
  data_prevista: string;
  fornecedor_id: string | null;
  obra_id: string | null;
  centro_custo_id: string | null;
  forma_pagamento_prevista: string | null;
  valor_total: string;
  quantidade_contas: number;
  liberado_por: string | null;
  liberado_em: string | null;
  bloqueio_liberacao_motivo: string | null;
}

interface ContaProgramacaoRow extends QueryResultRow {
  id: string;
  company_id: string;
  status: string;
  aprovacao_status: string | null;
  valor_aberto: string;
  fornecedor_id: string;
  obra_id: string | null;
  centro_custo_id: string | null;
  forma_pagamento_prevista: string | null;
  ativo: boolean;
  divergencia_pendente: boolean;
  nota_status: string | null;
  fornecedor_nome: string | null;
  obra_codigo: string | null;
  centro_custo_codigo: string | null;
  programacao_ativa_id: string | null;
  programacao_ativa_codigo: string | null;
  programacao_ativa_status: ProgramacaoStatus | null;
}

interface ActiveItemRow extends QueryResultRow {
  id: string;
  programacao_id: string;
  conta_pagar_id: string;
  status: ItemStatus;
}

interface LiberacaoContaRow extends QueryResultRow {
  item_id: string;
  item_status: ItemStatus;
  conta_pagar_id: string;
  conta_status: string;
  aprovacao_status: string | null;
  valor_programado: string;
  valor_aberto: string;
  ativo: boolean;
  divergencia_pendente: boolean;
  nota_status: string | null;
  numero_documento: string;
}

interface LiberacaoHistoricoRow extends QueryResultRow {
  id: string;
  programacao_id: string;
  status_anterior: string;
  status_novo: string;
  liberacao_status: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  valor_total_liberado: string;
  quantidade_contas: number;
  origem_alcada: string | null;
  justificativa: string | null;
  resultado: string;
  motivo: string | null;
  created_at: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const activeProgramacaoStatuses: ProgramacaoStatus[] = ['RASCUNHO', 'SUBMETIDA', 'APROVADA', 'LIBERADA'];
const approvedStatuses = new Set(['APROVADO_TECNICO', 'APROVADO_DIRETORIA']);

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
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

const optionalUuid = (payload: Record<string, unknown>, fieldName: string): string | null => {
  if (!hasOwn(payload, fieldName) || payload[fieldName] === null || payload[fieldName] === undefined || String(payload[fieldName]).trim() === '') {
    return null;
  }
  return assertUuid(payload[fieldName], fieldName);
};

const optionalUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const normalizeAprovacaoAction = (action: string): AcaoAprovacao => {
  if (action === 'aprovar-tecnico') {
    return 'aprovar_tecnico';
  }
  if (action === 'aprovar-diretoria') {
    return 'aprovar_diretoria';
  }
  throw new HttpError(404, 'not_found', 'Acao de aprovacao da programacao nao encontrada.');
};

const normalizeCodigo = (): string => {
  const now = new Date();
  const stamp = now.toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `PP-${stamp}-${suffix}`;
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
    sendError(res, 409, 'unique_violation', 'Programacao de pagamento duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para programacao de pagamento.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

const fetchProgramacaoForUpdate = async (client: PoolClient, id: string): Promise<ProgramacaoForUpdate | undefined> => {
  const result = await client.query<ProgramacaoForUpdate>(
    `
    select
      id,
      company_id,
      status,
      liberacao_status,
      data_prevista,
      fornecedor_id,
      obra_id,
      centro_custo_id,
      forma_pagamento_prevista,
      valor_total,
      quantidade_contas,
      liberado_por,
      liberado_em,
      bloqueio_liberacao_motivo
    from programacoes_pagamento
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const fetchProgramacao = async (id: string) => {
  const result = await getPool().query(
    `
    select
      pp.id,
      pp.company_id,
      pp.codigo,
      pp.status,
      pp.liberacao_status,
      pp.data_prevista,
      pp.fornecedor_id,
      f.nome as fornecedor_nome,
      pp.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      pp.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      pp.forma_pagamento_prevista,
      pp.valor_total,
      pp.quantidade_contas,
      pp.observacoes,
      pp.justificativa,
      pp.aprovacao_status,
      pp.aprovado_por,
      aprovador.nome as aprovado_por_nome,
      pp.aprovado_em,
      pp.aprovacao_observacoes,
      pp.bloqueio_alcada_motivo,
      pp.liberado_por,
      liberador.nome as liberado_por_nome,
      pp.liberado_em,
      pp.liberacao_justificativa,
      pp.liberacao_valor_total,
      pp.liberacao_quantidade_contas,
      pp.liberacao_alcada_origem,
      pp.liberacao_status_anterior,
      pp.bloqueio_liberacao_motivo,
      pp.submetido_por,
      submetido.nome as submetido_por_nome,
      pp.submetido_em,
      pp.cancelado_por,
      cancelador.nome as cancelado_por_nome,
      pp.cancelado_em,
      pp.cancelamento_motivo,
      pp.created_at,
      pp.updated_at,
      coalesce(json_agg(json_build_object(
        'id', ppi.id,
        'conta_pagar_id', cp.id,
        'numero_documento', cp.numero_documento,
        'status', cp.status,
        'aprovacao_status', cp.aprovacao_status,
        'valor_programado', ppi.valor_programado,
        'valor_aberto', cp.valor_aberto,
        'data_vencimento', cp.data_vencimento,
        'fornecedor_id', cp.fornecedor_id,
        'fornecedor_nome', cf.nome,
        'obra_id', cp.obra_id,
        'obra_codigo', co.codigo,
        'obra_nome', co.nome,
        'centro_custo_id', cp.centro_custo_id,
        'centro_custo_codigo', ccc.codigo,
        'centro_custo_nome', ccc.nome,
        'forma_pagamento_prevista', cp.forma_pagamento_prevista,
        'item_status', ppi.status,
        'observacoes', ppi.observacoes
      ) order by cp.data_vencimento, cp.numero_documento) filter (where ppi.id is not null and ppi.status = 'ATIVA'), '[]'::json) as contas
    from programacoes_pagamento pp
    left join fornecedores f on f.id = pp.fornecedor_id
    left join obras o on o.id = pp.obra_id
    left join centros_custo cc on cc.id = pp.centro_custo_id
    left join usuarios aprovador on aprovador.id = pp.aprovado_por
    left join usuarios liberador on liberador.id = pp.liberado_por
    left join usuarios submetido on submetido.id = pp.submetido_por
    left join usuarios cancelador on cancelador.id = pp.cancelado_por
    left join programacoes_pagamento_itens ppi on ppi.programacao_id = pp.id and ppi.status = 'ATIVA'
    left join contas_pagar cp on cp.id = ppi.conta_pagar_id
    left join fornecedores cf on cf.id = cp.fornecedor_id
    left join obras co on co.id = cp.obra_id
    left join centros_custo ccc on ccc.id = cp.centro_custo_id
    where pp.id = $1
    group by pp.id, f.id, o.id, cc.id, aprovador.id, liberador.id, submetido.id, cancelador.id
    `,
    [id]
  );
  return result.rows[0];
};

const listProgramacoes = async (url: URL) => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`pp.status = $${params.length}`);
  }

  const fornecedorId = url.searchParams.get('fornecedor_id');
  if (fornecedorId) {
    params.push(assertUuid(fornecedorId, 'fornecedor_id'));
    conditions.push(`pp.fornecedor_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`pp.obra_id = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      pp.id,
      pp.company_id,
      pp.codigo,
      pp.status,
      pp.liberacao_status,
      pp.data_prevista,
      pp.fornecedor_id,
      f.nome as fornecedor_nome,
      pp.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      pp.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      pp.forma_pagamento_prevista,
      pp.valor_total,
      pp.quantidade_contas,
      pp.aprovacao_status,
      pp.aprovado_em,
      pp.liberado_por,
      liberador.nome as liberado_por_nome,
      pp.liberado_em,
      pp.liberacao_valor_total,
      pp.liberacao_quantidade_contas,
      pp.bloqueio_liberacao_motivo,
      pp.created_at,
      pp.updated_at
    from programacoes_pagamento pp
    left join fornecedores f on f.id = pp.fornecedor_id
    left join obras o on o.id = pp.obra_id
    left join centros_custo cc on cc.id = pp.centro_custo_id
    left join usuarios liberador on liberador.id = pp.liberado_por
    ${where}
    order by pp.data_prevista asc, pp.created_at desc
    `,
    params
  );
  return result.rows;
};

const getContaBloqueios = (conta: ContaProgramacaoRow): string[] => {
  const bloqueios: string[] = [];
  if (!conta.ativo) {
    bloqueios.push('Conta inativa.');
  }
  if (conta.status === 'CANCELADA') {
    bloqueios.push('Conta cancelada.');
  } else if (conta.status !== 'APROVADA') {
    bloqueios.push(`Conta em status ${conta.status}; exige APROVADA.`);
  }
  if (!conta.aprovacao_status || !approvedStatuses.has(conta.aprovacao_status)) {
    bloqueios.push('Conta sem aprovacao interna concluida.');
  }
  if (conta.divergencia_pendente || conta.nota_status === 'DIVERGENTE') {
    bloqueios.push('Conta com divergencia pendente.');
  }
  if (Number(conta.valor_aberto) <= 0) {
    bloqueios.push('Conta sem valor aberto para programar.');
  }
  if (conta.programacao_ativa_id) {
    bloqueios.push(`Conta ja vinculada a programacao ativa ${conta.programacao_ativa_codigo}.`);
  }
  return bloqueios;
};

const fetchContasElegibilidade = async (url: URL) => {
  const params: unknown[] = [activeProgramacaoStatuses];
  const conditions = ['cp.nota_entrada_id is not null'];
  const companyId = url.searchParams.get('company_id');
  if (companyId) {
    params.push(assertUuid(companyId, 'company_id'));
    conditions.push(`cp.company_id = $${params.length}`);
  }
  const result = await getPool().query<ContaProgramacaoRow>(
    `
    select
      cp.id,
      cp.company_id,
      cp.numero_documento,
      cp.status,
      cp.aprovacao_status,
      cp.valor_original,
      cp.valor_aberto,
      cp.data_vencimento,
      cp.fornecedor_id,
      cp.obra_id,
      cp.centro_custo_id,
      cp.forma_pagamento_prevista,
      cp.ativo,
      cp.divergencia_pendente,
      n.status as nota_status,
      f.nome as fornecedor_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      ativa.programacao_id as programacao_ativa_id,
      ativa.codigo as programacao_ativa_codigo,
      ativa.status as programacao_ativa_status
    from contas_pagar cp
    join notas_fiscais_entrada n on n.id = cp.nota_entrada_id
    join fornecedores f on f.id = cp.fornecedor_id
    left join obras o on o.id = cp.obra_id
    left join centros_custo cc on cc.id = cp.centro_custo_id
    left join lateral (
      select pp.id as programacao_id, pp.codigo, pp.status
      from programacoes_pagamento_itens ppi
      join programacoes_pagamento pp on pp.id = ppi.programacao_id
      where ppi.conta_pagar_id = cp.id
        and ppi.status = 'ATIVA'
        and pp.status = any($1::text[])
      order by ppi.created_at desc
      limit 1
    ) ativa on true
    where ${conditions.join(' and ')}
    order by cp.data_vencimento asc, cp.created_at desc
    `,
    params
  );
  const incluirBloqueadas = url.searchParams.get('incluir_bloqueadas') === 'true';
  return result.rows
    .map((conta) => {
      const bloqueios = getContaBloqueios(conta);
      return { ...conta, elegivel: bloqueios.length === 0, bloqueios };
    })
    .filter((conta) => incluirBloqueadas || conta.elegivel);
};

const fetchContaForProgramacao = async (client: PoolClient, id: string): Promise<ContaProgramacaoRow | undefined> => {
  const result = await client.query<ContaProgramacaoRow>(
    `
    select
      cp.id,
      cp.company_id,
      cp.status,
      cp.aprovacao_status,
      cp.valor_aberto,
      cp.fornecedor_id,
      cp.obra_id,
      cp.centro_custo_id,
      cp.forma_pagamento_prevista,
      cp.ativo,
      cp.divergencia_pendente,
      n.status as nota_status,
      f.nome as fornecedor_nome,
      o.codigo as obra_codigo,
      cc.codigo as centro_custo_codigo,
      ativa.programacao_id as programacao_ativa_id,
      ativa.codigo as programacao_ativa_codigo,
      ativa.status as programacao_ativa_status
    from contas_pagar cp
    join notas_fiscais_entrada n on n.id = cp.nota_entrada_id
    join fornecedores f on f.id = cp.fornecedor_id
    left join obras o on o.id = cp.obra_id
    left join centros_custo cc on cc.id = cp.centro_custo_id
    left join lateral (
      select pp.id as programacao_id, pp.codigo, pp.status
      from programacoes_pagamento_itens ppi
      join programacoes_pagamento pp on pp.id = ppi.programacao_id
      where ppi.conta_pagar_id = cp.id
        and ppi.status = 'ATIVA'
        and pp.status = any($2::text[])
      order by ppi.created_at desc
      limit 1
    ) ativa on true
    where cp.id = $1
    for update of cp
    `,
    [id, activeProgramacaoStatuses]
  );
  return result.rows[0];
};

const assertGrouping = (
  programacao: ProgramacaoForUpdate,
  conta: ContaProgramacaoRow,
  hasActiveItems: boolean
): Array<{ column: string; value: unknown }> => {
  const updates: Array<{ column: string; value: unknown }> = [];
  const fields: Array<{
    column: 'fornecedor_id' | 'obra_id' | 'centro_custo_id' | 'forma_pagamento_prevista';
    contaField: 'fornecedor_id' | 'obra_id' | 'centro_custo_id' | 'forma_pagamento_prevista';
    label: string;
  }> = [
    { column: 'fornecedor_id', contaField: 'fornecedor_id', label: 'fornecedor' },
    { column: 'obra_id', contaField: 'obra_id', label: 'obra' },
    { column: 'centro_custo_id', contaField: 'centro_custo_id', label: 'centro de custo' },
    { column: 'forma_pagamento_prevista', contaField: 'forma_pagamento_prevista', label: 'forma de pagamento prevista' }
  ];

  for (const field of fields) {
    const programacaoValue = String(programacao[field.column] || '');
    const contaValue = String(conta[field.contaField] || '');
    if (!hasActiveItems && !programacaoValue) {
      updates.push({ column: field.column, value: conta[field.contaField] || null });
      continue;
    }
    if (programacaoValue !== contaValue) {
      throw new HttpError(409, 'grupo_incompativel', `Conta nao pertence ao mesmo agrupamento de ${field.label} da programacao.`);
    }
  }

  return updates;
};

const recalcularProgramacao = async (client: PoolClient, id: string): Promise<void> => {
  await client.query(
    `
    update programacoes_pagamento pp
    set
      valor_total = coalesce(agg.valor_total, 0),
      quantidade_contas = coalesce(agg.quantidade, 0),
      updated_at = now()
    from (
      select
        $1::uuid as programacao_id,
        count(*)::int as quantidade,
        sum(valor_programado) as valor_total
      from programacoes_pagamento_itens
      where programacao_id = $1 and status = 'ATIVA'
    ) agg
    where pp.id = agg.programacao_id
    `,
    [id]
  );
};

const fetchLiberacoes = async (programacaoId: string): Promise<LiberacaoHistoricoRow[]> => {
  assertUuid(programacaoId, 'id');
  const result = await getPool().query<LiberacaoHistoricoRow>(
    `
    select
      ppl.id,
      ppl.programacao_id,
      ppl.status_anterior,
      ppl.status_novo,
      ppl.liberacao_status,
      ppl.usuario_id,
      u.nome as usuario_nome,
      ppl.valor_total_liberado,
      ppl.quantidade_contas,
      ppl.origem_alcada,
      ppl.justificativa,
      ppl.resultado,
      ppl.motivo,
      ppl.created_at
    from programacoes_pagamento_liberacoes ppl
    left join usuarios u on u.id = ppl.usuario_id
    where ppl.programacao_id = $1
    order by ppl.created_at desc
    `,
    [programacaoId]
  );
  return result.rows;
};

const insertLiberacaoHistorico = async (
  client: PoolClient,
  programacao: ProgramacaoForUpdate,
  statusNovo: ProgramacaoStatus,
  liberacaoStatus: Extract<LiberacaoStatus, 'LIBERADA' | 'BLOQUEADA_LIBERACAO'>,
  usuarioId: string,
  justificativa: string | null,
  resultado: 'PERMITIDO' | 'NEGADO',
  motivo: string | null,
  origemAlcada: string | null
): Promise<void> => {
  await client.query(
    `
    insert into programacoes_pagamento_liberacoes (
      programacao_id,
      company_id,
      status_anterior,
      status_novo,
      liberacao_status,
      usuario_id,
      valor_total_liberado,
      quantidade_contas,
      origem_alcada,
      justificativa,
      resultado,
      motivo
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      programacao.id,
      programacao.company_id,
      programacao.status,
      statusNovo,
      liberacaoStatus,
      usuarioId,
      Number(programacao.valor_total),
      Number(programacao.quantidade_contas),
      origemAlcada,
      justificativa,
      resultado,
      motivo
    ]
  );
};

const getBloqueiosLiberacao = async (client: PoolClient, programacao: ProgramacaoForUpdate): Promise<string[]> => {
  const bloqueios: string[] = [];
  const itens = await client.query<LiberacaoContaRow>(
    `
    select
      ppi.id as item_id,
      ppi.status as item_status,
      cp.id as conta_pagar_id,
      cp.numero_documento,
      cp.status as conta_status,
      cp.aprovacao_status,
      ppi.valor_programado,
      cp.valor_aberto,
      cp.ativo,
      cp.divergencia_pendente,
      n.status as nota_status
    from programacoes_pagamento_itens ppi
    join contas_pagar cp on cp.id = ppi.conta_pagar_id
    left join notas_fiscais_entrada n on n.id = cp.nota_entrada_id
    where ppi.programacao_id = $1
    order by ppi.created_at
    `,
    [programacao.id]
  );

  if (itens.rows.length === 0) {
    bloqueios.push('Programacao sem contas vinculadas.');
  }

  const itensRemovidos = itens.rows.filter((item) => item.item_status !== 'ATIVA');
  if (itensRemovidos.length > 0) {
    bloqueios.push('Programacao possui conta removida ou cancelada; crie nova programacao para liberar.');
  }

  const itensAtivos = itens.rows.filter((item) => item.item_status === 'ATIVA');
  if (itensAtivos.length !== Number(programacao.quantidade_contas)) {
    bloqueios.push('Quantidade de contas ativas diverge do total recalculado da programacao.');
  }

  for (const item of itensAtivos) {
    if (!item.ativo) {
      bloqueios.push(`Conta ${item.numero_documento} esta inativa.`);
    }
    if (item.conta_status === 'CANCELADA') {
      bloqueios.push(`Conta ${item.numero_documento} esta cancelada.`);
    } else if (item.conta_status !== 'APROVADA') {
      bloqueios.push(`Conta ${item.numero_documento} esta em status ${item.conta_status}; exige APROVADA.`);
    }
    if (!item.aprovacao_status || !approvedStatuses.has(item.aprovacao_status)) {
      bloqueios.push(`Conta ${item.numero_documento} nao possui aprovacao interna concluida.`);
    }
    if (item.divergencia_pendente || item.nota_status === 'DIVERGENTE') {
      bloqueios.push(`Conta ${item.numero_documento} possui divergencia pendente.`);
    }
    if (Number(item.valor_aberto) <= 0) {
      bloqueios.push(`Conta ${item.numero_documento} nao possui valor aberto para liberar.`);
    }
  }

  if (itensAtivos.length > 0) {
    const contaIds = itensAtivos.map((item) => item.conta_pagar_id);
    const duplicidades = await client.query<{ conta_pagar_id: string; total: number }>(
      `
      select ppi.conta_pagar_id, count(*)::int as total
      from programacoes_pagamento_itens ppi
      join programacoes_pagamento pp on pp.id = ppi.programacao_id
      where ppi.status = 'ATIVA'
        and pp.status = any($1::text[])
        and ppi.conta_pagar_id = any($2::uuid[])
      group by ppi.conta_pagar_id
      having count(*) > 1
      `,
      [activeProgramacaoStatuses, contaIds]
    );
    if (duplicidades.rows.length > 0) {
      bloqueios.push('Conta vinculada a mais de uma programacao ativa.');
    }
  }

  return bloqueios;
};

const adicionarContaTx = async (
  client: PoolClient,
  programacaoId: string,
  contaId: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const programacao = await fetchProgramacaoForUpdate(client, programacaoId);
  if (!programacao) {
    throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
  }
  if (programacao.status !== 'RASCUNHO') {
    throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite adicionar conta.`);
  }

  const conta = await fetchContaForProgramacao(client, contaId);
  if (!conta) {
    throw new HttpError(404, 'not_found', 'Conta a pagar nao encontrada para programacao.');
  }
  if (conta.company_id !== programacao.company_id) {
    throw new HttpError(400, 'validation_error', 'Conta pertence a outra empresa.');
  }

  const bloqueios = getContaBloqueios(conta);
  if (bloqueios.length > 0) {
    throw new HttpError(409, 'conta_nao_elegivel', 'Conta a pagar nao elegivel para programacao.', bloqueios);
  }

  const activeItems = await client.query(
    `
    select id
    from programacoes_pagamento_itens
    where programacao_id = $1 and status = 'ATIVA'
    limit 1
    `,
    [programacaoId]
  );
  const groupingUpdates = assertGrouping(programacao, conta, (activeItems.rowCount || 0) > 0);
  if (groupingUpdates.length > 0) {
    const assignments = groupingUpdates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update programacoes_pagamento
      set ${assignments.join(', ')}, updated_at = now()
      where id = $${groupingUpdates.length + 1}
      `,
      [...groupingUpdates.map((update) => update.value), programacaoId]
    );
  }

  const usuarioId = optionalUsuarioId(payload);
  await client.query(
    `
    insert into programacoes_pagamento_itens (
      programacao_id,
      conta_pagar_id,
      company_id,
      valor_programado,
      observacoes,
      adicionado_por
    )
    values ($1, $2, $3, $4, $5, $6)
    `,
    [
      programacaoId,
      conta.id,
      programacao.company_id,
      Number(conta.valor_aberto),
      optionalText(payload, 'observacoes'),
      usuarioId
    ]
  );
  await recalcularProgramacao(client, programacaoId);
  await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', programacaoId, 'adicionar_conta', {
    conta_pagar_id: conta.id,
    valor_programado: Number(conta.valor_aberto),
    observacoes: optionalText(payload, 'observacoes')
  }, usuarioId);
};

const createProgramacao = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'data_prevista',
    'fornecedor_id',
    'obra_id',
    'centro_custo_id',
    'forma_pagamento_prevista',
    'observacoes',
    'justificativa',
    'usuario_id',
    'usuarioId',
    'contas'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const dataPrevista = requiredDate(payload, 'data_prevista');
  const contas = Array.isArray(payload.contas) ? payload.contas : [];
  const client = await getPool().connect();
  const usuarioId = optionalUsuarioId(payload);

  try {
    await client.query('begin');
    const created = await client.query<{ id: string }>(
      `
      insert into programacoes_pagamento (
        company_id,
        codigo,
        data_prevista,
        fornecedor_id,
        obra_id,
        centro_custo_id,
        forma_pagamento_prevista,
        observacoes,
        justificativa,
        created_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning id
      `,
      [
        companyId,
        normalizeCodigo(),
        dataPrevista,
        optionalUuid(payload, 'fornecedor_id'),
        optionalUuid(payload, 'obra_id'),
        optionalUuid(payload, 'centro_custo_id'),
        optionalText(payload, 'forma_pagamento_prevista'),
        optionalText(payload, 'observacoes'),
        optionalText(payload, 'justificativa'),
        usuarioId
      ]
    );
    const id = created.rows[0].id;

    for (const contaId of contas) {
      await adicionarContaTx(client, id, assertUuid(contaId, 'contas[]'), payload);
    }

    await registrarAuditoria(client, companyId, 'programacao_pagamento', id, 'criar', {
      data_prevista: dataPrevista,
      observacoes: optionalText(payload, 'observacoes'),
      justificativa: optionalText(payload, 'justificativa')
    }, usuarioId);
    await client.query('commit');
    return fetchProgramacao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const adicionarConta = async (programacaoId: string, payload: Record<string, unknown>) => {
  assertUuid(programacaoId, 'id');
  assertAllowedFields(payload, ['conta_pagar_id', 'usuario_id', 'usuarioId', 'observacoes']);
  const contaId = assertUuid(payload.conta_pagar_id, 'conta_pagar_id');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await adicionarContaTx(client, programacaoId, contaId, payload);
    await client.query('commit');
    return fetchProgramacao(programacaoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const removerConta = async (programacaoId: string, contaId: string, payload: Record<string, unknown>) => {
  assertUuid(programacaoId, 'id');
  assertUuid(contaId, 'conta_pagar_id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes']);
  const client = await getPool().connect();
  const usuarioId = optionalUsuarioId(payload);
  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, programacaoId);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite remover conta.`);
    }
    const item = await client.query<ActiveItemRow>(
      `
      update programacoes_pagamento_itens
      set status = 'REMOVIDA',
          removido_por = $1,
          removido_em = now(),
          remocao_motivo = $2,
          updated_at = now()
      where programacao_id = $3 and conta_pagar_id = $4 and status = 'ATIVA'
      returning id, programacao_id, conta_pagar_id, status
      `,
      [usuarioId, optionalText(payload, 'observacoes'), programacaoId, contaId]
    );
    if (!item.rows[0]) {
      throw new HttpError(404, 'not_found', 'Conta ativa nao encontrada nesta programacao.');
    }
    await recalcularProgramacao(client, programacaoId);
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', programacaoId, 'remover_conta', {
      conta_pagar_id: contaId,
      observacoes: optionalText(payload, 'observacoes')
    }, usuarioId);
    await client.query('commit');
    return fetchProgramacao(programacaoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const submeterProgramacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa']);
  const client = await getPool().connect();
  const usuarioId = optionalUsuarioId(payload);
  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, id);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite submissao.`);
    }
    if (Number(programacao.quantidade_contas) < 1 || Number(programacao.valor_total) <= 0) {
      throw new HttpError(409, 'programacao_sem_contas', 'Programacao precisa ter ao menos uma conta elegivel antes da submissao.');
    }
    await client.query(
      `
      update programacoes_pagamento
      set status = 'SUBMETIDA',
          aprovacao_status = 'PENDENTE_APROVACAO',
          submetido_por = $1,
          submetido_em = now(),
          justificativa = coalesce($2, justificativa),
          updated_at = now()
      where id = $3
      `,
      [usuarioId, optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes'), id]
    );
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'submeter', {
      valor_total: Number(programacao.valor_total),
      quantidade_contas: Number(programacao.quantidade_contas),
      observacoes: optionalText(payload, 'observacoes'),
      justificativa: optionalText(payload, 'justificativa')
    }, usuarioId);
    await client.query('commit');
    return fetchProgramacao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const aprovarProgramacao = async (id: string, action: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const acao = normalizeAprovacaoAction(action);
  const decisao = getPayloadDecisaoAprovacao(payload);
  const aprovacaoStatus = statusAprovacaoPorAcao(acao);
  const client = await getPool().connect();
  let committed = false;

  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, id);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status !== 'SUBMETIDA') {
      throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite aprovacao.`);
    }

    const validacao = await validarAlcadaDocumento(client, {
      companyId: programacao.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'programacoes-pagamento',
      tipoDocumento: 'PROGRAMACAO_PAGAMENTO',
      acao,
      valor: Number(programacao.valor_total),
      obraId: programacao.obra_id,
      centroCustoId: programacao.centro_custo_id
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'programacoes-pagamento',
      tipo_documento: 'PROGRAMACAO_PAGAMENTO',
      acao,
      valor: Number(programacao.valor_total),
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      observacoes: decisao.observacoes
    };

    if (!validacao.aprovado) {
      await persistirBloqueioAlcada(client, 'programacoes_pagamento', id, validacao.motivo, decisao.observacoes, decisao.usuarioId);
      await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update programacoes_pagamento
      set status = 'APROVADA',
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
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, acao, auditPayload, decisao.usuarioId);
    await client.query('commit');
    committed = true;
    return fetchProgramacao(id);
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const liberarProgramacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa']);
  const decisao = getPayloadDecisaoAprovacao({
    ...payload,
    observacoes: optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes')
  });
  const justificativa = decisao.observacoes;
  const client = await getPool().connect();
  let committed = false;

  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, id);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status !== 'APROVADA') {
      throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite liberacao final.`);
    }
    if (programacao.liberacao_status === 'LIBERADA' || programacao.liberado_em) {
      throw new HttpError(409, 'status_conflict', 'Programacao ja esta liberada para execucao futura.');
    }

    const bloqueios = await getBloqueiosLiberacao(client, programacao);
    if (bloqueios.length > 0) {
      throw new HttpError(409, 'liberacao_bloqueada', 'Programacao nao atende aos criterios de liberacao final.', bloqueios);
    }

    const validacao = await validarAlcadaDocumento(client, {
      companyId: programacao.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'programacoes-pagamento',
      tipoDocumento: 'PROGRAMACAO_PAGAMENTO',
      acao: 'liberar',
      valor: Number(programacao.valor_total),
      obraId: programacao.obra_id,
      centroCustoId: programacao.centro_custo_id
    });
    const origemAlcada = validacao.regra?.id || null;
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'programacoes-pagamento',
      tipo_documento: 'PROGRAMACAO_PAGAMENTO',
      acao: 'liberar',
      valor: Number(programacao.valor_total),
      quantidade_contas: Number(programacao.quantidade_contas),
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      origem_alcada: origemAlcada,
      observacoes: justificativa,
      status_anterior: programacao.status,
      status_novo: validacao.aprovado ? 'LIBERADA' : programacao.status
    };

    if (!validacao.aprovado) {
      await client.query(
        `
        update programacoes_pagamento
        set liberacao_status = 'BLOQUEADA_LIBERACAO',
            bloqueio_liberacao_motivo = $1,
            liberacao_justificativa = $2,
            updated_by = $3,
            updated_at = now()
        where id = $4
        `,
        [validacao.motivo, justificativa, decisao.usuarioId, id]
      );
      await insertLiberacaoHistorico(
        client,
        programacao,
        programacao.status,
        'BLOQUEADA_LIBERACAO',
        decisao.usuarioId,
        justificativa,
        'NEGADO',
        validacao.motivo,
        origemAlcada
      );
      await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'bloquear_liberacao', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_liberacao_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update programacoes_pagamento
      set status = 'LIBERADA',
          liberacao_status = 'LIBERADA',
          liberado_por = $1,
          liberado_em = now(),
          liberacao_justificativa = $2,
          liberacao_valor_total = valor_total,
          liberacao_quantidade_contas = quantidade_contas,
          liberacao_alcada_origem = $3,
          liberacao_status_anterior = $4,
          bloqueio_liberacao_motivo = null,
          updated_by = $1,
          updated_at = now()
      where id = $5
      `,
      [decisao.usuarioId, justificativa, origemAlcada, programacao.status, id]
    );
    await insertLiberacaoHistorico(client, programacao, 'LIBERADA', 'LIBERADA', decisao.usuarioId, justificativa, 'PERMITIDO', validacao.motivo, origemAlcada);
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'liberar', auditPayload, decisao.usuarioId);
    await client.query('commit');
    committed = true;
    return fetchProgramacao(id);
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const reprovarProgramacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa']);
  const client = await getPool().connect();
  const usuarioId = optionalUsuarioId(payload);
  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, id);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status !== 'SUBMETIDA') {
      throw new HttpError(409, 'status_conflict', `Programacao em status ${programacao.status} nao permite reprovacao.`);
    }
    await client.query(
      `
      update programacoes_pagamento
      set status = 'REPROVADA',
          aprovacao_status = 'REPROVADO',
          aprovado_por = $1,
          aprovado_em = now(),
          aprovacao_observacoes = $2,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes'), id]
    );
    await client.query(
      `
      update programacoes_pagamento_itens
      set status = 'CANCELADA', updated_at = now()
      where programacao_id = $1 and status = 'ATIVA'
      `,
      [id]
    );
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'reprovar', {
      valor_total: Number(programacao.valor_total),
      observacoes: optionalText(payload, 'observacoes'),
      justificativa: optionalText(payload, 'justificativa')
    }, usuarioId);
    await client.query('commit');
    return fetchProgramacao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const cancelarProgramacao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa']);
  const client = await getPool().connect();
  const usuarioId = optionalUsuarioId(payload);
  try {
    await client.query('begin');
    const programacao = await fetchProgramacaoForUpdate(client, id);
    if (!programacao) {
      throw new HttpError(404, 'not_found', 'Programacao de pagamento nao encontrada.');
    }
    if (programacao.status === 'CANCELADA') {
      throw new HttpError(409, 'status_conflict', 'Programacao ja esta CANCELADA.');
    }
    await client.query(
      `
      update programacoes_pagamento_itens
      set status = 'CANCELADA',
          removido_por = $1,
          removido_em = now(),
          remocao_motivo = $2,
          updated_at = now()
      where programacao_id = $3 and status = 'ATIVA'
      `,
      [usuarioId, optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes'), id]
    );
    await client.query(
      `
      update programacoes_pagamento
      set status = 'CANCELADA',
          liberacao_status = 'CANCELADA',
          cancelado_por = $1,
          cancelado_em = now(),
          cancelamento_motivo = $2,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes'), id]
    );
    await registrarAuditoria(client, programacao.company_id, 'programacao_pagamento', id, 'cancelar', {
      status_anterior: programacao.status,
      observacoes: optionalText(payload, 'observacoes'),
      justificativa: optionalText(payload, 'justificativa')
    }, usuarioId);
    await client.query('commit');
    return fetchProgramacao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const handleProgramacoesPagamento = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/programacoes-pagamento';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 1 && parts[0] === 'contas-elegiveis') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await fetchContasElegibilidade(url) });
      return;
    }

    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listProgramacoes(url) });
        return;
      }
      if (method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, 201, { data: await createProgramacao(payload) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method === 'GET') {
        const programacao = await fetchProgramacao(id);
        if (!programacao) {
          sendError(res, 404, 'not_found', 'Programacao de pagamento nao encontrada.');
          return;
        }
        sendJson(res, 200, { data: programacao });
        return;
      }
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 2 && parts[1] === 'liberacoes') {
      const [id] = parts;
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await fetchLiberacoes(id) });
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'submeter') {
        sendJson(res, 200, { data: await submeterProgramacao(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'liberar') {
        sendJson(res, 200, { data: await liberarProgramacao(id, await readJsonBody(req)) });
        return;
      }
      if (['aprovar-tecnico', 'aprovar-diretoria'].includes(action)) {
        sendJson(res, 200, { data: await aprovarProgramacao(id, action, await readJsonBody(req)) });
        return;
      }
      if (action === 'reprovar') {
        sendJson(res, 200, { data: await reprovarProgramacao(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'cancelar') {
        sendJson(res, 200, { data: await cancelarProgramacao(id, await readJsonBody(req)) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de programacao de pagamento nao encontrada.');
      return;
    }

    if (parts.length === 2 && parts[1] === 'contas') {
      const [id] = parts;
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 200, { data: await adicionarConta(id, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'contas' && parts[3] === 'remover') {
      const [id, , contaId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await removerConta(id, contaId, await readJsonBody(req)) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de programacao de pagamento nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
