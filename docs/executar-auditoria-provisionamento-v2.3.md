# Auditoria readonly pós-falha de provisionamento V2.3A

Este procedimento levanta o estado estrutural atual depois da falha parcial do `script03`.

O script e somente leitura:

- conecta por `DeviceLogin` ou `Interactive`;
- valida a Lista 02 por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01`;
- verifica as quatro listas administrativas planejadas;
- verifica campos existentes, ausentes e tipos divergentes;
- verifica configurações de versionamento, anexos e edição em grade;
- verifica o campo `SnapshotAprovacaoCompra` na Lista 02;
- gera apenas relatório estrutural em `sharepoint/auditoria-provisionamento-v2.3-pos-falha.md`;
- nao exporta itens, solicitantes, valores, documentos, anexos ou dados pessoais;
- nao executa comandos de escrita.

## Comando manual

Executar manualmente no PowerShell 7, usando o ClientId do aplicativo de provisionamento:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\05-auditoria-provisionamento-v2.3-readonly.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "8994fd01-5b9b-4e8b-bc11-41c58aa91043" `
  -AuthMode "DeviceLogin"
```

Nao executar novamente o `script03` com `-Apply` antes de revisar este relatorio readonly.
