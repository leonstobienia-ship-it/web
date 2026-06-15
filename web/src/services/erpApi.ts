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

export type CotacaoStatus = 'RASCUNHO' | 'RECEBIDA' | 'DESCLASSIFICADA' | 'SELECIONADA' | 'CANCELADA';

export interface CotacaoItemApi {
  id: string;
  cotacao_id: string;
  solicitacao_item_id: string;
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

export interface CotacaoApi {
  id: string;
  company_id: string;
  solicitacao_compra_id: string;
  fornecedor_id: string;
  codigo: string;
  valor_total: string | number;
  prazo_entrega?: string | null;
  prazo_entrega_dias?: string | number | null;
  condicao_pagamento?: string | null;
  frete?: string | null;
  recomendada: boolean;
  justificativa?: string | null;
  data_recebimento: string;
  validade_proposta?: string | null;
  status: CotacaoStatus;
  observacoes?: string | null;
  motivo_desclassificacao?: string | null;
  selecionada_em?: string | null;
  created_at: string;
  updated_at: string;
  fornecedor_nome?: string | null;
  fornecedor_cpf_cnpj?: string | null;
  solicitacao_codigo?: string | null;
  solicitacao_titulo?: string | null;
  itens_count?: number;
  itens?: CotacaoItemApi[];
}

export interface CotacaoItemPayload {
  solicitacao_item_id: string;
  valor_unitario: number;
  observacoes?: string | null;
}

export interface CotacaoPayload {
  company_id?: string;
  solicitacao_compra_id: string;
  fornecedor_id: string;
  data_recebimento: string;
  validade_proposta?: string | null;
  prazo_entrega_dias?: number | null;
  condicao_pagamento?: string | null;
  frete?: string | null;
  observacoes?: string | null;
  itens: CotacaoItemPayload[];
}

export interface CotacaoFilters {
  solicitacao_compra_id?: string;
  fornecedor_id?: string;
  status?: CotacaoStatus | '';
}

export interface MapaComparativoItemQuoteApi {
  cotacao_id: string;
  cotacao_codigo?: string | null;
  fornecedor_nome?: string | null;
  status?: CotacaoStatus | null;
  valor_unitario: string | number;
  valor_total: string | number;
  melhor_valor: boolean;
}

export interface MapaComparativoItemApi {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  ordem: number;
  melhor_cotacao_id?: string | null;
  comparativos: MapaComparativoItemQuoteApi[];
}

export interface MapaComparativoApi {
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
    total_cotacoes: number;
    total_cotacoes_comparaveis: number;
    cotacao_menor_total?: CotacaoApi | null;
    cotacao_selecionada?: CotacaoApi | null;
  };
  cotacoes: CotacaoApi[];
  itens: MapaComparativoItemApi[];
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
          solicitacao_compra_id: filters.solicitacao_compra_id,
          fornecedor_id: filters.fornecedor_id,
          status: filters.status || undefined
        })}`
      )).data,
    get: async (id: string): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}`)).data,
    create: async (payload: CotacaoPayload): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>('/cotacoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: Partial<CotacaoPayload>): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    transition: async (
      id: string,
      action: 'receber' | 'desclassificar' | 'selecionar' | 'cancelar',
      payload: Record<string, string | null> = {}
    ): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    mapaComparativo: async (solicitacaoCompraId: string): Promise<MapaComparativoApi> =>
      (await request<ApiItemResponse<MapaComparativoApi>>(
        `/cotacoes/mapa-comparativo${buildQueryString({ solicitacao_compra_id: solicitacaoCompraId })}`
      )).data
  }
};
