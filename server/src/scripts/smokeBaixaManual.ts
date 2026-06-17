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
  baixa_status?: string | null;
  valor_original: string | number;
  valor_aberto: string | number;
  saldo?: string | number;
}

interface ProgramacaoPagamento {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
  liberacao_status?: string | null;
  conferencia_status?: string | null;
  valor_total: string | number;
  quantidade_contas: number;
}

interface BaixaHistorico {
  id: string;
  acao: string;
  baixa_status: string;
  resultado: string;
  valor_baixado: string | number;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5G';

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const money = (value: number): number => Number(value.toFixed(2));

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
      money(valor),
      today(),
      aprovacaoStatus,
      aprovador.id,
      `${marker} - pedido local para baixa manual`
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
    values ($1, $2, $3, $4, $5, $6, 'V35G', 'NOTA_FISCAL', $7, $7, $8, $8, 'APROVADA', $9, $10, now(), $11, $11)
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
      money(valor),
      aprovacaoStatus,
      aprovador.id,
      `${marker} - nota local para baixa manual`
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
    returning id, numero_documento, status, aprovacao_status, valor_original, valor_aberto, saldo
    `,
    [
      empresa.id,
      fornecedor.id,
      obra.id,
      centroCusto.id,
      addDays(8),
      money(valor),
      nota.rows[0].id,
      pedido.rows[0].id,
      `NF-${stamp}/V35G`,
      today(),
      `${marker} - forma manual prevista ${suffix}`,
      `${marker} - conta aprovada para baixa manual`,
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
      justificativa: `${marker} - programacao local ${suffix}`,
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
      justificativa: `${marker} - submeter`
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
      justificativa: `${marker} - liberacao sem execucao financeira`
    })
  })).data;

const conferir = async (programacao: ProgramacaoPagamento, usuario: Usuario): Promise<ProgramacaoPagamento> =>
  (await requestJson<ApiItemResponse<ProgramacaoPagamento>>(`/programacoes-pagamento/${programacao.id}/conferir-financeiro`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - conferencia final pre-baixa`,
      checklist
    })
  })).data;

const prepararProgramacaoConferida = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  fornecedor: Fornecedor,
  financeiro: Usuario,
  diretoria: Usuario,
  valor: number,
  suffix: string
): Promise<{ conta: ContaPagar; programacao: ProgramacaoPagamento }> => {
  const responsavelAlcada = valor > 20000 ? diretoria : financeiro;
  const conta = await createContaAprovada(empresa, obra, centroCusto, fornecedor, responsavelAlcada, valor, suffix);
  let programacao = await createProgramacao(empresa, financeiro, suffix);
  programacao = await addConta(programacao, conta, financeiro);
  programacao = await submeter(programacao, financeiro);
  programacao = await aprovar(programacao, responsavelAlcada, valor > 20000 ? 'aprovar-diretoria' : 'aprovar-tecnico');
  programacao = await liberar(programacao, responsavelAlcada);
  programacao = await conferir(programacao, responsavelAlcada);
  if (programacao.status !== 'LIBERADA' || programacao.liberacao_status !== 'LIBERADA' || programacao.conferencia_status !== 'CONFERIDA') {
    throw new Error(`Programacao ${programacao.codigo} nao ficou LIBERADA/CONFERIDA.`);
  }
  return { conta, programacao };
};

