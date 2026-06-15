# Contas a Pagar ERP ENAC

## Papel no ERP

Contas a Pagar representa a obrigacao financeira gerada a partir de Nota de Entrada aprovada para financeiro. Na V3.5A, a conta nasce em parcela unica e pode ser enviada para uma fila logica de programacao, sem executar programacao bancaria real, pagamento, baixa ou conciliacao.

## Fonte de dados

Fonte operacional local:

```text
PostgreSQL local: enac_erp_dev
```

Nenhum banco, gateway, CNAB, API bancaria, SharePoint, Entra ou automacao e acionado nesta etapa.

## Entidade `contas_pagar`

A tabela ja existia na fundacao V3.2 e foi ajustada incrementalmente para o fluxo V3.5A.

Campos principais do fluxo:

- `company_id`
- `nota_entrada_id`
- `pedido_id`
- `fornecedor_id`
- `obra_id`
- `centro_custo_id`
- `numero_documento`
- `parcela`
- `total_parcelas`
- `data_emissao`
- `data_vencimento`
- `valor_original`
- `valor_aberto`
- `status`
- `forma_pagamento_prevista`
- `observacoes`

Colunas legadas preservadas:

- `nota_fiscal_id`
- `contrato_fornecedor_id`
- `vencimento`
- `saldo`
- `forma_pagamento`

Elas nao foram removidas para preservar compatibilidade da fundacao.

## Fluxo V3.5A

```text
Nota APROVADA_FINANCEIRO
  -> Conta ABERTA
  -> AGUARDANDO_PROGRAMACAO
```

Cancelamento permitido:

- `ABERTA`
- `AGUARDANDO_PROGRAMACAO`

Status existentes:

```text
ABERTA
AGUARDANDO_PROGRAMACAO
PROGRAMADA
CANCELADA
BAIXADA
```

`PROGRAMADA` e `BAIXADA` ficam reservados para etapas futuras e nao sao usados operacionalmente na V3.5A.

## Regras

- Conta nasce somente de nota `APROVADA_FINANCEIRO`.
- Conta herda empresa, fornecedor, pedido, obra e centro de custo da nota.
- Conta herda numero do documento, data de emissao e valor total da nota.
- V3.5A permite apenas parcela unica.
- `data_vencimento` e obrigatoria.
- `valor_aberto` inicia igual a `valor_original`.
- Duplicidade ativa por nota e parcela retorna `409`.
- Conta `CANCELADA` nao permite edicao.
- Conta `AGUARDANDO_PROGRAMACAO` nao representa programacao bancaria real.
- Nao ha pagamento.
- Nao ha baixa.
- Nao ha conciliacao.
- Nao ha `DELETE` fisico.

## Endpoints

```text
GET    /contas-pagar
GET    /contas-pagar/:id
POST   /contas-pagar/gerar-da-nota
PATCH  /contas-pagar/:id
PATCH  /contas-pagar/:id/enviar-programacao
PATCH  /contas-pagar/:id/cancelar
```

Filtros de lista:

- `status`
- `fornecedor_id`
- `obra_id`
- `vencimento_de`
- `vencimento_ate`

## Smoke

```powershell
cd server
npm.cmd run smoke:notas
npm.cmd run smoke:contas-pagar
```

O smoke de contas localiza nota `APROVADA_FINANCEIRO` com marcador `DEV_LOCAL_V3_5A`, gera conta, valida `GET`, envia para programacao logica, valida duplicidade com `409` e cancela em status permitido. Nao executa pagamento, baixa, conciliacao, banco, SharePoint, Entra, automacao ou `DELETE`.
