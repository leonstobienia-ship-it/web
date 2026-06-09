# Roteiro V2.7A.3 - Snapshot Operacional Controlado

Data: 2026-06-08

## Objetivo

Orientar Leon a executar manualmente a pre-validacao e, somente se aprovada, a criacao controlada de snapshot operacional para item `V2.7A-TESTE`.

Codex nao deve conectar ao SharePoint, publicar pacote, alterar tenant/listas/dados, executar escrita ou iniciar Power Automate.

## Pre-condicoes

- Branch `dev/v2.3-sharepoint-integracao`.
- V2.7A.2D registrada no commit `a7f871f`.
- V2.7A.2C validada manualmente no item `11`.
- Pagina restrita de teste.
- Flags V2.7A desligadas antes de iniciar a configuracao manual.
- Power Automate fora do escopo.

## Uso Do Item 11

Usar o item `11` somente se a pre-validacao mostrar:

- marcador `V2.7A-TESTE`;
- status atual `Aguardando aprovação`;
- `SnapshotAprovacaoCompra` vazio;
- valor analisado configurado;
- regra/alçada resolvida;
- aprovador base/efetivo resolvidos;
- `pode executar = sim`.

Se `SnapshotAprovacaoCompra` ja estiver preenchido ou o item tiver sido alterado por fluxo automatico, parar e criar novo item `V2.7A-TESTE-002`.

## Configuracao Manual

No Property Pane da webpart em pagina restrita:

- `habilitarEscritaOperacionalV27A = true`;
- `modoTesteOperacionalV27A = true`;
- `permitirSomenteItensTesteV27A = true`;
- `marcadorTesteOperacionalV27A = V2.7A-TESTE`;
- `exigirConfirmacaoManualV27A = true`;
- `confirmacaoManualV27A = CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC`;
- `itemTesteOperacionalIdV27A = 11`, se elegivel;
- `acaoTesteOperacionalV27A = CriarSnapshotAprovacaoOperacional`;
- `valorTesteOperacionalV27A = 6720`;
- `observacaoTesteOperacionalV27A = V2.7A-TESTE - teste operacional restrito`.

## Pre-validacao

Antes do clique, abrir `DevTools > Network > Fetch/XHR`, ativar `Preserve log` e limpar requisicoes.

Durante a pre-validacao:

- permitido: GET;
- proibido: POST, MERGE, PATCH, DELETE.

O painel deve exibir:

- item ID;
- marcador;
- status atual;
- snapshot atual;
- campo de aprovacao necessaria usado;
- valor bruto de aprovacao necessaria;
- aprovacao necessaria normalizada como `Sim`;
- valor analisado;
- regra/alçada;
- aprovador base/efetivo;
- snapshot previsto;
- vinculo previsto;
- historico previsto;
- alertas;
- `pode executar`.

## Ajuste V2.7A.3A

Na repeticao da pre-validacao apos o pacote corrigido, conferir especificamente:

- campo usado: preferencialmente `Aprova_x00e7__x00e3_oNecess_x00e`;
- valor bruto coerente com `Sim` ou verdadeiro;
- valor normalizado: `Sim`;
- ausencia de `APROVACAO_NAO_NECESSARIA`;
- ausencia de `APROVACAO_NECESSARIA_NAO_RESOLVIDA`.

Se qualquer alerta de aprovacao necessaria permanecer, nao executar a escrita e retornar a evidencia da tela.

## Execucao Autorizada

Executar uma unica vez somente se:

- `pode executar = sim`;
- item validado igual ao item configurado;
- marcador confirmado;
- `SnapshotAprovacaoCompra` vazio;
- confirmacao final digitada exatamente igual.

Durante a execucao, permitir somente:

- GET de revalidacao;
- POST para criar snapshot;
- MERGE/POST override para preencher `SnapshotAprovacaoCompra`;
- POST para historico operacional.

Bloquear e parar se aparecer:

- PATCH;
- DELETE;
- escrita em lista fora do escopo;
- alteracao de item diferente do configurado;
- status alterado para aprovada;
- pedido, NF ou pagamento criado;
- Power Automate iniciado;
- erro `400`, `401`, `403` ou `500`.

## Auditoria Pos-teste

Registrar manualmente:

- snapshot criado;
- ID do snapshot;
- vinculo `SnapshotAprovacaoCompra` no item de teste;
- historico operacional;
- chamadas de rede observadas;
- confirmacao de ausencia de PATCH/DELETE;
- confirmacao de ausencia de alteracao em item real;
- flags desligadas;
- pagina republicada com flags desligadas;
- Power Automate nao iniciado.

## Encerramento

Depois do teste:

- desligar `habilitarEscritaOperacionalV27A`;
- desligar `modoTesteOperacionalV27A`;
- limpar confirmacao manual;
- republicar pagina;
- nao prosseguir para pedido, NF, pagamento ou Power Automate na mesma rodada.

## Resultado Manual V2.7A.3B

Data-base: 2026-06-09

Leon executou manualmente a acao controlada e confirmou:

| Conferencia | Resultado |
| --- | --- |
| Acao | `CriarSnapshotAprovacaoOperacional` |
| Item | `11` |
| Marcador | `V2.7A-TESTE` |
| Snapshot criado | ID `3` |
| Snapshot title | `SNAP-V2.7A-TESTE-11-20260609025123` |
| Campo vinculado | `SnapshotAprovacaoCompra` |
| Status anterior | `Aguardando aprovação` |
| Status posterior | `Aguardando aprovação` |
| Historico operacional criado | Sim |
| HTTP escrita | `204` |
| Alertas de execucao | `-` |
| `PATCH`/`DELETE` no Network | Nao |
| Item diferente do 11 alterado | Nao |
| Flags V2.7A desligadas | Sim |
| Pagina republicada com flags desligadas | Sim |
| Power Automate iniciado | Nao |

Conclusao: V2.7A.3 validada manualmente para snapshot operacional criado e vinculado em item de teste, sem liberacao ampla de producao.

Pedido, NF e pagamento nao foram testados nesta etapa.
