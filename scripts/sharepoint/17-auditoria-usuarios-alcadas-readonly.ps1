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

$targets = @(
    [pscustomobject]@{
        Key = "UsuariosPerfis"
        Title = "ENAC Usuarios Perfis"
        Guid = "99cb9bae-5589-4f8b-854b-08adce371e82"
        MarkdownFile = "v2.9a-auditoria-usuarios-perfis-readonly.md"
        JsonFile = "v2.9a-auditoria-usuarios-perfis-readonly.json"
        ItemFields = @("ID","Title","UsuarioInternoId","ContaMicrosoft365","EmailCorporativo","PerfilPrincipal","PerfisAdicionais","CargoFuncao","UsuarioAtivo","Observacoes")
    },
    [pscustomobject]@{
        Key = "Alcadas"
        Title = "ENAC Alcadas"
        Guid = "901d4458-15b4-427b-a869-161c63cf70ef"
        MarkdownFile = "v2.9a-auditoria-alcadas-readonly.md"
        JsonFile = "v2.9a-auditoria-alcadas-readonly.json"
        ItemFields = @("ID","Title","RegraInternaId","Processo","TipoSolicitacao","Obra","ValorMinimo","ValorMaximo","Ilimitado","AprovadorPrincipal","AprovadorAdicional","Ativa","VigenciaInicial","VigenciaFinal","Observacoes")
    }
)

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

function ConvertTo-SafeItemValue {
    param($Value)

    if ($null -eq $Value) { return "" }

    if ($Value -is [array]) {
        return (@($Value) | ForEach-Object { ConvertTo-SafeItemValue $_ }) -join ", "
    }

    $lookupValue = $Value.PSObject.Properties["LookupValue"]
    if ($lookupValue) {
        return ConvertTo-SafeText $lookupValue.Value
    }

    $email = $Value.PSObject.Properties["Email"]
    if ($email) {
        return "[email omitido]"
    }

    return ConvertTo-SafeText $Value
}

function Add-Line {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

function Get-AuditFieldRows {
    param($Connection, [string]$ListGuid)

    $fields = @(Get-PnPField -Connection $Connection -List $ListGuid)

    return @($fields | Sort-Object InternalName | ForEach-Object {
        [pscustomobject]@{
            InternalName = ConvertTo-SafeText $_.InternalName
            Title = ConvertTo-SafeText $_.Title
            TypeAsString = ConvertTo-SafeText $_.TypeAsString
            Required = [bool]$_.Required
            ReadOnlyField = [bool]$_.ReadOnlyField
            Hidden = [bool]$_.Hidden
            Choices = @(Get-FieldChoices -Field $_)
            LookupList = ConvertTo-SafeText $_.LookupList
            LookupField = ConvertTo-SafeText $_.LookupField
            Formula = ConvertTo-SafeText $_.Formula
        }
    })
}

function Get-AuditItemRows {
    param($Connection, $Target, $FieldRows)

    $existingFields = @($Target.ItemFields | Where-Object {
        $fieldName = $_
        @($FieldRows | Where-Object { $_.InternalName -eq $fieldName }).Count -gt 0
    })

    $fieldsToRead = @("ID","Title") + $existingFields | Select-Object -Unique
    $items = @(Get-PnPListItem -Connection $Connection -List $Target.Guid -PageSize 200 -Fields $fieldsToRead)

    return @($items | ForEach-Object {
        $values = [ordered]@{}
        foreach ($fieldName in $fieldsToRead) {
            $values[$fieldName] = ConvertTo-SafeItemValue $_[$fieldName]
        }

        [pscustomobject]@{
            Id = [int]$_.Id
            Title = ConvertTo-SafeItemValue $_["Title"]
            Values = $values
        }
    })
}

function Write-AuditReport {
    param($Report, [string]$MarkdownPath, [string]$JsonPath)

    $Report | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonPath -Encoding UTF8

    $lines = [System.Collections.Generic.List[string]]::new()
    Add-Line $lines "# V2.9A - Auditoria Readonly - $($Report.ListTitle)"
    Add-Line $lines ""
    Add-Line $lines "Data local: $($Report.GeneratedAt)"
    Add-Line $lines "Modo: readonly conectado"
    Add-Line $lines "Site: $($Report.SiteTitle)"
    Add-Line $lines "Url: $($Report.SiteUrl)"
    Add-Line $lines "Lista: $($Report.ListTitle)"
    Add-Line $lines "GUID: $($Report.ListId)"
    Add-Line $lines "Itens: $($Report.ItemCount)"
    Add-Line $lines ""
    Add-Line $lines "## Confirmacoes"
    Add-Line $lines ""
    Add-Line $lines "- O script usa somente leitura PnP."
    Add-Line $lines "- O script nao altera listas, campos, itens, permissoes ou dados."
    Add-Line $lines "- E-mails e logins sao sanitizados nos relatorios."
    Add-Line $lines "- A escrita administrativa permanece bloqueada ate etapa futura autorizada."
    Add-Line $lines ""
    Add-Line $lines "## Campos"
    Add-Line $lines ""
    Add-Line $lines "| InternalName | Titulo | Tipo | Obrigatorio | ReadOnly | Oculto | Choices | LookupList | LookupField | Formula |"
    Add-Line $lines "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
    foreach ($field in $Report.Fields) {
        Add-Line $lines "| $($field.InternalName) | $($field.Title) | $($field.TypeAsString) | $($field.Required) | $($field.ReadOnlyField) | $($field.Hidden) | $(@($field.Choices) -join ', ') | $($field.LookupList) | $($field.LookupField) | $($field.Formula) |"
    }
    Add-Line $lines ""
    Add-Line $lines "## Itens sanitizados"
    Add-Line $lines ""
    Add-Line $lines "| ID | Title | Campos principais |"
    Add-Line $lines "| ---: | --- | --- |"
    foreach ($item in $Report.Items) {
        $parts = @()
        foreach ($entry in $item.Values.GetEnumerator()) {
            if ($entry.Key -ne "ID" -and $entry.Key -ne "Title" -and $entry.Value) {
                $parts += "$($entry.Key): $($entry.Value)"
            }
        }
        Add-Line $lines "| $($item.Id) | $($item.Title) | $($parts -join '; ') |"
    }

    [System.IO.File]::WriteAllLines($MarkdownPath, $lines, [System.Text.UTF8Encoding]::new($false))
}

Assert-Prerequisites

$outputFullDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $outputFullDirectory)) {
    New-Item -ItemType Directory -Path $outputFullDirectory | Out-Null
}

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection -Includes Url,Title

foreach ($target in $targets) {
    $list = Get-PnPList -Connection $connection -Identity $target.Guid -Includes Title,Id,Hidden,ItemCount,RootFolder
    $fieldRows = Get-AuditFieldRows -Connection $connection -ListGuid $target.Guid
    $itemRows = Get-AuditItemRows -Connection $connection -Target $target -FieldRows $fieldRows

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
        Items = $itemRows
    }

    $jsonPath = Join-Path $outputFullDirectory $target.JsonFile
    $markdownPath = Join-Path $outputFullDirectory $target.MarkdownFile
    Write-AuditReport -Report $report -MarkdownPath $markdownPath -JsonPath $jsonPath

    Write-Host "Auditoria readonly gerada para $($target.Title):"
    Write-Host "JSON: $jsonPath"
    Write-Host "Markdown: $markdownPath"
}
