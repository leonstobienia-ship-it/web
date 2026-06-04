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

function New-FieldPlan {
    param(
        [string]$InternalName,
        [string]$DisplayName,
        [string]$Type,
        [bool]$Required = $false,
        $Default = $null,
        [string[]]$Choices = @(),
        [string]$LookupList = "",
        [string]$LookupField = "",
        [string]$Rule = "",
        [string]$Format = "",
        [int]$Lcid = 0,
        [int]$Decimals = -1,
        [bool]$Indexed = $false,
        [bool]$EnforceUniqueValues = $false,
        [bool]$RichText = $false,
        [bool]$AllowMultipleValues = $false
    )

    return [pscustomobject]@{
        InternalName = $InternalName
        DisplayName  = $DisplayName
        Type         = $Type
        Required     = $Required
        Default      = $Default
        Choices      = $Choices
        LookupList   = $LookupList
        LookupField  = $LookupField
        Rule         = $Rule
        Format       = $Format
        Lcid         = $Lcid
        Decimals     = $Decimals
        Indexed      = $Indexed
        EnforceUniqueValues = $EnforceUniqueValues
        RichText     = $RichText
        AllowMultipleValues = $AllowMultipleValues
    }
}

function Write-FieldPlan {
    param($Field)

    $parts = @(
        "campo=$($Field.InternalName)",
        "titulo=$($Field.DisplayName)",
        "tipo=$($Field.Type)",
        "obrigatorio=$($Field.Required)"
    )

    if ($null -ne $Field.Default) { $parts += "padrao=$($Field.Default)" }
    if ($Field.Choices.Count -gt 0) { $parts += "choices=$($Field.Choices -join ' | ')" }
    if ($Field.LookupList) { $parts += "lookup=$($Field.LookupList) / $($Field.LookupField)" }
    if ($Field.Format) { $parts += "formato=$($Field.Format)" }
    if ($Field.Type -eq "Currency") { $parts += "LCID=$($Field.Lcid)"; $parts += "Decimals=$($Field.Decimals)" }
    if ($Field.Indexed) { $parts += "Indexed=TRUE" }
    if ($Field.EnforceUniqueValues) { $parts += "EnforceUniqueValues=TRUE" }
    if ($Field.Type -eq "Note") { $parts += "RichText=$($Field.RichText)" }
    if ($Field.Type -eq "User") { $parts += "AllowMultipleValues=$($Field.AllowMultipleValues)" }
    if ($Field.Rule) { $parts += "regra=$($Field.Rule)" }

    Write-Host "      $($parts -join '; ')"
}

function Write-ListPlan {
    param($ListPlan)

    Write-Host "CRIAR $($ListPlan.Title)"
    Write-Host "      url tecnica: $($ListPlan.TechnicalUrl)"
    Write-Host "      versionamento: $($ListPlan.Versioning)"
    Write-Host "      anexos: $($ListPlan.Attachments)"
    Write-Host "      edicao em grade: $($ListPlan.GridEditing)"
    foreach ($field in $ListPlan.Fields) {
        Write-FieldPlan -Field $field
    }
}

Assert-Prerequisites

$profileChoices = @(
    "Campo / Engenheiro",
    "Cotações e Contratos",
    "Compras e Financeiro Operacional",
    "Planejamento",
    "Diretoria",
    "Administrador do Sistema"
)

