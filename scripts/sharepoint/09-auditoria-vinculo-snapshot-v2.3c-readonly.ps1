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
    [string]$ConfigPath = ".\config\teste-funcional-v2.3b.local.json"
)

$ErrorActionPreference = "Stop"

$lista02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$snapshotsId = [Guid]"767e1867-8a98-46be-9dcc-be53a12c51aa"
$alcadasId = [Guid]"901d4458-15b4-427b-a869-161c63cf70ef"
$expectedSnapshotTitle = "SNAP-V2.3B-TESTE-001"
$expectedRuleId = "alc-v23b-teste-compra-ate-20000"
$expectedRuleTitle = "V2.3B-TESTE-COMPRA-ATE-20000"
$expectedApproverId = "usr-gustavo"
$outputPath = Join-Path (Resolve-Path ".\sharepoint") "auditoria-vinculo-snapshot-v2.3c.md"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") { throw "PowerShell 7.4 ou superior e obrigatorio." }
    if (-not (Get-Module -ListAvailable PnP.PowerShell | Select-Object -First 1)) { throw "Modulo PnP.PowerShell nao encontrado." }
    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        throw "Arquivo local de configuracao nao encontrado: $ConfigPath. Crie a partir de config/teste-funcional-v2.3b.example.json."
    }
}

function Connect-PnPReadonly {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }
    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-ListByGuid {
    param($Connection, [Guid]$Id)
    return @(Get-PnPList -Connection $Connection -Identity $Id -Includes RootFolder,Hidden,ItemCount -ThrowExceptionIfListNotFound)[0]
}

function Get-LookupId {
    param($LookupValue)
    if (-not $LookupValue) { return $null }
    if ($LookupValue -is [array]) {
        if ($LookupValue.Count -eq 0) { return $null }
        return [int]$LookupValue[0].LookupId
    }
    return [int]$LookupValue.LookupId
}

function Get-LookupText {
    param($LookupValue)
    if (-not $LookupValue) { return "" }
    if ($LookupValue -is [array]) {
        if ($LookupValue.Count -eq 0) { return "" }
        return [string]$LookupValue[0].LookupValue
    }
    return [string]$LookupValue.LookupValue
}

function Add-AuditLine {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Verification,
        [string]$Status,
        [string]$Detail
    )
    $safeDetail = ([string]$Detail).Replace("|", "/")
    $Lines.Add("| $Verification | $Status | $safeDetail |") | Out-Null
}

function Get-Status {
    param([bool]$Condition, [string]$FailureStatus = "DIVERGENTE")
    if ($Condition) { return "OK" }
    return $FailureStatus
}

function Get-ListItemByIdOrNull {
    param($Connection, [string]$ListIdentity, [int]$ItemId, [string[]]$Fields)
    try {
        return Get-PnPListItem -Connection $Connection -List $ListIdentity -Id $ItemId -Fields $Fields
    }
    catch {
        return $null
    }
}

function Format-DecimalOrBlank {
    param($Value)
    if ($null -eq $Value) { return "" }
    return ([decimal]$Value).ToString("0.00", [System.Globalization.CultureInfo]::InvariantCulture)
}

Assert-Prerequisites
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$requisicaoId = [int]$config.requisicaoTeste.itemId
$expectedValue = [decimal]$config.requisicaoTeste.valorAnalisado

if ($requisicaoId -le 0) { throw "Informe requisicaoTeste.itemId valido no arquivo local de configuracao." }
if ($expectedValue -le 0) { throw "Informe requisicaoTeste.valorAnalisado valido no arquivo local de configuracao." }

$connection = Connect-PnPReadonly
$lista02 = Get-ListByGuid -Connection $connection -Id $lista02Id
$snapshots = Get-ListByGuid -Connection $connection -Id $snapshotsId
$alcadas = Get-ListByGuid -Connection $connection -Id $alcadasId

$lista02Identity = $lista02.Id.ToString()
$snapshotsIdentity = $snapshots.Id.ToString()
$alcadasIdentity = $alcadas.Id.ToString()

$requestItem = Get-ListItemByIdOrNull -Connection $connection -ListIdentity $lista02Identity -ItemId $requisicaoId -Fields @("ID", "SnapshotAprovacaoCompra")
$snapshotLookup = $null
if ($requestItem) { $snapshotLookup = $requestItem.FieldValues["SnapshotAprovacaoCompra"] }
$snapshotLookupId = Get-LookupId -LookupValue $snapshotLookup
$snapshotLookupTitle = Get-LookupText -LookupValue $snapshotLookup

$snapshotItem = $null
if ($snapshotLookupId) {
    $snapshotItem = Get-ListItemByIdOrNull -Connection $connection -ListIdentity $snapshotsIdentity -ItemId $snapshotLookupId -Fields @("Title", "Solicitacao", "RegraAlcadaUtilizada", "RegraInternaId", "ValorAnalisado", "AprovadorBaseId", "AprovadorEfetivoId")
}

$snapshotTitle = ""
$snapshotRequestId = $null
$snapshotRuleLookupId = $null
$snapshotRuleId = ""
$snapshotValue = $null
$snapshotBaseApprover = ""
$snapshotEffectiveApprover = ""

