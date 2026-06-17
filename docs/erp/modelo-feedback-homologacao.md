# Modelo de Feedback de Homologacao

## Campos

| Campo | Obrigatorio | Exemplo |
| --- | --- | --- |
| id | Sim | HOM-001 |
| data | Sim | 2026-06-17 |
| perfil | Sim | Financeiro |
| usuario avaliador | Sim | Matheus |
| modulo | Sim | Contas a Pagar |
| tela | Sim | Listagem |
| tipo | Sim | BUG, MELHORIA, DUVIDA, REGRA, UX, DADO, PERFORMANCE, SEGURANCA |
| severidade | Sim | BAIXA, MEDIA, ALTA, CRITICA |
| prioridade | Sim | BAIXA, MEDIA, ALTA, URGENTE |
| descricao | Sim | Texto objetivo do apontamento |
| passo a passo para reproduzir | Sim | 1. Abrir tela; 2. Filtrar; 3. Conferir resultado |
| resultado esperado | Sim | O que deveria ocorrer |
| resultado obtido | Sim | O que ocorreu |
| print/evidencia | Recomendado | Nome do arquivo ou link local de referencia |
| impacto operacional | Sim | Impacto em rotina, decisao, controle ou auditoria |
| decisao | Sim | CORRIGIR, AJUSTAR REGRA, TREINAMENTO, POSTERGAR, DESCARTAR |
| responsavel | Sim | Nome do responsavel pela triagem/correcao |
| versao alvo | Sim | V3.18 |
| status | Sim | ABERTO, EM TRIAGEM, APROVADO PARA V3.18, EM CORRECAO, VALIDADO, CANCELADO |

## Template em tabela

| id | data | perfil | usuario avaliador | modulo | tela | tipo | severidade | prioridade | descricao | passo a passo | esperado | obtido | evidencia | impacto | decisao | responsavel | versao alvo | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HOM-001 |  |  |  |  |  | BUG | MEDIA | ALTA |  |  |  |  |  |  | CORRIGIR |  | V3.18 | ABERTO |

## Tipos

- BUG: comportamento quebrado ou erro tecnico.
- MELHORIA: ajuste incremental sem bloquear uso.
- DUVIDA: ponto que pode exigir treinamento ou alinhamento.
- REGRA: divergencia de regra operacional.
- UX: usabilidade, clareza, responsividade ou texto.
- DADO: massa, valor, codigo ou relacionamento incoerente.
- PERFORMANCE: lentidao ou resposta pesada.
- SEGURANCA: acesso indevido, permissao, auditoria ou exposicao de dados.

## Severidade

- BAIXA: nao bloqueia uso.
- MEDIA: afeta eficiencia ou clareza, com contorno simples.
- ALTA: bloqueia fluxo importante ou gera risco operacional.
- CRITICA: risco financeiro, fiscal, permissao indevida, dado essencial incorreto ou acao proibida.

## Status

- ABERTO: apontamento registrado.
- EM TRIAGEM: sendo classificado.
- APROVADO PARA V3.18: aceito para backlog da proxima etapa.
- EM CORRECAO: correcao em andamento.
- VALIDADO: ajuste conferido.
- CANCELADO: descartado com justificativa.

