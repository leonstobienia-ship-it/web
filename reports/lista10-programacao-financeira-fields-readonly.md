# Auditoria readonly Lista 10 - Contas a Pagar / Programacao Financeira

Data local: 2026-06-09 12:36:31
Modo: readonly conectado
Site: 05 - Obras em Andamento
Url: https://enaccombr.sharepoint.com/sites/Equipe.Obras
Lista: Lista 10 — Contas a Pagar / Programação Financeira
GUID: f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680
Itens: 2

## Confirmacoes

- O script le apenas metadados da lista e campos.
- O script nao altera listas, campos, itens, permissoes ou dados.
- O script nao executa escrita operacional.
- O script nao inicia Power Automate.

## Campos destacados

| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto | Choices | LookupList | LookupField | Formula |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _CommentCount | Contagem de comentário | Lookup | False | True | True |  |  | CommentCount |  |
| _CommentFlags | Configurações de comentários | Lookup | False | True | True |  |  | CommentFlags |  |
| _ComplianceFlags | Configuração do rótulo | Lookup | False | True | False |  |  | ComplianceFlags |  |
| _ModerationStatus | Status de Aprovação | ModStat | False | True | True |  |  |  |  |
| _RansomwareAnomalyMetaInfo | RansomwareAnomalyMetaInfo | Lookup | False | True | True |  |  | RansomwareAnomalyMetaInfo |  |
| _VirusInfo | VirusInfo | Lookup | False | True | True |  |  | VirusInfo |  |
| _VirusStatus | VirusStatus | Lookup | False | True | True |  |  | VirusStatus |  |
| Attachments | Anexos | Attachments | False | False | False |  |  |  |  |
| C_x00f3_digodaObra | Código da Obra | Lookup | False | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Title |  |
| CategoriadoPagamento | Categoria do Pagamento | Choice | False | False | False | Material de Obra, Prestador de Serviço, Mão de Obra, Imposto / Guia, Despesa Administrativa, Despesa Financeira, Locação de Equipamento, Frete / Transporte, Combustível, Alimentação / Refeição, Hospedagem, Ferramentas / Equipamentos, Contabilidade, Jurídico, Sistema / Software, Energia, Água / Esgoto, Telefone / Internet, Aluguel, Reembolso, Outro |  |  |  |
| CentrodeCusto | Centro de Custo | Text | False | False | False |  |  |  |  |
| ComplianceAssetId | ID de Ativo de Conformidade | Text | False | True | False |  |  |  |  |
| ContadePagamento | Conta de Pagamento | Choice | False | False | False | Itaú ENAC, Santander ENAC, Caixa ENAC, Dinheiro / Caixa Interno, Cartão Corporativo, Outra |  |  |  |
| DatadeVencimento | Data de Vencimento | DateTime | False | False | False |  |  |  |  |
| DatadoPagamento | Data do Pagamento | DateTime | False | False | False |  |  |  |  |
| DataProgramadaparaPagamento | Data Programada para Pagamento | DateTime | False | False | False |  |  |  |  |
| FolderChildCount | Contagem de Elementos Filho da Pasta | Lookup | False | True | False |  |  | FolderChildCount |  |
| FormadePagamento | Forma de Pagamento | Choice | False | False | False | Pix, Boleto, Transferência Bancária, TED / DOC, Cartão de Crédito, Cartão de Débito, Débito Automático, Dinheiro, Outro |  |  |  |
| Fornecedor_x0020__x002f__x0020_P | Fornecedor / Prestador: Título | Lookup | True | True | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | Title |  |
| Fornecedor_x002f_Prestador | Fornecedor / Prestador | Lookup | True | False | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | NomeFantasia |  |
| ItemChildCount | Contagem de Itens Filhos | Lookup | False | True | False |  |  | ItemChildCount |  |
| LinkdaNotaFiscal | Link da Nota Fiscal | URL | False | False | False |  |  |  |  |
| LinkdoComprovante | Link do Comprovante | URL | False | False | False |  |  |  |  |
| LinkTitle | Título do Pagamento | Computed | False | True | False |  |  |  |  |
| MainLinkSettings | Configurações do Link principal | Computed | False | True | True |  |  |  |  |
| MetaInfo | Conjunto de Propriedades | Lookup | False | False | True |  |  | MetaInfo |  |
| N_x00ba_daNotaFiscal | Nº da Nota Fiscal | Text | False | False | False |  |  |  |  |
| Obra | Obra | Lookup | True | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | NomedaObra |  |
| Observa_x00e7__x00f5_es | Observações | Note | False | False | False |  |  |  |  |
| OrigemdoPagamento | Origem do Pagamento | Choice | False | False | False | Compra de Material, Contrato de Prestador, Medição de Prestador, Nota Fiscal Avulsa, Despesa Fixa, Imposto, Reembolso, Despesa Administrativa, Outro |  |  |  |
| PrincipalCount | Contagem de principais | Computed | False | True | True |  |  |  |  |
| SMTotalFileCount | Contagem Total de Arquivos | Lookup | False | True | True |  |  | SMTotalFileCount |  |
| StatusdoPagamento | Status do Pagamento | Choice | False | False | False | Recebido / A lançar, Aguardando conferência, Aguardando aprovação, Aprovado para pagamento, Programado, Pago, Vencido, Suspenso, Cancelado |  |  |  |
| Title | Título | Text | False | False | False |  |  |  |  |
| Valor_x0020_L_x00ed_quido_x0020_ | Valor Líquido a Pagar Calculado | Calculated | False | True | False |  |  |  | =[Valor Bruto]-[Retenções / Descontos] |
| ValorBruto | Valor Bruto | Currency | False | False | False |  |  |  |  |
| ValorL_x00ed_quidoaPagar | Valor Líquido a Pagar | Currency | False | False | False |  |  |  |  |

