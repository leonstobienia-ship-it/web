# Checklist V3.5G - Baixa Manual Controlada sem Banco

## Travas

- [x] Nao conectar banco de producao.
- [x] Nao criar endpoint `/pagar`.
- [x] Nao criar endpoint `/baixar` generico.
- [x] Nao criar endpoint `/executar-pagamento`.
- [x] Nao criar endpoint `/gerar-cnab`.
- [x] Nao criar integracao bancaria.
- [x] Nao gerar CNAB.
- [x] Nao escrever no SharePoint real.
- [x] Nao alterar Entra real.
- [x] Nao criar Power Automate.
- [x] Nao usar `DELETE` fisico.

## Backend

- [x] Migration `014_baixa_manual_controlada_v35g.sql` aplicada.
- [x] `contas_pagar` aceita status `BAIXADA_MANUAL`.
- [x] `contas_pagar` possui campos de baixa manual.
- [x] `contas_pagar_baixas` registra historico de baixa e estorno.
- [x] `auditoria_eventos` registra baixa, bloqueio e estorno.
- [x] Alçadas `baixar_manual` e `estornar_baixa` existem para FINANCEIRO e DIRETORIA.
- [x] Baixa bloqueia conta sem conferencia financeira final.
- [x] Baixa bloqueia conta cancelada, inativa, com divergencia, sem saldo ou ja baixada.
- [x] Baixa bloqueia valor diferente do saldo aberto.
- [x] Baixa acima de R$ 20.000 exige Diretoria.
- [x] Estorno exige motivo e preserva historico.

## Frontend

- [x] Tela de Contas a Pagar exibe status de baixa.
- [x] Tela exibe programacao, liberacao e conferencia vinculadas.
- [x] Botao de baixa manual aparece somente quando elegivel.
- [x] Tela exibe bloqueios de elegibilidade.
- [x] Tela exibe historico de baixa.
- [x] Nao ha botao de pagar.
- [x] Nao ha botao de CNAB.
- [x] Nao ha integracao bancaria.

## Validacoes

- [x] `npm.cmd run build` em `server`.
- [x] `npm.cmd run migrate`.
- [x] `npm.cmd run smoke:cadastros`.
- [x] `npm.cmd run smoke:solicitacoes`.
- [x] `npm.cmd run smoke:cotacoes`.
- [x] `npm.cmd run smoke:pedidos`.
- [x] `npm.cmd run smoke:notas`.
- [x] `npm.cmd run smoke:contas-pagar`.
- [x] `npm.cmd run smoke:acessos`.
- [x] `npm.cmd run smoke:aprovacoes`.
- [x] `npm.cmd run smoke:programacoes-pagamento`.
- [x] `npm.cmd run smoke:liberacoes-programacao`.
- [x] `npm.cmd run smoke:conferencia-financeira`.
- [x] `npm.cmd run smoke:baixa-manual`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.
- [x] Browser desktop/mobile sem erro visual bloqueante.
