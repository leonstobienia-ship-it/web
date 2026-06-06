export type PerfilEnac =
  | 'Campo'
  | 'CotacoesContratos'
  | 'ComprasFinanceiroOperacional'
  | 'Planejamento'
  | 'Diretoria'
  | 'AdministradorSistema';

export type StatusProcesso =
  | 'SolicitacaoCriada'
  | 'AguardandoCotacao'
  | 'EmCotacao'
  | 'AguardandoAprovacao'
  | 'AprovadaParaCompra'
  | 'PedidoEmitido'
  | 'CompraRealizadaAguardandoNf'
  | 'NfVinculada'
  | 'PagamentoProgramadoBanco'
  | 'AguardandoLiberacaoBancaria'
  | 'PagamentoLiberado'
  | 'PagoConcluido'
  | 'Reprovada'
  | 'Cancelada'
  | 'DivergenciaIdentificada';

export type TipoSolicitacaoEnac = 'Material' | 'Servico' | 'Locacao' | 'Equipamento';

export interface IObraEnac {
  id: string;
  nome: string;
  codigoObra: string;
  cliente: string;
  centroCusto: string;
  enderecoEntrega?: string;
}

export interface IHistoricoEnac {
  data: string;
  autor: string;
  perfil: PerfilEnac | 'Sistema';
  descricao: string;
  observacao?: string;
  statusAnterior?: StatusProcesso;
  statusNovo: StatusProcesso;
}

export interface ICotacaoPropostaEnac {
  fornecedor: string;
  valor: number;
  prazoEntrega: string;
  frete: string;
  condicaoPagamento: string;
  anexoProposta?: string;
}

export interface ICotacaoEnac {
  propostas: ICotacaoPropostaEnac[];
  fornecedorRecomendado: string;
  valorRecomendado: number;
  prazoRecomendado: string;
  condicaoPagamentoRecomendada: string;
  justificativaRecomendacao: string;
  justificativaCotacaoIncompleta?: string;
}

export interface IPedidoCompraEnac {
  numeroPedido: string;
  cnpjFornecedor?: string;
  prazoEntregaConfirmado: string;
  enderecoEntrega: string;
  contatoFornecedor?: string;
  anexoPedidoEnviado?: string;
  observacoes?: string;
}

export interface INotaFiscalEnac {
  numero: string;
  serie?: string;
  dataEmissao: string;
  dataVencimento: string;
  valorBruto: number;
  retencoesDescontos: number;
  valorLiquido: number;
  anexoNf?: string;
  boletoOuDadosPagamento?: string;
  observacaoDivergencia?: string;
}

export interface IProgramacaoBancariaEnac {
  bancoContaPagamento: string;
  formaPagamento: string;
  dataProgramada: string;
  valorProgramado: number;
  comprovanteAgendamento?: string;
  observacoes?: string;
}

export interface ISolicitacaoEnac {
  id: string;
  titulo: string;
  obra: IObraEnac;
  tipo: TipoSolicitacaoEnac;
  descricao: string;
  especificacaoTecnica: string;
  quantidade?: number;
  unidade?: string;
  frenteServico: string;
  dataNecessaria: string;
  prioridade: 'Normal' | 'Alta' | 'Emergencial';
  justificativaUrgencia?: string;
  anexoReferencia?: string;
  observacoes?: string;
  solicitante: string;
  dataHoraSolicitacao: string;
  status: StatusProcesso;
  cotacao?: ICotacaoEnac;
  aprovadorExigido?: string;
  aprovadoPor?: string;
  pedidoCompra?: IPedidoCompraEnac;
  notaFiscal?: INotaFiscalEnac;
  programacaoBancaria?: IProgramacaoBancariaEnac;
  divergencias: string[];
  snapshotAprovacaoCompra?: ISnapshotRegraEnac;
  historico: IHistoricoEnac[];
}

export interface IAlcadaEnac {
  id: string;
  regraInternaId: string;
  processo: 'Compra' | 'Medicao' | 'Pagamento' | 'Outro' | 'LiberacaoBancaria';
  tipoSolicitacao: 'Todos' | TipoSolicitacaoEnac;
  obra: string;
  obraId?: string;
  valorMinimo: number;
  valorMaximo?: number;
  ilimitado: boolean;
  aprovadorPrincipalId: string;
  aprovadorPrincipalNome?: string;
  aprovadorPrincipalEmail?: string;
  exigeAprovacaoAdicional: boolean;
  aprovadorAdicionalId?: string;
  aprovadorAdicionalNome?: string;
  aprovadorAdicionalEmail?: string;
  vigenciaInicial: string;
  vigenciaFinal?: string;
  ativa: boolean;
  observacoes?: string;
}