const baixarManual = async (conta: ContaPagar, usuario: Usuario, valor = Number(conta.valor_aberto)): Promise<ContaPagar> =>
  (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${conta.id}/baixar-manual`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      data_baixa: today(),
      valor_baixado: money(valor),
      forma_pagamento_manual: `${marker} - registro manual local`,
      observacoes: `${marker} - baixa manual controlada sem banco`,
      referencia_anexo: `${marker}-anexo-futuro`
    })
  })).data;

const estornarBaixa = async (conta: ContaPagar, usuario: Usuario): Promise<ContaPagar> =>
  (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${conta.id}/estornar-baixa`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - estorno administrativo controlado`
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
  const obra = pickByCompany(obras, empresa.id, 'obras');
  const centroCusto = pickByCompany(centros, empresa.id, 'centros-custo');
  const fornecedor = pickByCompany(fornecedores, empresa.id, 'fornecedores');
  const leon = findUsuario(usuarios, 'leon.dev.v35b@enac.local', 'DIRETORIA');
  const matheus = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const davison = findUsuario(usuarios, 'davison.dev.v35b@enac.local', 'CAMPO');

  const contaSemConferencia = await createContaAprovada(empresa, obra, centroCusto, fornecedor, matheus, 1100, 'SEM-CONFERENCIA');
  await expectHttpError(`/contas-pagar/${contaSemConferencia.id}/baixar-manual`, 409, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      data_baixa: today(),
      valor_baixado: Number(contaSemConferencia.valor_aberto),
      forma_pagamento_manual: `${marker} - bloqueio sem conferencia`,
      observacoes: `${marker} - conta sem programacao conferida`
    })
  });
  results.push({ etapa: 'Conta nao conferida nao pode ser baixada', ok: true, detalhe: 'HTTP 409' });

  const { conta: contaBaixa, programacao: programacaoBaixa } = await prepararProgramacaoConferida(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    leon,
    1800,
    'BAIXA'
  );
  const contaBaixada = await baixarManual(contaBaixa, matheus);
  if (contaBaixada.status !== 'BAIXADA_MANUAL' || contaBaixada.baixa_status !== 'BAIXADA_MANUAL' || Number(contaBaixada.valor_aberto) !== 0 || Number(contaBaixada.saldo || 0) !== 0) {
    throw new Error(`Baixa manual retornou status/saldo invalido: ${contaBaixada.status}/${contaBaixada.baixa_status}/${contaBaixada.valor_aberto}.`);
  }
  if (String(contaBaixada.status) === 'PAGA') {
    throw new Error('Baixa manual marcou conta como PAGA.');
  }
  results.push({ etapa: 'Conta aprovada, liberada e conferida pode ser baixada', ok: true, detalhe: programacaoBaixa.codigo });

  await expectHttpError(`/contas-pagar/${contaBaixa.id}/baixar-manual`, 409, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      data_baixa: today(),
      valor_baixado: Number(contaBaixa.valor_aberto),
      forma_pagamento_manual: `${marker} - duplicada`,
      observacoes: `${marker} - tentativa duplicada`
    })
  });
  results.push({ etapa: 'Conta ja baixada nao pode ser duplicada', ok: true, detalhe: 'HTTP 409' });

  const { conta: contaDivergente } = await prepararProgramacaoConferida(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    leon,
    1900,
    'VALOR-DIVERGENTE'
  );
  await expectHttpError(`/contas-pagar/${contaDivergente.id}/baixar-manual`, 409, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      data_baixa: today(),
      valor_baixado: Number(contaDivergente.valor_aberto) - 1,
      forma_pagamento_manual: `${marker} - valor divergente`,
      observacoes: `${marker} - baixa parcial bloqueada`
    })
  });
  results.push({ etapa: 'Valor divergente ou parcial e bloqueado', ok: true, detalhe: 'HTTP 409' });

  const { conta: contaSemPermissao } = await prepararProgramacaoConferida(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    leon,
    1700,
    'SEM-PERMISSAO'
  );
  await expectHttpError(`/contas-pagar/${contaSemPermissao.id}/baixar-manual`, 403, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: davison.id,
      data_baixa: today(),
      valor_baixado: Number(contaSemPermissao.valor_aberto),
      forma_pagamento_manual: `${marker} - usuario sem escopo`,
      observacoes: `${marker} - bloquear usuario sem alcada`
    })
  });
  results.push({ etapa: 'Usuario sem permissao de baixa bloqueado', ok: true, detalhe: 'HTTP 403' });

  const { conta: contaAlta } = await prepararProgramacaoConferida(
    empresa,
    obra,
    centroCusto,
    fornecedor,
    matheus,
    leon,
    25000,
    'DIRETORIA'
  );
  await expectHttpError(`/contas-pagar/${contaAlta.id}/baixar-manual`, 403, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      data_baixa: today(),
      valor_baixado: Number(contaAlta.valor_aberto),
      forma_pagamento_manual: `${marker} - acima 20k financeiro`,
      observacoes: `${marker} - bloquear acima de 20k`
    })
  });
  const contaAltaBaixada = await baixarManual(contaAlta, leon);
  if (contaAltaBaixada.status !== 'BAIXADA_MANUAL' || contaAltaBaixada.baixa_status !== 'BAIXADA_MANUAL') {
    throw new Error('DIRETORIA nao conseguiu registrar baixa manual acima de 20k.');
  }
  results.push({ etapa: 'DIRETORIA baixa acima de 20k', ok: true, detalhe: 'Financeiro bloqueado e Diretoria permitida' });

  const contaEstornada = await estornarBaixa(contaBaixada, matheus);
  if (contaEstornada.status !== 'APROVADA' || contaEstornada.baixa_status !== 'BAIXA_ESTORNADA' || Number(contaEstornada.valor_aberto) <= 0) {
    throw new Error(`Estorno retornou estado invalido: ${contaEstornada.status}/${contaEstornada.baixa_status}/${contaEstornada.valor_aberto}.`);
  }
  const historico = (await requestJson<ApiListResponse<BaixaHistorico>>(`/contas-pagar/${contaBaixa.id}/baixas`)).data;
  if (historico.length < 2 || !historico.some((item) => item.acao === 'BAIXAR_MANUAL') || !historico.some((item) => item.acao === 'ESTORNAR_BAIXA')) {
    throw new Error('Historico de baixas nao retornou baixa e estorno.');
  }
  results.push({ etapa: 'Estorno controlado preserva historico', ok: true, detalhe: `${historico.length} registro(s)` });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade = 'conta_pagar'
      and acao in ('baixar_manual', 'bloquear_baixa', 'estornar_baixa')
      and payload::text like $1
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 4) {
    throw new Error('Auditoria de baixa manual nao registrou sucesso, bloqueio e estorno esperados.');
  }
  results.push({ etapa: 'Auditoria de baixa manual registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  for (const route of [
    `/contas-pagar/${contaBaixa.id}/pagar`,
    `/contas-pagar/${contaBaixa.id}/baixar`,
    `/contas-pagar/${contaBaixa.id}/executar-pagamento`,
    `/contas-pagar/${contaBaixa.id}/gerar-cnab`,
    `/contas-pagar/${contaBaixa.id}/integracao-bancaria`
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  const deleteStatus = await requestStatus(`/contas-pagar/${contaBaixa.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /contas-pagar/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem rotas proibidas ou DELETE fisico', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.5G baixa manual concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem banco real, CNAB, integracao bancaria ou DELETE fisico.`);
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
