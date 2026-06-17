# ERP - Central de Tarefas e Aprovacoes

## Finalidade

A Central de Tarefas e Aprovacoes consolida itens acionaveis do ERP ENAC em uma unica visao operacional. Ela organiza tarefas por usuario, perfil, prioridade, prazo, modulo de origem e status, sem executar a decisao final dos modulos de origem.

## Modelo de dados

Tarefas derivadas sao calculadas por queries agregadoras sobre tabelas ja existentes.

Tarefas manuais auxiliares usam:

- `central_tarefas_manuais`;
- `central_tarefas_manuais_historico`;
- `auditoria_eventos`.

## Fontes derivadas

As principais fontes sao:

- riscos e pendencias ativas;
- alertas do dashboard convertidos em pendencias;
- solicitacoes de compra pendentes;
- cotacoes pendentes;
- pedidos de compra aguardando decisao;
- notas fiscais de entrada pendentes ou divergentes;
- contas a pagar pendentes, divergentes ou bloqueadas;
- programacoes de pagamento aguardando aprovacao, liberacao ou conferencia;
- aditivos contratuais pendentes;
- orcamentos em revisao;
- planejamento executivo ativo ou em revisao;
- medicoes aguardando aprovacao;
- pedidos de faturamento aguardando acao.

## Criterio de atraso

Uma tarefa e atrasada quando:

- possui `prazo`;
- o prazo e menor que a data atual;
- o status ainda nao e final.

Status finais considerados na central incluem `CONCLUIDA`, `CANCELADA`, `RESOLVIDA`, `REPROVADO` e `DEVOLVIDO`.

## Criterio de criticidade

Uma tarefa e critica quando:

- prioridade e `CRITICA`;
- esta atrasada;
- possui bloqueio de alcada;
- possui divergencia pendente;
- possui bloqueio de liberacao, conferencia ou baixa.

## Perfis e alçadas

A central mostra tarefas por usuario e por perfil. Quando a acao depende de aprovacao ou alcada, a central aponta o perfil responsavel estimado e o modulo de origem.

A regra de aprovacao continua no modulo de origem. A central nao substitui nem contorna `alcadas_aprovacao`.

## Tarefas manuais

Fluxo:

```text
ABERTA -> EM_ANDAMENTO -> CONCLUIDA
ABERTA | EM_ANDAMENTO -> CANCELADA
```

`marcar-vista` nao altera o status, apenas registra leitura da tarefa manual.

Toda mudanca de estado manual grava:

- historico em `central_tarefas_manuais_historico`;
- evento em `auditoria_eventos`.

## Limites

- Nao ha pagamento.
- Nao ha baixa nova.
- Nao ha integracao bancaria.
- Nao ha CNAB.
- Nao ha boleto.
- Nao ha NFS-e real.
- Nao ha prefeitura.
- Nao ha cobranca real.
- Nao ha SharePoint, Entra ou Power Automate reais.
- Nao ha `DELETE` fisico.
