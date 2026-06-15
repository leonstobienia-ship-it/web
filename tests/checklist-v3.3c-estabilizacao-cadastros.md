# Checklist V3.3C - Estabilizacao dos Cadastros

## Pre-flight

- [x] `git status --short` executado antes do inicio.
- [x] Working tree estava limpo antes do inicio da V3.3C.
- [x] `git log --oneline -10` executado.
- [x] Tag `v3.3b-cadastros-mestres-operacionais` confirmada.
- [x] `git push` nao executado.
- [x] Historico Git nao alterado.
- [x] Escrita real no SharePoint nao executada.
- [x] Permissoes Entra nao alteradas.
- [x] Automacoes nao criadas.
- [x] `.env` nao alterado nem commitado.
- [x] Banco de producao nao acessado.
- [x] Modulo de compras nao implementado.
- [x] `DELETE` fisico nao implementado.

## Ambiente local

- [x] `.env.example` revisado.
- [x] Backend no Windows/host documentado com `127.0.0.1:5432`.
- [x] Backend em container documentado com `postgres:5432`.
- [x] Carregamento seguro do `.env` da raiz implementado para desenvolvimento.
- [x] Prioridade de `process.env.DATABASE_URL` preservada.
- [x] `.env` real nao foi alterado.
- [x] Troubleshooting de `503`/PostgreSQL documentado.

## Backend

- [x] Campos obrigatorios revisados.
- [x] `tipo_pessoa` controlado.
- [x] `status` controlado.
- [x] UF validada.
- [x] `valor_previsto` numerico quando informado.
- [x] Email validado quando informado.
- [x] Erros JSON padronizados.
- [x] `404` para ID inexistente.
- [x] `400` para payload invalido.
- [x] `409` para duplicidade relevante.

## Banco de dados

- [x] `clientes(company_id, cpf_cnpj)` unico parcial confirmado.
- [x] `fornecedores(company_id, cpf_cnpj)` unico parcial confirmado.
- [x] `centros_custo(company_id, codigo)` unico confirmado.
- [x] `obras(company_id, codigo)` unico confirmado.
- [x] Migration `003_constraints_cadastros.sql` nao foi necessaria.

## Frontend

- [x] Mensagens de erro da API melhoradas.
- [x] Estado de salvamento melhorado.
- [x] Confirmacao antes de inativar.
- [x] Labels obrigatorios melhorados.
- [x] Indicacao visual de status ativo/inativo.
- [x] Limpeza de formulario apos criacao.
- [x] Multiplos submits evitados.

## Validacoes

- [x] `docker compose ps` com PostgreSQL healthy.
- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd start` com backend conectando ao PostgreSQL.
- [x] `GET /health`.
- [x] `GET /health/db`.
- [x] `GET /clientes`.
- [x] `GET /fornecedores`.
- [x] `GET /obras`.
- [x] `GET /centros-custo`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git status --short` final apresentado.

## Resultado tecnico

- [x] Falha 503 em `/health/db` reproduzida com `npm.cmd start` normal antes do ajuste final.
- [x] Causa isolada: `DATABASE_URL` carregada do `.env` estava desalinhada, enquanto `POSTGRES_*` local batia com o container.
- [x] Correção aplicada: `DATABASE_URL` explicita antes do `.env` continua vencendo; sem variavel explicita, a conexao e montada por `POSTGRES_*`.
- [x] `/health/db` passou a retornar `200 OK` com API iniciada por `npm.cmd start` normal.
