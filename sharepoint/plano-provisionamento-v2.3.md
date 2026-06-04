# Plano de Provisionamento SharePoint V2.3

## Premissas

- O inventario readonly V2.3A confirmou listas operacionais numeradas já existentes.
- Não recriar automaticamente listas/campos existentes.
- Validar nomes internos antes de apontar a webpart para produção.
- Não implementar Power Automate nesta rodada.
- O aplicativo readonly atual serve apenas para inventário e dry-run de leitura.

## Listas a validar

1. `Lista 01 - Controle de Obras ENAC`
2. `Lista 02 — Requisições de Compra`
3. `Lista 03 — Pedidos de Compra`
4. `Lista 04 - Notas Fiscais Recebidas`
5. `05 — Contas a Pagar`
6. `Lista 10 — Contas a Pagar / Programação Financeira`
7. Demais listas operacionais 06 a 14 conforme `mapeamento-listas-reais-v2.3.md`
8. Bibliotecas padrão do site, apenas se forem referenciadas por campos URL/anexo
9. `ENAC Usuarios Perfis`
10. `ENAC Alcadas`
11. `ENAC Historico Configuracoes`
12. `ENAC Snapshots Regras`

Diretriz operacional: scripts devem localizar listas fisicas existentes pelos GUIDs confirmados no inventario, nao pelo titulo visivel. Titulos sao usados apenas para exibicao e conferencia humana.

| Entidade lógica | GUID operacional |
| --- | --- |
| Obras / Lista 01 | `a9afadc1-f843-45c0-a628-4f49a8716832` |
| Solicitações / Lista 02 | `0a204b87-b9a1-4d16-8654-55567a62ed01` |

## Listas novas prováveis

- `ENAC Usuarios Perfis`.
- `ENAC Alcadas`.
- `ENAC Historico Configuracoes`.
- `ENAC Snapshots Regras`.

Não criar `ENACObras`, `ENAC Obras`, `ENACSolicitacoes` ou `ENAC Solicitacoes` como listas físicas nesta rodada.

## URLs técnicas planejadas

| Título exibido | URL técnica planejada |
| --- | --- |
| `ENAC Usuarios Perfis` | `Lists/ENACUsuariosPerfis` |
| `ENAC Alcadas` | `Lists/ENACAlcadas` |
| `ENAC Historico Configuracoes` | `Lists/ENACHistoricoConfiguracoes` |
| `ENAC Snapshots Regras` | `Lists/ENACSnapshotsRegras` |

## Ordem de criação

