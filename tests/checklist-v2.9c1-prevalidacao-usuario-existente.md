# Checklist V2.9C1 - Pre-validacao de usuario existente

## Objetivo

Confirmar que editar o proprio item de usuario nao gera duplicidade bloqueante para `ContaMicrosoft365`, `EmailCorporativo` ou `UsuarioInternoId`.

## Passos

1. Publicar manualmente o pacote atualizado no tenant.
2. Abrir a webpart com Leon como Administrador do Sistema.
3. Configurar as flags V2.9C no Property Pane.
4. Abrir `Usuarios`.
5. Selecionar `AtualizarUsuarioPerfilStatus`.
6. Selecionar o item do Leon.
7. Manter Conta Microsoft 365, e-mail e ID interno iguais aos do proprio item.
8. Conferir a pre-validacao.

## Resultado esperado

- `CONTA_M365_DUPLICADA` nao aparece quando a conta pertence ao proprio item.
- `EMAIL_DUPLICADO` nao aparece quando o e-mail pertence ao proprio item.
- `USUARIO_INTERNO_ID_DUPLICADO` nao aparece quando o ID interno pertence ao proprio item.
- `DUPLICIDADE_PROPRIO_ITEM_IGNORADA` pode aparecer como diagnostico nao bloqueante.
- As flags desligadas continuam aparecendo como bloqueio ate serem configuradas.

## Teste negativo recomendado

Alterar temporariamente a conta, e-mail ou ID interno para valores de outro usuario cadastrado.

Resultado esperado:

- a pre-validacao bloqueia com duplicidade real;
- nenhuma escrita deve ser executada se houver alerta bloqueante.
