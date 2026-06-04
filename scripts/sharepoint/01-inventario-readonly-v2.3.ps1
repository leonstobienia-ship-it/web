param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras",

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [string]$Tenant = "enaccombr.onmicrosoft.com",

    [Parameter(Mandatory = $false)]
    [ValidateSet("Interactive", "DeviceLogin")]
    [string]$AuthMode = "DeviceLogin",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = ".\sharepoint",

    [Parameter(Mandatory = $false)]
    [switch]$IncluirListasSistema
)

$ErrorActionPreference = "Stop"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion). Instale com: winget install Microsoft.PowerShell"
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado. Instale no escopo do usuario com: Install-Module PnP.PowerShell -Scope CurrentUser"
    }

    if ([string]::IsNullOrWhiteSpace($ClientId)) {
        throw "Informe o ClientId de um aplicativo Entra ID apto para login PnP."
    }

    if ([string]::IsNullOrWhiteSpace($Tenant)) {
        throw "Informe o dominio tecnico do tenant no formato tenant.onmicrosoft.com."
    }
}

function Normalize-Text {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) { return "" }

    $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
    $builder = [System.Text.StringBuilder]::new()
    foreach ($char in $normalized.ToCharArray()) {
        $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
        if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($char)
        }
    }

    return ($builder.ToString().Normalize([Text.NormalizationForm]::FormC).ToLowerInvariant() -replace "[\u2013\u2014\-\/]+", " " -replace "\s+", " ").Trim()
}

function Convert-ToSafeString {
    param($Value)

    if ($null -eq $Value) { return "" }
    return [string]$Value
}

function Get-FieldProperty {
    param(
        $Field,
        [string]$PropertyName
    )

    try {
        $value = $Field.$PropertyName
        if ($null -eq $value) { return $null }
        return $value
    } catch {
        return $null
    }
}

function Get-ChoicesText {
    param($Field)

    try {
        if ($Field.Choices -and $Field.Choices.Count -gt 0) {
            return ($Field.Choices | ForEach-Object { [string]$_ }) -join " | "
        }
    } catch {
        return ""
    }

    return ""
}

function Test-OperationalCandidate {
    param($List)

    if ($List.Hidden -and -not $IncluirListasSistema) { return $false }

    $title = Normalize-Text $List.Title
    if ($title.StartsWith("lista ")) { return $true }
    if ($title.StartsWith("enac")) { return $true }

    $terms = @(
        "obra",
        "requisicao",
        "compra",
        "pedido",
        "nota fiscal",
        "fornecedor",
        "medicao",
        "contrato",
        "contas a pagar",
        "contas a receber",
        "programacao financeira",
        "mao de obra",
        "documentos",
        "pendencias",
        "ocorrencias",
        "nao conformidades"
    )

    foreach ($term in $terms) {
        if ($title.Contains($term)) { return $true }
    }

    return -not $List.Hidden
}

