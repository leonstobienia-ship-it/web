# Auditoria Pos-Aplicacao Manual de Permissoes - V2.6B.4D

Data da conferencia manual: 2026-06-08

Responsavel: Leon

## Origem da evidencia

Confirmacao baseada em conferencia manual informada por Leon apos a V2.6B.4C.

Codex nao conectou ao SharePoint, nao executou script, nao aplicou permissoes, nao alterou tenant/listas/dados/webpart e nao iniciou Power Automate.

## Resumo final

| Lista | Permissoes exclusivas | Owners mantido | Members removido | Visitors removido | Matriz ENAC aplicada | Status |
| --- | --- | --- | --- | --- | --- | --- |
| ENAC Usuarios Perfis | sim | sim | sim | sim | sim | CONCLUIDO |
| ENAC Alcadas | sim | sim | sim | sim | sim | CONCLUIDO |
| ENAC Historico Configuracoes | sim | sim | sim | sim | sim | CONCLUIDO |
| ENAC Snapshots Regras | sim | sim | sim | sim | sim | CONCLUIDO |

## ENAC Usuarios Perfis

| Item | Resultado | Observacao |
| --- | --- | --- |
| Lista com permissoes exclusivas | sim | Confirmado manualmente |
| `Obras em Andamento Owners` mantido com `Controle Total` | sim | Confirmado manualmente |
| `Obras em Andamento Members` removido | sim | Confirmado manualmente |
| `Obras em Andamento Visitors` removido | sim | Confirmado manualmente |
| `ENAC Sistema Admin` com `Controle Total` | sim | Confirmado manualmente |
| `ENAC Diretoria` com `Editar` | sim | Confirmado manualmente |
| `ENAC Planejamento` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Leitura Auditoria` com `Leitura` | sim | Confirmado manualmente |
| Grupos indevidos ausentes | sim | Confirmado manualmente |

## ENAC Alcadas

| Item | Resultado | Observacao |
| --- | --- | --- |
| Lista com permissoes exclusivas | sim | Confirmado manualmente |
| `Obras em Andamento Owners` mantido com `Controle Total` | sim | Confirmado manualmente |
| `Obras em Andamento Members` removido | sim | Confirmado manualmente |
| `Obras em Andamento Visitors` removido | sim | Confirmado manualmente |
| `ENAC Sistema Admin` com `Controle Total` | sim | Confirmado manualmente |
| `ENAC Diretoria` com `Editar` | sim | Confirmado manualmente |
| `ENAC Planejamento` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Compras Financeiro` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Leitura Auditoria` com `Leitura` | sim | Confirmado manualmente |
| Grupos indevidos ausentes | sim | Confirmado manualmente |

## ENAC Historico Configuracoes

| Item | Resultado | Observacao |
| --- | --- | --- |
| Lista com permissoes exclusivas | sim | Confirmado manualmente |
| `Obras em Andamento Owners` mantido com `Controle Total` | sim | Confirmado manualmente |
| `Obras em Andamento Members` removido | sim | Confirmado manualmente |
| `Obras em Andamento Visitors` removido | sim | Confirmado manualmente |
| `ENAC Sistema Admin` com `Controle Total` | sim | Confirmado manualmente |
| `ENAC Diretoria` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Planejamento` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Compras Financeiro` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Cotacoes Contratos` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Leitura Auditoria` com `Leitura` | sim | Confirmado manualmente |
| Grupos indevidos ausentes | sim | Confirmado manualmente |

## ENAC Snapshots Regras

| Item | Resultado | Observacao |
| --- | --- | --- |
| Lista com permissoes exclusivas | sim | Confirmado manualmente |
| `Obras em Andamento Owners` mantido com `Controle Total` | sim | Confirmado manualmente |
| `Obras em Andamento Members` removido | sim | Confirmado manualmente |
| `Obras em Andamento Visitors` removido | sim | Confirmado manualmente |
| `ENAC Sistema Admin` com `Controle Total` | sim | Confirmado manualmente |
| `ENAC Diretoria` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Planejamento` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Compras Financeiro` com `Leitura` | sim | Confirmado manualmente |
| `ENAC Leitura Auditoria` com `Leitura` | sim | Confirmado manualmente |
| Grupos indevidos ausentes | sim | Confirmado manualmente |

## Confirmacoes finais

| Item | Resultado | Observacao |
| --- | --- | --- |
| Nenhuma lista operacional alterada | sim | Confirmado por Leon |
| Script `11-permissoes-finas-v2.6b-apply.ps1` nao foi reutilizado | sim | Finalizacao manual |
| Power Automate nao foi iniciado | sim | Confirmado por Leon |
| Escrita operacional ampla nao foi liberada | sim | Fora do escopo |

## Conclusao

V2.6B.4 concluida manualmente por Leon. As quatro listas administrativas permanecem com permissoes exclusivas, com `Obras em Andamento Owners` mantido e grupos ENAC aplicados conforme matriz.
