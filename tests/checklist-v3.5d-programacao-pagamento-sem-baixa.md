# Checklist V3.5D - Programacao de Pagamento sem Baixa

## Base

- [x] Branch de trabalho: `dev/v3.5d-programacao-pagamento-sem-baixa`.
- [x] Base consolidada V3.5C em `6ad7f2d`.
- [x] Tag V3.5C preservada: `v3.5c-aprovacoes-documentos-alcadas`.
- [x] Nao usar `b004592`.

## Escopo

- [x] Modulo de Programacao de Pagamento criado.
- [x] Somente contas aprovadas podem ser programadas.
- [x] Contas nao aprovadas sao bloqueadas.
- [x] Contas canceladas sao bloqueadas.
- [x] Contas ja programadas em programacao ativa sao bloqueadas.
- [x] Contas com divergencia pendente sao bloqueadas.
- [x] Contas inativas sao bloqueadas.
- [x] Status `RASCUNHO`, `SUBMETIDA`, `APROVADA`, `REPROVADA`, `CANCELADA`.
- [x] Agrupamento por data prevista, fornecedor, obra, centro de custo e forma prevista.
- [x] Observacao/justificativa registradas.
- [x] Auditoria em `auditoria_eventos`.
- [x] Aprovacao usa alçadas existentes.
- [x] Aprovar programacao nao paga.
- [x] Aprovar programacao nao baixa.
- [x] Cancelamento/remocao logicos.
- [x] Sem `DELETE` fisico.

## Backend

- [x] Migration incremental `011_programacoes_pagamento_sem_baixa_v35d.sql`.
- [x] `GET /programacoes-pagamento`.
- [x] `GET /programacoes-pagamento/:id`.
- [x] `GET /programacoes-pagamento/contas-elegiveis`.
- [x] `POST /programacoes-pagamento`.
- [x] `POST /programacoes-pagamento/:id/contas`.
- [x] `PATCH /programacoes-pagamento/:id/contas/:contaPagarId/remover`.
- [x] `PATCH /programacoes-pagamento/:id/submeter`.
- [x] `PATCH /programacoes-pagamento/:id/aprovar-tecnico`.
- [x] `PATCH /programacoes-pagamento/:id/aprovar-diretoria`.
- [x] `PATCH /programacoes-pagamento/:id/reprovar`.
- [x] `PATCH /programacoes-pagamento/:id/cancelar`.
- [x] Sem endpoint `/pagar`.
- [x] Sem endpoint `/baixar`.
- [x] Sem endpoint de integracao bancaria.
- [x] Sem endpoint `DELETE`.

## Frontend

- [x] Tela `Programacao de Pagamento`.
- [x] Lista de programacoes.
- [x] Lista de contas elegiveis e bloqueadas.
- [x] Montagem de rascunho.
- [x] Exibicao de status.
- [x] Exibicao de bloqueios de elegibilidade/alcada.
- [x] Sem botao de pagar.
- [x] Sem botao de baixar.
- [x] Sem integracao bancaria.

## Smokes

- [x] Script `smoke:programacoes-pagamento` criado.
- [x] Conta nao aprovada nao pode ser programada.
- [x] Conta aprovada pode ser incluida.
- [x] Conta ja programada em programacao ativa nao duplica.
- [x] Programacao pode ser submetida.
- [x] Usuario sem alcada suficiente e bloqueado.
- [x] Diretoria aprova acima de R$ 20.000.
- [x] Aprovar programacao nao paga.
- [x] Aprovar programacao nao baixa.
- [x] Rotas `/pagar` e `/baixar` retornam 404.
- [x] `DELETE` retorna 405.

## Validacoes finais

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:solicitacoes`.
- [ ] `npm.cmd run smoke:cotacoes`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] `git status --short`.
- [ ] `git log --oneline --decorate -8`.
