# Executar Provisionamento Real SharePoint V2.3A

Este documento descreve o script local `scripts/sharepoint/03-provisionamento-v2.3-apply.ps1`.

Nenhuma execucao real de provisionamento esta autorizada nesta rodada.

## Modo padrao

Sem `-Apply`, o script opera em dry-run:

- conecta ao site informado;
- valida os GUIDs da Lista 01 e Lista 02;
- apresenta o plano de criacao;
- nao cria listas;
- nao cria campos;
- nao altera lookups;
- nao altera permissões;
- nao altera itens.

## Bloqueios obrigatorios

Para aplicacao futura, o script exige:

- `-Apply`;
- `-ConfirmProvisionamento "PROVISIONAR-V2.3-ENAC"`;
- aplicativo separado com permissao de escrita controlada.

O script recusa explicitamente `-Apply` quando o `ClientId` informado for o aplicativo readonly:

`0dab19b3-8e48-4f89-ad94-1446b08d3781`

O aplicativo readonly `ENAC-PnP-Inventario-SharePoint-Readonly-V2.3A` permanece restrito a inventario e dry-run de leitura.

## Estruturas planejadas

Nao criar:

- `ENACObras`;
- `ENACSolicitacoes`.

Validar listas operacionais existentes:

- Obras: `Lista 01 - Controle de Obras ENAC` / `a9afadc1-f843-45c0-a628-4f49a8716832`;
- Requisicoes: `Lista 02 — Requisições de Compra` / `0a204b87-b9a1-4d16-8654-55567a62ed01`.

Nos scripts, essas listas operacionais devem ser localizadas pelos GUIDs acima. Os titulos visiveis continuam apenas como informacao de log/conferencia, pois podem conter travessao, acentuacao ou caracteres invisiveis diferentes do texto digitado.

Criar futuramente apenas:

- `ENAC Usuarios Perfis` / `Lists/ENACUsuariosPerfis`;
- `ENAC Alcadas` / `Lists/ENACAlcadas`;
- `ENAC Historico Configuracoes` / `Lists/ENACHistoricoConfiguracoes`;
- `ENAC Snapshots Regras` / `Lists/ENACSnapshotsRegras`;
- `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`.

## Propriedades tecnicas

- `TipoSolicitacao`: `Choice` com choices reais da Lista 02: Material, Serviço, Equipamento, Ferramenta, Locação, Terceiro/Prestador, EPI, Documento/Taxa, Outro.
- `ValorMinimo`, `ValorMaximo`, `ValorAnalisado`: `Type=Currency`, `LCID=1046`, `Decimals=2`.
- `UsuarioInternoId`, `RegraInternaId`: `Indexed=TRUE`, `EnforceUniqueValues=TRUE`.
- `InicioSubstituicao`, `FimSubstituicao`, `VigenciaInicial`, `VigenciaFinal`: `Type=DateTime`, `Format=DateOnly`.
- `DataHoraAplicacao`: `Type=DateTime`, `Format=DateTime`.
- Campos `Note`: texto simples, sem rich text.
- `ContaMicrosoft365`: uma pessoa, sem múltiplos valores.
- Edição em grade: desativada nas quatro listas administrativas.

## Comando dry-run seguro

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\03-provisionamento-v2.3-apply.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-READONLY-OU-FUTURO-APP-DE-PROVISIONAMENTO>" `
  -AuthMode "DeviceLogin"
```

## Comando futuro de aplicacao

Somente apos autorizacao expressa e aplicativo separado:

```powershell
pwsh -File ".\scripts\sharepoint\03-provisionamento-v2.3-apply.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-APP-PROVISIONAMENTO>" `
  -AuthMode "DeviceLogin" `
  -Apply `
  -ConfirmProvisionamento "PROVISIONAR-V2.3-ENAC"
```

Nesta versao, mesmo com `-Apply`, a rotina de aplicacao real ainda interrompe antes de executar criacao. Ela deve ser revisada e habilitada somente em rodada posterior autorizada.
