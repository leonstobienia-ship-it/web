# Checklist V3.18H - Separacao Orcamentos x Planejamento

## Ambiente e Git

- [ ] Branch base `main` validada.
- [ ] `main = origin/main`.
- [ ] Tag `v3.18g-redesign-visual-executivo` presente.
- [ ] Tag `v3.18h-separacao-orcamento-planejamento` ausente antes da etapa.
- [ ] Working tree limpo antes de iniciar.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Funcional

- [ ] Menu `Obras > Orcamentos` abre apenas a tela `Orcamentos de Obra`.
- [ ] Tela de Orcamentos nao exibe aba `Planejamento Executivo`.
- [ ] Orcamentos exibe `Consulta` como primeira visao.
- [ ] Orcamentos exibe `Novo orcamento` em aba propria.
- [ ] Orcamentos trata pacotes, itens, cronograma fisico-financeiro, resumo e status orcamentario.
- [ ] Menu `Obras > Planejamento Executivo` abre apenas a tela `Planejamento Executivo`.
- [ ] Tela de Planejamento Executivo nao exibe aba `Orcamentos`.
- [ ] Planejamento Executivo exibe `Consulta` como primeira visao.
- [ ] Planejamento Executivo exibe `Novo planejamento` em aba propria.
- [ ] Planejamento Executivo trata etapas, responsaveis, datas, status, revisoes e encerramento/cancelamento existentes.

## Visual e responsividade

- [ ] Filtros compactos.
- [ ] Listas legiveis.
- [ ] Detalhe em painel lateral no desktop.
- [ ] Sem formulario aberto por padrao na consulta.
- [ ] Sem overflow horizontal em desktop.
- [ ] Sem overflow horizontal em mobile.
- [ ] Sem erro de console no Browser interno.

## Validacoes

- [ ] `npm.cmd run build` no backend.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:orcamento-planejamento`.
- [ ] `npm.cmd run smoke:contratos-obra`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:previsto-realizado`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:homologacao`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Restricoes

- [ ] Sem backend novo.
- [ ] Sem migration.
- [ ] Sem endpoint novo.
- [ ] Sem alteracao de regra de negocio.
- [ ] Sem pagamento real.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem banco real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto real.
- [ ] Sem SharePoint, Microsoft Graph, Entra ou Power Automate reais.
- [ ] Sem upload externo.
- [ ] Sem `DELETE` fisico.
