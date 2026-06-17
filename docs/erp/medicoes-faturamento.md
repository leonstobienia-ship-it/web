# ERP - Medicoes e Faturamento

## Objetivo

O modulo de Medicoes e Faturamento registra medicoes de obra, itens medidos, aprovacao interna por alcada e pedido interno de faturamento.

A V3.6 trabalha somente em PostgreSQL local. O registro `FATURADO_MANUALMENTE` nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao executa cobranca bancaria e nao baixa recebivel automaticamente.

A partir da V3.7, medicoes e pedidos internos de faturamento podem ser vinculados a contrato de obra e aditivo aprovado. A validacao e local e nao executa emissao fiscal, boleto, cobranca bancaria ou baixa de recebivel.

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
- contrato de obra e aditivo aprovado, quando aplicavel;
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
- faturamento manual informado;
- contrato de obra e aditivo de origem, quando aplicavel.

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
- Se a obra possui contrato ativo, a medicao deve apontar para contrato ativo compativel.
- Aditivo informado na medicao ou no pedido deve estar `APROVADO`.
- O valor acumulado das medicoes ativas nao pode ultrapassar o total contratado.
- Auditoria e gravada em `auditoria_eventos`.
- Rotas fiscais e bancarias reais nao existem.

## Relatorio gerencial V3.9

A V3.9 consome medicoes aprovadas, medicoes com faturamento solicitado, medicoes faturadas manualmente e pedidos de faturamento `FATURADO_MANUALMENTE` para calcular receita medida, receita faturada manualmente, saldo a faturar e margem realizada.

Essa leitura nao emite documento fiscal, nao integra prefeitura, nao gera boleto, nao cria cobranca e nao baixa recebivel. As formulas completas ficam em `docs/erp/previsto-realizado-margem-obra.md`.

## Smoke

```powershell
cd server
npm.cmd run smoke:medicoes-faturamento
```

O smoke valida vinculo obra/cliente, bloqueio de envio sem item, calculo por itens ativos, inativacao logica, aprovacao por alcada, pedido apenas de medicao aprovada, bloqueio de duplicidade, faturamento manual com observacao obrigatoria, ausencia de criacao automatica de recebivel, auditoria, rotas proibidas e ausencia de `DELETE` fisico.
