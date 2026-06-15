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
  nome: string;
}

interface SolicitacaoItem {
  id: string;
  descricao: string;
}

interface SolicitacaoCompra {
  id: string;
  codigo: string;
  status: string;
  itens?: SolicitacaoItem[];
}

interface CotacaoFornecedor {
  id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  status: string;
  valor_total: string | number;
}

interface Cotacao {
  id: string;
  codigo: string;
  status: string;
  fornecedores?: CotacaoFornecedor[];
}

interface MapaComparativo {
  resumo: {
    total_fornecedores: number;
    total_respostas: number;
    fornecedor_menor_total?: CotacaoFornecedor | null;
    fornecedor_vencedor?: CotacaoFornecedor | null;
  };
  fornecedores: CotacaoFornecedor[];
  itens: Array<{ comparativos: Array<{ melhor_valor: boolean }> }>;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_4B';

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
    throw new Error('Smoke V3.4B exige ao menos 2 fornecedores locais.');
  }

  const createdSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: usuario.id,
      titulo: `${marker} - solicitacao para cotacao formal`,
      descricao: `${marker} - base para mapa comparativo local`,
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
    throw new Error('Solicitacao de smoke nao retornou os 2 itens para cotacao.');
  }
  results.push({ etapa: 'Solicitação em análise', ok: true, detalhe: detalheSolicitacao.data.status });

  let cotacao = (await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      solicitacao_id: solicitacao.id,
      titulo: `${marker} - cotacao formal smoke`,
      prazo_resposta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      observacoes: `${marker} - cotacao local sem pedido de compra`,
      fornecedores: fornecedores.slice(0, 2).map((fornecedor) => ({ fornecedor_id: fornecedor.id }))
    })
  })).data;
  if (cotacao.status !== 'RASCUNHO' || (cotacao.fornecedores || []).length !== 2) {
    throw new Error('Cotacao formal nao nasceu em RASCUNHO com 2 fornecedores.');
  }
  results.push({ etapa: 'POST /cotacoes', ok: true, detalhe: cotacao.codigo });

  cotacao = await transitionCotacao(cotacao, 'enviar-fornecedores', 'ENVIADA_FORNECEDORES');
  results.push({ etapa: 'PATCH enviar-fornecedores', ok: true, detalhe: cotacao.status });

  const responsePayload = {
    fornecedores: fornecedores.slice(0, 2).map((fornecedor, fornecedorIndex) => ({
      fornecedor_id: fornecedor.id,
      prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 3,
      condicao_pagamento: `${marker} - pagamento fornecedor ${fornecedorIndex + 1}`,
      observacoes: `${marker} - resposta local`,
      itens: (detalheSolicitacao.data.itens || []).map((item, itemIndex) => ({
        solicitacao_item_id: item.id,
        valor_unitario: fornecedorIndex === 0 ? (itemIndex === 0 ? 11 : 19) : (itemIndex === 0 ? 9 : 18),
        marca_modelo: `${marker} - marca local`,
        prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 3,
        observacoes: `${marker} - item cotado localmente`
      }))
    }))
  };

  cotacao = await transitionCotacao(cotacao, 'registrar-respostas', 'RESPOSTAS_RECEBIDAS', responsePayload);
  results.push({ etapa: 'PATCH registrar-respostas', ok: true, detalhe: cotacao.status });

  const mapaRecebido = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  if (mapaRecebido.data.resumo.total_fornecedores !== 2 || mapaRecebido.data.resumo.total_respostas !== 2) {
    throw new Error('Mapa antes da geracao nao retornou 2 fornecedores com respostas.');
  }
  results.push({ etapa: 'GET /cotacoes/mapa-comparativo', ok: true, detalhe: '2 respostas comparadas' });

  cotacao = await transitionCotacao(cotacao, 'gerar-mapa', 'MAPA_GERADO', {
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - mapa gerado por menor valor`
  });
  results.push({ etapa: 'PATCH gerar-mapa', ok: true, detalhe: cotacao.status });

  const mapaGerado = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  const fornecedorVencedor = mapaGerado.data.resumo.fornecedor_menor_total;
  if (!fornecedorVencedor) {
    throw new Error('Mapa gerado nao retornou fornecedor_menor_total.');
  }

  cotacao = await transitionCotacao(cotacao, 'escolher-fornecedor', 'FORNECEDOR_ESCOLHIDO', {
    fornecedor_id: fornecedorVencedor.fornecedor_id,
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - menor total escolhido no smoke`
  });
  results.push({ etapa: 'PATCH escolher-fornecedor', ok: true, detalhe: cotacao.status });

  const detalheCotacao = await requestJson<ApiItemResponse<Cotacao>>(`/cotacoes/${cotacao.id}`);
  if (detalheCotacao.data.status !== 'FORNECEDOR_ESCOLHIDO') {
    throw new Error('GET /cotacoes/:id nao refletiu fornecedor escolhido.');
  }

  const listaCotacoes = await requestJson<ApiListResponse<Cotacao>>(`/cotacoes?solicitacao_id=${solicitacao.id}`);
  if (!listaCotacoes.data.some((item) => item.id === cotacao.id)) {
    throw new Error('GET /cotacoes nao retornou a cotacao criada no smoke.');
  }
  results.push({ etapa: 'GET /cotacoes e /cotacoes/:id', ok: true, detalhe: cotacao.codigo });

  const mapaFinal = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  if (mapaFinal.data.resumo.fornecedor_vencedor?.fornecedor_id !== fornecedorVencedor.fornecedor_id) {
    throw new Error('Mapa final nao refletiu fornecedor vencedor.');
  }
  if (!mapaFinal.data.itens.every((item) => item.comparativos.some((comparativo) => comparativo.melhor_valor))) {
    throw new Error('Mapa comparativo nao marcou menor valor por item.');
  }
  results.push({ etapa: 'Mapa final', ok: true, detalhe: 'fornecedor vencedor refletido' });

  console.info(`Smoke V3.4B concluido contra ${apiBaseUrl}. Marcador: ${marker}.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
