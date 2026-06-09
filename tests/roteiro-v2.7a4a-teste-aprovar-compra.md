# Roteiro V2.7A.4A - Teste Controlado Aprovar Compra

Data: 2026-06-09

## Objetivo

Validar manualmente, em rodada posterior autorizada, a acao `AprovarCompra` para levar uma requisicao `V2.7A-TESTE` de `Aguardando aprovação` para `Aprovada para compra`.

Codex nao executa este teste no tenant.

## Pre-condicoes

- Webpart instalada/publicada somente por Leon em rodada autorizada.
- Power Automate nao iniciado.
- Item `11` ainda existe na Lista 02.
- Item `11` contem marcador `V2.7A-TESTE`.
- Status atual do item `11`: `Aguardando aprovação`.
- `SnapshotAprovacaoCompra` preenchido com snapshot ID `3`.
- Valor de teste: `6720`.
- Regra esperada: `alc-v23b-teste-compra-ate-20000`.
- Aprovador esperado no snapshot: `V2.3B-TESTE - Gustavo`.

## Configuracao Do Property Pane

Usar:

| Propriedade | Valor |
| --- | --- |
| `habilitarEscritaOperacionalV27A` | `true` |
| `modoTesteOperacionalV27A` | `true` |
| `permitirSomenteItensTesteV27A` | `true` |
| `marcadorTesteOperacionalV27A` | `V2.7A-TESTE` |
| `exigirConfirmacaoManualV27A` | `true` |
| `confirmacaoManualV27A` | `CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC` |
| `itemTesteOperacionalIdV27A` | `11` |
| `acaoTesteOperacionalV27A` | `AprovarCompra` |
| `statusDestinoTesteOperacionalV27A` | `Aprovada para compra` |
| `valorTesteOperacionalV27A` | `6720` |
| `observacaoTesteOperacionalV27A` | `V2.7A-TESTE - aprovação controlada para teste de pedido` |

## Pre-validacao Esperada

A pre-validacao deve exibir:

- Lista 02 por GUID;
- item `11`;
- marcador confirmado;
- status `Aguardando aprovação -> Aprovada para compra`;
- snapshot atual `3`;
- aprovacao necessaria `Sim`;
- valor analisado `R$ 6.720,00`;
- regra/alçada resolvida;
- aprovador base/efetivo resolvido;
- campo alterado `StatusdaRequisi_x00e7__x00e3_o`;
- historico previsto;
- `pode executar = sim`, somente se usuario/perfil forem validos;
- alertas `-`.

Se aparecer `USUARIO_NAO_E_APROVADOR`, nao executar a escrita. Registrar o resultado e decidir formalmente se o teste sera feito com Gustavo ou se havera outra regra de teste.

## Execucao Permitida

Executar somente se:

- pre-validacao passou;
- item validado e o item configurado sao `11`;
- marcador confirmado;
- status atual ainda e `Aguardando aprovação`;
- snapshot continua preenchido;
- confirmacao final digitada exatamente igual;
- botao de escrita aparece apos a pre-validacao;
- Leon confirmou visualmente os dados.

## Resultado Esperado

- MERGE somente em `Lista 02`, item `11`;
- campo alterado: `StatusdaRequisi_x00e7__x00e3_o`;
- valor anterior: `Aguardando aprovação`;
- valor novo: `Aprovada para compra`;
- historico operacional criado;
- nenhum pedido criado;
- nenhuma NF criada;
- nenhum pagamento programado;
- Power Automate nao iniciado.

## Auditoria Pos-teste

Registrar:

- data/hora do teste;
- usuario autenticado;
- HTTP da escrita;
- ID do historico operacional;
- status final do item;
- snapshot mantido;
- ausencia de `PATCH` e `DELETE`;
- flags desligadas apos o teste;
- pagina republicada com flags desligadas.

## Proxima Etapa

Somente depois de `AprovarCompra` validado, retomar `CriarPedidoCompra` com validacao readonly previa da Lista 03.
