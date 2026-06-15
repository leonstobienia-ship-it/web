# Checklist V3.4A - Solicitação de Compra MVP ERP ENAC

## Pre-flight

- [x] `git status --short` rodado antes do início.
- [x] Working tree confirmado limpo antes do início.
- [x] `git log --oneline -10` rodado.
- [x] Tag `v3.3c-estabilizacao-cadastros` confirmada.
- [x] Sem `git push`.
- [x] Sem alteração de histórico Git.
- [x] Sem escrita real no SharePoint.
- [x] Sem alteração de permissões Entra.
- [x] Sem automações.
- [x] Sem commit de `.env`.
- [x] Sem conexão com banco de produção.

## Banco de dados

- [x] Migration `database/migrations/004_solicitacoes_compra_mvp.sql` criada.
- [x] Tabela `solicitacoes_compra` ajustada para o MVP.
- [x] Tabela `solicitacoes_compra_itens` criada.
- [x] UUID mantido como chave primária.
- [x] FKs previstas para empresa, obra, centro de custo e solicitante.
- [x] Índices por empresa, obra, centro de custo e status previstos.
- [x] Status controlados por constraint.
- [x] Prioridade controlada por constraint.
- [x] Sem `DELETE` físico.

## Backend

- [x] Módulo `server/src/modules/solicitacoesCompra` criado.
- [x] `GET /solicitacoes-compra` implementado.
- [x] `GET /solicitacoes-compra/:id` implementado.
- [x] `POST /solicitacoes-compra` implementado.
- [x] `PATCH /solicitacoes-compra/:id` implementado.
- [x] `PATCH /solicitacoes-compra/:id/enviar` implementado.
- [x] `PATCH /solicitacoes-compra/:id/em-analise` implementado.
- [x] `PATCH /solicitacoes-compra/:id/devolver` implementado.
- [x] `PATCH /solicitacoes-compra/:id/reabrir-rascunho` implementado.
- [x] `PATCH /solicitacoes-compra/:id/cancelar` implementado.
- [x] Nenhum endpoint `DELETE` criado.
- [x] Queries parametrizadas.
- [x] Erros JSON padronizados.

## Validações Backend

- [x] `company_id` obrigatório.
- [x] `obra_id` obrigatório.
- [x] `centro_custo_id` obrigatório.
- [x] `solicitante_id` obrigatório.
- [x] `titulo` obrigatório.
- [x] `descricao` obrigatória.
- [x] `prioridade` obrigatória e controlada.
- [x] `data_necessidade` obrigatória.
- [x] Pelo menos 1 item obrigatório.
- [x] `quantidade > 0`.
- [x] `valor_estimado_unitario >= 0`.
- [x] Obra existente validada.
- [x] Centro de custo existente validado.
- [x] Solicitante existente validado.
- [x] Edição bloqueada para `CANCELADA`.
- [x] Edição bloqueada para `APROVADA_PARA_COTACAO`.
- [x] Transição ilegal bloqueada com `409`.

## Frontend

- [x] Área `web/src/features/solicitacoesCompra` criada.
- [x] Menu `Solicitações de Compra` criado.
- [x] Lista implementada.
- [x] Filtros por status, obra e prioridade implementados.
- [x] Formulário de criação implementado.
- [x] Formulário de edição implementado.
- [x] Itens com adicionar/remover antes de salvar implementados.
- [x] Detalhe implementado.
- [x] Ações de status por status atual implementadas.
- [x] Mensagens de erro implementadas.
- [x] Estados de carregamento, vazio e salvamento implementados.
- [x] Múltiplos submits evitados por estado `saving`.
- [x] Combos usam obras, centros de custo e usuários da API local.
- [x] Frontend não usa SharePoint para este módulo.

## Smoke Test

- [x] Script `server/src/scripts/smokeSolicitacoesCompra.ts` criado.
- [x] Script npm `smoke:solicitacoes` criado.
- [x] `GET /health` validado em execução local.
- [x] `GET /health/db` validado em execução local.
- [x] `GET /solicitacoes-compra` validado em execução local.
- [x] `POST /solicitacoes-compra` com `DEV_LOCAL_V3_4A` validado.
- [x] `GET /solicitacoes-compra/:id` validado.
- [x] `PATCH /:id/enviar` validado.
- [x] `PATCH /:id/em-analise` validado.
- [x] `PATCH /:id/devolver` validado.
- [x] `PATCH /:id/reabrir-rascunho` validado.
- [x] `PATCH /:id/cancelar` validado.

## Validações Técnicas

- [x] `docker compose ps`.
- [x] Migration 004 executada localmente.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] Teste manual da aba `Solicitações de Compra`.

## Teste funcional UI

- [x] Aba `Solicitações de Compra` abriu no frontend local.
- [x] Lista exibiu registro `DEV_LOCAL_V3_4A` criado pelo smoke.
- [x] Solicitação criada pela UI com 2 itens e marcador `DEV_LOCAL_V3_4A`.
- [x] Edição de rascunho validada pela UI.
- [x] Parser numérico da UI corrigido e revalidado: `12.50` passou a gerar `R$ 12,50`, não `R$ 1.250,00`.
- [x] Transições pela UI validadas até `RASCUNHO -> ENVIADA -> EM_ANALISE -> DEVOLVIDA -> RASCUNHO`.
- [x] Cancelamento validado por API/smoke e por endpoint direto para o registro criado na UI.
- [x] Registro cancelado confirmado sem edição operacional posterior.

## Restrições Mantidas

- [x] Nenhuma cotação implementada.
- [x] Nenhum pedido de compra implementado.
- [x] Nenhuma nota fiscal implementada.
- [x] Nenhum financeiro implementado.
- [x] Nenhuma aprovação por alçada implementada.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteração Entra.
- [x] Nenhuma automação.
- [x] Nenhum `.env` commitado.
- [x] Nenhum `DELETE` físico.
