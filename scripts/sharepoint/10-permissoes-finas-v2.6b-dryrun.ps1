param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "",

    [Parameter(Mandatory = $false)]
    [string]$Tenant = "",

    [Parameter(Mandatory = $false)]
    [string]$Ambiente = "local"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$matrizPath = Join-Path $repoRoot "docs\v2.6b-matriz-permissoes-finas.md"
$planoPath = Join-Path $repoRoot "sharepoint\plano-permissoes-finas-v2.6b.md"

function Test-RequiredFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Arquivo obrigatorio nao encontrado: $Path"
    }
}

function Write-Section {
    param([string]$Title)

    Write-Host ""
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("-" * $Title.Length)
}

Test-RequiredFile -Path $matrizPath
Test-RequiredFile -Path $planoPath

$null = Get-Content -Raw $matrizPath
$null = Get-Content -Raw $planoPath

$groups = @(
    [pscustomobject]@{ Nome = "ENAC Sistema Admin"; Perfil = "Administrador do Sistema"; Uso = "Administracao tecnica, parametros, usuarios, alcadas e auditoria" },
    [pscustomobject]@{ Nome = "ENAC Diretoria"; Perfil = "Diretoria"; Uso = "Aprovacoes, excecoes, liberacao bancaria e leitura executiva" },
    [pscustomobject]@{ Nome = "ENAC Planejamento"; Perfil = "Planejamento"; Uso = "Leitura tecnica, validacoes e aprovacoes quando houver alcada" },
    [pscustomobject]@{ Nome = "ENAC Compras Financeiro"; Perfil = "Compras/Financeiro"; Uso = "Pedidos, notas fiscais, programacao financeira e operacao do processo" },
    [pscustomobject]@{ Nome = "ENAC Cotacoes Contratos"; Perfil = "Cotacoes e Contratos"; Uso = "Cotacoes, comparativos e apoio contratual" },
    [pscustomobject]@{ Nome = "ENAC Campo Engenharia"; Perfil = "Campo / Engenheiro"; Uso = "Criacao e acompanhamento de solicitacoes proprias" },
    [pscustomobject]@{ Nome = "ENAC Leitura Auditoria"; Perfil = "Auditoria"; Uso = "Leitura historica controlada" }
)

$permissions = @(
    [pscustomobject]@{ Lista = "ENAC Usuarios Perfis"; Grupos = "ENAC Sistema Admin"; Permissao = "Administrar"; Observacao = "Lista administrativa sensivel" },
    [pscustomobject]@{ Lista = "ENAC Alcadas"; Grupos = "ENAC Sistema Admin; ENAC Diretoria; ENAC Planejamento"; Permissao = "Administrar para sistema; leitura para diretoria/planejamento"; Observacao = "Altera aprovacoes futuras" },
    [pscustomobject]@{ Lista = "ENAC Historico Configuracoes"; Grupos = "ENAC Sistema Admin; ENAC Diretoria; ENAC Leitura Auditoria"; Permissao = "Leitura/auditoria; inclusao controlada futura"; Observacao = "Sem edicao comum" },
    [pscustomobject]@{ Lista = "ENAC Snapshots Regras"; Grupos = "ENAC Sistema Admin; ENAC Diretoria; ENAC Planejamento; ENAC Compras Financeiro; ENAC Leitura Auditoria"; Permissao = "Leitura conforme processo; escrita somente por mecanismo controlado futuro"; Observacao = "Registros historicos imutaveis" },
    [pscustomobject]@{ Lista = "Lista 01 - Controle de Obras ENAC"; Grupos = "Perfis operacionais autorizados"; Permissao = "Leitura operacional; edicao por responsaveis definidos"; Observacao = "Validar responsaveis antes de qualquer restricao" },
    [pscustomobject]@{ Lista = "Lista 02 - Requisicoes de Compra"; Grupos = "Campo; Compras; Planejamento; Diretoria; Sistema Admin"; Permissao = "Campo cria/proprio; compras opera; diretoria decide; admin le tecnicamente"; Observacao = "Nao alterar permissao real nesta rodada" },
    [pscustomobject]@{ Lista = "Lista 03 - Pedidos de Compra"; Grupos = "ENAC Compras Financeiro; ENAC Diretoria"; Permissao = "Compras edita; diretoria le"; Observacao = "Ajustar depois do teste operacional" },
    [pscustomobject]@{ Lista = "Lista 04 - Notas Fiscais Recebidas"; Grupos = "ENAC Compras Financeiro; ENAC Diretoria"; Permissao = "Compras edita; diretoria le"; Observacao = "Pode conter dados sensiveis" },
    [pscustomobject]@{ Lista = "05 - Contas a Pagar"; Grupos = "ENAC Compras Financeiro; ENAC Diretoria"; Permissao = "Financeiro opera; diretoria libera/consulta"; Observacao = "Restringir campo/cotacoes" },
    [pscustomobject]@{ Lista = "Lista 10 - Contas a Pagar / Programacao Financeira"; Grupos = "ENAC Compras Financeiro; ENAC Diretoria"; Permissao = "Financeiro programa; diretoria libera"; Observacao = "Validar antes de restringir" }
)