if ($snapshotItem) {
    $snapshotTitle = [string]$snapshotItem.FieldValues["Title"]
    $snapshotRequestId = Get-LookupId -LookupValue $snapshotItem.FieldValues["Solicitacao"]
    $snapshotRuleLookupId = Get-LookupId -LookupValue $snapshotItem.FieldValues["RegraAlcadaUtilizada"]
    $snapshotRuleId = [string]$snapshotItem.FieldValues["RegraInternaId"]
    $snapshotValue = [decimal]$snapshotItem.FieldValues["ValorAnalisado"]
    $snapshotBaseApprover = [string]$snapshotItem.FieldValues["AprovadorBaseId"]
    $snapshotEffectiveApprover = [string]$snapshotItem.FieldValues["AprovadorEfetivoId"]
}

$ruleItem = $null
if ($snapshotRuleLookupId) {
    $ruleItem = Get-ListItemByIdOrNull -Connection $connection -ListIdentity $alcadasIdentity -ItemId $snapshotRuleLookupId -Fields @("Title", "RegraInternaId")
}

$ruleTitle = ""
$ruleInternalId = ""
if ($ruleItem) {
    $ruleTitle = [string]$ruleItem.FieldValues["Title"]
    $ruleInternalId = [string]$ruleItem.FieldValues["RegraInternaId"]
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Auditoria vínculo snapshot V2.3C") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Marcador: V2.3B-TESTE") | Out-Null
$lines.Add("Requisicao de teste: $requisicaoId") | Out-Null
$lines.Add("Snapshot esperado: $expectedSnapshotTitle") | Out-Null
$lines.Add("Regra esperada: $expectedRuleId") | Out-Null
$lines.Add("Valor esperado: $($expectedValue.ToString('0.00', [System.Globalization.CultureInfo]::InvariantCulture))") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Verificacao | Status | Detalhe |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null

Add-AuditLine $lines "Lista 02 validada por GUID" "OK" $lista02.Id
Add-AuditLine $lines "ENAC Snapshots Regras validada por GUID" "OK" $snapshots.Id
Add-AuditLine $lines "ENAC Alcadas validada por GUID" "OK" $alcadas.Id
Add-AuditLine $lines "Requisicao encontrada" (Get-Status -Condition ($null -ne $requestItem) -FailureStatus "AUSENTE") "ItemId=$requisicaoId"
Add-AuditLine $lines "SnapshotAprovacaoCompra preenchido" (Get-Status -Condition ($null -ne $snapshotLookupId) -FailureStatus "AUSENTE") "LookupId=$snapshotLookupId; LookupValue=$snapshotLookupTitle"
Add-AuditLine $lines "SnapshotAprovacaoCompra aponta para snapshot esperado" (Get-Status -Condition ($snapshotTitle -eq $expectedSnapshotTitle)) "Title=$snapshotTitle"
Add-AuditLine $lines "Snapshot aponta para a mesma requisicao" (Get-Status -Condition ($snapshotRequestId -eq $requisicaoId)) "Solicitacao.LookupId=$snapshotRequestId"
Add-AuditLine $lines "Snapshot usa regra interna esperada" (Get-Status -Condition ($snapshotRuleId -eq $expectedRuleId)) "RegraInternaId=$snapshotRuleId"
Add-AuditLine $lines "Valor analisado esperado" (Get-Status -Condition ($snapshotValue -eq $expectedValue)) "ValorAnalisado=$(Format-DecimalOrBlank -Value $snapshotValue)"
Add-AuditLine $lines "Aprovador base esperado" (Get-Status -Condition ($snapshotBaseApprover -eq $expectedApproverId)) "AprovadorBaseId=$snapshotBaseApprover"
Add-AuditLine $lines "Aprovador efetivo esperado" (Get-Status -Condition ($snapshotEffectiveApprover -eq $expectedApproverId)) "AprovadorEfetivoId=$snapshotEffectiveApprover"
Add-AuditLine $lines "Regra de alcada encontrada" (Get-Status -Condition ($null -ne $ruleItem) -FailureStatus "AUSENTE") "LookupId=$snapshotRuleLookupId"
Add-AuditLine $lines "Regra de alcada com codigo esperado" (Get-Status -Condition ($ruleInternalId -eq $expectedRuleId)) "RegraInternaId=$ruleInternalId"
Add-AuditLine $lines "Regra de alcada com titulo esperado" (Get-Status -Condition ($ruleTitle -eq $expectedRuleTitle)) "Title=$ruleTitle"

$hasDivergence = $lines | Where-Object { $_ -match "\|\s*(AUSENTE|DIVERGENTE)\s*\|" }
$lines.Add("") | Out-Null
if ($hasDivergence) {
    $lines.Add("Resultado: DIVERGENTE") | Out-Null
}
else {
    $lines.Add("Resultado: OK") | Out-Null
}

$lines | Set-Content -LiteralPath $outputPath -Encoding UTF8
Write-Host "Auditoria readonly V2.3C gerada: $outputPath"
