# Checklist V3.20 - Homologacao Automatizada Assistida

## Git e Ambiente

- [x] Branch inicial era `main`.
- [x] `main = origin/main = b93ec5a` antes da branch.
- [x] Tag `v3.19.1-ajustes-finais-layout-homologacao` existia.
- [x] Tag `v3.20-homologacao-automatizada-assistida` nao existia.
- [x] `.git/index.lock` ausente.
- [x] `b004592_ANCESTOR_FALSE`.
- [x] Docker/PostgreSQL healthy.
- [x] `/health` OK.
- [x] `/health/db` OK.

## Implementacao

- [x] Branch `dev/v3.20-homologacao-automatizada-assistida` criada.
- [x] Script `server/src/scripts/homologacaoE2E.ts` criado.
- [x] Script `homologacao:e2e` adicionado ao `server/package.json`.
- [x] Relatorio Markdown gerado em `reports/homologacao/v3.20/`.
- [x] Relatorio JSON gerado em `reports/homologacao/v3.20/`.
- [x] Nenhuma migration criada.
- [x] Nenhum endpoint criado.
- [x] Nenhuma regra operacional alterada.

## Fluxo E2E

- [x] Health validado.
- [x] Seed base executada.
- [x] Cliente/Fornecedor/Obra/Centro de Custo validados.
- [x] Usuarios/perfis/alçadas locais validados.
- [x] Contrato ativo validado.
- [x] Aditivo aprovado validado.
- [x] Orcamento aprovado validado.
- [x] Planejamento ativo validado.
- [x] Solicitacao validada.
- [x] Cotacao e mapa comparativo validados.
- [x] Pedido confirmado validado.
- [x] NF vinculada ao pedido validada.
- [x] Conta a pagar vinculada a NF validada.
- [x] Programacao, liberacao e conferencia validadas.
- [x] Baixa manual controlada local validada sem criar baixa nova.
- [x] Medicao e faturamento manual validados.
- [x] Previsto x Realizado validado.
- [x] Dashboard Executivo validado.
- [x] Central de Tarefas validada.
- [x] Riscos e Pendencias validados.
- [x] Documentos mock validados.
- [x] Auditoria validada.

## Browser Interno

- [x] Vite iniciado em `127.0.0.1:5173`.
- [x] Desktop 1440x900 validado.
- [x] Mobile 390x844 validado.
- [x] Drawer mobile abre e fecha.
- [x] Navegacao por modulos principais validada.
- [x] Criacao de tarefa manual visual validada.
- [x] Toast de sucesso observado.
- [x] Formulario limpou apos criacao.
- [x] Lista atualizou.
- [x] Sem erro de console relevante.
- [x] Sem overflow horizontal.
- [x] Sem botoes proibidos.

## Validações

- [x] `npm.cmd run build`.
- [x] `npm.cmd run migrate`.
- [x] `npm.cmd run homologacao:e2e`.
- [x] `npm.cmd run smoke:homologacao`.
- [x] `npm.cmd run smoke:dashboard-executivo`.
- [x] `npm.cmd run smoke:central-tarefas`.
- [x] `npm.cmd run smoke:riscos-pendencias`.
- [x] `npm.cmd run smoke:documentos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run smoke:programacoes-pagamento`.
- [x] `npm.cmd run smoke:medicoes-faturamento`.
- [x] `npm.cmd run smoke:relatorios-financeiros`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.

## Seguranca

- [x] Sem pagamento real.
- [x] Sem baixa nova real.
- [x] Sem CNAB.
- [x] Sem banco real.
- [x] Sem NFS-e real.
- [x] Sem prefeitura.
- [x] Sem boleto real.
- [x] Sem SharePoint real.
- [x] Sem Microsoft Graph real.
- [x] Sem Entra real.
- [x] Sem Power Automate real.
- [x] Sem upload externo real.
- [x] Sem `DELETE` fisico.

## Consolidacao

- [x] Commit local criado.
- [x] Revalidacao pos-commit executada.
- [x] Merge fast-forward na `main`.
- [x] Push da `main`.
- [x] Tag local/remota `v3.20-homologacao-automatizada-assistida`.
- [x] `main = origin/main = commit V3.20`.
- [x] Working tree limpo.
