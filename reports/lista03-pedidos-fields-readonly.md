# Auditoria readonly Lista 03 - Pedidos de Compra

Data local: 2026-06-09 09:19:44
Modo: readonly conectado
Site: 05 - Obras em Andamento
Url: https://enaccombr.sharepoint.com/sites/Equipe.Obras
Lista: Lista 03 — Pedidos de Compra
GUID: 18ca132a-c36a-42aa-9968-d87ecd547a79
Itens: 2

## Confirmacoes

- O script le apenas metadados da lista e campos.
- O script nao altera listas, campos, itens, permissoes ou dados.
- O script nao le conteudo de itens de pedido.
- O script nao executa escrita operacional.

## Campos destacados

| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto | Choices | LookupList | LookupField | Formula |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C_x00f3_digodaObra | Código da Obra | Lookup | False | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Title |  |
| CentrodeCusto | Centro de Custo | Text | False | False | False |  |  |  |  |
| DatadoPedido | Data do Pedido | DateTime | False | False | False |  |  |  |  |
| Fornecedor | Fornecedor antigo | Text | False | False | False |  |  |  |  |
| Fornecedor0 | Fornecedor | Lookup | True | False | False |  | 953cc56f-108b-4818-9ffc-cc522cd1b62d | CNPJ_x002f_CPF |  |
| N_x00ba_daRequisi_x00e7__x00e3_o | Nº da Requisição | Text | False | False | False |  |  |  |  |
| Obra | Obra | Lookup | True | False | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | NomedaObra |  |
| Obra_x003a__x0020_Cliente | Obra: Cliente | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Cliente |  |
| Obra_x003a__x0020_Nome_x0020_da_ | Obra: Nome da Obra | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | NomedaObra |  |
| Obra_x003a__x0020_T_x00ed_tulo | Obra: Título | Lookup | True | True | False |  | a9afadc1-f843-45c0-a628-4f49a8716832 | Title |  |
| StatusdoPedido | Status do Pedido | Choice | False | False | False | Em elaboração, Aguardando aprovação, Aprovado, Enviado ao fornecedor, Aguardando entrega, Entregue parcial, Entregue total, Cancelado |  |  |  |
| Title | Título | Text | False | False | False |  |  |  |  |
| ValordoPedido | Valor do Pedido | Currency | False | False | False |  |  |  |  |

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
| CentrodeCusto | Centro de Custo | Text | False | False | False |
| CNPJ_x002f_CPFFornecedor | CNPJ/CPF Fornecedor | Text | False | False | False |
| ComplianceAssetId | ID de Ativo de Conformidade | Text | False | True | False |
| Condi_x00e7__x00e3_odePagamento | Condição de Pagamento | Text | False | False | False |
| ContentType | Tipo de Conteúdo | Computed | False | False | False |
| ContentTypeId | ID do Tipo de Conteúdo | ContentTypeId | False | True | True |
| ContentVersion | Versão do Conteúdo | Lookup | False | True | True |
| Created | Criado | DateTime | False | True | False |
| Created_x0020_Date | Criado | Lookup | False | True | True |
| DatadoPedido | Data do Pedido | DateTime | False | False | False |
| Descri_x00e7__x00e3_odoPedido | Descrição do Pedido | Note | False | False | False |
| DocIcon | Tipo | Computed | False | True | False |
| Edit | Editar | Computed | False | True | False |
| Editor | Modificado por | User | False | True | False |
| EncodedAbsUrl | URL Absoluta Codificada | Computed | False | True | True |
| File_x0020_Type | Tipo de Arquivo | Text | False | True | True |
| FileDirRef | Caminho | Lookup | False | True | True |
| FileLeafRef | Nome | File | False | False | True |
| FileRef | Caminho da URL | Lookup | False | True | True |
| FolderChildCount | Contagem de Elementos Filho da Pasta | Lookup | False | True | False |
| Fornecedor | Fornecedor antigo | Text | False | False | False |
| Fornecedor_x003a__x0020_CNPJ_x00 | Fornecedor: CNPJ / CPF | Lookup | True | True | False |
| Fornecedor_x003a__x0020_Contato_ | Fornecedor: Contato Principal | Lookup | True | True | False |
| Fornecedor_x003a__x0020_Inscri_x | Fornecedor: Inscrição Estadual | Lookup | True | True | False |
| Fornecedor_x003a__x0020_Inscri_x0 | Fornecedor: Inscrição Municipal | Lookup | True | True | False |
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
| LinkdoPedido_x002f_Documento | Link do Pedido / Documento | URL | False | False | False |
| LinkFilename | Nome | Computed | False | True | True |
| LinkFilename2 | Nome | Computed | False | True | True |
| LinkFilenameNoMenu | Nome | Computed | False | True | True |
| LinkTitle | Nº do Pedido | Computed | False | True | False |
| LinkTitle2 | Título | Computed | False | True | True |
| LinkTitleNoMenu | Título | Computed | False | True | False |
| MainLinkSettings | Configurações do Link principal | Computed | False | True | True |
| MetaInfo | Conjunto de Propriedades | Lookup | False | False | True |
| Modified | Modificado | DateTime | False | True | False |
| N_x00ba_daRequisi_x00e7__x00e3_o | Nº da Requisição | Text | False | False | False |
| NoExecute | NãoExecutar | Lookup | False | True | True |
| Obra | Obra | Lookup | True | False | False |
| Obra_x003a__x0020_Cliente | Obra: Cliente | Lookup | True | True | False |
| Obra_x003a__x0020_Nome_x0020_da_ | Obra: Nome da Obra | Lookup | True | True | False |
| Obra_x003a__x0020_T_x00ed_tulo | Obra: Título | Lookup | True | True | False |
| Observa_x00e7__x00f5_es | Observações | Note | False | False | False |
| Order | Ordem | Number | False | False | True |
| OriginatorId | ID do Originador | Lookup | False | True | True |
| owshiddenversion | owshiddenversion | Integer | False | True | True |
| ParentUniqueId | Identificador Pai do Documento | Lookup | False | True | True |
| PermMask | Máscara de Permissões Efetivas | Computed | False | True | True |
| PrazodeEntrega | Prazo de Entrega | DateTime | False | False | False |
| PrincipalCount | Contagem de principais | Computed | False | True | True |
| ProgId | ProgId | Lookup | False | True | True |
| Restricted | Restrito | Lookup | False | True | True |
| ScopeId | ScopeId | Lookup | False | True | True |
| SelectTitle | Selecionar | Computed | False | True | True |
| ServerUrl | URL Relativa do Servidor | Computed | False | True | True |
| SMLastModifiedDate | Data da Última Modificação | Lookup | False | True | True |
| SMTotalFileCount | Contagem Total de Arquivos | Lookup | False | True | True |
| SMTotalFileStreamSize | Tamanho Total do Fluxo de Arquivos | Lookup | False | True | True |
| SMTotalSize | Tamanho Total | Lookup | False | True | True |
| SortBehavior | Tipo de Classificação | Lookup | False | True | True |
| StatusdoPedido | Status do Pedido | Choice | False | False | False |
| SyncClientId | ID de Cliente | Lookup | False | True | True |
| TipodoPedido | Tipo do Pedido | Choice | False | False | False |
| Title | Título | Text | False | False | False |
| UniqueId | Id Exclusiva | Lookup | False | True | True |
| ValordoPedido | Valor do Pedido | Currency | False | False | False |
| WorkflowInstanceID | ID da Instância do Fluxo de Trabalho | Guid | False | True | True |
| WorkflowVersion | Versão do Fluxo de Trabalho | Integer | False | True | True |

## Pendencias para V2.7A.5B

- Confirmar se SolicitacaoId existe ou qual campo vincula a Lista 02.
- Confirmar fornecedor correto: Fornecedor texto legado ou Fornecedor0 lookup.
- Confirmar choices reais e status inicial de StatusdoPedido.
- Confirmar campos obrigatorios antes de qualquer criacao.
- Confirmar se ha pedido existente vinculado ao item 11 antes de qualquer escrita.
