# Contas a Pagar ERP ENAC

## Papel no ERP

Conta a Pagar representa a obrigacao financeira inicial gerada a partir de Nota Fiscal de Entrada aprovada. Na V3.5A, a conta e provisionada. Na V3.5C, pode ser aprovada internamente por alçada. Na V3.5D, pode ser vinculada a uma Programacao de Pagamento local sem baixa. Nao ha programacao bancaria, pagamento, baixa, conciliacao ou integracao bancaria real.

## Entidade `contas_pagar`

A tabela nasceu na fundacao V3.2 e foi ajustada incrementalmente. O vinculo operacional com Nota Fiscal de Entrada usa `nota_entrada_id`, porque `nota_fiscal_id` ja existia apontando para a tabela generica `notas_fiscais`.

Campos principais do fluxo V3.5A:

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
- `ativo`
- `divergencia_pendente`
- `forma_pagamento_prevista`
- `observacoes`

## Status

```text
PROVISIONADA
APROVADA
AGUARDANDO_PROGRAMACAO
PROGRAMADA
PAGA
CANCELADA
```

Na V3.5C, `APROVADA` passa a representar aprovacao interna por alcada. Na V3.5D, a programacao ativa e controlada por `programacoes_pagamento_itens`, sem depender de alterar a conta para `PAGA`. `PAGA` continua fora do escopo operacional.

## Regras

- Conta nasce de NF de entrada `APROVADA`.
- Provisao pela NF muda a NF para `PROVISIONADA`.
- Empresa, fornecedor, pedido, obra, centro de custo, numero, emissao e valor sao herdados da NF.
- V3.5A permite apenas parcela unica.
- `valor_aberto` inicia igual a `valor_original`.
- Duplicidade ativa por NF/parcela retorna `409`.
- Conta so entra em Programacao de Pagamento quando esta ativa, aprovada, sem divergencia pendente e sem programacao ativa.
- A aprovacao da Programacao de Pagamento nao altera `valor_aberto`.
- Nao ha pagamento.
- Nao ha baixa.
- Nao ha programacao bancaria real.
- Nao ha conciliacao.
- Nao ha `DELETE` fisico.

## Endpoints

```text
GET    /contas-pagar
GET    /contas-pagar/:id
POST   /contas-pagar/provisionar-da-nota
PATCH  /contas-pagar/:id/aprovar-tecnico
PATCH  /contas-pagar/:id/aprovar-diretoria
```

Alias local preservado:

```text
POST   /contas-pagar/gerar-da-nota
```

O fluxo preferencial da V3.5A e:

```text
PATCH /notas-fiscais-entrada/:id/provisionar-conta-pagar
```

## Smoke

```powershell
cd server
npm.cmd run smoke:notas
```

`smoke:notas` valida a conta provisionada. `smoke:contas-pagar` permanece como smoke auxiliar de leitura e duplicidade. `smoke:programacoes-pagamento` valida a programacao local sem pagamento ou baixa.
