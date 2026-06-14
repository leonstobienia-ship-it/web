param(
  [string]$EnvFile = ".\web\.env"
)

$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$writeClientId = "0df147e7-ab5c-407d-b1b1-bb350661bebf"
$confirmacaoEsperada = "CONFIRMAR-ESCRITA-WEB-V3.0B-ENAC"
$requiredSiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras"

function Read-EnvFile {
  param([string]$Path)

  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or $line.IndexOf("=") -lt 1) {
      return
    }

    $name, $value = $line.Split("=", 2)
    $values[$name.Trim()] = $value.Trim().Trim('"').Trim("'")
  }

  return $values
}

function Get-ConfigValue {
  param(
    [hashtable]$FileValues,
    [string]$Name
  )

  $environmentValue = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ($environmentValue) {
    return $environmentValue
  }

  if ($FileValues.ContainsKey($Name)) {
    return $FileValues[$Name]
  }

  return ""
}

$fileValues = Read-EnvFile -Path $EnvFile
$clientId = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_ENTRA_CLIENT_ID"
$tenantId = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_ENTRA_TENANT_ID"
$siteUrl = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_SHAREPOINT_SITE_URL"
$scope = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_SHAREPOINT_SCOPE"
$habilitar = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_HABILITAR_ESCRITA_REQUISICAO_V30B"
$modoTeste = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_MODO_TESTE_WEB_V30B"
$confirmacao = Get-ConfigValue -FileValues $fileValues -Name "VITE_ENAC_CONFIRMACAO_MANUAL_V30B"

if (-not $clientId) { $clientId = $readonlyClientId }
if (-not $tenantId) { $tenantId = "enaccombr.onmicrosoft.com" }
if (-not $siteUrl) { $siteUrl = $requiredSiteUrl }
if (-not $scope) { $scope = "https://enaccombr.sharepoint.com/AllSites.Read" }

$issues = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

if ($siteUrl -ne $requiredSiteUrl) {
  $warnings.Add("SiteUrl diferente do site validado: $siteUrl")
}

if ($habilitar -eq "true") {
  if ($clientId.ToLowerInvariant() -eq $readonlyClientId.ToLowerInvariant()) {
    $issues.Add("ClientId aponta para o aplicativo readonly de inventario.")
  }

  if ($clientId.ToLowerInvariant() -ne $writeClientId.ToLowerInvariant()) {
    $warnings.Add("ClientId nao corresponde ao app write V3.0b documentado: $clientId")
  }

  if ($scope -notmatch "/AllSites\.(Write|Manage|FullControl)$") {
    $issues.Add("Escopo nao permite escrita: $scope")
  }

  if ($modoTeste -ne "true") {
    $issues.Add("Modo de teste V3.0b nao esta habilitado.")
  }

  if ($confirmacao -ne $confirmacaoEsperada) {
    $issues.Add("Confirmacao manual V3.0b ausente ou divergente.")
  }
} else {
  $warnings.Add("Escrita V3.0b esta desabilitada. O portal ficara em leitura/simulacao local.")
}

$result = [ordered]@{
  EnvFile = $EnvFile
  TenantId = $tenantId
  SiteUrl = $siteUrl
  ClientIdReadonly = ($clientId.ToLowerInvariant() -eq $readonlyClientId.ToLowerInvariant())
  ClientIdWrite = ($clientId.ToLowerInvariant() -eq $writeClientId.ToLowerInvariant())
  Scope = $scope
  ScopeWrite = ($scope -match "/AllSites\.(Write|Manage|FullControl)$")
  EscritaSolicitada = ($habilitar -eq "true")
  ModoTeste = ($modoTeste -eq "true")
  ConfirmacaoValida = ($confirmacao -eq $confirmacaoEsperada)
  Status = if ($issues.Count -gt 0) { "BLOQUEADO" } elseif ($habilitar -eq "true") { "OK" } else { "READONLY" }
  Warnings = @($warnings)
  Issues = @($issues)
}

$result | ConvertTo-Json -Depth 4

if ($issues.Count -gt 0) {
  exit 2
}
