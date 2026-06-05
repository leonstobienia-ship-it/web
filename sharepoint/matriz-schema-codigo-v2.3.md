# Matriz Schema versus Código V2.3

| Lista | Nome exibido | Nome interno esperado | Tipo esperado | Uso no código | Status |
| --- | --- | --- | --- | --- | --- |
| Lista 01 - Controle de Obras ENAC | Lista operacional Obras | `a9afadc1-f843-45c0-a628-4f49a8716832` | GUID de lista existente | Scripts resolvem por GUID; titulo apenas para log | Compatível |
| Lista 02 — Requisições de Compra | Lista operacional Solicitações | `0a204b87-b9a1-4d16-8654-55567a62ed01` | GUID de lista existente | Scripts resolvem por GUID; titulo apenas para log | Compatível |
| ENAC Usuarios Perfis | Usuário Interno ID | UsuarioInternoId | Texto, obrigatório, `Indexed=TRUE`, `EnforceUniqueValues=TRUE` | `mapUsuarioPerfil`, `resolverAprovadorEfetivo` | Compatível |
| ENAC Usuarios Perfis | Perfis Adicionais | PerfisAdicionais | Múltipla escolha | `mapUsuarioPerfil` | Corrige o campo singular usado no desenho anterior |
| ENAC Usuarios Perfis | Usuário Ativo | UsuarioAtivo | Sim/Não | `listarUsuariosPerfis({ somenteAtivos })`, resolução de aprovador | Compatível |
| ENAC Usuarios Perfis | Conta Microsoft 365 | ContaMicrosoft365 | Pessoa, `AllowMultipleValues=FALSE` | `obterUsuarioPorContaMicrosoft365`, `mapUsuarioPerfil` | Compatível |
| ENAC Usuarios Perfis | Substituto Temporário | SubstitutoTemporario | Lookup para ENAC Usuarios Perfis | `mapUsuarioPerfil`, `resolverAprovadorEfetivo` | Provisionado como self lookup |
| ENAC Usuarios Perfis | Início Substituição | InicioSubstituicao | `Type=DateTime`, `Format=DateOnly` | `resolverAprovadorEfetivo` | Compatível |
| ENAC Usuarios Perfis | Fim Substituição | FimSubstituicao | `Type=DateTime`, `Format=DateOnly` | `resolverAprovadorEfetivo` | Compatível |
| ENAC Alcadas | Regra Interna ID | RegraInternaId | Texto, obrigatório, `Indexed=TRUE`, `EnforceUniqueValues=TRUE` | `mapAlcada`, `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Alcadas | Processo | Processo | Escolha | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Tipo Solicitação | TipoSolicitacao | Escolha: Material, Serviço, Equipamento, Ferramenta, Locação, Terceiro/Prestador, EPI, Documento/Taxa, Outro | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Choices reais da Lista 02 |
| ENAC Alcadas | Obra | Obra | Lookup para Lista 01 por GUID `a9afadc1-f843-45c0-a628-4f49a8716832` / `NomedaObra`, com regra geral controlada | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Provisionado |
| ENAC Alcadas | Valor Mínimo | ValorMinimo | `Type=Currency`, `LCID=1046`, `Decimals=2` | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Valor Máximo | ValorMaximo | `Type=Currency`, `LCID=1046`, `Decimals=2`, opcional | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Ilimitado | Ilimitado | Sim/Não | `mapAlcada`, `selecionarRegraAlcadaCompra` | Compatível |
| ENAC Alcadas | Vigência Inicial | VigenciaInicial | `Type=DateTime`, `Format=DateOnly` | `regraVigenteNaData` | Compatível |
| ENAC Alcadas | Vigência Final | VigenciaFinal | `Type=DateTime`, `Format=DateOnly`, opcional | `regraVigenteNaData` | Compatível |
| ENAC Alcadas | Aprovador Principal | AprovadorPrincipal | Lookup para ENAC Usuarios Perfis | `mapAlcada`, `resolverAprovadorEfetivo` | Provisionado |
| ENAC Alcadas | Aprovador Adicional | AprovadorAdicional | Lookup para ENAC Usuarios Perfis opcional | `mapAlcada` | Provisionado; sem fluxo adicional nesta rodada |
| ENAC Historico Configuracoes | Ação Realizada | AcaoRealizada | Escolha | histórico administrativo | Provisionado obrigatório |
| ENAC Historico Configuracoes | ID do Item Configurado | ItemConfiguracaoId | Texto | histórico administrativo | Provisionado obrigatório |
| ENAC Snapshots Regras | Regra Alçada Utilizada | RegraAlcadaUtilizada | Lookup para ENAC Alcadas | `persistirSnapshotAprovacaoCompra` | Provisionado |
| ENAC Snapshots Regras | ID Interno da Regra Aplicada | RegraInternaId | Texto | `criarSnapshotAprovacaoCompra` | Congelado |
| ENAC Snapshots Regras | Resumo da Regra Aplicada | ResumoRegraAplicada | Múltiplas linhas de texto | `criarSnapshotAprovacaoCompra` | Congelado |
| ENAC Snapshots Regras | Solicitação | Solicitacao | Lookup para Lista 02 por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01` / `ID` | `persistirSnapshotAprovacaoCompra` | Corrigido para ID |
| ENAC Snapshots Regras | Valor Analisado | ValorAnalisado | `Type=Currency`, `LCID=1046`, `Decimals=2` | `persistirSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base ID | AprovadorBaseId | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base Nome | AprovadorBaseNome | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base E-mail | AprovadorBaseEmail | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo ID | AprovadorEfetivoId | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo Nome | AprovadorEfetivoNome | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo E-mail | AprovadorEfetivoEmail | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Substituição Aplicada | SubstituicaoAplicada | Sim/Não | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Motivo Resolução Aprovador | MotivoResolucaoAprovador | Múltiplas linhas de texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Motivo Exceção | MotivoExcecao | Múltiplas linhas de texto opcional | `criarSnapshotAprovacaoCompra` | Compatível |
| Lista 02 — Requisições de Compra | Snapshot Aprovação Compra | SnapshotAprovacaoCompra | Lookup para ENAC Snapshots Regras, criado na Lista 02 por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01` | `listarSolicitacoes`, `persistirSnapshotAprovacaoCompra` | Provisionado |

## Observações

- `AprovadorSubstituto` não deve ser criado em `ENAC Alcadas` nesta rodada.
- `SnapshotRegraAtual` não deve ser usado na lista real de requisições.
- `Cotacao` e `PedidoCompra` não fazem parte do escopo inicial de `ENAC Snapshots Regras`.
- Aprovador base e efetivo devem ser congelados em campos texto no snapshot inicial, sem lookup para usuários.
- `ENAC Obras` e `ENAC Solicitacoes` são entidades lógicas; fisicamente usar `Lista 01 - Controle de Obras ENAC` e `Lista 02 — Requisições de Compra`, resolvidas por GUID nos scripts.
- As listas administrativas `ENAC Usuarios Perfis`, `ENAC Alcadas`, `ENAC Historico Configuracoes` e `ENAC Snapshots Regras` foram provisionadas em 2026-06-04.
- Campos já existentes com nomes internos diferentes devem ser mapeados antes de alterar o repositório.
