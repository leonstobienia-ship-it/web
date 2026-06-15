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

## Validacao manual local V3.3A.1

- [x] Docker Compose validado no ambiente local de Leon.
- [x] PostgreSQL local via Docker iniciado.
- [x] Container `enac-erp-postgres-dev` ficou `healthy`.
- [x] Porta `5432` publicada em `127.0.0.1`/`localhost`.
- [x] Migration `001_init_core` executada localmente.
- [x] Seed `DEV_LOCAL_V3_3A` executada localmente.
- [x] Backend Node rodou em `http://127.0.0.1:3333`.
- [x] `GET /health` testado com `200 OK`.
- [x] `GET /health/db` testado com banco real e `database.connected = true`.
- [x] `GET /health/db` retornou `database.name = enac_erp_dev`.
- [x] `GET /empresas` retornou dados do banco local.
- [x] `GET /usuarios` retornou dados do banco local.
- [x] `GET /clientes` retornou dados do banco local.
- [x] `GET /fornecedores` retornou dados do banco local.
- [x] `GET /obras` retornou dados do banco local.
- [x] `GET /centros-custo` retornou dados do banco local.
- [x] Dados de seed retornaram com marcador `DEV_LOCAL_V3_3A`.
- [x] Host correto documentado: backend no Windows/host usa `127.0.0.1` ou `localhost`.
- [x] Host `postgres` documentado apenas para backend dentro da rede Docker Compose.

## Resultado

- [x] Implementacao preparada para execucao local com Docker.
- [x] Criterios que dependem de Docker/PostgreSQL local validados manualmente no ambiente de Leon.
