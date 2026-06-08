import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneCheckbox,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'EnacSistemaWebPartStrings';
import { EnacSistema } from './components/EnacSistema';
import { IEnacSistemaProps } from './components/EnacSistema';
import { SharePointEnacRepository } from './services/SharePointEnacRepository';
import { FlagsEscritaOperacionalV27A, MarcadorTesteEscritaEnac, MarcadorTesteOperacionalEnac } from './models';

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
}

const CONFIRMACAO_ESCRITA_TESTE_V26A = 'TESTAR-ESCRITA-V2.6A-ENAC';
const MARCADOR_TESTE_PADRAO_V26A = 'V2.3B-TESTE|V2.6A-TESTE';
const CONFIRMACAO_OPERACIONAL_V27A = 'CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC';
const MARCADOR_OPERACIONAL_V27A: MarcadorTesteOperacionalEnac = 'V2.7A-TESTE';

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
        flagsEscritaOperacionalV27A: this.getFlagsOperacionaisV27A()
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
}