## Todos os campos

| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto |
| --- | --- | --- | --- | --- | --- |
| _ColorHex | Cor | Text | False | True | True |
| _ColorTag | Pressione Delete para excluir o ícone. | Text | False | True | False |
| _CommentCount | Contagem de comentário | Lookup | False | True | True |
| _CommentFlags | Configurações de comentários | Lookup | False | True | True |
| _ComplianceFlags | Configuração do rótulo | Lookup | False | True | False |
| _ComplianceTag | Rótulo de retenção | Lookup | False | True | False |
| _ComplianceTagUserId | Rótulo aplicado por | Lookup | False | True | False |
| _ComplianceTagWrittenTime | Rótulo de retenção Aplicado | Lookup | False | True | False |
| _CopySource | Origem da Cópia | Text | False | True | True |
| _DraftOwnerId | ID do Proprietário do Rascunho | Lookup | False | True | True |
| _EditMenuTableEnd | Fim da Tabela do Menu de Edição | Computed | False | True | True |
| _EditMenuTableStart | Início da Tabela do Menu de Edição | Computed | False | True | True |
| _EditMenuTableStart2 | Início da Tabela do Menu de Edição | Computed | False | True | True |
| _Emoji | Emoji | Text | False | True | True |
| _FormSourceId_0 | Created Via | Text | False | True | False |
| _HasCopyDestinations | Tem Destinos de Cópia | Boolean | False | True | True |
| _IsCurrentVersion | É a Versão Atual | Boolean | False | True | True |
| _IsRecord | O item é um Registro | Computed | False | True | False |
| _Level | Nível | Integer | False | True | True |
| _ModerationComments | Comentários do Aprovador | Note | False | True | True |
| _ModerationStatus | Status de Aprovação | ModStat | False | True | True |
| _RansomwareAnomalyMetaInfo | RansomwareAnomalyMetaInfo | Lookup | False | True | True |
| _UIVersion | Versão da UI | Integer | False | True | True |
| _UIVersionString | Versão | Text | False | True | False |
| _VirusInfo | VirusInfo | Lookup | False | True | True |
| _VirusStatus | VirusStatus | Lookup | False | True | True |
| _VirusVendorID | VirusVendorID | Lookup | False | True | True |
| AccessPolicy | Política de Acesso | Lookup | False | True | True |
| AppAuthor | Aplicativo Criado por | Lookup | False | True | False |
| AppEditor | Aplicativo Modificado por | Lookup | False | True | False |
| Aprovador | Aprovador | User | False | False | False |
| Attachments | Anexos | Attachments | False | False | False |
| Author | Criado por | User | False | True | False |
| BaseName | Nome do Arquivo | Computed | False | True | True |
| C_x00f3_digodaObra | Código da Obra | Lookup | False | False | False |
| CategoriadoPagamento | Categoria do Pagamento | Choice | False | False | False |
| CentrodeCusto | Centro de Custo | Text | False | False | False |
| CNPJ_x002f_CPF | CNPJ / CPF | Text | False | False | False |
| ComplianceAssetId | ID de Ativo de Conformidade | Text | False | True | False |
| ComprovanteAnexado_x003f_ | Comprovante Anexado? | Choice | False | False | False |
| ContadePagamento | Conta de Pagamento | Choice | False | False | False |
| ContentType | Tipo de Conteúdo | Computed | False | False | False |
| ContentTypeId | ID do Tipo de Conteúdo | ContentTypeId | False | True | True |
| ContentVersion | Versão do Conteúdo | Lookup | False | True | True |
| Created | Criado | DateTime | False | True | False |
| Created_x0020_Date | Criado | Lookup | False | True | True |
| DatadeEmiss_x00e3_o | Data de Emissão | DateTime | False | False | False |
| DatadeVencimento | Data de Vencimento | DateTime | False | False | False |
| DatadoPagamento | Data do Pagamento | DateTime | False | False | False |
| DataProgramadaparaPagamento | Data Programada para Pagamento | DateTime | False | False | False |
| DocIcon | Tipo | Computed | False | True | False |
| Edit | Editar | Computed | False | True | False |
| Editor | Modificado por | User | False | True | False |
| EncodedAbsUrl | URL Absoluta Codificada | Computed | False | True | True |
| File_x0020_Type | Tipo de Arquivo | Text | False | True | True |
| FileDirRef | Caminho | Lookup | False | True | True |
| FileLeafRef | Nome | File | False | False | True |
| FileRef | Caminho da URL | Lookup | False | True | True |
| FolderChildCount | Contagem de Elementos Filho da Pasta | Lookup | False | True | False |
| FormadePagamento | Forma de Pagamento | Choice | False | False | False |
| Fornecedor_x0020__x002f__x0020_P | Fornecedor / Prestador: Título | Lookup | True | True | False |
| Fornecedor_x002f_Prestador | Fornecedor / Prestador | Lookup | True | False | False |
| FSObjType | Tipo de Item | Lookup | False | True | True |
| GUID | GUID | Guid | False | True | True |
| HTML_x0020_File_x0020_Type | Tipo de Arquivo HTML | Computed | False | True | True |
| ID | ID | Counter | False | True | False |
| InstanceID | ID da Instância | Integer | False | True | True |
| ItemChildCount | Contagem de Itens Filhos | Lookup | False | True | False |
| Last_x0020_Modified | Modificado | Lookup | False | True | True |
| LinkdaNotaFiscal | Link da Nota Fiscal | URL | False | False | False |
| LinkdoComprovante | Link do Comprovante | URL | False | False | False |
| LinkFilename | Nome | Computed | False | True | True |
| LinkFilename2 | Nome | Computed | False | True | True |
| LinkFilenameNoMenu | Nome | Computed | False | True | True |
| LinkTitle | Título do Pagamento | Computed | False | True | False |
| LinkTitle2 | Título | Computed | False | True | True |
| LinkTitleNoMenu | Título | Computed | False | True | False |
| MainLinkSettings | Configurações do Link principal | Computed | False | True | True |
| MetaInfo | Conjunto de Propriedades | Lookup | False | False | True |
| Modified | Modificado | DateTime | False | True | False |
| N_x00ba_daMedi_x00e7__x00e3_odoP | Nº da Medição do Prestador | Text | False | False | False |
| N_x00ba_daNotaFiscal | Nº da Nota Fiscal | Text | False | False | False |
| NoExecute | NãoExecutar | Lookup | False | True | True |
| Obra | Obra | Lookup | True | False | False |
| Observa_x00e7__x00f5_es | Observações | Note | False | False | False |
| Order | Ordem | Number | False | False | True |
| OrigemdoPagamento | Origem do Pagamento | Choice | False | False | False |
| OriginatorId | ID do Originador | Lookup | False | True | True |
| owshiddenversion | owshiddenversion | Integer | False | True | True |
| ParentUniqueId | Identificador Pai do Documento | Lookup | False | True | True |
| PermMask | Máscara de Permissões Efetivas | Computed | False | True | True |
| PrazodaPr_x00f3_ximaA_x00e7__x00 | Prazo da Próxima Ação | DateTime | False | False | False |
| PrincipalCount | Contagem de principais | Computed | False | True | True |
| ProgId | ProgId | Lookup | False | True | True |
| Respons_x00e1_velpeloLan_x00e7_a | Responsável pelo Lançamento | User | False | False | False |
| Restricted | Restrito | Lookup | False | True | True |
| Reten_x00e7__x00f5_es_x002f_Desc | Retenções / Descontos | Currency | False | False | False |
| ScopeId | ScopeId | Lookup | False | True | True |
| SelectTitle | Selecionar | Computed | False | True | True |
| ServerUrl | URL Relativa do Servidor | Computed | False | True | True |
| SMLastModifiedDate | Data da Última Modificação | Lookup | False | True | True |
| SMTotalFileCount | Contagem Total de Arquivos | Lookup | False | True | True |
| SMTotalFileStreamSize | Tamanho Total do Fluxo de Arquivos | Lookup | False | True | True |
| SMTotalSize | Tamanho Total | Lookup | False | True | True |
| SortBehavior | Tipo de Classificação | Lookup | False | True | True |
| StatusdoPagamento | Status do Pagamento | Choice | False | False | False |
| SyncClientId | ID de Cliente | Lookup | False | True | True |
| Title | Título | Text | False | False | False |
| UniqueId | Id Exclusiva | Lookup | False | True | True |
| Valor_x0020_L_x00ed_quido_x0020_ | Valor Líquido a Pagar Calculado | Calculated | False | True | False |
| ValorBruto | Valor Bruto | Currency | False | False | False |
| ValorL_x00ed_quidoaPagar | Valor Líquido a Pagar | Currency | False | False | False |
| WorkflowInstanceID | ID da Instância do Fluxo de Trabalho | Guid | False | True | True |
| WorkflowVersion | Versão do Fluxo de Trabalho | Integer | False | True | True |

## Confirmacoes pendentes antes de ProgramarPagamento

- Confirmar campo real de vinculo com a NF Lista 04 item 4.
- Confirmar se o vinculo com NF e lookup ou texto.
- Confirmar campo de fornecedor e se deve herdar Fornecedor0 da NF.
- Confirmar campo de valor e se aceita 6720.
- Confirmar campo de vencimento e se deve copiar DatadeVencimento da NF.
- Confirmar choices reais e status inicial de pagamento/programacao.
- Confirmar campos de forma de pagamento, banco, conta, PIX ou boleto.
- Confirmar campos obrigatorios de obra e centro de custo.
- Confirmar como detectar duplicidade para a NF 4.
- Confirmar se anexos, boleto ou comprovante sao obrigatorios na programacao.
