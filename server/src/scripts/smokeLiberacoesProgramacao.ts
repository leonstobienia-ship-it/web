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

interface Obra {
  id: string;
  company_id?: string;
}

interface CentroCusto {
  id: string;
  company_id?: string;
}

interface Usuario {
  id: string;
  company_id?: string;
  email: string;
  perfil_principal?: string | null;
}

interface Fornecedor {
  id: string;
  company_id?: string;
}

interface ContaPagar {
  id: string;
  numero_documento: string;
  status: string;
  aprovacao_status?: string | null;
  valor_aberto: string | number;
}

interface ProgramacaoPagamento {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
  liberacao_status?: string | null;
  liberado_por?: string | null;
  liberado_em?: string | null;
  liberacao_valor_total?: string | number | null;
  liberacao_quantidade_contas?: number | null;
  valor_total: string | number;
  quantidade_contas: number;
  contas?: Array<{ conta_pagar_id: string; status: string; valor_programado: string | number }>;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5E';

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const valueWithMargin = (value: number, factor: number): number => Number((value * factor).toFixed(2));

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

const pickByCompany = <T extends { company_id?: string }>(items: T[], companyId: string, label: string): T => {
  const item = items.find((entry) => entry.company_id === companyId) || items[0];
  if (!item) {
    throw new Error(`Nenhum registro encontrado em ${label}.`);
  }
  return item;
};

const findUsuario = (usuarios: Usuario[], email: string, perfil: string): Usuario => {
  const usuario = usuarios.find((item) => item.email === email) || usuarios.find((item) => item.perfil_principal === perfil);
  if (!usuario) {
    throw new Error(`Usuario seed ${email}/${perfil} nao encontrado.`);
  }
  return usuario;
};

const createContaAprovada = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  fornecedor: Fornecedor,
  aprovador: Usuario,
  valor: number,
  suffix: string
): Promise<ContaPagar> => {
  const stamp = `${Date.now()}-${suffix}`;
  const aprovacaoStatus = valor > 20000 ? 'APROVADO_DIRETORIA' : 'APROVADO_TECNICO';
  const pedido = await query<{ id: string }>(
    `
    insert into pedidos_compra (
      company_id,
      fornecedor_id,
      obra_id,
      centro_custo_id,
      numero,
      codigo,
      titulo,
      valor_total,
      data_emissao,
      status,
      aprovacao_status,
      aprovado_por,
      aprovado_em,
      aprovacao_observacoes,
      observacoes
    )
    values ($1, $2, $3, $4, $5, $5, $6, $7, $8, 'CONFIRMADO', $9, $10, now(), $11, $11)
    returning id
    `,
    [
      empresa.id,
      fornecedor.id,
      obra.id,
      centroCusto.id,
      `PC-${stamp}`,
      `${marker} - pedido ${suffix}`,
      valueWithMargin(valor, 1),
      today(),
      aprovacaoStatus,
      aprovador.id,
      `${marker} - pedido local para liberacao`
    ]
  );

  const nota = await query<{ id: string }>(
    `
    insert into notas_fiscais_entrada (
      company_id,
      pedido_id,
      fornecedor_id,
      obra_id,
      centro_custo_id,
      numero,
      serie,
      tipo_documento,
      data_emissao,
      data_entrada,
      valor_produtos,
      valor_total,
      status,
      aprovacao_status,
      aprovado_por,
      aprovado_em,
      aprovacao_observacoes,
      observacoes
    )
    values ($1, $2, $3, $4, $5, $6, 'V35E', 'NOTA_FISCAL', $7, $7, $8, $8, 'APROVADA', $9, $10, now(), $11, $11)
    returning id
    `,
    [
      empresa.id,
      pedido.rows[0].id,
      fornecedor.id,
      obra.id,
      centroCusto.id,
      `NF-${stamp}`,
      today(),
      valueWithMargin(valor, 1),
      aprovacaoStatus,
      aprovador.id,
      `${marker} - nota local para liberacao`
    ]
  );

  const conta = await query<ContaPagar>(
    `
    insert into contas_pagar (
      company_id,
      fornecedor_id,
      obra_id,
      centro_custo_id,
      vencimento,
      valor_original,
      saldo,
      status,
      nota_entrada_id,
      pedido_id,
      numero_documento,
      parcela,
      total_parcelas,
      data_emissao,
      data_vencimento,
      valor_aberto,
      forma_pagamento_prevista,
      observacoes,
      aprovacao_status,
      aprovado_por,
      aprovado_em,
      aprovacao_observacoes
    )
    values ($1, $2, $3, $4, $5, $6, $6, 'APROVADA', $7, $8, $9, 1, 1, $10, $5, $6, $11, $12, $13, $14, now(), $12)
    returning id, numero_documento, status, aprovacao_status, valor_aberto
    `,
    [
      empresa.id,
      fornecedor.id,
      obra.id,
      centroCusto.id,
      addDays(8),
      valueWithMargin(valor, 1),
      nota.rows[0].id,
      pedido.rows[0].id,
      `NF-${stamp}/V35E`,
      today(),
      `${marker} - forma prevista ${suffix}`,
      `${marker} - conta aprovada sem baixa`,
      aprovacaoStatus,
      aprovador.id
    ]
  );

  return conta.rows[0];
};