1. Validar `Lista 01 - Controle de Obras ENAC` por GUID `a9afadc1-f843-45c0-a628-4f49a8716832`.
2. Validar `Lista 02 — Requisições de Compra` por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01`.
3. Criar/validar `ENAC Usuarios Perfis`.
4. Criar/validar `ENAC Alcadas`, com lookup de obra para a Lista 01 resolvida por GUID.
5. Criar/validar `ENAC Historico Configuracoes`.
6. Criar/validar `ENAC Snapshots Regras`.
7. Criar lookup `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra` para `ENAC Snapshots Regras`, usando a Lista 02 resolvida por GUID.
8. Configurar permissões SharePoint somente em rodada futura autorizada.

## Colunas críticas a criar ou ajustar

### ENAC Usuarios Perfis

| Nome interno | Nome exibido | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- | --- |
| `Title` | Nome Completo | Text | Sim | Campo padrão |
| `UsuarioInternoId` | ID Interno do Usuário | Text | Sim | `Indexed=TRUE`; `EnforceUniqueValues=TRUE` |
| `ContaMicrosoft365` | Conta Microsoft 365 | User | Sim | Uma pessoa; `AllowMultipleValues=FALSE` |
| `EmailCorporativo` | E-mail Corporativo | Text | Sim | Usado no snapshot |
| `CargoFuncao` | Cargo / Função | Text | Não |  |
| `PerfilPrincipal` | Perfil Principal | Choice | Sim | Choices conforme perfis homologados V2.2 |
| `PerfisAdicionais` | Perfis Adicionais | MultiChoice | Não | Corrige o campo singular anterior |
| `PodeCriarSolicitacao` | Pode Criar Solicitação | Boolean | Sim | Padrão `false` |
| `PodeRegistrarCotacoes` | Pode Registrar Cotações | Boolean | Sim | Padrão `false` |
| `PodeAprovarCompras` | Pode Aprovar Compras | Boolean | Sim | Padrão `false` |
| `PodeEmitirPedido` | Pode Emitir Pedido | Boolean | Sim | Padrão `false` |
| `PodeVincularNF` | Pode Vincular NF | Boolean | Sim | Padrão `false` |
| `PodeProgramarPagamento` | Pode Programar Pagamento | Boolean | Sim | Padrão `false` |
| `PodeLiberarPagamento` | Pode Liberar Pagamento | Boolean | Sim | Padrão `false` |
| `PodeAtualizarStatusFinal` | Pode Atualizar Status Final | Boolean | Sim | Padrão `false` |
| `PodeAdministrarConfiguracoes` | Pode Administrar Configurações | Boolean | Sim | Padrão `false` |
| `UsuarioAtivo` | Usuário Ativo | Boolean | Sim | Padrão `true` |
| `SubstitutoTemporario` | Substituto Temporário | Lookup | Não | Self lookup para `ENAC Usuarios Perfis` |
| `InicioSubstituicao` | Início da Substituição | DateTime/Data somente | Não | Sem horário |
| `FimSubstituicao` | Fim da Substituição | DateTime/Data somente | Não | Sem horário |
| `Observacoes` | Observações | Note | Não |  |

### ENAC Alcadas

| Nome interno | Nome exibido | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- | --- |
| `Title` | Regra | Text | Sim | Campo padrão |
| `RegraInternaId` | ID Interno da Regra | Text | Sim | Único e indexado |
| `Processo` | Processo | Choice | Sim | Compra, Liberação Bancária, Medição, Pagamento, Outro |
| `TipoSolicitacao` | Tipo de Solicitação | Choice | Não | Choices reais: Material, Serviço, Equipamento, Ferramenta, Locação, Terceiro/Prestador, EPI, Documento/Taxa, Outro |
| `Obra` | Obra | Lookup | Não | Lista 01 por GUID `a9afadc1-f843-45c0-a628-4f49a8716832` / `NomedaObra`; vazio significa regra geral |
| `ValorMinimo` | Valor Mínimo | Currency | Sim | `LCID=1046`; `Decimals=2` |
| `ValorMaximo` | Valor Máximo | Currency | Não | `LCID=1046`; `Decimals=2`; vazio quando ilimitado |
| `Ilimitado` | Sem Limite Máximo | Boolean | Sim | Padrão `false` |
| `AprovadorPrincipal` | Aprovador Principal | Lookup | Sim | `ENAC Usuarios Perfis` |
| `ExigeAprovacaoAdicional` | Exige Aprovação Adicional | Boolean | Sim | Padrão `false` |
| `AprovadorAdicional` | Aprovador Adicional | Lookup | Não | `ENAC Usuarios Perfis` |
| `VigenciaInicial` | Vigência Inicial | DateTime/Data somente | Sim | Sem horário |
| `VigenciaFinal` | Vigência Final | DateTime/Data somente | Não | Sem horário |
| `Ativo` | Regra Ativa | Boolean | Sim | Padrão `true` |
| `Observacoes` | Observações | Note | Não |  |

### ENAC Historico Configuracoes

| Nome interno | Nome exibido | Tipo | Obrigatório |
| --- | --- | --- | --- |
| `Title` | Resumo do Evento | Text | Sim |
| `TipoConfiguracao` | Tipo de Configuração | Choice | Sim |
| `AcaoRealizada` | Ação Realizada | Choice | Sim |
| `ItemConfiguracaoId` | ID do Item Configurado | Text | Sim |
| `ValorAnterior` | Valor Anterior | Note | Não |
| `ValorNovo` | Valor Novo | Note | Sim |
| `Justificativa` | Justificativa | Note | Não |

Choices mínimos:

- `TipoConfiguracao`: Usuário, Alçada, Regra Especial, Parâmetro Geral.
- `AcaoRealizada`: Inclusão, Edição, Ativação, Desativação, Ajuste Vinculado.

Não criar campos customizados para autor e data/hora; usar `Author` e `Created` nativos do SharePoint.

### ENAC Snapshots Regras

| Nome interno | Nome exibido | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- | --- |
| `Title` | Código do Snapshot | Text | Sim | Campo padrão |
| `Solicitacao` | Solicitação | Lookup | Sim | Lista 02 por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01` / `ID` |
| `RegraAlcadaUtilizada` | Regra de Alçada Utilizada | Lookup | Sim | `ENAC Alcadas` |
| `RegraInternaId` | ID Interno da Regra Aplicada | Text | Sim | Congelado |
| `ResumoRegraAplicada` | Resumo da Regra Aplicada | Note | Sim | Congelado |
| `Processo` | Processo | Choice | Sim | Inicialmente Compra |
| `FaixaValorVigente` | Faixa de Valor Vigente | Text | Sim | Texto congelado |
| `ValorAnalisado` | Valor Analisado | Currency | Sim | `LCID=1046`; `Decimals=2` |
| `AprovadorBaseId` | ID do Aprovador Base | Text | Sim | Congelado |
| `AprovadorBaseNome` | Nome do Aprovador Base | Text | Sim | Congelado |
| `AprovadorBaseEmail` | E-mail do Aprovador Base | Text | Sim | Congelado |
| `AprovadorEfetivoId` | ID do Aprovador Efetivo | Text | Sim | Congelado |
| `AprovadorEfetivoNome` | Nome do Aprovador Efetivo | Text | Sim | Congelado |
| `AprovadorEfetivoEmail` | E-mail do Aprovador Efetivo | Text | Sim | Congelado |
| `SubstituicaoAplicada` | Substituição Aplicada | Boolean | Sim | Padrão `false` |
| `MotivoResolucaoAprovador` | Motivo da Resolução do Aprovador | Note | Não |  |
| `MotivoExcecao` | Motivo da Exceção | Note | Não |  |
| `DataHoraAplicacao` | Data/Hora da Aplicação | DateTime | Sim | Data e hora |

