import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import {
  assertUuid,
  getPayloadDecisaoAprovacao,
  optionalText,
  registrarAuditoria,
  statusAprovacaoPorAcao,
  validarAlcadaDocumento,
  type AcaoAprovacao
} from '../aprovacoes/aprovacoes.service.js';

type ContratoStatus = 'RASCUNHO' | 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' | 'CANCELADO';
type AditivoStatus = 'RASCUNHO' | 'SUBMETIDO' | 'APROVADO' | 'REPROVADO' | 'CANCELADO';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface ContratoForUpdate extends QueryResultRow {
  id: string;
  company_id: string;
  cliente_id: string;
  obra_id: string;
  centro_custo_id: string | null;
  status: ContratoStatus;
  valor_original: string;
  valor_aditivos: string;
  valor_total_contratado: string;
  data_fim: string | null;
}

interface AditivoForUpdate extends QueryResultRow {
  id: string;
  contrato_id: string;
  company_id: string;
  status: AditivoStatus;
  valor_delta: string;
  nova_data_fim: string | null;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = optionalText(payload, fieldName);
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

const optionalUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const requiredUsuarioId = (payload: Record<string, unknown>): string => {
  const usuarioId = optionalUsuarioId(payload);
  if (!usuarioId) {
    throw new HttpError(400, 'validation_error', 'Campo obrigatorio ausente: usuario_id.');
  }
  return usuarioId;
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

const normalizeMoney = (value: unknown, fieldName: string, allowZero = true): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0 || (!allowZero && normalized <= 0)) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser ${allowZero ? 'maior ou igual a zero' : 'maior que zero'}.`);
  }
  return Number(normalized.toFixed(2));
};

const normalizeQuantity = (value: unknown, fieldName: string): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser maior que zero.`);
  }
  return Number(normalized.toFixed(4));
};

const normalizeAprovacaoAction = (valor: number): AcaoAprovacao =>
  valor > 20000 ? 'aprovar_diretoria' : 'aprovar_tecnico';

