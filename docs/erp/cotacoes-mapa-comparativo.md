# Cotacoes e Mapa Comparativo ERP ENAC

## Papel no ERP

Cotacao e Mapa Comparativo compoem a etapa entre Solicitacao de Compra e Pedido de Compra. A V3.4B registra o processo de cotacao e apoia a decisao de fornecedor, mas nao gera pedido de compra.

## Fonte de dados

A fonte da V3.4B e exclusivamente o PostgreSQL local:

```text
enac_erp_dev
```

SharePoint permanece fora desta etapa. Documentos de proposta poderao ser vinculados em etapa futura, sem usar SharePoint como banco principal.

## Modelo operacional

### `cotacoes`

Representa o processo de cotacao criado a partir de uma solicitacao.

Campos de negocio:

- `company_id`
- `solicitacao_compra_id`
- `codigo`
- `titulo`
- `prazo_resposta`
- `status`
- `observacoes`
- `fornecedor_id`, preenchido somente quando houver vencedor escolhido
- `justificativa`, preenchida na escolha do fornecedor

### `cotacoes_fornecedores`

Representa fornecedores participantes e resposta consolidada.

Campos de negocio:

- `cotacao_id`
- `fornecedor_id`
- `status`
- `valor_total`
- `prazo_entrega_dias`
- `condicao_pagamento`
- `observacoes`

### `cotacoes_itens`

Representa valores por item e fornecedor.

Campos de negocio:

- `cotacao_id`
- `cotacao_fornecedor_id`
- `solicitacao_item_id`
- `descricao`
- `unidade`
- `quantidade`
- `valor_unitario`
- `valor_total`
- `marca_modelo`
- `prazo_entrega_dias`
- `observacoes`

### `mapa_comparativo_cotacao`

Representa a consolidacao do mapa e a decisao.

Campos de negocio:

- `cotacao_id`
- `fornecedor_vencedor_id`
- `criterio_decisao`
- `justificativa`
- `valor_vencedor`
- `status`

## Fluxo

```text
Solicitacao de Compra
  -> Cotacao RASCUNHO
  -> ENVIADA_FORNECEDORES
  -> RESPOSTAS_RECEBIDAS
  -> MAPA_GERADO
  -> FORNECEDOR_ESCOLHIDO
```

Cancelamento e permitido em:

- `RASCUNHO`
- `ENVIADA_FORNECEDORES`
- `RESPOSTAS_RECEBIDAS`
- `MAPA_GERADO`

## Mapa comparativo

O mapa retorna:

- fornecedores participantes;
- total por fornecedor;
- prazo de entrega;
- condicao de pagamento;
- menor total;
- menor valor por item;
- fornecedor vencedor, quando escolhido;
- justificativa da escolha.

Endpoint principal:

```text
GET /cotacoes/mapa-comparativo?cotacao_id=<uuid>
```

Tambem existe consulta por solicitacao:

```text
GET /cotacoes/mapa-comparativo?solicitacao_id=<uuid>
```

## Regras

- A cotacao nasce de uma solicitacao de compra.
- Solicitacao cancelada nao pode gerar cotacao.
- Cotacao deve ter pelo menos 1 fornecedor.
- Fornecedor deve estar ativo e pertencer a empresa.
- Respostas devem preservar todos os itens ativos da solicitacao.
- Quantidade vem da solicitacao.
- Usuario informa valores unitarios; API calcula totais.
- Escolher fornecedor exige justificativa.
- Nenhum pedido de compra e criado na V3.4B.
- Nao ha exclusao fisica.

## Fora do escopo V3.4B

- Pedido de compra.
- Nota fiscal.
- Contas a pagar.
- Programacao de pagamento.
- Aprovacao por alcada.
- Power Automate.
- Escrita SharePoint.
- Alteracao de permissoes Entra.
- Banco de producao.
