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
}

interface MapaComparativo {
  resumo: {
    fornecedor_menor_total?: CotacaoFornecedor | null;
  };
}

interface PedidoCompra {
  id: string;
  codigo: string;
  status: string;
  valor_total: string | number;
  itens?: Array<{ id: string }>;
}

interface NotaEntrada {
  id: string;
  numero: string;
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
const marker = 'DEV_LOCAL_V3_5A';

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

const transitionNota = async (
  nota: NotaEntrada,
  action: string,
  expectedStatus: string
): Promise<NotaEntrada> => {
  const response = await requestJson<ApiItemResponse<NotaEntrada>>(`/notas-entrada/${nota.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const createConfirmedPedido = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  usuario: Usuario,
  fornecedores: Fornecedor[],
  results: SmokeResult[]
): Promise<PedidoCompra> => {
  const createdSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: usuario.id,
      titulo: `${marker} - solicitacao para nota`,
      descricao: `${marker} - base local para nota de entrada`,
      prioridade: 'NORMAL',
      data_necessidade: today(),
      observacoes: `${marker} - sem dados reais`,
      itens: [
        {
          descricao: `${marker} - material fiscal`,
          unidade: 'un',
          quantidade: 2,
          valor_estimado_unitario: 10,
          observacoes: `${marker} - item local`
        },
        {
          descricao: `${marker} - servico fiscal`,
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
    throw new Error('Solicitacao de smoke nao retornou itens para cotacao.');
  }

  let cotacao = (await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      solicitacao_id: solicitacao.id,
      titulo: `${marker} - cotacao para nota`,
      prazo_resposta: addDays(3),
      observacoes: `${marker} - cotacao local para nota`,
      fornecedores: fornecedores.slice(0, 2).map((fornecedor) => ({ fornecedor_id: fornecedor.id }))
    })
  })).data;

  cotacao = await transitionCotacao(cotacao, 'enviar-fornecedores', 'ENVIADA_FORNECEDORES');
  cotacao = await transitionCotacao(cotacao, 'registrar-respostas', 'RESPOSTAS_RECEBIDAS', {
    fornecedores: fornecedores.slice(0, 2).map((fornecedor, fornecedorIndex) => ({
      fornecedor_id: fornecedor.id,
      prazo_entrega_dias: fornecedorIndex === 0 ? 7 : 5,
      condicao_pagamento: `${marker} - pagamento local ${fornecedorIndex + 1}`,
      observacoes: `${marker} - resposta local`,
      itens: (detalheSolicitacao.data.itens || []).map((item, itemIndex) => ({
        solicitacao_item_id: item.id,
        valor_unitario: fornecedorIndex === 0 ? (itemIndex === 0 ? 12 : 21) : (itemIndex === 0 ? 9 : 18),
        marca_modelo: `${marker} - marca local`,
        prazo_entrega_dias: fornecedorIndex === 0 ? 7 : 5,
        observacoes: `${marker} - item cotado localmente`
      }))
    }))
  });
  cotacao = await transitionCotacao(cotacao, 'gerar-mapa', 'MAPA_GERADO', {
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - mapa para nota`
  });
  const mapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  const fornecedorVencedor = mapa.data.resumo.fornecedor_menor_total;
  if (!fornecedorVencedor) {
    throw new Error('Mapa nao retornou fornecedor vencedor candidato.');
  }
  cotacao = await transitionCotacao(cotacao, 'escolher-fornecedor', 'FORNECEDOR_ESCOLHIDO', {
    fornecedor_id: fornecedorVencedor.fornecedor_id,
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - vencedor para nota`
  });
  results.push({ etapa: 'Cotacao com vencedor', ok: true, detalhe: cotacao.codigo });

  let pedido = (await requestJson<ApiItemResponse<PedidoCompra>>('/pedidos-compra/gerar-da-cotacao', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      cotacao_id: cotacao.id,
      titulo: `${marker} - pedido para nota`,
      observacoes: `${marker} - pedido local sem pagamento`
    })
  })).data;
  pedido = await transitionPedido(pedido, 'emitir', 'EMITIDO');
  pedido = await transitionPedido(pedido, 'enviar-fornecedor', 'ENVIADO_FORNECEDOR');
  pedido = await transitionPedido(pedido, 'confirmar', 'CONFIRMADO');
  results.push({ etapa: 'Pedido confirmado', ok: true, detalhe: pedido.codigo });
  return pedido;
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
    throw new Error('Smoke V3.5A exige ao menos 2 fornecedores locais.');
  }

  const pedido = await createConfirmedPedido(empresa, obra, centroCusto, usuario, fornecedores, results);
  const pedidoDetalhado = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}`);
  if (!Array.isArray(pedidoDetalhado.data.itens) || pedidoDetalhado.data.itens.length !== 2) {
    throw new Error('Pedido confirmado nao retornou itens para nota.');
  }

  const valorTotal = Number(pedidoDetalhado.data.valor_total);
  let nota = (await requestJson<ApiItemResponse<NotaEntrada>>('/notas-entrada', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      pedido_id: pedido.id,
      numero: `NF-${Date.now()}`,
      serie: 'V35A',
      tipo_documento: 'NOTA_FISCAL',
      data_emissao: today(),
      data_entrada: today(),
      valor_produtos: valorTotal,
      valor_servicos: 0,
      valor_frete: 0,
      valor_desconto: 0,
      valor_impostos: 0,
      valor_total: valorTotal,
      observacoes: `${marker} - nota local sem XML, SEFAZ ou pagamento`
    })
  })).data;
  if (nota.status !== 'RASCUNHO' || !Array.isArray(nota.itens) || nota.itens.length !== 2) {
    throw new Error('Nota criada nao retornou RASCUNHO com itens herdados.');
  }
  results.push({ etapa: 'POST /notas-entrada', ok: true, detalhe: nota.numero });

  const listNotas = await requestJson<ApiListResponse<NotaEntrada>>('/notas-entrada');
  if (!listNotas.data.some((item) => item.id === nota.id)) {
    throw new Error('GET /notas-entrada nao retornou a nota criada.');
  }
  const detalheNota = await requestJson<ApiItemResponse<NotaEntrada>>(`/notas-entrada/${nota.id}`);
  if (Number(detalheNota.data.valor_total) !== valorTotal) {
    throw new Error('GET /notas-entrada/:id nao retornou valor total esperado.');
  }
  results.push({ etapa: 'GET /notas-entrada e /:id', ok: true, detalhe: detalheNota.data.numero });

  nota = await transitionNota(nota, 'lancar', 'LANCADA');
  nota = await transitionNota(nota, 'conferir', 'CONFERIDA');
  nota = await transitionNota(nota, 'aprovar-financeiro', 'APROVADA_FINANCEIRO');
  results.push({ etapa: 'Transicoes da nota', ok: true, detalhe: nota.status });

  console.info(`Smoke V3.5A notas concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem DELETE, fiscal real, banco ou pagamento.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
