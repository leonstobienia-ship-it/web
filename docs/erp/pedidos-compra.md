# Pedidos de Compra ERP ENAC

## Papel no ERP

Pedido de Compra e a etapa posterior a Cotacao e Mapa Comparativo. Na V3.4C, ele formaliza a escolha do fornecedor vencedor e consolida itens, valores, obra, centro de custo e condicao de pagamento.

## Fonte de dados

A fonte operacional da V3.4C e o PostgreSQL local:

```text
enac_erp_dev
```

SharePoint permanece fora da operacao. Documentos de proposta ou pedido poderao ser integrados futuramente como anexos documentais, sem usar SharePoint como banco principal.

## Entidades

### `pedidos_compra`

Cabecalho do pedido.

Campos de negocio:

- `company_id`
- `solicitacao_id`
- `cotacao_id`
- `fornecedor_id`
- `obra_id`
- `centro_custo_id`
- `codigo`
- `titulo`
- `status`
- `data_emissao`
- `data_entrega_prevista`
- `condicao_pagamento`
- `valor_total`
- `observacoes`

### `pedidos_compra_itens`

Itens herdados da resposta do fornecedor vencedor.

Campos de negocio:

- `pedido_id`
- `solicitacao_item_id`
- `cotacao_item_id`
- `descricao`
- `unidade`
- `quantidade`
- `valor_unitario`
- `valor_total`
- `observacoes`
- `ordem`

## Fluxo V3.4C

```text
Cotacao FORNECEDOR_ESCOLHIDO
  -> Pedido RASCUNHO
  -> EMITIDO
  -> ENVIADO_FORNECEDOR
  -> CONFIRMADO
```

Cancelamento permitido:

- `RASCUNHO`
- `EMITIDO`
- `ENVIADO_FORNECEDOR`

## Regras

- Pedido nasce somente de cotacao com fornecedor vencedor escolhido.
- Cotacao cancelada nao gera pedido.
- Nao e permitido pedido ativo duplicado para a mesma cotacao.
- Itens e valores vem da resposta do fornecedor vencedor.
- Valor total e calculado pela API.
- Pedido `CANCELADO` nao permite edicao.
- Pedido `CONFIRMADO` nao permite edicao na V3.4C.
- Nao ha recebimento fisico/estoque.
- Nao ha nota fiscal.
- Nao ha contas a pagar.
- Nao ha pagamento.
- Nao ha exclusao fisica.

## Endpoints

```text
GET    /pedidos-compra
GET    /pedidos-compra/:id
POST   /pedidos-compra/gerar-da-cotacao
PATCH  /pedidos-compra/:id
PATCH  /pedidos-compra/:id/emitir
PATCH  /pedidos-compra/:id/enviar-fornecedor
PATCH  /pedidos-compra/:id/confirmar
PATCH  /pedidos-compra/:id/cancelar
```

## Fora do escopo V3.4C

- Recebimento parcial ou total.
- Estoque.
- Nota fiscal de entrada.
- Contas a pagar.
- Programacao bancaria.
- Liberacao de pagamento.
- Baixa financeira.
- SharePoint documental.
- Entra/perfis/alcadas.
