import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import { assertUuid, optionalText, registrarAuditoria } from '../aprovacoes/aprovacoes.service.js';

type TarefaManualStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
type TarefaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
type CentralMode = 'todas' | 'minhas' | 'aprovacoes' | 'atrasadas' | 'criticas';
type ManualAction = 'marcar-vista' | 'iniciar' | 'concluir' | 'cancelar';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface TarefaManualRow extends QueryResultRow {
  id: string;
  company_id: string;
  status: TarefaManualStatus;
}

interface MutationContext {
  usuarioId: string | null;
  comentario: string | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const manualStatusValues: TarefaManualStatus[] = ['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];
const prioridadeValues: TarefaPrioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const finalStatuses = ['CONCLUIDA', 'CANCELADA', 'RESOLVIDA', 'REPROVADO', 'DEVOLVIDO'];

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const nestedPayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : payload;

const isUuidString = (value: string): boolean => uuidPattern.test(value);

const normalizeText = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = normalizeText(payload[fieldName]);
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

const optionalDate = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    return null;
  }
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const optionalEnum = <T extends string>(payload: Record<string, unknown>, fieldName: string, values: readonly T[], fallback: T): T => {
  const value = normalizeText(payload[fieldName]);
  if (!value) {
    return fallback;
  }
  const normalized = value.toUpperCase() as T;
  if (!values.includes(normalized)) {
    throw new HttpError(400, 'validation_error', `Valor invalido em ${fieldName}.`, values);
  }
  return normalized;
};

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
};

const getUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const getMutationContext = (payload: Record<string, unknown>): MutationContext => ({
  usuarioId: getUsuarioId(payload),
  comentario: optionalText(payload, 'comentario') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa')
});

