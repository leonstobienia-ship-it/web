# Roteiro V2.7A.6 - Teste Controlado Vincular Nota Fiscal

Data: 2026-06-09

## Objetivo

Preparar a validacao futura de `VincularNotaFiscal`, iniciando por auditoria readonly da `Lista 04 - Notas Fiscais Recebidas`.

Codex nao executa teste no tenant, nao conecta ao SharePoint, nao publica pacote, nao altera listas/dados e nao executa escrita operacional.

## Premissas Confirmadas

- `AtualizarStatusRequisicao` validada.
- `CriarSnapshotAprovacaoOperacional` validada.
- `AprovarCompra` por Diretoria/alçada superior validada.
- `CriarPedidoCompra` validada.
- Pedido de teste criado na Lista 03, item `3`.
- Pedido vinculado a `V2.7A-TESTE-001`.
- Pedido com valor `6720`.
- Pedido com status `Em elaboração`.
- Fornecedor do pedido preenchido no lookup `Fornecedor0`.
- Requisicao origem item `11` preservada em `Aprovada para compra`.
- Snapshot `3` preservado.

## Primeiro Passo Manual

Executar auditoria readonly:

```powershell
pwsh .\scripts\sharepoint\12-auditoria-lista04-notas-fiscais-readonly.ps1 `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<app-id-autorizado>" `
  -AuthMode DeviceLogin
```

Revisar:

- `reports/lista04-notas-fiscais-fields-readonly.json`;
- `reports/lista04-notas-fiscais-fields-readonly.md`.

## Configuracao Futura Do Property Pane

Somente apos auditoria da Lista 04, avaliar propriedades:

| Propriedade | Valor esperado |
| --- | --- |
| `habilitarEscritaOperacionalV27A` | `true` |
| `modoTesteOperacionalV27A` | `true` |
| `permitirSomenteItensTesteV27A` | `true` |
| `marcadorTesteOperacionalV27A` | `V2.7A-TESTE` |
| `exigirConfirmacaoManualV27A` | `true` |
| `confirmacaoManualV27A` | `CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC` |
| `acaoTesteOperacionalV27A` | `VincularNotaFiscal` |
| `pedidoTesteIdV27A` | `3` |
| `notaFiscalNumeroTesteV27A` | numero de NF de teste, a definir |
| `notaFiscalValorTesteV27A` | `6720` |
| `notaFiscalStatusInicialTesteV27A` | conforme choice real da Lista 04 |
| `notaFiscalDataEmissaoTesteV27A` | opcional |
| `notaFiscalDataVencimentoTesteV27A` | opcional |
| `observacaoTesteOperacionalV27A` | `V2.7A-TESTE - vinculação controlada de nota fiscal` |

## Pre-validacao Futura

A pre-validacao deve usar somente GET e confirmar:

- Lista 03 item `3` existe;
- pedido contem `V2.7A-TESTE-001`;
- status do pedido permite receber NF;
- fornecedor do pedido preenchido;
- valor do pedido `6720`;
- Lista 02 item `11` segue aprovado;
- snapshot `3` segue vinculado;
- Lista 04 mapeada;
- campos obrigatorios da NF conhecidos;
- status inicial da NF definido;
- documento/anexo nao obrigatorio ou regra documentada;
- NF de teste ainda nao existe;
- usuario/perfil pode vincular NF;
- historico previsto.

## Criterios De Parada

Parar se:

- Lista 04 nao estiver auditada;
- pedido `3` nao estiver consistente;
- requisicao `11` ou snapshot `3` tiverem divergencia;
- campo de vinculo NF-pedido nao estiver definido;
- status inicial da NF nao estiver mapeado;
- anexo/link/documento for obrigatorio sem regra definida;
- NF de teste ja existir;
- aparecer `PATCH` ou `DELETE`;
- Power Automate for acionado.

## Execucao Futura

Somente em rodada posterior:

- criar ou vincular NF de teste conforme schema real;
- registrar historico operacional;
- nao programar pagamento;
- nao criar conta a pagar na mesma rodada;
- nao iniciar Power Automate.
