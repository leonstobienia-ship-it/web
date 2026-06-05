import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  IDiagnosticoReadonlyEnac,
  IAlcadaEnac,
  IHistoricoConfiguracaoEnac,
  IRequisicaoResumoEnac,
  IResolucaoAprovadorEnac,
  ISnapshotRegraEnac,
  ISolicitacaoEnac,
  IUsuarioPerfilEnac,
  IValidacaoAlcadaEnac,
  PerfilEnac,
  TipoSolicitacaoEnac
} from '../models';

const LISTAS_ENAC = {
  obras: 'a9afadc1-f843-45c0-a628-4f49a8716832',
  requisicoesCompra: '0a204b87-b9a1-4d16-8654-55567a62ed01',
  usuariosPerfis: '99cb9bae-5589-4f8b-854b-08adce371e82',
  alcadas: '901d4458-15b4-427b-a869-161c63cf70ef',
  historicoConfiguracoes: 'cac67186-e478-4f15-b5a0-2db92d74b2c4',
  snapshotsRegras: '767e1867-8a98-46be-9dcc-be53a12c51aa'
};

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
    const endpoint = `${this.getListItemsEndpoint(LISTAS_ENAC.requisicoesCompra)}?$top=20&$select=Id,Title,TipodaSolicita_x00e7__x00e3_o,Descri_x00e7__x00e3_o,StatusdaRequisi_x00e7__x00e3_o,Solicitante/Title,Obra/Id,Obra/Title,SnapshotAprovacaoCompra/Id,SnapshotAprovacaoCompra/Title&$expand=Solicitante,Obra,SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => ({
      id: `REQ-${item.Id}`,
      titulo: item.Title,
      tipo: this.mapTipoSolicitacao(item.TipodaSolicita_x00e7__x00e3_o),
      descricao: item.Descri_x00e7__x00e3_o || '',
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
    throw new Error('Persistencia de snapshot bloqueada na V2.4B readonly.');
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
