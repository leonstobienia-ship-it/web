# Checklist V3.5B - Perfis, Escopos e Alcadas

## Base

- [x] `git status --short` inicial limpo.
- [x] Branch base `main` em `fe04602`.
- [x] `origin/main` em `fe04602`.
- [x] Branch de trabalho `dev/v3.5b-perfis-escopos-alcadas`.
- [x] PostgreSQL local Docker healthy.
- [x] `/health/db` confirma `enac_erp_dev`.

## Backend

- [x] Migration incremental criada.
- [x] Seeds locais `DEV_LOCAL_V3_5B` criados.
- [x] Endpoint `/perfis` criado.
- [x] Endpoint `/escopos` criado.
- [x] Endpoint `/usuarios-perfis` criado.
- [x] Endpoint `/perfis-escopos` criado.
- [x] Endpoint `/alcadas` criado.
- [x] Endpoint `/alcadas/validar` criado.
- [x] Sem `DELETE` fisico.
- [x] Sem rotas de pagamento, baixa ou programacao bancaria.

## Frontend

- [x] Secao administrativa criada.
- [x] Usuarios exibidos com perfis.
- [x] Perfis com criacao, edicao, inativacao e reativacao.
- [x] Escopos com criacao, edicao, inativacao e reativacao.
- [x] Vinculos usuario-perfil.
- [x] Vinculos perfil-escopo.
- [x] Alcadas com criacao, edicao, inativacao, reativacao e validacao.
- [x] Nenhum botao de pagamento, baixa ou programacao bancaria exposto.

## Smokes e builds

- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run migrate`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run smoke:acessos`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.

## Encerramento

- [x] README atualizado.
- [x] Documentacao ERP atualizada.
- [x] `git status --short` final revisado.
- [x] `git log --oneline --decorate -8` revisado.
- [x] Sem push.
- [x] Sem tag.
- [x] Commit local sugerido, mas nao criado sem validacao.
