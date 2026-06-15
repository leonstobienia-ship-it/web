# Checklist V3.3B - Cadastros Mestres

## Pre-flight

- [x] `git status --short` executado antes do inicio.
- [x] Working tree limpo antes do inicio.
- [x] `git log --oneline -8` executado.
- [x] Tag `v3.3a-postgresql-local-validado` confirmada.
- [x] `git push` nao executado.
- [x] Historico Git nao alterado.
- [x] Escrita real no SharePoint nao executada.
- [x] Permissoes Entra nao alteradas.
- [x] Automacoes nao criadas.
- [x] `.env` nao commitado.
- [x] Banco de producao nao acessado.
- [x] `DELETE` fisico nao implementado.

## Backend

- [x] `GET /clientes` preservado.
- [x] `GET /clientes/:id` implementado.
- [x] `POST /clientes` implementado.
- [x] `PATCH /clientes/:id` implementado.
- [x] `PATCH /clientes/:id/inativar` implementado.
- [x] `PATCH /clientes/:id/reativar` implementado.
- [x] Endpoints equivalentes implementados para fornecedores.
- [x] Endpoints equivalentes implementados para centros de custo.
- [x] Endpoints equivalentes implementados para obras.
- [x] Queries parametrizadas.
- [x] Erros padronizados em JSON.
- [x] Validacoes backend implementadas.
- [x] `GET /health` preservado.
- [x] `GET /health/db` preservado.

## Banco de dados

- [x] Migration `001_init_core.sql` preservada.
- [x] Migration `002_cadastros_mestres.sql` criada.
- [x] Sem remocao de dados `DEV_LOCAL_V3_3A`.
- [x] Sem banco de producao.

## Frontend

- [x] `web/src/services/erpApi.ts` criado.
- [x] `web/src/features/cadastros` criado.
- [x] Tela de clientes criada.
- [x] Tela de fornecedores criada.
- [x] Tela de centros de custo criada.
- [x] Tela de obras criada.
- [x] Lista, novo, edicao, inativacao e reativacao implementados.
- [x] Estados de erro, carregamento e vazio implementados.
- [x] Navegacao V3.1 preservada.

## Validacoes executadas

- [x] `docker compose ps`.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run web:build` na raiz.
- [x] `npx tsc -p web/tsconfig.json --noEmit`.
- [x] `npx tsc -p tsconfig.json --noEmit`.
- [x] `GET /health`.
- [x] `GET /health/db`.
- [x] `GET /clientes`.
- [x] `GET /fornecedores`.
- [x] `GET /obras`.
- [x] `GET /centros-custo`.

## Testes funcionais locais V3.3B

- [x] Cliente `DEV_LOCAL_V3_3B` criado.
- [x] Cliente `DEV_LOCAL_V3_3B` editado.
- [x] Cliente `DEV_LOCAL_V3_3B` inativado.
- [x] Cliente `DEV_LOCAL_V3_3B` reativado.
- [x] Fornecedor `DEV_LOCAL_V3_3B` criado.
- [x] Centro de custo `DEV_LOCAL_V3_3B` criado.
- [x] Obra `DEV_LOCAL_V3_3B` criada vinculada ao cliente e centro de custo.
- [x] Registros confirmados nas listas.
- [x] Nenhuma escrita real no SharePoint.
- [x] Nenhuma alteracao Entra.
- [x] Nenhuma automacao criada.
- [x] Nenhum `.env` commitado.

## Observacoes

- [x] Migration `002_cadastros_mestres` aplicada no PostgreSQL local.
- [x] A primeira tentativa de migration falhou por divergencia entre `.env` local e credenciais do container ja criado; a validacao foi repetida usando variaveis transitorias da sessao, sem alterar `.env`.
