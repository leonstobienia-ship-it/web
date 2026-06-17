# ERP - Programacoes de Pagamento

## Objetivo

O dominio de Programacoes de Pagamento organiza Contas a Pagar aprovadas para uma data prevista de pagamento, sem executar pagamento, baixa, liberacao bancaria, CNAB ou integracao com banco.

## Regras funcionais

- Conta a Pagar nasce em `PROVISIONADA` na V3.5A.
- Conta pode ser aprovada internamente na V3.5C e chegar a `APROVADA`.
- A V3.5D parte apenas de contas `APROVADA`.
- Conta nao aprovada, cancelada, inativa, com divergencia pendente ou ja vinculada a programacao ativa nao pode ser programada.
- A programacao nasce `RASCUNHO`.
- Somente `RASCUNHO` recebe/remover contas.
- `SUBMETIDA` depende de aprovacao por alcada.
- `APROVADA` confirma o vinculo ativo da programacao, mas nao altera `valor_aberto`, nao cria pagamento e nao baixa.
- `REPROVADA` e `CANCELADA` liberam logicamente as contas para nova programacao futura.

## Modelo

### `programacoes_pagamento`

Cabeçalho da programação:

- empresa;
- codigo;
- status;
- data prevista;
- fornecedor;
- obra;
- centro de custo;
- forma de pagamento prevista;
- valor total;
- quantidade de contas;
- observacoes;
- justificativa;
- campos de aprovacao por alcada;
- campos de submissao e cancelamento lógico.

### `programacoes_pagamento_itens`

Vinculo lógico entre programação e Conta a Pagar:

- programacao;
- conta a pagar;
- valor programado;
- status do item;
- observacoes;
- usuário e data de inclusão;
- usuário, data e motivo de remoção lógica.

Nao ha `DELETE` fisico. Remocao de conta usa status `REMOVIDA`; cancelamento/reprovacao usa status `CANCELADA`.

## Alçadas

Tipo de documento:

```text
PROGRAMACAO_PAGAMENTO
```

Modulo:

```text
programacoes-pagamento
```

Acoes:

```text
aprovar_tecnico
aprovar_diretoria
```

Seeds locais:

- `FINANCEIRO`: `aprovar_tecnico` de R$ 0,00 ate R$ 20.000,00;
- `DIRETORIA`: `aprovar_diretoria` acima de R$ 20.000,00.

## Contrato REST

```text
GET   /programacoes-pagamento
GET   /programacoes-pagamento/:id
GET   /programacoes-pagamento/contas-elegiveis
POST  /programacoes-pagamento
POST  /programacoes-pagamento/:id/contas
PATCH /programacoes-pagamento/:id/contas/:contaPagarId/remover
PATCH /programacoes-pagamento/:id/submeter
PATCH /programacoes-pagamento/:id/aprovar-tecnico
PATCH /programacoes-pagamento/:id/aprovar-diretoria
PATCH /programacoes-pagamento/:id/reprovar
PATCH /programacoes-pagamento/:id/cancelar
```

Rotas inexistentes por desenho:

```text
PATCH /programacoes-pagamento/:id/pagar
PATCH /programacoes-pagamento/:id/baixar
```

## Auditoria

Toda mutacao funcional registra `auditoria_eventos` com entidade `programacao_pagamento`.

## Limites da versao

- Sem banco real.
- Sem arquivo CNAB.
- Sem API bancaria.
- Sem baixa financeira.
- Sem conciliacao.
- Sem comprovante.
- Sem SharePoint real.
- Sem Entra real.
- Sem Power Automate.
