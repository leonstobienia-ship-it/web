# Roteiro V2.8B - Homologacao Assistida Com Equipe

Data: 2026-06-09

## Objetivo

Executar, manualmente por Leon e equipe, uma homologacao assistida do fluxo completo em ambiente controlado.

Codex nao executa este roteiro, nao conecta ao SharePoint, nao publica pacote, nao altera tenant e nao inicia Power Automate.

## Marcador Obrigatorio

`V2.8B-HOMOLOGACAO`

## Preparacao

1. Confirmar pagina restrita.
2. Confirmar pacote publicado manualmente.
3. Confirmar flags desligadas inicialmente.
4. Definir usuarios e papeis.
5. Abrir DevTools.
6. Limpar Network.
7. Confirmar que Power Automate esta fora do teste.

## Etapa 1 - Solicitacao

- Criar ou selecionar solicitacao controlada.
- Confirmar obra teste.
- Confirmar centro de custo teste.
- Confirmar descricao com `V2.8B-HOMOLOGACAO`.
- Capturar pre-validacao, execucao, ID e historico.

## Etapa 2 - Snapshot E Aprovacao

- Criar snapshot.
- Conferir regra e aprovadores.
- Aprovar por alcada prevista ou Diretoria/alcada superior.
- Conferir snapshot preservado.
- Capturar historico.

## Etapa 3 - Pedido

- Criar pedido.
- Conferir fornecedor teste.
- Conferir valor, obra e centro de custo.
- Conferir vinculo textual com requisicao.
- Capturar item criado e historico.

## Etapa 4 - Nota Fiscal

- Criar NF de teste.
- Conferir numero da NF.
- Conferir vinculo textual com pedido.
- Conferir valor e vencimento.
- Conferir status `Recebida`.
- Conferir `Enviada para contabilidade? = não`.
- Capturar item criado e historico.

## Etapa 5 - Programacao Financeira

- Criar programacao financeira.
- Conferir vinculo textual com NF.
- Conferir status `Programado`.
- Conferir forma `Pix`.
- Conferir conta `Itaú ENAC`.
- Confirmar que nao ha pagamento efetivo.
- Confirmar que data do pagamento esta vazia.
- Confirmar que nao ha comprovante real.
- Capturar item criado e historico.

## Etapa 6 - Auditoria E Fechamento

- Conferir historico ponta a ponta.
- Conferir duplicidade.
- Conferir ausencia de item sem marcador afetado.
- Conferir Network sem chamada inesperada.
- Desligar flags.
- Republicar pagina.
- Registrar aprovado/reprovado.

## Criterios De Parada

Parar se ocorrer qualquer bloqueio listado em `docs/v2.8b-plano-parada-e-contingencia.md`.
