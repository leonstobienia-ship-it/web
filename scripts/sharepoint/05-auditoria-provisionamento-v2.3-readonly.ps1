param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://enaccombr.sharepoint.com/sites/Equipe.Obras",

    [Parameter(Mandatory = $true)]
    [string]$Tenant,

    [Parameter(Mandatory = $true)]
    [string]$ClientId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("DeviceLogin", "Interactive")]
    [string]$AuthMode = "DeviceLogin"
)

$ErrorActionPreference = "Stop"

$lista02Id = [Guid]"0a204b87-b9a1-4d16-8654-55567a62ed01"
$outputPath = Join-Path (Resolve-Path ".\sharepoint") "auditoria-provisionamento-v2.3-pos-falha.md"

function Assert-Prerequisites {
    if ($PSVersionTable.PSVersion -lt [version]"7.4") {
        throw "PowerShell 7.4 ou superior e obrigatorio. Versao atual: $($PSVersionTable.PSVersion)."
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $pnpModule) {
        throw "Modulo PnP.PowerShell nao encontrado."
    }
}

function Connect-PnPReadonly {
    if ($AuthMode -eq "DeviceLogin") {
        return Connect-PnPOnline -Url $SiteUrl -DeviceLogin -Tenant $Tenant -ClientId $ClientId -ReturnConnection
    }

    return Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ReturnConnection
}

function Get-ListByTitleOrUrl {
    param($Connection, [string]$Title, [string]$TechnicalUrl)

    $lists = Get-PnPList -Connection $Connection -Includes RootFolder,Hidden,ItemCount,EnableVersioning,EnableAttachments,DisableGridEditing
    $matches = @($lists | Where-Object {
        $_.Title -eq $Title -or $_.RootFolder.ServerRelativeUrl -like "*/$TechnicalUrl"
    })

    if ($matches.Count -gt 1) {
        throw "Mais de uma lista encontrada para '$Title' / '$TechnicalUrl'."
    }

    if ($matches.Count -eq 0) { return $null }
    return $matches[0]
}

function Get-ListByGuid {
    param($Connection, [Guid]$Id)

    $list = @(Get-PnPList -Connection $Connection -Identity $Id -Includes RootFolder,Hidden,ItemCount,EnableVersioning,EnableAttachments,DisableGridEditing -ThrowExceptionIfListNotFound)[0]
    return $list
}

function Get-FieldByInternalName {
    param($Connection, $List, [string]$InternalName)

    if (-not $List) { return $null }
    $listIdentity = $List.Id.ToString()
    $matches = @(Get-PnPField -Connection $Connection -List $listIdentity -Includes TypeAsString,InternalName,StaticName,Title,Required,ReadOnlyField,Hidden,LookupList,LookupField | Where-Object {
        $_.InternalName -eq $InternalName -or $_.StaticName -eq $InternalName
    })

    if ($matches.Count -gt 1) {
        throw "Mais de um campo encontrado para '$($List.Title).$InternalName'."
    }

    if ($matches.Count -eq 0) { return $null }
    return $matches[0]
}

function New-FieldPlan {
    param([string]$InternalName, [string]$DisplayName, [string]$Type, [string]$LookupList = "", [string]$LookupField = "")
    return [pscustomobject]@{
        InternalName = $InternalName
        DisplayName = $DisplayName
        Type = $Type
        LookupList = $LookupList
        LookupField = $LookupField
    }
}

