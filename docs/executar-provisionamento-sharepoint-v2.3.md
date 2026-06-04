# Executar Provisionamento SharePoint V2.3A

Este documento descreve a preparacao local do provisionamento SharePoint V2.3A.

Nesta rodada, somente o modo dry-run esta autorizado.

## Escopo do dry-run

O script `scripts/sharepoint/02-provisionamento-v2.3-dryrun.ps1` foi criado para:

- conectar em modo leitura;
- conferir a existencia das listas operacionais reais;
- identificar se as listas administrativas planejadas ja existem;
- listar quais listas e campos seriam criados futuramente, com nome interno, nome exibido, tipo, obrigatoriedade, padrao, choices e lookups;
- exibir URLs tecnicas planejadas;
- exibir versionamento, anexos e edicao em grade planejados;
- listar lookups planejados;
- exibir ordem recomendada de provisionamento;
- apontar divergencias basicas;
- nao criar, alterar ou excluir qualquer estrutura.

## Aplicativo de autenticacao

O aplicativo atual `ENAC-PnP-Inventario-SharePoint-Readonly-V2.3A` serve apenas para inventario e dry-run de leitura.

Ele nao deve ser usado para aplicar alteracoes no tenant.

A execucao futura com `-Apply` dependera de:

- aplicativo separado;
- permissao de escrita controlada;
- autorizacao expressa;
- revisao previa do plano gerado pelo dry-run.

Nenhuma execucao com `-Apply` esta autorizada nesta rodada.

## Comando de dry-run

Executar em janela propria do PowerShell 7:

```powershell
cd "C:\Users\leon\OneDrive - enac.com.br\Documentos\Sistema ENAC"

pwsh -File ".\scripts\sharepoint\02-provisionamento-v2.3-dryrun.ps1" `
  -SiteUrl "https://enaccombr.sharepoint.com/sites/Equipe.Obras" `
  -Tenant "enaccombr.onmicrosoft.com" `
  -ClientId "<CLIENT-ID-DO-APLICATIVO-READONLY>" `
  -AuthMode "DeviceLogin"
```

## Estruturas planejadas

Listas administrativas previstas:

| Titulo exibido | URL tecnica planejada |
| --- | --- |
| `ENAC Usuarios Perfis` | `Lists/ENACUsuariosPerfis` |
| `ENAC Alcadas` | `Lists/ENACAlcadas` |
| `ENAC Historico Configuracoes` | `Lists/ENACHistoricoConfiguracoes` |
| `ENAC Snapshots Regras` | `Lists/ENACSnapshotsRegras` |

Campo adicional planejado em lista existente:

- `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`

Lookups planejados:

- `ENAC Alcadas.Obra` -> `Lista 01 - Controle de Obras ENAC` / `NomedaObra`
- `ENAC Alcadas.AprovadorPrincipal` -> `ENAC Usuarios Perfis`
- `ENAC Alcadas.AprovadorAdicional` -> `ENAC Usuarios Perfis`
- `ENAC Usuarios Perfis.SubstitutoTemporario` -> `ENAC Usuarios Perfis`
- `ENAC Snapshots Regras.Solicitacao` -> `Lista 02 — Requisições de Compra`
- `ENAC Snapshots Regras.RegraAlcadaUtilizada` -> `ENAC Alcadas`, se mantido como lookup
- `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra` -> `ENAC Snapshots Regras`

Na rodada inicial, `ENAC Snapshots Regras` nao planeja campos `Cotacao` nem `PedidoCompra`, e tambem nao planeja lookups de aprovador base/efetivo. Os aprovadores ficam congelados em campos texto.

## Configuracoes planejadas

| Lista | Versionamento | Anexos | Edicao em grade |
| --- | --- | --- | --- |
| `ENAC Usuarios Perfis` | Ativo | Desativados | Permitida inicialmente |
| `ENAC Alcadas` | Ativo | Desativados | Permitida inicialmente |
| `ENAC Historico Configuracoes` | Ativo | Desativados | Desativada |
| `ENAC Snapshots Regras` | Ativo | Desativados | Desativada |

Versionamento e bloqueio de edicao em grade reduzem risco operacional. Snapshots e historico somente serao considerados efetivamente protegidos apos definicao/aplicacao de permissoes especificas e uso controlado pelo sistema/automacao.

## Bloqueio do Apply

O parametro `-Apply` existe apenas para desenho futuro da interface operacional do script.

Nesta versao, se `-Apply` for informado, o script interrompe imediatamente com erro e nao executa comandos de criacao, alteracao ou exclusao.

## Referencias

- `sharepoint/mapeamento-listas-reais-v2.3.md`
- `sharepoint/list-schema.json`
- `sharepoint/plano-provisionamento-v2.3.md`
- `sharepoint/matriz-schema-codigo-v2.3.md`
