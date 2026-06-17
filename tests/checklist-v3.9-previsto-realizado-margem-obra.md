# Checklist V3.9 - Previsto x Realizado e Margem por Obra

## Ambiente

- [ ] Branch base `main` em `8dce3e9` antes da criacao da branch da versao.
- [ ] Branch de desenvolvimento `dev/v3.9-previsto-realizado-margem-obra`.
- [ ] `.git/index.lock` ausente.
- [ ] Docker Desktop ativo.
- [ ] PostgreSQL local healthy.
- [ ] API local em `http://127.0.0.1:3333`.
- [ ] `/health` OK.
- [ ] `/health/db` OK.

## Escopo funcional

- [ ] `GET /previsto-realizado/obras`.
- [ ] `GET /previsto-realizado/obras/:obraId/resumo`.
- [ ] `GET /previsto-realizado/obras/:obraId/curva`.
- [ ] `GET /previsto-realizado/obras/:obraId/pacotes`.
- [ ] `GET /previsto-realizado/obras/:obraId/centros-custo`.
- [ ] `GET /previsto-realizado/obras/:obraId/contratos`.
- [ ] `GET /previsto-realizado/obras/:obraId/faturamento`.
- [ ] `GET /previsto-realizado/obras/:obraId/custos`.
- [ ] `GET /previsto-realizado/portfolio/resumo`.
- [ ] Tela `Previsto x Realizado` com filtros, cards, alertas, tabelas e curva mensal.

## Calculos

- [ ] Valor contratado considera contratos de obra ativos/encerrados.
- [ ] Valor aditado considera apenas aditivos aprovados.
- [ ] Orcamento previsto usa orcamento aprovado vigente.
- [ ] Custo comprometido usa pedidos confirmados e/ou contas nao canceladas sem dupla contagem.
- [ ] Custo realizado usa contas realizadas e/ou notas aprovadas/provisionadas sem dupla contagem.
- [ ] Receita medida usa medicoes aprovadas ou em faturamento.
- [ ] Receita faturada usa pedidos faturados manualmente.
- [ ] Margem prevista e margem realizada retornam valores numericos coerentes.
- [ ] Curva mensal retorna previsto, realizado, faturado e acumulados.

## Travas

- [ ] Nao ha pagamento.
- [ ] Nao ha baixa nova.
- [ ] Nao ha CNAB.
- [ ] Nao ha integracao bancaria.
- [ ] Nao ha NFS-e real.
- [ ] Nao ha prefeitura.
- [ ] Nao ha boleto.
- [ ] Nao ha cobranca real.
- [ ] Nao ha SharePoint real.
- [ ] Nao ha Entra real.
- [ ] Nao ha Power Automate.
- [ ] Nao ha `DELETE` fisico.
- [ ] `b004592` nao e ancestral do HEAD final.

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

cd ..
npm.cmd run web:build
npx.cmd tsc -p web/tsconfig.json --noEmit
npx.cmd tsc -p tsconfig.json --noEmit
git diff --check
```

## Browser interno

- [ ] Frontend abre em `http://127.0.0.1:5173`.
- [ ] Navegacao exibe `Previsto x Realizado`.
- [ ] Filtros carregam dados locais.
- [ ] Cards carregam indicadores.
- [ ] Curva mensal renderiza.
- [ ] Tabelas por pacote e centro de custo renderizam.
- [ ] Console sem erro funcional.
- [ ] Nao existem botoes operacionais para pagamento, baixa, CNAB, banco, boleto, prefeitura ou NFS-e real.
