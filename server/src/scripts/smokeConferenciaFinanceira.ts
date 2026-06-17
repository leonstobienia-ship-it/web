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
  conferencia_status?: string | null;
  conferido_por?: string | null;
  conferido_em?: string | null;
  conferencia_valor_total?: string | number | null;
  conferencia_quantidade_contas?: number | null;
  valor_total: string | number;
  quantidade_contas: number;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5F';

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const valueWithMargin = (value: number, factor: number): number => Number((value * factor).toFixed(2));

const checklist = {
  fornecedor_conferido: true,
  documento_fiscal_conferido: true,
  valor_conferido: true,
  vencimento_conferido: true,
  obra_conferida: true,
  centro_custo_conferido: true,
  forma_pagamento_prevista_conferida: true,
  ressalva: false
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
    values ($1, $2, $3, $4, $5, $5, $6, $7, $8, 'CONFIRMADO', 'APROVADO_TECNICO', $9, now(), $10, $10)
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
      aprovador.id,
      `${marker} - pedido local pre-baixa`
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
    values ($1, $2, $3, $4, $5, $6, 'V35F', 'NOTA_FISCAL', $7, $7, $8, $8, 'APROVADA', 'APROVADO_TECNICO', $9, now(), $10, $10)
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
      aprovador.id,
      `${marker} - nota local pre-baixa`
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
    values ($1, $2, $3, $4, $5, $6, $6, 'APROVADA', $7, $8, $9, 1, 1, $10, $5, $6, $11, $12, 'APROVADO_TECNICO', $13, now(), $12)
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
      `NF-${stamp}/V35F`,
      today(),
      `${marker} - forma prevista ${suffix}`,
      `${marker} - conta aprovada sem baixa`,
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
      justificativa: `${marker} - programacao para conferencia ${suffix}`,
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

const aprovar = async (programacao: ProgramacaoPagamento, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/aprovar-tecnico`, {
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

const conferir = async (programacao: ProgramacaoPagamento, usuario: Usuario, observacoes = `${marker} - conferencia final`): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/conferir-financeiro`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes,
      checklist
    })
  })).data;

const devolverConferencia = async (programacao: ProgramacaoPagamento, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/devolver-conferencia`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - devolver conferencia para ajuste`
    })
  })).data;

