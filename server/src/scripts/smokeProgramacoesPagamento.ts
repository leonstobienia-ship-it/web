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

interface Obra {
  id: string;
  company_id?: string;
}

interface CentroCusto {
  id: string;
  company_id?: string;
}

interface Usuario {
  id: string;
  company_id?: string;
  email: string;
  perfil_principal?: string | null;
}

interface Fornecedor {
  id: string;
  company_id?: string;
}

interface SolicitacaoCompra {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
  itens?: Array<{ id: string }>;
}

interface Cotacao {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
}

interface MapaComparativo {
  resumo: {
    fornecedor_menor_total?: { fornecedor_id: string } | null;
  };
}

interface PedidoCompra {
  id: string;
  codigo: string;
  status: string;
  valor_total: string | number;
  aprovacao_status?: string | null;
  itens?: Array<{ id: string }>;
}

interface NotaEntrada {
  id: string;
  numero: string;
  status: string;
  valor_total: string | number;
  aprovacao_status?: string | null;
}

interface ContaPagar {
  id: string;
  numero_documento: string;
  status: string;
  aprovacao_status?: string | null;
  valor_aberto: string | number;
}

interface ProvisionamentoNota {
  nota: NotaEntrada;
  conta_pagar: ContaPagar;
}

interface ProgramacaoPagamento {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
  valor_total: string | number;
  quantidade_contas: number;
  contas?: Array<{ conta_pagar_id: string; status: string; valor_programado: string | number }>;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5D';

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
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

const expectHttpError = async (endpoint: string, expectedStatus: number, init?: RequestInit): Promise<void> => {
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

const pickByCompany = <T extends { company_id?: string }>(items: T[], companyId: string, label: string): T => {
  const item = items.find((entry) => entry.company_id === companyId) || items[0];
  if (!item) {
    throw new Error(`Nenhum registro encontrado em ${label}.`);
  }
  return item;
};

const findUsuario = (usuarios: Usuario[], email: string, perfil: string): Usuario => {
  const usuario = usuarios.find((item) => item.email === email) || usuarios.find((item) => item.perfil_principal === perfil);
  if (!usuario) {
    throw new Error(`Usuario seed ${email}/${perfil} nao encontrado.`);
  }
  return usuario;
};

const transitionSolicitacao = async (
  solicitacao: SolicitacaoCompra,
  action: string,
  expectedStatus: string
): Promise<SolicitacaoCompra> => {
  const response = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionCotacao = async (
  cotacao: Cotacao,
  action: string,
  expectedStatus: string,
  payload: Record<string, unknown> = {}
): Promise<Cotacao> => {
  const response = await requestJson<ApiItemResponse<Cotacao>>(`/cotacoes/${cotacao.id}/${action}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionPedido = async (
  pedido: PedidoCompra,
  action: string,
  expectedStatus: string
): Promise<PedidoCompra> => {
  const response = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionNota = async (
  nota: NotaEntrada,
  action: string,
  expectedStatus: string
): Promise<NotaEntrada> => {
  const response = await requestJson<ApiItemResponse<NotaEntrada>>(`/notas-fiscais-entrada/${nota.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const approveByValue = async <T extends { id: string; aprovacao_status?: string | null }>(
  endpoint: string,
  item: T,
  value: number,
  tecnico: Usuario,
  diretoria: Usuario,
  observacoes: string
): Promise<T> => {
  const action = value > 20000 ? 'aprovar-diretoria' : 'aprovar-tecnico';
  const usuario = value > 20000 ? diretoria : tecnico;
  const response = await requestJson<ApiItemResponse<T>>(`${endpoint}/${item.id}/${action}`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes
    })
  });
  const expected = value > 20000 ? 'APROVADO_DIRETORIA' : 'APROVADO_TECNICO';
  if (response.data.aprovacao_status !== expected) {
    throw new Error(`${endpoint}/${action} retornou aprovacao_status ${response.data.aprovacao_status}, esperado ${expected}.`);
  }
  return response.data;
};

const createConta = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  solicitante: Usuario,
  planejamento: Usuario,
  financeiro: Usuario,
  diretoria: Usuario,
  fornecedores: Fornecedor[],
  valor: number,
  suffix: string,
  approveConta: boolean
): Promise<ContaPagar> => {
  const createdSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: solicitante.id,
      titulo: `${marker} - solicitacao ${suffix}`,
      descricao: `${marker} - base local programacao ${suffix}`,
      prioridade: 'NORMAL',
      data_necessidade: today(),
      observacoes: `${marker} - sem dados reais`,
      itens: [
        {
          descricao: `${marker} - item ${suffix}`,
          unidade: 'un',
          quantidade: 1,
          valor_estimado_unitario: valor,
          observacoes: `${marker} - item local`
        }
      ]
    })
  });

  let solicitacao = await transitionSolicitacao(createdSolicitacao.data, 'enviar', 'ENVIADA');
  solicitacao = await transitionSolicitacao(solicitacao, 'em-analise', 'EM_ANALISE');
  solicitacao = await approveByValue('/solicitacoes-compra', solicitacao, valor, planejamento, diretoria, `${marker} - aprovacao solicitacao ${suffix}`);
  const detalheSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}`);
  const itens = detalheSolicitacao.data.itens || [];
  if (itens.length !== 1) {
    throw new Error('Solicitacao nao retornou item para cotacao.');
  }

  let cotacao = (await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      solicitacao_id: solicitacao.id,
      titulo: `${marker} - cotacao ${suffix}`,
      prazo_resposta: addDays(3),
      observacoes: `${marker} - cotacao local`,
      fornecedores: fornecedores.slice(0, 2).map((fornecedor) => ({ fornecedor_id: fornecedor.id }))
    })
  })).data;
  cotacao = await transitionCotacao(cotacao, 'enviar-fornecedores', 'ENVIADA_FORNECEDORES');
  cotacao = await transitionCotacao(cotacao, 'registrar-respostas', 'RESPOSTAS_RECEBIDAS', {
    fornecedores: fornecedores.slice(0, 2).map((fornecedor, fornecedorIndex) => ({
      fornecedor_id: fornecedor.id,
      prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 4,
      condicao_pagamento: `${marker} - condicao ${suffix}`,
      observacoes: `${marker} - resposta local`,
      itens: itens.map((item) => ({
        solicitacao_item_id: item.id,
        valor_unitario: fornecedorIndex === 0 ? valueWithMargin(valor, 1.02) : valor,
        marca_modelo: `${marker} - marca local`,
        prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 4,
        observacoes: `${marker} - item cotado`
      }))
    }))
  });
  cotacao = await transitionCotacao(cotacao, 'gerar-mapa', 'MAPA_GERADO', {
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - mapa ${suffix}`
  });
  const mapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  const vencedor = mapa.data.resumo.fornecedor_menor_total;
  if (!vencedor) {
    throw new Error('Mapa comparativo nao retornou fornecedor vencedor.');
  }
  cotacao = await transitionCotacao(cotacao, 'escolher-fornecedor', 'FORNECEDOR_ESCOLHIDO', {
    fornecedor_id: vencedor.fornecedor_id,
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - vencedor ${suffix}`
  });
  cotacao = await approveByValue('/cotacoes', cotacao, valor, planejamento, diretoria, `${marker} - aprovacao cotacao ${suffix}`);

  let pedido = (await requestJson<ApiItemResponse<PedidoCompra>>('/pedidos-compra/gerar-da-cotacao', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      cotacao_id: cotacao.id,
      titulo: `${marker} - pedido ${suffix}`,
      observacoes: `${marker} - pedido local sem pagamento`
    })
  })).data;
  pedido = await approveByValue('/pedidos-compra', pedido, valor, planejamento, diretoria, `${marker} - aprovacao pedido ${suffix}`);
  pedido = await transitionPedido(pedido, 'emitir', 'EMITIDO');
  pedido = await transitionPedido(pedido, 'enviar-fornecedor', 'ENVIADO_FORNECEDOR');
  pedido = await transitionPedido(pedido, 'confirmar', 'CONFIRMADO');
  const pedidoDetalhado = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}`);
  const valorPedido = Number(pedidoDetalhado.data.valor_total);

  let nota = (await requestJson<ApiItemResponse<NotaEntrada>>('/notas-fiscais-entrada/gerar-do-pedido', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      pedido_id: pedido.id,
      numero: `NF-${Date.now()}-${suffix}`,
      serie: 'V35D',
      tipo_documento: 'NOTA_FISCAL',
      data_emissao: today(),
      data_entrada: today(),
      valor_produtos: valorPedido,
      valor_servicos: 0,
      valor_frete: 0,
      valor_desconto: 0,
      valor_impostos: 0,
      valor_total: valorPedido,
      observacoes: `${marker} - nota local sem XML, SEFAZ ou pagamento`
    })
  })).data;
  nota = await transitionNota(nota, 'conferir', 'CONFERIDA');
  nota = await approveByValue('/notas-fiscais-entrada', nota, valorPedido, financeiro, diretoria, `${marker} - aprovacao NF ${suffix}`);

  const provisionamento = await requestJson<ApiItemResponse<ProvisionamentoNota>>(
    `/notas-fiscais-entrada/${nota.id}/provisionar-conta-pagar`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        data_vencimento: addDays(7),
        forma_pagamento_prevista: `${marker} - forma ${suffix}`,
        observacoes: `${marker} - conta provisionada sem pagamento`
      })
    }
  );
  let conta = provisionamento.data.conta_pagar;
  if (conta.status !== 'PROVISIONADA') {
    throw new Error(`Conta ${suffix} nasceu ${conta.status}, esperado PROVISIONADA.`);
  }

  if (approveConta) {
    conta = await approveByValue('/contas-pagar', conta, Number(conta.valor_aberto), financeiro, diretoria, `${marker} - aprovacao conta ${suffix}`);
    if (conta.status !== 'APROVADA') {
      throw new Error(`Conta ${suffix} ficou ${conta.status}, esperado APROVADA.`);
    }
  }

  return conta;
};

