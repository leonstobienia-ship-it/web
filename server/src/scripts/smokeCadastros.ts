interface SmokeResult {
  endpoint: string;
  ok: boolean;
  statusCode: number;
  count?: number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');

const endpoints = [
  '/health',
  '/health/db',
  '/clientes',
  '/fornecedores',
  '/obras',
  '/centros-custo'
];

const requestJson = async (endpoint: string): Promise<SmokeResult> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`);
  const body = await response.json() as { data?: unknown[]; database?: { connected?: boolean }; status?: string };

  if (!response.ok) {
    throw new Error(`${endpoint} retornou HTTP ${response.status}.`);
  }

  if (endpoint === '/health' && body.status !== 'ok') {
    throw new Error('/health nao retornou status ok.');
  }

  if (endpoint === '/health/db' && body.database?.connected !== true) {
    throw new Error('/health/db nao confirmou conexao PostgreSQL.');
  }

  if (endpoint !== '/health' && endpoint !== '/health/db' && !Array.isArray(body.data)) {
    throw new Error(`${endpoint} nao retornou data como array.`);
  }

  return {
    endpoint,
    ok: true,
    statusCode: response.status,
    count: Array.isArray(body.data) ? body.data.length : undefined
  };
};

const run = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  for (const endpoint of endpoints) {
    results.push(await requestJson(endpoint));
  }

  console.info(`Smoke V3.3C concluido contra ${apiBaseUrl}.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
