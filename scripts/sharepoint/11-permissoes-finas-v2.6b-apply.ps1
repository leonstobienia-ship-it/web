param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DeviceLogin", "Interactive")]
    [string]$AuthMode = "DeviceLogin",

    [Parameter(Mandatory = $false)]
    [switch]$Apply,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmPermissoes = "",

    [Parameter(Mandatory = $false)]
    [string]$Ambiente = "TesteControlado"
)

$ErrorActionPreference = "Stop"

$requiredConfirmation = "APLICAR-PERMISSOES-V2.6B-ENAC"
$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"

$groups = @(
    [pscustomobject]@{ Name = "ENAC Sistema Admin"; Description = "Administracao tecnica do Sistema ENAC" },
    [pscustomobject]@{ Name = "ENAC Diretoria"; Description = "Aprovacoes, excecoes e liberacao bancaria" },
    [pscustomobject]@{ Name = "ENAC Planejamento"; Description = "Planejamento, validacoes tecnicas e aprovacoes quando aplicavel" },
    [pscustomobject]@{ Name = "ENAC Compras Financeiro"; Description = "Compras, pedidos, NF e programacao financeira" },
    [pscustomobject]@{ Name = "ENAC Cotacoes Contratos"; Description = "Cotacoes, comparativos e contratos" },
    [pscustomobject]@{ Name = "ENAC Campo Engenharia"; Description = "Criacao e acompanhamento de solicitacoes proprias" },
    [pscustomobject]@{ Name = "ENAC Leitura Auditoria"; Description = "Leitura historica controlada" }
)

$adminLists = @(
    [pscustomobject]@{
        Title = "ENAC Usuarios Perfis"
        Permissions = @(
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Full Control" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Read" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Alcadas"
        Permissions = @(
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Full Control" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Read" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Read" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Historico Configuracoes"
        Permissions = @(
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Full Control" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Read" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Read" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Snapshots Regras"
        Permissions = @(
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Full Control" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Read" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Read" },
            [pscustomobject]@{ Group = "ENAC Compras Financeiro"; Role = "Read" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Read" }
        )
    }
)

function Write-Section {
    param([string]$Title)

    Write-Host ""
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("-" * $Title.Length)
}

function Assert-ApplySafety {
    if (-not $Apply) {
        return
    }

    if ($ConfirmPermissoes -ne $requiredConfirmation) {
        throw "Aplicacao recusada: informe -ConfirmPermissoes `"$requiredConfirmation`"."
    }

    if ($ClientId -eq $readonlyClientId) {
        throw "Aplicacao recusada: o ClientId readonly de inventario nao pode aplicar permissoes."
    }

    if ($SiteUrl -notlike "*/sites/Equipe.Obras*") {
        throw "Aplicacao recusada: SiteUrl deve apontar para /sites/Equipe.Obras."
    }

    if ([string]::IsNullOrWhiteSpace($Ambiente) -or $Ambiente -eq "local") {
        throw "Aplicacao recusada: informe um Ambiente explicito e diferente de local."
    }

    Write-Warning "ATENCAO: modo Apply solicitado. Este script podera criar grupos e ajustar permissoes das listas administrativas planejadas."
    Write-Warning "Nao ha alteracao de listas operacionais, itens, usuarios de grupos, dados V2.3B/V2.6A ou Power Automate nesta versao."
}

function Connect-EnacSharePoint {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-ExistingGroup {
    param(
        $Connection,
        [string]$GroupName
    )

    return Get-PnPGroup -Connection $Connection | Where-Object { $_.Title -eq $GroupName } | Select-Object -First 1
}

function Ensure-EnacGroups {
    param($Connection)

    foreach ($group in $groups) {
        $existing = Get-ExistingGroup -Connection $Connection -GroupName $group.Name
        if ($existing) {
            Write-Host "OK grupo existente: $($group.Name)"
            continue
        }

        Write-Host "CRIAR grupo: $($group.Name)"
        New-PnPGroup -Title $group.Name -Description $group.Description -Connection $Connection | Out-Null
    }
}

function Assert-AdminListsExist {
    param($Connection)

    $lists = Get-PnPList -Connection $Connection
    foreach ($listPlan in $adminLists) {
        $existing = $lists | Where-Object { $_.Title -eq $listPlan.Title } | Select-Object -First 1
        if (-not $existing) {
            throw "Lista administrativa nao encontrada: $($listPlan.Title)"
        }

        Write-Host "OK lista administrativa: $($listPlan.Title)"
    }
}

function Apply-AdminListPermissions {
    param($Connection)

    foreach ($listPlan in $adminLists) {
        Write-Host "Aplicando permissao planejada na lista administrativa: $($listPlan.Title)"
        foreach ($permission in $listPlan.Permissions) {
            Write-Host "  Grupo=$($permission.Group); Role=$($permission.Role)"
            Set-PnPListPermission -Identity $listPlan.Title -Group $permission.Group -AddRole $permission.Role -Connection $Connection
        }
    }
}

function Write-Plan {
    Write-Host "SCRIPT PROTEGIDO V2.6B.2 - permissoes finas" -ForegroundColor Green
    Write-Host "Modo Apply: $($Apply.IsPresent)"
    Write-Host "Ambiente: $Ambiente"
    Write-Host "SiteUrl: $SiteUrl"
    Write-Host "Tenant: $Tenant"
    Write-Host "AuthMode: $AuthMode"

    Write-Section "Fase 0 - validacao e dry-run"
    Write-Host "Sem -Apply, este script nao conecta ao SharePoint e nao aplica permissoes."
    Write-Host "Com -Apply, exige confirmacao textual, app diferente do readonly e site /sites/Equipe.Obras."

    Write-Section "Fase 1 - validacao futura"
    Write-Host "Validar site, web, listas administrativas e grupos existentes antes de aplicar."

    Write-Section "Fase 2 - grupos planejados"
    foreach ($group in $groups) {
        Write-Host "- $($group.Name): $($group.Description)"
    }

    Write-Section "Fase 3 - permissoes planejadas em listas administrativas"
    foreach ($listPlan in $adminLists) {
        Write-Host "- Lista: $($listPlan.Title)"
        foreach ($permission in $listPlan.Permissions) {
            Write-Host "  $($permission.Group) => $($permission.Role)"
        }
    }

    Write-Section "Fase 4 - rollback planejado"
    Write-Host "Antes de executar aplicacao real, exportar heranca, grupos e permissoes atuais."
    Write-Host "Rollback futuro deve restaurar heranca/permissoes registradas em etapa previa."

    Write-Section "Fase 5 - aplicacao futura"
    Write-Host "Somente uma rodada futura autorizada deve executar -Apply."
    Write-Host "Listas operacionais ficam apenas planejadas nesta versao."
    Write-Host "Membros reais dos grupos nao sao adicionados nesta versao."
}

Assert-ApplySafety
Write-Plan

if (-not $Apply) {
    Write-Host ""
    Write-Host "Encerramento: dry-run local concluido. Nenhuma conexao ou aplicacao real foi executada." -ForegroundColor Green
    return
}

$connection = Connect-EnacSharePoint
$web = Get-PnPWeb -Connection $connection
Write-Host "Conectado ao site: $($web.Title)"

Assert-AdminListsExist -Connection $connection
Ensure-EnacGroups -Connection $connection
Apply-AdminListPermissions -Connection $connection

Write-Host ""
Write-Host "Aplicacao protegida concluida para listas administrativas planejadas." -ForegroundColor Green