function Get-KnownOperationalMatch {
    param([string]$Title)

    $known = @(
        @{ Number = "01"; Canonical = "Lista 01 - Controle de Obras ENAC"; Keywords = @("controle", "obras", "enac") },
        @{ Number = "02"; Canonical = "Lista 02 - Requisicoes de Compra"; Keywords = @("requisicoes", "compra") },
        @{ Number = "03"; Canonical = "Lista 03 - Pedidos de Compra"; Keywords = @("pedidos", "compra") },
        @{ Number = "04"; Canonical = "Lista 04 - Notas Fiscais Recebidas"; Keywords = @("notas", "fiscais", "recebidas") },
        @{ Number = "05"; Canonical = "Lista 05 - Contas a Pagar"; Keywords = @("contas", "pagar") },
        @{ Number = "06"; Canonical = "Lista 06 - Fornecedores e Prestadores"; Keywords = @("fornecedores", "prestadores") },
        @{ Number = "07"; Canonical = "Lista 07 - Medicoes da Obra"; Keywords = @("medicoes", "obra") },
        @{ Number = "08"; Canonical = "Lista 08 - Contratos de Prestadores / Servicos"; Keywords = @("contratos", "prestadores") },
        @{ Number = "09"; Canonical = "Lista 09 - Medicoes de Prestadores / Liberacao de Pagamento"; Keywords = @("medicoes", "prestadores", "pagamento") },
        @{ Number = "10"; Canonical = "Lista 10 - Contas a Pagar / Programacao Financeira"; Keywords = @("contas", "pagar", "programacao") },
        @{ Number = "11"; Canonical = "Lista 11 - Contas a Receber / Faturamento"; Keywords = @("contas", "receber", "faturamento") },
        @{ Number = "12"; Canonical = "Lista 12 - Mao de Obra / Alocacao de Equipe"; Keywords = @("mao", "obra", "alocacao") },
        @{ Number = "13"; Canonical = "Lista 13 - Documentos de Funcionarios / Integracoes"; Keywords = @("documentos", "funcionarios") },
        @{ Number = "14"; Canonical = "Lista 14 - Pendencias, Ocorrencias e Nao Conformidades"; Keywords = @("pendencias", "ocorrencias", "conformidades") }
    )

    $normalized = Normalize-Text $Title
    foreach ($item in $known) {
        $numberPattern = "lista\s*0?$($item.Number)"
        $hasNumber = $normalized -match $numberPattern
        $matchedKeywords = 0
        foreach ($keyword in $item.Keywords) {
            if ($normalized.Contains($keyword)) { $matchedKeywords += 1 }
        }

        if ($hasNumber -and $matchedKeywords -ge 1) { return $item.Canonical }
        if ($matchedKeywords -ge [Math]::Min(2, $item.Keywords.Count)) { return $item.Canonical }
    }

    return ""
}

function Test-PriorityField {
    param([string]$FieldTitle, [string]$InternalName)

    $text = Normalize-Text "$FieldTitle $InternalName"
    $terms = @(
        "obra",
        "solicitacao",
        "pedido",
        "nota fiscal",
        "fornecedor",
        "valor",
        "solicitante",
        "aprovador",
        "status",
        "data",
        "centro de custo",
        "programacao financeira"
    )

    foreach ($term in $terms) {
        if ($text.Contains($term)) { return $true }
    }

    return $false
}

function Get-FieldInventory {
    param(
        $Connection,
        $List
    )

    $fields = Get-PnPField -List $List -Connection $Connection
    $result = @()

    foreach ($field in $fields) {
        $lookupField = Get-FieldProperty -Field $field -PropertyName "LookupField"
        $lookupList = Get-FieldProperty -Field $field -PropertyName "LookupList"
        $currencyLocaleId = Get-FieldProperty -Field $field -PropertyName "CurrencyLocaleId"

        $result += [pscustomobject]@{
            Title                = Convert-ToSafeString $field.Title
            InternalName         = Convert-ToSafeString $field.InternalName
            StaticName           = Convert-ToSafeString (Get-FieldProperty -Field $field -PropertyName "StaticName")
            TypeAsString         = Convert-ToSafeString $field.TypeAsString
            Required             = [bool]$field.Required
            Hidden               = [bool]$field.Hidden
            ReadOnlyField        = [bool]$field.ReadOnlyField
            Indexed              = [bool](Get-FieldProperty -Field $field -PropertyName "Indexed")
            EnforceUniqueValues  = [bool](Get-FieldProperty -Field $field -PropertyName "EnforceUniqueValues")
            LookupField          = Convert-ToSafeString $lookupField
            LookupList           = Convert-ToSafeString $lookupList
            Choices              = Get-ChoicesText -Field $field
            DefaultValue         = Convert-ToSafeString (Get-FieldProperty -Field $field -PropertyName "DefaultValue")
            CurrencyLocaleId     = Convert-ToSafeString $currencyLocaleId
            CampoPrioritario     = Test-PriorityField -FieldTitle $field.Title -InternalName $field.InternalName
        }
    }

    return $result
}

function Find-FieldByDisplayName {
    param(
        [array]$Fields,
        [string]$DisplayName
    )

    $target = Normalize-Text $DisplayName
    $exact = $Fields | Where-Object { (Normalize-Text $_.Title) -eq $target } | Select-Object -First 1
    if ($exact) { return $exact }

    return $Fields | Where-Object {
        $fieldText = Normalize-Text "$($_.Title) $($_.InternalName)"
        $fieldText.Contains($target)
    } | Select-Object -First 1
}

