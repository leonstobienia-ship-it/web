# Auditoria de provisionamento V2.3 pós-falha

- Site: https://enaccombr.sharepoint.com/sites/Equipe.Obras
- Modo: readonly
- Observacao: sem exportacao de itens, documentos, anexos, solicitantes ou valores operacionais.

## ENAC Usuarios Perfis
- Status: ENCONTRADA
- GUID: 99cb9bae-5589-4f8b-854b-08adce371e82
- URL: /sites/Equipe.Obras/Lists/ENACUsuariosPerfis
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Título; esperado Nome Completo

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| UsuarioInternoId | Text | AUSENTE |  |
| ContaMicrosoft365 | User | AUSENTE |  |
| EmailCorporativo | Text | AUSENTE |  |
| CargoFuncao | Text | AUSENTE |  |
| PerfilPrincipal | Choice | AUSENTE |  |
| PerfisAdicionais | MultiChoice | AUSENTE |  |
| PodeCriarSolicitacao | Boolean | AUSENTE |  |
| PodeRegistrarCotacoes | Boolean | AUSENTE |  |
| PodeAprovarCompras | Boolean | AUSENTE |  |
| PodeEmitirPedido | Boolean | AUSENTE |  |
| PodeVincularNF | Boolean | AUSENTE |  |
| PodeProgramarPagamento | Boolean | AUSENTE |  |
| PodeLiberarPagamento | Boolean | AUSENTE |  |
| PodeAtualizarStatusFinal | Boolean | AUSENTE |  |
| PodeAdministrarConfiguracoes | Boolean | AUSENTE |  |
| UsuarioAtivo | Boolean | AUSENTE |  |
| SubstitutoTemporario | Lookup | AUSENTE |  |
| InicioSubstituicao | DateTime | AUSENTE |  |
| FimSubstituicao | DateTime | AUSENTE |  |
| Observacoes | Note | AUSENTE |  |

## ENAC Alcadas
- Status: ENCONTRADA
- GUID: 901d4458-15b4-427b-a869-161c63cf70ef
- URL: /sites/Equipe.Obras/Lists/ENACAlcadas
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Título; esperado Regra

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| RegraInternaId | Text | AUSENTE |  |
| Processo | Choice | AUSENTE |  |
| TipoSolicitacao | Choice | AUSENTE |  |
| Obra | Lookup | AUSENTE |  |
| ValorMinimo | Currency | AUSENTE |  |
| ValorMaximo | Currency | AUSENTE |  |
| Ilimitado | Boolean | AUSENTE |  |
| AprovadorPrincipal | Lookup | AUSENTE |  |
| ExigeAprovacaoAdicional | Boolean | AUSENTE |  |
| AprovadorAdicional | Lookup | AUSENTE |  |
| VigenciaInicial | DateTime | AUSENTE |  |
| VigenciaFinal | DateTime | AUSENTE |  |
| Ativo | Boolean | AUSENTE |  |
| Observacoes | Note | AUSENTE |  |

## ENAC Historico Configuracoes
- Status: ENCONTRADA
- GUID: cac67186-e478-4f15-b5a0-2db92d74b2c4
- URL: /sites/Equipe.Obras/Lists/ENACHistoricoConfiguracoes
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Título; esperado Resumo do Evento

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| TipoConfiguracao | Choice | AUSENTE |  |
| AcaoRealizada | Choice | AUSENTE |  |
| ItemConfiguracaoId | Text | AUSENTE |  |
| ValorAnterior | Note | AUSENTE |  |
| ValorNovo | Note | AUSENTE |  |
| Justificativa | Note | AUSENTE |  |

## ENAC Snapshots Regras
- Status: ENCONTRADA
- GUID: 767e1867-8a98-46be-9dcc-be53a12c51aa
- URL: /sites/Equipe.Obras/Lists/ENACSnapshotsRegras
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Título; esperado Código do Snapshot

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| Solicitacao | Lookup | AUSENTE |  |
| RegraAlcadaUtilizada | Lookup | AUSENTE |  |
| RegraInternaId | Text | AUSENTE |  |
| ResumoRegraAplicada | Note | AUSENTE |  |
| Processo | Choice | AUSENTE |  |
| FaixaValorVigente | Text | AUSENTE |  |
| ValorAnalisado | Currency | AUSENTE |  |
| AprovadorBaseId | Text | AUSENTE |  |
| AprovadorBaseNome | Text | AUSENTE |  |
| AprovadorBaseEmail | Text | AUSENTE |  |
| AprovadorEfetivoId | Text | AUSENTE |  |
| AprovadorEfetivoNome | Text | AUSENTE |  |
| AprovadorEfetivoEmail | Text | AUSENTE |  |
| SubstituicaoAplicada | Boolean | AUSENTE |  |
| MotivoResolucaoAprovador | Note | AUSENTE |  |
| MotivoExcecao | Note | AUSENTE |  |
| DataHoraAplicacao | DateTime | AUSENTE |  |

## Lista 02 — Requisições de Compra
- Status: ENCONTRADA
- GUID: 0a204b87-b9a1-4d16-8654-55567a62ed01
- URL: /sites/Equipe.Obras/Lists/02  Requisies de Compra
- SnapshotAprovacaoCompra: AUSENTE
