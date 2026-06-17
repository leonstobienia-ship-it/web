# ERP - Contratos de Obra

## Objetivo

O modulo de Contratos de Obra registra contratos comerciais de obra, itens de escopo, aditivos contratuais e vinculos locais com medicoes e pedidos internos de faturamento.

A V3.7 trabalha somente em PostgreSQL local. O modulo nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao executa cobranca bancaria, nao executa pagamento, nao cria CNAB e nao usa `DELETE` fisico.

## Entidades

### Contrato de obra

Usa a tabela `contratos_obra`.

Campos principais:

- empresa;
- cliente;
- obra;
- centro de custo opcional;
- numero do contrato;
- objeto;
- data inicial e final;
- valor original;
- valor de aditivos aprovados;
- valor total contratado;
- retencoes/impostos previstos como campos informativos;
- status;
- observacao;
- auditoria de criacao e transicoes.

### Item de contrato

Usa a tabela `contratos_obra_itens`.

Campos principais:

- contrato;
- codigo opcional;
- descricao;
- unidade;
- quantidade;
- valor unitario;
- valor total;
- centro de custo opcional;
- etapa/servico;
- status `ATIVO` ou `INATIVO`.

### Aditivo contratual

Usa a tabela `contratos_obra_aditivos`.

Campos principais:

- contrato;
- numero do aditivo;
- tipo;
- descricao;
- justificativa;
- valor do aditivo;
- novas datas previstas;
- status;
- aprovador e data de aprovacao;
- auditoria.

## Status

Contrato:

```text
RASCUNHO
ATIVO
SUSPENSO
ENCERRADO
CANCELADO
```

Aditivo:

```text
RASCUNHO
SUBMETIDO
APROVADO
REPROVADO
CANCELADO
```

## Alcadas

A migration V3.7 cria escopos e regras locais para o modulo `contratos-obra`:

- `ADITIVO_CONTRATUAL` com `aprovar_tecnico` ate R$ 20.000 para Planejamento.
- `ADITIVO_CONTRATUAL` com `aprovar_diretoria` acima de R$ 20.000 para Diretoria.

## Vinculos com medicoes e faturamento

- `medicoes_obra` passa a aceitar `contrato_obra_id` e `contrato_obra_aditivo_id`.
- `pedidos_faturamento` passa a aceitar `contrato_obra_id` e `contrato_obra_aditivo_id`.
- Se a obra possui contrato ativo, a medicao deve apontar para contrato ativo compativel.
- Aditivo informado precisa estar aprovado.
- O valor acumulado das medicoes ativas nao pode ultrapassar `valor_total_contratado`.
- Pedido de faturamento valida o mesmo contrato/aditivo da medicao.

## Seguranca operacional

- Nao ha `DELETE` fisico.
- Cancelamento e encerramento sao logicos.
- Inativacao de item preserva historico.
- Aprovacao de aditivo nao fatura, nao baixa recebivel, nao emite documento fiscal e nao integra banco.
- Auditoria e gravada em `auditoria_eventos`.
- Rotas fiscais e bancarias reais nao existem.

## Smoke

```powershell
cd server
npm.cmd run smoke:contratos-obra
```

O smoke valida contrato em rascunho, item de escopo, inativacao logica, ativacao, criacao/submissao/aprovacao de aditivo, bloqueio de medicao com aditivo nao aprovado, vinculo com medicao e pedido de faturamento, auditoria, rotas proibidas e ausencia de `DELETE` fisico.
