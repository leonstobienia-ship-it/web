# ERP - Medicoes e Faturamento

## Objetivo

O modulo de Medicoes e Faturamento registra medicoes de obra, itens medidos, aprovacao interna por alcada e pedido interno de faturamento.

A V3.6 trabalha somente em PostgreSQL local. O registro `FATURADO_MANUALMENTE` nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao executa cobranca bancaria e nao baixa recebivel automaticamente.

## Entidades

### Medicao

Usa a tabela `medicoes_obra`, evoluida pela migration V3.6.

Campos principais:

- empresa;
- obra;
- cliente;
- centro de custo;
- numero;
- competencia;
- periodo inicial e final;
- contrato/escopo;
- valor bruto calculado;
- retencoes previstas;
- impostos estimados;
- valor liquido previsto;
- status;
- responsavel;
- auditoria de aprovacao, devolucao, cancelamento e faturamento manual.

### Item de medicao

Usa a tabela `medicoes_obra_itens`.

Campos principais:

- descricao;
- unidade;
- quantidade;
- valor unitario;
- valor total;
- centro de custo opcional;
- etapa/servico;
- status `ATIVO` ou `INATIVO`.

### Pedido de faturamento

Usa a tabela `pedidos_faturamento`.

Campos principais:

- medicao;
- cliente;
- obra;
- codigo;
- valor solicitado;
- data da solicitacao;
- responsavel;
- status;
- aprovacao;
- faturamento manual informado.

## Status

Medicao:

```text
RASCUNHO
SUBMETIDA
EM_ANALISE
APROVADA
DEVOLVIDA
CANCELADA
FATURAMENTO_SOLICITADO
FATURADO_MANUALMENTE
```

Pedido:

```text
SOLICITADO
APROVADO
FATURADO_MANUALMENTE
CANCELADO
```

## Alçadas

A migration V3.6 cria escopos e regras locais para o modulo `medicoes-faturamento`:

- `MEDICAO_OBRA` com `aprovar_tecnico` ate R$ 20.000 para Planejamento.
- `MEDICAO_OBRA` com `aprovar_diretoria` acima de R$ 20.000 para Diretoria.
- `PEDIDO_FATURAMENTO` com `aprovar_tecnico` ate R$ 20.000 para Financeiro.
- `PEDIDO_FATURAMENTO` com `aprovar_diretoria` acima de R$ 20.000 para Diretoria.

## Segurança operacional

- Nao ha `DELETE` fisico.
- Inativacao de item preserva historico.
- Cancelamento de medicao e logico.
- Medicao faturada manualmente nao pode ser cancelada nesta etapa.
- Auditoria e gravada em `auditoria_eventos`.
- Rotas fiscais e bancarias reais nao existem.

## Smoke

```powershell
cd server
npm.cmd run smoke:medicoes-faturamento
```

O smoke valida vinculo obra/cliente, bloqueio de envio sem item, calculo por itens ativos, inativacao logica, aprovacao por alcada, pedido apenas de medicao aprovada, bloqueio de duplicidade, faturamento manual com observacao obrigatoria, ausencia de criacao automatica de recebivel, auditoria, rotas proibidas e ausencia de `DELETE` fisico.
