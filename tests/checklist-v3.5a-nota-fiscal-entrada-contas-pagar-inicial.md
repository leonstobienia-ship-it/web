# Checklist V3.5A - Nota Fiscal de Entrada e Conta a Pagar Inicial

## Pre-flight

- [x] `AGENTS.md` lido.
- [x] `git status --short` executado.
- [x] Working tree limpo confirmado antes da correcao.
- [x] `git log --oneline -10` executado.
- [x] Tag `v3.4c-pedido-compra-mvp` confirmada.
- [x] `docker compose ps` executado com PostgreSQL local `healthy`.

## Banco

- [x] Migration `database/migrations/008_notas_fiscais_entrada_contas_pagar_inicial.sql` criada como complemento incremental.
- [x] `notas_fiscais_entrada` alinhada aos status da V3.5A.
- [x] `notas_fiscais_entrada_itens.nota_fiscal_id` criado e preenchido.
- [x] `contas_pagar` alinhada para conta `PROVISIONADA`.
- [x] Duplicidade ativa de NF por fornecedor, numero e serie preservada.
- [x] Duplicidade ativa de conta por nota e parcela preservada.
- [x] Nenhuma migration antiga removida.

## Backend

- [x] Modulo canonico `server/src/modules/notasFiscaisEntrada` criado.
- [x] `GET /notas-fiscais-entrada` implementado.
- [x] `GET /notas-fiscais-entrada/:id` implementado.
- [x] `POST /notas-fiscais-entrada` implementado.
- [x] `POST /notas-fiscais-entrada/gerar-do-pedido` implementado.
- [x] `PATCH /notas-fiscais-entrada/:id` implementado.
- [x] Transicoes `conferir`, `marcar-divergente`, `reabrir-rascunho`, `aprovar`, `provisionar-conta-pagar` e `cancelar` implementadas.
- [x] `GET /contas-pagar` e `GET /contas-pagar/:id` preservados.
- [x] Conta nasce como `PROVISIONADA`.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Nenhum pagamento, baixa ou programacao bancaria operacional criado.

## Frontend

- [x] Menu `Notas Fiscais` criado.
- [x] Tela de NF usa `/notas-fiscais-entrada`.
- [x] Geracao de NF a partir de pedido elegivel.
- [x] Itens herdados visiveis.
- [x] Transicoes novas expostas.
- [x] Provisao de conta pela NF aprovada.
- [x] Tela de Contas a Pagar mostra contas provisionadas sem acao de programacao.

## Validacoes

- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Testes HTTP `/health`, `/health/db`, `/notas-fiscais-entrada` e `/contas-pagar`.
- [x] Teste funcional manual no navegador.

## Restricoes

- [x] Nenhum `.env` alterado ou commitado.
- [x] Nenhum banco de producao acessado.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma permissao Entra alterada.
- [x] Nenhuma automacao criada.
- [x] Nenhum `DELETE` fisico.