$plannedAdminLists = @(
    [pscustomobject]@{
        Title = "ENAC Usuarios Perfis"
        TechnicalUrl = "Lists/ENACUsuariosPerfis"
        Versioning = "Ativo"
        Attachments = "Desativados"
        GridEditing = "Desativada"
        Fields = @(
            New-FieldPlan "Title" "Nome Completo" "Text" $true $null @() "" "" "Campo padrao"
            New-FieldPlan "UsuarioInternoId" "ID Interno do Usuário" "Text" $true $null @() "" "" "Unico e indexado" "" 0 -1 $true $true
            New-FieldPlan "ContaMicrosoft365" "Conta Microsoft 365" "User" $true $null @() "" "" "Uma pessoa" "" 0 -1 $false $false $false $false
            New-FieldPlan "EmailCorporativo" "E-mail Corporativo" "Text" $true $null @() "" "" "Usado no snapshot"
            New-FieldPlan "CargoFuncao" "Cargo / Função" "Text"
            New-FieldPlan "PerfilPrincipal" "Perfil Principal" "Choice" $true $null $profileChoices "" "" "Choices conforme perfis homologados V2.2"
            New-FieldPlan "PerfisAdicionais" "Perfis Adicionais" "MultiChoice" $false $null $profileChoices "" "" "Corrige o campo anterior singular"
            New-FieldPlan "PodeCriarSolicitacao" "Pode Criar Solicitação" "Boolean" $true $false
            New-FieldPlan "PodeRegistrarCotacoes" "Pode Registrar Cotações" "Boolean" $true $false
            New-FieldPlan "PodeAprovarCompras" "Pode Aprovar Compras" "Boolean" $true $false
            New-FieldPlan "PodeEmitirPedido" "Pode Emitir Pedido" "Boolean" $true $false
            New-FieldPlan "PodeVincularNF" "Pode Vincular NF" "Boolean" $true $false
            New-FieldPlan "PodeProgramarPagamento" "Pode Programar Pagamento" "Boolean" $true $false
            New-FieldPlan "PodeLiberarPagamento" "Pode Liberar Pagamento" "Boolean" $true $false
            New-FieldPlan "PodeAtualizarStatusFinal" "Pode Atualizar Status Final" "Boolean" $true $false
            New-FieldPlan "PodeAdministrarConfiguracoes" "Pode Administrar Configurações" "Boolean" $true $false
            New-FieldPlan "UsuarioAtivo" "Usuário Ativo" "Boolean" $true $true
            New-FieldPlan "SubstitutoTemporario" "Substituto Temporário" "Lookup" $false $null @() "ENAC Usuarios Perfis" "Title" "Self lookup"
            New-FieldPlan "InicioSubstituicao" "Início da Substituição" "DateTime" $false $null @() "" "" "Sem horario" "DateOnly"
            New-FieldPlan "FimSubstituicao" "Fim da Substituição" "DateTime" $false $null @() "" "" "Sem horario" "DateOnly"
            New-FieldPlan "Observacoes" "Observações" "Note"
        )
    },
    [pscustomobject]@{
        Title = "ENAC Alcadas"
        TechnicalUrl = "Lists/ENACAlcadas"
        Versioning = "Ativo"
        Attachments = "Desativados"
        GridEditing = "Desativada"
        Fields = @(
            New-FieldPlan "Title" "Regra" "Text" $true $null @() "" "" "Campo padrao"
            New-FieldPlan "RegraInternaId" "ID Interno da Regra" "Text" $true $null @() "" "" "Unico e indexado" "" 0 -1 $true $true
            New-FieldPlan "Processo" "Processo" "Choice" $true $null @("Compra", "Liberação Bancária", "Medição", "Pagamento", "Outro")
            New-FieldPlan "TipoSolicitacao" "Tipo de Solicitação" "Choice" $false $null @("Material", "Serviço", "Equipamento", "Ferramenta", "Locação", "Terceiro/Prestador", "EPI", "Documento/Taxa", "Outro") "" "" "Choices reais da Lista 02"
            New-FieldPlan "Obra" "Obra" "Lookup" $false $null @() "Lista 01 - Controle de Obras ENAC" "NomedaObra" "Vazio significa regra geral"
            New-FieldPlan "ValorMinimo" "Valor Mínimo" "Currency" $true $null @() "" "" "Moeda brasileira" "" 1046 2
            New-FieldPlan "ValorMaximo" "Valor Máximo" "Currency" $false $null @() "" "" "Vazio quando ilimitado" "" 1046 2
            New-FieldPlan "Ilimitado" "Sem Limite Máximo" "Boolean" $true $false
            New-FieldPlan "AprovadorPrincipal" "Aprovador Principal" "Lookup" $true $null @() "ENAC Usuarios Perfis" "Title"
            New-FieldPlan "ExigeAprovacaoAdicional" "Exige Aprovação Adicional" "Boolean" $true $false
            New-FieldPlan "AprovadorAdicional" "Aprovador Adicional" "Lookup" $false $null @() "ENAC Usuarios Perfis" "Title"
            New-FieldPlan "VigenciaInicial" "Vigência Inicial" "DateTime" $true $null @() "" "" "Sem horario" "DateOnly"
            New-FieldPlan "VigenciaFinal" "Vigência Final" "DateTime" $false $null @() "" "" "Sem horario" "DateOnly"
            New-FieldPlan "Ativo" "Regra Ativa" "Boolean" $true $true
            New-FieldPlan "Observacoes" "Observações" "Note"
        )
    },
    [pscustomobject]@{
        Title = "ENAC Historico Configuracoes"
        TechnicalUrl = "Lists/ENACHistoricoConfiguracoes"
        Versioning = "Ativo"
        Attachments = "Desativados"
        GridEditing = "Desativada"
        Fields = @(
            New-FieldPlan "Title" "Resumo do Evento" "Text" $true
            New-FieldPlan "TipoConfiguracao" "Tipo de Configuração" "Choice" $true $null @("Usuário", "Alçada", "Regra Especial", "Parâmetro Geral")
            New-FieldPlan "AcaoRealizada" "Ação Realizada" "Choice" $true $null @("Inclusão", "Edição", "Ativação", "Desativação", "Ajuste Vinculado")
            New-FieldPlan "ItemConfiguracaoId" "ID do Item Configurado" "Text" $true
            New-FieldPlan "ValorAnterior" "Valor Anterior" "Note"
            New-FieldPlan "ValorNovo" "Valor Novo" "Note" $true
            New-FieldPlan "Justificativa" "Justificativa" "Note"
        )
    },
    [pscustomobject]@{
        Title = "ENAC Snapshots Regras"
        TechnicalUrl = "Lists/ENACSnapshotsRegras"
        Versioning = "Ativo"
        Attachments = "Desativados"
        GridEditing = "Desativada"
        Fields = @(
            New-FieldPlan "Title" "Código do Snapshot" "Text" $true $null @() "" "" "Campo padrao"
            New-FieldPlan "Solicitacao" "Solicitação" "Lookup" $true $null @() "Lista 02 — Requisições de Compra" "Title"
            New-FieldPlan "RegraAlcadaUtilizada" "Regra de Alçada Utilizada" "Lookup" $true $null @() "ENAC Alcadas" "Title"
            New-FieldPlan "RegraInternaId" "ID Interno da Regra Aplicada" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "ResumoRegraAplicada" "Resumo da Regra Aplicada" "Note" $true $null @() "" "" "Congelado"
            New-FieldPlan "Processo" "Processo" "Choice" $true $null @("Compra") "" "" "Inicialmente Compra"
            New-FieldPlan "FaixaValorVigente" "Faixa de Valor Vigente" "Text" $true $null @() "" "" "Texto congelado"
            New-FieldPlan "ValorAnalisado" "Valor Analisado" "Currency" $true $null @() "" "" "Moeda brasileira" "" 1046 2
            New-FieldPlan "AprovadorBaseId" "ID do Aprovador Base" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "AprovadorBaseNome" "Nome do Aprovador Base" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "AprovadorBaseEmail" "E-mail do Aprovador Base" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "AprovadorEfetivoId" "ID do Aprovador Efetivo" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "AprovadorEfetivoNome" "Nome do Aprovador Efetivo" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "AprovadorEfetivoEmail" "E-mail do Aprovador Efetivo" "Text" $true $null @() "" "" "Congelado"
            New-FieldPlan "SubstituicaoAplicada" "Substituição Aplicada" "Boolean" $true $false
            New-FieldPlan "MotivoResolucaoAprovador" "Motivo da Resolução do Aprovador" "Note"
            New-FieldPlan "MotivoExcecao" "Motivo da Exceção" "Note"
            New-FieldPlan "DataHoraAplicacao" "Data/Hora da Aplicação" "DateTime" $true $null @() "" "" "Data e hora" "DateTime"
        )
    }
)

