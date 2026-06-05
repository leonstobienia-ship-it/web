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
    [string]$ConfirmProvisionamento = ""
)

$ErrorActionPreference = "Stop"

$readonlyClientId = "0dab19b3-8e48-4f89-ad94-1446b08d3781"
$confirmationPhrase = "PROVISIONAR-V2.3-ENAC"
$expectedObrasId = [Guid]"a9afadc1-f843-45c0-a628-4f49a8716832"
$expectedSolicitacoesId = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"

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

function Assert-ApplyAllowed {
    if (-not $Apply) { return }

    if ($ClientId -eq $readonlyClientId) {
        throw "Aplicacao recusada: o ClientId readonly de inventario/dry-run nao pode provisionar estruturas."
    }

    if ($ConfirmProvisionamento -ne $confirmationPhrase) {
        throw "Aplicacao recusada: informe -ConfirmProvisionamento `"$confirmationPhrase`" para provisionamento real."
    }
}

function Connect-PnPProvisioning {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-OperationalListByGuid {
    param($Connection, [Guid]$ListId, [string]$DisplayName)

    return @(Get-PnPList `
        -Connection $Connection `
        -Identity $ListId `
        -Includes RootFolder,Hidden,ItemCount `
        -ThrowExceptionIfListNotFound)[0]
}

function Assert-OperationalLists {
    param($Connection)

    $obras = Get-OperationalListByGuid -Connection $Connection -ListId $expectedObrasId -DisplayName "Lista 01 - Controle de Obras ENAC"
    $solicitacoes = Get-OperationalListByGuid -Connection $Connection -ListId $expectedSolicitacoesId -DisplayName "Lista 02 — Requisições de Compra"

    if (-not $obras) { throw "Lista 01 - Controle de Obras ENAC nao encontrada." }
    if (-not $solicitacoes) { throw "Lista 02 — Requisições de Compra nao encontrada." }
    if ($obras.Id -ne $expectedObrasId) { throw "GUID da Lista 01 divergente. Esperado $expectedObrasId, encontrado $($obras.Id)." }
    if ($solicitacoes.Id -ne $expectedSolicitacoesId) { throw "GUID da Lista 02 divergente. Esperado $expectedSolicitacoesId, encontrado $($solicitacoes.Id)." }

    return [pscustomobject]@{
        Obras = $obras
        Solicitacoes = $solicitacoes
    }
}

function Write-PlanLine {
    param([string]$Message)
    Write-Host "PLANEJAR $Message"
}

function Invoke-DryRunPlan {
    Write-Host "Provisionamento V2.3A em modo dry-run. Nenhuma alteracao sera aplicada." -ForegroundColor Green
    Write-Host "Nao criar ENACObras nem ENACSolicitacoes."
    Write-PlanLine "validar Lista 01 - Controle de Obras ENAC por GUID / $expectedObrasId"
    Write-PlanLine "validar Lista 02 — Requisições de Compra por GUID / $expectedSolicitacoesId"
    Write-PlanLine "criar lista ENAC Usuarios Perfis em Lists/ENACUsuariosPerfis"
    Write-PlanLine "criar lista ENAC Alcadas em Lists/ENACAlcadas"
    Write-PlanLine "criar lista ENAC Historico Configuracoes em Lists/ENACHistoricoConfiguracoes"
    Write-PlanLine "criar lista ENAC Snapshots Regras em Lists/ENACSnapshotsRegras"
    Write-PlanLine "criar lookup ENAC Alcadas.Obra -> Lista 01 resolvida por GUID $expectedObrasId / NomedaObra"
    Write-PlanLine "criar lookup ENAC Snapshots Regras.Solicitacao -> Lista 02 resolvida por GUID $expectedSolicitacoesId / ID"
    Write-PlanLine "criar campo Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra na lista resolvida por GUID $expectedSolicitacoesId -> ENAC Snapshots Regras / Title"
    Write-PlanLine "usar TipoSolicitacao como Choice: Material | Serviço | Equipamento | Ferramenta | Locação | Terceiro/Prestador | EPI | Documento/Taxa | Outro"
    Write-PlanLine "usar moedas com Type=Currency, LCID=1046, Decimals=2"
    Write-PlanLine "usar UsuarioInternoId e RegraInternaId com Indexed=TRUE e EnforceUniqueValues=TRUE"
    Write-PlanLine "usar datas sem horario com Type=DateTime e Format=DateOnly"
    Write-PlanLine "usar DataHoraAplicacao com Type=DateTime e Format=DateTime"
    Write-PlanLine "usar campos Note como texto simples, sem rich text"
    Write-PlanLine "desativar edicao em grade nas quatro listas administrativas"
}

function ConvertTo-XmlAttributeValue {
    param([string]$Value)

    return [System.Security.SecurityElement]::Escape($Value)
}

function ConvertTo-XmlBool {
    param([bool]$Value)

    if ($Value) { return "TRUE" }
    return "FALSE"
}

function Get-ListByTitleOrUrl {
    param($Connection, [string]$Title, [string]$TechnicalUrl)

    $lists = Get-PnPList -Connection $Connection -Includes RootFolder,Hidden,ItemCount
    $matches = @($lists | Where-Object {
        $_.Title -eq $Title -or $_.RootFolder.ServerRelativeUrl -like "*/$TechnicalUrl"
    })

    if ($matches.Count -gt 1) {
        throw "Mais de uma lista encontrada para '$Title' / '$TechnicalUrl'. Abortando para evitar escrita ambigua."
    }

    if ($matches.Count -eq 0) { return $null }
    return $matches[0]
}

function Get-ListIdentity {
    param($List)

    $items = @($List)
    if ($items.Count -ne 1) {
        throw "Lista esperada como objeto unico, recebido $($items.Count) objetos."
    }

    if (-not $items[0].Id) {
        throw "Lista '$($items[0].Title)' nao possui Id disponivel para uso como identidade escalar."
    }

    return $items[0].Id.ToString()
}

function Ensure-AdministrativeList {
    param($Connection, [string]$Title, [string]$TechnicalUrl)

    $list = Get-ListByTitleOrUrl -Connection $Connection -Title $Title -TechnicalUrl $TechnicalUrl
    if ($list) {
        Write-Host "OK lista administrativa existente: $Title [$($list.Id)]"
    }
    else {
        Write-Host "CRIAR lista administrativa: $Title em $TechnicalUrl"
        $list = @(New-PnPList -Connection $Connection -Title $Title -Template GenericList -Url $TechnicalUrl -EnableVersioning)[0]
    }

    $listIdentity = Get-ListIdentity -List $list
    Set-PnPList -Connection $Connection -Identity $listIdentity -EnableVersioning $true -EnableAttachments $false -DisableGridEditing $true | Out-Null
    return @(Get-PnPList -Connection $Connection -Identity $listIdentity -Includes RootFolder,Hidden,ItemCount)[0]
}

function Get-FieldByInternalName {
    param($Connection, $List, [string]$InternalName)

    $listIdentity = Get-ListIdentity -List $List
    $matches = @(Get-PnPField -Connection $Connection -List $listIdentity | Where-Object {
        $_.InternalName -eq $InternalName -or $_.StaticName -eq $InternalName
    })

    if ($matches.Count -gt 1) {
        throw "Mais de um campo encontrado para '$($List.Title).$InternalName'. Abortando para evitar escrita ambigua."
    }

    if ($matches.Count -eq 0) { return $null }
    return $matches[0]
}

function Test-FieldTypeCompatible {
    param($Field, [hashtable]$Plan)

    $expected = $Plan.Type
    $actual = [string]$Field.TypeAsString

    $compatible = switch ($expected) {
        "Text" { $actual -eq "Text" }
        "Note" { $actual -eq "Note" }
        "Choice" { $actual -eq "Choice" }
        "MultiChoice" { $actual -eq "MultiChoice" }
        "Boolean" { $actual -eq "Boolean" }
        "Currency" { $actual -eq "Currency" }
        "DateTime" { $actual -eq "DateTime" }
        "User" { $actual -eq "User" }
        "Lookup" { $actual -eq "Lookup" }
        default { $false }
    }

    return [bool]$compatible
}

function Test-LookupFieldCompatible {
    param($Field, [hashtable]$Plan, [hashtable]$LookupLists)

    if ($Plan.Type -ne "Lookup") { return $true }

    $lookupList = $LookupLists[$Plan.LookupList]
    if (-not $lookupList) {
        throw "Lookup '$($Plan.InternalName)' referencia lista ainda nao resolvida: $($Plan.LookupList)."
    }

    $expectedLookupList = $lookupList.Id.ToString("B").ToLowerInvariant()
    $actualLookupList = ([string]$Field.LookupList).ToLowerInvariant()
    $expectedLookupField = [string]$Plan.LookupField
    $actualLookupField = [string]$Field.LookupField

    return ($actualLookupList -eq $expectedLookupList -and $actualLookupField -eq $expectedLookupField)
}

function New-FieldXml {
    param(
        [hashtable]$Field,
        [hashtable]$LookupLists
    )

    $internalName = ConvertTo-XmlAttributeValue $Field.InternalName
    $displayName = ConvertTo-XmlAttributeValue $Field.DisplayName
    $required = ConvertTo-XmlBool ([bool]$Field.Required)
    $indexed = ConvertTo-XmlBool ([bool]$Field.Indexed)
    $enforceUnique = ConvertTo-XmlBool ([bool]$Field.EnforceUniqueValues)
    $type = $Field.Type

    $attributes = @(
        "Type=`"$type`"",
        "Name=`"$internalName`"",
        "StaticName=`"$internalName`"",
        "DisplayName=`"$displayName`"",
        "Required=`"$required`""
    )

    if ($Field.Indexed) { $attributes += "Indexed=`"$indexed`"" }
    if ($Field.EnforceUniqueValues) { $attributes += "EnforceUniqueValues=`"$enforceUnique`"" }

    if ($type -eq "Currency") {
        $attributes += "LCID=`"$($Field.Lcid)`""
        $attributes += "Decimals=`"$($Field.Decimals)`""
    }
    elseif ($type -eq "DateTime") {
        $attributes += "Format=`"$($Field.Format)`""
    }
    elseif ($type -eq "Note") {
        $attributes += "RichText=`"FALSE`""
        $attributes += "NumLines=`"6`""
    }
    elseif ($type -eq "User") {
        $attributes += "UserSelectionMode=`"PeopleOnly`""
        $attributes += "Mult=`"FALSE`""
    }
    elseif ($type -eq "Lookup") {
        $lookupList = $LookupLists[$Field.LookupList]
        if (-not $lookupList) {
            throw "Lookup '$($Field.InternalName)' referencia lista ainda nao resolvida: $($Field.LookupList)."
        }
        $attributes += "List=`"{$($lookupList.Id)}`""
        $attributes += "ShowField=`"$($Field.LookupField)`""
    }

    $choicesXml = ""
    if ($type -eq "Choice" -or $type -eq "MultiChoice") {
        $choiceLines = @()
        foreach ($choice in $Field.Choices) {
            $choiceLines += "<CHOICE>$(ConvertTo-XmlAttributeValue $choice)</CHOICE>"
        }
        $choicesXml = "<CHOICES>$($choiceLines -join '')</CHOICES>"
    }

    $defaultXml = ""
    if ($null -ne $Field.Default) {
        $defaultValue = $Field.Default
        if ($type -eq "Boolean") {
            if ([bool]$Field.Default) { $defaultValue = "1" } else { $defaultValue = "0" }
        }
        $defaultXml = "<Default>$(ConvertTo-XmlAttributeValue ([string]$defaultValue))</Default>"
    }

    return "<Field $($attributes -join ' ')>$choicesXml$defaultXml</Field>"
}

function Ensure-Field {
    param($Connection, $List, [hashtable]$Field, [hashtable]$LookupLists)

    $listIdentity = Get-ListIdentity -List $List
    if ($Field.InternalName -eq "Title") {
        Write-Host "AJUSTAR campo padrao Title em $($List.Title)"
        Set-PnPField -Connection $Connection -List $listIdentity -Identity "Title" -Values @{ Title = $Field.DisplayName; Required = [bool]$Field.Required } | Out-Null
        return
    }

    $existingField = Get-FieldByInternalName -Connection $Connection -List $List -InternalName $Field.InternalName
    if ($existingField) {
        if (-not (Test-FieldTypeCompatible -Field $existingField -Plan $Field)) {
            throw "Campo existente com tipo incompativel: $($List.Title).$($Field.InternalName). Esperado $($Field.Type), encontrado $($existingField.TypeAsString)."
        }
        if (-not (Test-LookupFieldCompatible -Field $existingField -Plan $Field -LookupLists $LookupLists)) {
            throw "Lookup existente com destino incompativel: $($List.Title).$($Field.InternalName). Esperado $($Field.LookupList) / $($Field.LookupField)."
        }
        Write-Host "OK campo existente: $($List.Title).$($Field.InternalName)"
        return
    }

    $fieldXml = New-FieldXml -Field $Field -LookupLists $LookupLists
    Write-Host "CRIAR campo: $($List.Title).$($Field.InternalName) [$($Field.Type)]"
    Add-PnPFieldFromXml -Connection $Connection -List $listIdentity -FieldXml $fieldXml | Out-Null
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
        [string]$Format = "",
        [int]$Lcid = 0,
        [int]$Decimals = -1,
        [bool]$Indexed = $false,
        [bool]$EnforceUniqueValues = $false
    )

    return @{
        InternalName = $InternalName
        DisplayName = $DisplayName
        Type = $Type
        Required = $Required
        Default = $Default
        Choices = $Choices
        LookupList = $LookupList
        LookupField = $LookupField
        Format = $Format
        Lcid = $Lcid
        Decimals = $Decimals
        Indexed = $Indexed
        EnforceUniqueValues = $EnforceUniqueValues
    }
}

function Get-AdministrativeListPlans {
    $profileChoices = @("Campo / Engenheiro", "Cotações e Contratos", "Compras e Financeiro Operacional", "Planejamento", "Diretoria", "Administrador do Sistema")
    $tipoSolicitacaoChoices = @("Material", "Serviço", "Equipamento", "Ferramenta", "Locação", "Terceiro/Prestador", "EPI", "Documento/Taxa", "Outro")

    return @(
        @{
            Title = "ENAC Usuarios Perfis"
            TechnicalUrl = "Lists/ENACUsuariosPerfis"
            Fields = @(
                New-FieldPlan "Title" "Nome Completo" "Text" $true
                New-FieldPlan "UsuarioInternoId" "ID Interno do Usuário" "Text" $true $null @() "" "" "" 0 -1 $true $true
                New-FieldPlan "ContaMicrosoft365" "Conta Microsoft 365" "User" $true
                New-FieldPlan "EmailCorporativo" "E-mail Corporativo" "Text" $true
                New-FieldPlan "CargoFuncao" "Cargo / Função" "Text"
                New-FieldPlan "PerfilPrincipal" "Perfil Principal" "Choice" $true $null $profileChoices
                New-FieldPlan "PerfisAdicionais" "Perfis Adicionais" "MultiChoice" $false $null $profileChoices
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
                New-FieldPlan "SubstitutoTemporario" "Substituto Temporário" "Lookup" $false $null @() "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "InicioSubstituicao" "Início da Substituição" "DateTime" $false $null @() "" "" "DateOnly"
                New-FieldPlan "FimSubstituicao" "Fim da Substituição" "DateTime" $false $null @() "" "" "DateOnly"
                New-FieldPlan "Observacoes" "Observações" "Note"
            )
        }
        @{
            Title = "ENAC Alcadas"
            TechnicalUrl = "Lists/ENACAlcadas"
            Fields = @(
                New-FieldPlan "Title" "Regra" "Text" $true
                New-FieldPlan "RegraInternaId" "ID Interno da Regra" "Text" $true $null @() "" "" "" 0 -1 $true $true
                New-FieldPlan "Processo" "Processo" "Choice" $true $null @("Compra", "Liberação Bancária", "Medição", "Pagamento", "Outro")
                New-FieldPlan "TipoSolicitacao" "Tipo de Solicitação" "Choice" $false $null $tipoSolicitacaoChoices
                New-FieldPlan "Obra" "Obra" "Lookup" $false $null @() "Lista 01 - Controle de Obras ENAC" "NomedaObra"
                New-FieldPlan "ValorMinimo" "Valor Mínimo" "Currency" $true $null @() "" "" "" 1046 2
                New-FieldPlan "ValorMaximo" "Valor Máximo" "Currency" $false $null @() "" "" "" 1046 2
                New-FieldPlan "Ilimitado" "Sem Limite Máximo" "Boolean" $true $false
                New-FieldPlan "AprovadorPrincipal" "Aprovador Principal" "Lookup" $true $null @() "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "ExigeAprovacaoAdicional" "Exige Aprovação Adicional" "Boolean" $true $false
                New-FieldPlan "AprovadorAdicional" "Aprovador Adicional" "Lookup" $false $null @() "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "VigenciaInicial" "Vigência Inicial" "DateTime" $true $null @() "" "" "DateOnly"
                New-FieldPlan "VigenciaFinal" "Vigência Final" "DateTime" $false $null @() "" "" "DateOnly"
                New-FieldPlan "Ativo" "Regra Ativa" "Boolean" $true $true
                New-FieldPlan "Observacoes" "Observações" "Note"
            )
        }
        @{
            Title = "ENAC Historico Configuracoes"
            TechnicalUrl = "Lists/ENACHistoricoConfiguracoes"
            Fields = @(
                New-FieldPlan "Title" "Resumo do Evento" "Text" $true
                New-FieldPlan "TipoConfiguracao" "Tipo de Configuração" "Choice" $true $null @("Usuário", "Alçada", "Regra Especial", "Parâmetro Geral")
                New-FieldPlan "AcaoRealizada" "Ação Realizada" "Choice" $true $null @("Inclusão", "Edição", "Ativação", "Desativação", "Ajuste Vinculado")
                New-FieldPlan "ItemConfiguracaoId" "ID do Item Configurado" "Text" $true
                New-FieldPlan "ValorAnterior" "Valor Anterior" "Note"
                New-FieldPlan "ValorNovo" "Valor Novo" "Note" $true
                New-FieldPlan "Justificativa" "Justificativa" "Note"
            )
        }
        @{
            Title = "ENAC Snapshots Regras"
            TechnicalUrl = "Lists/ENACSnapshotsRegras"
            Fields = @(
                New-FieldPlan "Title" "Código do Snapshot" "Text" $true
                New-FieldPlan "Solicitacao" "Solicitação" "Lookup" $true $null @() "Lista 02 — Requisições de Compra" "ID"
                New-FieldPlan "RegraAlcadaUtilizada" "Regra de Alçada Utilizada" "Lookup" $true $null @() "ENAC Alcadas" "Title"
                New-FieldPlan "RegraInternaId" "ID Interno da Regra Aplicada" "Text" $true
                New-FieldPlan "ResumoRegraAplicada" "Resumo da Regra Aplicada" "Note" $true
                New-FieldPlan "Processo" "Processo" "Choice" $true $null @("Compra")
                New-FieldPlan "FaixaValorVigente" "Faixa de Valor Vigente" "Text" $true
                New-FieldPlan "ValorAnalisado" "Valor Analisado" "Currency" $true $null @() "" "" "" 1046 2
                New-FieldPlan "AprovadorBaseId" "ID do Aprovador Base" "Text" $true
                New-FieldPlan "AprovadorBaseNome" "Nome do Aprovador Base" "Text" $true
                New-FieldPlan "AprovadorBaseEmail" "E-mail do Aprovador Base" "Text" $true
                New-FieldPlan "AprovadorEfetivoId" "ID do Aprovador Efetivo" "Text" $true
                New-FieldPlan "AprovadorEfetivoNome" "Nome do Aprovador Efetivo" "Text" $true
                New-FieldPlan "AprovadorEfetivoEmail" "E-mail do Aprovador Efetivo" "Text" $true
                New-FieldPlan "SubstituicaoAplicada" "Substituição Aplicada" "Boolean" $true $false
                New-FieldPlan "MotivoResolucaoAprovador" "Motivo da Resolução do Aprovador" "Note"
                New-FieldPlan "MotivoExcecao" "Motivo da Exceção" "Note"
                New-FieldPlan "DataHoraAplicacao" "Data/Hora da Aplicação" "DateTime" $true $null @() "" "" "DateTime"
            )
        }
    )
}

function Invoke-ApplyProvisioning {
    param($Connection, $OperationalLists)

    $lookupLists = @{
        "Lista 01 - Controle de Obras ENAC" = $OperationalLists.Obras
        "Lista 02 — Requisições de Compra" = $OperationalLists.Solicitacoes
    }

    $adminLists = @{}
    foreach ($plan in Get-AdministrativeListPlans) {
        $adminLists[$plan.Title] = Ensure-AdministrativeList -Connection $Connection -Title $plan.Title -TechnicalUrl $plan.TechnicalUrl
        $lookupLists[$plan.Title] = $adminLists[$plan.Title]
    }

    foreach ($plan in Get-AdministrativeListPlans) {
        $list = $adminLists[$plan.Title]
        foreach ($field in $plan.Fields) {
            Ensure-Field -Connection $Connection -List $list -Field $field -LookupLists $lookupLists
        }
    }

    $snapshotField = New-FieldPlan "SnapshotAprovacaoCompra" "Snapshot da Aprovação de Compra" "Lookup" $false $null @() "ENAC Snapshots Regras" "Title"
    Ensure-Field -Connection $Connection -List $OperationalLists.Solicitacoes -Field $snapshotField -LookupLists $lookupLists

    Write-Host "Provisionamento estrutural V2.3A concluido: apenas listas administrativas planejadas e SnapshotAprovacaoCompra foram criados/ajustados."
}

Assert-Prerequisites
Assert-ApplyAllowed

$connection = Connect-PnPProvisioning
$validatedLists = Assert-OperationalLists -Connection $connection

Write-Host "Listas operacionais validadas:"
Write-Host "OK Lista 01 - Controle de Obras ENAC [$($validatedLists.Obras.Id)]"
Write-Host "OK Lista 02 — Requisições de Compra [$($validatedLists.Solicitacoes.Id)]"

if (-not $Apply) {
    Invoke-DryRunPlan
    return
}

Invoke-ApplyProvisioning -Connection $connection -OperationalLists $validatedLists
