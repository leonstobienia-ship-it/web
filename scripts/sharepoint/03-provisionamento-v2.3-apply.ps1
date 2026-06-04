param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras",

    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DeviceLogin", "Interactive")]
    [string]$AuthMode = "DeviceLogin",

    [Parameter(Mandatory = $false)]
    [switch]$Apply,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmProvisionamento = ""
)

$ErrorActionPreference = "Stop"

$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$confirmationPhrase = "PROVISIONAR-V2.3-ENAC"
$expectedObrasId = [Guid]"a9afadc1-f843-45c0-a628-4f49a8716832"
$expectedSolicitacoesId = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)."
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado."
    }

    if ([string]::IsNullOrWhiteSpace($Tenant)) {
        throw "Informe o tenant no formato tenant.onmicrosoft.com."
    }

    if ([string]::IsNullOrWhiteSpace($ClientId)) {
        throw "Informe o ClientId para autenticacao PnP."
    }
}

function Assert-ApplyAllowed {
    if (-not $Apply) { return }

    if ($ClientId -eq $readonlyClientId) {
        throw "Aplicacao recusada: o ClientId readonly de inventario/dry-run nao pode provisionar estruturas."
    }

    if ($ConfirmProvisionamento -ne $confirmationPhrase) {
        throw "Aplicacao recusada: informe -ConfirmProvisionamento `"$confirmationPhrase`" para provisionamento real."
    }
}

function Connect-PnPProvisioning {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-OperationalListByGuid {
    param($Connection, [Guid]$ListId, [string]$DisplayName)

    return Get-PnPList `
        -Connection $Connection `
        -Identity $ListId `
        -Includes RootFolder,Hidden,ItemCount `
        -ThrowExceptionIfListNotFound
}

function Assert-OperationalLists {
    param($Connection)

    $obras = Get-OperationalListByGuid -Connection $Connection -ListId $expectedObrasId -DisplayName "Lista 01 - Controle de Obras ENAC"
    $solicitacoes = Get-OperationalListByGuid -Connection $Connection -ListId $expectedSolicitacoesId -DisplayName "Lista 02 — Requisições de Compra"

    if (-not $obras) { throw "Lista 01 - Controle de Obras ENAC nao encontrada." }
    if (-not $solicitacoes) { throw "Lista 02 — Requisições de Compra nao encontrada." }
    if ($obras.Id -ne $expectedObrasId) { throw "GUID da Lista 01 divergente. Esperado $expectedObrasId, encontrado $($obras.Id)." }
    if ($solicitacoes.Id -ne $expectedSolicitacoesId) { throw "GUID da Lista 02 divergente. Esperado $expectedSolicitacoesId, encontrado $($solicitacoes.Id)." }

    return [pscustomobject]@{
        Obras = $obras
        Solicitacoes = $solicitacoes
    }
}

function Write-PlanLine {
    param([string]$Message)
    Write-Host "PLANEJAR $Message"
}

function Invoke-DryRunPlan {
    Write-Host "Provisionamento V2.3A em modo dry-run. Nenhuma alteracao sera aplicada." -ForegroundColor Green
    Write-Host "Nao criar ENACObras nem ENACSolicitacoes."
    Write-PlanLine "validar Lista 01 - Controle de Obras ENAC por GUID / $expectedObrasId"
    Write-PlanLine "validar Lista 02 — Requisições de Compra por GUID / $expectedSolicitacoesId"
    Write-PlanLine "criar lista ENAC Usuarios Perfis em Lists/ENACUsuariosPerfis"
    Write-PlanLine "criar lista ENAC Alcadas em Lists/ENACAlcadas"
    Write-PlanLine "criar lista ENAC Historico Configuracoes em Lists/ENACHistoricoConfiguracoes"
    Write-PlanLine "criar lista ENAC Snapshots Regras em Lists/ENACSnapshotsRegras"
    Write-PlanLine "criar lookup ENAC Alcadas.Obra -> Lista 01 resolvida por GUID $expectedObrasId / NomedaObra"
    Write-PlanLine "criar lookup ENAC Snapshots Regras.Solicitacao -> Lista 02 resolvida por GUID $expectedSolicitacoesId / ID"
    Write-PlanLine "criar campo Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra na lista resolvida por GUID $expectedSolicitacoesId -> ENAC Snapshots Regras / Title"
    Write-PlanLine "usar TipoSolicitacao como Choice: Material | Serviço | Equipamento | Ferramenta | Locação | Terceiro/Prestador | EPI | Documento/Taxa | Outro"
    Write-PlanLine "usar moedas com Type=Currency, LCID=1046, Decimals=2"
    Write-PlanLine "usar UsuarioInternoId e RegraInternaId com Indexed=TRUE e EnforceUniqueValues=TRUE"
    Write-PlanLine "usar datas sem horario com Type=DateTime e Format=DateOnly"
    Write-PlanLine "usar DataHoraAplicacao com Type=DateTime e Format=DateTime"
    Write-PlanLine "usar campos Note como texto simples, sem rich text"
    Write-PlanLine "desativar edicao em grade nas quatro listas administrativas"
}

function Invoke-ApplyProvisioning {
    param($Connection)

    throw "Aplicacao real ainda depende de revisao final do dry-run, aplicativo separado com permissao de escrita e autorizacao expressa. Nenhum comando de criacao foi executado."

    <#
    Implementacao futura autorizada:
    - New-PnPList apenas para as quatro listas administrativas ausentes.
    - Set-PnPList para versionamento, anexos desativados e edicao em grade desativada.
    - Add-PnPField/Add-PnPFieldFromXml somente para campos planejados.
    - Nenhuma exclusao de lista ou campo.
    - Nenhuma alteracao de itens existentes.
    - ENAC Alcadas.Obra deve usar Lista 01 resolvida por GUID e exibir NomedaObra.
    - ENAC Snapshots Regras.Solicitacao deve usar Lista 02 resolvida por GUID e exibir ID.
    - SnapshotAprovacaoCompra apenas na Lista 02 resolvida por GUID.
    #>
}

Assert-Prerequisites
Assert-ApplyAllowed

$connection = Connect-PnPProvisioning
$validatedLists = Assert-OperationalLists -Connection $connection

Write-Host "Listas operacionais validadas:"
Write-Host "OK Lista 01 - Controle de Obras ENAC [$($validatedLists.Obras.Id)]"
Write-Host "OK Lista 02 — Requisições de Compra [$($validatedLists.Solicitacoes.Id)]"

if (-not $Apply) {
    Invoke-DryRunPlan
    return
}

Invoke-ApplyProvisioning -Connection $connection
