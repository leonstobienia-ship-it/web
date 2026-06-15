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

interface Cotacao {
  id: string;
  codigo: string;
  fornecedor_id: string;
  status: string;
  valor_total: string | number;
}

interface MapaComparativo {
  resumo: {
    total_cotacoes: number;
    total_cotacoes_comparaveis: number;
    cotacao_menor_total?: Cotacao | null;
    cotacao_selecionada?: Cotacao | null;
  };
  cotacoes: Cotacao[];
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

const buildCotacaoPayload = (
  empresa: Empresa,
  solicitacao: SolicitacaoCompra,
  fornecedor: Fornecedor,
  firstPrice: number,
  secondPrice: number
) => ({
  company_id: empresa.id,
  solicitacao_compra_id: solicitacao.id,
  fornecedor_id: fornecedor.id,
  data_recebimento: new Date().toISOString().slice(0, 10),
  validade_proposta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  prazo_entrega_dias: firstPrice < secondPrice ? 3 : 5,
  condicao_pagamento: `${marker} - pagamento local`,
  frete: `${marker} - frete local`,
  observacoes: `${marker} - cotacao local sem compra real`,
  itens: (solicitacao.itens || []).map((item, index) => ({
    solicitacao_item_id: item.id,
    valor_unitario: index === 0 ? firstPrice : secondPrice,
    observacoes: `${marker} - item cotado localmente`
  }))
});

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
      titulo: `${marker} - solicitacao para cotacao`,
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

  const primeiraCotacao = await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify(buildCotacaoPayload(empresa, detalheSolicitacao.data, fornecedores[0], 11, 19))
  });
  results.push({ etapa: 'POST /cotacoes fornecedor 1', ok: true, detalhe: primeiraCotacao.data.codigo });

  const segundaCotacao = await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify(buildCotacaoPayload(empresa, detalheSolicitacao.data, fornecedores[1], 9, 18))
  });
  results.push({ etapa: 'POST /cotacoes fornecedor 2', ok: true, detalhe: segundaCotacao.data.codigo });

  const mapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?solicitacao_compra_id=${solicitacao.id}`);
  if (mapa.data.resumo.total_cotacoes !== 2 || mapa.data.resumo.total_cotacoes_comparaveis !== 2) {
    throw new Error('Mapa comparativo nao retornou as 2 cotacoes comparaveis.');
  }
  if (!mapa.data.itens.every((item) => item.comparativos.some((comparativo) => comparativo.melhor_valor))) {
    throw new Error('Mapa comparativo nao marcou melhor valor por item.');
  }
  results.push({ etapa: 'GET /cotacoes/mapa-comparativo', ok: true, detalhe: '2 cotacoes comparadas' });

  const menorCotacao = mapa.data.resumo.cotacao_menor_total;
  if (!menorCotacao) {
    throw new Error('Mapa comparativo nao retornou cotacao_menor_total.');
  }

  const selecionada = await requestJson<ApiItemResponse<Cotacao>>(`/cotacoes/${menorCotacao.id}/selecionar`, {
    method: 'PATCH',
    body: JSON.stringify({ justificativa: `${marker} - menor total selecionado no smoke` })
  });
  if (selecionada.data.status !== 'SELECIONADA') {
    throw new Error(`Cotacao selecionada retornou ${selecionada.data.status}, esperado SELECIONADA.`);
  }
  results.push({ etapa: 'PATCH /cotacoes/:id/selecionar', ok: true, detalhe: selecionada.data.codigo });

  const finalMapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?solicitacao_compra_id=${solicitacao.id}`);
  if (finalMapa.data.resumo.cotacao_selecionada?.id !== selecionada.data.id) {
    throw new Error('Mapa final nao refletiu cotacao selecionada.');
  }
  results.push({ etapa: 'Mapa final', ok: true, detalhe: 'cotacao selecionada refletida' });

  console.info(`Smoke V3.4B concluido contra ${apiBaseUrl}. Marcador: ${marker}.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
