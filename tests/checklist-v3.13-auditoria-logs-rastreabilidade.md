# Checklist V3.13 - Auditoria Geral, Logs e Rastreabilidade

## Git e ambiente

- [ ] Branch base `main` em `473be67`.
- [ ] Tag `v3.12-central-tarefas-aprovacoes` presente.
- [ ] Sem tag `v3.13*` antes da etapa.
- [ ] Working tree limpo antes da implementacao.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK em `enac_erp_dev`.

## Backend

- [ ] Migration `023_auditoria_logs_rastreabilidade_v313.sql` aplicada.
- [ ] `GET /auditoria/eventos` OK.
- [ ] `GET /auditoria/eventos/:id` OK.
- [ ] `GET /auditoria/entidade/:tipo/:id` OK.
- [ ] `GET /auditoria/usuario/:usuarioId` OK.
- [ ] `GET /auditoria/modulos` OK.
- [ ] `GET /auditoria/resumo` OK.
- [ ] `GET /auditoria/eventos-criticos` OK.
- [ ] Endpoints somente leitura.
- [ ] `PATCH` em evento bloqueado.
- [ ] `DELETE` em evento bloqueado.

## Frontend

- [ ] Tela `Auditoria e Logs` no menu.
- [ ] Cards de resumo.
- [ ] Filtros avancados.
- [ ] Tabela de eventos.
- [ ] Eventos criticos.
- [ ] Agrupamento por modulo.
- [ ] Detalhe do evento.
- [ ] Timeline por entidade.
- [ ] Payload em modo leitura.
- [ ] Sem botao de editar log.
- [ ] Sem botao de excluir log.

## Validacoes

- [ ] `npm.cmd run build` no backend.
- [ ] `npm.cmd run migrate`.
- [ ] Todos os smokes existentes.
- [ ] `npm.cmd run smoke:auditoria`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Browser interno

- [ ] Auditoria e Logs desktop OK.
- [ ] Auditoria e Logs mobile OK.
- [ ] Central de Tarefas OK.
- [ ] Riscos e Pendencias OK.
- [ ] Dashboard Executivo OK.
- [ ] Sem erro de console.
- [ ] Sem botoes proibidos.
- [ ] Logs sem botao excluir/editar.

## Restricoes

- [ ] Sem pagamento.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem banco real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto.
- [ ] Sem SharePoint real.
- [ ] Sem Entra real.
- [ ] Sem Power Automate real.
- [ ] Sem `DELETE` fisico.
- [ ] Sem uso/cherry-pick de `b004592`.
