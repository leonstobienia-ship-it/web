# Checklist V3.18K - Foundation Visual ERP ENAC

## Base

- [ ] Branch inicial `main`.
- [ ] `main = origin/main = 92568ec`.
- [ ] Tag anterior `v3.18j-modelo-visual-scroll-layout`.
- [ ] Working tree limpo.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Componentes

- [ ] `EnacPageHeader` criado.
- [ ] `EnacKpiCard` criado.
- [ ] `EnacFilterBar` criado.
- [ ] `EnacDataTable` criado.
- [ ] `EnacStatusChip` criado.
- [ ] `EnacDetailPane` criado.
- [ ] `EnacEmptyState` criado.
- [ ] `EnacSplitView` criado.
- [ ] Componentes opcionais de shell/form/modal criados quando seguro.

## Visual

- [ ] Sidebar institucional ENAC preserva logo oficial sem fundo branco.
- [ ] Topbar compacta.
- [ ] Usuario/perfil visiveis.
- [ ] Sem seletor `Navegar para tela`.
- [ ] Filtros compactos.
- [ ] Cards KPI uniformes.
- [ ] Tabelas densas.
- [ ] Detail pane controlado.
- [ ] Empty states uteis.
- [ ] Mobile sem overflow horizontal.

## Telas

- [ ] Programacoes de Pagamento.
- [ ] Notas Fiscais de Entrada.
- [ ] Contas a Pagar.
- [ ] Documentos e Anexos.
- [ ] Central de Tarefas.
- [ ] Riscos e Pendencias.
- [ ] Relatorios Financeiros.
- [ ] Dashboard Executivo.
- [ ] Pedidos.
- [ ] Medicoes.
- [ ] Orcamentos.
- [ ] Planejamento Executivo.
- [ ] Administracao/Acessos.
- [ ] Homologacao.

## Validacoes

- [ ] Backend build.
- [ ] Migrations.
- [ ] Smokes obrigatorios.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Browser desktop 1440x900.
- [ ] Browser mobile 390x844.

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
