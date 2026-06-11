<#
.SYNOPSIS
Publica o pacote SPFx do Sistema ENAC via PnP.PowerShell.

.DESCRIPTION
O modo padrao e dry-run. Sem -Execute e sem o token exato, o script valida
ambiente, pacote e caminhos, gera relatorio e nao conecta ao SharePoint.

Com -Execute e ConfirmacaoPublicacao correta, o script publica/substitui o
.sppkg no App Catalog, tenta publicar/trust com Add-PnPApp -Publish e entao
conecta ao site de homologacao para instalar/atualizar o app quando o comando
estiver disponivel. O script nao altera listas, dados operacionais,
permissoes funcionais ou Power Automate.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $true)]
    [string]$AppCatalogUrl,

    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [string]$PackagePath,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DeviceLogin", "Interactive")]
    [string]$AuthMode = "DeviceLogin",

    [Parameter(Mandatory = $false)]
    [switch]$Execute,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmacaoPublicacao = "",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = ".\reports"
)

$ErrorActionPreference = "Stop"

$confirmationToken = "CONFIRMAR-PUBLICACAO-SPFX-SISTEMA-ENAC"
$startedAt = Get-Date
$minimumPackageSizeBytes = 100KB

function Add-ReportLine {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

function ConvertTo-SafeText {
    param($Value)

    if ($null -eq $Value) { return "" }
    $text = [string]$Value
    $text = $text -replace "\|", "/"
    $text = $text -replace "([A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12})", "[guid]"
    $text = $text -replace "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[email omitido]"
    $text = $text -replace "Bearer\s+[A-Za-z0-9._~+/=-]+", "Bearer [token omitido]"
    return $text
}

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)"
    }

    $pnpModule = Get-Module PnP.PowerShell -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado. Instale com: Install-Module PnP.PowerShell -Scope CurrentUser -Force -AllowClobber"
    }

    $resolvedPackage = Resolve-Path -LiteralPath $PackagePath -ErrorAction Stop
    $packageItem = Get-Item -LiteralPath $resolvedPackage.Path
    if ($packageItem.Extension -ne ".sppkg") {
        throw "PackagePath deve apontar para um arquivo .sppkg."
    }

    if ($packageItem.Length -lt $minimumPackageSizeBytes) {
        throw "Pacote com tamanho inesperado: $($packageItem.Length) bytes. Minimo esperado: $minimumPackageSizeBytes bytes."
    }

    return [pscustomobject]@{
        PnPModule = $pnpModule
        Package = $packageItem
        PackageHash = (Get-FileHash -LiteralPath $packageItem.FullName -Algorithm SHA256).Hash
    }
}

function Connect-EnacPnP {
    param(
        [string]$Url
    )

    $connectParams = @{
        Url = $Url
        Tenant = $Tenant
        ClientId = $ClientId
        ReturnConnection = $true
    }

    if ($AuthMode -eq "DeviceLogin") {
        $connectParams.DeviceLogin = $true
    } else {
        $connectParams.Interactive = $true
    }

    return Connect-PnPOnline @connectParams
}

function Get-EnacApps {
    param($Connection)

    try {
        return Get-PnPApp -Connection $Connection -Scope Tenant -ErrorAction Stop
    }
    catch {
        return Get-PnPApp -Connection $Connection -ErrorAction Stop
    }
}

function Find-EnacApp {
    param($Apps)

    $matches = @($Apps | Where-Object {
        $_.Title -like "*ENAC*" -or
        $_.Title -like "*enac-sistema*" -or
        $_.Title -like "*Sistema ENAC*" -or
        $_.Name -like "*enac-sistema*"
    })

    if ($matches.Count -gt 0) {
        return $matches | Select-Object -First 1
    }

    return $null
}

function Copy-PackageToPublishTemp {
    param(
        [System.IO.FileInfo]$Package
    )

    $publishTempDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "enac-spfx-publicacao"
    if (-not (Test-Path -LiteralPath $publishTempDirectory)) {
        New-Item -ItemType Directory -Path $publishTempDirectory | Out-Null
    }

    $publishTempPath = Join-Path $publishTempDirectory $Package.Name
    Copy-Item -LiteralPath $Package.FullName -Destination $publishTempPath -Force
    return (Get-Item -LiteralPath $publishTempPath)
}

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$outputFullDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path

$hasExecutionToken = $ConfirmacaoPublicacao -eq $confirmationToken
$executionAuthorized = $Execute.IsPresent -and $hasExecutionToken
$mode = if ($executionAuthorized) { "EXECUCAO_CONFIRMADA" } else { "DRYRUN" }
$reportPath = Join-Path $outputFullDirectory ($(if ($executionAuthorized) { "v2.x-publicacao-spfx-pnp-execucao.md" } else { "v2.x-publicacao-spfx-pnp-dryrun.md" }))

if ($Execute.IsPresent -and -not $hasExecutionToken) {
    Write-Warning "Parametro -Execute informado sem token correto. O script permanecera em dry-run."
}

