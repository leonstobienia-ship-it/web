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
  obraId: string;
  clienteId: string;
  contratoId: string;
}

interface PendenciaApi {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  prioridade: string;
  tipo: string;
  comentarios?: unknown[];
  historico?: unknown[];
}

interface Snapshot {
  baixas: number;
  programacoes: number;
  contas: number;
  pendencias: number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_11';

const uniqueCpfCnpj = (prefix: string, stamp: number): string => `${prefix}${String(stamp).slice(-11).padStart(11, '0')}`;

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
      (select count(*)::int from riscos_pendencias) as pendencias
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

  const stamp = Date.now();
  const centro = await query<{ id: string }>(
    `
    insert into centros_custo (company_id, codigo, nome, tipo, status, observacoes)
    values ($1, $2, $3, 'obra', 'ativo', $4)
    returning id
    `,
    [companyId, `CC-${marker}-${stamp}`, `${marker} - Centro`, `${marker} - centro local`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [companyId, `${marker} - Cliente ${stamp}`, uniqueCpfCnpj('311', stamp), `${marker} - cliente local`]
  );
  const obra = await query<{ id: string }>(
    `
    insert into obras (company_id, cliente_id, centro_custo_id, codigo, nome, status, observacoes)
    values ($1, $2, $3, $4, $5, 'ativo', $6)
    returning id
    `,
    [companyId, cliente.rows[0].id, centro.rows[0].id, `OB-${marker}-${stamp}`, `${marker} - Obra`, `${marker} - obra local`]
  );
  const contrato = await query<{ id: string }>(
    `
    insert into contratos_obra (
      company_id, cliente_id, obra_id, centro_custo_id, numero, objeto, escopo_resumo,
      valor_original, valor_aditivos, valor_total_contratado, data_inicio, data_fim, status, observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $7, 30000, 0, 30000, $8, $9, 'ATIVO', $10)
    returning id
    `,
    [
      companyId,
      cliente.rows[0].id,
      obra.rows[0].id,
      centro.rows[0].id,
      `CT-${marker}-${stamp}`,
      `${marker} - contrato`,
      `${marker} - escopo`,
      today(),
      addDays(120),
      `${marker} - contrato local sem integracao real`
    ]
  );

  return {
    companyId,
    usuarioId,
    obraId: obra.rows[0].id,
    clienteId: cliente.rows[0].id,
    contratoId: contrato.rows[0].id
  };
};

const assertStatus = (pendencia: PendenciaApi, expected: string, label: string): void => {
  if (pendencia.status !== expected) {
    throw new Error(`${label}: esperado ${expected}, obtido ${pendencia.status}.`);
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
  const ctx = await createSeed();
  results.push({ etapa: 'Cenario operacional criado', ok: true, detalhe: ctx.obraId });

  const criada = (await requestJson<ApiItemResponse<PendenciaApi>>('/riscos-pendencias', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      titulo: `${marker} - Pendencia financeira`,
      descricao: `${marker} - risco sem operacao financeira real`,
      tipo: 'FINANCEIRO',
      prioridade: 'CRITICA',
      responsavel_id: ctx.usuarioId,
      prazo: addDays(5),
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      contrato_obra_id: ctx.contratoId,
      usuario_id: ctx.usuarioId,
      comentario: `${marker} - criada via smoke`
    })
  })).data;
  assertStatus(criada, 'ABERTA', 'Criacao');
  results.push({ etapa: 'Criar pendencia', ok: true, detalhe: criada.id });

  const lista = (await requestJson<ApiListResponse<PendenciaApi>>(`/riscos-pendencias?obra_id=${ctx.obraId}`)).data;
  if (!lista.some((item) => item.id === criada.id)) {
    throw new Error('Listagem nao retornou a pendencia criada.');
  }
  results.push({ etapa: 'Listar pendencias', ok: true, detalhe: `${lista.length} registro(s)` });

  const atualizada = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${criada.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      titulo: `${marker} - Pendencia financeira atualizada`,
      prioridade: 'ALTA',
      status: 'AGUARDANDO_TERCEIRO',
      usuario_id: ctx.usuarioId,
      comentario: `${marker} - atualizada`
    })
  })).data;
  assertStatus(atualizada, 'AGUARDANDO_TERCEIRO', 'Atualizacao');
  results.push({ etapa: 'Atualizar pendencia', ok: true, detalhe: atualizada.prioridade });

  const iniciada = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${criada.id}/iniciar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, observacoes: `${marker} - iniciar` })
  })).data;
  assertStatus(iniciada, 'EM_ANDAMENTO', 'Iniciar');
  results.push({ etapa: 'Iniciar pendencia', ok: true, detalhe: iniciada.status });

  const bloqueada = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${criada.id}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, motivo: `${marker} - aguardando terceiro` })
  })).data;
  assertStatus(bloqueada, 'BLOQUEADA', 'Bloquear');
  results.push({ etapa: 'Bloquear pendencia', ok: true, detalhe: bloqueada.status });

  const comentada = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${criada.id}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, comentario: `${marker} - comentario auditado` })
  })).data;
  if (!Array.isArray(comentada.comentarios) || comentada.comentarios.length === 0) {
    throw new Error('Comentario nao retornou na pendencia.');
  }
  results.push({ etapa: 'Adicionar comentario', ok: true, detalhe: `${comentada.comentarios.length} comentario(s)` });

  const resolvida = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${criada.id}/resolver`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, resolucao: `${marker} - resolvida sem baixa ou pagamento` })
  })).data;
  assertStatus(resolvida, 'RESOLVIDA', 'Resolver');
  results.push({ etapa: 'Resolver pendencia', ok: true, detalhe: resolvida.status });

  const alerta = (await requestJson<ApiItemResponse<PendenciaApi>>('/riscos-pendencias/gerar-de-alerta', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      usuario_id: ctx.usuarioId,
      responsavel_id: ctx.usuarioId,
      prazo: addDays(2),
      alerta: {
        tipo: 'MARGEM_NEGATIVA',
        severidade: 'CRITICO',
        mensagem: `${marker} - alerta convertido em pendencia`,
        obra_id: ctx.obraId,
        cliente_id: ctx.clienteId
      }
    })
  })).data;
  assertStatus(alerta, 'ABERTA', 'Gerar de alerta');
  if (alerta.tipo !== 'MARGEM' || alerta.prioridade !== 'CRITICA') {
    throw new Error(`Alerta gerado com tipo/prioridade incoerente: ${alerta.tipo}/${alerta.prioridade}.`);
  }
  results.push({ etapa: 'Gerar pendencia de alerta', ok: true, detalhe: alerta.codigo });

  const cancelada = (await requestJson<ApiItemResponse<PendenciaApi>>(`/riscos-pendencias/${alerta.id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.usuarioId, motivo: `${marker} - cancelamento logico de teste` })
  })).data;
  assertStatus(cancelada, 'CANCELADA', 'Cancelar');
  results.push({ etapa: 'Cancelar logicamente', ok: true, detalhe: cancelada.status });

  const historico = (await requestJson<ApiListResponse<Record<string, unknown>>>(`/riscos-pendencias/${criada.id}/historico`)).data;
  for (const action of ['criar', 'editar', 'iniciar', 'bloquear', 'comentar', 'resolver']) {
    if (!historico.some((item) => item.acao === action)) {
      throw new Error(`Historico nao contem acao ${action}.`);
    }
  }
  results.push({ etapa: 'Historico operacional', ok: true, detalhe: `${historico.length} evento(s)` });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'risco_pendencia'
      and entidade_id in ($1, $2)
    `,
    [criada.id, alerta.id]
  );
  if (auditoria.rows[0].total < 6) {
    throw new Error(`Auditoria insuficiente para riscos/pendencias: ${auditoria.rows[0].total}.`);
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} evento(s)` });

  for (const route of [
    `/riscos-pendencias/${criada.id}/pagar`,
    `/riscos-pendencias/${criada.id}/baixar`,
    '/riscos-pendencias/pagar',
    '/riscos-pendencias/gerar-cnab',
    '/riscos-pendencias/integracao-bancaria',
    '/riscos-pendencias/emitir-nfse',
    '/riscos-pendencias/integrar-prefeitura'
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404 && status !== 405) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404 ou 405.`);
    }
  }
  const deleteStatus = await requestStatus(`/riscos-pendencias/${criada.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /riscos-pendencias/:id retornou HTTP ${deleteStatus}, esperado 405.`);
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
  if (snapshotDepois.pendencias < snapshotAntes.pendencias + 2) {
    throw new Error('Pendencias de teste nao foram persistidas.');
  }
  results.push({ etapa: 'Sem operacao financeira nova', ok: true, detalhe: 'sem baixa, pagamento, programacao ou conta nova' });

  console.info(`Smoke V3.11 riscos e pendencias concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa, banco, CNAB, NFS-e, prefeitura ou DELETE fisico.`);
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
