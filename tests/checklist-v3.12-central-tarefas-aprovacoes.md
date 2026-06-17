# Checklist V3.12 - Central de Tarefas e Aprovacoes

## Ambiente

- [ ] Branch base `main` em `8c3ff39`.
- [ ] Branch de trabalho `dev/v3.12-central-tarefas-aprovacoes`.
- [ ] `git status --short` limpo antes da etapa.
- [ ] `.git/index.lock` ausente.
- [ ] Docker Desktop ativo.
- [ ] PostgreSQL local `healthy`.
- [ ] Porta `5432` acessivel.
- [ ] `/health` OK.
- [ ] `/health/db` OK em `enac_erp_dev`.
- [ ] `b004592_ANCESTOR_FALSE`.

## Backend

- [ ] Migration `022_central_tarefas_aprovacoes_v312.sql` aplicada.
- [ ] `GET /central-tarefas/resumo` retorna 200.
- [ ] `GET /central-tarefas/minhas` retorna 200.
- [ ] `GET /central-tarefas/aprovacoes` retorna 200.
- [ ] `GET /central-tarefas/por-modulo` retorna 200.
- [ ] `GET /central-tarefas/atrasadas` retorna 200.
- [ ] `GET /central-tarefas/criticas` retorna 200.
- [ ] Tarefa manual pode ser criada.
- [ ] Tarefa manual pode ser marcada como vista.
- [ ] Tarefa manual pode ser iniciada.
- [ ] Tarefa manual pode ser concluida.
- [ ] Tarefa manual pode ser cancelada logicamente.
- [ ] Auditoria registrada em `auditoria_eventos`.
- [ ] Central nao aprova documento automaticamente.
- [ ] Central nao ignora alcada do modulo de origem.
- [ ] Nao existe `DELETE` fisico.

## Frontend

- [ ] Tela `Central de Tarefas e Aprovações` aparece no menu.
- [ ] Cards superiores carregam.
- [ ] Abas funcionam.
- [ ] Filtros funcionam.
- [ ] Tabela exibe titulo, modulo, origem, status, prioridade, responsavel, prazo e idade.
- [ ] Atalho abre modulo de origem.
- [ ] Acoes de estado aparecem apenas para tarefa manual auxiliar.
- [ ] Layout desktop sem overflow incoerente.
- [ ] Layout mobile sem sobreposicao.
- [ ] Console sem erro.

## Smokes e builds

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:solicitacoes`.
- [ ] `npm.cmd run smoke:cotacoes`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:liberacoes-programacao`.
- [ ] `npm.cmd run smoke:conferencia-financeira`.
- [ ] `npm.cmd run smoke:baixa-manual`.
- [ ] `npm.cmd run smoke:relatorios-financeiros`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:contratos-obra`.
- [ ] `npm.cmd run smoke:orcamento-planejamento`.
- [ ] `npm.cmd run smoke:previsto-realizado`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:riscos-pendencias`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Restrições

- [ ] Sem pagamento funcional.
- [ ] Sem baixa nova funcional.
- [ ] Sem CNAB funcional.
- [ ] Sem integracao bancaria.
- [ ] Sem banco real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto.
- [ ] Sem cobranca real.
- [ ] Sem SharePoint real.
- [ ] Sem Entra real.
- [ ] Sem Power Automate real.
- [ ] Sem uso/cherry-pick de `b004592`.
