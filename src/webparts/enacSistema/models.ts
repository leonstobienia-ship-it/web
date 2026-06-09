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
export type MarcadorTesteOperacionalEnac = 'V2.7A-TESTE';

export type AcaoOperacionalV27A =
  | 'CriarRequisicaoCompra'
  | 'AtualizarStatusRequisicao'
  | 'AtualizarRequisicaoCompra'
  | 'CriarPedidoCompra'
  | 'VincularNotaFiscal'
  | 'ProgramarPagamento'
  | 'AprovarCompra'
  | 'RegistrarHistoricoOperacional'
  | 'CriarSnapshotAprovacaoOperacional';

export interface FlagsEscritaOperacionalV27A {
  habilitarEscritaOperacionalV27A: boolean;
  modoTesteOperacionalV27A: boolean;
  permitirSomenteItensTesteV27A: boolean;
  marcadorTesteOperacionalV27A: MarcadorTesteOperacionalEnac;
  exigirConfirmacaoManualV27A: boolean;
  confirmacaoManualV27A: string;
}

export interface ConfiguracaoTesteOperacionalV27A {
  itemTesteOperacionalIdV27A?: number;
  acaoTesteOperacionalV27A: AcaoOperacionalV27A;
  statusDestinoTesteOperacionalV27A?: string;
  valorTesteOperacionalV27A?: number;
  observacaoTesteOperacionalV27A?: string;
  fornecedorTesteIdV27A?: number;
  statusPedidoInicialTesteV27A?: string;
  tituloPedidoTesteV27A?: string;
  descricaoPedidoTesteV27A?: string;
  condicaoPagamentoTesteV27A?: string;
  prazoEntregaTesteV27A?: string;
  pedidoTesteIdV27A?: number;
  numeroNotaFiscalTesteV27A?: string;
  serieNotaFiscalTesteV27A?: string;
  valorNotaFiscalTesteV27A?: number;
  tipoNotaFiscalTesteV27A?: string;
  statusNotaFiscalInicialTesteV27A?: string;
  enviadaContabilidadeTesteV27A?: string;
  dataEmissaoNotaFiscalTesteV27A?: string;
  dataVencimentoNotaFiscalTesteV27A?: string;
  linkNotaFiscalTesteV27A?: string;
  notaFiscalTesteIdV27A?: number;
  pagamentoValorTesteV27A?: number;
  pagamentoStatusInicialTesteV27A?: string;
  pagamentoFormaTesteV27A?: string;
  pagamentoContaTesteV27A?: string;
  pagamentoCategoriaTesteV27A?: string;
  pagamentoOrigemTesteV27A?: string;
  pagamentoDataProgramadaTesteV27A?: string;
}

export interface ResultadoOperacionalV27A {
  sucesso: boolean;
  bloqueado: boolean;
  acao: AcaoOperacionalV27A;
  mensagem: string;
  itemId?: number;
  snapshotItemId?: number;
  snapshotTitle?: string;
  snapshotAntesId?: number;
  snapshotAntesTitulo?: string;
  snapshotDepoisId?: number;
  snapshotDepoisTitulo?: string;
  snapshotPreservado?: boolean;
  campoAlterado?: string;
  statusAnterior?: string;
  statusNovo?: string;
  historicoRegistrado?: boolean;
  historicoItemId?: number;
  statusHttpEscrita?: number;
  alertas: AlertaBloqueioEscrita[];
}

