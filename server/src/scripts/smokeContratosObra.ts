import { closePool, query } from '../db/client.js';

interface ApiListResponse<T> {
  data: T[];
}

interface ApiItemResponse<T> {
  data: T;
}

interface Empresa {
  id: string;
  cnpj?: string;
}

interface Usuario {
  id: string;
  email: string;
  perfil_principal?: string | null;
}

interface SeedContext {
  empresa: Empresa;
  clienteId: string;
  obraId: string;
  centroCustoId: string;
  planejamento: Usuario;
}

interface ContratoObra {
  id: string;
  numero: string;
  status: string;
  valor_original: string | number;
  valor_aditivos: string | number;
  valor_total_contratado: string | number;
  saldo_contratual?: string | number;
  itens?: Array<{ id: string; codigo?: string | null; status: string }>;
  aditivos?: Aditivo[];
}

interface Aditivo {
  id: string;
  numero: string;
  status: string;
  valor_delta: string | number;
}

interface Medicao {
  id: string;
  numero: string;
  status: string;
  contrato_obra_id?: string | null;
  contrato_obra_aditivo_id?: string | null;
  valor_liquido_previsto: string | number;
}

interface PedidoFaturamento {
  id: string;
  codigo: string;
  status: string;
  contrato_obra_id?: string | null;
  contrato_obra_aditivo_id?: string | null;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_7';

const uniqueCpfCnpj = (prefix: string, stamp: number): string => `${prefix}${String(stamp).slice(-11).padStart(11, '0')}`;

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const money = (value: number): number => Number(value.toFixed(2));

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

const expectHttpError = async (endpoint: string, expectedStatus: number, init?: RequestInit): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`${endpoint} retornou HTTP ${response.status}, esperado ${expectedStatus}: ${text}`);
  }
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

const findUsuario = (usuarios: Usuario[], email: string, perfil: string): Usuario => {
  const usuario = usuarios.find((item) => item.email === email) || usuarios.find((item) => item.perfil_principal === perfil);
  if (!usuario) {
    throw new Error(`Usuario seed ${email}/${perfil} nao encontrado.`);
  }
  return usuario;
};

