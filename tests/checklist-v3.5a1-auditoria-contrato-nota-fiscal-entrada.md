# Checklist V3.5A.1 - Auditoria do contrato canonico da Nota Fiscal de Entrada

## Base

- [x] `git status --short` inicial limpo.
- [x] Checkout em `cf5ec85`.
- [x] Tag `v3.5a-nota-fiscal-entrada` presente no HEAD.
- [x] PostgreSQL Docker local healthy.
- [x] `/health/db` confirma `enac_erp_dev`.
- [x] `npm.cmd` e `npx.cmd` funcionando.

## Contrato auditado

- [x] Nota Fiscal de Entrada usa rota funcional canonica `/notas-fiscais-entrada`.
- [x] Alias antigo nao esta registrado como rota funcional.
- [x] Frontend e smokes usam a rota canonica.
- [x] Criacao/provisionamento de nota gera Conta a Pagar `PROVISIONADA`.
- [x] Nao ha programacao bancaria.
- [x] Nao ha liberacao financeira.
- [x] Nao ha pagamento.
- [x] Nao ha baixa.
- [x] Nao ha `DELETE` fisico nos modulos auditados.

## Validacoes

- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run migrate` em `server`.
- [x] `npm.cmd run smoke:notas` em `server`.
- [x] `npm.cmd run smoke:contas-pagar` em `server`.
- [x] `npm.cmd run web:build` na raiz.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit` na raiz.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit` na raiz.
- [x] Teste HTTP da rota canonica.
- [x] Teste HTTP confirmando que o alias antigo nao responde funcionalmente.

## Encerramento

- [x] Documentacao da auditoria criada.
- [x] README atualizado.
- [x] `git diff --check` sem erros.
- [x] `git status --short` final revisado.
- [x] Sem commit, tag ou push nesta etapa.
