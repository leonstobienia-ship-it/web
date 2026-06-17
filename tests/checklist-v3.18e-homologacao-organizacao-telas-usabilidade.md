# Checklist V3.18E - Homologacao, Organizacao de Telas e Usabilidade

## Git e ambiente

- [ ] Branch criada a partir de `main`.
- [ ] Working tree limpo antes da implementacao.
- [ ] `.git/index.lock` ausente.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.
- [ ] `b004592` nao e ancestral do HEAD.

## Navegacao

- [ ] Menu lateral exibe logo ENAC.
- [ ] Menu lateral exibe icones em grupos e itens.
- [ ] Grupos do menu nao exibem texto auxiliar de abrir/recolher.
- [ ] Topbar exibe usuario e perfil ativo.
- [ ] Topbar nao exibe seletor redundante de troca de tela.
- [ ] Legado nao aparece no menu principal.
- [ ] Tela inicial nao possui botao para abrir legado.
- [ ] `Orcamentos` e `Planejamento Executivo` aparecem separados em Obras.
- [ ] Administracao de Acessos permanece acessivel.

## Telas operacionais

- [ ] Pedidos de Compra tem abas Consulta, Novo registro e Detalhes.
- [ ] Notas Fiscais de Entrada tem abas Consulta, Novo registro e Detalhes.
- [ ] Contas a Pagar tem abas Consulta, Novo registro e Detalhes.
- [ ] Programacao de Pagamento tem abas Consulta, Novo registro e Detalhes.
- [ ] Medicoes e Faturamento tem abas Consulta, Novo registro e Detalhes.
- [ ] Selecionar item na consulta abre a aba de detalhes.
- [ ] Formulario de novo registro nao fica lado a lado com a lista.
- [ ] Detalhe e lista nao aparecem misturados na visualizacao inicial.

## Telas gerenciais

- [ ] Riscos e Pendencias separa consulta, cadastro manual, conversao de alerta e detalhe.
- [ ] Relatorios Financeiros usa abas por assunto.
- [ ] Dashboard Executivo usa abas por assunto.
- [ ] Cards, tabelas e filtros continuam acessiveis.
- [ ] Nao ha botoes de pagar, CNAB, boleto, NFS-e real, prefeitura ou integracao bancaria.

## Validacoes automatizadas

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] `npm.cmd run smoke:cadastros`.
- [ ] `npm.cmd run smoke:acessos`.
- [ ] `npm.cmd run smoke:aprovacoes`.
- [ ] `npm.cmd run smoke:central-tarefas`.
- [ ] `npm.cmd run smoke:auditoria`.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run smoke:homologacao`.
- [ ] `npm.cmd run smoke:riscos-pendencias`.
- [ ] `npm.cmd run smoke:dashboard-executivo`.
- [ ] `npm.cmd run smoke:relatorios-financeiros`.
- [ ] `npm.cmd run smoke:pedidos`.
- [ ] `npm.cmd run smoke:notas`.
- [ ] `npm.cmd run smoke:contas-pagar`.
- [ ] `npm.cmd run smoke:programacoes-pagamento`.
- [ ] `npm.cmd run smoke:medicoes-faturamento`.
- [ ] `npm.cmd run smoke:orcamento-planejamento`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.

## Travas

- [ ] Sem backend novo.
- [ ] Sem migration nova.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento funcional.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem integracao bancaria.
- [ ] Sem banco de producao.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem boleto.
- [ ] Sem SharePoint/Graph/Entra/Power Automate real.
- [ ] Sem upload externo.
- [ ] Sem `DELETE` fisico.
