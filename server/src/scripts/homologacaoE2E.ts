import { execFile } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface E2EResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
  evidencia?: Record<string, unknown>;
}

interface HomologacaoContext {
  companyId: string;
  clienteId: string;
  fornecedorId: string;
  obraId: string;
  centroCustoId: string;
  contratoId: string;
  aditivoId: string;
  orcamentoId: string;
  planejamentoId: string;
  solicitacaoId: string;
  cotacaoId: string;
  pedidoId: string;
  notaId: string;
  contaId: string;
  programacaoId: string;
  medicaoId: string;
  pedidoFaturamentoId: string;
  riscoId: string;
  usuarioId: string;
  perfilId: string;
}

interface SnapshotFinanceiro {
  contas: number;
  programacoes: number;
  baixas: number;
}

interface EvidenceIds {
  tarefaId?: string;
  riscoId?: string;
  documentoId?: string;
}

interface ReportData {
  generatedAt: string;
  environment: string;
  commit: string;
  marker: string;
  baseSeedMarker: string;
  apiBaseUrl: string;
  context: HomologacaoContext;
  evidenceIds: EvidenceIds;
  results: E2EResult[];
  expectedBlocks: string[];
  restrictions: Record<string, boolean>;
}

const execFileAsync = promisify(execFile);

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_E2E_V3_20';
const baseSeedMarker = 'DEV_LOCAL_HOMOLOGACAO_ENAC_V316';
const taskCode = 'E2E-V3-20-TAREFA-001';
const riskCode = 'E2E-V3-20-RISCO-001';
const documentReference = 'mock://homologacao/v3.20/e2e-nota-fiscal';
const reportFilePattern = /^homologacao-e2e-\d{8}T\d{6}\.md$/;

const projectRoot = process.cwd().endsWith('server')
  ? resolve(process.cwd(), '..')
  : process.cwd();

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const compactStamp = (date = new Date()): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '').replace('T', 'T');

const requestJson = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) as T & { message?: string } : undefined;

  if (!response.ok) {
    throw new Error(`${endpoint} retornou HTTP ${response.status}: ${body?.message || text}`);
  }

  return body as T;
};

const requestStatus = async (endpoint: string, init?: RequestInit): Promise<number> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  return response.status;
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertMinimum = (actual: number, minimum: number, label: string): void => {
  if (actual < minimum) {
    throw new Error(`${label}: esperado pelo menos ${minimum}, obtido ${actual}.`);
  }
};

const count = async (sql: string, params: unknown[] = []): Promise<number> => {
  const result = await query<{ total: string | number }>(sql, params);
  return Number(result.rows[0]?.total || 0);
};

const getGitCommit = async (): Promise<string> => {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd: projectRoot });
    return stdout.trim();
  } catch {
    return 'indisponivel';
  }
};

const runSeedHomologacao = async (): Promise<string> => {
  const childEnv = { ...process.env };
  delete childEnv.DATABASE_URL;
  const seedPath = resolve(process.cwd(), 'dist', 'db', 'seedHomologacao.js');
  const { stdout, stderr } = await execFileAsync(process.execPath, [seedPath], {
    cwd: process.cwd(),
    env: childEnv,
    maxBuffer: 1024 * 1024 * 5
  });
  return `${stdout}${stderr}`.trim();
};

