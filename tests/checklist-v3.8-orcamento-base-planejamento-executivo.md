# Checklist V3.8 - Orcamento Base da Obra e Planejamento Executivo

## Travas

- [x] Branch base `main`.
- [x] V3.7 publicada.
- [x] Tag `v3.7-contratos-obra-escopo-aditivos` presente.
- [x] Sem `.git/index.lock`.
- [x] PostgreSQL local healthy.
- [x] `/health` OK.
- [x] `/health/db` OK.
- [x] `b004592` nao usado.

## Escopo

- [x] Criar modulo de Orcamento Base da Obra.
- [x] Criar pacotes orcamentarios.
- [x] Criar itens orcamentarios.
- [x] Registrar insumos, mao de obra e equipamentos previstos.
- [x] Criar cronograma fisico-financeiro.
- [x] Criar planejamento executivo.
- [x] Criar resumo previsto x realizado local.
- [x] Vincular obra, contrato, centro de custo, medicoes e faturamento por consulta.
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

- [x] Migration `018_orcamento_base_planejamento_executivo_v38.sql`.
- [x] `GET /orcamentos-obra`.
- [x] `GET /orcamentos-obra/:id`.
- [x] `POST /orcamentos-obra`.
- [x] `PATCH /orcamentos-obra/:id`.
- [x] `PATCH /orcamentos-obra/:id/enviar-revisao`.
- [x] `PATCH /orcamentos-obra/:id/aprovar`.
- [x] `PATCH /orcamentos-obra/:id/bloquear`.
- [x] `PATCH /orcamentos-obra/:id/cancelar`.
- [x] Rotas de pacotes.
- [x] Rotas de itens.
- [x] Rotas de cronograma.
- [x] `GET /orcamentos-obra/:id/resumo`.
- [x] `GET /obras/:id/orcamento-vigente`.
- [x] Rotas de planejamento executivo.
- [x] Sem rota de NFS-e real.
- [x] Sem rota de prefeitura.
- [x] Sem rota de boleto.
- [x] Sem rota bancaria.
- [x] Sem rota de pagamento.
- [x] Sem rota de CNAB.

## Frontend

- [x] Tela `Orçamentos e Planejamento`.
- [x] Criacao de orcamento.
- [x] Lista de orcamentos por status/obra.
- [x] Detalhe do orcamento.
- [x] Cadastro de pacotes.
- [x] Cadastro de itens.
- [x] Cadastro de cronograma.
- [x] Exibicao de total previsto.
- [x] Exibicao de total por contrato e diferenca.
- [x] Exibicao de resumo previsto x realizado.
- [x] Criacao de planejamento executivo.
- [x] Acoes de ativar, revisar, encerrar e cancelar planejamento.
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
- [x] `npm.cmd run smoke:orcamento-planejamento`.
- [x] `npm.cmd run web:build`.
- [x] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [x] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [x] `git diff --check`.
- [x] Browser interno sem erro visual bloqueante.
