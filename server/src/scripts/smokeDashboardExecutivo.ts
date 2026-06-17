import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface Empresa {
  id: string;
  cnpj?: string;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

interface SeedContext {
  obraId: string;
  clienteId: string;
  centroCustoId: string;
  contratoId: string;
}

interface DashboardResumo {
  kpis: Record<string, unknown>;
  alertas_resumo: Record<string, unknown>;
  formulas: Record<string, string>;
}

interface DashboardObra {
  obra_id: string;
  valor_total_contratado: string | number;
  orcamento_previsto: string | number;
  custo_realizado: string | number;
  receita_faturada_manual: string | number;
  margem_realizada: string | number;
}

interface DashboardTendencia {
  competencia: string;
  faturamento_previsto: string | number;
  receita_faturada_manual: string | number;
  custo_realizado: string | number;
  margem_mensal: string | number;
}

interface Snapshot {
  baixas: number;
  contas: number;
  programacoes: number;
  pedidos_faturamento: number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_10';

const uniqueCpfCnpj = (prefix: string, stamp: number): string => `${prefix}${String(stamp).slice(-11).padStart(11, '0')}`;

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const competenciaAtual = (): string => today().slice(0, 7);

const addMonths = (months: number): string => {
  const value = new Date(`${competenciaAtual()}-01T00:00:00.000Z`);
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 7);
};

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

const getSnapshot = async (): Promise<Snapshot> => {
  const result = await query<Snapshot>(
    `
    select
      (select count(*)::int from contas_pagar_baixas) as baixas,
      (select count(*)::int from contas_pagar) as contas,
      (select count(*)::int from programacoes_pagamento) as programacoes,
      (select count(*)::int from pedidos_faturamento) as pedidos_faturamento
    `
  );
  return result.rows[0];
};

const createSeed = async (): Promise<SeedContext> => {
  const empresas = (await requestJson<ApiListResponse<Empresa>>('/empresas')).data;
  const empresa = empresas.find((item) => item.cnpj === '00.000.000/0001-33') || empresas[0];
  if (!empresa) {
    throw new Error('Nenhuma empresa local encontrada.');
  }

  const stamp = Date.now();
  const centro = await query<{ id: string }>(
    `
    insert into centros_custo (company_id, codigo, nome, tipo, status, observacoes)
    values ($1, $2, $3, 'obra', 'ativo', $4)
    returning id
    `,
    [empresa.id, `CC-${marker}-${stamp}`, `${marker} - Centro diretoria`, `${marker} - centro local`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Cliente ${stamp}`, uniqueCpfCnpj('310', stamp), `${marker} - cliente local`]
  );
  const fornecedor = await query<{ id: string }>(
    `
    insert into fornecedores (company_id, nome, tipo_pessoa, cpf_cnpj, categoria, status, observacoes)
    values ($1, $2, 'juridica', $3, 'materiais', 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Fornecedor ${stamp}`, uniqueCpfCnpj('312', stamp), `${marker} - fornecedor local`]
  );
  const obra = await query<{ id: string }>(
    `
    insert into obras (company_id, cliente_id, centro_custo_id, codigo, nome, status, observacoes)
    values ($1, $2, $3, $4, $5, 'ativo', $6)
    returning id
    `,
    [empresa.id, cliente.rows[0].id, centro.rows[0].id, `OB-${marker}-${stamp}`, `${marker} - Obra diretoria`, `${marker} - obra local`]
  );
  const contrato = await query<{ id: string }>(
    `
    insert into contratos_obra (
      company_id, cliente_id, obra_id, centro_custo_id, numero, objeto, escopo_resumo,
      valor_original, valor_aditivos, valor_total_contratado, data_inicio, data_fim, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, 60000, 10000, 70000, $8, $9, 'ATIVO', $10)
    returning id
    `,
    [
      empresa.id,
      cliente.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `CT-${marker}-${stamp}`,
      `${marker} - contrato diretoria`,
      `${marker} - escopo local`,
      today(),
      addDays(180),
      `${marker} - contrato sem fiscal/banco`
    ]
  );
  await query(
    `
    insert into contratos_obra_aditivos (
      contrato_id, company_id, numero, tipo, descricao, valor_delta, status, aprovacao_status, aprovado_em, justificativa
    )
    values ($1, $2, $3, 'VALOR_ESCOPO', $4, 10000, 'APROVADO', 'APROVADO_DIRETORIA', now(), $5)
    `,
    [contrato.rows[0].id, empresa.id, `AD-${marker}-${stamp}`, `${marker} - aditivo aprovado`, `${marker} - aditivo local`]
  );

  const orcamento = await query<{ id: string }>(
    `
    insert into orcamentos_obra (
      company_id, obra_id, cliente_id, contrato_obra_id, centro_custo_id, codigo, versao, descricao,
      competencia_base, valor_previsto_total, valor_material, valor_servico, margem_prevista_percentual,
      status, aprovado_em, aprovado_observacoes
    )
    values ($1, $2, $3, $4, $5, $6, 'V1', $7, $8, 42000, 26000, 16000, 40, 'APROVADO', now(), $9)
    returning id
    `,
    [
      empresa.id,
      obra.rows[0].id,
      cliente.rows[0].id,
      contrato.rows[0].id,
      centro.rows[0].id,
      `ORC-${marker}-${stamp}`,
      `${marker} - orçamento diretoria`,
      competenciaAtual(),
      `${marker} - aprovado local`
    ]
  );
  const pacote = await query<{ id: string }>(
    `
    insert into orcamentos_obra_pacotes (orcamento_id, company_id, codigo, nome, etapa, centro_custo_id, ordem, status)
    values ($1, $2, 'PAC-310', $3, 'Execucao', $4, 1, 'ATIVO')
    returning id
    `,
    [orcamento.rows[0].id, empresa.id, `${marker} - pacote diretoria`, centro.rows[0].id]
  );
  await query(
    `
    insert into orcamentos_obra_itens (
      orcamento_id, pacote_id, company_id, centro_custo_id, tipo, codigo, descricao, unidade,
      quantidade, valor_unitario_previsto, valor_total_previsto, status
    )
    values
      ($1, $2, $3, $4, 'MATERIAL', 'MAT-310', $5, 'un', 1, 26000, 26000, 'ATIVO'),
      ($1, $2, $3, $4, 'SERVICO', 'SRV-310', $6, 'un', 1, 16000, 16000, 'ATIVO')
    `,
    [orcamento.rows[0].id, pacote.rows[0].id, empresa.id, centro.rows[0].id, `${marker} - material`, `${marker} - serviço`]
  );
  await query(
    `
    insert into orcamentos_obra_cronograma (orcamento_id, pacote_id, company_id, competencia, valor_previsto, percentual_fisico_previsto, status)
    values
      ($1, $2, $3, $4, 25000, 60, 'ATIVO'),
      ($1, $2, $3, $5, 17000, 40, 'ATIVO')
    `,
    [orcamento.rows[0].id, pacote.rows[0].id, empresa.id, competenciaAtual(), addMonths(1)]
  );

  const pedido = await query<{ id: string }>(
    `
    insert into pedidos_compra (
      company_id, fornecedor_id, obra_id, centro_custo_id, numero, codigo, titulo,
      valor_total, data_emissao, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $5, $6, 18000, $7, 'CONFIRMADO', $8)
    returning id
    `,
    [
      empresa.id,
      fornecedor.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `PC-${marker}-${stamp}`,
      `${marker} - pedido confirmado`,
      today(),
      `${marker} - custo comprometido`
    ]
  );
  const nota = await query<{ id: string }>(
    `
    insert into notas_fiscais_entrada (
      company_id, pedido_id, fornecedor_id, obra_id, centro_custo_id, numero, serie,
      data_emissao, data_entrada, valor_produtos, valor_total, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, '310', $7, $7, 15000, 15000, 'APROVADA', $8)
    returning id
    `,
    [
      empresa.id,
      pedido.rows[0].id,
      fornecedor.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `NF-${marker}-${stamp}`,
      today(),
      `${marker} - nota aprovada local`
    ]
  );
  await query(
    `
    insert into contas_pagar (
      company_id, fornecedor_id, nota_entrada_id, pedido_id, obra_id, centro_custo_id,
      vencimento, data_emissao, data_vencimento, valor_original, valor_aberto, saldo,
      numero_documento, status, ativo, divergencia_pendente, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $7, 15000, 15000, 15000, $9, 'APROVADA', true, false, $10)
    `,
    [
      empresa.id,
      fornecedor.rows[0].id,
      nota.rows[0].id,
      pedido.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      addDays(20),
      today(),
      `CP-${marker}-${stamp}`,
      `${marker} - conta aprovada sem baixa`
    ]
  );

  const medicao = await query<{ id: string }>(
    `
    insert into medicoes_obra (
      company_id, cliente_id, obra_id, centro_custo_id, competencia, periodo_inicio, periodo_fim,
      numero, contrato_obra_id, contrato_escopo, valor_medido, valor_bruto, valor_liquido_previsto,
      status, aprovacao_status, aprovado_em, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 28000, 28000, 28000, 'APROVADA', 'APROVADO_TECNICO', now(), $11)
    returning id
    `,
    [
      empresa.id,
      cliente.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `${competenciaAtual()}-01`,
      today(),
      addDays(30),
      `MED-${marker}-${stamp}`,
      contrato.rows[0].id,
      `${marker} - escopo medido`,
      `${marker} - medição aprovada`
    ]
  );
  await query(
    `
    insert into pedidos_faturamento (
      medicao_id, company_id, cliente_id, obra_id, codigo, valor_solicitado, data_solicitacao,
      status, aprovacao_status, faturado_manual_data, faturado_manual_em, contrato_obra_id, observacoes
    )
    values ($1, $2, $3, $4, $5, 24000, $6, 'FATURADO_MANUALMENTE', 'APROVADO_TECNICO', $6, now(), $7, $8)
    `,
    [
      medicao.rows[0].id,
      empresa.id,
      cliente.rows[0].id,
      obra.rows[0].id,
      `PF-${marker}-${stamp}`,
      today(),
      contrato.rows[0].id,
      `${marker} - faturamento manual informativo`
    ]
  );

  return {
    obraId: obra.rows[0].id,
    clienteId: cliente.rows[0].id,
    centroCustoId: centro.rows[0].id,
    contratoId: contrato.rows[0].id
  };
};

const assertMoney = (value: unknown, expected: number, label: string): void => {
  const actual = toNumber(value);
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, obtido ${actual}.`);
  }
};

const assertArray = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} nao retornou lista.`);
  }
  return value;
};

const run = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  const health = await requestJson<{ status: string }>('/health');
  if (health.status !== 'ok') {
    throw new Error('/health nao retornou status ok.');
  }
  const healthDb = await requestJson<{ database?: { connected?: boolean; name?: string } }>('/health/db');
  if (healthDb.database?.connected !== true || healthDb.database.name !== 'enac_erp_dev') {
    throw new Error('/health/db nao confirmou PostgreSQL local enac_erp_dev.');
  }
  results.push({ etapa: 'Health local', ok: true, detalhe: 'API e PostgreSQL ok' });

  const snapshotAntes = await getSnapshot();
  const ctx = await createSeed();
  results.push({ etapa: 'Cenario executivo criado', ok: true, detalhe: ctx.obraId });

  const filtroObra = `?obra_id=${ctx.obraId}`;
  const resumo = (await requestJson<ApiItemResponse<DashboardResumo>>(`/dashboard-executivo/resumo${filtroObra}`)).data;
  assertMoney(resumo.kpis.valor_total_contratado, 70000, 'kpi valor_total_contratado');
  assertMoney(resumo.kpis.orcamento_previsto, 42000, 'kpi orcamento_previsto');
  assertMoney(resumo.kpis.custo_realizado, 15000, 'kpi custo_realizado');
  assertMoney(resumo.kpis.receita_faturada_manual, 24000, 'kpi receita_faturada_manual');
  assertMoney(resumo.kpis.margem_prevista, 28000, 'kpi margem_prevista');
  assertMoney(resumo.kpis.margem_realizada, 9000, 'kpi margem_realizada');
  if (!resumo.formulas.margem_realizada) {
    throw new Error('/dashboard-executivo/resumo nao retornou formulas.');
  }
  results.push({ etapa: 'Resumo executivo coerente', ok: true, detalhe: 'kpis e formulas' });

  const obras = (await requestJson<ApiListResponse<DashboardObra>>('/dashboard-executivo/obras')).data;
  const obra = obras.find((item) => item.obra_id === ctx.obraId);
  if (!obra) {
    throw new Error('/dashboard-executivo/obras nao retornou a obra seed.');
  }
  assertMoney(obra.valor_total_contratado, 70000, 'obra valor_total_contratado');
  assertMoney(obra.orcamento_previsto, 42000, 'obra orcamento_previsto');
  assertMoney(obra.custo_realizado, 15000, 'obra custo_realizado');
  assertMoney(obra.receita_faturada_manual, 24000, 'obra receita_faturada_manual');
  results.push({ etapa: 'Lista de obras executivas', ok: true, detalhe: `${obras.length} obra(s)` });

  const alertas = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/dashboard-executivo/alertas${filtroObra}`)).data;
  assertArray(alertas, 'alertas');
  results.push({ etapa: 'Alertas executivos', ok: true, detalhe: `${alertas.length} alerta(s)` });

  const tendencia = (await requestJson<ApiListResponse<DashboardTendencia>>(`/dashboard-executivo/tendencia-mensal${filtroObra}`)).data;
  if (tendencia.length < 2 || !tendencia.some((item) => item.competencia === competenciaAtual())) {
    throw new Error('Tendencia mensal nao retornou competencias esperadas.');
  }
  const atual = tendencia.find((item) => item.competencia === competenciaAtual());
  assertMoney(atual?.faturamento_previsto, 25000, 'tendencia faturamento_previsto');
  assertMoney(atual?.receita_faturada_manual, 24000, 'tendencia receita_faturada_manual');
  assertMoney(atual?.custo_realizado, 15000, 'tendencia custo_realizado');
  assertMoney(atual?.margem_mensal, 9000, 'tendencia margem_mensal');
  results.push({ etapa: 'Tendencia mensal', ok: true, detalhe: `${tendencia.length} competencia(s)` });

  const ranking = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/dashboard-executivo/ranking-obras')).data;
  for (const key of ['maior_faturamento', 'maior_custo_realizado', 'maior_desvio_orcamento', 'menor_margem', 'maior_saldo_a_faturar', 'maiores_contas_em_aberto']) {
    assertArray(ranking[key], `ranking ${key}`);
  }
  results.push({ etapa: 'Ranking de obras', ok: true, detalhe: 'seis visoes' });

  const financeiro = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/dashboard-executivo/financeiro${filtroObra}`)).data;
  if (!financeiro.totais || !Array.isArray(financeiro.por_obra)) {
    throw new Error('Financeiro executivo retornou contrato invalido.');
  }
  results.push({ etapa: 'Resumo financeiro executivo', ok: true, detalhe: 'contas/programacoes/baixas informativas' });

  const faturamento = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/dashboard-executivo/faturamento${filtroObra}`)).data;
  if (!faturamento.totais || !Array.isArray(faturamento.maiores_saldos_a_faturar)) {
    throw new Error('Faturamento executivo retornou contrato invalido.');
  }
  results.push({ etapa: 'Resumo de faturamento executivo', ok: true, detalhe: 'medido/faturado/saldo' });

  const operacional = (await requestJson<ApiItemResponse<Record<string, unknown>>>(`/dashboard-executivo/operacional${filtroObra}`)).data;
  if (!operacional.totais || !Array.isArray(operacional.status_solicitacoes) || !Array.isArray(operacional.status_pedidos_compra)) {
    throw new Error('Operacional executivo retornou contrato invalido.');
  }
  results.push({ etapa: 'Resumo operacional executivo', ok: true, detalhe: 'status por modulo' });

  await requestJson<ApiItemResponse<DashboardResumo>>(
    `/dashboard-executivo/resumo?cliente_id=${ctx.clienteId}&centro_custo_id=${ctx.centroCustoId}&contrato_id=${ctx.contratoId}&periodo_de=${today()}&periodo_ate=${addDays(45)}`
  );
  results.push({ etapa: 'Filtros parametrizados', ok: true, detalhe: 'obra, cliente, centro, contrato e periodo' });

  for (const route of [
    '/dashboard-executivo/pagar',
    '/dashboard-executivo/baixar',
    '/dashboard-executivo/executar-pagamento',
    '/dashboard-executivo/gerar-cnab',
    '/dashboard-executivo/integracao-bancaria',
    '/dashboard-executivo/emitir-nfse',
    '/dashboard-executivo/integrar-prefeitura',
    '/dashboard-executivo/gerar-boleto'
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404 && status !== 405) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404 ou 405.`);
    }
  }
  const deleteStatus = await requestStatus('/dashboard-executivo/resumo', { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /dashboard-executivo/resumo retornou HTTP ${deleteStatus}, esperado 405.`);
  }

  const snapshotDepois = await getSnapshot();
  if (snapshotDepois.baixas !== snapshotAntes.baixas) {
    throw new Error(`Dashboard criou baixa indevidamente: antes=${snapshotAntes.baixas}, depois=${snapshotDepois.baixas}.`);
  }
  if (snapshotDepois.programacoes !== snapshotAntes.programacoes) {
    throw new Error(`Dashboard criou programacao indevidamente: antes=${snapshotAntes.programacoes}, depois=${snapshotDepois.programacoes}.`);
  }
  results.push({ etapa: 'Somente leitura e rotas proibidas ausentes', ok: true, detalhe: 'HTTP 404/405 e sem baixa/programacao nova' });

  console.info(`Smoke V3.10 dashboard executivo concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa nova, NFS-e, prefeitura, boleto, banco, CNAB ou DELETE fisico.`);
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
