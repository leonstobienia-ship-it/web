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
    [string]$OutputPath = ".\sharepoint\auditoria-permissoes-finas-v2.6b3.md"
)

$ErrorActionPreference = "Stop"

$plannedGroups = @(
    "ENAC Sistema Admin",
    "ENAC Diretoria",
    "ENAC Planejamento",
    "ENAC Compras Financeiro",
    "ENAC Cotacoes Contratos",
    "ENAC Campo Engenharia",
    "ENAC Leitura Auditoria"
)

$adminLists = @(
    "ENAC Usuarios Perfis",
    "ENAC Alcadas",
    "ENAC Historico Configuracoes",
    "ENAC Snapshots Regras"
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

function Add-Line {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Text = ""
    )

    $Lines.Add($Text) | Out-Null
}

function Get-GroupMemberCount {
    param(
        $Connection,
        $Group,
        [string]$GroupAuditStatus
    )

    if ($GroupAuditStatus -ne "OK") {
        return "nao auditado"
    }

    try {
        return @(Get-PnPGroupMember -Identity $Group.Title -Connection $Connection).Count
    }
    catch {
        return "limitado: $(ConvertTo-SafeText $_.Exception.Message)"
    }
}

function Get-ListRoleAssignments {
    param(
        $Connection,
        $List
    )

    $rows = [System.Collections.Generic.List[object]]::new()

    try {
        Get-PnPProperty -ClientObject $List -Property HasUniqueRoleAssignments,RoleAssignments | Out-Null

        foreach ($assignment in $List.RoleAssignments) {
            Get-PnPProperty -ClientObject $assignment -Property Member,RoleDefinitionBindings | Out-Null
            $memberName = ConvertTo-SafeText $assignment.Member.Title
            $memberType = ConvertTo-SafeText $assignment.Member.PrincipalType
            $roles = @()
            foreach ($role in $assignment.RoleDefinitionBindings) {
                $roles += (ConvertTo-SafeText $role.Name)
            }

            $rows.Add([pscustomobject]@{
                Principal = $memberName
                Tipo      = $memberType
                Papeis    = ($roles -join ", ")
            }) | Out-Null
        }
    }
    catch {
        $rows.Add([pscustomobject]@{
            Principal = "indisponivel"
            Tipo      = "erro leitura"
            Papeis    = ConvertTo-SafeText $_.Exception.Message
        }) | Out-Null
    }

    return $rows
}

function Get-SharePointGroupsSafe {
    param($Connection)

    try {
        $groups = @(Get-PnPGroup -Connection $Connection -ErrorAction Stop)
        return [pscustomobject]@{
            Status  = "OK"
            Groups  = $groups
            Message = ""
        }
    }
    catch {
        return [pscustomobject]@{
            Status  = "LIMITADO_PERMISSAO"
            Groups  = @()
            Message = ConvertTo-SafeText $_.Exception.Message
        }
    }
}

function Get-RoleDefinitionsSafe {
    param($Connection)

    try {
        return [pscustomobject]@{
            Status = "OK"
            Roles = @(Get-PnPRoleDefinition -Connection $Connection -ErrorAction Stop)
            Message = ""
        }
    }
    catch {
        return [pscustomobject]@{
            Status = "LIMITADO_PERMISSAO"
            Roles = @()
            Message = ConvertTo-SafeText $_.Exception.Message
        }
    }
}

function Get-AdminListSafe {
    param(
        $Connection,
        [string]$Title
    )

    try {
        $list = Get-PnPList -Connection $Connection -Identity $Title -Includes Title,Id,Hidden,ItemCount,HasUniqueRoleAssignments,RootFolder -ErrorAction Stop
        return [pscustomobject]@{
            Title = $Title
            Status = "EXISTE"
            List = $list
            Message = ""
        }
    }
    catch {
        return [pscustomobject]@{
            Title = $Title
            Status = "AUSENTE_OU_LIMITADO"
            List = $null
            Message = ConvertTo-SafeText $_.Exception.Message
        }
    }
}

Assert-Prerequisites

$outputFullPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDir = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDir)) {
    throw "Diretorio de saida nao encontrado: $outputDir"
}

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection -Includes Url,Title
$groupAudit = Get-SharePointGroupsSafe -Connection $connection
$allGroups = $groupAudit.Groups
$roleDefinitionAudit = Get-RoleDefinitionsSafe -Connection $connection
$roleDefinitions = $roleDefinitionAudit.Roles
$listAudits = foreach ($listTitle in $adminLists) {
    Get-AdminListSafe -Connection $connection -Title $listTitle
}

