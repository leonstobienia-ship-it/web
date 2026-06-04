# Matriz Schema versus Código V2.3

| Lista | Nome exibido | Nome interno esperado | Tipo esperado | Uso no código | Status |
| --- | --- | --- | --- | --- | --- |
| ENAC Usuarios Perfis | Conta Microsoft 365 | ContaMicrosoft365 | Pessoa ou Grupo, uma pessoa | `obterUsuarioPorContaMicrosoft365`, `mapUsuarioPerfil` | Compatível no contrato; validar nome interno no tenant |
| ENAC Usuarios Perfis | Usuário Interno ID | UsuarioInternoId | Texto, obrigatório, único, indexado | `mapUsuarioPerfil`, `resolverAprovadorEfetivo` | Compatível; criar índice/uniqueness |
| ENAC Usuarios Perfis | Perfis Adicionais | PerfisAdicionais | Múltipla escolha | `mapUsuarioPerfil` | Corrige o campo singular usado no desenho anterior |
| ENAC Usuarios Perfis | Usuário Ativo | UsuarioAtivo | Sim/Não | `listarUsuariosPerfis({ somenteAtivos })`, resolução de aprovador | Compatível |
| ENAC Usuarios Perfis | Substituto Temporário | SubstitutoTemporario | Lookup para ENAC Usuarios Perfis | `mapUsuarioPerfil`, `resolverAprovadorEfetivo` | Planejado como self lookup |
| ENAC Usuarios Perfis | Início Substituição | InicioSubstituicao | Data somente | `resolverAprovadorEfetivo` | Compatível |
| ENAC Usuarios Perfis | Fim Substituição | FimSubstituicao | Data somente | `resolverAprovadorEfetivo` | Compatível |
| ENAC Alcadas | Regra Interna ID | RegraInternaId | Texto, obrigatório, único, indexado | `mapAlcada`, `criarSnapshotAprovacaoCompra` | Compatível; criar índice/uniqueness |
| ENAC Alcadas | Processo | Processo | Escolha | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Tipo Solicitação | TipoSolicitacao | Escolha | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Obra | Obra | Lookup para `Lista 01 - Controle de Obras ENAC` / `NomedaObra`, com regra geral controlada | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Planejado; lista administrativa ausente |
| ENAC Alcadas | Valor Mínimo | ValorMinimo | Moeda/número | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Valor Máximo | ValorMaximo | Moeda/número opcional | `selecionarRegraAlcadaCompra`, `validarAlcadas` | Compatível |
| ENAC Alcadas | Ilimitado | Ilimitado | Sim/Não | `mapAlcada`, `selecionarRegraAlcadaCompra` | Compatível |
| ENAC Alcadas | Vigência Inicial | VigenciaInicial | Data/hora | `regraVigenteNaData` | Compatível |
| ENAC Alcadas | Vigência Final | VigenciaFinal | Data/hora opcional | `regraVigenteNaData` | Compatível |
| ENAC Alcadas | Aprovador Principal | AprovadorPrincipal | Lookup para ENAC Usuarios Perfis | `mapAlcada`, `resolverAprovadorEfetivo` | Planejado |
| ENAC Alcadas | Aprovador Adicional | AprovadorAdicional | Lookup para ENAC Usuarios Perfis opcional | `mapAlcada` | Planejado; sem fluxo adicional nesta rodada |
| ENAC Historico Configuracoes | Ação Realizada | AcaoRealizada | Escolha | histórico administrativo | Campo planejado obrigatório |
| ENAC Historico Configuracoes | ID do Item Configurado | ItemConfiguracaoId | Texto | histórico administrativo | Campo planejado obrigatório |
| ENAC Snapshots Regras | Regra Alçada Utilizada | RegraAlcadaUtilizada | Lookup para ENAC Alcadas | `persistirSnapshotAprovacaoCompra` | Planejado |
| ENAC Snapshots Regras | ID Interno da Regra Aplicada | RegraInternaId | Texto | `criarSnapshotAprovacaoCompra` | Congelado |
| ENAC Snapshots Regras | Resumo da Regra Aplicada | ResumoRegraAplicada | Múltiplas linhas de texto | `criarSnapshotAprovacaoCompra` | Congelado |
| ENAC Snapshots Regras | Valor Analisado | ValorAnalisado | Moeda/número | `persistirSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base ID | AprovadorBaseId | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base Nome | AprovadorBaseNome | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Base E-mail | AprovadorBaseEmail | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo ID | AprovadorEfetivoId | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo Nome | AprovadorEfetivoNome | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Aprovador Efetivo E-mail | AprovadorEfetivoEmail | Texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Substituição Aplicada | SubstituicaoAplicada | Sim/Não | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Motivo Resolução Aprovador | MotivoResolucaoAprovador | Múltiplas linhas de texto | `criarSnapshotAprovacaoCompra` | Compatível |
| ENAC Snapshots Regras | Motivo Exceção | MotivoExcecao | Múltiplas linhas de texto opcional | `criarSnapshotAprovacaoCompra` | Compatível |
| Lista 02 — Requisições de Compra | Snapshot Aprovação Compra | SnapshotAprovacaoCompra | Lookup para ENAC Snapshots Regras | `listarSolicitacoes`, `persistirSnapshotAprovacaoCompra` | Campo ausente; criar após `ENAC Snapshots Regras` |

## Observações

- `AprovadorSubstituto` não deve ser criado em `ENAC Alcadas` nesta rodada.
- `SnapshotRegraAtual` não deve ser usado na lista real de requisições.
- `Cotacao` e `PedidoCompra` não fazem parte do escopo inicial de `ENAC Snapshots Regras`.
- Aprovador base e efetivo devem ser congelados em campos texto no snapshot inicial, sem lookup para usuários.
- `ENAC Obras` e `ENAC Solicitacoes` são entidades lógicas; fisicamente usar `Lista 01 - Controle de Obras ENAC` e `Lista 02 — Requisições de Compra`.
- As listas administrativas `ENAC Usuarios Perfis`, `ENAC Alcadas`, `ENAC Historico Configuracoes` e `ENAC Snapshots Regras` estão ausentes no tenant e devem ser criadas somente após dry-run aprovado.
- Campos já existentes com nomes internos diferentes devem ser mapeados antes de alterar o repositório.