const valueWithMargin = (value: number, factor: number): number => Number((value * factor).toFixed(2));

const createProgramacao = async (empresa: Empresa, usuario: Usuario, suffix: string): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>('/programacoes-pagamento', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      data_prevista: addDays(12),
      forma_pagamento_prevista: `${marker} - forma ${suffix}`,
      observacoes: `${marker} - rascunho ${suffix}`,
      justificativa: `${marker} - programacao sem baixa ${suffix}`,
      usuario_id: usuario.id
    })
  })).data;

const addConta = async (programacao: ProgramacaoPagamento, conta: ContaPagar, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/contas`, {
    method: 'POST',
    body: JSON.stringify({
      conta_pagar_id: conta.id,
      usuario_id: usuario.id,
      observacoes: `${marker} - incluir conta`
    })
  })).data;

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

  const empresas = (await requestJson<ApiListResponse<Empresa>>('/empresas')).data;
  const empresa = empresas.find((item) => item.cnpj === '00.000.000/0001-33') || empresas[0];
  if (!empresa) {
    throw new Error('Nenhuma empresa local encontrada.');
  }
  const obras = (await requestJson<ApiListResponse<Obra>>('/obras')).data;
  const centros = (await requestJson<ApiListResponse<CentroCusto>>('/centros-custo')).data;
  const usuarios = (await requestJson<ApiListResponse<Usuario>>('/usuarios')).data;
  const fornecedores = (await requestJson<ApiListResponse<Fornecedor>>('/fornecedores')).data.filter((fornecedor) => !fornecedor.company_id || fornecedor.company_id === empresa.id);
  if (fornecedores.length < 2) {
    throw new Error('Smoke V3.5D exige ao menos 2 fornecedores locais.');
  }

  const obra = pickByCompany(obras, empresa.id, 'obras');
  const centroCusto = pickByCompany(centros, empresa.id, 'centros-custo');
  const leon = findUsuario(usuarios, 'leon.dev.v35b@enac.local', 'DIRETORIA');
  const gustavo = findUsuario(usuarios, 'gustavo.dev.v35b@enac.local', 'PLANEJAMENTO');
  const matheus = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const davison = findUsuario(usuarios, 'davison.dev.v35b@enac.local', 'CAMPO');

  const contaNaoAprovada = await createConta(empresa, obra, centroCusto, davison, gustavo, matheus, leon, fornecedores, 900, 'NAO-APROVADA', false);
  const programacaoBloqueio = await createProgramacao(empresa, matheus, 'BLOQUEIO');
  await expectHttpError(`/programacoes-pagamento/${programacaoBloqueio.id}/contas`, 409, {
    method: 'POST',
    body: JSON.stringify({
      conta_pagar_id: contaNaoAprovada.id,
      usuario_id: matheus.id,
      observacoes: `${marker} - bloqueio conta sem aprovacao`
    })
  });
  results.push({ etapa: 'Conta nao aprovada bloqueada', ok: true, detalhe: 'HTTP 409' });

  const contaBaixa = await createConta(empresa, obra, centroCusto, davison, gustavo, matheus, leon, fornecedores, 1200, 'BAIXA', true);
  let programacaoBaixa = await createProgramacao(empresa, matheus, 'BAIXA');
  programacaoBaixa = await addConta(programacaoBaixa, contaBaixa, matheus);
  if (!programacaoBaixa.contas?.some((conta) => conta.conta_pagar_id === contaBaixa.id)) {
    throw new Error('Conta aprovada nao foi incluida na programacao.');
  }
  results.push({ etapa: 'Conta aprovada incluida', ok: true, detalhe: programacaoBaixa.codigo });

  const programacaoDuplicada = await createProgramacao(empresa, matheus, 'DUPLICIDADE');
  await expectHttpError(`/programacoes-pagamento/${programacaoDuplicada.id}/contas`, 409, {
    method: 'POST',
    body: JSON.stringify({
      conta_pagar_id: contaBaixa.id,
      usuario_id: matheus.id,
      observacoes: `${marker} - duplicidade ativa`
    })
  });
  results.push({ etapa: 'Duplicidade ativa bloqueada', ok: true, detalhe: 'HTTP 409' });

  programacaoBaixa = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoBaixa.id}/submeter`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      justificativa: `${marker} - submeter programacao baixa`
    })
  })).data;
  if (programacaoBaixa.status !== 'SUBMETIDA') {
    throw new Error(`Programacao baixa ficou ${programacaoBaixa.status}, esperado SUBMETIDA.`);
  }
  results.push({ etapa: 'Programacao submetida', ok: true, detalhe: programacaoBaixa.codigo });

  programacaoBaixa = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoBaixa.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      observacoes: `${marker} - aprovar programacao baixa`
    })
  })).data;
  if (programacaoBaixa.status !== 'APROVADA' || programacaoBaixa.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Programacao baixa nao foi aprovada tecnicamente.');
  }
  const contaBaixaApos = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaBaixa.id}`)).data;
  if (contaBaixaApos.status === 'PAGA' || Number(contaBaixaApos.valor_aberto) !== Number(contaBaixa.valor_aberto)) {
    throw new Error('Aprovacao da programacao baixa executou pagamento ou alterou valor aberto.');
  }
  results.push({ etapa: 'Aprovacao tecnica sem pagamento/baixa', ok: true, detalhe: contaBaixaApos.status });

  const contaAlta = await createConta(empresa, obra, centroCusto, davison, gustavo, matheus, leon, fornecedores, 25000, 'ALTA', true);
  let programacaoAlta = await createProgramacao(empresa, matheus, 'ALTA');
  programacaoAlta = await addConta(programacaoAlta, contaAlta, matheus);
  programacaoAlta = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoAlta.id}/submeter`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      justificativa: `${marker} - submeter programacao alta`
    })
  })).data;
  await expectHttpError(`/programacoes-pagamento/${programacaoAlta.id}/aprovar-tecnico`, 403, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      observacoes: `${marker} - bloqueio acima de 20k`
    })
  });
  results.push({ etapa: 'Usuario sem alcada suficiente bloqueado', ok: true, detalhe: 'HTTP 403' });

  programacaoAlta = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoAlta.id}/aprovar-diretoria`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: leon.id,
      observacoes: `${marker} - diretoria aprova acima de 20k`
    })
  })).data;
  if (programacaoAlta.status !== 'APROVADA' || programacaoAlta.aprovacao_status !== 'APROVADO_DIRETORIA') {
    throw new Error('Diretoria nao aprovou programacao acima de 20k.');
  }
  const contaAltaApos = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaAlta.id}`)).data;
  if (contaAltaApos.status === 'PAGA' || Number(contaAltaApos.valor_aberto) !== Number(contaAlta.valor_aberto)) {
    throw new Error('Aprovacao da programacao alta executou pagamento ou alterou valor aberto.');
  }
  results.push({ etapa: 'Diretoria aprova acima de 20k sem baixa', ok: true, detalhe: programacaoAlta.codigo });

  for (const route of [
    `/programacoes-pagamento/${programacaoAlta.id}/pagar`,
    `/programacoes-pagamento/${programacaoAlta.id}/baixar`,
    `/contas-pagar/${contaAlta.id}/pagar`,
    `/contas-pagar/${contaAlta.id}/baixar`
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  const deleteStatus = await requestStatus(`/programacoes-pagamento/${programacaoAlta.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /programacoes-pagamento/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem pagar, baixar ou DELETE', ok: true, detalhe: 'HTTP 404/405' });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'programacao_pagamento'
      and payload::text like $1
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 6) {
    throw new Error('Auditoria de programacao de pagamento nao registrou eventos esperados.');
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  console.info(`Smoke V3.5D programacoes de pagamento concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa, integracao bancaria, CNAB ou DELETE fisico.`);
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
