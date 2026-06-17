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
}

interface OrcamentoPacote {
  id: string;
  codigo: string;
  status: string;
}

interface OrcamentoItem {
  id: string;
  codigo?: string | null;
  tipo: string;
  status: string;
}

interface OrcamentoCronograma {
  id: string;
  competencia: string;
  status: string;
}

interface OrcamentoObra {
  id: string;
  codigo: string;
  status: string;
  valor_previsto_total: string | number;
  valor_material: string | number;
  valor_mao_obra: string | number;
  contrato_obra_id?: string | null;
  pacotes?: OrcamentoPacote[];
  itens?: OrcamentoItem[];
  cronograma?: OrcamentoCronograma[];
}

interface OrcamentoResumo {
  valor_previsto_total: string | number;
  valor_total_contratado?: string | number | null;
  diferenca_contrato_orcamento?: string | number | null;
  total_cronograma: string | number;
  totais_por_tipo?: Array<{ tipo: string; valor_total: string | number }>;
  totais_por_pacote?: Array<{ pacote_codigo: string; valor_total: string | number }>;
}

interface PlanejamentoExecutivo {
  id: string;
  etapa: string;
  status: string;
  orcamento_id?: string | null;
  contrato_obra_id?: string | null;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_8';

const uniqueCpfCnpj = (prefix: string, stamp: number): string => `${prefix}${String(stamp).slice(-11).padStart(11, '0')}`;

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const competenciaAtual = (): string => today().slice(0, 7);

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
    [empresa.id, `CC-${marker}-${stamp}`, `${marker} - Centro orcamento`, `${marker} - centro para smoke`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Cliente ${stamp}`, uniqueCpfCnpj('380', stamp), `${marker} - cliente local`]
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

const ensureActiveContrato = async (ctx: SeedContext): Promise<ContratoObra> => {
  let contrato = (await requestJson<ApiItemResponse<ContratoObra>>('/contratos-obra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      cliente_id: ctx.clienteId,
      obra_id: ctx.obraId,
      centro_custo_id: ctx.centroCustoId,
      numero: `CT-${marker}-${Date.now()}`,
      objeto: `${marker} - contrato para orcamento`,
      escopo_resumo: `${marker} - escopo comercial base`,
      valor_original: 25000,
      data_inicio: today(),
      data_fim: addDays(120),
      observacoes: `${marker} - contrato local sem fiscal/banco`,
      usuario_id: ctx.planejamento.id
    })
  })).data;

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: 'ESCOPO-ORC',
      descricao: `${marker} - escopo para orcamento`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario: 25000,
      centro_custo_id: ctx.centroCustoId,
      etapa_servico: `${marker} - etapa base`,
      usuario_id: ctx.planejamento.id
    })
  })).data;

  contrato = (await requestJson<ApiItemResponse<ContratoObra>>(`/contratos-obra/${contrato.id}/ativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - ativacao local`
    })
  })).data;

  if (contrato.status !== 'ATIVO') {
    throw new Error('Contrato de apoio nao foi ativado.');
  }

  return contrato;
};

const findPacote = (orcamento: OrcamentoObra, codigo: string): OrcamentoPacote => {
  const pacote = orcamento.pacotes?.find((item) => item.codigo === codigo);
  if (!pacote) {
    throw new Error(`Pacote ${codigo} nao retornado.`);
  }
  return pacote;
};

const findItem = (orcamento: OrcamentoObra, codigo: string): OrcamentoItem => {
  const item = orcamento.itens?.find((entry) => entry.codigo === codigo);
  if (!item) {
    throw new Error(`Item ${codigo} nao retornado.`);
  }
  return item;
};

const findCronograma = (orcamento: OrcamentoObra, competencia: string): OrcamentoCronograma => {
  const cronograma = orcamento.cronograma?.find((entry) => entry.competencia === competencia);
  if (!cronograma) {
    throw new Error(`Cronograma ${competencia} nao retornado.`);
  }
  return cronograma;
};

const run = async (): Promise<void> => {
  const results: SmokeResult[] = [];

  const health = await requestJson<{ status: string }>('/health');
  if (health.status !== 'ok') throw new Error('/health nao retornou status ok.');
  const healthDb = await requestJson<{ database?: { connected?: boolean; name?: string } }>('/health/db');
  if (healthDb.database?.connected !== true || healthDb.database.name !== 'enac_erp_dev') {
    throw new Error('/health/db nao confirmou PostgreSQL local enac_erp_dev.');
  }
  results.push({ etapa: 'Health local', ok: true, detalhe: 'API e PostgreSQL ok' });

  const ctx = await ensureSeedContext();
  const contrato = await ensureActiveContrato(ctx);

  let orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>('/orcamentos-obra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      contrato_obra_id: contrato.id,
      centro_custo_id: ctx.centroCustoId,
      codigo: `ORC-${marker}-${Date.now()}`,
      versao: 'V1',
      descricao: `${marker} - orcamento base executivo`,
      competencia_base: competenciaAtual(),
      margem_prevista_percentual: 18,
      observacoes: `${marker} - orcamento local sem NFS-e, boleto, banco ou CNAB`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  if (orcamento.status !== 'RASCUNHO' || orcamento.contrato_obra_id !== contrato.id) {
    throw new Error('Orcamento nao nasceu em rascunho vinculado ao contrato.');
  }
  results.push({ etapa: 'Criar orcamento base em rascunho', ok: true, detalhe: orcamento.codigo });

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/pacotes`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: 'PAC-01',
      nome: `${marker} - Fundacoes`,
      descricao: `${marker} - pacote de fundacoes`,
      etapa: 'Fundacoes',
      centro_custo_id: ctx.centroCustoId,
      ordem: 1,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const pacote = findPacote(orcamento, 'PAC-01');
  results.push({ etapa: 'Criar pacote orcamentario', ok: true, detalhe: pacote.codigo });

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/pacotes`, {
    method: 'POST',
    body: JSON.stringify({
      codigo: 'PAC-INATIVO',
      nome: `${marker} - pacote a inativar`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const pacoteInativar = findPacote(orcamento, 'PAC-INATIVO');
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/pacotes/${pacoteInativar.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      motivo: `${marker} - inativacao logica`
    })
  })).data;

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      centro_custo_id: ctx.centroCustoId,
      tipo: 'MATERIAL',
      codigo: 'MAT-01',
      descricao: `${marker} - concreto previsto`,
      unidade: 'm3',
      quantidade: 10,
      valor_unitario_previsto: 1000,
      insumo_descricao: `${marker} - insumo material`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      centro_custo_id: ctx.centroCustoId,
      tipo: 'MAO_DE_OBRA',
      codigo: 'MO-01',
      descricao: `${marker} - equipe prevista`,
      unidade: 'h',
      quantidade: 100,
      valor_unitario_previsto: 50,
      mao_obra_categoria: `${marker} - equipe civil`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      tipo: 'OUTROS',
      codigo: 'INATIVAR-ITEM',
      descricao: `${marker} - item a inativar`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario_previsto: 1,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const itemInativar = findItem(orcamento, 'INATIVAR-ITEM');
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/itens/${itemInativar.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      motivo: `${marker} - inativacao logica`
    })
  })).data;
  if (Number(orcamento.valor_previsto_total) !== 15000) {
    throw new Error(`Total previsto esperado 15000, obtido ${orcamento.valor_previsto_total}.`);
  }
  results.push({ etapa: 'Criar itens e calcular totais', ok: true, detalhe: `total ${orcamento.valor_previsto_total}` });

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/cronograma`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      competencia: competenciaAtual(),
      valor_previsto: 7000,
      percentual_fisico_previsto: 45,
      observacoes: `${marker} - mes 1`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/cronograma`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      competencia: addDays(35).slice(0, 7),
      valor_previsto: 8000,
      percentual_fisico_previsto: 55,
      observacoes: `${marker} - mes 2`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/cronograma`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacote.id,
      competencia: addDays(70).slice(0, 7),
      valor_previsto: 1,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  const cronogramaInativar = findCronograma(orcamento, addDays(70).slice(0, 7));
  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/cronograma/${cronogramaInativar.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      motivo: `${marker} - inativacao logica`
    })
  })).data;
  results.push({ etapa: 'Criar cronograma fisico-financeiro', ok: true, detalhe: `${orcamento.cronograma?.length || 0} linha(s)` });

  const resumo = (await requestJson<ApiItemResponse<OrcamentoResumo>>(`/orcamentos-obra/${orcamento.id}/resumo`)).data;
  if (Number(resumo.valor_previsto_total) !== 15000 || Number(resumo.total_cronograma) !== 15000) {
    throw new Error('Resumo nao consolidou totais do orcamento e cronograma.');
  }
  results.push({ etapa: 'Resumo previsto x realizado local', ok: true, detalhe: `contrato-orcamento ${resumo.diferenca_contrato_orcamento}` });

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/enviar-revisao`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - enviar revisao`
    })
  })).data;
  if (orcamento.status !== 'EM_REVISAO') throw new Error('Orcamento nao entrou em revisao.');
  results.push({ etapa: 'Enviar orcamento para revisao', ok: true, detalhe: orcamento.status });

  orcamento = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamento.id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - aprovacao local`
    })
  })).data;
  if (orcamento.status !== 'APROVADO') throw new Error('Orcamento nao foi aprovado.');
  results.push({ etapa: 'Aprovar orcamento vigente', ok: true, detalhe: orcamento.status });

  const vigente = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/obras/${ctx.obraId}/orcamento-vigente`)).data;
  if (vigente.id !== orcamento.id) throw new Error('Consulta de orcamento vigente nao retornou o orcamento aprovado.');
  results.push({ etapa: 'Consultar orcamento vigente por obra', ok: true, detalhe: vigente.codigo });

  let orcamentoDuplicado = (await requestJson<ApiItemResponse<OrcamentoObra>>('/orcamentos-obra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      contrato_obra_id: contrato.id,
      codigo: `ORC-DUP-${marker}-${Date.now()}`,
      versao: 'V2',
      descricao: `${marker} - duplicado para bloqueio`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamentoDuplicado = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamentoDuplicado.id}/pacotes`, {
    method: 'POST',
    body: JSON.stringify({ codigo: 'PAC-DUP', nome: `${marker} - dup`, usuario_id: ctx.planejamento.id })
  })).data;
  const pacoteDup = findPacote(orcamentoDuplicado, 'PAC-DUP');
  orcamentoDuplicado = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamentoDuplicado.id}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      pacote_id: pacoteDup.id,
      tipo: 'SERVICO',
      descricao: `${marker} - servico duplicado`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario_previsto: 1,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  orcamentoDuplicado = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamentoDuplicado.id}/cronograma`, {
    method: 'POST',
    body: JSON.stringify({ competencia: competenciaAtual(), valor_previsto: 1, usuario_id: ctx.planejamento.id })
  })).data;
  orcamentoDuplicado = (await requestJson<ApiItemResponse<OrcamentoObra>>(`/orcamentos-obra/${orcamentoDuplicado.id}/enviar-revisao`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.planejamento.id })
  })).data;
  await expectHttpError(`/orcamentos-obra/${orcamentoDuplicado.id}/aprovar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.planejamento.id })
  });
  results.push({ etapa: 'Bloquear segundo orcamento vigente', ok: true, detalhe: 'HTTP 409' });

  let planejamento = (await requestJson<ApiItemResponse<PlanejamentoExecutivo>>('/planejamento-executivo', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      orcamento_id: orcamento.id,
      contrato_obra_id: contrato.id,
      centro_custo_id: ctx.centroCustoId,
      etapa: `${marker} - mobilizacao executiva`,
      descricao: `${marker} - planejamento local`,
      data_inicio_prevista: today(),
      data_fim_prevista: addDays(45),
      responsavel_id: ctx.planejamento.id,
      observacoes: `${marker} - sem banco, fiscal ou CNAB`,
      usuario_id: ctx.planejamento.id
    })
  })).data;
  if (planejamento.status !== 'RASCUNHO' || planejamento.orcamento_id !== orcamento.id) {
    throw new Error('Planejamento nao nasceu em rascunho vinculado ao orcamento.');
  }
  results.push({ etapa: 'Criar planejamento executivo', ok: true, detalhe: planejamento.etapa });

  planejamento = (await requestJson<ApiItemResponse<PlanejamentoExecutivo>>(`/planejamento-executivo/${planejamento.id}/ativar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.planejamento.id, observacoes: `${marker} - ativar` })
  })).data;
  if (planejamento.status !== 'ATIVO') throw new Error('Planejamento nao foi ativado.');
  planejamento = (await requestJson<ApiItemResponse<PlanejamentoExecutivo>>(`/planejamento-executivo/${planejamento.id}/revisar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.planejamento.id, motivo: `${marker} - revisao controlada` })
  })).data;
  if (planejamento.status !== 'REVISADO') throw new Error('Planejamento nao foi revisado.');
  planejamento = (await requestJson<ApiItemResponse<PlanejamentoExecutivo>>(`/planejamento-executivo/${planejamento.id}/encerrar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: ctx.planejamento.id, motivo: `${marker} - encerramento controlado` })
  })).data;
  if (planejamento.status !== 'ENCERRADO') throw new Error('Planejamento nao foi encerrado.');
  results.push({ etapa: 'Ativar, revisar e encerrar planejamento', ok: true, detalhe: planejamento.status });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where payload->>'marker' = $1
      and entidade in ('orcamento_obra', 'orcamento_obra_pacote', 'orcamento_obra_item', 'orcamento_obra_cronograma', 'planejamento_executivo')
    `,
    [marker]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 10) {
    throw new Error('Auditoria V3.8 nao foi registrada como esperado.');
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  const forbiddenRoutes = [
    `/orcamentos-obra/${orcamento.id}/pagar`,
    `/orcamentos-obra/${orcamento.id}/gerar-cnab`,
    `/orcamentos-obra/${orcamento.id}/executar-pagamento`,
    `/orcamentos-obra/${orcamento.id}/integracao-bancaria`,
    `/orcamentos-obra/${orcamento.id}/emitir-nfse`,
    `/orcamentos-obra/${orcamento.id}/integrar-prefeitura`,
    `/orcamentos-obra/${orcamento.id}/gerar-boleto`
  ];
  for (const route of forbiddenRoutes) {
    await expectHttpError(route, 404, { method: 'PATCH', body: JSON.stringify({ usuario_id: ctx.planejamento.id }) });
  }
  const deleteOrcamentoStatus = await requestStatus(`/orcamentos-obra/${orcamento.id}`, { method: 'DELETE' });
  const deletePlanejamentoStatus = await requestStatus(`/planejamento-executivo/${planejamento.id}`, { method: 'DELETE' });
  if (deleteOrcamentoStatus !== 405 || deletePlanejamentoStatus !== 405) {
    throw new Error(`DELETE retornou ${deleteOrcamentoStatus}/${deletePlanejamentoStatus}, esperado 405/405.`);
  }
  results.push({ etapa: 'Sem rotas proibidas ou DELETE fisico', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.8 orcamento e planejamento concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem NFS-e real, prefeitura, boleto, banco, CNAB, pagamento ou DELETE fisico.`);
  console.table(results);
};

run()
  .catch((error) => {
    console.error('Smoke V3.8 orcamento e planejamento falhou.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
