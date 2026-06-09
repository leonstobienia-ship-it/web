# Roteiro V2.7A.6 - Teste Controlado Vincular Nota Fiscal

Data: 2026-06-09

## Objetivo

Registrar o roteiro e o resultado da validacao manual de `VincularNotaFiscal`, iniciada por auditoria readonly da `Lista 04 - Notas Fiscais Recebidas`.

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

## Auditoria Readonly Registrada

A auditoria readonly da Lista 04 foi executada manualmente por Leon e registrada em:

- `reports/lista04-notas-fiscais-fields-readonly.json`;
- `reports/lista04-notas-fiscais-fields-readonly.md`.

Campos obrigatorios para criacao inicial: `Fornecedor0Id`, `ObraId`, `EnviadaparaContabilidade_x003f_`.

Choices confirmadas para `EnviadaparaContabilidade_x003f_`: `sim`, `não`.

## Configuracao Usada No Property Pane

Configuracao esperada para o teste manual validado:

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
| `itemTesteOperacionalIdV27A` | `11` |
| `numeroNotaFiscalTesteV27A` | `NF-V2.7A-TESTE-001` |
| `serieNotaFiscalTesteV27A` | `1` |
| `valorNotaFiscalTesteV27A` | `6720` |
| `tipoNotaFiscalTesteV27A` | `Material` |
| `statusNotaFiscalInicialTesteV27A` | `Recebida` |
| `enviadaContabilidadeTesteV27A` | `não` |
| `dataEmissaoNotaFiscalTesteV27A` | opcional |
| `dataVencimentoNotaFiscalTesteV27A` | opcional |
| `linkNotaFiscalTesteV27A` | opcional |
| `observacaoTesteOperacionalV27A` | `V2.7A-TESTE - vinculação controlada de nota fiscal` |

## Pre-validacao

A pre-validacao deve usar somente GET e confirmar:

- Lista 03 item `3` existe;
- pedido contem `V2.7A-TESTE-001`;
- status do pedido permite receber NF;
- fornecedor do pedido preenchido;
- valor do pedido `6720`;
- Lista 02 item `11` segue aprovado;
- snapshot `3` segue vinculado;
- Lista 04 mapeada por GUID `25aa4447-193d-418a-8e71-9bfd8e9995da`;
- campos obrigatorios da NF conhecidos;
- status inicial da NF definido como `Recebida`;
- tipo da NF definido como `Material`;
- `EnviadaparaContabilidade_x003f_` definido como `não`;
- documento/anexo nao obrigatorio para a criacao inicial;
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

## Execucao Manual Registrada

Leon executou manualmente a acao no tenant apos pre-validacao liberada:

- NF criada: `Lista 04-4`;
- title / no controle NF: `NF-V2.7A-TESTE-PED-3-NF-V2.7A-TESTE-001-20260609141255`;
- no do pedido: `PED-V2.7A-TESTE-11-20260609125401`;
- no da NF: `NF-V2.7A-TESTE-001`;
- fornecedor: `Fornecedor Teste`;
- obra: `Obra Teste`;
- centro de custo: `V2.7A-TESTE`;
- valor bruto: `6720`;
- tipo NF: `Material`;
- status da conferencia: `Recebida`;
- enviada para contabilidade: `não`;
- valor liquido calculado: `6720`;
- HTTP escrita: `201`;
- historico operacional criado: sim;
- pagamento criado: nao;
- Power Automate iniciado: nao.

Ressalvas nao bloqueantes:

- `CNPJFornecedor` vazio;
- link/anexo vazios;
- data de recebimento vazia;
- valor exibido visualmente em formato en-US, com valor gravado `6720`.

## Proxima Rodada

V2.7A.7 deve preparar teste controlado de `ProgramarPagamento`, com auditoria readonly previa da lista real de contas/pagamentos e sem iniciar Power Automate.
