import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

interface SeedContext {
  companyId: string;
  usuarioId: string;
  perfilId: string;
  obraId?: string;
  clienteId?: string;
}

interface CentralTarefaApi {
  id: string;
  manual_id?: string | null;
  titulo: string;
  modulo: string;
  origem: string;
  tipo?: string;
  status: string;
  prioridade: string;
  historico?: unknown[];
}

interface CentralResumoApi {
  total: number;
  abertas: number;
  aprovacoes_pendentes: number;
  atrasadas: number;
  criticas: number;
  modulos_com_tarefas: number;
}

interface Snapshot {
  baixas: number;
  programacoes: number;
  contas: number;
  tarefas: number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_12';

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

const getSnapshot = async (): Promise<Snapshot> => {
  const result = await query<Snapshot>(
    `
    select
      (select count(*)::int from contas_pagar_baixas) as baixas,
      (select count(*)::int from programacoes_pagamento) as programacoes,
      (select count(*)::int from contas_pagar) as contas,
      (select count(*)::int from central_tarefas_manuais) as tarefas
    `
  );
  return result.rows[0];
};

const createSeed = async (): Promise<SeedContext> => {
  const empresa = await query<{ id: string }>(
    `select id from empresas where cnpj = '00.000.000/0001-33' limit 1`
  );
  const companyId = empresa.rows[0]?.id;
  if (!companyId) {
    throw new Error('Empresa DEV local nao encontrada.');
  }

  const usuario = await query<{ id: string }>(
    `
    select id
    from usuarios
    where company_id = $1 and status = 'ativo' and ativo = true
    order by email asc
    limit 1
    `,
    [companyId]
  );
  const usuarioId = usuario.rows[0]?.id;
  if (!usuarioId) {
    throw new Error('Usuario DEV local nao encontrado.');
  }

  const perfil = await query<{ id: string }>(
    `
    select p.id
    from perfis p
    where p.company_id = $1 and p.status = 'ativo' and p.nome in ('ADMIN', 'DIRETORIA', 'FINANCEIRO', 'PLANEJAMENTO')
    order by case p.nome when 'ADMIN' then 0 when 'DIRETORIA' then 1 else 2 end, p.nome
    limit 1
    `,
    [companyId]
  );
  const perfilId = perfil.rows[0]?.id;
  if (!perfilId) {
    throw new Error('Perfil DEV local para central nao encontrado.');
  }

  const obra = await query<{ id: string; cliente_id: string | null }>(
    `
    select id, cliente_id
    from obras
    where company_id = $1 and status <> 'inativo'
    order by created_at desc
    limit 1
    `,
    [companyId]
  );

  return {
    companyId,
    usuarioId,
    perfilId,
    obraId: obra.rows[0]?.id,
    clienteId: obra.rows[0]?.cliente_id || undefined
  };
};

const assertStatus = (tarefa: CentralTarefaApi, expected: string, label: string): void => {
  if (tarefa.status !== expected) {
    throw new Error(`${label}: esperado ${expected}, obtido ${tarefa.status}.`);
  }
};

const assertListEndpoint = async (endpoint: string): Promise<number> => {
  const data = (await requestJson<ApiListResponse<CentralTarefaApi | Record<string, unknown>>>(endpoint)).data;
  if (!Array.isArray(data)) {
    throw new Error(`${endpoint} nao retornou lista.`);
  }
  return data.length;
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

  const snapshotAntes = await getSnapshot();
  const ctx = await createSeed();
  results.push({ etapa: 'Contexto local', ok: true, detalhe: `${ctx.usuarioId}/${ctx.perfilId}` });

  const criada = (await requestJson<ApiItemResponse<CentralTarefaApi>>('/central-tarefas/manuais', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      titulo: `${marker} - Tarefa manual`,
      descricao: `${marker} - tarefa auxiliar sem operacao financeira ou fiscal`,
      modulo: 'central-tarefas',
      prioridade: 'CRITICA',
      responsavel_id: ctx.usuarioId,
      perfil_id: ctx.perfilId,
      prazo: addDays(2),
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      usuario_id: ctx.usuarioId,
      comentario: `${marker} - criada via smoke`
    })
  })).data;
  assertStatus(criada, 'ABERTA', 'Criacao manual');
  results.push({ etapa: 'Criar tarefa manual', ok: true, detalhe: criada.id });

  const detalhe = (await requestJson<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${criada.id}`)).data;
  if (!Array.isArray(detalhe.historico) || detalhe.historico.length === 0) {
    throw new Error('Detalhe da tarefa manual nao retornou historico.');
  }
  results.push({ etapa: 'Detalhar tarefa manual', ok: true, detalhe: `${detalhe.historico.length} evento(s)` });

  const vista = (await requestJson<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${criada.id}/marcar-vista`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - vista` })
  })).data;
  assertStatus(vista, 'ABERTA', 'Marcar vista');
  results.push({ etapa: 'Marcar vista', ok: true, detalhe: vista.status });

  const iniciada = (await requestJson<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${criada.id}/iniciar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - iniciar` })
  })).data;
  assertStatus(iniciada, 'EM_ANDAMENTO', 'Iniciar');
  results.push({ etapa: 'Iniciar tarefa', ok: true, detalhe: iniciada.status });

  const concluida = (await requestJson<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${criada.id}/concluir`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - concluir` })
  })).data;
  assertStatus(concluida, 'CONCLUIDA', 'Concluir');
  results.push({ etapa: 'Concluir tarefa', ok: true, detalhe: concluida.status });

  const cancelar = (await requestJson<ApiItemResponse<CentralTarefaApi>>('/central-tarefas/manuais', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      titulo: `${marker} - Tarefa para cancelar`,
      descricao: `${marker} - cancelamento logico`,
      prioridade: 'MEDIA',
      perfil_id: ctx.perfilId,
      usuario_id: ctx.usuarioId
    })
  })).data;
  const cancelada = (await requestJson<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${cancelar.id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, motivo: `${marker} - cancelamento logico` })
  })).data;
  assertStatus(cancelada, 'CANCELADA', 'Cancelar');
  results.push({ etapa: 'Cancelar logicamente', ok: true, detalhe: cancelada.status });

  const resumo = (await requestJson<ApiItemResponse<CentralResumoApi>>('/central-tarefas/resumo')).data;
  if (typeof resumo.total !== 'number' || typeof resumo.aprovacoes_pendentes !== 'number') {
    throw new Error('Resumo da central retornou totais invalidos.');
  }
  results.push({ etapa: 'Resumo', ok: true, detalhe: `${resumo.total} tarefa(s)` });

  const endpointCounts = await Promise.all([
    assertListEndpoint(`/central-tarefas/minhas?usuario_id=${ctx.usuarioId}`),
    assertListEndpoint('/central-tarefas/aprovacoes'),
    assertListEndpoint('/central-tarefas/por-modulo'),
    assertListEndpoint('/central-tarefas/atrasadas'),
    assertListEndpoint('/central-tarefas/criticas')
  ]);
  results.push({ etapa: 'Endpoints de consulta', ok: true, detalhe: endpointCounts.join(', ') });

  const aprovacoes = (await requestJson<ApiListResponse<CentralTarefaApi>>('/central-tarefas/aprovacoes')).data;
  if (aprovacoes.some((item) => item.tipo !== 'APROVACAO')) {
    throw new Error('Endpoint de aprovacoes retornou tarefa fora do tipo APROVACAO.');
  }
  results.push({ etapa: 'Alcadas preservadas', ok: true, detalhe: 'central apenas lista aprovacoes' });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'central_tarefa_manual'
      and entidade_id in ($1, $2)
    `,
    [criada.id, cancelar.id]
  );
  if (auditoria.rows[0].total < 5) {
    throw new Error(`Auditoria insuficiente para tarefas manuais: ${auditoria.rows[0].total}.`);
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} evento(s)` });

  for (const route of [
    '/central-tarefas/pagar',
    '/central-tarefas/baixar',
    '/central-tarefas/gerar-cnab',
    '/central-tarefas/integracao-bancaria',
    '/central-tarefas/emitir-nfse',
    '/central-tarefas/integrar-prefeitura',
    '/central-tarefas/gerar-boleto',
    '/central-tarefas/aprovacoes/aprovar'
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404 && status !== 405) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404 ou 405.`);
    }
  }
  const deleteStatus = await requestStatus(`/central-tarefas/${criada.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /central-tarefas/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Rotas proibidas ausentes', ok: true, detalhe: 'HTTP 404/405' });

  const snapshotDepois = await getSnapshot();
  if (snapshotDepois.baixas !== snapshotAntes.baixas) {
    throw new Error(`Smoke criou baixa indevidamente: antes=${snapshotAntes.baixas}, depois=${snapshotDepois.baixas}.`);
  }
  if (snapshotDepois.programacoes !== snapshotAntes.programacoes) {
    throw new Error(`Smoke criou programacao indevidamente: antes=${snapshotAntes.programacoes}, depois=${snapshotDepois.programacoes}.`);
  }
  if (snapshotDepois.contas !== snapshotAntes.contas) {
    throw new Error(`Smoke criou conta a pagar indevidamente: antes=${snapshotAntes.contas}, depois=${snapshotDepois.contas}.`);
  }
  if (snapshotDepois.tarefas < snapshotAntes.tarefas + 2) {
    throw new Error('Tarefas manuais de teste nao foram persistidas.');
  }
  results.push({ etapa: 'Sem operacao financeira/fiscal', ok: true, detalhe: 'sem pagamento, baixa, conta, programacao, banco, CNAB ou NFS-e' });

  console.info(`Smoke V3.12 central de tarefas concluido contra ${apiBaseUrl}. Marcador: ${marker}. Central agregadora, sem pagamento, baixa nova, banco, CNAB, NFS-e, prefeitura, boleto ou DELETE fisico.`);
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