$lines = [System.Collections.Generic.List[string]]::new()
Add-Line $lines "# Auditoria readonly de permissoes finas V2.6B.3"
Add-Line $lines ""
Add-Line $lines "Data local: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Line $lines "Modo: readonly conectado"
Add-Line $lines "Site: $(ConvertTo-SafeText $web.Title)"
Add-Line $lines "Url: $(ConvertTo-SafeText $web.Url)"
Add-Line $lines ""
Add-Line $lines "## Confirmacoes"
Add-Line $lines ""
Add-Line $lines "- O script le apenas estrutura, grupos, listas e papeis."
Add-Line $lines "- O script nao cria grupos."
Add-Line $lines "- O script nao altera permissoes."
Add-Line $lines "- O script nao altera listas, itens ou dados."
Add-Line $lines "- O script nao exporta e-mails de membros."
Add-Line $lines ""

Add-Line $lines "## Limitacoes da auditoria"
Add-Line $lines ""
if ($groupAudit.Status -eq "OK") {
    Add-Line $lines "- Auditoria de grupos: OK."
}
else {
    Add-Line $lines "- Auditoria de grupos: LIMITADA."
    Add-Line $lines "- Motivo: Access denied ou permissao insuficiente ao executar Get-PnPGroup. Detalhe sanitizado: $($groupAudit.Message)"
    Add-Line $lines "- Impacto: nao foi possivel confirmar existencia ou membros dos grupos planejados nesta rodada."
    Add-Line $lines "- Acao futura: executar com conta/app com permissao suficiente ou revisar grupos manualmente no SharePoint."
}
if ($roleDefinitionAudit.Status -ne "OK") {
    Add-Line $lines "- Definicoes de permissao: LIMITADAS. Detalhe sanitizado: $($roleDefinitionAudit.Message)"
}
Add-Line $lines ""

Add-Line $lines "## Definicoes de permissao disponiveis"
Add-Line $lines ""
Add-Line $lines "| Nome | Descricao |"
Add-Line $lines "| --- | --- |"
if ($roleDefinitionAudit.Status -eq "OK") {
    foreach ($roleDefinition in $roleDefinitions | Sort-Object Name) {
        Add-Line $lines "| $(ConvertTo-SafeText $roleDefinition.Name) | $(ConvertTo-SafeText $roleDefinition.Description) |"
    }
}
else {
    Add-Line $lines "| Nao auditado | $($roleDefinitionAudit.Message) |"
}
Add-Line $lines ""

Add-Line $lines "## Grupos ENAC planejados"
Add-Line $lines ""
Add-Line $lines "| Grupo planejado | Status | Membros contabilizados |"
Add-Line $lines "| --- | --- | --- |"
foreach ($groupName in $plannedGroups) {
    if ($groupAudit.Status -ne "OK") {
        Add-Line $lines "| $(ConvertTo-SafeText $groupName) | NAO_CONFIRMADO | nao auditado |"
        continue
    }

    $group = $allGroups | Where-Object { $_.Title -eq $groupName } | Select-Object -First 1
    if (-not $group) {
        Add-Line $lines "| $(ConvertTo-SafeText $groupName) | AUSENTE | 0 |"
        continue
    }

    $memberCount = Get-GroupMemberCount -Connection $connection -Group $group -GroupAuditStatus $groupAudit.Status
    Add-Line $lines "| $(ConvertTo-SafeText $groupName) | EXISTE | $memberCount |"
}
Add-Line $lines ""

Add-Line $lines "## Outros grupos SharePoint com ENAC no nome"
Add-Line $lines ""
Add-Line $lines "| Grupo | Membros contabilizados |"
Add-Line $lines "| --- | --- |"
if ($groupAudit.Status -ne "OK") {
    Add-Line $lines "| Nao auditado por limitacao de permissao | nao auditado |"
}
else {
    $relatedGroups = $allGroups | Where-Object { $_.Title -like "*ENAC*" } | Sort-Object Title
    if ($relatedGroups.Count -eq 0) {
        Add-Line $lines "| Nenhum grupo relacionado encontrado | 0 |"
    }
    else {
        foreach ($group in $relatedGroups) {
            $memberCount = Get-GroupMemberCount -Connection $connection -Group $group -GroupAuditStatus $groupAudit.Status
            Add-Line $lines "| $(ConvertTo-SafeText $group.Title) | $memberCount |"
        }
    }
}
Add-Line $lines ""

