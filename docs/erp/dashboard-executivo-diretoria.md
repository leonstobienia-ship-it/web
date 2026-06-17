# ERP - Dashboard Executivo da Diretoria

## Objetivo

O domínio consolida uma visão de diretoria sobre obras, contratos, orçamento, margem, financeiro, faturamento e operação. A camada é somente leitura e usa os dados transacionais locais do ERP ENAC para orientar acompanhamento executivo sem iniciar ações financeiras, fiscais ou bancárias.

## Visões disponíveis

- Resumo executivo com KPIs consolidados.
- Lista de obras com contratado, orçamento, custo, receita, margem e saldos.
- Alertas executivos por obra.
- Tendência mensal de previsto, faturado, custo e margem.
- Ranking de obras por faturamento, custo, desvio, margem e saldo.
- Recorte financeiro de contas, programações, conferências e baixas manuais já existentes.
- Recorte de faturamento medido, solicitado e faturado manualmente.
- Recorte operacional por status de solicitações, cotações, pedidos e notas.

## Fontes de dados

Contratos:

- `contratos_obra`;
- `contratos_obra_aditivos` com status `APROVADO`.

Orçamento e planejamento:

- `orcamentos_obra` com status `APROVADO`;
- `orcamentos_obra_cronograma`;
- `planejamento_executivo`.

Custos e financeiro:

- `pedidos_compra` confirmados ou recebidos;
- `notas_fiscais_entrada` aprovadas ou provisionadas;
- `contas_pagar` aprovadas, aguardando programação, programadas, baixadas manualmente ou pagas;
- `programacoes_pagamento` como estado local já existente;
- `contas_pagar_baixas` apenas como histórico local já existente.

Receitas:

- `medicoes_obra` aprovadas, com faturamento solicitado ou faturadas manualmente;
- `pedidos_faturamento` com status `FATURADO_MANUALMENTE`.

Operação:

- `solicitacoes_compra`;
- `cotacoes`;
- `pedidos_compra`;
- `notas_fiscais_entrada`.

## Fórmulas oficiais da V3.10

```text
valor_total_contratado = valor_contratado + valor_aditado
margem_prevista = valor_total_contratado - orcamento_previsto
margem_realizada = (receita_faturada_manual quando existir, senao receita_medida) - custo_realizado
desvio_orcamento = custo_realizado - orcamento_previsto
saldo_a_faturar = valor_total_contratado - receita_faturada_manual
saldo_orcamentario = orcamento_previsto - custo_realizado
saldo_contratual = valor_total_contratado - receita_medida
```

Custo comprometido usa o maior valor entre pedidos confirmados e contas não canceladas para reduzir dupla contagem. Custo realizado usa o maior valor entre contas realizadas e notas aprovadas/provisionadas pelo mesmo critério.

## Alertas

- Obra sem orçamento aprovado.
- Obra sem contrato ativo.
- Custo realizado acima do orçamento previsto.
- Margem realizada negativa.
- Conta vencida.
- Programação liberada ainda não conferida.
- Medição aprovada sem pedido de faturamento.
- Pedido de faturamento aprovado não faturado manualmente.
- Saldo contratual baixo.
- Orçamento aprovado sem cronograma ativo.
- Planejamento executivo atrasado.

## Segurança operacional

- Não há operação transacional nova.
- Não há pagamento.
- Não há baixa nova.
- Não há integração bancária.
- Não há CNAB.
- Não há boleto.
- Não há NFS-e real.
- Não há prefeitura.
- Não há cobrança real.
- Não há SharePoint, Entra ou Power Automate reais.
- Não há `DELETE` físico.
