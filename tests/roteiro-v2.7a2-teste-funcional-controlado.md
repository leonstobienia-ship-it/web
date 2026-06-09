# Roteiro V2.7A.2 - Teste Funcional Controlado

Data: 2026-06-08

## Objetivo

Orientar Leon a executar manualmente o primeiro teste controlado da escrita operacional restrita V2.7A, limitado a item com marcador `V2.7A-TESTE`, sem Power Automate e sem uso operacional amplo.

Codex nao deve conectar ao SharePoint, publicar pacote, alterar tenant/listas/dados, executar escrita ou iniciar Power Automate.

## Pre-condicoes

- Branch local `dev/v2.3-sharepoint-integracao`.
- Base V2.7A presente no commit `2f39ba3`.
- Revalidacao local registrada no commit `31d1adc`.
- Pacote local V2.7A disponivel em `sharepoint/solution/enac-sistema-spfx.sppkg`.
- Pagina restrita de teste disponivel no tenant.
- Permissoes administrativas V2.6B.4D preservadas.
- Dados `V2.3B-TESTE` e `V2.6A-TESTE` preservados.
- Power Automate fora do escopo.

## Item De Teste

Criar manualmente um item novo na Lista 02, sem copiar item existente.

| Campo | Valor |
| --- | --- |
| Numero da Requisicao | `V2.7A-TESTE-001` |
| Codigo da Obra | `V2.7A-TESTE` |
| Centro de Custo | `V2.7A-TESTE` |
| Tipo da Solicitacao | `Material` |
| Descricao da Solicitacao | `V2.7A-TESTE - Validacao controlada da escrita operacional restrita` |
| Observacoes | `V2.7A-TESTE - Item limpo para teste operacional restrito` |
| Status inicial | `Aberta` ou `Recebida` |
| Aprovacao Necessaria | `Sim` |
| SnapshotAprovacaoCompra | vazio |
| Quantidade | `1` |
| Unidade | `un` |
| Valor analisado | `R$ 6.720,00`, se compativel |

## Primeira Acao Recomendada

Executar somente uma acao:

`Aberta/Recebida -> Aguardando aprovacao`

Essa e a Opcao A recomendada para a primeira escrita operacional porque valida item de teste, permissao, transicao de status, escrita controlada na Lista 02 e historico, sem avancar para pedido, nota fiscal ou pagamento.

Se a pagina publicada ainda nao expuser essa transicao de forma segura, parar e usar apenas a Opcao B em rodada autorizada: criar snapshot operacional de aprovacao para o item `V2.7A-TESTE`, sem vincular automaticamente ao item e sem continuar o fluxo.

## Flags Da Webpart

Configurar manualmente no Property Pane da webpart em pagina restrita:

- `habilitarEscritaOperacionalV27A = true`;
- `modoTesteOperacionalV27A = true`;
- `permitirSomenteItensTesteV27A = true`;
- `marcadorTesteOperacionalV27A = V2.7A-TESTE`;
- `exigirConfirmacaoManualV27A = true`;
- `confirmacaoManualV27A = CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC`.

Depois do teste:

- desligar `habilitarEscritaOperacionalV27A`;
- desligar `modoTesteOperacionalV27A`;
- manter `permitirSomenteItensTesteV27A = true`;
- limpar `confirmacaoManualV27A`;
- republicar a pagina com flags desligadas.

## Pre-validacao

Antes de clicar em qualquer acao de escrita, confirmar:

| Conferencia | Resultado esperado |
| --- | --- |
| Usuario atual | Exibido/reconhecido pela webpart |
| Perfil | Reconhecido em `ENAC Usuarios Perfis` |
| Permissao | Acao permitida para o perfil |
| Item de teste | Item `V2.7A-TESTE-001` encontrado |
| Marcador | `V2.7A-TESTE` presente no item/payload |
| Status atual | `Aberta` ou `Recebida` |
| Transicao pretendida | `Aguardando aprovacao` |
| Campos obrigatorios | Presentes |
| SnapshotAprovacaoCompra | Vazio ou estado esperado |
| Historico previsto | Indicado antes da escrita |
| Confirmacao manual | Exigida e correta |

Se qualquer resultado divergir, parar.

## Ajuste V2.7A.2A - Item Especifico

A validacao generica de flags/perfil nao libera escrita.

Para repetir o teste manual, preencher no Property Pane:

- `itemTesteOperacionalIdV27A = 11`;
- `acaoTesteOperacionalV27A = AtualizarStatusRequisicao`;
- `statusDestinoTesteOperacionalV27A = Aguardando aprovação`;
- `observacaoTesteOperacionalV27A = V2.7A-TESTE - teste operacional restrito`;
- `confirmacaoManualV27A = CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC`.

O painel deve mostrar explicitamente:

- item lido `11`;
- marcador `V2.7A-TESTE` confirmado;
- status atual do item;
- transicao para `Aguardando aprovação`;
- campo `StatusdaRequisi_x00e7__x00e3_o`;
- valor anterior e valor novo previstos;
- historico previsto;
- `pode executar = sim`.

Se o botao aparecer sem esses dados, parar e nao executar.

## Ajuste V2.7A.2B - Leitura Por GUID

Ao repetir a pre-validacao do item 11, conferir no painel:

