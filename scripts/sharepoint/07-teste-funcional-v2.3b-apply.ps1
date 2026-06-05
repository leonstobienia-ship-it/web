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
    [switch]$Apply,

    [Parameter(Mandatory = $false)]
    [string]$ConfirmTeste = "",

    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = ".\config\teste-funcional-v2.3b.local.json"
)

$ErrorActionPreference = "Stop"

$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$confirmationPhrase = "TESTAR-V2.3B-ENAC"
$lista02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$marker = "V2.3B-TESTE"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") { throw "PowerShell 7.4 ou superior e obrigatorio." }
    if (-not (Get-Module -ListAvailable PnP.PowerShell | Select-Object -First 1)) { throw "Modulo PnP.PowerShell nao encontrado." }
    if ($Apply -and $ClientId -eq $readonlyClientId) { throw "Aplicacao recusada: ClientId readonly nao pode criar/alterar itens de teste." }
    if ($Apply -and $ConfirmTeste -ne $confirmationPhrase) { throw "Aplicacao recusada: informe -ConfirmTeste `"$confirmationPhrase`"." }
}

function Connect-PnPTest {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }
    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-RequiredConfig {
    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        throw "Arquivo local de configuracao nao encontrado: $ConfigPath. Crie a partir de config/teste-funcional-v2.3b.example.json."
    }
    return Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
}

function Get-ListByTitleOrUrl {
    param($Connection, [string]$Title, [string]$Url)
    $lists = Get-PnPList -Connection $Connection -Includes RootFolder,Hidden,ItemCount
    $matches = @($lists | Where-Object { $_.Title -eq $Title -or $_.RootFolder.ServerRelativeUrl -like "*/$Url" })
    if ($matches.Count -gt 1) { throw "Mais de uma lista encontrada para $Title / $Url." }
    if ($matches.Count -eq 0) { throw "Lista ausente: $Title." }
    return $matches[0]
}

function Get-ListByGuid {
    param($Connection, [Guid]$Id)
    return @(Get-PnPList -Connection $Connection -Identity $Id -Includes RootFolder,Hidden,ItemCount -ThrowExceptionIfListNotFound)[0]
}

function Get-FieldChoices {
    param($Connection, $List, [string]$FieldName)
    $listIdentity = $List.Id.ToString()
    $field = Get-PnPField -Connection $Connection -List $listIdentity -Identity $FieldName
    if (-not $field.Choices) { return @() }
    return @($field.Choices)
}

function Assert-Choice {
    param([string[]]$Choices, [string]$Value, [string]$FieldName)
    if ($Choices -notcontains $Value) { throw "Choice '$Value' nao existe em $FieldName. Choices atuais: $($Choices -join ', ')." }
}

function Get-TestItemByInternalId {
    param($Connection, $List, [string]$FieldName, [string]$Value)
    $listIdentity = $List.Id.ToString()
    $items = Get-PnPListItem -Connection $Connection -List $listIdentity -Fields $FieldName, "Title" -PageSize 200
    return @($items | Where-Object { [string]$_.FieldValues[$FieldName] -eq $Value }) | Select-Object -First 1
}

function Get-TestItemByTitle {
    param($Connection, $List, [string]$Title)
    $listIdentity = $List.Id.ToString()
    $items = Get-PnPListItem -Connection $Connection -List $listIdentity -Fields "Title" -PageSize 200
    return @($items | Where-Object { [string]$_.FieldValues["Title"] -eq $Title }) | Select-Object -First 1
}

function Ensure-TestItem {
    param($Connection, $List, [string]$KeyField, [string]$KeyValue, [hashtable]$Values)
    $listIdentity = $List.Id.ToString()
    $existing = Get-TestItemByInternalId -Connection $Connection -List $List -FieldName $KeyField -Value $KeyValue
    if ($existing) {
        Set-PnPListItem -Connection $Connection -List $listIdentity -Identity $existing.Id -Values $Values | Out-Null
        return $existing
    }
    return Add-PnPListItem -Connection $Connection -List $listIdentity -Values $Values
}

function Resolve-UserLookupId {
    param($Connection, $UsuariosList, [string]$UsuarioInternoId)
    $item = Get-TestItemByInternalId -Connection $Connection -List $UsuariosList -FieldName "UsuarioInternoId" -Value $UsuarioInternoId
    if (-not $item) { throw "Usuario de teste nao encontrado: $UsuarioInternoId" }
    return $item.Id
}

Assert-Prerequisites
$connection = Connect-PnPTest
$config = $null
if (Test-Path -LiteralPath $ConfigPath) { $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json }

$usuarios = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Usuarios Perfis" -Url "Lists/ENACUsuariosPerfis"
$alcadas = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Alcadas" -Url "Lists/ENACAlcadas"
$historico = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Historico Configuracoes" -Url "Lists/ENACHistoricoConfiguracoes"
$snapshots = Get-ListByTitleOrUrl -Connection $connection -Title "ENAC Snapshots Regras" -Url "Lists/ENACSnapshotsRegras"
$lista02 = Get-ListByGuid -Connection $connection -Id $lista02Id

$perfilChoices = Get-FieldChoices -Connection $connection -List $usuarios -FieldName "PerfilPrincipal"
$processoChoices = Get-FieldChoices -Connection $connection -List $alcadas -FieldName "Processo"
$tipoChoices = Get-FieldChoices -Connection $connection -List $alcadas -FieldName "TipoSolicitacao"
Assert-Choice -Choices $processoChoices -Value "Compra" -FieldName "ENAC Alcadas.Processo"
Assert-Choice -Choices $tipoChoices -Value "Material" -FieldName "ENAC Alcadas.TipoSolicitacao"

$plannedUsers = @(
    @{ Key = "leon"; Id = "usr-leon"; Name = "Leon"; Perfil = "Diretor"; Flags = @{ PodeAprovarCompras = $true; PodeAdministrarConfiguracoes = $true } },
    @{ Key = "gustavo"; Id = "usr-gustavo"; Name = "Gustavo"; Perfil = "Planejamento"; Flags = @{ PodeCriarSolicitacao = $true; PodeAprovarCompras = $true } },
    @{ Key = "matheus"; Id = "usr-matheus"; Name = "Matheus"; Perfil = "ComprasFinanceiro"; Flags = @{ PodeEmitirPedido = $true; PodeVincularNF = $true; PodeProgramarPagamento = $true } },
    @{ Key = "kemilly"; Id = "usr-kemilly"; Name = "Kemilly"; Perfil = "Orcamento"; Flags = @{ PodeRegistrarCotacoes = $true } }
)

foreach ($user in $plannedUsers) {
    Assert-Choice -Choices $perfilChoices -Value $user.Perfil -FieldName "ENAC Usuarios Perfis.PerfilPrincipal"
}

if (-not $Apply) {
    Write-Host "Dry-run teste funcional V2.3B. Nenhuma alteracao sera aplicada." -ForegroundColor Green
    Write-Host "Validado: listas administrativas, Lista 02, choices Compra/Material e perfis planejados."
    Write-Host "Plano: criar/atualizar usuarios V2.3B-TESTE, alcadas, snapshot, vinculo e historico."
    Write-Host "Requisicao: preferir item manual informado em config/teste-funcional-v2.3b.local.json."
    return
}

$config = Get-RequiredConfig
$emailByKey = @{}
foreach ($name in "leon", "gustavo", "matheus", "kemilly") {
    $email = [string]$config.usuarios.$name.email
    if ([string]::IsNullOrWhiteSpace($email) -or $email -like "*@exemplo.com") {
        throw "Informe email real de teste para '$name' em $ConfigPath. O arquivo local nao deve ser versionado."
    }
    $emailByKey[$name] = $email
}

foreach ($user in $plannedUsers) {
    $values = @{
        Title = "$marker - $($user.Name)"
        UsuarioInternoId = $user.Id
        ContaMicrosoft365 = $emailByKey[$user.Key]
        EmailCorporativo = $emailByKey[$user.Key]
        PerfilPrincipal = $user.Perfil
        UsuarioAtivo = $true
    }
    foreach ($flag in $user.Flags.Keys) { $values[$flag] = $user.Flags[$flag] }
    Ensure-TestItem -Connection $connection -List $usuarios -KeyField "UsuarioInternoId" -KeyValue $user.Id -Values $values | Out-Null
}

$gustavoLookupId = Resolve-UserLookupId -Connection $connection -UsuariosList $usuarios -UsuarioInternoId "usr-gustavo"
$leonLookupId = Resolve-UserLookupId -Connection $connection -UsuariosList $usuarios -UsuarioInternoId "usr-leon"
$today = Get-Date

$rule1 = Ensure-TestItem -Connection $connection -List $alcadas -KeyField "RegraInternaId" -KeyValue "alc-v23b-teste-compra-ate-20000" -Values @{
    Title = "V2.3B-TESTE-COMPRA-ATE-20000"; RegraInternaId = "alc-v23b-teste-compra-ate-20000"; Processo = "Compra"; TipoSolicitacao = "Material"; ValorMinimo = 0; ValorMaximo = 20000; Ilimitado = $false; AprovadorPrincipal = $gustavoLookupId; ExigeAprovacaoAdicional = $false; Ativo = $true; VigenciaInicial = $today; Observacoes = "regra criada para teste funcional V2.3B"
}
Ensure-TestItem -Connection $connection -List $alcadas -KeyField "RegraInternaId" -KeyValue "alc-v23b-teste-compra-acima-20000" -Values @{
    Title = "V2.3B-TESTE-COMPRA-ACIMA-20000"; RegraInternaId = "alc-v23b-teste-compra-acima-20000"; Processo = "Compra"; TipoSolicitacao = "Material"; ValorMinimo = 20000.01; Ilimitado = $true; AprovadorPrincipal = $leonLookupId; ExigeAprovacaoAdicional = $false; Ativo = $true; VigenciaInicial = $today; Observacoes = "regra criada para teste funcional V2.3B"
} | Out-Null

$requisicaoId = $config.requisicaoTeste.itemId
if (-not $requisicaoId) { throw "Informe requisicaoTeste.itemId de uma requisicao manual de teste contendo V2.3B-TESTE. Criacao de requisicao pela automacao nao esta habilitada nesta versao." }

$snapshot = Get-TestItemByTitle -Connection $connection -List $snapshots -Title "SNAP-V2.3B-TESTE-001"
$snapshotsIdentity = $snapshots.Id.ToString()
$lista02Identity = $lista02.Id.ToString()
$snapshotValues = @{
    Title = "SNAP-V2.3B-TESTE-001"; Solicitacao = [int]$requisicaoId; RegraAlcadaUtilizada = $rule1.Id; RegraInternaId = "alc-v23b-teste-compra-ate-20000"; ResumoRegraAplicada = "Compra / Material / R$ 0,00 a R$ 20.000,00 / Gustavo"; Processo = "Compra"; FaixaValorVigente = "R$ 0,00 a R$ 20.000,00"; ValorAnalisado = [decimal]$config.requisicaoTeste.valorAnalisado; AprovadorBaseId = "usr-gustavo"; AprovadorBaseNome = "Gustavo"; AprovadorBaseEmail = $emailByKey["gustavo"]; AprovadorEfetivoId = "usr-gustavo"; AprovadorEfetivoNome = "Gustavo"; AprovadorEfetivoEmail = $emailByKey["gustavo"]; SubstituicaoAplicada = $false; DataHoraAplicacao = (Get-Date)
}
if ($snapshot) {
    Set-PnPListItem -Connection $connection -List $snapshotsIdentity -Identity $snapshot.Id -Values $snapshotValues | Out-Null
}
else {
    $snapshot = Add-PnPListItem -Connection $connection -List $snapshotsIdentity -Values $snapshotValues
}

Set-PnPListItem -Connection $connection -List $lista02Identity -Identity ([int]$requisicaoId) -Values @{ SnapshotAprovacaoCompra = $snapshot.Id } | Out-Null

Ensure-TestItem -Connection $connection -List $historico -KeyField "ItemConfiguracaoId" -KeyValue "V2.3B-TESTE" -Values @{
    Title = "V2.3B-TESTE - Carga inicial controlada"; TipoConfiguracao = "Parâmetro Geral"; AcaoRealizada = "Inclusão"; ItemConfiguracaoId = "V2.3B-TESTE"; ValorNovo = "Carga inicial de usuarios, alcadas e snapshot de teste V2.3B"; Justificativa = "Teste funcional controlado da V2.3B apos provisionamento estrutural"
} | Out-Null

Write-Host "Teste funcional V2.3B aplicado para itens marcados como V2.3B-TESTE."
