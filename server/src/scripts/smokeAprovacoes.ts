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

interface SolicitacaoItem {
  id: string;
}

interface SolicitacaoCompra {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
  itens?: SolicitacaoItem[];
}

interface CotacaoFornecedor {
  fornecedor_id: string;
}

interface Cotacao {
  id: string;
  codigo: string;
  status: string;
  aprovacao_status?: string | null;
}

interface MapaComparativo {
  resumo: {
    fornecedor_menor_total?: CotacaoFornecedor | null;
  };
}

interface PedidoCompra {
  id: string;
  codigo: string;
  status: string;
  valor_total: string | number;
  aprovacao_status?: string | null;
  itens?: Array<{ id: string }>;
}

interface NotaEntrada {
  id: string;
  numero: string;
  status: string;
  valor_total: string | number;
  aprovacao_status?: string | null;
}

interface ContaPagar {
  id: string;
  numero_documento: string;
  status: string;
  aprovacao_status?: string | null;
}

interface ProvisionamentoNota {
  nota: NotaEntrada;
  conta_pagar: ContaPagar;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_5C';

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

const transitionSolicitacao = async (
  solicitacao: SolicitacaoCompra,
  action: string,
  expectedStatus: string
): Promise<SolicitacaoCompra> => {
  const response = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionCotacao = async (
  cotacao: Cotacao,
  action: string,
  expectedStatus: string,
  payload: Record<string, unknown> = {}
): Promise<Cotacao> => {
  const response = await requestJson<ApiItemResponse<Cotacao>>(`/cotacoes/${cotacao.id}/${action}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionPedido = async (
  pedido: PedidoCompra,
  action: string,
  expectedStatus: string
): Promise<PedidoCompra> => {
  const response = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const transitionNota = async (
  nota: NotaEntrada,
  action: string,
  expectedStatus: string
): Promise<NotaEntrada> => {
  const response = await requestJson<ApiItemResponse<NotaEntrada>>(`/notas-fiscais-entrada/${nota.id}/${action}`, {
    method: 'PATCH'
  });
  if (response.data.status !== expectedStatus) {
    throw new Error(`Transicao ${action} retornou ${response.data.status}, esperado ${expectedStatus}.`);
  }
  return response.data;
};

const findUsuario = (usuarios: Usuario[], email: string, perfil: string): Usuario => {
  const usuario = usuarios.find((item) => item.email === email) || usuarios.find((item) => item.perfil_principal === perfil);
  if (!usuario) {
    throw new Error(`Usuario seed ${email}/${perfil} nao encontrado.`);
  }
  return usuario;
};

const pickByCompany = <T extends { company_id?: string }>(items: T[], companyId: string, label: string): T => {
  const item = items.find((entry) => entry.company_id === companyId) || items[0];
  if (!item) {
    throw new Error(`Nenhum registro encontrado em ${label}.`);
  }
  return item;
};

const createSolicitacao = async (
  empresa: Empresa,
  obra: Obra,
  centroCusto: CentroCusto,
  solicitante: Usuario,
  titulo: string,
  valorUnitario: number
): Promise<SolicitacaoCompra> => {
  const response = await requestJson<ApiItemResponse<SolicitacaoCompra>>('/solicitacoes-compra', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      obra_id: obra.id,
      centro_custo_id: centroCusto.id,
      solicitante_id: solicitante.id,
      titulo,
      descricao: `${marker} - solicitacao local para aprovacao por alcada`,
      prioridade: 'NORMAL',
      data_necessidade: today(),
      observacoes: `${marker} - sem dados reais`,
      itens: [
        {
          descricao: `${marker} - item aprovacao`,
          unidade: 'un',
          quantidade: 1,
          valor_estimado_unitario: valorUnitario,
          observacoes: `${marker} - item local`
        }
      ]
    })
  });
  return response.data;
};

const aprovarSolicitacaoTecnica = async (solicitacao: SolicitacaoCompra, usuario: Usuario): Promise<SolicitacaoCompra> =>
  (await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - aprovacao tecnica`
    })
  })).data;