$plannedLookups = @(
    "ENAC Alcadas.Obra -> Lista 01 - Controle de Obras ENAC / NomedaObra",
    "ENAC Alcadas.AprovadorPrincipal -> ENAC Usuarios Perfis / Title",
    "ENAC Alcadas.AprovadorAdicional -> ENAC Usuarios Perfis / Title",
    "ENAC Usuarios Perfis.SubstitutoTemporario -> ENAC Usuarios Perfis / Title",
    "ENAC Snapshots Regras.Solicitacao -> Lista 02 — Requisições de Compra / ID",
    "ENAC Snapshots Regras.RegraAlcadaUtilizada -> ENAC Alcadas / Title",
    "Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra -> ENAC Snapshots Regras / Title"
)

$provisioningOrder = @(
    "1. Validar Lista 01 - Controle de Obras ENAC",
    "2. Validar Lista 02 — Requisições de Compra",
    "3. Criar ENAC Usuarios Perfis",
    "4. Criar ENAC Alcadas",
    "5. Criar ENAC Historico Configuracoes",
    "6. Criar ENAC Snapshots Regras",
    "7. Criar Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra",
    "8. Revisar permissoes especificas de snapshots e historico em rodada futura"
)

$connection = Connect-Readonly
$lists = Get-PnPList -Connection $connection -Includes RootFolder,Hidden,ItemCount

