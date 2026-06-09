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
    [ValidateSet("Both", "ContasPagar", "ProgramacaoFinanceira")]
    [string]$Target = "Both",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = ".\reports"
)

$ErrorActionPreference = "Stop"

$listTargets = @(
    [pscustomobject]@{
        Key = "ContasPagar"
        LogicalName = "Lista 05 - Contas a Pagar"
        Guid = "69b7469b-9cb9-4509-87dd-bba00b8142fd"
        OutputPrefix = "lista05-contas-pagar"
        CandidateTitles = @(
            "05 — Contas a Pagar",
            "05 - Contas a Pagar",
            "Lista 05 — Contas a Pagar",
            "Lista 05 - Contas a Pagar",
            "Contas a Pagar"
        )
    },
    [pscustomobject]@{
        Key = "ProgramacaoFinanceira"
        LogicalName = "Lista 10 - Contas a Pagar / Programacao Financeira"
        Guid = "f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680"
        OutputPrefix = "lista10-programacao-financeira"
        CandidateTitles = @(
            "Lista 10 — Contas a Pagar / Programação Financeira",
            "Lista 10 - Contas a Pagar / Programacao Financeira",
            "Lista 10 — Programação Financeira",
            "Lista 10 - Programacao Financeira",
            "Programação Financeira",
            "Programacao Financeira"
        )
    }
)

$targetInternalNames = @(
    "Title",
    "N_x00ba_ControleNF",
    "N_x00ba_daNotaFiscal",
    "N_x00ba_doPedido",
    "NotaFiscal",
    "NotaFiscalId",
    "Fornecedor",
    "Fornecedor0",
    "Fornecedor0Id",
    "CNPJFornecedor",
    "ValoraPagar",
    "Valor",
    "ValorBruto",
    "ValorLiquido",
    "DatadeVencimento",
    "DataProgramadadePagamento",
    "DatadoPagamento",
    "FormadePagamento",
    "StatusdoPagamento",
    "Banco",
    "Conta",
    "ChavePix",
    "Obra",
    "CentrodeCusto",
    "LinkdaNF",
    "LinkdoComprovante",
    "EnviadoparaContabilidade_x003f_",
    "Observa_x00e7__x00f5_es",
    "Attachments"
)

$targetPatterns = @(
    "NF",
    "Nota",
    "Fiscal",
    "Pedido",
    "Fornecedor",
    "Valor",
    "Vencimento",
    "Pagamento",
    "Program",
    "Status",
    "Banco",
    "Conta",
    "Pix",
    "Boleto",
    "Forma",
    "Obra",
    "Centro",
    "Requisi",
    "Anexo",
    "Attachment"
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

function Resolve-ReadonlyList {
    param(
        $Connection,
        $TargetDefinition
    )

    try {
        return Get-PnPList -Connection $Connection -Identity $TargetDefinition.Guid -Includes Title,Id,Hidden,ItemCount,RootFolder,Fields
    }
    catch {
        foreach ($title in $TargetDefinition.CandidateTitles) {
            try {
                return Get-PnPList -Connection $Connection -Identity $title -Includes Title,Id,Hidden,ItemCount,RootFolder,Fields
            }
            catch {
                continue
            }
        }

        throw "$($TargetDefinition.LogicalName) nao localizada por GUID ou nomes candidatos."
    }
}

function Invoke-ReadonlyAudit {
    param(
        $Connection,
        $Web,
        $TargetDefinition,
        [string]$OutputFullDirectory
    )

    $jsonPath = Join-Path $OutputFullDirectory "$($TargetDefinition.OutputPrefix)-fields-readonly.json"
    $markdownPath = Join-Path $OutputFullDirectory "$($TargetDefinition.OutputPrefix)-fields-readonly.md"

    $list = Resolve-ReadonlyList -Connection $Connection -TargetDefinition $TargetDefinition
    $fields = @(Get-PnPField -Connection $Connection -List $list.Id)

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
        Target = ConvertTo-SafeText $TargetDefinition.LogicalName
        SiteTitle = ConvertTo-SafeText $Web.Title
        SiteUrl = ConvertTo-SafeText $Web.Url
        ListTitle = ConvertTo-SafeText $list.Title
        ListId = [string]$list.Id
        ListUrl = ConvertTo-SafeText $list.RootFolder.ServerRelativeUrl
        ItemCount = [int]$list.ItemCount
        Fields = $fieldRows
        HighlightedFields = @($fieldRows | Where-Object { $_.Highlighted })
        ConfirmationsNeeded = @(
            "Confirmar campo real de vinculo com a NF Lista 04 item 4.",
            "Confirmar se o vinculo com NF e lookup ou texto.",
            "Confirmar campo de fornecedor e se deve herdar Fornecedor0 da NF.",
            "Confirmar campo de valor e se aceita 6720.",
            "Confirmar campo de vencimento e se deve copiar DatadeVencimento da NF.",
            "Confirmar choices reais e status inicial de pagamento/programacao.",
            "Confirmar campos de forma de pagamento, banco, conta, PIX ou boleto.",
            "Confirmar campos obrigatorios de obra e centro de custo.",
            "Confirmar como detectar duplicidade para a NF 4.",
            "Confirmar se anexos, boleto ou comprovante sao obrigatorios na programacao."
        )
    }

    $report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

    $lines = [System.Collections.Generic.List[string]]::new()
    Add-Line $lines "# Auditoria readonly $($TargetDefinition.LogicalName)"
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
    Add-Line $lines "- O script nao executa escrita operacional."
    Add-Line $lines "- O script nao inicia Power Automate."
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
    Add-Line $lines "## Confirmacoes pendentes antes de ProgramarPagamento"
    Add-Line $lines ""
    foreach ($item in $report.ConfirmationsNeeded) {
        Add-Line $lines "- $item"
    }

    $lines | Set-Content -Path $markdownPath -Encoding UTF8

    return [pscustomobject]@{
        Target = $TargetDefinition.LogicalName
        ListTitle = $report.ListTitle
        ListId = $report.ListId
        JsonPath = $jsonPath
        MarkdownPath = $markdownPath
    }
}

Assert-Prerequisites

$outputFullDirectory = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $outputFullDirectory)) {
    New-Item -ItemType Directory -Path $outputFullDirectory | Out-Null
}

$selectedTargets = if ($Target -eq "Both") {
    $listTargets
}
else {
    @($listTargets | Where-Object { $_.Key -eq $Target })
}

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection -Includes Url,Title

$results = foreach ($targetDefinition in $selectedTargets) {
    Invoke-ReadonlyAudit -Connection $connection -Web $web -TargetDefinition $targetDefinition -OutputFullDirectory $outputFullDirectory
}

$results | Format-Table -AutoSize
