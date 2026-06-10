import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneCheckbox,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'EnacSistemaWebPartStrings';
import { EnacSistema } from './components/EnacSistema';
import { IEnacSistemaProps } from './components/EnacSistema';
import { SharePointEnacRepository } from './services/SharePointEnacRepository';
import { AcaoAdministrativaV29B, AcaoOperacionalV27A, ConfiguracaoAdministrativaV29B, ConfiguracaoTesteOperacionalV27A, FlagsEscritaAdministrativaV29B, FlagsEscritaOperacionalV27A, MarcadorTesteEscritaEnac, MarcadorTesteOperacionalEnac, PerfilEnac } from './models';

export interface IEnacSistemaWebPartProps {
  description: string;
  habilitarEscritaTesteV26A: boolean;
  modoEscritaTesteV26A: boolean;
  confirmacaoEscritaTesteV26A: string;
  requisicaoTesteIdV26A: string;
  valorAnalisadoTesteV26A: string;
  marcadorTesteObrigatorioV26A: string;
  habilitarEscritaOperacionalV27A: boolean;
  modoTesteOperacionalV27A: boolean;
  permitirSomenteItensTesteV27A: boolean;
  marcadorTesteOperacionalV27A: string;
  exigirConfirmacaoManualV27A: boolean;
  confirmacaoManualV27A: string;
  itemTesteOperacionalIdV27A: string;
  acaoTesteOperacionalV27A: string;
  statusDestinoTesteOperacionalV27A: string;
  valorTesteOperacionalV27A: string;
  observacaoTesteOperacionalV27A: string;
  fornecedorTesteIdV27A: string;
  statusPedidoInicialTesteV27A: string;
  tituloPedidoTesteV27A: string;
  descricaoPedidoTesteV27A: string;
  condicaoPagamentoTesteV27A: string;
  prazoEntregaTesteV27A: string;
  pedidoTesteIdV27A: string;
  numeroNotaFiscalTesteV27A: string;
  serieNotaFiscalTesteV27A: string;
  valorNotaFiscalTesteV27A: string;
  tipoNotaFiscalTesteV27A: string;
  statusNotaFiscalInicialTesteV27A: string;
  enviadaContabilidadeTesteV27A: string;
  dataEmissaoNotaFiscalTesteV27A: string;
  dataVencimentoNotaFiscalTesteV27A: string;
  linkNotaFiscalTesteV27A: string;
  notaFiscalTesteIdV27A: string;
  pagamentoValorTesteV27A: string;
  pagamentoStatusInicialTesteV27A: string;
  pagamentoFormaTesteV27A: string;
  pagamentoContaTesteV27A: string;
  pagamentoCategoriaTesteV27A: string;
  pagamentoOrigemTesteV27A: string;
  pagamentoDataProgramadaTesteV27A: string;
  habilitarEscritaAdministrativaV29B: boolean;
  modoTesteAdministrativoV29B: boolean;
  exigirConfirmacaoAdministrativaV29B: boolean;
  confirmacaoAdministrativaV29B: string;
  acaoAdministrativaV29B: string;
  usuarioAdminTesteIdV29B: string;
  alcadaAdminTesteIdV29B: string;
  marcadorAdministrativoV29B: string;
  nomeUsuarioAdminTesteV29B: string;
  usuarioInternoIdAdminTesteV29B: string;
  contaMicrosoft365IdAdminTesteV29B: string;
  emailUsuarioAdminTesteV29B: string;
  perfilPrincipalAdminTesteV29B: string;
  perfisAdicionaisAdminTesteV29B: string;
  usuarioAtivoAdminTesteV29B: boolean;
  cargoFuncaoAdminTesteV29B: string;
  observacaoAdminTesteV29B: string;
  tituloAlcadaAdminTesteV29B: string;
  regraInternaIdAdminTesteV29B: string;
  processoAlcadaAdminTesteV29B: string;
  tipoSolicitacaoAlcadaAdminTesteV29B: string;
  valorMinimoAlcadaAdminTesteV29B: string;
  valorMaximoAlcadaAdminTesteV29B: string;
  ilimitadoAlcadaAdminTesteV29B: boolean;
  aprovadorPrincipalIdAdminTesteV29B: string;
  aprovadorAdicionalIdAdminTesteV29B: string;
  exigeAprovacaoAdicionalAdminTesteV29B: boolean;
  alcadaAtivaAdminTesteV29B: boolean;
  vigenciaInicialAdminTesteV29B: string;
  vigenciaFinalAdminTesteV29B: string;
}

