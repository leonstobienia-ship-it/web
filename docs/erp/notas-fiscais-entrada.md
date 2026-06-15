# Notas Fiscais de Entrada ERP ENAC

## Papel no ERP

Nota Fiscal de Entrada registra o documento fiscal recebido de fornecedor contra Pedido de Compra. Na V3.5A, ela inicia o elo fiscal/financeiro local e pode provisionar Conta a Pagar, sem emissao fiscal real, XML, SEFAZ, prefeitura, pagamento ou baixa.

## Entidades

### `notas_fiscais_entrada`

Cabecalho da NF de entrada com empresa, pedido, fornecedor, obra, centro de custo, numero, serie, chave de acesso, datas, valores, status e auditoria basica.

### `notas_fiscais_entrada_itens`

Itens herdados ou informados a partir dos itens do pedido. A coluna canonica da V3.5A e `nota_fiscal_id`; `nota_id` permanece por compatibilidade com a primeira implementacao local.

## Status

```text
RASCUNHO
CONFERIDA
DIVERGENTE
APROVADA
PROVISIONADA
CANCELADA
```

Transicoes V3.5A:

```text
RASCUNHO -> CONFERIDA
RASCUNHO -> DIVERGENTE
DIVERGENTE -> RASCUNHO
CONFERIDA -> APROVADA
APROVADA -> PROVISIONADA
RASCUNHO | CONFERIDA | DIVERGENTE -> CANCELADA
```

## Regras

- Pedido deve existir e nao pode estar `CANCELADO`.
- Pedido elegivel: `EMITIDO`, `ENVIADO_FORNECEDOR`, `CONFIRMADO`, `PARCIALMENTE_RECEBIDO` ou `RECEBIDO`.
- Fornecedor, obra e centro de custo sao herdados do pedido.
- Itens podem ser herdados dos itens do pedido.
- `numero`, `data_emissao`, `data_entrada` e `valor_total` sao validados.
- `valor_total` deve ser maior ou igual a zero e bater com os itens informados/herdados.
- Divergencia frente ao valor do pedido e permitida e deve ser tratada pelo status `DIVERGENTE`.
- NF `CANCELADA` ou `PROVISIONADA` nao permite edicao operacional nesta etapa.
- Duplicidade ativa por empresa, fornecedor, numero e serie e bloqueada.
- Nao ha `DELETE` fisico.

## Endpoints

```text
GET    /notas-fiscais-entrada
GET    /notas-fiscais-entrada/:id
POST   /notas-fiscais-entrada
POST   /notas-fiscais-entrada/gerar-do-pedido
PATCH  /notas-fiscais-entrada/:id
PATCH  /notas-fiscais-entrada/:id/conferir
PATCH  /notas-fiscais-entrada/:id/marcar-divergente
PATCH  /notas-fiscais-entrada/:id/reabrir-rascunho
PATCH  /notas-fiscais-entrada/:id/aprovar
PATCH  /notas-fiscais-entrada/:id/provisionar-conta-pagar
PATCH  /notas-fiscais-entrada/:id/cancelar
```

Alias preservado:

```text
/notas-entrada
```

## Smoke

```powershell
cd server
npm.cmd run smoke:notas
```

O smoke usa marcador `DEV_LOCAL_V3_5A` e nao executa SharePoint, Entra, automacao, banco de producao, pagamento, baixa, programacao bancaria ou `DELETE`.
