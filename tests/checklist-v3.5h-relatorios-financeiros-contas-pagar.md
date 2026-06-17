# Checklist V3.5H - Relatorios Financeiros / Contas a Pagar

## Travas

- [x] Branch base `main`.
- [x] V3.5G publicada.
- [x] Tag `v3.5g-baixa-manual-controlada-sem-banco` presente.
- [x] Sem `.git/index.lock`.
- [x] PostgreSQL local healthy.
- [x] `/health` OK.
- [x] `/health/db` OK.
- [x] `b004592` nao usado.

## Escopo

- [x] Criar relatórios de Contas a Pagar.
- [x] Criar aging financeiro.
- [x] Criar agrupamentos por fornecedor, obra e centro de custo.
- [x] Criar resumo de Programações.
- [x] Criar fluxo previsto de saída.
- [x] Criar série de baixas manuais por período.
- [x] Criar tela de Relatórios Financeiros.
- [x] Não criar operação financeira nova.
- [x] Não criar pagamento.
- [x] Não criar nova baixa transacional.
- [x] Não criar CNAB.
- [x] Não criar integração bancária.
- [x] Não usar `DELETE` físico.

## Backend

- [x] `GET /relatorios-financeiros/contas-pagar/resumo`.
- [x] `GET /relatorios-financeiros/contas-pagar/aging`.
- [x] `GET /relatorios-financeiros/contas-pagar/por-fornecedor`.
- [x] `GET /relatorios-financeiros/contas-pagar/por-obra`.
- [x] `GET /relatorios-financeiros/contas-pagar/por-centro-custo`.
- [x] `GET /relatorios-financeiros/programacoes/resumo`.
- [x] `GET /relatorios-financeiros/fluxo-previsto`.
- [x] Sem migration nova.
- [x] Queries parametrizadas.
- [x] Smoke confirma que os relatórios não alteram dados.

## Frontend

- [x] Tela `Relatórios Financeiros`.
- [x] Cards de resumo.
- [x] Filtros por período, fornecedor, obra, centro de custo, status e valor.
- [x] Tabelas de contas por status e vencimento.
- [x] Tabela de aging.
- [x] Tabela de programações.
- [x] Tabela de fluxo previsto.
- [x] Tabelas por fornecedor, obra e centro de custo.
- [x] Sem botão Pagar.
- [x] Sem botão Baixar.
- [x] Sem CNAB.
- [x] Sem integração bancária.

## Validações

- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run migrate`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run smoke:acessos`.
- [x] `npm.cmd run smoke:aprovacoes`.
- [x] `npm.cmd run smoke:programacoes-pagamento`.
- [x] `npm.cmd run smoke:liberacoes-programacao`.
- [x] `npm.cmd run smoke:conferencia-financeira`.
- [x] `npm.cmd run smoke:baixa-manual`.
- [x] `npm.cmd run smoke:relatorios-financeiros`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.
- [x] Browser desktop/mobile sem erro visual bloqueante.
