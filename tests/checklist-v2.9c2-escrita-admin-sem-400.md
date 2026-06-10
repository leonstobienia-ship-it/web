# Checklist V2.9C2 - Escrita administrativa sem 400

## Preparacao

- Publicar manualmente o pacote atualizado.
- Abrir a webpart com Leon como Administrador do Sistema.
- Ligar as flags V2.9C no Property Pane.
- Informar `CONFIRMAR-ESCRITA-ADMINISTRATIVA-V2.9C-ENAC`.

## Teste recomendado

1. Abrir `Usuarios`.
2. Escolher `AtualizarUsuarioPerfilStatus`.
3. Selecionar item alvo ID 1.
4. Alterar apenas `Observacoes` com marcador `V2.9C-ADMIN-TESTE`.
5. Conferir `Pre-validacao`.
6. Conferir `Payload SharePoint`.
7. Confirmar que `Payload SharePoint` nao contem `DiagnosticoPreValidacao`.
8. Conferir `Diagnostico` em campo separado.
9. Digitar a confirmacao final.
10. Salvar.

## Resultado esperado

- O botao habilita somente com pre-validacao aprovada.
- O payload enviado contem somente campos reais de `ENAC Usuarios Perfis`.
- O SharePoint nao retorna 400.
- O historico administrativo e criado.

## Se ainda ocorrer erro

Registrar a mensagem tecnica exibida pela webpart. A V2.9C2 passa a tentar capturar o corpo do erro SharePoint, sanitizando e-mails e tokens, para indicar o campo rejeitado.
