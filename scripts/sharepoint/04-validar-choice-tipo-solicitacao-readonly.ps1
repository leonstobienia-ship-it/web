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
$list02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$list02DisplayName = "Lista 02 — Requisições de Compra"
$tipoSolicitacaoField = "TipodaSolicita_x00e7__x00e3_o"
$valorLegado = "Documento?Taxa"
$valorCorreto = "Documento/Taxa"

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

$list02 = Get-PnPList `
    -Identity $list02Id `
    -ThrowExceptionIfListNotFound `
    -Connection $connection

Write-Host ("Lista validada por GUID: {0} [{1}]" -f $list02.Title, $list02.Id)

$items = Get-PnPListItem `
    -Connection $connection `
    -List $list02 `
    -Fields $tipoSolicitacaoField `
    -PageSize 500

$total = 0
$legacyCount = 0
$currentCount = 0
$otherCount = 0
$blankCount = 0

foreach ($item in $items) {
    $total++
    $value = $item.FieldValues[$tipoSolicitacaoField]

    if ($null -eq $value -or [string]::IsNullOrWhiteSpace([string]$value)) {
        $blankCount++
    }
    elseif ([string]$value -eq $valorLegado) {
        $legacyCount++
    }
    elseif ([string]$value -eq $valorCorreto) {
        $currentCount++
    }
    else {
        $otherCount++
    }
}

Write-Host "Validacao readonly de Tipo da Solicitação concluida."
Write-Host "Lista esperada: $list02DisplayName [$list02Id]"
Write-Host "Campo interno lido: $tipoSolicitacaoField"
Write-Host "Total de itens lidos: $total"
Write-Host "Quantidade com valor legado '$valorLegado': $legacyCount"
Write-Host "Quantidade com valor atual '$valorCorreto': $currentCount"
Write-Host "Quantidade com outros valores: $otherCount"
Write-Host "Quantidade com vazio/nulo: $blankCount"
Write-Host "Nenhum item, documento, anexo, valor financeiro, solicitante ou campo adicional foi exportado."
