interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface Empresa {
  id: string;
}

interface Perfil {
  id: string;
  company_id: string;
  nome: string;
  status: string;
}

interface Escopo {
  id: string;
  company_id: string;
  modulo: string;
  acao: string;
  status: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil_principal?: string | null;
}

interface UsuarioPerfil {
  id: string;
  usuario_id: string;
  perfil_id: string;
  status: string;
}

interface Alcada {
  id: string;
  perfil_id?: string | null;
  modulo: string;
  tipo_documento: string;
  acao: string;
  status: string;
}

interface ValidacaoAlcada {
  aprovado: boolean;
  decisao: string;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5B';

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

const createOrGetEscopo = async (companyId: string): Promise<Escopo> => {
  const payload = {
    company_id: companyId,
    modulo: 'auditoria',
    acao: 'administrar',
    descricao: `${marker} - escopo local de teste`
  };
  const response = await fetch(`${apiBaseUrl}/escopos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (response.ok) {
    return ((await response.json()) as ApiItemResponse<Escopo>).data;
  }
  if (response.status !== 409) {
    const text = await response.text();
    throw new Error(`/escopos retornou HTTP ${response.status}: ${text}`);
  }
  const escopos = (await requestJson<ApiListResponse<Escopo>>('/escopos')).data;
  const existing = escopos.find((escopo) => escopo.modulo === payload.modulo && escopo.acao === payload.acao);
  if (!existing) {
    throw new Error('Escopo de teste duplicado nao foi localizado apos HTTP 409.');
  }
  return existing;
};

const findUsuario = (usuarios: Usuario[], email: string, perfil: string): Usuario => {
  const usuario = usuarios.find((item) => item.email === email) || usuarios.find((item) => item.perfil_principal === perfil);
  if (!usuario) {
    throw new Error(`Usuario seed ${email}/${perfil} nao encontrado.`);
  }
  return usuario;
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

  const empresas = (await requestJson<ApiListResponse<Empresa>>('/empresas')).data;
  const companyId = empresas[0]?.id;
  if (!companyId) {
    throw new Error('Nenhuma empresa local encontrada.');
  }

  const perfil = (await requestJson<ApiItemResponse<Perfil>>('/perfis', {
    method: 'POST',
    body: JSON.stringify({
      company_id: companyId,
      nome: `TESTE_${Date.now()}`,
      descricao: `${marker} - perfil local criado pelo smoke`
    })
  })).data;
  const perfis = (await requestJson<ApiListResponse<Perfil>>('/perfis')).data;
  if (!perfis.some((item) => item.id === perfil.id) || !perfis.some((item) => item.nome === 'PLANEJAMENTO')) {
    throw new Error('/perfis nao retornou perfil criado ou seed PLANEJAMENTO.');
  }
  results.push({ etapa: 'Perfis criados/listados', ok: true, detalhe: perfil.nome });

  const escopo = await createOrGetEscopo(companyId);
  const escopos = (await requestJson<ApiListResponse<Escopo>>('/escopos')).data;
  if (!escopos.some((item) => item.id === escopo.id)) {
    throw new Error('/escopos nao retornou o escopo de teste.');
  }
  results.push({ etapa: 'Escopos criados/listados', ok: true, detalhe: `${escopo.modulo}/${escopo.acao}` });

  const usuarios = (await requestJson<ApiListResponse<Usuario>>('/usuarios')).data;
  const leon = findUsuario(usuarios, 'leon.dev.v35b@enac.local', 'DIRETORIA');
  const gustavo = findUsuario(usuarios, 'gustavo.dev.v35b@enac.local', 'PLANEJAMENTO');
  const vinculo = (await requestJson<ApiItemResponse<UsuarioPerfil>>('/usuarios-perfis', {
    method: 'POST',
    body: JSON.stringify({ usuario_id: leon.id, perfil_id: perfil.id, principal: false })
  })).data;
  if (vinculo.status !== 'ativo') {
    throw new Error('Vinculo usuario-perfil nao nasceu ativo.');
  }
  results.push({ etapa: 'Vinculo usuario-perfil', ok: true, detalhe: vinculo.id });

  const perfilEscopo = (await requestJson<ApiItemResponse<{ id: string; status: string }>>('/perfis-escopos', {
    method: 'POST',
    body: JSON.stringify({ perfil_id: perfil.id, escopo_id: escopo.id })
  })).data;
  if (perfilEscopo.status !== 'ativo') {
    throw new Error('Vinculo perfil-escopo nao nasceu ativo.');
  }
  results.push({ etapa: 'Vinculo perfil-escopo', ok: true, detalhe: perfilEscopo.id });

  const alcada = (await requestJson<ApiItemResponse<Alcada>>('/alcadas', {
    method: 'POST',
    body: JSON.stringify({
      company_id: companyId,
      perfil_id: perfil.id,
      modulo: 'auditoria',
      tipo_documento: 'AUDITORIA',
      acao: 'visualizar',
      valor_minimo: 0,
      valor_maximo: 100,
      observacoes: `${marker} - alcada local criada pelo smoke`
    })
  })).data;
  const alcadas = (await requestJson<ApiListResponse<Alcada>>('/alcadas')).data;
  if (!alcadas.some((item) => item.id === alcada.id)) {
    throw new Error('/alcadas nao retornou a alcada criada.');
  }
  results.push({ etapa: 'Alcada criada/listada', ok: true, detalhe: alcada.id });

  const planejamentoAte20 = (await requestJson<ApiItemResponse<ValidacaoAlcada>>('/alcadas/validar', {
    method: 'POST',
    body: JSON.stringify({
      usuario_id: gustavo.id,
      modulo: 'solicitacoes-compra',
      tipo_documento: 'SOLICITACAO_COMPRA',
      acao: 'aprovar_tecnico',
      valor: 15000
    })
  })).data;
  if (!planejamentoAte20.aprovado) {
    throw new Error('PLANEJAMENTO deveria aprovar tecnicamente ate R$ 20.000.');
  }
  results.push({ etapa: 'PLANEJAMENTO ate 20k', ok: true, detalhe: planejamentoAte20.decisao });

  const planejamentoAcima20 = (await requestJson<ApiItemResponse<ValidacaoAlcada>>('/alcadas/validar', {
    method: 'POST',
    body: JSON.stringify({
      usuario_id: gustavo.id,
      modulo: 'solicitacoes-compra',
      tipo_documento: 'SOLICITACAO_COMPRA',
      acao: 'aprovar_tecnico',
      valor: 25000
    })
  })).data;
  if (planejamentoAcima20.aprovado) {
    throw new Error('PLANEJAMENTO nao deve aprovar tecnicamente acima de R$ 20.000.');
  }
  results.push({ etapa: 'PLANEJAMENTO acima de 20k bloqueado', ok: true, detalhe: planejamentoAcima20.decisao });

  const diretoriaAcima20 = (await requestJson<ApiItemResponse<ValidacaoAlcada>>('/alcadas/validar', {
    method: 'POST',
    body: JSON.stringify({
      usuario_id: leon.id,
      modulo: 'solicitacoes-compra',
      tipo_documento: 'SOLICITACAO_COMPRA',
      acao: 'aprovar_diretoria',
      valor: 25000
    })
  })).data;
  if (!diretoriaAcima20.aprovado) {
    throw new Error('DIRETORIA deveria aprovar acima de R$ 20.000.');
  }
  results.push({ etapa: 'DIRETORIA acima de 20k', ok: true, detalhe: diretoriaAcima20.decisao });

  const deleteStatus = await requestStatus(`/perfis/${perfil.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /perfis/:id retornou ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'DELETE fisico ausente', ok: true, detalhe: 'HTTP 405' });

  const fakeId = '00000000-0000-4000-8000-000000000001';
  const forbiddenFinanceRoutes = [
    `/contas-pagar/${fakeId}/programar-pagamento`,
    `/contas-pagar/${fakeId}/baixar`,
    `/contas-pagar/${fakeId}/pagar`
  ];
  for (const route of forbiddenFinanceRoutes) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  results.push({ etapa: 'Sem programacao, baixa ou pagamento', ok: true, detalhe: 'HTTP 404' });

  console.info(`Smoke V3.5B perfis/escopos/alcadas concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem DELETE, pagamento, baixa ou programacao bancaria.`);
  console.table(results);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
