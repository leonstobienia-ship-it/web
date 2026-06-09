# Roteiro V2.7A.4 - Criar Pedido De Compra

Data: 2026-06-09

## Objetivo

Registrar a analise previa para a acao `CriarPedidoCompra` e impedir teste manual em estado de fluxo incorreto.

Codex nao deve conectar ao SharePoint, publicar pacote, alterar tenant/listas/dados, executar escrita ou iniciar Power Automate.

## Decisao

Nao executar `CriarPedidoCompra` no item `11` enquanto ele estiver em:

`Aguardando aprovação`

A regra atual exige status:

- `Aprovada`; ou
- `Aprovada para compra`.

## Lista De Pedido Mapeada

| Item | Valor |
| --- | --- |
| Lista real | `Lista 03 — Pedidos de Compra` |
| GUID | `18ca132a-c36a-42aa-9968-d87ecd547a79` |
| Campos usados no metodo legado | `Title`, `SolicitacaoId`, `Fornecedor`, `ValordoPedido`, `DatadoPedido`, `StatusdoPedido` |

Ressalva: campos obrigatorios reais e choices da Lista 03 ainda precisam ser confirmados em leitura antes de qualquer escrita.

## Item 11

O item `11` so podera ser usado para pedido se, em rodada futura, a pre-validacao confirmar:

- marcador `V2.7A-TESTE`;
- `SnapshotAprovacaoCompra` vinculado ao snapshot ID `3`;
- status `Aprovada` ou `Aprovada para compra`;
- nenhum pedido anterior vinculado;
- dados obrigatorios da requisicao presentes;
- usuario/perfil com permissao `PodeEmitirPedido`;
- Lista 03 e campos reais resolvidos.

## Criterios De Parada

Parar se:

- status continuar `Aguardando aprovação`;
- snapshot estiver ausente;
- Lista 03 ou campos obrigatorios nao forem confirmados;
- ja existir pedido para a requisicao;
- perfil nao tiver permissao;
- aparecer `PATCH` ou `DELETE`;
- Power Automate iniciar;
- qualquer item real for alterado.

## Proxima Rodada Recomendada

Preparar primeiro `AprovarCompra` controlado, uma acao separada, para levar item de teste de `Aguardando aprovação` para `Aprovada` ou `Aprovada para compra`.

Depois, retomar o roteiro de `CriarPedidoCompra`.
