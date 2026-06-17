# Checklist V3.6 - Medicoes e Faturamento

## Travas

- [x] Branch base `main`.
- [x] V3.5H publicada.
- [x] Tag `v3.5h-relatorios-financeiros-contas-pagar` presente.
- [x] Sem `.git/index.lock`.
- [x] PostgreSQL local healthy.
- [x] `/health` OK.
- [x] `/health/db` OK.
- [x] `b004592` nao usado.

## Escopo

- [x] Criar modulo de Medicoes.
- [x] Criar itens de medicao.
- [x] Criar aprovacao interna da medicao.
- [x] Criar pedido de faturamento.
- [x] Criar registro de faturamento manual informado.
- [x] Registrar auditoria.
- [x] Nao emitir NFS-e real.
- [x] Nao integrar prefeitura.
- [x] Nao gerar boleto.
- [x] Nao criar cobranca bancaria.
- [x] Nao baixar recebivel automaticamente.
- [x] Nao usar `DELETE` fisico.

## Backend

- [x] Migration `016_medicoes_faturamento_v36.sql`.
- [x] `GET /medicoes`.
- [x] `GET /medicoes/:id`.
- [x] `POST /medicoes`.
- [x] `PATCH /medicoes/:id`.
- [x] `PATCH /medicoes/:id/enviar`.
- [x] `PATCH /medicoes/:id/aprovar`.
- [x] `PATCH /medicoes/:id/devolver`.
- [x] `PATCH /medicoes/:id/cancelar`.
- [x] `POST /medicoes/:id/itens`.
- [x] `PATCH /medicoes/:id/itens/:itemId`.
- [x] `PATCH /medicoes/:id/itens/:itemId/inativar`.
- [x] `POST /pedidos-faturamento`.
- [x] `GET /pedidos-faturamento`.
- [x] `GET /pedidos-faturamento/:id`.
- [x] `PATCH /pedidos-faturamento/:id/aprovar`.
- [x] `PATCH /pedidos-faturamento/:id/marcar-faturado-manualmente`.
- [x] Sem rota de NFS-e real.
- [x] Sem rota de prefeitura.
- [x] Sem rota de boleto.
- [x] Sem rota bancaria.
- [x] Sem rota de baixa automatica de recebivel.

## Frontend

- [x] Tela `Medições e Faturamento`.
- [x] Lista de medições.
- [x] Criação de medição.
- [x] Detalhe de medição.
- [x] Inclusão de itens.
- [x] Cálculo de totais.
- [x] Envio para aprovação.
- [x] Aprovação.
- [x] Devolução.
- [x] Cancelamento lógico.
- [x] Criação de pedido de faturamento.
- [x] Aprovação de pedido.
- [x] Registro de faturamento manual informado.
- [x] Aviso de que não emite nota fiscal real.
- [x] Sem botão de NFS-e real.
- [x] Sem integração fiscal real.

## Validações

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
- [x] `npm.cmd run smoke:relatorios-financeiros`.
- [x] `npm.cmd run smoke:medicoes-faturamento`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.
- [x] Browser desktop/mobile sem erro visual bloqueante.
