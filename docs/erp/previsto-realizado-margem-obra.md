# ERP - Previsto x Realizado e Margem por Obra

## Objetivo

O dominio consolida uma visao gerencial de obra por contrato, orcamento, custo, receita e margem. A camada e prioritariamente leitura e serve para acompanhamento executivo e operacional sem executar qualquer etapa financeira, fiscal ou bancaria.

## Visao por obra

Cada obra retorna:

- cliente e centro de custo;
- contrato vendido;
- aditivos aprovados;
- orcamento aprovado vigente;
- custo comprometido;
- custo realizado;
- custo baixado manualmente quando houver historico ja registrado;
- receita medida;
- receita faturada manualmente;
- margem prevista;
- margem realizada;
- desvios e saldos.

## Visao por agrupamento

A V3.9 permite consultar:

- portfolio consolidado;
- resumo por obra;
- curva mensal por competencia;
- pacotes orcamentarios;
- centros de custo;
- contratos e aditivos;
- custos de pedidos, notas, contas e baixas manuais ja existentes;
- medicoes e pedidos internos de faturamento.

## Fontes de dados

Contratos:

- `contratos_obra`;
- `contratos_obra_aditivos` com status `APROVADO`.

Orcamento:

- `orcamentos_obra` com status `APROVADO`;
- `orcamentos_obra_pacotes`;
- `orcamentos_obra_itens`;
- `orcamentos_obra_cronograma`.

Custos:

- `pedidos_compra` confirmados ou recebidos;
- `notas_fiscais_entrada` aprovadas ou provisionadas;
- `contas_pagar` aprovadas, aguardando programacao, programadas, baixadas manualmente ou pagas;
- `contas_pagar_baixas` apenas como historico local ja existente.

Receitas:

- `medicoes_obra` aprovadas, com faturamento solicitado ou faturadas manualmente;
- `pedidos_faturamento` com status `FATURADO_MANUALMENTE`.

## Formulas oficiais da V3.9

```text
valor_total_contratado = valor_contratado + valor_aditado
margem_prevista = valor_total_contratado - orcamento_previsto
margem_realizada = (receita_faturada_manual quando existir, senao receita_medida) - custo_realizado
desvio_absoluto = margem_realizada - margem_prevista
desvio_percentual = desvio_absoluto / abs(margem_prevista) * 100
saldo_contratual = valor_total_contratado - receita_medida
saldo_orcamentario = orcamento_previsto - custo_realizado
saldo_a_faturar = receita_medida - receita_faturada_manual
```

Custo comprometido usa o maior valor entre pedidos confirmados e contas nao canceladas para evitar dupla contagem quando o fluxo ja gerou documento financeiro.

Custo realizado usa o maior valor entre contas realizadas e notas aprovadas/provisionadas pelo mesmo motivo.

## Alertas gerenciais

A API sinaliza:

- obra sem orcamento aprovado;
- obra sem contrato ativo ou encerrado;
- custo realizado acima do orcamento previsto;
- receita faturada abaixo da receita medida;
- margem realizada negativa.

## Seguranca operacional

- Nao ha `DELETE` fisico.
- Nao ha endpoint transacional novo.
- Nao ha pagamento.
- Nao ha baixa nova.
- Nao ha CNAB.
- Nao ha boleto.
- Nao ha NFS-e real.
- Nao ha prefeitura.
- Nao ha banco ou integracao bancaria.
- Nao ha SharePoint, Entra ou Power Automate reais.