const ensureSeedContext = async (): Promise<SeedContext> => {
  const empresas = (await requestJson<ApiListResponse<Empresa>>('/empresas')).data;
  const empresa = empresas.find((item) => item.cnpj === '00.000.000/0001-33') || empresas[0];
  if (!empresa) {
    throw new Error('Nenhuma empresa local encontrada.');
  }
  const usuarios = (await requestJson<ApiListResponse<Usuario>>('/usuarios')).data;
  const planejamento = findUsuario(usuarios, 'gustavo.dev.v35b@enac.local', 'PLANEJAMENTO');
  const stamp = Date.now();

  const centro = await query<{ id: string }>(
    `
    insert into centros_custo (company_id, codigo, nome, tipo, status, observacoes)
    values ($1, $2, $3, 'obra', 'ativo', $4)
    returning id
    `,
    [empresa.id, `CC-${marker}-${stamp}`, `${marker} - Centro contrato`, `${marker} - centro para smoke`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Cliente ${stamp}`, uniqueCpfCnpj('370', stamp), `${marker} - cliente local`]
  );
  const obra = await query<{ id: string }>(
    `
    insert into obras (company_id, cliente_id, centro_custo_id, codigo, nome, status, observacoes)
    values ($1, $2, $3, $4, $5, 'ativo', $6)
    returning id
    `,
    [empresa.id, cliente.rows[0].id, centro.rows[0].id, `OB-${marker}-${stamp}`, `${marker} - Obra`, `${marker} - obra local`]
  );

  return {
    empresa,
    clienteId: cliente.rows[0].id,
    obraId: obra.rows[0].id,
    centroCustoId: centro.rows[0].id,
    planejamento
  };
};

const getLatestAditivo = (contrato: ContratoObra): Aditivo => {
  const aditivo = contrato.aditivos?.[0];
  if (!aditivo) {
    throw new Error('Contrato nao retornou aditivo.');
  }
  return aditivo;
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

  const ctx = await ensureSeedContext();

  let contrato = (await requestJson<ApiItemResponse<ContratoObra>>('/contratos-obra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      cliente_id: ctx.clienteId,
      obra_id: ctx.obraId,
      centro_custo_id: ctx.centroCustoId,
      numero: `CT-${Date.now()}`,
      objeto: `${marker} - contrato smoke`,
      escopo_resumo: `${marker} - escopo comercial local`,
      valor_original: 10000,
      data_inicio: today(),
      data_fim: addDays(90),
      percentual_retencao_previsto: 0,
      impostos_previstos: `${marker} - informativo`,
      observacoes: `${marker} - sem fiscal real, banco ou boleto`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  if (contrato.status !== 'RASCUNHO') {
    throw new Error('Contrato nao nasceu em RASCUNHO.');
  }
  results.push({ etapa: 'Criar contrato em rascunho', ok: true, detalhe: contrato.numero });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: 'ESCOPO-01',
      descricao: `${marker} - escopo principal`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario: 10000,
      centro_custo_id: ctx.centroCustoId,
      etapa_servico: `${marker} - etapa principal`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  results.push({ etapa: 'Criar item de escopo', ok: true, detalhe: `${contrato.itens?.length || 0} item(ns)` });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: 'ESCOPO-INATIVAR',
      descricao: `${marker} - escopo a inativar`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario: 1,
      centro_custo_id: ctx.centroCustoId,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const itemInativar = contrato.itens?.find((item) => item.codigo === 'ESCOPO-INATIVAR');
  if (!itemInativar) {
    throw new Error('Item para inativacao nao retornado.');
  }
  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/itens/${itemInativar.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      motivo: `${marker} - inativacao logica`
    })
  })).data;
  results.push({ etapa: 'Inativar item sem DELETE', ok: true, detalhe: 'INATIVO' });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/ativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - ativacao local`
    })
  })).data;
  if (contrato.status !== 'ATIVO') {
    throw new Error('Contrato nao foi ativado.');
  }
  results.push({ etapa: 'Ativar contrato', ok: true, detalhe: contrato.status });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/aditivos`, {
    method: 'POST',
    body: JSON.stringify({
      numero: `AD-${Date.now()}`,
      tipo: 'VALOR_ESCOPO',
      descricao: `${marker} - aditivo smoke`,
      escopo_descricao: `${marker} - ampliacao de escopo`,
      valor_delta: 5000,
      prazo_delta_dias: 15,
      nova_data_fim: addDays(120),
      justificativa: `${marker} - aditivo local`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const aditivoRascunho = getLatestAditivo(contrato);
  results.push({ etapa: 'Criar aditivo', ok: true, detalhe: aditivoRascunho.numero });

  await expectHttpError('/medicoes', 409, {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      centro_custo_id: ctx.centroCustoId,
      contrato_obra_id: contrato.id,
      contrato_obra_aditivo_id: aditivoRascunho.id,
      numero: `MED-${Date.now()}-ADITIVO-NAO-APROVADO`,
      competencia: today().slice(0, 7),
      periodo_inicio: today(),
      periodo_fim: addDays(10),
      contrato_escopo: `${marker} - bloqueio de aditivo nao aprovado`,
      responsavel_id: ctx.planejamento.id,
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - deve bloquear`
    })
  });
  results.push({ etapa: 'Aditivo nao aprovado bloqueia medicao', ok: true, detalhe: 'HTTP 409' });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/aditivos/${aditivoRascunho.id}/submeter`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - submissao`
    })
  })).data;
  const aditivoSubmetido = getLatestAditivo(contrato);
  if (aditivoSubmetido.status !== 'SUBMETIDO') {
    throw new Error('Aditivo nao foi submetido.');
  }
  results.push({ etapa: 'Submeter aditivo', ok: true, detalhe: aditivoSubmetido.status });

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/aditivos/${aditivoSubmetido.id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - aprovacao por alcada`
    })
  })).data;
  const aditivoAprovado = getLatestAditivo(contrato);
  const totalContrato = Number(contrato.valor_total_contratado);
  if (aditivoAprovado.status !== 'APROVADO' || totalContrato !== 15000) {
    throw new Error(`Aditivo nao impactou valor total corretamente. Status=${aditivoAprovado.status}; total=${totalContrato}.`);
  }
  results.push({ etapa: 'Aprovar aditivo e atualizar total', ok: true, detalhe: `total ${totalContrato}` });

  const medicao = (await requestJson<ApiItemResponse<Medicao>>('/medicoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      centro_custo_id: ctx.centroCustoId,
      contrato_obra_id: contrato.id,
      contrato_obra_aditivo_id: aditivoAprovado.id,
      numero: `MED-${Date.now()}-CONTRATO`,
      competencia: today().slice(0, 7),
      periodo_inicio: today(),
      periodo_fim: addDays(10),
      contrato_escopo: `${marker} - medicao vinculada ao contrato`,
      responsavel_id: ctx.planejamento.id,
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - medicao contratual`
    })
  })).data;

  let medicaoAtual = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      descricao: `${marker} - item medido dentro do contrato`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario: 12000,
      centro_custo_id: ctx.centroCustoId,
      etapa_servico: `${marker} - etapa vinculada`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  if (medicaoAtual.contrato_obra_id !== contrato.id) {
    throw new Error('Medicao nao preservou contrato_obra_id.');
  }
  medicaoAtual = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/enviar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - enviar medicao contratual`
    })
  })).data;
  medicaoAtual = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - aprovar medicao contratual`
    })
  })).data;
  results.push({ etapa: 'Vincular medicao ao contrato/aditivo', ok: true, detalhe: medicaoAtual.status });

  const pedido = (await requestJson<ApiItemResponse<PedidoFaturamento>>('/pedidos-faturamento', {
    method: 'POST',
    body: JSON.stringify({
      medicao_id: medicao.id,
      valor_solicitado: 12000,
      data_solicitacao: today(),
      contrato_obra_id: contrato.id,
      contrato_obra_aditivo_id: aditivoAprovado.id,
      responsavel_id: ctx.planejamento.id,
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - pedido vinculado sem emissao fiscal real`
    })
  })).data;
  if (pedido.contrato_obra_id !== contrato.id || pedido.contrato_obra_aditivo_id !== aditivoAprovado.id) {
    throw new Error('Pedido de faturamento nao preservou vinculo contratual.');
  }
  results.push({ etapa: 'Vincular pedido de faturamento', ok: true, detalhe: pedido.codigo });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where payload->>'marker' = $1
      and entidade in ('contrato_obra', 'contrato_obra_item', 'contrato_obra_aditivo', 'medicao_obra', 'pedido_faturamento')
    `,
    [marker]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 6) {
    throw new Error('Auditoria V3.7 nao foi registrada como esperado.');
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  const forbiddenRoutes = [
    `/contratos-obra/${contrato.id}/pagar`,
    `/contratos-obra/${contrato.id}/gerar-cnab`,
    `/contratos-obra/${contrato.id}/executar-pagamento`,
    `/contratos-obra/${contrato.id}/integracao-bancaria`,
    `/contratos-obra/${contrato.id}/emitir-nfse`,
    `/contratos-obra/${contrato.id}/integrar-prefeitura`,
    `/contratos-obra/${contrato.id}/gerar-boleto`
  ];
  for (const route of forbiddenRoutes) {
    await expectHttpError(route, 404, { method: 'PATCH', body: JSON.stringify({ usuario_id: ctx.planejamento.id }) });
  }
  const deleteStatus = await requestStatus(`/contratos-obra/${contrato.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /contratos-obra/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem rotas proibidas ou DELETE fisico', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.7 contratos de obra concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem NFS-e real, prefeitura, boleto, banco, CNAB, pagamento ou DELETE fisico.`);
  console.table(results);
};

run()
  .catch((error) => {
    console.error('Smoke V3.7 contratos de obra falhou.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
