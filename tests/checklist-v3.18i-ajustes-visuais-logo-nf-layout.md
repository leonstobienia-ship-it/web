# Checklist V3.18I - Ajustes Visuais Logo, NF e Layout

## Ambiente e Git

- [ ] Branch base `main` validada.
- [ ] `main = origin/main = 427fc42` antes da etapa.
- [ ] Tag `v3.18h-separacao-orcamento-planejamento` presente.
- [ ] Tag `v3.18i-ajustes-visuais-logo-nf-layout` ausente antes da etapa.
- [ ] Branch `dev/v3.18i-ajustes-visuais-logo-nf-layout` criada.
- [ ] Working tree limpo antes de iniciar.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Logo

- [ ] Logo usa `web/src/assets/enac-logo-oficial.png`.
- [ ] Logo aparece no menu lateral.
- [ ] Logo nao tem fundo branco.
- [ ] Logo preserva transparencia.
- [ ] Logo preserva proporcao.
- [ ] Logo nao fica cortado.
- [ ] Logo funciona em desktop.
- [ ] Logo funciona em mobile.

## Notas Fiscais de Entrada

- [ ] Aba `Novo registro` exibe `Anexar PDF/XML da NF`.
- [ ] Aba `Detalhes` exibe `Anexar PDF/XML da NF`.
- [ ] PDF selecionado mostra preview local ou metadados claros.
- [ ] XML selecionado mostra metadados e trecho textual.
- [ ] NF sem documento mostra estado vazio util.
- [ ] NF criada com arquivo selecionado registra referencia documental local/mock.
- [ ] Documento existente da NF aparece em `Referencias registradas`.
- [ ] Nao ha upload externo real.
- [ ] Nao ha SharePoint real.
- [ ] Nao ha armazenamento de binario pesado no banco.

## Layout e espacos vazios

- [ ] Notas Fiscais de Entrada sem area fantasma abaixo das abas.
- [ ] Programacoes de Pagamento sem area fantasma abaixo das abas.
- [ ] Contas a Pagar sem area fantasma abaixo das abas.
- [ ] Pedidos de Compra sem area fantasma abaixo das abas.
- [ ] Medicoes e Faturamento sem area fantasma abaixo das abas.
- [ ] Documentos e Anexos com painel lateral util.
- [ ] Central de Tarefas com consulta, cadastro e detalhe sem vazios incoerentes.
- [ ] Conteudo usa melhor a largura em desktop.
- [ ] Sem overflow horizontal em desktop.
- [ ] Sem overflow horizontal em mobile.

## Validacoes backend

- [ ] `npm.cmd run build` no backend.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:homologacao`.

## Validacoes frontend

- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Browser interno desktop validado.
- [ ] Browser interno mobile validado.
- [ ] Sem erro de console no Browser interno.

## Restricoes

- [ ] Sem backend novo.
- [ ] Sem migration.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento real.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem banco real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto real.
- [ ] Sem SharePoint, Microsoft Graph, Entra ou Power Automate reais.
- [ ] Sem upload externo real.
- [ ] Sem `DELETE` fisico.
