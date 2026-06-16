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
  nota_entrada_id: string;
  numero_documento: string;
  status: string;
  valor_original: string | number;
  valor_aberto: string | number;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
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

const findApprovedNota = async (): Promise<NotaEntrada> => {
  const notas = (await requestJson<ApiListResponse<NotaEntrada>>('/notas-fiscais-entrada?status=APROVADA')).data;
  const nota = notas.find((item) => {
    const searchable = `${item.numero} ${item.observacoes || ''}`;
    return searchable.includes(marker);
  });
  if (!nota) {
    throw new Error(`Nenhuma nota APROVADA com marcador ${marker}. Rode npm.cmd run smoke:notas para criar novo cenario ou aprove uma nota local.`);
  }
  return nota;
};

const findProvisionedConta = async (): Promise<ContaPagar | undefined> => {
  const contas = (await requestJson<ApiListResponse<ContaPagar>>('/contas-pagar?status=PROVISIONADA')).data;
  return contas.find((item) => {
    const searchable = `${item.numero_documento} ${item.forma_pagamento_prevista || ''} ${item.observacoes || ''}`;
    return searchable.includes(marker);
  });
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

  let conta = await findProvisionedConta();
  if (!conta) {
    const nota = await findApprovedNota();
    results.push({ etapa: 'Nota aprovada localizada', ok: true, detalhe: nota.numero });
    conta = (await requestJson<ApiItemResponse<ContaPagar>>('/contas-pagar/provisionar-da-nota', {
      method: 'POST',
      body: JSON.stringify({
        nota_entrada_id: nota.id,
        data_vencimento: addDays(7),
        forma_pagamento_prevista: `${marker} - forma local`,
        observacoes: `${marker} - conta local sem programacao bancaria, pagamento ou baixa`
      })
    })).data;
  }
  if (!conta) {
    throw new Error('Nenhuma conta provisionada ou nota aprovada encontrada para o smoke.');
  }
  const contaFinal = conta;
  if (contaFinal.status !== 'PROVISIONADA') {
    throw new Error(`Conta criada em status ${contaFinal.status}, esperado PROVISIONADA.`);
  }
  if (Number(contaFinal.valor_original) <= 0 || Number(contaFinal.valor_aberto) !== Number(contaFinal.valor_original)) {
    throw new Error('Conta criada nao iniciou com valor aberto igual ao original.');
  }
  results.push({ etapa: 'Conta provisionada localizada/criada', ok: true, detalhe: contaFinal.numero_documento });

  const listContas = await requestJson<ApiListResponse<ContaPagar>>('/contas-pagar');
  if (!listContas.data.some((item) => item.id === contaFinal.id)) {
    throw new Error('GET /contas-pagar nao retornou a conta criada.');
  }
  const detalheConta = await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaFinal.id}`);
  results.push({ etapa: 'GET /contas-pagar e /:id', ok: true, detalhe: detalheConta.data.numero_documento });

  await expectHttpError('/contas-pagar/provisionar-da-nota', 409, {
    method: 'POST',
    body: JSON.stringify({
      nota_entrada_id: contaFinal.nota_entrada_id,
      data_vencimento: addDays(10),
      observacoes: `${marker} - duplicidade bloqueada`
    })
  });
  results.push({ etapa: 'Duplicidade bloqueada', ok: true, detalhe: 'HTTP 409' });

  console.info(`Smoke V3.5A contas a pagar concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem DELETE, programacao, pagamento, baixa ou conciliacao.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
