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
  financeiro: Usuario;
}

interface Medicao {
  id: string;
  numero: string;
  status: string;
  aprovacao_status?: string | null;
  valor_bruto: string | number;
  valor_liquido_previsto: string | number;
  itens?: Array<{ id: string; status: string; valor_total: string | number }>;
}

interface PedidoFaturamento {
  id: string;
  codigo: string;
  status: string;
  valor_solicitado: string | number;
}

interface SmokeResult {
  etapa: string;
  ok: boolean;
  detalhe: string;
}

const apiBaseUrl = (process.env.ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');
const marker = 'DEV_LOCAL_V3_6';

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
  const financeiro = findUsuario(usuarios, 'matheus.dev.v35b@enac.local', 'FINANCEIRO');
  const stamp = Date.now();

  const centro = await query<{ id: string }>(
    `
    insert into centros_custo (company_id, codigo, nome, tipo, status, observacoes)
    values ($1, $2, $3, 'obra', 'ativo', $4)
    returning id
    `,
    [empresa.id, `CC-${marker}-${stamp}`, `${marker} - Centro medicao`, `${marker} - centro para smoke`]
  );
  const cliente = await query<{ id: string }>(
    `
    insert into clientes (company_id, nome, tipo_pessoa, cpf_cnpj, status, observacoes)
    values ($1, $2, 'juridica', $3, 'ativo', $4)
    returning id
    `,
    [empresa.id, `${marker} - Cliente ${stamp}`, `99.999.${String(stamp).slice(-3)}/0001-36`, `${marker} - cliente local`]
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
    planejamento,
    financeiro
  };
};

