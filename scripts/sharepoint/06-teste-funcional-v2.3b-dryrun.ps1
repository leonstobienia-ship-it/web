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

$lista01Id = [Guid]"a9afadc1-f843-45c0-a628-4f49a8716832"
$lista02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$adminLists = @(
    @{ Title = "ENAC Usuarios Perfis"; Url = "Lists/ENACUsuariosPerfis"; Fields = @("UsuarioInternoId", "ContaMicrosoft365", "PerfilPrincipal", "UsuarioAtivo") },
    @{ Title = "ENAC Alcadas"; Url = "Lists/ENACAlcadas"; Fields = @("RegraInternaId", "Processo", "TipoSolicitacao", "ValorMinimo", "ValorMaximo", "Ilimitado", "AprovadorPrincipal", "Ativo") },
    @{ Title = "ENAC Historico Configuracoes"; Url = "Lists/ENACHistoricoConfiguracoes"; Fields = @("TipoConfiguracao", "AcaoRealizada", "ItemConfiguracaoId", "ValorNovo") },
    @{ Title = "ENAC Snapshots Regras"; Url = "Lists/ENACSnapshotsRegras"; Fields = @("Solicitacao", "RegraAlcadaUtilizada", "RegraInternaId", "ValorAnalisado", "AprovadorBaseId", "DataHoraAplicacao") }
)

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)."
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

function Get-ListByTitleOrUrl {
    param($Connection, [string]$Title, [string]$Url)
    $lists = Get-PnPList -Connection $Connection -Includes RootFolder,Hidden,ItemCount
    $matches = @($lists | Where-Object { $_.Title -eq $Title -or $_.RootFolder.ServerRelativeUrl -like "*/$Url" })
    if ($matches.Count -gt 1) { throw "Mais de uma lista encontrada para $Title / $Url." }
    if ($matches.Count -eq 0) { return $null }
    return $matches[0]
}

function Get-ListByGuid {
    param($Connection, [Guid]$Id)
    return @(Get-PnPList -Connection $Connection -Identity $Id -Includes RootFolder,Hidden,ItemCount -ThrowExceptionIfListNotFound)[0]
}

function Test-Field {
    param($Connection, $List, [string]$InternalName)
    $listIdentity = $List.Id.ToString()
    $field = Get-PnPField -Connection $Connection -List $listIdentity | Where-Object {
        $_.InternalName -eq $InternalName -or $_.StaticName -eq $InternalName
    } | Select-Object -First 1
    return [bool]$field
}

Assert-Prerequisites
$connection = Connect-PnPReadonly

Write-Host "Dry-run teste funcional V2.3B - nenhuma alteracao sera aplicada." -ForegroundColor Green
Write-Host "Validando listas operacionais por GUID..."
$lista01 = Get-ListByGuid -Connection $connection -Id $lista01Id
$lista02 = Get-ListByGuid -Connection $connection -Id $lista02Id
Write-Host "OK Lista 01 [$($lista01.Id)]"
Write-Host "OK Lista 02 [$($lista02.Id)]"

foreach ($plan in $adminLists) {
    $list = Get-ListByTitleOrUrl -Connection $connection -Title $plan.Title -Url $plan.Url
    if (-not $list) { throw "Lista administrativa ausente: $($plan.Title)." }
    Write-Host "OK lista $($plan.Title) [$($list.Id)]"
    foreach ($fieldName in $plan.Fields) {
        if (Test-Field -Connection $connection -List $list -InternalName $fieldName) {
            Write-Host "OK campo $($plan.Title).$fieldName"
        }
        else {
            throw "Campo critico ausente: $($plan.Title).$fieldName"
        }
    }
}

if (-not (Test-Field -Connection $connection -List $lista02 -InternalName "SnapshotAprovacaoCompra")) {
    throw "Campo Lista 02.SnapshotAprovacaoCompra ausente."
}
Write-Host "OK campo Lista 02.SnapshotAprovacaoCompra"

Write-Host ""
Write-Host "Plano de carga/teste - somente marcador V2.3B-TESTE:"
Write-Host "- Usuarios minimos: Leon, Gustavo, Matheus, Kemilly."
Write-Host "- Perfis reais: Leon=Diretoria; Gustavo=Planejamento; Matheus=Compras e Financeiro Operacional; Kemilly=Cotações e Contratos."
Write-Host "- Alcadas: ate 20000 com Gustavo; acima de 20000 com Leon."
Write-Host "- Requisicao: preferir item manual de teste contendo V2.3B-TESTE."
Write-Host "- Snapshot: SNAP-V2.3B-TESTE-001 para valor analisado 6720.00."
Write-Host "- Historico: V2.3B-TESTE - Carga inicial controlada."
Write-Host "Nenhum item foi criado, alterado ou excluido."
