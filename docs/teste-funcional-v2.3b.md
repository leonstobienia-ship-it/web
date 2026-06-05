# Teste funcional controlado V2.3B

## Objetivo

Validar, com dados mínimos e marcados como `V2.3B-TESTE`, se a estrutura SharePoint provisionada na V2.3A suporta o fluxo de aprovação de compras: usuários/perfis, alçadas, cálculo da regra aplicável, snapshot, vínculo na requisição e histórico administrativo.

## Pré-requisitos

- Provisionamento estrutural V2.3A concluído.
- App readonly separado preservado para auditorias.
- App de provisionamento/teste separado disponível para dry-run e eventual carga controlada.
- Nenhuma execução de Power Automate nesta etapa.
- Nenhuma ampliação de interface, protótipo ou SPFx nesta etapa.

## Apps usados

- Readonly: auditoria estrutural e conferências sem escrita.
- Provisionamento/teste: execução controlada futura do script de teste, somente com confirmação textual.

## Dados mínimos

Os dados de teste usam marcador `V2.3B-TESTE`.

- Usuários lógicos: Leon, Gustavo, Matheus e Kemilly.
- Perfis reais em `PerfilPrincipal`: Leon = `Diretoria`; Gustavo = `Planejamento`; Matheus = `Compras e Financeiro Operacional`; Kemilly = `Cotações e Contratos`.
- Alçadas de compra: até R$ 20.000,00 com Gustavo; acima de R$ 20.000,00 com Leon.
- Requisição de teste: preferencialmente criada manualmente ou selecionada por `itemId`.
- Snapshot: `SNAP-V2.3B-TESTE-001`.
- Histórico: registro de carga inicial controlada.

Não usar dados sensíveis, valores reais de contratos, fornecedores reais ou documentos reais. E-mails/contas Microsoft 365 devem ficar em `config/teste-funcional-v2.3b.local.json`, que não é versionado.

## Ordem dos testes

1. Executar o dry-run do script `06`.
2. Revisar listas, campos críticos, choices e plano de carga.
3. Criar manualmente uma requisição de teste na Lista 02 ou informar `itemId` no arquivo local.
4. Revisar o dry-run do script `07`.
5. Somente após autorização, executar `07` com `-Apply -ConfirmTeste "TESTAR-V2.3B-ENAC"`.
6. Executar auditoria readonly `08`.
7. Revisar `sharepoint/auditoria-teste-funcional-v2.3b.md`.

## Critérios de sucesso

- Usuários de teste existem e estão ativos.
- Alçadas de teste existem e resolvem `Material / Compra / R$ 6.720,00` para Gustavo.
- Snapshot de teste existe.
- `SnapshotAprovacaoCompra` está vinculado à requisição de teste.
- Histórico de configuração de teste existe.
- Nenhum dado operacional real é exposto no relatório.

## Critérios de parada

- Choice planejada não existe no SharePoint.
- Campo obrigatório inesperado impede carga controlada.
- Requisição de teste não foi criada/identificada.
- Lookup aponta para destino divergente.
- Qualquer risco de alterar item real fora do marcador `V2.3B-TESTE`.

## Rollback lógico

Não excluir automaticamente listas, colunas ou itens. Se a carga de teste precisar ser desconsiderada, desativar regras de teste e registrar a decisão no histórico. Exclusões manuais só devem ocorrer em rodada específica e autorizada.

## Resultado executado

Data operacional: 2026-06-04.

O provisionamento estrutural V2.3A já estava concluído antes do teste. Leon executou o teste funcional controlado V2.3B com dados marcados como `V2.3B-TESTE` e, em seguida, executou a auditoria readonly `scripts/sharepoint/08-auditoria-teste-funcional-v2.3b-readonly.ps1`.

Resultado da auditoria registrada em `sharepoint/auditoria-teste-funcional-v2.3b.md`:

- usuários/perfis de teste: OK;
- alçadas de teste até R$ 20.000,00 e acima de R$ 20.000,00: OK;
- snapshot `SNAP-V2.3B-TESTE-001`: OK;
- histórico `V2.3B-TESTE`: OK;
- Lista 02 validada por GUID: OK.

Ressalva: o relatório local não exibe explicitamente o item da requisição de teste nem o valor gravado em `SnapshotAprovacaoCompra`.

Status final: V2.3B aprovada com ressalvas. Power Automate ainda não foi iniciado. A próxima etapa deve ser preparar integração funcional real/webpart ou automação controlada, conforme decisão de Leon.
