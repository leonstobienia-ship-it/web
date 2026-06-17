import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

interface HomologacaoContext {
  companyId: string;
  obraId: string;
  contratoId: string;
  orcamentoId: string;
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
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_HOMOLOGACAO_ENAC_V316';

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

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

const expectAbsent = async (endpoint: string, method: string): Promise<void> => {
  const status = await requestStatus(endpoint, { method, body: method === 'GET' ? undefined : '{}' });
  if (status !== 400 && status !== 404 && status !== 405) {
    throw new Error(`${method} ${endpoint} retornou HTTP ${status}, esperado 400, 404 ou 405.`);
  }
};

const count = async (sql: string, params: unknown[] = []): Promise<number> => {
  const result = await query<{ total: string | number }>(sql, params);
  return Number(result.rows[0]?.total || 0);
};

const getContext = async (): Promise<HomologacaoContext> => {
  const result = await query<HomologacaoContext>(
    `
    select
      (select id from empresas where cnpj = '00.000.000/0001-33' limit 1) as "companyId",
      (select id from obras where codigo = 'HOMO-OBRA-001' limit 1) as "obraId",
      (select id from contratos_obra where numero = 'CT-HOMO-V316-001' limit 1) as "contratoId",
      (select id from orcamentos_obra where codigo = 'ORC-HOMO-V316-001' limit 1) as "orcamentoId",
      (select id from solicitacoes_compra where codigo = 'SC-HOMO-V316-001' limit 1) as "solicitacaoId",
      (select id from cotacoes where codigo = 'COT-HOMO-V316-001' limit 1) as "cotacaoId",
      (select id from pedidos_compra where codigo = 'PC-HOMO-V316-001' limit 1) as "pedidoId",
      (select id from notas_fiscais_entrada where numero = 'NF-HOMO-V316-001' limit 1) as "notaId",
      (select id from contas_pagar where numero_documento = 'CP-HOMO-V316-001' limit 1) as "contaId",
      (select id from programacoes_pagamento where codigo = 'PG-HOMO-V316-001' limit 1) as "programacaoId",
      (select id from medicoes_obra where numero = 'MED-HOMO-V316-001' limit 1) as "medicaoId",
      (select id from pedidos_faturamento where codigo = 'PF-HOMO-V316-001' limit 1) as "pedidoFaturamentoId",
      (select id from riscos_pendencias where codigo = 'RISC-HOMO-V316-001' limit 1) as "riscoId",
      (select id from usuarios where email = 'leon.homologacao.v316@enac.local' limit 1) as "usuarioId"
    `
  );
  const ctx = result.rows[0];
  for (const [key, value] of Object.entries(ctx || {})) {
    if (!value) {
      throw new Error(`Seed de homologacao incompleta: ${key} nao encontrado.`);
    }
  }
  return ctx;
};

const assertMinimum = (actual: number, minimum: number, label: string): void => {
  if (actual < minimum) {
    throw new Error(`${label}: esperado pelo menos ${minimum}, obtido ${actual}.`);
  }
};

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${String(expected)}, obtido ${String(actual)}.`);
  }
};

const run = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  const health = await requestJson<{ status: string }>('/health');
  assertEqual(health.status, 'ok', '/health');
  const healthDb = await requestJson<{ database?: { connected?: boolean; name?: string } }>('/health/db');
  if (healthDb.database?.connected !== true || healthDb.database.name !== 'enac_erp_dev') {
    throw new Error('/health/db nao confirmou PostgreSQL local enac_erp_dev.');
  }
  results.push({ etapa: 'Health local', ok: true, detalhe: 'API e PostgreSQL ok' });

  const ctx = await getContext();
  results.push({ etapa: 'Seed executada', ok: true, detalhe: marker });

  assertMinimum(await count('select count(*)::int as total from usuarios where cargo_funcao ilike $1', [`%${marker}%`]), 6, 'usuarios/perfis');
  assertMinimum(await count('select count(*)::int as total from perfis where descricao ilike $1', [`%${marker}%`]), 6, 'perfis');
  results.push({ etapa: 'Usuarios e perfis', ok: true, detalhe: 'Diretoria, Planejamento, Compras, Financeiro, Campo e Admin' });

  assertMinimum(await count('select count(*)::int as total from clientes where observacoes = $1', [marker]), 5, 'clientes');
  assertMinimum(await count('select count(*)::int as total from fornecedores where observacoes = $1', [marker]), 8, 'fornecedores');
  assertMinimum(await count('select count(*)::int as total from obras where observacoes = $1', [marker]), 5, 'obras');
  assertMinimum(await count('select count(*)::int as total from centros_custo where observacoes = $1', [marker]), 9, 'centros de custo');
  results.push({ etapa: 'Cadastros realistas', ok: true, detalhe: 'clientes, fornecedores, obras e centros' });

  assertMinimum(await count('select count(*)::int as total from contratos_obra where id = $1 and status = $2', [ctx.contratoId, 'ATIVO']), 1, 'contrato ativo');
  assertMinimum(await count('select count(*)::int as total from contratos_obra_aditivos where contrato_id = $1 and status = $2', [ctx.contratoId, 'APROVADO']), 1, 'aditivo aprovado');
  assertMinimum(await count('select count(*)::int as total from orcamentos_obra where id = $1 and status = $2', [ctx.orcamentoId, 'APROVADO']), 1, 'orcamento aprovado');
  assertMinimum(await count('select count(*)::int as total from planejamento_executivo where obra_id = $1 and status = $2', [ctx.obraId, 'ATIVO']), 3, 'planejamento ativo');
  results.push({ etapa: 'Contrato, aditivo, orcamento e planejamento', ok: true, detalhe: 'base de obra completa' });

  assertMinimum(await count('select count(*)::int as total from solicitacoes_compra where id = $1 and status = $2', [ctx.solicitacaoId, 'APROVADA_PARA_COTACAO']), 1, 'solicitacao');
  assertMinimum(await count('select count(*)::int as total from cotacoes where id = $1 and status = $2', [ctx.cotacaoId, 'FORNECEDOR_ESCOLHIDO']), 1, 'cotacao');
  assertMinimum(await count('select count(*)::int as total from mapa_comparativo_cotacao where cotacao_id = $1 and status = $2', [ctx.cotacaoId, 'FORNECEDOR_ESCOLHIDO']), 1, 'mapa');
  assertMinimum(await count('select count(*)::int as total from pedidos_compra where id = $1 and status = $2', [ctx.pedidoId, 'CONFIRMADO']), 1, 'pedido');
  results.push({ etapa: 'Compras', ok: true, detalhe: 'solicitacao, cotacao, mapa e pedido' });

  assertMinimum(await count('select count(*)::int as total from notas_fiscais_entrada where id = $1 and status = $2', [ctx.notaId, 'APROVADA']), 1, 'nota');
  assertMinimum(await count('select count(*)::int as total from contas_pagar where id = $1 and status = $2 and baixa_status = $3', [ctx.contaId, 'BAIXADA_MANUAL', 'BAIXADA_MANUAL']), 1, 'conta/baixa');
  assertMinimum(await count('select count(*)::int as total from programacoes_pagamento where id = $1 and status = $2 and liberacao_status = $3 and conferencia_status = $4', [ctx.programacaoId, 'LIBERADA', 'LIBERADA', 'CONFERIDA']), 1, 'programacao liberada/conferida');
  assertMinimum(await count('select count(*)::int as total from contas_pagar_baixas where conta_pagar_id = $1 and acao = $2 and resultado = $3', [ctx.contaId, 'BAIXAR_MANUAL', 'PERMITIDO']), 1, 'baixa manual seed');
  results.push({ etapa: 'Financeiro controlado', ok: true, detalhe: 'NF, conta, programacao, liberacao, conferencia e baixa manual simulada' });

  assertMinimum(await count('select count(*)::int as total from medicoes_obra where id = $1 and status = $2', [ctx.medicaoId, 'FATURADO_MANUALMENTE']), 1, 'medicao');
  assertMinimum(await count('select count(*)::int as total from pedidos_faturamento where id = $1 and status = $2', [ctx.pedidoFaturamentoId, 'FATURADO_MANUALMENTE']), 1, 'pedido faturamento');
  results.push({ etapa: 'Medicao e faturamento manual', ok: true, detalhe: 'sem emissao fiscal real' });

  const previsto = (await requestJson<ApiListResponse<Record<string, unknown>>>('/previsto-realizado/obras')).data;
  const previstoObra = previsto.find((item) => item.obra_id === ctx.obraId);
  if (!previstoObra || toNumber(previstoObra.valor_total_contratado) < 405000 || toNumber(previstoObra.orcamento_previsto) < 300000) {
    throw new Error('/previsto-realizado/obras nao retornou dados coerentes da homologacao.');
  }
  await requestJson<ApiItemResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/curva`);
  results.push({ etapa: 'Previsto x realizado', ok: true, detalhe: 'obra e curva mensal retornaram dados' });

  const dashboard = (await requestJson<ApiItemResponse<{ kpis: Record<string, unknown> }>>(`/dashboard-executivo/resumo?obra_id=${ctx.obraId}`)).data;
  if (toNumber(dashboard.kpis.valor_total_contratado) < 405000 || toNumber(dashboard.kpis.receita_faturada_manual) < 85000) {
    throw new Error('/dashboard-executivo/resumo nao consolidou a obra de homologacao.');
  }
  results.push({ etapa: 'Dashboard executivo', ok: true, detalhe: 'KPIs consolidados' });

  const riscos = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/riscos-pendencias?texto=${encodeURIComponent(marker)}`)).data;
  if (!riscos.some((risco) => risco.id === ctx.riscoId)) {
    throw new Error('/riscos-pendencias nao retornou o risco da seed.');
  }
  const tarefas = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/central-tarefas/minhas?usuario_id=${ctx.usuarioId}&texto=${encodeURIComponent(marker)}`)).data;
  if (tarefas.length === 0) {
    throw new Error('/central-tarefas/minhas nao retornou tarefas da seed.');
  }
  const documentos = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/documentos?texto=${encodeURIComponent(marker)}&limit=100`)).data;
  if (documentos.length < 5 || documentos.some((documento) => documento.status !== 'ATIVO')) {
    throw new Error('/documentos nao retornou documentos mockados ativos da seed.');
  }
  results.push({ etapa: 'Riscos, tarefas e documentos', ok: true, detalhe: `${riscos.length}/${tarefas.length}/${documentos.length}` });

  assertMinimum(await count('select count(*)::int as total from auditoria_eventos where payload->>$1 = $2', ['marker', marker]), 10, 'auditoria');
  results.push({ etapa: 'Auditoria', ok: true, detalhe: 'eventos com marcador' });

  assertEqual(await count('select count(*)::int as total from contas_pagar where observacoes = $1 and status = $2', [marker, 'PAGA']), 0, 'pagamento real');
  assertEqual(await count('select count(*)::int as total from documentos_anexos where observacao ilike $1 and (url_mock like $2 or referencia_local_mock like $2)', ['%upload real%', 'https://%']), 0, 'upload externo');
  for (const endpoint of [
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
  ]) {
    await expectAbsent(endpoint, 'POST');
  }
  for (const endpoint of [
    `/contas-pagar/${ctx.contaId}`,
    `/programacoes-pagamento/${ctx.programacaoId}`,
    `/documentos/${documentos[0].id}`,
    `/riscos-pendencias/${ctx.riscoId}`,
    `/central-tarefas/${tarefas[0].manual_id || tarefas[0].id}`
  ]) {
    await expectAbsent(endpoint, 'DELETE');
  }
  results.push({ etapa: 'Travas proibidas', ok: true, detalhe: 'sem pagamento real, CNAB, NFS-e, upload externo ou DELETE por API' });

  console.info(`Smoke V3.16/V3.17 homologacao concluido contra ${apiBaseUrl}. Marcador: ${marker}.`);
  console.table(results);
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