const prepararProgramacaoLiberada = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  fornecedor: Fornecedor,
  usuario: Usuario,
  valor: number,
  suffix: string
): Promise<{ conta: ContaPagar; programacao: ProgramacaoPagamento }> => {
  const conta = await createContaAprovada(empresa, obra, centroCusto, fornecedor, usuario, valor, suffix);
  let programacao = await createProgramacao(empresa, usuario, suffix);
  programacao = await addConta(programacao, conta, usuario);
  programacao = await submeter(programacao, usuario);
  programacao = await aprovar(programacao, usuario);
  programacao = await liberar(programacao, usuario);
  return { conta, programacao };
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
    throw new Error('Smoke V3.5F exige ao menos 1 fornecedor local.');
  }

  const obra = pickByCompany(obras, empresa.id, 'obras');
  const centroCusto = pickByCompany(centros, empresa.id, 'centros-custo');
  const fornecedor = pickByCompany(fornecedores, empresa.id, 'fornecedores');
  const matheus = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const davison = findUsuario(usuarios, 'davison.dev.v35b@enac.local', 'CAMPO');

  const contaRascunho = await createContaAprovada(empresa, obra, centroCusto, fornecedor, matheus, 1050, 'RASCUNHO');
  let programacaoRascunho = await createProgramacao(empresa, matheus, 'RASCUNHO');
  programacaoRascunho = await addConta(programacaoRascunho, contaRascunho, matheus);
  await expectHttpError(`/programacoes-pagamento/${programacaoRascunho.id}/conferir-financeiro`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, observacoes: `${marker} - bloquear rascunho`, checklist })
  });
  results.push({ etapa: 'Programacao nao liberada nao pode ser conferida', ok: true, detalhe: 'HTTP 409' });

  const { conta: contaConferencia, programacao: programacaoLiberada } = await prepararProgramacaoLiberada(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    1800,
    'CONFERIR'
  );
  const programacaoConferida = await conferir(programacaoLiberada, matheus, `${marker} - conferencia permitida`);
  if (programacaoConferida.status !== 'LIBERADA' || programacaoConferida.conferencia_status !== 'CONFERIDA' || !programacaoConferida.conferido_em) {
    throw new Error(`Conferencia retornou ${programacaoConferida.status}/${programacaoConferida.conferencia_status}, esperado LIBERADA/CONFERIDA.`);
  }
  const contaConferida = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaConferencia.id}`)).data;
  if (contaConferida.status === 'PAGA' || Number(contaConferida.valor_aberto) !== Number(contaConferencia.valor_aberto)) {
    throw new Error('Conferencia executou pagamento, baixa ou alterou valor aberto da conta.');
  }
  results.push({ etapa: 'Programacao liberada pode ser conferida', ok: true, detalhe: programacaoConferida.codigo });

  const contaCancelada = await createContaAprovada(empresa, obra, centroCusto, fornecedor, matheus, 1200, 'CANCELADA');
  let programacaoCancelada = await createProgramacao(empresa, matheus, 'CANCELADA');
  programacaoCancelada = await addConta(programacaoCancelada, contaCancelada, matheus);
  programacaoCancelada = (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacaoCancelada.id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, justificativa: `${marker} - cancelamento logico` })
  })).data;
  if (programacaoCancelada.status !== 'CANCELADA') {
    throw new Error('Programacao cancelada nao ficou em CANCELADA.');
  }
  await expectHttpError(`/programacoes-pagamento/${programacaoCancelada.id}/conferir-financeiro`, 409, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: matheus.id, observacoes: `${marker} - bloquear cancelada`, checklist })
  });
  results.push({ etapa: 'Programacao cancelada nao pode ser conferida', ok: true, detalhe: 'HTTP 409' });

  const { programacao: programacaoSemEscopo } = await prepararProgramacaoLiberada(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    1600,
    'SEM-ESCOPO'
  );
  await expectHttpError(`/programacoes-pagamento/${programacaoSemEscopo.id}/conferir-financeiro`, 403, {
    method: 'PATCH',
    body: JSON.stringify({ usuario_id: davison.id, observacoes: `${marker} - bloquear usuario sem escopo`, checklist })
  });
  results.push({ etapa: 'Usuario sem permissao de conferencia bloqueado', ok: true, detalhe: 'HTTP 403' });

  const { conta: contaDevolvida, programacao: programacaoParaDevolver } = await prepararProgramacaoLiberada(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    1700,
    'DEVOLVER'
  );
  const programacaoDevolvida = await devolverConferencia(programacaoParaDevolver, matheus);
  if (programacaoDevolvida.status !== 'LIBERADA' || programacaoDevolvida.conferencia_status !== 'DEVOLVIDA') {
    throw new Error(`Devolucao retornou ${programacaoDevolvida.status}/${programacaoDevolvida.conferencia_status}, esperado LIBERADA/DEVOLVIDA.`);
  }
  const contaDevolvidaApos = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${contaDevolvida.id}`)).data;
  if (contaDevolvidaApos.status === 'PAGA' || Number(contaDevolvidaApos.valor_aberto) !== Number(contaDevolvida.valor_aberto)) {
    throw new Error('Devolucao de conferencia executou pagamento, baixa ou alterou valor aberto.');
  }
  results.push({ etapa: 'Conferencia pode ser devolvida sem baixa', ok: true, detalhe: programacaoDevolvida.codigo });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'programacao_pagamento'
      and acao in ('conferir_financeiro', 'bloquear_conferencia')
      and payload::text like $1
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 2) {
    throw new Error('Auditoria de conferencia nao registrou sucesso e bloqueio esperados.');
  }
  results.push({ etapa: 'Auditoria de conferencia registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  const conferencias = await requestJson<ApiListResponse<unknown>>(`/programacoes-pagamento/${programacaoConferida.id}/conferencias`);
  if (conferencias.data.length < 1) {
    throw new Error('Historico de conferencias nao retornou registro da conferencia.');
  }
  results.push({ etapa: 'Historico de conferencias consultado', ok: true, detalhe: `${conferencias.data.length} registro(s)` });

  for (const route of [
    `/programacoes-pagamento/${programacaoConferida.id}/pagar`,
    `/programacoes-pagamento/${programacaoConferida.id}/baixar`,
    `/programacoes-pagamento/${programacaoConferida.id}/gerar-cnab`,
    `/programacoes-pagamento/${programacaoConferida.id}/executar-pagamento`,
    `/programacoes-pagamento/${programacaoConferida.id}/integracao-bancaria`
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  const deleteStatus = await requestStatus(`/programacoes-pagamento/${programacaoConferida.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /programacoes-pagamento/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem rotas proibidas ou DELETE', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.5F conferencia financeira concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa, integracao bancaria, CNAB ou DELETE fisico.`);
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
