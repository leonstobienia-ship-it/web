# Checklist V2.9C - Escrita Administrativa Controlada

## Preparacao

- Publicar pacote no tenant manualmente.
- Confirmar que Leon entra como Administrador do Sistema.
- No Property Pane, ligar `habilitarEscritaAdministrativaV29C`.
- Ligar `modoTesteAdministrativoV29C`.
- Manter `exigirConfirmacaoAdministrativaV29C`.
- Preencher token `CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9C-ENAC`.

## Teste recomendado 1 - Atualizar usuario Leon

- Abrir menu `Usuarios`.
- Escolher `AtualizarUsuarioPerfilStatus`.
- Selecionar Leon.
- Alterar somente `Observacoes` com marcador `V2.9C-ADMIN-TESTE`.
- Conferir pre-validacao sem alertas bloqueantes.
- Digitar confirmacao final.
- Salvar.
- Conferir item em `ENAC Usuarios Perfis`.
- Conferir historico em `ENAC Historico Configuracoes`.

## Teste recomendado 2 - Alcada

- Abrir menu `Alcadas`.
- Selecionar regra existente de compra.
- Alterar somente `Observacoes`.
- Conferir aprovador ativo, vigencia e faixa.
- Digitar confirmacao final.
- Salvar.
- Conferir item e historico.

## Bloqueios esperados

- Nao administrador nao ve menus administrativos.
- Sem token correto, o botao de salvar permanece desabilitado.
- Usuario inativo nao pode administrar.
- Aprovador inativo bloqueia alçada.
- Faixa sobreposta bloqueia alçada ativa.

## Evidencias

- Print da pre-validacao.
- Item antes/depois.
- Item de historico criado.
- Confirmacao de que fluxos operacionais continuam funcionando.
