import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  IAlcadaEnac,
  IHistoricoConfiguracaoEnac,
  IResolucaoAprovadorEnac,
  ISnapshotRegraEnac,
  ISolicitacaoEnac,
  IUsuarioPerfilEnac,
  IValidacaoAlcadaEnac,
  PerfilEnac,
  TipoSolicitacaoEnac
} from '../models';

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
    const endpoint = `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Solicitacoes')/items?$select=Id,Title,TipoSolicitacao,Descricao,EspecificacaoTecnica,Quantidade,Unidade,FrenteServico,DataNecessaria,Prioridade,JustificativaUrgencia,AnexoReferencia,Observacoes,DataHoraSolicitacao,StatusProcesso,Solicitante/Title,Obra/Id,Obra/Title,Obra/CodigoObra,Obra/Cliente,Obra/CentroCusto,SnapshotAprovacaoCompra/Id&$expand=Solicitante,Obra,SnapshotAprovacaoCompra`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => ({
      id: `REQ-${item.Id}`,
      titulo: item.Title,
      tipo: item.TipoSolicitacao,
      descricao: item.Descricao,
      especificacaoTecnica: item.EspecificacaoTecnica,
      quantidade: Number(item.Quantidade || 0),
      unidade: item.Unidade,
      frenteServico: item.FrenteServico,
      dataNecessaria: item.DataNecessaria,
      prioridade: item.Prioridade,
      justificativaUrgencia: item.JustificativaUrgencia,
      anexoReferencia: item.AnexoReferencia,
      observacoes: item.Observacoes,
      solicitante: item.Solicitante?.Title || '',
      dataHoraSolicitacao: item.DataHoraSolicitacao,
      status: item.StatusProcesso,
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

  public async obterUsuarioPorContaMicrosoft365(emailOuLogin: string): Promise<IUsuarioPerfilEnac | undefined> {
    const escaped = this.escapeOData(emailOuLogin);
    const endpoint = `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Usuarios Perfis')/items?$select=Id,Title,UsuarioInternoId,EmailCorporativo,CargoFuncao,PerfilPrincipal,PerfilAdicional,PodeCriarSolicitacao,PodeRegistrarCotacoes,PodeAprovarCompras,PodeEmitirPedido,PodeVincularNF,PodeProgramarPagamento,PodeLiberarPagamento,PodeAtualizarStatusFinal,PodeAdministrarConfiguracoes,UsuarioAtivo,InicioSubstituicao,FimSubstituicao,Observacoes,Created,Modified,Author/Title,Editor/Title,ContaMicrosoft365/Id,ContaMicrosoft365/Title,ContaMicrosoft365/EMail,ContaMicrosoft365/Name,SubstitutoTemporario/Id,SubstitutoTemporario/Title,SubstitutoTemporario/EMail&$expand=ContaMicrosoft365,SubstitutoTemporario,Author,Editor&$filter=ContaMicrosoft365/EMail eq '${escaped}' or ContaMicrosoft365/Name eq '${escaped}'`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);
    const item = payload.value[0];

    return item ? this.mapUsuarioPerfil(item) : undefined;
  }

  public async listarUsuariosPerfis(options: { somenteAtivos?: boolean } = {}): Promise<IUsuarioPerfilEnac[]> {
    const filter = options.somenteAtivos ? '&$filter=UsuarioAtivo eq 1' : '';
    const endpoint = `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Usuarios Perfis')/items?$select=Id,Title,UsuarioInternoId,EmailCorporativo,CargoFuncao,PerfilPrincipal,PerfilAdicional,PodeCriarSolicitacao,PodeRegistrarCotacoes,PodeAprovarCompras,PodeEmitirPedido,PodeVincularNF,PodeProgramarPagamento,PodeLiberarPagamento,PodeAtualizarStatusFinal,PodeAdministrarConfiguracoes,UsuarioAtivo,InicioSubstituicao,FimSubstituicao,Observacoes,Created,Modified,Author/Title,Editor/Title,ContaMicrosoft365/Id,ContaMicrosoft365/Title,ContaMicrosoft365/EMail,ContaMicrosoft365/Name,SubstitutoTemporario/Id,SubstitutoTemporario/Title,SubstitutoTemporario/EMail&$expand=ContaMicrosoft365,SubstitutoTemporario,Author,Editor${filter}`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => this.mapUsuarioPerfil(item));
  }

  public async listarAlcadas(): Promise<IAlcadaEnac[]> {
    const endpoint = `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Alcadas')/items?$select=Id,Title,RegraInternaId,Processo,TipoSolicitacao,Obra,ValorMinimo,ValorMaximo,Ilimitado,AprovadorPrincipal/Id,AprovadorPrincipal/Title,AprovadorPrincipal/EMail,ExigeAprovacaoAdicional,AprovadorAdicional/Id,AprovadorAdicional/Title,AprovadorAdicional/EMail,VigenciaInicial,VigenciaFinal,Ativo,Observacoes&$expand=AprovadorPrincipal,AprovadorAdicional`;
    const response = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
    const payload = await this.ensureJson(response);

    return payload.value.map((item: any) => this.mapAlcada(item));
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
    const snapshotResponse = await this.spHttpClient.post(
      `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Snapshots Regras')/items`,
      SPHttpClient.configurations.v1,
      {
        headers: { 'Content-Type': 'application/json;odata=nometadata' },
        body: JSON.stringify({
          Title: `Snapshot compra ${solicitacaoItemId}`,
          SolicitacaoId: solicitacaoItemId,
          PedidoCompraId: pedidoCompraItemId,
          RegraAlcadaUtilizada: snapshot.regraAlcadaUtilizada,
          Processo: snapshot.processo,
          FaixaValorVigente: snapshot.faixaValorVigente,
          ValorAnalisado: snapshot.valorAnalisado,
          AprovadorBaseId: snapshot.aprovadorBaseId,
          AprovadorBaseNome: snapshot.aprovadorBaseNome,
          AprovadorBaseEmail: snapshot.aprovadorBaseEmail,
          AprovadorEfetivoId: snapshot.aprovadorEfetivoId,
          AprovadorEfetivoNome: snapshot.aprovadorEfetivoNome,
          AprovadorEfetivoEmail: snapshot.aprovadorEfetivoEmail,
          SubstituicaoAplicada: snapshot.substituicaoAplicada,
          MotivoResolucaoAprovador: snapshot.motivoResolucaoAprovador,
          MotivoExcecao: snapshot.motivoExcecao,
          DataHoraAplicacao: snapshot.dataHoraAplicacao
        })
      }
    );
    const payload = await this.ensureJson(snapshotResponse);
    const snapshotId = Number(payload.Id);

    await this.spHttpClient.post(
      `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Solicitacoes')/items(${solicitacaoItemId})`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Content-Type': 'application/json;odata=nometadata',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify({ SnapshotAprovacaoCompraId: snapshotId })
      }
    );

    return snapshotId;
  }

  public async listarHistoricoConfiguracoes(): Promise<IHistoricoConfiguracaoEnac[]> {
    const endpoint = `${this.siteUrl}/_api/web/lists/getbytitle('ENAC Historico Configuracoes')/items?$select=TipoConfiguracao,ValorAnterior,ValorNovo,Justificativa,Created,Author/Title&$expand=Author`;
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
      perfisAdicionais: item.PerfilAdicional ? String(item.PerfilAdicional).split(';').filter(Boolean) as PerfilEnac[] : [],
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
      substitutoTemporarioId: item.SubstitutoTemporario?.UsuarioInternoId || String(item.SubstitutoTemporario?.Id || ''),
      substitutoTemporarioNome: item.SubstitutoTemporario?.Title,
      substitutoTemporarioEmail: item.SubstitutoTemporario?.EMail,
      inicioSubstituicao: item.InicioSubstituicao,
      fimSubstituicao: item.FimSubstituicao,
      observacoes: item.Observacoes,
      criadoPor: item.Author?.Title,
      criadoEm: item.Created,
      alteradoPor: item.Editor?.Title,
      alteradoEm: item.Modified
    };
  }

  private mapAlcada(item: any): IAlcadaEnac {
    return {
      id: String(item.Id),
      regraInternaId: item.RegraInternaId,
      processo: item.Processo,
      tipoSolicitacao: item.TipoSolicitacao,
      obra: item.Obra || 'Todas',
      obraId: item.ObraId ? String(item.ObraId) : undefined,
      valorMinimo: Number(item.ValorMinimo || 0),
      valorMaximo: item.Ilimitado ? undefined : Number(item.ValorMaximo || 0),
      ilimitado: Boolean(item.Ilimitado),
      aprovadorPrincipalId: String(item.AprovadorPrincipal?.Id || item.AprovadorPrincipalId || ''),
      aprovadorPrincipalNome: item.AprovadorPrincipal?.Title,
      aprovadorPrincipalEmail: item.AprovadorPrincipal?.EMail,
      exigeAprovacaoAdicional: Boolean(item.ExigeAprovacaoAdicional),
      aprovadorAdicionalId: item.AprovadorAdicional?.Id ? String(item.AprovadorAdicional.Id) : undefined,
      aprovadorAdicionalNome: item.AprovadorAdicional?.Title,
      aprovadorAdicionalEmail: item.AprovadorAdicional?.EMail,
      vigenciaInicial: item.VigenciaInicial,
      vigenciaFinal: item.VigenciaFinal,
      ativa: Boolean(item.Ativo),
      observacoes: item.Observacoes
    };
  }

  private regraVigenteNaData(regra: IAlcadaEnac, data: Date): boolean {
    const inicio = new Date(regra.vigenciaInicial);
    const fim = regra.vigenciaFinal ? new Date(regra.vigenciaFinal) : undefined;
    return data >= inicio && (!fim || data <= fim);
  }

  private escapeOData(value: string): string {
    return value.replace(/'/g, "''");
  }

  private async ensureJson(response: SPHttpClientResponse): Promise<any> {
    if (!response.ok) {
      throw new Error(`SharePoint retornou ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
