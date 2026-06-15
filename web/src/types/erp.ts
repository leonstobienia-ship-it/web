export type UUID = string;

export type RegistroStatus =
  | 'rascunho'
  | 'ativo'
  | 'inativo'
  | 'pendente'
  | 'aprovado'
  | 'reprovado'
  | 'cancelado'
  | 'encerrado';

export interface RegistroAuditavel {
  id: UUID;
  companyId?: UUID;
  status: RegistroStatus | string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UUID;
  updatedBy?: UUID;
}

export interface Empresa extends RegistroAuditavel {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  regimeTributario?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  matrizId?: UUID;
}

export interface PerfilUsuario extends RegistroAuditavel {
  nome: string;
  descricao?: string;
  permissoes: string[];
  escopoPadrao?: 'global' | 'empresa' | 'site' | 'obra';
}

export interface Usuario extends RegistroAuditavel {
  empresaId?: UUID;
  nome: string;
  email: string;
  entraObjectId?: string;
  perfilIds: UUID[];
  cargoFuncao?: string;
  ativo: boolean;
}

export interface Cliente extends RegistroAuditavel {
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  responsavel?: string;
  observacoes?: string;
}

export interface Fornecedor extends RegistroAuditavel {
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  contato?: string;
  pix?: string;
  dadosBancarios?: string;
  observacoes?: string;
}

export interface CentroCusto extends RegistroAuditavel {
  codigo: string;
  nome: string;
  empresaId: UUID;
  siteId?: UUID;
  contaAnalitica?: string;
}

export interface Obra extends RegistroAuditavel {
  codigo: string;
  nome: string;
  empresaId: UUID;
  clienteId?: UUID;
  centroCustoId?: UUID;
  siteId?: UUID;
  endereco?: string;
  gestorId?: UUID;
  dataInicioPrevista?: string;
  dataFimPrevista?: string;
}

export interface ContratoCliente extends RegistroAuditavel {
  empresaId: UUID;
  clienteId: UUID;
  obraId?: UUID;
  numero: string;
  objeto: string;
  valorTotal: number;
  dataInicio: string;
  dataFim?: string;
  indiceReajuste?: string;
  percentualRetencao?: number;
}

export interface ContratoFornecedor extends RegistroAuditavel {
  empresaId: UUID;
  fornecedorId: UUID;
  obraId?: UUID;
  centroCustoId?: UUID;
  numero: string;
  objeto: string;
  valorTotal: number;
  dataInicio: string;
  dataFim?: string;
}

export interface SolicitacaoCompra extends RegistroAuditavel {
  empresaId: UUID;
  obraId?: UUID;
  centroCustoId?: UUID;
  solicitanteId?: UUID;
  tipo: string;
  descricao: string;
  especificacaoTecnica?: string;
  quantidade?: number;
  unidade?: string;
  dataNecessaria?: string;
  prioridade: 'normal' | 'alta' | 'emergencial';
}

export interface Cotacao extends RegistroAuditavel {
  empresaId: UUID;
  solicitacaoCompraId: UUID;
  fornecedorId: UUID;
  valorTotal: number;
  prazoEntrega?: string;
  condicaoPagamento?: string;
  frete?: string;
  recomendada: boolean;
  justificativa?: string;
}

export interface PedidoCompra extends RegistroAuditavel {
  empresaId: UUID;
  solicitacaoCompraId?: UUID;
  cotacaoId?: UUID;
  fornecedorId: UUID;
  obraId?: UUID;
  centroCustoId?: UUID;
  numero: string;
  valorTotal: number;
  dataEmissao?: string;
  prazoEntrega?: string;
}

export interface NotaFiscal extends RegistroAuditavel {
  empresaId: UUID;
  fornecedorId?: UUID;
  clienteId?: UUID;
  pedidoCompraId?: UUID;
  obraId?: UUID;
  numero: string;
  serie?: string;
  chaveAcesso?: string;
  tipo: 'nfse' | 'nfe' | 'recibo' | 'outro';
  dataEmissao: string;
  dataVencimento?: string;
  valorBruto: number;
  valorLiquido: number;
}

export interface ContaPagar extends RegistroAuditavel {
  empresaId: UUID;
  fornecedorId?: UUID;
  notaFiscalId?: UUID;
  contratoFornecedorId?: UUID;
  obraId?: UUID;
  centroCustoId?: UUID;
  vencimento: string;
  valorOriginal: number;
  saldo: number;
  formaPagamento?: string;
}

export interface ContaReceber extends RegistroAuditavel {
  empresaId: UUID;
  clienteId?: UUID;
  contratoClienteId?: UUID;
  medicaoObraId?: UUID;
  obraId?: UUID;
  centroCustoId?: UUID;
  vencimento: string;
  valorOriginal: number;
  saldo: number;
  origem?: 'medicao' | 'locacao' | 'estacionamento' | 'manual';
}

export interface MedicaoObra extends RegistroAuditavel {
  empresaId: UUID;
  contratoClienteId?: UUID;
  obraId: UUID;
  centroCustoId?: UUID;
  competencia: string;
  periodoInicio?: string;
  periodoFim?: string;
  valorMedido: number;
  percentualFisico?: number;
  valorRetido?: number;
  aprovadoPor?: UUID;
  aprovadoEm?: string;
}

export interface Documento extends RegistroAuditavel {
  empresaId: UUID;
  obraId?: UUID;
  contratoClienteId?: UUID;
  contratoFornecedorId?: UUID;
  entidadeTipo: string;
  entidadeId?: UUID;
  nome: string;
  tipoDocumento: string;
  sharePointUrl: string;
  sharePointItemId?: string;
  versao?: string;
}
