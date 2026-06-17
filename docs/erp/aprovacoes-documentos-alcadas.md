# Aprovações por Alçada em Documentos

## Regra geral

A V3.5C usa as regras locais da tabela `alcadas_aprovacao` para decidir aprovações em documentos operacionais. Cada decisão informa `usuario_id`, módulo, tipo de documento, ação, valor, obra e centro de custo.

## Documentos cobertos

| Documento | Módulo | Tipo | Ações |
| --- | --- | --- | --- |
| Solicitação de Compra | `solicitacoes-compra` | `SOLICITACAO_COMPRA` | `aprovar_tecnico`, `aprovar_diretoria` |
| Cotação | `cotacoes` | `COTACAO` | `aprovar_tecnico`, `aprovar_diretoria` |
| Pedido de Compra | `pedidos-compra` | `PEDIDO_COMPRA` | `aprovar_tecnico`, `aprovar_diretoria` |
| Nota Fiscal de Entrada | `notas-fiscais-entrada` | `NOTA_FISCAL_ENTRADA` | `aprovar_tecnico`, `aprovar_diretoria` |
| Conta a Pagar | `contas-pagar` | `CONTA_PAGAR` | `aprovar_tecnico`, `aprovar_diretoria` |

## Comportamento operacional

- Solicitação aprovada por alçada avança para `APROVADA_PARA_COTACAO`.
- Cotação aprovada fica apta a gerar Pedido de Compra.
- Pedido só pode ir para `EMITIDO` se `aprovacao_status` for `APROVADO_TECNICO` ou `APROVADO_DIRETORIA`.
- Nota Fiscal de Entrada aprovada por alçada vai para `APROVADA`.
- Conta a Pagar aprovada internamente vai de `PROVISIONADA` para `APROVADA`.

## Auditoria

As decisões são registradas em `auditoria_eventos` com entidade do documento, ação executada e payload com usuário, módulo, tipo, valor, resultado e motivo.

Bloqueios por alçada atualizam o documento para `BLOQUEADO_ALCADA` em `aprovacao_status` e preservam `bloqueio_alcada_motivo`.

## Fora do escopo

- Pagamento, baixa e conciliação.
- Programação ou liberação bancária.
- Integração bancária, CNAB ou API.
- SharePoint, Entra e automações.
- `DELETE` físico.
