# Checklist V2.8D - Limpeza Controlada

## Antes De Qualquer Dry-Run

- Confirmar que a rodada foi autorizada por Leon.
- Confirmar que `reports/v2.8c-inventario-limpeza-candidatos.md` e `.json` foram revisados.
- Confirmar que os itens candidatos continuam sendo exatamente os seis itens transacionais whitelistados.
- Confirmar que snapshots, historico, usuarios/perfis e alcadas serao preservados.
- Confirmar que Power Automate permanece fora do escopo.

## Dry-Run

Executar manualmente:

```powershell
pwsh .\scripts\sharepoint\15-limpeza-dados-teste-controlada.ps1 `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "0dab19b3-8e48-4f89-ad94-1446b08d3781" `
  -AuthMode DeviceLogin
```

Conferir:

- arquivo `reports/v2.8d-limpeza-dryrun.md` criado;
- arquivo `reports/v2.8d-limpeza-dryrun.json` criado;
- modo reportado como `DRYRUN`;
- `Dry-run nao executou limpeza` reportado como `True`;
- `AUTORIZACAO PARA EXECUCAO` reportada como `NAO` se houver qualquer erro ou bloqueio;
- remocoes executadas igual a `0`;
- total lido igual a `6`;
- total erro igual a `0`;
- total nao encontrado igual a `0`;
- cada item mostra `TitleOk = true` e `MarkerOk = true`;
- cada item mostra leitura `LIDO_OK`;
- cada item elegivel mostra validacao `APTO_PARA_LIMPEZA`;
- nenhuma divergencia de lista, item, title ou marcador;
- nenhum item fora da whitelist aparece no relatorio.

Se aparecer `ERRO_LEITURA`, `ITEM_NAO_ENCONTRADO`, `TITLE_DIVERGENTE` ou `MARCADOR_DIVERGENTE`, o dry-run deve ser tratado como invalido para autorizar limpeza.

## Antes De Execucao Futura

- Leon deve aprovar explicitamente a limpeza.
- Repetir dry-run no mesmo dia da execucao.
- Revisar a ordem: Lista 10, Lista 04, Lista 03, Lista 02.
- Confirmar que nao ha dependencia operacional em andamento sobre os itens.
- Confirmar que rollback e limitado a lixeira/retencao do SharePoint.

## Execucao Futura Com Token

Executar somente com autorizacao expressa:

```powershell
pwsh .\scripts\sharepoint\15-limpeza-dados-teste-controlada.ps1 `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "0dab19b3-8e48-4f89-ad94-1446b08d3781" `
  -AuthMode DeviceLogin `
  -Execute `
  -ConfirmacaoLimpeza "CONFIRMAR-LIMPEZA-DADOS-TESTE-V2.8D-ENAC"
```

Conferir:

- relatorios `reports/v2.8d-limpeza-execucao.md` e `.json`;
- remocao somente dos itens whitelistados;
- snapshots preservados;
- historico preservado;
- usuarios/perfis preservados;
- alcadas preservadas;
- ausencia de erros ou divergencias.

## Evidencias A Guardar

- comando executado;
- relatorio dry-run;
- relatorio de execucao, se houver;
- prints ou exportacao dos itens preservados;
- confirmacao de que nenhuma acao de Power Automate foi iniciada por esta etapa.
