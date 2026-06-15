# Notas de Entrada ERP ENAC

## Papel no ERP

Nota de Entrada registra o documento fiscal recebido de fornecedor contra um Pedido de Compra confirmado. Na V3.5A, ela prepara a geracao de Conta a Pagar, mas nao executa fiscal real externo, XML, recebimento fisico, estoque ou pagamento.

## Fonte de dados

Fonte operacional local:

```text
PostgreSQL local: enac_erp_dev
```

SharePoint fica fora da operacao. XML e anexos documentais poderao ser integrados em etapa futura como documentos, sem usar SharePoint como banco transacional.

## Entidades

### `notas_fiscais_entrada`

Cabecalho da nota de entrada.

Campos principais:

- `company_id`
- `pedido_id`
- `fornecedor_id`
- `obra_id`
- `centro_custo_id`
- `numero`
- `serie`
- `chave_acesso`
- `tipo_documento`
- `data_emissao`
- `data_entrada`
- `valor_produtos`
- `valor_servicos`
- `valor_frete`
- `valor_desconto`
- `valor_impostos`
- `valor_total`
- `status`
- `observacoes`

### `notas_fiscais_entrada_itens`

Itens herdados ou informados a partir do pedido de compra.

Campos principais:

- `nota_id`
- `pedido_item_id`
- `descricao`
- `unidade`
- `quantidade`
- `valor_unitario`
- `valor_total`
- `observacoes`
- `ordem`

## Fluxo V3.5A

```text
Pedido CONFIRMADO
  -> Nota RASCUNHO
  -> LANCADA
  -> CONFERIDA
  -> APROVADA_FINANCEIRO
```

Cancelamento permitido:

- `RASCUNHO`
- `LANCADA`
- `CONFERIDA`

## Regras

- Pedido deve existir.
- Pedido deve estar `CONFIRMADO`, `PARCIALMENTE_RECEBIDO` ou `RECEBIDO`.
- Pedido `CANCELADO` e bloqueado.
- Fornecedor, obra e centro de custo sao herdados do pedido.
- Itens podem ser herdados dos itens do pedido.
- Valor total da nota deve bater com o total dos itens.
- Nota nao pode ultrapassar o valor do pedido nesta etapa.
- Duplicidade ativa por empresa, fornecedor, numero e serie e bloqueada.
- Nota `CANCELADA` nao permite edicao.
- Nota `APROVADA_FINANCEIRO` nao permite edicao na V3.5A.
- Nao ha emissao fiscal real.
- Nao ha integracao SEFAZ, prefeitura, NFS-e ou NF-e.
- Nao ha pagamento, baixa ou conciliacao.
- Nao ha `DELETE` fisico.

## Endpoints

```text
GET    /notas-entrada
GET    /notas-entrada/:id
POST   /notas-entrada
PATCH  /notas-entrada/:id
PATCH  /notas-entrada/:id/lancar
PATCH  /notas-entrada/:id/conferir
PATCH  /notas-entrada/:id/aprovar-financeiro
PATCH  /notas-entrada/:id/cancelar
```

Filtros de lista:

- `status`
- `fornecedor_id`
- `pedido_id`
- `obra_id`
- `centro_custo_id`

## Smoke

```powershell
cd server
npm.cmd run smoke:notas
```

O smoke cria cenario local `DEV_LOCAL_V3_5A`, garante pedido confirmado, cria nota, valida itens herdados, executa transicoes ate `APROVADA_FINANCEIRO` e nao executa fiscal real, SharePoint, Entra, automacao, pagamento ou `DELETE`.
