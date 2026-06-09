# Roteiro V2.7A.5 - Teste Controlado Criar Pedido De Compra

Data: 2026-06-09

## Objetivo

Preparar a validacao manual futura de `CriarPedidoCompra`, sem executar escrita enquanto a estrutura da Lista 03 nao estiver confirmada.

Codex nao executa teste no tenant.

## Configuracao Futura Do Property Pane

Usar apenas em pagina restrita:

| Propriedade | Valor |
| --- | --- |
| `habilitarEscritaOperacionalV27A` | `true` |
| `modoTesteOperacionalV27A` | `true` |
| `permitirSomenteItensTesteV27A` | `true` |
| `marcadorTesteOperacionalV27A` | `V2.7A-TESTE` |
| `exigirConfirmacaoManualV27A` | `true` |
| `confirmacaoManualV27A` | `CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC` |
| `itemTesteOperacionalIdV27A` | `11` |
| `acaoTesteOperacionalV27A` | `CriarPedidoCompra` |
| `statusDestinoTesteOperacionalV27A` | vazio ou nao aplicavel |
| `valorTesteOperacionalV27A` | `6720` |
| `observacaoTesteOperacionalV27A` | `V2.7A-TESTE - criação controlada de pedido de compra` |

## Resultado Esperado Nesta Rodada

A pre-validacao deve exibir diagnostico da Lista 03 e bloquear escrita.

Alertas esperados enquanto nao houver auditoria readonly:

- `CAMPO_SOLICITACAO_PEDIDO_NAO_MAPEADO`;
- `CAMPOS_PEDIDO_OBRIGATORIOS_AUSENTES`;
- `FORNECEDOR_OBRIGATORIO_AUSENTE`;
- `STATUS_PEDIDO_INICIAL_NAO_MAPEADO`.

`pode executar` deve ser `nao`.

## Auditoria Readonly Necessaria

Antes de liberar escrita, Leon deve confirmar manualmente:

- `SolicitacaoId` existe ou identificar o campo real de vinculo;
- tipo do campo de vinculo com a solicitacao;
- choices de `StatusdoPedido`;
- campo correto de fornecedor: texto legado `Fornecedor` ou lookup `Fornecedor0`;
- obrigatoriedade de `Fornecedor`, `ValordoPedido`, `DatadoPedido`, `Obra`, `CentrodeCusto` e descricao;
- inexistencia de pedido anterior vinculado ao item `11`.

## Criterios De Parada

Parar se:

- o item `11` nao estiver em `Aprovada para compra`;
- `SnapshotAprovacaoCompra` estiver vazio;
- houver pedido existente;
- Lista 03 ou campo de vinculo nao forem confirmados;
- aparecer botao de escrita antes da pre-validacao completa;
- aparecer `PATCH` ou `DELETE`;
- Power Automate for acionado.

## Execucao Futura

Somente em rodada posterior, apos schema confirmado:

- criar um pedido de compra de teste na Lista 03;
- vincular ao item `11`;
- registrar historico operacional;
- nao criar NF;
- nao programar pagamento;
- nao iniciar Power Automate.

