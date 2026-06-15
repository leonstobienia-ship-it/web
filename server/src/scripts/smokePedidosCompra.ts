interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface Empresa {
  id: string;
}

interface Obra {
  id: string;
}

interface CentroCusto {
  id: string;
}

interface Usuario {
  id: string;
}

interface Fornecedor {
  id: string;
}

interface SolicitacaoItem {
  id: string;
}

interface SolicitacaoCompra {
  id: string;
  codigo: string;
  status: string;
  itens?: SolicitacaoItem[];
}

interface CotacaoFornecedor {
  fornecedor_id: string;
}

interface Cotacao {
  id: string;
  codigo: string;
  status: string;
  fornecedores?: CotacaoFornecedor[];
}

interface MapaComparativo {
  resumo: {
    fornecedor_menor_total?: CotacaoFornecedor | null;
    fornecedor_vencedor?: CotacaoFornecedor | null;
  };
}

interface PedidoCompra {
  id: string;
  codigo: string;
  status: string;
  valor_total: string | number;
  itens?: Array<{ id: string }>;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_4C';

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

const expectHttpError = async (endpoint: string, expectedStatus: number, init?: RequestInit): Promise<string> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${endpoint} retornou HTTP ${response.status}, esperado ${expectedStatus}: ${text}`);
  }
  return text;
};

const getFirst = async <T>(endpoint: string, label: string): Promise<T> => {
  const response = await requestJson<ApiListResponse<T>>(endpoint);
  const first = response.data[0];
  if (!first) {
    throw new Error(`Nenhum registro encontrado em ${label}. Rode seed/cadastros antes do smoke.`);
  }
  return first;
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

const run = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  const health = await requestJson<{ status: string }>('/health');
  if (health.status !== 'ok') {
    throw new Error('/health nao retornou status ok.');
  }
  results.push({ etapa: 'GET /health', ok: true, detalhe: 'status ok' });

  const healthDb = await requestJson<{ database?: { connected?: boolean; name?: string } }>('/health/db');
  if (healthDb.database?.connected !== true || healthDb.database.name !== 'enac_erp_dev') {
    throw new Error('/health/db nao confirmou PostgreSQL local enac_erp_dev.');
  }
  results.push({ etapa: 'GET /health/db', ok: true, detalhe: 'PostgreSQL local conectado' });

  const empresa = await getFirst<Empresa>('/empresas', 'empresas');
  const obra = await getFirst<Obra>('/obras', 'obras');
  const centroCusto = await getFirst<CentroCusto>('/centros-custo', 'centros-custo');
  const usuario = await getFirst<Usuario>('/usuarios', 'usuarios');
  const fornecedores = (await requestJson<ApiListResponse<Fornecedor>>('/fornecedores')).data;
  if (fornecedores.length < 2) {
    throw new Error('Smoke V3.4C exige ao menos 2 fornecedores locais.');
  }

  const createdSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: usuario.id,
      titulo: `${marker} - solicitacao para pedido`,
      descricao: `${marker} - base local para pedido de compra`,
      prioridade: 'NORMAL',
      data_necessidade: new Date().toISOString().slice(0, 10),
      observacoes: `${marker} - sem dados reais`,
      itens: [
        {
          descricao: `${marker} - item material`,
          unidade: 'un',
          quantidade: 2,
          valor_estimado_unitario: 10,
          observacoes: `${marker} - item local`
        },
        {
          descricao: `${marker} - item servico`,
          unidade: 'h',
          quantidade: 3,
          valor_estimado_unitario: 20,
          observacoes: `${marker} - item local`
        }
      ]
    })
  });
  results.push({ etapa: 'POST /solicitacoes-compra', ok: true, detalhe: createdSolicitacao.data.codigo });

  let solicitacao = await transitionSolicitacao(createdSolicitacao.data, 'enviar', 'ENVIADA');
  solicitacao = await transitionSolicitacao(solicitacao, 'em-analise', 'EM_ANALISE');
  const detalheSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}`);
  if (!Array.isArray(detalheSolicitacao.data.itens) || detalheSolicitacao.data.itens.length !== 2) {
    throw new Error('Solicitacao de smoke nao retornou os itens para cotacao.');
  }
  results.push({ etapa: 'Solicitação em análise', ok: true, detalhe: detalheSolicitacao.data.status });

  let cotacao = (await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      solicitacao_id: solicitacao.id,
      titulo: `${marker} - cotacao para pedido`,
      prazo_resposta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      observacoes: `${marker} - cotacao local para pedido`,
      fornecedores: fornecedores.slice(0, 2).map((fornecedor) => ({ fornecedor_id: fornecedor.id }))
    })
  })).data;
  results.push({ etapa: 'POST /cotacoes', ok: true, detalhe: cotacao.codigo });

  cotacao = await transitionCotacao(cotacao, 'enviar-fornecedores', 'ENVIADA_FORNECEDORES');

  const responsePayload = {
    fornecedores: fornecedores.slice(0, 2).map((fornecedor, fornecedorIndex) => ({
      fornecedor_id: fornecedor.id,
      prazo_entrega_dias: fornecedorIndex === 0 ? 6 : 4,
      condicao_pagamento: `${marker} - pagamento local ${fornecedorIndex + 1}`,
      observacoes: `${marker} - resposta local`,
      itens: (detalheSolicitacao.data.itens || []).map((item, itemIndex) => ({
        solicitacao_item_id: item.id,
        valor_unitario: fornecedorIndex === 0 ? (itemIndex === 0 ? 12 : 21) : (itemIndex === 0 ? 9 : 18),
        marca_modelo: `${marker} - marca local`,
        prazo_entrega_dias: fornecedorIndex === 0 ? 6 : 4,
        observacoes: `${marker} - item cotado localmente`
      }))
    }))
  };
  cotacao = await transitionCotacao(cotacao, 'registrar-respostas', 'RESPOSTAS_RECEBIDAS', responsePayload);
  cotacao = await transitionCotacao(cotacao, 'gerar-mapa', 'MAPA_GERADO', {
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - mapa gerado para pedido`
  });
  const mapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  const fornecedorVencedor = mapa.data.resumo.fornecedor_menor_total;
  if (!fornecedorVencedor) {
    throw new Error('Mapa nao retornou fornecedor vencedor candidato.');
  }
  cotacao = await transitionCotacao(cotacao, 'escolher-fornecedor', 'FORNECEDOR_ESCOLHIDO', {
    fornecedor_id: fornecedorVencedor.fornecedor_id,
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - vencedor escolhido para pedido`
  });
  results.push({ etapa: 'Cotacao com vencedor', ok: true, detalhe: cotacao.status });

  let pedido = (await requestJson<ApiItemResponse<PedidoCompra>>('/pedidos-compra/gerar-da-cotacao', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      cotacao_id: cotacao.id,
      titulo: `${marker} - pedido de compra local`,
      observacoes: `${marker} - pedido local sem NF e sem financeiro`
    })
  })).data;
  if (pedido.status !== 'RASCUNHO' || !Array.isArray(pedido.itens) || pedido.itens.length !== 2) {
    throw new Error('Pedido gerado nao retornou RASCUNHO com itens herdados.');
  }
  results.push({ etapa: 'POST /pedidos-compra/gerar-da-cotacao', ok: true, detalhe: pedido.codigo });

  const listPedidos = await requestJson<ApiListResponse<PedidoCompra>>('/pedidos-compra');
  if (!listPedidos.data.some((item) => item.id === pedido.id)) {
    throw new Error('GET /pedidos-compra nao retornou o pedido criado.');
  }
  const detalhePedido = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}`);
  if (Number(detalhePedido.data.valor_total) <= 0) {
    throw new Error('GET /pedidos-compra/:id nao retornou valor total valido.');
  }
  results.push({ etapa: 'GET /pedidos-compra e /:id', ok: true, detalhe: detalhePedido.data.codigo });

  pedido = await transitionPedido(pedido, 'emitir', 'EMITIDO');
  pedido = await transitionPedido(pedido, 'enviar-fornecedor', 'ENVIADO_FORNECEDOR');
  pedido = await transitionPedido(pedido, 'confirmar', 'CONFIRMADO');
  results.push({ etapa: 'Transicoes do pedido', ok: true, detalhe: pedido.status });

  await expectHttpError('/pedidos-compra/gerar-da-cotacao', 409, {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      cotacao_id: cotacao.id,
      titulo: `${marker} - duplicidade bloqueada`
    })
  });
  results.push({ etapa: 'Duplicidade bloqueada', ok: true, detalhe: 'HTTP 409' });

  console.info(`Smoke V3.4C concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem DELETE, NF ou financeiro.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
