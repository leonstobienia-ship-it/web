# Checklist V3.7 - Contratos de Obra, Escopo Comercial e Aditivos

## Travas

- [x] Branch base `main`.
- [x] V3.6 publicada.
- [x] Tag `v3.6-medicoes-faturamento` presente.
- [x] Sem `.git/index.lock`.
- [x] PostgreSQL local healthy.
- [x] `/health` OK.
- [x] `/health/db` OK.
- [x] `b004592` nao usado.

## Escopo

- [x] Criar modulo de Contratos de Obra.
- [x] Criar itens de escopo comercial contratado.
- [x] Criar aditivos contratuais.
- [x] Criar aprovacao de aditivos por alcada.
- [x] Vincular contrato a cliente, obra e centro de custo.
- [x] Vincular contrato/aditivo a medicoes.
- [x] Vincular contrato/aditivo a pedidos de faturamento.
- [x] Registrar auditoria.
- [x] Nao emitir NFS-e real.
- [x] Nao integrar prefeitura.
- [x] Nao gerar boleto.
- [x] Nao integrar banco.
- [x] Nao executar pagamento.
- [x] Nao criar CNAB.
- [x] Nao usar SharePoint real.
- [x] Nao usar Entra real.
- [x] Nao usar Power Automate.
- [x] Nao usar `DELETE` fisico.

## Backend

- [x] Migration `017_contratos_obra_escopo_aditivos_v37.sql`.
- [x] `GET /contratos-obra`.
- [x] `GET /contratos-obra/:id`.
- [x] `POST /contratos-obra`.
- [x] `PATCH /contratos-obra/:id`.
- [x] `PATCH /contratos-obra/:id/ativar`.
- [x] `PATCH /contratos-obra/:id/suspender`.
- [x] `PATCH /contratos-obra/:id/encerrar`.
- [x] `PATCH /contratos-obra/:id/cancelar`.
- [x] `POST /contratos-obra/:id/itens`.
- [x] `PATCH /contratos-obra/:id/itens/:itemId`.
- [x] `PATCH /contratos-obra/:id/itens/:itemId/inativar`.
- [x] `GET /contratos-obra/:id/aditivos`.
- [x] `POST /contratos-obra/:id/aditivos`.
- [x] `PATCH /contratos-obra/:id/aditivos/:aditivoId`.
- [x] `PATCH /contratos-obra/:id/aditivos/:aditivoId/submeter`.
- [x] `PATCH /contratos-obra/:id/aditivos/:aditivoId/aprovar`.
- [x] `PATCH /contratos-obra/:id/aditivos/:aditivoId/reprovar`.
- [x] `PATCH /contratos-obra/:id/aditivos/:aditivoId/cancelar`.
- [x] `/medicoes` aceita contrato/aditivo e valida saldo contratual.
- [x] `/pedidos-faturamento` aceita contrato/aditivo compativel com a medicao.
- [x] Sem rota de NFS-e real.
- [x] Sem rota de prefeitura.
- [x] Sem rota de boleto.
- [x] Sem rota bancaria.
- [x] Sem rota de pagamento.
- [x] Sem rota de CNAB.

## Frontend

- [x] Tela `Contratos de Obra`.
- [x] Lista por status, cliente e obra.
- [x] Criacao de contrato.
- [x] Detalhe de contrato.
- [x] Ativacao, suspensao, encerramento e cancelamento logico.
- [x] Cadastro de itens de escopo.
- [x] Inativacao de item sem `DELETE` fisico.
- [x] Criacao de aditivo.
- [x] Submissao, aprovacao, reprovacao e cancelamento de aditivo.
- [x] Exibicao de valor original, aditivos, total e saldo.
- [x] Tela `Medições e Faturamento` com selecao de contrato/aditivo.
- [x] Aviso de que nao ha emissao fiscal real.
- [x] Sem botao de NFS-e real.
- [x] Sem botao de prefeitura.
- [x] Sem botao de boleto.
- [x] Sem botao bancario.
- [x] Sem botao de CNAB.
- [x] Sem botao de pagar.

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
- [x] `npm.cmd run smoke:relatorios-financeiros`.
- [x] `npm.cmd run smoke:medicoes-faturamento`.
- [x] `npm.cmd run smoke:contratos-obra`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.
- [x] Browser interno sem erro visual bloqueante.
