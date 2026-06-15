# Checklist V3.3A - PostgreSQL Local

## Pre-flight

- [x] `git status --short` executado antes do inicio.
- [x] Working tree limpo antes do inicio.
- [x] `git log --oneline -6` executado.
- [x] Tag `v3.2-fundacao-operacional-erp` confirmada.
- [x] `git push` nao executado.
- [x] Historico Git nao alterado.
- [x] Escrita real no SharePoint nao executada.
- [x] Permissoes Entra nao alteradas.
- [x] Automacoes nao criadas.
- [x] `.env` nao commitado.
- [x] Banco de producao nao acessado.

## Arquivos criados/alterados

- [x] `docker-compose.yml` criado.
- [x] `.env.example` criado.
- [x] `server/src/config/env.ts` atualizado.
- [x] `server/src/db/client.ts` atualizado com pool PostgreSQL.
- [x] `GET /health/db` criado.
- [x] Scripts `migrate` e `seed` criados.
- [x] Endpoints GET de leitura criados.
- [x] Documentacao V3.3A criada.

## Validacoes executadas neste ambiente

- [x] `npm install` em `server`.
- [x] `npm run build` em `server`.
- [x] `npm run web:build`.
- [x] `npx tsc -p web/tsconfig.json --noEmit`.
- [x] `npx tsc -p tsconfig.json --noEmit`.
- [x] `GET /health` local testado.
- [x] `GET /health/db` testado sem PostgreSQL local e retornou 503 controlado (`ECONNREFUSED 127.0.0.1:5432`).
- [x] Endpoints de leitura testados sem PostgreSQL local e retornaram 503 controlado.

## Bloqueio local

- [x] `docker` indisponivel no PATH deste ambiente.
- [ ] `docker compose config`.
- [ ] PostgreSQL local via Docker iniciado.
- [ ] Migration `001_init_core` executada localmente.
- [ ] Seed `DEV_LOCAL_V3_3A` executada localmente.
- [ ] `GET /health/db` testado com banco real.
- [ ] Endpoints de leitura testados com dados do banco local.

## Resultado

- [x] Implementacao preparada para execucao local com Docker.
- [ ] Criterios que dependem de Docker/PostgreSQL local validados em maquina com Docker instalado.
