# ERP - Riscos e Pendencias Operacionais

## Finalidade

O dominio de riscos e pendencias registra pontos de atencao operacionais da ENAC com responsavel, prazo, prioridade, status, comentarios, historico e resolucao. Ele recebe entradas manuais e pendencias sugeridas a partir de alertas do dashboard executivo.

## Entidade principal

Tabela `riscos_pendencias`:

- identifica a pendencia por `codigo`;
- classifica por `tipo` e `prioridade`;
- controla `status`;
- define `responsavel_id` e `prazo`;
- guarda vinculos com entidades operacionais;
- registra `origem`, incluindo `MANUAL`, `DASHBOARD_ALERTA` ou `OPERACIONAL`;
- guarda resolucao, bloqueio e cancelamento logico.

## Fluxo

```text
ABERTA -> EM_ANDAMENTO -> RESOLVIDA
ABERTA -> BLOQUEADA -> EM_ANDAMENTO -> RESOLVIDA
ABERTA/EM_ANDAMENTO/BLOQUEADA -> CANCELADA
ABERTA/EM_ANDAMENTO/BLOQUEADA -> AGUARDANDO_TERCEIRO
```

`RESOLVIDA` e `CANCELADA` sao estados finais para edicao operacional comum.

## Vínculos operacionais

A pendencia pode apontar para:

- `obras`;
- `clientes`;
- `contratos_obra`;
- `contratos_obra_aditivos`;
- `orcamentos_obra`;
- `solicitacoes_compra`;
- `cotacoes`;
- `pedidos_compra`;
- `notas_fiscais_entrada`;
- `contas_pagar`;
- `programacoes_pagamento`;
- `medicoes_obra`;
- `pedidos_faturamento`;
- alerta do dashboard executivo.

Esses vinculos servem para rastreabilidade. A V3.11 nao altera automaticamente o documento de origem.

## Comentarios e historico

Comentarios ficam em `riscos_pendencias_comentarios`.

Historico fica em `riscos_pendencias_historico` e registra:

- acao;
- status anterior;
- status novo;
- usuario;
- comentario;
- payload de contexto.

Eventos tambem sao gravados em `auditoria_eventos`.

## Conversao de alertas

`POST /riscos-pendencias/gerar-de-alerta` cria uma pendencia com origem `DASHBOARD_ALERTA`.

Mapeamento inicial:

- alerta de margem -> tipo `MARGEM`;
- alerta de faturamento -> tipo `FATURAMENTO`;
- alerta de medicao -> tipo `MEDICAO`;
- alerta de orcamento ou planejamento -> tipo `ORCAMENTO`;
- alerta de contrato -> tipo `CONTRATO`;
- alerta de contas ou programacao -> tipo `FINANCEIRO`;
- demais alertas -> tipo `OUTROS`.

Severidade `CRITICO` vira prioridade `CRITICA`; `ALTO` vira `ALTA`; `BAIXO` vira `BAIXA`; demais severidades viram `MEDIA`.

## Segurança operacional

- Nao existe `DELETE` fisico.
- Cancelamento e bloqueio sao logicos.
- A etapa nao executa pagamento.
- A etapa nao baixa conta.
- A etapa nao cria programacao de pagamento.
- A etapa nao cria conta a pagar.
- A etapa nao gera CNAB.
- A etapa nao integra banco.
- A etapa nao emite NFS-e real.
- A etapa nao integra prefeitura.
- A etapa nao gera boleto.
- A etapa nao usa SharePoint, Entra ou Power Automate reais.