const aprovarCotacaoTecnica = async (cotacao: Cotacao, usuario: Usuario): Promise<Cotacao> =>
  (await requestJson<ApiItemResponse<Cotacao>>(`/cotacoes/${cotacao.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - aprovacao tecnica da cotacao`
    })
  })).data;

const aprovarPedidoTecnico = async (pedido: PedidoCompra, usuario: Usuario): Promise<PedidoCompra> =>
  (await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: usuario.id,
      observacoes: `${marker} - aprovacao tecnica do pedido`
    })
  })).data;

const createCotacaoPedidoConfirmado = async (
  empresa: Empresa,
  solicitacao: SolicitacaoCompra,
  fornecedores: Fornecedor[],
  aprovador: Usuario,
  results: SmokeResult[]
): Promise<PedidoCompra> => {
  const detalheSolicitacao = await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacao.id}`);
  if (!Array.isArray(detalheSolicitacao.data.itens) || detalheSolicitacao.data.itens.length !== 1) {
    throw new Error('Solicitacao aprovada nao retornou item para cotacao.');
  }

  let cotacao = (await requestJson<ApiItemResponse<Cotacao>>('/cotacoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      solicitacao_id: solicitacao.id,
      titulo: `${marker} - cotacao aprovada`,
      prazo_resposta: addDays(3),
      observacoes: `${marker} - cotacao local`,
      fornecedores: fornecedores.slice(0, 2).map((fornecedor) => ({ fornecedor_id: fornecedor.id }))
    })
  })).data;
  cotacao = await transitionCotacao(cotacao, 'enviar-fornecedores', 'ENVIADA_FORNECEDORES');
  cotacao = await transitionCotacao(cotacao, 'registrar-respostas', 'RESPOSTAS_RECEBIDAS', {
    fornecedores: fornecedores.slice(0, 2).map((fornecedor, fornecedorIndex) => ({
      fornecedor_id: fornecedor.id,
      prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 4,
      condicao_pagamento: `${marker} - condicao local`,
      observacoes: `${marker} - resposta local`,
      itens: (detalheSolicitacao.data.itens || []).map((item) => ({
        solicitacao_item_id: item.id,
        valor_unitario: fornecedorIndex === 0 ? 120 : 100,
        marca_modelo: `${marker} - marca local`,
        prazo_entrega_dias: fornecedorIndex === 0 ? 5 : 4,
        observacoes: `${marker} - item cotado`
      }))
    }))
  });
  cotacao = await transitionCotacao(cotacao, 'gerar-mapa', 'MAPA_GERADO', {
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - mapa local`
  });
  const mapa = await requestJson<ApiItemResponse<MapaComparativo>>(`/cotacoes/mapa-comparativo?cotacao_id=${cotacao.id}`);
  const vencedor = mapa.data.resumo.fornecedor_menor_total;
  if (!vencedor) {
    throw new Error('Mapa comparativo nao retornou fornecedor menor valor.');
  }
  cotacao = await transitionCotacao(cotacao, 'escolher-fornecedor', 'FORNECEDOR_ESCOLHIDO', {
    fornecedor_id: vencedor.fornecedor_id,
    criterio_decisao: 'MENOR_PRECO',
    justificativa: `${marker} - vencedor local`
  });
  cotacao = await aprovarCotacaoTecnica(cotacao, aprovador);
  if (cotacao.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Cotacao nao ficou APROVADO_TECNICO.');
  }
  results.push({ etapa: 'Cotacao aprovada por alcada', ok: true, detalhe: cotacao.codigo });

  let pedido = (await requestJson<ApiItemResponse<PedidoCompra>>('/pedidos-compra/gerar-da-cotacao', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      cotacao_id: cotacao.id,
      titulo: `${marker} - pedido com aprovacao`,
      observacoes: `${marker} - pedido local sem pagamento`
    })
  })).data;
  await expectHttpError(`/pedidos-compra/${pedido.id}/emitir`, 409, { method: 'PATCH' });
  results.push({ etapa: 'Pedido sem aprovacao bloqueado', ok: true, detalhe: 'HTTP 409' });

  pedido = await aprovarPedidoTecnico(pedido, aprovador);
  if (pedido.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Pedido nao ficou APROVADO_TECNICO.');
  }
  pedido = await transitionPedido(pedido, 'emitir', 'EMITIDO');
  pedido = await transitionPedido(pedido, 'enviar-fornecedor', 'ENVIADO_FORNECEDOR');
  pedido = await transitionPedido(pedido, 'confirmar', 'CONFIRMADO');
  results.push({ etapa: 'Pedido aprovado e confirmado', ok: true, detalhe: pedido.codigo });
  return pedido;
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
  if (fornecedores.length < 2) {
    throw new Error('Smoke V3.5C exige ao menos 2 fornecedores locais.');
  }

  const obra = pickByCompany(obras, empresa.id, 'obras');
  const centroCusto = pickByCompany(centros, empresa.id, 'centros-custo');
  const leon = findUsuario(usuarios, 'leon.dev.v35b@enac.local', 'DIRETORIA');
  const gustavo = findUsuario(usuarios, 'gustavo.dev.v35b@enac.local', 'PLANEJAMENTO');
  const matheus = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const davison = findUsuario(usuarios, 'davison.dev.v35b@enac.local', 'CAMPO');

  let solicitacaoBaixa = await createSolicitacao(empresa, obra, centroCusto, davison, `${marker} - solicitacao baixa`, 100);
  solicitacaoBaixa = await transitionSolicitacao(solicitacaoBaixa, 'enviar', 'ENVIADA');
  solicitacaoBaixa = await transitionSolicitacao(solicitacaoBaixa, 'em-analise', 'EM_ANALISE');
  await expectHttpError(`/solicitacoes-compra/${solicitacaoBaixa.id}/aprovar-tecnico`, 403, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      observacoes: `${marker} - bloqueio usuario sem alcada para solicitacao`
    })
  });
  solicitacaoBaixa = await aprovarSolicitacaoTecnica(solicitacaoBaixa, gustavo);
  if (solicitacaoBaixa.status !== 'APROVADA_PARA_COTACAO' || solicitacaoBaixa.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Solicitacao baixa nao foi aprovada tecnicamente para cotacao.');
  }
  results.push({ etapa: 'Solicitacao tecnica aprovada', ok: true, detalhe: solicitacaoBaixa.codigo });

  let solicitacaoAlta = await createSolicitacao(empresa, obra, centroCusto, davison, `${marker} - solicitacao alta`, 25000);
  solicitacaoAlta = await transitionSolicitacao(solicitacaoAlta, 'enviar', 'ENVIADA');
  solicitacaoAlta = await transitionSolicitacao(solicitacaoAlta, 'em-analise', 'EM_ANALISE');
  await expectHttpError(`/solicitacoes-compra/${solicitacaoAlta.id}/aprovar-tecnico`, 403, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: gustavo.id,
      observacoes: `${marker} - bloqueio acima de 20k`
    })
  });
  solicitacaoAlta = (await requestJson<ApiItemResponse<SolicitacaoCompra>>(`/solicitacoes-compra/${solicitacaoAlta.id}/aprovar-diretoria`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: leon.id,
      observacoes: `${marker} - aprovacao diretoria acima de 20k`
    })
  })).data;
  if (solicitacaoAlta.aprovacao_status !== 'APROVADO_DIRETORIA') {
    throw new Error('Solicitacao alta nao foi aprovada pela diretoria.');
  }
  results.push({ etapa: 'Solicitacao diretoria aprovada', ok: true, detalhe: solicitacaoAlta.codigo });

  const pedido = await createCotacaoPedidoConfirmado(empresa, solicitacaoBaixa, fornecedores, gustavo, results);
  const pedidoDetalhado = await requestJson<ApiItemResponse<PedidoCompra>>(`/pedidos-compra/${pedido.id}`);
  const valorTotal = Number(pedidoDetalhado.data.valor_total);

  let nota = (await requestJson<ApiItemResponse<NotaEntrada>>('/notas-fiscais-entrada/gerar-do-pedido', {
    method: 'POST',
    body: JSON.stringify({
      company_id: empresa.id,
      pedido_id: pedido.id,
      numero: `NF-${Date.now()}`,
      serie: 'V35C',
      tipo_documento: 'NOTA_FISCAL',
      data_emissao: today(),
      data_entrada: today(),
      valor_produtos: valorTotal,
      valor_servicos: 0,
      valor_frete: 0,
      valor_desconto: 0,
      valor_impostos: 0,
      valor_total: valorTotal,
      observacoes: `${marker} - nota local sem XML, SEFAZ ou pagamento`
    })
  })).data;
  nota = await transitionNota(nota, 'conferir', 'CONFERIDA');
  nota = (await requestJson<ApiItemResponse<NotaEntrada>>(`/notas-fiscais-entrada/${nota.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      observacoes: `${marker} - aprovacao tecnica da nota`
    })
  })).data;
  if (nota.status !== 'APROVADA' || nota.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Nota fiscal nao foi aprovada por alcada.');
  }
  results.push({ etapa: 'NF aprovada por alcada', ok: true, detalhe: nota.numero });

  const provisionamento = await requestJson<ApiItemResponse<ProvisionamentoNota>>(
    `/notas-fiscais-entrada/${nota.id}/provisionar-conta-pagar`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        data_vencimento: addDays(7),
        observacoes: `${marker} - conta provisionada sem pagamento`
      })
    }
  );
  let conta = provisionamento.data.conta_pagar;
  if (conta.status !== 'PROVISIONADA') {
    throw new Error('Conta a pagar nao nasceu PROVISIONADA.');
  }
  conta = (await requestJson<ApiItemResponse<ContaPagar>>(`/contas-pagar/${conta.id}/aprovar-tecnico`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: matheus.id,
      observacoes: `${marker} - aprovacao interna sem pagamento`
    })
  })).data;
  if (conta.status !== 'APROVADA' || conta.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error('Conta a pagar nao foi aprovada internamente por alcada.');
  }
  results.push({ etapa: 'Conta a pagar aprovada sem pagamento', ok: true, detalhe: conta.numero_documento });

  const fakeId = '00000000-0000-4000-8000-000000000001';
  for (const route of [`/contas-pagar/${fakeId}/programar-pagamento`, `/contas-pagar/${fakeId}/baixar`, `/contas-pagar/${fakeId}/pagar`]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  const deleteStatus = await requestStatus(`/pedidos-compra/${pedido.id}`, { method: 'DELETE' });
  if (deleteStatus !== 405) {
    throw new Error(`DELETE /pedidos-compra/:id retornou HTTP ${deleteStatus}, esperado 405.`);
  }
  results.push({ etapa: 'Sem DELETE, pagamento, baixa ou programacao', ok: true, detalhe: 'HTTP 404/405' });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where payload::text like $1
      and entidade in ('solicitacao_compra', 'cotacao', 'pedido_compra', 'nota_fiscal_entrada', 'conta_pagar')
      and acao in ('aprovar_tecnico', 'aprovar_diretoria', 'bloquear_alcada', 'emitir_bloqueado_aprovacao')
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 8) {
    throw new Error('Auditoria de aprovacoes/bloqueios nao registrou eventos esperados.');
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} eventos` });

  console.info(`Smoke V3.5C aprovacoes concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem pagamento, baixa, programacao bancaria ou DELETE fisico.`);
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
