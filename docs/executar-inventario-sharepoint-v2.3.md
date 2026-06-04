# Executar Inventario SharePoint V2.3A

Este documento orienta a execucao do inventario SharePoint em modo somente leitura para a V2.3A do Sistema ENAC.

## Objetivo

Inventariar listas e colunas existentes no site SharePoint da ENAC, sem criar, alterar ou excluir listas, colunas, permissoes, itens, documentos ou fluxos.

Site alvo:

`https://enaccombr.sharepoint.com/sites/Equipe.Obras`

Lista de obras base conhecida:

`Lista 01 - Controle de Obras ENAC`

GUID observado:

`{BA9AFADC1-F843-45C0-A628-4F49A8716832}`

## Pre-requisitos

Executar localmente:

```powershell
git --version
where.exe git
pwsh --version
Get-Module -ListAvailable PnP.PowerShell
```

Requisitos:

- PowerShell 7.4 ou superior.
- Modulo `PnP.PowerShell` instalado.
- `ClientId` de aplicativo Entra ID ja autorizado para login PnP.
- Dominio tecnico do tenant no formato `tenant.onmicrosoft.com`.
- Usuario com permissao de leitura no site SharePoint.

Se `PnP.PowerShell` nao estiver instalado, o comando sugerido e:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

Nao execute criacao de aplicativo Entra ID ou `Register-PnPEntraIDAppForInteractiveLogin` sem autorizacao expressa.

## ClientId e autenticacao

O parametro `ClientId` deve ser o ID de um aplicativo Entra ID previamente configurado para autenticacao PnP no tenant.

O script nao armazena senha, segredo, certificado ou token em arquivo.

A tentativa anterior com `-Interactive` nao concluiu adequadamente no ambiente de execucao do Codex. Para a V2.3A, a autenticacao recomendada e `DeviceLogin`, executada diretamente pelo usuario em uma janela propria do PowerShell 7.

No modo `DeviceLogin`, o terminal exibira um codigo de dispositivo e a URL de login. O usuario devera concluir o acesso no navegador usando esse codigo. O aplicativo validado para esta rodada permanece limitado a permissao delegada SharePoint `AllSites.Read` (`Ler itens em todos os conjuntos de sites`).

O script nao realiza alteracao no tenant; ele apenas conecta e consulta estrutura de listas e campos.

O inventario nao exporta o nome, e-mail ou identificador do usuario autenticado. A validacao de conexao e feita tecnicamente, sem registrar identidade pessoal nos relatorios.

## Comando de execucao

Executar a partir da raiz do projeto:

```powershell
pwsh -File ".\scripts\sharepoint\01-inventario-readonly-v2.3.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-DO-APLICATIVO-ENTRA-ID>" `
  -AuthMode "DeviceLogin"
```

Para incluir listas ocultas/sistema no inventario:

```powershell
pwsh -File ".\scripts\sharepoint\01-inventario-readonly-v2.3.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-DO-APLICATIVO-ENTRA-ID>" `
  -AuthMode "DeviceLogin" `
  -IncluirListasSistema
```

O modo `Interactive` continua disponivel apenas como alternativa tecnica explicita:

```powershell
pwsh -File ".\scripts\sharepoint\01-inventario-readonly-v2.3.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-DO-APLICATIVO-ENTRA-ID>" `
  -AuthMode "Interactive"
```

## Garantia de somente leitura

O script usa comandos PnP de leitura, principalmente:

- `Connect-PnPOnline`
- `Get-PnPList`
- `Get-PnPField`
- `Get-PnPWeb`, apenas para identificar usuario autenticado quando disponivel

O script nao executa provisionamento e nao chama comandos PnP de criacao, alteracao ou exclusao.

## Arquivos gerados

Apos execucao bem-sucedida, os arquivos abaixo serao criados em `sharepoint/`:

```text
sharepoint/inventario-listas-reais-v2.3.json
sharepoint/inventario-listas-reais-v2.3.md
sharepoint/inventario-listas-reais-v2.3.csv
```

Conteudo esperado:

- JSON completo com listas e campos.
- CSV com uma linha por campo.
- Relatorio Markdown com listas operacionais, campos prioritarios e divergencias para provisionamento futuro.

O CSV e gerado sem o parametro obsoleto `NoTypeInformation`, evitando o warning emitido por versoes recentes do PowerShell.

## Falhas comuns

### Falha de PowerShell

Se a versao for inferior a 7.4, instalar PowerShell atualizado:

```powershell
winget install Microsoft.PowerShell
```

### Modulo PnP ausente

Mensagem esperada:

`Modulo PnP.PowerShell nao encontrado`

Instalar somente com autorizacao:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

### ClientId ausente ou invalido

Mensagem esperada:

`Informe o ClientId de um aplicativo Entra ID apto para login PnP.`

Solicitar ao administrador o ClientId correto antes de tentar novamente.

### Falha de autenticacao

Possiveis causas:

- aplicativo Entra ID sem permissao adequada;
- usuario sem permissao de leitura no site;
- tenant bloqueando o modo de autenticacao usado;
- URL do site incorreta.

Nao criar novo aplicativo Entra ID sem autorizacao expressa.

## Como entregar os resultados

Apos a execucao, enviar para analise:

```text
sharepoint/inventario-listas-reais-v2.3.json
sharepoint/inventario-listas-reais-v2.3.md
sharepoint/inventario-listas-reais-v2.3.csv
```

Esses arquivos serao usados para ajustar o schema V2.3 e preparar a proxima rodada de provisionamento.

## Importante

Nenhum provisionamento deve ocorrer antes da revisao do relatorio de inventario.

A V2.3A nao homologa a V2.3 e nao implementa Power Automate.
