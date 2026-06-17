# Checklist V3.5C - Aprovações por Alçada nos Documentos

## Escopo

- [x] Solicitação de Compra aprovada por alçada.
- [x] Cotação aprovada por alçada.
- [x] Pedido bloqueado para emissão sem aprovação.
- [x] Nota Fiscal de Entrada aprovada por alçada na rota `/notas-fiscais-entrada`.
- [x] Conta a Pagar aprovada internamente sem pagamento.
- [x] Auditoria de aprovações e bloqueios.
- [x] Sem programação bancária.
- [x] Sem liberação bancária.
- [x] Sem pagamento.
- [x] Sem baixa.
- [x] Sem `DELETE` físico.

## Validações planejadas

- [x] `npm.cmd run build` em `server`
- [x] `npm.cmd run migrate`
- [x] `npm.cmd run smoke:cadastros`
- [x] `npm.cmd run smoke:solicitacoes`
- [x] `npm.cmd run smoke:cotacoes`
- [x] `npm.cmd run smoke:pedidos`
- [x] `npm.cmd run smoke:notas`
- [x] `npm.cmd run smoke:contas-pagar`
- [x] `npm.cmd run smoke:acessos`
- [x] `npm.cmd run smoke:aprovacoes`
- [x] `npm.cmd run web:build`
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`
- [x] `git diff --check`
- [x] `git status --short`
