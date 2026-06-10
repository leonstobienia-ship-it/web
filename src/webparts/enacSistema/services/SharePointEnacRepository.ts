import { ISPHttpClientOptions, SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  AcaoOperacionalV27A,
  AlcadaAdministrativaV29CPayload,
  AlertaBloqueioEscrita,
  AtualizacaoRequisicaoCompraControladaPayload,
  ConfiguracaoTesteOperacionalV27A,
  ExecucaoAdministrativaV29CInput,
  FlagsEscritaOperacionalV27A,
  HistoricoOperacionalPayload,
  IDiagnosticoReadonlyEnac,
  IAlcadaEnac,
  IHistoricoConfiguracaoEnac,
  IRequisicaoResumoEnac,
  IResolucaoAprovadorEnac,
  ISnapshotRegraEnac,
  ISolicitacaoEnac,
  IUsuarioPerfilEnac,
  IValidacaoAlcadaEnac,
  NotaFiscalControladaPayload,
  PerfilEnac,
  PedidoCompraControladoPayload,
  PreValidacaoTesteControladoSnapshotResultado,
  PreValidacaoOperacionalV27AResultado,
  ProgramacaoPagamentoControladaPayload,
  RequisicaoCompraControladaPayload,
  ResultadoAdministrativoV29C,
  ResultadoOperacionalV27A,
  ResultadoHistoricoConfiguracao,
  ResultadoVinculoSnapshot,
  SnapshotAprovacaoOperacionalPayload,
  SnapshotCriacaoTesteInput,
  SnapshotCriacaoTesteResultado,
  TipoSolicitacaoEnac,
  UsuarioAdministrativoV29CPayload
} from '../models';

const LISTAS_ENAC = {
  obras: 'a9afadc1-f843-45c0-a628-4f49a8716832',
  requisicoesCompra: '0a204b87-b9a1-4d16-8654-55567a62ed01',
  pedidosCompra: '18ca132a-c36a-42aa-9968-d87ecd547a79',
  notasFiscaisRecebidas: '25aa4447-193d-418a-8e71-9bfd8e9995da',
  contasPagar: '69b7469b-9cb9-4509-87dd-bba00b8142fd',
  programacaoFinanceira: 'f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680',
  usuariosPerfis: '99cb9bae-5589-4f8b-854b-08adce371e82',
  alcadas: '901d4458-15b4-427b-a869-161c63cf70ef',
  historicoConfiguracoes: 'cac67186-e478-4f15-b5a0-2db92d74b2c4',
  snapshotsRegras: '767e1867-8a98-46be-9dcc-be53a12c51aa',
  fornecedoresPrestadores: '953cc56f-108b-4818-9ffc-cc522cd1b62d'
};

const CONFIRMACAO_ESCRITA_TESTE = 'TESTAR-ESCRITA-V2.6A-ENAC';
const MARCADORES_TESTE_PERMITIDOS = ['V2.3B-TESTE', 'V2.6A-TESTE'];
const CONFIRMACAO_OPERACIONAL_V27A = 'CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC';
const MARCADOR_OPERACIONAL_V27A = 'V2.7A-TESTE';
const CONFIRMACAO_ADMINISTRATIVA_V29C = 'CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9C-ENAC';
const MARCADOR_ADMINISTRATIVO_V29C = 'V2.9C-ADMIN-TESTE';
const LISTA_02_REQUISICOES_COMPRA_TITULO = 'Lista 02 — Requisições de Compra';
const LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD = 'StatusdaRequisi_x00e7__x00e3_o';
const LISTA_02_REQUISICOES_COMPRA_SELECT_PREVALIDACAO = [
  'Id',
  'Title',
  'C_x00f3_digodaObra',
  'CentrodeCusto',
  'TipodaSolicita_x00e7__x00e3_o',
  'Descri_x00e7__x00e3_odaSolicita_',
  'StatusdaRequisi_x00e7__x00e3_o',
  'Aprova_x00e7__x00e3_oNecess_x00e',
  'Observa_x00e7__x00f5_es',
  'Quantidade',
  'Unidade',
  'ObraId'
];
const LISTA_02_REQUISICOES_COMPRA_CAMPOS_MARCADOR = [
  'Title',
  'C_x00f3_digodaObra',
  'CentrodeCusto',
  'Descri_x00e7__x00e3_odaSolicita_',
  'Observa_x00e7__x00f5_es'
];
const LISTA_02_REQUISICOES_COMPRA_CAMPOS_APROVACAO_NECESSARIA = [
  'Aprova_x00e7__x00e3_oNecess_x00e',
  'Aprova_x00e7__x00e3_oNecess_x00e1_ria',
  'Aprova_x00e7__x00e3_oNecess_x00e1_ria_x003f_',
  'AprovacaoNecessaria',
  'AprovacaoNecessaria?',
  'Aprovação Necessária?'
];
const LISTA_02_STATUS_REQUISICAO_CHOICES_CONFIRMADOS = [
  'Recebida',
  'Em análise',
  'Aguardando aprovação',
  'Aprovada para compra',
  'Reprovada',
  'Em cotação',
  'Pedido de compra gerado',
  'Aguardando entrega',
  'Entregue / concluída',
  'Suspensa',
  'Cancelada'
];
const STATUS_APROVADO_COMPRA_V27A = 'Aprovada para compra';
const LISTA_03_PEDIDOS_COMPRA_TITULO = 'Lista 03 — Pedidos de Compra';
const LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD = 'N_x00ba_daRequisi_x00e7__x00e3_o';
const LISTA_03_PEDIDOS_COMPRA_DESCRICAO_FIELD = 'Descri_x00e7__x00e3_odoPedido';
const LISTA_03_PEDIDOS_COMPRA_CONDICAO_PAGAMENTO_FIELD = 'Condi_x00e7__x00e3_odePagamento';
const LISTA_03_PEDIDOS_COMPRA_FORNECEDOR_FIELD = 'Fornecedor0Id';
const LISTA_03_PEDIDOS_COMPRA_STATUS_INICIAL = 'Em elaboração';
const LISTA_03_PEDIDOS_COMPRA_STATUS_CHOICES_CONFIRMADOS = [
  'Em elaboração',
  'Aguardando aprovação',
  'Aprovado',
  'Enviado ao fornecedor',
  'Aguardando entrega',
  'Entregue parcial',
  'Entregue total',
  'Cancelado'
];
const LISTA_03_PEDIDOS_COMPRA_CAMPOS_PREVISTOS = [
  'Title',
  LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD,
  'ObraId',
  LISTA_03_PEDIDOS_COMPRA_FORNECEDOR_FIELD,
  'ValordoPedido',
  'DatadoPedido',
  'StatusdoPedido',
  'CentrodeCusto',
  LISTA_03_PEDIDOS_COMPRA_DESCRICAO_FIELD
];
const LISTA_04_NOTAS_FISCAIS_TITULO = 'Lista 04 - Notas Fiscais Recebidas';
const LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD = 'N_x00ba_doPedido';
const LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD = 'N_x00ba_daNotaFiscal';
const LISTA_04_NOTAS_FISCAIS_SERIE_FIELD = 'S_x00e9_rieNF';
const LISTA_04_NOTAS_FISCAIS_DATA_EMISSAO_FIELD = 'DatadeEmiss_x00e3_o';
const LISTA_04_NOTAS_FISCAIS_DATA_VENCIMENTO_FIELD = 'DatadeVencimento';
const LISTA_04_NOTAS_FISCAIS_VALOR_FIELD = 'ValorBrutodaNF';
const LISTA_04_NOTAS_FISCAIS_TIPO_FIELD = 'TipodeNF';
const LISTA_04_NOTAS_FISCAIS_STATUS_FIELD = 'StatusdaConfer_x00ea_ncia';
const LISTA_04_NOTAS_FISCAIS_FORNECEDOR_FIELD = 'Fornecedor0Id';
const LISTA_04_NOTAS_FISCAIS_OBRA_FIELD = 'ObraId';
const LISTA_04_NOTAS_FISCAIS_LINK_FIELD = 'LinkdaNFnoSharePoint';
const LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD = 'EnviadaparaContabilidade_x003f_';
const LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL = 'Recebida';
const LISTA_04_NOTAS_FISCAIS_TIPO_INICIAL = 'Material';
const LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL = 'não';
const LISTA_04_STATUS_CHOICES_CONFIRMADOS = [
  'Recebida',
  'Em conferência',
  'Aguardando correção do fornecedor',
  'Aguardando aprovação',
  'Aprovada para pagamento',
  'Reprovada',
  'Enviada para contabilidade',
  'Cancelada'
];
const LISTA_04_TIPO_NF_CHOICES_CONFIRMADOS = [
  'Material',
  'Serviço',
  'Locação',
  'Equipamento',
  'Transporte',
  'EPI',
  'Terceiro / Prestador',
  'Taxa / Documento',
  'Outro'
];
const LISTA_04_ENVIADA_CONTABILIDADE_CHOICES_CONFIRMADOS = ['sim', 'não'];
const LISTA_04_NOTAS_FISCAIS_CAMPOS_PREVISTOS = [
  'Title',
  LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD,
  LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD,
  LISTA_04_NOTAS_FISCAIS_SERIE_FIELD,
  LISTA_04_NOTAS_FISCAIS_DATA_EMISSAO_FIELD,
  LISTA_04_NOTAS_FISCAIS_DATA_VENCIMENTO_FIELD,
  LISTA_04_NOTAS_FISCAIS_VALOR_FIELD,
  LISTA_04_NOTAS_FISCAIS_TIPO_FIELD,
  LISTA_04_NOTAS_FISCAIS_STATUS_FIELD,
  LISTA_04_NOTAS_FISCAIS_FORNECEDOR_FIELD,
  LISTA_04_NOTAS_FISCAIS_OBRA_FIELD,
  'CentrodeCusto',
  'CNPJFornecedor',
  LISTA_04_NOTAS_FISCAIS_LINK_FIELD,
  LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD
];
const LISTA_10_PROGRAMACAO_FINANCEIRA_TITULO = 'Lista 10 - Contas a Pagar / Programacao Financeira';
const LISTA_10_PAGAMENTO_NUMERO_NF_FIELD = 'N_x00ba_daNotaFiscal';
const LISTA_10_PAGAMENTO_FORNECEDOR_FIELD = 'Fornecedor_x002f_PrestadorId';
const LISTA_10_PAGAMENTO_OBRA_FIELD = 'ObraId';
const LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD = 'ValorBruto';
const LISTA_10_PAGAMENTO_VALOR_LIQUIDO_FIELD = 'ValorL_x00ed_quidoaPagar';
const LISTA_10_PAGAMENTO_DATA_EMISSAO_FIELD = 'DatadeEmiss_x00e3_o';
const LISTA_10_PAGAMENTO_DATA_VENCIMENTO_FIELD = 'DatadeVencimento';
const LISTA_10_PAGAMENTO_DATA_PROGRAMADA_FIELD = 'DataProgramadaparaPagamento';
const LISTA_10_PAGAMENTO_STATUS_FIELD = 'StatusdoPagamento';
const LISTA_10_PAGAMENTO_FORMA_FIELD = 'FormadePagamento';
const LISTA_10_PAGAMENTO_CONTA_FIELD = 'ContadePagamento';
const LISTA_10_PAGAMENTO_CATEGORIA_FIELD = 'CategoriadoPagamento';
const LISTA_10_PAGAMENTO_ORIGEM_FIELD = 'OrigemdoPagamento';
const LISTA_10_PAGAMENTO_CENTRO_CUSTO_FIELD = 'CentrodeCusto';
const LISTA_10_PAGAMENTO_LINK_NF_FIELD = 'LinkdaNotaFiscal';
const LISTA_10_PAGAMENTO_OBSERVACOES_FIELD = 'Observa_x00e7__x00f5_es';
const LISTA_10_PAGAMENTO_STATUS_INICIAL = 'Programado';
const LISTA_10_PAGAMENTO_FORMA_INICIAL = 'Pix';
const LISTA_10_PAGAMENTO_CONTA_INICIAL = 'Itaú ENAC';
const LISTA_10_PAGAMENTO_CATEGORIA_INICIAL = 'Material de Obra';
const LISTA_10_PAGAMENTO_ORIGEM_INICIAL = 'Compra de Material';
const LISTA_10_PAGAMENTO_STATUS_CHOICES_CONFIRMADOS = ['Programado'];
const LISTA_10_PAGAMENTO_FORMA_CHOICES_CONFIRMADAS = ['Pix'];
const LISTA_10_PAGAMENTO_CONTA_CHOICES_CONFIRMADAS = ['Itaú ENAC'];
const LISTA_10_PAGAMENTO_CATEGORIA_CHOICES_CONFIRMADAS = ['Material de Obra'];
const LISTA_10_PAGAMENTO_ORIGEM_CHOICES_CONFIRMADAS = ['Compra de Material'];
const LISTA_10_PAGAMENTO_CAMPOS_PREVISTOS = [
  'Title',
  LISTA_10_PAGAMENTO_NUMERO_NF_FIELD,
  LISTA_10_PAGAMENTO_OBRA_FIELD,
  LISTA_10_PAGAMENTO_FORNECEDOR_FIELD,
  LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD,
  LISTA_10_PAGAMENTO_VALOR_LIQUIDO_FIELD,
  LISTA_10_PAGAMENTO_DATA_EMISSAO_FIELD,
  LISTA_10_PAGAMENTO_DATA_VENCIMENTO_FIELD,
  LISTA_10_PAGAMENTO_DATA_PROGRAMADA_FIELD,
  LISTA_10_PAGAMENTO_STATUS_FIELD,
  LISTA_10_PAGAMENTO_FORMA_FIELD,
  LISTA_10_PAGAMENTO_CONTA_FIELD,
  LISTA_10_PAGAMENTO_CATEGORIA_FIELD,
  LISTA_10_PAGAMENTO_ORIGEM_FIELD,
  LISTA_10_PAGAMENTO_CENTRO_CUSTO_FIELD,
  LISTA_10_PAGAMENTO_LINK_NF_FIELD,
  LISTA_10_PAGAMENTO_OBSERVACOES_FIELD
];

export interface ISharePointEnacRepositoryOptions {
  siteUrl: string;
  spHttpClient: SPHttpClient;
}

export interface IResolverAlcadaCompraOptions {
  tipoSolicitacao: TipoSolicitacaoEnac;
  obraId?: string;
  valor: number;
  dataReferencia: Date;
  motivoExcecao?: string;
}

interface ResultadoLeituraItemOperacionalV27A {
  item?: any;
  statusHttp?: number;
  erro?: string;
  camposRetornados?: string[];
  snapshotExistenteId?: number;
  snapshotExistenteTitulo?: string;
}

interface FornecedorTestePedidoV27A {
  id: number;
  title: string;
  lookup: string;
}

interface PedidoCompraExistenteV27A {
  id: number;
  title: string;
  vinculoTextual: string;
}

interface PedidoOrigemNotaFiscalV27A {
  id: number;
  title: string;
  numeroRequisicao: string;
  status: string;
  valor: number;
  obraId?: number;
  centroCusto?: string;
  fornecedorId?: number;
  fornecedorTitulo?: string;
  fornecedorLookup?: string;
}

interface NotaFiscalExistenteV27A {
  id: number;
  title: string;
  numeroNotaFiscal: string;
  numeroPedido: string;
}

interface NotaFiscalOrigemPagamentoV27A {
  id: number;
  title: string;
  numeroNotaFiscal: string;
  numeroPedido: string;
  statusConferencia: string;
  enviadaContabilidade: string;
  valorBruto: number;
  dataEmissao?: string;
  dataVencimento?: string;
  fornecedorId?: number;
  fornecedorTitulo?: string;
  obraId?: number;
  centroCusto?: string;
  linkNotaFiscal?: string;
}

interface PagamentoExistenteV27A {
  id: number;
  title: string;
  numeroNotaFiscal: string;
}

/**
 * V2.3: camada real de integracao SharePoint.
 * A interface V2.2 homologada permanece fora desta classe.
 */
export class SharePointEnacRepository {
  private readonly siteUrl: string;
  private readonly spHttpClient: SPHttpClient;

  public constructor(options: ISharePointEnacRepositoryOptions) {
    this.siteUrl = options.siteUrl;
    this.spHttpClient = options.spHttpClient;
  }

