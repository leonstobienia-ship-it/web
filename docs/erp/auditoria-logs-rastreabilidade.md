# ERP - Auditoria, Logs e Rastreabilidade

## Finalidade

A Auditoria Geral consolida a consulta administrativa dos eventos registrados em `auditoria_eventos`. A tela e os endpoints sao read-only e existem para rastrear decisoes, bloqueios, transicoes de status e eventos operacionais criticos.

## Fonte de dados

Fonte principal:

- `auditoria_eventos`.

Campos base:

- `id`;
- `company_id`;
- `entidade`;
- `entidade_id`;
- `acao`;
- `payload`;
- `created_at`;
- `created_by`.

Os modulos continuam gravando auditoria por suas proprias regras. A V3.13 apenas consulta e normaliza esses eventos.

## Filtros

Filtros disponiveis:

- periodo;
- usuario;
- modulo;
- acao;
- entidade;
- entidade_id;
- obra;
- contrato;
- centro de custo;
- severidade;
- resultado;
- busca textual.

## Normalizacao de modulo

Quando o payload possui `modulo`, esse valor e usado. Caso contrario, a entidade e mapeada para o modulo operacional:

- `solicitacao_compra` -> `solicitacoes-compra`;
- `cotacao` -> `cotacoes`;
- `pedido_compra` -> `pedidos-compra`;
- `nota_fiscal_entrada` -> `notas-entrada`;
- `conta_pagar` -> `contas-pagar`;
- `programacao_pagamento` -> `programacoes-pagamento`;
- `contrato_obra`, itens e aditivos -> `contratos-obra`;
- `orcamento_obra` e planejamento -> `orcamentos-planejamento`;
- `medicao_obra` e pedido de faturamento -> `medicoes-faturamento`;
- `risco_pendencia` -> `riscos-pendencias`;
- `central_tarefa_manual` -> `central-tarefas`;
- `documento_anexo` -> `documentos`;
- usuarios, perfis, escopos e alcadas -> `administracao`.

## Severidade

Classificacao gerencial:

- `CRITICA`: bloqueio por alcada, decisao negada ou payload com `BLOQUEADO_ALCADA`;
- `ALTA`: reprovacao, cancelamento, estorno e baixa manual existente;
- `MEDIA`: aprovacao, liberacao, conferencia e submissao;
- `INFO`: demais registros.

## Resultado

Resultado normalizado:

- `BLOQUEADO`;
- `APROVADO`;
- `REPROVADO`;
- `CANCELADO`;
- `DEVOLVIDO`;
- `LIBERADO`;
- `CONFERIDO`;
- `BAIXA_MANUAL`;
- `ESTORNO_BAIXA`;
- `REGISTRADO`.

## Timeline por entidade

`GET /auditoria/entidade/:tipo/:id` retorna a trilha cronologica de uma entidade especifica, ordenada por `created_at` crescente.

`GET /auditoria/eventos/:id` retorna o evento e a timeline da sua entidade quando `entidade_id` existe.

## Imutabilidade

Regras:

- logs nao sao editaveis pela API V3.13;
- logs nao sao deletaveis pela API V3.13;
- nao existe endpoint `DELETE`;
- nao ha botao de edicao/exclusao no frontend;
- eventos antigos nao sao sobrescritos ou mascarados.

## Limites

- Nao ha pagamento.
- Nao ha baixa nova.
- Nao ha CNAB.
- Nao ha integracao bancaria.
- Nao ha boleto.
- Nao ha NFS-e real.
- Nao ha prefeitura.
- Nao ha SharePoint, Entra ou Power Automate reais.
- Nao ha `DELETE` fisico.

## V3.14 - Documentos e anexos

A V3.14 registra eventos de `documento_anexo` para criar, editar, substituir e inativar referencias documentais. Esses eventos mantem os marcadores `sharepoint_real = false` e `upload_real = false` no payload quando aplicavel.
