param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras",

    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DeviceLogin", "Interactive")]
    [string]$AuthMode = "DeviceLogin"
)

$ErrorActionPreference = "Stop"

$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$listTitle = "Lista 02 — Requisições de Compra"
$fieldInternalName = "TipodaSolicita_x00e7__x00e3_o"
$legacyValue = "Documento?Taxa"
$currentValue = "Documento/Taxa"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)."
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado."
    }

    if ($ClientId -ne $readonlyClientId) {
        throw "Validacao recusada: use exclusivamente o ClientId readonly aprovado para inventario."
    }
}

function Connect-PnPReadonly {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

Assert-Prerequisites
$connection = Connect-PnPReadonly

$items = Get-PnPListItem `
    -Connection $connection `
    -List $listTitle `
    -Fields $fieldInternalName `
    -PageSize 500

$total = 0
$legacyCount = 0
$currentCount = 0
$otherOrBlankCount = 0

foreach ($item in $items) {
    $total++
    $value = [string]$item.FieldValues[$fieldInternalName]

    if ($value -eq $legacyValue) {
        $legacyCount++
    }
    elseif ($value -eq $currentValue) {
        $currentCount++
    }
    else {
        $otherOrBlankCount++
    }
}

Write-Host "Validacao readonly de Tipo da Solicitação concluida."
Write-Host "Lista: $listTitle"
Write-Host "Campo interno lido: $fieldInternalName"
Write-Host "Total de itens lidos: $total"
Write-Host "Quantidade com valor legado '$legacyValue': $legacyCount"
Write-Host "Quantidade com valor atual '$currentValue': $currentCount"
Write-Host "Quantidade com outros valores ou vazio: $otherOrBlankCount"
Write-Host "Nenhum item, documento, anexo, valor financeiro, solicitante ou campo adicional foi exportado."
