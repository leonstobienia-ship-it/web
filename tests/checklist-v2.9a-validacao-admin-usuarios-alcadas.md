# Checklist V2.9A - Administracao De Usuarios E Alcadas

## Banner

- Confirmar que o banner mostra `Usuário` como texto fixo.
- Confirmar que o banner mostra `Perfil de acesso`.
- Confirmar que o seletor nao mistura nome + perfil.
- Confirmar que um usuario com um unico perfil nao consegue escolher outro perfil.
- Confirmar que usuario nao cadastrado ou inativo recebe alerta de bloqueio.

## Menus

- Confirmar que `Usuários`, `Alçadas` e `Auditoria` aparecem somente para `AdministradorSistema`.
- Confirmar que perfis de Campo, Compras, Planejamento, Diretoria e Consulta nao veem menus administrativos.
- Confirmar que botoes de teste/manutencao continuam restritos a administrador.

## Usuarios

- Confirmar que a tela lista usuarios de forma readonly.
- Confirmar que `CriarUsuarioSistema` aparece preparado, mas bloqueado.
- Confirmar que alteracao de perfil/status aparece preparada, mas bloqueada.

## Alcadas

- Confirmar que a tela lista alcadas de forma readonly.
- Confirmar que `AtualizarAlcadaUsuario` aparece preparado, mas bloqueado.
- Confirmar que valores de alcada continuam vindo da lista/fallback, sem limite fixo novo em codigo.

## Auditoria Readonly

- Executar manualmente o script `scripts/sharepoint/17-auditoria-usuarios-alcadas-readonly.ps1`.
- Conferir os quatro relatorios gerados em `reports/`.
- Confirmar que os relatorios estao sanitizados.
- Confirmar que nenhuma escrita administrativa foi executada.

## Preservacao

- Confirmar que fluxos de requisicao, aprovacao, pedido, NF e programacao de pagamento continuam preservados.
- Confirmar que Power Automate nao foi iniciado.
