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

interface AuditEventApi {
  id: string;
  entidade: string;
  entidade_id?: string | null;
  acao: string;
  modulo: string;
  resultado: string;
  severidade: string;
  created_by?: string | null;
  payload?: Record<string, unknown>;
}

interface AuditDetailApi {
  evento: AuditEventApi;
  timeline: AuditEventApi[];
}

interface AuditResumoApi {
  total: number;
  criticos: number;
  bloqueios_alcada: number;
  aprovacoes: number;
  reprovacoes: number;
  cancelamentos: number;
  baixas_manuais: number;
  usuarios_distintos: number;
  modulos_distintos: number;
}

interface Snapshot {
  baixas: number;
  programacoes: number;
  contas: number;
}

interface SeedAuditEvent {
  id: string;
  entidade_id: string;
  usuario_id: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_13';

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
      (select count(*)::int from contas_pagar) as contas
    `
  );
  return result.rows[0];
};

const ensureSeedAuditEvent = async (): Promise<SeedAuditEvent> => {
  const result = await query<SeedAuditEvent>(
    `
    with empresa as (
      select id
      from empresas
      where cnpj = '00.000.000/0001-33'
      limit 1
    ),
    usuario as (
      select u.id
      from usuarios u
      join empresa e on e.id = u.company_id
      where u.status = 'ativo' and u.ativo = true
      order by u.email
      limit 1
    ),
    inserted as (
      insert into auditoria_eventos (company_id, entidade, entidade_id, acao, payload, created_by)
      select
        empresa.id,
        'auditoria_smoke',
        gen_random_uuid(),
        'bloquear_alcada',
        jsonb_build_object(
          'marker', $1::text,
          'modulo', 'auditoria',
          'resultado', 'BLOQUEADO',
          'decisao', 'NEGADO',
          'motivo', 'Validacao local de rastreabilidade somente leitura',
          'context', jsonb_build_object('origem', 'smoke')
        ),
        usuario.id
      from empresa
      cross join usuario
      returning id, entidade_id, created_by as usuario_id
    )
    select id, entidade_id, usuario_id from inserted
    `,
    [marker]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Nao foi possivel criar evento local de auditoria para o smoke.');
  }
  return row;
};

const assertContainsEvent = (events: AuditEventApi[], id: string, label: string): void => {
  if (!events.some((event) => event.id === id)) {
    throw new Error(`${label} nao retornou o evento de auditoria ${id}.`);
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

  const snapshotAntes = await getSnapshot();
  const seed = await ensureSeedAuditEvent();
  results.push({ etapa: 'Evento local rastreavel', ok: true, detalhe: seed.id });

  const eventos = (await requestJson<ApiListResponse<AuditEventApi>>('/auditoria/eventos?limit=20')).data;
  if (!Array.isArray(eventos) || eventos.length === 0) {
    throw new Error('/auditoria/eventos nao retornou eventos.');
  }
  results.push({ etapa: 'Listar eventos', ok: true, detalhe: `${eventos.length} evento(s)` });

  const filtrados = (await requestJson<ApiListResponse<AuditEventApi>>(
    '/auditoria/eventos?modulo=auditoria&severidade=CRITICA&resultado=BLOQUEADO&limit=50'
  )).data;
  assertContainsEvent(filtrados, seed.id, 'Filtro por modulo/severidade/resultado');
  results.push({ etapa: 'Filtros avancados', ok: true, detalhe: 'modulo, severidade e resultado' });

  const resumo = (await requestJson<ApiItemResponse<AuditResumoApi>>('/auditoria/resumo')).data;
  if (typeof resumo.total !== 'number' || resumo.total <= 0 || typeof resumo.criticos !== 'number') {
    throw new Error('/auditoria/resumo retornou totais invalidos.');
  }
  results.push({ etapa: 'Resumo', ok: true, detalhe: `${resumo.total} evento(s), ${resumo.criticos} critico(s)` });

  const modulos = (await requestJson<ApiListResponse<Record<string, unknown>>>('/auditoria/modulos')).data;
  if (!Array.isArray(modulos) || modulos.length === 0) {
    throw new Error('/auditoria/modulos nao retornou agrupamentos.');
  }
  results.push({ etapa: 'Modulos', ok: true, detalhe: `${modulos.length} modulo(s)` });

  const criticos = (await requestJson<ApiListResponse<AuditEventApi>>('/auditoria/eventos-criticos?limit=100')).data;
  assertContainsEvent(criticos, seed.id, 'Eventos criticos');
  results.push({ etapa: 'Eventos criticos', ok: true, detalhe: `${criticos.length} evento(s)` });

  const detalhe = (await requestJson<ApiItemResponse<AuditDetailApi>>(`/auditoria/eventos/${seed.id}`)).data;
  if (detalhe.evento.id !== seed.id || !Array.isArray(detalhe.timeline) || detalhe.timeline.length === 0) {
    throw new Error('/auditoria/eventos/:id nao retornou detalhe com timeline.');
  }
  results.push({ etapa: 'Detalhar evento', ok: true, detalhe: `${detalhe.timeline.length} item(ns) na timeline` });

  const timeline = (await requestJson<ApiListResponse<AuditEventApi>>(`/auditoria/entidade/auditoria_smoke/${seed.entidade_id}`)).data;
  assertContainsEvent(timeline, seed.id, 'Timeline por entidade');
  results.push({ etapa: 'Timeline por entidade', ok: true, detalhe: seed.entidade_id });

  const eventosUsuario = (await requestJson<ApiListResponse<AuditEventApi>>(`/auditoria/usuario/${seed.usuario_id}?limit=100`)).data;
  assertContainsEvent(eventosUsuario, seed.id, 'Eventos por usuario');
  results.push({ etapa: 'Eventos por usuario', ok: true, detalhe: seed.usuario_id });

  const patchStatus = await requestStatus(`/auditoria/eventos/${seed.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ observacoes: `${marker} - tentativa bloqueada` })
  });
  if (patchStatus !== 405) {
    throw new Error(`PATCH /auditoria/eventos/:id retornou HTTP ${patchStatus}, esperado 405.`);
  }
  const deleteStatus = await requestStatus(`/auditoria/eventos/${seed.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /auditoria/eventos/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Logs imutaveis por API', ok: true, detalhe: 'PATCH/DELETE HTTP 405' });

  for (const route of [
    '/auditoria/pagar',
    '/auditoria/baixar',
    '/auditoria/gerar-cnab',
    '/auditoria/integracao-bancaria',
    '/auditoria/emitir-nfse',
    '/auditoria/integrar-prefeitura',
    '/auditoria/gerar-boleto'
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404 && status !== 405) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404 ou 405.`);
    }
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
  results.push({ etapa: 'Sem operacao financeira/fiscal', ok: true, detalhe: 'sem pagamento, baixa, conta, programacao, banco, CNAB ou NFS-e' });

  console.info(`Smoke V3.13 auditoria concluido contra ${apiBaseUrl}. Marcador: ${marker}. Endpoints somente leitura, sem DELETE fisico e sem operacao financeira/fiscal.`);
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