- lista: `Lista 02 — Requisições de Compra (0a204b87-b9a1-4d16-8654-55567a62ed01)`;
- modo de acesso: `GUID`;
- item solicitado: `11`;
- HTTP da leitura: sucesso;
- campos retornados: devem incluir `Title`, `C_x00f3_digodaObra`, `CentrodeCusto`, `TipodaSolicita_x00e7__x00e3_o`, `Descri_x00e7__x00e3_odaSolicita_`, `StatusdaRequisi_x00e7__x00e3_o`, `Observa_x00e7__x00f5_es`, `Quantidade`, `Unidade`;
- campos com marcador: pelo menos um campo contendo `V2.7A-TESTE`;
- status atual: `Recebida`;
- status destino: `Aguardando aprovação`;
- transicao: `permitida`;
- pode executar: `sim`.

Se o HTTP nao indicar sucesso, se o campo de status vier vazio ou se nenhum campo trouxer `V2.7A-TESTE`, parar.

## Ajuste V2.7A.2C - Execucao De Status

Se a pre-validacao exibir `pode executar = sim`, a execucao manual deve ser feita uma unica vez.

Antes do clique, confirmar novamente:

- item: `11`;
- acao: `AtualizarStatusRequisicao`;
- status atual: `Recebida`;
- status destino: `Aguardando aprovação`;
- campo: `StatusdaRequisi_x00e7__x00e3_o`;
- marcador: confirmado;
- confirmacao final: `CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC`.

Resultado esperado apos o clique:

- status atualizado para `Aguardando aprovação`;
- historico operacional registrado;
- painel exibindo item, campo, valor anterior, valor novo, historico criado e HTTP da escrita;
- nenhuma chamada para pedido, NF, pagamento ou snapshot;
- nenhuma chamada `PATCH` ou `DELETE`;
- Power Automate nao iniciado.

Se aparecer bloqueio, registrar os codigos exibidos e nao repetir a execucao sem nova revisao.

## DevTools

Abrir antes da pre-validacao:

`DevTools > Network > Fetch/XHR`

Ativar:

- `Preserve log`;
- `Disable cache`.

Durante pre-validacao:

- permitido: `GET`;
- proibido: `POST`, `MERGE`, `PATCH`, `DELETE`.

Durante a escrita autorizada:

- permitido: `GET` de apoio e apenas o `POST`/`MERGE` indispensavel para a acao;
- proibido: `DELETE`;
- proibido: `PATCH`, salvo decisao tecnica posterior documentada;
- proibidas chamadas fora das listas previstas.

## Criterios De Parada

Parar imediatamente se:

- o item nao contiver `V2.7A-TESTE`;
- usuario ou perfil nao forem reconhecidos;
- a permissao for negada;
- a transicao estiver incorreta;
- campo obrigatorio estiver ausente;
- ocorrer escrita durante a pre-validacao;
- aparecer `POST`/`MERGE` em lista nao prevista;
- aparecer `PATCH` ou `DELETE`;
- houver erro `400`, `401`, `403` ou `500`;
- Power Automate iniciar;
- qualquer item real/operacional for alterado.

## Auditoria Pos-teste

Registrar manualmente:

- item de teste usado;
- usuario/perfil;
- flags configuradas;
- acao executada;
- chamadas de rede observadas;
- status final do item, se aplicavel;
- historico criado, se aplicavel;
- snapshot criado, se aplicavel;
- confirmacao de que nao houve alteracao fora de `V2.7A-TESTE`;
- confirmacao de que flags foram desligadas;
- confirmacao de que a pagina foi republicada com escrita desligada;
- confirmacao de que Power Automate nao foi iniciado.

## Resultado Esperado

O teste so deve ser considerado aprovado se uma unica acao controlada for executada, restrita ao item `V2.7A-TESTE-001`, com rede coerente, sem erros, sem `PATCH/DELETE`, sem alteracao de item real e com flags desligadas ao final.

## Resultado Manual V2.7A.2D

Data-base: 2026-06-08

Leon executou manualmente a validacao da V2.7A.2C e confirmou:

| Conferencia | Resultado |
| --- | --- |
| Item 11 com status final `Aguardando aprovação` | Sim |
| Historico operacional criado | Sim |
| `PATCH`/`DELETE` no Network | Nao |
| Item diferente do 11 alterado | Nao |
| Flags V2.7A desligadas | Sim |
| Pagina republicada com flags desligadas | Sim |

Detalhes registrados:

- pacote usado: `sharepoint/solution/enac-sistema-spfx.sppkg`;
- commit tecnico validado: `0846fcb`;
- item de teste: `11`;
- marcador: `V2.7A-TESTE`;
- acao: `AtualizarStatusRequisicao`;
- campo alterado: `StatusdaRequisi_x00e7__x00e3_o`;
- valor anterior: `Recebida`;
- valor novo: `Aguardando aprovação`;
- HTTP escrita: `204`;
- mensagem de sucesso: `Executada: Status da requisição atualizado com controle V2.7A.2C e histórico registrado.`;
- alertas de execucao: `-`.

Conclusao: V2.7A.2C validada manualmente para escrita operacional restrita de status em item de teste, sem liberacao ampla de producao.

Pedido, NF, pagamento, snapshot e Power Automate permanecem fora do escopo validado.