function Get-AdministrativeListPlans {
    return @(
        [pscustomobject]@{
            Title = "ENAC Usuarios Perfis"
            TechnicalUrl = "Lists/ENACUsuariosPerfis"
            ExpectedTitle = "Nome Completo"
            Fields = @(
                New-FieldPlan "UsuarioInternoId" "ID Interno do Usuário" "Text"
                New-FieldPlan "ContaMicrosoft365" "Conta Microsoft 365" "User"
                New-FieldPlan "EmailCorporativo" "E-mail Corporativo" "Text"
                New-FieldPlan "CargoFuncao" "Cargo / Função" "Text"
                New-FieldPlan "PerfilPrincipal" "Perfil Principal" "Choice"
                New-FieldPlan "PerfisAdicionais" "Perfis Adicionais" "MultiChoice"
                New-FieldPlan "PodeCriarSolicitacao" "Pode Criar Solicitação" "Boolean"
                New-FieldPlan "PodeRegistrarCotacoes" "Pode Registrar Cotações" "Boolean"
                New-FieldPlan "PodeAprovarCompras" "Pode Aprovar Compras" "Boolean"
                New-FieldPlan "PodeEmitirPedido" "Pode Emitir Pedido" "Boolean"
                New-FieldPlan "PodeVincularNF" "Pode Vincular NF" "Boolean"
                New-FieldPlan "PodeProgramarPagamento" "Pode Programar Pagamento" "Boolean"
                New-FieldPlan "PodeLiberarPagamento" "Pode Liberar Pagamento" "Boolean"
                New-FieldPlan "PodeAtualizarStatusFinal" "Pode Atualizar Status Final" "Boolean"
                New-FieldPlan "PodeAdministrarConfiguracoes" "Pode Administrar Configurações" "Boolean"
                New-FieldPlan "UsuarioAtivo" "Usuário Ativo" "Boolean"
                New-FieldPlan "SubstitutoTemporario" "Substituto Temporário" "Lookup" "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "InicioSubstituicao" "Início da Substituição" "DateTime"
                New-FieldPlan "FimSubstituicao" "Fim da Substituição" "DateTime"
                New-FieldPlan "Observacoes" "Observações" "Note"
            )
        }
        [pscustomobject]@{
            Title = "ENAC Alcadas"
            TechnicalUrl = "Lists/ENACAlcadas"
            ExpectedTitle = "Regra"
            Fields = @(
                New-FieldPlan "RegraInternaId" "ID Interno da Regra" "Text"
                New-FieldPlan "Processo" "Processo" "Choice"
                New-FieldPlan "TipoSolicitacao" "Tipo de Solicitação" "Choice"
                New-FieldPlan "Obra" "Obra" "Lookup" "Lista 01 - Controle de Obras ENAC" "NomedaObra"
                New-FieldPlan "ValorMinimo" "Valor Mínimo" "Currency"
                New-FieldPlan "ValorMaximo" "Valor Máximo" "Currency"
                New-FieldPlan "Ilimitado" "Sem Limite Máximo" "Boolean"
                New-FieldPlan "AprovadorPrincipal" "Aprovador Principal" "Lookup" "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "ExigeAprovacaoAdicional" "Exige Aprovação Adicional" "Boolean"
                New-FieldPlan "AprovadorAdicional" "Aprovador Adicional" "Lookup" "ENAC Usuarios Perfis" "Title"
                New-FieldPlan "VigenciaInicial" "Vigência Inicial" "DateTime"
                New-FieldPlan "VigenciaFinal" "Vigência Final" "DateTime"
                New-FieldPlan "Ativo" "Regra Ativa" "Boolean"
                New-FieldPlan "Observacoes" "Observações" "Note"
            )
        }
        [pscustomobject]@{
            Title = "ENAC Historico Configuracoes"
            TechnicalUrl = "Lists/ENACHistoricoConfiguracoes"
            ExpectedTitle = "Resumo do Evento"
            Fields = @(
                New-FieldPlan "TipoConfiguracao" "Tipo de Configuração" "Choice"
                New-FieldPlan "AcaoRealizada" "Ação Realizada" "Choice"
                New-FieldPlan "ItemConfiguracaoId" "ID do Item Configurado" "Text"
                New-FieldPlan "ValorAnterior" "Valor Anterior" "Note"
                New-FieldPlan "ValorNovo" "Valor Novo" "Note"
                New-FieldPlan "Justificativa" "Justificativa" "Note"
            )
        }
        [pscustomobject]@{
            Title = "ENAC Snapshots Regras"
            TechnicalUrl = "Lists/ENACSnapshotsRegras"
            ExpectedTitle = "Código do Snapshot"
            Fields = @(
                New-FieldPlan "Solicitacao" "Solicitação" "Lookup" "Lista 02 — Requisições de Compra" "ID"
                New-FieldPlan "RegraAlcadaUtilizada" "Regra de Alçada Utilizada" "Lookup" "ENAC Alcadas" "Title"
                New-FieldPlan "RegraInternaId" "ID Interno da Regra Aplicada" "Text"
                New-FieldPlan "ResumoRegraAplicada" "Resumo da Regra Aplicada" "Note"
                New-FieldPlan "Processo" "Processo" "Choice"
                New-FieldPlan "FaixaValorVigente" "Faixa de Valor Vigente" "Text"
                New-FieldPlan "ValorAnalisado" "Valor Analisado" "Currency"
                New-FieldPlan "AprovadorBaseId" "ID do Aprovador Base" "Text"
                New-FieldPlan "AprovadorBaseNome" "Nome do Aprovador Base" "Text"
                New-FieldPlan "AprovadorBaseEmail" "E-mail do Aprovador Base" "Text"
                New-FieldPlan "AprovadorEfetivoId" "ID do Aprovador Efetivo" "Text"
                New-FieldPlan "AprovadorEfetivoNome" "Nome do Aprovador Efetivo" "Text"
                New-FieldPlan "AprovadorEfetivoEmail" "E-mail do Aprovador Efetivo" "Text"
                New-FieldPlan "SubstituicaoAplicada" "Substituição Aplicada" "Boolean"
                New-FieldPlan "MotivoResolucaoAprovador" "Motivo da Resolução do Aprovador" "Note"
                New-FieldPlan "MotivoExcecao" "Motivo da Exceção" "Note"
                New-FieldPlan "DataHoraAplicacao" "Data/Hora da Aplicação" "DateTime"
            )
        }
    )
}