  public async listarSolicitacoes(): Promise<ISolicitacaoEnac[]> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}?$top=20&$select=Id,Title,TipodaSolicita_x00e7__x00e3_o,Descri_x00e7__x00e3_odaSolicita_,StatusdaRequisi_x00e7__x00e3_o,Solicitante/Title,Obra/Id,Obra/Title,SnapshotAprovacaoCompra/Id,SnapshotAprovacaoCompra/Title&$expand=Solicitante,Obra,SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => ({
      id: `REQ-${item.Id}`,
      titulo: item.Title,
      tipo: this.mapTipoSolicitacao(item.TipodaSolicita_x00e7__x00e3_o),
      descricao: item.Descri_x00e7__x00e3_odaSolicita_ || '',
      especificacaoTecnica: '',
      quantidade: Number(item.Quantidade || 0),
      unidade: item.Unidade,
      frenteServico: item.FrenteServico,
      dataNecessaria: item.DataNecessaria,
      prioridade: item.Prioridade || 'Normal',
      justificativaUrgencia: item.JustificativaUrgencia,
      anexoReferencia: item.AnexoReferencia,
      observacoes: item.Observacoes,
      solicitante: item.Solicitante?.Title || '',
      dataHoraSolicitacao: item.DataHoraSolicitacao,
      status: this.mapStatusProcesso(item.StatusdaRequisi_x00e7__x00e3_o),
      divergencias: [],
      snapshotAprovacaoCompra: item.SnapshotAprovacaoCompra ? { id: String(item.SnapshotAprovacaoCompra.Id) } as ISnapshotRegraEnac : undefined,
      obra: {
        id: String(item.Obra?.Id || ''),
        nome: item.Obra?.Title || '',
        codigoObra: item.Obra?.CodigoObra || '',
        cliente: item.Obra?.Cliente || '',
        centroCusto: item.Obra?.CentroCusto || ''
      },
      historico: []
    }));
  }

  public async listarRequisicoesResumo(): Promise<IRequisicaoResumoEnac[]> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}?$top=20&$select=Id,Title,TipodaSolicita_x00e7__x00e3_o,StatusdaRequisi_x00e7__x00e3_o,Obra/Id,Obra/Title,Solicitante/Title,Aprovador/Title,SnapshotAprovacaoCompra/Id,SnapshotAprovacaoCompra/Title&$expand=Obra,Solicitante,Aprovador,SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => ({
      id: `REQ-${item.Id}`,
      itemId: Number(item.Id),
      titulo: item.Title || '',
      tipoSolicitacao: item.TipodaSolicita_x00e7__x00e3_o || '',
      status: item.StatusdaRequisi_x00e7__x00e3_o || '',
      obraId: item.Obra?.Id ? Number(item.Obra.Id) : undefined,
      obraTitulo: item.Obra?.Title,
      solicitanteNome: item.Solicitante?.Title,
      aprovadorNome: item.Aprovador?.Title,
      snapshotAprovacaoCompraId: item.SnapshotAprovacaoCompra?.Id ? Number(item.SnapshotAprovacaoCompra.Id) : undefined,
      snapshotAprovacaoCompraTitulo: item.SnapshotAprovacaoCompra?.Title
    }));
  }

  public async obterSnapshotDaRequisicao(requisicaoId: number): Promise<ISnapshotRegraEnac | undefined> {
    const requestEndpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${requisicaoId})?$select=Id,SnapshotAprovacaoCompra/Id&$expand=SnapshotAprovacaoCompra`;
    const requestResponse = await this.spHttpClient.get(requestEndpoint, SPHttpClient.configurations.v1);
    const requestPayload = await this.ensureJson(requestResponse);
    const snapshotId = requestPayload.SnapshotAprovacaoCompra?.Id;

    if (!snapshotId) {
      return undefined;
    }

    const snapshotEndpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.snapshotsRegras)}(${snapshotId})?$select=Id,Title,RegraInternaId,Processo,FaixaValorVigente,ValorAnalisado,AprovadorBaseId,AprovadorBaseNome,AprovadorBaseEmail,AprovadorEfetivoId,AprovadorEfetivoNome,AprovadorEfetivoEmail,SubstituicaoAplicada,MotivoResolucaoAprovador,DataHoraAplicacao`;
    const snapshotResponse = await this.spHttpClient.get(snapshotEndpoint, SPHttpClient.configurations.v1);
    const item = await this.ensureJson(snapshotResponse);

    return this.mapSnapshot(item);
  }

  public async obterDiagnosticoReadonly(): Promise<IDiagnosticoReadonlyEnac> {
    const erros: string[] = [];
    let usuariosPerfis = 0;
    let alcadasAtivas = 0;
    let requisicoesResumo = 0;
    let usuariosOk = false;
    let alcadasOk = false;
    let requisicoesOk = false;
    let snapshotsOk = false;
    let snapshotTeste: IDiagnosticoReadonlyEnac['snapshotTeste'];

    try {
      usuariosPerfis = (await this.listarUsuariosPerfis()).length;
      usuariosOk = true;
    } catch (error) {
      erros.push(`usuarios: ${this.getErrorMessage(error)}`);
    }

    try {
      alcadasAtivas = (await this.listarAlcadas()).filter((alcada) => alcada.ativa).length;
      alcadasOk = true;
    } catch (error) {
      erros.push(`alcadas: ${this.getErrorMessage(error)}`);
    }

    try {
      requisicoesResumo = (await this.listarRequisicoesResumo()).length;
      requisicoesOk = true;
    } catch (error) {
      erros.push(`requisicoes: ${this.getErrorMessage(error)}`);
    }

    try {
      const snapshot = await this.obterSnapshotDaRequisicao(7);
      snapshotTeste = {
        requisicaoId: 7,
        snapshotEncontrado: Boolean(snapshot),
        snapshotTitulo: snapshot?.id,
        regraInternaId: snapshot?.regraAlcadaUtilizada,
        valorAnalisado: snapshot?.valorAnalisado,
        aprovadorBaseId: snapshot?.aprovadorBaseId,
        aprovadorEfetivoId: snapshot?.aprovadorEfetivoId
      };
      snapshotsOk = true;
    } catch (error) {
      erros.push(`snapshotTeste: ${this.getErrorMessage(error)}`);
    }

    return {
      origemDados: 'sharepoint',
      usuariosPerfis,
      alcadasAtivas,
      requisicoesResumo,
      usuariosOk,
      alcadasOk,
      requisicoesOk,
      snapshotsOk,
      snapshotTeste,
      erros
    };
  }

  public async obterUsuarioPorContaMicrosoft365(emailOuLogin: string): Promise<IUsuarioPerfilEnac | undefined> {
    const escaped = this.escapeOData(emailOuLogin);
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.usuariosPerfis)}?$select=Id,Title,UsuarioInternoId,EmailCorporativo,CargoFuncao,PerfilPrincipal,PerfisAdicionais,PodeCriarSolicitacao,PodeRegistrarCotacoes,PodeAprovarCompras,PodeEmitirPedido,PodeVincularNF,PodeProgramarPagamento,PodeLiberarPagamento,PodeAtualizarStatusFinal,PodeAdministrarConfiguracoes,UsuarioAtivo,InicioSubstituicao,FimSubstituicao,Observacoes,Created,Modified,Author/Title,Editor/Title,ContaMicrosoft365/Id,ContaMicrosoft365/Title,ContaMicrosoft365/EMail,ContaMicrosoft365/Name,SubstitutoTemporario/Id,SubstitutoTemporario/Title&$expand=ContaMicrosoft365,SubstitutoTemporario,Author,Editor&$filter=ContaMicrosoft365/EMail eq '${escaped}' or ContaMicrosoft365/Name eq '${escaped}'`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);
    const item = payload.value[0];

    return item ? this.mapUsuarioPerfil(item) : undefined;
  }

  public async listarUsuariosPerfis(options: { somenteAtivos?: boolean } = {}): Promise<IUsuarioPerfilEnac[]> {
    const filter = options.somenteAtivos ? '&$filter=UsuarioAtivo eq 1' : '';
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.usuariosPerfis)}?$select=Id,Title,UsuarioInternoId,EmailCorporativo,CargoFuncao,PerfilPrincipal,PerfisAdicionais,PodeCriarSolicitacao,PodeRegistrarCotacoes,PodeAprovarCompras,PodeEmitirPedido,PodeVincularNF,PodeProgramarPagamento,PodeLiberarPagamento,PodeAtualizarStatusFinal,PodeAdministrarConfiguracoes,UsuarioAtivo,InicioSubstituicao,FimSubstituicao,Observacoes,Created,Modified,Author/Title,Editor/Title,ContaMicrosoft365/Id,ContaMicrosoft365/Title,ContaMicrosoft365/EMail,ContaMicrosoft365/Name,SubstitutoTemporario/Id,SubstitutoTemporario/Title&$expand=ContaMicrosoft365,SubstitutoTemporario,Author,Editor${filter}`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);
    const usuarios = payload.value.map((item: any) => this.mapUsuarioPerfil(item));

    return usuarios.map((usuario: IUsuarioPerfilEnac) => this.enriquecerSubstitutoTemporario(usuario, usuarios));
  }

  public async listarAlcadas(): Promise<IAlcadaEnac[]> {
    let usuarios: IUsuarioPerfilEnac[] = [];

    try {
      usuarios = await this.listarUsuariosPerfis();
    } catch (error) {
      void error;
      usuarios = [];
    }

    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.alcadas)}?$select=Id,Title,RegraInternaId,Processo,TipoSolicitacao,Obra/Id,ValorMinimo,ValorMaximo,Ilimitado,AprovadorPrincipal/Id,AprovadorPrincipal/Title,ExigeAprovacaoAdicional,AprovadorAdicional/Id,AprovadorAdicional/Title,VigenciaInicial,VigenciaFinal,Ativo,Observacoes&$expand=Obra,AprovadorPrincipal,AprovadorAdicional`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => this.mapAlcada(item, usuarios));
  }

  public validarAlcadas(alcadas: IAlcadaEnac[]): IValidacaoAlcadaEnac[] {
    const problemas: IValidacaoAlcadaEnac[] = [];
    const vigentes = alcadas.filter((regra) => regra.ativa);

    for (const regra of vigentes) {
      if (!regra.ilimitado && regra.valorMaximo !== undefined && regra.valorMaximo < regra.valorMinimo) {
        problemas.push({ tipo: 'Erro', regraInternaId: regra.regraInternaId, mensagem: 'Valor maximo inferior ao valor minimo.' });
      }
    }

    const grupos = new Map<string, IAlcadaEnac[]>();
    for (const regra of vigentes) {
      const chave = `${regra.processo}|${regra.tipoSolicitacao}|${regra.obraId || regra.obra || 'Todas'}`;
      grupos.set(chave, [...(grupos.get(chave) || []), regra]);
    }

    grupos.forEach((grupo) => {
      const ordenadas = grupo.sort((a, b) => a.valorMinimo - b.valorMinimo);
      for (let i = 0; i < ordenadas.length - 1; i += 1) {
        const atual = ordenadas[i];
        const proxima = ordenadas[i + 1];
        const maxAtual = atual.ilimitado ? Number.POSITIVE_INFINITY : Number(atual.valorMaximo || 0);

        if (maxAtual === Number.POSITIVE_INFINITY) {
          problemas.push({ tipo: 'Erro', regraInternaId: atual.regraInternaId, mensagem: 'Regra ilimitada sobrepoe regras posteriores do mesmo grupo.' });
        } else if (proxima.valorMinimo <= maxAtual) {
          problemas.push({ tipo: 'Erro', regraInternaId: proxima.regraInternaId, mensagem: 'Sobreposicao de regras ativas e vigentes.' });
        } else if (proxima.valorMinimo > maxAtual + 0.01) {
          problemas.push({ tipo: 'Aviso', regraInternaId: proxima.regraInternaId, mensagem: 'Possivel lacuna de aprovacao entre faixas.' });
        }
      }
    });

    return problemas;
  }

  public selecionarRegraAlcadaCompra(alcadas: IAlcadaEnac[], options: IResolverAlcadaCompraOptions): IAlcadaEnac {
    const data = options.dataReferencia;
    const candidatas = alcadas
      .filter((regra) => regra.processo === 'Compra')
      .filter((regra) => regra.ativa)
      .filter((regra) => this.regraVigenteNaData(regra, data))
      .filter((regra) => regra.tipoSolicitacao === 'Todos' || regra.tipoSolicitacao === options.tipoSolicitacao)
      .filter((regra) => regra.obra === 'Todas' || regra.obraId === options.obraId || regra.obra === options.obraId)
      .filter((regra) => options.valor >= regra.valorMinimo && (regra.ilimitado || regra.valorMaximo === undefined || options.valor <= regra.valorMaximo));

    const especifica = candidatas.find((regra) => regra.obra !== 'Todas' && (regra.obraId === options.obraId || regra.obra === options.obraId));
    const regra = especifica || candidatas[0];

    if (!regra) {
      throw new Error('Nenhuma regra de alcada ativa e vigente atende a compra informada.');
    }

    return regra;
  }

  public resolverAprovadorEfetivo(aprovadorBase: IUsuarioPerfilEnac, usuarios: IUsuarioPerfilEnac[], dataReferencia: Date): IResolucaoAprovadorEnac {
    if (!aprovadorBase.usuarioAtivo) {
      throw new Error('Aprovador base inativo nao pode ser selecionado para nova aprovacao.');
    }

    const inicio = aprovadorBase.inicioSubstituicao ? new Date(aprovadorBase.inicioSubstituicao) : undefined;
    const fim = aprovadorBase.fimSubstituicao ? new Date(aprovadorBase.fimSubstituicao) : undefined;
    const substituicaoVigente = Boolean(aprovadorBase.substitutoTemporarioId && inicio && dataReferencia >= inicio && (!fim || dataReferencia <= fim));

    if (!substituicaoVigente) {
      return { base: aprovadorBase, efetivo: aprovadorBase, substituicaoAplicada: false, motivo: 'Sem substituicao temporaria vigente.' };
    }

    const substituto = usuarios.find((usuario) => usuario.usuarioInternoId === aprovadorBase.substitutoTemporarioId || usuario.id === aprovadorBase.substitutoTemporarioId);
    if (!substituto || !substituto.usuarioAtivo) {
      return { base: aprovadorBase, efetivo: aprovadorBase, substituicaoAplicada: false, motivo: 'Substituto temporario nao encontrado ou inativo; mantido aprovador base.' };
    }

    return { base: aprovadorBase, efetivo: substituto, substituicaoAplicada: true, motivo: 'Substituicao temporaria vigente aplicada a partir do cadastro do usuario.' };
  }

  public criarSnapshotAprovacaoCompra(regra: IAlcadaEnac, resolucao: IResolucaoAprovadorEnac, valor: number, motivoExcecao?: string): ISnapshotRegraEnac {
    return {
      regraAlcadaUtilizada: regra.regraInternaId,
      processo: regra.processo,
      faixaValorVigente: `${regra.valorMinimo} ate ${regra.ilimitado ? 'ilimitado' : regra.valorMaximo}`,
      valorAnalisado: valor,
      aprovadorBaseId: resolucao.base.usuarioInternoId,
      aprovadorBaseNome: resolucao.base.nome,
      aprovadorBaseEmail: resolucao.base.emailCorporativo,
      aprovadorEfetivoId: resolucao.efetivo.usuarioInternoId,
      aprovadorEfetivoNome: resolucao.efetivo.nome,
      aprovadorEfetivoEmail: resolucao.efetivo.emailCorporativo,
      substituicaoAplicada: resolucao.substituicaoAplicada,
      motivoResolucaoAprovador: resolucao.motivo,
      motivoExcecao,
      dataHoraAplicacao: new Date().toISOString()
    };
  }

  public async persistirSnapshotAprovacaoCompra(solicitacaoItemId: number, pedidoCompraItemId: number | undefined, snapshot: ISnapshotRegraEnac): Promise<number> {
    void solicitacaoItemId;
    void pedidoCompraItemId;
    void snapshot;
    throw new Error('Persistencia operacional de snapshot bloqueada. Use apenas executarTesteControladoSnapshot() em modo V2.6A-TESTE autorizado.');
  }

  public async carregarPerfilUsuarioAtual(emailOuLogin: string): Promise<IUsuarioPerfilEnac> {
    const usuario = await this.obterUsuarioPorContaMicrosoft365(emailOuLogin);

    if (!usuario) {
      throw new Error('Usuario autenticado nao encontrado em ENAC Usuarios Perfis. Escrita operacional bloqueada.');
    }

    if (!usuario.usuarioAtivo) {
      throw new Error('Usuario autenticado esta inativo em ENAC Usuarios Perfis. Escrita operacional bloqueada.');
    }

    return usuario;
  }

  public validarPermissaoAcao(acao: AcaoOperacionalV27A, item: { status?: string; title?: string } | undefined, perfil: IUsuarioPerfilEnac, flags: FlagsEscritaOperacionalV27A): AlertaBloqueioEscrita[] {
    const alertas = this.validarFlagsOperacionaisV27A(flags);

    if (!perfil.usuarioAtivo) {
      alertas.push({ codigo: 'USUARIO_INATIVO', mensagem: 'Usuario inativo nao pode executar escrita operacional.' });
    }

    if (!this.perfilPodeExecutarAcao(acao, perfil)) {
      alertas.push({ codigo: 'PERFIL_SEM_PERMISSAO', mensagem: `Perfil ${perfil.perfilPrincipal} nao pode executar ${acao}.` });
    }

    if (flags.permitirSomenteItensTesteV27A && item?.title && item.title.indexOf(flags.marcadorTesteOperacionalV27A) < 0) {
      alertas.push({ codigo: 'ITEM_SEM_MARCADOR_TESTE_V27A', mensagem: `Item deve conter ${flags.marcadorTesteOperacionalV27A}.` });
    }

    if (item?.status && !this.transicaoPermitidaV27A(acao, item.status)) {
      alertas.push({ codigo: 'TRANSICAO_NAO_PERMITIDA', mensagem: `Status atual nao permite ${acao}: ${item.status}.` });
    }

    return alertas;
  }

  public async preValidarEscritaOperacionalV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<PreValidacaoOperacionalV27AResultado> {
    const alertas = this.validarFlagsOperacionaisV27A(flags);

    try {
      const usuarioAtual = await this.carregarPerfilUsuarioAtual(emailOuLogin);
      const acoesPermitidas = this.acoesPermitidasParaPerfil(usuarioAtual);

      return {
        sucesso: alertas.length === 0,
        bloqueado: alertas.length > 0,
        mensagem: alertas.length > 0
          ? 'V2.7A bloqueada por flags incompletas. Nenhuma escrita operacional deve ser executada.'
          : 'V2.7A pre-validada: escrita operacional restrita disponivel apenas para itens V2.7A-TESTE e acoes permitidas por perfil.',
        usuarioAtual,
        acoesPermitidas,
        alertas
      };
    } catch (error) {
      return {
        sucesso: false,
        bloqueado: true,
        mensagem: this.getErrorMessage(error),
        acoesPermitidas: [],
        alertas: [...alertas, { codigo: 'PERFIL_NAO_RESOLVIDO', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async preValidarEscritaOperacionalRestritaV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<PreValidacaoOperacionalV27AResultado> {
    const alertas = this.validarFlagsOperacionaisV27A(flags);
    const itemTesteId = Number(config.itemTesteOperacionalIdV27A || 0);
    const acaoPretendida = config.acaoTesteOperacionalV27A || 'AtualizarStatusRequisicao';
    const statusDestino = config.statusDestinoTesteOperacionalV27A || 'Aguardando aprovação';
    let usuarioAtual: IUsuarioPerfilEnac | undefined;
    let leituraItem: ResultadoLeituraItemOperacionalV27A | undefined;
    let item: any | undefined;
    let acoesPermitidas: AcaoOperacionalV27A[] = [];

    if (!itemTesteId || itemTesteId <= 0) {
      alertas.push({ codigo: 'ITEM_TESTE_ID_AUSENTE', mensagem: 'itemTesteOperacionalIdV27A deve ser informado antes da escrita.' });
    }

    try {
      usuarioAtual = await this.carregarPerfilUsuarioAtual(emailOuLogin);
      acoesPermitidas = this.acoesPermitidasParaPerfil(usuarioAtual);

      if (!this.perfilPodeExecutarAcao(acaoPretendida, usuarioAtual)) {
        alertas.push({ codigo: 'PERFIL_SEM_PERMISSAO', mensagem: `Perfil ${usuarioAtual.perfilPrincipal} nao pode executar ${acaoPretendida}.` });
      }

      if (itemTesteId > 0) {
        leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(itemTesteId);
        item = leituraItem.item;
      }
    } catch (error) {
      alertas.push({ codigo: itemTesteId > 0 ? 'ITEM_OU_PERFIL_NAO_RESOLVIDO' : 'PERFIL_NAO_RESOLVIDO', mensagem: this.getErrorMessage(error) });
    }

    const title = String(item?.Title || '');
    const tipoSolicitacao = String(item?.TipodaSolicita_x00e7__x00e3_o || '');
    const statusAtual = String(item?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = item ? this.obterCamposComMarcadorV27A(item, flags.marcadorTesteOperacionalV27A) : [];
    const marcadorEncontrado = camposComMarcador.length > 0;
    const transicaoPermitida = item ? this.transicaoPermitidaV27A(acaoPretendida, statusAtual, statusDestino) : false;
    const camposObrigatoriosPresentes = Boolean(title && statusAtual && tipoSolicitacao);
    const snapshotExistenteId = leituraItem?.snapshotExistenteId;
    const snapshotExistenteTitulo = leituraItem?.snapshotExistenteTitulo;
    let regraInternaId: string | undefined;
    let resumoRegraAplicada: string | undefined;
    let aprovadorBaseNome: string | undefined;
    let aprovadorEfetivoNome: string | undefined;
    let aprovadorPrevistoNome: string | undefined;
    let aprovadorEfetivoOperacionalNome: string | undefined;
    let tipoAprovacaoCompra: 'Aprovador direto' | 'Alçada superior / Diretoria' | undefined;
    let diagnosticoAprovacaoCompra: 'APROVADOR_DO_SNAPSHOT_VALIDO' | 'DIRETORIA_ALCADA_SUPERIOR_VALIDADA' | undefined;
    let justificativaAprovacaoPrevista: string | undefined;
    let snapshotPrevistoTitulo: string | undefined;
    let snapshotAprovacao: ISnapshotRegraEnac | undefined;
    let criaraSnapshot = false;
    let vincularaSnapshotAprovacaoCompra = false;
    let registraraHistorico = false;
    let aprovacaoNecessariaCampo: string | undefined;
    let aprovacaoNecessariaValorBruto: string | undefined;
    let aprovacaoNecessariaNormalizada: 'Sim' | 'Nao' | 'Nao resolvido' | undefined;
    let diagnosticoPedidoCompra: string[] | undefined;
    let pedidoTituloPrevisto: string | undefined;
    let pedidoVinculoTextual: string | undefined;
    let pedidoFornecedorId: number | undefined;
    let pedidoFornecedorTitulo: string | undefined;
    let pedidoFornecedorLookup: string | undefined;
    let pedidoStatusInicial: string | undefined;
    let pedidoExistenteId: number | undefined;
    let pedidoExistenteTitulo: string | undefined;
    let diagnosticoNotaFiscal: string[] | undefined;
    let notaFiscalTituloPrevisto: string | undefined;
    let notaFiscalNumeroPrevisto: string | undefined;
    let notaFiscalPedidoId: number | undefined;
    let notaFiscalPedidoTitulo: string | undefined;
    let notaFiscalVinculoPedido: string | undefined;
    let notaFiscalFornecedorId: number | undefined;
    let notaFiscalFornecedorTitulo: string | undefined;
    let notaFiscalObraId: number | undefined;
    let notaFiscalStatusInicial: string | undefined;
    let notaFiscalTipo: string | undefined;
    let notaFiscalEnviadaContabilidade: string | undefined;
    let notaFiscalExistenteId: number | undefined;
    let notaFiscalExistenteTitulo: string | undefined;
    let diagnosticoPagamento: string[] | undefined;
    let pagamentoTituloPrevisto: string | undefined;
    let pagamentoNotaFiscalId: number | undefined;
    let pagamentoNotaFiscalNumero: string | undefined;
    let pagamentoVinculoNf: string | undefined;
    let pagamentoFornecedorId: number | undefined;
    let pagamentoFornecedorTitulo: string | undefined;
    let pagamentoObraId: number | undefined;
    let pagamentoValorBruto: number | undefined;
    let pagamentoValorLiquido: number | undefined;
    let pagamentoVencimento: string | undefined;
    let pagamentoDataProgramada: string | undefined;
    let pagamentoStatusInicial: string | undefined;
    let pagamentoForma: string | undefined;
    let pagamentoConta: string | undefined;
    let pagamentoCategoria: string | undefined;
    let pagamentoOrigem: string | undefined;
    let pagamentoExistenteId: number | undefined;
    let pagamentoExistenteTitulo: string | undefined;

    if (itemTesteId > 0 && !item) {
      alertas.push({ codigo: leituraItem?.statusHttp === 403 ? 'ERRO_REST_LISTA02' : 'ITEM_TESTE_NAO_ENCONTRADO', mensagem: leituraItem?.erro || `Item ${itemTesteId} nao foi encontrado na Lista 02.` });
    }

    if (item && !marcadorEncontrado) {
      alertas.push({ codigo: 'ITEM_TESTE_SEM_MARCADOR', mensagem: `Item ${itemTesteId} deve conter ${flags.marcadorTesteOperacionalV27A} no numero, codigo da obra, centro de custo, descricao ou observacoes.` });
    }

    if (item && !statusAtual) {
      alertas.push({ codigo: 'STATUS_ATUAL_NAO_RESOLVIDO', mensagem: `Campo ${LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD} nao retornou valor.` });
    }

    if (item && !transicaoPermitida) {
      alertas.push({ codigo: 'TRANSICAO_NAO_PERMITIDA', mensagem: `Status atual "${statusAtual}" nao permite ${acaoPretendida} para "${statusDestino}".` });
    }

    if (item && !this.statusRequisicaoMapeadoV27A(statusDestino)) {
      alertas.push({ codigo: 'STATUS_DESTINO_NAO_MAPEADO', mensagem: `Status destino "${statusDestino}" nao consta nas choices reais conhecidas da Lista 02.` });
    }

    if (item && !camposObrigatoriosPresentes) {
      alertas.push({ codigo: 'CAMPOS_OBRIGATORIOS_AUSENTES', mensagem: 'Title, tipo da solicitacao e status atual devem estar preenchidos.' });
    }

    if (acaoPretendida === 'CriarSnapshotAprovacaoOperacional') {
      if (item && this.normalizarTexto(statusAtual) !== 'aguardandoaprovacao') {
        alertas.push({ codigo: 'STATUS_NAO_ELEGIVEL_PARA_SNAPSHOT', mensagem: 'Snapshot operacional exige status atual Aguardando aprovação.' });
      }

      if (snapshotExistenteId) {
        alertas.push({ codigo: 'SNAPSHOT_JA_EXISTENTE', mensagem: `Item ja possui SnapshotAprovacaoCompra=${snapshotExistenteId}.` });
      }

      if (!config.valorTesteOperacionalV27A || config.valorTesteOperacionalV27A <= 0) {
        alertas.push({ codigo: 'VALOR_TESTE_AUSENTE', mensagem: 'valorTesteOperacionalV27A deve ser maior que zero para criar snapshot.' });
      }

      const aprovacaoNecessaria = this.obterAprovacaoNecessaria(item);
      aprovacaoNecessariaCampo = aprovacaoNecessaria.campo;
      aprovacaoNecessariaValorBruto = this.formatarValorBrutoSharePoint(aprovacaoNecessaria.valorBruto);
      aprovacaoNecessariaNormalizada = aprovacaoNecessaria.normalizado === true
        ? 'Sim'
        : aprovacaoNecessaria.normalizado === false
          ? 'Nao'
          : 'Nao resolvido';

      if (item && aprovacaoNecessaria.normalizado === false) {
        alertas.push({ codigo: 'APROVACAO_NAO_NECESSARIA', mensagem: `Aprovacao necessaria resolvida como Nao no campo ${aprovacaoNecessariaCampo || '-'}. Valor bruto: ${aprovacaoNecessariaValorBruto || '-'}.` });
      }

      if (item && aprovacaoNecessaria.normalizado === null) {
        alertas.push({ codigo: 'APROVACAO_NECESSARIA_NAO_RESOLVIDA', mensagem: `Aprovacao necessaria nao resolvida. Campos candidatos: ${LISTA_02_REQUISICOES_COMPRA_CAMPOS_APROVACAO_NECESSARIA.join(', ')}.` });
      }

      if (item && config.valorTesteOperacionalV27A && config.valorTesteOperacionalV27A > 0 && !snapshotExistenteId) {
        try {
          const usuarios = await this.listarUsuariosPerfis({ somenteAtivos: true });
          const alcadas = await this.listarAlcadas();
          const regra = this.selecionarRegraAlcadaCompra(alcadas, {
            tipoSolicitacao: this.mapTipoSolicitacao(tipoSolicitacao),
            obraId: item.ObraId ? String(item.ObraId) : undefined,
            valor: config.valorTesteOperacionalV27A,
            dataReferencia: new Date()
          });
          const aprovadorBase = this.encontrarUsuarioPorLookup(regra.aprovadorPrincipalId, regra.aprovadorPrincipalNome, usuarios);

          if (!aprovadorBase) {
            alertas.push({ codigo: 'APROVADOR_NAO_RESOLVIDO', mensagem: `Aprovador da regra ${regra.regraInternaId} nao foi localizado entre usuarios ativos.` });
          } else {
            const resolucao = this.resolverAprovadorEfetivo(aprovadorBase, usuarios, new Date());
            const snapshot = this.criarSnapshotAprovacaoCompra(regra, resolucao, config.valorTesteOperacionalV27A, flags.marcadorTesteOperacionalV27A);
            regraInternaId = regra.regraInternaId;
            resumoRegraAplicada = `${flags.marcadorTesteOperacionalV27A}; ${regra.processo}; ${snapshot.faixaValorVigente}; aprovador ${snapshot.aprovadorBaseNome}`;
            aprovadorBaseNome = snapshot.aprovadorBaseNome;
            aprovadorEfetivoNome = snapshot.aprovadorEfetivoNome;
            snapshotPrevistoTitulo = `SNAP-V2.7A-TESTE-${itemTesteId}-<timestamp>`;
            criaraSnapshot = true;
            vincularaSnapshotAprovacaoCompra = true;
            registraraHistorico = true;
          }
        } catch (error) {
          alertas.push({ codigo: 'REGRA_ALCADA_NAO_RESOLVIDA', mensagem: this.getErrorMessage(error) });
        }
      }
    }

    if (acaoPretendida === 'AprovarCompra') {
      if (item && this.normalizarTexto(statusAtual) !== 'aguardandoaprovacao') {
        alertas.push({ codigo: 'STATUS_NAO_ELEGIVEL_PARA_APROVACAO', mensagem: 'AprovarCompra exige status atual Aguardando aprovação.' });
      }

      if (this.normalizarTexto(statusDestino) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
        alertas.push({ codigo: 'STATUS_DESTINO_NAO_MAPEADO', mensagem: `AprovarCompra deve usar a choice real "${STATUS_APROVADO_COMPRA_V27A}".` });
      }

      if (!snapshotExistenteId) {
        alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'AprovarCompra exige SnapshotAprovacaoCompra ja vinculado.' });
      }

      if (!config.valorTesteOperacionalV27A || config.valorTesteOperacionalV27A <= 0) {
        alertas.push({ codigo: 'VALOR_TESTE_AUSENTE', mensagem: 'valorTesteOperacionalV27A deve ser maior que zero para aprovar compra.' });
      }

      const aprovacaoNecessaria = this.obterAprovacaoNecessaria(item);
      aprovacaoNecessariaCampo = aprovacaoNecessaria.campo;
      aprovacaoNecessariaValorBruto = this.formatarValorBrutoSharePoint(aprovacaoNecessaria.valorBruto);
      aprovacaoNecessariaNormalizada = aprovacaoNecessaria.normalizado === true
        ? 'Sim'
        : aprovacaoNecessaria.normalizado === false
          ? 'Nao'
          : 'Nao resolvido';

      if (item && aprovacaoNecessaria.normalizado === false) {
        alertas.push({ codigo: 'APROVACAO_NAO_NECESSARIA', mensagem: `Aprovacao necessaria resolvida como Nao no campo ${aprovacaoNecessariaCampo || '-'}. Valor bruto: ${aprovacaoNecessariaValorBruto || '-'}.` });
      }

      if (item && aprovacaoNecessaria.normalizado === null) {
        alertas.push({ codigo: 'APROVACAO_NECESSARIA_NAO_RESOLVIDA', mensagem: `Aprovacao necessaria nao resolvida. Campos candidatos: ${LISTA_02_REQUISICOES_COMPRA_CAMPOS_APROVACAO_NECESSARIA.join(', ')}.` });
      }

      if (item && snapshotExistenteId) {
        try {
          snapshotAprovacao = await this.obterSnapshotDaRequisicao(itemTesteId);

          if (!snapshotAprovacao) {
            alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: `SnapshotAprovacaoCompra ${snapshotExistenteId} nao foi resolvido.` });
          } else {
            regraInternaId = snapshotAprovacao.regraAlcadaUtilizada;
            resumoRegraAplicada = `${flags.marcadorTesteOperacionalV27A}; ${snapshotAprovacao.processo}; ${snapshotAprovacao.faixaValorVigente}; aprovador ${snapshotAprovacao.aprovadorBaseNome}`;
            aprovadorBaseNome = snapshotAprovacao.aprovadorBaseNome;
            aprovadorEfetivoNome = snapshotAprovacao.aprovadorEfetivoNome;
            aprovadorPrevistoNome = snapshotAprovacao.aprovadorEfetivoNome || snapshotAprovacao.aprovadorBaseNome;
            aprovadorEfetivoOperacionalNome = usuarioAtual?.nome;
            registraraHistorico = true;

            if (!snapshotAprovacao.regraAlcadaUtilizada) {
              alertas.push({ codigo: 'REGRA_ALCADA_NAO_RESOLVIDA', mensagem: 'Snapshot vinculado nao possui regra/alçada resolvida.' });
            }

            if (!snapshotAprovacao.aprovadorBaseNome || !snapshotAprovacao.aprovadorEfetivoNome) {
              alertas.push({ codigo: 'APROVADOR_NAO_RESOLVIDO', mensagem: 'Snapshot vinculado nao possui aprovador base/efetivo resolvido.' });
            }

            if (usuarioAtual) {
              if (this.usuarioCorrespondeAoAprovadorSnapshotV27A(usuarioAtual, snapshotAprovacao)) {
                tipoAprovacaoCompra = 'Aprovador direto';
                diagnosticoAprovacaoCompra = 'APROVADOR_DO_SNAPSHOT_VALIDO';
                aprovadorEfetivoOperacionalNome = usuarioAtual.nome;
                justificativaAprovacaoPrevista = `Aprovacao pelo aprovador previsto: ${aprovadorPrevistoNome || '-'}.`;
              } else if (this.usuarioPodeAprovarComoDiretoriaSuperiorV27A(usuarioAtual, statusAtual, statusDestino, snapshotExistenteId)) {
                tipoAprovacaoCompra = 'Alçada superior / Diretoria';
                diagnosticoAprovacaoCompra = 'DIRETORIA_ALCADA_SUPERIOR_VALIDADA';
                aprovadorEfetivoOperacionalNome = `${usuarioAtual.nome} / Diretoria`;
                justificativaAprovacaoPrevista = `Aprovação por alçada superior: aprovador previsto ${aprovadorPrevistoNome || '-'}; aprovador efetivo ${aprovadorEfetivoOperacionalNome}.`;
              } else {
                if (usuarioAtual.perfilPrincipal !== 'Diretoria') {
                  alertas.push({ codigo: 'PERFIL_DIRETORIA_NAO_ATIVO', mensagem: 'Aprovacao por alcada superior exige usuario ativo com perfil Diretoria.' });
                }
                alertas.push({ codigo: 'USUARIO_NAO_E_APROVADOR', mensagem: `Usuario atual nao corresponde ao aprovador efetivo/base do snapshot (${aprovadorPrevistoNome || '-'}).` });
              }
            }
          }
        } catch (error) {
          alertas.push({ codigo: 'REGRA_ALCADA_NAO_RESOLVIDA', mensagem: this.getErrorMessage(error) });
        }
      }
    }

    if (acaoPretendida === 'CriarPedidoCompra') {
      const statusPedidoInicial = config.statusPedidoInicialTesteV27A || LISTA_03_PEDIDOS_COMPRA_STATUS_INICIAL;
      const fornecedorTesteId = Number(config.fornecedorTesteIdV27A || 0);
      pedidoStatusInicial = statusPedidoInicial;
      pedidoFornecedorId = fornecedorTesteId > 0 ? fornecedorTesteId : undefined;
      pedidoVinculoTextual = item ? this.obterNumeroRequisicaoPedidoV27A(item, itemTesteId) : undefined;
      pedidoTituloPrevisto = item ? this.criarTituloPedidoV27A(itemTesteId, config) : undefined;
      diagnosticoPedidoCompra = [
        `Lista 03 por GUID ${LISTAS_ENAC.pedidosCompra}.`,
        `SolicitacaoId ausente na auditoria readonly; usar ${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD} como vinculo textual temporario.`,
        `Campos previstos: ${LISTA_03_PEDIDOS_COMPRA_CAMPOS_PREVISTOS.join(', ')}.`
      ];

      if (item && this.normalizarTexto(statusAtual) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
        alertas.push({ codigo: 'STATUS_NAO_ELEGIVEL_PARA_PEDIDO', mensagem: 'CriarPedidoCompra exige status atual Aprovada para compra.' });
      }

      if (!snapshotExistenteId) {
        alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'CriarPedidoCompra exige SnapshotAprovacaoCompra ja vinculado.' });
      }

      if (!config.valorTesteOperacionalV27A || config.valorTesteOperacionalV27A <= 0) {
        alertas.push({ codigo: 'VALOR_TESTE_AUSENTE', mensagem: 'valorTesteOperacionalV27A deve ser maior que zero para criar pedido.' });
      }

      const aprovacaoNecessaria = this.obterAprovacaoNecessaria(item);
      aprovacaoNecessariaCampo = aprovacaoNecessaria.campo;
      aprovacaoNecessariaValorBruto = this.formatarValorBrutoSharePoint(aprovacaoNecessaria.valorBruto);
      aprovacaoNecessariaNormalizada = aprovacaoNecessaria.normalizado === true
        ? 'Sim'
        : aprovacaoNecessaria.normalizado === false
          ? 'Nao'
          : 'Nao resolvido';

      if (item && !item.Descri_x00e7__x00e3_odaSolicita_) {
        alertas.push({ codigo: 'CAMPOS_PEDIDO_OBRIGATORIOS_AUSENTES', mensagem: 'Descricao da solicitacao deve estar preenchida para preparar pedido.' });
      }

      if (item && !item.CentrodeCusto) {
        alertas.push({ codigo: 'CAMPOS_PEDIDO_OBRIGATORIOS_AUSENTES', mensagem: 'Centro de custo deve estar preenchido para preparar pedido.' });
      }

      if (item && !item.ObraId) {
        alertas.push({ codigo: 'OBRA_OBRIGATORIA_AUSENTE', mensagem: 'ObraId deve estar preenchido para criar pedido na Lista 03.' });
      }

      if (!pedidoVinculoTextual) {
        alertas.push({ codigo: 'CAMPOS_PEDIDO_OBRIGATORIOS_AUSENTES', mensagem: 'Title ou numero textual da requisicao deve estar preenchido para vinculo temporario.' });
      }

      if (!fornecedorTesteId || fornecedorTesteId <= 0) {
        alertas.push({ codigo: 'FORNECEDOR_TESTE_NAO_INFORMADO', mensagem: 'fornecedorTesteIdV27A deve informar um item valido da Lista 06 para preencher Fornecedor0Id.' });
      } else {
        try {
          const fornecedor = await this.obterFornecedorTestePedidoV27A(fornecedorTesteId);
          pedidoFornecedorTitulo = fornecedor.title;
          pedidoFornecedorLookup = fornecedor.lookup;
        } catch (error) {
          const mensagem = this.getErrorMessage(error);
          alertas.push({
            codigo: mensagem.indexOf('404') >= 0 ? 'FORNECEDOR_TESTE_NAO_ENCONTRADO' : 'ERRO_REST_FORNECEDORES',
            mensagem
          });
        }
      }

      if (!this.statusPedidoInicialMapeadoV27A(statusPedidoInicial)) {
        alertas.push({ codigo: 'STATUS_PEDIDO_INICIAL_NAO_MAPEADO', mensagem: `StatusdoPedido inicial "${statusPedidoInicial}" nao consta nas choices confirmadas da Lista 03.` });
      }

      if (item && pedidoVinculoTextual) {
        try {
          const pedidoExistente = await this.obterPedidoExistenteV27A(pedidoVinculoTextual, itemTesteId);
          if (pedidoExistente) {
            pedidoExistenteId = pedidoExistente.id;
            pedidoExistenteTitulo = pedidoExistente.title;
            alertas.push({ codigo: 'PEDIDO_JA_EXISTENTE', mensagem: `Pedido existente encontrado: ${pedidoExistente.id} / ${pedidoExistente.title}.` });
          }
        } catch (error) {
          alertas.push({ codigo: 'ERRO_REST_LISTA03', mensagem: this.getErrorMessage(error) });
        }
      }

      registraraHistorico = true;
    }

    if (acaoPretendida === 'VincularNotaFiscal') {
      const pedidoTesteId = Number(config.pedidoTesteIdV27A || 0);
      const numeroNf = String(config.numeroNotaFiscalTesteV27A || '').trim();
      const valorNf = Number(config.valorNotaFiscalTesteV27A || config.valorTesteOperacionalV27A || 0);
      const tipoNf = config.tipoNotaFiscalTesteV27A || LISTA_04_NOTAS_FISCAIS_TIPO_INICIAL;
      const statusNf = config.statusNotaFiscalInicialTesteV27A || LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL;
      const enviadaContabilidade = config.enviadaContabilidadeTesteV27A || LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL;
      let pedidoOrigem: PedidoOrigemNotaFiscalV27A | undefined;

      notaFiscalPedidoId = pedidoTesteId > 0 ? pedidoTesteId : undefined;
      notaFiscalNumeroPrevisto = numeroNf;
      notaFiscalStatusInicial = statusNf;
      notaFiscalTipo = tipoNf;
      notaFiscalEnviadaContabilidade = enviadaContabilidade;
      notaFiscalTituloPrevisto = pedidoTesteId > 0 ? this.criarTituloNotaFiscalV27A(pedidoTesteId, config) : undefined;
      diagnosticoNotaFiscal = [
        `Lista 04 por GUID ${LISTAS_ENAC.notasFiscaisRecebidas}.`,
        `Campo obrigatorio ${LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD} confirmado com choices sim/não; valor inicial ${enviadaContabilidade}.`,
        `Campos previstos: ${LISTA_04_NOTAS_FISCAIS_CAMPOS_PREVISTOS.join(', ')}.`
      ];

      if (!pedidoTesteId || pedidoTesteId <= 0) {
        alertas.push({ codigo: 'PEDIDO_TESTE_NAO_ENCONTRADO', mensagem: 'pedidoTesteIdV27A deve informar o item de pedido de teste da Lista 03.' });
      } else {
        try {
          pedidoOrigem = await this.obterPedidoOrigemNotaFiscalV27A(pedidoTesteId);
          notaFiscalPedidoTitulo = pedidoOrigem.title;
          notaFiscalVinculoPedido = this.obterVinculoPedidoNotaFiscalV27A(pedidoOrigem);
          notaFiscalFornecedorId = pedidoOrigem.fornecedorId;
          notaFiscalFornecedorTitulo = pedidoOrigem.fornecedorLookup || pedidoOrigem.fornecedorTitulo;
          notaFiscalObraId = pedidoOrigem.obraId;
        } catch (error) {
          alertas.push({ codigo: 'ERRO_REST_LISTA03', mensagem: this.getErrorMessage(error) });
        }
      }

      if (item && this.normalizarTexto(statusAtual) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
        alertas.push({ codigo: 'PEDIDO_STATUS_NAO_ELEGIVEL_PARA_NF', mensagem: 'VincularNotaFiscal exige requisicao origem preservada em Aprovada para compra.' });
      }

      if (!snapshotExistenteId) {
        alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'VincularNotaFiscal exige SnapshotAprovacaoCompra preservado na requisicao origem.' });
      }

      if (pedidoOrigem) {
        if (pedidoOrigem.numeroRequisicao !== 'V2.7A-TESTE-001') {
          alertas.push({ codigo: 'PEDIDO_SEM_VINCULO_REQUISICAO', mensagem: `Pedido ${pedidoTesteId} nao esta vinculado a V2.7A-TESTE-001.` });
        }

        if (!this.statusPedidoElegivelParaNotaFiscalV27A(pedidoOrigem.status)) {
          alertas.push({ codigo: 'PEDIDO_STATUS_NAO_ELEGIVEL_PARA_NF', mensagem: `Status do pedido nao elegivel para NF de teste: ${pedidoOrigem.status || '-'}.` });
        }

        if (!pedidoOrigem.fornecedorId) {
          alertas.push({ codigo: 'FORNECEDOR_PEDIDO_AUSENTE', mensagem: 'Pedido de origem nao possui Fornecedor0 preenchido.' });
        }

        if (!pedidoOrigem.obraId) {
          alertas.push({ codigo: 'OBRA_PEDIDO_AUSENTE', mensagem: 'Pedido de origem nao possui ObraId preenchido.' });
        }

        if (Math.abs(pedidoOrigem.valor - 6720) > 0.009 || (valorNf > 0 && Math.abs(pedidoOrigem.valor - valorNf) > 0.009)) {
          alertas.push({ codigo: 'VALOR_NF_TESTE_AUSENTE', mensagem: `Valor do pedido/NF deve ser 6720. Pedido=${pedidoOrigem.valor}; NF=${valorNf || '-'}.` });
        }
      }

      if (!numeroNf) {
        alertas.push({ codigo: 'NUMERO_NF_TESTE_AUSENTE', mensagem: 'numeroNotaFiscalTesteV27A deve ser informado.' });
      }

      if (!valorNf || valorNf <= 0) {
        alertas.push({ codigo: 'VALOR_NF_TESTE_AUSENTE', mensagem: 'valorNotaFiscalTesteV27A deve ser maior que zero.' });
      }

      if (!this.statusNotaFiscalInicialMapeadoV27A(statusNf)) {
        alertas.push({ codigo: 'STATUS_NF_INICIAL_NAO_MAPEADO', mensagem: `Status inicial da NF "${statusNf}" nao consta nas choices confirmadas da Lista 04.` });
      }

      if (!this.tipoNotaFiscalMapeadoV27A(tipoNf)) {
        alertas.push({ codigo: 'TIPO_NF_NAO_MAPEADO', mensagem: `Tipo de NF "${tipoNf}" nao consta nas choices confirmadas da Lista 04.` });
      }

      if (!this.enviadaContabilidadeMapeadoV27A(enviadaContabilidade)) {
        alertas.push({ codigo: 'ENVIADA_CONTABILIDADE_CHOICE_NAO_RESOLVIDA', mensagem: `Valor "${enviadaContabilidade}" nao consta nas choices confirmadas de Enviada para Contabilidade?.` });
      }

      if (!enviadaContabilidade) {
        alertas.push({ codigo: 'ENVIADA_CONTABILIDADE_OBRIGATORIA_AUSENTE', mensagem: 'Enviada para Contabilidade? e obrigatoria na Lista 04.' });
      }

      if (pedidoOrigem && numeroNf) {
        try {
          const nfExistente = await this.obterNotaFiscalExistenteV27A(this.obterVinculoPedidoNotaFiscalV27A(pedidoOrigem), numeroNf);
          if (nfExistente) {
            notaFiscalExistenteId = nfExistente.id;
            notaFiscalExistenteTitulo = nfExistente.title;
            alertas.push({ codigo: 'NF_TESTE_JA_EXISTENTE', mensagem: `NF existente encontrada: ${nfExistente.id} / ${nfExistente.title}.` });
          }
        } catch (error) {
          alertas.push({ codigo: 'ERRO_REST_LISTA04', mensagem: this.getErrorMessage(error) });
        }
      }

      registraraHistorico = true;
    }

    if (acaoPretendida === 'ProgramarPagamento') {
      const notaFiscalTesteId = Number(config.notaFiscalTesteIdV27A || 0);
      const numeroNfEsperado = String(config.numeroNotaFiscalTesteV27A || 'NF-V2.7A-TESTE-001').trim();
      const valorPagamento = Number(config.pagamentoValorTesteV27A || config.valorNotaFiscalTesteV27A || config.valorTesteOperacionalV27A || 0);
      const statusPagamento = config.pagamentoStatusInicialTesteV27A || LISTA_10_PAGAMENTO_STATUS_INICIAL;
      const formaPagamento = config.pagamentoFormaTesteV27A || LISTA_10_PAGAMENTO_FORMA_INICIAL;
      const contaPagamento = config.pagamentoContaTesteV27A || LISTA_10_PAGAMENTO_CONTA_INICIAL;
      const categoriaPagamento = config.pagamentoCategoriaTesteV27A || LISTA_10_PAGAMENTO_CATEGORIA_INICIAL;
      const origemPagamento = config.pagamentoOrigemTesteV27A || LISTA_10_PAGAMENTO_ORIGEM_INICIAL;
      let nfOrigem: NotaFiscalOrigemPagamentoV27A | undefined;

      pagamentoNotaFiscalId = notaFiscalTesteId > 0 ? notaFiscalTesteId : undefined;
      pagamentoNotaFiscalNumero = numeroNfEsperado;
      pagamentoTituloPrevisto = notaFiscalTesteId > 0 ? this.criarTituloPagamentoV27A(notaFiscalTesteId, config) : undefined;
      pagamentoStatusInicial = statusPagamento;
      pagamentoForma = formaPagamento;
      pagamentoConta = contaPagamento;
      pagamentoCategoria = categoriaPagamento;
      pagamentoOrigem = origemPagamento;
      diagnosticoPagamento = [
        `Lista 10 por GUID ${LISTAS_ENAC.programacaoFinanceira}.`,
        'Lista 05 permanece somente como referencia/legado nesta rodada.',
        'Informativo: VINCULO_TEXTUAL_NF_USADO; Lista 10 nao possui lookup auditado para a NF nesta rodada.',
        `Campos previstos: ${LISTA_10_PAGAMENTO_CAMPOS_PREVISTOS.join(', ')}.`
      ];

      if (!notaFiscalTesteId || notaFiscalTesteId <= 0) {
        alertas.push({ codigo: 'NF_TESTE_NAO_ENCONTRADA', mensagem: 'notaFiscalTesteIdV27A deve informar o item de NF de teste da Lista 04.' });
      } else {
        try {
          nfOrigem = await this.obterNotaFiscalOrigemPagamentoV27A(notaFiscalTesteId);
          pagamentoNotaFiscalNumero = nfOrigem.numeroNotaFiscal;
          pagamentoVinculoNf = nfOrigem.title || nfOrigem.numeroNotaFiscal;
          pagamentoFornecedorId = nfOrigem.fornecedorId;
          pagamentoFornecedorTitulo = nfOrigem.fornecedorTitulo;
          pagamentoObraId = nfOrigem.obraId;
          pagamentoValorBruto = nfOrigem.valorBruto;
          pagamentoValorLiquido = valorPagamento || nfOrigem.valorBruto;
          pagamentoVencimento = nfOrigem.dataVencimento;
          pagamentoDataProgramada = config.pagamentoDataProgramadaTesteV27A || nfOrigem.dataVencimento;
        } catch (error) {
          alertas.push({ codigo: 'ERRO_REST_LISTA04', mensagem: this.getErrorMessage(error) });
        }
      }

      if (item && this.normalizarTexto(statusAtual) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
        alertas.push({ codigo: 'REQUISICAO_STATUS_NAO_ELEGIVEL_PARA_PAGAMENTO', mensagem: 'ProgramarPagamento exige requisicao origem preservada em Aprovada para compra.' });
      }

      if (!snapshotExistenteId) {
        alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'ProgramarPagamento exige SnapshotAprovacaoCompra preservado na requisicao origem.' });
      }

      if (nfOrigem) {
        if (nfOrigem.numeroNotaFiscal !== numeroNfEsperado) {
          alertas.push({ codigo: 'NF_NUMERO_DIVERGENTE', mensagem: `NF ${notaFiscalTesteId} retornou numero ${nfOrigem.numeroNotaFiscal || '-'}; esperado ${numeroNfEsperado}.` });
        }

        if (nfOrigem.numeroPedido !== 'PED-V2.7A-TESTE-11-20260609125401') {
          alertas.push({ codigo: 'NF_PEDIDO_DIVERGENTE', mensagem: `NF ${notaFiscalTesteId} esta vinculada ao pedido ${nfOrigem.numeroPedido || '-'}; esperado PED-V2.7A-TESTE-11-20260609125401.` });
        }

        if (this.normalizarTexto(nfOrigem.statusConferencia) !== this.normalizarTexto(LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL)) {
          alertas.push({ codigo: 'NF_STATUS_NAO_ELEGIVEL_PARA_PAGAMENTO', mensagem: `Status da NF deve ser ${LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL}; atual ${nfOrigem.statusConferencia || '-'}.` });
        }

        if (this.normalizarTexto(nfOrigem.enviadaContabilidade) !== this.normalizarTexto(LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL)) {
          alertas.push({ codigo: 'NF_CONTABILIDADE_NAO_ELEGIVEL', mensagem: `Enviada para contabilidade deve permanecer ${LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL}; atual ${nfOrigem.enviadaContabilidade || '-'}.` });
        }

        if (!nfOrigem.fornecedorId) {
          alertas.push({ codigo: 'FORNECEDOR_NF_AUSENTE', mensagem: 'NF de origem nao possui Fornecedor0 preenchido.' });
        }

        if (!nfOrigem.obraId) {
          alertas.push({ codigo: 'OBRA_NF_AUSENTE', mensagem: 'NF de origem nao possui ObraId preenchido.' });
        }

        if (Math.abs(nfOrigem.valorBruto - 6720) > 0.009 || (valorPagamento > 0 && Math.abs(nfOrigem.valorBruto - valorPagamento) > 0.009)) {
          alertas.push({ codigo: 'VALOR_PAGAMENTO_DIVERGENTE', mensagem: `Valor da NF/pagamento deve ser 6720. NF=${nfOrigem.valorBruto}; pagamento=${valorPagamento || '-'}.` });
        }

        if (!nfOrigem.dataVencimento) {
          alertas.push({ codigo: 'NF_VENCIMENTO_AUSENTE', mensagem: 'NF de origem deve possuir DatadeVencimento para programar pagamento.' });
        }
      }

      if (!valorPagamento || valorPagamento <= 0) {
        alertas.push({ codigo: 'VALOR_PAGAMENTO_AUSENTE', mensagem: 'pagamentoValorTesteV27A ou valorNotaFiscalTesteV27A deve ser maior que zero.' });
      }

      if (!this.statusPagamentoInicialMapeadoV27A(statusPagamento)) {
        alertas.push({ codigo: 'STATUS_PAGAMENTO_INICIAL_NAO_MAPEADO', mensagem: `Status inicial do pagamento "${statusPagamento}" nao consta nas choices confirmadas da Lista 10.` });
      }

      if (!this.formaPagamentoMapeadaV27A(formaPagamento)) {
        alertas.push({ codigo: 'FORMA_PAGAMENTO_NAO_MAPEADA', mensagem: `Forma de pagamento "${formaPagamento}" nao consta nas choices confirmadas da Lista 10.` });
      }

      if (!this.contaPagamentoMapeadaV27A(contaPagamento)) {
        alertas.push({ codigo: 'CONTA_PAGAMENTO_NAO_MAPEADA', mensagem: `Conta de pagamento "${contaPagamento}" nao consta nas choices confirmadas da Lista 10.` });
      }

      if (!this.categoriaPagamentoMapeadaV27A(categoriaPagamento)) {
        alertas.push({ codigo: 'CATEGORIA_PAGAMENTO_NAO_MAPEADA', mensagem: `Categoria de pagamento "${categoriaPagamento}" nao consta nas choices confirmadas da Lista 10.` });
      }

      if (!this.origemPagamentoMapeadaV27A(origemPagamento)) {
        alertas.push({ codigo: 'ORIGEM_PAGAMENTO_NAO_MAPEADA', mensagem: `Origem de pagamento "${origemPagamento}" nao consta nas choices confirmadas da Lista 10.` });
      }

      if (nfOrigem?.numeroNotaFiscal) {
        try {
          const pagamentoExistente = await this.obterPagamentoExistenteV27A(nfOrigem.numeroNotaFiscal, notaFiscalTesteId);
          if (pagamentoExistente) {
            pagamentoExistenteId = pagamentoExistente.id;
            pagamentoExistenteTitulo = pagamentoExistente.title;
            alertas.push({ codigo: 'PAGAMENTO_JA_EXISTENTE', mensagem: `Pagamento existente encontrado: ${pagamentoExistente.id} / ${pagamentoExistente.title}.` });
          }
        } catch (error) {
          alertas.push({ codigo: 'ERRO_REST_LISTA10', mensagem: this.getErrorMessage(error) });
        }
      }

      registraraHistorico = true;
    }

    const podeExecutar = Boolean(alertas.length === 0 && usuarioAtual && item && marcadorEncontrado && transicaoPermitida && camposObrigatoriosPresentes);
    const listaAlterada = acaoPretendida === 'CriarPedidoCompra'
      ? `${LISTA_03_PEDIDOS_COMPRA_TITULO} (${LISTAS_ENAC.pedidosCompra})`
      : acaoPretendida === 'VincularNotaFiscal'
        ? `${LISTA_04_NOTAS_FISCAIS_TITULO} (${LISTAS_ENAC.notasFiscaisRecebidas})`
      : acaoPretendida === 'ProgramarPagamento'
        ? `${LISTA_10_PROGRAMACAO_FINANCEIRA_TITULO} (${LISTAS_ENAC.programacaoFinanceira})`
      : acaoPretendida === 'CriarSnapshotAprovacaoOperacional'
        ? 'ENAC Snapshots Regras'
        : LISTA_02_REQUISICOES_COMPRA_TITULO;
    const campoAlterado = acaoPretendida === 'AtualizarStatusRequisicao' || acaoPretendida === 'AtualizarRequisicaoCompra' || acaoPretendida === 'AprovarCompra'
      ? LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD
      : acaoPretendida === 'CriarPedidoCompra'
        ? LISTA_03_PEDIDOS_COMPRA_CAMPOS_PREVISTOS.join(', ')
        : acaoPretendida === 'VincularNotaFiscal'
          ? LISTA_04_NOTAS_FISCAIS_CAMPOS_PREVISTOS.join(', ')
        : acaoPretendida === 'ProgramarPagamento'
          ? LISTA_10_PAGAMENTO_CAMPOS_PREVISTOS.join(', ')
        : 'ENAC Snapshots Regras';
    const valorNovoPrevisto = acaoPretendida === 'AtualizarStatusRequisicao' || acaoPretendida === 'AtualizarRequisicaoCompra' || acaoPretendida === 'AprovarCompra'
      ? statusDestino
      : acaoPretendida === 'CriarPedidoCompra'
        ? `POST Lista 03: Title=${pedidoTituloPrevisto || '-'}; ${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD}=${pedidoVinculoTextual || '-'}; ObraId=${item?.ObraId || '-'}; Fornecedor0Id=${pedidoFornecedorId || '-'}; ValordoPedido=${config.valorTesteOperacionalV27A || 0}; StatusdoPedido=${pedidoStatusInicial || '-'}`
        : acaoPretendida === 'VincularNotaFiscal'
          ? `POST Lista 04: Title=${notaFiscalTituloPrevisto || '-'}; ${LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD}=${notaFiscalVinculoPedido || '-'}; ${LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD}=${notaFiscalNumeroPrevisto || '-'}; Fornecedor0Id=${notaFiscalFornecedorId || '-'}; ObraId=${notaFiscalObraId || '-'}; ValorBrutodaNF=${config.valorNotaFiscalTesteV27A || config.valorTesteOperacionalV27A || 0}; Status=${notaFiscalStatusInicial || '-'}; Contabilidade=${notaFiscalEnviadaContabilidade || '-'}`
        : acaoPretendida === 'ProgramarPagamento'
          ? `POST Lista 10: Title=${pagamentoTituloPrevisto || '-'}; ${LISTA_10_PAGAMENTO_NUMERO_NF_FIELD}=${pagamentoNotaFiscalNumero || '-'}; ${LISTA_10_PAGAMENTO_FORNECEDOR_FIELD}=${pagamentoFornecedorId || '-'}; ${LISTA_10_PAGAMENTO_OBRA_FIELD}=${pagamentoObraId || '-'}; ${LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD}=${pagamentoValorBruto || '-'}; ${LISTA_10_PAGAMENTO_VALOR_LIQUIDO_FIELD}=${pagamentoValorLiquido || '-'}; ${LISTA_10_PAGAMENTO_DATA_PROGRAMADA_FIELD}=${pagamentoDataProgramada || '-'}; ${LISTA_10_PAGAMENTO_STATUS_FIELD}=${pagamentoStatusInicial || '-'}`
        : `Snapshot V2.7A para ${config.valorTesteOperacionalV27A || 0}`;

    return {
      sucesso: podeExecutar,
      bloqueado: !podeExecutar,
      mensagem: podeExecutar
        ? 'Pre-validacao especifica do item concluida. Escrita manual pode ser exibida somente para este item e esta acao.'
        : 'Pre-validacao especifica do item bloqueada. Nenhuma escrita operacional deve ser executada.',
      flagsValidas: this.validarFlagsOperacionaisV27A(flags).length === 0,
      usuarioAtualReconhecido: Boolean(usuarioAtual),
      usuarioAtual,
      acaoPretendida,
      itemTesteId,
      itemEncontrado: Boolean(item),
      listaConsulta: `${LISTA_02_REQUISICOES_COMPRA_TITULO} (${LISTAS_ENAC.requisicoesCompra})`,
      modoAcessoLista: 'GUID',
      itemIdSolicitado: itemTesteId,
      statusHttpLeitura: leituraItem?.statusHttp,
      erroLeituraItem: leituraItem?.erro,
      camposRetornados: leituraItem?.camposRetornados,
      camposComMarcador,
      valoresCamposMarcador: item ? this.obterValoresCamposMarcadorV27A(item) : undefined,
      marcadorEncontrado,
      statusAtual,
      statusDestino,
      transicaoPermitida,
      camposObrigatoriosPresentes,
      snapshotExistenteId,
      snapshotExistenteTitulo,
      aprovacaoNecessariaCampo,
      aprovacaoNecessariaValorBruto,
      aprovacaoNecessariaNormalizada,
      valorAnalisado: config.valorTesteOperacionalV27A,
      regraInternaId,
      resumoRegraAplicada,
      aprovadorBaseNome,
      aprovadorEfetivoNome,
      aprovadorPrevistoNome,
      aprovadorEfetivoOperacionalNome,
      tipoAprovacaoCompra,
      diagnosticoAprovacaoCompra,
      justificativaAprovacaoPrevista,
      diagnosticoPedidoCompra,
      pedidoTituloPrevisto,
      pedidoVinculoTextual,
      pedidoFornecedorId,
      pedidoFornecedorTitulo,
      pedidoFornecedorLookup,
      pedidoStatusInicial,
      pedidoExistenteId,
      pedidoExistenteTitulo,
      diagnosticoNotaFiscal,
      notaFiscalTituloPrevisto,
      notaFiscalNumeroPrevisto,
      notaFiscalPedidoId,
      notaFiscalPedidoTitulo,
      notaFiscalVinculoPedido,
      notaFiscalFornecedorId,
      notaFiscalFornecedorTitulo,
      notaFiscalObraId,
      notaFiscalStatusInicial,
      notaFiscalTipo,
      notaFiscalEnviadaContabilidade,
      notaFiscalExistenteId,
      notaFiscalExistenteTitulo,
      diagnosticoPagamento,
      pagamentoTituloPrevisto,
      pagamentoNotaFiscalId,
      pagamentoNotaFiscalNumero,
      pagamentoVinculoNf,
      pagamentoFornecedorId,
      pagamentoFornecedorTitulo,
      pagamentoObraId,
      pagamentoValorBruto,
      pagamentoValorLiquido,
      pagamentoVencimento,
      pagamentoDataProgramada,
      pagamentoStatusInicial,
      pagamentoForma,
      pagamentoConta,
      pagamentoCategoria,
      pagamentoOrigem,
      pagamentoExistenteId,
      pagamentoExistenteTitulo,
      snapshotPrevistoTitulo,
      criaraSnapshot,
      vincularaSnapshotAprovacaoCompra,
      registraraHistorico,
      historicoPrevisto: item ? `${flags.marcadorTesteOperacionalV27A} ${acaoPretendida} ${itemTesteId}` : undefined,
      listaAlterada,
      campoAlterado,
      valorAnteriorPrevisto: statusAtual,
      valorNovoPrevisto,
      podeExecutar,
      acoesPermitidas,
      alertas
    };
  }

  public async criarRequisicaoCompraControlada(payload: RequisicaoCompraControladaPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const alertas = this.validarPermissaoAcao('CriarRequisicaoCompra', { title: payload.titulo }, usuario, flags);
    alertas.push(...this.validarPayloadRequisicao(payload));

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('CriarRequisicaoCompra', 'Criacao de requisicao bloqueada.', alertas);
    }

    const body = {
      Title: payload.titulo,
      ObraId: payload.obraItemId,
      TipodaSolicita_x00e7__x00e3_o: payload.tipoSolicitacao,
      Descri_x00e7__x00e3_odaSolicita_: payload.descricao,
      Prioridade: payload.prioridade,
      DataNecess_x00e1_rianaObra: payload.dataNecessaria,
      DatadaSolicita_x00e7__x00e3_o: new Date().toISOString(),
      StatusdaRequisi_x00e7__x00e3_o: 'Aguardando cotacao',
      SolicitanteId: usuario.contaMicrosoft365Id || undefined
    };
    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );
    const item = await this.ensureJson(response);
    const itemId = Number(item.Id || item.ID);
    await this.registrarHistoricoOperacional({
      origemLista: 'Lista 02',
      origemItemId: itemId,
      acao: 'CriarRequisicaoCompra',
      descricao: 'Requisicao de compra V2.7A-TESTE criada pela webpart.',
      statusNovo: 'Aguardando cotacao',
      marcadorTeste: payload.marcadorTeste
    }, emailOuLogin, flags);

    return {
      sucesso: true,
      bloqueado: false,
      acao: 'CriarRequisicaoCompra',
      mensagem: 'Requisicao de compra V2.7A-TESTE criada.',
      itemId,
      statusNovo: 'Aguardando cotacao',
      alertas: []
    };
  }

  public async atualizarRequisicaoCompraControlada(id: number, payload: AtualizacaoRequisicaoCompraControladaPayload, acao: AcaoOperacionalV27A, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const item = await this.obterResumoItemOperacional(LISTAS_ENAC.requisicoesCompra, id, 'StatusdaRequisi_x00e7__x00e3_o');
    const alertas = this.validarPermissaoAcao(acao, item, usuario, flags);

    if (payload.marcadorTeste !== flags.marcadorTesteOperacionalV27A) {
      alertas.push({ codigo: 'MARCADOR_PAYLOAD_INVALIDO', mensagem: 'Payload deve usar marcador V2.7A-TESTE.' });
    }

    if (!payload.statusNovo) {
      alertas.push({ codigo: 'STATUS_NOVO_OBRIGATORIO', mensagem: 'statusNovo deve ser informado.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado(acao, 'Atualizacao de requisicao bloqueada.', alertas, id, item.status);
    }

    const response = await this.spHttpClient.post(
      `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${id})`,
      SPHttpClient.configurations.v1,
      this.criarMergeOptions({ StatusdaRequisi_x00e7__x00e3_o: payload.statusNovo })
    );

    if (!response.ok) {
      throw new Error(`SharePoint retornou ${response.status}: ${response.statusText}`);
    }

    await this.registrarHistoricoOperacional({
      origemLista: 'Lista 02',
      origemItemId: id,
      acao,
      descricao: payload.observacao || `Status alterado por ${acao}.`,
      statusAnterior: item.status,
      statusNovo: payload.statusNovo,
      marcadorTeste: payload.marcadorTeste
    }, emailOuLogin, flags);

    return {
      sucesso: true,
      bloqueado: false,
      acao,
      mensagem: 'Requisicao atualizada com controle V2.7A.',
      itemId: id,
      statusAnterior: item.status,
      statusNovo: payload.statusNovo,
      alertas: []
    };
  }

  public async executarAtualizacaoStatusRequisicaoV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const itemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const statusDestino = config.statusDestinoTesteOperacionalV27A || 'Aguardando aprovação';
    const observacao = config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - teste operacional restrito';
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, config);
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.itemTesteId !== itemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Item validado ${preValidacao.itemTesteId || '-'} difere do item configurado ${itemId || '-'}.` });
    }

    if (preValidacao.acaoPretendida !== 'AtualizarStatusRequisicao') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Nesta rodada somente AtualizarStatusRequisicao esta autorizada.' });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado no item.' });
    }

    if (this.normalizarTexto(preValidacao.statusAtual) !== 'recebida' && this.normalizarTexto(preValidacao.statusAtual) !== 'aberta') {
      alertas.push({ codigo: 'EXECUCAO_STATUS_ORIGEM_INVALIDO', mensagem: `Status origem invalido para o primeiro teste: ${preValidacao.statusAtual || '-'}.` });
    }

    if (this.normalizarTexto(preValidacao.statusDestino) !== 'aguardandoaprovacao') {
      alertas.push({ codigo: 'EXECUCAO_STATUS_DESTINO_INVALIDO', mensagem: `Status destino invalido: ${preValidacao.statusDestino || '-'}.` });
    }

    if (preValidacao.campoAlterado !== LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD) {
      alertas.push({ codigo: 'EXECUCAO_CAMPO_STATUS_INVALIDO', mensagem: `Campo validado invalido: ${preValidacao.campoAlterado || '-'}.` });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'AtualizarStatusRequisicao')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para AtualizarStatusRequisicao.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado(
        'AtualizarStatusRequisicao',
        `Atualizacao de status bloqueada: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`,
        alertas,
        itemId,
        preValidacao.statusAtual
      );
    }

    const response = await this.spHttpClient.post(
      `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${itemId})`,
      SPHttpClient.configurations.v1,
      this.criarMergeOptions({ [LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD]: statusDestino })
    );

    if (!response.ok) {
      return this.criarResultadoOperacionalBloqueado('AtualizarStatusRequisicao', `MERGE de status retornou ${response.status}: ${response.statusText}.`, [
        { codigo: 'ERRO_MERGE_STATUS_REQUISICAO', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }
      ], itemId, preValidacao.statusAtual);
    }

    try {
      const historico = await this.registrarHistoricoOperacional({
        origemLista: 'Lista 02',
        origemItemId: itemId,
        acao: 'AtualizarStatusRequisicao',
        descricao: `${observacao}; origem Webpart V2.7A.2C; sem Power Automate.`,
        statusAnterior: preValidacao.statusAtual,
        statusNovo: statusDestino,
        marcadorTeste: flags.marcadorTesteOperacionalV27A
      }, emailOuLogin, flags);

      return {
        sucesso: true,
        bloqueado: false,
        acao: 'AtualizarStatusRequisicao',
        mensagem: 'Status da requisicao atualizado com controle V2.7A.2C e historico registrado.',
        itemId,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: preValidacao.statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: historico.sucesso,
        historicoItemId: historico.itemId,
        statusHttpEscrita: response.status,
        alertas: historico.alertas
      };
    } catch (error) {
      return {
        sucesso: true,
        bloqueado: false,
        acao: 'AtualizarStatusRequisicao',
        mensagem: 'Status da requisicao atualizado, mas o historico operacional falhou e exige auditoria manual.',
        itemId,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: preValidacao.statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: false,
        statusHttpEscrita: response.status,
        alertas: [{ codigo: 'HISTORICO_OPERACIONAL_FALHOU', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async executarCriarSnapshotAprovacaoOperacionalV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const itemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const valorAnalisado = Number(config.valorTesteOperacionalV27A || 0);
    const observacao = config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - teste operacional restrito';
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, config);
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.itemTesteId !== itemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Item validado ${preValidacao.itemTesteId || '-'} difere do item configurado ${itemId || '-'}.` });
    }

    if (preValidacao.acaoPretendida !== 'CriarSnapshotAprovacaoOperacional') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Esta rodada permite somente CriarSnapshotAprovacaoOperacional.' });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado no item.' });
    }

    if (this.normalizarTexto(preValidacao.statusAtual) !== 'aguardandoaprovacao') {
      alertas.push({ codigo: 'EXECUCAO_STATUS_ORIGEM_INVALIDO', mensagem: `Status origem invalido para snapshot: ${preValidacao.statusAtual || '-'}.` });
    }

    if (preValidacao.snapshotExistenteId) {
      alertas.push({ codigo: 'EXECUCAO_SNAPSHOT_JA_EXISTENTE', mensagem: `Item ja possui SnapshotAprovacaoCompra=${preValidacao.snapshotExistenteId}.` });
    }

    if (!valorAnalisado || valorAnalisado <= 0) {
      alertas.push({ codigo: 'EXECUCAO_VALOR_TESTE_AUSENTE', mensagem: 'Valor de teste deve ser maior que zero.' });
    }

    if (!preValidacao.regraInternaId) {
      alertas.push({ codigo: 'EXECUCAO_REGRA_ALCADA_NAO_RESOLVIDA', mensagem: 'Regra de alcada nao foi resolvida na pre-validacao.' });
    }

    if (!preValidacao.aprovadorBaseNome || !preValidacao.aprovadorEfetivoNome) {
      alertas.push({ codigo: 'EXECUCAO_APROVADOR_NAO_RESOLVIDO', mensagem: 'Aprovador base/efetivo nao foi resolvido na pre-validacao.' });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'CriarSnapshotAprovacaoOperacional')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para CriarSnapshotAprovacaoOperacional.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado(
        'CriarSnapshotAprovacaoOperacional',
        `Criacao de snapshot operacional bloqueada: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`,
        alertas,
        itemId,
        preValidacao.statusAtual
      );
    }

    const leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(itemId);
    const item = leituraItem.item;
    const statusAtual = String(item?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = item ? this.obterCamposComMarcadorV27A(item, flags.marcadorTesteOperacionalV27A) : [];

    if (!item || camposComMarcador.length === 0 || this.normalizarTexto(statusAtual) !== 'aguardandoaprovacao' || leituraItem.snapshotExistenteId) {
      return this.criarResultadoOperacionalBloqueado('CriarSnapshotAprovacaoOperacional', 'Revalidacao imediata do item bloqueou a criacao do snapshot.', [
        { codigo: 'EXECUCAO_REVALIDACAO_ITEM_FALHOU', mensagem: leituraItem.erro || `Status=${statusAtual || '-'}; snapshot=${leituraItem.snapshotExistenteId || '-'}.` }
      ], itemId, statusAtual);
    }

    const usuarios = await this.listarUsuariosPerfis({ somenteAtivos: true });
    const alcadas = await this.listarAlcadas();
    const regra = this.selecionarRegraAlcadaCompra(alcadas, {
      tipoSolicitacao: this.mapTipoSolicitacao(String(item.TipodaSolicita_x00e7__x00e3_o || '')),
      obraId: item.ObraId ? String(item.ObraId) : undefined,
      valor: valorAnalisado,
      dataReferencia: new Date()
    });
    const aprovadorBase = this.encontrarUsuarioPorLookup(regra.aprovadorPrincipalId, regra.aprovadorPrincipalNome, usuarios);

    if (!aprovadorBase) {
      return this.criarResultadoOperacionalBloqueado('CriarSnapshotAprovacaoOperacional', 'Aprovador base da alcada nao localizado entre usuarios ativos.', [
        { codigo: 'APROVADOR_NAO_RESOLVIDO', mensagem: regra.regraInternaId }
      ], itemId, statusAtual);
    }

    const resolucao = this.resolverAprovadorEfetivo(aprovadorBase, usuarios, new Date());
    const snapshot = this.criarSnapshotAprovacaoCompra(regra, resolucao, valorAnalisado, flags.marcadorTesteOperacionalV27A);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const snapshotTitle = `SNAP-V2.7A-TESTE-${itemId}-${timestamp}`;
    const snapshotResponse = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.snapshotsRegras),
      SPHttpClient.configurations.v1,
      this.criarPostOptions({
        Title: snapshotTitle,
        SolicitacaoId: itemId,
        RegraAlcadaUtilizadaId: Number(regra.id),
        RegraInternaId: regra.regraInternaId,
        ResumoRegraAplicada: `${flags.marcadorTesteOperacionalV27A}; ${regra.processo}; ${snapshot.faixaValorVigente}; aprovador ${snapshot.aprovadorBaseNome}`,
        Processo: 'Compra',
        FaixaValorVigente: snapshot.faixaValorVigente,
        ValorAnalisado: snapshot.valorAnalisado,
        AprovadorBaseId: snapshot.aprovadorBaseId,
        AprovadorBaseNome: snapshot.aprovadorBaseNome,
        AprovadorBaseEmail: '',
        AprovadorEfetivoId: snapshot.aprovadorEfetivoId,
        AprovadorEfetivoNome: snapshot.aprovadorEfetivoNome,
        AprovadorEfetivoEmail: '',
        SubstituicaoAplicada: snapshot.substituicaoAplicada,
        MotivoResolucaoAprovador: snapshot.motivoResolucaoAprovador,
        MotivoExcecao: snapshot.motivoExcecao || flags.marcadorTesteOperacionalV27A,
        DataHoraAplicacao: snapshot.dataHoraAplicacao
      })
    );

    if (!snapshotResponse.ok) {
      return this.criarResultadoOperacionalBloqueado('CriarSnapshotAprovacaoOperacional', `POST do snapshot retornou ${snapshotResponse.status}: ${snapshotResponse.statusText}.`, [
        { codigo: 'ERRO_REST_SNAPSHOTS', mensagem: `SharePoint retornou ${snapshotResponse.status}: ${snapshotResponse.statusText}` }
      ], itemId, statusAtual);
    }

    const snapshotPayload = await snapshotResponse.json();
    const snapshotId = Number(snapshotPayload.Id || snapshotPayload.ID);
    const vinculoResponse = await this.spHttpClient.post(
      `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${itemId})`,
      SPHttpClient.configurations.v1,
      this.criarMergeOptions({ SnapshotAprovacaoCompraId: snapshotId })
    );

    if (!vinculoResponse.ok) {
      return this.criarResultadoOperacionalBloqueado('CriarSnapshotAprovacaoOperacional', `Snapshot criado, mas MERGE do vinculo retornou ${vinculoResponse.status}: ${vinculoResponse.statusText}.`, [
        { codigo: 'ERRO_MERGE_SNAPSHOT_APROVACAO_COMPRA', mensagem: `Snapshot ${snapshotId} exige auditoria manual antes de nova tentativa.` }
      ], itemId, statusAtual);
    }

    try {
      const historico = await this.registrarHistoricoOperacional({
        origemLista: 'Lista 02',
        origemItemId: itemId,
        acao: 'CriarSnapshotAprovacaoOperacional',
        descricao: `${observacao}; snapshot ${snapshotId}; regra ${regra.regraInternaId}; origem Webpart V2.7A.3; sem Power Automate.`,
        statusAnterior: statusAtual,
        statusNovo: statusAtual,
        marcadorTeste: flags.marcadorTesteOperacionalV27A
      }, emailOuLogin, flags);

      return {
        sucesso: true,
        bloqueado: false,
        acao: 'CriarSnapshotAprovacaoOperacional',
        mensagem: 'Snapshot operacional criado, vinculado ao item de teste e historico registrado com controle V2.7A.3.',
        itemId,
        snapshotItemId: snapshotId,
        snapshotTitle,
        campoAlterado: 'SnapshotAprovacaoCompra',
        statusAnterior: statusAtual,
        statusNovo: statusAtual,
        historicoRegistrado: historico.sucesso,
        historicoItemId: historico.itemId,
        statusHttpEscrita: vinculoResponse.status,
        alertas: historico.alertas
      };
    } catch (error) {
      return {
        sucesso: true,
        bloqueado: false,
        acao: 'CriarSnapshotAprovacaoOperacional',
        mensagem: 'Snapshot operacional criado e vinculado, mas o historico operacional falhou e exige auditoria manual.',
        itemId,
        snapshotItemId: snapshotId,
        snapshotTitle,
        campoAlterado: 'SnapshotAprovacaoCompra',
        statusAnterior: statusAtual,
        statusNovo: statusAtual,
        historicoRegistrado: false,
        statusHttpEscrita: vinculoResponse.status,
        alertas: [{ codigo: 'HISTORICO_OPERACIONAL_FALHOU', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async executarAprovarCompraV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const itemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const statusDestino = config.statusDestinoTesteOperacionalV27A || STATUS_APROVADO_COMPRA_V27A;
    const observacao = config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - aprovação controlada para teste de pedido';
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, {
      ...config,
      statusDestinoTesteOperacionalV27A: statusDestino
    });
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.itemTesteId !== itemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Item validado ${preValidacao.itemTesteId || '-'} difere do item configurado ${itemId || '-'}.` });
    }

    if (preValidacao.acaoPretendida !== 'AprovarCompra') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Esta rodada permite somente AprovarCompra.' });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado no item.' });
    }

    if (this.normalizarTexto(preValidacao.statusAtual) === this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
      alertas.push({ codigo: 'VALIDACAO_EXISTENTE', mensagem: 'Item ja esta aprovado para compra. Nenhuma nova escrita deve ser executada.' });
    }

    if (this.normalizarTexto(preValidacao.statusAtual) !== 'aguardandoaprovacao') {
      alertas.push({ codigo: 'EXECUCAO_STATUS_ORIGEM_INVALIDO', mensagem: `Status origem invalido para aprovacao: ${preValidacao.statusAtual || '-'}.` });
    }

    if (this.normalizarTexto(preValidacao.statusDestino) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
      alertas.push({ codigo: 'EXECUCAO_STATUS_DESTINO_INVALIDO', mensagem: `Status destino invalido para aprovacao: ${preValidacao.statusDestino || '-'}.` });
    }

    if (preValidacao.campoAlterado !== LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD) {
      alertas.push({ codigo: 'EXECUCAO_CAMPO_STATUS_INVALIDO', mensagem: `Campo validado invalido: ${preValidacao.campoAlterado || '-'}.` });
    }

    if (!preValidacao.snapshotExistenteId) {
      alertas.push({ codigo: 'EXECUCAO_SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'SnapshotAprovacaoCompra deve estar preenchido antes da aprovacao.' });
    }

    if (!preValidacao.regraInternaId) {
      alertas.push({ codigo: 'EXECUCAO_REGRA_ALCADA_NAO_RESOLVIDA', mensagem: 'Regra de alcada nao foi resolvida pelo snapshot.' });
    }

    if (!preValidacao.aprovadorBaseNome || !preValidacao.aprovadorEfetivoNome) {
      alertas.push({ codigo: 'EXECUCAO_APROVADOR_NAO_RESOLVIDO', mensagem: 'Aprovador base/efetivo nao foi resolvido pelo snapshot.' });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'AprovarCompra')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para AprovarCompra.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado(
        'AprovarCompra',
        `Aprovacao de compra bloqueada: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`,
        alertas,
        itemId,
        preValidacao.statusAtual
      );
    }

    const leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(itemId);
    const item = leituraItem.item;
    const statusAtual = String(item?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = item ? this.obterCamposComMarcadorV27A(item, flags.marcadorTesteOperacionalV27A) : [];
    const snapshotAntesId = leituraItem.snapshotExistenteId;
    const snapshotAntesTitulo = leituraItem.snapshotExistenteTitulo;

    if (!item || camposComMarcador.length === 0 || this.normalizarTexto(statusAtual) !== 'aguardandoaprovacao' || !snapshotAntesId) {
      return this.criarResultadoOperacionalBloqueado('AprovarCompra', 'Revalidacao imediata do item bloqueou a aprovacao.', [
        { codigo: 'EXECUCAO_REVALIDACAO_ITEM_FALHOU', mensagem: leituraItem.erro || `Status=${statusAtual || '-'}; snapshot=${snapshotAntesId || '-'}.` }
      ], itemId, statusAtual);
    }

    const response = await this.spHttpClient.post(
      `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${itemId})`,
      SPHttpClient.configurations.v1,
      this.criarMergeOptions({ [LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD]: statusDestino })
    );

    if (!response.ok) {
      return this.criarResultadoOperacionalBloqueado('AprovarCompra', `MERGE de aprovacao retornou ${response.status}: ${response.statusText}.`, [
        { codigo: 'ERRO_MERGE_APROVACAO_COMPRA', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }
      ], itemId, statusAtual);
    }

    const leituraPosMerge = await this.obterRequisicaoOperacionalParaPreValidacao(itemId);
    const snapshotDepoisId = leituraPosMerge.snapshotExistenteId;
    const snapshotDepoisTitulo = leituraPosMerge.snapshotExistenteTitulo;
    const snapshotPreservado = Boolean(snapshotAntesId && snapshotDepoisId === snapshotAntesId);

    if (leituraPosMerge.erro) {
      return {
        sucesso: false,
        bloqueado: true,
        acao: 'AprovarCompra',
        mensagem: 'Aprovacao executada no status, mas a confirmacao posterior do SnapshotAprovacaoCompra falhou. Auditoria manual obrigatoria antes de seguir.',
        itemId,
        snapshotItemId: snapshotAntesId,
        snapshotTitle: snapshotAntesTitulo,
        snapshotAntesId,
        snapshotAntesTitulo,
        snapshotDepoisId,
        snapshotDepoisTitulo,
        snapshotPreservado: false,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: false,
        statusHttpEscrita: response.status,
        alertas: [{ codigo: 'SNAPSHOT_NAO_CONFIRMADO_APOS_APROVACAO', mensagem: leituraPosMerge.erro }]
      };
    }

    if (!snapshotPreservado) {
      return {
        sucesso: false,
        bloqueado: true,
        acao: 'AprovarCompra',
        mensagem: 'Aprovacao executada no status, mas SnapshotAprovacaoCompra nao foi preservado apos o MERGE. Auditoria manual obrigatoria antes de seguir.',
        itemId,
        snapshotItemId: snapshotAntesId,
        snapshotTitle: snapshotAntesTitulo,
        snapshotAntesId,
        snapshotAntesTitulo,
        snapshotDepoisId,
        snapshotDepoisTitulo,
        snapshotPreservado: false,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: false,
        statusHttpEscrita: response.status,
        alertas: [{ codigo: 'SNAPSHOT_PERDIDO_APOS_APROVACAO', mensagem: `Snapshot antes=${snapshotAntesId || '-'}; depois=${snapshotDepoisId || '-'}. Historico operacional nao registrado nesta execucao.` }]
      };
    }

    try {
      const historico = await this.registrarHistoricoOperacional({
        origemLista: 'Lista 02',
        origemItemId: itemId,
        acao: 'AprovarCompra',
        descricao: `${observacao}; snapshot ${snapshotAntesId}; snapshot preservado apos MERGE; regra ${preValidacao.regraInternaId || '-'}; aprovador previsto ${preValidacao.aprovadorPrevistoNome || preValidacao.aprovadorEfetivoNome || '-'}; aprovador efetivo ${preValidacao.aprovadorEfetivoOperacionalNome || preValidacao.aprovadorEfetivoNome || '-'}; tipo ${preValidacao.tipoAprovacaoCompra || 'Aprovador direto'}; ${preValidacao.justificativaAprovacaoPrevista || 'Aprovacao pelo aprovador previsto.'}; origem Webpart V2.7A.4B/V2.7A.4D; sem Power Automate.`,
        statusAnterior: statusAtual,
        statusNovo: statusDestino,
        marcadorTeste: flags.marcadorTesteOperacionalV27A
      }, emailOuLogin, flags);

      return {
        sucesso: true,
        bloqueado: false,
        acao: 'AprovarCompra',
        mensagem: 'Compra aprovada com controle V2.7A.4B, snapshot preservado e historico registrado.',
        itemId,
        snapshotItemId: snapshotDepoisId,
        snapshotTitle: snapshotDepoisTitulo,
        snapshotAntesId,
        snapshotAntesTitulo,
        snapshotDepoisId,
        snapshotDepoisTitulo,
        snapshotPreservado,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: historico.sucesso,
        historicoItemId: historico.itemId,
        statusHttpEscrita: response.status,
        alertas: historico.alertas
      };
    } catch (error) {
      return {
        sucesso: true,
        bloqueado: false,
        acao: 'AprovarCompra',
        mensagem: 'Compra aprovada, mas o historico operacional falhou e exige auditoria manual.',
        itemId,
        snapshotItemId: snapshotDepoisId,
        snapshotTitle: snapshotDepoisTitulo,
        snapshotAntesId,
        snapshotAntesTitulo,
        snapshotDepoisId,
        snapshotDepoisTitulo,
        snapshotPreservado,
        campoAlterado: LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD,
        statusAnterior: statusAtual,
        statusNovo: statusDestino,
        historicoRegistrado: false,
        statusHttpEscrita: response.status,
        alertas: [{ codigo: 'HISTORICO_OPERACIONAL_FALHOU', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async criarPedidoCompraControlado(payload: PedidoCompraControladoPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    void payload;
    void emailOuLogin;
    void flags;
    return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Metodo legado bloqueado. Use executarCriarPedidoCompraV27A com schema real da Lista 03.', [
      { codigo: 'METODO_LEGADO_PEDIDO_BLOQUEADO', mensagem: 'A Lista 03 nao possui lookup forte de solicitacao nesta rodada; o fluxo V2.7A.5B usa vinculo textual temporario e Fornecedor0Id.' }
    ]);
  }

  public async executarCriarPedidoCompraV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const itemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const valorPedido = Number(config.valorTesteOperacionalV27A || 0);
    const fornecedorId = Number(config.fornecedorTesteIdV27A || 0);
    const statusPedido = config.statusPedidoInicialTesteV27A || LISTA_03_PEDIDOS_COMPRA_STATUS_INICIAL;
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, config);
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.itemTesteId !== itemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Item validado ${preValidacao.itemTesteId || '-'} difere do item configurado ${itemId || '-'}.` });
    }

    if (preValidacao.acaoPretendida !== 'CriarPedidoCompra') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Esta rotina permite somente CriarPedidoCompra.' });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado no item.' });
    }

    if (this.normalizarTexto(preValidacao.statusAtual) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A)) {
      alertas.push({ codigo: 'EXECUCAO_STATUS_ORIGEM_INVALIDO', mensagem: `Status origem invalido para pedido: ${preValidacao.statusAtual || '-'}.` });
    }

    if (!preValidacao.snapshotExistenteId) {
      alertas.push({ codigo: 'SNAPSHOT_OBRIGATORIO_AUSENTE', mensagem: 'CriarPedidoCompra exige SnapshotAprovacaoCompra vinculado.' });
    }

    if (!valorPedido || valorPedido <= 0) {
      alertas.push({ codigo: 'EXECUCAO_VALOR_TESTE_AUSENTE', mensagem: 'Valor de teste deve ser maior que zero.' });
    }

    if (!fornecedorId || fornecedorId <= 0) {
      alertas.push({ codigo: 'FORNECEDOR_TESTE_NAO_INFORMADO', mensagem: 'fornecedorTesteIdV27A deve ser informado.' });
    }

    if (!this.statusPedidoInicialMapeadoV27A(statusPedido)) {
      alertas.push({ codigo: 'STATUS_PEDIDO_INICIAL_NAO_MAPEADO', mensagem: `StatusdoPedido inicial "${statusPedido}" nao consta nas choices confirmadas.` });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'CriarPedidoCompra')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para CriarPedidoCompra.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado(
        'CriarPedidoCompra',
        `Criacao de pedido bloqueada: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`,
        alertas,
        itemId,
        preValidacao.statusAtual
      );
    }

    const leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(itemId);
    const item = leituraItem.item;
    const statusAtual = String(item?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = item ? this.obterCamposComMarcadorV27A(item, flags.marcadorTesteOperacionalV27A) : [];
    const numeroRequisicao = item ? this.obterNumeroRequisicaoPedidoV27A(item, itemId) : '';

    if (!item || camposComMarcador.length === 0 || this.normalizarTexto(statusAtual) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A) || !leituraItem.snapshotExistenteId || !item.ObraId || !numeroRequisicao) {
      return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Revalidacao imediata da requisicao bloqueou a criacao do pedido.', [
        { codigo: 'EXECUCAO_REVALIDACAO_ITEM_FALHOU', mensagem: leituraItem.erro || `Status=${statusAtual || '-'}; snapshot=${leituraItem.snapshotExistenteId || '-'}; ObraId=${item?.ObraId || '-'}.` }
      ], itemId, statusAtual);
    }

    try {
      await this.obterFornecedorTestePedidoV27A(fornecedorId);
    } catch (error) {
      return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Revalidacao do fornecedor falhou.', [
        { codigo: 'ERRO_REST_FORNECEDORES', mensagem: this.getErrorMessage(error) }
      ], itemId, statusAtual);
    }

    try {
      const pedidoExistente = await this.obterPedidoExistenteV27A(numeroRequisicao, itemId);
      if (pedidoExistente) {
        return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Pedido ja existente para a requisicao de teste.', [
          { codigo: 'PEDIDO_JA_EXISTENTE', mensagem: `${pedidoExistente.id} / ${pedidoExistente.title}` }
        ], itemId, statusAtual);
      }
    } catch (error) {
      return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Revalidacao de pedido existente falhou.', [
        { codigo: 'ERRO_REST_LISTA03', mensagem: this.getErrorMessage(error) }
      ], itemId, statusAtual);
    }

    const now = new Date();
    const tituloPedido = this.criarTituloPedidoV27A(itemId, config, now);
    const descricaoPedido = config.descricaoPedidoTesteV27A || `V2.7A-TESTE - pedido de compra controlado a partir da requisicao ${itemId}`;
    const body: Record<string, unknown> = {
      Title: tituloPedido,
      [LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD]: numeroRequisicao,
      ObraId: Number(item.ObraId),
      [LISTA_03_PEDIDOS_COMPRA_FORNECEDOR_FIELD]: fornecedorId,
      ValordoPedido: valorPedido,
      DatadoPedido: now.toISOString(),
      StatusdoPedido: statusPedido,
      CentrodeCusto: item.CentrodeCusto || '',
      [LISTA_03_PEDIDOS_COMPRA_DESCRICAO_FIELD]: descricaoPedido
    };

    if (config.condicaoPagamentoTesteV27A) {
      body[LISTA_03_PEDIDOS_COMPRA_CONDICAO_PAGAMENTO_FIELD] = config.condicaoPagamentoTesteV27A;
    }

    if (config.prazoEntregaTesteV27A) {
      body.PrazodeEntrega = config.prazoEntregaTesteV27A;
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.pedidosCompra),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );

    if (!response.ok) {
      return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', `POST de pedido retornou ${response.status}: ${response.statusText}.`, [
        { codigo: 'ERRO_POST_PEDIDO_COMPRA', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }
      ], itemId, statusAtual);
    }

    const pedido = await this.ensureJson(response);
    const pedidoId = Number(pedido.Id || pedido.ID);
    const historico = await this.registrarHistoricoOperacional({
      origemLista: 'Lista 02',
      origemItemId: itemId,
      acao: 'CriarPedidoCompra',
      descricao: `${config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - criacao controlada de pedido de compra'}; pedido ${pedidoId}/${tituloPedido}; vinculo ${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD}=${numeroRequisicao}; vinculo textual temporario por ausencia de SolicitacaoId; fornecedor ${fornecedorId}; valor ${valorPedido}; status inicial ${statusPedido}; origem Webpart V2.7A.5B; sem Power Automate.`,
      statusAnterior: statusAtual,
      statusNovo: statusAtual,
      marcadorTeste: flags.marcadorTesteOperacionalV27A
    }, emailOuLogin, flags);

    return {
      sucesso: true,
      bloqueado: false,
      acao: 'CriarPedidoCompra',
      mensagem: 'Pedido de compra criado na Lista 03 com controle V2.7A.5B e historico registrado.',
      itemId: pedidoId,
      campoAlterado: LISTA_03_PEDIDOS_COMPRA_CAMPOS_PREVISTOS.join(', '),
      statusAnterior: statusAtual,
      statusNovo: statusAtual,
      historicoRegistrado: historico.sucesso,
      historicoItemId: historico.itemId,
      statusHttpEscrita: response.status,
      alertas: historico.alertas
    };
  }

  public async vincularNotaFiscalControlada(id: number, payload: NotaFiscalControladaPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    void id;
    void payload;
    void emailOuLogin;
    void flags;
    return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', 'Metodo legado bloqueado. Use executarVincularNotaFiscalV27A com schema real da Lista 04.', [
      { codigo: 'METODO_LEGADO_NF_BLOQUEADO', mensagem: 'A Lista 04 exige Fornecedor0Id, ObraId e EnviadaparaContabilidade_x003f_; o fluxo V2.7A.6B usa schema auditado.' }
    ]);
  }

  public async executarVincularNotaFiscalV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const requisicaoItemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const pedidoId = Number(config.pedidoTesteIdV27A || 0);
    const numeroNf = String(config.numeroNotaFiscalTesteV27A || '').trim();
    const valorNf = Number(config.valorNotaFiscalTesteV27A || config.valorTesteOperacionalV27A || 0);
    const tipoNf = config.tipoNotaFiscalTesteV27A || LISTA_04_NOTAS_FISCAIS_TIPO_INICIAL;
    const statusNf = config.statusNotaFiscalInicialTesteV27A || LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL;
    const enviadaContabilidade = config.enviadaContabilidadeTesteV27A || LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL;
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, config);
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.acaoPretendida !== 'VincularNotaFiscal') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Esta rotina permite somente VincularNotaFiscal.' });
    }

    if (preValidacao.itemTesteId !== requisicaoItemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Requisicao validada ${preValidacao.itemTesteId || '-'} difere da configurada ${requisicaoItemId || '-'}.` });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado na requisicao origem.' });
    }

    if (!pedidoId || pedidoId <= 0) {
      alertas.push({ codigo: 'PEDIDO_TESTE_NAO_ENCONTRADO', mensagem: 'pedidoTesteIdV27A deve ser informado.' });
    }

    if (!numeroNf) {
      alertas.push({ codigo: 'NUMERO_NF_TESTE_AUSENTE', mensagem: 'numeroNotaFiscalTesteV27A deve ser informado.' });
    }

    if (!valorNf || valorNf <= 0) {
      alertas.push({ codigo: 'VALOR_NF_TESTE_AUSENTE', mensagem: 'valorNotaFiscalTesteV27A deve ser maior que zero.' });
    }

    if (!this.statusNotaFiscalInicialMapeadoV27A(statusNf)) {
      alertas.push({ codigo: 'STATUS_NF_INICIAL_NAO_MAPEADO', mensagem: `Status inicial da NF invalido: ${statusNf}.` });
    }

    if (!this.tipoNotaFiscalMapeadoV27A(tipoNf)) {
      alertas.push({ codigo: 'TIPO_NF_NAO_MAPEADO', mensagem: `Tipo de NF invalido: ${tipoNf}.` });
    }

    if (!this.enviadaContabilidadeMapeadoV27A(enviadaContabilidade)) {
      alertas.push({ codigo: 'ENVIADA_CONTABILIDADE_CHOICE_NAO_RESOLVIDA', mensagem: `Valor invalido para Enviada para Contabilidade?: ${enviadaContabilidade}.` });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'VincularNotaFiscal')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para VincularNotaFiscal.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', `Vinculo de NF bloqueado: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`, alertas, pedidoId);
    }

    const leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(requisicaoItemId);
    const requisicao = leituraItem.item;
    const statusRequisicao = String(requisicao?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = requisicao ? this.obterCamposComMarcadorV27A(requisicao, flags.marcadorTesteOperacionalV27A) : [];

    if (!requisicao || camposComMarcador.length === 0 || this.normalizarTexto(statusRequisicao) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A) || !leituraItem.snapshotExistenteId) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', 'Revalidacao imediata da requisicao origem bloqueou a NF.', [
        { codigo: 'EXECUCAO_REVALIDACAO_REQUISICAO_FALHOU', mensagem: leituraItem.erro || `Status=${statusRequisicao || '-'}; snapshot=${leituraItem.snapshotExistenteId || '-'}.` }
      ], pedidoId, statusRequisicao);
    }

    const pedido = await this.obterPedidoOrigemNotaFiscalV27A(pedidoId);
    const vinculoPedido = this.obterVinculoPedidoNotaFiscalV27A(pedido);

    if (pedido.numeroRequisicao !== 'V2.7A-TESTE-001' || !pedido.fornecedorId || !pedido.obraId || !this.statusPedidoElegivelParaNotaFiscalV27A(pedido.status)) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', 'Revalidacao imediata do pedido bloqueou a NF.', [
        { codigo: 'EXECUCAO_REVALIDACAO_PEDIDO_FALHOU', mensagem: `Requisicao=${pedido.numeroRequisicao || '-'}; status=${pedido.status || '-'}; fornecedor=${pedido.fornecedorId || '-'}; obra=${pedido.obraId || '-'}.` }
      ], pedidoId, statusRequisicao);
    }

    const nfExistente = await this.obterNotaFiscalExistenteV27A(vinculoPedido, numeroNf);
    if (nfExistente) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', 'NF de teste ja existente para o pedido.', [
        { codigo: 'NF_TESTE_JA_EXISTENTE', mensagem: `${nfExistente.id} / ${nfExistente.title}` }
      ], pedidoId, statusRequisicao);
    }

    const now = new Date();
    const dataEmissao = config.dataEmissaoNotaFiscalTesteV27A || now.toISOString();
    const dataVencimento = config.dataVencimentoNotaFiscalTesteV27A || this.addDays(now, 7).toISOString();
    const tituloNf = this.criarTituloNotaFiscalV27A(pedidoId, config, now);
    const body: Record<string, unknown> = {
      Title: tituloNf,
      [LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD]: vinculoPedido,
      [LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD]: numeroNf,
      [LISTA_04_NOTAS_FISCAIS_SERIE_FIELD]: config.serieNotaFiscalTesteV27A || '1',
      [LISTA_04_NOTAS_FISCAIS_DATA_EMISSAO_FIELD]: dataEmissao,
      [LISTA_04_NOTAS_FISCAIS_DATA_VENCIMENTO_FIELD]: dataVencimento,
      [LISTA_04_NOTAS_FISCAIS_VALOR_FIELD]: valorNf,
      [LISTA_04_NOTAS_FISCAIS_TIPO_FIELD]: tipoNf,
      [LISTA_04_NOTAS_FISCAIS_STATUS_FIELD]: statusNf,
      [LISTA_04_NOTAS_FISCAIS_FORNECEDOR_FIELD]: pedido.fornecedorId,
      [LISTA_04_NOTAS_FISCAIS_OBRA_FIELD]: pedido.obraId,
      CentrodeCusto: pedido.centroCusto || '',
      CNPJFornecedor: pedido.fornecedorLookup || '',
      [LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD]: enviadaContabilidade
    };

    if (config.linkNotaFiscalTesteV27A) {
      body[LISTA_04_NOTAS_FISCAIS_LINK_FIELD] = { Url: config.linkNotaFiscalTesteV27A, Description: config.linkNotaFiscalTesteV27A };
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.notasFiscaisRecebidas),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );

    if (!response.ok) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', `POST de NF retornou ${response.status}: ${response.statusText}.`, [
        { codigo: 'ERRO_POST_NOTA_FISCAL', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }
      ], pedidoId, statusRequisicao);
    }

    const nf = await this.ensureJson(response);
    const nfId = Number(nf.Id || nf.ID);
    const historico = await this.registrarHistoricoOperacional({
      origemLista: 'Lista 03',
      origemItemId: pedidoId,
      acao: 'VincularNotaFiscal',
      descricao: `${config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - vinculacao controlada de nota fiscal'}; NF ${nfId}/${tituloNf}; pedido ${pedidoId}/${vinculoPedido}; numero ${numeroNf}; valor ${valorNf}; status inicial ${statusNf}; enviada contabilidade ${enviadaContabilidade}; origem Webpart V2.7A.6B; sem pagamento; sem Power Automate.`,
      statusAnterior: pedido.status,
      statusNovo: pedido.status,
      marcadorTeste: flags.marcadorTesteOperacionalV27A
    }, emailOuLogin, flags);

    return {
      sucesso: true,
      bloqueado: false,
      acao: 'VincularNotaFiscal',
      mensagem: 'Nota fiscal criada na Lista 04 com controle V2.7A.6B e historico registrado.',
      itemId: nfId,
      campoAlterado: LISTA_04_NOTAS_FISCAIS_CAMPOS_PREVISTOS.join(', '),
      statusAnterior: pedido.status,
      statusNovo: pedido.status,
      historicoRegistrado: historico.sucesso,
      historicoItemId: historico.itemId,
      statusHttpEscrita: response.status,
      alertas: historico.alertas
    };
  }

  public async programarPagamentoControlado(id: number, payload: ProgramacaoPagamentoControladaPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    void id;
    void payload;
    void emailOuLogin;
    void flags;
    return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', 'Metodo legado bloqueado. Use executarProgramarPagamentoV27A com schema real da Lista 10.', [
      { codigo: 'METODO_LEGADO_PAGAMENTO_BLOQUEADO', mensagem: 'A Lista 10 exige NF textual, Fornecedor_x002f_PrestadorId, ObraId, valores, status, forma, conta, categoria e origem confirmados pela auditoria readonly.' }
    ]);
  }

  public async executarProgramarPagamentoV27A(emailOuLogin: string, flags: FlagsEscritaOperacionalV27A, config: ConfiguracaoTesteOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const requisicaoItemId = Number(config.itemTesteOperacionalIdV27A || 0);
    const notaFiscalId = Number(config.notaFiscalTesteIdV27A || 0);
    const numeroNfEsperado = String(config.numeroNotaFiscalTesteV27A || 'NF-V2.7A-TESTE-001').trim();
    const valorPagamento = Number(config.pagamentoValorTesteV27A || config.valorNotaFiscalTesteV27A || config.valorTesteOperacionalV27A || 0);
    const statusPagamento = config.pagamentoStatusInicialTesteV27A || LISTA_10_PAGAMENTO_STATUS_INICIAL;
    const formaPagamento = config.pagamentoFormaTesteV27A || LISTA_10_PAGAMENTO_FORMA_INICIAL;
    const contaPagamento = config.pagamentoContaTesteV27A || LISTA_10_PAGAMENTO_CONTA_INICIAL;
    const categoriaPagamento = config.pagamentoCategoriaTesteV27A || LISTA_10_PAGAMENTO_CATEGORIA_INICIAL;
    const origemPagamento = config.pagamentoOrigemTesteV27A || LISTA_10_PAGAMENTO_ORIGEM_INICIAL;
    const preValidacao = await this.preValidarEscritaOperacionalRestritaV27A(emailOuLogin, flags, config);
    const alertas: AlertaBloqueioEscrita[] = [...preValidacao.alertas];

    if (!preValidacao.podeExecutar) {
      alertas.push({ codigo: 'EXECUCAO_SEM_PREVALIDACAO_ESPECIFICA', mensagem: 'Pre-validacao especifica do item nao esta aprovada no momento da execucao.' });
    }

    if (preValidacao.acaoPretendida !== 'ProgramarPagamento') {
      alertas.push({ codigo: 'EXECUCAO_ACAO_NAO_SUPORTADA', mensagem: 'Esta rotina permite somente ProgramarPagamento.' });
    }

    if (preValidacao.itemTesteId !== requisicaoItemId) {
      alertas.push({ codigo: 'EXECUCAO_ITEM_DIVERGENTE', mensagem: `Requisicao validada ${preValidacao.itemTesteId || '-'} difere da configurada ${requisicaoItemId || '-'}.` });
    }

    if (!preValidacao.marcadorEncontrado) {
      alertas.push({ codigo: 'EXECUCAO_MARCADOR_NAO_CONFIRMADO', mensagem: 'Marcador V2.7A-TESTE nao foi confirmado na requisicao origem.' });
    }

    if (!notaFiscalId || notaFiscalId <= 0) {
      alertas.push({ codigo: 'NF_TESTE_NAO_ENCONTRADA', mensagem: 'notaFiscalTesteIdV27A deve ser informado.' });
    }

    if (!numeroNfEsperado) {
      alertas.push({ codigo: 'NUMERO_NF_TESTE_AUSENTE', mensagem: 'numeroNotaFiscalTesteV27A deve ser informado.' });
    }

    if (!valorPagamento || valorPagamento <= 0) {
      alertas.push({ codigo: 'VALOR_PAGAMENTO_AUSENTE', mensagem: 'pagamentoValorTesteV27A ou valorNotaFiscalTesteV27A deve ser maior que zero.' });
    }

    if (!this.statusPagamentoInicialMapeadoV27A(statusPagamento)) {
      alertas.push({ codigo: 'STATUS_PAGAMENTO_INICIAL_NAO_MAPEADO', mensagem: `Status inicial do pagamento invalido: ${statusPagamento}.` });
    }

    if (!this.formaPagamentoMapeadaV27A(formaPagamento)) {
      alertas.push({ codigo: 'FORMA_PAGAMENTO_NAO_MAPEADA', mensagem: `Forma de pagamento invalida: ${formaPagamento}.` });
    }

    if (!this.contaPagamentoMapeadaV27A(contaPagamento)) {
      alertas.push({ codigo: 'CONTA_PAGAMENTO_NAO_MAPEADA', mensagem: `Conta de pagamento invalida: ${contaPagamento}.` });
    }

    if (!this.categoriaPagamentoMapeadaV27A(categoriaPagamento)) {
      alertas.push({ codigo: 'CATEGORIA_PAGAMENTO_NAO_MAPEADA', mensagem: `Categoria de pagamento invalida: ${categoriaPagamento}.` });
    }

    if (!this.origemPagamentoMapeadaV27A(origemPagamento)) {
      alertas.push({ codigo: 'ORIGEM_PAGAMENTO_NAO_MAPEADA', mensagem: `Origem de pagamento invalida: ${origemPagamento}.` });
    }

    if (!preValidacao.acoesPermitidas.some((acao) => acao === 'ProgramarPagamento')) {
      alertas.push({ codigo: 'EXECUCAO_PERFIL_SEM_PERMISSAO', mensagem: 'Perfil atual nao esta autorizado para ProgramarPagamento.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', `Programacao de pagamento bloqueada: ${alertas.map((alerta) => alerta.codigo).join(', ')}.`, alertas, notaFiscalId);
    }

    const leituraItem = await this.obterRequisicaoOperacionalParaPreValidacao(requisicaoItemId);
    const requisicao = leituraItem.item;
    const statusRequisicao = String(requisicao?.[LISTA_02_REQUISICOES_COMPRA_STATUS_FIELD] || '');
    const camposComMarcador = requisicao ? this.obterCamposComMarcadorV27A(requisicao, flags.marcadorTesteOperacionalV27A) : [];

    if (!requisicao || camposComMarcador.length === 0 || this.normalizarTexto(statusRequisicao) !== this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A) || !leituraItem.snapshotExistenteId) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', 'Revalidacao imediata da requisicao origem bloqueou a programacao.', [
        { codigo: 'EXECUCAO_REVALIDACAO_REQUISICAO_FALHOU', mensagem: leituraItem.erro || `Status=${statusRequisicao || '-'}; snapshot=${leituraItem.snapshotExistenteId || '-'}.` }
      ], notaFiscalId, statusRequisicao);
    }

    const nfOrigem = await this.obterNotaFiscalOrigemPagamentoV27A(notaFiscalId);
    if (
      nfOrigem.numeroNotaFiscal !== numeroNfEsperado ||
      nfOrigem.numeroPedido !== 'PED-V2.7A-TESTE-11-20260609125401' ||
      !nfOrigem.fornecedorId ||
      !nfOrigem.obraId ||
      Math.abs(nfOrigem.valorBruto - 6720) > 0.009 ||
      Math.abs(nfOrigem.valorBruto - valorPagamento) > 0.009 ||
      this.normalizarTexto(nfOrigem.statusConferencia) !== this.normalizarTexto(LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL) ||
      this.normalizarTexto(nfOrigem.enviadaContabilidade) !== this.normalizarTexto(LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL) ||
      !nfOrigem.dataVencimento
    ) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', 'Revalidacao imediata da NF origem bloqueou a programacao.', [
        { codigo: 'EXECUCAO_REVALIDACAO_NF_FALHOU', mensagem: `NF=${nfOrigem.numeroNotaFiscal || '-'}; pedido=${nfOrigem.numeroPedido || '-'}; status=${nfOrigem.statusConferencia || '-'}; contabilidade=${nfOrigem.enviadaContabilidade || '-'}; fornecedor=${nfOrigem.fornecedorId || '-'}; obra=${nfOrigem.obraId || '-'}; valor=${nfOrigem.valorBruto}; vencimento=${nfOrigem.dataVencimento || '-'}.` }
      ], notaFiscalId, statusRequisicao);
    }

    const pagamentoExistente = await this.obterPagamentoExistenteV27A(nfOrigem.numeroNotaFiscal, notaFiscalId);
    if (pagamentoExistente) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', 'Pagamento de teste ja existente para a NF.', [
        { codigo: 'PAGAMENTO_JA_EXISTENTE', mensagem: `${pagamentoExistente.id} / ${pagamentoExistente.title}` }
      ], notaFiscalId, statusRequisicao);
    }

    const now = new Date();
    const dataProgramada = config.pagamentoDataProgramadaTesteV27A || nfOrigem.dataVencimento || now.toISOString();
    const tituloPagamento = this.criarTituloPagamentoV27A(notaFiscalId, config, now);
    const body: Record<string, unknown> = {
      Title: tituloPagamento,
      [LISTA_10_PAGAMENTO_NUMERO_NF_FIELD]: nfOrigem.numeroNotaFiscal,
      [LISTA_10_PAGAMENTO_OBRA_FIELD]: nfOrigem.obraId,
      [LISTA_10_PAGAMENTO_FORNECEDOR_FIELD]: nfOrigem.fornecedorId,
      [LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD]: valorPagamento,
      [LISTA_10_PAGAMENTO_VALOR_LIQUIDO_FIELD]: valorPagamento,
      [LISTA_10_PAGAMENTO_DATA_EMISSAO_FIELD]: nfOrigem.dataEmissao || now.toISOString(),
      [LISTA_10_PAGAMENTO_DATA_VENCIMENTO_FIELD]: nfOrigem.dataVencimento,
      [LISTA_10_PAGAMENTO_DATA_PROGRAMADA_FIELD]: dataProgramada,
      [LISTA_10_PAGAMENTO_STATUS_FIELD]: statusPagamento,
      [LISTA_10_PAGAMENTO_FORMA_FIELD]: formaPagamento,
      [LISTA_10_PAGAMENTO_CONTA_FIELD]: contaPagamento,
      [LISTA_10_PAGAMENTO_CATEGORIA_FIELD]: categoriaPagamento,
      [LISTA_10_PAGAMENTO_ORIGEM_FIELD]: origemPagamento,
      [LISTA_10_PAGAMENTO_CENTRO_CUSTO_FIELD]: nfOrigem.centroCusto || 'V2.7A-TESTE',
      [LISTA_10_PAGAMENTO_OBSERVACOES_FIELD]: config.observacaoTesteOperacionalV27A || `V2.7A-TESTE - programacao controlada de pagamento a partir da NF ${notaFiscalId}`
    };

    if (nfOrigem.linkNotaFiscal) {
      body[LISTA_10_PAGAMENTO_LINK_NF_FIELD] = { Url: nfOrigem.linkNotaFiscal, Description: nfOrigem.numeroNotaFiscal };
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.programacaoFinanceira),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );

    if (!response.ok) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', `POST de pagamento retornou ${response.status}: ${response.statusText}.`, [
        { codigo: 'ERRO_POST_PAGAMENTO', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }
      ], notaFiscalId, statusRequisicao);
    }

    const pagamento = await this.ensureJson(response);
    const pagamentoId = Number(pagamento.Id || pagamento.ID);
    const alertasPosCriacao: AlertaBloqueioEscrita[] = [];
    const pagamentoCriado = await this.obterPagamentoCriadoV27A(pagamentoId);

    if (
      pagamentoCriado.numeroNotaFiscal !== nfOrigem.numeroNotaFiscal ||
      this.normalizarTexto(pagamentoCriado.status) !== this.normalizarTexto(statusPagamento) ||
      Math.abs(pagamentoCriado.valorBruto - valorPagamento) > 0.009
    ) {
      alertasPosCriacao.push({
        codigo: 'PAGAMENTO_POS_CRIACAO_DIVERGENTE',
        mensagem: `Pagamento criado com NF=${pagamentoCriado.numeroNotaFiscal || '-'}; status=${pagamentoCriado.status || '-'}; valor=${pagamentoCriado.valorBruto}. Conferir manualmente.`
      });
    }

    const historico = await this.registrarHistoricoOperacional({
      origemLista: 'Lista 10',
      origemItemId: pagamentoId,
      acao: 'ProgramarPagamento',
      descricao: `${config.observacaoTesteOperacionalV27A || 'V2.7A-TESTE - programacao controlada de pagamento'}; pagamento ${pagamentoId}/${tituloPagamento}; NF ${notaFiscalId}/${nfOrigem.numeroNotaFiscal}; pedido ${nfOrigem.numeroPedido}; requisicao ${requisicaoItemId}; valor ${valorPagamento}; status ${statusPagamento}; forma ${formaPagamento}; conta ${contaPagamento}; origem Webpart V2.7A.7B; sem Power Automate.`,
      statusAnterior: '',
      statusNovo: statusPagamento,
      marcadorTeste: flags.marcadorTesteOperacionalV27A
    }, emailOuLogin, flags);

    return {
      sucesso: true,
      bloqueado: false,
      acao: 'ProgramarPagamento',
      mensagem: 'Pagamento programado na Lista 10 com controle V2.7A.7B e historico registrado.',
      itemId: pagamentoId,
      campoAlterado: LISTA_10_PAGAMENTO_CAMPOS_PREVISTOS.join(', '),
      statusAnterior: '',
      statusNovo: statusPagamento,
      historicoRegistrado: historico.sucesso,
      historicoItemId: historico.itemId,
      statusHttpEscrita: response.status,
      alertas: [...alertasPosCriacao, ...historico.alertas]
    };
  }

  public async registrarHistoricoOperacional(payload: HistoricoOperacionalPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const alertas = this.validarPermissaoAcao('RegistrarHistoricoOperacional', { title: payload.marcadorTeste, status: payload.statusAnterior }, usuario, flags);

    if (!payload.origemLista || !payload.origemItemId || !payload.descricao) {
      alertas.push({ codigo: 'HISTORICO_INCOMPLETO', mensagem: 'Historico operacional exige origem, item e descricao.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('RegistrarHistoricoOperacional', 'Historico operacional bloqueado.', alertas);
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.historicoConfiguracoes),
      SPHttpClient.configurations.v1,
      this.criarPostOptions({
        Title: `${payload.marcadorTeste} ${payload.acao} ${payload.origemItemId}`,
        TipoConfiguracao: 'Historico Operacional',
        AcaoRealizada: payload.acao,
        ItemConfiguracaoId: `${payload.origemLista}-${payload.origemItemId}`,
        ValorAnterior: payload.statusAnterior || '',
        ValorNovo: payload.statusNovo || '',
        Justificativa: payload.descricao
      })
    );
    const item = await this.ensureJson(response);
    return {
      sucesso: true,
      bloqueado: false,
      acao: 'RegistrarHistoricoOperacional',
      mensagem: 'Historico operacional registrado.',
      itemId: Number(item.Id || item.ID),
      alertas: []
    };
  }

  public async criarSnapshotAprovacaoOperacional(payload: SnapshotAprovacaoOperacionalPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    void payload;
    void emailOuLogin;
    void flags;
    return this.criarResultadoOperacionalBloqueado('CriarSnapshotAprovacaoOperacional', 'Criacao direta de snapshot operacional bloqueada. Use executarCriarSnapshotAprovacaoOperacionalV27A(), com pre-validacao especifica, vinculo e historico.', [
      { codigo: 'METODO_DIRETO_SNAPSHOT_BLOQUEADO', mensagem: 'A V2.7A.3 permite somente o orquestrador protegido do teste de snapshot operacional.' }
    ]);
  }
  public async preValidarTesteControladoSnapshot(input: SnapshotCriacaoTesteInput): Promise<PreValidacaoTesteControladoSnapshotResultado> {
    const alertas = this.validarControleEscritaTeste(input);
    if (alertas.length > 0) {
      return {
        sucesso: false,
        bloqueado: true,
        status: 'Bloqueada',
        mensagem: 'Pre-validacao bloqueada por configuracao de teste incompleta.',
        requisicaoItemId: input.requisicaoItemId,
        valorAnalisado: input.valorAnalisado,
        criaraSnapshot: false,
        vincularaSnapshotAprovacaoCompra: false,
        registraraHistorico: false,
        alertas
      };
    }

    try {
      const requisicao = await this.obterRequisicaoTesteParaEscrita(input.requisicaoItemId, input.marcadorTeste);
      const marcadorEncontrado = this.detectarMarcadorTeste(String(requisicao.Title || ''));
      const snapshotExistenteId = requisicao.SnapshotAprovacaoCompra?.Id ? Number(requisicao.SnapshotAprovacaoCompra.Id) : undefined;
      const snapshotExistenteTitulo = requisicao.SnapshotAprovacaoCompra?.Title;
      const usuarios = await this.listarUsuariosPerfis({ somenteAtivos: true });
      const alcadas = await this.listarAlcadas();
      const regra = this.selecionarRegraAlcadaCompra(alcadas, {
        tipoSolicitacao: input.tipoSolicitacao,
        obraId: input.obraId || (requisicao.Obra?.Id ? String(requisicao.Obra.Id) : undefined),
        valor: input.valorAnalisado,
        dataReferencia: new Date(),
        motivoExcecao: input.motivoExcecao
      });
      const aprovadorBase = this.encontrarUsuarioPorLookup(regra.aprovadorPrincipalId, regra.aprovadorPrincipalNome, usuarios);

      if (!aprovadorBase) {
        return {
          sucesso: false,
          bloqueado: true,
          status: 'Bloqueada',
          mensagem: 'Aprovador base da alcada nao localizado entre usuarios ativos.',
          requisicaoItemId: input.requisicaoItemId,
          requisicaoTitulo: requisicao.Title,
          marcadorEncontrado,
          valorAnalisado: input.valorAnalisado,
          regraInternaId: regra.regraInternaId,
          regraAlcadaItemId: Number(regra.id),
          criaraSnapshot: false,
          vincularaSnapshotAprovacaoCompra: false,
          registraraHistorico: false,
          alertas: [{ codigo: 'APROVADOR_BASE_NAO_LOCALIZADO', mensagem: regra.regraInternaId }]
        };
      }

      const resolucao = this.resolverAprovadorEfetivo(aprovadorBase, usuarios, new Date());
      const snapshot = this.criarSnapshotAprovacaoCompra(regra, resolucao, input.valorAnalisado, input.motivoExcecao);

      return {
        sucesso: true,
        bloqueado: Boolean(snapshotExistenteId),
        status: snapshotExistenteId ? 'ValidacaoExistente' : 'Concluido',
        mensagem: snapshotExistenteId
          ? 'Pre-validacao readonly concluida: requisicao ja possui SnapshotAprovacaoCompra; escrita futura deve apenas validar idempotencia.'
          : 'Pre-validacao readonly concluida: teste pode criar snapshot, vincular requisicao e registrar historico se autorizado.',
        requisicaoItemId: input.requisicaoItemId,
        requisicaoTitulo: requisicao.Title,
        marcadorEncontrado,
        valorAnalisado: input.valorAnalisado,
        regraInternaId: regra.regraInternaId,
        regraAlcadaItemId: Number(regra.id),
        resumoRegraAplicada: `${input.marcadorTeste}; ${regra.processo}; ${snapshot.faixaValorVigente}; aprovador ${snapshot.aprovadorBaseNome}`,
        aprovadorBaseId: snapshot.aprovadorBaseId,
        aprovadorBaseNome: snapshot.aprovadorBaseNome,
        aprovadorEfetivoId: snapshot.aprovadorEfetivoId,
        aprovadorEfetivoNome: snapshot.aprovadorEfetivoNome,
        snapshotExistenteId,
        snapshotExistenteTitulo,
        criaraSnapshot: !snapshotExistenteId,
        vincularaSnapshotAprovacaoCompra: !snapshotExistenteId,
        registraraHistorico: !snapshotExistenteId,
        alertas: []
      };
    } catch (error) {
      return {
        sucesso: false,
        bloqueado: true,
        status: 'Erro',
        mensagem: this.getErrorMessage(error),
        requisicaoItemId: input.requisicaoItemId,
        valorAnalisado: input.valorAnalisado,
        criaraSnapshot: false,
        vincularaSnapshotAprovacaoCompra: false,
        registraraHistorico: false,
        alertas: [{ codigo: 'ERRO_PRE_VALIDACAO', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async executarTesteControladoSnapshot(input: SnapshotCriacaoTesteInput): Promise<SnapshotCriacaoTesteResultado> {
    const alertas = this.validarControleEscritaTeste(input);
    if (alertas.length > 0) {
      return this.criarResultadoBloqueado(input.requisicaoItemId, 'Escrita controlada bloqueada antes de qualquer chamada de escrita.', alertas);
    }

    try {
      const snapshotResultado = await this.criarSnapshotAprovacaoCompraTeste(input);
      if (!snapshotResultado.sucesso || !snapshotResultado.snapshotItemId) {
        return snapshotResultado;
      }
      if (snapshotResultado.status === 'ValidacaoExistente') {
        return snapshotResultado;
      }

      const vinculo = await this.vincularSnapshotARequisicaoTeste(input.requisicaoItemId, snapshotResultado.snapshotItemId, input);
      if (!vinculo.sucesso) {
        return {
          ...snapshotResultado,
          sucesso: false,
          bloqueado: true,
          status: vinculo.status,
          mensagem: vinculo.mensagem,
          vinculo
        };
      }

      const historico = await this.registrarHistoricoConfiguracaoTeste(input, snapshotResultado.snapshotItemId, snapshotResultado.regraInternaId || '');

      return {
        ...snapshotResultado,
        sucesso: vinculo.sucesso && historico.sucesso,
        bloqueado: false,
        status: historico.sucesso ? 'Concluido' : historico.status,
        mensagem: historico.sucesso
          ? 'Teste controlado V2.6A concluido: snapshot criado, vinculado e historico registrado.'
          : `Snapshot vinculado, mas historico nao foi registrado: ${historico.mensagem}`,
        vinculo,
        historico
      };
    } catch (error) {
      return {
        sucesso: false,
        bloqueado: true,
        status: 'Erro',
        mensagem: this.getErrorMessage(error),
        requisicaoItemId: input.requisicaoItemId,
        alertas: [{ codigo: 'ERRO_EXECUCAO_TESTE', mensagem: this.getErrorMessage(error) }]
      };
    }
  }

  public async criarSnapshotAprovacaoCompraTeste(input: SnapshotCriacaoTesteInput): Promise<SnapshotCriacaoTesteResultado> {
    const alertas = this.validarControleEscritaTeste(input);
    if (alertas.length > 0) {
      return this.criarResultadoBloqueado(input.requisicaoItemId, 'Criacao de snapshot de teste bloqueada.', alertas);
    }

    const requisicao = await this.obterRequisicaoTesteParaEscrita(input.requisicaoItemId, input.marcadorTeste);
    const snapshotExistenteId = requisicao.SnapshotAprovacaoCompra?.Id ? Number(requisicao.SnapshotAprovacaoCompra.Id) : undefined;
    if (snapshotExistenteId) {
      const mensagem = `Requisicao de teste ja possui SnapshotAprovacaoCompra=${snapshotExistenteId}.`;
      return {
        sucesso: Boolean(input.idempotenteValidarExistente),
        bloqueado: !input.idempotenteValidarExistente,
        status: input.idempotenteValidarExistente ? 'ValidacaoExistente' : 'Bloqueada',
        mensagem,
        requisicaoItemId: input.requisicaoItemId,
        snapshotItemId: snapshotExistenteId,
        alertas: input.idempotenteValidarExistente ? [] : [{ codigo: 'SNAPSHOT_JA_EXISTE', mensagem }]
      };
    }

    const usuarios = await this.listarUsuariosPerfis({ somenteAtivos: true });
    const alcadas = await this.listarAlcadas();
    const regra = this.selecionarRegraAlcadaCompra(alcadas, {
      tipoSolicitacao: input.tipoSolicitacao,
      obraId: input.obraId || (requisicao.Obra?.Id ? String(requisicao.Obra.Id) : undefined),
      valor: input.valorAnalisado,
      dataReferencia: new Date(),
      motivoExcecao: input.motivoExcecao
    });
    const aprovadorBase = this.encontrarUsuarioPorLookup(regra.aprovadorPrincipalId, regra.aprovadorPrincipalNome, usuarios);

    if (!aprovadorBase) {
      return this.criarResultadoBloqueado(input.requisicaoItemId, 'Aprovador base da alcada nao localizado entre usuarios ativos.', [
        { codigo: 'APROVADOR_BASE_NAO_LOCALIZADO', mensagem: regra.regraInternaId }
      ]);
    }

    const resolucao = this.resolverAprovadorEfetivo(aprovadorBase, usuarios, new Date());
    const snapshot = this.criarSnapshotAprovacaoCompra(regra, resolucao, input.valorAnalisado, input.motivoExcecao);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const title = `SNAP-V2.6A-TESTE-${input.requisicaoItemId}-${timestamp}`;
    const body = {
      Title: title,
      SolicitacaoId: input.requisicaoItemId,
      RegraAlcadaUtilizadaId: Number(regra.id),
      RegraInternaId: regra.regraInternaId,
      ResumoRegraAplicada: `${input.marcadorTeste}; ${regra.processo}; ${snapshot.faixaValorVigente}; aprovador ${snapshot.aprovadorBaseNome}`,
      Processo: 'Compra',
      FaixaValorVigente: snapshot.faixaValorVigente,
      ValorAnalisado: snapshot.valorAnalisado,
      AprovadorBaseId: snapshot.aprovadorBaseId,
      AprovadorBaseNome: snapshot.aprovadorBaseNome,
      AprovadorBaseEmail: '',
      AprovadorEfetivoId: snapshot.aprovadorEfetivoId,
      AprovadorEfetivoNome: snapshot.aprovadorEfetivoNome,
      AprovadorEfetivoEmail: '',
      SubstituicaoAplicada: snapshot.substituicaoAplicada,
      MotivoResolucaoAprovador: snapshot.motivoResolucaoAprovador,
      MotivoExcecao: snapshot.motivoExcecao || input.marcadorTeste,
      DataHoraAplicacao: snapshot.dataHoraAplicacao
    };

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.snapshotsRegras),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );
    const payload = await this.ensureJson(response);
    const snapshotItemId = Number(payload.Id || payload.ID);

    return {
      sucesso: true,
      bloqueado: false,
      status: 'SnapshotCriado',
      mensagem: 'Snapshot de teste V2.6A criado em ENAC Snapshots Regras.',
      requisicaoItemId: input.requisicaoItemId,
      snapshotItemId,
      snapshotTitle: title,
      regraInternaId: regra.regraInternaId,
      alertas: []
    };
  }

  public async vincularSnapshotARequisicaoTeste(requisicaoId: number, snapshotId: number, input: SnapshotCriacaoTesteInput): Promise<ResultadoVinculoSnapshot> {
    const alertas = this.validarControleEscritaTeste(input);
    if (alertas.length > 0 || requisicaoId !== input.requisicaoItemId) {
      return {
        sucesso: false,
        status: 'Bloqueada',
        requisicaoItemId: requisicaoId,
        snapshotItemId: snapshotId,
        mensagem: 'Vinculo de snapshot bloqueado por controle de escrita de teste.'
      };
    }

    const requisicao = await this.obterRequisicaoTesteParaEscrita(requisicaoId, input.marcadorTeste);
    const snapshotExistenteId = requisicao.SnapshotAprovacaoCompra?.Id ? Number(requisicao.SnapshotAprovacaoCompra.Id) : undefined;
    if (snapshotExistenteId) {
      return {
        sucesso: snapshotExistenteId === snapshotId,
        status: snapshotExistenteId === snapshotId ? 'ValidacaoExistente' : 'Bloqueada',
        requisicaoItemId: requisicaoId,
        snapshotItemId: snapshotId,
        mensagem: snapshotExistenteId === snapshotId
          ? 'SnapshotAprovacaoCompra ja estava vinculado ao snapshot informado; nenhuma escrita executada.'
          : `Requisicao de teste ja possui SnapshotAprovacaoCompra=${snapshotExistenteId}; MERGE bloqueado para evitar sobrescrita.`
      };
    }

    const response = await this.spHttpClient.post(
      `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${requisicaoId})`,
      SPHttpClient.configurations.v1,
      this.criarMergeOptions({ SnapshotAprovacaoCompraId: snapshotId })
    );

    if (!response.ok) {
      throw new Error(`SharePoint retornou ${response.status}: ${response.statusText}`);
    }

    return {
      sucesso: true,
      status: 'Vinculado',
      requisicaoItemId: requisicaoId,
      snapshotItemId: snapshotId,
      mensagem: 'SnapshotAprovacaoCompra vinculado na requisicao de teste.'
    };
  }

  public async registrarHistoricoConfiguracaoTeste(input: SnapshotCriacaoTesteInput, snapshotId: number, regraInternaId: string): Promise<ResultadoHistoricoConfiguracao> {
    const alertas = this.validarControleEscritaTeste(input);
    if (alertas.length > 0) {
      return {
        sucesso: false,
        status: 'Bloqueada',
        mensagem: 'Historico de teste bloqueado por controle de escrita.'
      };
    }

    const body = {
      Title: `V2.6A-TESTE snapshot ${snapshotId}`,
      TipoConfiguracao: 'Parâmetro Geral',
      AcaoRealizada: 'Ajuste Vinculado',
      ItemConfiguracaoId: `REQ-${input.requisicaoItemId}`,
      ValorAnterior: 'SnapshotAprovacaoCompra vazio antes do teste controlado.',
      ValorNovo: `Snapshot ${snapshotId}; regra ${regraInternaId}; marcador ${input.marcadorTeste}.`,
      Justificativa: 'Registro tecnico de teste controlado V2.6A pela webpart. Sem Power Automate.'
    };
    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.historicoConfiguracoes),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );
    const payload = await this.ensureJson(response);

    return {
      sucesso: true,
      status: 'HistoricoRegistrado',
      historicoItemId: Number(payload.Id || payload.ID),
      mensagem: 'Historico administrativo de teste registrado.'
    };
  }

  public async executarAdministracaoV29C(input: ExecucaoAdministrativaV29CInput): Promise<ResultadoAdministrativoV29C> {
    const alertas = this.validarControleAdministrativoV29C(input);
    if (alertas.length > 0) {
      return {
        sucesso: false,
        bloqueado: true,
        acao: input.acao,
        mensagem: 'Escrita administrativa V2.9C bloqueada por controle de seguranca.',
        alertas
      };
    }

    const listaAlvo = input.acao === 'AtualizarAlcadaUsuario' ? 'ENAC Alcadas' : 'ENAC Usuarios Perfis';
    const endpointLista = input.acao === 'AtualizarAlcadaUsuario'
      ? this.getListItemsEndpoint(LISTAS_ENAC.alcadas)
      : this.getListItemsEndpoint(LISTAS_ENAC.usuariosPerfis);
    const itemId = input.acao === 'AtualizarAlcadaUsuario'
      ? input.payloadAlcada?.itemId
      : input.payloadUsuario?.itemId;
    const body = input.acao === 'AtualizarAlcadaUsuario'
      ? this.criarPayloadAlcadaAdministrativaV29C(input.payloadAlcada!)
      : await this.criarPayloadUsuarioAdministrativoV29C(input.payloadUsuario!);

    const response = await this.spHttpClient.post(
      itemId ? `${endpointLista}(${itemId})` : endpointLista,
      SPHttpClient.configurations.v1,
      itemId ? this.criarMergeOptions(body) : this.criarPostOptions(body)
    );

    if (!response.ok) {
      return {
        sucesso: false,
        bloqueado: true,
        acao: input.acao,
        listaAlvo,
        itemId,
        statusHttpEscrita: response.status,
        mensagem: `SharePoint retornou ${response.status}: ${response.statusText}.`,
        alertas: [{ codigo: 'ERRO_ESCRITA_ADMIN_V29C', mensagem: `SharePoint retornou ${response.status}: ${response.statusText}` }]
      };
    }

    const payloadResposta = itemId ? { Id: itemId } : await this.ensureJson(response);
    const itemAfetadoId = Number(payloadResposta.Id || payloadResposta.ID || itemId || 0);
    await this.obterItemAdministrativoV29C(input.acao, itemAfetadoId);
    const historicoId = await this.registrarHistoricoAdministrativoV29C(input, listaAlvo, itemAfetadoId, body);

    return {
      sucesso: true,
      bloqueado: false,
      acao: input.acao,
      listaAlvo,
      itemId: itemAfetadoId,
      historicoRegistrado: true,
      historicoItemId: historicoId,
      statusHttpEscrita: response.status,
      mensagem: `${input.acao} executada com historico administrativo V2.9C.`,
      alertas: []
    };
  }

  public async listarHistoricoConfiguracoes(): Promise<IHistoricoConfiguracaoEnac[]> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.historicoConfiguracoes)}?$select=TipoConfiguracao,ValorAnterior,ValorNovo,Justificativa,Created,Author/Title&$expand=Author`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => ({
      tipoConfiguracao: item.TipoConfiguracao,
      valorAnterior: item.ValorAnterior,
      valorNovo: item.ValorNovo,
      usuarioAlteracao: item.Author?.Title || '',
      dataHora: item.Created,
      justificativa: item.Justificativa
    }));
  }

  private validarControleAdministrativoV29C(input: ExecucaoAdministrativaV29CInput): AlertaBloqueioEscrita[] {
    const alertas: AlertaBloqueioEscrita[] = [];

    if (!input.flags.habilitarEscritaAdministrativaV29C) alertas.push({ codigo: 'ESCRITA_ADMIN_V29C_DESABILITADA', mensagem: 'habilitarEscritaAdministrativaV29C deve ser true.' });
    if (!input.flags.modoTesteAdministrativoV29C) alertas.push({ codigo: 'MODO_TESTE_ADMIN_V29C_DESLIGADO', mensagem: 'modoTesteAdministrativoV29C deve ser true.' });
    if (input.flags.exigirConfirmacaoAdministrativaV29C !== false && input.flags.confirmacaoAdministrativaV29C !== CONFIRMACAO_ADMINISTRATIVA_V29C) alertas.push({ codigo: 'CONFIRMACAO_PROPERTY_PANE_INVALIDA', mensagem: 'Confirmacao V2.9C do Property Pane invalida.' });
    if (input.confirmacaoFinal !== CONFIRMACAO_ADMINISTRATIVA_V29C) alertas.push({ codigo: 'CONFIRMACAO_FINAL_INVALIDA', mensagem: 'Confirmacao final V2.9C invalida.' });
    if (input.flags.marcadorAdministrativoV29C !== MARCADOR_ADMINISTRATIVO_V29C) alertas.push({ codigo: 'MARCADOR_ADMIN_V29C_INVALIDO', mensagem: 'Marcador administrativo V2.9C invalido.' });
    const executorTemPerfilAdmin = input.usuarioExecutor.perfilPrincipal === 'AdministradorSistema' || input.usuarioExecutor.perfisAdicionais.indexOf('AdministradorSistema') >= 0;
    if (!input.usuarioExecutor.usuarioAtivo || !executorTemPerfilAdmin || !input.usuarioExecutor.podeAdministrarConfiguracoes) alertas.push({ codigo: 'EXECUTOR_NAO_ADMINISTRADOR', mensagem: 'Executor deve ter Administrador do Sistema ativo com PodeAdministrarConfiguracoes=true.' });
    if (!input.preValidacao.sucesso || input.preValidacao.bloqueado) alertas.push({ codigo: 'PRE_VALIDACAO_REPROVADA', mensagem: 'Pre-validacao V2.9C nao aprovou a escrita.' });
    if (!input.justificativa.trim()) alertas.push({ codigo: 'JUSTIFICATIVA_AUSENTE', mensagem: 'Justificativa e obrigatoria.' });
    if ((input.acao === 'CriarUsuarioSistema' || input.acao === 'AtualizarUsuarioPerfilStatus') && !input.payloadUsuario) alertas.push({ codigo: 'PAYLOAD_USUARIO_AUSENTE', mensagem: 'Payload de usuario ausente.' });
    if (input.acao === 'AtualizarAlcadaUsuario' && !input.payloadAlcada) alertas.push({ codigo: 'PAYLOAD_ALCADA_AUSENTE', mensagem: 'Payload de alcada ausente.' });

    return alertas;
  }

  private async criarPayloadUsuarioAdministrativoV29C(input: UsuarioAdministrativoV29CPayload): Promise<Record<string, unknown>> {
    const contaMicrosoft365Id = input.contaMicrosoft365Id || (input.contaMicrosoft365Login ? await this.ensureSharePointUserId(input.contaMicrosoft365Login) : undefined);

    return {
      Title: input.nome,
      UsuarioInternoId: input.usuarioInternoId,
      ContaMicrosoft365Id: contaMicrosoft365Id,
      EmailCorporativo: input.emailCorporativo,
      PerfilPrincipal: this.mapPerfilParaChoiceSharePoint(input.perfilPrincipal),
      PerfisAdicionais: { results: input.perfisAdicionais.map((item) => this.mapPerfilParaChoiceSharePoint(item)) },
      UsuarioAtivo: input.usuarioAtivo,
      CargoFuncao: input.cargoFuncao || '',
      Observacoes: `${MARCADOR_ADMINISTRATIVO_V29C} - ${input.observacoes || ''}`,
      PodeAdministrarConfiguracoes: input.podeAdministrarConfiguracoes,
      PodeAprovarCompras: input.podeAprovarCompras,
      PodeAtualizarStatusFinal: input.podeAtualizarStatusFinal,
      PodeCriarSolicitacao: input.podeCriarSolicitacao,
      PodeEmitirPedido: input.podeEmitirPedido,
      PodeLiberarPagamento: input.podeLiberarPagamento,
      PodeProgramarPagamento: input.podeProgramarPagamento,
      PodeRegistrarCotacoes: input.podeRegistrarCotacoes,
      PodeVincularNF: input.podeVincularNf
    };
  }

  private criarPayloadAlcadaAdministrativaV29C(input: AlcadaAdministrativaV29CPayload): Record<string, unknown> {
    return {
      Title: input.titulo,
      RegraInternaId: input.regraInternaId,
      Processo: input.processo,
      TipoSolicitacao: input.tipoSolicitacao || 'Todos',
      ValorMinimo: input.valorMinimo,
      ValorMaximo: input.ilimitado ? null : input.valorMaximo,
      Ilimitado: input.ilimitado,
      AprovadorPrincipalId: input.aprovadorPrincipalId,
      AprovadorAdicionalId: input.aprovadorAdicionalId || null,
      ExigeAprovacaoAdicional: input.exigeAprovacaoAdicional,
      Ativo: input.ativa,
      VigenciaInicial: input.vigenciaInicial,
      VigenciaFinal: input.vigenciaFinal || null,
      ObraId: input.obraId || null,
      Observacoes: `${MARCADOR_ADMINISTRATIVO_V29C} - ${input.observacoes || ''}`
    };
  }

  private async registrarHistoricoAdministrativoV29C(input: ExecucaoAdministrativaV29CInput, listaAlvo: string, itemId: number, valorNovo: Record<string, unknown>): Promise<number> {
    const body = {
      Title: `${MARCADOR_ADMINISTRATIVO_V29C} ${input.acao} ${listaAlvo} ${itemId}`,
      TipoConfiguracao: input.acao,
      AcaoRealizada: input.acao,
      ItemConfiguracaoId: `${listaAlvo}:${itemId}`,
      ValorAnterior: JSON.stringify(input.valorAnterior || {}),
      ValorNovo: JSON.stringify(valorNovo),
      Justificativa: `${input.justificativa}; executor ${input.usuarioExecutor.nome}; perfil ${input.usuarioExecutor.perfilPrincipal}; resultado executado; alteracao de alcada nao retroage snapshots.`
    };
    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.historicoConfiguracoes),
      SPHttpClient.configurations.v1,
      this.criarPostOptions(body)
    );
    const payload = await this.ensureJson(response);
    return Number(payload.Id || payload.ID || 0);
  }

  private async obterItemAdministrativoV29C(acao: ExecucaoAdministrativaV29CInput['acao'], itemId: number): Promise<void> {
    const listId = acao === 'AtualizarAlcadaUsuario' ? LISTAS_ENAC.alcadas : LISTAS_ENAC.usuariosPerfis;
    const response = await this.spHttpClient.get(`${this.getListItemsEndpoint(listId)}(${itemId})?$select=Id,Title`, SPHttpClient.configurations.v1);
    await this.ensureJson(response);
  }

  private async ensureSharePointUserId(loginOrEmail: string): Promise<number> {
    const response = await this.spHttpClient.post(
      `${this.siteUrl}/_api/web/ensureuser`,
      SPHttpClient.configurations.v1,
      this.criarPostOptions({ logonName: loginOrEmail })
    );
    const payload = await this.ensureJson(response);
    return Number(payload.Id || payload.ID || 0);
  }

  private mapPerfilParaChoiceSharePoint(perfil: PerfilEnac): string {
    switch (perfil) {
      case 'Campo':
        return 'Campo / Engenheiro';
      case 'CotacoesContratos':
        return 'Cotações e Contratos';
      case 'ComprasFinanceiroOperacional':
        return 'Compras e Financeiro Operacional';
      case 'AdministradorSistema':
        return 'Administrador do Sistema';
      case 'ConsultaLeitura':
        return 'Consulta / Leitura';
      default:
        return perfil;
    }
  }

  private mapPerfilChoiceParaInternal(perfil: string | undefined): PerfilEnac {
    switch (perfil) {
      case 'Campo / Engenheiro':
      case 'Campo':
        return 'Campo';
      case 'Cotações e Contratos':
      case 'CotacoesContratos':
        return 'CotacoesContratos';
      case 'Compras e Financeiro Operacional':
      case 'ComprasFinanceiroOperacional':
        return 'ComprasFinanceiroOperacional';
      case 'Administrador do Sistema':
      case 'AdministradorSistema':
        return 'AdministradorSistema';
      case 'Consulta / Leitura':
      case 'ConsultaLeitura':
        return 'ConsultaLeitura';
      case 'Diretoria':
        return 'Diretoria';
      case 'Planejamento':
        return 'Planejamento';
      default:
        return 'Campo';
    }
  }

  private validarFlagsOperacionaisV27A(flags: FlagsEscritaOperacionalV27A): AlertaBloqueioEscrita[] {
    const alertas: AlertaBloqueioEscrita[] = [];

    if (!flags.habilitarEscritaOperacionalV27A) {
      alertas.push({ codigo: 'ESCRITA_OPERACIONAL_DESABILITADA', mensagem: 'habilitarEscritaOperacionalV27A deve ser true.' });
    }

    if (!flags.modoTesteOperacionalV27A) {
      alertas.push({ codigo: 'MODO_TESTE_OPERACIONAL_DESABILITADO', mensagem: 'modoTesteOperacionalV27A deve ser true nesta preparacao.' });
    }

    if (!flags.permitirSomenteItensTesteV27A) {
      alertas.push({ codigo: 'SOMENTE_ITENS_TESTE_OBRIGATORIO', mensagem: 'permitirSomenteItensTesteV27A deve permanecer true na V2.7A.' });
    }

    if (flags.marcadorTesteOperacionalV27A !== MARCADOR_OPERACIONAL_V27A) {
      alertas.push({ codigo: 'MARCADOR_OPERACIONAL_INVALIDO', mensagem: `Marcador obrigatorio: ${MARCADOR_OPERACIONAL_V27A}.` });
    }

    if (flags.exigirConfirmacaoManualV27A && flags.confirmacaoManualV27A !== CONFIRMACAO_OPERACIONAL_V27A) {
      alertas.push({ codigo: 'CONFIRMACAO_OPERACIONAL_INVALIDA', mensagem: `Confirmacao exigida: ${CONFIRMACAO_OPERACIONAL_V27A}.` });
    }

    return alertas;
  }

  private perfilPodeExecutarAcao(acao: AcaoOperacionalV27A, usuario: IUsuarioPerfilEnac): boolean {
    switch (acao) {
      case 'CriarRequisicaoCompra':
        return usuario.podeCriarSolicitacao || usuario.perfilPrincipal === 'Campo' || usuario.podeAdministrarConfiguracoes;
      case 'AtualizarRequisicaoCompra':
      case 'AtualizarStatusRequisicao':
        return usuario.podeRegistrarCotacoes || usuario.podeEmitirPedido || usuario.podeAtualizarStatusFinal || usuario.perfilPrincipal === 'Diretoria' || usuario.podeAdministrarConfiguracoes;
      case 'CriarPedidoCompra':
        return usuario.podeEmitirPedido || usuario.podeAdministrarConfiguracoes;
      case 'VincularNotaFiscal':
        return usuario.podeVincularNf || usuario.podeAdministrarConfiguracoes;
      case 'ProgramarPagamento':
        return usuario.podeProgramarPagamento || usuario.podeAdministrarConfiguracoes;
      case 'AprovarCompra':
      case 'CriarSnapshotAprovacaoOperacional':
        return usuario.podeAprovarCompras || usuario.perfilPrincipal === 'Diretoria' || usuario.podeAdministrarConfiguracoes;
      case 'RegistrarHistoricoOperacional':
        return true;
      default:
        return false;
    }
  }

  private acoesPermitidasParaPerfil(usuario: IUsuarioPerfilEnac): AcaoOperacionalV27A[] {
    const acoes: AcaoOperacionalV27A[] = [
      'CriarRequisicaoCompra',
      'AtualizarStatusRequisicao',
      'AtualizarRequisicaoCompra',
      'CriarPedidoCompra',
      'VincularNotaFiscal',
      'ProgramarPagamento',
      'AprovarCompra',
      'RegistrarHistoricoOperacional',
      'CriarSnapshotAprovacaoOperacional'
    ];

    return acoes.filter((acao) => this.perfilPodeExecutarAcao(acao, usuario));
  }

  private transicaoPermitidaV27A(acao: AcaoOperacionalV27A, statusAtual: string, statusDestino?: string): boolean {
    const status = this.normalizarTexto(statusAtual);
    const destino = this.normalizarTexto(statusDestino);

    switch (acao) {
      case 'CriarRequisicaoCompra':
      case 'RegistrarHistoricoOperacional':
        return true;
      case 'AtualizarRequisicaoCompra':
      case 'AtualizarStatusRequisicao':
        if (destino && destino === 'aguardandoaprovacao') {
          return ['aberta', 'recebida', 'novarascunho', 'novasolicitacao', 'aguardandocotacao', 'emcotacao', 'cotada'].indexOf(status) >= 0;
        }
        return ['novarascunho', 'novasolicitacao', 'aguardandocotacao', 'emcotacao', 'cotada', 'aguardandoaprovacao'].indexOf(status) >= 0;
      case 'CriarSnapshotAprovacaoOperacional':
        return ['cotada', 'aguardandoaprovacao'].indexOf(status) >= 0;
      case 'AprovarCompra':
        return ['cotada', 'aguardandoaprovacao'].indexOf(status) >= 0 && destino === this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A);
      case 'CriarPedidoCompra':
        return ['aprovadaparacompra', 'aprovada'].indexOf(status) >= 0;
      case 'VincularNotaFiscal':
        return ['aprovadaparacompra', 'pedidoemitido', 'comprarealizadaaguardandonf'].indexOf(status) >= 0;
      case 'ProgramarPagamento':
        return ['aprovadaparacompra', 'nfvinculada', 'aguardandoprogramacaofinanceira'].indexOf(status) >= 0;
      default:
        return false;
    }
  }

  private validarPayloadRequisicao(payload: RequisicaoCompraControladaPayload): AlertaBloqueioEscrita[] {
    const alertas: AlertaBloqueioEscrita[] = [];

    if (!payload.titulo || payload.titulo.indexOf(payload.marcadorTeste) < 0) {
      alertas.push({ codigo: 'TITULO_SEM_MARCADOR_TESTE', mensagem: `Titulo deve conter ${payload.marcadorTeste}.` });
    }

    if (!payload.obraItemId || payload.obraItemId <= 0) {
      alertas.push({ codigo: 'OBRA_OBRIGATORIA', mensagem: 'obraItemId deve ser informado.' });
    }

    if (!payload.descricao) {
      alertas.push({ codigo: 'DESCRICAO_OBRIGATORIA', mensagem: 'Descricao deve ser informada.' });
    }

    if (!payload.dataNecessaria) {
      alertas.push({ codigo: 'DATA_NECESSARIA_OBRIGATORIA', mensagem: 'Data necessaria deve ser informada.' });
    }

    return alertas;
  }

  private criarResultadoOperacionalBloqueado(acao: AcaoOperacionalV27A, mensagem: string, alertas: AlertaBloqueioEscrita[], itemId?: number, statusAnterior?: string): ResultadoOperacionalV27A {
    return {
      sucesso: false,
      bloqueado: true,
      acao,
      mensagem,
      itemId,
      statusAnterior,
      alertas
    };
  }

  private async obterResumoItemOperacional(listId: string, itemId: number, statusField: string): Promise<{ title: string; status: string }> {
    const endpoint = `${this.getListItemsEndpoint(listId)}(${itemId})?$select=Id,Title,${statusField}`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const item = await this.ensureJson(response);

    return {
      title: item.Title || '',
      status: item[statusField] || ''
    };
  }

  private async obterRequisicaoOperacionalParaPreValidacao(itemId: number): Promise<ResultadoLeituraItemOperacionalV27A> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${itemId})?$select=${LISTA_02_REQUISICOES_COMPRA_SELECT_PREVALIDACAO.join(',')}`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const statusHttp = response.status;

    if (!response.ok) {
      return {
        statusHttp,
        erro: `REST Lista 02 por GUID retornou ${response.status}: ${response.statusText}`
      };
    }

    try {
      const item = await response.json();
      const snapshot = await this.obterSnapshotAprovacaoCompraOpcional(itemId);
      return {
        item,
        statusHttp,
        camposRetornados: Object.keys(item || {}).sort(),
        snapshotExistenteId: snapshot.snapshotExistenteId,
        snapshotExistenteTitulo: snapshot.snapshotExistenteTitulo,
        erro: snapshot.erro
      };
    } catch (error) {
      return {
        statusHttp,
        erro: `Erro de parsing da leitura do item ${itemId}: ${this.getErrorMessage(error)}`
      };
    }
  }

  private async obterSnapshotAprovacaoCompraOpcional(itemId: number): Promise<{ snapshotExistenteId?: number; snapshotExistenteTitulo?: string; erro?: string }> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${itemId})?$select=Id,SnapshotAprovacaoCompra/Id,SnapshotAprovacaoCompra/Title&$expand=SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      return { erro: `SnapshotAprovacaoCompra nao resolvido: ${response.status} ${response.statusText}` };
    }

    try {
      const item = await response.json();
      return {
        snapshotExistenteId: item?.SnapshotAprovacaoCompra?.Id ? Number(item.SnapshotAprovacaoCompra.Id) : undefined,
        snapshotExistenteTitulo: item?.SnapshotAprovacaoCompra?.Title
      };
    } catch (error) {
      return { erro: `SnapshotAprovacaoCompra nao parseado: ${this.getErrorMessage(error)}` };
    }
  }

  private obterCamposComMarcadorV27A(item: any, marcador: string): string[] {
    return LISTA_02_REQUISICOES_COMPRA_CAMPOS_MARCADOR.filter((campo) => String(item?.[campo] || '').indexOf(marcador) >= 0);
  }

  private obterValoresCamposMarcadorV27A(item: any): string[] {
    return LISTA_02_REQUISICOES_COMPRA_CAMPOS_MARCADOR.map((campo) => `${campo}: ${String(item?.[campo] || '-')}`);
  }

  private obterAprovacaoNecessaria(item: any): { campo?: string; valorBruto: unknown; normalizado: boolean | null } {
    if (!item) {
      return { valorBruto: undefined, normalizado: null };
    }

    for (const campo of LISTA_02_REQUISICOES_COMPRA_CAMPOS_APROVACAO_NECESSARIA) {
      if (Object.prototype.hasOwnProperty.call(item, campo)) {
        const valorBruto = item[campo];
        return {
          campo,
          valorBruto,
          normalizado: this.normalizarBooleanoSharePoint(valorBruto)
        };
      }
    }

    return { valorBruto: undefined, normalizado: null };
  }

  private normalizarBooleanoSharePoint(valor: unknown): boolean | null {
    if (valor === undefined || valor === null) {
      return null;
    }

    if (typeof valor === 'boolean') {
      return valor;
    }

    if (typeof valor === 'number') {
      if (valor === 1) {
        return true;
      }
      if (valor === 0) {
        return false;
      }
      return null;
    }

    if (Array.isArray(valor)) {
      for (const item of valor) {
        const normalizado = this.normalizarBooleanoSharePoint(item);
        if (normalizado !== null) {
          return normalizado;
        }
      }
      return null;
    }

    if (typeof valor === 'object') {
      const objeto = valor as { Label?: unknown; Value?: unknown; Title?: unknown; results?: unknown };
      for (const candidato of [objeto.Label, objeto.Value, objeto.Title, objeto.results]) {
        const normalizado = this.normalizarBooleanoSharePoint(candidato);
        if (normalizado !== null) {
          return normalizado;
        }
      }
      return null;
    }

    const texto = this.normalizarTexto(String(valor));
    if (['true', 'sim', 'yes', '1'].indexOf(texto) >= 0) {
      return true;
    }

    if (['false', 'nao', 'no', '0'].indexOf(texto) >= 0) {
      return false;
    }

    return null;
  }

  private formatarValorBrutoSharePoint(valor: unknown): string {
    if (valor === undefined || valor === null) {
      return '';
    }

    if (typeof valor === 'object') {
      try {
        return JSON.stringify(valor);
      } catch (error) {
        return this.getErrorMessage(error);
      }
    }

    return String(valor);
  }

  private statusRequisicaoMapeadoV27A(status: string | undefined): boolean {
    const normalizado = this.normalizarTexto(status);
    return LISTA_02_STATUS_REQUISICAO_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private statusPedidoInicialMapeadoV27A(status: string | undefined): boolean {
    const normalizado = this.normalizarTexto(status || LISTA_03_PEDIDOS_COMPRA_STATUS_INICIAL);
    return LISTA_03_PEDIDOS_COMPRA_STATUS_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private criarTituloPedidoV27A(itemId: number, config: ConfiguracaoTesteOperacionalV27A, dataReferencia: Date = new Date()): string {
    const configurado = String(config.tituloPedidoTesteV27A || '').trim();
    if (configurado) {
      return configurado;
    }

    return `PED-V2.7A-TESTE-${itemId}-${this.formatTimestampCompacto(dataReferencia)}`;
  }

  private formatTimestampCompacto(data: Date): string {
    return data.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  }

  private obterNumeroRequisicaoPedidoV27A(item: any, itemId: number): string {
    const title = String(item?.Title || '').trim();
    if (title) {
      return title;
    }

    return `V2.7A-TESTE-${itemId}`;
  }

  private async obterFornecedorTestePedidoV27A(fornecedorId: number): Promise<FornecedorTestePedidoV27A> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.fornecedoresPrestadores)}(${fornecedorId})?$select=Id,Title,CNPJ_x002f_CPF,NomeFantasia`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Fornecedor0Id ${fornecedorId} nao resolvido na Lista 06: ${response.status} ${response.statusText}`);
    }

    const item = await response.json();
    return {
      id: Number(item.Id || fornecedorId),
      title: item.Title || '',
      lookup: item.CNPJ_x002f_CPF || item.NomeFantasia || item.Title || String(fornecedorId)
    };
  }

  private async obterPedidoExistenteV27A(numeroRequisicao: string, itemId: number): Promise<PedidoCompraExistenteV27A | undefined> {
    const escaped = this.escapeOData(numeroRequisicao);
    const prefixoTitulo = this.escapeOData(`PED-V2.7A-TESTE-${itemId}`);
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.pedidosCompra)}?$top=1&$select=Id,Title,${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD}&$filter=${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD} eq '${escaped}' or substringof('${prefixoTitulo}',Title)`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Consulta de pedido existente na Lista 03 retornou ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const item = payload.value?.[0];
    return item
      ? {
        id: Number(item.Id),
        title: item.Title || '',
        vinculoTextual: item[LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD] || ''
      }
      : undefined;
  }

  private statusNotaFiscalInicialMapeadoV27A(status: string | undefined): boolean {
    const normalizado = this.normalizarTexto(status || LISTA_04_NOTAS_FISCAIS_STATUS_INICIAL);
    return LISTA_04_STATUS_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private tipoNotaFiscalMapeadoV27A(tipo: string | undefined): boolean {
    const normalizado = this.normalizarTexto(tipo || LISTA_04_NOTAS_FISCAIS_TIPO_INICIAL);
    return LISTA_04_TIPO_NF_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private enviadaContabilidadeMapeadoV27A(valor: string | undefined): boolean {
    const normalizado = this.normalizarTexto(valor || LISTA_04_NOTAS_FISCAIS_CONTABILIDADE_INICIAL);
    return LISTA_04_ENVIADA_CONTABILIDADE_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private statusPedidoElegivelParaNotaFiscalV27A(status: string | undefined): boolean {
    const normalizado = this.normalizarTexto(status);
    return [
      'emelaboracao',
      'aguardandoaprovacao',
      'aprovado',
      'enviadoaofornecedor',
      'aguardandoentrega',
      'entregueparcial',
      'entreguetotal'
    ].indexOf(normalizado) >= 0;
  }

  private criarTituloNotaFiscalV27A(pedidoId: number, config: ConfiguracaoTesteOperacionalV27A, dataReferencia: Date = new Date()): string {
    const configurado = String(config.numeroNotaFiscalTesteV27A || '').trim().replace(/\s+/g, '-');
    const sufixo = configurado || 'NF-V2.7A-TESTE';
    return `NF-V2.7A-TESTE-PED-${pedidoId}-${sufixo}-${this.formatTimestampCompacto(dataReferencia)}`;
  }

  private async obterPedidoOrigemNotaFiscalV27A(pedidoId: number): Promise<PedidoOrigemNotaFiscalV27A> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.pedidosCompra)}(${pedidoId})?$select=Id,Title,${LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD},ValordoPedido,StatusdoPedido,CentrodeCusto,ObraId,Fornecedor0/Id,Fornecedor0/Title&$expand=Fornecedor0`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Pedido ${pedidoId} nao resolvido na Lista 03: ${response.status} ${response.statusText}`);
    }

    const item = await response.json();
    return {
      id: Number(item.Id || pedidoId),
      title: item.Title || '',
      numeroRequisicao: item[LISTA_03_PEDIDOS_COMPRA_REQUISICAO_FIELD] || '',
      valor: Number(item.ValordoPedido || 0),
      status: item.StatusdoPedido || '',
      fornecedorId: Number(item.Fornecedor0?.Id || 0) || undefined,
      fornecedorTitulo: item.Fornecedor0?.Title || '',
      obraId: Number(item.ObraId || 0) || undefined,
      centroCusto: item.CentrodeCusto || ''
    };
  }

  private obterVinculoPedidoNotaFiscalV27A(pedido: PedidoOrigemNotaFiscalV27A): string {
    return String(pedido.title || `PED-${pedido.id}`).trim();
  }

  private async obterNotaFiscalExistenteV27A(vinculoPedido: string, numeroNotaFiscal: string): Promise<NotaFiscalExistenteV27A | undefined> {
    const pedidoEscaped = this.escapeOData(vinculoPedido);
    const numeroEscaped = this.escapeOData(numeroNotaFiscal);
    const prefixoTitulo = this.escapeOData('NF-V2.7A-TESTE-PED');
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.notasFiscaisRecebidas)}?$top=1&$select=Id,Title,${LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD},${LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD}&$filter=${LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD} eq '${pedidoEscaped}' or ${LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD} eq '${numeroEscaped}' or substringof('${prefixoTitulo}',Title)`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Consulta de NF existente na Lista 04 retornou ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const item = payload.value?.[0];
    return item
      ? {
        id: Number(item.Id),
        title: item.Title || '',
        numeroPedido: item[LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD] || '',
        numeroNotaFiscal: item[LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD] || ''
      }
      : undefined;
  }

  private statusPagamentoInicialMapeadoV27A(status: string | undefined): boolean {
    const normalizado = this.normalizarTexto(status || LISTA_10_PAGAMENTO_STATUS_INICIAL);
    return LISTA_10_PAGAMENTO_STATUS_CHOICES_CONFIRMADOS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private formaPagamentoMapeadaV27A(forma: string | undefined): boolean {
    const normalizado = this.normalizarTexto(forma || LISTA_10_PAGAMENTO_FORMA_INICIAL);
    return LISTA_10_PAGAMENTO_FORMA_CHOICES_CONFIRMADAS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private contaPagamentoMapeadaV27A(conta: string | undefined): boolean {
    const normalizado = this.normalizarTexto(conta || LISTA_10_PAGAMENTO_CONTA_INICIAL);
    return LISTA_10_PAGAMENTO_CONTA_CHOICES_CONFIRMADAS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private categoriaPagamentoMapeadaV27A(categoria: string | undefined): boolean {
    const normalizado = this.normalizarTexto(categoria || LISTA_10_PAGAMENTO_CATEGORIA_INICIAL);
    return LISTA_10_PAGAMENTO_CATEGORIA_CHOICES_CONFIRMADAS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private origemPagamentoMapeadaV27A(origem: string | undefined): boolean {
    const normalizado = this.normalizarTexto(origem || LISTA_10_PAGAMENTO_ORIGEM_INICIAL);
    return LISTA_10_PAGAMENTO_ORIGEM_CHOICES_CONFIRMADAS
      .some((choice) => this.normalizarTexto(choice) === normalizado);
  }

  private criarTituloPagamentoV27A(notaFiscalId: number, config: ConfiguracaoTesteOperacionalV27A, dataReferencia: Date = new Date()): string {
    const configurado = String(config.numeroNotaFiscalTesteV27A || '').trim().replace(/\s+/g, '-');
    const sufixo = configurado || `NF-${notaFiscalId}`;
    return `PAG-V2.7A-TESTE-NF-${notaFiscalId}-${sufixo}-${this.formatTimestampCompacto(dataReferencia)}`;
  }

  private async obterNotaFiscalOrigemPagamentoV27A(notaFiscalId: number): Promise<NotaFiscalOrigemPagamentoV27A> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.notasFiscaisRecebidas)}(${notaFiscalId})?$select=Id,Title,${LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD},${LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD},${LISTA_04_NOTAS_FISCAIS_STATUS_FIELD},${LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD},${LISTA_04_NOTAS_FISCAIS_VALOR_FIELD},${LISTA_04_NOTAS_FISCAIS_DATA_EMISSAO_FIELD},${LISTA_04_NOTAS_FISCAIS_DATA_VENCIMENTO_FIELD},${LISTA_04_NOTAS_FISCAIS_LINK_FIELD},CentrodeCusto,ObraId,Fornecedor0/Id,Fornecedor0/Title&$expand=Fornecedor0`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`NF ${notaFiscalId} nao resolvida na Lista 04: ${response.status} ${response.statusText}`);
    }

    const item = await response.json();
    return {
      id: Number(item.Id || notaFiscalId),
      title: item.Title || '',
      numeroNotaFiscal: item[LISTA_04_NOTAS_FISCAIS_NUMERO_FIELD] || '',
      numeroPedido: item[LISTA_04_NOTAS_FISCAIS_PEDIDO_FIELD] || '',
      statusConferencia: item[LISTA_04_NOTAS_FISCAIS_STATUS_FIELD] || '',
      enviadaContabilidade: item[LISTA_04_NOTAS_FISCAIS_ENVIADA_CONTABILIDADE_FIELD] || '',
      valorBruto: Number(item[LISTA_04_NOTAS_FISCAIS_VALOR_FIELD] || 0),
      dataEmissao: item[LISTA_04_NOTAS_FISCAIS_DATA_EMISSAO_FIELD],
      dataVencimento: item[LISTA_04_NOTAS_FISCAIS_DATA_VENCIMENTO_FIELD],
      fornecedorId: Number(item.Fornecedor0?.Id || 0) || undefined,
      fornecedorTitulo: item.Fornecedor0?.Title || '',
      obraId: Number(item.ObraId || 0) || undefined,
      centroCusto: item.CentrodeCusto || '',
      linkNotaFiscal: this.extrairUrlSharePoint(item[LISTA_04_NOTAS_FISCAIS_LINK_FIELD])
    };
  }

  private async obterPagamentoExistenteV27A(numeroNotaFiscal: string, notaFiscalId: number): Promise<PagamentoExistenteV27A | undefined> {
    const numeroEscaped = this.escapeOData(numeroNotaFiscal);
    const prefixoTitulo = this.escapeOData(`PAG-V2.7A-TESTE-NF-${notaFiscalId}`);
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.programacaoFinanceira)}?$top=1&$select=Id,Title,${LISTA_10_PAGAMENTO_NUMERO_NF_FIELD}&$filter=${LISTA_10_PAGAMENTO_NUMERO_NF_FIELD} eq '${numeroEscaped}' or substringof('${prefixoTitulo}',Title)`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Consulta de pagamento existente na Lista 10 retornou ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const item = payload.value?.[0];
    return item
      ? {
        id: Number(item.Id),
        title: item.Title || '',
        numeroNotaFiscal: item[LISTA_10_PAGAMENTO_NUMERO_NF_FIELD] || ''
      }
      : undefined;
  }

  private async obterPagamentoCriadoV27A(pagamentoId: number): Promise<{ numeroNotaFiscal: string; status: string; valorBruto: number }> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.programacaoFinanceira)}(${pagamentoId})?$select=Id,${LISTA_10_PAGAMENTO_NUMERO_NF_FIELD},${LISTA_10_PAGAMENTO_STATUS_FIELD},${LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD}`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    if (!response.ok) {
      throw new Error(`Pagamento ${pagamentoId} nao resolvido apos criacao na Lista 10: ${response.status} ${response.statusText}`);
    }

    const item = await response.json();
    return {
      numeroNotaFiscal: item[LISTA_10_PAGAMENTO_NUMERO_NF_FIELD] || '',
      status: item[LISTA_10_PAGAMENTO_STATUS_FIELD] || '',
      valorBruto: Number(item[LISTA_10_PAGAMENTO_VALOR_BRUTO_FIELD] || 0)
    };
  }

  private extrairUrlSharePoint(valor: unknown): string | undefined {
    if (!valor) {
      return undefined;
    }

    if (typeof valor === 'string') {
      return valor;
    }

    if (typeof valor === 'object') {
      const objeto = valor as { Url?: unknown; url?: unknown; Description?: unknown };
      const url = objeto.Url || objeto.url;
      return url ? String(url) : undefined;
    }

    return undefined;
  }

  private addDays(data: Date, dias: number): Date {
    const novaData = new Date(data.getTime());
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
  }

  private usuarioCorrespondeAoAprovadorSnapshotV27A(usuario: IUsuarioPerfilEnac, snapshot: ISnapshotRegraEnac): boolean {
    const candidatosUsuario = [
      usuario.id,
      usuario.usuarioInternoId,
      usuario.nome,
      usuario.emailCorporativo,
      usuario.contaMicrosoft365Email,
      usuario.contaMicrosoft365Nome,
      usuario.contaMicrosoft365Login
    ].map((value) => this.normalizarTexto(value));
    const candidatosSnapshot = [
      snapshot.aprovadorEfetivoId,
      snapshot.aprovadorEfetivoNome,
      snapshot.aprovadorEfetivoEmail,
      snapshot.aprovadorBaseId,
      snapshot.aprovadorBaseNome,
      snapshot.aprovadorBaseEmail
    ].map((value) => this.normalizarTexto(value)).filter(Boolean);

    return candidatosSnapshot.some((value) => candidatosUsuario.indexOf(value) >= 0);
  }

  private usuarioPodeAprovarComoDiretoriaSuperiorV27A(usuario: IUsuarioPerfilEnac, statusAtual: string, statusDestino: string, snapshotExistenteId: number | undefined): boolean {
    return Boolean(
      usuario.usuarioAtivo &&
      usuario.perfilPrincipal === 'Diretoria' &&
      this.perfilPodeExecutarAcao('AprovarCompra', usuario) &&
      this.normalizarTexto(statusAtual) === 'aguardandoaprovacao' &&
      this.normalizarTexto(statusDestino) === this.normalizarTexto(STATUS_APROVADO_COMPRA_V27A) &&
      snapshotExistenteId
    );
  }

  private normalizarTexto(value: string | undefined): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/\//g, '')
      .toLowerCase();
  }

  private validarControleEscritaTeste(input: SnapshotCriacaoTesteInput): AlertaBloqueioEscrita[] {
    const alertas: AlertaBloqueioEscrita[] = [];

    if (!input.modoEscritaTeste) {
      alertas.push({ codigo: 'MODO_ESCRITA_TESTE_DESABILITADO', mensagem: 'modoEscritaTeste deve ser true.' });
    }

    if (input.confirmacao !== CONFIRMACAO_ESCRITA_TESTE) {
      alertas.push({ codigo: 'CONFIRMACAO_INVALIDA', mensagem: `Confirmacao exigida: ${CONFIRMACAO_ESCRITA_TESTE}.` });
    }

    if (MARCADORES_TESTE_PERMITIDOS.indexOf(input.marcadorTeste) < 0) {
      alertas.push({ codigo: 'MARCADOR_TESTE_INVALIDO', mensagem: 'Somente V2.3B-TESTE ou V2.6A-TESTE sao aceitos.' });
    }

    if (!input.requisicaoItemId || input.requisicaoItemId <= 0) {
      alertas.push({ codigo: 'REQUISICAO_INVALIDA', mensagem: 'requisicaoItemId deve ser informado.' });
    }

    if (!input.valorAnalisado || input.valorAnalisado <= 0) {
      alertas.push({ codigo: 'VALOR_INVALIDO', mensagem: 'valorAnalisado deve ser maior que zero.' });
    }

    return alertas;
  }

  private criarResultadoBloqueado(requisicaoItemId: number, mensagem: string, alertas: AlertaBloqueioEscrita[]): SnapshotCriacaoTesteResultado {
    return {
      sucesso: false,
      bloqueado: true,
      status: 'Bloqueada',
      mensagem,
      requisicaoItemId,
      alertas
    };
  }

  private async obterRequisicaoTesteParaEscrita(requisicaoId: number, marcadorTeste: string): Promise<any> {
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}(${requisicaoId})?$select=Id,Title,Obra/Id,SnapshotAprovacaoCompra/Id,SnapshotAprovacaoCompra/Title&$expand=Obra,SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const item = await this.ensureJson(response);
    const title = String(item.Title || '');

    if (title.indexOf(marcadorTeste) < 0 && title.indexOf('V2.3B-TESTE') < 0 && title.indexOf('V2.6A-TESTE') < 0) {
      throw new Error('Requisicao alvo nao contem marcador de teste no Title. Escrita bloqueada.');
    }

    return item;
  }

  private detectarMarcadorTeste(title: string): 'V2.3B-TESTE' | 'V2.6A-TESTE' | undefined {
    if (title.indexOf('V2.6A-TESTE') >= 0) {
      return 'V2.6A-TESTE';
    }

    if (title.indexOf('V2.3B-TESTE') >= 0) {
      return 'V2.3B-TESTE';
    }

    return undefined;
  }

  private criarPostOptions(body: unknown): ISPHttpClientOptions {
    return {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata'
      },
      body: JSON.stringify(body)
    };
  }

  private criarMergeOptions(body: unknown): ISPHttpClientOptions {
    return {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata',
        'IF-MATCH': '*',
        'X-HTTP-Method': 'MERGE'
      },
      body: JSON.stringify(body)
    };
  }

  private mapUsuarioPerfil(item: any): IUsuarioPerfilEnac {
    return {
      id: String(item.Id),
      usuarioInternoId: item.UsuarioInternoId,
      nome: item.Title,
      emailCorporativo: item.EmailCorporativo,
      contaMicrosoft365Id: Number(item.ContaMicrosoft365?.Id || 0),
      contaMicrosoft365Nome: item.ContaMicrosoft365?.Title || '',
      contaMicrosoft365Email: item.ContaMicrosoft365?.EMail || '',
      contaMicrosoft365Login: item.ContaMicrosoft365?.Name,
      cargoFuncao: item.CargoFuncao || '',
      perfilPrincipal: this.mapPerfilChoiceParaInternal(item.PerfilPrincipal),
      perfisAdicionais: item.PerfisAdicionais ? String(item.PerfisAdicionais).split(';').filter(Boolean).map((perfil: string) => this.mapPerfilChoiceParaInternal(perfil)) : [],
      podeCriarSolicitacao: Boolean(item.PodeCriarSolicitacao),
      podeRegistrarCotacoes: Boolean(item.PodeRegistrarCotacoes),
      podeAprovarCompras: Boolean(item.PodeAprovarCompras),
      podeEmitirPedido: Boolean(item.PodeEmitirPedido),
      podeVincularNf: Boolean(item.PodeVincularNF),
      podeProgramarPagamento: Boolean(item.PodeProgramarPagamento),
      podeLiberarPagamento: Boolean(item.PodeLiberarPagamento),
      podeAtualizarStatusFinal: Boolean(item.PodeAtualizarStatusFinal),
      podeAdministrarConfiguracoes: Boolean(item.PodeAdministrarConfiguracoes),
      usuarioAtivo: Boolean(item.UsuarioAtivo),
      substitutoTemporarioId: String(item.SubstitutoTemporario?.Id || ''),
      substitutoTemporarioNome: item.SubstitutoTemporario?.Title,
      substitutoTemporarioEmail: undefined,
      inicioSubstituicao: item.InicioSubstituicao,
      fimSubstituicao: item.FimSubstituicao,
      observacoes: item.Observacoes,
      criadoPor: item.Author?.Title,
      criadoEm: item.Created,
      alteradoPor: item.Editor?.Title,
      alteradoEm: item.Modified
    };
  }

  private mapAlcada(item: any, usuarios: IUsuarioPerfilEnac[] = []): IAlcadaEnac {
    const aprovadorPrincipalId = String(item.AprovadorPrincipal?.Id || item.AprovadorPrincipalId || '');
    const aprovadorAdicionalId = item.AprovadorAdicional?.Id ? String(item.AprovadorAdicional.Id) : undefined;
    const aprovadorPrincipal = this.encontrarUsuarioPorLookup(aprovadorPrincipalId, item.AprovadorPrincipal?.Title, usuarios);
    const aprovadorAdicional = this.encontrarUsuarioPorLookup(aprovadorAdicionalId, item.AprovadorAdicional?.Title, usuarios);

    return {
      id: String(item.Id),
      regraInternaId: item.RegraInternaId,
      processo: item.Processo,
      tipoSolicitacao: item.TipoSolicitacao,
      obra: item.Obra?.Id ? String(item.Obra.Id) : item.Obra || 'Todas',
      obraId: item.Obra?.Id ? String(item.Obra.Id) : item.ObraId ? String(item.ObraId) : undefined,
      valorMinimo: Number(item.ValorMinimo || 0),
      valorMaximo: item.Ilimitado ? undefined : Number(item.ValorMaximo || 0),
      ilimitado: Boolean(item.Ilimitado),
      aprovadorPrincipalId: aprovadorPrincipal?.id || aprovadorPrincipalId,
      aprovadorPrincipalNome: aprovadorPrincipal?.nome || item.AprovadorPrincipal?.Title,
      aprovadorPrincipalEmail: aprovadorPrincipal?.emailCorporativo,
      exigeAprovacaoAdicional: Boolean(item.ExigeAprovacaoAdicional),
      aprovadorAdicionalId: aprovadorAdicional?.id || aprovadorAdicionalId,
      aprovadorAdicionalNome: aprovadorAdicional?.nome || item.AprovadorAdicional?.Title,
      aprovadorAdicionalEmail: aprovadorAdicional?.emailCorporativo,
      vigenciaInicial: item.VigenciaInicial,
      vigenciaFinal: item.VigenciaFinal,
      ativa: Boolean(item.Ativo),
      observacoes: item.Observacoes
    };
  }

  private enriquecerSubstitutoTemporario(usuario: IUsuarioPerfilEnac, usuarios: IUsuarioPerfilEnac[]): IUsuarioPerfilEnac {
    if (!usuario.substitutoTemporarioId) {
      return usuario;
    }

    const substituto = this.encontrarUsuarioPorLookup(usuario.substitutoTemporarioId, usuario.substitutoTemporarioNome, usuarios);

    return substituto ? {
      ...usuario,
      substitutoTemporarioId: substituto.usuarioInternoId || substituto.id,
      substitutoTemporarioNome: substituto.nome,
      substitutoTemporarioEmail: substituto.emailCorporativo
    } : usuario;
  }

  private encontrarUsuarioPorLookup(lookupId: string | undefined, lookupTitle: string | undefined, usuarios: IUsuarioPerfilEnac[]): IUsuarioPerfilEnac | undefined {
    if (!lookupId && !lookupTitle) {
      return undefined;
    }

    return usuarios.find((usuario) =>
      usuario.id === lookupId ||
      usuario.usuarioInternoId === lookupId ||
      Boolean(lookupTitle && usuario.nome === lookupTitle)
    );
  }

  private regraVigenteNaData(regra: IAlcadaEnac, data: Date): boolean {
    const inicio = new Date(regra.vigenciaInicial);
    const fim = regra.vigenciaFinal ? new Date(regra.vigenciaFinal) : undefined;
    return data >= inicio && (!fim || data <= fim);
  }

  private escapeOData(value: string): string {
    return value.replace(/'/g, "''");
  }

  private getListItemsEndpoint(listId: string): string {
    return `${this.siteUrl}/_api/web/lists(guid'${listId}')/items`;
  }

  private mapTipoSolicitacao(value: string): TipoSolicitacaoEnac {
    switch (value) {
      case 'Serviço':
      case 'Servico':
        return 'Servico';
      case 'Locação':
      case 'Locacao':
        return 'Locacao';
      case 'Equipamento':
        return 'Equipamento';
      default:
        return 'Material';
    }
  }

  private mapStatusProcesso(value: string): ISolicitacaoEnac['status'] {
    switch (value) {
      case 'Aprovada para compra':
        return 'AprovadaParaCompra';
      case 'Pedido emitido':
        return 'PedidoEmitido';
      case 'Pagamento concluído':
      case 'Pagamento concluido':
        return 'PagoConcluido';
      case 'Cancelada':
        return 'Cancelada';
      case 'Reprovada':
        return 'Reprovada';
      default:
        return 'AguardandoAprovacao';
    }
  }

  private mapSnapshot(item: any): ISnapshotRegraEnac {
    return {
      id: String(item.Id),
      regraAlcadaUtilizada: item.RegraInternaId || '',
      processo: item.Processo || '',
      faixaValorVigente: item.FaixaValorVigente || '',
      valorAnalisado: Number(item.ValorAnalisado || 0),
      aprovadorBaseId: item.AprovadorBaseId || '',
      aprovadorBaseNome: item.AprovadorBaseNome || '',
      aprovadorBaseEmail: item.AprovadorBaseEmail || '',
      aprovadorEfetivoId: item.AprovadorEfetivoId || '',
      aprovadorEfetivoNome: item.AprovadorEfetivoNome || '',
      aprovadorEfetivoEmail: item.AprovadorEfetivoEmail || '',
      substituicaoAplicada: Boolean(item.SubstituicaoAplicada),
      motivoResolucaoAprovador: item.MotivoResolucaoAprovador || '',
      dataHoraAplicacao: item.DataHoraAplicacao || ''
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async ensureJson(response: SPHttpClientResponse): Promise<any> {
    if (!response.ok) {
      throw new Error(`SharePoint retornou ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
