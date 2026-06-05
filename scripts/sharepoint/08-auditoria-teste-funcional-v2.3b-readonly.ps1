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
$lista02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$outputPath = Join-Path (Resolve-Path ".\sharepoint") "auditoria-teste-funcional-v2.3b.md"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") { throw "PowerShell 7.4 ou superior e obrigatorio." }
    if (-not (Get-Module -ListAvailable PnP.PowerShell | Select-Object -First 1)) { throw "Modulo PnP.PowerShell nao encontrado." }
}

function Connect-PnPReadonly {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }
    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-ListByTitleOrUrl {
    param($Connection, [string]$Title, [string]$Url)
    $lists = Get-PnPList -Connection $Connection -Includes RootFolder,Hidden,ItemCount
    return @($lists | Where-Object { $_.Title -eq $Title -or $_.RootFolder.ServerRelativeUrl -like "*/$Url" })[0]
}

function Get-ListByGuid {
    param($Connection, [Guid]$Id)
    return @(Get-PnPList -Connection $Connection -Identity $Id -Includes RootFolder,Hidden,ItemCount -ThrowExceptionIfListNotFound)[0]
}

function Find-ByField {
    param($Connection, $List, [string]$FieldName, [string]$Value)
    $listIdentity = $List.Id.ToString()
    $items = Get-PnPListItem -Connection $Connection -List $listIdentity -Fields $FieldName, "Title", "SnapshotAprovacaoCompra" -PageSize 200
    return @($items | Where-Object { [string]$_.FieldValues[$FieldName] -eq $Value })
}

function Add-Line {
    param([System.Collections.Generic.List[string]]$Lines, [string]$Text)
    $Lines.Add($Text) | Out-Null
}

Assert-Prerequisites
$connection = Connect-PnPReadonly
$usuarios = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Usuarios Perfis" -Url "Lists/ENACUsuariosPerfis"
$alcadas = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Alcadas" -Url "Lists/ENACAlcadas"
$historico = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Historico Configuracoes" -Url "Lists/ENACHistoricoConfiguracoes"
$snapshots = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Snapshots Regras" -Url "Lists/ENACSnapshotsRegras"
$lista02 = Get-ListByGuid -Connection $connection -Id $lista02Id

$lines = [System.Collections.Generic.List[string]]::new()
Add-Line $lines "# Auditoria teste funcional V2.3B"
Add-Line $lines ""
Add-Line $lines "| Verificacao | Status |"
Add-Line $lines "| --- | --- |"

foreach ($id in "usr-leon", "usr-gustavo", "usr-matheus", "usr-kemilly") {
    $status = if ((Find-ByField -Connection $connection -List $usuarios -FieldName "UsuarioInternoId" -Value $id).Count -gt 0) { "OK" } else { "AUSENTE" }
    Add-Line $lines "| Usuario $id | $status |"
}

foreach ($id in "alc-v23b-teste-compra-ate-20000", "alc-v23b-teste-compra-acima-20000") {
    $status = if ((Find-ByField -Connection $connection -List $alcadas -FieldName "RegraInternaId" -Value $id).Count -gt 0) { "OK" } else { "AUSENTE" }
    Add-Line $lines "| Alcada $id | $status |"
}

$snapshotItems = Find-ByField -Connection $connection -List $snapshots -FieldName "Title" -Value "SNAP-V2.3B-TESTE-001"
$snapshotStatus = if ($snapshotItems.Count -gt 0) { "OK" } else { "AUSENTE" }
Add-Line $lines "| Snapshot SNAP-V2.3B-TESTE-001 | $snapshotStatus |"

$historicoStatus = if ((Find-ByField -Connection $connection -List $historico -FieldName "ItemConfiguracaoId" -Value "V2.3B-TESTE").Count -gt 0) { "OK" } else { "AUSENTE" }
Add-Line $lines "| Historico V2.3B-TESTE | $historicoStatus |"
Add-Line $lines "| Lista 02 validada por GUID | OK [$($lista02.Id)] |"

$lines | Set-Content -LiteralPath $outputPath -Encoding UTF8
Write-Host "Auditoria readonly do teste funcional gerada: $outputPath"