const CONFIRMACAO_ESCRITA_TESTE_V26A = 'TESTAR-ESCRITA-V2.6A-ENAC';
const MARCADOR_TESTE_PADRAO_V26A = 'V2.3B-TESTE|V2.6A-TESTE';
const CONFIRMACAO_OPERACIONAL_V27A = 'CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC';
const MARCADOR_OPERACIONAL_V27A: MarcadorTesteOperacionalEnac = 'V2.7A-TESTE';
const ACAO_OPERACIONAL_PADRAO_V27A: AcaoOperacionalV27A = 'CriarSnapshotAprovacaoOperacional';
const STATUS_DESTINO_OPERACIONAL_PADRAO_V27A = 'Aguardando aprovação';
const OBSERVACAO_OPERACIONAL_PADRAO_V27A = 'V2.7A-TESTE - teste operacional restrito';
const STATUS_PEDIDO_INICIAL_PADRAO_V27A = 'Em elaboração';
const DESCRICAO_PEDIDO_PADRAO_V27A = 'V2.7A-TESTE - pedido de compra controlado';
const NUMERO_NF_PADRAO_V27A = 'NF-V2.7A-TESTE-001';
const SERIE_NF_PADRAO_V27A = '1';
const TIPO_NF_PADRAO_V27A = 'Material';
const STATUS_NF_INICIAL_PADRAO_V27A = 'Recebida';
const ENVIADA_CONTABILIDADE_PADRAO_V27A = 'não';
const PAGAMENTO_STATUS_INICIAL_PADRAO_V27A = 'Programado';
const PAGAMENTO_FORMA_PADRAO_V27A = 'Pix';
const PAGAMENTO_CONTA_PADRAO_V27A = 'Itaú ENAC';
const PAGAMENTO_CATEGORIA_PADRAO_V27A = 'Material de Obra';
const PAGAMENTO_ORIGEM_PADRAO_V27A = 'Compra de Material';
const CONFIRMACAO_ADMINISTRATIVA_V29B = 'CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9B-ENAC';
const MARCADOR_ADMINISTRATIVO_V29B = 'V2.9B-ADMIN-TESTE';

