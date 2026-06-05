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
- Campo Title: Nome Completo; esperado Nome Completo

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| UsuarioInternoId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| ContaMicrosoft365 | User | OK | Tipo atual: User; SchemaType=User; Required=TRUE |
| EmailCorporativo | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| CargoFuncao | Text | OK | Tipo atual: Text; SchemaType=Text; Required=FALSE |
| PerfilPrincipal | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=TRUE |
| PerfisAdicionais | MultiChoice | OK | Tipo atual: MultiChoice; SchemaType=MultiChoice; Required=FALSE |
| PodeCriarSolicitacao | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeRegistrarCotacoes | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeAprovarCompras | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeEmitirPedido | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeVincularNF | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeProgramarPagamento | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeLiberarPagamento | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeAtualizarStatusFinal | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| PodeAdministrarConfiguracoes | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| UsuarioAtivo | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| SubstitutoTemporario | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=FALSE; LookupList={99cb9bae-5589-4f8b-854b-08adce371e82}; ShowField=Title; RelationshipDeleteBehavior=; SchemaParse=OK |
| InicioSubstituicao | DateTime | OK | Tipo atual: DateTime; SchemaType=DateTime; Required=FALSE |
| FimSubstituicao | DateTime | OK | Tipo atual: DateTime; SchemaType=DateTime; Required=FALSE |
| Observacoes | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |

## ENAC Alcadas
- Status: ENCONTRADA
- GUID: 901d4458-15b4-427b-a869-161c63cf70ef
- URL: /sites/Equipe.Obras/Lists/ENACAlcadas
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Regra; esperado Regra

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| RegraInternaId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| Processo | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=TRUE |
| TipoSolicitacao | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=FALSE |
| Obra | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=FALSE; LookupList={a9afadc1-f843-45c0-a628-4f49a8716832}; ShowField=NomedaObra; RelationshipDeleteBehavior=; SchemaParse=OK |
| ValorMinimo | Currency | OK | Tipo atual: Currency; SchemaType=Currency; Required=TRUE |
| ValorMaximo | Currency | OK | Tipo atual: Currency; SchemaType=Currency; Required=FALSE |
| Ilimitado | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| AprovadorPrincipal | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=TRUE; LookupList={99cb9bae-5589-4f8b-854b-08adce371e82}; ShowField=Title; RelationshipDeleteBehavior=; SchemaParse=OK |
| ExigeAprovacaoAdicional | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| AprovadorAdicional | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=FALSE; LookupList={99cb9bae-5589-4f8b-854b-08adce371e82}; ShowField=Title; RelationshipDeleteBehavior=; SchemaParse=OK |
| VigenciaInicial | DateTime | OK | Tipo atual: DateTime; SchemaType=DateTime; Required=TRUE |
| VigenciaFinal | DateTime | OK | Tipo atual: DateTime; SchemaType=DateTime; Required=FALSE |
| Ativo | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| Observacoes | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |

## ENAC Historico Configuracoes
- Status: ENCONTRADA
- GUID: cac67186-e478-4f15-b5a0-2db92d74b2c4
- URL: /sites/Equipe.Obras/Lists/ENACHistoricoConfiguracoes
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Resumo do Evento; esperado Resumo do Evento

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| TipoConfiguracao | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=TRUE |
| AcaoRealizada | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=TRUE |
| ItemConfiguracaoId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| ValorAnterior | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |
| ValorNovo | Note | OK | Tipo atual: Note; SchemaType=Note; Required=TRUE |
| Justificativa | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |

## ENAC Snapshots Regras
- Status: ENCONTRADA
- GUID: 767e1867-8a98-46be-9dcc-be53a12c51aa
- URL: /sites/Equipe.Obras/Lists/ENACSnapshotsRegras
- Versionamento: True
- Anexos: False
- Edicao em grade desativada: True
- Campo Title: Código do Snapshot; esperado Código do Snapshot

| Campo | Esperado | Status | Detalhe |
| --- | --- | --- | --- |
| Solicitacao | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=TRUE; LookupList={0a204b87-b9a1-4d16-8654-55567a62ed01}; ShowField=ID; RelationshipDeleteBehavior=; SchemaParse=OK |
| RegraAlcadaUtilizada | Lookup | OK | Tipo atual: Lookup; SchemaType=Lookup; Required=TRUE; LookupList={901d4458-15b4-427b-a869-161c63cf70ef}; ShowField=Title; RelationshipDeleteBehavior=; SchemaParse=OK |
| RegraInternaId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| ResumoRegraAplicada | Note | OK | Tipo atual: Note; SchemaType=Note; Required=TRUE |
| Processo | Choice | OK | Tipo atual: Choice; SchemaType=Choice; Required=TRUE |
| FaixaValorVigente | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| ValorAnalisado | Currency | OK | Tipo atual: Currency; SchemaType=Currency; Required=TRUE |
| AprovadorBaseId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| AprovadorBaseNome | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| AprovadorBaseEmail | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| AprovadorEfetivoId | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| AprovadorEfetivoNome | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| AprovadorEfetivoEmail | Text | OK | Tipo atual: Text; SchemaType=Text; Required=TRUE |
| SubstituicaoAplicada | Boolean | OK | Tipo atual: Boolean; SchemaType=Boolean; Required=TRUE |
| MotivoResolucaoAprovador | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |
| MotivoExcecao | Note | OK | Tipo atual: Note; SchemaType=Note; Required=FALSE |
| DataHoraAplicacao | DateTime | OK | Tipo atual: DateTime; SchemaType=DateTime; Required=TRUE |

## Lista 02 — Requisições de Compra
- Status: ENCONTRADA
- GUID: 0a204b87-b9a1-4d16-8654-55567a62ed01
- URL: /sites/Equipe.Obras/Lists/02  Requisies de Compra
- SnapshotAprovacaoCompra: ENCONTRADO
- Tipo: Lookup
- LookupList: {767e1867-8a98-46be-9dcc-be53a12c51aa}
- ShowField: Title
- SchemaParse: OK
