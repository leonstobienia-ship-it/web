# Cotacoes e Mapa Comparativo ERP ENAC

## Papel no ERP

Cotacao e Mapa Comparativo compoem a segunda etapa do fluxo local de compras. Depois que uma Solicitacao de Compra entra em analise, fornecedores podem enviar propostas. O sistema registra os valores por item e monta um comparativo objetivo para apoiar a escolha.

## Fonte de dados

Na V3.4B, a fonte e exclusivamente o PostgreSQL local:

```text
enac_erp_dev
```

SharePoint permanece fora da operacao deste modulo. Documentos de proposta podem ser integrados em etapa futura, mas nenhum arquivo ou item SharePoint e criado nesta etapa.

## Entidades

### `cotacoes`

Representa a proposta de um fornecedor para uma solicitacao.

Campos de negocio:

- `company_id`
- `solicitacao_compra_id`
- `fornecedor_id`
- `codigo`
- `valor_total`
- `prazo_entrega_dias`
- `condicao_pagamento`
- `frete`
- `data_recebimento`
- `validade_proposta`
- `status`
- `observacoes`
- `motivo_desclassificacao`
- `recomendada`
- `justificativa`
- `selecionada_em`

### `cotacoes_itens`

Representa valores cotados por item da solicitacao.

Campos de negocio:

- `cotacao_id`
- `solicitacao_item_id`
- `descricao`
- `unidade`
- `quantidade`
- `valor_unitario`
- `valor_total`
- `observacoes`
- `ordem`
- `status`

O campo `status` dos itens e tecnico e evita `DELETE` fisico durante edicao.

## Regras atuais

- A solicitacao precisa estar em `EM_ANALISE`.
- Cada fornecedor pode ter apenas uma cotacao por solicitacao.
- A cotacao deve conter todos os itens ativos da solicitacao.
- A quantidade vem da solicitacao; o usuario informa apenas valor unitario.
- O total por item e calculado pela API.
- O total da cotacao e a soma dos itens ativos.
- Fornecedor deve estar ativo e pertencer a empresa.
- Cotacoes `DESCLASSIFICADA`, `SELECIONADA` e `CANCELADA` nao podem ser editadas.
- Selecionar cotacao nao cria pedido de compra.
- Nao ha exclusao fisica.

## Mapa comparativo

O mapa comparativo retorna:

- dados da solicitacao;
- resumo de cotacoes;
- menor total;
- cotacao selecionada;
- lista de cotacoes;
- comparativo de valores por item;
- destaque de menor valor por item.

Endpoint:

```text
GET /cotacoes/mapa-comparativo?solicitacao_compra_id=<uuid>
```

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
