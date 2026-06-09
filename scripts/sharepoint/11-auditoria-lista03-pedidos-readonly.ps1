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
    [string]$OutputDirectory = ".\reports"
)

$ErrorActionPreference = "Stop"

$listGuid = "18ca132a-c36a-42aa-9968-d87ecd547a79"
$targetInternalNames = @(
    "Title",
    "SolicitacaoId",
    "Fornecedor",
    "Fornecedor0",
    "ValordoPedido",
    "DatadoPedido",
    "StatusdoPedido"
)
$targetPatterns = @("Solicit", "Requis", "Obra", "Centro", "Snapshot")

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio."
    }

    if (-not (Get-Module -ListAvailable PnP.PowerShell | Select-Object -First 1)) {
        throw "Modulo PnP.PowerShell nao encontrado."
    }
}

function Connect-PnPReadonly {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function ConvertTo-SafeText {
    param($Value)

    if ($null -eq $Value) { return "" }
    $text = [string]$Value
    $text = $text -replace "\|", "/"
    $text = $text -replace "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[email omitido]"
    return $text
}

function Get-FieldChoices {
    param($Field)

    try {
        if ($Field.TypeAsString -eq "Choice" -or $Field.TypeAsString -eq "MultiChoice") {
            return @($Field.Choices | ForEach-Object { ConvertTo-SafeText $_ })
        }
    }
    catch {
        return @("erro leitura choices: $(ConvertTo-SafeText $_.Exception.Message)")
    }

    return @()
}

function Test-HighlightedField {
    param($Field)

    if ($targetInternalNames -contains $Field.InternalName) {
        return $true
    }

    foreach ($pattern in $targetPatterns) {
        if ($Field.InternalName -like "*$pattern*" -or $Field.Title -like "*$pattern*") {
            return $true
        }
    }

    return $false
}

function Add-Line {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

Assert-Prerequisites

$outputFullDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $outputFullDirectory)) {
    New-Item -ItemType Directory -Path $outputFullDirectory | Out-Null
}

$jsonPath = Join-Path $outputFullDirectory "lista03-pedidos-fields-readonly.json"
$markdownPath = Join-Path $outputFullDirectory "lista03-pedidos-fields-readonly.md"

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection -Includes Url,Title
$list = Get-PnPList -Connection $connection -Identity $listGuid -Includes Title,Id,Hidden,ItemCount,RootFolder,Fields
$fields = @(Get-PnPField -Connection $connection -List $listGuid)

$fieldRows = foreach ($field in $fields | Sort-Object InternalName) {
    [pscustomobject]@{
        InternalName = ConvertTo-SafeText $field.InternalName
        Title = ConvertTo-SafeText $field.Title
        TypeAsString = ConvertTo-SafeText $field.TypeAsString
        Required = [bool]$field.Required
        ReadOnlyField = [bool]$field.ReadOnlyField
        Hidden = [bool]$field.Hidden
        Choices = @(Get-FieldChoices -Field $field)
        LookupList = ConvertTo-SafeText $field.LookupList
        LookupField = ConvertTo-SafeText $field.LookupField
        Formula = ConvertTo-SafeText $field.Formula
        Highlighted = [bool](Test-HighlightedField -Field $field)
    }
}

$report = [pscustomobject]@{
    GeneratedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    Mode = "readonly"
    SiteTitle = ConvertTo-SafeText $web.Title
    SiteUrl = ConvertTo-SafeText $web.Url
    ListTitle = ConvertTo-SafeText $list.Title
    ListId = [string]$list.Id
    ListUrl = ConvertTo-SafeText $list.RootFolder.ServerRelativeUrl
    ItemCount = [int]$list.ItemCount
    Fields = $fieldRows
    HighlightedFields = @($fieldRows | Where-Object { $_.Highlighted })
    ConfirmationsNeeded = @(
        "Confirmar se SolicitacaoId existe ou qual campo vincula a Lista 02.",
        "Confirmar fornecedor correto: Fornecedor texto legado ou Fornecedor0 lookup.",
        "Confirmar choices reais e status inicial de StatusdoPedido.",
        "Confirmar campos obrigatorios antes de qualquer criacao.",
        "Confirmar se ha pedido existente vinculado ao item 11 antes de qualquer escrita."
    )
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

$lines = [System.Collections.Generic.List[string]]::new()
Add-Line $lines "# Auditoria readonly Lista 03 - Pedidos de Compra"
Add-Line $lines ""
Add-Line $lines "Data local: $($report.GeneratedAt)"
Add-Line $lines "Modo: readonly conectado"
Add-Line $lines "Site: $($report.SiteTitle)"
Add-Line $lines "Url: $($report.SiteUrl)"
Add-Line $lines "Lista: $($report.ListTitle)"
Add-Line $lines "GUID: $($report.ListId)"
Add-Line $lines "Itens: $($report.ItemCount)"
Add-Line $lines ""
Add-Line $lines "## Confirmacoes"
Add-Line $lines ""
Add-Line $lines "- O script le apenas metadados da lista e campos."
Add-Line $lines "- O script nao altera listas, campos, itens, permissoes ou dados."
Add-Line $lines "- O script nao le conteudo de itens de pedido."
Add-Line $lines "- O script nao executa escrita operacional."
Add-Line $lines ""
Add-Line $lines "## Campos destacados"
Add-Line $lines ""
Add-Line $lines "| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto | Choices | LookupList | LookupField | Formula |"
Add-Line $lines "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
foreach ($field in $report.HighlightedFields) {
    Add-Line $lines "| $($field.InternalName) | $($field.Title) | $($field.TypeAsString) | $($field.Required) | $($field.ReadOnlyField) | $($field.Hidden) | $(@($field.Choices) -join ', ') | $($field.LookupList) | $($field.LookupField) | $($field.Formula) |"
}
Add-Line $lines ""
Add-Line $lines "## Todos os campos"
Add-Line $lines ""
Add-Line $lines "| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto |"
Add-Line $lines "| --- | --- | --- | --- | --- | --- |"
foreach ($field in $report.Fields) {
    Add-Line $lines "| $($field.InternalName) | $($field.Title) | $($field.TypeAsString) | $($field.Required) | $($field.ReadOnlyField) | $($field.Hidden) |"
}
Add-Line $lines ""
Add-Line $lines "## Pendencias para V2.7A.5B"
Add-Line $lines ""
foreach ($item in $report.ConfirmationsNeeded) {
    Add-Line $lines "- $item"
}

[System.IO.File]::WriteAllLines($markdownPath, $lines, [System.Text.UTF8Encoding]::new($false))

Write-Host "Auditoria readonly Lista 03 gerada:"
Write-Host "JSON: $jsonPath"
Write-Host "Markdown: $markdownPath"