Não planejar nesta rodada `Cotacao`, `PedidoCompra` nem lookups de aprovador base/efetivo. Os aprovadores ficam congelados em texto no snapshot inicial.

### Lista 02 — Requisições de Compra

- `SnapshotAprovacaoCompra`: lookup para `ENAC Snapshots Regras`, criado na Lista 02 resolvida por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01`.

## Configurações das listas novas

| Lista | Versionamento | Anexos | Edição em grade |
| --- | --- | --- | --- |
| `ENAC Usuarios Perfis` | Ativo | Desativados | Desativada |
| `ENAC Alcadas` | Ativo | Desativados | Desativada |
| `ENAC Historico Configuracoes` | Ativo | Desativados | Desativada |
| `ENAC Snapshots Regras` | Ativo | Desativados | Desativada |

Versionamento e bloqueio de edição em grade reduzem risco operacional. Snapshots e histórico somente serão considerados efetivamente protegidos após definição/aplicação de permissões específicas e uso controlado pelo sistema/automação.

Campos `Note` devem ser texto simples, sem rich text. Campos de data sem horário usam `Type=DateTime` e `Format=DateOnly`; `DataHoraAplicacao` usa `Type=DateTime` e `Format=DateTime`.

## Mapeamento de nomes existentes

Antes de gravar dados:

1. Usar `sharepoint/mapeamento-listas-reais-v2.3.md` como referência física.
2. Comparar com `sharepoint/list-schema.json`.
3. Registrar divergências no dry-run.
4. Adaptar `SharePointEnacRepository.ts` para nomes reais somente após provisionamento aprovado.

## Permissões

- Administração de usuários e alçadas: apenas Administrador do Sistema.
- Histórico de configurações: inclusão controlada, sem edição comum.
- Snapshots: criação pelo sistema, sem edição comum.
- Listas operacionais: permissões por perfil ainda pendentes de desenho final.
