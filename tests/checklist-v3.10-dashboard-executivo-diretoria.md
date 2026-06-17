# Checklist V3.10 - Dashboard Executivo da Diretoria

## Ambiente

- [ ] Branch base `main` em `86b1f84` antes da criação da branch da versão.
- [ ] Branch de desenvolvimento `dev/v3.10-dashboard-executivo-diretoria`.
- [ ] `.git/index.lock` ausente.
- [ ] Docker Desktop ativo.
- [ ] PostgreSQL local healthy.
- [ ] API local em `http://127.0.0.1:3333`.
- [ ] `/health` OK.
- [ ] `/health/db` OK.
- [ ] `b004592` não é ancestral do HEAD final.

## Escopo funcional

- [ ] `GET /dashboard-executivo/resumo`.
- [ ] `GET /dashboard-executivo/obras`.
- [ ] `GET /dashboard-executivo/alertas`.
- [ ] `GET /dashboard-executivo/tendencia-mensal`.
- [ ] `GET /dashboard-executivo/ranking-obras`.
- [ ] `GET /dashboard-executivo/financeiro`.
- [ ] `GET /dashboard-executivo/faturamento`.
- [ ] `GET /dashboard-executivo/operacional`.
- [ ] Tela `Dashboard Executivo` com filtros, cards, alertas, rankings, curva mensal e tabelas.

## Indicadores

- [ ] Obras totais e ativas.
- [ ] Valor contratado, aditivos e contratado total.
- [ ] Orçamento previsto aprovado.
- [ ] Custo comprometido e custo realizado.
- [ ] Receita medida e receita faturada manualmente.
- [ ] Margem prevista e margem realizada.
- [ ] Contas abertas, vencidas e a vencer.
- [ ] Programações liberadas, conferidas e pendentes.
- [ ] Medições pendentes e pedidos de faturamento pendentes.
- [ ] Ranking de obras por faturamento, custo, desvio, margem e saldo.

## Alertas

- [ ] Obra sem orçamento aprovado.
- [ ] Obra sem contrato ativo.
- [ ] Custo acima do previsto.
- [ ] Margem negativa.
- [ ] Contas vencidas.
- [ ] Programação liberada não conferida.
- [ ] Medição aprovada sem pedido de faturamento.
- [ ] Pedido de faturamento aprovado não faturado manualmente.
- [ ] Saldo contratual baixo.
- [ ] Orçamento sem cronograma.
- [ ] Planejamento atrasado.

## Travas

- [ ] Não há pagamento.
- [ ] Não há baixa nova.
- [ ] Não há CNAB.
- [ ] Não há integração bancária.
- [ ] Não há NFS-e real.
- [ ] Não há prefeitura.
- [ ] Não há boleto.
- [ ] Não há cobrança real.
- [ ] Não há SharePoint real.
- [ ] Não há Entra real.
- [ ] Não há Power Automate.
- [ ] Não há `DELETE` físico.

## Smokes e builds

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
npm.cmd run smoke:conferencia-financeira
npm.cmd run smoke:baixa-manual
npm.cmd run smoke:relatorios-financeiros
npm.cmd run smoke:medicoes-faturamento
npm.cmd run smoke:contratos-obra
npm.cmd run smoke:orcamento-planejamento
npm.cmd run smoke:previsto-realizado
npm.cmd run smoke:dashboard-executivo

cd ..
npm.cmd run web:build
npx.cmd tsc -p web/tsconfig.json --noEmit
npx.cmd tsc -p tsconfig.json --noEmit
git diff --check
```

## Browser interno

- [ ] Frontend abre em `http://127.0.0.1:5173`.
- [ ] Navegação exibe `Dashboard Executivo`.
- [ ] Filtros carregam dados locais.
- [ ] Cards carregam indicadores.
- [ ] Alertas renderizam.
- [ ] Rankings renderizam.
- [ ] Curva mensal renderiza.
- [ ] Tabelas financeiro/faturamento/operacional renderizam.
- [ ] Console sem erro funcional.
- [ ] Não existem botões operacionais para pagamento, baixa, CNAB, banco, boleto, prefeitura ou NFS-e real.
