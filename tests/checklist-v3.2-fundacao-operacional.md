# Checklist V3.2 - Fundacao Operacional ERP

## Pre-flight

- [x] `git status --short` executado antes do inicio.
- [x] Working tree limpo antes do inicio.
- [x] `git log --oneline -6` executado.
- [x] Tag `v3.1-blueprint-erp-enac` confirmada.
- [x] Historico Git nao alterado.
- [x] `git push` nao executado.
- [x] Escrita real no SharePoint nao executada.
- [x] Permissoes Entra nao alteradas.
- [x] Automacoes nao criadas.
- [x] `.env` nao criado nem commitado.

## Estrutura

- [x] `web/src/app`
- [x] `web/src/components`
- [x] `web/src/features`
- [x] `web/src/layouts`
- [x] `web/src/pages`
- [x] `web/src/services`
- [x] `web/src/types`
- [x] `web/src/utils`
- [x] `server`
- [x] `server/src`
- [x] `server/src/modules`
- [x] `server/src/db`
- [x] `server/src/auth`
- [x] `server/src/config`
- [x] `database`
- [x] `database/migrations`
- [x] `database/schema`
- [x] `docs/erp`
- [x] `tests/erp`

## Tipos e banco

- [x] Modelos TypeScript iniciais criados em `web/src/types/erp.ts`.
- [x] Migration `database/migrations/001_init_core.sql` criada.
- [x] Documentacao `database/schema/v3.2-modelo-inicial.md` criada.
- [x] Documentacao `docs/erp/modelo-dados-inicial.md` criada.
- [x] UUID previsto como chave primaria.
- [x] Auditoria minima prevista com `created_at`, `updated_at`, `created_by`, `updated_by` e `status`.
- [x] `company_id`, `obra_id` e `centro_custo_id` previstos onde fazem sentido.
- [x] Migration nao executada contra producao.

## Backend

- [x] `server/package.json` criado.
- [x] `server/tsconfig.json` criado.
- [x] `server/src/index.ts` criado.
- [x] `server/src/config/env.ts` criado.
- [x] `server/src/db/client.ts` criado.
- [x] `server/src/modules/health/health.routes.ts` criado.
- [x] `server/src/modules/clientes/clientes.routes.ts` criado.
- [x] `server/src/modules/fornecedores/fornecedores.routes.ts` criado.
- [x] `server/src/modules/obras/obras.routes.ts` criado.
- [x] `GET /health` implementado.

## Validacoes

- [x] `npm install` executado dentro de `server`.
- [x] `npm run build` executado dentro de `server`.
- [x] `npm run web:build` executado.
- [x] TypeScript web executado com `npx tsc -p web/tsconfig.json --noEmit`.
- [x] TypeScript raiz executado com `npx tsc -p tsconfig.json --noEmit`.
- [x] `GET /health` validado localmente em `http://127.0.0.1:3333/health`.
- [x] V3.1 continua abrindo em `http://localhost:5173/`.

## Resultado final

- [x] Checklist revisado apos validacoes.
