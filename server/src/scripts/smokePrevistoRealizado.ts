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
  empresa: Empresa;
  clienteId: string;
  fornecedorId: string;
  centroCustoId: string;
  obraId: string;
  contratoId: string;
  orcamentoId: string;
}

interface ResumoObra {
  obra_id: string;
  valor_total_contratado: string | number;
  orcamento_previsto: string | number;
  custo_comprometido: string | number;
  custo_realizado: string | number;
  receita_medida: string | number;
  receita_faturada_manual: string | number;
  margem_prevista: string | number;
  margem_realizada: string | number;
  desvio_absoluto: string | number;
  saldo_a_faturar: string | number;
}

interface CurvaLinha {
  competencia: string;
  previsto: string | number;
  realizado: string | number;
  faturado: string | number;
  acumulado_previsto: string | number;
  acumulado_realizado: string | number;
  acumulado_faturado: string | number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_9';

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

const expectHttpStatus = async (endpoint: string, expectedStatus: number, init?: RequestInit): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`${endpoint} retornou HTTP ${response.status}, esperado ${expectedStatus}: ${text}`);
  }
};

const countBaixas = async (): Promise<number> => {
  const result = await query<{ total: string }>('select count(*)::int as total from contas_pagar_baixas');
  return Number(result.rows[0]?.total || 0);
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
    [empresa.id, `CC-${marker}-${stamp}`, `${marker} - Centro margem`, `${marker} - centro local`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Cliente ${stamp}`, uniqueCpfCnpj('390', stamp), `${marker} - cliente local`]
  );
  const fornecedor = await query<{ id: string }>(
    `
    insert into fornecedores (company_id, nome, tipo_pessoa, cpf_cnpj, categoria, status, observacoes)
    values ($1, $2, 'juridica', $3, 'materiais', 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Fornecedor ${stamp}`, uniqueCpfCnpj('391', stamp), `${marker} - fornecedor local`]
  );
  const obra = await query<{ id: string }>(
    `
    insert into obras (company_id, cliente_id, centro_custo_id, codigo, nome, status, observacoes)
    values ($1, $2, $3, $4, $5, 'ativo', $6)
    returning id
    `,
    [empresa.id, cliente.rows[0].id, centro.rows[0].id, `OB-${marker}-${stamp}`, `${marker} - Obra margem`, `${marker} - obra local`]
  );
  const contrato = await query<{ id: string }>(
    `
    insert into contratos_obra (
      company_id, cliente_id, obra_id, centro_custo_id, numero, objeto, escopo_resumo,
      valor_original, valor_aditivos, valor_total_contratado, data_inicio, data_fim, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, 30000, 5000, 35000, $8, $9, 'ATIVO', $10)
    returning id
    `,
    [
      empresa.id,
      cliente.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `CT-${marker}-${stamp}`,
      `${marker} - contrato gerencial`,
      `${marker} - escopo local`,
      today(),
      addDays(120),
      `${marker} - contrato sem fiscal/banco`
    ]
  );
  await query(
    `
    insert into contratos_obra_aditivos (
      contrato_id, company_id, numero, tipo, descricao, valor_delta, status, aprovacao_status, aprovado_em, justificativa
    )
    values ($1, $2, $3, 'VALOR_ESCOPO', $4, 5000, 'APROVADO', 'APROVADO_DIRETORIA', now(), $5)
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
    values ($1, $2, $3, $4, $5, $6, 'V1', $7, $8, 20000, 12000, 8000, 42.8571, 'APROVADO', now(), $9)
    returning id
    `,
    [
      empresa.id,
      obra.rows[0].id,
      cliente.rows[0].id,
      contrato.rows[0].id,
      centro.rows[0].id,
      `ORC-${marker}-${stamp}`,
      `${marker} - orçamento gerencial`,
      competenciaAtual(),
      `${marker} - aprovado local`
    ]
  );
  const pacote = await query<{ id: string }>(
    `
    insert into orcamentos_obra_pacotes (orcamento_id, company_id, codigo, nome, etapa, centro_custo_id, ordem, status)
    values ($1, $2, 'PAC-39', $3, 'Execucao', $4, 1, 'ATIVO')
    returning id
    `,
    [orcamento.rows[0].id, empresa.id, `${marker} - pacote margem`, centro.rows[0].id]
  );
  await query(
    `
    insert into orcamentos_obra_itens (
      orcamento_id, pacote_id, company_id, centro_custo_id, tipo, codigo, descricao, unidade,
      quantidade, valor_unitario_previsto, valor_total_previsto, status
    )
    values
      ($1, $2, $3, $4, 'MATERIAL', 'MAT-39', $5, 'un', 1, 12000, 12000, 'ATIVO'),
      ($1, $2, $3, $4, 'SERVICO', 'SRV-39', $6, 'un', 1, 8000, 8000, 'ATIVO')
    `,
    [orcamento.rows[0].id, pacote.rows[0].id, empresa.id, centro.rows[0].id, `${marker} - material`, `${marker} - serviço`]
  );
  await query(
    `
    insert into orcamentos_obra_cronograma (orcamento_id, pacote_id, company_id, competencia, valor_previsto, percentual_fisico_previsto, status)
    values
      ($1, $2, $3, $4, 12000, 60, 'ATIVO'),
      ($1, $2, $3, $5, 8000, 40, 'ATIVO')
    `,
    [orcamento.rows[0].id, pacote.rows[0].id, empresa.id, competenciaAtual(), addMonths(1)]
  );

  const pedido = await query<{ id: string }>(
    `
    insert into pedidos_compra (
      company_id, fornecedor_id, obra_id, centro_custo_id, numero, codigo, titulo,
      valor_total, data_emissao, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $5, $6, 9000, $7, 'CONFIRMADO', $8)
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
    values ($1, $2, $3, $4, $5, $6, '39', $7, $7, 8000, 8000, 'APROVADA', $8)
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
    values ($1, $2, $3, $4, $5, $6, $7, $8, $7, 8000, 8000, 8000, $9, 'APROVADA', true, false, $10)
    `,
    [
      empresa.id,
      fornecedor.rows[0].id,
      nota.rows[0].id,
      pedido.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      addDays(15),
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
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 12000, 12000, 12000, 'APROVADA', 'APROVADO_TECNICO', now(), $11)
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
    insert into medicoes_obra_itens (
      medicao_id, company_id, descricao, unidade, quantidade, valor_unitario, valor_total,
      centro_custo_id, etapa_servico, status
    )
    values ($1, $2, $3, 'un', 1, 12000, 12000, $4, 'Execucao', 'ATIVO')
    `,
    [medicao.rows[0].id, empresa.id, `${marker} - item medido`, centro.rows[0].id]
  );
  await query(
    `
    insert into pedidos_faturamento (
      medicao_id, company_id, cliente_id, obra_id, codigo, valor_solicitado, data_solicitacao,
      status, aprovacao_status, faturado_manual_data, faturado_manual_em, contrato_obra_id, observacoes
    )
    values ($1, $2, $3, $4, $5, 10000, $6, 'FATURADO_MANUALMENTE', 'APROVADO_TECNICO', $6, now(), $7, $8)
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
    empresa,
    clienteId: cliente.rows[0].id,
    fornecedorId: fornecedor.rows[0].id,
    centroCustoId: centro.rows[0].id,
    obraId: obra.rows[0].id,
    contratoId: contrato.rows[0].id,
    orcamentoId: orcamento.rows[0].id
  };
};

const assertMoney = (value: unknown, expected: number, label: string): void => {
  const actual = toNumber(value);
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, obtido ${actual}.`);
  }
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

  const baixasAntes = await countBaixas();
  const ctx = await createSeed();
  results.push({ etapa: 'Cenario gerencial criado', ok: true, detalhe: ctx.obraId });

  const obras = (await requestJson<ApiListResponse<ResumoObra>>('/previsto-realizado/obras')).data;
  if (!obras.some((obra) => obra.obra_id === ctx.obraId)) {
    throw new Error('/previsto-realizado/obras nao retornou a obra seed.');
  }
  results.push({ etapa: 'Listar obras gerenciais', ok: true, detalhe: `${obras.length} obra(s)` });

  const resumo = (await requestJson<ApiItemResponse<ResumoObra>>(`/previsto-realizado/obras/${ctx.obraId}/resumo`)).data;
  assertMoney(resumo.valor_total_contratado, 35000, 'valor_total_contratado');
  assertMoney(resumo.orcamento_previsto, 20000, 'orcamento_previsto');
  assertMoney(resumo.custo_comprometido, 9000, 'custo_comprometido');
  assertMoney(resumo.custo_realizado, 8000, 'custo_realizado');
  assertMoney(resumo.receita_medida, 12000, 'receita_medida');
  assertMoney(resumo.receita_faturada_manual, 10000, 'receita_faturada_manual');
  assertMoney(resumo.margem_prevista, 15000, 'margem_prevista');
  assertMoney(resumo.margem_realizada, 2000, 'margem_realizada');
  assertMoney(resumo.desvio_absoluto, -13000, 'desvio_absoluto');
  assertMoney(resumo.saldo_a_faturar, 2000, 'saldo_a_faturar');
  results.push({ etapa: 'Resumo por obra coerente', ok: true, detalhe: 'contrato/orcamento/custo/receita/margem' });

  const curva = (await requestJson<ApiListResponse<CurvaLinha>>(`/previsto-realizado/obras/${ctx.obraId}/curva`)).data;
  if (curva.length < 2 || !curva.some((linha) => linha.competencia === competenciaAtual())) {
    throw new Error('Curva mensal nao retornou competencias esperadas.');
  }
  const curvaAtual = curva.find((linha) => linha.competencia === competenciaAtual());
  assertMoney(curvaAtual?.previsto, 12000, 'curva previsto atual');
  assertMoney(curvaAtual?.realizado, 8000, 'curva realizado atual');
  assertMoney(curvaAtual?.faturado, 10000, 'curva faturado atual');
  results.push({ etapa: 'Curva mensal previsto x realizado', ok: true, detalhe: `${curva.length} competencia(s)` });

  const pacotes = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/pacotes`)).data;
  if (pacotes.length !== 1) {
    throw new Error('Pacotes gerenciais nao retornaram o pacote seed.');
  }
  assertMoney(pacotes[0].valor_previsto, 20000, 'pacote valor_previsto');
  results.push({ etapa: 'Agrupamento por pacote', ok: true, detalhe: String(pacotes[0].pacote_codigo) });

  const centros = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/centros-custo`)).data;
  if (!centros.some((centro) => centro.centro_custo_id === ctx.centroCustoId)) {
    throw new Error('Centros de custo nao retornaram centro seed.');
  }
  results.push({ etapa: 'Agrupamento por centro de custo', ok: true, detalhe: `${centros.length} centro(s)` });

  const contratos = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/previsto-realizado/obras/${ctx.obraId}/contratos`)).data;
  if (!contratos.some((contrato) => contrato.id === ctx.contratoId)) {
    throw new Error('Contratos nao retornaram contrato seed.');
  }
  assertMoney(contratos[0].valor_total_contratado, 35000, 'contrato valor_total_contratado');
  results.push({ etapa: 'Visao por contrato', ok: true, detalhe: `${contratos.length} contrato(s)` });

  const faturamento = (await requestJson<ApiItemResponse<{ totais: Record<string, unknown> }>>(`/previsto-realizado/obras/${ctx.obraId}/faturamento`)).data;
  assertMoney(faturamento.totais.receita_medida, 12000, 'faturamento receita_medida');
  assertMoney(faturamento.totais.receita_faturada_manual, 10000, 'faturamento receita_faturada_manual');
  results.push({ etapa: 'Visao de faturamento', ok: true, detalhe: 'medido e faturado manual' });

  const custos = (await requestJson<ApiItemResponse<{ totais: Record<string, unknown> }>>(`/previsto-realizado/obras/${ctx.obraId}/custos`)).data;
  assertMoney(custos.totais.custo_pedidos_confirmados, 9000, 'custos pedidos');
  assertMoney(custos.totais.custo_contas_realizadas, 8000, 'custos contas');
  results.push({ etapa: 'Visao de custos', ok: true, detalhe: 'pedido/nota/conta' });

  const portfolio = (await requestJson<ApiItemResponse<{ totais: Record<string, unknown>; obras: unknown[] }>>('/previsto-realizado/portfolio/resumo')).data;
  if (!portfolio.obras.length || toNumber(portfolio.totais.valor_total_contratado) < 35000) {
    throw new Error('Portfolio gerencial nao consolidou obras.');
  }
  results.push({ etapa: 'Resumo de portfolio', ok: true, detalhe: `${portfolio.obras.length} obra(s)` });

  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/pagar`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/baixar`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/gerar-cnab`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/emitir-nfse`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/integrar-prefeitura`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/gerar-boleto`, 404);
  await expectHttpStatus(`/previsto-realizado/obras/${ctx.obraId}/resumo`, 405, { method: 'DELETE' });

  const baixasDepois = await countBaixas();
  if (baixasDepois !== baixasAntes) {
    throw new Error(`Smoke V3.9 criou baixa manual indevidamente: antes=${baixasAntes}, depois=${baixasDepois}.`);
  }
  results.push({ etapa: 'Somente leitura e rotas proibidas ausentes', ok: true, detalhe: 'HTTP 404/405 e sem baixa nova' });

  console.info(`Smoke V3.9 previsto x realizado concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa nova, NFS-e, prefeitura, boleto, banco, CNAB ou DELETE fisico.`);
  console.table(results);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
