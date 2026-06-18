# Checklist V3.19.1 - Ajustes Finais de Layout para Homologacao

## Base

- [x] Branch inicial `main`.
- [x] `main = origin/main = 94d2499`.
- [x] Tag anterior `v3.19-fluxos-governanca-feedback`.
- [x] Tag `v3.19.1-ajustes-finais-layout-homologacao` ausente antes da etapa.
- [x] Working tree limpo antes da etapa.
- [x] `.git/index.lock` ausente.
- [x] `b004592_ANCESTOR_FALSE`.

## Menu lateral

- [x] Texto `Sistema ENAC` removido debaixo do logo.
- [x] Texto `ERP operacional local` mantido.
- [x] `ERP operacional local` alinhado ao bloco do logo.
- [x] Logo oficial preservado sem fundo branco, sem card e sem distorcao.
- [x] Sidebar grafite mantida.
- [x] Grupos Operacao, Compras, Financeiro, Obras, Gestao, Administracao e Base ERP preservados.
- [x] Grupos com icone, titulo, subtitulo e seta discreta.
- [x] Itens com icone, label e perfil/area discreto.
- [x] Item ativo com destaque vermelho ENAC.
- [x] Sem textos visuais `Abrir` ou `Recolher`.

## Cards e quadros

- [x] Grids de cards usam alinhamento esticado em desktop.
- [x] Cards lado a lado alinham a base.
- [x] Cards usam altura de grid coerente, sem altura fixa rigida.
- [x] Conteudo interno dos cards usa composicao vertical.
- [x] Mobile empilha cards e nao força altura igual.
- [x] Sem overflow horizontal.

## Browser desktop 1440x900

- [x] Menu lateral.
- [x] Dashboard Executivo.
- [x] Relatorios Financeiros.
- [x] Documentos e Anexos.
- [x] Central de Tarefas.
- [x] Riscos e Pendencias.
- [x] Contas a Pagar.
- [x] Programacoes.
- [x] Medicoes.
- [x] Notas Fiscais.
- [x] Sem erro de console.
- [x] Sem overlay de framework.

## Browser mobile 390x844

- [x] Menu fechado por padrao.
- [x] Drawer abre/fecha.
- [x] Clique em item fecha drawer.
- [x] Logo nao corta.
- [x] `ERP operacional local` nao fica desalinhado.
- [x] Cards empilham corretamente.
- [x] Sem overflow horizontal.

## Validacoes backend

- [x] `npm.cmd run build`.
- [x] `npm.cmd run migrate`.
- [x] `npm.cmd run smoke:dashboard-executivo`.
- [x] `npm.cmd run smoke:relatorios-financeiros`.
- [x] `npm.cmd run smoke:central-tarefas`.
- [x] `npm.cmd run smoke:documentos`.
- [x] `npm.cmd run smoke:programacoes-pagamento`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:homologacao`.

## Validacoes frontend

- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.

## Restricoes

- [x] Sem backend alterado.
- [x] Sem migration criada.
- [x] Sem endpoint novo.
- [x] Sem pagamento real.
- [x] Sem baixa nova.
- [x] Sem CNAB.
- [x] Sem banco real.
- [x] Sem boleto real.
- [x] Sem NFS-e real.
- [x] Sem prefeitura.
- [x] Sem SharePoint/Graph/Entra/Power Automate reais.
- [x] Sem upload externo real.
- [x] Sem `DELETE` fisico.
