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

type MedicaoStatus =
  | 'RASCUNHO'
  | 'SUBMETIDA'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'DEVOLVIDA'
  | 'CANCELADA'
  | 'FATURAMENTO_SOLICITADO'
  | 'FATURADO_MANUALMENTE';

type PedidoFaturamentoStatus = 'SOLICITADO' | 'APROVADO' | 'FATURADO_MANUALMENTE' | 'CANCELADO';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface MedicaoForUpdate extends QueryResultRow {
  id: string;
  company_id: string;
  obra_id: string;
  centro_custo_id: string | null;
  cliente_id: string;
  numero: string;
  status: MedicaoStatus;
  valor_bruto: string;
  retencoes_previstas: string;
  impostos_estimados: string;
  valor_liquido_previsto: string;
  contrato_obra_id: string | null;
  contrato_obra_aditivo_id: string | null;
}

interface PedidoForUpdate extends QueryResultRow {
  id: string;
  medicao_id: string;
  company_id: string;
  cliente_id: string;
  obra_id: string;
  status: PedidoFaturamentoStatus;
  valor_solicitado: string;
  contrato_obra_id: string | null;
  contrato_obra_aditivo_id: string | null;
}

interface ObraClienteRow extends QueryResultRow {
  obra_id: string;
  company_id: string;
  obra_status: string;
  cliente_id: string | null;
  centro_custo_id: string | null;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const competenciaPattern = /^\d{4}-\d{2}$/;
const editableMedicaoStatuses: MedicaoStatus[] = ['RASCUNHO', 'DEVOLVIDA'];

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

const normalizeCompetencia = (payload: Record<string, unknown>): string => {
  const value = requiredText(payload, 'competencia');
  if (competenciaPattern.test(value)) {
    return `${value}-01`;
  }
  if (datePattern.test(value)) {
    return value;
  }
  throw new HttpError(400, 'validation_error', 'Competencia invalida. Use YYYY-MM ou YYYY-MM-DD.');
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

const normalizeAprovacaoAction = (valor: number): AcaoAprovacao =>
  valor > 20000 ? 'aprovar_diretoria' : 'aprovar_tecnico';

const gerarCodigo = (prefix: 'MED' | 'PF'): string => {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
};

const assertPeriodo = (inicio: string, fim: string): void => {
  if (fim < inicio) {
    throw new HttpError(400, 'validation_error', 'periodo_fim nao pode ser anterior a periodo_inicio.');
  }
};

const fetchObraCliente = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  clienteId: string
): Promise<ObraClienteRow> => {
  const result = await client.query<ObraClienteRow>(
    `
    select
      o.id as obra_id,
      o.company_id,
      o.status as obra_status,
      o.cliente_id,
      o.centro_custo_id
    from obras o
    where o.id = $1 and o.company_id = $2
    `,
    [obraId, companyId]
  );
  const obra = result.rows[0];
  if (!obra) {
    throw new HttpError(404, 'not_found', 'Obra nao encontrada para a empresa informada.');
  }
  if (obra.obra_status !== 'ativo') {
    throw new HttpError(409, 'obra_inativa', 'Obra inativa nao permite medicao.');
  }

  const cliente = await client.query<{ id: string; status: string }>(
    `
    select id, status
    from clientes
    where id = $1 and company_id = $2
    `,
    [clienteId, companyId]
  );
  const clienteRow = cliente.rows[0];
  if (!clienteRow) {
    throw new HttpError(404, 'not_found', 'Cliente nao encontrado para a empresa informada.');
  }
  if (clienteRow.status !== 'ativo') {
    throw new HttpError(409, 'cliente_inativo', 'Cliente inativo nao permite medicao.');
  }
  if (obra.cliente_id && obra.cliente_id !== clienteId) {
    throw new HttpError(409, 'obra_cliente_divergente', 'Cliente informado diverge do cliente vinculado a obra.');
  }

  return obra;
};

const fetchMedicaoForUpdate = async (client: PoolClient, id: string): Promise<MedicaoForUpdate | undefined> => {
  const result = await client.query<MedicaoForUpdate>(
    `
    select
      id,
      company_id,
      obra_id,
      centro_custo_id,
      cliente_id,
      numero,
      status,
      valor_bruto,
      retencoes_previstas,
      impostos_estimados,
      valor_liquido_previsto,
      contrato_obra_id,
      contrato_obra_aditivo_id
    from medicoes_obra
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const fetchPedidoForUpdate = async (client: PoolClient, id: string): Promise<PedidoForUpdate | undefined> => {
  const result = await client.query<PedidoForUpdate>(
    `
    select
      id,
      medicao_id,
      company_id,
      cliente_id,
      obra_id,
      status,
      valor_solicitado,
      contrato_obra_id,
      contrato_obra_aditivo_id
    from pedidos_faturamento
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const validarContratoMedicao = async (client: PoolClient, medicaoId: string): Promise<void> => {
  const result = await client.query<{
    id: string;
    company_id: string;
    obra_id: string;
    cliente_id: string;
    centro_custo_id: string | null;
    valor_bruto: string;
    contrato_obra_id: string | null;
    contrato_obra_aditivo_id: string | null;
  }>(
    `
    select
      id,
      company_id,
      obra_id,
      cliente_id,
      centro_custo_id,
      valor_bruto,
      contrato_obra_id,
      contrato_obra_aditivo_id
    from medicoes_obra
    where id = $1
    `,
    [medicaoId]
  );
  const medicao = result.rows[0];
  if (!medicao) {
    throw new HttpError(404, 'not_found', 'Medicao nao encontrada para validacao contratual.');
  }

  const contratosAtivos = await client.query<{ total: number }>(
    `
    select count(*)::int as total
    from contratos_obra
    where company_id = $1 and obra_id = $2 and status = 'ATIVO'
    `,
    [medicao.company_id, medicao.obra_id]
  );
  if (!medicao.contrato_obra_id) {
    if (Number(contratosAtivos.rows[0]?.total || 0) > 0) {
      throw new HttpError(409, 'contrato_obrigatorio', 'Obra possui contrato ativo; medicao deve informar contrato_obra_id.');
    }
    return;
  }

  const contratoResult = await client.query<{
    id: string;
    company_id: string;
    cliente_id: string;
    obra_id: string;
    centro_custo_id: string | null;
    status: string;
    valor_total_contratado: string;
  }>(
    `
    select id, company_id, cliente_id, obra_id, centro_custo_id, status, valor_total_contratado
    from contratos_obra
    where id = $1
    `,
    [medicao.contrato_obra_id]
  );
  const contrato = contratoResult.rows[0];
  if (!contrato) {
    throw new HttpError(404, 'contrato_nao_encontrado', 'Contrato de obra vinculado a medicao nao foi encontrado.');
  }
  if (contrato.status !== 'ATIVO') {
    throw new HttpError(409, 'contrato_inativo', `Contrato de obra em status ${contrato.status} nao permite medicao.`);
  }
  if (contrato.company_id !== medicao.company_id || contrato.obra_id !== medicao.obra_id || contrato.cliente_id !== medicao.cliente_id) {
    throw new HttpError(409, 'contrato_divergente', 'Contrato de obra diverge da empresa, cliente ou obra da medicao.');
  }
  if (contrato.centro_custo_id && medicao.centro_custo_id && contrato.centro_custo_id !== medicao.centro_custo_id) {
    throw new HttpError(409, 'contrato_centro_custo_divergente', 'Centro de custo da medicao diverge do contrato.');
  }

  if (medicao.contrato_obra_aditivo_id) {
    const aditivo = await client.query<{ id: string; status: string }>(
      `
      select id, status
      from contratos_obra_aditivos
      where id = $1 and contrato_id = $2
      `,
      [medicao.contrato_obra_aditivo_id, contrato.id]
    );
    if (!aditivo.rows[0]) {
      throw new HttpError(404, 'aditivo_nao_encontrado', 'Aditivo vinculado a medicao nao pertence ao contrato.');
    }
    if (aditivo.rows[0].status !== 'APROVADO') {
      throw new HttpError(409, 'aditivo_nao_aprovado', 'Aditivo precisa estar APROVADO para liberar medicao/faturamento.');
    }
  }

  const usado = await client.query<{ total: string }>(
    `
    select coalesce(sum(valor_bruto), 0)::numeric(14,2) as total
    from medicoes_obra
    where contrato_obra_id = $1
      and id <> $2
      and status <> 'CANCELADA'
    `,
    [contrato.id, medicao.id]
  );
  const valorUsado = Number(usado.rows[0]?.total || 0);
  const valorMedicao = Number(medicao.valor_bruto || 0);
  const valorTotalContrato = Number(contrato.valor_total_contratado || 0);
  if (valorUsado + valorMedicao > valorTotalContrato) {
    throw new HttpError(409, 'saldo_contratual_insuficiente', 'Valor medido excede saldo contratual aprovado. Aprove aditivo antes de medir/faturar fora do escopo.', {
      valor_usado: valorUsado,
      valor_medicao: valorMedicao,
      valor_total_contratado: valorTotalContrato
    });
  }
};

const fetchMedicao = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    select
      m.id,
      m.company_id,
      m.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      m.cliente_id,
      c.nome as cliente_nome,
      m.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      m.contrato_obra_id,
      co.numero as contrato_obra_numero,
      co.valor_total_contratado as contrato_obra_valor_total,
      m.contrato_obra_aditivo_id,
      ca.numero as contrato_obra_aditivo_numero,
      m.contrato_cliente_id,
      m.contrato_escopo,
      m.numero,
      m.competencia,
      m.periodo_inicio,
      m.periodo_fim,
      m.valor_medido,
      m.valor_bruto,
      m.valor_retido,
      m.retencoes_previstas,
      m.impostos_estimados,
      m.valor_liquido_previsto,
      m.percentual_fisico,
      m.status,
      m.responsavel_id,
      responsavel.nome as responsavel_nome,
      m.aprovacao_status,
      m.aprovado_por,
      aprovador.nome as aprovado_por_nome,
      m.aprovado_em,
      m.aprovacao_observacoes,
      m.bloqueio_alcada_motivo,
      m.submetido_por,
      submetido.nome as submetido_por_nome,
      m.submetido_em,
      m.devolvido_por,
      devolvedor.nome as devolvido_por_nome,
      m.devolvido_em,
      m.devolucao_motivo,
      m.cancelado_por,
      cancelador.nome as cancelado_por_nome,
      m.cancelado_em,
      m.cancelamento_motivo,
      m.faturamento_solicitado_por,
      solicitante_faturamento.nome as faturamento_solicitado_por_nome,
      m.faturamento_solicitado_em,
      m.faturado_manual_por,
      faturador.nome as faturado_manual_por_nome,
      m.faturado_manual_em,
      m.faturado_manual_data,
      m.faturado_manual_observacoes,
      m.observacoes,
      m.created_at,
      m.updated_at,
      coalesce(json_agg(json_build_object(
        'id', mi.id,
        'medicao_id', mi.medicao_id,
        'descricao', mi.descricao,
        'unidade', mi.unidade,
        'quantidade', mi.quantidade,
        'valor_unitario', mi.valor_unitario,
        'valor_total', mi.valor_total,
        'centro_custo_id', mi.centro_custo_id,
        'centro_custo_codigo', micc.codigo,
        'centro_custo_nome', micc.nome,
        'etapa_servico', mi.etapa_servico,
        'status', mi.status,
        'inativado_por', mi.inativado_por,
        'inativado_em', mi.inativado_em,
        'inativacao_motivo', mi.inativacao_motivo,
        'created_at', mi.created_at,
        'updated_at', mi.updated_at
      ) order by mi.created_at) filter (where mi.id is not null), '[]'::json) as itens,
      pedido_ativo.pedido as pedido_faturamento
    from medicoes_obra m
    join obras o on o.id = m.obra_id
    join clientes c on c.id = m.cliente_id
    left join centros_custo cc on cc.id = m.centro_custo_id
    left join contratos_obra co on co.id = m.contrato_obra_id
    left join contratos_obra_aditivos ca on ca.id = m.contrato_obra_aditivo_id
    left join usuarios responsavel on responsavel.id = m.responsavel_id
    left join usuarios aprovador on aprovador.id = m.aprovado_por
    left join usuarios submetido on submetido.id = m.submetido_por
    left join usuarios devolvedor on devolvedor.id = m.devolvido_por
    left join usuarios cancelador on cancelador.id = m.cancelado_por
    left join usuarios solicitante_faturamento on solicitante_faturamento.id = m.faturamento_solicitado_por
    left join usuarios faturador on faturador.id = m.faturado_manual_por
    left join medicoes_obra_itens mi on mi.medicao_id = m.id
    left join centros_custo micc on micc.id = mi.centro_custo_id
    left join lateral (
      select jsonb_build_object(
        'id', pf.id,
        'codigo', pf.codigo,
        'status', pf.status,
        'valor_solicitado', pf.valor_solicitado,
        'data_solicitacao', pf.data_solicitacao,
        'aprovacao_status', pf.aprovacao_status,
        'aprovado_por', pf.aprovado_por,
        'aprovado_em', pf.aprovado_em,
        'contrato_obra_id', pf.contrato_obra_id,
        'contrato_obra_aditivo_id', pf.contrato_obra_aditivo_id,
        'faturado_manual_por', pf.faturado_manual_por,
        'faturado_manual_em', pf.faturado_manual_em,
        'faturado_manual_data', pf.faturado_manual_data,
        'faturado_manual_observacoes', pf.faturado_manual_observacoes
      ) as pedido
      from pedidos_faturamento pf
      where pf.medicao_id = m.id and pf.status <> 'CANCELADO'
      order by pf.created_at desc
      limit 1
    ) pedido_ativo on true
    where m.id = $1
    group by m.id, o.id, c.id, cc.id, co.id, ca.id, responsavel.id, aprovador.id, submetido.id, devolvedor.id, cancelador.id, solicitante_faturamento.id, faturador.id, pedido_ativo.pedido
    `,
    [id]
  );
  return result.rows[0];
};

const listMedicoes = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = ['m.cliente_id is not null'];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`m.status = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`m.obra_id = $${params.length}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    params.push(assertUuid(clienteId, 'cliente_id'));
    conditions.push(`m.cliente_id = $${params.length}`);
  }

  const competenciaDe = url.searchParams.get('competencia_de');
  if (competenciaDe) {
    params.push(normalizeCompetencia({ competencia: competenciaDe }));
    conditions.push(`m.competencia >= $${params.length}`);
  }

  const competenciaAte = url.searchParams.get('competencia_ate');
  if (competenciaAte) {
    params.push(normalizeCompetencia({ competencia: competenciaAte }));
    conditions.push(`m.competencia <= $${params.length}`);
  }

  const result = await getPool().query(
    `
    select
      m.id,
      m.company_id,
      m.numero,
      m.competencia,
      m.periodo_inicio,
      m.periodo_fim,
      m.status,
      m.valor_bruto,
      m.retencoes_previstas,
      m.impostos_estimados,
      m.valor_liquido_previsto,
      m.contrato_obra_id,
      co.numero as contrato_obra_numero,
      m.contrato_obra_aditivo_id,
      ca.numero as contrato_obra_aditivo_numero,
      m.aprovacao_status,
      m.aprovado_em,
      m.faturamento_solicitado_em,
      m.faturado_manual_em,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      c.nome as cliente_nome,
      cc.codigo as centro_custo_codigo,
      count(mi.id) filter (where mi.status = 'ATIVO')::int as itens_ativos
    from medicoes_obra m
    join obras o on o.id = m.obra_id
    join clientes c on c.id = m.cliente_id
    left join centros_custo cc on cc.id = m.centro_custo_id
    left join contratos_obra co on co.id = m.contrato_obra_id
    left join contratos_obra_aditivos ca on ca.id = m.contrato_obra_aditivo_id
    left join medicoes_obra_itens mi on mi.medicao_id = m.id
    where ${conditions.join(' and ')}
    group by m.id, o.id, c.id, cc.id, co.id, ca.id
    order by m.competencia desc, m.created_at desc
    `,
    params
  );
  return result.rows;
};

const recalcularMedicaoTotais = async (client: PoolClient, medicaoId: string): Promise<void> => {
  const totals = await client.query<{ valor_bruto: string }>(
    `
    select coalesce(sum(valor_total), 0)::numeric(14,2) as valor_bruto
    from medicoes_obra_itens
    where medicao_id = $1 and status = 'ATIVO'
    `,
    [medicaoId]
  );
  const bruto = Number(totals.rows[0]?.valor_bruto || 0);
  const medicao = await client.query<{ retencoes_previstas: string; impostos_estimados: string }>(
    `
    select retencoes_previstas, impostos_estimados
    from medicoes_obra
    where id = $1
    `,
    [medicaoId]
  );
  const retencoes = Number(medicao.rows[0]?.retencoes_previstas || 0);
  const impostos = Number(medicao.rows[0]?.impostos_estimados || 0);
  if (retencoes + impostos > bruto) {
    throw new HttpError(400, 'validation_error', 'Retencoes e impostos estimados nao podem superar o valor bruto medido.');
  }
  const liquido = Number((bruto - retencoes - impostos).toFixed(2));
  await client.query(
    `
    update medicoes_obra
    set valor_bruto = $1,
        valor_medido = $1,
        valor_retido = retencoes_previstas,
        valor_liquido_previsto = $2,
        updated_at = now()
    where id = $3
    `,
    [bruto, liquido, medicaoId]
  );
  await validarContratoMedicao(client, medicaoId);
};

const assertMedicaoEditable = (medicao: MedicaoForUpdate): void => {
  if (!editableMedicaoStatuses.includes(medicao.status)) {
    throw new HttpError(409, 'status_conflict', `Medicao em status ${medicao.status} nao permite edicao.`);
  }
};

const countActiveItems = async (client: PoolClient, medicaoId: string): Promise<number> => {
  const result = await client.query<{ total: number }>(
    `
    select count(*)::int as total
    from medicoes_obra_itens
    where medicao_id = $1 and status = 'ATIVO'
    `,
    [medicaoId]
  );
  return Number(result.rows[0]?.total || 0);
};

const createMedicao = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'obra_id',
    'cliente_id',
    'centro_custo_id',
    'numero',
    'competencia',
    'periodo_inicio',
    'periodo_fim',
    'contrato_obra_id',
    'contrato_obra_aditivo_id',
    'contrato_escopo',
    'responsavel_id',
    'usuario_id',
    'observacoes',
    'retencoes_previstas',
    'impostos_estimados'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const obraId = assertUuid(payload.obra_id, 'obra_id');
  const clienteId = assertUuid(payload.cliente_id, 'cliente_id');
  const competencia = normalizeCompetencia(payload);
  const periodoInicio = requiredDate(payload, 'periodo_inicio');
  const periodoFim = requiredDate(payload, 'periodo_fim');
  assertPeriodo(periodoInicio, periodoFim);
  const numero = optionalText(payload, 'numero') || gerarCodigo('MED');
  const usuarioId = optionalUsuarioId(payload);
  const responsavelId = optionalUuid(payload, 'responsavel_id') || usuarioId;
  const contratoObraId = optionalUuid(payload, 'contrato_obra_id');
  const contratoObraAditivoId = optionalUuid(payload, 'contrato_obra_aditivo_id');
  const retencoes = normalizeMoney(payload.retencoes_previstas ?? 0, 'retencoes_previstas');
  const impostos = normalizeMoney(payload.impostos_estimados ?? 0, 'impostos_estimados');
  if (retencoes + impostos > 0) {
    throw new HttpError(400, 'validation_error', 'Retencoes e impostos devem ser informados apos inserir itens medidos.');
  }

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const obra = await fetchObraCliente(client, companyId, obraId, clienteId);
    const centroCustoId = optionalUuid(payload, 'centro_custo_id') || obra.centro_custo_id;
    const created = await client.query<{ id: string }>(
      `
      insert into medicoes_obra (
        company_id,
        obra_id,
        cliente_id,
        centro_custo_id,
        numero,
        competencia,
        periodo_inicio,
        periodo_fim,
        contrato_obra_id,
        contrato_obra_aditivo_id,
        contrato_escopo,
        responsavel_id,
        observacoes,
        status,
        retencoes_previstas,
        impostos_estimados,
        valor_liquido_previsto,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'RASCUNHO', $14, $15, 0, $16, $16)
      returning id
      `,
      [
        companyId,
        obraId,
        clienteId,
        centroCustoId,
        numero,
        competencia,
        periodoInicio,
        periodoFim,
        contratoObraId,
        contratoObraAditivoId,
        optionalText(payload, 'contrato_escopo'),
        responsavelId,
        optionalText(payload, 'observacoes'),
        retencoes,
        impostos,
        usuarioId
      ]
    );
    await validarContratoMedicao(client, created.rows[0].id);
    await registrarAuditoria(client, companyId, 'medicao_obra', created.rows[0].id, 'criar', {
      numero,
      competencia,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(created.rows[0].id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateMedicao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, [
    'obra_id',
    'cliente_id',
    'centro_custo_id',
    'numero',
    'competencia',
    'periodo_inicio',
    'periodo_fim',
    'contrato_obra_id',
    'contrato_obra_aditivo_id',
    'contrato_escopo',
    'responsavel_id',
    'usuario_id',
    'observacoes',
    'retencoes_previstas',
    'impostos_estimados'
  ]);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    assertMedicaoEditable(medicao);

    const updates: Array<{ column: string; value: unknown }> = [];
    const nextObraId = hasOwn(payload, 'obra_id') ? assertUuid(payload.obra_id, 'obra_id') : medicao.obra_id;
    const nextClienteId = hasOwn(payload, 'cliente_id') ? assertUuid(payload.cliente_id, 'cliente_id') : medicao.cliente_id;
    if (hasOwn(payload, 'obra_id') || hasOwn(payload, 'cliente_id')) {
      await fetchObraCliente(client, medicao.company_id, nextObraId, nextClienteId);
      updates.push({ column: 'obra_id', value: nextObraId });
      updates.push({ column: 'cliente_id', value: nextClienteId });
    }
    if (hasOwn(payload, 'centro_custo_id')) {
      updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
    }
    if (hasOwn(payload, 'numero')) {
      updates.push({ column: 'numero', value: requiredText(payload, 'numero') });
    }
    if (hasOwn(payload, 'competencia')) {
      updates.push({ column: 'competencia', value: normalizeCompetencia(payload) });
    }
    if (hasOwn(payload, 'periodo_inicio')) {
      updates.push({ column: 'periodo_inicio', value: requiredDate(payload, 'periodo_inicio') });
    }
    if (hasOwn(payload, 'periodo_fim')) {
      updates.push({ column: 'periodo_fim', value: requiredDate(payload, 'periodo_fim') });
    }
    if (hasOwn(payload, 'contrato_obra_id')) {
      updates.push({ column: 'contrato_obra_id', value: optionalUuid(payload, 'contrato_obra_id') });
    }
    if (hasOwn(payload, 'contrato_obra_aditivo_id')) {
      updates.push({ column: 'contrato_obra_aditivo_id', value: optionalUuid(payload, 'contrato_obra_aditivo_id') });
    }
    if (hasOwn(payload, 'contrato_escopo')) {
      updates.push({ column: 'contrato_escopo', value: optionalText(payload, 'contrato_escopo') });
    }
    if (hasOwn(payload, 'responsavel_id')) {
      updates.push({ column: 'responsavel_id', value: optionalUuid(payload, 'responsavel_id') });
    }
    if (hasOwn(payload, 'observacoes')) {
      updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    }
    if (hasOwn(payload, 'retencoes_previstas')) {
      updates.push({ column: 'retencoes_previstas', value: normalizeMoney(payload.retencoes_previstas, 'retencoes_previstas') });
    }
    if (hasOwn(payload, 'impostos_estimados')) {
      updates.push({ column: 'impostos_estimados', value: normalizeMoney(payload.impostos_estimados, 'impostos_estimados') });
    }
    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update medicoes_obra
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, id]
    );
    await recalcularMedicaoTotais(client, id);
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'editar', {
      campos: updates.map((update) => update.column),
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const addItem = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['descricao', 'unidade', 'quantidade', 'valor_unitario', 'centro_custo_id', 'etapa_servico', 'usuario_id']);
  const descricao = requiredText(payload, 'descricao');
  const unidade = requiredText(payload, 'unidade');
  const quantidade = normalizeQuantity(payload.quantidade, 'quantidade');
  const valorUnitario = normalizeMoney(payload.valor_unitario, 'valor_unitario');
  const valorTotal = Number((quantidade * valorUnitario).toFixed(2));
  const usuarioId = optionalUsuarioId(payload);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    assertMedicaoEditable(medicao);
    await client.query(
      `
      insert into medicoes_obra_itens (
        medicao_id,
        company_id,
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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      `,
      [
        id,
        medicao.company_id,
        descricao,
        unidade,
        quantidade,
        valorUnitario,
        valorTotal,
        optionalUuid(payload, 'centro_custo_id'),
        optionalText(payload, 'etapa_servico'),
        usuarioId
      ]
    );
    await recalcularMedicaoTotais(client, id);
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'adicionar_item', {
      descricao,
      valor_total: valorTotal,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateItem = async (id: string, itemId: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertUuid(itemId, 'itemId');
  assertAllowedFields(payload, ['descricao', 'unidade', 'quantidade', 'valor_unitario', 'centro_custo_id', 'etapa_servico', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    assertMedicaoEditable(medicao);
    const item = await client.query<{ id: string; quantidade: string; valor_unitario: string; status: string }>(
      `
      select id, quantidade, valor_unitario, status
      from medicoes_obra_itens
      where id = $1 and medicao_id = $2
      for update
      `,
      [itemId, id]
    );
    const existing = item.rows[0];
    if (!existing) {
      throw new HttpError(404, 'not_found', 'Item de medicao nao encontrado.');
    }
    if (existing.status !== 'ATIVO') {
      throw new HttpError(409, 'status_conflict', 'Item inativo nao permite edicao.');
    }

    const updates: Array<{ column: string; value: unknown }> = [];
    if (hasOwn(payload, 'descricao')) {
      updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
    }
    if (hasOwn(payload, 'unidade')) {
      updates.push({ column: 'unidade', value: requiredText(payload, 'unidade') });
    }
    const nextQuantidade = hasOwn(payload, 'quantidade') ? normalizeQuantity(payload.quantidade, 'quantidade') : Number(existing.quantidade);
    const nextValorUnitario = hasOwn(payload, 'valor_unitario') ? normalizeMoney(payload.valor_unitario, 'valor_unitario') : Number(existing.valor_unitario);
    if (hasOwn(payload, 'quantidade')) {
      updates.push({ column: 'quantidade', value: nextQuantidade });
    }
    if (hasOwn(payload, 'valor_unitario')) {
      updates.push({ column: 'valor_unitario', value: nextValorUnitario });
    }
    if (hasOwn(payload, 'quantidade') || hasOwn(payload, 'valor_unitario')) {
      updates.push({ column: 'valor_total', value: Number((nextQuantidade * nextValorUnitario).toFixed(2)) });
    }
    if (hasOwn(payload, 'centro_custo_id')) {
      updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
    }
    if (hasOwn(payload, 'etapa_servico')) {
      updates.push({ column: 'etapa_servico', value: optionalText(payload, 'etapa_servico') });
    }
    if (updates.length === 0) {
      throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar o item.');
    }

    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update medicoes_obra_itens
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, itemId]
    );
    await recalcularMedicaoTotais(client, id);
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'editar_item', {
      item_id: itemId,
      campos: updates.map((update) => update.column),
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const inativarItem = async (id: string, itemId: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertUuid(itemId, 'itemId');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa', 'motivo']);
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo obrigatorio para inativar item.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    assertMedicaoEditable(medicao);
    const item = await client.query<{ id: string; status: string }>(
      `
      select id, status
      from medicoes_obra_itens
      where id = $1 and medicao_id = $2
      for update
      `,
      [itemId, id]
    );
    if (!item.rows[0]) {
      throw new HttpError(404, 'not_found', 'Item de medicao nao encontrado.');
    }
    if (item.rows[0].status !== 'ATIVO') {
      throw new HttpError(409, 'status_conflict', 'Item ja esta inativo.');
    }
    await client.query(
      `
      update medicoes_obra_itens
      set status = 'INATIVO',
          inativado_por = $1,
          inativado_em = now(),
          inativacao_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, motivo, itemId]
    );
    await recalcularMedicaoTotais(client, id);
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'inativar_item', {
      item_id: itemId,
      motivo,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const enviarMedicao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa']);
  const usuarioId = requiredUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    if (!editableMedicaoStatuses.includes(medicao.status)) {
      throw new HttpError(409, 'status_conflict', `Medicao em status ${medicao.status} nao permite envio.`);
    }
    const activeItems = await countActiveItems(client, id);
    if (activeItems < 1) {
      throw new HttpError(409, 'medicao_sem_itens', 'Medicao precisa ter ao menos um item ativo para envio.');
    }
    await validarContratoMedicao(client, id);
    await client.query(
      `
      update medicoes_obra
      set status = 'SUBMETIDA',
          aprovacao_status = 'PENDENTE_APROVACAO',
          submetido_por = $1,
          submetido_em = now(),
          aprovacao_observacoes = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes'), id]
    );
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'enviar', {
      status_anterior: medicao.status,
      status_novo: 'SUBMETIDA',
      valor_bruto: Number(medicao.valor_bruto),
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const aprovarMedicao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const decisao = getPayloadDecisaoAprovacao(payload);
  const client = await getPool().connect();
  let committed = false;
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    if (!['SUBMETIDA', 'EM_ANALISE'].includes(medicao.status)) {
      throw new HttpError(409, 'status_conflict', `Medicao em status ${medicao.status} nao permite aprovacao.`);
    }
    await validarContratoMedicao(client, id);
    const valor = Number(medicao.valor_bruto);
    const acao = normalizeAprovacaoAction(valor);
    const validacao = await validarAlcadaDocumento(client, {
      companyId: medicao.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'medicoes-faturamento',
      tipoDocumento: 'MEDICAO_OBRA',
      acao,
      valor,
      obraId: medicao.obra_id,
      centroCustoId: medicao.centro_custo_id
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'medicoes-faturamento',
      tipo_documento: 'MEDICAO_OBRA',
      acao,
      valor,
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      observacoes: decisao.observacoes,
      status_anterior: medicao.status,
      status_novo: validacao.aprovado ? 'APROVADA' : medicao.status,
      marker: 'DEV_LOCAL_V3_6'
    };

    if (!validacao.aprovado) {
      await client.query(
        `
        update medicoes_obra
        set aprovacao_status = 'BLOQUEADO_ALCADA',
            aprovado_por = $1,
            aprovado_em = now(),
            aprovacao_observacoes = $2,
            bloqueio_alcada_motivo = $3,
            updated_by = $1,
            updated_at = now()
        where id = $4
        `,
        [decisao.usuarioId, decisao.observacoes, validacao.motivo, id]
      );
      await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update medicoes_obra
      set status = 'APROVADA',
          aprovacao_status = $1,
          aprovado_por = $2,
          aprovado_em = now(),
          aprovacao_observacoes = $3,
          bloqueio_alcada_motivo = null,
          updated_by = $2,
          updated_at = now()
      where id = $4
      `,
      [statusAprovacaoPorAcao(acao), decisao.usuarioId, decisao.observacoes, id]
    );
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'aprovar', auditPayload, decisao.usuarioId);
    await client.query('commit');
    committed = true;
    return fetchMedicao(id);
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const devolverMedicao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa', 'motivo']);
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo obrigatorio para devolver medicao.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    if (!['SUBMETIDA', 'EM_ANALISE'].includes(medicao.status)) {
      throw new HttpError(409, 'status_conflict', `Medicao em status ${medicao.status} nao permite devolucao.`);
    }
    await client.query(
      `
      update medicoes_obra
      set status = 'DEVOLVIDA',
          aprovacao_status = 'DEVOLVIDO',
          devolvido_por = $1,
          devolvido_em = now(),
          devolucao_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, motivo, id]
    );
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'devolver', {
      status_anterior: medicao.status,
      status_novo: 'DEVOLVIDA',
      motivo,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const cancelarMedicao = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'observacoes', 'justificativa', 'motivo']);
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo obrigatorio para cancelar medicao.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, id);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    if (medicao.status === 'FATURADO_MANUALMENTE') {
      throw new HttpError(409, 'cancelamento_bloqueado', 'Medicao faturada manualmente nao pode ser cancelada nesta etapa.');
    }
    if (medicao.status === 'CANCELADA') {
      throw new HttpError(409, 'status_conflict', 'Medicao ja esta CANCELADA.');
    }
    const pedidoFaturado = await client.query<{ id: string }>(
      `
      select id
      from pedidos_faturamento
      where medicao_id = $1 and status = 'FATURADO_MANUALMENTE'
      limit 1
      `,
      [id]
    );
    if (pedidoFaturado.rows[0]) {
      throw new HttpError(409, 'cancelamento_bloqueado', 'Medicao com pedido faturado manualmente nao pode ser cancelada.');
    }
    await client.query(
      `
      update pedidos_faturamento
      set status = 'CANCELADO',
          updated_by = $1,
          updated_at = now()
      where medicao_id = $2 and status <> 'CANCELADO'
      `,
      [usuarioId, id]
    );
    await client.query(
      `
      update medicoes_obra
      set status = 'CANCELADA',
          cancelado_por = $1,
          cancelado_em = now(),
          cancelamento_motivo = $2,
          updated_by = $1,
          updated_at = now()
      where id = $3
      `,
      [usuarioId, motivo, id]
    );
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', id, 'cancelar', {
      status_anterior: medicao.status,
      status_novo: 'CANCELADA',
      motivo,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchMedicao(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const createPedidoFaturamento = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, ['medicao_id', 'valor_solicitado', 'data_solicitacao', 'responsavel_id', 'usuario_id', 'observacoes', 'contrato_obra_id', 'contrato_obra_aditivo_id']);
  const medicaoId = assertUuid(payload.medicao_id, 'medicao_id');
  const usuarioId = optionalUsuarioId(payload);
  const dataSolicitacao = optionalDate(payload, 'data_solicitacao') || new Date().toISOString().slice(0, 10);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const medicao = await fetchMedicaoForUpdate(client, medicaoId);
    if (!medicao) {
      throw new HttpError(404, 'not_found', 'Medicao nao encontrada.');
    }
    if (medicao.status !== 'APROVADA') {
      throw new HttpError(409, 'status_conflict', `Pedido de faturamento exige medicao APROVADA. Status atual: ${medicao.status}.`);
    }
    await validarContratoMedicao(client, medicaoId);
    const payloadContratoId = optionalUuid(payload, 'contrato_obra_id');
    const payloadAditivoId = optionalUuid(payload, 'contrato_obra_aditivo_id');
    if (payloadContratoId && medicao.contrato_obra_id && payloadContratoId !== medicao.contrato_obra_id) {
      throw new HttpError(409, 'contrato_divergente', 'Contrato informado diverge do contrato vinculado a medicao.');
    }
    if (payloadAditivoId && medicao.contrato_obra_aditivo_id && payloadAditivoId !== medicao.contrato_obra_aditivo_id) {
      throw new HttpError(409, 'aditivo_divergente', 'Aditivo informado diverge do aditivo vinculado a medicao.');
    }
    const existingPedido = await client.query(
      `
      select id
      from pedidos_faturamento
      where medicao_id = $1 and status <> 'CANCELADO'
      limit 1
      `,
      [medicaoId]
    );
    if (existingPedido.rows[0]) {
      throw new HttpError(409, 'pedido_faturamento_duplicado', 'Medicao ja possui pedido de faturamento ativo.');
    }
    const valorPadrao = Number(medicao.valor_liquido_previsto || medicao.valor_bruto);
    const valorSolicitado = hasOwn(payload, 'valor_solicitado')
      ? normalizeMoney(payload.valor_solicitado, 'valor_solicitado', false)
      : valorPadrao;
    if (valorSolicitado > valorPadrao) {
      throw new HttpError(409, 'valor_solicitado_excede_medicao', 'Valor solicitado nao pode superar o valor liquido previsto da medicao.', {
        valor_solicitado: valorSolicitado,
        valor_liquido_previsto: valorPadrao
      });
    }
    const codigo = gerarCodigo('PF');
    const created = await client.query<{ id: string }>(
      `
      insert into pedidos_faturamento (
        medicao_id,
        company_id,
        cliente_id,
        obra_id,
        contrato_obra_id,
        contrato_obra_aditivo_id,
        codigo,
        valor_solicitado,
        data_solicitacao,
        responsavel_id,
        status,
        aprovacao_status,
        observacoes,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SOLICITADO', 'PENDENTE_APROVACAO', $11, $12, $12)
      returning id
      `,
      [
        medicao.id,
        medicao.company_id,
        medicao.cliente_id,
        medicao.obra_id,
        payloadContratoId || medicao.contrato_obra_id,
        payloadAditivoId || medicao.contrato_obra_aditivo_id,
        codigo,
        valorSolicitado,
        dataSolicitacao,
        optionalUuid(payload, 'responsavel_id') || usuarioId,
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await client.query(
      `
      update medicoes_obra
      set status = 'FATURAMENTO_SOLICITADO',
          faturamento_solicitado_por = $1,
          faturamento_solicitado_em = now(),
          updated_by = $1,
          updated_at = now()
      where id = $2
      `,
      [usuarioId, medicaoId]
    );
    await registrarAuditoria(client, medicao.company_id, 'pedido_faturamento', created.rows[0].id, 'criar', {
      medicao_id: medicaoId,
      codigo,
      valor_solicitado: valorSolicitado,
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await registrarAuditoria(client, medicao.company_id, 'medicao_obra', medicaoId, 'solicitar_faturamento', {
      pedido_faturamento_id: created.rows[0].id,
      status_anterior: medicao.status,
      status_novo: 'FATURAMENTO_SOLICITADO',
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchPedidoFaturamento(created.rows[0].id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const fetchPedidoFaturamento = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    select
      pf.id,
      pf.medicao_id,
      m.numero as medicao_numero,
      pf.company_id,
      pf.cliente_id,
      c.nome as cliente_nome,
      pf.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      pf.contrato_obra_id,
      co.numero as contrato_obra_numero,
      pf.contrato_obra_aditivo_id,
      ca.numero as contrato_obra_aditivo_numero,
      pf.codigo,
      pf.valor_solicitado,
      pf.data_solicitacao,
      pf.responsavel_id,
      responsavel.nome as responsavel_nome,
      pf.status,
      pf.aprovacao_status,
      pf.aprovado_por,
      aprovador.nome as aprovado_por_nome,
      pf.aprovado_em,
      pf.aprovacao_observacoes,
      pf.bloqueio_alcada_motivo,
      pf.faturado_manual_por,
      faturador.nome as faturado_manual_por_nome,
      pf.faturado_manual_em,
      pf.faturado_manual_data,
      pf.faturado_manual_observacoes,
      pf.observacoes,
      pf.created_at,
      pf.updated_at
    from pedidos_faturamento pf
    join medicoes_obra m on m.id = pf.medicao_id
    join clientes c on c.id = pf.cliente_id
    join obras o on o.id = pf.obra_id
    left join contratos_obra co on co.id = pf.contrato_obra_id
    left join contratos_obra_aditivos ca on ca.id = pf.contrato_obra_aditivo_id
    left join usuarios responsavel on responsavel.id = pf.responsavel_id
    left join usuarios aprovador on aprovador.id = pf.aprovado_por
    left join usuarios faturador on faturador.id = pf.faturado_manual_por
    where pf.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const listPedidosFaturamento = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = ['1 = 1'];

  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`pf.status = $${params.length}`);
  }

  const medicaoId = url.searchParams.get('medicao_id');
  if (medicaoId) {
    params.push(assertUuid(medicaoId, 'medicao_id'));
    conditions.push(`pf.medicao_id = $${params.length}`);
  }

  const clienteId = url.searchParams.get('cliente_id');
  if (clienteId) {
    params.push(assertUuid(clienteId, 'cliente_id'));
    conditions.push(`pf.cliente_id = $${params.length}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`pf.obra_id = $${params.length}`);
  }

  const result = await getPool().query(
    `
    select
      pf.id,
      pf.medicao_id,
      m.numero as medicao_numero,
      pf.company_id,
      pf.codigo,
      pf.valor_solicitado,
      pf.data_solicitacao,
      pf.contrato_obra_id,
      co.numero as contrato_obra_numero,
      pf.contrato_obra_aditivo_id,
      ca.numero as contrato_obra_aditivo_numero,
      pf.status,
      pf.aprovacao_status,
      pf.aprovado_em,
      pf.faturado_manual_em,
      c.nome as cliente_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome
    from pedidos_faturamento pf
    join medicoes_obra m on m.id = pf.medicao_id
    join clientes c on c.id = pf.cliente_id
    join obras o on o.id = pf.obra_id
    left join contratos_obra co on co.id = pf.contrato_obra_id
    left join contratos_obra_aditivos ca on ca.id = pf.contrato_obra_aditivo_id
    where ${conditions.join(' and ')}
    order by pf.data_solicitacao desc, pf.created_at desc
    `,
    params
  );
  return result.rows;
};

const aprovarPedidoFaturamento = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  const decisao = getPayloadDecisaoAprovacao(payload);
  const client = await getPool().connect();
  let committed = false;
  try {
    await client.query('begin');
    const pedido = await fetchPedidoForUpdate(client, id);
    if (!pedido) {
      throw new HttpError(404, 'not_found', 'Pedido de faturamento nao encontrado.');
    }
    if (pedido.status !== 'SOLICITADO') {
      throw new HttpError(409, 'status_conflict', `Pedido em status ${pedido.status} nao permite aprovacao.`);
    }
    const valor = Number(pedido.valor_solicitado);
    const acao = normalizeAprovacaoAction(valor);
    const validacao = await validarAlcadaDocumento(client, {
      companyId: pedido.company_id,
      usuarioId: decisao.usuarioId,
      modulo: 'medicoes-faturamento',
      tipoDocumento: 'PEDIDO_FATURAMENTO',
      acao,
      valor,
      obraId: pedido.obra_id,
      centroCustoId: null
    });
    const auditPayload = {
      usuario_id: decisao.usuarioId,
      modulo: 'medicoes-faturamento',
      tipo_documento: 'PEDIDO_FATURAMENTO',
      acao,
      valor,
      resultado: validacao.decisao,
      motivo: validacao.motivo,
      observacoes: decisao.observacoes,
      status_anterior: pedido.status,
      status_novo: validacao.aprovado ? 'APROVADO' : pedido.status,
      marker: 'DEV_LOCAL_V3_6'
    };

    if (!validacao.aprovado) {
      await client.query(
        `
        update pedidos_faturamento
        set aprovacao_status = 'BLOQUEADO_ALCADA',
            aprovado_por = $1,
            aprovado_em = now(),
            aprovacao_observacoes = $2,
            bloqueio_alcada_motivo = $3,
            updated_by = $1,
            updated_at = now()
        where id = $4
        `,
        [decisao.usuarioId, decisao.observacoes, validacao.motivo, id]
      );
      await registrarAuditoria(client, pedido.company_id, 'pedido_faturamento', id, 'bloquear_alcada', auditPayload, decisao.usuarioId);
      await client.query('commit');
      committed = true;
      throw new HttpError(403, 'alcada_bloqueada', validacao.motivo, auditPayload);
    }

    await client.query(
      `
      update pedidos_faturamento
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
      [statusAprovacaoPorAcao(acao), decisao.usuarioId, decisao.observacoes, id]
    );
    await registrarAuditoria(client, pedido.company_id, 'pedido_faturamento', id, 'aprovar', auditPayload, decisao.usuarioId);
    await client.query('commit');
    committed = true;
    return fetchPedidoFaturamento(id);
  } catch (error) {
    if (!committed) {
      await client.query('rollback');
    }
    throw error;
  } finally {
    client.release();
  }
};

const marcarFaturadoManualmente = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'data_faturamento', 'observacoes', 'justificativa']);
  const usuarioId = requiredUsuarioId(payload);
  const dataFaturamento = requiredDate(payload, 'data_faturamento');
  const observacoes = optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  if (!observacoes) {
    throw new HttpError(400, 'validation_error', 'Observacao obrigatoria para registrar faturamento manual.');
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const pedido = await fetchPedidoForUpdate(client, id);
    if (!pedido) {
      throw new HttpError(404, 'not_found', 'Pedido de faturamento nao encontrado.');
    }
    if (pedido.status !== 'APROVADO') {
      throw new HttpError(409, 'status_conflict', `Pedido em status ${pedido.status} nao permite faturamento manual.`);
    }
    await client.query(
      `
      update pedidos_faturamento
      set status = 'FATURADO_MANUALMENTE',
          faturado_manual_por = $1,
          faturado_manual_em = now(),
          faturado_manual_data = $2,
          faturado_manual_observacoes = $3,
          updated_by = $1,
          updated_at = now()
      where id = $4
      `,
      [usuarioId, dataFaturamento, observacoes, id]
    );
    await client.query(
      `
      update medicoes_obra
      set status = 'FATURADO_MANUALMENTE',
          faturado_manual_por = $1,
          faturado_manual_em = now(),
          faturado_manual_data = $2,
          faturado_manual_observacoes = $3,
          updated_by = $1,
          updated_at = now()
      where id = $4
      `,
      [usuarioId, dataFaturamento, observacoes, pedido.medicao_id]
    );
    await registrarAuditoria(client, pedido.company_id, 'pedido_faturamento', id, 'marcar_faturado_manualmente', {
      medicao_id: pedido.medicao_id,
      data_faturamento: dataFaturamento,
      valor_solicitado: Number(pedido.valor_solicitado),
      observacoes,
      aviso: 'Registro interno; nao emite NFS-e real e nao integra prefeitura.',
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await registrarAuditoria(client, pedido.company_id, 'medicao_obra', pedido.medicao_id, 'marcar_faturado_manualmente', {
      pedido_faturamento_id: id,
      status_novo: 'FATURADO_MANUALMENTE',
      aviso: 'Registro interno; nao emite NFS-e real e nao baixa recebivel automaticamente.',
      marker: 'DEV_LOCAL_V3_6'
    }, usuarioId);
    await client.query('commit');
    return fetchPedidoFaturamento(id);
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
    sendError(res, 409, 'unique_violation', 'Registro duplicado em medicoes/faturamento.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida em medicoes/faturamento.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor ou status invalido em medicoes/faturamento.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleMedicoes = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/medicoes';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listMedicoes(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createMedicao(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method === 'GET') {
        const medicao = await fetchMedicao(id);
        if (!medicao) {
          sendError(res, 404, 'not_found', 'Medicao nao encontrada.');
          return;
        }
        sendJson(res, 200, { data: medicao });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updateMedicao(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'enviar') {
        sendJson(res, 200, { data: await enviarMedicao(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'aprovar') {
        sendJson(res, 200, { data: await aprovarMedicao(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'devolver') {
        sendJson(res, 200, { data: await devolverMedicao(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'cancelar') {
        sendJson(res, 200, { data: await cancelarMedicao(id, await readJsonBody(req)) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de medicao nao encontrada.');
      return;
    }

    if (parts.length === 2 && parts[1] === 'itens') {
      const [id] = parts;
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 200, { data: await addItem(id, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 3 && parts[1] === 'itens') {
      const [id, , itemId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await updateItem(id, itemId, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'itens' && parts[3] === 'inativar') {
      const [id, , itemId] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await inativarItem(id, itemId, await readJsonBody(req)) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de medicao nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};

export const handlePedidosFaturamento = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/pedidos-faturamento';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listPedidosFaturamento(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createPedidoFaturamento(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      assertUuid(id, 'id');
      if (method === 'GET') {
        const pedido = await fetchPedidoFaturamento(id);
        if (!pedido) {
          sendError(res, 404, 'not_found', 'Pedido de faturamento nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: pedido });
        return;
      }
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'aprovar') {
        sendJson(res, 200, { data: await aprovarPedidoFaturamento(id, await readJsonBody(req)) });
        return;
      }
      if (action === 'marcar-faturado-manualmente') {
        sendJson(res, 200, { data: await marcarFaturadoManualmente(id, await readJsonBody(req)) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao de pedido de faturamento nao encontrada.');
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de pedido de faturamento nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
