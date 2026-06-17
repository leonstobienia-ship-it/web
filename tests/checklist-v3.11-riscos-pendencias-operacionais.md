# Checklist V3.11 - Riscos e Pendencias Operacionais

## Ambiente

- [ ] Branch base `main` com V3.10 consolidada.
- [ ] Branch de desenvolvimento `dev/v3.11-riscos-pendencias-operacionais`.
- [ ] `.git/index.lock` ausente.
- [ ] Docker Desktop ativo.
- [ ] PostgreSQL local healthy.
- [ ] API local em `http://127.0.0.1:3333`.
- [ ] `/health` OK.
- [ ] `/health/db` OK em `enac_erp_dev`.
- [ ] `b004592` nao e ancestral do HEAD final.

## Migration

- [ ] `database/migrations/021_riscos_pendencias_operacionais_v311.sql`.
- [ ] Tabela `riscos_pendencias`.
- [ ] Tabela `riscos_pendencias_comentarios`.
- [ ] Tabela `riscos_pendencias_historico`.
- [ ] Escopos locais de `riscos-pendencias`.
- [ ] Seed local `DEV_LOCAL_V3_11` em `auditoria_eventos`.

## Backend

- [ ] `GET /riscos-pendencias`.
- [ ] `GET /riscos-pendencias/:id`.
- [ ] `POST /riscos-pendencias`.
- [ ] `PATCH /riscos-pendencias/:id`.
- [ ] `PATCH /riscos-pendencias/:id/iniciar`.
- [ ] `PATCH /riscos-pendencias/:id/bloquear`.
- [ ] `PATCH /riscos-pendencias/:id/resolver`.
- [ ] `PATCH /riscos-pendencias/:id/cancelar`.
- [ ] `POST /riscos-pendencias/:id/comentarios`.
- [ ] `GET /riscos-pendencias/:id/historico`.
- [ ] `POST /riscos-pendencias/gerar-de-alerta`.
- [ ] Nenhum endpoint `DELETE`.

## Frontend

- [ ] Tela `Riscos e Pendencias`.
- [ ] Filtros por status, prioridade, tipo, responsavel, obra, cliente, vencida e texto.
- [ ] Cards de abertas, em andamento, criticas, vencidas, a vencer e resolvidas.
- [ ] Cadastro manual.
- [ ] Conversao sugerida a partir de alerta.
- [ ] Lista de pendencias.
- [ ] Detalhe com historico e comentarios.
- [ ] Acoes de iniciar, bloquear, resolver e cancelar.
- [ ] Responsivo desktop/mobile.
- [ ] Sem botoes financeiros proibidos.

## Smoke V3.11

- [ ] Criar pendencia.
- [ ] Listar pendencia.
- [ ] Atualizar pendencia.
- [ ] Iniciar pendencia.
- [ ] Bloquear pendencia.
- [ ] Resolver pendencia.
- [ ] Criar pendencia por alerta.
- [ ] Cancelar logicamente.
- [ ] Adicionar comentario.
- [ ] Consultar historico.
- [ ] Confirmar auditoria.
- [ ] Confirmar ausencia de `DELETE` fisico.
- [ ] Confirmar ausencia de pagamento, banco, CNAB, NFS-e e prefeitura.

## Travas

- [ ] Nao ha pagamento.
- [ ] Nao ha baixa nova.
- [ ] Nao ha programacao de pagamento nova criada pela V3.11.
- [ ] Nao ha conta a pagar nova criada pela V3.11.
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

## Comandos

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
npm.cmd run smoke:riscos-pendencias

cd ..
npm.cmd run web:build
npx.cmd tsc -p web/tsconfig.json --noEmit
npx.cmd tsc -p tsconfig.json --noEmit
git diff --check
```

## Browser interno

- [ ] Frontend abre em `http://127.0.0.1:5173`.
- [ ] Navegacao exibe `Riscos e Pendencias`.
- [ ] Filtros renderizam.
- [ ] Cards renderizam.
- [ ] Cadastro manual renderiza.
- [ ] Conversao de alerta renderiza.
- [ ] Lista renderiza.
- [ ] Detalhe, historico e comentarios renderizam.
- [ ] Console sem erro funcional.
- [ ] Mobile sem overflow horizontal incoerente.
- [ ] Ausencia de botoes: Pagar, Baixar, CNAB, Boleto, Banco, NFS-e real, Prefeitura, Integracao Bancaria.
