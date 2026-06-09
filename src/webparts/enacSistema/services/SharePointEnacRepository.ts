import { ISPHttpClientOptions, SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  AcaoOperacionalV27A,
  AlertaBloqueioEscrita,
  AtualizacaoRequisicaoCompraControladaPayload,
  ConfiguracaoTesteOperacionalV27A,
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
  ResultadoOperacionalV27A,
  ResultadoHistoricoConfiguracao,
  ResultadoVinculoSnapshot,
  SnapshotAprovacaoOperacionalPayload,
  SnapshotCriacaoTesteInput,
  SnapshotCriacaoTesteResultado,
  TipoSolicitacaoEnac
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
  snapshotsRegras: '767e1867-8a98-46be-9dcc-be53a12c51aa'
};

const CONFIRMACAO_ESCRITA_TESTE = 'TESTAR-ESCRITA-V2.6A-ENAC';
const MARCADORES_TESTE_PERMITIDOS = ['V2.3B-TESTE', 'V2.6A-TESTE'];
const CONFIRMACAO_OPERACIONAL_V27A = 'CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC';
const MARCADOR_OPERACIONAL_V27A = 'V2.7A-TESTE';
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
    let snapshotPrevistoTitulo: string | undefined;
    let criaraSnapshot = false;
    let vincularaSnapshotAprovacaoCompra = false;
    let registraraHistorico = false;
    let aprovacaoNecessariaCampo: string | undefined;
    let aprovacaoNecessariaValorBruto: string | undefined;
    let aprovacaoNecessariaNormalizada: 'Sim' | 'Nao' | 'Nao resolvido' | undefined;

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

    const podeExecutar = Boolean(alertas.length === 0 && usuarioAtual && item && marcadorEncontrado && transicaoPermitida && camposObrigatoriosPresentes);

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
      snapshotPrevistoTitulo,
      criaraSnapshot,
      vincularaSnapshotAprovacaoCompra,
      registraraHistorico,
      historicoPrevisto: item ? `${flags.marcadorTesteOperacionalV27A} ${acaoPretendida} ${itemTesteId}` : undefined,
      listaAlterada: LISTA_02_REQUISICOES_COMPRA_TITULO,
      campoAlterado: acaoPretendida === 'AtualizarStatusRequisicao' || acaoPretendida === 'AtualizarRequisicaoCompra' ? 'StatusdaRequisi_x00e7__x00e3_o' : 'ENAC Snapshots Regras',
      valorAnteriorPrevisto: statusAtual,
      valorNovoPrevisto: acaoPretendida === 'AtualizarStatusRequisicao' || acaoPretendida === 'AtualizarRequisicaoCompra' ? statusDestino : `Snapshot V2.7A para ${config.valorTesteOperacionalV27A || 0}`,
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

  public async criarPedidoCompraControlado(payload: PedidoCompraControladoPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const requisicao = await this.obterResumoItemOperacional(LISTAS_ENAC.requisicoesCompra, payload.requisicaoItemId, 'StatusdaRequisi_x00e7__x00e3_o');
    const alertas = this.validarPermissaoAcao('CriarPedidoCompra', requisicao, usuario, flags);

    if (!payload.numeroPedido) {
      alertas.push({ codigo: 'NUMERO_PEDIDO_OBRIGATORIO', mensagem: 'Numero do pedido deve ser informado.' });
    }

    if (payload.marcadorTeste !== flags.marcadorTesteOperacionalV27A) {
      alertas.push({ codigo: 'MARCADOR_PAYLOAD_INVALIDO', mensagem: 'Pedido deve usar marcador V2.7A-TESTE.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('CriarPedidoCompra', 'Criacao de pedido bloqueada.', alertas);
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.pedidosCompra),
      SPHttpClient.configurations.v1,
      this.criarPostOptions({
        Title: `${payload.marcadorTeste} ${payload.numeroPedido}`,
        SolicitacaoId: payload.requisicaoItemId,
        Fornecedor: payload.fornecedor,
        ValordoPedido: payload.valorPedido,
        DatadoPedido: new Date().toISOString(),
        StatusdoPedido: 'Pedido emitido'
      })
    );
    const item = await this.ensureJson(response);
    return {
      sucesso: true,
      bloqueado: false,
      acao: 'CriarPedidoCompra',
      mensagem: 'Pedido de compra V2.7A-TESTE criado.',
      itemId: Number(item.Id || item.ID),
      alertas: []
    };
  }

  public async vincularNotaFiscalControlada(id: number, payload: NotaFiscalControladaPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const alertas = this.validarPermissaoAcao('VincularNotaFiscal', { title: `${payload.marcadorTeste} ${payload.numeroNf}`, status: 'Pedido emitido' }, usuario, flags);

    if (!payload.numeroNf || payload.valor <= 0) {
      alertas.push({ codigo: 'NF_INCOMPLETA', mensagem: 'Numero e valor da NF sao obrigatorios.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('VincularNotaFiscal', 'Vinculo de NF bloqueado.', alertas, id);
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.notasFiscaisRecebidas),
      SPHttpClient.configurations.v1,
      this.criarPostOptions({
        Title: `${payload.marcadorTeste} ${payload.numeroNf}`,
        N_x00ba_daNotaFiscal: payload.numeroNf,
        ValorBrutodaNF: payload.valor,
        DatadeEmiss_x00e3_o: payload.dataEmissao,
        DatadeVencimento: payload.dataVencimento,
        StatusdaConfer_x00ea_ncia: 'Recebida'
      })
    );
    const item = await this.ensureJson(response);
    return {
      sucesso: true,
      bloqueado: false,
      acao: 'VincularNotaFiscal',
      mensagem: 'Nota fiscal V2.7A-TESTE vinculada.',
      itemId: Number(item.Id || item.ID),
      alertas: []
    };
  }

  public async programarPagamentoControlado(id: number, payload: ProgramacaoPagamentoControladaPayload, emailOuLogin: string, flags: FlagsEscritaOperacionalV27A): Promise<ResultadoOperacionalV27A> {
    const usuario = await this.carregarPerfilUsuarioAtual(emailOuLogin);
    const alertas = this.validarPermissaoAcao('ProgramarPagamento', { title: payload.marcadorTeste, status: 'NF vinculada' }, usuario, flags);

    if (payload.valorProgramado <= 0 || !payload.dataProgramada || !payload.formaPagamento) {
      alertas.push({ codigo: 'PROGRAMACAO_INCOMPLETA', mensagem: 'Valor, data e forma de pagamento sao obrigatorios.' });
    }

    if (alertas.length > 0) {
      return this.criarResultadoOperacionalBloqueado('ProgramarPagamento', 'Programacao de pagamento bloqueada.', alertas, id);
    }

    const response = await this.spHttpClient.post(
      this.getListItemsEndpoint(LISTAS_ENAC.programacaoFinanceira),
      SPHttpClient.configurations.v1,
      this.criarPostOptions({
        Title: `${payload.marcadorTeste} programacao ${id}`,
        ValorBruto: payload.valorProgramado,
        DataProgramadaparaPagamento: payload.dataProgramada,
        StatusdoPagamento: 'Programado'
      })
    );
    const item = await this.ensureJson(response);
    return {
      sucesso: true,
      bloqueado: false,
      acao: 'ProgramarPagamento',
      mensagem: 'Programacao financeira V2.7A-TESTE criada.',
      itemId: Number(item.Id || item.ID),
      alertas: []
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
      case 'AprovarCompra':
        return ['cotada', 'aguardandoaprovacao'].indexOf(status) >= 0;
      case 'CriarPedidoCompra':
        return ['aprovadaparacompra', 'aprovada'].indexOf(status) >= 0;
      case 'VincularNotaFiscal':
        return ['pedidoemitido', 'comprarealizadaaguardandonf'].indexOf(status) >= 0;
      case 'ProgramarPagamento':
        return ['nfvinculada', 'aguardandoprogramacaofinanceira'].indexOf(status) >= 0;
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
      perfilPrincipal: item.PerfilPrincipal,
      perfisAdicionais: item.PerfisAdicionais ? String(item.PerfisAdicionais).split(';').filter(Boolean) as PerfilEnac[] : [],
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
