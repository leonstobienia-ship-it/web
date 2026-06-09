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
| `fornecedorTesteIdV27A` | ID real valido da Lista 06 |
| `statusPedidoInicialTesteV27A` | `Em elaboração` |
| `tituloPedidoTesteV27A` | vazio para gerar automaticamente |
| `descricaoPedidoTesteV27A` | `V2.7A-TESTE - pedido de compra controlado` |
| `condicaoPagamentoTesteV27A` | opcional |
| `prazoEntregaTesteV27A` | opcional |

## Resultado Esperado Apos V2.7A.5B

A pre-validacao deve exibir diagnostico da Lista 03 e liberar somente se todos os criterios estiverem atendidos.

Alertas esperados quando configuracao estiver incompleta:

- `CAMPOS_PEDIDO_OBRIGATORIOS_AUSENTES`;
- `FORNECEDOR_TESTE_NAO_INFORMADO`;
- `FORNECEDOR_TESTE_NAO_ENCONTRADO`;
- `STATUS_PEDIDO_INICIAL_NAO_MAPEADO`.
- `PEDIDO_JA_EXISTENTE`.

`pode executar` deve ser `sim` somente se o fornecedor for resolvido e nao houver pedido anterior.

## Auditoria Readonly Necessaria

Antes de liberar escrita, Leon deve confirmar manualmente:

- confirmar que o vinculo desta rodada sera textual via `N_x00ba_daRequisi_x00e7__x00e3_o`;
- confirmar `StatusdoPedido = Em elaboração`;
- confirmar fornecedor por lookup `Fornecedor0Id`;
- confirmar obrigatoriedade de `ObraId`, fornecedor, valor, data, centro de custo e descricao;
- inexistencia de pedido anterior vinculado ao item `11`.

## Script Readonly V2.7A.5A

Opcionalmente, Leon pode executar:

```powershell
pwsh .\scripts\sharepoint\11-auditoria-lista03-pedidos-readonly.ps1 `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<app-id-autorizado>" `
  -AuthMode DeviceLogin
```

O script deve gerar:

- `reports/lista03-pedidos-fields-readonly.json`;
- `reports/lista03-pedidos-fields-readonly.md`.

Nao seguir para escrita sem revisar esses relatórios.

## Criterios De Parada

Parar se:

- o item `11` nao estiver em `Aprovada para compra`;
- `SnapshotAprovacaoCompra` estiver vazio;
- houver pedido existente;
- `fornecedorTesteIdV27A` nao estiver informado ou nao existir na Lista 06;
- Lista 03 nao retornar GET na busca de pedido existente;
- aparecer botao de escrita antes da pre-validacao completa;
- aparecer `PATCH` ou `DELETE`;
- Power Automate for acionado.

## Execucao Futura

Somente em rodada manual posterior, apos pre-validacao aprovada:

- criar um pedido de compra de teste na Lista 03;
- vincular ao item `11` por `N_x00ba_daRequisi_x00e7__x00e3_o`;
- registrar historico operacional;
- nao criar NF;
- nao programar pagamento;
- nao iniciar Power Automate.
