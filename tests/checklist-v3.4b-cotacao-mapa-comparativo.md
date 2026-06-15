# Checklist V3.4B - Cotacao e Mapa Comparativo ERP ENAC

## Pre-flight

- [x] `AGENTS.md` lido.
- [x] `git status --short` rodado antes do inicio.
- [x] Working tree confirmado limpo antes do inicio.
- [x] `git log --oneline -10` rodado.
- [x] `git tag --list "v3.*"` rodado.
- [x] Tag `v3.4a-solicitacao-compra-mvp` confirmada.
- [x] Proxima etapa identificada: V3.4B.
- [x] `docker compose ps` rodado com PostgreSQL local `healthy`.

## Banco de dados

- [x] Migration `database/migrations/005_cotacoes_mapa_comparativo.sql` criada.
- [x] Tabela `cotacoes` ajustada sem remover migration antiga.
- [x] Tabela `cotacoes_itens` criada.
- [x] UUID mantido como chave primaria.
- [x] FKs previstas para solicitacao, fornecedor e itens da solicitacao.
- [x] Indices por empresa, solicitacao, fornecedor e status previstos.
- [x] Status controlados por constraint.
- [x] Sem `DELETE` fisico.

## Backend

- [x] Modulo `server/src/modules/cotacoes` criado.
- [x] `GET /cotacoes` implementado.
- [x] `GET /cotacoes/:id` implementado.
- [x] `POST /cotacoes` implementado.
- [x] `PATCH /cotacoes/:id` implementado.
- [x] `PATCH /cotacoes/:id/receber` implementado.
- [x] `PATCH /cotacoes/:id/desclassificar` implementado.
- [x] `PATCH /cotacoes/:id/selecionar` implementado.
- [x] `PATCH /cotacoes/:id/cancelar` implementado.
- [x] `GET /cotacoes/mapa-comparativo` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados.

## Validações Backend

- [x] `company_id` obrigatorio.
- [x] `solicitacao_compra_id` obrigatorio.
- [x] `fornecedor_id` obrigatorio.
- [x] `data_recebimento` obrigatoria.
- [x] Solicitacao deve existir e pertencer a empresa.
- [x] Solicitacao deve estar em `EM_ANALISE`.
- [x] Fornecedor deve existir, estar ativo e pertencer a empresa.
- [x] Uma cotacao por fornecedor por solicitacao.
- [x] Cotacao deve conter todos os itens ativos da solicitacao.
- [x] `valor_unitario >= 0`.
- [x] Total dos itens calculado pela API.
- [x] Total da cotacao calculado pela API.
- [x] Edicao bloqueada para `DESCLASSIFICADA`, `SELECIONADA` e `CANCELADA`.
- [x] Transicao ilegal bloqueada com `409`.

## Frontend

- [x] Area `web/src/features/cotacoes` criada.
- [x] Menu `Cotações` criado.
- [x] Selecao de solicitacao implementada.
- [x] Formulario de cotacao implementado.
- [x] Edicao de cotacao recebida implementada.
- [x] Mapa comparativo por item implementado.
- [x] Destaque de menor valor implementado.
- [x] Acao de selecionar cotacao implementada.
- [x] Acao de desclassificar cotacao implementada.
- [x] Estados de carregamento, vazio, erro e salvamento implementados.
- [x] Frontend nao usa SharePoint para este modulo.

## Smoke Test

- [x] Script `server/src/scripts/smokeCotacoes.ts` criado.
- [x] Script npm `smoke:cotacoes` criado.
- [x] `GET /health` validado em execucao local.
- [x] `GET /health/db` validado em execucao local.
- [x] Solicitacao `DEV_LOCAL_V3_4B` criada e movida para `EM_ANALISE`.
- [x] Duas cotacoes `DEV_LOCAL_V3_4B` criadas.
- [x] Mapa comparativo validado.
- [x] Cotacao de menor total selecionada.
- [x] Mapa final refletiu cotacao selecionada.

## Validações Técnicas

- [x] `docker compose ps`.
- [x] Migration 005 executada localmente.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Testes HTTP de `/health`, `/health/db` e `/cotacoes/mapa-comparativo`.
- [x] Teste manual da aba `Cotações`.
- [x] Console do navegador sem erros na aba `Cotações`.

## Correção durante validação

- [x] Primeira execução de `smoke:cotacoes` falhou por regex UUID incorreto no módulo novo.
- [x] Regex corrigido para o mesmo padrão usado em Solicitações.
- [x] Smoke V3.4B reexecutado com sucesso após reiniciar a API.

## Restrições Mantidas

- [x] Nenhum pedido de compra implementado.
- [x] Nenhuma nota fiscal implementada.
- [x] Nenhum financeiro implementado.
- [x] Nenhuma aprovacao por alcada implementada.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteracao Entra.
- [x] Nenhuma automacao.
- [x] Nenhum `.env` commitado.
- [x] Nenhum `DELETE` fisico.
