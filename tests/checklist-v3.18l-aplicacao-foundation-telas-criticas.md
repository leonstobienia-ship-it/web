# Checklist V3.18L - Aplicacao Profunda da Foundation nas Telas Criticas

## Base

- [ ] Branch inicial `main`.
- [ ] `main = origin/main = b84b34d`.
- [ ] Tag anterior `v3.18k-foundation-visual-erp-enac`.
- [ ] Working tree limpo.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Visual

- [ ] KPI cards sem colisao entre label e valor.
- [ ] Relatorios Financeiros com cards responsivos, filtros compactos e abas claras.
- [ ] Dashboard Executivo com cards sem sobreposicao e alertas legiveis.
- [ ] Botao `Detalhe` padronizado nas tabelas criticas.
- [ ] Tabelas com densidade de ERP, hover discreto e selecao destacada.
- [ ] Painel documental de Nota Fiscal com preview PDF/XML contido.
- [ ] Contas a Pagar com detalhe lateral mais corporativo.
- [ ] Programacoes de Pagamento com detalhe lateral mais organizado.
- [ ] Medicoes e Faturamento com detalhe e tabelas sem excesso de espaco.
- [ ] Documentos, Central de Tarefas e Riscos herdam cards, filtros, listas e detalhes refinados.
- [ ] Mobile sem overflow horizontal nas telas testadas.

## Browser desktop 1440x900

- [ ] Relatorios Financeiros.
- [ ] Dashboard Executivo.
- [ ] Notas Fiscais de Entrada.
- [ ] Contas a Pagar.
- [ ] Programacoes de Pagamento.
- [ ] Medicoes e Faturamento.
- [ ] Documentos e Anexos.
- [ ] Central de Tarefas.
- [ ] Riscos e Pendencias.
- [ ] Sem erro de console ou overlay de framework.

## Browser mobile 390x844

- [ ] Relatorios Financeiros.
- [ ] Dashboard Executivo.
- [ ] Notas Fiscais de Entrada.
- [ ] Programacoes de Pagamento.
- [ ] Contas a Pagar.
- [ ] Central de Tarefas.
- [ ] Riscos e Pendencias.
- [ ] Sem overflow horizontal.

## Validacoes backend

- [ ] `npm.cmd run build`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:liberacoes-programacao`.
- [ ] `npm.cmd run smoke:conferencia-financeira`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run smoke:riscos-pendencias`.
- [ ] `npm.cmd run smoke:relatorios-financeiros`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:homologacao`.

## Validacoes frontend

- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Restricoes

- [ ] Sem backend novo.
- [ ] Sem migration.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento real.
- [ ] Sem baixa nova.
- [ ] Sem banco/CNAB.
- [ ] Sem NFS-e/prefeitura/boleto real.
- [ ] Sem SharePoint/Graph/Entra/Power Automate reais.
- [ ] Sem upload externo real.
- [ ] Sem `DELETE` fisico.