function Build-ObrasPriorityFields {
    param([array]$Fields)

    $targets = @(
        "Nome da Obra",
        "Cliente",
        "Status da Obra",
        "Centro de Custo",
        "Pasta SharePoint da Obra",
        "Cronograma Planner",
        "Responsavel Planejamento",
        "Responsavel Compras Financeiro",
        "Responsavel Documental",
        "Diretor Responsavel",
        "Data de Inicio Prevista",
        "Data de Termino Prevista",
        "Valor Contratado",
        "Observacoes"
    )

    $rows = @()
    foreach ($target in $targets) {
        $field = Find-FieldByDisplayName -Fields $Fields -DisplayName $target
        $rows += [pscustomobject]@{
            CampoEsperado       = $target
            Encontrado          = [bool]$field
            TituloEncontrado    = if ($field) { $field.Title } else { "" }
            InternalName        = if ($field) { $field.InternalName } else { "" }
            StaticName          = if ($field) { $field.StaticName } else { "" }
            Tipo                = if ($field) { $field.TypeAsString } else { "" }
        }
    }

    $codigoObra = $Fields | Where-Object {
        $text = Normalize-Text "$($_.Title) $($_.InternalName)"
        $text -match "codigo.*obra" -or $_.InternalName -eq "CodigoObra"
    } | Select-Object -First 1

    return [pscustomobject]@{
        CamposPrioritarios = $rows
        CodigoObraPresente = [bool]$codigoObra
        CodigoObraCampo    = if ($codigoObra) { $codigoObra } else { $null }
    }
}

function Write-InventoryMarkdown {
    param(
        [string]$Path,
        [pscustomobject]$Inventory
    )

    $lines = @()
    $lines += "# Inventario SharePoint V2.3 - Somente Leitura"
    $lines += ""
    $lines += "- Data/hora: $($Inventory.ExecutedAt)"
    $lines += "- Site: $($Inventory.SiteUrl)"
    $lines += "- Listas inventariadas: $($Inventory.Lists.Count)"
    $lines += ""

    $lines += "## Listas Encontradas"
    $lines += ""
    $lines += "| Prioritaria | Titulo | GUID | URL | Oculta | Itens |"
    $lines += "| --- | --- | --- | --- | --- | --- |"
    foreach ($list in $Inventory.Lists) {
        $priority = if ($list.KnownOperationalName) { $list.KnownOperationalName } elseif ($list.IsAdministrativeV23) { "Administrativa V2.3" } else { "" }
        $lines += "| $priority | $($list.Title) | $($list.Id) | $($list.RootFolderServerRelativeUrl) | $($list.Hidden) | $($list.ItemCount) |"
    }
    $lines += ""

    $lines += "## Lista 01 - Controle de Obras ENAC"
    $lines += ""
    if ($Inventory.ObrasList) {
        $lines += "- Titulo real: $($Inventory.ObrasList.Title)"
        $lines += "- GUID: $($Inventory.ObrasList.Id)"
        $lines += "- URL: $($Inventory.ObrasList.RootFolderServerRelativeUrl)"
        $lines += "- Codigo da Obra encontrado: $($Inventory.ObrasPriority.CodigoObraPresente)"
        if ($Inventory.ObrasPriority.CodigoObraPresente) {
            $lines += "- Campo Codigo da Obra: $($Inventory.ObrasPriority.CodigoObraCampo.Title) / $($Inventory.ObrasPriority.CodigoObraCampo.InternalName)"
        }
        $lines += ""
        $lines += "| Campo esperado | Encontrado | Titulo real | InternalName | Tipo |"
        $lines += "| --- | --- | --- | --- | --- |"
        foreach ($field in $Inventory.ObrasPriority.CamposPrioritarios) {
            $lines += "| $($field.CampoEsperado) | $($field.Encontrado) | $($field.TituloEncontrado) | $($field.InternalName) | $($field.Tipo) |"
        }
    } else {
        $lines += "Lista de obras nao encontrada no inventario filtrado."
    }
    $lines += ""

    $lines += "## Listas Operacionais 02 a 14"
    $lines += ""
    foreach ($list in ($Inventory.Lists | Where-Object { $_.KnownOperationalName -and $_.KnownOperationalName -notlike "Lista 01*" })) {
        $lines += "### $($list.KnownOperationalName)"
        $lines += ""
        $lines += "- Titulo real: $($list.Title)"
        $lines += "- GUID: $($list.Id)"
        $lines += "- URL: $($list.RootFolderServerRelativeUrl)"
        $priorityFields = $list.Fields | Where-Object { $_.CampoPrioritario }
        if ($priorityFields.Count -gt 0) {
            $lines += ""
            $lines += "| Campo | InternalName | Tipo | LookupLista | LookupCampo |"
            $lines += "| --- | --- | --- | --- | --- |"
            foreach ($field in $priorityFields) {
                $lines += "| $($field.Title) | $($field.InternalName) | $($field.TypeAsString) | $($field.LookupList) | $($field.LookupField) |"
            }
        }
        $lines += ""
    }

    $lines += "## Listas Administrativas V2.3"
    $lines += ""
    $lines += "| Lista esperada | Status | Titulo real | GUID |"
    $lines += "| --- | --- | --- | --- |"
    foreach ($admin in $Inventory.AdministrativeListsV23) {
        $lines += "| $($admin.ExpectedTitle) | $($admin.Status) | $($admin.RealTitle) | $($admin.Id) |"
    }
    $lines += ""

    $lines += "## Divergencias Iniciais"
    $lines += ""
    if ($Inventory.Divergences.Count -eq 0) {
        $lines += "Nenhuma divergencia automatica identificada. Revisar nomes internos manualmente antes de provisionar."
    } else {
        foreach ($divergence in $Inventory.Divergences) {
            $lines += "- $divergence"
        }
    }
    $lines += ""

    $lines += "## Recomendacao"
    $lines += ""
    $lines += "Revisar este inventario antes de gerar qualquer script de provisionamento. Confirmar nomes internos reais, tipos de lookup/pessoa e lista base de obras antes da V2.3B."

    $lines | Out-File -LiteralPath $Path -Encoding utf8
}