const fetchContratoForUpdate = async (client: PoolClient, id: string): Promise<ContratoForUpdate | undefined> => {
  const result = await client.query<ContratoForUpdate>(
    `
    select
      id,
      company_id,
      cliente_id,
      obra_id,
      centro_custo_id,
      status,
      valor_original,
      valor_aditivos,
      valor_total_contratado,
      data_fim
    from contratos_obra
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const fetchAditivoForUpdate = async (client: PoolClient, id: string): Promise<AditivoForUpdate | undefined> => {
  const result = await client.query<AditivoForUpdate>(
    `
    select id, contrato_id, company_id, status, valor_delta, nova_data_fim
    from contratos_obra_aditivos
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const assertContratoRefs = async (
  client: PoolClient,
  companyId: string,
  clienteId: string,
  obraId: string,
  centroCustoId: string | null
): Promise<void> => {
  const refs = await client.query<{
    obra_id: string;
    obra_status: string;
    obra_cliente_id: string | null;
    obra_centro_custo_id: string | null;
    cliente_status: string;
    centro_status: string | null;
  }>(
    `
    select
      o.id as obra_id,
      o.status as obra_status,
      o.cliente_id as obra_cliente_id,
      o.centro_custo_id as obra_centro_custo_id,
      c.status as cliente_status,
      cc.status as centro_status
    from obras o
    join clientes c on c.id = $3 and c.company_id = $1
    left join centros_custo cc on cc.id = $4 and cc.company_id = $1
    where o.id = $2 and o.company_id = $1
    `,
    [companyId, obraId, clienteId, centroCustoId]
  );
  const row = refs.rows[0];
  if (!row) {
    throw new HttpError(404, 'not_found', 'Cliente ou obra nao encontrado para a empresa informada.');
  }
  if (row.cliente_status !== 'ativo') {
    throw new HttpError(409, 'cliente_inativo', 'Cliente inativo nao permite contrato de obra.');
  }
  if (row.obra_status !== 'ativo') {
    throw new HttpError(409, 'obra_inativa', 'Obra inativa nao permite contrato de obra.');
  }
  if (row.obra_cliente_id && row.obra_cliente_id !== clienteId) {
    throw new HttpError(409, 'obra_cliente_divergente', 'Cliente informado diverge do cliente vinculado a obra.');
  }
  if (centroCustoId && row.centro_status !== 'ativo') {
    throw new HttpError(409, 'centro_custo_inativo', 'Centro de custo inativo nao permite contrato de obra.');
  }
};

const getContratoMetricas = async (client: PoolClient, contratoId: string): Promise<{ valorMedido: number; valorFaturado: number; itensAtivos: number }> => {
  const result = await client.query<{ valor_medido: string; valor_faturado: string; itens_ativos: number }>(
    `
    select
      coalesce((select sum(valor_bruto) from medicoes_obra where contrato_obra_id = $1 and status <> 'CANCELADA'), 0)::numeric(14,2) as valor_medido,
      coalesce((select sum(valor_solicitado) from pedidos_faturamento where contrato_obra_id = $1 and status <> 'CANCELADO'), 0)::numeric(14,2) as valor_faturado,
      coalesce((select count(*) from contratos_obra_itens where contrato_id = $1 and status = 'ATIVO'), 0)::int as itens_ativos
    `,
    [contratoId]
  );
  const row = result.rows[0];
  return {
    valorMedido: Number(row?.valor_medido || 0),
    valorFaturado: Number(row?.valor_faturado || 0),
    itensAtivos: Number(row?.itens_ativos || 0)
  };
};

const fetchContrato = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    select
      co.id,
      co.company_id,
      co.cliente_id,
      c.nome as cliente_nome,
      co.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      co.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      co.numero,
      co.objeto,
      co.escopo_resumo,
      co.valor_original,
      co.valor_aditivos,
      co.valor_total_contratado,
      metricas.valor_medido,
      metricas.valor_faturado,
      (co.valor_total_contratado - metricas.valor_medido)::numeric(14,2) as saldo_contratual,
      co.data_inicio,
      co.data_fim,
      co.percentual_retencao_previsto,
      co.impostos_previstos,
      co.observacoes,
      co.status,
      co.ativado_por,
      ativador.nome as ativado_por_nome,
      co.ativado_em,
      co.suspenso_por,
      co.suspenso_em,
      co.suspensao_motivo,
      co.encerrado_por,
      co.encerrado_em,
      co.encerramento_motivo,
      co.cancelado_por,
      co.cancelado_em,
      co.cancelamento_motivo,
      co.created_at,
      co.updated_at,
      itens.itens,
      aditivos.aditivos
    from contratos_obra co
    join clientes c on c.id = co.cliente_id
    join obras o on o.id = co.obra_id
    left join centros_custo cc on cc.id = co.centro_custo_id
    left join usuarios ativador on ativador.id = co.ativado_por
    left join lateral (
      select
        coalesce(sum(m.valor_bruto) filter (where m.status <> 'CANCELADA'), 0)::numeric(14,2) as valor_medido,
        coalesce((
          select sum(pf.valor_solicitado)
          from pedidos_faturamento pf
          where pf.contrato_obra_id = co.id and pf.status <> 'CANCELADO'
        ), 0)::numeric(14,2) as valor_faturado
      from medicoes_obra m
      where m.contrato_obra_id = co.id
    ) metricas on true
    left join lateral (
      select coalesce(json_agg(json_build_object(
        'id', ci.id,
        'contrato_id', ci.contrato_id,
        'codigo', ci.codigo,
        'descricao', ci.descricao,
        'unidade', ci.unidade,
        'quantidade', ci.quantidade,
        'valor_unitario', ci.valor_unitario,
        'valor_total', ci.valor_total,
        'centro_custo_id', ci.centro_custo_id,
        'centro_custo_codigo', cicc.codigo,
        'centro_custo_nome', cicc.nome,
        'etapa_servico', ci.etapa_servico,
        'status', ci.status,
        'inativado_por', ci.inativado_por,
        'inativado_em', ci.inativado_em,
        'inativacao_motivo', ci.inativacao_motivo,
        'created_at', ci.created_at,
        'updated_at', ci.updated_at
      ) order by ci.created_at), '[]'::json) as itens
      from contratos_obra_itens ci
      left join centros_custo cicc on cicc.id = ci.centro_custo_id
      where ci.contrato_id = co.id
    ) itens on true
    left join lateral (
      select coalesce(json_agg(json_build_object(
        'id', ca.id,
        'contrato_id', ca.contrato_id,
        'numero', ca.numero,
        'tipo', ca.tipo,
        'descricao', ca.descricao,
        'escopo_descricao', ca.escopo_descricao,
        'valor_delta', ca.valor_delta,
        'prazo_delta_dias', ca.prazo_delta_dias,
        'nova_data_fim', ca.nova_data_fim,
        'justificativa', ca.justificativa,
        'status', ca.status,
        'aprovacao_status', ca.aprovacao_status,
        'aprovado_por', ca.aprovado_por,
        'aprovado_em', ca.aprovado_em,
        'bloqueio_alcada_motivo', ca.bloqueio_alcada_motivo,
        'created_at', ca.created_at,
        'updated_at', ca.updated_at
      ) order by ca.created_at desc), '[]'::json) as aditivos
      from contratos_obra_aditivos ca
      where ca.contrato_id = co.id
    ) aditivos on true
    where co.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const listContratos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`co.status = $${params.length}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    params.push(assertUuid(clienteId, 'cliente_id'));
    conditions.push(`co.cliente_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`co.obra_id = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      co.id,
      co.company_id,
      co.numero,
      co.objeto,
      co.status,
      co.cliente_id,
      c.nome as cliente_nome,
      co.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      co.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      co.valor_original,
      co.valor_aditivos,
      co.valor_total_contratado,
      coalesce(medido.valor_medido, 0)::numeric(14,2) as valor_medido,
      (co.valor_total_contratado - coalesce(medido.valor_medido, 0))::numeric(14,2) as saldo_contratual,
      co.data_inicio,
      co.data_fim,
      co.created_at,
      co.updated_at
    from contratos_obra co
    join clientes c on c.id = co.cliente_id
    join obras o on o.id = co.obra_id
    left join centros_custo cc on cc.id = co.centro_custo_id
    left join lateral (
      select sum(valor_bruto) as valor_medido
      from medicoes_obra m
      where m.contrato_obra_id = co.id and m.status <> 'CANCELADA'
    ) medido on true
    ${where}
    order by co.created_at desc
    `,
    params
  );
  return result.rows;
};