$report = New-Object System.Collections.Generic.List[string]
Add-ReportLine $report "# Publicacao SPFx via PnP.PowerShell"
Add-ReportLine $report
Add-ReportLine $report "- Inicio: $($startedAt.ToString('s'))"
Add-ReportLine $report "- Modo: $mode"
Add-ReportLine $report "- Tenant: $Tenant"
Add-ReportLine $report "- App Catalog: $AppCatalogUrl"
Add-ReportLine $report "- Site: $SiteUrl"
Add-ReportLine $report "- AuthMode: $AuthMode"
Add-ReportLine $report

try {
    $preflight = Assert-Prerequisites

    Add-ReportLine $report "## Preflight"
    Add-ReportLine $report
    Add-ReportLine $report "- PowerShell: $($PSVersionTable.PSVersion)"
    Add-ReportLine $report "- PnP.PowerShell: $($preflight.PnPModule.Version)"
    Add-ReportLine $report "- PnP path: $($preflight.PnPModule.Path)"
    Add-ReportLine $report "- Pacote: $($preflight.Package.FullName)"
    Add-ReportLine $report "- Tamanho: $($preflight.Package.Length) bytes"
    Add-ReportLine $report "- SHA256: $($preflight.PackageHash)"
    Add-ReportLine $report

    if (-not $executionAuthorized) {
        Add-ReportLine $report "## Dry-run"
        Add-ReportLine $report
        Add-ReportLine $report "- Nenhuma conexao SharePoint foi aberta."
        Add-ReportLine $report "- Nenhum upload foi executado."
        Add-ReportLine $report "- Nenhuma lista, dado operacional, permissao funcional ou fluxo Power Automate foi alterado."
        Add-ReportLine $report "- Para publicar, executar com -Execute e ConfirmacaoPublicacao igual a '$confirmationToken'."
        Write-Host "DRY-RUN concluido. Relatorio: $reportPath"
        return
    }

    Import-Module PnP.PowerShell -ErrorAction Stop

    Add-ReportLine $report "## Execucao"
    Add-ReportLine $report
    Add-ReportLine $report "### App Catalog"
    $appCatalogConnection = Connect-EnacPnP -Url $AppCatalogUrl
    $appCatalogWeb = Get-PnPWeb -Connection $appCatalogConnection -ErrorAction Stop
    Add-ReportLine $report "- Conectado: $($appCatalogWeb.Title) / $($appCatalogWeb.Url)"

    $publishPackage = Copy-PackageToPublishTemp -Package $preflight.Package
    Add-ReportLine $report "- Pacote copiado para caminho temporario de publicacao: $($publishPackage.FullName)"

    $publishedApp = Add-PnPApp -Connection $appCatalogConnection -Path $publishPackage.FullName -Scope Tenant -Overwrite -Publish -Force -ErrorAction Stop
    Add-ReportLine $report "- Add-PnPApp executado com -Overwrite -Publish -Force."
    Add-ReportLine $report "- Retorno: $(ConvertTo-SafeText ($publishedApp | Out-String).Trim())"
    Add-ReportLine $report

    Add-ReportLine $report "### Site de homologacao"
    $siteConnection = Connect-EnacPnP -Url $SiteUrl
    $siteWeb = Get-PnPWeb -Connection $siteConnection -ErrorAction Stop
    Add-ReportLine $report "- Conectado: $($siteWeb.Title) / $($siteWeb.Url)"

    $apps = @(Get-EnacApps -Connection $siteConnection)
    $enacApp = Find-EnacApp -Apps $apps
    if (-not $enacApp) {
        throw "App Sistema ENAC nao encontrado em Get-PnPApp no site."
    }

    Add-ReportLine $report "- App localizado: $(ConvertTo-SafeText ($enacApp | Out-String).Trim())"

    if (Get-Command Update-PnPApp -ErrorAction SilentlyContinue) {
        Update-PnPApp -Connection $siteConnection -Identity $enacApp.Id -ErrorAction Stop
        Add-ReportLine $report "- Update-PnPApp executado."
    } else {
        Install-PnPApp -Connection $siteConnection -Identity $enacApp.Id -ErrorAction Stop
        Add-ReportLine $report "- Update-PnPApp indisponivel; Install-PnPApp executado para instalar/atualizar quando aplicavel."
    }

    Add-ReportLine $report
    Add-ReportLine $report "## Resultado"
    Add-ReportLine $report
    Add-ReportLine $report "- Publicacao automatizada concluida sem erro."
    Add-ReportLine $report "- Validar a pagina de homologacao com cache novo e confirmar asset carregado."
}
catch {
    Add-ReportLine $report
    Add-ReportLine $report "## Falha"
    Add-ReportLine $report
    Add-ReportLine $report "- Erro: $(ConvertTo-SafeText $_.Exception.Message)"
    throw
}
finally {
    Add-ReportLine $report
    Add-ReportLine $report "## Garantias"
    Add-ReportLine $report
    Add-ReportLine $report "- O script nao executa alteracao em listas ou dados operacionais."
    Add-ReportLine $report "- O script nao altera permissoes funcionais."
    Add-ReportLine $report "- O script nao inicia Power Automate."
    Add-ReportLine $report "- Segredos, tokens e credenciais nao sao gravados no relatorio."
    Add-ReportLine $report
    Add-ReportLine $report "- Fim: $((Get-Date).ToString('s'))"

    $report | Set-Content -LiteralPath $reportPath -Encoding UTF8
}