$obrasList = Find-List -Lists $lists -Title "Lista 01 - Controle de Obras ENAC"
$solicitacoesList = Find-List -Lists $lists -Title "Lista 02 — Requisições de Compra"

Write-Host ""
Write-Host "Dry-run V2.3A - nenhuma alteracao sera aplicada." -ForegroundColor Green
Write-Host "Confirmacao: nao serao criadas ENACObras nem ENACSolicitacoes."
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
        Write-Host "      url atual: $($existing.RootFolder.ServerRelativeUrl)"
    } else {
        Write-ListPlan -ListPlan $admin
    }
}

Write-Host ""
Write-Host "Campo complementar em lista existente:"
if ($solicitacoesList) {
    $snapshotFieldExists = Test-FieldExists -Connection $connection -List $solicitacoesList -InternalName "SnapshotAprovacaoCompra"
    if ($snapshotFieldExists) {
        Write-Host "OK   Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra ja existe"
    } else {
        Write-Host "CRIAR campo=SnapshotAprovacaoCompra; titulo=Snapshot da Aprovação de Compra; tipo=Lookup; obrigatorio=False; lookup=ENAC Snapshots Regras / Title"
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
Write-Host "Configuracoes e protecoes:"
Write-Host "PLANEJAR versionamento ativo em todas as listas administrativas."
Write-Host "PLANEJAR anexos desativados em todas as listas administrativas."
Write-Host "PLANEJAR edicao em grade desativada para ENAC Historico Configuracoes e ENAC Snapshots Regras."
Write-Host "OBS: versionamento e bloqueio de edicao em grade reduzem risco operacional."
Write-Host "OBS: snapshots e historico so serao efetivamente protegidos apos definicao/aplicacao de permissoes especificas e uso controlado pelo sistema/automacao."

Write-Host ""
Write-Host "Ordem recomendada de provisionamento:"
foreach ($step in $provisioningOrder) {
    Write-Host $step
}

Write-Host ""
Write-Host "Fim do dry-run. Nenhum comando de criacao, alteracao ou exclusao foi executado."
