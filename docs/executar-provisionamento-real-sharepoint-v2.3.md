# Executar Provisionamento Real SharePoint V2.3A

Este documento descreve o script local `scripts/sharepoint/03-provisionamento-v2.3-apply.ps1`.

Provisionamento estrutural V2.3A concluido em 2026-06-04. Este documento fica preservado como registro do procedimento e das travas usadas.

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

Para qualquer reaplicacao controlada/idempotente, o script exige:

- `-Apply`;
- `-ConfirmProvisionamento "PROVISIONAR-V2.3-ENAC"`;
- aplicativo separado com permissao de escrita controlada.

O script recusa explicitamente `-Apply` quando o `ClientId` informado for o aplicativo readonly:

`0dab19b3-8e48-4f89-ad94-1446b08d3781`

O aplicativo readonly `ENAC-PnP-Inventario-SharePoint-Readonly-V2.3A` permanece restrito a inventario e dry-run de leitura.

## Aplicativo separado de provisionamento

O aplicativo readonly nao deve ser reutilizado nem ampliado. A avaliacao de provisionamento deve usar um aplicativo separado:

- Nome recomendado: `ENAC-PnP-Provisionamento-SharePoint-V2.3A`.
- Cmdlet local verificado: `Register-PnPEntraIDAppForInteractiveLogin`.
- Parametro de permissao SharePoint delegado: `-SharePointDelegatePermissions <string[]>`.
- Permissoes delegadas SharePoint aceitas pelo PnP local incluem `AllSites.Read`, `AllSites.Write`, `AllSites.Manage`, `AllSites.FullControl` e `Sites.Selected`.
- Candidata para avaliacao de criacao de listas/campos sem FullControl: `AllSites.Manage`.

Nao solicitar `AllSites.FullControl` sem autorizacao expressa. Se o consentimento exibir permissao inesperada de escrita ampla, controle total, Graph ou TermStore nao prevista, cancelar e revisar antes de continuar.

Comando preparado para execucao supervisionada, ainda nao executado pelo Codex:

```powershell
Register-PnPEntraIDAppForInteractiveLogin `
  -ApplicationName "ENAC-PnP-Provisionamento-SharePoint-V2.3A" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -SharePointDelegatePermissions @("AllSites.Manage")
```

Apos o aplicativo separado ser criado e validado visualmente, executar no maximo o script `03` em dry-run, sem `-Apply` e sem `-ConfirmProvisionamento`, usando o novo ClientId.

## Estruturas provisionadas

Nao criar:

- `ENACObras`;
- `ENACSolicitacoes`.

Validar listas operacionais existentes:

- Obras: `Lista 01 - Controle de Obras ENAC` / `a9afadc1-f843-45c0-a628-4f49a8716832`;
- Requisicoes: `Lista 02 — Requisições de Compra` / `0a204b87-b9a1-4d16-8654-55567a62ed01`.

Nos scripts, essas listas operacionais devem ser localizadas pelos GUIDs acima. Os titulos visiveis continuam apenas como informacao de log/conferencia, pois podem conter travessao, acentuacao ou caracteres invisiveis diferentes do texto digitado.

Estruturas administrativas provisionadas:

- `ENAC Usuarios Perfis` / `Lists/ENACUsuariosPerfis`;
- `ENAC Alcadas` / `Lists/ENACAlcadas`;
- `ENAC Historico Configuracoes` / `Lists/ENACHistoricoConfiguracoes`;
- `ENAC Snapshots Regras` / `Lists/ENACSnapshotsRegras`;
- `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`.

Nenhuma lista operacional foi recriada. `ENACObras` e `ENACSolicitacoes` nao foram criadas.

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

## Comando de aplicacao controlada

Usado somente com autorizacao expressa e aplicativo separado:

```powershell
pwsh -File ".\scripts\sharepoint\03-provisionamento-v2.3-apply.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-APP-PROVISIONAMENTO>" `
  -AuthMode "DeviceLogin" `
  -Apply `
  -ConfirmProvisionamento "PROVISIONAR-V2.3-ENAC"
```

Auditoria readonly posterior confirmou campos, lookups, configuracoes das listas administrativas e `SnapshotAprovacaoCompra` criados. Power Automate ainda nao foi iniciado; a proxima etapa e teste funcional controlado com dados minimos.
