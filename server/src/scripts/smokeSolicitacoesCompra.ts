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
  codigo: string;
  nome: string;
}

interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
}

interface Usuario {
  id: string;
  nome: string;
}

interface SolicitacaoCompra {
  id: string;
  codigo: string;
  status: string;
  titulo: string;
  itens?: unknown[];
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_4A';

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

const transition = async (solicitacao: SolicitacaoCompra, action: string, expectedStatus: string): Promise<SolicitacaoCompra> => {
  const response = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}/${action}`, {
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

  const listBefore = await requestJson<ApiListResponse<SolicitacaoCompra>>('/solicitacoes-compra');
  results.push({ etapa: 'GET /solicitacoes-compra', ok: true, detalhe: `${listBefore.data.length} registro(s) antes do teste` });

  const created = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: usuario.id,
      titulo: `${marker} - compra local smoke`,
      descricao: `${marker} - validacao local de solicitacao de compra MVP`,
      prioridade: 'NORMAL',
      data_necessidade: new Date().toISOString().slice(0, 10),
      observacoes: `${marker} - criado por smoke test local`,
      itens: [
        {
          descricao: `${marker} - item material`,
          unidade: 'un',
          quantidade: 2,
          valor_estimado_unitario: 10,
          observacoes: `${marker} - sem compra real`
        },
        {
          descricao: `${marker} - item servico`,
          unidade: 'h',
          quantidade: 1,
          valor_estimado_unitario: 25,
          observacoes: `${marker} - sem cotacao real`
        }
      ]
    })
  });

  if (created.data.status !== 'RASCUNHO') {
    throw new Error(`POST /solicitacoes-compra retornou status ${created.data.status}, esperado RASCUNHO.`);
  }
  results.push({ etapa: 'POST /solicitacoes-compra', ok: true, detalhe: created.data.codigo });

  const detail = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${created.data.id}`);
  if (!Array.isArray(detail.data.itens) || detail.data.itens.length !== 2) {
    throw new Error('GET /solicitacoes-compra/:id nao retornou os 2 itens criados.');
  }
  results.push({ etapa: 'GET /solicitacoes-compra/:id', ok: true, detalhe: `${detail.data.itens.length} itens` });

  let current = await transition(created.data, 'enviar', 'ENVIADA');
  results.push({ etapa: 'PATCH /:id/enviar', ok: true, detalhe: current.status });

  current = await transition(current, 'em-analise', 'EM_ANALISE');
  results.push({ etapa: 'PATCH /:id/em-analise', ok: true, detalhe: current.status });

  current = await transition(current, 'devolver', 'DEVOLVIDA');
  results.push({ etapa: 'PATCH /:id/devolver', ok: true, detalhe: current.status });

  current = await transition(current, 'reabrir-rascunho', 'RASCUNHO');
  results.push({ etapa: 'PATCH /:id/reabrir-rascunho', ok: true, detalhe: current.status });

  current = await transition(current, 'cancelar', 'CANCELADA');
  results.push({ etapa: 'PATCH /:id/cancelar', ok: true, detalhe: current.status });

  const listAfter = await requestJson<ApiListResponse<SolicitacaoCompra>>('/solicitacoes-compra');
  results.push({ etapa: 'GET /solicitacoes-compra final', ok: true, detalhe: `${listAfter.data.length} registro(s) depois do teste` });

  console.info(`Smoke V3.4A concluido contra ${apiBaseUrl}. Marcador: ${marker}.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