const normalizeCodigo = (): string => {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CT-${stamp}-${suffix}`;
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
    sendError(res, 409, 'unique_violation', 'Tarefa manual duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para tarefa manual.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor fora do contrato permitido para tarefa manual.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

const getDefaultCompanyId = async (client: PoolClient, payload: Record<string, unknown>): Promise<string> => {
  const explicit = optionalUuid(payload, 'company_id');
  if (explicit) {
    return explicit;
  }

  const result = await client.query<{ id: string }>(
    `select id from empresas where cnpj = '00.000.000/0001-33' order by created_at asc limit 1`
  );
  const company = result.rows[0];
  if (!company) {
    throw new HttpError(404, 'not_found', 'Empresa local DEV nao encontrada.');
  }
  return company.id;
};

const centralTasksCte = `
with perfis_ativos as (
  select id, company_id, nome
  from perfis
  where status = 'ativo'
),
tarefas_base as (
  select
    ctm.id::text as id,
    ctm.id as manual_id,
    'MANUAL'::text as tipo,
    ctm.titulo,
    ctm.descricao,
    ctm.modulo,
    ctm.origem,
    ctm.origem_id,
    ctm.status,
    ctm.prioridade,
    ctm.responsavel_id,
    resp.nome as responsavel_nome,
    ctm.perfil_id,
    perfil.nome as perfil_nome,
    ctm.prazo,
    ctm.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    ctm.cliente_id,
    cli.nome as cliente_nome,
    ctm.created_at,
    ctm.modulo as navigation_section,
    'Abrir modulo'::text as navigation_label
  from central_tarefas_manuais ctm
  left join usuarios resp on resp.id = ctm.responsavel_id
  left join perfis perfil on perfil.id = ctm.perfil_id
  left join obras o on o.id = ctm.obra_id
  left join clientes cli on cli.id = ctm.cliente_id

  union all

  select
    concat('risco:', rp.id)::text as id,
    null::uuid as manual_id,
    case when rp.dashboard_alerta_tipo is not null then 'ALERTA' else 'PENDENCIA' end::text as tipo,
    rp.titulo,
    rp.descricao,
    case
      when rp.dashboard_alerta_tipo is not null then 'dashboard-executivo'
      when rp.tipo = 'MARGEM' then 'previsto-realizado'
      else 'riscos-pendencias'
    end::text as modulo,
    rp.origem,
    rp.id as origem_id,
    rp.status,
    rp.prioridade,
    rp.responsavel_id,
    resp.nome as responsavel_nome,
    null::uuid as perfil_id,
    null::text as perfil_nome,
    rp.prazo,
    rp.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    rp.cliente_id,
    cli.nome as cliente_nome,
    rp.created_at,
    case
      when rp.dashboard_alerta_tipo is not null then 'dashboard-executivo'
      when rp.tipo = 'MARGEM' then 'previsto-realizado'
      else 'riscos-pendencias'
    end::text as navigation_section,
    'Abrir origem'::text as navigation_label
  from riscos_pendencias rp
  left join usuarios resp on resp.id = rp.responsavel_id
  left join obras o on o.id = rp.obra_id
  left join clientes cli on cli.id = rp.cliente_id
  where rp.status in ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA')

  union all

  select
    concat('solicitacao:', sc.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    coalesce(sc.titulo, sc.codigo, 'Solicitacao de compra') as titulo,
    sc.observacoes as descricao,
    'solicitacoes-compra'::text as modulo,
    'SOLICITACAO_COMPRA'::text as origem,
    sc.id as origem_id,
    coalesce(sc.aprovacao_status, sc.status) as status,
    case
      when coalesce(sc.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when sc.data_necessidade is not null and sc.data_necessidade < current_date then 'ALTA'
      when sc.prioridade in ('URGENTE', 'ALTA') then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    sc.solicitante_id as responsavel_id,
    solicitante.nome as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    sc.data_necessidade as prazo,
    sc.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    sc.created_at,
    'solicitacoes-compra'::text as navigation_section,
    'Abrir solicitacao'::text as navigation_label
  from solicitacoes_compra sc
  left join usuarios solicitante on solicitante.id = sc.solicitante_id
  left join obras o on o.id = sc.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = sc.company_id and perfil.nome = 'PLANEJAMENTO'
  where sc.status in ('ENVIADA', 'EM_ANALISE', 'DEVOLVIDA')
     or sc.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('cotacao:', c.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    coalesce(c.titulo, c.codigo, 'Cotacao') as titulo,
    c.observacoes as descricao,
    'cotacoes'::text as modulo,
    'COTACAO'::text as origem,
    c.id as origem_id,
    coalesce(c.aprovacao_status, c.status) as status,
    case
      when coalesce(c.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when c.prazo_resposta is not null and c.prazo_resposta < current_date then 'ALTA'
      when coalesce(c.valor_total, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    c.prazo_resposta as prazo,
    sc.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    c.created_at,
    'cotacoes'::text as navigation_section,
    'Abrir cotacao'::text as navigation_label
  from cotacoes c
  left join solicitacoes_compra sc on sc.id = c.solicitacao_compra_id
  left join obras o on o.id = sc.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = c.company_id and perfil.nome = case when coalesce(c.valor_total, 0) > 20000 then 'DIRETORIA' else 'PLANEJAMENTO' end
  where c.status in ('ENVIADA_FORNECEDORES', 'RESPOSTAS_RECEBIDAS', 'MAPA_GERADO')
     or c.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('pedido:', pc.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    coalesce(pc.titulo, pc.codigo, pc.numero, 'Pedido de compra') as titulo,
    pc.observacoes as descricao,
    'pedidos-compra'::text as modulo,
    'PEDIDO_COMPRA'::text as origem,
    pc.id as origem_id,
    coalesce(pc.aprovacao_status, pc.status) as status,
    case
      when coalesce(pc.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when pc.data_entrega_prevista is not null and pc.data_entrega_prevista < current_date then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    pc.data_entrega_prevista as prazo,
    pc.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    pc.created_at,
    'pedidos-compra'::text as navigation_section,
    'Abrir pedido'::text as navigation_label
  from pedidos_compra pc
  left join obras o on o.id = pc.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = pc.company_id and perfil.nome = 'PLANEJAMENTO'
  where pc.status in ('EMITIDO', 'ENVIADO_FORNECEDOR')
     or pc.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('nota:', nf.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    concat('NF ', nf.numero)::text as titulo,
    nf.observacoes as descricao,
    'notas-entrada'::text as modulo,
    'NOTA_FISCAL_ENTRADA'::text as origem,
    nf.id as origem_id,
    coalesce(nf.aprovacao_status, nf.status) as status,
    case
      when coalesce(nf.aprovacao_status, '') = 'BLOQUEADO_ALCADA' or nf.status = 'DIVERGENTE' then 'CRITICA'
      when coalesce(nf.valor_total, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    nf.data_entrada as prazo,
    nf.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    nf.created_at,
    'notas-entrada'::text as navigation_section,
    'Abrir nota'::text as navigation_label
  from notas_fiscais_entrada nf
  left join obras o on o.id = nf.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = nf.company_id and perfil.nome = case when coalesce(nf.valor_total, 0) > 20000 then 'DIRETORIA' else 'FINANCEIRO' end
  where nf.status in ('CONFERIDA', 'DIVERGENTE', 'PROVISIONADA')
     or nf.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('conta:', cp.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    concat('Conta ', cp.numero_documento)::text as titulo,
    cp.observacoes as descricao,
    'contas-pagar'::text as modulo,
    case when cp.baixa_status = 'BLOQUEADA_BAIXA' then 'BAIXA_MANUAL_BLOQUEADA' else 'CONTA_PAGAR' end::text as origem,
    cp.id as origem_id,
    case when cp.baixa_status = 'BLOQUEADA_BAIXA' then cp.baixa_status else coalesce(cp.aprovacao_status, cp.status) end as status,
    case
      when cp.divergencia_pendente = true or cp.baixa_status = 'BLOQUEADA_BAIXA' or coalesce(cp.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when cp.data_vencimento is not null and cp.data_vencimento < current_date then 'ALTA'
      when coalesce(cp.valor_aberto, cp.valor_original, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    cp.data_vencimento as prazo,
    cp.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    cp.created_at,
    'contas-pagar'::text as navigation_section,
    'Abrir conta'::text as navigation_label
  from contas_pagar cp
  left join obras o on o.id = cp.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = cp.company_id and perfil.nome = case when coalesce(cp.valor_aberto, cp.valor_original, 0) > 20000 then 'DIRETORIA' else 'FINANCEIRO' end
  where coalesce(cp.ativo, true) = true
    and (
      cp.status in ('PROVISIONADA', 'APROVADA', 'AGUARDANDO_PROGRAMACAO', 'PROGRAMADA')
      or cp.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')
      or cp.divergencia_pendente = true
      or cp.baixa_status = 'BLOQUEADA_BAIXA'
    )

  union all

  select
    concat('programacao:', pp.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    coalesce(pp.codigo, 'Programacao de pagamento') as titulo,
    coalesce(pp.justificativa, pp.observacoes) as descricao,
    'programacoes-pagamento'::text as modulo,
    case
      when pp.conferencia_status in ('PENDENTE_CONFERENCIA', 'BLOQUEADA_CONFERENCIA', 'DEVOLVIDA') and pp.status = 'LIBERADA' then 'CONFERENCIA_FINANCEIRA'
      when pp.liberacao_status in ('PENDENTE_LIBERACAO', 'BLOQUEADA_LIBERACAO') and pp.status = 'APROVADA' then 'LIBERACAO_PROGRAMACAO'
      else 'PROGRAMACAO_PAGAMENTO'
    end::text as origem,
    pp.id as origem_id,
    case
      when pp.conferencia_status in ('PENDENTE_CONFERENCIA', 'BLOQUEADA_CONFERENCIA', 'DEVOLVIDA') and pp.status = 'LIBERADA' then pp.conferencia_status
      when pp.liberacao_status in ('PENDENTE_LIBERACAO', 'BLOQUEADA_LIBERACAO') and pp.status = 'APROVADA' then pp.liberacao_status
      else coalesce(pp.aprovacao_status, pp.status)
    end as status,
    case
      when pp.bloqueio_alcada_motivo is not null or pp.bloqueio_liberacao_motivo is not null or pp.bloqueio_conferencia_motivo is not null then 'CRITICA'
      when pp.data_prevista is not null and pp.data_prevista < current_date then 'ALTA'
      when coalesce(pp.valor_total, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    pp.data_prevista as prazo,
    pp.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    pp.created_at,
    'programacoes-pagamento'::text as navigation_section,
    'Abrir programacao'::text as navigation_label
  from programacoes_pagamento pp
  left join obras o on o.id = pp.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = pp.company_id and perfil.nome = case when coalesce(pp.valor_total, 0) > 20000 then 'DIRETORIA' else 'FINANCEIRO' end
  where pp.status in ('SUBMETIDA', 'APROVADA', 'LIBERADA')
     or pp.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')
     or pp.liberacao_status in ('PENDENTE_LIBERACAO', 'BLOQUEADA_LIBERACAO')
     or pp.conferencia_status in ('PENDENTE_CONFERENCIA', 'BLOQUEADA_CONFERENCIA', 'DEVOLVIDA')

  union all

  select
    concat('aditivo:', coa.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    concat('Aditivo ', coa.numero)::text as titulo,
    coa.descricao,
    'contratos-obra'::text as modulo,
    'ADITIVO_CONTRATUAL'::text as origem,
    coa.id as origem_id,
    coalesce(coa.aprovacao_status, coa.status) as status,
    case
      when coalesce(coa.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when coalesce(coa.valor_delta, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    (coa.created_at::date + 7) as prazo,
    co.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    co.cliente_id,
    cli.nome as cliente_nome,
    coa.created_at,
    'contratos-obra'::text as navigation_section,
    'Abrir contrato'::text as navigation_label
  from contratos_obra_aditivos coa
  join contratos_obra co on co.id = coa.contrato_id
  left join obras o on o.id = co.obra_id
  left join clientes cli on cli.id = co.cliente_id
  left join perfis_ativos perfil on perfil.company_id = coa.company_id and perfil.nome = case when coalesce(coa.valor_delta, 0) > 20000 then 'DIRETORIA' else 'PLANEJAMENTO' end
  where coa.status in ('SUBMETIDO')
     or coa.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('orcamento:', oo.id)::text as id,
    null::uuid as manual_id,
    'OPERACIONAL'::text as tipo,
    coalesce(oo.codigo, 'Orcamento de obra') as titulo,
    oo.descricao,
    'orcamentos-planejamento'::text as modulo,
    'ORCAMENTO_OBRA'::text as origem,
    oo.id as origem_id,
    oo.status,
    case when oo.status = 'BLOQUEADO' then 'CRITICA' else 'MEDIA' end::text as prioridade,
    null::uuid as responsavel_id,
    null::text as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    (oo.updated_at::date + 5) as prazo,
    oo.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    oo.cliente_id,
    cli.nome as cliente_nome,
    oo.created_at,
    'orcamentos-planejamento'::text as navigation_section,
    'Abrir orcamento'::text as navigation_label
  from orcamentos_obra oo
  left join obras o on o.id = oo.obra_id
  left join clientes cli on cli.id = oo.cliente_id
  left join perfis_ativos perfil on perfil.company_id = oo.company_id and perfil.nome = 'PLANEJAMENTO'
  where oo.status in ('EM_REVISAO', 'BLOQUEADO')

  union all

  select
    concat('planejamento:', pe.id)::text as id,
    null::uuid as manual_id,
    'OPERACIONAL'::text as tipo,
    pe.etapa as titulo,
    pe.descricao,
    'orcamentos-planejamento'::text as modulo,
    'PLANEJAMENTO_EXECUTIVO'::text as origem,
    pe.id as origem_id,
    pe.status,
    case when pe.data_fim_prevista is not null and pe.data_fim_prevista < current_date then 'ALTA' else 'MEDIA' end::text as prioridade,
    pe.responsavel_id,
    resp.nome as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    pe.data_fim_prevista as prazo,
    pe.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    o.cliente_id,
    cli.nome as cliente_nome,
    pe.created_at,
    'orcamentos-planejamento'::text as navigation_section,
    'Abrir planejamento'::text as navigation_label
  from planejamento_executivo pe
  left join usuarios resp on resp.id = pe.responsavel_id
  left join obras o on o.id = pe.obra_id
  left join clientes cli on cli.id = o.cliente_id
  left join perfis_ativos perfil on perfil.company_id = pe.company_id and perfil.nome = 'PLANEJAMENTO'
  where pe.status in ('ATIVO', 'EM_REVISAO')

  union all

  select
    concat('medicao:', mo.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    concat('Medicao ', mo.numero)::text as titulo,
    mo.observacoes as descricao,
    'medicoes-faturamento'::text as modulo,
    'MEDICAO_OBRA'::text as origem,
    mo.id as origem_id,
    coalesce(mo.aprovacao_status, mo.status) as status,
    case
      when coalesce(mo.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when mo.periodo_fim is not null and mo.periodo_fim < current_date then 'ALTA'
      when coalesce(mo.valor_bruto, mo.valor_medido, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    mo.responsavel_id,
    resp.nome as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    mo.periodo_fim as prazo,
    mo.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    mo.cliente_id,
    cli.nome as cliente_nome,
    mo.created_at,
    'medicoes-faturamento'::text as navigation_section,
    'Abrir medicao'::text as navigation_label
  from medicoes_obra mo
  left join usuarios resp on resp.id = mo.responsavel_id
  left join obras o on o.id = mo.obra_id
  left join clientes cli on cli.id = mo.cliente_id
  left join perfis_ativos perfil on perfil.company_id = mo.company_id and perfil.nome = case when coalesce(mo.valor_bruto, mo.valor_medido, 0) > 20000 then 'DIRETORIA' else 'PLANEJAMENTO' end
  where mo.status in ('SUBMETIDA', 'EM_ANALISE')
     or mo.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')

  union all

  select
    concat('pedido-faturamento:', pf.id)::text as id,
    null::uuid as manual_id,
    'APROVACAO'::text as tipo,
    coalesce(pf.codigo, 'Pedido de faturamento') as titulo,
    pf.observacoes as descricao,
    'medicoes-faturamento'::text as modulo,
    'PEDIDO_FATURAMENTO'::text as origem,
    pf.id as origem_id,
    coalesce(pf.aprovacao_status, pf.status) as status,
    case
      when coalesce(pf.aprovacao_status, '') = 'BLOQUEADO_ALCADA' then 'CRITICA'
      when pf.data_solicitacao is not null and pf.data_solicitacao < current_date - 5 then 'ALTA'
      when coalesce(pf.valor_solicitado, 0) > 20000 then 'ALTA'
      else 'MEDIA'
    end::text as prioridade,
    pf.responsavel_id,
    resp.nome as responsavel_nome,
    perfil.id as perfil_id,
    perfil.nome as perfil_nome,
    (pf.data_solicitacao + 5) as prazo,
    pf.obra_id,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    pf.cliente_id,
    cli.nome as cliente_nome,
    pf.created_at,
    'medicoes-faturamento'::text as navigation_section,
    'Abrir faturamento'::text as navigation_label
  from pedidos_faturamento pf
  left join usuarios resp on resp.id = pf.responsavel_id
  left join obras o on o.id = pf.obra_id
  left join clientes cli on cli.id = pf.cliente_id
  left join perfis_ativos perfil on perfil.company_id = pf.company_id and perfil.nome = case when coalesce(pf.valor_solicitado, 0) > 20000 then 'DIRETORIA' else 'FINANCEIRO' end
  where pf.status in ('SOLICITADO', 'APROVADO')
     or pf.aprovacao_status in ('PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA')
)
`;

const taskSelectSql = `
select
  tb.*,
  greatest(0, (current_date - tb.created_at::date))::int as idade_dias,
  (tb.prazo is not null and tb.prazo < current_date and tb.status <> all($FINAL_STATUS_ARRAY::text[])) as atrasada,
  (tb.prioridade = 'CRITICA' or (tb.prazo is not null and tb.prazo < current_date and tb.status <> all($FINAL_STATUS_ARRAY::text[]))) as critica
from tarefas_base tb
`;

const withFinalArray = (sql: string, finalArrayParam: string): string => sql.replace(/\$FINAL_STATUS_ARRAY/g, finalArrayParam);

const addParam = (params: unknown[], value: unknown): string => {
  params.push(value);
  return `$${params.length}`;
};

const addCommonFilters = (url: URL, params: unknown[], conditions: string[]): void => {
  const modulo = url.searchParams.get('modulo');
  if (modulo) {
    conditions.push(`tb.modulo = ${addParam(params, modulo.trim())}`);
  }

  const prioridade = url.searchParams.get('prioridade');
  if (prioridade) {
    conditions.push(`tb.prioridade = ${addParam(params, prioridade.trim().toUpperCase())}`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    conditions.push(`tb.status = ${addParam(params, status.trim().toUpperCase())}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    conditions.push(`tb.obra_id = ${addParam(params, assertUuid(obraId, 'obra_id'))}`);
  }

  const responsavelId = url.searchParams.get('responsavel_id');
  if (responsavelId) {
    conditions.push(`tb.responsavel_id = ${addParam(params, assertUuid(responsavelId, 'responsavel_id'))}`);
  }

  const perfilId = url.searchParams.get('perfil_id');
  if (perfilId) {
    conditions.push(`tb.perfil_id = ${addParam(params, assertUuid(perfilId, 'perfil_id'))}`);
  }

  const prazoDe = url.searchParams.get('prazo_de');
  if (prazoDe) {
    if (!datePattern.test(prazoDe)) {
      throw new HttpError(400, 'validation_error', 'Data invalida em prazo_de. Use YYYY-MM-DD.');
    }
    conditions.push(`tb.prazo >= ${addParam(params, prazoDe)}`);
  }

  const prazoAte = url.searchParams.get('prazo_ate') || url.searchParams.get('prazo');
  if (prazoAte) {
    if (!datePattern.test(prazoAte)) {
      throw new HttpError(400, 'validation_error', 'Data invalida em prazo_ate. Use YYYY-MM-DD.');
    }
    conditions.push(`tb.prazo <= ${addParam(params, prazoAte)}`);
  }

  const texto = url.searchParams.get('texto');
  if (texto) {
    const search = addParam(params, `%${texto.trim()}%`);
    conditions.push(`(tb.titulo ilike ${search} or coalesce(tb.descricao, '') ilike ${search} or tb.modulo ilike ${search} or tb.origem ilike ${search})`);
  }
};

const addModeFilters = (url: URL, mode: CentralMode, params: unknown[], conditions: string[]): void => {
  if (mode === 'todas') {
    return;
  }

  const finalArray = addParam(params, finalStatuses);
  const activeCondition = `tb.status <> all(${finalArray}::text[])`;

  if (mode === 'minhas') {
    conditions.push(activeCondition);
    const usuarioId = url.searchParams.get('usuario_id');
    if (usuarioId) {
      const userParam = addParam(params, assertUuid(usuarioId, 'usuario_id'));
      conditions.push(`(
        tb.responsavel_id = ${userParam}
        or exists (
          select 1
          from usuarios_perfis up
          join perfis p on p.id = up.perfil_id
          where up.usuario_id = ${userParam}
            and up.status = 'ativo'
            and p.status = 'ativo'
            and up.perfil_id = tb.perfil_id
        )
      )`);
    }
    return;
  }

  if (mode === 'aprovacoes') {
    conditions.push(activeCondition);
    conditions.push(`tb.tipo = 'APROVACAO'`);
    return;
  }

  if (mode === 'atrasadas') {
    conditions.push(activeCondition);
    conditions.push(`tb.prazo is not null and tb.prazo < current_date`);
    return;
  }

  if (mode === 'criticas') {
    conditions.push(activeCondition);
    conditions.push(`(tb.prioridade = 'CRITICA' or (tb.prazo is not null and tb.prazo < current_date))`);
  }
};

const listTasks = async (url: URL, mode: CentralMode): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  addCommonFilters(url, params, conditions);
  addModeFilters(url, mode, params, conditions);
  const finalArrayParam = addParam(params, finalStatuses);
  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const limit = Number(url.searchParams.get('limit') || 300);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 500) : 300;
  const result = await getPool().query(
    `
    ${centralTasksCte}
    ${withFinalArray(taskSelectSql, finalArrayParam)}
    ${where}
    order by
      case tb.prioridade when 'CRITICA' then 0 when 'ALTA' then 1 when 'MEDIA' then 2 else 3 end,
      tb.prazo asc nulls last,
      tb.created_at desc
    limit ${safeLimit}
    `,
    params
  );
  return result.rows;
};

const getResumo = async (url: URL): Promise<QueryResultRow> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  addCommonFilters(url, params, conditions);
  const finalArrayParam = addParam(params, finalStatuses);
  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    ${centralTasksCte}
    select
      count(*)::int as total,
      count(*) filter (where tb.status <> all(${finalArrayParam}::text[]))::int as abertas,
      count(*) filter (where tb.tipo = 'APROVACAO' and tb.status <> all(${finalArrayParam}::text[]))::int as aprovacoes_pendentes,
      count(*) filter (where tb.prazo is not null and tb.prazo < current_date and tb.status <> all(${finalArrayParam}::text[]))::int as atrasadas,
      count(*) filter (where (tb.prioridade = 'CRITICA' or (tb.prazo is not null and tb.prazo < current_date)) and tb.status <> all(${finalArrayParam}::text[]))::int as criticas,
      count(distinct tb.modulo)::int as modulos_com_tarefas,
      min(tb.prazo) filter (where tb.status <> all(${finalArrayParam}::text[])) as proximo_prazo
    from tarefas_base tb
    ${where}
    `,
    params
  );
  return result.rows[0];
};

const getPorModulo = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  addCommonFilters(url, params, conditions);
  const finalArrayParam = addParam(params, finalStatuses);
  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    ${centralTasksCte}
    select
      tb.modulo,
      count(*)::int as total,
      count(*) filter (where tb.status <> all(${finalArrayParam}::text[]))::int as abertas,
      count(*) filter (where tb.tipo = 'APROVACAO' and tb.status <> all(${finalArrayParam}::text[]))::int as aprovacoes,
      count(*) filter (where tb.prazo is not null and tb.prazo < current_date and tb.status <> all(${finalArrayParam}::text[]))::int as atrasadas,
      count(*) filter (where (tb.prioridade = 'CRITICA' or (tb.prazo is not null and tb.prazo < current_date)) and tb.status <> all(${finalArrayParam}::text[]))::int as criticas,
      min(tb.prazo) filter (where tb.status <> all(${finalArrayParam}::text[])) as proximo_prazo,
      max(tb.created_at) as ultimo_evento
    from tarefas_base tb
    ${where}
    group by tb.modulo
    order by criticas desc, atrasadas desc, abertas desc, tb.modulo
    `,
    params
  );
  return result.rows;
};

const fetchHistoricoManual = async (id: string): Promise<QueryResultRow[]> => {
  const result = await getPool().query(
    `
    select ctmh.*, u.nome as usuario_nome
    from central_tarefas_manuais_historico ctmh
    left join usuarios u on u.id = ctmh.usuario_id
    where ctmh.tarefa_id = $1
    order by ctmh.created_at desc
    `,
    [id]
  );
  return result.rows;
};

const fetchManualTask = async (id: string, includeHistory = false): Promise<Record<string, unknown> | undefined> => {
  const result = await getPool().query(
    `
    select
      ctm.*,
      resp.nome as responsavel_nome,
      perfil.nome as perfil_nome,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      cli.nome as cliente_nome,
      criador.nome as created_by_nome,
      atualizador.nome as updated_by_nome,
      (ctm.prazo is not null and ctm.prazo < current_date and ctm.status not in ('CONCLUIDA', 'CANCELADA')) as atrasada,
      (ctm.prioridade = 'CRITICA' or (ctm.prazo is not null and ctm.prazo < current_date and ctm.status not in ('CONCLUIDA', 'CANCELADA'))) as critica
    from central_tarefas_manuais ctm
    left join usuarios resp on resp.id = ctm.responsavel_id
    left join perfis perfil on perfil.id = ctm.perfil_id
    left join obras o on o.id = ctm.obra_id
    left join clientes cli on cli.id = ctm.cliente_id
    left join usuarios criador on criador.id = ctm.created_by
    left join usuarios atualizador on atualizador.id = ctm.updated_by
    where ctm.id = $1
    `,
    [id]
  );
  const tarefa = result.rows[0];
  if (!tarefa || !includeHistory) {
    return tarefa;
  }

  return {
    ...tarefa,
    historico: await fetchHistoricoManual(id)
  };
};

const fetchManualForUpdate = async (client: PoolClient, id: string): Promise<TarefaManualRow | undefined> => {
  const result = await client.query<TarefaManualRow>(
    `select id, company_id, status from central_tarefas_manuais where id = $1 for update`,
    [id]
  );
  return result.rows[0];
};

const insertHistoricoManual = async (
  client: PoolClient,
  tarefa: Pick<TarefaManualRow, 'id' | 'company_id' | 'status'>,
  acao: string,
  statusNovo: TarefaManualStatus,
  usuarioId: string | null,
  comentario: string | null,
  payload: Record<string, unknown>
): Promise<void> => {
  await client.query(
    `
    insert into central_tarefas_manuais_historico (
      tarefa_id, company_id, acao, status_anterior, status_novo, usuario_id, comentario, payload
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [tarefa.id, tarefa.company_id, acao, tarefa.status, statusNovo, usuarioId, comentario, JSON.stringify(payload)]
  );
};

const createManualTask = async (rawPayload: Record<string, unknown>) => {
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'company_id', 'codigo', 'titulo', 'descricao', 'modulo', 'origem', 'origem_id', 'prioridade',
    'responsavel_id', 'perfil_id', 'prazo', 'obra_id', 'cliente_id',
    'usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa'
  ]);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const companyId = await getDefaultCompanyId(client, payload);
    const mutation = getMutationContext(payload);
    const codigo = normalizeText(payload.codigo) || normalizeCodigo();
    const titulo = requiredText(payload, 'titulo');
    const descricao = optionalText(payload, 'descricao') || optionalText(payload, 'observacoes');
    const modulo = normalizeText(payload.modulo) || 'central-tarefas';
    const origem = normalizeText(payload.origem) || 'MANUAL';
    const prioridade = optionalEnum(payload, 'prioridade', prioridadeValues, 'MEDIA');

    const inserted = await client.query<{ id: string }>(
      `
      insert into central_tarefas_manuais (
        company_id, codigo, titulo, descricao, modulo, origem, origem_id, status, prioridade,
        responsavel_id, perfil_id, prazo, obra_id, cliente_id, created_by, updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, 'ABERTA', $8, $9, $10, $11, $12, $13, $14, $14)
      returning id
      `,
      [
        companyId,
        codigo,
        titulo,
        descricao,
        modulo,
        origem,
        optionalUuid(payload, 'origem_id'),
        prioridade,
        optionalUuid(payload, 'responsavel_id'),
        optionalUuid(payload, 'perfil_id'),
        optionalDate(payload, 'prazo'),
        optionalUuid(payload, 'obra_id'),
        optionalUuid(payload, 'cliente_id'),
        mutation.usuarioId
      ]
    );

    const tarefa = await fetchManualForUpdate(client, inserted.rows[0].id);
    if (!tarefa) {
      throw new HttpError(500, 'not_found', 'Tarefa manual criada nao encontrada.');
    }
    await insertHistoricoManual(client, { ...tarefa, status: 'ABERTA' }, 'criar', 'ABERTA', mutation.usuarioId, mutation.comentario, {
      titulo,
      modulo,
      origem,
      prioridade
    });
    await registrarAuditoria(client, companyId, 'central_tarefa_manual', tarefa.id, 'criar', {
      codigo,
      titulo,
      modulo,
      origem,
      prioridade
    }, mutation.usuarioId);
    await client.query('commit');
    return fetchManualTask(inserted.rows[0].id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const changeManualTask = async (id: string, rawPayload: Record<string, unknown>, action: ManualAction) => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'comentario', 'observacoes', 'justificativa', 'motivo', 'resolucao']);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const tarefa = await fetchManualForUpdate(client, id);
    if (!tarefa) {
      throw new HttpError(404, 'not_found', 'Tarefa manual da central nao encontrada.');
    }
    if (['CONCLUIDA', 'CANCELADA'].includes(tarefa.status) && action !== 'marcar-vista') {
      throw new HttpError(409, 'status_conflict', `Tarefa manual em status ${tarefa.status} nao permite a acao ${action}.`);
    }

    const mutation = getMutationContext(payload);
    const comentario = mutation.comentario || optionalText(payload, 'motivo') || optionalText(payload, 'resolucao');
    let statusNovo: TarefaManualStatus = tarefa.status;
    let sql = `update central_tarefas_manuais set vista_por = $1, vista_em = coalesce(vista_em, now()), updated_by = $1, updated_at = now() where id = $2`;
    let params: unknown[] = [mutation.usuarioId, id];

    if (action === 'iniciar') {
      statusNovo = 'EM_ANDAMENTO';
      sql = `update central_tarefas_manuais set status = 'EM_ANDAMENTO', iniciado_por = $1, iniciado_em = coalesce(iniciado_em, now()), updated_by = $1, updated_at = now() where id = $2`;
    } else if (action === 'concluir') {
      statusNovo = 'CONCLUIDA';
      sql = `update central_tarefas_manuais set status = 'CONCLUIDA', concluido_por = $1, concluido_em = now(), conclusao_observacoes = $2, updated_by = $1, updated_at = now() where id = $3`;
      params = [mutation.usuarioId, comentario, id];
    } else if (action === 'cancelar') {
      const motivo = comentario;
      if (!motivo) {
        throw new HttpError(400, 'validation_error', 'Motivo, observacao ou justificativa obrigatoria para cancelar.');
      }
      statusNovo = 'CANCELADA';
      sql = `update central_tarefas_manuais set status = 'CANCELADA', cancelado_por = $1, cancelado_em = now(), cancelamento_motivo = $2, updated_by = $1, updated_at = now() where id = $3`;
      params = [mutation.usuarioId, motivo, id];
    }

    await client.query(sql, params);
    await insertHistoricoManual(client, tarefa, action, statusNovo, mutation.usuarioId, comentario, {
      motivo: optionalText(payload, 'motivo'),
      resolucao: optionalText(payload, 'resolucao')
    });
    await registrarAuditoria(client, tarefa.company_id, 'central_tarefa_manual', id, action, {
      status_anterior: tarefa.status,
      status_novo: statusNovo,
      comentario
    }, mutation.usuarioId);
    await client.query('commit');
    return fetchManualTask(id, true);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const handleCentralTarefas = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/central-tarefas';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listTasks(url, 'todas') });
        return;
      }
      methodNotAllowed(res, ['GET']);
      return;
    }

    if (parts.length === 1 && parts[0] === 'resumo') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await getResumo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'minhas') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listTasks(url, 'minhas') });
      return;
    }

    if (parts.length === 1 && parts[0] === 'aprovacoes') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listTasks(url, 'aprovacoes') });
      return;
    }

    if (parts.length === 1 && parts[0] === 'por-modulo') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await getPorModulo(url) });
      return;
    }

    if (parts.length === 1 && parts[0] === 'atrasadas') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listTasks(url, 'atrasadas') });
      return;
    }

    if (parts.length === 1 && parts[0] === 'criticas') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listTasks(url, 'criticas') });
      return;
    }

    if (parts.length === 1 && parts[0] === 'manuais') {
      if (method !== 'POST') {
        methodNotAllowed(res, ['POST']);
        return;
      }
      sendJson(res, 201, { data: await createManualTask(await readJsonBody(req)) });
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (!isUuidString(id)) {
        sendError(res, 404, 'not_found', 'Rota da central de tarefas nao encontrada.');
        return;
      }
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      const tarefa = await fetchManualTask(id, true);
      if (!tarefa) {
        sendError(res, 404, 'not_found', 'Tarefa manual da central nao encontrada.');
        return;
      }
      sendJson(res, 200, { data: tarefa });
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (!isUuidString(id)) {
        sendError(res, 404, 'not_found', 'Rota da central de tarefas nao encontrada.');
        return;
      }
      if (action === 'marcar-vista' || action === 'iniciar' || action === 'concluir' || action === 'cancelar') {
        sendJson(res, 200, { data: await changeManualTask(id, await readJsonBody(req), action) });
        return;
      }
      sendError(res, 404, 'not_found', 'Acao da central de tarefas nao encontrada.');
      return;
    }

    sendError(res, 404, 'not_found', 'Rota da central de tarefas nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
