# AGENTS.md - Sistema ENAC

Este arquivo define instrucoes permanentes para o Codex trabalhar de forma autonoma, segura e organizada no ERP ENAC.

## Contexto do projeto

O Sistema ENAC esta evoluindo de uma base SPFx/SharePoint para um ERP proprio com React, Node.js e PostgreSQL local, mantendo SharePoint apenas como repositorio documental e integrador futuro.

A ENAC e uma empresa de engenharia civil, construcao, obras, compras, contratos, medicoes, faturamento e financeiro.

## Principios gerais

- Trabalhar em etapas versionadas.
- Cada etapa deve ter objetivo claro, escopo limitado, documentacao, checklist, validacoes e commit.
- Nao implementar multiplos modulos grandes na mesma etapa.
- Priorizar estabilidade, rastreabilidade e seguranca.
- Preservar a operacao local validada antes de ampliar escopo.

## Travas absolutas

- Nunca commitar `.env`, `web/.env` ou qualquer segredo.
- Nunca conectar em banco de producao.
- Nunca executar escrita real no SharePoint sem etapa explicitamente autorizada.
- Nunca alterar permissoes Entra sem etapa explicitamente autorizada.
- Nunca criar Power Automate ou automacoes sem etapa explicitamente autorizada.
- Nunca implementar `DELETE` fisico em entidades operacionais.
- Nunca remover migrations antigas sem autorizacao.
- Nunca alterar historico Git.
- Nunca fazer `git push` se houver falha de build, teste ou `git status` sujo.
- Nunca usar dados reais em testes locais; usar marcadores `DEV_LOCAL_Vx`.

## Fluxo obrigatorio de cada etapa

### Antes de iniciar

- Rodar `git status --short`.
- Rodar `git log --oneline -10`.
- Rodar `git tag --list` relevante.
- Rodar `docker compose ps` quando a etapa usar PostgreSQL.
- Confirmar se API antiga esta rodando e reiniciar se necessario.

### Durante

- Implementar o menor escopo funcional possivel.
- Manter migrations incrementais.
- Usar queries parametrizadas.
- Padronizar erros JSON.
- Preservar endpoints existentes.
- Preservar frontend existente.
- Nao quebrar V3.1, V3.2, V3.3 ou V3.4 anteriores.

### Depois

- Rodar `npm.cmd run build` em `server`.
- Rodar `npm.cmd run web:build` na raiz.
- Rodar `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- Rodar `npx.cmd tsc -p tsconfig.json --noEmit`.
- Rodar smoke tests aplicaveis.
- Rodar testes HTTP aplicaveis.
- Criar ou atualizar documentacao da versao.
- Criar ou atualizar checklist da versao.
- Rodar `git status --short` final.

## Padrao de documentacao

Para cada etapa, criar:

- `docs/vX.Yz-nome-da-etapa.md`
- `docs/erp/<dominio>.md`, se aplicavel
- `tests/checklist-vX.Yz-nome-da-etapa.md`
- Atualizacao do `README.md` com comandos e escopo

## Padrao de Git

- Criar commit final por etapa.
- Usar mensagens no padrao:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
  - `docs: ...`
  - `test: ...`
- Criar tag por etapa validada.
- Fazer `git push` somente se explicitamente autorizado pelo prompt e se todas as validacoes passarem.

## Ambiente local

- PostgreSQL local via Docker Compose.
- Banco local permitido: `enac_erp_dev`.
- Backend local: `http://127.0.0.1:3333`.
- Frontend local: `http://127.0.0.1:5173`.
- Backend no Windows/host deve usar `127.0.0.1:5432` ou `localhost:5432`.
- Backend dentro da rede Docker Compose deve usar host `postgres`.
- `.env` local nunca deve ser commitado.

## Roadmap atual

- V3.4A concluida: Solicitacao de Compra MVP.
- V3.4B proxima: Cotacao e mapa comparativo.
- V3.4C: Pedido de compra.
- V3.5A: Nota fiscal de entrada e contas a pagar inicial.
- V3.5B: Programacao e liberacao de pagamento.
- V3.6A: Medicao de obra e faturamento.
- V3.7A: Usuarios, perfis e alcadas internas.
- V3.8A: SharePoint como repositorio documental, sem usa-lo como banco principal.
- V4.0: piloto operacional controlado.

## Parada obrigatoria

Ao final de cada etapa, parar e apresentar:

- Resumo.
- Arquivos alterados.
- Validacoes.
- Testes manuais.
- Restricoes respeitadas.
- Commit criado.
- `git status --short` final.
- Proximos riscos.
