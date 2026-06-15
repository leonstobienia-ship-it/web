interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface NotaEntrada {
  id: string;
  numero: string;
  status: string;
  observacoes?: string | null;
  valor_total: string | number;
}

interface ContaPagar {
  id: string;
  numero_documento: string;
  status: string;
  valor_original: string | number;
  valor_aberto: string | number;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5A';

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

const transitionConta = async (
  conta: ContaPagar,
  action: string,
  expectedStatus: string
): Promise<ContaPagar> => {
  const response = await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${conta.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const findApprovedNota = async (): Promise<NotaEntrada> => {
  const notas = (await requestJson<ApiListResponse<NotaEntrada>>('/notas-entrada?status=APROVADA_FINANCEIRO')).data;
  const nota = notas.find((item) => {
    const searchable = `${item.numero} ${item.observacoes || ''}`;
    return searchable.includes(marker);
  });
  if (!nota) {
    throw new Error(`Nenhuma nota APROVADA_FINANCEIRO com marcador ${marker}. Rode npm.cmd run smoke:notas antes.`);
  }
  return nota;
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

  const nota = await findApprovedNota();
  results.push({ etapa: 'Nota aprovada localizada', ok: true, detalhe: nota.numero });

  let conta = (await requestJson<ApiItemResponse<ContaPagar>>('/contas-pagar/gerar-da-nota', {
    method: 'POST',
    body: JSON.stringify({
      nota_entrada_id: nota.id,
      data_vencimento: addDays(7),
      forma_pagamento_prevista: `${marker} - forma local`,
      observacoes: `${marker} - conta local sem programacao bancaria, pagamento ou baixa`
    })
  })).data;
  if (conta.status !== 'ABERTA') {
    throw new Error(`Conta criada em status ${conta.status}, esperado ABERTA.`);
  }
  if (Number(conta.valor_original) <= 0 || Number(conta.valor_aberto) !== Number(conta.valor_original)) {
    throw new Error('Conta criada nao iniciou com valor aberto igual ao original.');
  }
  results.push({ etapa: 'POST /contas-pagar/gerar-da-nota', ok: true, detalhe: conta.numero_documento });

  const listContas = await requestJson<ApiListResponse<ContaPagar>>('/contas-pagar');
  if (!listContas.data.some((item) => item.id === conta.id)) {
    throw new Error('GET /contas-pagar nao retornou a conta criada.');
  }
  const detalheConta = await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${conta.id}`);
  results.push({ etapa: 'GET /contas-pagar e /:id', ok: true, detalhe: detalheConta.data.numero_documento });

  conta = await transitionConta(conta, 'enviar-programacao', 'AGUARDANDO_PROGRAMACAO');
  results.push({ etapa: 'Enviar para programacao', ok: true, detalhe: conta.status });

  await expectHttpError('/contas-pagar/gerar-da-nota', 409, {
    method: 'POST',
    body: JSON.stringify({
      nota_entrada_id: nota.id,
      data_vencimento: addDays(10),
      observacoes: `${marker} - duplicidade bloqueada`
    })
  });
  results.push({ etapa: 'Duplicidade bloqueada', ok: true, detalhe: 'HTTP 409' });

  conta = await transitionConta(conta, 'cancelar', 'CANCELADA');
  results.push({ etapa: 'Cancelamento permitido', ok: true, detalhe: conta.status });

  console.info(`Smoke V3.5A contas a pagar concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem DELETE, pagamento, baixa ou conciliacao.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
