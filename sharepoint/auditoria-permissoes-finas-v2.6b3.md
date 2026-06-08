# Auditoria readonly de permissoes finas V2.6B.3

Data local: 2026-06-08 14:26:57
Modo: readonly conectado
Site: 05 - Obras em Andamento
Url: https://enaccombr.sharepoint.com/sites/Equipe.Obras

## Confirmacoes

- O script le apenas estrutura, grupos, listas e papeis.
- O script nao cria grupos.
- O script nao altera permissoes.
- O script nao altera listas, itens ou dados.
- O script nao exporta e-mails de membros.

## Limitacoes da auditoria

- Auditoria de grupos: LIMITADA.
- Motivo: Access denied ou permissao insuficiente ao executar Get-PnPGroup. Detalhe sanitizado: Access is denied. (Exception from HRESULT: 0x80070005 (E_ACCESSDENIED))
- Impacto: nao foi possivel confirmar existencia ou membros dos grupos planejados nesta rodada.
- Acao futura: executar com conta/app com permissao suficiente ou revisar grupos manualmente no SharePoint.

## Definicoes de permissao disponiveis

| Nome | Descricao |
| --- | --- |
| Acesso Limitado | Pode exibir listas, bibliotecas de documentos, itens de lista, pastas ou documentos específicos, se receber permissão. |
| Acesso Limitado Somente à Web | Só pode exibir a web ao obter permissões. |
| Colaboração | Pode exibir, adicionar, atualizar e excluir itens de lista e documentos. |
| Controle Total | Tem controle total. |
| Design | Pode exibir, adicionar, atualizar, excluir, aprovar e personalizar. |
| Editar | Pode adicionar, editar e excluir listas; pode exibir, adicionar, atualizar e excluir itens de lista e documentos. |
| Enviar Arquivos | Pode enviar arquivos para uma pasta. |
| Exibição Restrita | Podem exibir páginas, itens de lista e documentos. Os documentos podem ser exibidos no navegador, mas não podem ser baixados. |
| Leitura | É possível exibir páginas e itens de lista e baixar documentos. |
| System.LimitedEdit |  |
| System.LimitedView |  |

## Grupos ENAC planejados

| Grupo planejado | Status | Membros contabilizados |
| --- | --- | --- |
| ENAC Sistema Admin | NAO_CONFIRMADO | nao auditado |
| ENAC Diretoria | NAO_CONFIRMADO | nao auditado |
| ENAC Planejamento | NAO_CONFIRMADO | nao auditado |
| ENAC Compras Financeiro | NAO_CONFIRMADO | nao auditado |
| ENAC Cotacoes Contratos | NAO_CONFIRMADO | nao auditado |
| ENAC Campo Engenharia | NAO_CONFIRMADO | nao auditado |
| ENAC Leitura Auditoria | NAO_CONFIRMADO | nao auditado |

## Outros grupos SharePoint com ENAC no nome

| Grupo | Membros contabilizados |
| --- | --- |
| Nao auditado por limitacao de permissao | nao auditado |

## Listas administrativas

Auditoria de listas administrativas: prosseguiu independentemente da auditoria de grupos.

| Lista | Status | Id | Itens | Heranca unica | Url | Observacao |
| --- | --- | --- | --- | --- | --- | --- |
| ENAC Usuarios Perfis | EXISTE | 99cb9bae-5589-4f8b-854b-08adce371e82 | 4 | False | /sites/Equipe.Obras/Lists/ENACUsuariosPerfis |  |
| ENAC Alcadas | EXISTE | 901d4458-15b4-427b-a869-161c63cf70ef | 2 | False | /sites/Equipe.Obras/Lists/ENACAlcadas |  |
| ENAC Historico Configuracoes | EXISTE | cac67186-e478-4f15-b5a0-2db92d74b2c4 | 2 | False | /sites/Equipe.Obras/Lists/ENACHistoricoConfiguracoes |  |
| ENAC Snapshots Regras | EXISTE | 767e1867-8a98-46be-9dcc-be53a12c51aa | 2 | False | /sites/Equipe.Obras/Lists/ENACSnapshotsRegras |  |

## Permissoes atuais das listas administrativas

### ENAC Usuarios Perfis

Heranca unica: False

| Principal | Tipo | Papeis |
| --- | --- | --- |
| indisponivel | erro leitura | You are not signed in. Please use Connect-PnPOnline to connect. |

### ENAC Alcadas

Heranca unica: False

| Principal | Tipo | Papeis |
| --- | --- | --- |
| indisponivel | erro leitura | You are not signed in. Please use Connect-PnPOnline to connect. |

### ENAC Historico Configuracoes

Heranca unica: False

| Principal | Tipo | Papeis |
| --- | --- | --- |
| indisponivel | erro leitura | You are not signed in. Please use Connect-PnPOnline to connect. |

### ENAC Snapshots Regras

Heranca unica: False

| Principal | Tipo | Papeis |
| --- | --- | --- |
| indisponivel | erro leitura | You are not signed in. Please use Connect-PnPOnline to connect. |

## Comparacao com plano V2.6B

| Item | Resultado | Observacao |
| --- | --- | --- |
| Grupo ENAC Sistema Admin | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Diretoria | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Planejamento | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Compras Financeiro | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Cotacoes Contratos | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Campo Engenharia | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Grupo ENAC Leitura Auditoria | NAO_CONFIRMADO | Get-PnPGroup limitado por permissao; conferir manualmente |
| Lista ENAC Usuarios Perfis | OK | Necessaria para permissao administrativa fina |
| Lista ENAC Alcadas | OK | Necessaria para permissao administrativa fina |
| Lista ENAC Historico Configuracoes | OK | Necessaria para permissao administrativa fina |
| Lista ENAC Snapshots Regras | OK | Necessaria para permissao administrativa fina |

## Alertas

- Este relatorio deve ser revisado antes de qualquer mudanca real.
- Se aparecer principal individual, confirmar se deve ser substituido por grupo.
- Se uma lista administrativa herdar permissao, avaliar quebra somente em rodada futura autorizada.
- Se a leitura de papeis falhar, repetir com app autorizado apenas para leitura suficiente.
