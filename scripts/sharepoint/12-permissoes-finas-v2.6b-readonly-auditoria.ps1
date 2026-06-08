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
        $Group
    )

    try {
        return @(Get-PnPGroupMember -Identity $Group.Title -Connection $Connection).Count
    }
    catch {
        return "indisponivel"
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

Assert-Prerequisites

$outputFullPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDir = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDir)) {
    throw "Diretorio de saida nao encontrado: $outputDir"
}

$connection = Connect-PnPReadonly
$web = Get-PnPWeb -Connection $connection -Includes Url,Title
$allGroups = Get-PnPGroup -Connection $connection
$allLists = Get-PnPList -Connection $connection -Includes Title,Id,Hidden,ItemCount,HasUniqueRoleAssignments,RootFolder
$roleDefinitions = Get-PnPRoleDefinition -Connection $connection

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

Add-Line $lines "## Definicoes de permissao disponiveis"
Add-Line $lines ""
Add-Line $lines "| Nome | Descricao |"
Add-Line $lines "| --- | --- |"
foreach ($roleDefinition in $roleDefinitions | Sort-Object Name) {
    Add-Line $lines "| $(ConvertTo-SafeText $roleDefinition.Name) | $(ConvertTo-SafeText $roleDefinition.Description) |"
}
Add-Line $lines ""

Add-Line $lines "## Grupos ENAC planejados"
Add-Line $lines ""
Add-Line $lines "| Grupo planejado | Status | Membros contabilizados |"
Add-Line $lines "| --- | --- | --- |"
foreach ($groupName in $plannedGroups) {
    $group = $allGroups | Where-Object { $_.Title -eq $groupName } | Select-Object -First 1
    if ($group) {
        $memberCount = Get-GroupMemberCount -Connection $connection -Group $group
        Add-Line $lines "| $(ConvertTo-SafeText $groupName) | EXISTE | $memberCount |"
    }
    else {
        Add-Line $lines "| $(ConvertTo-SafeText $groupName) | AUSENTE | 0 |"
    }
}
Add-Line $lines ""

Add-Line $lines "## Outros grupos SharePoint com ENAC no nome"
Add-Line $lines ""
Add-Line $lines "| Grupo | Membros contabilizados |"
Add-Line $lines "| --- | --- |"
$relatedGroups = $allGroups | Where-Object { $_.Title -like "*ENAC*" } | Sort-Object Title
if ($relatedGroups.Count -eq 0) {
    Add-Line $lines "| Nenhum grupo relacionado encontrado | 0 |"
}
else {
    foreach ($group in $relatedGroups) {
        $memberCount = Get-GroupMemberCount -Connection $connection -Group $group
        Add-Line $lines "| $(ConvertTo-SafeText $group.Title) | $memberCount |"
    }
}
Add-Line $lines ""

Add-Line $lines "## Listas administrativas"
Add-Line $lines ""
Add-Line $lines "| Lista | Status | Id | Itens | Heranca unica | Url |"
Add-Line $lines "| --- | --- | --- | --- | --- | --- |"
foreach ($listTitle in $adminLists) {
    $list = $allLists | Where-Object { $_.Title -eq $listTitle } | Select-Object -First 1
    if ($list) {
        Add-Line $lines "| $(ConvertTo-SafeText $listTitle) | EXISTE | $($list.Id) | $($list.ItemCount) | $($list.HasUniqueRoleAssignments) | $(ConvertTo-SafeText $list.RootFolder.ServerRelativeUrl) |"
    }
    else {
        Add-Line $lines "| $(ConvertTo-SafeText $listTitle) | AUSENTE |  |  |  |  |"
    }
}
Add-Line $lines ""

Add-Line $lines "## Permissoes atuais das listas administrativas"
foreach ($listTitle in $adminLists) {
    Add-Line $lines ""
    Add-Line $lines "### $(ConvertTo-SafeText $listTitle)"
    Add-Line $lines ""
    $list = $allLists | Where-Object { $_.Title -eq $listTitle } | Select-Object -First 1
    if (-not $list) {
        Add-Line $lines "Lista ausente."
        continue
    }

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
    $exists = [bool]($allGroups | Where-Object { $_.Title -eq $groupName } | Select-Object -First 1)
    Add-Line $lines "| Grupo $(ConvertTo-SafeText $groupName) | $(if ($exists) { 'OK' } else { 'PENDENTE' }) | Conferir criacao apenas em rodada futura autorizada |"
}
foreach ($listTitle in $adminLists) {
    $exists = [bool]($allLists | Where-Object { $_.Title -eq $listTitle } | Select-Object -First 1)
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