$risks = @(
    "Controle da webpart nao substitui permissao real do SharePoint.",
    "Restricao em lista operacional pode afetar formularios, consultas REST e validacoes manuais existentes.",
    "Permissao por item deve ser avaliada com cuidado por impacto em desempenho e visibilidade.",
    "Automacoes futuras poderao exigir conta de servico ou modelo de permissao proprio.",
    "Antes de qualquer mudanca real, registrar heranca e permissoes atuais para retorno controlado."
)

Write-Host "DRY-RUN V2.6B.1 — nenhuma permissao sera aplicada." -ForegroundColor Green
Write-Host "Nenhuma conexao SharePoint sera executada por este script."
Write-Host "Ambiente informado: $Ambiente"
if ($SiteUrl) { Write-Host "SiteUrl informada apenas como contexto: $SiteUrl" }
if ($Tenant) { Write-Host "Tenant informado apenas como contexto: $Tenant" }
Write-Host "Matriz local lida: $matrizPath"
Write-Host "Plano local lido: $planoPath"

Write-Section "Grupos sugeridos"
foreach ($group in $groups) {
    Write-Host "- Grupo: $($group.Nome)"
    Write-Host "  Perfil: $($group.Perfil)"
    Write-Host "  Uso: $($group.Uso)"
}

Write-Section "Listas afetadas e permissoes pretendidas"
foreach ($entry in $permissions) {
    Write-Host "- Lista: $($entry.Lista)"
    Write-Host "  Grupos: $($entry.Grupos)"
    Write-Host "  Permissao pretendida: $($entry.Permissao)"
    Write-Host "  Observacao: $($entry.Observacao)"
}

Write-Section "Bloqueios de seguranca desta rodada"
Write-Host "Nao conecta ao SharePoint."
Write-Host "Nao cria grupos."
Write-Host "Nao altera heranca."
Write-Host "Nao muda permissoes."
Write-Host "Nao adiciona ou remove usuarios."
Write-Host "Nao altera listas, itens ou dados."
Write-Host "Nao publica pacote."
Write-Host "Nao inicia Power Automate."

Write-Section "Riscos"
foreach ($risk in $risks) {
    Write-Host "- $risk"
}

Write-Section "Proximos passos para rodada futura"
Write-Host "1. Leon revisa grupos, listas e permissoes pretendidas."
Write-Host "2. Registrar autorizacao textual antes de criar qualquer script operacional."
Write-Host "3. Preparar script separado, com protecoes proprias, para nova revisao."
Write-Host "4. Executar primeiro em ambiente/pagina controlada e com registro previo das permissoes atuais."

Write-Host ""
Write-Host "Encerramento: dry-run concluido. Nenhuma aplicacao real foi executada." -ForegroundColor Green
