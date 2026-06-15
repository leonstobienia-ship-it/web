# Checklist V3.5A - Alias Historico

Este checklist foi mantido como alias historico da primeira implementacao local.

Checklist canonico atual:

```text
tests/checklist-v3.5a-nota-fiscal-entrada-contas-pagar-inicial.md
```

Fluxo canonico da V3.5A:

- `/notas-fiscais-entrada`.
- NF: `RASCUNHO -> CONFERIDA -> APROVADA -> PROVISIONADA`.
- Divergencia: `RASCUNHO -> DIVERGENTE -> RASCUNHO`.
- Conta a pagar: `PROVISIONADA`.
- Sem programacao bancaria, pagamento, baixa, SharePoint, Entra, automacoes, banco de producao ou `DELETE` fisico.
