# ERP - Orcamento Base e Planejamento Executivo

## Objetivo

O modulo registra o orcamento base executivo da obra e o planejamento operacional local, permitindo estruturar pacotes, itens, insumos previstos, mao de obra prevista, equipamentos previstos, cronograma fisico-financeiro e etapas executivas.

A V3.8 nao executa operacao fiscal ou bancaria. Nao emite NFS-e real, nao integra prefeitura, nao gera boleto, nao executa pagamento, nao gera CNAB e nao usa `DELETE` fisico.

## Entidades

### Orcamento da obra

Usa a tabela `orcamentos_obra`.

Campos principais:

- empresa;
- obra;
- cliente;
- contrato de obra opcional;
- centro de custo opcional;
- codigo;
- versao;
- competencia base;
- valores previstos por tipo;
- margem prevista percentual;
- status;
- auditoria de revisao, aprovacao, bloqueio e cancelamento.

### Pacote orcamentario

Usa a tabela `orcamentos_obra_pacotes`.

Campos principais:

- orcamento;
- codigo;
- nome;
- etapa;
- centro de custo;
- ordem;
- status `ATIVO` ou `INATIVO`.

### Item orcamentario

Usa a tabela `orcamentos_obra_itens`.

Campos principais:

- orcamento;
- pacote;
- centro de custo;
- tipo;
- descricao;
- unidade;
- quantidade;
- valor unitario previsto;
- valor total previsto;
- insumo, mao de obra ou equipamento previsto;
- status `ATIVO` ou `INATIVO`.

Tipos aceitos:

```text
MATERIAL
MAO_DE_OBRA
EQUIPAMENTO
SERVICO
OUTROS
```

### Cronograma fisico-financeiro

Usa a tabela `orcamentos_obra_cronograma`.

Campos principais:

- orcamento;
- pacote opcional;
- competencia `YYYY-MM`;
- valor previsto;
- percentual fisico previsto;
- status `ATIVO` ou `INATIVO`.

### Planejamento executivo

Usa a tabela `planejamento_executivo`.

Campos principais:

- obra;
- orcamento opcional;
- contrato opcional;
- centro de custo;
- etapa;
- descricao;
- data prevista inicial e final;
- responsavel;
- status;
- auditoria de ativacao, revisao, encerramento e cancelamento.

## Status

Orcamento:

```text
RASCUNHO
EM_REVISAO
APROVADO
BLOQUEADO
CANCELADO
```

Planejamento:

```text
RASCUNHO
ATIVO
REVISADO
ENCERRADO
CANCELADO
```

## Resumo previsto x realizado

`GET /orcamentos-obra/:id/resumo` consolida:

- total previsto;
- total por tipo de item;
- total por pacote;
- total do cronograma;
- valor contratado, quando houver contrato vinculado;
- diferenca contrato x orcamento;
- compras realizadas da obra;
- medicoes realizadas da obra;
- faturamento solicitado da obra.

A consulta e informativa na V3.8. Ela nao bloqueia medicao, faturamento, compra ou financeiro.

## Segurança operacional

- Nao ha `DELETE` fisico.
- Inativacao de pacote, item e cronograma preserva historico.
- Cancelamento e bloqueio sao logicos.
- Aprovacao de orcamento nao fatura, nao baixa, nao paga e nao integra banco.
- Auditoria e gravada em `auditoria_eventos`.
- Rotas fiscais e bancarias reais nao existem.

## Smoke

```powershell
cd server
npm.cmd run smoke:orcamento-planejamento
```

O smoke valida criacao de orcamento, pacote, itens, cronograma, resumo, envio para revisao, aprovacao, unicidade de orcamento vigente por obra, consulta de vigente por obra, planejamento executivo, auditoria, inativacao logica, rotas proibidas e ausencia de `DELETE` fisico.
