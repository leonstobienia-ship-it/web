# Roteiro V2.6A - Validacao escrita controlada de snapshot

Data: 2026-06-05

## Aviso

Nao executar escrita ainda sem revisao e autorizacao explicita de Leon.

Codex nao deve conectar ao SharePoint, publicar pacote, instalar app, alterar tenant ou iniciar Power Automate.

## Pre-condicoes futuras

- Pacote V2.6A revisado por Leon.
- Pagina restrita de teste.
- Permissao de escrita concedida somente ao usuario/teste autorizado.
- Item alvo da Lista 02 contendo `V2.3B-TESTE` ou `V2.6A-TESTE` no `Title`.
- Valor de teste conhecido e nao operacional.
- Alçadas de teste ativas.
- Print/backup visual do item antes do teste.
- Confirmacao textual disponivel: `TESTAR-ESCRITA-V2.6A-ENAC`.
- Power Automate nao iniciado.

## Dry-run visual

- [ ] Abrir pagina publicada/final readonly.
- [ ] Confirmar que a acao de escrita nao aparece no pacote padrao.
- [ ] Confirmar dashboard e administracao continuam carregando.
- [ ] Confirmar ausencia de escrita no Network em carregamento inicial.

## Teste manual futuro

Executar somente apos revisao e autorizacao:

1. Configurar pacote/pagina de teste para habilitar explicitamente `escritaTesteHabilitada=true`.
2. Informar item de teste, valor, marcador e confirmacao.
3. Abrir `Administracao / Historico`.
4. Acionar manualmente `Teste controlado V2.6A - criar snapshot de teste`.
5. Verificar retorno da acao.

## Validacoes esperadas

- `ENAC Snapshots Regras` contem novo `SNAP-V2.6A-TESTE-*`.
- Snapshot aponta para a requisicao de teste em `Solicitacao`.
- Snapshot contem `RegraInternaId`, faixa, valor e aprovadores congelados.
- `AprovadorBaseEmail` e `AprovadorEfetivoEmail` ficam vazios no teste da webpart.
- Lista 02 contem `SnapshotAprovacaoCompra` apontando para o snapshot criado.
- `ENAC Historico Configuracoes` contem registro tecnico do teste.
- Nao existe duplicidade de snapshot para o mesmo item.
- Nao houve alteracao em dados reais.

## Criterios de parada

- Acao aparece sem habilitacao explicita.
- Alguma escrita ocorre ao carregar a pagina.
- Item alvo nao contem marcador de teste.
- `SnapshotAprovacaoCompra` ja esta preenchido e o fluxo tenta sobrescrever.
- Alçada nao e resolvida.
- Aprovador base ativo nao e localizado.
- Network mostra escrita fora de `ENAC Snapshots Regras`, Lista 02 `SnapshotAprovacaoCompra` ou `ENAC Historico Configuracoes`.
- Power Automate e iniciado.

## Rollback manual futuro

Somente com autorizacao:

- remover o valor de `SnapshotAprovacaoCompra` do item de teste;
- excluir snapshot `SNAP-V2.6A-TESTE-*` se criado indevidamente;
- registrar a acao no historico;
- nunca alterar item operacional real.

## Registro para retorno ao Codex

Preencher apos teste futuro:

1. Acao estava oculta antes da habilitacao: sim/nao
2. Escrita automatica no carregamento: sim/nao
3. Item de teste usado:
4. Marcador de teste:
5. Valor de teste:
6. Snapshot criado:
7. `SnapshotAprovacaoCompra` vinculado:
8. Historico registrado:
9. Duplicidade identificada: sim/nao
10. Escrita fora do escopo: sim/nao
11. Power Automate iniciado: sim/nao
12. Resultado final:
