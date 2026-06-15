# Checklist V3.5A - Nota de Entrada e Contas a Pagar Inicial ERP ENAC

## Pre-flight

- [x] `AGENTS.md` lido.
- [x] `git status --short` rodado antes do inicio.
- [x] Working tree limpo confirmado antes do inicio.
- [x] `git log --oneline -10` rodado.
- [x] Tag `v3.4c-pedido-compra-mvp` confirmada.
- [x] `docker compose ps` rodado com PostgreSQL local `healthy`.
- [x] API local identificada em `127.0.0.1:3333` e reiniciada apos novas rotas.

## Banco de dados

- [x] Migration `database/migrations/008_notas_entrada_contas_pagar_mvp.sql` criada.
- [x] Migration 008 executada localmente.
- [x] Tabela `notas_fiscais_entrada` criada.
- [x] Tabela `notas_fiscais_entrada_itens` criada.
- [x] Tabela `contas_pagar` ajustada sem remover colunas legadas.
- [x] UUID mantido como chave primaria.
- [x] FKs previstas para empresa, pedido, fornecedor, obra e centro de custo.
- [x] FK opcional de item da nota para item do pedido.
- [x] Indices por empresa, fornecedor, pedido, nota, obra, centro de custo, status e vencimento.
- [x] Duplicidade ativa de nota por fornecedor, numero e serie bloqueada.
- [x] Duplicidade ativa de conta por nota e parcela bloqueada.
- [x] Sem `DELETE` fisico.

## Backend - Notas de Entrada

- [x] Modulo `server/src/modules/notasEntrada` criado.
- [x] `GET /notas-entrada` implementado.
- [x] `GET /notas-entrada/:id` implementado.
- [x] `POST /notas-entrada` implementado.
- [x] `PATCH /notas-entrada/:id` implementado.
- [x] `PATCH /notas-entrada/:id/lancar` implementado.
- [x] `PATCH /notas-entrada/:id/conferir` implementado.
- [x] `PATCH /notas-entrada/:id/aprovar-financeiro` implementado.
- [x] `PATCH /notas-entrada/:id/cancelar` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados conforme padrao atual da API.

## Backend - Contas a Pagar

- [x] Modulo `server/src/modules/contasPagar` criado.
- [x] `GET /contas-pagar` implementado.
- [x] `GET /contas-pagar/:id` implementado.
- [x] `POST /contas-pagar/gerar-da-nota` implementado.
- [x] `PATCH /contas-pagar/:id` implementado.
- [x] `PATCH /contas-pagar/:id/enviar-programacao` implementado.
- [x] `PATCH /contas-pagar/:id/cancelar` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Nenhum endpoint de pagamento, baixa ou conciliacao criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados conforme padrao atual da API.

## Validacoes de negocio

- [x] Nota exige `company_id`.
- [x] Nota exige `pedido_id`.
- [x] Pedido deve existir.
- [x] Pedido deve estar confirmado.
- [x] Fornecedor, obra e centro de custo sao herdados do pedido.
- [x] Itens sao herdados do pedido quando nao informados.
- [x] Valor total da nota e validado contra itens e pedido.
- [x] Transicoes ilegais de nota retornam `409`.
- [x] Conta exige `nota_entrada_id`.
- [x] Nota deve estar `APROVADA_FINANCEIRO`.
- [x] Conta exige `data_vencimento`.
- [x] `valor_aberto` inicia igual a `valor_original`.
- [x] Duplicidade ativa de conta por nota/parcela retorna `409`.
- [x] Transicoes ilegais de conta retornam `409`.

## Frontend

- [x] Area `web/src/features/notasEntrada` criada.
- [x] Area `web/src/features/contasPagar` criada.
- [x] Menu `Notas de Entrada` criado.
- [x] Menu `Contas a Pagar` criado.
- [x] Lista, filtros, criacao, detalhe, edicao e transicoes de nota implementados.
- [x] Lista, filtros, geracao, detalhe, edicao e transicoes de conta implementados.
- [x] Mensagens de erro, carregamento, vazio e salvamento implementadas.
- [x] Múltiplos submits bloqueados por estado `saving`.
- [x] Frontend nao usa SharePoint para estes modulos.

## Smoke tests

- [x] Script `server/src/scripts/smokeNotasEntrada.ts` criado.
- [x] Script `server/src/scripts/smokeContasPagar.ts` criado.
- [x] Script npm `smoke:notas` criado.
- [x] Script npm `smoke:contas-pagar` criado.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] Cenario `DEV_LOCAL_V3_5A` criado.
- [x] Nota aprovada para financeiro validada.
- [x] Conta gerada e duplicidade validada com `409`.
- [x] Nenhum `DELETE` executado.

## Validacoes tecnicas finais

- [x] `docker compose ps`.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Testes HTTP de `/health`, `/health/db`, `/notas-entrada` e `/contas-pagar`.
- [x] Teste manual da aba `Notas de Entrada`.
- [x] Teste manual da aba `Contas a Pagar`.
- [x] Console do navegador sem erros nas abas V3.5A.

## Restricoes mantidas

- [x] Nenhum pagamento implementado.
- [x] Nenhuma baixa implementada.
- [x] Nenhuma programacao bancaria real implementada.
- [x] Nenhuma conciliacao bancaria implementada.
- [x] Nenhuma integracao fiscal real.
- [x] Nenhum upload de XML.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteracao Entra.
- [x] Nenhuma automacao.
- [x] Nenhum `.env` commitado.
- [x] Nenhum banco de producao acessado.
- [x] Nenhum `DELETE` fisico.
