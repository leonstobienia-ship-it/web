# Checklist V3.5E - Liberacao da Programacao de Pagamento

## Escopo

- [ ] Migration `012_liberacao_programacao_pagamento_v35e.sql` criada e aplicada.
- [ ] Programacao aprovada pode ser liberada.
- [ ] Programacao em rascunho nao pode ser liberada.
- [ ] Programacao submetida nao pode ser liberada.
- [ ] Programacao cancelada nao pode ser liberada.
- [ ] Usuario sem alcada suficiente e bloqueado.
- [ ] Diretoria libera acima de R$ 20.000 quando aplicavel.
- [ ] Historico de liberacoes e consultavel.
- [ ] Auditoria registra liberacao e bloqueio.

## Restricoes

- [ ] Nao executa pagamento.
- [ ] Nao baixa Conta a Pagar.
- [ ] Nao marca Conta a Pagar como `PAGA`.
- [ ] Nao gera CNAB.
- [ ] Nao cria integracao bancaria.
- [ ] Nao conecta banco real.
- [ ] Nao usa SharePoint real.
- [ ] Nao usa Entra real.
- [ ] Nao cria Power Automate.
- [ ] Nao usa `DELETE` fisico.

## Validacoes obrigatorias

Backend:

```powershell
cd server
npm.cmd run build
npm.cmd run migrate
npm.cmd run smoke:cadastros
npm.cmd run smoke:solicitacoes
npm.cmd run smoke:cotacoes
npm.cmd run smoke:pedidos
npm.cmd run smoke:notas
npm.cmd run smoke:contas-pagar
npm.cmd run smoke:acessos
npm.cmd run smoke:aprovacoes
npm.cmd run smoke:programacoes-pagamento
npm.cmd run smoke:liberacoes-programacao
```

Frontend e TypeScript:

```powershell
npm.cmd run web:build
npx.cmd tsc -p web/tsconfig.json --noEmit
npx.cmd tsc -p tsconfig.json --noEmit
git diff --check
```

## Evidencias esperadas

- [ ] `/health` OK.
- [ ] `/health/db` conectado ao `enac_erp_dev`.
- [ ] `smoke:liberacoes-programacao` conclui com todas as etapas `ok = true`.
- [ ] Varredura nao encontra endpoint funcional de pagamento, baixa, CNAB ou integracao bancaria.
- [ ] Varredura nao encontra `router.delete`, `app.delete` ou `DELETE FROM`.
- [ ] `git status --short` limpo apos commit.
