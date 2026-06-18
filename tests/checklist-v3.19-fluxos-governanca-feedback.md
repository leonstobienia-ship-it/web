# Checklist V3.19 - Fluxos, Governanca e Feedback

## Base

- [x] Branch inicial `main`.
- [x] `main = origin/main = a12dc68`.
- [x] Tag anterior `v3.18m-polimento-mobile-dashboard-tipografia`.
- [x] Branch `dev/v3.19-fluxos-governanca-feedback`.
- [x] Working tree limpo antes da etapa.
- [x] `.git/index.lock` ausente.
- [x] `b004592_ANCESTOR_FALSE`.

## Feedback de criacao

- [x] Solicitacoes exibem sucesso, limpam formulario e atualizam lista.
- [x] Pedidos exibem sucesso, limpam formulario e atualizam lista.
- [x] Notas exibem sucesso, limpam formulario, limpam PDF/XML temporario e atualizam lista.
- [x] Contas a Pagar exibem sucesso, limpam formulario e atualizam lista.
- [x] Programacoes exibem sucesso, limpam formulario e atualizam lista.
- [x] Central de Tarefas exibe sucesso, limpa formulario e atualiza lista.
- [x] Documentos exibem sucesso, limpam formulario e atualizam lista.
- [x] Administracao exibe sucesso em criacoes.
- [x] Erro de validacao nao limpa formulario.
- [x] Modo edicao nao limpa formulario indevidamente.
- [x] Duplo clique nao gera duplicidade por causa de `saving`.

## Fluxo e governanca

- [x] Detalhe de Pedido mostra fluxo operacional.
- [x] Detalhe de Solicitacao mostra fluxo operacional.
- [x] Detalhe de NF mostra vinculo com pedido e alertas documentais.
- [x] Detalhe de Conta mostra origem e programacao.
- [x] Detalhe de Programacao mostra alçada e agrupamentos.
- [x] Central mostra gargalos do fluxo.
- [x] Dashboard mostra indicadores operacionais V3.19 quando disponiveis.
- [x] Administracao mostra parametros mock e aviso de nao retroatividade.

## Auditoria mock

- [x] Pedidos exibem trilha visual.
- [x] Solicitacoes exibem trilha visual.
- [x] Notas exibem trilha visual.
- [x] Contas exibem trilha visual.
- [x] Programacoes exibem trilha visual.
- [x] Central exibe trilha da tarefa.
- [x] Documentos exibem trilha documental mock.
- [x] Administracao exibe auditoria mock de parametros.

## Browser desktop 1440x900

- [x] Dashboard Executivo.
- [x] Pedidos/Compras.
- [x] Aprovacoes.
- [x] Notas.
- [x] Contas a Pagar.
- [x] Programacoes.
- [x] Central de Tarefas.
- [x] Documentos.
- [x] Administracao.
- [x] Relatorios.
- [x] Criacao com sucesso, reset e lista atualizada.
- [x] Erro de validacao preserva formulario.
- [x] Sem erro de console.

## Browser mobile 390x844

- [x] Menu fechado por padrao.
- [x] Drawer abre/fecha.
- [x] Sem overflow horizontal.
- [x] Dashboard Executivo.
- [x] Pedidos/Compras.
- [x] Notas.
- [x] Contas a Pagar.
- [x] Programacoes.
- [x] Central.
- [x] Documentos.

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