export interface IUsuarioPerfilEnac {
  id: string;
  usuarioInternoId: string;
  nome: string;
  emailCorporativo: string;
  contaMicrosoft365Id: number;
  contaMicrosoft365Nome: string;
  contaMicrosoft365Email: string;
  contaMicrosoft365Login?: string;
  cargoFuncao: string;
  perfilPrincipal: PerfilEnac;
  perfisAdicionais: PerfilEnac[];
  podeCriarSolicitacao: boolean;
  podeRegistrarCotacoes: boolean;
  podeAprovarCompras: boolean;
  podeEmitirPedido: boolean;
  podeVincularNf: boolean;
  podeProgramarPagamento: boolean;
  podeLiberarPagamento: boolean;
  podeAtualizarStatusFinal: boolean;
  podeAdministrarConfiguracoes: boolean;
  usuarioAtivo: boolean;
  substitutoTemporarioId?: string;
  substitutoTemporarioNome?: string;
  substitutoTemporarioEmail?: string;
  inicioSubstituicao?: string;
  fimSubstituicao?: string;
  observacoes?: string;
  criadoPor?: string;
  criadoEm?: string;
  alteradoPor?: string;
  alteradoEm?: string;
}

export interface ISnapshotRegraEnac {
  id?: string;
  regraAlcadaUtilizada: string;
  processo: string;
  faixaValorVigente: string;
  valorAnalisado: number;
  aprovadorBaseId: string;
  aprovadorBaseNome: string;
  aprovadorBaseEmail: string;
  aprovadorEfetivoId: string;
  aprovadorEfetivoNome: string;
  aprovadorEfetivoEmail: string;
  substituicaoAplicada: boolean;
  motivoResolucaoAprovador: string;
  motivoExcecao?: string;
  dataHoraAplicacao: string;
}

export type MarcadorTesteEscritaEnac = 'V2.3B-TESTE' | 'V2.6A-TESTE';

export type EscritaControladaStatus =
  | 'Bloqueada'
  | 'ValidacaoExistente'
  | 'SnapshotCriado'
  | 'Vinculado'
  | 'HistoricoRegistrado'
  | 'Concluido'
  | 'Erro';

export interface AlertaBloqueioEscrita {
  codigo: string;
  mensagem: string;
}

export interface SnapshotCriacaoTesteInput {
  requisicaoItemId: number;
  valorAnalisado: number;
  tipoSolicitacao: TipoSolicitacaoEnac;
  obraId?: string;
  marcadorTeste: MarcadorTesteEscritaEnac;
  modoEscritaTeste: boolean;
  confirmacao: string;
  motivoExcecao?: string;
  idempotenteValidarExistente?: boolean;
}

export interface ResultadoVinculoSnapshot {
  sucesso: boolean;
  status: EscritaControladaStatus;
  requisicaoItemId: number;
  snapshotItemId: number;
  mensagem: string;
}

export interface ResultadoHistoricoConfiguracao {
  sucesso: boolean;
  status: EscritaControladaStatus;
  historicoItemId?: number;
  mensagem: string;
}

export interface SnapshotCriacaoTesteResultado {
  sucesso: boolean;
  bloqueado: boolean;
  status: EscritaControladaStatus;
  mensagem: string;
  requisicaoItemId: number;
  snapshotItemId?: number;
  snapshotTitle?: string;
  regraInternaId?: string;
  alertas: AlertaBloqueioEscrita[];
  vinculo?: ResultadoVinculoSnapshot;
  historico?: ResultadoHistoricoConfiguracao;
}

export interface IValidacaoAlcadaEnac {
  tipo: 'Erro' | 'Aviso';
  regraInternaId?: string;
  mensagem: string;
}

export interface IResolucaoAprovadorEnac {
  base: IUsuarioPerfilEnac;
  efetivo: IUsuarioPerfilEnac;
  substituicaoAplicada: boolean;
  motivo: string;
}

export interface IHistoricoConfiguracaoEnac {
  tipoConfiguracao: string;
  valorAnterior: string;
  valorNovo: string;
  usuarioAlteracao: string;
  dataHora: string;
  justificativa: string;
}

export type OrigemDadosEnac = 'local' | 'sharepoint';

export interface IRequisicaoResumoEnac {
  id: string;
  itemId: number;
  titulo: string;
  tipoSolicitacao: string;
  status: string;
  obraId?: number;
  obraTitulo?: string;
  solicitanteNome?: string;
  aprovadorNome?: string;
  snapshotAprovacaoCompraId?: number;
  snapshotAprovacaoCompraTitulo?: string;
}

export interface IDiagnosticoReadonlyEnac {
  origemDados: OrigemDadosEnac;
  usuariosPerfis: number;
  alcadasAtivas: number;
  requisicoesResumo: number;
  usuariosOk: boolean;
  alcadasOk: boolean;
  requisicoesOk: boolean;
  snapshotsOk: boolean;
  snapshotTeste?: {
    requisicaoId: number;
    snapshotEncontrado: boolean;
    snapshotTitulo?: string;
    regraInternaId?: string;
    valorAnalisado?: number;
    aprovadorBaseId?: string;
    aprovadorEfetivoId?: string;
  };
  erros: string[];
}
