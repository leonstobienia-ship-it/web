# Checklist V3.15 - Revisao UX, Responsividade e Polimento Operacional

## Ambiente

- [ ] Branch inicial `main`.
- [ ] `main = origin/main = a3da8ad`.
- [ ] Tag `v3.14-anexos-documentos-sharepoint-ready` existente.
- [ ] Sem tag V3.15 antes da etapa.
- [ ] Working tree limpo no inicio.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
- [ ] PostgreSQL local healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.

## UX

- [ ] Menu agrupado por Operacao, Compras, Financeiro, Obras, Gestao e Base ERP.
- [ ] Modulo ativo destacado visualmente.
- [ ] Barra superior mostra area e modulo atual.
- [ ] Seletor de modulo aparece e funciona em telas estreitas.
- [ ] Tela inicial exibe atalhos por perfil operacional.
- [ ] Desktop sem overflow horizontal no corpo da pagina.
- [ ] Mobile sem sobreposicao de menu, topbar, cards ou botoes.
- [ ] Tabelas largas preservam rolagem horizontal.
- [ ] Botoes desabilitados continuam legiveis.
- [ ] Estados de foco visiveis em teclado.

## Telas obrigatorias no Browser interno

- [ ] Dashboard Executivo.
- [ ] Central de Tarefas.
- [ ] Riscos e Pendencias.
- [ ] Auditoria e Logs.
- [ ] Documentos e Anexos.
- [ ] Solicitacoes de Compra.
- [ ] Cotacoes.
- [ ] Pedidos de Compra.
- [ ] Contas a Pagar.
- [ ] Programacoes de Pagamento.
- [ ] Contratos de Obra.
- [ ] Orcamentos e Planejamento.
- [ ] Previsto x Realizado.
- [ ] Medicoes e Faturamento.

## Restricoes

- [ ] Nao houve alteracao backend.
- [ ] Nao houve migration.
- [ ] Nao houve pagamento funcional.
- [ ] Nao houve baixa nova funcional.
- [ ] Nao houve integracao bancaria.
- [ ] Nao houve CNAB.
- [ ] Nao houve boleto real.
- [ ] Nao houve NFS-e real.
- [ ] Nao houve prefeitura.
- [ ] Nao houve SharePoint real.
- [ ] Nao houve Microsoft Graph real.
- [ ] Nao houve Entra real.
- [ ] Nao houve Power Automate real.
- [ ] Nao houve upload real externo.
- [ ] Nao houve `DELETE` fisico.

## Validacoes

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] Todos os smokes backend existentes passaram.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Browser interno desktop sem erro de console relevante.
- [ ] Browser interno mobile sem erro de console relevante.
- [ ] Varredura de seguranca sem implementacao proibida.

## Git

- [ ] Commit local criado.
- [ ] Revalidacao pos-commit passou.
- [ ] Merge fast-forward para `main`.
- [ ] Push de `main`.
- [ ] Tag `v3.15-revisao-ux-responsividade-polimento-operacional` criada e publicada.
- [ ] Estado final limpo.
