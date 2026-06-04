# Validacao readonly da choice Tipo da Solicitacao - V2.3A

Este procedimento verifica se ainda existem itens antigos na `Lista 02 — Requisições de Compra` com o valor legado `Documento?Taxa` no campo interno `TipodaSolicita_x00e7__x00e3_o`, apos a correcao manual da choice para `Documento/Taxa`.

O script e estritamente de leitura:

- usa o aplicativo readonly aprovado;
- conecta por `DeviceLogin` ou `Interactive`;
- resolve a lista operacional pelo GUID `0a204b87-b9a1-4d16-8654-55567a62ed01`;
- consulta somente a `Lista 02 — Requisições de Compra`;
- solicita apenas o campo interno `TipodaSolicita_x00e7__x00e3_o`;
- exibe somente contagens agregadas;
- nao exporta itens, nomes, solicitantes, valores, descricoes, documentos ou anexos;
- nao cria arquivos de saida;
- nao executa comandos de escrita.

## Comando manual

Executar manualmente no PowerShell 7:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\04-validar-choice-tipo-solicitacao-readonly.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "0dab19b3-8e48-4f89-ad94-1446b08d3781" `
  -AuthMode "DeviceLogin"
```

## Resultado esperado

O retorno deve conter apenas:

- total de itens lidos;
- quantidade com valor legado `Documento?Taxa`;
- quantidade com valor atual `Documento/Taxa`;
- quantidade com outros valores;
- quantidade com vazio/nulo.

Se a quantidade com `Documento?Taxa` for maior que zero, nao executar provisionamento real antes de decidir se esses itens antigos devem ser corrigidos, preservados como historico ou tratados por regra de compatibilidade.
