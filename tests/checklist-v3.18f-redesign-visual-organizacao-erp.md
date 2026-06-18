# Checklist V3.18F - Redesign Visual e Organizacao ERP

## Git e ambiente

- [ ] Branch inicial `main`.
- [ ] `main = origin/main` antes da branch.
- [ ] Working tree limpo antes da branch.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.

## Interface

- [ ] Logo ENAC aparece no menu.
- [ ] Menu lateral usa icones SVG internos.
- [ ] Menu lateral possui grupos: Operacao, Compras, Financeiro, Obras, Gestao, Administracao e Base ERP.
- [ ] Menu lateral pode alternar para modo compacto em desktop.
- [ ] Menu nao exibe texto visual `Abrir` ou `Recolher`.
- [ ] Menu nao exibe legado na navegacao operacional.
- [ ] Topbar nao exibe `Navegar para tela`.
- [ ] Usuario e perfil ativo continuam visiveis.
- [ ] Ambiente de homologacao local aparece no cabecalho.
- [ ] Administracao de Acessos esta facil de encontrar.

## Telas operacionais

- [ ] Pedidos de Compra separa Consulta, Novo registro e Detalhes.
- [ ] Notas Fiscais de Entrada separa Consulta, Novo registro e Detalhes.
- [ ] Contas a Pagar separa Consulta, Novo registro e Detalhes.
- [ ] Programacao de Pagamento separa Consulta, Novo registro e Detalhes.
- [ ] Medicoes e Faturamento separa Consulta, Novo registro e Detalhes.
- [ ] Formularios nao competem visualmente com tabelas.
- [ ] Tabelas estao compactas e legiveis.

## Riscos, relatorios e dashboard

- [ ] Riscos e Pendencias separa Consulta, Nova pendencia manual, Converter alerta e Detalhes.
- [ ] Nao ha dois formularios lado a lado em Riscos e Pendencias.
- [ ] Relatorios Financeiros usam abas por assunto.
- [ ] Dashboard Executivo usa abas por assunto.
- [ ] Planejamento Executivo aparece separado de Orcamentos no menu Obras.

## Browser

- [ ] Desktop 1440x900 sem erro de console.
- [ ] Desktop sem overlay de framework.
- [ ] Desktop sem overflow horizontal global.
- [ ] Mobile 390x844 sem erro de console.
- [ ] Mobile sem overlay de framework.
- [ ] Mobile sem overflow horizontal global.
- [ ] Sem botoes proibidos: Pagar, Baixar, CNAB, Banco, Boleto, Prefeitura, NFS-e real.

## Validacoes

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate` em `server`.
- [ ] Smokes principais executados.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Varredura de seguranca sem operacao proibida funcional.

## Restricoes

- [ ] Sem backend alterado.
- [ ] Sem migration criada.
- [ ] Sem endpoint novo.
- [ ] Sem pagamento funcional.
- [ ] Sem baixa nova.
- [ ] Sem CNAB.
- [ ] Sem integracao bancaria.
- [ ] Sem banco real.
- [ ] Sem boleto real.
- [ ] Sem NFS-e real.
- [ ] Sem prefeitura.
- [ ] Sem SharePoint/Graph/Entra/Power Automate reais.
- [ ] Sem upload externo.
- [ ] Sem `DELETE` fisico.
