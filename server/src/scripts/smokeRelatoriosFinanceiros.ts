import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface Snapshot {
  contas: number;
  programacoes: number;
  baixas: number;
  saldo_aberto: string;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5H';

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

const getSnapshot = async (): Promise<Snapshot> => {
  const result = await query<Snapshot>(
    `
    select
      (select count(*)::int from contas_pagar) as contas,
      (select count(*)::int from programacoes_pagamento) as programacoes,
      (select count(*)::int from contas_pagar_baixas) as baixas,
      (select coalesce(sum(valor_aberto), 0)::numeric(14,2) from contas_pagar) as saldo_aberto
    `
  );
  return result.rows[0];
};

const assertSnapshotEqual = (before: Snapshot, after: Snapshot): void => {
  if (
    before.contas !== after.contas
    || before.programacoes !== after.programacoes
    || before.baixas !== after.baixas
    || before.saldo_aberto !== after.saldo_aberto
  ) {
    throw new Error(`Relatorios alteraram dados. Antes=${JSON.stringify(before)} Depois=${JSON.stringify(after)}`);
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

  const before = await getSnapshot();

  const resumo = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/resumo')).data;
  if (!resumo.totais || !Array.isArray(resumo.por_status) || !Array.isArray(resumo.por_vencimento)) {
    throw new Error('Resumo de contas a pagar retornou contrato invalido.');
  }
  results.push({ etapa: 'Resumo de contas a pagar', ok: true, detalhe: `${(resumo.por_status as unknown[]).length} status` });

  const aging = (await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/aging')).data;
  if (!Array.isArray(aging)) {
    throw new Error('Aging nao retornou lista.');
  }
  results.push({ etapa: 'Aging financeiro', ok: true, detalhe: `${aging.length} faixa(s)` });

  const porFornecedor = (await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/por-fornecedor')).data;
  if (!Array.isArray(porFornecedor)) {
    throw new Error('Relatorio por fornecedor nao retornou lista.');
  }
  results.push({ etapa: 'Contas por fornecedor', ok: true, detalhe: `${porFornecedor.length} grupo(s)` });

  const porObra = (await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/por-obra')).data;
  if (!Array.isArray(porObra)) {
    throw new Error('Relatorio por obra nao retornou lista.');
  }
  results.push({ etapa: 'Contas por obra', ok: true, detalhe: `${porObra.length} grupo(s)` });

  const porCentro = (await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/por-centro-custo')).data;
  if (!Array.isArray(porCentro)) {
    throw new Error('Relatorio por centro de custo nao retornou lista.');
  }
  results.push({ etapa: 'Contas por centro de custo', ok: true, detalhe: `${porCentro.length} grupo(s)` });

  const programacoes = (await requestJson<ApiItemResponse<Record<string, unknown>>>('/relatorios-financeiros/programacoes/resumo')).data;
  if (!programacoes.totais || !Array.isArray(programacoes.por_status) || !Array.isArray(programacoes.programacoes)) {
    throw new Error('Resumo de programacoes retornou contrato invalido.');
  }
  results.push({ etapa: 'Resumo de programacoes', ok: true, detalhe: `${(programacoes.programacoes as unknown[]).length} programacao(oes)` });

  const fluxo = (await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/fluxo-previsto')).data;
  if (!Array.isArray(fluxo)) {
    throw new Error('Fluxo previsto nao retornou lista.');
  }
  results.push({ etapa: 'Fluxo previsto', ok: true, detalhe: `${fluxo.length} data(s)` });

  await requestJson<ApiItemResponse<Record<string, unknown>>>('/relatorios-financeiros/contas-pagar/resumo?status=APROVADA&valor_min=1');
  await requestJson<ApiListResponse<Record<string, unknown>>>('/relatorios-financeiros/fluxo-previsto?periodo_de=2026-01-01&periodo_ate=2026-12-31');
  results.push({ etapa: 'Filtros parametrizados', ok: true, detalhe: 'status, valor e periodo' });

  const after = await getSnapshot();
  assertSnapshotEqual(before, after);
  results.push({ etapa: 'Relatorios nao alteram dados', ok: true, detalhe: JSON.stringify(after) });

  for (const route of [
    '/relatorios-financeiros/pagar',
    '/relatorios-financeiros/baixar',
    '/relatorios-financeiros/executar-pagamento',
    '/relatorios-financeiros/gerar-cnab',
    '/relatorios-financeiros/integracao-bancaria'
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 405 && status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404 ou 405.`);
    }
  }
  const deleteStatus = await requestStatus('/relatorios-financeiros/contas-pagar/resumo', { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /relatorios-financeiros/contas-pagar/resumo retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem operacoes financeiras ou DELETE', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.5H relatorios financeiros concluido contra ${apiBaseUrl}. Marcador: ${marker}. Somente leitura, sem pagamento, baixa nova, CNAB, banco real ou DELETE fisico.`);
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
