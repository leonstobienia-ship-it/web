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
  contratoId: string;
  notaId: string;
}

interface DocumentoApi {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  status: string;
  observacao?: string | null;
  substituido_por_documento_id?: string | null;
  substitui_documento_id?: string | null;
}

interface SubstituicaoResponse {
  substituido: DocumentoApi;
  substituto: DocumentoApi;
}

interface Snapshot {
  baixas: number;
  programacoes: number;
  contas: number;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_14';

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

const createSeedContext = async (): Promise<SeedContext> => {
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

  const contrato = await query<{ id: string }>(
    `
    select id
    from contratos_obra
    where company_id = $1
    order by created_at desc
    limit 1
    `,
    [companyId]
  );
  const contratoId = contrato.rows[0]?.id;
  if (!contratoId) {
    throw new Error('Contrato de obra local nao encontrado. Rode smoke:contratos-obra antes de smoke:documentos.');
  }

  const nota = await query<{ id: string }>(
    `
    select id
    from notas_fiscais_entrada
    where company_id = $1
    order by created_at desc
    limit 1
    `,
    [companyId]
  );
  const notaId = nota.rows[0]?.id;
  if (!notaId) {
    throw new Error('Nota fiscal de entrada local nao encontrada. Rode smoke:notas antes de smoke:documentos.');
  }

  return { companyId, usuarioId, contratoId, notaId };
};

const assertContains = (documentos: DocumentoApi[], id: string, label: string): void => {
  if (!documentos.some((documento) => documento.id === id)) {
    throw new Error(`${label} nao retornou documento ${id}.`);
  }
};

const assertRouteAbsent = async (route: string, method: string): Promise<void> => {
  const status = await requestStatus(route, { method, body: method === 'GET' ? undefined : '{}' });
  if (status !== 404 && status !== 405) {
    throw new Error(`${method} ${route} retornou HTTP ${status}, esperado 404 ou 405.`);
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
  const ctx = await createSeedContext();
  results.push({ etapa: 'Contexto local', ok: true, detalhe: `${ctx.contratoId}/${ctx.notaId}` });

  const tipos = (await requestJson<ApiListResponse<string>>('/documentos/tipos')).data;
  const statusValues = (await requestJson<ApiListResponse<string>>('/documentos/status')).data;
  if (!tipos.includes('CONTRATO') || !tipos.includes('NF') || !statusValues.includes('ATIVO')) {
    throw new Error('/documentos/tipos ou /documentos/status nao retornaram contrato esperado.');
  }
  results.push({ etapa: 'Catalogos documentais', ok: true, detalhe: `${tipos.length} tipos, ${statusValues.length} status` });

  const contratoDoc = (await requestJson<ApiItemResponse<DocumentoApi>>('/documentos', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      entidade_tipo: 'contrato_obra',
      entidade_id: ctx.contratoId,
      tipo_documento: 'CONTRATO',
      nome_arquivo: `${marker}-contrato-obra.pdf`,
      mime_type: 'application/pdf',
      tamanho_bytes: 12345,
      descricao: `${marker} - contrato de obra referencia local`,
      observacao: 'Metadado local sem upload real externo.',
      origem: 'ERP_LOCAL',
      referencia_local_mock: `mock://documentos/${marker}/contrato`,
      sharepoint_site_id_mock: 'mock-site-futuro',
      sharepoint_drive_id_mock: 'mock-drive-futuro',
      sharepoint_item_id_mock: 'mock-item-contrato',
      url_mock: 'mock://sharepoint-futuro/contrato',
      usuario_id: ctx.usuarioId
    })
  })).data;
  if (contratoDoc.status !== 'ATIVO' || contratoDoc.entidade_tipo !== 'contrato_obra') {
    throw new Error('Documento de contrato criado com contrato invalido.');
  }
  results.push({ etapa: 'Criar documento de contrato', ok: true, detalhe: contratoDoc.id });

  const notaDoc = (await requestJson<ApiItemResponse<DocumentoApi>>('/documentos', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.companyId,
      entidade_tipo: 'nota_fiscal_entrada',
      entidade_id: ctx.notaId,
      tipo_documento: 'NF',
      nome_arquivo: `${marker}-nota-fiscal.xml`,
      mime_type: 'application/xml',
      tamanho_bytes: 7890,
      descricao: `${marker} - XML de NF apenas referenciado`,
      observacao: 'Sem download, upload ou emissao fiscal real.',
      origem: 'ERP_LOCAL',
      referencia_local_mock: `mock://documentos/${marker}/nota`,
      usuario_id: ctx.usuarioId
    })
  })).data;
  if (notaDoc.status !== 'ATIVO' || notaDoc.entidade_tipo !== 'nota_fiscal_entrada') {
    throw new Error('Documento de nota fiscal criado com contrato invalido.');
  }
  results.push({ etapa: 'Criar documento de nota fiscal', ok: true, detalhe: notaDoc.id });

  const lista = (await requestJson<ApiListResponse<DocumentoApi>>(`/documentos?texto=${marker}&limit=100`)).data;
  assertContains(lista, contratoDoc.id, 'Listagem geral');
  assertContains(lista, notaDoc.id, 'Listagem geral');
  results.push({ etapa: 'Listar documentos', ok: true, detalhe: `${lista.length} registro(s)` });

  const porEntidade = (await requestJson<ApiListResponse<DocumentoApi>>(`/documentos/entidade/contrato_obra/${ctx.contratoId}`)).data;
  assertContains(porEntidade, contratoDoc.id, 'Busca por entidade');
  results.push({ etapa: 'Buscar por entidade', ok: true, detalhe: `${porEntidade.length} registro(s)` });

  const editado = (await requestJson<ApiItemResponse<DocumentoApi>>(`/documentos/${contratoDoc.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      observacao: `${marker} - metadados editados sem upload real`,
      sharepoint_item_id_mock: 'mock-item-contrato-editado',
      usuario_id: ctx.usuarioId
    })
  })).data;
  if (!editado.observacao?.includes('metadados editados')) {
    throw new Error('PATCH /documentos/:id nao atualizou metadados.');
  }
  results.push({ etapa: 'Editar metadados', ok: true, detalhe: editado.id });

  const substituicao = (await requestJson<ApiItemResponse<SubstituicaoResponse>>(`/documentos/${contratoDoc.id}/substituir`, {
    method: 'PATCH',
    body: JSON.stringify({
      tipo_documento: 'CONTRATO',
      nome_arquivo: `${marker}-contrato-obra-revisado.pdf`,
      mime_type: 'application/pdf',
      tamanho_bytes: 23456,
      descricao: `${marker} - contrato revisado`,
      motivo: `${marker} - substituicao logica de referencia`,
      referencia_local_mock: `mock://documentos/${marker}/contrato-revisado`,
      usuario_id: ctx.usuarioId
    })
  })).data;
  if (substituicao.substituido.status !== 'SUBSTITUIDO' || substituicao.substituto.substitui_documento_id !== contratoDoc.id) {
    throw new Error('Substituicao documental nao preservou vinculo logico.');
  }
  results.push({ etapa: 'Substituir documento', ok: true, detalhe: substituicao.substituto.id });

  const inativado = (await requestJson<ApiItemResponse<DocumentoApi>>(`/documentos/${substituicao.substituto.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      motivo: `${marker} - inativacao logica da referencia substituta`,
      usuario_id: ctx.usuarioId
    })
  })).data;
  if (inativado.status !== 'INATIVO') {
    throw new Error('Inativacao logica nao retornou status INATIVO.');
  }
  results.push({ etapa: 'Inativar documento', ok: true, detalhe: inativado.status });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'documento_anexo'
      and entidade_id = any($1::uuid[])
    `,
    [[contratoDoc.id, notaDoc.id, substituicao.substituto.id]]
  );
  if (auditoria.rows[0].total < 5) {
    throw new Error(`Auditoria insuficiente para documentos: ${auditoria.rows[0].total}.`);
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} evento(s)` });

  const deleteStatus = await requestStatus(`/documentos/${notaDoc.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /documentos/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem DELETE fisico por API', ok: true, detalhe: 'DELETE HTTP 405' });

  for (const route of [
    '/documentos/upload',
    '/documentos/download',
    '/documentos/sharepoint',
    '/documentos/sharepoint/upload',
    '/documentos/graph',
    '/documentos/power-automate',
    '/documentos/pagar',
    '/documentos/baixar',
    '/documentos/gerar-cnab',
    '/documentos/integracao-bancaria',
    '/documentos/emitir-nfse',
    '/documentos/integrar-prefeitura',
    '/documentos/gerar-boleto'
  ]) {
    await assertRouteAbsent(route, 'POST');
  }
  results.push({ etapa: 'Rotas proibidas ausentes', ok: true, detalhe: 'upload/sharepoint/financeiro/fiscal HTTP 404/405' });

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
  results.push({ etapa: 'Sem operacao financeira/fiscal', ok: true, detalhe: 'sem pagamento, baixa, conta, banco, CNAB, boleto ou NFS-e' });

  console.info(`Smoke V3.14 documentos concluido contra ${apiBaseUrl}. Marcador: ${marker}. Apenas metadados e mocks, sem upload real, SharePoint real, Graph, Power Automate ou DELETE fisico.`);
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