const getContext = async (): Promise<HomologacaoContext> => {
  const result = await query<HomologacaoContext>(
    `
    select
      (select id from empresas where cnpj = '00.000.000/0001-33' limit 1) as "companyId",
      (select id from clientes where cpf_cnpj = '16.316.000/0001-01' limit 1) as "clienteId",
      (select id from fornecedores where cpf_cnpj = '26.316.000/0001-01' limit 1) as "fornecedorId",
      (select id from obras where codigo = 'HOMO-OBRA-001' limit 1) as "obraId",
      (select id from centros_custo where codigo = 'HOMO-MATERIAIS' limit 1) as "centroCustoId",
      (select id from contratos_obra where numero = 'CT-HOMO-V316-001' limit 1) as "contratoId",
      (select id from contratos_obra_aditivos where numero = 'AD-HOMO-V316-001' limit 1) as "aditivoId",
      (select id from orcamentos_obra where codigo = 'ORC-HOMO-V316-001' limit 1) as "orcamentoId",
      (select id from planejamento_executivo where obra_id = (select id from obras where codigo = 'HOMO-OBRA-001' limit 1) and status = 'ATIVO' order by created_at asc limit 1) as "planejamentoId",
      (select id from solicitacoes_compra where codigo = 'SC-HOMO-V316-001' limit 1) as "solicitacaoId",
      (select id from cotacoes where codigo = 'COT-HOMO-V316-001' limit 1) as "cotacaoId",
      (select id from pedidos_compra where codigo = 'PC-HOMO-V316-001' limit 1) as "pedidoId",
      (select id from notas_fiscais_entrada where numero = 'NF-HOMO-V316-001' limit 1) as "notaId",
      (select id from contas_pagar where numero_documento = 'CP-HOMO-V316-001' limit 1) as "contaId",
      (select id from programacoes_pagamento where codigo = 'PG-HOMO-V316-001' limit 1) as "programacaoId",
      (select id from medicoes_obra where numero = 'MED-HOMO-V316-001' limit 1) as "medicaoId",
      (select id from pedidos_faturamento where codigo = 'PF-HOMO-V316-001' limit 1) as "pedidoFaturamentoId",
      (select id from riscos_pendencias where codigo = 'RISC-HOMO-V316-001' limit 1) as "riscoId",
      (select id from usuarios where email = 'leon.homologacao.v316@enac.local' limit 1) as "usuarioId",
      (select id from perfis where nome = 'DIRETORIA' and company_id = (select id from empresas where cnpj = '00.000.000/0001-33' limit 1) limit 1) as "perfilId"
    `
  );
  const ctx = result.rows[0];
  for (const [key, value] of Object.entries(ctx || {})) {
    if (!value) {
      throw new Error(`Contexto de homologacao incompleto: ${key} nao encontrado.`);
    }
  }
  return ctx;
};

const getFinanceSnapshot = async (): Promise<SnapshotFinanceiro> => {
  const result = await query<SnapshotFinanceiro>(
    `
    select
      (select count(*)::int from contas_pagar) as contas,
      (select count(*)::int from programacoes_pagamento) as programacoes,
      (select count(*)::int from contas_pagar_baixas) as baixas
    `
  );
  return result.rows[0];
};

const expectAbsent = async (endpoint: string, method: string): Promise<void> => {
  const status = await requestStatus(endpoint, { method, body: method === 'GET' ? undefined : '{}' });
  if (status !== 400 && status !== 404 && status !== 405) {
    throw new Error(`${method} ${endpoint} retornou HTTP ${status}, esperado 400, 404 ou 405.`);
  }
};

const getExistingId = async (sql: string, params: unknown[]): Promise<string | undefined> => {
  const result = await query<{ id: string }>(sql, params);
  return result.rows[0]?.id;
};

const ensureE2ETask = async (ctx: HomologacaoContext): Promise<string> => {
  const existing = await getExistingId(
    `select id from central_tarefas_manuais where company_id = $1 and codigo = $2 limit 1`,
    [ctx.companyId, taskCode]
  );
  if (existing) {
    await requestJson<ApiItemResponse<Record<string, unknown>>>(`/central-tarefas/${existing}`);
    return existing;
  }

  const created = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/central-tarefas/manuais', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      codigo: taskCode,
      titulo: `${marker} - Validar roteiro assistido ponta a ponta`,
      descricao: `${marker} - tarefa manual mock criada pelo script de homologacao automatizada`,
      modulo: 'homologacao',
      origem: 'MANUAL',
      prioridade: 'ALTA',
      responsavel_id: ctx.usuarioId,
      perfil_id: ctx.perfilId,
      prazo: addDays(2),
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      usuario_id: ctx.usuarioId,
      comentario: `${marker} - evidencia de criacao assistida`
    })
  })).data;

  const id = String(created.id);
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/central-tarefas/${id}/marcar-vista`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - tarefa vista no E2E` })
  });
  return id;
};