export interface PreValidacaoOperacionalV27AResultado {
  sucesso: boolean;
  bloqueado: boolean;
  mensagem: string;
  flagsValidas?: boolean;
  usuarioAtualReconhecido?: boolean;
  usuarioAtual?: IUsuarioPerfilEnac;
  acaoPretendida?: AcaoOperacionalV27A;
  itemTesteId?: number;
  itemEncontrado?: boolean;
  listaConsulta?: string;
  modoAcessoLista?: 'GUID' | 'DisplayName';
  itemIdSolicitado?: number;
  statusHttpLeitura?: number;
  erroLeituraItem?: string;
  camposRetornados?: string[];
  camposComMarcador?: string[];
  valoresCamposMarcador?: string[];
  marcadorEncontrado?: boolean;
  statusAtual?: string;
  statusDestino?: string;
  transicaoPermitida?: boolean;
  camposObrigatoriosPresentes?: boolean;
  snapshotExistenteId?: number;
  snapshotExistenteTitulo?: string;
  aprovacaoNecessariaCampo?: string;
  aprovacaoNecessariaValorBruto?: string;
  aprovacaoNecessariaNormalizada?: 'Sim' | 'Nao' | 'Nao resolvido';
  valorAnalisado?: number;
  regraInternaId?: string;
  resumoRegraAplicada?: string;
  aprovadorBaseNome?: string;
  aprovadorEfetivoNome?: string;
  aprovadorPrevistoNome?: string;
  aprovadorEfetivoOperacionalNome?: string;
  tipoAprovacaoCompra?: 'Aprovador direto' | 'Alçada superior / Diretoria';
  diagnosticoAprovacaoCompra?: 'APROVADOR_DO_SNAPSHOT_VALIDO' | 'DIRETORIA_ALCADA_SUPERIOR_VALIDADA';
  justificativaAprovacaoPrevista?: string;
  diagnosticoPedidoCompra?: string[];
  pedidoTituloPrevisto?: string;
  pedidoVinculoTextual?: string;
  pedidoFornecedorId?: number;
  pedidoFornecedorTitulo?: string;
  pedidoFornecedorLookup?: string;
  pedidoStatusInicial?: string;
  pedidoExistenteId?: number;
  pedidoExistenteTitulo?: string;
  diagnosticoNotaFiscal?: string[];
  notaFiscalTituloPrevisto?: string;
  notaFiscalNumeroPrevisto?: string;
  notaFiscalPedidoId?: number;
  notaFiscalPedidoTitulo?: string;
  notaFiscalVinculoPedido?: string;
  notaFiscalFornecedorId?: number;
  notaFiscalFornecedorTitulo?: string;
  notaFiscalObraId?: number;
  notaFiscalStatusInicial?: string;
  notaFiscalTipo?: string;
  notaFiscalEnviadaContabilidade?: string;
  notaFiscalExistenteId?: number;
  notaFiscalExistenteTitulo?: string;
  diagnosticoPagamento?: string[];
  pagamentoTituloPrevisto?: string;
  pagamentoNotaFiscalId?: number;
  pagamentoNotaFiscalNumero?: string;
  pagamentoVinculoNf?: string;
  pagamentoFornecedorId?: number;
  pagamentoFornecedorTitulo?: string;
  pagamentoObraId?: number;
  pagamentoValorBruto?: number;
  pagamentoValorLiquido?: number;
  pagamentoVencimento?: string;
  pagamentoDataProgramada?: string;
  pagamentoStatusInicial?: string;
  pagamentoForma?: string;
  pagamentoConta?: string;
  pagamentoCategoria?: string;
  pagamentoOrigem?: string;
  pagamentoExistenteId?: number;
  pagamentoExistenteTitulo?: string;
  snapshotPrevistoTitulo?: string;
  criaraSnapshot?: boolean;
  vincularaSnapshotAprovacaoCompra?: boolean;
  registraraHistorico?: boolean;
  historicoPrevisto?: string;
  listaAlterada?: string;
  campoAlterado?: string;
  valorAnteriorPrevisto?: string;
  valorNovoPrevisto?: string;
  podeExecutar?: boolean;
  acoesPermitidas: AcaoOperacionalV27A[];
  alertas: AlertaBloqueioEscrita[];
}

export interface RequisicaoCompraControladaPayload {
  titulo: string;
  obraItemId: number;
  tipoSolicitacao: TipoSolicitacaoEnac;
  descricao: string;
  prioridade: 'Normal' | 'Alta' | 'Emergencial';
  dataNecessaria: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface AtualizacaoRequisicaoCompraControladaPayload {
  statusNovo?: string;
  observacao?: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface PedidoCompraControladoPayload {
  requisicaoItemId: number;
  numeroPedido: string;
  fornecedor?: string;
  valorPedido?: number;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface NotaFiscalControladaPayload {
  numeroNf: string;
  valor: number;
  dataEmissao?: string;
  dataVencimento?: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface ProgramacaoPagamentoControladaPayload {
  valorProgramado: number;
  dataProgramada: string;
  formaPagamento: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface HistoricoOperacionalPayload {
  origemLista: string;
  origemItemId: number;
  acao: AcaoOperacionalV27A;
  descricao: string;
  statusAnterior?: string;
  statusNovo?: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

export interface SnapshotAprovacaoOperacionalPayload {
  requisicaoItemId: number;
  valorAnalisado: number;
  tipoSolicitacao: TipoSolicitacaoEnac;
  obraId?: string;
  marcadorTeste: MarcadorTesteOperacionalEnac;
}

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

export interface PreValidacaoTesteControladoSnapshotResultado {
  sucesso: boolean;
  bloqueado: boolean;
  status: EscritaControladaStatus;
  mensagem: string;
  requisicaoItemId: number;
  requisicaoTitulo?: string;
  marcadorEncontrado?: MarcadorTesteEscritaEnac;
  valorAnalisado: number;
  regraInternaId?: string;
  regraAlcadaItemId?: number;
  resumoRegraAplicada?: string;
  aprovadorBaseId?: string;
  aprovadorBaseNome?: string;
  aprovadorEfetivoId?: string;
  aprovadorEfetivoNome?: string;
  snapshotExistenteId?: number;
  snapshotExistenteTitulo?: string;
  criaraSnapshot: boolean;
  vincularaSnapshotAprovacaoCompra: boolean;
  registraraHistorico: boolean;
  alertas: AlertaBloqueioEscrita[];
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
