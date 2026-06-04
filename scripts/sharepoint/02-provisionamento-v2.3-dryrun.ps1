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
    [switch]$Apply
)

$ErrorActionPreference = "Stop"

if ($Apply) {
    throw "Modo Apply nao esta habilitado nesta rodada. Revise o dry-run e use um aplicativo separado com permissao de escrita somente apos autorizacao expressa."
}

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)."
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado."
    }

    if ([string]::IsNullOrWhiteSpace($Tenant)) {
        throw "Informe o tenant no formato tenant.onmicrosoft.com."
    }

    if ([string]::IsNullOrWhiteSpace($ClientId)) {
        throw "Informe o ClientId para autenticacao PnP."
    }
}

function Connect-Readonly {
    if ($AuthMode -eq "DeviceLogin") {
        Write-Host "Conectando por DeviceLogin para dry-run readonly: $SiteUrl" -ForegroundColor Cyan
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    Write-Host "Conectando por Interactive para dry-run readonly: $SiteUrl" -ForegroundColor Cyan
    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Find-List {
    param(
        [array]$Lists,
        [string]$Title
    )

    return $Lists | Where-Object { $_.Title -eq $Title } | Select-Object -First 1
}

function Test-FieldExists {
    param(
        $Connection,
        $List,
        [string]$InternalName
    )

    if (-not $List) { return $false }

    $field = Get-PnPField -List $List -Connection $Connection | Where-Object {
        $_.InternalName -eq $InternalName -or $_.StaticName -eq $InternalName
    } | Select-Object -First 1

    return [bool]$field
}

Assert-Prerequisites

$plannedAdminLists = @(
    @{
        Title = "ENAC Usuarios Perfis"
        Fields = @(
            "UsuarioInternoId", "ContaMicrosoft365", "EmailCorporativo", "CargoFuncao", "PerfilPrincipal",
            "PerfilAdicional", "PodeCriarSolicitacao", "PodeRegistrarCotacoes", "PodeAprovarCompras",
            "PodeEmitirPedido", "PodeVincularNF", "PodeProgramarPagamento", "PodeLiberarPagamento",
            "PodeAtualizarStatusFinal", "PodeAdministrarConfiguracoes", "UsuarioAtivo",
            "SubstitutoTemporario", "InicioSubstituicao", "FimSubstituicao", "Observacoes"
        )
    },
    @{
        Title = "ENAC Alcadas"
        Fields = @(
            "RegraInternaId", "Processo", "TipoSolicitacao", "Obra", "ValorMinimo", "ValorMaximo",
            "Ilimitado", "AprovadorPrincipal", "ExigeAprovacaoAdicional", "AprovadorAdicional",
            "VigenciaInicial", "VigenciaFinal", "Ativo", "Observacoes"
        )
    },
    @{
        Title = "ENAC Historico Configuracoes"
        Fields = @("TipoConfiguracao", "ValorAnterior", "ValorNovo", "Justificativa")
    },
    @{
        Title = "ENAC Snapshots Regras"
        Fields = @(
            "Solicitacao", "Cotacao", "PedidoCompra", "RegraAlcadaUtilizada", "Processo",
            "FaixaValorVigente", "ValorAnalisado", "AprovadorBaseId", "AprovadorBaseNome",
            "AprovadorBaseEmail", "AprovadorEfetivoId", "AprovadorEfetivoNome", "AprovadorEfetivoEmail",
            "SubstituicaoAplicada", "MotivoResolucaoAprovador", "MotivoExcecao", "DataHoraAplicacao"
        )
    }
)

$plannedLookups = @(
    "ENAC Alcadas.Obra -> Lista 01 - Controle de Obras ENAC / NomedaObra",
    "ENAC Alcadas.AprovadorPrincipal -> ENAC Usuarios Perfis",
    "ENAC Alcadas.AprovadorAdicional -> ENAC Usuarios Perfis",
    "ENAC Usuarios Perfis.SubstitutoTemporario -> ENAC Usuarios Perfis",
    "ENAC Snapshots Regras.Solicitacao -> Lista 02 — Requisições de Compra",
    "ENAC Snapshots Regras.RegraAlcadaUtilizada -> ENAC Alcadas, se mantido como lookup",
    "ENAC Snapshots Regras.AprovadorBase/AprovadorEfetivo -> ENAC Usuarios Perfis, se usados como lookup",
    "Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra -> ENAC Snapshots Regras"
)

$connection = Connect-Readonly
$lists = Get-PnPList -Connection $connection -Includes RootFolder,Hidden,ItemCount

$obrasList = Find-List -Lists $lists -Title "Lista 01 - Controle de Obras ENAC"
$solicitacoesList = Find-List -Lists $lists -Title "Lista 02 — Requisições de Compra"

Write-Host ""
Write-Host "Dry-run V2.3A - nenhuma alteracao sera aplicada." -ForegroundColor Green
Write-Host ""

Write-Host "Listas operacionais obrigatorias:"
foreach ($entry in @(
    @{ Logical = "Obras"; Title = "Lista 01 - Controle de Obras ENAC"; List = $obrasList },
    @{ Logical = "Solicitacoes"; Title = "Lista 02 — Requisições de Compra"; List = $solicitacoesList }
)) {
    if ($entry.List) {
        Write-Host "OK   $($entry.Logical): $($entry.Title) [$($entry.List.Id)]"
    } else {
        Write-Host "FALTA $($entry.Logical): $($entry.Title)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Listas administrativas planejadas:"
foreach ($admin in $plannedAdminLists) {
    $existing = Find-List -Lists $lists -Title $admin.Title
    if ($existing) {
        Write-Host "OK   $($admin.Title) ja existe [$($existing.Id)]"
    } else {
        Write-Host "CRIAR $($admin.Title)"
        foreach ($field in $admin.Fields) {
            Write-Host "      campo planejado: $field"
        }
    }
}

Write-Host ""
Write-Host "Campo complementar em lista existente:"
if ($solicitacoesList) {
    $snapshotFieldExists = Test-FieldExists -Connection $connection -List $solicitacoesList -InternalName "SnapshotAprovacaoCompra"
    if ($snapshotFieldExists) {
        Write-Host "OK   Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra ja existe"
    } else {
        Write-Host "CRIAR Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra"
    }
} else {
    Write-Host "PENDENTE: Lista 02 — Requisições de Compra nao encontrada; nao e possivel planejar o campo SnapshotAprovacaoCompra com seguranca." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Lookups planejados:"
foreach ($lookup in $plannedLookups) {
    Write-Host "PLANEJAR $lookup"
}

Write-Host ""
Write-Host "Fim do dry-run. Nenhum comando de criacao, alteracao ou exclusao foi executado."
