# Auditoria readonly Lista 04 - Notas Fiscais

Data local: 2026-06-09 10:38:22
Modo: readonly conectado
Site: 05 - Obras em Andamento
Url: https://enaccombr.sharepoint.com/sites/Equipe.Obras
Lista: Lista 04 - Notas Fiscais Recebidas
GUID: 25aa4447-193d-418a-8e71-9bfd8e9995da
Itens: 3

## Confirmacoes

- O script le apenas metadados da lista e campos.
- O script nao altera listas, campos, itens, permissoes ou dados.
- O script nao executa escrita operacional.
- O script nao inicia Power Automate.

## Campos destacados

| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto | Choices | LookupList | LookupField | Formula |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _CommentFlags | Configurações de comentários | Lookup | False | True | True |  |  | CommentFlags |  |
| _ComplianceFlags | Configuração do rótulo | Lookup | False | True | False |  |  | ComplianceFlags |  |
| _ModerationStatus | Status de Aprovação | ModStat | False | True | True |  |  |  |  |
| _RansomwareAnomalyMetaInfo | RansomwareAnomalyMetaInfo | Lookup | False | True | True |  |  | RansomwareAnomalyMetaInfo |  |
| _VirusInfo | VirusInfo | Lookup | False | True | True |  |  | VirusInfo |  |
| _VirusStatus | VirusStatus | Lookup | False | True | True |  |  | VirusStatus |  |
| Attachments | Anexos | Attachments | False | False | False |  |  |  |  |
| C_x00f3_digodaObra | Código da Obra | Lookup | False | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Title |  |
| CentrodeCusto | Centro de Custo | Text | False | False | False |  |  |  |  |
| CNPJFornecedor | CNPJ Fornecedor | Text | False | False | False |  |  |  |  |
| ComplianceAssetId | ID de Ativo de Conformidade | Text | False | True | False |  |  |  |  |
| DatadeEmiss_x00e3_o | Data de Emissão | DateTime | False | False | False |  |  |  |  |
| DatadeVencimento | Data de Vencimento | DateTime | False | False | False |  |  |  |  |
| Fornecedor_x003a__x0020_CNPJ_x00 | Fornecedor: CNPJ / CPF | Lookup | True | True | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | CNPJ_x002f_CPF |  |
| Fornecedor_x003a__x0020_Nome_x00 | Fornecedor: Nome Fantasia | Lookup | True | True | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | NomeFantasia |  |
| Fornecedor_x003a__x0020_T_x00ed_ | Fornecedor: Título | Lookup | True | True | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | Title |  |
| Fornecedor0 | Fornecedor | Lookup | True | False | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | NomeFantasia |  |
| LinkdaNFnoSharePoint | Link da NF no SharePoint | URL | False | False | False |  |  |  |  |
| LinkTitle | Nº Controle NF | Computed | False | True | False |  |  |  |  |
| MainLinkSettings | Configurações do Link principal | Computed | False | True | True |  |  |  |  |
| MetaInfo | Conjunto de Propriedades | Lookup | False | False | True |  |  | MetaInfo |  |
| N_x00ba_daNotaFiscal | Nº da Nota Fiscal | Text | False | False | False |  |  |  |  |
| N_x00ba_doPedido | Nº do Pedido | Text | False | False | False |  |  |  |  |
| Obra | Obra | Lookup | True | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | NomedaObra |  |
| Obra_x003a__x0020_Centro_x0020_d | Obra: Centro de Custo | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | CentrodeCusto |  |
| Obra_x003a__x0020_Cliente | Obra: Cliente | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Cliente |  |
| Obra_x003a__x0020_Nome_x0020_da_ | Obra: Nome da Obra | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | NomedaObra |  |
| Obra_x003a__x0020_T_x00ed_tulo | Obra: Título | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Title |  |
| ParentUniqueId | Identificador Pai do Documento | Lookup | False | True | True |  |  | ParentUniqueId |  |
| Respons_x00e1_velpelaConfer_x00e | Responsável pela Conferência | User | False | False | False |  | {ebc81507-41be-46f3-9eac-dafe1234a71d} |  |  |
| S_x00e9_rieNF | Série NF | Text | False | False | False |  |  |  |  |
| StatusdaConfer_x00ea_ncia | Status da Conferência | Choice | False | False | False | Recebida, Em conferência, Aguardando correção do fornecedor, Aguardando aprovação, Aprovada para pagamento, Reprovada, Enviada para contabilidade, Cancelada |  |  |  |
| TipodeNF | Tipo de NF | Choice | False | False | False | Material, Serviço, Locação, Equipamento, Transporte, EPI, Terceiro / Prestador, Taxa / Documento, Outro |  |  |  |
| Title | Título | Text | False | False | False |  |  |  |  |
| Valor_x0020_Liquido_x0020_a_x002 | Valor Liquido a Pagar | Calculated | False | True | False |  |  |  | =[Valor Bruto da NF]-[Retenções / Descontos] |
| Valor_x0020_Liquido_x0020_Calcul | Valor Liquido Calculado | Calculated | False | True | False |  |  |  | =[Valor Bruto da NF]-[Retenções / Descontos] |
| ValorBrutodaNF | Valor Bruto da NF | Currency | False | False | False |  |  |  |  |

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
| Attachments | Anexos | Attachments | False | False | False |
| Author | Criado por | User | False | True | False |
| BaseName | Nome do Arquivo | Computed | False | True | True |
| C_x00f3_digodaObra | Código da Obra | Lookup | False | False | False |
| CentrodeCusto | Centro de Custo | Text | False | False | False |
| CNPJFornecedor | CNPJ Fornecedor | Text | False | False | False |
| ComplianceAssetId | ID de Ativo de Conformidade | Text | False | True | False |
| ContentType | Tipo de Conteúdo | Computed | False | False | False |
| ContentTypeId | ID do Tipo de Conteúdo | ContentTypeId | False | True | True |
| ContentVersion | Versão do Conteúdo | Lookup | False | True | True |
| Created | Criado | DateTime | False | True | False |
| Created_x0020_Date | Criado | Lookup | False | True | True |
| DatadeEmiss_x00e3_o | Data de Emissão | DateTime | False | False | False |
| DatadeRecebimento | Data de Recebimento | DateTime | False | False | False |
| DatadeVencimento | Data de Vencimento | DateTime | False | False | False |
| DocIcon | Tipo | Computed | False | True | False |
| Edit | Editar | Computed | False | True | False |
| Editor | Modificado por | User | False | True | False |
| EncodedAbsUrl | URL Absoluta Codificada | Computed | False | True | True |
| EnviadaparaContabilidade_x003f_ | Enviada para Contabilidade? | Choice | True | False | False |
| File_x0020_Type | Tipo de Arquivo | Text | False | True | True |
| FileDirRef | Caminho | Lookup | False | True | True |
| FileLeafRef | Nome | File | False | False | True |
| FileRef | Caminho da URL | Lookup | False | True | True |
| FolderChildCount | Contagem de Elementos Filho da Pasta | Lookup | False | True | False |
| Fornecedor_x003a__x0020_CNPJ_x00 | Fornecedor: CNPJ / CPF | Lookup | True | True | False |
| Fornecedor_x003a__x0020_Nome_x00 | Fornecedor: Nome Fantasia | Lookup | True | True | False |
| Fornecedor_x003a__x0020_T_x00ed_ | Fornecedor: Título | Lookup | True | True | False |
| Fornecedor0 | Fornecedor | Lookup | True | False | False |
| FSObjType | Tipo de Item | Lookup | False | True | True |
| GUID | GUID | Guid | False | True | True |
| HTML_x0020_File_x0020_Type | Tipo de Arquivo HTML | Computed | False | True | True |
| ID | ID | Counter | False | True | False |
| InstanceID | ID da Instância | Integer | False | True | True |
| ItemChildCount | Contagem de Itens Filhos | Lookup | False | True | False |
| Last_x0020_Modified | Modificado | Lookup | False | True | True |
| LinkdaNFnoSharePoint | Link da NF no SharePoint | URL | False | False | False |
| LinkFilename | Nome | Computed | False | True | True |
| LinkFilename2 | Nome | Computed | False | True | True |
| LinkFilenameNoMenu | Nome | Computed | False | True | True |
| LinkTitle | Nº Controle NF | Computed | False | True | False |
| LinkTitle2 | Título | Computed | False | True | True |
| LinkTitleNoMenu | Título | Computed | False | True | False |
| MainLinkSettings | Configurações do Link principal | Computed | False | True | True |
| MetaInfo | Conjunto de Propriedades | Lookup | False | False | True |
| Modified | Modificado | DateTime | False | True | False |
| N_x00ba_daNotaFiscal | Nº da Nota Fiscal | Text | False | False | False |
| N_x00ba_doPedido | Nº do Pedido | Text | False | False | False |
| NoExecute | NãoExecutar | Lookup | False | True | True |
| Obra | Obra | Lookup | True | False | False |
| Obra_x003a__x0020_Centro_x0020_d | Obra: Centro de Custo | Lookup | True | True | False |
| Obra_x003a__x0020_Cliente | Obra: Cliente | Lookup | True | True | False |
| Obra_x003a__x0020_Nome_x0020_da_ | Obra: Nome da Obra | Lookup | True | True | False |
| Obra_x003a__x0020_T_x00ed_tulo | Obra: Título | Lookup | True | True | False |
| Observa_x00e7__x00f5_es | Observações | Note | False | False | False |
| Order | Ordem | Number | False | False | True |
| OriginatorId | ID do Originador | Lookup | False | True | True |
| owshiddenversion | owshiddenversion | Integer | False | True | True |
| ParentUniqueId | Identificador Pai do Documento | Lookup | False | True | True |
| PermMask | Máscara de Permissões Efetivas | Computed | False | True | True |
| PrincipalCount | Contagem de principais | Computed | False | True | True |
| ProgId | ProgId | Lookup | False | True | True |
| Respons_x00e1_velpelaConfer_x00e | Responsável pela Conferência | User | False | False | False |
| Restricted | Restrito | Lookup | False | True | True |
| Reten_x00e7__x00f5_es_x002f_Desc | Retenções / Descontos | Currency | False | False | False |
| S_x00e9_rieNF | Série NF | Text | False | False | False |
| ScopeId | ScopeId | Lookup | False | True | True |
| SelectTitle | Selecionar | Computed | False | True | True |
| ServerUrl | URL Relativa do Servidor | Computed | False | True | True |
| SMLastModifiedDate | Data da Última Modificação | Lookup | False | True | True |
| SMTotalFileCount | Contagem Total de Arquivos | Lookup | False | True | True |
| SMTotalFileStreamSize | Tamanho Total do Fluxo de Arquivos | Lookup | False | True | True |
| SMTotalSize | Tamanho Total | Lookup | False | True | True |
| SortBehavior | Tipo de Classificação | Lookup | False | True | True |
| StatusdaConfer_x00ea_ncia | Status da Conferência | Choice | False | False | False |
| SyncClientId | ID de Cliente | Lookup | False | True | True |
| TipodeNF | Tipo de NF | Choice | False | False | False |
| Title | Título | Text | False | False | False |
| UniqueId | Id Exclusiva | Lookup | False | True | True |
| Valor_x0020_Liquido_x0020_a_x002 | Valor Liquido a Pagar | Calculated | False | True | False |
| Valor_x0020_Liquido_x0020_Calcul | Valor Liquido Calculado | Calculated | False | True | False |
| ValorBrutodaNF | Valor Bruto da NF | Currency | False | False | False |
| WorkflowInstanceID | ID da Instância do Fluxo de Trabalho | Guid | False | True | True |
| WorkflowVersion | Versão do Fluxo de Trabalho | Integer | False | True | True |

## Pendencias para V2.7A.6

- Confirmar campo real de vinculo com pedido de compra: N_x00ba_doPedido texto ou outro campo.
- Confirmar se existe vinculo com requisicao de compra ou se sera indireto via pedido.
- Confirmar fornecedor correto: Fornecedor0 lookup ou CNPJFornecedor texto.
- Confirmar choices reais e status inicial de StatusdaConfer_x00ea_ncia.
- Confirmar campos obrigatorios para criar/vincular NF.
- Confirmar se anexo/documento/link da NF e obrigatorio.
- Confirmar se ja existe NF de teste vinculada ao pedido item 3 antes de qualquer escrita.