const ensureE2ERisk = async (ctx: HomologacaoContext): Promise<string> => {
  const existing = await getExistingId(
    `select id from riscos_pendencias where company_id = $1 and codigo = $2 limit 1`,
    [ctx.companyId, riskCode]
  );
  if (existing) {
    await requestJson<ApiItemResponse<Record<string, unknown>>>(`/riscos-pendencias/${existing}`);
    return existing;
  }

  const created = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/riscos-pendencias', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      codigo: riskCode,
      titulo: `${marker} - Pendencia de evidencia assistida`,
      descricao: `${marker} - risco operacional mock sem pagamento, baixa, CNAB ou integracao real`,
      tipo: 'DOCUMENTACAO',
      prioridade: 'ALTA',
      responsavel_id: ctx.usuarioId,
      prazo: addDays(5),
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      contrato_obra_id: ctx.contratoId,
      orcamento_id: ctx.orcamentoId,
      pedido_compra_id: ctx.pedidoId,
      nota_fiscal_entrada_id: ctx.notaId,
      conta_pagar_id: ctx.contaId,
      programacao_pagamento_id: ctx.programacaoId,
      medicao_id: ctx.medicaoId,
      pedido_faturamento_id: ctx.pedidoFaturamentoId,
      origem: 'OPERACIONAL',
      usuario_id: ctx.usuarioId,
      comentario: `${marker} - criada pelo E2E`
    })
  })).data;

  const id = String(created.id);
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/riscos-pendencias/${id}/iniciar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - pendencia iniciada no E2E` })
  });
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/riscos-pendencias/${id}/resolver`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, resolucao: `${marker} - resolvida como evidencia assistida` })
  });
  return id;
};

const ensureE2EDocument = async (ctx: HomologacaoContext): Promise<string> => {
  const existing = await getExistingId(
    `select id from documentos_anexos where referencia_local_mock = $1 order by criado_em asc limit 1`,
    [documentReference]
  );
  if (existing) {
    await requestJson<ApiItemResponse<Record<string, unknown>>>(`/documentos/${existing}`);
    return existing;
  }

  const created = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/documentos', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      entidade_tipo: 'nota_fiscal_entrada',
      entidade_id: ctx.notaId,
      tipo_documento: 'NF',
      nome_arquivo: 'homologacao-e2e-v3.20-nota-fiscal.xml',
      mime_type: 'application/xml',
      tamanho_bytes: 2048,
      descricao: `${marker} - documento mock vinculado a NF de entrada`,
      observacao: 'Referencia local assistida, sem upload real externo e sem SharePoint real.',
      origem: 'ERP_LOCAL',
      referencia_local_mock: documentReference,
      url_mock: documentReference,
      usuario_id: ctx.usuarioId
    })
  })).data;
  return String(created.id);
};

