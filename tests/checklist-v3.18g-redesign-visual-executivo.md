# Checklist V3.18G - Redesign Visual Executivo

## Git e ambiente

- [ ] Branch base `main` em `7f6e41e`.
- [ ] Branch de trabalho `dev/v3.18g-redesign-visual-executivo`.
- [ ] Working tree limpo antes de iniciar.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.

## Visual

- [ ] Logo oficial ENAC aparece no topo da sidebar.
- [ ] Logo nao esta distorcido.
- [ ] Logo preserva transparencia e cores.
- [ ] Sidebar usa grafite/preto como cor institucional.
- [ ] Vermelho ENAC aparece em item ativo, botoes principais, acentos e paineis.
- [ ] Verde aparece apenas em status positivo.
- [ ] Menu tem icones e grupos claros.
- [ ] Menu nao mostra `Abrir`, `Recolher`, `Sistema atual`, `Sistema legado` ou item legado.
- [ ] Topbar nao mostra `Navegar para tela`.
- [ ] Usuario, perfil e homologacao local continuam visiveis.
- [ ] Cards KPI estao compactos e uniformes.
- [ ] Filtros estao compactos.
- [ ] Tabelas estao densas e com rolagem controlada.
- [ ] Abas funcionam.
- [ ] Paineis laterais funcionam em desktop e ficam seguros no mobile.
- [ ] Central de Tarefas inicia em Consulta.
- [ ] Nova tarefa manual fica em aba propria.
- [ ] Documentos e Anexos usa lista + painel lateral.
- [ ] Dashboard e Relatorios estao separados por abas.
- [ ] Planejamento Executivo aparece como item proprio em Obras.
- [ ] Mobile sem overflow horizontal.
- [ ] Console sem erro.

## Validacoes obrigatorias

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run smoke:auditoria`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:homologacao`.
- [ ] `npm.cmd run smoke:riscos-pendencias`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:relatorios-financeiros`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:orcamento-planejamento`.
- [ ] `npm.cmd run smoke:previsto-realizado`.
- [ ] `npm.cmd run smoke:contratos-obra`.
- [ ] `npm.cmd run smoke:baixa-manual`.
- [ ] `npm.cmd run smoke:liberacoes-programacao`.
- [ ] `npm.cmd run smoke:conferencia-financeira`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Restricoes

- [ ] Sem backend alterado.
- [ ] Sem migration criada.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento funcional.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem banco real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto real.
- [ ] Sem SharePoint/Graph/Entra/Power Automate reais.
- [ ] Sem upload externo.
- [ ] Sem `DELETE` fisico.
