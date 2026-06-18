# Checklist V3.18J - Modelo Visual e Scroll

## Ambiente e Git

- [ ] Branch base `main` validada.
- [ ] `main = origin/main = 70433dd` antes da etapa.
- [ ] Tag `v3.18i-ajustes-visuais-logo-nf-layout` presente.
- [ ] Tag `v3.18j-modelo-visual-scroll-layout` ausente antes da etapa.
- [ ] Branch `dev/v3.18j-modelo-visual-scroll-layout` criada.
- [ ] Working tree limpo antes de iniciar.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.

## Fonte do modelo visual

- [ ] Buscas textuais do print executadas.
- [ ] Busca por arquivos de mock/modelo/referencia executada.
- [ ] Resultado documentado.
- [ ] Confirmado se havia ou nao codigo-fonte reutilizavel.
- [ ] Se fonte nao encontrada, print usado como especificacao visual interna.

## Arquitetura de scroll

- [ ] `html`, `body` e `#root` com altura controlada.
- [ ] Desktop sem scroll duplo desnecessario.
- [ ] Sidebar com scroll proprio.
- [ ] Main/content com scroll proprio no desktop.
- [ ] Topbar com fundo solido e z-index controlado.
- [ ] Tabelas longas com container proprio.
- [ ] Cabecalho de tabela nao passa por tras de outros paineis.
- [ ] Painel lateral com fundo solido.
- [ ] Painel lateral sem sobreposicao indevida.
- [ ] Mobile com scroll natural e sem overflow horizontal.

## Programacao de Pagamento

- [ ] Lista nao passa por tras de quadros.
- [ ] Filtros e abas ficam acima da lista.
- [ ] Detalhe fica em painel lateral no desktop.
- [ ] Contas elegiveis ficam separadas do painel de acoes.
- [ ] Botoes de submeter, aprovar, liberar, conferir e cancelar ficam dentro do painel correto.
- [ ] Rolagem ate meio e fim validada.
- [ ] Sem overflow horizontal.
- [ ] Sem erro de console.

## Telas criticas

- [ ] Notas Fiscais de Entrada sem espaco fantasma e sem sobreposicao.
- [ ] Contas a Pagar sem sobreposicao.
- [ ] Pedidos de Compra sem sobreposicao.
- [ ] Medicoes e Faturamento sem sobreposicao.
- [ ] Documentos e Anexos com lista e painel controlados.
- [ ] Central de Tarefas com lista e detalhe controlados.
- [ ] Riscos e Pendencias com lista e detalhe controlados.

## Validacoes backend

- [ ] `npm.cmd run build` no backend.
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
- [ ] `npm.cmd run smoke:homologacao`.

## Validacoes frontend

- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Browser interno desktop 1440x900.
- [ ] Browser interno mobile 390x844.
- [ ] Sem framework overlay.
- [ ] Sem erro de console.

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
