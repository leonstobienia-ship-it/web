# Roteiro V2.7A.7 - Programar Pagamento

Data: 2026-06-09

## Objetivo

Preparar a validacao futura de `ProgramarPagamento`, iniciando por auditoria readonly das listas financeiras candidatas.

Codex nao executa teste no tenant, nao conecta ao SharePoint, nao publica pacote, nao altera listas/dados e nao executa escrita operacional.

## Premissas Confirmadas

- Requisicao origem `Lista 02-11` aprovada para compra.
- Snapshot `3` preservado.
- Pedido de compra `Lista 03-3` criado.
- NF recebida `Lista 04-4` criada e validada manualmente.
- NF tem numero `NF-V2.7A-TESTE-001`.
- NF tem pedido `PED-V2.7A-TESTE-11-20260609125401`.
- NF tem valor funcional `6720`.
- NF tem fornecedor e obra preenchidos.
- NF esta com status de conferencia `Recebida`.
- Pagamento ainda nao foi criado.
- Power Automate nao foi iniciado.

## Auditoria Readonly Manual

Executar:

```powershell
pwsh .\scripts\sharepoint\13-auditoria-lista05-contas-pagar-readonly.ps1 `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<app-id-autorizado>" `
  -AuthMode DeviceLogin `
  -Target Both
```

Revisar:

- `reports/lista05-contas-pagar-fields-readonly.json`
- `reports/lista05-contas-pagar-fields-readonly.md`
- `reports/lista10-programacao-financeira-fields-readonly.json`
- `reports/lista10-programacao-financeira-fields-readonly.md`

## Cenarios A Conferir

1. Se a Lista 05 for o destino de contas a pagar:
   - confirmar se a futura escrita deve criar item ali ou apenas conta a pagar contabil.

2. Se a Lista 10 for o destino de programacao:
   - confirmar se a futura escrita deve criar programacao de pagamento ali.

3. Se houver dependencia entre Lista 05 e Lista 10:
   - manter `ProgramarPagamento` bloqueada ate definir a ordem correta.

## Pre-validacao Futura

A pre-validacao deve usar somente GET e confirmar:

- NF `Lista 04-4` existe;
- status da NF elegivel para programar;
- valor = `6720`;
- vencimento = `16 de junho`;
- fornecedor e obra preenchidos;
- lista financeira destino confirmada;
- campos obrigatorios mapeados;
- nao existe pagamento/programacao para a NF;
- usuario/perfil pode programar pagamento;
- historico previsto;
- `podeExecutar = sim` somente se tudo passar.

## Criterios De Parada

Parar se:

- lista destino nao estiver confirmada;
- campo de vinculo com NF estiver indefinido;
- status da NF `Recebida` nao for elegivel;
- status inicial de pagamento nao estiver mapeado;
- forma de pagamento, banco ou conta forem obrigatorios sem valor de teste;
- houver pagamento/programacao ja existente;
- anexo/boleto/comprovante for obrigatorio sem regra de teste;
- Power Automate for necessario.

## Atualizacao V2.7A.7B - Execucao Manual Futura

A Lista 10 foi escolhida como destino preparado para `ProgramarPagamento`; a Lista 05 permanece como referencia/legado nesta rodada.

Depois de publicar manualmente o pacote e configurar pagina restrita, Leon deve usar:

- acao `ProgramarPagamento`;
- item de requisicao `11`;
- NF de origem `4`;
- numero da NF `NF-V2.7A-TESTE-001`;
- valor `6720`;
- status `Programado`;
- forma `Pix`;
- conta `Itaú ENAC`;
- categoria `Material de Obra`;
- origem `Compra de Material`.

Antes de executar, confirmar no painel:

- `pode executar = sim`;
- sem `PAGAMENTO_JA_EXISTENTE`;
- fornecedor, obra, valor, vencimento e data programada resolvidos;
- Lista/campo apontando para Lista 10 e campos `N_x00ba_daNotaFiscal`, `Fornecedor_x002f_PrestadorId`, `ValorBruto`, `ValorL_x00ed_quidoaPagar` e `StatusdoPagamento`;
- diagnostico informando `VINCULO_TEXTUAL_NF_USADO`.

Na execucao manual futura:

- criar programacao de pagamento de teste na Lista 10;
- registrar historico;
- nao marcar como pago;
- nao enviar para contabilidade;
- nao iniciar Power Automate.

## Resultado Manual V2.7A.7C

Leon executou manualmente o roteiro em 09/06/2026 apos publicar o pacote da V2.7A.7B e obter pre-validacao liberada.

Resultado registrado:

- `ProgramarPagamento` validado manualmente;
- programacao criada na Lista 10: item `3`;
- title `PAG-V2.7A-TESTE-NF-4-NF-V2.7A-TESTE-001-20260609161247`;
- NF `Lista 04-4` / `NF-V2.7A-TESTE-001`;
- pedido `Lista 03-3` / `PED-V2.7A-TESTE-11-20260609125401`;
- requisicao `Lista 02-11`;
- fornecedor e obra preenchidos;
- valor bruto/liquido `6720`;
- data programada `16/06/2026`;
- status `Programado`;
- forma `Pix`;
- conta `Itaú ENAC`;
- categoria `Material de Obra`;
- origem `Compra de Material`;
- historico criado;
- HTTP escrita `201`;
- pagamento efetivo, data do pagamento e comprovante nao foram criados;
- NF, pedido e requisicao nao foram alterados indevidamente, conforme fechamento manual;
- `PATCH`/`DELETE`: nao.

Power Automate nao foi verificado diretamente no run history por Leon. Nao houve indicio observado e Codex nao iniciou Power Automate.

Proxima recomendacao: V2.8 para consolidar o fluxo completo e auditar historico ponta a ponta antes de qualquer homologacao assistida ou plano futuro de Power Automate.