const criarMedicao = async (ctx: SeedContext, suffix: string): Promise<Medicao> =>
  (await requestJson<ApiItemResponse<Medicao>>('/medicoes', {
    method: 'POST',
    body: JSON.stringify({
      company_id: ctx.empresa.id,
      obra_id: ctx.obraId,
      cliente_id: ctx.clienteId,
      centro_custo_id: ctx.centroCustoId,
      numero: `MED-${Date.now()}-${suffix}`,
      competencia: today().slice(0, 7),
      periodo_inicio: today(),
      periodo_fim: addDays(15),
      contrato_escopo: `${marker} - contrato/escopo ${suffix}`,
      responsavel_id: ctx.planejamento.id,
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - medicao local ${suffix}`
    })
  })).data;

const adicionarItem = async (medicaoId: string, ctx: SeedContext, valor: number, suffix: string): Promise<Medicao> =>
  (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicaoId}/itens`, {
    method: 'POST',
    body: JSON.stringify({
      descricao: `${marker} - item ${suffix}`,
      unidade: 'un',
      quantidade: 1,
      valor_unitario: money(valor),
      centro_custo_id: ctx.centroCustoId,
      etapa_servico: `${marker} - etapa ${suffix}`,
      usuario_id: ctx.planejamento.id
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

  const ctx = await ensureSeedContext();
  const contasReceberAntes = await query<{ total: number }>('select count(*)::int as total from contas_receber');

  const medicaoSemItem = await criarMedicao(ctx, 'SEM-ITEM');
  await expectHttpError(`/medicoes/${medicaoSemItem.id}/enviar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - bloqueio sem item`
    })
  });
  results.push({ etapa: 'Medicao sem item nao envia', ok: true, detalhe: 'HTTP 409' });

  let medicao = await criarMedicao(ctx, 'FLUXO');
  medicao = await adicionarItem(medicao.id, ctx, 1500, 'principal');
  if (Number(medicao.valor_bruto) !== 1500 || Number(medicao.valor_liquido_previsto) !== 1500) {
    throw new Error(`Total da medicao nao foi calculado pelos itens: bruto=${medicao.valor_bruto} liquido=${medicao.valor_liquido_previsto}.`);
  }
  medicao = await adicionarItem(medicao.id, ctx, 200, 'inativar');
  const itemInativar = medicao.itens?.find((item) => Number(item.valor_total) === 200 && item.status === 'ATIVO');
  if (!itemInativar) {
    throw new Error('Item extra para inativacao nao encontrado.');
  }
  medicao = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/itens/${itemInativar.id}/inativar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - item inativado logicamente`
    })
  })).data;
  if (!medicao.itens?.some((item) => item.id === itemInativar.id && item.status === 'INATIVO') || Number(medicao.valor_bruto) !== 1500) {
    throw new Error('Inativacao logica de item nao preservou historico ou recalculo.');
  }
  results.push({ etapa: 'Itens calculam total e inativam logicamente', ok: true, detalhe: `Valor ${medicao.valor_bruto}` });

  medicao = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/enviar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - envio para aprovacao`
    })
  })).data;
  if (medicao.status !== 'SUBMETIDA') {
    throw new Error(`Envio da medicao retornou status ${medicao.status}.`);
  }
  await expectHttpError('/pedidos-faturamento', 409, {
    method: 'POST',
    body: JSON.stringify({
      medicao_id: medicao.id,
      usuario_id: ctx.financeiro.id,
      observacoes: `${marker} - pedido antes da aprovacao`
    })
  });
  results.push({ etapa: 'Pedido exige medicao aprovada', ok: true, detalhe: 'HTTP 409 antes da aprovacao' });

  medicao = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - aprovacao interna`
    })
  })).data;
  if (medicao.status !== 'APROVADA' || medicao.aprovacao_status !== 'APROVADO_TECNICO') {
    throw new Error(`Aprovacao da medicao retornou ${medicao.status}/${medicao.aprovacao_status}.`);
  }
  results.push({ etapa: 'Aprovacao de medicao por alcada', ok: true, detalhe: medicao.aprovacao_status });

  const pedido = (await requestJson<ApiItemResponse<PedidoFaturamento>>('/pedidos-faturamento', {
    method: 'POST',
    body: JSON.stringify({
      medicao_id: medicao.id,
      valor_solicitado: Number(medicao.valor_liquido_previsto),
      data_solicitacao: today(),
      responsavel_id: ctx.financeiro.id,
      usuario_id: ctx.financeiro.id,
      observacoes: `${marker} - pedido interno sem emissao fiscal real`
    })
  })).data;
  if (pedido.status !== 'SOLICITADO') {
    throw new Error(`Pedido de faturamento retornou status ${pedido.status}.`);
  }
  await expectHttpError('/pedidos-faturamento', 409, {
    method: 'POST',
    body: JSON.stringify({
      medicao_id: medicao.id,
      usuario_id: ctx.financeiro.id,
      observacoes: `${marker} - duplicidade`
    })
  });
  results.push({ etapa: 'Pedido criado uma vez para medicao aprovada', ok: true, detalhe: pedido.codigo });

  const pedidoAprovado = (await requestJson<ApiItemResponse<PedidoFaturamento>>(`/pedidos-faturamento/${pedido.id}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.financeiro.id,
      observacoes: `${marker} - aprovacao de pedido interno`
    })
  })).data;
  if (pedidoAprovado.status !== 'APROVADO') {
    throw new Error(`Aprovacao do pedido retornou status ${pedidoAprovado.status}.`);
  }
  await expectHttpError(`/pedidos-faturamento/${pedido.id}/marcar-faturado-manualmente`, 400, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.financeiro.id,
      data_faturamento: today()
    })
  });
  const pedidoFaturado = (await requestJson<ApiItemResponse<PedidoFaturamento>>(`/pedidos-faturamento/${pedido.id}/marcar-faturado-manualmente`, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.financeiro.id,
      data_faturamento: today(),
      observacoes: `${marker} - faturamento externo informado manualmente`
    })
  })).data;
  if (pedidoFaturado.status !== 'FATURADO_MANUALMENTE') {
    throw new Error(`Faturamento manual retornou status ${pedidoFaturado.status}.`);
  }
  const medicaoFaturada = (await requestJson<ApiItemResponse<Medicao>>(`/medicoes/${medicao.id}`)).data;
  if (medicaoFaturada.status !== 'FATURADO_MANUALMENTE') {
    throw new Error(`Medicao nao acompanhou faturamento manual: ${medicaoFaturada.status}.`);
  }
  results.push({ etapa: 'Faturamento manual controlado', ok: true, detalhe: 'Sem emissao fiscal real' });

  await expectHttpError(`/medicoes/${medicao.id}/cancelar`, 409, {
    method: 'PATCH',
    body: JSON.stringify({
      usuario_id: ctx.planejamento.id,
      observacoes: `${marker} - tentativa cancelar faturada`
    })
  });
  results.push({ etapa: 'Medicao faturada manualmente nao cancela', ok: true, detalhe: 'HTTP 409' });

  const contasReceberDepois = await query<{ total: number }>('select count(*)::int as total from contas_receber');
  if (contasReceberAntes.rows[0].total !== contasReceberDepois.rows[0].total) {
    throw new Error('V3.6 criou ou alterou contas_receber automaticamente.');
  }
  results.push({ etapa: 'Sem baixa/cobranca automatica de recebivel', ok: true, detalhe: `contas_receber=${contasReceberDepois.rows[0].total}` });

  const auditoria = await query<{ total: number }>(
    `
    select count(*)::int as total
    from auditoria_eventos
    where entidade in ('medicao_obra', 'pedido_faturamento')
      and payload::text like $1
    `,
    [`%${marker}%`]
  );
  if (Number(auditoria.rows[0]?.total || 0) < 7) {
    throw new Error('Auditoria de medicoes/faturamento nao registrou eventos esperados.');
  }
  results.push({ etapa: 'Auditoria registrada', ok: true, detalhe: `${auditoria.rows[0].total} evento(s)` });

  for (const route of [
    `/medicoes/${medicao.id}/emitir-nfse`,
    `/medicoes/${medicao.id}/integrar-prefeitura`,
    `/pedidos-faturamento/${pedido.id}/gerar-boleto`,
    `/pedidos-faturamento/${pedido.id}/cobranca-bancaria`,
    `/pedidos-faturamento/${pedido.id}/baixar-recebivel`
  ]) {
    const status = await requestStatus(route, { method: 'PATCH', body: '{}' });
    if (status !== 404) {
      throw new Error(`${route} retornou HTTP ${status}, esperado 404.`);
    }
  }
  for (const route of [
    `/medicoes/${medicao.id}`,
    `/medicoes/${medicao.id}/itens/${itemInativar.id}`,
    `/pedidos-faturamento/${pedido.id}`
  ]) {
    const status = await requestStatus(route, { method: 'DELETE' });
    if (status !== 405) {
      throw new Error(`DELETE ${route} retornou HTTP ${status}, esperado 405.`);
    }
  }
  results.push({ etapa: 'Sem rotas fiscais/bancarias ou DELETE fisico', ok: true, detalhe: 'HTTP 404/405' });

  console.info(`Smoke V3.6 medicoes e faturamento concluido contra ${apiBaseUrl}. Marcador: ${marker}. Sem NFS-e real, prefeitura, boleto, banco ou DELETE fisico.`);
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