Add-Line $lines "## Listas administrativas"
Add-Line $lines ""
Add-Line $lines "Auditoria de listas administrativas: prosseguiu independentemente da auditoria de grupos."
Add-Line $lines ""
Add-Line $lines "| Lista | Status | Id | Itens | Heranca unica | Url | Observacao |"
Add-Line $lines "| --- | --- | --- | --- | --- | --- | --- |"
foreach ($listAudit in $listAudits) {
    if ($listAudit.List) {
        $list = $listAudit.List
        Add-Line $lines "| $(ConvertTo-SafeText $listAudit.Title) | EXISTE | $($list.Id) | $($list.ItemCount) | $($list.HasUniqueRoleAssignments) | $(ConvertTo-SafeText $list.RootFolder.ServerRelativeUrl) |  |"
    }
    else {
        Add-Line $lines "| $(ConvertTo-SafeText $listAudit.Title) | AUSENTE_OU_LIMITADO |  |  |  |  | $(ConvertTo-SafeText $listAudit.Message) |"
    }
}
Add-Line $lines ""

Add-Line $lines "## Permissoes atuais das listas administrativas"
foreach ($listTitle in $adminLists) {
    Add-Line $lines ""
    Add-Line $lines "### $(ConvertTo-SafeText $listTitle)"
    Add-Line $lines ""
    $listAudit = $listAudits | Where-Object { $_.Title -eq $listTitle } | Select-Object -First 1
    if (-not $listAudit.List) {
        Add-Line $lines "Lista ausente ou nao auditada por limitacao de acesso: $($listAudit.Message)"
        continue
    }

    $list = $listAudit.List
    Add-Line $lines "Heranca unica: $($list.HasUniqueRoleAssignments)"
    Add-Line $lines ""
    Add-Line $lines "| Principal | Tipo | Papeis |"
    Add-Line $lines "| --- | --- | --- |"
    $assignments = Get-ListRoleAssignments -Connection $connection -List $list
    foreach ($assignment in $assignments) {
        Add-Line $lines "| $($assignment.Principal) | $($assignment.Tipo) | $($assignment.Papeis) |"
    }
}
Add-Line $lines ""

Add-Line $lines "## Comparacao com plano V2.6B"
Add-Line $lines ""
Add-Line $lines "| Item | Resultado | Observacao |"
Add-Line $lines "| --- | --- | --- |"
foreach ($groupName in $plannedGroups) {
    if ($groupAudit.Status -ne "OK") {
        Add-Line $lines "| Grupo $(ConvertTo-SafeText $groupName) | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |"
    }
    else {
        $exists = [bool]($allGroups | Where-Object { $_.Title -eq $groupName } | Select-Object -First 1)
        Add-Line $lines "| Grupo $(ConvertTo-SafeText $groupName) | $(if ($exists) { 'OK' } else { 'PENDENTE' }) | Conferir criacao apenas em rodada futura autorizada |"
    }
}
foreach ($listTitle in $adminLists) {
    $exists = [bool]($listAudits | Where-Object { $_.Title -eq $listTitle -and $_.List } | Select-Object -First 1)
    Add-Line $lines "| Lista $(ConvertTo-SafeText $listTitle) | $(if ($exists) { 'OK' } else { 'PENDENTE' }) | Necessaria para permissao administrativa fina |"
}
Add-Line $lines ""

Add-Line $lines "## Alertas"
Add-Line $lines ""
Add-Line $lines "- Este relatorio deve ser revisado antes de qualquer mudanca real."
Add-Line $lines "- Se aparecer principal individual, confirmar se deve ser substituido por grupo."
Add-Line $lines "- Se uma lista administrativa herdar permissao, avaliar quebra somente em rodada futura autorizada."
Add-Line $lines "- Se a leitura de papeis falhar, repetir com app autorizado apenas para leitura suficiente."

[System.IO.File]::WriteAllLines($outputFullPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Auditoria readonly V2.6B.3 gerada: $outputFullPath"