const validateCoreFlow = async (ctx: HomologacaoContext, results: E2EResult[]): Promise<void> => {
  const baseCounts = {
    clientes: await count('select count(*)::int as total from clientes where observacoes = $1', [baseSeedMarker]),
    fornecedores: await count('select count(*)::int as total from fornecedores where observacoes = $1', [baseSeedMarker]),
    obras: await count('select count(*)::int as total from obras where observacoes = $1', [baseSeedMarker]),
    centros: await count('select count(*)::int as total from centros_custo where observacoes = $1', [baseSeedMarker]),
    usuarios: await count('select count(*)::int as total from usuarios where cargo_funcao ilike $1', [`%${baseSeedMarker}%`])
  };
  assertMinimum(baseCounts.clientes, 5, 'clientes de homologacao');
  assertMinimum(baseCounts.fornecedores, 8, 'fornecedores de homologacao');
  assertMinimum(baseCounts.obras, 5, 'obras de homologacao');
  assertMinimum(baseCounts.centros, 9, 'centros de custo de homologacao');
  assertMinimum(baseCounts.usuarios, 6, 'usuarios de homologacao');
  results.push({ etapa: 'Base Cliente/Fornecedor/Obra', ok: true, detalhe: 'cadastros locais de homologacao encontrados', evidencia: baseCounts });

  const contrato = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/contratos-obra/${ctx.contratoId}`)).data;
  assert(contrato.status === 'ATIVO', 'Contrato de homologacao nao esta ATIVO.');
  assertMinimum(await count('select count(*)::int as total from contratos_obra_aditivos where id = $1 and status = $2', [ctx.aditivoId, 'APROVADO']), 1, 'aditivo aprovado');
  results.push({ etapa: 'Contrato e aditivo', ok: true, detalhe: 'contrato ativo e aditivo aprovado', evidencia: { contrato_id: ctx.contratoId, aditivo_id: ctx.aditivoId } });

  const orcamento = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/orcamentos-obra/${ctx.orcamentoId}`)).data;
  const resumoOrcamento = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/orcamentos-obra/${ctx.orcamentoId}/resumo`)).data;
  assert(orcamento.status === 'APROVADO', 'Orcamento base de homologacao nao esta APROVADO.');
  const totalPrevistoOrcamento = resumoOrcamento.valor_previsto_total ?? resumoOrcamento.total_previsto;
  assert(toNumber(totalPrevistoOrcamento) >= 300000, 'Resumo do orcamento retornou total previsto insuficiente.');
  results.push({ etapa: 'Orcamento base', ok: true, detalhe: 'orcamento aprovado com resumo gerencial', evidencia: { orcamento_id: ctx.orcamentoId, total_previsto: totalPrevistoOrcamento } });

  const planejamento = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/planejamento-executivo/${ctx.planejamentoId}`)).data;
  assert(planejamento.status === 'ATIVO', 'Planejamento executivo nao esta ATIVO.');
  results.push({ etapa: 'Planejamento executivo', ok: true, detalhe: 'etapa ativa vinculada a obra', evidencia: { planejamento_id: ctx.planejamentoId } });

  const solicitacao = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/solicitacoes-compra/${ctx.solicitacaoId}`)).data;
  const cotacao = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/cotacoes/${ctx.cotacaoId}`)).data;
  const mapa = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/cotacoes/mapa-comparativo?cotacao_id=${ctx.cotacaoId}`)).data;
  const pedido = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/pedidos-compra/${ctx.pedidoId}`)).data;
  assert(solicitacao.status === 'APROVADA_PARA_COTACAO', 'Solicitacao nao foi aprovada para cotacao.');
  assert(cotacao.status === 'FORNECEDOR_ESCOLHIDO', 'Cotacao nao possui fornecedor escolhido.');
  assert(mapa && typeof mapa === 'object', 'Mapa comparativo nao retornou objeto.');
  assert(pedido.status === 'CONFIRMADO', 'Pedido de compra nao esta CONFIRMADO.');
  results.push({ etapa: 'Compras ponta a ponta', ok: true, detalhe: 'solicitacao, cotacao, mapa e pedido confirmados', evidencia: { solicitacao_id: ctx.solicitacaoId, cotacao_id: ctx.cotacaoId, pedido_id: ctx.pedidoId } });

  const nota = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/notas-fiscais-entrada/${ctx.notaId}`)).data;
  const conta = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/contas-pagar/${ctx.contaId}`)).data;
  assert(nota.status === 'APROVADA', 'Nota fiscal de entrada nao esta APROVADA.');
  assert(String(nota.pedido_compra_id || nota.pedido_id) === ctx.pedidoId, 'NF nao preservou vinculo com pedido.');
  assert(['PROVISIONADA', 'APROVADA', 'BAIXADA_MANUAL'].includes(String(conta.status)), 'Conta a pagar retornou status inesperado.');
  assert(String(conta.nota_fiscal_entrada_id || conta.nota_entrada_id || conta.nota_id) === ctx.notaId, 'Conta nao preservou vinculo com NF.');
  results.push({ etapa: 'NF e Conta a Pagar', ok: true, detalhe: 'NF aprovada e conta vinculada, sem pagamento real', evidencia: { nota_id: ctx.notaId, conta_id: ctx.contaId, conta_status: conta.status } });

  const programacao = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/programacoes-pagamento/${ctx.programacaoId}`)).data;
  const liberacoes = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/programacoes-pagamento/${ctx.programacaoId}/liberacoes`)).data;
  const conferencias = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/programacoes-pagamento/${ctx.programacaoId}/conferencias`)).data;
  assert(programacao.status === 'LIBERADA', 'Programacao de homologacao nao esta LIBERADA.');
  assert(liberacoes.length > 0, 'Programacao nao possui historico de liberacao.');
  assert(conferencias.length > 0, 'Programacao nao possui historico de conferencia.');
  results.push({ etapa: 'Programacao, liberacao e conferencia', ok: true, detalhe: 'fluxo financeiro interno validado sem execucao bancaria', evidencia: { programacao_id: ctx.programacaoId, liberacoes: liberacoes.length, conferencias: conferencias.length } });

  const baixas = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/contas-pagar/${ctx.contaId}/baixas`)).data;
  assert(baixas.some((baixa) => baixa.acao === 'BAIXAR_MANUAL' && baixa.resultado === 'PERMITIDO'), 'Baixa manual controlada da seed nao foi encontrada.');
  results.push({ etapa: 'Baixa manual controlada', ok: true, detalhe: 'baixa manual local existente validada; nenhuma baixa nova executada pela V3.20', evidencia: { conta_id: ctx.contaId, baixas: baixas.length } });

  const medicao = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/medicoes/${ctx.medicaoId}`)).data;
  const faturamento = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/pedidos-faturamento/${ctx.pedidoFaturamentoId}`)).data;
  assert(medicao.status === 'FATURADO_MANUALMENTE', 'Medicao nao esta faturada manualmente.');
  assert(faturamento.status === 'FATURADO_MANUALMENTE', 'Pedido de faturamento nao esta faturado manualmente.');
  results.push({ etapa: 'Medicao e faturamento manual', ok: true, detalhe: 'medicao e pedido interno faturados manualmente, sem NFS-e real', evidencia: { medicao_id: ctx.medicaoId, pedido_faturamento_id: ctx.pedidoFaturamentoId } });

  const previstoResumo = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/resumo`)).data;
  const previstoCurva = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/curva`)).data;
  assert(toNumber(previstoResumo.valor_total_contratado) >= 405000, 'Previsto x Realizado nao consolidou valor contratado.');
  assert(Array.isArray(previstoCurva) && previstoCurva.length > 0, 'Curva Previsto x Realizado retornou formato inesperado.');
  results.push({ etapa: 'Previsto x Realizado', ok: true, detalhe: 'resumo e curva consultados', evidencia: { obra_id: ctx.obraId, valor_total_contratado: previstoResumo.valor_total_contratado, competencias: previstoCurva.length } });

  const dashboard = (await requestJson<ApiItemResponse<{ kpis: Record<string, unknown> }>>(`/dashboard-executivo/resumo?obra_id=${ctx.obraId}`)).data;
  assert(toNumber(dashboard.kpis.valor_total_contratado) >= 405000, 'Dashboard nao retornou KPIs da obra.');
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/dashboard-executivo/financeiro?obra_id=${ctx.obraId}`);
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/dashboard-executivo/operacional?obra_id=${ctx.obraId}`);
  results.push({ etapa: 'Dashboard executivo', ok: true, detalhe: 'KPIs financeiro e operacional consultados', evidencia: { valor_total_contratado: dashboard.kpis.valor_total_contratado } });
};

