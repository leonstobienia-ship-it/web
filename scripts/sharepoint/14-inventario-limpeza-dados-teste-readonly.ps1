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

$markers = @(
    "V2.3B-TESTE",
    "V2.6A-TESTE",
    "V2.7A-TESTE",
    "V2.8B-HOMOLOGACAO"
)

$targets = @(
    [pscustomobject]@{ Key = "Lista02"; Title = "Lista 02 - Requisicoes de Compra"; Guid = "0a204b87-b9a1-4d16-8654-55567a62ed01"; Fields = @("Title","CentrodeCusto","Descri_x00e7__x00e3_odaSolicita_","Observa_x00e7__x00f5_es","StatusdaRequisi_x00e7__x00e3_o") },
    [pscustomobject]@{ Key = "Snapshots"; Title = "ENAC Snapshots Regras"; Guid = "767e1867-8a98-46be-9dcc-be53a12c51aa"; Fields = @("Title","Processo","RegraAlcadaUtilizada","AprovadorBaseNome","AprovadorEfetivoNome") },
    [pscustomobject]@{ Key = "Lista03"; Title = "Lista 03 - Pedidos de Compra"; Guid = "18ca132a-c36a-42aa-9968-d87ecd547a79"; Fields = @("Title","N_x00ba_daRequisi_x00e7__x00e3_o","StatusdoPedido","CentrodeCusto") },
    [pscustomobject]@{ Key = "Lista04"; Title = "Lista 04 - Notas Fiscais Recebidas"; Guid = "25aa4447-193d-418a-8e71-9bfd8e9995da"; Fields = @("Title","N_x00ba_doPedido","N_x00ba_daNotaFiscal","StatusdaConfer_x00ea_ncia") },
    [pscustomobject]@{ Key = "Lista10"; Title = "Lista 10 - Contas a Pagar / Programacao Financeira"; Guid = "f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680"; Fields = @("Title","N_x00ba_daNotaFiscal","StatusdoPagamento","CentrodeCusto") },
    [pscustomobject]@{ Key = "Historico"; Title = "ENAC Historico Configuracoes"; Guid = "cac67186-e478-4f15-b5a0-2db92d74b2c4"; Fields = @("Title","TipoConfiguracao","AcaoRealizada","ItemConfiguracaoId","Justificativa") },
    [pscustomobject]@{ Key = "Usuarios"; Title = "ENAC Usuarios Perfis"; Guid = "99cb9bae-5589-4f8b-854b-08adce371e82"; Fields = @("Title","UsuarioInternoId","EmailCorporativo","PerfilPrincipal","UsuarioAtivo") },
    [pscustomobject]@{ Key = "Alcadas"; Title = "ENAC Alcadas"; Guid = "901d4458-15b4-427b-a869-161c63cf70ef"; Fields = @("Title","RegraInternaId","Processo","AprovadorPrincipal","Ativa") }
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

function Test-MarkerText {
    param([string]$Text)

    foreach ($marker in $markers) {
        if ($Text -like "*$marker*") {
            return $true
        }
    }

    return $false
}

function Get-Classification {
    param(
        [string]$ListKey,
        [string]$Text
    )

    if ($ListKey -eq "Historico" -or $ListKey -eq "Snapshots") {
        return "manter como evidencia"
    }

    if ($ListKey -eq "Usuarios" -or $ListKey -eq "Alcadas") {
        return "cancelar/inativar em vez de excluir"
    }

    if (Test-MarkerText $Text) {
        return "candidato a limpeza apos confirmacao"
    }

    return "nao mexer"
}

function Add-Line {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

Assert-Prerequisites

$outputFullDirectory = Resolve-Path -Path "."
if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$outputFullDirectory = (Resolve-Path $OutputDirectory).Path

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection
$rows = New-Object System.Collections.Generic.List[object]

foreach ($target in $targets) {
    try {
        $list = Get-PnPList -Connection $connection -Identity $target.Guid -Includes Title,Id,ItemCount
        $fieldList = @("Id","Title") + $target.Fields | Select-Object -Unique
        $items = @(Get-PnPListItem -Connection $connection -List $list.Id -PageSize 200 -Fields $fieldList)

        foreach ($item in $items) {
            $parts = New-Object System.Collections.Generic.List[string]
            foreach ($fieldName in $fieldList) {
                $value = $item[$fieldName]
                if ($null -ne $value) {
                    $parts.Add((ConvertTo-SafeText $value)) | Out-Null
                }
            }

            $combined = ($parts -join " | ")
            if (Test-MarkerText $combined) {
                $rows.Add([pscustomobject]@{
                    ListKey = $target.Key
                    ListTitle = ConvertTo-SafeText $list.Title
                    ListGuid = [string]$list.Id
                    ItemId = [int]$item.Id
                    Title = ConvertTo-SafeText $item["Title"]
                    MarkerMatched = ($markers | Where-Object { $combined -like "*$_*" }) -join ", "
                    Classification = Get-Classification -ListKey $target.Key -Text $combined
                    Recommendation = "revisar manualmente antes de qualquer limpeza"
                    SanitizedSnapshot = $combined
                }) | Out-Null
            }
        }
    }
    catch {
        $rows.Add([pscustomobject]@{
            ListKey = $target.Key
            ListTitle = $target.Title
            ListGuid = $target.Guid
            ItemId = 0
            Title = "ERRO_READONLY"
            MarkerMatched = ""
            Classification = "nao mexer"
            Recommendation = "corrigir leitura antes de qualquer limpeza"
            SanitizedSnapshot = ConvertTo-SafeText $_.Exception.Message
        }) | Out-Null
    }
}

$jsonPath = Join-Path $outputFullDirectory "v2.8c-inventario-limpeza-candidatos.json"
$markdownPath = Join-Path $outputFullDirectory "v2.8c-inventario-limpeza-candidatos.md"

$rows | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8

$lines = New-Object System.Collections.Generic.List[string]
Add-Line $lines "# V2.8C - Inventario Readonly De Candidatos A Limpeza"
Add-Line $lines ""
Add-Line $lines "Site: $(ConvertTo-SafeText $web.Url)"
Add-Line $lines ""
Add-Line $lines "Este relatorio e readonly. Nao executa DELETE, Remove-PnPListItem, alteracao de item ou limpeza."
Add-Line $lines ""
Add-Line $lines "| Lista | Item | Title | Marcador | Classificacao | Recomendacao |"
Add-Line $lines "| --- | ---: | --- | --- | --- | --- |"
foreach ($row in $rows) {
    Add-Line $lines "| $($row.ListTitle) | $($row.ItemId) | $($row.Title) | $($row.MarkerMatched) | $($row.Classification) | $($row.Recommendation) |"
}

$lines | Set-Content -Path $markdownPath -Encoding UTF8

Write-Host "Inventario readonly gerado:"
Write-Host $jsonPath
Write-Host $markdownPath
