param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras",

    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("Interactive", "DeviceLogin")]
    [string]$AuthMode = "DeviceLogin",

    [Parameter(Mandatory = $false)]
    [string]$PageName = "Sistema-ENAC-Homologacao.aspx",

    [Parameter(Mandatory = $false)]
    [switch]$Create,

    [Parameter(Mandatory = $false)]
    [switch]$Execute,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmacaoPagina
)

$ErrorActionPreference = "Stop"
$confirmationRequired = "CONFIRMAR-PAGINA-APP-SISTEMA-ENAC-V2.8E"

Write-Host "V2.8E - Pagina dedicada Sistema ENAC"
Write-Host "Site: $SiteUrl"
Write-Host "Pagina: $PageName"

if (-not $Execute) {
    Write-Host "DRY-RUN: nenhuma alteracao sera executada."
    Write-Host "Para aplicar, use -Execute -ConfirmacaoPagina `"$confirmationRequired`"."
}

if ($Execute -and $ConfirmacaoPagina -ne $confirmationRequired) {
    throw "ConfirmacaoPagina invalida. Valor exigido: $confirmationRequired"
}

Import-Module PnP.PowerShell -ErrorAction Stop

$connectParams = @{
    Url      = $SiteUrl
    ClientId = $ClientId
    Tenant   = $Tenant
}

if ($AuthMode -eq "DeviceLogin") {
    $connectParams.DeviceLogin = $true
} else {
    $connectParams.Interactive = $true
}

if (-not $Execute) {
    Write-Host "DRY-RUN: conexao PnP nao sera aberta pelo script em modo orientacao."
    Write-Host "Plano:"
    Write-Host "1. Validar existencia da pagina em Site Pages."
    Write-Host "2. Se -Create for informado em execucao real, criar pagina quando ausente."
    Write-Host "3. Aplicar Set-PnPPage -LayoutType SingleWebPartAppPage quando disponivel."
    Write-Host "4. Nao alterar listas, dados operacionais ou Power Automate."
    return
}

Connect-PnPOnline @connectParams

$page = Get-PnPPage -Identity $PageName -ErrorAction SilentlyContinue

if (-not $page) {
    if (-not $Create) {
        throw "Pagina '$PageName' nao encontrada. Crie manualmente ou execute novamente com -Create."
    }

    Write-Host "Criando pagina '$PageName'."
    $page = Add-PnPPage -Name $PageName -LayoutType SingleWebPartAppPage
} else {
    Write-Host "Pagina encontrada: $PageName"
}

Write-Host "Aplicando layout SingleWebPartAppPage."
Set-PnPPage -Identity $PageName -LayoutType SingleWebPartAppPage

Write-Host "Concluido. Revise manualmente a pagina, adicione/configure a webpart Sistema ENAC se necessario e publique pela interface do SharePoint."