const validateAssistedEvidence = async (ctx: HomologacaoContext, results: E2EResult[]): Promise<EvidenceIds> => {
  const before = await getFinanceSnapshot();
  const tarefaId = await ensureE2ETask(ctx);
  const riscoId = await ensureE2ERisk(ctx);
  const documentoId = await ensureE2EDocument(ctx);
  const after = await getFinanceSnapshot();

  assert(before.contas === after.contas, 'E2E criou conta a pagar indevidamente.');
  assert(before.programacoes === after.programacoes, 'E2E criou programacao financeira indevidamente.');
  assert(before.baixas === after.baixas, 'E2E criou baixa manual nova indevidamente.');

  const tarefas = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/central-tarefas/minhas?usuario_id=${ctx.usuarioId}&texto=${encodeURIComponent(marker)}`)).data;
  const risco = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/riscos-pendencias/${riscoId}`)).data;
  const documentos = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/documentos?texto=${encodeURIComponent(marker)}&limit=100`)).data;

  assert(tarefas.some((item) => item.id === tarefaId), 'Central de Tarefas nao retornou a tarefa E2E.');
  assert(risco.status === 'RESOLVIDA', 'Risco E2E nao ficou resolvido.');
  assert(documentos.some((item) => item.id === documentoId), 'Documento E2E nao apareceu na consulta.');

  results.push({ etapa: 'Central de Tarefas', ok: true, detalhe: 'tarefa manual E2E criada/consultada de forma idempotente', evidencia: { tarefa_id: tarefaId } });
  results.push({ etapa: 'Riscos e Pendencias', ok: true, detalhe: 'pendencia E2E criada, iniciada e resolvida sem operacao financeira', evidencia: { risco_id: riscoId, status: risco.status } });
  results.push({ etapa: 'Documentos mock', ok: true, detalhe: 'documento local mock vinculado a NF, sem upload externo', evidencia: { documento_id: documentoId } });
  results.push({ etapa: 'Snapshot financeiro preservado', ok: true, detalhe: 'nenhuma conta, programacao ou baixa nova foi criada pelas evidencias E2E', evidencia: { antes: before, depois: after } });

  return { tarefaId, riscoId, documentoId };
};

const validateAuditAndRestrictions = async (ctx: HomologacaoContext, evidence: EvidenceIds, results: E2EResult[]): Promise<Record<string, boolean>> => {
  const auditResumo = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/auditoria/resumo?texto=${encodeURIComponent(marker)}`)).data;
  const auditEventos = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/auditoria/eventos?texto=${encodeURIComponent(marker)}&limit=100`)).data;
  assert(toNumber(auditResumo.total) >= 3, 'Auditoria nao retornou eventos E2E suficientes.');
  assert(auditEventos.length >= 3, 'Eventos de auditoria E2E insuficientes.');
  results.push({ etapa: 'Auditoria', ok: true, detalhe: 'eventos E2E consultados por API', evidencia: { resumo: auditResumo, eventos: auditEventos.length } });

  const blockedRoutes = [
    '/contas-pagar/pagar',
    `/contas-pagar/${ctx.contaId}/pagar`,
    '/programacoes-pagamento/pagar',
    `/programacoes-pagamento/${ctx.programacaoId}/pagar`,
    '/programacoes-pagamento/gerar-cnab',
    '/programacoes-pagamento/integracao-bancaria',
    '/medicoes/emitir-nfse',
    '/pedidos-faturamento/emitir-nfse',
    '/pedidos-faturamento/integrar-prefeitura',
    '/documentos/upload',
    '/documentos/sharepoint',
    '/documentos/graph',
    '/documentos/power-automate'
  ];
  for (const route of blockedRoutes) {
    await expectAbsent(route, 'POST');
  }
  for (const route of [
    `/contas-pagar/${ctx.contaId}`,
    `/programacoes-pagamento/${ctx.programacaoId}`,
    `/documentos/${evidence.documentoId || ctx.notaId}`,
    `/riscos-pendencias/${evidence.riscoId || ctx.riscoId}`,
    `/central-tarefas/${evidence.tarefaId || ctx.riscoId}`
  ]) {
    await expectAbsent(route, 'DELETE');
  }

  const restrictions = {
    pagamentoReal: true,
    bancoReal: true,
    cnab: true,
    nfseReal: true,
    prefeitura: true,
    boletoReal: true,
    sharePointReal: true,
    deleteFisico: true
  };
  results.push({ etapa: 'Travas proibidas', ok: true, detalhe: 'rotas reais proibidas ausentes ou bloqueadas por HTTP 400/404/405', evidencia: { rotas_testadas: blockedRoutes.length + 5 } });
  return restrictions;
};

const findExistingReport = async (reportsDir: string): Promise<{ markdownPath: string; jsonPath: string } | undefined> => {
  try {
    const files = await readdir(reportsDir);
    const markdown = files.filter((file) => reportFilePattern.test(file)).sort()[0];
    if (!markdown) {
      return undefined;
    }
    const json = markdown.replace(/\.md$/, '.json');
    if (!files.includes(json)) {
      return undefined;
    }
    return {
      markdownPath: join(reportsDir, markdown),
      jsonPath: join(reportsDir, json)
    };
  } catch {
    return undefined;
  }
};

const renderMarkdown = (report: ReportData): string => {
  const restrictionRows = Object.entries(report.restrictions)
    .map(([key, value]) => `| ${key} | ${value ? 'OK' : 'FALHA'} |`)
    .join('\n');
  const stepRows = report.results
    .map((item, index) => `| ${index + 1} | ${item.etapa} | ${item.ok ? 'OK' : 'FALHA'} | ${item.detalhe} |`)
    .join('\n');
  const ids = Object.entries(report.context)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
  const evidenceIds = Object.entries(report.evidenceIds)
    .map(([key, value]) => `| ${key} | ${value || '-'} |`)
    .join('\n');

  return `# Homologacao E2E V3.20 - ERP ENAC

