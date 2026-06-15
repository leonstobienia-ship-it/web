# Solicitações de Compra ERP ENAC

## Papel no ERP

Solicitação de Compra é o ponto inicial do fluxo de compras operacional. Na V3.4A, ela registra a demanda da obra ou área, classifica por centro de custo e prioridade, detalha itens e permite o fluxo inicial de análise.

## Fonte de dados

Na V3.4A, a fonte é exclusivamente o PostgreSQL local:

```text
enac_erp_dev
```

SharePoint permanece fora da operação deste módulo. A camada documental futura poderá referenciar solicitações, mas nenhum arquivo ou item SharePoint é criado nesta etapa.

## Entidades

### `solicitacoes_compra`

Representa o cabeçalho da demanda.

Campos de negócio:

- `company_id`
- `obra_id`
- `centro_custo_id`
- `solicitante_id`
- `codigo`
- `titulo`
- `descricao`
- `prioridade`
- `data_necessidade`
- `status`
- `valor_estimado_total`
- `observacoes`

### `solicitacoes_compra_itens`

Representa os itens solicitados.

Campos de negócio:

- `solicitacao_id`
- `descricao`
- `unidade`
- `quantidade`
- `valor_estimado_unitario`
- `valor_estimado_total`
- `observacoes`
- `ordem`
- `status`

O campo `status` do item é técnico nesta etapa e evita `DELETE` físico durante edição.

## Status

| Status | Uso |
|---|---|
| `RASCUNHO` | Solicitação editável antes de envio |
| `ENVIADA` | Solicitação enviada para triagem |
| `EM_ANALISE` | Solicitação em análise operacional |
| `DEVOLVIDA` | Solicitação devolvida para ajuste |
| `CANCELADA` | Solicitação encerrada sem continuidade |
| `APROVADA_PARA_COTACAO` | Reservado para etapa futura |

Transições implementadas:

```text
RASCUNHO -> ENVIADA
ENVIADA -> EM_ANALISE
EM_ANALISE -> DEVOLVIDA
DEVOLVIDA -> RASCUNHO
RASCUNHO -> CANCELADA
ENVIADA -> CANCELADA
EM_ANALISE -> CANCELADA
```

## Regras atuais

- `company_id`, `obra_id`, `centro_custo_id`, `solicitante_id`, `titulo`, `descricao`, `prioridade` e `data_necessidade` são obrigatórios.
- A solicitação precisa ter pelo menos 1 item.
- `quantidade` deve ser maior que zero.
- `valor_estimado_unitario` deve ser maior ou igual a zero.
- O total do item é calculado pela API.
- O total da solicitação é a soma dos itens ativos.
- Obra, centro de custo e solicitante devem pertencer à mesma empresa.
- Solicitação `CANCELADA` não pode ser editada.
- Solicitação `APROVADA_PARA_COTACAO` não pode ser editada.
- Transições ilegais retornam `409`.
- Não há exclusão física.

## Fora do escopo V3.4A

- Cotação.
- Pedido de compra.
- Nota fiscal.
- Contas a pagar.
- Aprovação por alçada.
- Power Automate.
- Escrita SharePoint.
- Alteração de permissões Entra.
- Banco de produção.
