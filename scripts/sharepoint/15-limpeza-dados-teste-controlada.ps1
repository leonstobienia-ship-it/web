<#
.SYNOPSIS
Prepara limpeza controlada de dados de teste V2.8D.

.DESCRIPTION
O modo padrao e dry-run. O script so executa remocao quando recebe -Execute e
o token exato de confirmacao. Todos os itens sao conferidos por whitelist,
Title e marcador antes de qualquer chamada a Remove-PnPListItem.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
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
    [switch]$Execute,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmacaoLimpeza = "",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = ".\reports"
)

$ErrorActionPreference = "Stop"

$confirmationToken = "CONFIRMAR-LIMPEZA-DADOS-TESTE-V2.8D-ENAC"
$startedAt = Get-Date

$cleanupPlan = @(
    [pscustomobject]@{
        Order = 1
        ListKey = "Lista10"
        ListTitle = "Lista 10 - Contas a Pagar / Programacao Financeira"
        ListGuid = "f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680"
        ItemId = 3
        ExpectedTitle = "PAG-V2.7A-TESTE-NF-4-NF-V2.7A-TESTE-001-20260609161247"
        Marker = "V2.7A-TESTE"
        Fields = @("Title","N_x00ba_daNotaFiscal","StatusdoPagamento","CentrodeCusto")
    },
    [pscustomobject]@{
        Order = 2
        ListKey = "Lista04"
        ListTitle = "Lista 04 - Notas Fiscais Recebidas"
        ListGuid = "25aa4447-193d-418a-8e71-9bfd8e9995da"
        ItemId = 4
        ExpectedTitle = "NF-V2.7A-TESTE-PED-3-NF-V2.7A-TESTE-001-20260609141255"
        Marker = "V2.7A-TESTE"
        Fields = @("Title","N_x00ba_doPedido","N_x00ba_daNotaFiscal","StatusdaConfer_x00ea_ncia")
    },
    [pscustomobject]@{
        Order = 3
        ListKey = "Lista03"
        ListTitle = "Lista 03 - Pedidos de Compra"
        ListGuid = "18ca132a-c36a-42aa-9968-d87ecd547a79"
        ItemId = 3
        ExpectedTitle = "PED-V2.7A-TESTE-11-20260609125401"
        Marker = "V2.7A-TESTE"
        Fields = @("Title","N_x00ba_daRequisi_x00e7__x00e3_o","StatusdoPedido","CentrodeCusto")
    },
    [pscustomobject]@{
        Order = 4
        ListKey = "Lista02"
        ListTitle = "Lista 02 - Requisicoes de Compra"
        ListGuid = "0a204b87-b9a1-4d16-8654-55567a62ed01"
        ItemId = 9
        ExpectedTitle = "V2.6A-TESTE-001"
        Marker = "V2.6A-TESTE"
        Fields = @("Title","CentrodeCusto","Descri_x00e7__x00e3_odaSolicita_","Observa_x00e7__x00f5_es","StatusdaRequisi_x00e7__x00e3_o")
    },
    [pscustomobject]@{
        Order = 5
        ListKey = "Lista02"
        ListTitle = "Lista 02 - Requisicoes de Compra"
        ListGuid = "0a204b87-b9a1-4d16-8654-55567a62ed01"
        ItemId = 10
        ExpectedTitle = "V2.6A-TESTE-001"
        Marker = "V2.6A-TESTE"
        Fields = @("Title","CentrodeCusto","Descri_x00e7__x00e3_odaSolicita_","Observa_x00e7__x00f5_es","StatusdaRequisi_x00e7__x00e3_o")
    },
    [pscustomobject]@{
        Order = 6
        ListKey = "Lista02"
        ListTitle = "Lista 02 - Requisicoes de Compra"
        ListGuid = "0a204b87-b9a1-4d16-8654-55567a62ed01"
        ItemId = 11
        ExpectedTitle = "V2.7A-TESTE-001"
        Marker = "V2.7A-TESTE"
        Fields = @("Title","CentrodeCusto","Descri_x00e7__x00e3_odaSolicita_","Observa_x00e7__x00f5_es","StatusdaRequisi_x00e7__x00e3_o")
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

function Connect-PnPSite {
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

function Test-MarkerMatch {
    param(
        [string]$Text,
        [string]$Marker
    )

    return $Text -like "*$Marker*"
}

function Get-ItemByWhitelistEntry {
    param(
        $Connection,
        $Entry
    )

    $fieldList = @("Id","Title") + $Entry.Fields | Select-Object -Unique

    try {
        $item = Get-PnPListItem -Connection $Connection -List $Entry.ListGuid -Id $Entry.ItemId -Fields $fieldList -ErrorAction Stop
        return @{
            Ok = $true
            Item = $item
            Error = $null
            NotFound = $false
        }
    }
    catch {
        $message = $_.Exception.Message
        $isNotFound = $message -like "*does not exist*" -or
            $message -like "*not found*" -or
            $message -like "*Cannot find*" -or
            $message -like "*doesn't exist*"

        return @{
            Ok = $false
            Item = $null
            Error = $message
            NotFound = $isNotFound
        }
    }
}

function Get-SanitizedSnapshot {
    param(
        $Item,
        [string[]]$Fields
    )

    if ($null -eq $Item) {
        return ""
    }

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($fieldName in (@("Id","Title") + $Fields | Select-Object -Unique)) {
        $value = $Item[$fieldName]
        if ($null -ne $value) {
            $parts.Add((ConvertTo-SafeText $value)) | Out-Null
        }
    }

    return ($parts -join " | ")
}

function Add-Line {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

Assert-Prerequisites

if (-not (Test-Path $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$outputFullDirectory = (Resolve-Path $OutputDirectory).Path

$hasValidExecutionToken = $ConfirmacaoLimpeza -eq $confirmationToken
$executionAuthorized = $Execute.IsPresent -and $hasValidExecutionToken
$mode = if ($executionAuthorized) { "EXECUCAO_CONFIRMADA" } else { "DRYRUN" }

if ($Execute.IsPresent -and -not $hasValidExecutionToken) {
    Write-Warning "Parametro -Execute informado sem token correto. O script permanecera em dry-run."
}

Write-Host "V2.8D - Limpeza controlada de dados de teste"
Write-Host "Modo: $mode"
Write-Host "Site: $SiteUrl"
Write-Host "Nenhum item fora da whitelist sera alterado."

$connection = Connect-PnPSite
$web = Get-PnPWeb -Connection $connection
$rows = New-Object System.Collections.Generic.List[object]

foreach ($entry in ($cleanupPlan | Sort-Object Order)) {
    $rowStatus = "BLOQUEADO"
    $action = "NAO_EXECUTADO"
    $reason = ""
    $readStatus = "BLOQUEADO"
    $currentTitle = ""
    $snapshot = ""
    $markerOk = $false
    $titleOk = $false

    Write-Host ""
    Write-Host "[$($entry.Order)] $($entry.ListTitle) / Item $($entry.ItemId)"
    Write-Host "Esperado: $($entry.ExpectedTitle) / marcador $($entry.Marker)"

    try {
        $readResult = Get-ItemByWhitelistEntry -Connection $connection -Entry $entry

        if (-not $readResult.Ok) {
            if ($readResult.NotFound) {
                $readStatus = "ITEM_NAO_ENCONTRADO"
                $reason = "ITEM_NAO_ENCONTRADO"
            }
            else {
                $readStatus = "ERRO_LEITURA"
                $reason = "ERRO_LEITURA: $(ConvertTo-SafeText $readResult.Error)"
            }
            $rowStatus = "BLOQUEADO"
            Write-Warning $reason
        }
        elseif ($null -eq $readResult.Item) {
            $readStatus = "ITEM_NAO_ENCONTRADO"
            $reason = "ITEM_NAO_ENCONTRADO"
            $rowStatus = "BLOQUEADO"
            Write-Warning $reason
        }
        else {
            $item = $readResult.Item
            $readStatus = "LIDO_OK"
            $currentTitle = ConvertTo-SafeText $item["Title"]
            $snapshot = Get-SanitizedSnapshot -Item $item -Fields $entry.Fields
            $titleOk = $currentTitle -eq $entry.ExpectedTitle
            $markerOk = Test-MarkerMatch -Text $snapshot -Marker $entry.Marker

            Write-Host "Atual: $currentTitle"
            Write-Host "Snapshot sanitizado: $snapshot"

            if (-not $titleOk) {
                $reason = "TITLE_DIVERGENTE"
                $rowStatus = "BLOQUEADO"
            }
            elseif (-not $markerOk) {
                $reason = "MARCADOR_DIVERGENTE"
                $rowStatus = "BLOQUEADO"
            }
            else {
                $rowStatus = "APTO_PARA_LIMPEZA"
                $reason = "TITLE_E_MARCADOR_CONFERIDOS"

                if ($executionAuthorized) {
                    $target = "$($entry.ListTitle) item $($entry.ItemId)"
                    if ($PSCmdlet.ShouldProcess($target, "Remove-PnPListItem")) {
                        Remove-PnPListItem -Connection $connection -List $entry.ListGuid -Identity $entry.ItemId -Force
                        $action = "REMOVIDO"
                    }
                    else {
                        $action = "WHATIF_SEM_REMOCAO"
                    }
                }
                else {
                    $action = "DRYRUN_REMOVERIA_APOS_CONFIRMACAO"
                }
            }
        }
    }
    catch {
        $readStatus = "ERRO_LEITURA"
        $rowStatus = "BLOQUEADO"
        $reason = "ERRO_LEITURA: $(ConvertTo-SafeText $_.Exception.Message)"
        Write-Warning $reason
    }

    $rows.Add([pscustomobject]@{
        Order = $entry.Order
        ListKey = $entry.ListKey
        ListTitle = $entry.ListTitle
        ListGuid = $entry.ListGuid
        ItemId = $entry.ItemId
        ExpectedTitle = $entry.ExpectedTitle
        CurrentTitle = $currentTitle
        Marker = $entry.Marker
        TitleOk = $titleOk
        MarkerOk = $markerOk
        ReadStatus = $readStatus
        ValidationStatus = $rowStatus
        Action = $action
        Reason = $reason
        SanitizedSnapshot = $snapshot
    }) | Out-Null
}

$baseName = if ($executionAuthorized) { "v2.8d-limpeza-execucao" } else { "v2.8d-limpeza-dryrun" }
$jsonPath = Join-Path $outputFullDirectory "$baseName.json"
$markdownPath = Join-Path $outputFullDirectory "$baseName.md"

$totalRead = @($rows | Where-Object { $_.ReadStatus -eq "LIDO_OK" }).Count
$totalReady = @($rows | Where-Object { $_.ValidationStatus -eq "APTO_PARA_LIMPEZA" }).Count
$totalBlocked = @($rows | Where-Object { $_.ValidationStatus -eq "BLOQUEADO" }).Count
$totalError = @($rows | Where-Object { $_.ReadStatus -eq "ERRO_LEITURA" }).Count
$totalNotFound = @($rows | Where-Object { $_.ReadStatus -eq "ITEM_NAO_ENCONTRADO" }).Count
$cleanupWasDryRunOnly = -not $executionAuthorized
$authorizationForExecution = if ($totalError -gt 0 -or $totalBlocked -gt 0) { "NAO" } else { "NAO - depende de autorizacao explicita de Leon em rodada futura" }

$report = [pscustomobject]@{
    Version = "V2.8D"
    StartedAt = $startedAt.ToString("o")
    FinishedAt = (Get-Date).ToString("o")
    SiteUrl = ConvertTo-SafeText $web.Url
    Mode = $mode
    DryRunNaoExecutouLimpeza = $cleanupWasDryRunOnly
    AutorizacaoParaExecucao = $authorizationForExecution
    ExecuteParameter = [bool]$Execute
    ConfirmationTokenAccepted = $hasValidExecutionToken
    RemovedCount = @($rows | Where-Object { $_.Action -eq "REMOVIDO" }).Count
    Summary = [pscustomobject]@{
        TotalItensWhitelist = $rows.Count
        TotalLido = $totalRead
        TotalApto = $totalReady
        TotalBloqueado = $totalBlocked
        TotalErro = $totalError
        TotalNaoEncontrado = $totalNotFound
    }
    Rows = $rows
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8

$lines = New-Object System.Collections.Generic.List[string]
Add-Line $lines "# V2.8D - Limpeza Controlada De Dados De Teste"
Add-Line $lines ""
Add-Line $lines "Site: $(ConvertTo-SafeText $web.Url)"
Add-Line $lines ""
Add-Line $lines "Modo: ``$mode``."
Add-Line $lines ""
Add-Line $lines "Dry-run nao executou limpeza: ``$cleanupWasDryRunOnly``."
Add-Line $lines ""
Add-Line $lines "Token aceito: ``$hasValidExecutionToken``."
Add-Line $lines ""
Add-Line $lines "AUTORIZACAO PARA EXECUCAO: $authorizationForExecution."
Add-Line $lines ""
Add-Line $lines "Remocoes executadas: $($report.RemovedCount)."
Add-Line $lines ""
Add-Line $lines "## Resumo"
Add-Line $lines ""
Add-Line $lines "- Total whitelist: $($rows.Count)"
Add-Line $lines "- Total lido: $totalRead"
Add-Line $lines "- Total apto: $totalReady"
Add-Line $lines "- Total bloqueado: $totalBlocked"
Add-Line $lines "- Total erro: $totalError"
Add-Line $lines "- Total nao encontrado: $totalNotFound"
Add-Line $lines ""
Add-Line $lines "| Ordem | Lista | Item | Title esperado | Title atual | Marcador | Leitura | Validacao | Acao | Motivo |"
Add-Line $lines "| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | --- |"
foreach ($row in $rows) {
    Add-Line $lines "| $($row.Order) | $($row.ListTitle) | $($row.ItemId) | $($row.ExpectedTitle) | $($row.CurrentTitle) | $($row.Marker) | $($row.ReadStatus) | $($row.ValidationStatus) | $($row.Action) | $($row.Reason) |"
}

$lines | Set-Content -Path $markdownPath -Encoding UTF8

Write-Host ""
Write-Host "Relatorios gerados:"
Write-Host $jsonPath
Write-Host $markdownPath
