# Auditoria complementar V2.3C - vínculo do snapshot

## Objetivo

Fechar a ressalva registrada na V2.3B, confirmando de forma explícita o vínculo entre a requisição de teste da Lista 02, o campo `SnapshotAprovacaoCompra`, o snapshot `SNAP-V2.3B-TESTE-001` e a regra `alc-v23b-teste-compra-ate-20000`.

A auditoria é exclusivamente readonly. Não cria, altera ou exclui itens, não altera permissões e não inicia Power Automate.

## Pré-requisitos

- Provisionamento estrutural V2.3A concluído.
- Teste funcional controlado V2.3B executado com dados marcados como `V2.3B-TESTE`.
- Arquivo local `config/teste-funcional-v2.3b.local.json` preenchido com `requisicaoTeste.itemId` e `requisicaoTeste.valorAnalisado`.
- Arquivo local de configuração ignorado pelo Git.

## Campos lidos

Lista 02 `0a204b87-b9a1-4d16-8654-55567a62ed01`:

- `ID`
- `SnapshotAprovacaoCompra`

`ENAC Snapshots Regras` `767e1867-8a98-46be-9dcc-be53a12c51aa`:

- `Title`
- `Solicitacao`
- `RegraAlcadaUtilizada`
- `RegraInternaId`
- `ValorAnalisado`
- `AprovadorBaseId`
- `AprovadorEfetivoId`

`ENAC Alcadas` `901d4458-15b4-427b-a869-161c63cf70ef`:

- `Title`
- `RegraInternaId`

## Critérios de validação

- A requisição informada no arquivo local existe.
- `SnapshotAprovacaoCompra` está preenchido.
- O lookup aponta para `SNAP-V2.3B-TESTE-001`.
- O snapshot aponta de volta para a mesma requisição.
- `RegraInternaId` no snapshot é `alc-v23b-teste-compra-ate-20000`.
- `ValorAnalisado` é igual ao valor informado no config local, referência de teste `6720.00`.
- `AprovadorBaseId` e `AprovadorEfetivoId` são `usr-gustavo`.
- A regra vinculada existe em `ENAC Alcadas` com título `V2.3B-TESTE-COMPRA-ATE-20000`.

## Relatório

O script gera `sharepoint/auditoria-vinculo-snapshot-v2.3c.md`.

O relatório deve conter apenas status `OK`, `AUSENTE` ou `DIVERGENTE`, IDs técnicos de teste, marcador `V2.3B-TESTE`, itemId da requisição de teste, código do snapshot, código da regra e valor de teste. Não deve conter e-mails reais, solicitante, fornecedor, descrição operacional, documentos, anexos, tokens ou segredos.

## Execução manual

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\09-auditoria-vinculo-snapshot-v2.3c-readonly.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "8994fd01-5b9b-4e8b-bc11-41c58aa91043" `
  -AuthMode "DeviceLogin"
```

Não iniciar Power Automate antes da auditoria V2.3C.

## Resultado executado

Data operacional: 2026-06-05.

Leon executou manualmente a auditoria readonly `scripts/sharepoint/09-auditoria-vinculo-snapshot-v2.3c-readonly.ps1`. O relatório local `sharepoint/auditoria-vinculo-snapshot-v2.3c.md` foi revisado e considerado seguro para versionamento.

Resultado da auditoria:

- requisição de teste `ItemId=7`: OK;
- `SnapshotAprovacaoCompra` preenchido: OK;
- lookup apontando para `SNAP-V2.3B-TESTE-001`: OK;
- snapshot apontando de volta para `ItemId=7`: OK;
- regra `alc-v23b-teste-compra-ate-20000`: OK;
- valor analisado `6720.00`: OK;
- aprovador base `usr-gustavo`: OK;
- aprovador efetivo `usr-gustavo`: OK;
- regra `V2.3B-TESTE-COMPRA-ATE-20000`: OK.

Status final: V2.3C aprovada. A ressalva da V2.3B sobre o vínculo requisição/snapshot/alçada foi encerrada. Power Automate ainda não foi iniciado.