const createContrato = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'cliente_id',
    'obra_id',
    'centro_custo_id',
    'numero',
    'objeto',
    'escopo_resumo',
    'valor_original',
    'data_inicio',
    'data_fim',
    'percentual_retencao_previsto',
    'impostos_previstos',
    'observacoes',
    'usuario_id'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const clienteId = assertUuid(payload.cliente_id, 'cliente_id');
  const obraId = assertUuid(payload.obra_id, 'obra_id');
  const centroCustoId = optionalUuid(payload, 'centro_custo_id');
  const valorOriginal = normalizeMoney(payload.valor_original, 'valor_original', false);
  const dataInicio = optionalDate(payload, 'data_inicio');
  const dataFim = optionalDate(payload, 'data_fim');
  if (dataInicio && dataFim && dataFim < dataInicio) {
    throw new HttpError(400, 'validation_error', 'data_fim nao pode ser anterior a data_inicio.');
  }
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await assertContratoRefs(client, companyId, clienteId, obraId, centroCustoId);
    const created = await client.query<{ id: string }>(
      `
      insert into contratos_obra (
        company_id,
        cliente_id,
        obra_id,
        centro_custo_id,
        numero,
        objeto,
        escopo_resumo,
        valor_original,
        valor_total_contratado,
        data_inicio,
        data_fim,
        percentual_retencao_previsto,
        impostos_previstos,
        observacoes,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $14)
      returning id
      `,
      [
        companyId,
        clienteId,
        obraId,
        centroCustoId,
        requiredText(payload, 'numero'),
        requiredText(payload, 'objeto'),
        optionalText(payload, 'escopo_resumo'),
        valorOriginal,
        dataInicio,
        dataFim,
        hasOwn(payload, 'percentual_retencao_previsto') ? normalizeMoney(payload.percentual_retencao_previsto, 'percentual_retencao_previsto') : null,
        optionalText(payload, 'impostos_previstos'),
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, companyId, 'contrato_obra', created.rows[0].id, 'criar', {
      numero: requiredText(payload, 'numero'),
      valor_original: valorOriginal,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(created.rows[0].id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateContrato = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, [
    'cliente_id',
    'obra_id',
    'centro_custo_id',
    'numero',
    'objeto',
    'escopo_resumo',
    'valor_original',
    'data_inicio',
    'data_fim',
    'percentual_retencao_previsto',
    'impostos_previstos',
    'observacoes',
    'usuario_id'
  ]);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, id);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (contrato.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite edicao.`);
    }

    const nextClienteId = hasOwn(payload, 'cliente_id') ? assertUuid(payload.cliente_id, 'cliente_id') : contrato.cliente_id;
    const nextObraId = hasOwn(payload, 'obra_id') ? assertUuid(payload.obra_id, 'obra_id') : contrato.obra_id;
    const nextCentroCustoId = hasOwn(payload, 'centro_custo_id') ? optionalUuid(payload, 'centro_custo_id') : contrato.centro_custo_id;
    await assertContratoRefs(client, contrato.company_id, nextClienteId, nextObraId, nextCentroCustoId);

    const updates: Array<{ column: string; value: unknown }> = [];
    if (hasOwn(payload, 'cliente_id')) updates.push({ column: 'cliente_id', value: nextClienteId });
    if (hasOwn(payload, 'obra_id')) updates.push({ column: 'obra_id', value: nextObraId });
    if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: nextCentroCustoId });
    if (hasOwn(payload, 'numero')) updates.push({ column: 'numero', value: requiredText(payload, 'numero') });
    if (hasOwn(payload, 'objeto')) updates.push({ column: 'objeto', value: requiredText(payload, 'objeto') });
    if (hasOwn(payload, 'escopo_resumo')) updates.push({ column: 'escopo_resumo', value: optionalText(payload, 'escopo_resumo') });
    if (hasOwn(payload, 'valor_original')) {
      const valorOriginal = normalizeMoney(payload.valor_original, 'valor_original', false);
      updates.push({ column: 'valor_original', value: valorOriginal });
      updates.push({ column: 'valor_total_contratado', value: Number((valorOriginal + Number(contrato.valor_aditivos)).toFixed(2)) });
    }
    if (hasOwn(payload, 'data_inicio')) updates.push({ column: 'data_inicio', value: optionalDate(payload, 'data_inicio') });
    if (hasOwn(payload, 'data_fim')) updates.push({ column: 'data_fim', value: optionalDate(payload, 'data_fim') });
    if (hasOwn(payload, 'percentual_retencao_previsto')) {
      updates.push({
        column: 'percentual_retencao_previsto',
        value: payload.percentual_retencao_previsto === null ? null : normalizeMoney(payload.percentual_retencao_previsto, 'percentual_retencao_previsto')
      });
    }
    if (hasOwn(payload, 'impostos_previstos')) updates.push({ column: 'impostos_previstos', value: optionalText(payload, 'impostos_previstos') });
    if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update contratos_obra
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, id]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra', id, 'editar', {
      campos: updates.map((update) => update.column),
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const ativarContrato = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const usuarioId = requiredUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, id);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (!['RASCUNHO', 'SUSPENSO'].includes(contrato.status)) {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite ativacao.`);
    }
    const metricas = await getContratoMetricas(client, id);
    if (metricas.itensAtivos <= 0) {
      throw new HttpError(409, 'escopo_ausente', 'Contrato exige ao menos um item de escopo ativo para ativacao.');
    }
    await client.query(
      `
      update contratos_obra
      set status = 'ATIVO',
          ativado_por = $1,
          ativado_em = now(),
          updated_by = $1,
          updated_at = now()
      where id = $2
      `,
      [usuarioId, id]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra', id, 'ativar', {
      status_anterior: contrato.status,
      status_novo: 'ATIVO',
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const mudarStatusContrato = async (
  id: string,
  payload: Record<string, unknown>,
  action: 'suspender' | 'encerrar' | 'cancelar',
  statusNovo: ContratoStatus
) => {
  assertUuid(id, 'id');
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo ou observacao obrigatorio para alteracao de status.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, id);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (contrato.status === 'CANCELADO' || contrato.status === 'ENCERRADO') {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite ${action}.`);
    }
    if (action === 'suspender' && contrato.status !== 'ATIVO') {
      throw new HttpError(409, 'status_conflict', 'Somente contrato ATIVO pode ser suspenso.');
    }
    const userColumn = action === 'suspender' ? 'suspenso_por' : action === 'encerrar' ? 'encerrado_por' : 'cancelado_por';
    const dateColumn = action === 'suspender' ? 'suspenso_em' : action === 'encerrar' ? 'encerrado_em' : 'cancelado_em';
    const reasonColumn = action === 'suspender' ? 'suspensao_motivo' : action === 'encerrar' ? 'encerramento_motivo' : 'cancelamento_motivo';
    await client.query(
      `
      update contratos_obra
      set status = $1,
          ${userColumn} = $2,
          ${dateColumn} = now(),
          ${reasonColumn} = $3,
          updated_by = $2,
          updated_at = now()
      where id = $4
      `,
      [statusNovo, usuarioId, motivo, id]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra', id, action, {
      status_anterior: contrato.status,
      status_novo: statusNovo,
      motivo,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const addItemContrato = async (contratoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertAllowedFields(payload, ['codigo', 'descricao', 'unidade', 'quantidade', 'valor_unitario', 'centro_custo_id', 'etapa_servico', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const quantidade = normalizeQuantity(payload.quantidade, 'quantidade');
  const valorUnitario = normalizeMoney(payload.valor_unitario, 'valor_unitario');
  const valorTotal = Number((quantidade * valorUnitario).toFixed(2));
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (contrato.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite alterar itens diretamente.`);
    }
    await client.query(
      `
      insert into contratos_obra_itens (
        contrato_id,
        company_id,
        codigo,
        descricao,
        unidade,
        quantidade,
        valor_unitario,
        valor_total,
        centro_custo_id,
        etapa_servico,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      `,
      [
        contratoId,
        contrato.company_id,
        optionalText(payload, 'codigo'),
        requiredText(payload, 'descricao'),
        requiredText(payload, 'unidade'),
        quantidade,
        valorUnitario,
        valorTotal,
        optionalUuid(payload, 'centro_custo_id'),
        optionalText(payload, 'etapa_servico'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra', contratoId, 'adicionar_item', {
      descricao: requiredText(payload, 'descricao'),
      valor_total: valorTotal,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateItemContrato = async (contratoId: string, itemId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(itemId, 'itemId');
  assertAllowedFields(payload, ['codigo', 'descricao', 'unidade', 'quantidade', 'valor_unitario', 'centro_custo_id', 'etapa_servico', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (contrato.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite editar item diretamente.`);
    }
    const item = await client.query<{ id: string; quantidade: string; valor_unitario: string }>(
      'select id, quantidade, valor_unitario from contratos_obra_itens where id = $1 and contrato_id = $2 for update',
      [itemId, contratoId]
    );
    const current = item.rows[0];
    if (!current) {
      throw new HttpError(404, 'not_found', 'Item de contrato nao encontrado.');
    }
    const quantidade = hasOwn(payload, 'quantidade') ? normalizeQuantity(payload.quantidade, 'quantidade') : Number(current.quantidade);
    const valorUnitario = hasOwn(payload, 'valor_unitario') ? normalizeMoney(payload.valor_unitario, 'valor_unitario') : Number(current.valor_unitario);
    const updates: Array<{ column: string; value: unknown }> = [
      { column: 'quantidade', value: quantidade },
      { column: 'valor_unitario', value: valorUnitario },
      { column: 'valor_total', value: Number((quantidade * valorUnitario).toFixed(2)) }
    ];
    if (hasOwn(payload, 'codigo')) updates.push({ column: 'codigo', value: optionalText(payload, 'codigo') });
    if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
    if (hasOwn(payload, 'unidade')) updates.push({ column: 'unidade', value: requiredText(payload, 'unidade') });
    if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
    if (hasOwn(payload, 'etapa_servico')) updates.push({ column: 'etapa_servico', value: optionalText(payload, 'etapa_servico') });
    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update contratos_obra_itens
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, itemId]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra_item', itemId, 'editar', {
      contrato_id: contratoId,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const inativarItemContrato = async (contratoId: string, itemId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(itemId, 'itemId');
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (contrato.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite inativar item diretamente.`);
    }
    const updated = await client.query(
      `
      update contratos_obra_itens
      set status = 'INATIVO',
          inativado_por = $1,
          inativado_em = now(),
          inativacao_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3 and contrato_id = $4 and status = 'ATIVO'
      returning id
      `,
      [usuarioId, motivo, itemId, contratoId]
    );
    if (!updated.rows[0]) {
      throw new HttpError(404, 'not_found', 'Item ativo de contrato nao encontrado.');
    }
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra_item', itemId, 'inativar', {
      contrato_id: contratoId,
      motivo,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listAditivos = async (contratoId: string): Promise<QueryResultRow[]> => {
  assertUuid(contratoId, 'id');
  const result = await getPool().query(
    `
    select
      ca.*,
      aprovador.nome as aprovado_por_nome,
      submetido.nome as submetido_por_nome
    from contratos_obra_aditivos ca
    left join usuarios aprovador on aprovador.id = ca.aprovado_por
    left join usuarios submetido on submetido.id = ca.submetido_por
    where ca.contrato_id = $1
    order by ca.created_at desc
    `,
    [contratoId]
  );
  return result.rows;
};

const createAditivo = async (contratoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertAllowedFields(payload, ['numero', 'tipo', 'descricao', 'escopo_descricao', 'valor_delta', 'prazo_delta_dias', 'nova_data_fim', 'justificativa', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const valorDelta = normalizeMoney(payload.valor_delta ?? 0, 'valor_delta');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    if (!contrato) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado.');
    }
    if (!['ATIVO', 'SUSPENSO'].includes(contrato.status)) {
      throw new HttpError(409, 'status_conflict', `Contrato em status ${contrato.status} nao permite aditivo.`);
    }
    const created = await client.query<{ id: string }>(
      `
      insert into contratos_obra_aditivos (
        contrato_id,
        company_id,
        numero,
        tipo,
        descricao,
        escopo_descricao,
        valor_delta,
        prazo_delta_dias,
        nova_data_fim,
        justificativa,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      returning id
      `,
      [
        contratoId,
        contrato.company_id,
        requiredText(payload, 'numero'),
        optionalText(payload, 'tipo') || 'VALOR_ESCOPO',
        requiredText(payload, 'descricao'),
        optionalText(payload, 'escopo_descricao'),
        valorDelta,
        hasOwn(payload, 'prazo_delta_dias') && payload.prazo_delta_dias !== null ? Number(payload.prazo_delta_dias) : null,
        optionalDate(payload, 'nova_data_fim'),
        optionalText(payload, 'justificativa'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra_aditivo', created.rows[0].id, 'criar', {
      contrato_id: contratoId,
      valor_delta: valorDelta,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateAditivo = async (contratoId: string, aditivoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(aditivoId, 'aditivoId');
  assertAllowedFields(payload, ['numero', 'tipo', 'descricao', 'escopo_descricao', 'valor_delta', 'prazo_delta_dias', 'nova_data_fim', 'justificativa', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    const aditivo = await fetchAditivoForUpdate(client, aditivoId);
    if (!contrato || !aditivo || aditivo.contrato_id !== contratoId) {
      throw new HttpError(404, 'not_found', 'Aditivo contratual nao encontrado.');
    }
    if (aditivo.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Aditivo em status ${aditivo.status} nao permite edicao.`);
    }
    const updates: Array<{ column: string; value: unknown }> = [];
    if (hasOwn(payload, 'numero')) updates.push({ column: 'numero', value: requiredText(payload, 'numero') });
    if (hasOwn(payload, 'tipo')) updates.push({ column: 'tipo', value: optionalText(payload, 'tipo') || 'VALOR_ESCOPO' });
    if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
    if (hasOwn(payload, 'escopo_descricao')) updates.push({ column: 'escopo_descricao', value: optionalText(payload, 'escopo_descricao') });
    if (hasOwn(payload, 'valor_delta')) updates.push({ column: 'valor_delta', value: normalizeMoney(payload.valor_delta, 'valor_delta') });
    if (hasOwn(payload, 'prazo_delta_dias')) updates.push({ column: 'prazo_delta_dias', value: payload.prazo_delta_dias === null ? null : Number(payload.prazo_delta_dias) });
    if (hasOwn(payload, 'nova_data_fim')) updates.push({ column: 'nova_data_fim', value: optionalDate(payload, 'nova_data_fim') });
    if (hasOwn(payload, 'justificativa')) updates.push({ column: 'justificativa', value: optionalText(payload, 'justificativa') });
    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }
    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update contratos_obra_aditivos
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, aditivoId]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra_aditivo', aditivoId, 'editar', {
      contrato_id: contratoId,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const submeterAditivo = async (contratoId: string, aditivoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(aditivoId, 'aditivoId');
  const usuarioId = requiredUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const aditivo = await fetchAditivoForUpdate(client, aditivoId);
    if (!aditivo || aditivo.contrato_id !== contratoId) {
      throw new HttpError(404, 'not_found', 'Aditivo contratual nao encontrado.');
    }
    if (aditivo.status !== 'RASCUNHO') {
      throw new HttpError(409, 'status_conflict', `Aditivo em status ${aditivo.status} nao permite submissao.`);
    }
    await client.query(
      `
      update contratos_obra_aditivos
      set status = 'SUBMETIDO',
          aprovacao_status = 'PENDENTE_APROVACAO',
          submetido_por = $1,
          submetido_em = now(),
          updated_by = $1,
          updated_at = now()
      where id = $2
      `,
      [usuarioId, aditivoId]
    );
    await registrarAuditoria(client, aditivo.company_id, 'contrato_obra_aditivo', aditivoId, 'submeter', {
      contrato_id: contratoId,
      valor_delta: Number(aditivo.valor_delta),
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const aprovarAditivo = async (contratoId: string, aditivoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(aditivoId, 'aditivoId');
  const decisao = getPayloadDecisaoAprovacao(payload);
  const client = await getPool().connect();
  let committed = false;
  try {
    await client.query('begin');
    const contrato = await fetchContratoForUpdate(client, contratoId);
    const aditivo = await fetchAditivoForUpdate(client, aditivoId);
    if (!contrato || !aditivo || aditivo.contrato_id !== contratoId) {
      throw new HttpError(404, 'not_found', 'Aditivo contratual nao encontrado.');
    }
    if (aditivo.status !== 'SUBMETIDO') {
      throw new HttpError(409, 'status_conflict', `Aditivo em status ${aditivo.status} nao permite aprovacao.`);
    }
    const valor = Number(aditivo.valor_delta);
    const acao = normalizeAprovacaoAction(valor);
    const validacao = await validarAlcadaDocumento(client, {
      companyId: contrato.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'contratos-obra',
      tipoDocumento: 'ADITIVO_CONTRATUAL',
      acao,
      valor,
      obraId: contrato.obra_id,
      centroCustoId: contrato.centro_custo_id
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'contratos-obra',
      tipo_documento: 'ADITIVO_CONTRATUAL',
      acao,
      valor,
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      contrato_id: contratoId,
      observacoes: decisao.observacoes,
      marker: 'DEV_LOCAL_V3_7'
    };

    if (!validacao.aprovado) {
      await client.query(
        `
        update contratos_obra_aditivos
        set aprovacao_status = 'BLOQUEADO_ALCADA',
            aprovado_por = $1,
            aprovado_em = now(),
            aprovacao_observacoes = $2,
            bloqueio_alcada_motivo = $3,
            updated_by = $1,
            updated_at = now()
        where id = $4
        `,
        [decisao.usuarioId, decisao.observacoes, validacao.motivo, aditivoId]
      );
      await registrarAuditoria(client, contrato.company_id, 'contrato_obra_aditivo', aditivoId, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    const novoValorAditivos = Number((Number(contrato.valor_aditivos) + valor).toFixed(2));
    const novoValorTotal = Number((Number(contrato.valor_original) + novoValorAditivos).toFixed(2));
    await client.query(
      `
      update contratos_obra_aditivos
      set status = 'APROVADO',
          aprovacao_status = $1,
          aprovado_por = $2,
          aprovado_em = now(),
          aprovacao_observacoes = $3,
          bloqueio_alcada_motivo = null,
          updated_by = $2,
          updated_at = now()
      where id = $4
      `,
      [statusAprovacaoPorAcao(acao), decisao.usuarioId, decisao.observacoes, aditivoId]
    );
    await client.query(
      `
      update contratos_obra
      set valor_aditivos = $1,
          valor_total_contratado = $2,
          data_fim = coalesce($3, data_fim),
          updated_by = $4,
          updated_at = now()
      where id = $5
      `,
      [novoValorAditivos, novoValorTotal, aditivo.nova_data_fim, decisao.usuarioId, contratoId]
    );
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra_aditivo', aditivoId, 'aprovar', auditPayload, decisao.usuarioId);
    await registrarAuditoria(client, contrato.company_id, 'contrato_obra', contratoId, 'aplicar_aditivo', {
      aditivo_id: aditivoId,
      valor_delta: valor,
      valor_total_contratado: novoValorTotal,
      marker: 'DEV_LOCAL_V3_7'
    }, decisao.usuarioId);
    await client.query('commit');
    committed = true;
    return fetchContrato(contratoId);
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const reprovarAditivo = async (contratoId: string, aditivoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(aditivoId, 'aditivoId');
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo obrigatorio para reprovar aditivo.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const aditivo = await fetchAditivoForUpdate(client, aditivoId);
    if (!aditivo || aditivo.contrato_id !== contratoId) {
      throw new HttpError(404, 'not_found', 'Aditivo contratual nao encontrado.');
    }
    if (aditivo.status !== 'SUBMETIDO') {
      throw new HttpError(409, 'status_conflict', `Aditivo em status ${aditivo.status} nao permite reprovacao.`);
    }
    await client.query(
      `
      update contratos_obra_aditivos
      set status = 'REPROVADO',
          aprovacao_status = 'REPROVADO',
          reprovado_por = $1,
          reprovado_em = now(),
          reprovacao_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, motivo, aditivoId]
    );
    await registrarAuditoria(client, aditivo.company_id, 'contrato_obra_aditivo', aditivoId, 'reprovar', {
      contrato_id: contratoId,
      motivo,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const cancelarAditivo = async (contratoId: string, aditivoId: string, payload: Record<string, unknown>) => {
  assertUuid(contratoId, 'id');
  assertUuid(aditivoId, 'aditivoId');
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const aditivo = await fetchAditivoForUpdate(client, aditivoId);
    if (!aditivo || aditivo.contrato_id !== contratoId) {
      throw new HttpError(404, 'not_found', 'Aditivo contratual nao encontrado.');
    }
    if (aditivo.status === 'APROVADO') {
      throw new HttpError(409, 'status_conflict', 'Aditivo aprovado nao pode ser cancelado nesta versao.');
    }
    await client.query(
      `
      update contratos_obra_aditivos
      set status = 'CANCELADO',
          cancelado_por = $1,
          cancelado_em = now(),
          cancelamento_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, motivo, aditivoId]
    );
    await registrarAuditoria(client, aditivo.company_id, 'contrato_obra_aditivo', aditivoId, 'cancelar', {
      contrato_id: contratoId,
      motivo,
      marker: 'DEV_LOCAL_V3_7'
    }, usuarioId);
    await client.query('commit');
    return fetchContrato(contratoId);
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
    sendError(res, 409, 'unique_violation', 'Contrato ou aditivo duplicado para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para contrato de obra.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor ou status invalido em contrato de obra.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleContratosObra = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/contratos-obra';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listContratos(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createContrato(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method === 'GET') {
        const contrato = await fetchContrato(id);
        if (!contrato) {
          sendError(res, 404, 'not_found', 'Contrato de obra nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: contrato });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updateContrato(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'ativar') {
        sendJson(res, 200, { data: await ativarContrato(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'suspender') {
        sendJson(res, 200, { data: await mudarStatusContrato(id, await readJsonBody(req), 'suspender', 'SUSPENSO') });
        return;
      }
      if (action === 'encerrar') {
        sendJson(res, 200, { data: await mudarStatusContrato(id, await readJsonBody(req), 'encerrar', 'ENCERRADO') });
        return;
      }
      if (action === 'cancelar') {
        sendJson(res, 200, { data: await mudarStatusContrato(id, await readJsonBody(req), 'cancelar', 'CANCELADO') });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de contrato nao encontrada.');
      return;
    }

    if (parts.length === 2 && parts[1] === 'itens') {
      const [id] = parts;
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 200, { data: await addItemContrato(id, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 3 && parts[1] === 'itens') {
      const [id, , itemId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await updateItemContrato(id, itemId, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'itens' && parts[3] === 'inativar') {
      const [id, , itemId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await inativarItemContrato(id, itemId, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'aditivos') {
      const [id] = parts;
      if (method === 'GET') {
        sendJson(res, 200, { data: await listAditivos(id) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 200, { data: await createAditivo(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 3 && parts[1] === 'aditivos') {
      const [id, , aditivoId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await updateAditivo(id, aditivoId, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'aditivos' && method === 'PATCH') {
      const [id, , aditivoId, action] = parts;
      if (action === 'submeter') {
        sendJson(res, 200, { data: await submeterAditivo(id, aditivoId, await readJsonBody(req)) });
        return;
      }
      if (action === 'aprovar') {
        sendJson(res, 200, { data: await aprovarAditivo(id, aditivoId, await readJsonBody(req)) });
        return;
      }
      if (action === 'reprovar') {
        sendJson(res, 200, { data: await reprovarAditivo(id, aditivoId, await readJsonBody(req)) });
        return;
      }
      if (action === 'cancelar') {
        sendJson(res, 200, { data: await cancelarAditivo(id, aditivoId, await readJsonBody(req)) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de aditivo nao encontrada.');
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de contrato de obra nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