const createProgramacao = async (empresa: Empresa, usuario: Usuario, suffix: string): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>('/programacoes-pagamento', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      data_prevista: addDays(12),
      forma_pagamento_prevista: null,
      observacoes: `${marker} - rascunho ${suffix}`,
      justificativa: `${marker} - programacao para liberacao ${suffix}`,
      usuario_id: usuario.id
    })
  })).data;

const addConta = async (programacao: ProgramacaoPagamento, conta: ContaPagar, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/contas`, {
    method: 'POST',
    body: JSON.stringify({
      conta_pagar_id: conta.id,
      usuario_id: usuario.id,
      observacoes: `${marker} - incluir conta`
    })
  })).data;

const submeter = async (programacao: ProgramacaoPagamento, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/submeter`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      justificativa: `${marker} - submeter para aprovacao`
    })
  })).data;

const aprovar = async (programacao: ProgramacaoPagamento, usuario: Usuario, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/${action}`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - aprovar programacao`
    })
  })).data;

const liberar = async (programacao: ProgramacaoPagamento, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/liberar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      justificativa: `${marker} - liberacao final sem execucao financeira`
    })
  })).data;

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

  const empresas = (await requestJson<ApiListResponse<Empresa>>('/empresas')).data;
  const empresa = empresas.find((item) => item.cnpj === '00.000.000/0001-33') || empresas[0];
  if (!empresa) {
    throw new Error('Nenhuma empresa local encontrada.');
  }
  const obras = (await requestJson<ApiListResponse<Obra>>('/obras')).data;
  const centros = (await requestJson<ApiListResponse<CentroCusto>>('/centros-custo')).data;
  const usuarios = (await requestJson<ApiListResponse<Usuario>>('/usuarios')).data;
  const fornecedores = (await requestJson<ApiListResponse<Fornecedor>>('/fornecedores')).data.filter((fornecedor) => !fornecedor.company_id || fornecedor.company_id === empresa.id);
  if (fornecedores.length < 1) {
    throw new Error('Smoke V3.5E exige ao menos 1 fornecedor local.');
  }

  const obra = pickByCompany(obras, empresa.id, 'obras');
  const centroCusto = pickByCompany(centros, empresa.id, 'centros-custo');
  const fornecedor = pickByCompany(fornecedores, empresa.id, 'fornecedores');
  const leon = findUsuario(usuarios, 'leon.dev.v35b@enac.local', 'DIRETORIA');
  const matheus = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const davison = findUsuario(usuarios, 'davison.dev.v35b@enac.local', 'CAMPO');

  const contaRascunho = await createContaAprovada(empresa, obra, centroCusto, fornecedor, matheus, 1100, 'RASCUNHO');
  let programacaoRascunho = await createProgramacao(empresa, matheus, 'RASCUNHO');
  programacaoRascunho = await addConta(programacaoRascunho, contaRascunho, matheus);
  await expectHttpError(`/programacoes-pagamento/${programacaoRascunho.id}/liberar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - bloquear rascunho` })
  });
  results.push({ etapa: 'Rascunho nao pode ser liberado', ok: true, detalhe: 'HTTP 409' });

  programacaoRascunho = await submeter(programacaoRascunho, matheus);
  await expectHttpError(`/programacoes-pagamento/${programacaoRascunho.id}/liberar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - bloquear submetida` })
  });
  results.push({ etapa: 'Submetida nao pode ser liberada', ok: true, detalhe: 'HTTP 409' });

  programacaoRascunho = await aprovar(programacaoRascunho, matheus, 'aprovar-tecnico');
  programacaoRascunho = await liberar(programacaoRascunho, matheus);
  if (programacaoRascunho.status !== 'LIBERADA' || programacaoRascunho.liberacao_status !== 'LIBERADA') {
    throw new Error(`Liberacao retornou status ${programacaoRascunho.status}/${programacaoRascunho.liberacao_status}, esperado LIBERADA/LIBERADA.`);
  }
  const contaLiberada = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaRascunho.id}`)).data;
  if (contaLiberada.status === 'PAGA' || Number(contaLiberada.valor_aberto) !== Number(contaRascunho.valor_aberto)) {
    throw new Error('Liberacao executou pagamento ou alterou valor aberto da conta.');
  }
  results.push({ etapa: 'Programacao aprovada liberada', ok: true, detalhe: programacaoRascunho.codigo });

  const contaAlta = await createContaAprovada(empresa, obra, centroCusto, fornecedor, leon, 25000, 'ALTA');
  let programacaoAlta = await createProgramacao(empresa, matheus, 'ALTA');
  programacaoAlta = await addConta(programacaoAlta, contaAlta, matheus);
  programacaoAlta = await submeter(programacaoAlta, matheus);
  programacaoAlta = await aprovar(programacaoAlta, leon, 'aprovar-diretoria');
  await expectHttpError(`/programacoes-pagamento/${programacaoAlta.id}/liberar`, 403, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - bloquear liberacao acima alcada` })
  });
  results.push({ etapa: 'Usuario sem alcada suficiente bloqueado', ok: true, detalhe: 'HTTP 403' });

  programacaoAlta = await liberar(programacaoAlta, leon);
  if (programacaoAlta.status !== 'LIBERADA' || programacaoAlta.liberacao_status !== 'LIBERADA') {
    throw new Error('Diretoria nao liberou programacao acima de 20k.');
  }
  const contaAltaApos = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaAlta.id}`)).data;
  if (contaAltaApos.status === 'PAGA' || Number(contaAltaApos.valor_aberto) !== Number(contaAlta.valor_aberto)) {
    throw new Error('Liberacao acima de 20k executou pagamento ou alterou valor aberto.');
  }
  results.push({ etapa: 'Diretoria libera acima de 20k sem baixa', ok: true, detalhe: programacaoAlta.codigo });

  const contaCancelada = await createContaAprovada(empresa, obra, centroCusto, fornecedor, matheus, 1300, 'CANCELADA');
  let programacaoCancelada = await createProgramacao(empresa, matheus, 'CANCELADA');
  programacaoCancelada = await addConta(programacaoCancelada, contaCancelada, matheus);
  programacaoCancelada = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoCancelada.id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - cancelamento logico` })
  })).data;
  if (programacaoCancelada.status !== 'CANCELADA') {
    throw new Error('Programacao cancelada nao ficou em CANCELADA.');
  }
  await expectHttpError(`/programacoes-pagamento/${programacaoCancelada.id}/liberar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - bloquear cancelada` })
  });
  results.push({ etapa: 'Cancelada nao pode ser liberada', ok: true, detalhe: 'HTTP 409' });

  for (const route of [
    `/programacoes-pagamento/${programacaoAlta.id}/pagar`,
    `/programacoes-pagamento/${programacaoAlta.id}/baixar`,
    `/programacoes-pagamento/${programacaoAlta.id}/gerar-cnab`,
    `/programacoes-pagamento/${programacaoAlta.id}/executar-pagamento`
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  const deleteStatus = await requestStatus(`/programacoes-pagamento/${programacaoAlta.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /programacoes-pagamento/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem rotas proibidas ou DELETE', ok: true, detalhe: 'HTTP 404/405' });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'programacao_pagamento'
      and acao in ('liberar', 'bloquear_liberacao')
      and payload::text like $1
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 2) {
    throw new Error('Auditoria de liberacao nao registrou liberacao e bloqueio esperados.');
  }
  results.push({ etapa: 'Auditoria de liberacao registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  const liberacoes = await requestJson<ApiListResponse<unknown>>(`/programacoes-pagamento/${programacaoAlta.id}/liberacoes`);
  if (liberacoes.data.length < 2) {
    throw new Error('Historico de liberacoes nao retornou bloqueio e liberacao.');
  }
  results.push({ etapa: 'Historico de liberacoes consultado', ok: true, detalhe: `${liberacoes.data.length} registro(s)` });

  void davison;
  console.info(`Smoke V3.5E liberacoes de programacao concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa, integracao bancaria, CNAB ou DELETE fisico.`);
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
