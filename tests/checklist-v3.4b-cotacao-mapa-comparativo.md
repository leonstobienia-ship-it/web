# Checklist V3.4B - Cotacao e Mapa Comparativo ERP ENAC

## Pre-flight

- [x] `AGENTS.md` lido.
- [x] `git status --short` rodado.
- [x] Working tree limpo confirmado antes da correcao.
- [x] `git log --oneline -10` rodado.
- [x] `git tag --list "v3.*"` rodado.
- [x] Tag `v3.4a-solicitacao-compra-mvp` confirmada.
- [x] `docker compose ps` rodado com PostgreSQL local `healthy`.
- [x] Sem `git push`.
- [x] Sem alteracao de historico Git.

## Banco de dados

- [x] `database/migrations/005_cotacoes_mapa_comparativo.sql` preservada.
- [x] `database/migrations/006_cotacoes_fluxo_formal_v34b.sql` criada como complemento incremental.
- [x] `cotacoes` ajustada para cabecalho do processo formal.
- [x] `cotacoes_fornecedores` criada.
- [x] `cotacoes_itens` ajustada para vinculo por fornecedor.
- [x] `mapa_comparativo_cotacao` criada.
- [x] UUID mantido como chave primaria.
- [x] FKs para solicitacao, fornecedores e itens da solicitacao.
- [x] Indices por empresa, solicitacao, cotacao, fornecedor e status.
- [x] Status controlados por constraints.
- [x] Sem `DELETE` fisico.

## Backend

- [x] Modulo `server/src/modules/cotacoes` atualizado para cotacao agregada.
- [x] `GET /cotacoes` implementado.
- [x] `GET /cotacoes/:id` implementado.
- [x] `POST /cotacoes` implementado.
- [x] `PATCH /cotacoes/:id` implementado.
- [x] `PATCH /cotacoes/:id/enviar-fornecedores` implementado.
- [x] `PATCH /cotacoes/:id/registrar-respostas` implementado.
- [x] `PATCH /cotacoes/:id/gerar-mapa` implementado.
- [x] `PATCH /cotacoes/:id/escolher-fornecedor` implementado.
- [x] `PATCH /cotacoes/:id/cancelar` implementado.
- [x] `GET /cotacoes/mapa-comparativo` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados.

## Validacoes Backend

- [x] `company_id` obrigatorio.
- [x] `solicitacao_id` ou `solicitacao_compra_id` obrigatorio.
- [x] Solicitacao deve existir e pertencer a empresa.
- [x] Solicitacao `CANCELADA` bloqueada.
- [x] Cotacao exige pelo menos 1 fornecedor.
- [x] Fornecedor deve existir, estar ativo e pertencer a empresa.
- [x] Respostas preservam todos os itens ativos da solicitacao.
- [x] `quantidade > 0` herdada da solicitacao.
- [x] `valor_unitario >= 0`.
- [x] Total por item calculado pela API.
- [x] Total por fornecedor calculado pela API.
- [x] Escolha de fornecedor exige justificativa.
- [x] Transicoes ilegais retornam `409`.
- [x] ID inexistente retorna `404`.
- [x] Payload invalido retorna `400`.
- [x] Falha real de banco retorna `503`.

## Frontend

- [x] Area `web/src/features/cotacoes` mantida.
- [x] Menu `Cotações` mantido.
- [x] Lista de cotacoes por solicitacao.
- [x] Criacao de cotacao a partir de solicitacao.
- [x] Selecao de fornecedores participantes.
- [x] Envio aos fornecedores.
- [x] Formulario de resposta por fornecedor.
- [x] Mapa comparativo por item.
- [x] Destaque de menor valor.
- [x] Escolha de fornecedor vencedor com justificativa.
- [x] Cancelamento em status permitido.
- [x] Estados de carregamento, vazio, erro e salvamento.
- [x] Frontend nao usa SharePoint para este modulo.

## Smoke Test

- [x] Script `server/src/scripts/smokeCotacoes.ts` atualizado.
- [x] Script npm `smoke:cotacoes` mantido.
- [x] `GET /health` validado.
- [x] `GET /health/db` validado.
- [x] Solicitacao `DEV_LOCAL_V3_4B` criada e movida para `EM_ANALISE`.
- [x] Cotacao formal `DEV_LOCAL_V3_4B` criada com dois fornecedores.
- [x] `RASCUNHO -> ENVIADA_FORNECEDORES`.
- [x] `ENVIADA_FORNECEDORES -> RESPOSTAS_RECEBIDAS`.
- [x] Mapa comparativo validado.
- [x] `RESPOSTAS_RECEBIDAS -> MAPA_GERADO`.
- [x] `MAPA_GERADO -> FORNECEDOR_ESCOLHIDO`.
- [x] `GET /cotacoes` e `GET /cotacoes/:id` validados.
- [x] Nenhum `DELETE` executado.

## Validacoes Tecnicas

- [x] `docker compose ps`.
- [x] Migration 006 executada localmente.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Testes HTTP de `/health`, `/health/db` e `/cotacoes`.
- [x] Teste manual da aba `Cotações` apos correcao formal.
- [x] Console do navegador sem erros apos correcao formal.

## Correcoes durante validacao

- [x] Desenho inicial de V3.4B foi ajustado para o modelo formal do anexo.
- [x] Migration antiga nao foi reescrita; criada migration incremental 006.
- [x] Primeiro smoke formal revelou `data_recebimento NOT NULL` herdado da 005.
- [x] API formal passou a preencher `data_recebimento` com `current_date`.
- [x] Smoke V3.4B reexecutado com sucesso.

## Restricoes Mantidas

- [x] Nenhum pedido de compra implementado.
- [x] Nenhuma nota fiscal implementada.
- [x] Nenhum financeiro implementado.
- [x] Nenhuma aprovacao por alcada implementada.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteracao Entra.
- [x] Nenhuma automacao.
- [x] Nenhum `.env` commitado.
- [x] Nenhum banco de producao acessado.
- [x] Nenhum `DELETE` fisico.