## Execucao

- Data/hora: ${report.generatedAt}
- Ambiente: ${report.environment}
- Commit no momento da execucao: ${report.commit}
- API: ${report.apiBaseUrl}
- Marcador V3.20: ${report.marker}
- Massa base: ${report.baseSeedMarker}

## Etapas Executadas

| # | Etapa | Status obtido | Evidencia |
|---|---|---|---|
${stepRows}

## IDs Criados ou Usados

| Chave | ID |
|---|---|
${ids}

## Evidencias V3.20

| Chave | ID |
|---|---|
${evidenceIds}

## Bloqueios Esperados

${report.expectedBlocks.map((item) => `- ${item}`).join('\n')}

## Restricoes Confirmadas

| Restricao | Status |
|---|---|
${restrictionRows}

## Falhas

Nenhuma falha bloqueante registrada nesta execucao.

## Itens para V3.20.1 ou V3.21

- Executar homologacao humana assistida sobre os roteiros e registrar feedback operacional.
- Se a equipe pedir evidencias visuais versionadas, avaliar Playwright em etapa propria.
- Manter integracoes externas reais bloqueadas ate autorizacao explicita.
`;
};

const writeReports = async (report: ReportData): Promise<{ markdownPath: string; jsonPath: string; reused: boolean }> => {
  const reportsDir = join(projectRoot, 'reports', 'homologacao', 'v3.20');
  await mkdir(reportsDir, { recursive: true });
  const existing = await findExistingReport(reportsDir);
  if (existing && process.env.ENAC_E2E_FORCE_REPORT !== '1') {
    return { ...existing, reused: true };
  }

  const stamp = compactStamp();
  const markdownPath = join(reportsDir, `homologacao-e2e-${stamp}.md`);
  const jsonPath = join(reportsDir, `homologacao-e2e-${stamp}.json`);
  await writeFile(markdownPath, renderMarkdown(report), 'utf8');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { markdownPath, jsonPath, reused: false };
};

const run = async (): Promise<void> => {
  const results: E2EResult[] = [];
  const generatedAt = new Date().toISOString();
  const commit = await getGitCommit();

  const health = await requestJson<{ status: string }>('/health');
  assert(health.status === 'ok', '/health nao retornou status ok.');
  const healthDb = await requestJson<{ database?: { connected?: boolean; name?: string } }>('/health/db');
  assert(healthDb.database?.connected === true && healthDb.database.name === 'enac_erp_dev', '/health/db nao confirmou PostgreSQL local enac_erp_dev.');
  results.push({ etapa: 'Health', ok: true, detalhe: 'API e PostgreSQL local OK', evidencia: { database: healthDb.database?.name } });

  const seedOutput = await runSeedHomologacao();
  results.push({ etapa: 'Seed base', ok: true, detalhe: 'seed de homologacao consolidada executada de forma idempotente', evidencia: { marker: baseSeedMarker, saida: seedOutput.split('\n').slice(-3).join(' | ') } });

  const ctx = await getContext();
  await validateCoreFlow(ctx, results);
  const evidenceIds = await validateAssistedEvidence(ctx, results);
  const restrictions = await validateAuditAndRestrictions(ctx, evidenceIds, results);

  const expectedBlocks = [
    'Pagamento real nao existe nesta homologacao.',
    'CNAB e integracao bancaria retornam 400/404/405.',
    'NFS-e real, prefeitura, boleto real e cobranca real nao existem.',
    'SharePoint/Graph/Entra/Power Automate reais nao sao usados.',
    'DELETE fisico permanece bloqueado.',
    'A baixa manual validada e apenas a baixa controlada local ja existente na massa de homologacao.'
  ];

  const report: ReportData = {
    generatedAt,
    environment: 'development/local',
    commit,
    marker,
    baseSeedMarker,
    apiBaseUrl,
    context: ctx,
    evidenceIds,
    results,
    expectedBlocks,
    restrictions
  };
  const reportPaths = await writeReports(report);

  console.info(`Homologacao E2E V3.20 concluida contra ${apiBaseUrl}. Marcador: ${marker}.`);
  console.info(`Relatorio Markdown: ${reportPaths.markdownPath}${reportPaths.reused ? ' (existente preservado)' : ''}`);
  console.info(`Relatorio JSON: ${reportPaths.jsonPath}${reportPaths.reused ? ' (existente preservado)' : ''}`);
  console.table(results.map(({ etapa, ok, detalhe }) => ({ etapa, ok, detalhe })));
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
