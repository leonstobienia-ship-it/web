# ERP - Relatorios Financeiros

## Objetivo

Relatorios Financeiros consolidam dados de Contas a Pagar, Programacoes de Pagamento, Liberacoes, Conferencias e Baixas Manuais em consultas somente leitura.

A V3.5H nao cria operacao financeira nova. Nao paga, nao baixa, nao gera CNAB, nao integra banco, nao conecta banco real e nao usa `DELETE` fisico.

## Endpoints

```text
GET /relatorios-financeiros/contas-pagar/resumo
GET /relatorios-financeiros/contas-pagar/aging
GET /relatorios-financeiros/contas-pagar/por-fornecedor
GET /relatorios-financeiros/contas-pagar/por-obra
GET /relatorios-financeiros/contas-pagar/por-centro-custo
GET /relatorios-financeiros/programacoes/resumo
GET /relatorios-financeiros/fluxo-previsto
```

## Filtros

Os endpoints aceitam filtros por query string:

- `periodo_de`
- `periodo_ate`
- `fornecedor_id`
- `obra_id`
- `centro_custo_id`
- `status`
- `vencimento_de`
- `vencimento_ate`
- `valor_min`
- `valor_max`

Datas usam formato `YYYY-MM-DD`. Identificadores usam UUID. Valores usam decimal.

## Relatorios

### Contas a pagar por status

Retorna quantidade, total original, saldo aberto e total baixado manualmente por status.

### Contas por vencimento

Lista contas ordenadas por vencimento com documento, fornecedor, obra, centro de custo, valor aberto e sinalizador de vencida.

### Aging financeiro

Agrupa saldo aberto nas faixas:

- `VENCIDO_90_MAIS`
- `VENCIDO_61_90`
- `VENCIDO_31_60`
- `VENCIDO_16_30`
- `VENCIDO_1_15`
- `VENCE_HOJE`
- `A_VENCER_1_7`
- `A_VENCER_8_15`
- `A_VENCER_16_30`
- `A_VENCER_31_MAIS`

### Agrupamentos

Agrupa contas por:

- fornecedor;
- obra;
- centro de custo.

### Programacoes

Consolida programacoes por status, liberacao e conferencia. Inclui totais programado, liberado e conferido.

### Fluxo previsto de saida

Agrupa saldo aberto por data de vencimento, separando valor programado, liberado e conferido quando houver programacao ativa.

### Baixas manuais por periodo

O resumo de Contas a Pagar inclui a serie de baixas manuais permitidas, agrupadas por data de baixa.

## Segurança

- Somente `GET`.
- `PATCH`, `POST` e `DELETE` retornam metodo nao permitido ou rota inexistente.
- Sem endpoint `/pagar`.
- Sem endpoint `/baixar`.
- Sem endpoint `/executar-pagamento`.
- Sem endpoint `/gerar-cnab`.
- Sem endpoint de integracao bancaria.
- Sem `DELETE FROM` no modulo.

## Smoke

```powershell
cd server
npm.cmd run smoke:relatorios-financeiros
```

O smoke valida contrato dos endpoints, filtros, ausencia de mutacao nas tabelas financeiras, rotas proibidas e ausencia de `DELETE` fisico.
