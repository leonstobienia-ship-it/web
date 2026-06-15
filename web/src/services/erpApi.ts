export type CadastroStatus = 'ativo' | 'inativo';

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

interface ApiErrorBody {
  code?: string;
  details?: unknown;
  message?: string;
  status?: string;
}

export class ErpApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  public constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface EmpresaApi {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj: string;
  status: string;
}

export interface CadastroRecord {
  id: string;
  company_id: string;
  status: CadastroStatus | string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ClienteApi extends CadastroRecord {
  nome: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cpf_cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  responsavel?: string | null;
  observacoes?: string | null;
}

export interface FornecedorApi extends CadastroRecord {
  nome: string;
  tipo_pessoa: 'fisica' | 'juridica';
  cpf_cnpj?: string | null;
  categoria: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  contato?: string | null;
  pix?: string | null;
  dados_bancarios?: string | null;
  observacoes?: string | null;
}

export interface CentroCustoApi extends CadastroRecord {
  codigo: string;
  nome: string;
  tipo: string;
  conta_analitica?: string | null;
  observacoes?: string | null;
}

export interface ObraApi extends CadastroRecord {
  cliente_id?: string | null;
  centro_custo_id?: string | null;
  codigo: string;
  nome: string;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  responsavel?: string | null;
  data_inicio_prevista?: string | null;
  data_fim_prevista?: string | null;
  valor_previsto?: string | number | null;
  observacoes?: string | null;
}

export interface UsuarioApi {
  id: string;
  nome: string;
  email: string;
  cargo_funcao?: string | null;
  ativo: boolean;
  status: string;
  perfil_principal?: string | null;
}

export type SolicitacaoCompraStatus =
  | 'RASCUNHO'
  | 'ENVIADA'
  | 'EM_ANALISE'
  | 'APROVADA_PARA_COTACAO'
  | 'DEVOLVIDA'
  | 'CANCELADA';

export type SolicitacaoCompraPrioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export interface SolicitacaoCompraItemApi {
  id: string;
  solicitacao_id: string;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_estimado_unitario: string | number;
  valor_estimado_total: string | number;
  observacoes?: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoCompraApi {
  id: string;
  company_id: string;
  obra_id: string;
  centro_custo_id: string;
  solicitante_id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  prioridade: SolicitacaoCompraPrioridade;
  data_necessidade: string;
  status: SolicitacaoCompraStatus;
  valor_estimado_total: string | number;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  solicitante_nome?: string | null;
  itens_count?: number;
  itens?: SolicitacaoCompraItemApi[];
}

export interface SolicitacaoCompraItemPayload {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_estimado_unitario: number;
  observacoes?: string | null;
}

export interface SolicitacaoCompraPayload {
  company_id?: string;
  obra_id: string;
  centro_custo_id: string;
  solicitante_id: string;
  titulo: string;
  descricao: string;
  prioridade: SolicitacaoCompraPrioridade;
  data_necessidade: string;
  observacoes?: string | null;
  itens: SolicitacaoCompraItemPayload[];
}

export interface SolicitacaoCompraFilters {
  status?: SolicitacaoCompraStatus | '';
  prioridade?: SolicitacaoCompraPrioridade | '';
  obra_id?: string;
}

export type CotacaoStatus =
  | 'RASCUNHO'
  | 'ENVIADA_FORNECEDORES'
  | 'RESPOSTAS_RECEBIDAS'
  | 'MAPA_GERADO'
  | 'FORNECEDOR_ESCOLHIDO'
  | 'CANCELADA';

export type CotacaoFornecedorStatus = 'CONVIDADO' | 'RESPOSTA_RECEBIDA' | 'DESCLASSIFICADO' | 'ESCOLHIDO' | 'CANCELADO';

export interface CotacaoItemApi {
  id: string;
  cotacao_id: string;
  cotacao_fornecedor_id?: string | null;
  fornecedor_id?: string | null;
  solicitacao_item_id: string;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  marca_modelo?: string | null;
  prazo_entrega_dias?: string | number | null;
  observacoes?: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CotacaoFornecedorApi {
  id: string;
  cotacao_id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_cpf_cnpj?: string | null;
  status: CotacaoFornecedorStatus;
  valor_total: string | number;
  prazo_entrega_dias?: string | number | null;
  condicao_pagamento?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CotacaoMapaApi {
  id: string;
  cotacao_id: string;
  fornecedor_vencedor_id?: string | null;
  criterio_decisao?: string | null;
  justificativa?: string | null;
  valor_vencedor?: string | number | null;
  status: string;
}

export interface CotacaoApi {
  id: string;
  company_id: string;
  solicitacao_compra_id: string;
  solicitacao_id?: string;
  fornecedor_id?: string | null;
  codigo: string;
  titulo: string;
  valor_total: string | number;
  prazo_resposta?: string | null;
  recomendada?: boolean;
  justificativa?: string | null;
  status: CotacaoStatus;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  solicitacao_codigo?: string | null;
  solicitacao_titulo?: string | null;
  fornecedores_count?: number;
  itens_count?: number;
  fornecedor_vencedor_id?: string | null;
  fornecedor_vencedor_nome?: string | null;
  mapa?: CotacaoMapaApi | null;
  fornecedores?: CotacaoFornecedorApi[];
  itens?: CotacaoItemApi[];
}

export interface CotacaoFornecedorPayload {
  fornecedor_id: string;
}

export interface CotacaoCreatePayload {
  company_id?: string;
  solicitacao_id?: string;
  solicitacao_compra_id?: string;
  titulo: string;
  prazo_resposta?: string | null;
  observacoes?: string | null;
  fornecedores: CotacaoFornecedorPayload[];
}

export interface CotacaoRespostaItemPayload {
  solicitacao_item_id: string;
  valor_unitario: number;
  marca_modelo?: string | null;
  prazo_entrega_dias?: number | null;
  observacoes?: string | null;
}

export interface CotacaoRespostaFornecedorPayload {
  fornecedor_id: string;
  prazo_entrega_dias?: number | null;
  condicao_pagamento?: string | null;
  observacoes?: string | null;
  itens: CotacaoRespostaItemPayload[];
}

export interface CotacaoRegistrarRespostasPayload {
  fornecedores: CotacaoRespostaFornecedorPayload[];
}

export interface CotacaoEscolherFornecedorPayload {
  fornecedor_id: string;
  criterio_decisao?: string | null;
  justificativa: string;
}

export interface CotacaoFilters {
  solicitacao_id?: string;
  solicitacao_compra_id?: string;
  status?: CotacaoStatus | '';
}

export interface MapaComparativoItemQuoteApi {
  cotacao_fornecedor_id: string;
  fornecedor_id: string;
  fornecedor_nome?: string | null;
  status?: CotacaoFornecedorStatus | null;
  valor_unitario: string | number;
  valor_total: string | number;
  marca_modelo?: string | null;
  prazo_entrega_dias?: string | number | null;
  melhor_valor: boolean;
}

export interface MapaComparativoItemApi {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  ordem: number;
  melhor_fornecedor_id?: string | null;
  comparativos: MapaComparativoItemQuoteApi[];
}

export interface MapaComparativoApi {
  cotacao: CotacaoApi;
  solicitacao: {
    id: string;
    company_id: string;
    codigo: string;
    titulo: string;
    status: SolicitacaoCompraStatus;
    obra_codigo?: string | null;
    obra_nome?: string | null;
    centro_custo_codigo?: string | null;
    centro_custo_nome?: string | null;
  };
  resumo: {
    total_fornecedores: number;
    total_respostas: number;
    fornecedor_menor_total?: CotacaoFornecedorApi | null;
    fornecedor_vencedor?: CotacaoFornecedorApi | null;
    mapa?: CotacaoMapaApi | null;
  };
  fornecedores: CotacaoFornecedorApi[];
  itens: MapaComparativoItemApi[];
}

export type PedidoCompraStatus =
  | 'RASCUNHO'
  | 'EMITIDO'
  | 'ENVIADO_FORNECEDOR'
  | 'CONFIRMADO'
  | 'PARCIALMENTE_RECEBIDO'
  | 'RECEBIDO'
  | 'CANCELADO';

export interface PedidoCompraItemApi {
  id: string;
  pedido_id: string;
  solicitacao_item_id?: string | null;
  cotacao_item_id?: string | null;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  observacoes?: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface PedidoCompraApi {
  id: string;
  company_id: string;
  solicitacao_id?: string | null;
  solicitacao_compra_id?: string | null;
  cotacao_id?: string | null;
  fornecedor_id: string;
  obra_id?: string | null;
  centro_custo_id?: string | null;
  codigo: string;
  numero?: string | null;
  titulo: string;
  status: PedidoCompraStatus;
  data_emissao?: string | null;
  data_entrega_prevista?: string | null;
  condicao_pagamento?: string | null;
  valor_total: string | number;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  solicitacao_codigo?: string | null;
  solicitacao_titulo?: string | null;
  cotacao_codigo?: string | null;
  cotacao_titulo?: string | null;
  fornecedor_nome?: string | null;
  fornecedor_cpf_cnpj?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  itens_count?: number;
  itens?: PedidoCompraItemApi[];
}

export interface PedidoCompraFilters {
  status?: PedidoCompraStatus | '';
  fornecedor_id?: string;
  obra_id?: string;
  centro_custo_id?: string;
}

export interface GerarPedidoCompraPayload {
  company_id?: string;
  cotacao_id: string;
  titulo?: string | null;
  data_emissao?: string | null;
  data_entrega_prevista?: string | null;
  condicao_pagamento?: string | null;
  observacoes?: string | null;
}

export interface PedidoCompraUpdatePayload {
  titulo?: string;
  data_emissao?: string | null;
  data_entrega_prevista?: string | null;
  condicao_pagamento?: string | null;
  observacoes?: string | null;
}

export type NotaEntradaStatus = 'RASCUNHO' | 'CONFERIDA' | 'DIVERGENTE' | 'APROVADA' | 'PROVISIONADA' | 'CANCELADA';

export interface NotaEntradaItemApi {
  id: string;
  nota_id: string;
  nota_fiscal_id?: string;
  pedido_item_id?: string | null;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  observacoes?: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface NotaEntradaApi {
  id: string;
  company_id: string;
  pedido_id: string;
  fornecedor_id: string;
  obra_id?: string | null;
  centro_custo_id?: string | null;
  numero: string;
  serie?: string | null;
  chave_acesso?: string | null;
  tipo_documento: string;
  data_emissao: string;
  data_entrada: string;
  valor_produtos: string | number;
  valor_servicos: string | number;
  valor_frete: string | number;
  valor_desconto: string | number;
  valor_impostos: string | number;
  valor_total: string | number;
  status: NotaEntradaStatus;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  pedido_codigo?: string | null;
  pedido_titulo?: string | null;
  fornecedor_nome?: string | null;
  fornecedor_cpf_cnpj?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  itens_count?: number;
  itens?: NotaEntradaItemApi[];
}

export interface NotaEntradaFilters {
  status?: NotaEntradaStatus | '';
  fornecedor_id?: string;
  pedido_id?: string;
  obra_id?: string;
  centro_custo_id?: string;
}

export interface NotaEntradaPayload {
  company_id?: string;
  pedido_id: string;
  numero: string;
  serie?: string | null;
  chave_acesso?: string | null;
  tipo_documento?: string | null;
  data_emissao: string;
  data_entrada: string;
  valor_produtos: number;
  valor_servicos?: number;
  valor_frete?: number;
  valor_desconto?: number;
  valor_impostos?: number;
  valor_total: number;
  observacoes?: string | null;
}

export type NotaEntradaUpdatePayload = Partial<Omit<NotaEntradaPayload, 'company_id' | 'pedido_id'>>;

export type ContaPagarStatus = 'PROVISIONADA' | 'APROVADA' | 'AGUARDANDO_PROGRAMACAO' | 'PROGRAMADA' | 'PAGA' | 'CANCELADA';

export interface ContaPagarApi {
  id: string;
  company_id: string;
  nota_entrada_id: string;
  pedido_id: string;
  fornecedor_id: string;
  obra_id?: string | null;
  centro_custo_id?: string | null;
  numero_documento: string;
  parcela: number;
  total_parcelas: number;
  data_emissao: string;
  data_vencimento: string;
  valor_original: string | number;
  valor_aberto: string | number;
  status: ContaPagarStatus;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  nota_numero?: string | null;
  nota_serie?: string | null;
  pedido_codigo?: string | null;
  pedido_titulo?: string | null;
  fornecedor_nome?: string | null;
  fornecedor_cpf_cnpj?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
}

export interface ContaPagarFilters {
  status?: ContaPagarStatus | '';
  fornecedor_id?: string;
  obra_id?: string;
  vencimento_de?: string;
  vencimento_ate?: string;
}

export interface GerarContaPagarPayload {
  nota_entrada_id: string;
  data_vencimento: string;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
}

export interface ProvisionarContaPagarPayload {
  data_vencimento?: string;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
}

export interface ProvisionarContaPagarResponse {
  nota: NotaEntradaApi;
  conta_pagar: ContaPagarApi;
}

export interface ContaPagarUpdatePayload {
  data_vencimento?: string;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
}

export type CadastroPayload = Record<string, string | number | null | undefined>;

const apiBaseUrl = (import.meta.env.VITE_ENAC_ERP_API_BASE_URL || 'http://127.0.0.1:3333').replace(/\/+$/, '');

const buildQueryString = (params: Record<string, string | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers || {})
    }
  });
  const text = await response.text();
  let body: ApiErrorBody | T | undefined;

  if (text) {
    try {
      body = JSON.parse(text) as ApiErrorBody | T;
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    const details = Array.isArray(errorBody?.details) ? ` Campos: ${errorBody.details.join(', ')}.` : '';
    const code = errorBody?.code ? ` (${errorBody.code})` : '';
    throw new ErpApiError(
      `${errorBody?.message || `Falha HTTP ${response.status}`}${code}${details}`,
      response.status,
      errorBody?.code,
      errorBody?.details
    );
  }

  return body as T;
}

function makeResource<T extends CadastroRecord>(path: string) {
  return {
    list: async (): Promise<T[]> => (await request<ApiListResponse<T>>(path)).data,
    get: async (id: string): Promise<T> => (await request<ApiItemResponse<T>>(`${path}/${id}`)).data,
    create: async (payload: CadastroPayload): Promise<T> =>
      (await request<ApiItemResponse<T>>(path, { method: 'POST', body: JSON.stringify(payload) })).data,
    update: async (id: string, payload: CadastroPayload): Promise<T> =>
      (await request<ApiItemResponse<T>>(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<T> =>
      (await request<ApiItemResponse<T>>(`${path}/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<T> =>
      (await request<ApiItemResponse<T>>(`${path}/${id}/reativar`, { method: 'PATCH' })).data
  };
}

export const erpApi = {
  empresas: {
    list: async (): Promise<EmpresaApi[]> => (await request<ApiListResponse<EmpresaApi>>('/empresas')).data
  },
  usuarios: {
    list: async (): Promise<UsuarioApi[]> => (await request<ApiListResponse<UsuarioApi>>('/usuarios')).data
  },
  clientes: makeResource<ClienteApi>('/clientes'),
  fornecedores: makeResource<FornecedorApi>('/fornecedores'),
  obras: makeResource<ObraApi>('/obras'),
  centrosCusto: makeResource<CentroCustoApi>('/centros-custo'),
  solicitacoesCompra: {
    list: async (filters: SolicitacaoCompraFilters = {}): Promise<SolicitacaoCompraApi[]> =>
      (await request<ApiListResponse<SolicitacaoCompraApi>>(
        `/solicitacoes-compra${buildQueryString({
          status: filters.status || undefined,
          prioridade: filters.prioridade || undefined,
          obra_id: filters.obra_id || undefined
        })}`
      )).data,
    get: async (id: string): Promise<SolicitacaoCompraApi> =>
      (await request<ApiItemResponse<SolicitacaoCompraApi>>(`/solicitacoes-compra/${id}`)).data,
    create: async (payload: SolicitacaoCompraPayload): Promise<SolicitacaoCompraApi> =>
      (await request<ApiItemResponse<SolicitacaoCompraApi>>('/solicitacoes-compra', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: Partial<SolicitacaoCompraPayload>): Promise<SolicitacaoCompraApi> =>
      (await request<ApiItemResponse<SolicitacaoCompraApi>>(`/solicitacoes-compra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'enviar' | 'em-analise' | 'devolver' | 'reabrir-rascunho' | 'cancelar'
    ): Promise<SolicitacaoCompraApi> =>
      (await request<ApiItemResponse<SolicitacaoCompraApi>>(`/solicitacoes-compra/${id}/${action}`, {
        method: 'PATCH'
      })).data
  },
  cotacoes: {
    list: async (filters: CotacaoFilters = {}): Promise<CotacaoApi[]> =>
      (await request<ApiListResponse<CotacaoApi>>(
        `/cotacoes${buildQueryString({
          solicitacao_id: filters.solicitacao_id || filters.solicitacao_compra_id,
          status: filters.status || undefined
        })}`
      )).data,
    get: async (id: string): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}`)).data,
    create: async (payload: CotacaoCreatePayload): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>('/cotacoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: Partial<CotacaoCreatePayload>): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'enviar-fornecedores' | 'registrar-respostas' | 'gerar-mapa' | 'escolher-fornecedor' | 'cancelar',
      payload: Record<string, unknown> = {}
    ): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    registrarRespostas: async (id: string, payload: CotacaoRegistrarRespostasPayload): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}/registrar-respostas`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    escolherFornecedor: async (id: string, payload: CotacaoEscolherFornecedorPayload): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}/escolher-fornecedor`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    mapaComparativo: async (id: string, mode: 'cotacao' | 'solicitacao' = 'cotacao'): Promise<MapaComparativoApi> =>
      (await request<ApiItemResponse<MapaComparativoApi>>(
        `/cotacoes/mapa-comparativo${buildQueryString(mode === 'cotacao' ? { cotacao_id: id } : { solicitacao_id: id })}`
      )).data
  },
  pedidosCompra: {
    list: async (filters: PedidoCompraFilters = {}): Promise<PedidoCompraApi[]> =>
      (await request<ApiListResponse<PedidoCompraApi>>(
        `/pedidos-compra${buildQueryString({
          status: filters.status || undefined,
          fornecedor_id: filters.fornecedor_id,
          obra_id: filters.obra_id,
          centro_custo_id: filters.centro_custo_id
        })}`
      )).data,
    get: async (id: string): Promise<PedidoCompraApi> =>
      (await request<ApiItemResponse<PedidoCompraApi>>(`/pedidos-compra/${id}`)).data,
    gerarDaCotacao: async (payload: GerarPedidoCompraPayload): Promise<PedidoCompraApi> =>
      (await request<ApiItemResponse<PedidoCompraApi>>('/pedidos-compra/gerar-da-cotacao', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: PedidoCompraUpdatePayload): Promise<PedidoCompraApi> =>
      (await request<ApiItemResponse<PedidoCompraApi>>(`/pedidos-compra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'emitir' | 'enviar-fornecedor' | 'confirmar' | 'cancelar'
    ): Promise<PedidoCompraApi> =>
      (await request<ApiItemResponse<PedidoCompraApi>>(`/pedidos-compra/${id}/${action}`, {
        method: 'PATCH'
      })).data
  },
  notasEntrada: {
    list: async (filters: NotaEntradaFilters = {}): Promise<NotaEntradaApi[]> =>
      (await request<ApiListResponse<NotaEntradaApi>>(
        `/notas-fiscais-entrada${buildQueryString({
          status: filters.status || undefined,
          fornecedor_id: filters.fornecedor_id,
          pedido_id: filters.pedido_id,
          obra_id: filters.obra_id,
          centro_custo_id: filters.centro_custo_id
        })}`
      )).data,
    get: async (id: string): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>(`/notas-fiscais-entrada/${id}`)).data,
    create: async (payload: NotaEntradaPayload): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>('/notas-fiscais-entrada', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    gerarDoPedido: async (payload: NotaEntradaPayload): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>('/notas-fiscais-entrada/gerar-do-pedido', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: NotaEntradaUpdatePayload): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>(`/notas-fiscais-entrada/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'conferir' | 'marcar-divergente' | 'reabrir-rascunho' | 'aprovar' | 'cancelar'
    ): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>(`/notas-fiscais-entrada/${id}/${action}`, {
        method: 'PATCH'
      })).data,
    provisionarContaPagar: async (
      id: string,
      payload: ProvisionarContaPagarPayload = {}
    ): Promise<ProvisionarContaPagarResponse> =>
      (await request<ApiItemResponse<ProvisionarContaPagarResponse>>(`/notas-fiscais-entrada/${id}/provisionar-conta-pagar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  contasPagar: {
    list: async (filters: ContaPagarFilters = {}): Promise<ContaPagarApi[]> =>
      (await request<ApiListResponse<ContaPagarApi>>(
        `/contas-pagar${buildQueryString({
          status: filters.status || undefined,
          fornecedor_id: filters.fornecedor_id,
          obra_id: filters.obra_id,
          vencimento_de: filters.vencimento_de,
          vencimento_ate: filters.vencimento_ate
        })}`
      )).data,
    get: async (id: string): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}`)).data,
    gerarDaNota: async (payload: GerarContaPagarPayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>('/contas-pagar/gerar-da-nota', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    provisionarDaNota: async (payload: GerarContaPagarPayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>('/contas-pagar/provisionar-da-nota', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: ContaPagarUpdatePayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'cancelar'
    ): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}/${action}`, {
        method: 'PATCH'
      })).data
  }
};