export default class EnacSistemaWebPart extends BaseClientSideWebPart<IEnacSistemaWebPartProps> {
  public render(): void {
    const repository = new SharePointEnacRepository({
      siteUrl: this.context.pageContext.web.absoluteUrl,
      spHttpClient: this.context.spHttpClient
    });

    const element: React.ReactElement<IEnacSistemaProps> = React.createElement(
      EnacSistema,
      {
        currentUserName: this.context.pageContext.user.displayName || 'Usuario ENAC',
        currentUserEmail: this.context.pageContext.user.email,
        currentUserPerfil: 'Campo',
        origemDados: 'sharepoint',
        diagnosticoReadonly: true,
        repository,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        escritaTesteHabilitada: this.properties.habilitarEscritaTesteV26A === true,
        modoEscritaTeste: this.properties.modoEscritaTesteV26A === true,
        confirmacaoEscritaTeste: this.properties.confirmacaoEscritaTesteV26A || '',
        escritaTesteRequisicaoItemId: this.parsePositiveNumber(this.properties.requisicaoTesteIdV26A),
        escritaTesteValorAnalisado: this.parsePositiveNumber(this.properties.valorAnalisadoTesteV26A),
        escritaTesteMarcador: this.resolveMarcadorTeste(this.properties.marcadorTesteObrigatorioV26A),
        flagsEscritaOperacionalV27A: this.getFlagsOperacionaisV27A(),
        configuracaoTesteOperacionalV27A: this.getConfiguracaoTesteOperacionalV27A(),
        flagsEscritaAdministrativaV29B: this.getFlagsAdministrativasV29B(),
        configuracaoAdministrativaV29B: this.getConfiguracaoAdministrativaV29B()
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onInit(): Promise<void> {
    this.properties.habilitarEscritaTesteV26A = this.properties.habilitarEscritaTesteV26A === true;
    this.properties.modoEscritaTesteV26A = this.properties.modoEscritaTesteV26A === true;
    this.properties.confirmacaoEscritaTesteV26A = this.properties.confirmacaoEscritaTesteV26A || '';
    this.properties.requisicaoTesteIdV26A = this.properties.requisicaoTesteIdV26A || '';
    this.properties.valorAnalisadoTesteV26A = this.properties.valorAnalisadoTesteV26A || '';
    this.properties.marcadorTesteObrigatorioV26A = this.properties.marcadorTesteObrigatorioV26A || MARCADOR_TESTE_PADRAO_V26A;
    this.properties.habilitarEscritaOperacionalV27A = this.properties.habilitarEscritaOperacionalV27A === true;
    this.properties.modoTesteOperacionalV27A = this.properties.modoTesteOperacionalV27A === true;
    this.properties.permitirSomenteItensTesteV27A = this.properties.permitirSomenteItensTesteV27A !== false;
    this.properties.marcadorTesteOperacionalV27A = this.properties.marcadorTesteOperacionalV27A || MARCADOR_OPERACIONAL_V27A;
    this.properties.exigirConfirmacaoManualV27A = this.properties.exigirConfirmacaoManualV27A !== false;
    this.properties.confirmacaoManualV27A = this.properties.confirmacaoManualV27A || '';
    this.properties.itemTesteOperacionalIdV27A = this.properties.itemTesteOperacionalIdV27A || '';
    this.properties.acaoTesteOperacionalV27A = this.properties.acaoTesteOperacionalV27A || ACAO_OPERACIONAL_PADRAO_V27A;
    this.properties.statusDestinoTesteOperacionalV27A = this.properties.statusDestinoTesteOperacionalV27A || STATUS_DESTINO_OPERACIONAL_PADRAO_V27A;
    this.properties.valorTesteOperacionalV27A = this.properties.valorTesteOperacionalV27A || '';
    this.properties.observacaoTesteOperacionalV27A = this.properties.observacaoTesteOperacionalV27A || OBSERVACAO_OPERACIONAL_PADRAO_V27A;
    this.properties.fornecedorTesteIdV27A = this.properties.fornecedorTesteIdV27A || '';
    this.properties.statusPedidoInicialTesteV27A = this.properties.statusPedidoInicialTesteV27A || STATUS_PEDIDO_INICIAL_PADRAO_V27A;
    this.properties.tituloPedidoTesteV27A = this.properties.tituloPedidoTesteV27A || '';
    this.properties.descricaoPedidoTesteV27A = this.properties.descricaoPedidoTesteV27A || DESCRICAO_PEDIDO_PADRAO_V27A;
    this.properties.condicaoPagamentoTesteV27A = this.properties.condicaoPagamentoTesteV27A || '';
    this.properties.prazoEntregaTesteV27A = this.properties.prazoEntregaTesteV27A || '';
    this.properties.pedidoTesteIdV27A = this.properties.pedidoTesteIdV27A || '';
    this.properties.numeroNotaFiscalTesteV27A = this.properties.numeroNotaFiscalTesteV27A || NUMERO_NF_PADRAO_V27A;
    this.properties.serieNotaFiscalTesteV27A = this.properties.serieNotaFiscalTesteV27A || SERIE_NF_PADRAO_V27A;
    this.properties.valorNotaFiscalTesteV27A = this.properties.valorNotaFiscalTesteV27A || '';
    this.properties.tipoNotaFiscalTesteV27A = this.properties.tipoNotaFiscalTesteV27A || TIPO_NF_PADRAO_V27A;
    this.properties.statusNotaFiscalInicialTesteV27A = this.properties.statusNotaFiscalInicialTesteV27A || STATUS_NF_INICIAL_PADRAO_V27A;
    this.properties.enviadaContabilidadeTesteV27A = this.properties.enviadaContabilidadeTesteV27A || ENVIADA_CONTABILIDADE_PADRAO_V27A;
    this.properties.dataEmissaoNotaFiscalTesteV27A = this.properties.dataEmissaoNotaFiscalTesteV27A || '';
    this.properties.dataVencimentoNotaFiscalTesteV27A = this.properties.dataVencimentoNotaFiscalTesteV27A || '';
    this.properties.linkNotaFiscalTesteV27A = this.properties.linkNotaFiscalTesteV27A || '';
    this.properties.notaFiscalTesteIdV27A = this.properties.notaFiscalTesteIdV27A || '';
    this.properties.pagamentoValorTesteV27A = this.properties.pagamentoValorTesteV27A || '';
    this.properties.pagamentoStatusInicialTesteV27A = this.properties.pagamentoStatusInicialTesteV27A || PAGAMENTO_STATUS_INICIAL_PADRAO_V27A;
    this.properties.pagamentoFormaTesteV27A = this.properties.pagamentoFormaTesteV27A || PAGAMENTO_FORMA_PADRAO_V27A;
    this.properties.pagamentoContaTesteV27A = this.properties.pagamentoContaTesteV27A || PAGAMENTO_CONTA_PADRAO_V27A;
    this.properties.pagamentoCategoriaTesteV27A = this.properties.pagamentoCategoriaTesteV27A || PAGAMENTO_CATEGORIA_PADRAO_V27A;
    this.properties.pagamentoOrigemTesteV27A = this.properties.pagamentoOrigemTesteV27A || PAGAMENTO_ORIGEM_PADRAO_V27A;
    this.properties.pagamentoDataProgramadaTesteV27A = this.properties.pagamentoDataProgramadaTesteV27A || '';
    this.properties.habilitarEscritaAdministrativaV29B = this.properties.habilitarEscritaAdministrativaV29B === true;
    this.properties.modoTesteAdministrativoV29B = this.properties.modoTesteAdministrativoV29B === true;
    this.properties.exigirConfirmacaoAdministrativaV29B = this.properties.exigirConfirmacaoAdministrativaV29B !== false;
    this.properties.confirmacaoAdministrativaV29B = this.properties.confirmacaoAdministrativaV29B || '';
    this.properties.acaoAdministrativaV29B = this.properties.acaoAdministrativaV29B || 'CriarUsuarioSistema';
    this.properties.usuarioAdminTesteIdV29B = this.properties.usuarioAdminTesteIdV29B || '';
    this.properties.alcadaAdminTesteIdV29B = this.properties.alcadaAdminTesteIdV29B || '';
    this.properties.marcadorAdministrativoV29B = this.properties.marcadorAdministrativoV29B || MARCADOR_ADMINISTRATIVO_V29B;
    this.properties.nomeUsuarioAdminTesteV29B = this.properties.nomeUsuarioAdminTesteV29B || '';
    this.properties.usuarioInternoIdAdminTesteV29B = this.properties.usuarioInternoIdAdminTesteV29B || '';
    this.properties.contaMicrosoft365IdAdminTesteV29B = this.properties.contaMicrosoft365IdAdminTesteV29B || '';
    this.properties.emailUsuarioAdminTesteV29B = this.properties.emailUsuarioAdminTesteV29B || '';
    this.properties.perfilPrincipalAdminTesteV29B = this.properties.perfilPrincipalAdminTesteV29B || 'Campo';
    this.properties.perfisAdicionaisAdminTesteV29B = this.properties.perfisAdicionaisAdminTesteV29B || '';
    this.properties.usuarioAtivoAdminTesteV29B = this.properties.usuarioAtivoAdminTesteV29B !== false;
    this.properties.cargoFuncaoAdminTesteV29B = this.properties.cargoFuncaoAdminTesteV29B || '';
    this.properties.observacaoAdminTesteV29B = this.properties.observacaoAdminTesteV29B || '';
    this.properties.tituloAlcadaAdminTesteV29B = this.properties.tituloAlcadaAdminTesteV29B || '';
    this.properties.regraInternaIdAdminTesteV29B = this.properties.regraInternaIdAdminTesteV29B || '';
    this.properties.processoAlcadaAdminTesteV29B = this.properties.processoAlcadaAdminTesteV29B || 'Compra';
    this.properties.tipoSolicitacaoAlcadaAdminTesteV29B = this.properties.tipoSolicitacaoAlcadaAdminTesteV29B || 'Material';
    this.properties.valorMinimoAlcadaAdminTesteV29B = this.properties.valorMinimoAlcadaAdminTesteV29B || '';
    this.properties.valorMaximoAlcadaAdminTesteV29B = this.properties.valorMaximoAlcadaAdminTesteV29B || '';
    this.properties.ilimitadoAlcadaAdminTesteV29B = this.properties.ilimitadoAlcadaAdminTesteV29B === true;
    this.properties.aprovadorPrincipalIdAdminTesteV29B = this.properties.aprovadorPrincipalIdAdminTesteV29B || '';
    this.properties.aprovadorAdicionalIdAdminTesteV29B = this.properties.aprovadorAdicionalIdAdminTesteV29B || '';
    this.properties.exigeAprovacaoAdicionalAdminTesteV29B = this.properties.exigeAprovacaoAdicionalAdminTesteV29B === true;
    this.properties.alcadaAtivaAdminTesteV29B = this.properties.alcadaAtivaAdminTesteV29B !== false;
    this.properties.vigenciaInicialAdminTesteV29B = this.properties.vigenciaInicialAdminTesteV29B || '';
    this.properties.vigenciaFinalAdminTesteV29B = this.properties.vigenciaFinalAdminTesteV29B || '';

    return Promise.resolve();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneCheckbox('habilitarEscritaTesteV26A', {
                  text: 'V2.6A - habilitar area de teste de escrita'
                }),
                PropertyPaneCheckbox('modoEscritaTesteV26A', {
                  text: 'V2.6A - confirmar modo de escrita de teste'
                }),
                PropertyPaneTextField('confirmacaoEscritaTesteV26A', {
                  label: `Confirmacao (${CONFIRMACAO_ESCRITA_TESTE_V26A})`
                }),
                PropertyPaneTextField('requisicaoTesteIdV26A', {
                  label: 'ID do item de teste na Lista 02'
                }),
                PropertyPaneTextField('valorAnalisadoTesteV26A', {
                  label: 'Valor analisado de teste'
                }),
                PropertyPaneTextField('marcadorTesteObrigatorioV26A', {
                  label: 'Marcador obrigatorio do item de teste'
                }),
                PropertyPaneCheckbox('habilitarEscritaOperacionalV27A', {
                  text: 'V2.7A - habilitar escrita operacional restrita'
                }),
                PropertyPaneCheckbox('modoTesteOperacionalV27A', {
                  text: 'V2.7A - manter modo teste operacional'
                }),
                PropertyPaneCheckbox('permitirSomenteItensTesteV27A', {
                  text: 'V2.7A - permitir somente itens V2.7A-TESTE'
                }),
                PropertyPaneTextField('marcadorTesteOperacionalV27A', {
                  label: `Marcador operacional (${MARCADOR_OPERACIONAL_V27A})`
                }),
                PropertyPaneCheckbox('exigirConfirmacaoManualV27A', {
                  text: 'V2.7A - exigir confirmacao manual'
                }),
                PropertyPaneTextField('confirmacaoManualV27A', {
                  label: `Confirmacao V2.7A (${CONFIRMACAO_OPERACIONAL_V27A})`
                }),
                PropertyPaneTextField('itemTesteOperacionalIdV27A', {
                  label: 'V2.7A - ID do item de teste'
                }),
                PropertyPaneDropdown('acaoTesteOperacionalV27A', {
                  label: 'V2.7A - acao operacional de teste',
                  options: [
                    { key: 'AtualizarStatusRequisicao', text: 'Atualizar status da requisicao' },
                    { key: 'CriarSnapshotAprovacaoOperacional', text: 'Criar snapshot operacional' },
                    { key: 'AprovarCompra', text: 'Aprovar compra' },
                    { key: 'CriarPedidoCompra', text: 'Criar pedido de compra' },
                    { key: 'VincularNotaFiscal', text: 'Vincular nota fiscal' },
                    { key: 'ProgramarPagamento', text: 'Programar pagamento' }
                  ]
                }),
                PropertyPaneTextField('statusDestinoTesteOperacionalV27A', {
                  label: 'V2.7A - status destino'
                }),
                PropertyPaneTextField('valorTesteOperacionalV27A', {
                  label: 'V2.7A - valor de teste, se aplicavel'
                }),
                PropertyPaneTextField('observacaoTesteOperacionalV27A', {
                  label: 'V2.7A - observacao de teste'
                }),
                PropertyPaneTextField('fornecedorTesteIdV27A', {
                  label: 'V2.7A - fornecedor de teste (Fornecedor0Id)'
                }),
                PropertyPaneTextField('statusPedidoInicialTesteV27A', {
                  label: 'V2.7A - status inicial do pedido'
                }),
                PropertyPaneTextField('tituloPedidoTesteV27A', {
                  label: 'V2.7A - titulo do pedido, opcional'
                }),
                PropertyPaneTextField('descricaoPedidoTesteV27A', {
                  label: 'V2.7A - descricao do pedido'
                }),
                PropertyPaneTextField('condicaoPagamentoTesteV27A', {
                  label: 'V2.7A - condicao de pagamento do pedido, opcional'
                }),
                PropertyPaneTextField('prazoEntregaTesteV27A', {
                  label: 'V2.7A - prazo de entrega do pedido, opcional ISO'
                }),
                PropertyPaneTextField('pedidoTesteIdV27A', {
                  label: 'V2.7A - ID do pedido de teste'
                }),
                PropertyPaneTextField('numeroNotaFiscalTesteV27A', {
                  label: 'V2.7A - numero da NF de teste'
                }),
                PropertyPaneTextField('serieNotaFiscalTesteV27A', {
                  label: 'V2.7A - serie da NF de teste'
                }),
                PropertyPaneTextField('valorNotaFiscalTesteV27A', {
                  label: 'V2.7A - valor da NF de teste'
                }),
                PropertyPaneTextField('tipoNotaFiscalTesteV27A', {
                  label: 'V2.7A - tipo da NF'
                }),
                PropertyPaneTextField('statusNotaFiscalInicialTesteV27A', {
                  label: 'V2.7A - status inicial da NF'
                }),
                PropertyPaneTextField('enviadaContabilidadeTesteV27A', {
                  label: 'V2.7A - enviada para contabilidade'
                }),
                PropertyPaneTextField('dataEmissaoNotaFiscalTesteV27A', {
                  label: 'V2.7A - data de emissao NF, opcional ISO'
                }),
                PropertyPaneTextField('dataVencimentoNotaFiscalTesteV27A', {
                  label: 'V2.7A - data de vencimento NF, opcional ISO'
                }),
                PropertyPaneTextField('linkNotaFiscalTesteV27A', {
                  label: 'V2.7A - link da NF, opcional'
                }),
                PropertyPaneTextField('notaFiscalTesteIdV27A', {
                  label: 'V2.7A - ID da NF de teste'
                }),
                PropertyPaneTextField('pagamentoValorTesteV27A', {
                  label: 'V2.7A - valor do pagamento'
                }),
                PropertyPaneTextField('pagamentoStatusInicialTesteV27A', {
                  label: 'V2.7A - status inicial do pagamento'
                }),
                PropertyPaneTextField('pagamentoFormaTesteV27A', {
                  label: 'V2.7A - forma de pagamento'
                }),
                PropertyPaneTextField('pagamentoContaTesteV27A', {
                  label: 'V2.7A - conta de pagamento'
                }),
                PropertyPaneTextField('pagamentoCategoriaTesteV27A', {
                  label: 'V2.7A - categoria do pagamento'
                }),
                PropertyPaneTextField('pagamentoOrigemTesteV27A', {
                  label: 'V2.7A - origem do pagamento'
                }),
                PropertyPaneTextField('pagamentoDataProgramadaTesteV27A', {
                  label: 'V2.7A - data programada, opcional ISO'
                }),
                PropertyPaneCheckbox('habilitarEscritaAdministrativaV29B', {
                  text: 'V2.9B - habilitar painel de escrita administrativa'
                }),
                PropertyPaneCheckbox('modoTesteAdministrativoV29B', {
                  text: 'V2.9B - manter modo teste administrativo'
                }),
                PropertyPaneCheckbox('exigirConfirmacaoAdministrativaV29B', {
                  text: 'V2.9B - exigir confirmacao manual'
                }),
                PropertyPaneTextField('confirmacaoAdministrativaV29B', {
                  label: `Confirmacao V2.9B (${CONFIRMACAO_ADMINISTRATIVA_V29B})`
                }),
                PropertyPaneDropdown('acaoAdministrativaV29B', {
                  label: 'V2.9B - acao administrativa',
                  options: [
                    { key: 'CriarUsuarioSistema', text: 'Criar usuario no sistema' },
                    { key: 'AtualizarUsuarioPerfilStatus', text: 'Atualizar perfil/status de usuario' },
                    { key: 'AtualizarAlcadaUsuario', text: 'Atualizar alcada de usuario' }
                  ]
                }),
                PropertyPaneTextField('marcadorAdministrativoV29B', {
                  label: `Marcador administrativo (${MARCADOR_ADMINISTRATIVO_V29B})`
                }),
                PropertyPaneTextField('usuarioAdminTesteIdV29B', {
                  label: 'V2.9B - ID do usuario existente, se aplicavel'
                }),
                PropertyPaneTextField('nomeUsuarioAdminTesteV29B', {
                  label: 'V2.9B - nome do usuario'
                }),
                PropertyPaneTextField('usuarioInternoIdAdminTesteV29B', {
                  label: 'V2.9B - UsuarioInternoId'
                }),
                PropertyPaneTextField('contaMicrosoft365IdAdminTesteV29B', {
                  label: 'V2.9B - ContaMicrosoft365Id'
                }),
                PropertyPaneTextField('emailUsuarioAdminTesteV29B', {
                  label: 'V2.9B - email corporativo'
                }),
                PropertyPaneDropdown('perfilPrincipalAdminTesteV29B', {
                  label: 'V2.9B - perfil principal',
                  options: [
                    { key: 'Campo', text: 'Campo / Engenheiro' },
                    { key: 'CotacoesContratos', text: 'Cotações e Contratos' },
                    { key: 'ComprasFinanceiroOperacional', text: 'Compras e Financeiro Operacional' },
                    { key: 'Planejamento', text: 'Planejamento' },
                    { key: 'Diretoria', text: 'Diretoria' },
                    { key: 'AdministradorSistema', text: 'Administrador do Sistema' }
                  ]
                }),
                PropertyPaneTextField('perfisAdicionaisAdminTesteV29B', {
                  label: 'V2.9B - perfis adicionais, separados por ;'
                }),
                PropertyPaneCheckbox('usuarioAtivoAdminTesteV29B', {
                  text: 'V2.9B - usuario ativo'
                }),
                PropertyPaneTextField('cargoFuncaoAdminTesteV29B', {
                  label: 'V2.9B - cargo/funcao'
                }),
                PropertyPaneTextField('observacaoAdminTesteV29B', {
                  label: 'V2.9B - observacao/justificativa'
                }),
                PropertyPaneTextField('alcadaAdminTesteIdV29B', {
                  label: 'V2.9B - ID da alcada existente, se aplicavel'
                }),
                PropertyPaneTextField('tituloAlcadaAdminTesteV29B', {
                  label: 'V2.9B - titulo da alcada'
                }),
                PropertyPaneTextField('regraInternaIdAdminTesteV29B', {
                  label: 'V2.9B - RegraInternaId'
                }),
                PropertyPaneDropdown('processoAlcadaAdminTesteV29B', {
                  label: 'V2.9B - processo da alcada',
                  options: [
                    { key: 'Compra', text: 'Compra' },
                    { key: 'Liberação Bancária', text: 'Liberação Bancária' },
                    { key: 'Medição', text: 'Medição' },
                    { key: 'Pagamento', text: 'Pagamento' },
                    { key: 'Outro', text: 'Outro' }
                  ]
                }),
                PropertyPaneTextField('tipoSolicitacaoAlcadaAdminTesteV29B', {
                  label: 'V2.9B - tipo de solicitacao da alcada'
                }),
                PropertyPaneTextField('valorMinimoAlcadaAdminTesteV29B', {
                  label: 'V2.9B - valor minimo'
                }),
                PropertyPaneTextField('valorMaximoAlcadaAdminTesteV29B', {
                  label: 'V2.9B - valor maximo'
                }),
                PropertyPaneCheckbox('ilimitadoAlcadaAdminTesteV29B', {
                  text: 'V2.9B - alcada sem limite maximo'
                }),
                PropertyPaneTextField('aprovadorPrincipalIdAdminTesteV29B', {
                  label: 'V2.9B - AprovadorPrincipalId'
                }),
                PropertyPaneTextField('aprovadorAdicionalIdAdminTesteV29B', {
                  label: 'V2.9B - AprovadorAdicionalId'
                }),
                PropertyPaneCheckbox('exigeAprovacaoAdicionalAdminTesteV29B', {
                  text: 'V2.9B - exige aprovacao adicional'
                }),
                PropertyPaneCheckbox('alcadaAtivaAdminTesteV29B', {
                  text: 'V2.9B - alcada ativa'
                }),
                PropertyPaneTextField('vigenciaInicialAdminTesteV29B', {
                  label: 'V2.9B - vigencia inicial ISO'
                }),
                PropertyPaneTextField('vigenciaFinalAdminTesteV29B', {
                  label: 'V2.9B - vigencia final ISO, opcional'
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private parsePositiveNumber(value: string | undefined): number | undefined {
    const normalized = String(value || '').replace(',', '.').trim();
    const parsed = Number(normalized);

    return parsed > 0 ? parsed : undefined;
  }

  private resolveMarcadorTeste(value: string | undefined): MarcadorTesteEscritaEnac | undefined {
    const marcador = value || MARCADOR_TESTE_PADRAO_V26A;
    if (marcador.indexOf('V2.6A-TESTE') >= 0) {
      return 'V2.6A-TESTE';
    }

    if (marcador.indexOf('V2.3B-TESTE') >= 0) {
      return 'V2.3B-TESTE';
    }

    return undefined;
  }

  private getFlagsOperacionaisV27A(): FlagsEscritaOperacionalV27A {
    return {
      habilitarEscritaOperacionalV27A: this.properties.habilitarEscritaOperacionalV27A === true,
      modoTesteOperacionalV27A: this.properties.modoTesteOperacionalV27A === true,
      permitirSomenteItensTesteV27A: this.properties.permitirSomenteItensTesteV27A !== false,
      marcadorTesteOperacionalV27A: this.properties.marcadorTesteOperacionalV27A === MARCADOR_OPERACIONAL_V27A ? MARCADOR_OPERACIONAL_V27A : MARCADOR_OPERACIONAL_V27A,
      exigirConfirmacaoManualV27A: this.properties.exigirConfirmacaoManualV27A !== false,
      confirmacaoManualV27A: this.properties.confirmacaoManualV27A || ''
    };
  }

  private getConfiguracaoTesteOperacionalV27A(): ConfiguracaoTesteOperacionalV27A {
    const acoesSuportadas: AcaoOperacionalV27A[] = [
      'AtualizarStatusRequisicao',
      'CriarSnapshotAprovacaoOperacional',
      'AprovarCompra',
      'CriarPedidoCompra',
      'VincularNotaFiscal',
      'ProgramarPagamento'
    ];
    const acao = acoesSuportadas.indexOf(this.properties.acaoTesteOperacionalV27A as AcaoOperacionalV27A) >= 0
      ? this.properties.acaoTesteOperacionalV27A as AcaoOperacionalV27A
      : ACAO_OPERACIONAL_PADRAO_V27A;

    return {
      itemTesteOperacionalIdV27A: this.parsePositiveNumber(this.properties.itemTesteOperacionalIdV27A),
      acaoTesteOperacionalV27A: acao,
      statusDestinoTesteOperacionalV27A: this.properties.statusDestinoTesteOperacionalV27A || STATUS_DESTINO_OPERACIONAL_PADRAO_V27A,
      valorTesteOperacionalV27A: this.parsePositiveNumber(this.properties.valorTesteOperacionalV27A),
      observacaoTesteOperacionalV27A: this.properties.observacaoTesteOperacionalV27A || OBSERVACAO_OPERACIONAL_PADRAO_V27A,
      fornecedorTesteIdV27A: this.parsePositiveNumber(this.properties.fornecedorTesteIdV27A),
      statusPedidoInicialTesteV27A: this.properties.statusPedidoInicialTesteV27A || STATUS_PEDIDO_INICIAL_PADRAO_V27A,
      tituloPedidoTesteV27A: this.properties.tituloPedidoTesteV27A || '',
      descricaoPedidoTesteV27A: this.properties.descricaoPedidoTesteV27A || DESCRICAO_PEDIDO_PADRAO_V27A,
      condicaoPagamentoTesteV27A: this.properties.condicaoPagamentoTesteV27A || '',
      prazoEntregaTesteV27A: this.properties.prazoEntregaTesteV27A || '',
      pedidoTesteIdV27A: this.parsePositiveNumber(this.properties.pedidoTesteIdV27A),
      numeroNotaFiscalTesteV27A: this.properties.numeroNotaFiscalTesteV27A || NUMERO_NF_PADRAO_V27A,
      serieNotaFiscalTesteV27A: this.properties.serieNotaFiscalTesteV27A || SERIE_NF_PADRAO_V27A,
      valorNotaFiscalTesteV27A: this.parsePositiveNumber(this.properties.valorNotaFiscalTesteV27A),
      tipoNotaFiscalTesteV27A: this.properties.tipoNotaFiscalTesteV27A || TIPO_NF_PADRAO_V27A,
      statusNotaFiscalInicialTesteV27A: this.properties.statusNotaFiscalInicialTesteV27A || STATUS_NF_INICIAL_PADRAO_V27A,
      enviadaContabilidadeTesteV27A: this.properties.enviadaContabilidadeTesteV27A || ENVIADA_CONTABILIDADE_PADRAO_V27A,
      dataEmissaoNotaFiscalTesteV27A: this.properties.dataEmissaoNotaFiscalTesteV27A || '',
      dataVencimentoNotaFiscalTesteV27A: this.properties.dataVencimentoNotaFiscalTesteV27A || '',
      linkNotaFiscalTesteV27A: this.properties.linkNotaFiscalTesteV27A || '',
      notaFiscalTesteIdV27A: this.parsePositiveNumber(this.properties.notaFiscalTesteIdV27A),
      pagamentoValorTesteV27A: this.parsePositiveNumber(this.properties.pagamentoValorTesteV27A),
      pagamentoStatusInicialTesteV27A: this.properties.pagamentoStatusInicialTesteV27A || PAGAMENTO_STATUS_INICIAL_PADRAO_V27A,
      pagamentoFormaTesteV27A: this.properties.pagamentoFormaTesteV27A || PAGAMENTO_FORMA_PADRAO_V27A,
      pagamentoContaTesteV27A: this.properties.pagamentoContaTesteV27A || PAGAMENTO_CONTA_PADRAO_V27A,
      pagamentoCategoriaTesteV27A: this.properties.pagamentoCategoriaTesteV27A || PAGAMENTO_CATEGORIA_PADRAO_V27A,
      pagamentoOrigemTesteV27A: this.properties.pagamentoOrigemTesteV27A || PAGAMENTO_ORIGEM_PADRAO_V27A,
      pagamentoDataProgramadaTesteV27A: this.properties.pagamentoDataProgramadaTesteV27A || ''
    };
  }

  private getFlagsAdministrativasV29B(): FlagsEscritaAdministrativaV29B {
    return {
      habilitarEscritaAdministrativaV29B: this.properties.habilitarEscritaAdministrativaV29B === true,
      modoTesteAdministrativoV29B: this.properties.modoTesteAdministrativoV29B === true,
      exigirConfirmacaoAdministrativaV29B: this.properties.exigirConfirmacaoAdministrativaV29B !== false,
      confirmacaoAdministrativaV29B: this.properties.confirmacaoAdministrativaV29B || '',
      marcadorAdministrativoV29B: MARCADOR_ADMINISTRATIVO_V29B
    };
  }

  private getConfiguracaoAdministrativaV29B(): ConfiguracaoAdministrativaV29B {
    const acoes: AcaoAdministrativaV29B[] = ['CriarUsuarioSistema', 'AtualizarUsuarioPerfilStatus', 'AtualizarAlcadaUsuario'];
    const acao = acoes.indexOf(this.properties.acaoAdministrativaV29B as AcaoAdministrativaV29B) >= 0
      ? this.properties.acaoAdministrativaV29B as AcaoAdministrativaV29B
      : 'CriarUsuarioSistema';

    return {
      acaoAdministrativaV29B: acao,
      usuarioAdminTesteIdV29B: this.parsePositiveNumber(this.properties.usuarioAdminTesteIdV29B),
      alcadaAdminTesteIdV29B: this.parsePositiveNumber(this.properties.alcadaAdminTesteIdV29B),
      nomeUsuarioAdminTesteV29B: this.properties.nomeUsuarioAdminTesteV29B || '',
      usuarioInternoIdAdminTesteV29B: this.properties.usuarioInternoIdAdminTesteV29B || '',
      contaMicrosoft365IdAdminTesteV29B: this.parsePositiveNumber(this.properties.contaMicrosoft365IdAdminTesteV29B),
      emailUsuarioAdminTesteV29B: this.properties.emailUsuarioAdminTesteV29B || '',
      perfilPrincipalAdminTesteV29B: this.resolvePerfilAdministrativo(this.properties.perfilPrincipalAdminTesteV29B),
      perfisAdicionaisAdminTesteV29B: this.resolvePerfisAdicionaisAdministrativos(this.properties.perfisAdicionaisAdminTesteV29B),
      usuarioAtivoAdminTesteV29B: this.properties.usuarioAtivoAdminTesteV29B !== false,
      cargoFuncaoAdminTesteV29B: this.properties.cargoFuncaoAdminTesteV29B || '',
      observacaoAdminTesteV29B: this.properties.observacaoAdminTesteV29B || '',
      tituloAlcadaAdminTesteV29B: this.properties.tituloAlcadaAdminTesteV29B || '',
      regraInternaIdAdminTesteV29B: this.properties.regraInternaIdAdminTesteV29B || '',
      processoAlcadaAdminTesteV29B: this.properties.processoAlcadaAdminTesteV29B as ConfiguracaoAdministrativaV29B['processoAlcadaAdminTesteV29B'] || 'Compra',
      tipoSolicitacaoAlcadaAdminTesteV29B: this.properties.tipoSolicitacaoAlcadaAdminTesteV29B || 'Material',
      valorMinimoAlcadaAdminTesteV29B: this.parseNumberOrUndefined(this.properties.valorMinimoAlcadaAdminTesteV29B),
      valorMaximoAlcadaAdminTesteV29B: this.parseNumberOrUndefined(this.properties.valorMaximoAlcadaAdminTesteV29B),
      ilimitadoAlcadaAdminTesteV29B: this.properties.ilimitadoAlcadaAdminTesteV29B === true,
      aprovadorPrincipalIdAdminTesteV29B: this.parsePositiveNumber(this.properties.aprovadorPrincipalIdAdminTesteV29B),
      aprovadorAdicionalIdAdminTesteV29B: this.parsePositiveNumber(this.properties.aprovadorAdicionalIdAdminTesteV29B),
      exigeAprovacaoAdicionalAdminTesteV29B: this.properties.exigeAprovacaoAdicionalAdminTesteV29B === true,
      alcadaAtivaAdminTesteV29B: this.properties.alcadaAtivaAdminTesteV29B !== false,
      vigenciaInicialAdminTesteV29B: this.properties.vigenciaInicialAdminTesteV29B || '',
      vigenciaFinalAdminTesteV29B: this.properties.vigenciaFinalAdminTesteV29B || ''
    };
  }

  private parseNumberOrUndefined(value: string | undefined): number | undefined {
    const normalized = String(value || '').replace(',', '.').trim();
    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private resolvePerfilAdministrativo(value: string | undefined): PerfilEnac {
    const perfis: PerfilEnac[] = ['Campo', 'CotacoesContratos', 'ComprasFinanceiroOperacional', 'Planejamento', 'Diretoria', 'AdministradorSistema', 'ConsultaLeitura'];
    return perfis.indexOf(value as PerfilEnac) >= 0 ? value as PerfilEnac : 'Campo';
  }

  private resolvePerfisAdicionaisAdministrativos(value: string | undefined): PerfilEnac[] {
    const perfisValidos: PerfilEnac[] = ['Campo', 'CotacoesContratos', 'ComprasFinanceiroOperacional', 'Planejamento', 'Diretoria', 'AdministradorSistema', 'ConsultaLeitura'];
    const resolvidos: PerfilEnac[] = [];

    String(value || '').split(';').forEach((item) => {
      const trimmed = item.trim() as PerfilEnac;
      if (perfisValidos.indexOf(trimmed) >= 0 && resolvidos.indexOf(trimmed) < 0) {
        resolvidos.push(trimmed);
      }
    });

    return resolvidos;
  }
}
