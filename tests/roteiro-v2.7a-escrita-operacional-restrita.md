# Roteiro V2.7A - Escrita Operacional Restrita

Data: 2026-06-08

## Objetivo

Validar a preparacao de escrita operacional restrita com item `V2.7A-TESTE`, sem Power Automate e sem uso operacional amplo.

## Pre-condicoes

- V2.6B.4D concluida.
- Permissoes administrativas permanecem protegidas.
- Pagina de teste publicada manualmente por Leon, se houver teste no tenant.
- Flags V2.7A desligadas por padrao.
- Para teste controlado, configurar:
  - `habilitarEscritaOperacionalV27A = true`;
  - `modoTesteOperacionalV27A = true`;
  - `permitirSomenteItensTesteV27A = true`;
  - `marcadorTesteOperacionalV27A = V2.7A-TESTE`;
  - `exigirConfirmacaoManualV27A = true`;
  - `confirmacaoManualV27A = CONFIRMAR-ESCRITA-OPERACIONAL-V2.7A-ENAC`.

## Casos de teste

| # | Caso | Resultado esperado |
| --- | --- | --- |
| 1 | Usuario/perfil nao autorizado acessa a webpart | Acoes de escrita nao aparecem ou retornam bloqueio claro. |
| 2 | Escrita com flag desligada | Metodo retorna bloqueio antes de POST/MERGE. |
| 3 | Escrita sem marcador `V2.7A-TESTE` | Metodo retorna bloqueio por marcador ausente. |
| 4 | Matheus executa acao de compra/financeiro em item de teste | Acao permitida somente em status valido e item marcado. |
| 5 | Gustavo tenta aprovar dentro da alcada parametrizada | Regra de `ENAC Alcadas` deve ser usada; sem constante fixa no codigo. |
| 6 | Leon tenta aprovar acima da alcada de Gustavo | Regra aplicavel deve apontar Leon ou bloquear se inexistente. |
| 7 | Kemilly atua em cotacoes/contratos | Permitida apenas a acao compatível com cotacao/atualizacao. |
| 8 | Historico operacional | Registro criado quando a acao de teste for executada. |
| 9 | Snapshot operacional | Snapshot criado somente quando aplicavel e sob marcador de teste. |
| 10 | Status atualizado | Transicao deve obedecer matriz V2.7A. |
| 11 | Transicao invalida | Erro claro `TRANSICAO_NAO_PERMITIDA`. |
| 12 | Listas administrativas | Conferir que V2.6B.4D permanece inalterada. |
| 13 | Power Automate | Nenhum fluxo acionado/criado. |

## Evidencias

Registrar:

- usuario/perfil usado;
- item de teste;
- flags configuradas;
- acao testada;
- resultado da webpart;
- Network indicando chamadas esperadas;
- confirmacao de que nao houve escrita fora de `V2.7A-TESTE`;
- confirmacao de que Power Automate nao foi iniciado.
