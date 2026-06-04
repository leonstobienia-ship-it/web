# Testes Manuais do MVP

## Fluxo principal

1. Selecionar perfil Campo / Engenheiro.
2. Criar nova solicitação com obra, tipo, descrição, especificação técnica, quantidade, unidade, frente de serviço, necessidade, prioridade, justificativa quando aplicável, anexo opcional e observações.
3. Confirmar que solicitante, data/hora, código da obra, cliente e centro de custo são preenchidos internamente.
4. Confirmar status `Aguardando cotação`.
5. Trocar para Cotações e Contratos / Kemilly.
6. Abrir fila de cotações.
7. Registrar até três propostas, recomendar fornecedor e justificar a recomendação.
8. Encaminhar para aprovação.
9. Confirmar que a regra vigente foi aplicada e salva em snapshot.
10. Trocar para o aprovador correspondente, Gustavo ou Leon.
11. Aprovar, reprovar, solicitar ajuste ou solicitar nova cotação.
12. Trocar para Compras e Financeiro Operacional / Matheus.
13. Emitir pedido de compra.
14. Registrar execução da compra.
15. Vincular NF, boleto ou dados de pagamento.
16. Programar pagamento no banco.
17. Confirmar status `Aguardando liberação bancária`.
18. Trocar para Diretoria / Leon.
19. Liberar pagamento, bloquear ou solicitar correção.
20. Confirmar pagamento realizado e atualizar status final para `Pago / Concluído`.
21. Abrir histórico e confirmar todos os eventos, usuários, datas e observações.

## Permissões

- Campo não deve ver cotações administrativas, alçadas, financeiro bancário ou Administração.
- Kemilly deve ver cotações e dados técnicos necessários, mas não deve liberar pagamento.
- Matheus deve ver pedido, NF e programação bancária, mas não deve aprovar a própria compra nem liberar pagamento.
- Gustavo deve ver aprovações atribuídas conforme parâmetro.
- Leon deve ver aprovações, exceções, divergências, liberação bancária, status final e painel executivo.
- Administrador do Sistema / Leon deve ver Administração / Configurações.

## Alçadas

- Pedido de compra até R$ 20.000,00 deve exigir Gustavo enquanto o parâmetro inicial estiver assim configurado.
- Pedido de compra acima de R$ 20.000,00 deve exigir Leon enquanto o parâmetro inicial estiver assim configurado.
- Alterar a alçada simulada em Administração deve afetar novos processos submetidos.
- Processos já submetidos devem manter o snapshot anterior.
- Compra demonstrativa de R$ 6.720,00 deve preservar snapshot original com Gustavo após alteração da alçada.
- Após alterar a alçada de Gustavo para R$ 5.000,00, nova compra de R$ 6.720,00 deve ser encaminhada para Leon.
- Liberação bancária deve permanecer exclusiva de Leon.
- NF divergente do pedido deve gerar divergência e encaminhar para Leon.

## Administração

1. Selecionar perfil Administrador do Sistema / Leon.
2. Confirmar que menu Administração aparece.
3. Abrir Usuários e Perfis e validar permissões de Leon, Gustavo, Matheus, Kemilly e Campo.
4. Abrir Alçadas de Aprovação e editar uma regra simulada.
5. Confirmar que aprovador principal e adicional são selecionados de usuários ativos.
6. Validar bloqueio de valor final inferior ao inicial.
7. Validar alerta/bloqueio de faixa sobreposta.
8. Informar justificativa da alteração.
9. Confirmar registro no Histórico de Configurações.
10. Criar processo antes e depois da alteração e confirmar que cada processo mantém o snapshot da regra aplicada no momento da submissão.

## Usuários

1. Abrir Usuários e Perfis.
2. Cadastrar novo usuário.
3. Editar perfil, permissões e substituto temporário.
4. Definir início e fim da substituição usando calendário.
5. Desativar usuário e confirmar que ele não pode ser selecionado como aprovador em nova alçada ativa.
6. Confirmar persistência após recarregar o navegador.

## V2.3 SharePoint

1. Confirmar que `src/prototype/app.js` não foi alterado na V2.3.
2. Resolver usuário autenticado por `ContaMicrosoft365`.
3. Confirmar `UsuarioInternoId` obrigatório, único e indexado no schema.
4. Confirmar `RegraInternaId` obrigatório, único e indexado no schema.
5. Validar regra ativa e vigente por processo, tipo, obra e valor.
6. Validar precedência de regra específica da obra sobre regra geral.
7. Validar detecção de sobreposição e lacunas de aprovação.
8. Validar substituição temporária via cadastro de usuário.
9. Criar snapshot com aprovador base e aprovador efetivo.
10. Vincular o snapshot em `SnapshotAprovacaoCompra`.
11. Confirmar que snapshots não são editados por fluxos comuns.

## Valores e datas

- Confirmar valores exibidos como `R$ 1.234,56`.
- Confirmar campos editáveis de valor com entrada numérica e prefixo visual `R$`.
- Confirmar calendário clicável nos campos de data editáveis.
- Confirmar datas em leitura no formato `dd/mm/aaaa`.

## Validação de remoção

- Confirmar que não há perfil, tela, dado simulado, teste ou permissão funcional vinculado a pessoa removida da operação.
