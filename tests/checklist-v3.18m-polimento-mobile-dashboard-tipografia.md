# Checklist V3.18M - Polimento Mobile, Dashboard e Tipografia

## Base

- [ ] Branch inicial `main`.
- [ ] `main = origin/main = d14c40b`.
- [ ] Tag anterior `v3.18l-aplicacao-foundation-telas-criticas`.
- [ ] Tag `v3.18m-polimento-mobile-dashboard-tipografia` ausente antes da etapa.
- [ ] Working tree limpo.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Visual

- [ ] Menu mobile fechado por padrao.
- [ ] Botao hamburger abre o menu mobile.
- [ ] Menu mobile abre como drawer com backdrop.
- [ ] Clique em item do menu fecha o drawer.
- [ ] Conteudo mobile usa 100% da largura quando o menu esta fechado.
- [ ] Sem overflow horizontal em mobile.
- [ ] Sidebar desktop mais densa, com logo equilibrado e item ativo claro.
- [ ] Tipografia global mais leve em titulos, labels e KPIs.
- [ ] Dashboard Executivo agrupado por visao executiva, operacao, financeiro, margem e alertas.
- [ ] Cards principais do Dashboard nao colidem nem cortam valores grandes.
- [ ] Relatorios Financeiros mantem filtros compactos, abas claras e cards legiveis.
- [ ] Botoes `Detalhe` em tabelas usam padrao secundario compacto.
- [ ] Paineis laterais mantem cabecalho claro, scroll interno e sem sobreposicao.

## Browser desktop 1440x900

- [ ] Dashboard Executivo.
- [ ] Relatorios Financeiros.
- [ ] Central de Tarefas.
- [ ] Documentos e Anexos.
- [ ] Programacoes de Pagamento.
- [ ] Contas a Pagar.
- [ ] Notas Fiscais de Entrada.
- [ ] Sem erro de console ou overlay de framework.

## Browser mobile 390x844

- [ ] Menu fechado por padrao.
- [ ] Abrir menu.
- [ ] Clicar em item e fechar drawer.
- [ ] Dashboard Executivo.
- [ ] Relatorios Financeiros.
- [ ] Programacoes de Pagamento.
- [ ] Central de Tarefas.
- [ ] Documentos e Anexos.
- [ ] Sem overflow horizontal.

## Validacoes backend

- [ ] `npm.cmd run build`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:relatorios-financeiros`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:notas`.
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
