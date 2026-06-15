# Checklist V3.4C - Pedido de Compra MVP ERP ENAC

## Pre-flight

- [x] `AGENTS.md` lido.
- [x] `git status --short` rodado antes do inicio.
- [x] Working tree limpo confirmado.
- [x] `git log --oneline -10` rodado.
- [x] Tag `v3.4b-cotacao-mapa-comparativo-formal` confirmada.
- [x] `docker compose ps` rodado com PostgreSQL local `healthy`.
- [x] API antiga identificada em `127.0.0.1:3333` e reiniciada apos build.

## Banco de dados

- [x] Migration `database/migrations/007_pedidos_compra_mvp.sql` criada.
- [x] `pedidos_compra` ajustada para o MVP operacional.
- [x] `pedidos_compra_itens` criada.
- [x] UUID mantido como chave primaria.
- [x] FKs previstas para empresa, solicitacao, cotacao, fornecedor, obra e centro de custo.
- [x] FKs dos itens para pedido, item da solicitacao e item da cotacao.
- [x] Indices por empresa, fornecedor, obra, centro de custo, status, cotacao e solicitacao.
- [x] Indice unico parcial para bloquear pedido ativo duplicado por cotacao.
- [x] Status controlados por constraint.
- [x] Sem `DELETE` fisico.

## Backend

- [x] Modulo `server/src/modules/pedidosCompra` criado.
- [x] `GET /pedidos-compra` implementado.
- [x] `GET /pedidos-compra/:id` implementado.
- [x] `POST /pedidos-compra/gerar-da-cotacao` implementado.
- [x] `PATCH /pedidos-compra/:id` implementado.
- [x] `PATCH /pedidos-compra/:id/emitir` implementado.
- [x] `PATCH /pedidos-compra/:id/enviar-fornecedor` implementado.
- [x] `PATCH /pedidos-compra/:id/confirmar` implementado.
- [x] `PATCH /pedidos-compra/:id/cancelar` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados conforme padrao atual da API.

## Validacoes Backend

- [x] `company_id` obrigatorio.
- [x] `cotacao_id` obrigatorio para gerar pedido.
- [x] Cotacao deve existir.
- [x] Cotacao deve estar em `FORNECEDOR_ESCOLHIDO`.
- [x] Cotacao `CANCELADA` bloqueada.
- [x] Fornecedor vencedor obrigatorio.
- [x] Itens do fornecedor vencedor obrigatorios.
- [x] Pedido ativo duplicado para mesma cotacao retorna `409`.
- [x] Status controlado.
- [x] Transicoes ilegais retornam `409`.
- [x] ID inexistente retorna `404`.
- [x] Payload invalido retorna `400`.
- [x] Falha real de banco retorna `503`.
- [x] Edicao de `CANCELADO` e `CONFIRMADO` bloqueada.

## Frontend

- [x] Area `web/src/features/pedidosCompra` criada.
- [x] Menu `Pedidos de Compra` criado.
- [x] Lista de pedidos implementada.
- [x] Filtros por status, fornecedor, obra e centro de custo.
- [x] Detalhe do pedido implementado.
- [x] Acao `Gerar pedido` a partir de cotacao com fornecedor escolhido.
- [x] Visualizacao de itens herdados.
- [x] Valor total exibido.
- [x] Edicao de dados basicos enquanto `RASCUNHO`.
- [x] Acoes de status implementadas.
- [x] Confirmacao antes de cancelar.
- [x] Estados de carregamento, vazio, erro e salvamento.
- [x] Frontend nao usa SharePoint para este modulo.

## Smoke Test

- [x] Script `server/src/scripts/smokePedidosCompra.ts` criado.
- [x] Script npm `smoke:pedidos` criado.
- [x] `GET /health` validado.
- [x] `GET /health/db` validado.
- [x] Cenario `DEV_LOCAL_V3_4C` criado.
- [x] Solicitacao, cotacao e fornecedor vencedor garantidos.
- [x] Pedido gerado a partir da cotacao.
- [x] `GET /pedidos-compra` validado.
- [x] `GET /pedidos-compra/:id` validado.
- [x] `RASCUNHO -> EMITIDO`.
- [x] `EMITIDO -> ENVIADO_FORNECEDOR`.
- [x] `ENVIADO_FORNECEDOR -> CONFIRMADO`.
- [x] Duplicidade para mesma cotacao validada com `409`.
- [x] Nenhum `DELETE` executado.

## Validacoes Tecnicas

- [x] `docker compose ps`.
- [x] Migration 007 executada localmente.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Testes HTTP de `/health`, `/health/db` e `/pedidos-compra`.
- [x] Teste manual da aba `Pedidos de Compra`.
- [x] Console do navegador sem erros na aba `Pedidos de Compra`.

## Restricoes Mantidas

- [x] Nenhuma nota fiscal implementada.
- [x] Nenhum financeiro ou contas a pagar implementado.
- [x] Nenhuma programacao bancaria.
- [x] Nenhum pagamento.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteracao Entra.
- [x] Nenhuma automacao.
- [x] Nenhum `.env` commitado.
- [x] Nenhum banco de producao acessado.
- [x] Nenhum `DELETE` fisico.
