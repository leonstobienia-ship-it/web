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
    [switch]$ConnectedPreflight,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmPermissoes = "",

    [Parameter(Mandatory = $false)]
    [string]$Ambiente = "TesteControlado"
)

$ErrorActionPreference = "Stop"

$requiredConfirmation = "APLICAR-PERMISSOES-V2.6B-ENAC"
$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$siteOwnersGroup = "Obras em Andamento Owners"

$groups = @(
    "ENAC Sistema Admin",
    "ENAC Diretoria",
    "ENAC Planejamento",
    "ENAC Compras Financeiro",
    "ENAC Cotacoes Contratos",
    "ENAC Campo Engenharia",
    "ENAC Leitura Auditoria",
    $siteOwnersGroup
)

$adminLists = @(
    [pscustomobject]@{
        Title = "ENAC Usuarios Perfis"
        Permissions = @(
            [pscustomobject]@{ Group = $siteOwnersGroup; Role = "Controle Total"; Reason = "Rollback e administracao do site" },
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Controle Total"; Reason = "Administracao tecnica" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Editar"; Reason = "Administracao executiva autorizada" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Leitura"; Reason = "Consulta tecnica limitada" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Leitura"; Reason = "Auditoria" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Alcadas"
        Permissions = @(
            [pscustomobject]@{ Group = $siteOwnersGroup; Role = "Controle Total"; Reason = "Rollback e administracao do site" },
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Controle Total"; Reason = "Administracao tecnica" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Editar"; Reason = "Administracao executiva de alcadas" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Leitura"; Reason = "Consulta tecnica" },
            [pscustomobject]@{ Group = "ENAC Compras Financeiro"; Role = "Leitura"; Reason = "Consulta para fluxo de compras" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Leitura"; Reason = "Auditoria" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Historico Configuracoes"
        Permissions = @(
            [pscustomobject]@{ Group = $siteOwnersGroup; Role = "Controle Total"; Reason = "Rollback e administracao do site" },
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Controle Total"; Reason = "Administracao tecnica" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Leitura"; Reason = "Leitura executiva" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Leitura"; Reason = "Consulta tecnica" },
            [pscustomobject]@{ Group = "ENAC Compras Financeiro"; Role = "Leitura"; Reason = "Consulta operacional" },
            [pscustomobject]@{ Group = "ENAC Cotacoes Contratos"; Role = "Leitura"; Reason = "Consulta operacional limitada" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Leitura"; Reason = "Auditoria" }
        )
    },
    [pscustomobject]@{
        Title = "ENAC Snapshots Regras"
        Permissions = @(
            [pscustomobject]@{ Group = $siteOwnersGroup; Role = "Controle Total"; Reason = "Rollback e administracao do site" },
            [pscustomobject]@{ Group = "ENAC Sistema Admin"; Role = "Controle Total"; Reason = "Administracao tecnica" },
            [pscustomobject]@{ Group = "ENAC Diretoria"; Role = "Leitura"; Reason = "Consulta executiva" },
            [pscustomobject]@{ Group = "ENAC Planejamento"; Role = "Leitura"; Reason = "Consulta tecnica" },
            [pscustomobject]@{ Group = "ENAC Compras Financeiro"; Role = "Leitura"; Reason = "Consulta operacional" },
            [pscustomobject]@{ Group = "ENAC Leitura Auditoria"; Role = "Leitura"; Reason = "Auditoria" }
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
    if ($Apply -and $ConnectedPreflight) {
        throw "Parametros invalidos: use -ConnectedPreflight ou -Apply, nunca os dois juntos."
    }

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

    Write-Warning "ATENCAO: modo Apply solicitado. Este script quebrara heranca e ajustara permissoes apenas nas quatro listas administrativas planejadas."
    Write-Warning "Nao ha alteracao de listas operacionais, itens, membros de grupos, dados V2.3B/V2.6A ou Power Automate nesta versao."
}

function Connect-EnacSharePoint {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Invoke-PreflightFailure {
    param([string]$Message)

    Write-Host "Falha de preflight: $Message" -ForegroundColor Red
    Write-Host "Nenhuma alteracao foi aplicada; falha ocorreu no preflight." -ForegroundColor Yellow
    Write-Host "Criterio de parada acionado." -ForegroundColor Yellow
    Write-Host "Proxima acao: executar com conta/app com permissao suficiente ou aplicar permissoes manualmente." -ForegroundColor Yellow
    throw $Message
}

function Assert-ExpectedGroupsExist {
    param($Connection)

    foreach ($groupName in $groups) {
        try {
            $existing = Get-PnPGroup -Identity $groupName -Connection $Connection -ErrorAction Stop
            if (-not $existing) {
                Invoke-PreflightFailure -Message "Grupo nao encontrado: $groupName. Nenhuma alteracao aplicada."
            }
        }
        catch {
            $safeMessage = $_.Exception.Message
            if ($safeMessage -match "Access is denied|0x80070005|E_ACCESSDENIED") {
                Invoke-PreflightFailure -Message "sem permissao para validar grupos SharePoint via PnP. Grupo='$groupName'. Detalhe=$safeMessage"
            }

            Invoke-PreflightFailure -Message "nao foi possivel validar o grupo '$groupName' via PnP. Detalhe=$safeMessage"
        }

        Write-Host "OK grupo existente: $groupName"
    }
}

function Assert-AdminListsExist {
    param($Connection)

    foreach ($listPlan in $adminLists) {
        $list = Get-PnPList -Connection $Connection -Identity $listPlan.Title -ErrorAction Stop
        if (-not $list) {
            throw "Lista administrativa nao encontrada: $($listPlan.Title)"
        }

        Write-Host "OK lista administrativa: $($listPlan.Title)"
    }
}

function Invoke-Preflight {
    param($Connection)

    Write-Section "Preflight conectado"
    $web = Get-PnPWeb -Connection $Connection
    Write-Host "OK site conectado: $($web.Title)"

    Write-Host "Validando niveis de permissao..."
    Assert-RoleDefinitionsExist -Connection $Connection

    Write-Host "Validando listas administrativas..."
    Assert-AdminListsExist -Connection $Connection

    Write-Host "Validando grupos ENAC e Owners por nome exato..."
    Assert-ExpectedGroupsExist -Connection $Connection

    Write-Host "Preflight conectado concluido sem alteracoes." -ForegroundColor Green
}

function Assert-RoleDefinitionsExist {
    param($Connection)

    $roleDefinitions = @(Get-PnPRoleDefinition -Connection $Connection -ErrorAction Stop)
    $requiredRoles = $adminLists.Permissions | ForEach-Object { $_.Role } | Sort-Object -Unique

    foreach ($roleName in $requiredRoles) {
        $exists = $roleDefinitions | Where-Object { $_.Name -eq $roleName } | Select-Object -First 1
        if (-not $exists) {
            throw "Nivel de permissao obrigatorio nao encontrado no site: $roleName"
        }

        Write-Host "OK nivel de permissao: $roleName"
    }
}

function Set-AdministrativeListPermissions {
    param($Connection)

    foreach ($listPlan in $adminLists) {
        Write-Section "Aplicando lista administrativa: $($listPlan.Title)"
        Write-Host "Quebrando heranca somente desta lista administrativa, sem copiar permissoes herdadas."
        Set-PnPList -Identity $listPlan.Title -BreakRoleInheritance -CopyRoleAssignments:$false -Connection $Connection

        foreach ($permission in $listPlan.Permissions) {
            Write-Host "  Aplicar: Grupo=$($permission.Group); Role=$($permission.Role); Motivo=$($permission.Reason)"
            Set-PnPListPermission -Identity $listPlan.Title -Group $permission.Group -AddRole $permission.Role -Connection $Connection
        }
    }
}

function Write-Plan {
    Write-Host "SCRIPT PROTEGIDO V2.6B.4 - permissoes administrativas" -ForegroundColor Green
    Write-Host "Modo Apply: $($Apply.IsPresent)"
    Write-Host "Modo ConnectedPreflight: $($ConnectedPreflight.IsPresent)"
    Write-Host "Ambiente: $Ambiente"
    Write-Host "SiteUrl: $SiteUrl"
    Write-Host "Tenant: $Tenant"
    Write-Host "AuthMode: $AuthMode"

    Write-Section "Fase 0 - dry-run local"
    Write-Host "Sem -Apply e sem -ConnectedPreflight, este script nao conecta ao SharePoint e nao aplica permissoes."
    Write-Host "Com -ConnectedPreflight, conecta, valida site/listas/grupos/niveis e nao altera nada."
    Write-Host "Com -Apply, exige confirmacao textual, app diferente do readonly e site /sites/Equipe.Obras."

    Write-Section "Fase 1 - validacoes antes de qualquer alteracao"
    Write-Host "Validar existencia dos sete grupos ENAC e do grupo Owners do site."
    Write-Host "Validar existencia das quatro listas administrativas."
    Write-Host "Validar niveis de permissao exigidos."

    Write-Section "Fase 2 - listas administrativas no escopo"
    foreach ($listPlan in $adminLists) {
        Write-Host "- $($listPlan.Title)"
    }

    Write-Section "Fase 3 - matriz planejada"
    foreach ($listPlan in $adminLists) {
        Write-Host "- Lista: $($listPlan.Title)"
        foreach ($permission in $listPlan.Permissions) {
            Write-Host "  $($permission.Group) => $($permission.Role) ($($permission.Reason))"
        }
    }

    Write-Section "Fase 4 - fora do escopo"
    Write-Host "Nao aplicar em Lista 01, Lista 02, Lista 03, Lista 04, contas a pagar ou qualquer lista operacional."
    Write-Host "Nao criar grupos, nao adicionar/remover membros, nao excluir grupos e nao alterar itens."
    Write-Host "Nao iniciar Power Automate."

    Write-Section "Fase 5 - aplicacao futura"
    Write-Host "Somente Leon deve executar -Apply apos revisar o dry-run e confirmar criterios de parada."
}

Assert-ApplySafety
Write-Plan

if (-not $Apply -and -not $ConnectedPreflight) {
    Write-Host ""
    Write-Host "Encerramento: dry-run local concluido. Nenhuma conexao ou aplicacao real foi executada." -ForegroundColor Green
    return
}

$connection = Connect-EnacSharePoint

try {
    Invoke-Preflight -Connection $connection
}
catch {
    throw
}

if ($ConnectedPreflight) {
    Write-Host ""
    Write-Host "Encerramento: ConnectedPreflight concluido. Nenhuma alteracao foi aplicada." -ForegroundColor Green
    return
}

Set-AdministrativeListPermissions -Connection $connection

Write-Host ""
Write-Host "Aplicacao protegida concluida para as quatro listas administrativas planejadas." -ForegroundColor Green
