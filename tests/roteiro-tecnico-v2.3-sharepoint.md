# Roteiro Técnico V2.3 SharePoint

## Cenário base

Solicitação de compra no valor de `R$ 6.720,00`.

## Testes após provisionamento

1. Abrir a webpart no contexto Microsoft 365.
2. Resolver o usuário autenticado por `ContaMicrosoft365`.
3. Confirmar que usuário inativo é bloqueado para novas alçadas e novas aprovações.
4. Ler alçadas ativas e vigentes.
5. Criar regra geral de compra até R$ 20.000,00 com Gustavo.
6. Criar solicitação de R$ 6.720,00 e confirmar Gustavo como aprovador base.
7. Criar snapshot de compra.
8. Confirmar que aprovador base e efetivo são iguais quando não há substituição.
9. Vincular snapshot em `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`.
10. Alterar alçada para que R$ 6.720,00 passe a exigir Leon.
11. Confirmar que processo antigo mantém snapshot com Gustavo.
12. Criar nova solicitação de R$ 6.720,00 e confirmar Leon como aprovador base.
13. Configurar substituição temporária vigente para Gustavo.
14. Criar novo cenário com regra base Gustavo e confirmar aprovador efetivo como substituto.
15. Validar sobreposição de regras ativas para mesmo processo, tipo e obra.
16. Validar lacuna entre faixas.
17. Validar faixa inválida com valor máximo menor que valor mínimo.
18. Criar regra específica por obra e confirmar precedência sobre regra geral.
19. Tentar alterar snapshot criado por fluxo comum e confirmar bloqueio por permissão/processo.

## Critério de saída

A V2.3 só pode avançar para homologação após:

- build SPFx real concluído;
- listas/campos provisionados ou mapeados;
- `Lista 01 - Controle de Obras ENAC` e `Lista 02 — Requisições de Compra` usadas como listas físicas reais;
- leitura e gravação SharePoint testadas;
- snapshot criado e vinculado;
- permissões mínimas validadas;
- riscos de segurança registrados.

## Pré-teste de provisionamento V2.3A

Antes de qualquer criação real no tenant:

- Revisar o dry-run de `scripts/sharepoint/02-provisionamento-v2.3-dryrun.ps1`.
- Confirmar que não serão criadas listas `ENACObras` ou `ENACSolicitacoes`.
- Confirmar criação planejada apenas das listas administrativas ausentes: `ENAC Usuarios Perfis`, `ENAC Alcadas`, `ENAC Historico Configuracoes` e `ENAC Snapshots Regras`.
- Confirmar que `ENAC Alcadas.Obra` aponta para `Lista 01 - Controle de Obras ENAC` / `NomedaObra`.
- Confirmar que `SnapshotAprovacaoCompra` será adicionado à `Lista 02 — Requisições de Compra`.
- Confirmar que as URLs técnicas planejadas são `Lists/ENACUsuariosPerfis`, `Lists/ENACAlcadas`, `Lists/ENACHistoricoConfiguracoes` e `Lists/ENACSnapshotsRegras`.
- Confirmar que `ENAC Usuarios Perfis` usa `PerfisAdicionais` e não o campo singular do desenho anterior.
- Confirmar que `ENAC Historico Configuracoes` inclui `AcaoRealizada` e `ItemConfiguracaoId`, usando `Author` e `Created` nativos.
- Confirmar que `ENAC Snapshots Regras` inclui `RegraInternaId` e `ResumoRegraAplicada`, sem `Cotacao` e sem `PedidoCompra` no escopo inicial.
- Confirmar que o dry-run exibe versionamento, anexos e edição em grade planejados.
- Confirmar que edição em grade está desativada nas quatro listas administrativas.
- Confirmar `TipoSolicitacao` como Choice com choices reais da Lista 02.
- Confirmar moedas com `LCID=1046` e `Decimals=2`.
- Confirmar `UsuarioInternoId` e `RegraInternaId` com `Indexed=TRUE` e `EnforceUniqueValues=TRUE`.
- Confirmar `ENAC Snapshots Regras.Solicitacao` apontando para Lista 02 / `ID`.
- Confirmar que snapshots e histórico só serão considerados protegidos após permissões específicas.
