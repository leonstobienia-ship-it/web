# Checklist V2.9B - Pre-Validacao Administrativa

## Publicacao Manual

- Publicar manualmente o pacote gerado.
- Nao iniciar Power Automate.
- Nao executar escrita administrativa real.

## Flags

- Confirmar que, por padrao, `habilitarEscritaAdministrativaV29B` esta desligada.
- Ligar `habilitarEscritaAdministrativaV29B` apenas em pagina de homologacao.
- Ligar `modoTesteAdministrativoV29B`.
- Informar token `CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9B-ENAC`.
- Confirmar marcador `V2.9B-ADMIN-TESTE`.

## Perfil

- Confirmar que o painel V2.9B so aparece com perfil ativo `AdministradorSistema`.
- Confirmar que Diretoria sem perfil ativo de administrador nao ve o painel.

## CriarUsuarioSistema

- Preencher dados de teste.
- Confirmar payload previsto com `ContaMicrosoft365Id`.
- Confirmar bloqueio quando email ou `UsuarioInternoId` ja existir.
- Confirmar historico previsto.

## AtualizarUsuarioPerfilStatus

- Informar item de usuario existente.
- Confirmar payload previsto.
- Confirmar alerta antes de remover perfil administrador do proprio usuario.
- Confirmar historico previsto.

## AtualizarAlcadaUsuario

- Informar regra e aprovador principal.
- Confirmar bloqueio para aprovador inativo.
- Confirmar bloqueio para faixa invalida.
- Confirmar alerta de possivel sobreposicao.
- Confirmar historico previsto.

## Preservacao

- Confirmar que nenhum item foi criado/alterado no tenant.
- Confirmar que fluxos operacionais seguem preservados.
