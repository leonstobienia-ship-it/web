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
  perfis?: Array<{ id: string; nome: string; principal: boolean; status: string }>;
}

export type AcessoStatus = 'ativo' | 'inativo';

export interface PerfilApi {
  id: string;
  company_id: string;
  nome: string;
  descricao?: string | null;
  escopo_padrao?: string | null;
  status: AcessoStatus | string;
  escopos_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EscopoApi {
  id: string;
  company_id: string;
  modulo: string;
  acao: string;
  descricao?: string | null;
  status: AcessoStatus | string;
  created_at: string;
  updated_at: string;
}

export interface UsuarioPerfilApi {
  id: string;
  usuario_id: string;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  perfil_id: string;
  perfil_nome?: string | null;
  principal: boolean;
  status: AcessoStatus | string;
  created_at: string;
  updated_at: string;
}

export interface PerfilEscopoApi {
  id: string;
  perfil_id: string;
  perfil_nome?: string | null;
  escopo_id: string;
  modulo?: string | null;
  acao?: string | null;
  escopo_descricao?: string | null;
  status: AcessoStatus | string;
  created_at: string;
  updated_at: string;
}

export interface AlcadaApi {
  id: string;
  company_id: string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  perfil_id?: string | null;
  perfil_nome?: string | null;
  modulo: string;
  tipo_documento: string;
  acao: string;
  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  valor_minimo: string | number;
  valor_maximo?: string | number | null;
  efeito: 'PERMITIR' | 'NEGAR' | string;
  observacoes?: string | null;
  status: AcessoStatus | string;
  created_at: string;
  updated_at: string;
}

export interface PerfilPayload {
  company_id?: string;
  nome: string;
  descricao?: string | null;
  escopo_padrao?: string | null;
  status?: AcessoStatus;
}

export interface EscopoPayload {
  company_id?: string;
  modulo: string;
  acao: string;
  descricao?: string | null;
  status?: AcessoStatus;
}

export interface UsuarioPerfilPayload {
  usuario_id: string;
  perfil_id: string;
  principal?: boolean;
  status?: AcessoStatus;
}

export interface PerfilEscopoPayload {
  perfil_id: string;
  escopo_id: string;
  status?: AcessoStatus;
}

export interface AlcadaPayload {
  company_id?: string;
  usuario_id?: string | null;
  perfil_id?: string | null;
  modulo: string;
  tipo_documento: string;
  acao: string;
  obra_id?: string | null;
  centro_custo_id?: string | null;
  valor_minimo: number;
  valor_maximo?: number | null;
  efeito?: 'PERMITIR' | 'NEGAR';
  observacoes?: string | null;
  status?: AcessoStatus;
}

export interface ValidarAlcadaPayload {
  usuario_id: string;
  modulo: string;
  tipo_documento: string;
  acao: string;
  valor: number;
  obra_id?: string | null;
  centro_custo_id?: string | null;
}

export interface ValidarAlcadaResponse {
  aprovado: boolean;
  decisao: 'PERMITIDO' | 'NEGADO' | string;
  motivo: string;
  usuario: UsuarioApi;
  perfis: PerfilApi[];
  regra?: AlcadaApi | null;
}

export type SolicitacaoCompraStatus =
  | 'RASCUNHO'
  | 'ENVIADA'
  | 'EM_ANALISE'
  | 'APROVADA_PARA_COTACAO'
  | 'DEVOLVIDA'
  | 'CANCELADA';

export type SolicitacaoCompraPrioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type AprovacaoStatus =
  | 'PENDENTE_APROVACAO'
  | 'APROVADO_TECNICO'
  | 'APROVADO_DIRETORIA'
  | 'REPROVADO'
  | 'DEVOLVIDO'
  | 'BLOQUEADO_ALCADA';

export type AprovacaoAction = 'aprovar-tecnico' | 'aprovar-diretoria';

export interface AprovacaoPayload {
  usuario_id: string;
  observacoes?: string | null;
}

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
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
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
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
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
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
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
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
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

export type ContaPagarStatus = 'PROVISIONADA' | 'APROVADA' | 'AGUARDANDO_PROGRAMACAO' | 'PROGRAMADA' | 'BAIXADA_MANUAL' | 'PAGA' | 'CANCELADA';
export type ContaPagarBaixaStatus = 'BAIXA_PENDENTE' | 'BAIXADA_MANUAL' | 'BAIXA_ESTORNADA' | 'BLOQUEADA_BAIXA';

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
  ativo?: boolean;
  divergencia_pendente?: boolean;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
  baixa_status?: ContaPagarBaixaStatus | null;
  baixado_manual_por?: string | null;
  baixado_manual_por_nome?: string | null;
  baixado_manual_em?: string | null;
  baixa_manual_data?: string | null;
  baixa_manual_valor?: string | number | null;
  baixa_manual_forma_pagamento?: string | null;
  baixa_manual_observacoes?: string | null;
  baixa_manual_referencia_anexo?: string | null;
  baixa_status_anterior?: string | null;
  baixa_status_novo?: string | null;
  bloqueio_baixa_motivo?: string | null;
  programacao_baixa_id?: string | null;
  programacao_baixa_codigo?: string | null;
  programacao_baixa_status?: string | null;
  programacao_baixa_liberacao_status?: string | null;
  programacao_baixa_conferencia_status?: string | null;
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

export interface ContaPagarBaixaPayload {
  usuario_id: string;
  data_baixa: string;
  valor_baixado: number;
  forma_pagamento_manual: string;
  observacoes: string;
  referencia_anexo?: string | null;
}

export interface ContaPagarEstornoPayload {
  usuario_id: string;
  observacoes: string;
}

export interface ContaPagarBaixaApi {
  id: string;
  conta_pagar_id: string;
  programacao_id?: string | null;
  programacao_codigo?: string | null;
  acao: 'BAIXAR_MANUAL' | 'ESTORNAR_BAIXA' | string;
  status_anterior: string;
  status_novo: string;
  baixa_status: ContaPagarBaixaStatus | string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  valor_baixado: string | number;
  data_baixa?: string | null;
  forma_pagamento_manual?: string | null;
  observacoes?: string | null;
  referencia_anexo?: string | null;
  resultado: 'PERMITIDO' | 'NEGADO' | string;
  motivo?: string | null;
  created_at: string;
}

export interface RelatorioFinanceiroFilters {
  [key: string]: string | undefined;
  periodo_de?: string;
  periodo_ate?: string;
  fornecedor_id?: string;
  obra_id?: string;
  centro_custo_id?: string;
  status?: string;
  vencimento_de?: string;
  vencimento_ate?: string;
  valor_min?: string;
  valor_max?: string;
}

export interface RelatorioContaResumoApi {
  totais: Record<string, string | number | null>;
  por_status: Array<Record<string, string | number | null>>;
  por_vencimento: Array<Record<string, string | number | boolean | null>>;
  baixas_manuais_por_periodo: Array<Record<string, string | number | null>>;
}

export interface RelatorioProgramacaoResumoApi {
  totais: Record<string, string | number | null>;
  por_status: Array<Record<string, string | number | null>>;
  programacoes: Array<Record<string, string | number | null>>;
}

export type RelatorioAgrupadoApi = Record<string, string | number | null>;
export type RelatorioAgingApi = Record<string, string | number | null>;
export type RelatorioFluxoPrevistoApi = Record<string, string | number | null>;

export interface PrevistoRealizadoFilters {
  [key: string]: string | undefined;
  obra_id?: string;
  cliente_id?: string;
  centro_custo_id?: string;
  contrato_id?: string;
  competencia_de?: string;
  competencia_ate?: string;
}

export interface PrevistoRealizadoObraResumoApi {
  [key: string]: string | number | boolean | null | undefined;
  obra_id: string;
  obra_codigo: string;
  obra_nome: string;
  obra_status: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  orcamento_id?: string | null;
  orcamento_codigo?: string | null;
  valor_contratado: string | number;
  valor_aditado: string | number;
  valor_total_contratado: string | number;
  orcamento_previsto: string | number;
  custo_comprometido: string | number;
  custo_realizado: string | number;
  custo_baixado_manual: string | number;
  receita_medida: string | number;
  receita_faturada_manual: string | number;
  margem_prevista: string | number;
  margem_realizada: string | number;
  desvio_absoluto: string | number;
  desvio_percentual?: string | number | null;
  saldo_contratual: string | number;
  saldo_orcamentario: string | number;
  saldo_a_faturar: string | number;
  alerta_sem_orcamento_aprovado: boolean;
  alerta_sem_contrato_ativo: boolean;
  alerta_custo_acima_previsto: boolean;
  alerta_faturamento_abaixo_previsto: boolean;
  alerta_margem_negativa: boolean;
}

export interface PrevistoRealizadoCurvaApi {
  [key: string]: string | number | null;
  competencia: string;
  previsto: string | number;
  realizado: string | number;
  faturado: string | number;
  baixado_manual: string | number;
  diferenca_mensal: string | number;
  acumulado_previsto: string | number;
  acumulado_realizado: string | number;
  acumulado_faturado: string | number;
}

export type PrevistoRealizadoAgrupamentoApi = Record<string, string | number | null>;

export interface PrevistoRealizadoDetalheFinanceiroApi {
  totais: Record<string, string | number | null>;
  [key: string]: Record<string, string | number | null> | Array<Record<string, string | number | null>>;
}

export interface PrevistoRealizadoPortfolioApi {
  totais: Record<string, string | number | null>;
  alertas: Record<string, number>;
  formulas: Record<string, string>;
  obras: PrevistoRealizadoObraResumoApi[];
}

export interface DashboardExecutivoFilters {
  [key: string]: string | undefined;
  obra_id?: string;
  cliente_id?: string;
  centro_custo_id?: string;
  contrato_id?: string;
  status_obra?: string;
  periodo_de?: string;
  periodo_ate?: string;
}

export interface DashboardExecutivoResumoApi {
  kpis: Record<string, string | number | null>;
  alertas_resumo: Record<string, string | number | null>;
  formulas: Record<string, string>;
}

export interface DashboardExecutivoObraApi {
  [key: string]: string | number | boolean | null | undefined;
  obra_id: string;
  obra_codigo: string;
  obra_nome: string;
  obra_status: string;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  valor_contratado: string | number;
  valor_aditado: string | number;
  valor_total_contratado: string | number;
  orcamento_previsto: string | number;
  custo_comprometido: string | number;
  custo_realizado: string | number;
  custo_baixado_manual: string | number;
  receita_medida: string | number;
  receita_faturada_manual: string | number;
  margem_prevista: string | number;
  margem_realizada: string | number;
  desvio_orcamento: string | number;
  desvio_percentual?: string | number | null;
  saldo_a_faturar: string | number;
  saldo_orcamentario: string | number;
  saldo_contratual: string | number;
  contas_abertas: string | number;
  contas_vencidas: string | number;
  contas_a_vencer: string | number;
  programacoes_liberadas: string | number;
  programacoes_conferidas: string | number;
  baixas_manuais: string | number;
  medicoes_pendentes: string | number;
  pedidos_faturamento_pendentes: string | number;
}

export interface DashboardExecutivoAlertaApi {
  tipo: string;
  severidade: string;
  obra_id: string;
  obra_codigo: string;
  obra_nome: string;
  cliente_nome?: string | null;
  valor?: string | number | null;
  mensagem: string;
}

export interface DashboardExecutivoTendenciaApi {
  [key: string]: string | number | null;
  competencia: string;
  faturamento_previsto: string | number;
  receita_medida: string | number;
  receita_faturada_manual: string | number;
  custo_realizado: string | number;
  margem_mensal: string | number;
  acumulado_previsto: string | number;
  acumulado_faturado: string | number;
  acumulado_custo: string | number;
}

export interface DashboardExecutivoRankingApi {
  maior_faturamento: DashboardExecutivoObraApi[];
  maior_custo_realizado: DashboardExecutivoObraApi[];
  maior_desvio_orcamento: DashboardExecutivoObraApi[];
  menor_margem: DashboardExecutivoObraApi[];
  maior_saldo_a_faturar: DashboardExecutivoObraApi[];
  maiores_contas_em_aberto: DashboardExecutivoObraApi[];
}

export interface DashboardExecutivoDetalheApi {
  totais: Record<string, string | number | null>;
  [key: string]: Record<string, string | number | null> | Array<Record<string, string | number | null>> | string | number | null;
}

export type RiscoPendenciaStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_TERCEIRO' | 'BLOQUEADA' | 'RESOLVIDA' | 'CANCELADA';
export type RiscoPendenciaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type RiscoPendenciaTipo = 'FINANCEIRO' | 'COMPRA' | 'CONTRATO' | 'OBRA' | 'MEDICAO' | 'FATURAMENTO' | 'ORCAMENTO' | 'MARGEM' | 'DOCUMENTACAO' | 'OUTROS';

export interface RiscosPendenciasFilters {
  [key: string]: string | undefined;
  status?: RiscoPendenciaStatus | '';
  prioridade?: RiscoPendenciaPrioridade | '';
  tipo?: RiscoPendenciaTipo | '';
  responsavel_id?: string;
  obra_id?: string;
  cliente_id?: string;
  vencida?: string;
  texto?: string;
}

export interface RiscoPendenciaApi {
  [key: string]: unknown;
  id: string;
  company_id: string;
  codigo: string;
  titulo: string;
  descricao?: string | null;
  tipo: RiscoPendenciaTipo;
  prioridade: RiscoPendenciaPrioridade;
  status: RiscoPendenciaStatus;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  prazo?: string | null;
  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  contrato_obra_id?: string | null;
  contrato_numero?: string | null;
  dashboard_alerta_tipo?: string | null;
  origem?: string | null;
  vencida?: boolean;
  a_vencer?: boolean;
  resolucao?: string | null;
  created_at: string;
  updated_at: string;
  comentarios?: Array<Record<string, unknown>>;
  historico?: Array<Record<string, unknown>>;
}

export interface RiscoPendenciaPayload {
  company_id?: string;
  titulo: string;
  descricao?: string;
  tipo: RiscoPendenciaTipo;
  prioridade: RiscoPendenciaPrioridade;
  responsavel_id?: string;
  prazo?: string;
  obra_id?: string;
  cliente_id?: string;
  contrato_obra_id?: string;
  usuario_id?: string;
  comentario?: string;
}

export interface RiscoPendenciaUpdatePayload {
  titulo?: string;
  descricao?: string;
  tipo?: RiscoPendenciaTipo;
  prioridade?: RiscoPendenciaPrioridade;
  status?: Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'>;
  responsavel_id?: string;
  prazo?: string;
  obra_id?: string;
  cliente_id?: string;
  contrato_obra_id?: string;
  usuario_id?: string;
  comentario?: string;
}

export interface RiscoPendenciaActionPayload {
  usuario_id?: string;
  comentario?: string;
  observacoes?: string;
  justificativa?: string;
  motivo?: string;
  resolucao?: string;
}

export interface RiscoPendenciaAlertaPayload {
  company_id?: string;
  usuario_id?: string;
  responsavel_id?: string;
  prazo?: string;
  alerta: {
    tipo: string;
    severidade: string;
    mensagem: string;
    obra_id?: string;
    cliente_id?: string;
  };
}

export type AuditoriaSeveridade = 'INFO' | 'MEDIA' | 'ALTA' | 'CRITICA' | string;

export interface AuditoriaFilters {
  [key: string]: string | undefined;
  periodo_de?: string;
  periodo_ate?: string;
  usuario_id?: string;
  modulo?: string;
  acao?: string;
  entidade?: string;
  entidade_id?: string;
  obra_id?: string;
  contrato_id?: string;
  centro_custo_id?: string;
  severidade?: string;
  resultado?: string;
  texto?: string;
  limit?: string;
}

export interface AuditoriaEventoApi {
  [key: string]: unknown;
  id: string;
  company_id?: string | null;
  empresa_nome?: string | null;
  entidade: string;
  entidade_id?: string | null;
  acao: string;
  payload: Record<string, unknown>;
  created_at: string;
  created_by?: string | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  modulo: string;
  tipo_documento?: string | null;
  resultado: string;
  severidade: AuditoriaSeveridade;
  obra_id?: string | null;
  contrato_id?: string | null;
  centro_custo_id?: string | null;
  status_anterior?: string | null;
  status_novo?: string | null;
  descricao_resumida?: string | null;
}

export interface AuditoriaResumoApi {
  total: number;
  criticos: number;
  bloqueios_alcada: number;
  aprovacoes: number;
  reprovacoes: number;
  cancelamentos: number;
  baixas_manuais: number;
  usuarios_distintos: number;
  modulos_distintos: number;
  primeiro_evento?: string | null;
  ultimo_evento?: string | null;
}

export interface AuditoriaModuloApi {
  modulo: string;
  total: number;
  criticos: number;
  bloqueios: number;
  aprovacoes: number;
  negativas: number;
  ultimo_evento?: string | null;
}

export interface AuditoriaDetalheApi {
  evento: AuditoriaEventoApi;
  timeline: AuditoriaEventoApi[];
}

export type CentralTarefaManualStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type CentralTarefaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type CentralTarefaTipo = 'MANUAL' | 'APROVACAO' | 'PENDENCIA' | 'OPERACIONAL' | 'ALERTA' | string;

export interface CentralTarefasFilters {
  [key: string]: string | undefined;
  modulo?: string;
  prioridade?: CentralTarefaPrioridade | '';
  status?: string;
  obra_id?: string;
  responsavel_id?: string;
  perfil_id?: string;
  usuario_id?: string;
  prazo_de?: string;
  prazo_ate?: string;
  texto?: string;
}

export interface CentralTarefaApi {
  [key: string]: unknown;
  id: string;
  manual_id?: string | null;
  tipo: CentralTarefaTipo;
  titulo: string;
  descricao?: string | null;
  modulo: string;
  origem: string;
  origem_id?: string | null;
  status: string;
  prioridade: CentralTarefaPrioridade | string;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  perfil_id?: string | null;
  perfil_nome?: string | null;
  prazo?: string | null;
  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  created_at: string;
  idade_dias?: number;
  atrasada?: boolean;
  critica?: boolean;
  navigation_section?: string | null;
  navigation_label?: string | null;
  historico?: Array<Record<string, unknown>>;
}

export interface CentralTarefasResumoApi {
  total: number;
  abertas: number;
  aprovacoes_pendentes: number;
  atrasadas: number;
  criticas: number;
  modulos_com_tarefas: number;
  proximo_prazo?: string | null;
}

export interface CentralTarefasModuloApi {
  modulo: string;
  total: number;
  abertas: number;
  aprovacoes: number;
  atrasadas: number;
  criticas: number;
  proximo_prazo?: string | null;
  ultimo_evento?: string | null;
}

export interface CentralTarefaManualPayload {
  company_id?: string;
  titulo: string;
  descricao?: string;
  modulo?: string;
  origem?: string;
  origem_id?: string;
  prioridade?: CentralTarefaPrioridade;
  responsavel_id?: string;
  perfil_id?: string;
  prazo?: string;
  obra_id?: string;
  cliente_id?: string;
  usuario_id?: string;
  comentario?: string;
}

export interface CentralTarefaActionPayload {
  usuario_id?: string;
  comentario?: string;
  observacoes?: string;
  justificativa?: string;
  motivo?: string;
  resolucao?: string;
}

export type ProgramacaoPagamentoStatus = 'RASCUNHO' | 'SUBMETIDA' | 'APROVADA' | 'LIBERADA' | 'REPROVADA' | 'CANCELADA';
export type ProgramacaoPagamentoConferenciaStatus = 'PENDENTE_CONFERENCIA' | 'CONFERIDA' | 'BLOQUEADA_CONFERENCIA' | 'DEVOLVIDA';

export interface ProgramacaoPagamentoConferenciaChecklist {
  fornecedor_conferido: boolean;
  documento_fiscal_conferido: boolean;
  valor_conferido: boolean;
  vencimento_conferido: boolean;
  obra_conferida: boolean;
  centro_custo_conferido: boolean;
  forma_pagamento_prevista_conferida: boolean;
  ressalva?: boolean;
}

export interface ContaPagarElegibilidadeApi extends ContaPagarApi {
  ativo: boolean;
  divergencia_pendente: boolean;
  nota_status?: string | null;
  elegivel: boolean;
  bloqueios: string[];
  programacao_ativa_id?: string | null;
  programacao_ativa_codigo?: string | null;
  programacao_ativa_status?: ProgramacaoPagamentoStatus | null;
}

export interface ProgramacaoPagamentoContaApi {
  id: string;
  conta_pagar_id: string;
  numero_documento: string;
  status: ContaPagarStatus;
  aprovacao_status?: AprovacaoStatus | null;
  valor_programado: string | number;
  valor_aberto: string | number;
  data_vencimento: string;
  fornecedor_id: string;
  fornecedor_nome?: string | null;
  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  forma_pagamento_prevista?: string | null;
  item_status: string;
  observacoes?: string | null;
}

export interface ProgramacaoPagamentoApi {
  id: string;
  company_id: string;
  codigo: string;
  status: ProgramacaoPagamentoStatus;
  liberacao_status?: 'PENDENTE_LIBERACAO' | 'LIBERADA' | 'BLOQUEADA_LIBERACAO' | 'CANCELADA' | null;
  conferencia_status?: ProgramacaoPagamentoConferenciaStatus | null;
  data_prevista: string;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  obra_id?: string | null;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  forma_pagamento_prevista?: string | null;
  valor_total: string | number;
  quantidade_contas: number;
  observacoes?: string | null;
  justificativa?: string | null;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
  liberado_por?: string | null;
  liberado_por_nome?: string | null;
  liberado_em?: string | null;
  liberacao_justificativa?: string | null;
  liberacao_valor_total?: string | number | null;
  liberacao_quantidade_contas?: number | null;
  liberacao_alcada_origem?: string | null;
  liberacao_status_anterior?: string | null;
  bloqueio_liberacao_motivo?: string | null;
  conferido_por?: string | null;
  conferido_por_nome?: string | null;
  conferido_em?: string | null;
  conferencia_observacoes?: string | null;
  conferencia_checklist?: ProgramacaoPagamentoConferenciaChecklist | null;
  conferencia_valor_total?: string | number | null;
  conferencia_quantidade_contas?: number | null;
  conferencia_status_anterior?: string | null;
  conferencia_status_novo?: string | null;
  bloqueio_conferencia_motivo?: string | null;
  submetido_por?: string | null;
  submetido_por_nome?: string | null;
  submetido_em?: string | null;
  cancelado_por?: string | null;
  cancelado_por_nome?: string | null;
  cancelado_em?: string | null;
  cancelamento_motivo?: string | null;
  created_at: string;
  updated_at: string;
  contas?: ProgramacaoPagamentoContaApi[];
}

export interface ProgramacaoPagamentoLiberacaoApi {
  id: string;
  programacao_id: string;
  status_anterior: string;
  status_novo: string;
  liberacao_status: string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  valor_total_liberado: string | number;
  quantidade_contas: number;
  origem_alcada?: string | null;
  justificativa?: string | null;
  resultado: string;
  motivo?: string | null;
  created_at: string;
}

export interface ProgramacaoPagamentoConferenciaApi {
  id: string;
  programacao_id: string;
  acao: string;
  status_anterior: string;
  status_novo: string;
  conferencia_status: ProgramacaoPagamentoConferenciaStatus | string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  valor_total_conferido: string | number;
  quantidade_contas: number;
  checklist?: ProgramacaoPagamentoConferenciaChecklist | null;
  observacoes?: string | null;
  resultado: string;
  motivo?: string | null;
  created_at: string;
}

export interface ProgramacaoPagamentoFilters {
  status?: ProgramacaoPagamentoStatus | '';
  fornecedor_id?: string;
  obra_id?: string;
}

export interface ProgramacaoPagamentoPayload {
  company_id: string;
  data_prevista: string;
  fornecedor_id?: string | null;
  obra_id?: string | null;
  centro_custo_id?: string | null;
  forma_pagamento_prevista?: string | null;
  observacoes?: string | null;
  justificativa?: string | null;
  usuario_id?: string | null;
  contas?: string[];
}

export interface ProgramacaoPagamentoContaPayload {
  conta_pagar_id: string;
  usuario_id?: string | null;
  observacoes?: string | null;
}

export interface ProgramacaoPagamentoActionPayload {
  usuario_id?: string | null;
  usuarioId?: string | null;
  observacoes?: string | null;
  justificativa?: string | null;
}

export interface ProgramacaoPagamentoConferenciaPayload extends ProgramacaoPagamentoActionPayload {
  checklist: ProgramacaoPagamentoConferenciaChecklist;
}

export type ContratoObraStatus = 'RASCUNHO' | 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' | 'CANCELADO';
export type ContratoObraAditivoStatus = 'RASCUNHO' | 'SUBMETIDO' | 'APROVADO' | 'REPROVADO' | 'CANCELADO';

export interface ContratoObraItemApi {
  id: string;
  contrato_id: string;
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  etapa_servico?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  inativado_por?: string | null;
  inativado_em?: string | null;
  inativacao_motivo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratoObraAditivoApi {
  id: string;
  contrato_id: string;
  numero: string;
  tipo: string;
  descricao: string;
  escopo_descricao?: string | null;
  valor_delta: string | number;
  prazo_delta_dias?: number | null;
  nova_data_fim?: string | null;
  justificativa?: string | null;
  status: ContratoObraAditivoStatus;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  bloqueio_alcada_motivo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratoObraApi {
  id: string;
  company_id: string;
  cliente_id: string;
  cliente_nome?: string | null;
  obra_id: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  numero: string;
  objeto: string;
  escopo_resumo?: string | null;
  valor_original: string | number;
  valor_aditivos: string | number;
  valor_total_contratado: string | number;
  valor_medido?: string | number;
  valor_faturado?: string | number;
  saldo_contratual?: string | number;
  data_inicio?: string | null;
  data_fim?: string | null;
  percentual_retencao_previsto?: string | number | null;
  impostos_previstos?: string | null;
  observacoes?: string | null;
  status: ContratoObraStatus;
  created_at: string;
  updated_at: string;
  itens?: ContratoObraItemApi[];
  aditivos?: ContratoObraAditivoApi[];
}

export interface ContratoObraFilters {
  status?: ContratoObraStatus | '';
  cliente_id?: string;
  obra_id?: string;
}

export interface ContratoObraPayload {
  company_id: string;
  cliente_id: string;
  obra_id: string;
  centro_custo_id?: string | null;
  numero: string;
  objeto: string;
  escopo_resumo?: string | null;
  valor_original: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  percentual_retencao_previsto?: number | null;
  impostos_previstos?: string | null;
  observacoes?: string | null;
  usuario_id?: string | null;
}

export type ContratoObraUpdatePayload = Partial<Omit<ContratoObraPayload, 'company_id'>>;

export interface ContratoObraItemPayload {
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  centro_custo_id?: string | null;
  etapa_servico?: string | null;
  usuario_id?: string | null;
}

export interface ContratoObraAditivoPayload {
  numero: string;
  tipo?: string | null;
  descricao: string;
  escopo_descricao?: string | null;
  valor_delta: number;
  prazo_delta_dias?: number | null;
  nova_data_fim?: string | null;
  justificativa?: string | null;
  usuario_id?: string | null;
}

export interface ContratoObraActionPayload {
  usuario_id: string;
  observacoes?: string | null;
  justificativa?: string | null;
  motivo?: string | null;
}

export type OrcamentoObraStatus = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'BLOQUEADO' | 'CANCELADO';
export type OrcamentoItemTipo = 'MATERIAL' | 'MAO_DE_OBRA' | 'EQUIPAMENTO' | 'SERVICO' | 'OUTROS';
export type PlanejamentoExecutivoStatus = 'RASCUNHO' | 'ATIVO' | 'REVISADO' | 'ENCERRADO' | 'CANCELADO';

export interface OrcamentoObraPacoteApi {
  id: string;
  orcamento_id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  etapa?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  ordem?: number | null;
  status: 'ATIVO' | 'INATIVO' | string;
  valor_total_previsto?: string | number | null;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoObraItemApi {
  id: string;
  orcamento_id: string;
  pacote_id?: string | null;
  pacote_codigo?: string | null;
  pacote_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  tipo: OrcamentoItemTipo;
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario_previsto: string | number;
  valor_total_previsto: string | number;
  insumo_descricao?: string | null;
  mao_obra_categoria?: string | null;
  equipamento_descricao?: string | null;
  observacoes?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoObraCronogramaApi {
  id: string;
  orcamento_id: string;
  pacote_id?: string | null;
  pacote_codigo?: string | null;
  pacote_nome?: string | null;
  competencia: string;
  valor_previsto: string | number;
  percentual_fisico_previsto?: string | number | null;
  observacoes?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoObraApi {
  id: string;
  company_id: string;
  obra_id: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  contrato_obra_id?: string | null;
  contrato_obra_numero?: string | null;
  contrato_obra_valor_total?: string | number | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  codigo: string;
  versao: string;
  descricao: string;
  competencia_base?: string | null;
  valor_previsto_total: string | number;
  valor_material: string | number;
  valor_mao_obra: string | number;
  valor_equipamento: string | number;
  valor_servico: string | number;
  valor_outros: string | number;
  margem_prevista_percentual?: string | number | null;
  observacoes?: string | null;
  status: OrcamentoObraStatus;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  bloqueio_motivo?: string | null;
  cancelamento_motivo?: string | null;
  created_at: string;
  updated_at: string;
  pacotes?: OrcamentoObraPacoteApi[];
  itens?: OrcamentoObraItemApi[];
  cronograma?: OrcamentoObraCronogramaApi[];
}

export interface OrcamentoObraResumoApi {
  id: string;
  codigo: string;
  status: OrcamentoObraStatus;
  valor_previsto_total: string | number;
  valor_material: string | number;
  valor_mao_obra: string | number;
  valor_equipamento: string | number;
  valor_servico: string | number;
  valor_outros: string | number;
  valor_total_contratado?: string | number | null;
  diferenca_contrato_orcamento?: string | number | null;
  total_cronograma: string | number;
  valor_compras_realizado: string | number;
  valor_medido_realizado: string | number;
  valor_faturado_realizado: string | number;
  totais_por_tipo?: Array<{ tipo: OrcamentoItemTipo; valor_total: string | number }>;
  totais_por_pacote?: Array<{ pacote_id: string; pacote_codigo: string; pacote_nome: string; valor_total: string | number }>;
}

export interface OrcamentoObraFilters {
  status?: OrcamentoObraStatus | '';
  obra_id?: string;
  contrato_obra_id?: string;
}

export interface OrcamentoObraPayload {
  company_id: string;
  obra_id: string;
  contrato_obra_id?: string | null;
  centro_custo_id?: string | null;
  codigo: string;
  versao?: string | null;
  descricao: string;
  competencia_base?: string | null;
  margem_prevista_percentual?: number | null;
  observacoes?: string | null;
  usuario_id?: string | null;
}

export type OrcamentoObraUpdatePayload = Partial<Omit<OrcamentoObraPayload, 'company_id' | 'obra_id'>>;

export interface OrcamentoObraPacotePayload {
  codigo: string;
  nome: string;
  descricao?: string | null;
  etapa?: string | null;
  centro_custo_id?: string | null;
  ordem?: number | null;
  usuario_id?: string | null;
}

export interface OrcamentoObraItemPayload {
  pacote_id?: string | null;
  centro_custo_id?: string | null;
  tipo: OrcamentoItemTipo;
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario_previsto: number;
  insumo_descricao?: string | null;
  mao_obra_categoria?: string | null;
  equipamento_descricao?: string | null;
  observacoes?: string | null;
  usuario_id?: string | null;
}

export interface OrcamentoObraCronogramaPayload {
  pacote_id?: string | null;
  competencia: string;
  valor_previsto: number;
  percentual_fisico_previsto?: number | null;
  observacoes?: string | null;
  usuario_id?: string | null;
}

export interface OrcamentoObraActionPayload {
  usuario_id: string;
  observacoes?: string | null;
  justificativa?: string | null;
  motivo?: string | null;
}

export interface PlanejamentoExecutivoApi {
  id: string;
  company_id: string;
  obra_id: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  orcamento_id?: string | null;
  orcamento_codigo?: string | null;
  orcamento_versao?: string | null;
  contrato_obra_id?: string | null;
  contrato_obra_numero?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  etapa: string;
  descricao?: string | null;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  observacoes?: string | null;
  status: PlanejamentoExecutivoStatus;
  revisao_motivo?: string | null;
  encerramento_motivo?: string | null;
  cancelamento_motivo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanejamentoExecutivoFilters {
  status?: PlanejamentoExecutivoStatus | '';
  obra_id?: string;
  orcamento_id?: string;
}

export interface PlanejamentoExecutivoPayload {
  company_id: string;
  obra_id: string;
  orcamento_id?: string | null;
  contrato_obra_id?: string | null;
  centro_custo_id?: string | null;
  etapa: string;
  descricao?: string | null;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  responsavel_id?: string | null;
  observacoes?: string | null;
  usuario_id?: string | null;
}

export type PlanejamentoExecutivoUpdatePayload = Partial<Omit<PlanejamentoExecutivoPayload, 'company_id' | 'obra_id'>>;

export type MedicaoStatus =
  | 'RASCUNHO'
  | 'SUBMETIDA'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'DEVOLVIDA'
  | 'CANCELADA'
  | 'FATURAMENTO_SOLICITADO'
  | 'FATURADO_MANUALMENTE';

export type PedidoFaturamentoStatus = 'SOLICITADO' | 'APROVADO' | 'FATURADO_MANUALMENTE' | 'CANCELADO';

export interface MedicaoItemApi {
  id: string;
  medicao_id: string;
  descricao: string;
  unidade: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  etapa_servico?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  inativado_por?: string | null;
  inativado_em?: string | null;
  inativacao_motivo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PedidoFaturamentoResumoApi {
  id: string;
  codigo: string;
  status: PedidoFaturamentoStatus;
  valor_solicitado: string | number;
  data_solicitacao: string;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  faturado_manual_por?: string | null;
  faturado_manual_em?: string | null;
  faturado_manual_data?: string | null;
  faturado_manual_observacoes?: string | null;
}

export interface MedicaoApi {
  id: string;
  company_id: string;
  obra_id: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  cliente_id: string;
  cliente_nome?: string | null;
  centro_custo_id?: string | null;
  centro_custo_codigo?: string | null;
  centro_custo_nome?: string | null;
  contrato_obra_id?: string | null;
  contrato_obra_numero?: string | null;
  contrato_obra_valor_total?: string | number | null;
  contrato_obra_aditivo_id?: string | null;
  contrato_obra_aditivo_numero?: string | null;
  contrato_cliente_id?: string | null;
  contrato_escopo?: string | null;
  numero: string;
  competencia: string;
  periodo_inicio: string;
  periodo_fim: string;
  valor_medido?: string | number;
  valor_bruto: string | number;
  valor_retido?: string | number;
  retencoes_previstas: string | number;
  impostos_estimados: string | number;
  valor_liquido_previsto: string | number;
  percentual_fisico?: string | number | null;
  status: MedicaoStatus;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
  submetido_por?: string | null;
  submetido_por_nome?: string | null;
  submetido_em?: string | null;
  devolvido_por?: string | null;
  devolvido_por_nome?: string | null;
  devolvido_em?: string | null;
  devolucao_motivo?: string | null;
  cancelado_por?: string | null;
  cancelado_por_nome?: string | null;
  cancelado_em?: string | null;
  cancelamento_motivo?: string | null;
  faturamento_solicitado_por?: string | null;
  faturamento_solicitado_por_nome?: string | null;
  faturamento_solicitado_em?: string | null;
  faturado_manual_por?: string | null;
  faturado_manual_por_nome?: string | null;
  faturado_manual_em?: string | null;
  faturado_manual_data?: string | null;
  faturado_manual_observacoes?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
  itens_ativos?: number;
  itens?: MedicaoItemApi[];
  pedido_faturamento?: PedidoFaturamentoResumoApi | null;
}

export interface PedidoFaturamentoApi {
  id: string;
  medicao_id: string;
  medicao_numero?: string | null;
  company_id: string;
  cliente_id: string;
  cliente_nome?: string | null;
  obra_id: string;
  obra_codigo?: string | null;
  obra_nome?: string | null;
  contrato_obra_id?: string | null;
  contrato_obra_numero?: string | null;
  contrato_obra_aditivo_id?: string | null;
  contrato_obra_aditivo_numero?: string | null;
  codigo: string;
  valor_solicitado: string | number;
  data_solicitacao: string;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  status: PedidoFaturamentoStatus;
  aprovacao_status?: AprovacaoStatus | null;
  aprovado_por?: string | null;
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  aprovacao_observacoes?: string | null;
  bloqueio_alcada_motivo?: string | null;
  faturado_manual_por?: string | null;
  faturado_manual_por_nome?: string | null;
  faturado_manual_em?: string | null;
  faturado_manual_data?: string | null;
  faturado_manual_observacoes?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicaoFilters {
  status?: MedicaoStatus | '';
  obra_id?: string;
  cliente_id?: string;
  competencia_de?: string;
  competencia_ate?: string;
}

export interface MedicaoPayload {
  company_id: string;
  obra_id: string;
  cliente_id: string;
  centro_custo_id?: string | null;
  numero?: string | null;
  competencia: string;
  periodo_inicio: string;
  periodo_fim: string;
  contrato_obra_id?: string | null;
  contrato_obra_aditivo_id?: string | null;
  contrato_escopo?: string | null;
  responsavel_id?: string | null;
  usuario_id?: string | null;
  observacoes?: string | null;
  retencoes_previstas?: number;
  impostos_estimados?: number;
}

export type MedicaoUpdatePayload = Partial<Omit<MedicaoPayload, 'company_id'>>;

export interface MedicaoItemPayload {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  centro_custo_id?: string | null;
  etapa_servico?: string | null;
  usuario_id?: string | null;
}

export interface MedicaoActionPayload {
  usuario_id: string;
  observacoes?: string | null;
  justificativa?: string | null;
  motivo?: string | null;
}

export interface PedidoFaturamentoPayload {
  medicao_id: string;
  valor_solicitado?: number;
  data_solicitacao?: string;
  contrato_obra_id?: string | null;
  contrato_obra_aditivo_id?: string | null;
  responsavel_id?: string | null;
  usuario_id?: string | null;
  observacoes?: string | null;
}

export interface PedidoFaturamentoFilters {
  status?: PedidoFaturamentoStatus | '';
  medicao_id?: string;
  cliente_id?: string;
  obra_id?: string;
}

export interface PedidoFaturamentoManualPayload {
  usuario_id: string;
  data_faturamento: string;
  observacoes: string;
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
  perfis: {
    list: async (filters: { status?: AcessoStatus | '' } = {}): Promise<PerfilApi[]> =>
      (await request<ApiListResponse<PerfilApi>>(`/perfis${buildQueryString({ status: filters.status || undefined })}`)).data,
    get: async (id: string): Promise<PerfilApi> => (await request<ApiItemResponse<PerfilApi>>(`/perfis/${id}`)).data,
    create: async (payload: PerfilPayload): Promise<PerfilApi> =>
      (await request<ApiItemResponse<PerfilApi>>('/perfis', { method: 'POST', body: JSON.stringify(payload) })).data,
    update: async (id: string, payload: Partial<PerfilPayload>): Promise<PerfilApi> =>
      (await request<ApiItemResponse<PerfilApi>>(`/perfis/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<PerfilApi> =>
      (await request<ApiItemResponse<PerfilApi>>(`/perfis/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<PerfilApi> =>
      (await request<ApiItemResponse<PerfilApi>>(`/perfis/${id}/reativar`, { method: 'PATCH' })).data
  },
  escopos: {
    list: async (filters: { status?: AcessoStatus | ''; modulo?: string } = {}): Promise<EscopoApi[]> =>
      (await request<ApiListResponse<EscopoApi>>(
        `/escopos${buildQueryString({ status: filters.status || undefined, modulo: filters.modulo || undefined })}`
      )).data,
    create: async (payload: EscopoPayload): Promise<EscopoApi> =>
      (await request<ApiItemResponse<EscopoApi>>('/escopos', { method: 'POST', body: JSON.stringify(payload) })).data,
    update: async (id: string, payload: Partial<EscopoPayload>): Promise<EscopoApi> =>
      (await request<ApiItemResponse<EscopoApi>>(`/escopos/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<EscopoApi> =>
      (await request<ApiItemResponse<EscopoApi>>(`/escopos/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<EscopoApi> =>
      (await request<ApiItemResponse<EscopoApi>>(`/escopos/${id}/reativar`, { method: 'PATCH' })).data
  },
  usuariosPerfis: {
    list: async (): Promise<UsuarioPerfilApi[]> => (await request<ApiListResponse<UsuarioPerfilApi>>('/usuarios-perfis')).data,
    create: async (payload: UsuarioPerfilPayload): Promise<UsuarioPerfilApi> =>
      (await request<ApiItemResponse<UsuarioPerfilApi>>('/usuarios-perfis', { method: 'POST', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<UsuarioPerfilApi> =>
      (await request<ApiItemResponse<UsuarioPerfilApi>>(`/usuarios-perfis/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<UsuarioPerfilApi> =>
      (await request<ApiItemResponse<UsuarioPerfilApi>>(`/usuarios-perfis/${id}/reativar`, { method: 'PATCH' })).data
  },
  perfisEscopos: {
    list: async (): Promise<PerfilEscopoApi[]> => (await request<ApiListResponse<PerfilEscopoApi>>('/perfis-escopos')).data,
    create: async (payload: PerfilEscopoPayload): Promise<PerfilEscopoApi> =>
      (await request<ApiItemResponse<PerfilEscopoApi>>('/perfis-escopos', { method: 'POST', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<PerfilEscopoApi> =>
      (await request<ApiItemResponse<PerfilEscopoApi>>(`/perfis-escopos/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<PerfilEscopoApi> =>
      (await request<ApiItemResponse<PerfilEscopoApi>>(`/perfis-escopos/${id}/reativar`, { method: 'PATCH' })).data
  },
  alcadas: {
    list: async (filters: { status?: AcessoStatus | ''; modulo?: string } = {}): Promise<AlcadaApi[]> =>
      (await request<ApiListResponse<AlcadaApi>>(
        `/alcadas${buildQueryString({ status: filters.status || undefined, modulo: filters.modulo || undefined })}`
      )).data,
    create: async (payload: AlcadaPayload): Promise<AlcadaApi> =>
      (await request<ApiItemResponse<AlcadaApi>>('/alcadas', { method: 'POST', body: JSON.stringify(payload) })).data,
    update: async (id: string, payload: Partial<AlcadaPayload>): Promise<AlcadaApi> =>
      (await request<ApiItemResponse<AlcadaApi>>(`/alcadas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data,
    inativar: async (id: string): Promise<AlcadaApi> =>
      (await request<ApiItemResponse<AlcadaApi>>(`/alcadas/${id}/inativar`, { method: 'PATCH' })).data,
    reativar: async (id: string): Promise<AlcadaApi> =>
      (await request<ApiItemResponse<AlcadaApi>>(`/alcadas/${id}/reativar`, { method: 'PATCH' })).data,
    validar: async (payload: ValidarAlcadaPayload): Promise<ValidarAlcadaResponse> =>
      (await request<ApiItemResponse<ValidarAlcadaResponse>>('/alcadas/validar', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data
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
      })).data,
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<SolicitacaoCompraApi> =>
      (await request<ApiItemResponse<SolicitacaoCompraApi>>(`/solicitacoes-compra/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
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
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<CotacaoApi> =>
      (await request<ApiItemResponse<CotacaoApi>>(`/cotacoes/${id}/${action}`, {
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
      })).data,
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<PedidoCompraApi> =>
      (await request<ApiItemResponse<PedidoCompraApi>>(`/pedidos-compra/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
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
      })).data,
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<NotaEntradaApi> =>
      (await request<ApiItemResponse<NotaEntradaApi>>(`/notas-fiscais-entrada/${id}/${action}`, {
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
      })).data,
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    baixarManual: async (id: string, payload: ContaPagarBaixaPayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}/baixar-manual`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    estornarBaixa: async (id: string, payload: ContaPagarEstornoPayload): Promise<ContaPagarApi> =>
      (await request<ApiItemResponse<ContaPagarApi>>(`/contas-pagar/${id}/estornar-baixa`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    baixas: async (id: string): Promise<ContaPagarBaixaApi[]> =>
      (await request<ApiListResponse<ContaPagarBaixaApi>>(`/contas-pagar/${id}/baixas`)).data
  },
  programacoesPagamento: {
    list: async (filters: ProgramacaoPagamentoFilters = {}): Promise<ProgramacaoPagamentoApi[]> =>
      (await request<ApiListResponse<ProgramacaoPagamentoApi>>(
        `/programacoes-pagamento${buildQueryString({
          status: filters.status || undefined,
          fornecedor_id: filters.fornecedor_id,
          obra_id: filters.obra_id
        })}`
      )).data,
    get: async (id: string): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}`)).data,
    contasElegiveis: async (filters: { company_id?: string; incluir_bloqueadas?: boolean } = {}): Promise<ContaPagarElegibilidadeApi[]> =>
      (await request<ApiListResponse<ContaPagarElegibilidadeApi>>(
        `/programacoes-pagamento/contas-elegiveis${buildQueryString({
          company_id: filters.company_id,
          incluir_bloqueadas: filters.incluir_bloqueadas ? 'true' : undefined
        })}`
      )).data,
    create: async (payload: ProgramacaoPagamentoPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>('/programacoes-pagamento', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    adicionarConta: async (id: string, payload: ProgramacaoPagamentoContaPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/contas`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    removerConta: async (id: string, contaPagarId: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/contas/${contaPagarId}/remover`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    submeter: async (id: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/submeter`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    liberar: async (id: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/liberar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    conferirFinanceiro: async (id: string, payload: ProgramacaoPagamentoConferenciaPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/conferir-financeiro`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    devolverConferencia: async (id: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/devolver-conferencia`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    liberacoes: async (id: string): Promise<ProgramacaoPagamentoLiberacaoApi[]> =>
      (await request<ApiListResponse<ProgramacaoPagamentoLiberacaoApi>>(`/programacoes-pagamento/${id}/liberacoes`)).data,
    conferencias: async (id: string): Promise<ProgramacaoPagamentoConferenciaApi[]> =>
      (await request<ApiListResponse<ProgramacaoPagamentoConferenciaApi>>(`/programacoes-pagamento/${id}/conferencias`)).data,
    aprovar: async (id: string, action: AprovacaoAction, payload: AprovacaoPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    reprovar: async (id: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/reprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: ProgramacaoPagamentoActionPayload): Promise<ProgramacaoPagamentoApi> =>
      (await request<ApiItemResponse<ProgramacaoPagamentoApi>>(`/programacoes-pagamento/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  contratosObra: {
    list: async (filters: ContratoObraFilters = {}): Promise<ContratoObraApi[]> =>
      (await request<ApiListResponse<ContratoObraApi>>(
        `/contratos-obra${buildQueryString({
          status: filters.status || undefined,
          cliente_id: filters.cliente_id,
          obra_id: filters.obra_id
        })}`
      )).data,
    get: async (id: string): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}`)).data,
    create: async (payload: ContratoObraPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>('/contratos-obra', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: ContratoObraUpdatePayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    ativar: async (id: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/ativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    suspender: async (id: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/suspender`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    encerrar: async (id: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/encerrar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    addItem: async (id: string, payload: ContratoObraItemPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/itens`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updateItem: async (id: string, itemId: string, payload: Partial<ContratoObraItemPayload>): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/itens/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    inativarItem: async (id: string, itemId: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/itens/${itemId}/inativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    aditivos: async (id: string): Promise<ContratoObraAditivoApi[]> =>
      (await request<ApiListResponse<ContratoObraAditivoApi>>(`/contratos-obra/${id}/aditivos`)).data,
    createAditivo: async (id: string, payload: ContratoObraAditivoPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updateAditivo: async (id: string, aditivoId: string, payload: Partial<ContratoObraAditivoPayload>): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos/${aditivoId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    submeterAditivo: async (id: string, aditivoId: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos/${aditivoId}/submeter`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    aprovarAditivo: async (id: string, aditivoId: string, payload: AprovacaoPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos/${aditivoId}/aprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    reprovarAditivo: async (id: string, aditivoId: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos/${aditivoId}/reprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelarAditivo: async (id: string, aditivoId: string, payload: ContratoObraActionPayload): Promise<ContratoObraApi> =>
      (await request<ApiItemResponse<ContratoObraApi>>(`/contratos-obra/${id}/aditivos/${aditivoId}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  orcamentosObra: {
    list: async (filters: OrcamentoObraFilters = {}): Promise<OrcamentoObraApi[]> =>
      (await request<ApiListResponse<OrcamentoObraApi>>(
        `/orcamentos-obra${buildQueryString({
          status: filters.status || undefined,
          obra_id: filters.obra_id,
          contrato_obra_id: filters.contrato_obra_id
        })}`
      )).data,
    get: async (id: string): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}`)).data,
    create: async (payload: OrcamentoObraPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>('/orcamentos-obra', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: OrcamentoObraUpdatePayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    enviarRevisao: async (id: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/enviar-revisao`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    aprovar: async (id: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/aprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    bloquear: async (id: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/bloquear`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    pacotes: async (id: string): Promise<OrcamentoObraPacoteApi[]> =>
      (await request<ApiListResponse<OrcamentoObraPacoteApi>>(`/orcamentos-obra/${id}/pacotes`)).data,
    addPacote: async (id: string, payload: OrcamentoObraPacotePayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/pacotes`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updatePacote: async (id: string, pacoteId: string, payload: Partial<OrcamentoObraPacotePayload>): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/pacotes/${pacoteId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    inativarPacote: async (id: string, pacoteId: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/pacotes/${pacoteId}/inativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    itens: async (id: string): Promise<OrcamentoObraItemApi[]> =>
      (await request<ApiListResponse<OrcamentoObraItemApi>>(`/orcamentos-obra/${id}/itens`)).data,
    addItem: async (id: string, payload: OrcamentoObraItemPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/itens`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updateItem: async (id: string, itemId: string, payload: Partial<OrcamentoObraItemPayload>): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/itens/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    inativarItem: async (id: string, itemId: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/itens/${itemId}/inativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cronograma: async (id: string): Promise<OrcamentoObraCronogramaApi[]> =>
      (await request<ApiListResponse<OrcamentoObraCronogramaApi>>(`/orcamentos-obra/${id}/cronograma`)).data,
    addCronograma: async (id: string, payload: OrcamentoObraCronogramaPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/cronograma`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updateCronograma: async (id: string, cronogramaId: string, payload: Partial<OrcamentoObraCronogramaPayload>): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/cronograma/${cronogramaId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    inativarCronograma: async (id: string, cronogramaId: string, payload: OrcamentoObraActionPayload): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/orcamentos-obra/${id}/cronograma/${cronogramaId}/inativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    resumo: async (id: string): Promise<OrcamentoObraResumoApi> =>
      (await request<ApiItemResponse<OrcamentoObraResumoApi>>(`/orcamentos-obra/${id}/resumo`)).data,
    vigentePorObra: async (obraId: string): Promise<OrcamentoObraApi> =>
      (await request<ApiItemResponse<OrcamentoObraApi>>(`/obras/${obraId}/orcamento-vigente`)).data
  },
  planejamentoExecutivo: {
    list: async (filters: PlanejamentoExecutivoFilters = {}): Promise<PlanejamentoExecutivoApi[]> =>
      (await request<ApiListResponse<PlanejamentoExecutivoApi>>(
        `/planejamento-executivo${buildQueryString({
          status: filters.status || undefined,
          obra_id: filters.obra_id,
          orcamento_id: filters.orcamento_id
        })}`
      )).data,
    get: async (id: string): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}`)).data,
    create: async (payload: PlanejamentoExecutivoPayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>('/planejamento-executivo', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: PlanejamentoExecutivoUpdatePayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    ativar: async (id: string, payload: OrcamentoObraActionPayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}/ativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    revisar: async (id: string, payload: OrcamentoObraActionPayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}/revisar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    encerrar: async (id: string, payload: OrcamentoObraActionPayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}/encerrar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: OrcamentoObraActionPayload): Promise<PlanejamentoExecutivoApi> =>
      (await request<ApiItemResponse<PlanejamentoExecutivoApi>>(`/planejamento-executivo/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  medicoes: {
    list: async (filters: MedicaoFilters = {}): Promise<MedicaoApi[]> =>
      (await request<ApiListResponse<MedicaoApi>>(
        `/medicoes${buildQueryString({
          status: filters.status || undefined,
          obra_id: filters.obra_id,
          cliente_id: filters.cliente_id,
          competencia_de: filters.competencia_de,
          competencia_ate: filters.competencia_ate
        })}`
      )).data,
    get: async (id: string): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}`)).data,
    create: async (payload: MedicaoPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>('/medicoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: MedicaoUpdatePayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    enviar: async (id: string, payload: MedicaoActionPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/enviar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    aprovar: async (id: string, payload: AprovacaoPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/aprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    devolver: async (id: string, payload: MedicaoActionPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/devolver`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: MedicaoActionPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    addItem: async (id: string, payload: MedicaoItemPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/itens`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    updateItem: async (id: string, itemId: string, payload: Partial<MedicaoItemPayload>): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/itens/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    inativarItem: async (id: string, itemId: string, payload: MedicaoActionPayload): Promise<MedicaoApi> =>
      (await request<ApiItemResponse<MedicaoApi>>(`/medicoes/${id}/itens/${itemId}/inativar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  pedidosFaturamento: {
    list: async (filters: PedidoFaturamentoFilters = {}): Promise<PedidoFaturamentoApi[]> =>
      (await request<ApiListResponse<PedidoFaturamentoApi>>(
        `/pedidos-faturamento${buildQueryString({
          status: filters.status || undefined,
          medicao_id: filters.medicao_id,
          cliente_id: filters.cliente_id,
          obra_id: filters.obra_id
        })}`
      )).data,
    get: async (id: string): Promise<PedidoFaturamentoApi> =>
      (await request<ApiItemResponse<PedidoFaturamentoApi>>(`/pedidos-faturamento/${id}`)).data,
    create: async (payload: PedidoFaturamentoPayload): Promise<PedidoFaturamentoApi> =>
      (await request<ApiItemResponse<PedidoFaturamentoApi>>('/pedidos-faturamento', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    aprovar: async (id: string, payload: AprovacaoPayload): Promise<PedidoFaturamentoApi> =>
      (await request<ApiItemResponse<PedidoFaturamentoApi>>(`/pedidos-faturamento/${id}/aprovar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    marcarFaturadoManualmente: async (id: string, payload: PedidoFaturamentoManualPayload): Promise<PedidoFaturamentoApi> =>
      (await request<ApiItemResponse<PedidoFaturamentoApi>>(`/pedidos-faturamento/${id}/marcar-faturado-manualmente`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  },
  relatoriosFinanceiros: {
    contasResumo: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioContaResumoApi> =>
      (await request<ApiItemResponse<RelatorioContaResumoApi>>(
        `/relatorios-financeiros/contas-pagar/resumo${buildQueryString(filters)}`
      )).data,
    contasAging: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioAgingApi[]> =>
      (await request<ApiListResponse<RelatorioAgingApi>>(
        `/relatorios-financeiros/contas-pagar/aging${buildQueryString(filters)}`
      )).data,
    contasPorFornecedor: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioAgrupadoApi[]> =>
      (await request<ApiListResponse<RelatorioAgrupadoApi>>(
        `/relatorios-financeiros/contas-pagar/por-fornecedor${buildQueryString(filters)}`
      )).data,
    contasPorObra: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioAgrupadoApi[]> =>
      (await request<ApiListResponse<RelatorioAgrupadoApi>>(
        `/relatorios-financeiros/contas-pagar/por-obra${buildQueryString(filters)}`
      )).data,
    contasPorCentroCusto: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioAgrupadoApi[]> =>
      (await request<ApiListResponse<RelatorioAgrupadoApi>>(
        `/relatorios-financeiros/contas-pagar/por-centro-custo${buildQueryString(filters)}`
      )).data,
    programacoesResumo: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioProgramacaoResumoApi> =>
      (await request<ApiItemResponse<RelatorioProgramacaoResumoApi>>(
        `/relatorios-financeiros/programacoes/resumo${buildQueryString(filters)}`
      )).data,
    fluxoPrevisto: async (filters: RelatorioFinanceiroFilters = {}): Promise<RelatorioFluxoPrevistoApi[]> =>
      (await request<ApiListResponse<RelatorioFluxoPrevistoApi>>(
        `/relatorios-financeiros/fluxo-previsto${buildQueryString(filters)}`
      )).data
  },
  previstoRealizado: {
    obras: async (filters: PrevistoRealizadoFilters = {}): Promise<PrevistoRealizadoObraResumoApi[]> =>
      (await request<ApiListResponse<PrevistoRealizadoObraResumoApi>>(
        `/previsto-realizado/obras${buildQueryString(filters)}`
      )).data,
    obraResumo: async (obraId: string, filters: PrevistoRealizadoFilters = {}): Promise<PrevistoRealizadoObraResumoApi> =>
      (await request<ApiItemResponse<PrevistoRealizadoObraResumoApi>>(
        `/previsto-realizado/obras/${obraId}/resumo${buildQueryString(filters)}`
      )).data,
    curva: async (obraId: string, filters: PrevistoRealizadoFilters = {}): Promise<PrevistoRealizadoCurvaApi[]> =>
      (await request<ApiListResponse<PrevistoRealizadoCurvaApi>>(
        `/previsto-realizado/obras/${obraId}/curva${buildQueryString(filters)}`
      )).data,
    pacotes: async (obraId: string): Promise<PrevistoRealizadoAgrupamentoApi[]> =>
      (await request<ApiListResponse<PrevistoRealizadoAgrupamentoApi>>(`/previsto-realizado/obras/${obraId}/pacotes`)).data,
    centrosCusto: async (obraId: string): Promise<PrevistoRealizadoAgrupamentoApi[]> =>
      (await request<ApiListResponse<PrevistoRealizadoAgrupamentoApi>>(`/previsto-realizado/obras/${obraId}/centros-custo`)).data,
    contratos: async (obraId: string): Promise<PrevistoRealizadoAgrupamentoApi[]> =>
      (await request<ApiListResponse<PrevistoRealizadoAgrupamentoApi>>(`/previsto-realizado/obras/${obraId}/contratos`)).data,
    faturamento: async (obraId: string): Promise<PrevistoRealizadoDetalheFinanceiroApi> =>
      (await request<ApiItemResponse<PrevistoRealizadoDetalheFinanceiroApi>>(`/previsto-realizado/obras/${obraId}/faturamento`)).data,
    custos: async (obraId: string): Promise<PrevistoRealizadoDetalheFinanceiroApi> =>
      (await request<ApiItemResponse<PrevistoRealizadoDetalheFinanceiroApi>>(`/previsto-realizado/obras/${obraId}/custos`)).data,
    portfolioResumo: async (filters: PrevistoRealizadoFilters = {}): Promise<PrevistoRealizadoPortfolioApi> =>
      (await request<ApiItemResponse<PrevistoRealizadoPortfolioApi>>(
        `/previsto-realizado/portfolio/resumo${buildQueryString(filters)}`
      )).data
  },
  dashboardExecutivo: {
    resumo: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoResumoApi> =>
      (await request<ApiItemResponse<DashboardExecutivoResumoApi>>(
        `/dashboard-executivo/resumo${buildQueryString(filters)}`
      )).data,
    obras: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoObraApi[]> =>
      (await request<ApiListResponse<DashboardExecutivoObraApi>>(
        `/dashboard-executivo/obras${buildQueryString(filters)}`
      )).data,
    alertas: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoAlertaApi[]> =>
      (await request<ApiListResponse<DashboardExecutivoAlertaApi>>(
        `/dashboard-executivo/alertas${buildQueryString(filters)}`
      )).data,
    tendenciaMensal: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoTendenciaApi[]> =>
      (await request<ApiListResponse<DashboardExecutivoTendenciaApi>>(
        `/dashboard-executivo/tendencia-mensal${buildQueryString(filters)}`
      )).data,
    rankingObras: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoRankingApi> =>
      (await request<ApiItemResponse<DashboardExecutivoRankingApi>>(
        `/dashboard-executivo/ranking-obras${buildQueryString(filters)}`
      )).data,
    financeiro: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoDetalheApi> =>
      (await request<ApiItemResponse<DashboardExecutivoDetalheApi>>(
        `/dashboard-executivo/financeiro${buildQueryString(filters)}`
      )).data,
    faturamento: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoDetalheApi> =>
      (await request<ApiItemResponse<DashboardExecutivoDetalheApi>>(
        `/dashboard-executivo/faturamento${buildQueryString(filters)}`
      )).data,
    operacional: async (filters: DashboardExecutivoFilters = {}): Promise<DashboardExecutivoDetalheApi> =>
      (await request<ApiItemResponse<DashboardExecutivoDetalheApi>>(
        `/dashboard-executivo/operacional${buildQueryString(filters)}`
      )).data
  },
  riscosPendencias: {
    list: async (filters: RiscosPendenciasFilters = {}): Promise<RiscoPendenciaApi[]> =>
      (await request<ApiListResponse<RiscoPendenciaApi>>(
        `/riscos-pendencias${buildQueryString(filters)}`
      )).data,
    get: async (id: string): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}`)).data,
    create: async (payload: RiscoPendenciaPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>('/riscos-pendencias', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    update: async (id: string, payload: RiscoPendenciaUpdatePayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    iniciar: async (id: string, payload: RiscoPendenciaActionPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}/iniciar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    bloquear: async (id: string, payload: RiscoPendenciaActionPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}/bloquear`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    resolver: async (id: string, payload: RiscoPendenciaActionPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}/resolver`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: RiscoPendenciaActionPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    comentar: async (id: string, payload: { usuario_id?: string; comentario: string }): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>(`/riscos-pendencias/${id}/comentarios`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    historico: async (id: string): Promise<Array<Record<string, unknown>>> =>
      (await request<ApiListResponse<Record<string, unknown>>>(`/riscos-pendencias/${id}/historico`)).data,
    gerarDeAlerta: async (payload: RiscoPendenciaAlertaPayload): Promise<RiscoPendenciaApi> =>
      (await request<ApiItemResponse<RiscoPendenciaApi>>('/riscos-pendencias/gerar-de-alerta', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data
  },
  auditoria: {
    eventos: async (filters: AuditoriaFilters = {}): Promise<AuditoriaEventoApi[]> =>
      (await request<ApiListResponse<AuditoriaEventoApi>>(
        `/auditoria/eventos${buildQueryString(filters)}`
      )).data,
    get: async (id: string): Promise<AuditoriaDetalheApi> =>
      (await request<ApiItemResponse<AuditoriaDetalheApi>>(`/auditoria/eventos/${id}`)).data,
    entidade: async (tipo: string, id: string, filters: AuditoriaFilters = {}): Promise<AuditoriaEventoApi[]> =>
      (await request<ApiListResponse<AuditoriaEventoApi>>(
        `/auditoria/entidade/${encodeURIComponent(tipo)}/${encodeURIComponent(id)}${buildQueryString(filters)}`
      )).data,
    usuario: async (usuarioId: string, filters: AuditoriaFilters = {}): Promise<AuditoriaEventoApi[]> =>
      (await request<ApiListResponse<AuditoriaEventoApi>>(
        `/auditoria/usuario/${usuarioId}${buildQueryString(filters)}`
      )).data,
    modulos: async (filters: AuditoriaFilters = {}): Promise<AuditoriaModuloApi[]> =>
      (await request<ApiListResponse<AuditoriaModuloApi>>(
        `/auditoria/modulos${buildQueryString(filters)}`
      )).data,
    resumo: async (filters: AuditoriaFilters = {}): Promise<AuditoriaResumoApi> =>
      (await request<ApiItemResponse<AuditoriaResumoApi>>(
        `/auditoria/resumo${buildQueryString(filters)}`
      )).data,
    eventosCriticos: async (filters: AuditoriaFilters = {}): Promise<AuditoriaEventoApi[]> =>
      (await request<ApiListResponse<AuditoriaEventoApi>>(
        `/auditoria/eventos-criticos${buildQueryString(filters)}`
      )).data
  },
  centralTarefas: {
    resumo: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefasResumoApi> =>
      (await request<ApiItemResponse<CentralTarefasResumoApi>>(
        `/central-tarefas/resumo${buildQueryString(filters)}`
      )).data,
    minhas: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefaApi[]> =>
      (await request<ApiListResponse<CentralTarefaApi>>(
        `/central-tarefas/minhas${buildQueryString(filters)}`
      )).data,
    aprovacoes: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefaApi[]> =>
      (await request<ApiListResponse<CentralTarefaApi>>(
        `/central-tarefas/aprovacoes${buildQueryString(filters)}`
      )).data,
    porModulo: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefasModuloApi[]> =>
      (await request<ApiListResponse<CentralTarefasModuloApi>>(
        `/central-tarefas/por-modulo${buildQueryString(filters)}`
      )).data,
    atrasadas: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefaApi[]> =>
      (await request<ApiListResponse<CentralTarefaApi>>(
        `/central-tarefas/atrasadas${buildQueryString(filters)}`
      )).data,
    criticas: async (filters: CentralTarefasFilters = {}): Promise<CentralTarefaApi[]> =>
      (await request<ApiListResponse<CentralTarefaApi>>(
        `/central-tarefas/criticas${buildQueryString(filters)}`
      )).data,
    get: async (id: string): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${id}`)).data,
    criarManual: async (payload: CentralTarefaManualPayload): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>('/central-tarefas/manuais', {
        method: 'POST',
        body: JSON.stringify(payload)
      })).data,
    marcarVista: async (id: string, payload: CentralTarefaActionPayload): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${id}/marcar-vista`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    iniciar: async (id: string, payload: CentralTarefaActionPayload): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${id}/iniciar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    concluir: async (id: string, payload: CentralTarefaActionPayload): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${id}/concluir`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data,
    cancelar: async (id: string, payload: CentralTarefaActionPayload): Promise<CentralTarefaApi> =>
      (await request<ApiItemResponse<CentralTarefaApi>>(`/central-tarefas/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })).data
  }
};