Assert-Prerequisites

$resolvedOutput = Resolve-Path -LiteralPath $OutputDirectory -ErrorAction SilentlyContinue
if (-not $resolvedOutput) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $resolvedOutput = Resolve-Path -LiteralPath $OutputDirectory
}

$outputPath = $resolvedOutput.Path
$jsonPath = Join-Path $outputPath "inventario-listas-reais-v2.3.json"
$csvPath = Join-Path $outputPath "inventario-listas-reais-v2.3.csv"
$mdPath = Join-Path $outputPath "inventario-listas-reais-v2.3.md"

if ($AuthMode -eq "DeviceLogin") {
    Write-Host "Iniciando autenticacao por codigo de dispositivo em modo somente leitura: $SiteUrl" -ForegroundColor Cyan

    $connection = Connect-PnPOnline `
        -Url $SiteUrl `
        -DeviceLogin `
        -Tenant $Tenant `
        -ClientId $ClientId `
        -ReturnConnection
}
else {
    Write-Host "Iniciando autenticacao interativa em modo somente leitura: $SiteUrl" -ForegroundColor Cyan

    $connection = Connect-PnPOnline `
        -Url $SiteUrl `
        -Interactive `
        -ClientId $ClientId `
        -ReturnConnection
}

try {
    Get-PnPWeb -Connection $connection | Out-Null
} catch {
    Write-Warning "Conexao autenticada, mas nao foi possivel validar o web atual sem consulta adicional."
}

$lists = Get-PnPList -Connection $connection -Includes RootFolder,BaseTemplate,BaseType,Hidden,ItemCount,EnableVersioning,Created,LastItemModifiedDate
$selectedLists = $lists | Where-Object { $IncluirListasSistema -or (Test-OperationalCandidate -List $_) } | Sort-Object Title

$listInventory = @()
foreach ($list in $selectedLists) {
    Write-Host "Inventariando lista: $($list.Title)"
    $fields = Get-FieldInventory -Connection $connection -List $list
    $knownName = Get-KnownOperationalMatch -Title $list.Title
    $isAdmin = @("ENAC Usuarios Perfis", "ENAC Alcadas", "ENAC Historico Configuracoes", "ENAC Snapshots Regras") -contains $list.Title

    $listInventory += [pscustomobject]@{
        Title                       = Convert-ToSafeString $list.Title
        Id                          = Convert-ToSafeString $list.Id
        RootFolderServerRelativeUrl = Convert-ToSafeString $list.RootFolder.ServerRelativeUrl
        BaseTemplate                = Convert-ToSafeString $list.BaseTemplate
        BaseType                    = Convert-ToSafeString $list.BaseType
        Hidden                      = [bool]$list.Hidden
        ItemCount                   = [int]$list.ItemCount
        EnableVersioning            = [bool]$list.EnableVersioning
        Created                     = Convert-ToSafeString $list.Created
        LastItemModifiedDate        = Convert-ToSafeString $list.LastItemModifiedDate
        KnownOperationalName        = $knownName
        IsAdministrativeV23         = $isAdmin
        Fields                      = $fields
    }
}

$obrasListId = "ba9afadc-f843-45c0-a628-4f49a8716832"
$obrasList = $listInventory | Where-Object {
    $_.Id.ToLowerInvariant() -eq $obrasListId -or
    (Normalize-Text $_.Title) -eq (Normalize-Text "Lista 01 - Controle de Obras ENAC") -or
    $_.KnownOperationalName -eq "Lista 01 - Controle de Obras ENAC"
} | Select-Object -First 1

$obrasPriority = if ($obrasList) { Build-ObrasPriorityFields -Fields $obrasList.Fields } else { $null }

$expectedAdminLists = @("ENAC Usuarios Perfis", "ENAC Alcadas", "ENAC Historico Configuracoes", "ENAC Snapshots Regras")
$adminStatus = foreach ($expected in $expectedAdminLists) {
    $real = $listInventory | Where-Object { $_.Title -eq $expected } | Select-Object -First 1
    [pscustomobject]@{
        ExpectedTitle = $expected
        Status        = if ($real) { "Existente" } else { "Ausente" }
        RealTitle     = if ($real) { $real.Title } else { "" }
        Id            = if ($real) { $real.Id } else { "" }
    }
}

$divergences = @()
foreach ($admin in $adminStatus) {
    if ($admin.Status -eq "Ausente") {
        $divergences += "Lista administrativa V2.3 ausente: $($admin.ExpectedTitle)"
    }
}
if (-not $obrasList) {
    $divergences += "Lista 01 - Controle de Obras ENAC nao encontrada pelo titulo aproximado nem pelo GUID informado."
}
if ($obrasPriority -and -not $obrasPriority.CodigoObraPresente) {
    $divergences += "Campo equivalente a Codigo da Obra/CodigoObra nao identificado na lista de obras."
}

$inventory = [pscustomobject]@{
    Version                 = "V2.3A"
    Mode                    = "Readonly"
    ExecutedAt              = (Get-Date).ToString("s")
    SiteUrl                 = $SiteUrl
    IncludeSystemLists      = [bool]$IncluirListasSistema
    Lists                   = $listInventory
    ObrasList               = $obrasList
    ObrasPriority           = $obrasPriority
    AdministrativeListsV23  = $adminStatus
    Divergences             = $divergences
}

$inventory | ConvertTo-Json -Depth 20 | Out-File -LiteralPath $jsonPath -Encoding utf8

$csvRows = foreach ($list in $listInventory) {
    foreach ($field in $list.Fields) {
        [pscustomobject]@{
            ListaTitulo       = $list.Title
            ListaId           = $list.Id
            ListaUrl          = $list.RootFolderServerRelativeUrl
            CampoTitulo       = $field.Title
            CampoInternalName = $field.InternalName
            Tipo              = $field.TypeAsString
            Obrigatorio       = $field.Required
            Oculto            = $field.Hidden
            SomenteLeitura    = $field.ReadOnlyField
            LookupLista       = $field.LookupList
            LookupCampo       = $field.LookupField
        }
    }
}
$csvRows | Export-Csv -LiteralPath $csvPath -Delimiter ";" -Encoding utf8

Write-InventoryMarkdown -Path $mdPath -Inventory $inventory

Write-Host "Inventario concluido."
Write-Host "JSON: $jsonPath"
Write-Host "CSV:  $csvPath"
Write-Host "MD:   $mdPath"
