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

Para aprovacao direta, a pre-validacao deve exibir `APROVADOR_DO_SNAPSHOT_VALIDO`.

Para aprovacao por Leon/Diretoria como alcada superior, a pre-validacao deve exibir:

- tipo `Alçada superior / Diretoria`;
- diagnostico `DIRETORIA_ALCADA_SUPERIOR_VALIDADA`;
- aprovador previsto `V2.3B-TESTE - Gustavo`;
- aprovador efetivo operacional `V2.3B-TESTE - Leon / Diretoria`;
- justificativa de aprovacao por alcada superior.

Se aparecer `USUARIO_NAO_E_APROVADOR` ou `PERFIL_DIRETORIA_NAO_ATIVO`, nao executar a escrita.

## Execucao Permitida

Executar somente se:

- pre-validacao passou;
- em caso de Diretoria, diagnostico `DIRETORIA_ALCADA_SUPERIOR_VALIDADA`;
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
- snapshot antes/depois exibido e preservado;
- historico operacional criado somente se o snapshot for preservado;
- historico registra aprovador previsto, aprovador efetivo e aprovacao por alcada superior quando aplicavel;
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
- snapshot mantido na visualizacao da lista e no formulario;
- ausencia de `SNAPSHOT_PERDIDO_APOS_APROVACAO` e `SNAPSHOT_NAO_CONFIRMADO_APOS_APROVACAO`;
- ausencia de `PATCH` e `DELETE`;
- flags desligadas apos o teste;
- pagina republicada com flags desligadas.

## Proxima Etapa

Somente depois de `AprovarCompra` validado, retomar `CriarPedidoCompra` com validacao readonly previa da Lista 03.

Se o campo `SnapshotAprovacaoCompra` estiver vazio apos a aprovacao, interromper a rodada e nao seguir para pedido de compra.

## Registro Final V2.7A.4E

Leon confirmou manualmente que o teste de `AprovarCompra` foi concluido em 09/06/2026:

- item `11`;
- marcador `V2.7A-TESTE`;
- status `Aguardando aprovação -> Aprovada para compra`;
- snapshot preservado `3` / `SNAP-V2.7A-TESTE-11-20260609025123`;
- historico criado;
- HTTP escrita `204`;
- aprovacao por Diretoria/alçada superior;
- pedido, NF e pagamento nao criados;
- Power Automate nao iniciado.

Este roteiro fica encerrado para a acao `AprovarCompra` controlada, sem liberar producao ampla.
