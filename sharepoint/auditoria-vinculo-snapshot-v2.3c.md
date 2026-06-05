# Auditoria vínculo snapshot V2.3C

Marcador: V2.3B-TESTE
Requisicao de teste: 7
Snapshot esperado: SNAP-V2.3B-TESTE-001
Regra esperada: alc-v23b-teste-compra-ate-20000
Valor esperado: 6720.00

| Verificacao | Status | Detalhe |
| --- | --- | --- |
| Lista 02 validada por GUID | OK | 0a204b87-b9a1-4d16-8654-55567a62ed01 |
| ENAC Snapshots Regras validada por GUID | OK | 767e1867-8a98-46be-9dcc-be53a12c51aa |
| ENAC Alcadas validada por GUID | OK | 901d4458-15b4-427b-a869-161c63cf70ef |
| Requisicao encontrada | OK | ItemId=7 |
| SnapshotAprovacaoCompra preenchido | OK | LookupId=1; LookupValue=SNAP-V2.3B-TESTE-001 |
| SnapshotAprovacaoCompra aponta para snapshot esperado | OK | Title=SNAP-V2.3B-TESTE-001 |
| Snapshot aponta para a mesma requisicao | OK | Solicitacao.LookupId=7 |
| Snapshot usa regra interna esperada | OK | RegraInternaId=alc-v23b-teste-compra-ate-20000 |
| Valor analisado esperado | OK | ValorAnalisado=6720.00 |
| Aprovador base esperado | OK | AprovadorBaseId=usr-gustavo |
| Aprovador efetivo esperado | OK | AprovadorEfetivoId=usr-gustavo |
| Regra de alcada encontrada | OK | LookupId=1 |
| Regra de alcada com codigo esperado | OK | RegraInternaId=alc-v23b-teste-compra-ate-20000 |
| Regra de alcada com titulo esperado | OK | Title=V2.3B-TESTE-COMPRA-ATE-20000 |

Resultado: OK
