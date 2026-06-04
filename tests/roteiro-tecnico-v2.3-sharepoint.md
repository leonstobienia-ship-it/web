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
9. Vincular snapshot em `ENAC Solicitacoes.SnapshotAprovacaoCompra`.
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
- leitura e gravação SharePoint testadas;
- snapshot criado e vinculado;
- permissões mínimas validadas;
- riscos de segurança registrados.