function Test-TypeCompatible {
    param($Field, [string]$ExpectedType)

    if (-not $Field) { return $false }
    return ([string]$Field.TypeAsString) -eq $ExpectedType
}

function Add-Line {
    param([System.Collections.Generic.List[string]]$Lines, [string]$Text)
    $Lines.Add($Text) | Out-Null
}

Assert-Prerequisites
$connection = Connect-PnPReadonly
$lines = [System.Collections.Generic.List[string]]::new()

Add-Line $lines "# Auditoria de provisionamento V2.3 pós-falha"
Add-Line $lines ""
Add-Line $lines "- Site: $SiteUrl"
Add-Line $lines "- Modo: readonly"
Add-Line $lines "- Observacao: sem exportacao de itens, documentos, anexos, solicitantes ou valores operacionais."
Add-Line $lines ""

Write-Host "Auditoria readonly V2.3 pós-falha"
Write-Host "Site: $SiteUrl"

foreach ($plan in Get-AdministrativeListPlans) {
    $list = Get-ListByTitleOrUrl -Connection $connection -Title $plan.Title -TechnicalUrl $plan.TechnicalUrl
    Add-Line $lines "## $($plan.Title)"

    if (-not $list) {
        Write-Host "AUSENTE $($plan.Title)" -ForegroundColor Yellow
        Add-Line $lines "- Status: AUSENTE"
        Add-Line $lines ""
        continue
    }

    Write-Host "OK lista $($plan.Title) [$($list.Id)]"
    Add-Line $lines "- Status: ENCONTRADA"
    Add-Line $lines "- GUID: $($list.Id)"
    Add-Line $lines "- URL: $($list.RootFolder.ServerRelativeUrl)"
    Add-Line $lines "- Versionamento: $($list.EnableVersioning)"
    Add-Line $lines "- Anexos: $($list.EnableAttachments)"
    Add-Line $lines "- Edicao em grade desativada: $($list.DisableGridEditing)"

    $titleField = Get-FieldByInternalName -Connection $connection -List $list -InternalName "Title"
    Add-Line $lines "- Campo Title: $($titleField.Title); esperado $($plan.ExpectedTitle)"
    Add-Line $lines ""
    Add-Line $lines "| Campo | Esperado | Status | Detalhe |"
    Add-Line $lines "| --- | --- | --- | --- |"

    foreach ($fieldPlan in $plan.Fields) {
        $field = Get-FieldByInternalName -Connection $connection -List $list -InternalName $fieldPlan.InternalName
        if (-not $field) {
            Add-Line $lines "| $($fieldPlan.InternalName) | $($fieldPlan.Type) | AUSENTE |  |"
            continue
        }

        $status = "OK"
        if (-not (Test-TypeCompatible -Field $field -ExpectedType $fieldPlan.Type)) {
            $status = "TIPO DIVERGENTE"
        }

        $detail = "Tipo atual: $($field.TypeAsString)"
        if ($fieldPlan.Type -eq "Lookup") {
            $detail = "$detail; LookupList=$($field.LookupList); LookupField=$($field.LookupField)"
        }

        Add-Line $lines "| $($fieldPlan.InternalName) | $($fieldPlan.Type) | $status | $detail |"
    }
    Add-Line $lines ""
}

Add-Line $lines "## Lista 02 — Requisições de Compra"
$lista02 = Get-ListByGuid -Connection $connection -Id $lista02Id
Write-Host "OK Lista 02 validada por GUID [$($lista02.Id)]"
Add-Line $lines "- Status: ENCONTRADA"
Add-Line $lines "- GUID: $($lista02.Id)"
Add-Line $lines "- URL: $($lista02.RootFolder.ServerRelativeUrl)"
$snapshotField = Get-FieldByInternalName -Connection $connection -List $lista02 -InternalName "SnapshotAprovacaoCompra"
if ($snapshotField) {
    Add-Line $lines "- SnapshotAprovacaoCompra: ENCONTRADO"
    Add-Line $lines "- Tipo: $($snapshotField.TypeAsString)"
    Add-Line $lines "- LookupList: $($snapshotField.LookupList)"
    Add-Line $lines "- LookupField: $($snapshotField.LookupField)"
    Write-Host "OK SnapshotAprovacaoCompra encontrado [$($snapshotField.TypeAsString)]"
}
else {
    Add-Line $lines "- SnapshotAprovacaoCompra: AUSENTE"
    Write-Host "AUSENTE SnapshotAprovacaoCompra" -ForegroundColor Yellow
}

$lines | Set-Content -LiteralPath $outputPath -Encoding UTF8
Write-Host "Relatorio estrutural gerado: $outputPath"
