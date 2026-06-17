# Checklist V3.5F - Conferencia Financeira Final Pre-Baixa

## Git e ambiente

- [ ] Branch `dev/v3.5f-conferencia-financeira-pre-baixa`.
- [ ] Base `main = origin/main = 2b1e919` antes da implementacao.
- [ ] `.git/index.lock` ausente.
- [ ] PostgreSQL local via Docker healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK em `enac_erp_dev`.

## Backend

- [ ] Migration `013_conferencia_financeira_pre_baixa_v35f.sql` aplicada.
- [ ] `PATCH /programacoes-pagamento/:id/conferir-financeiro` criado.
- [ ] `PATCH /programacoes-pagamento/:id/devolver-conferencia` criado.
- [ ] `GET /programacoes-pagamento/:id/conferencias` criado.
- [ ] Conferencia aceita somente programacao `LIBERADA`.
- [ ] Checklist financeiro validado.
- [ ] Ressalva exige observacao.
- [ ] Usuario sem escopo ativo e bloqueado.
- [ ] Historico de conferencia registrado.
- [ ] Auditoria registrada.

## Frontend

- [ ] Tela de Programacao de Pagamento exibe status de conferencia.
- [ ] Tela exibe conferente, data/hora e valor conferido.
- [ ] Tela exibe checklist financeiro para programacao `LIBERADA`.
- [ ] Tela permite devolver conferencia com observacao.
- [ ] Tela nao exibe acao de pagamento.
- [ ] Tela nao exibe acao de baixa.
- [ ] Tela nao exibe CNAB ou integracao bancaria.

## Smokes e builds

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:solicitacoes`.
- [ ] `npm.cmd run smoke:cotacoes`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:liberacoes-programacao`.
- [ ] `npm.cmd run smoke:conferencia-financeira`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Garantias negativas

- [ ] Nao houve pagamento.
- [ ] Nao houve baixa.
- [ ] Nenhuma Conta a Pagar foi marcada como `PAGA`.
- [ ] Nao houve CNAB.
- [ ] Nao houve integracao bancaria.
- [ ] Nao houve SharePoint real.
- [ ] Nao houve Entra real.
- [ ] Nao houve Power Automate.
- [ ] Nao houve `DELETE` fisico.
- [ ] Nao houve uso/cherry-pick de `b004592`.
