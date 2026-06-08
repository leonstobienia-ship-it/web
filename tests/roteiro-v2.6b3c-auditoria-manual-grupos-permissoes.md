# Roteiro V2.6B.3C - Auditoria Manual de Grupos e Permissoes

Data: 2026-06-08

## Objetivo

Orientar Leon a conferir manualmente grupos e permissoes no SharePoint sem alterar tenant, listas, grupos, membros ou heranca.

## A. Abrir site

Abrir:

`https://enaccombr.sharepoint.com/sites/Equipe.Obras`

## B. Abrir permissoes do site

Acessar:

1. Configuracoes do site.
2. Permissoes do site.
3. Configuracoes avancadas de permissoes, ou equivalente em portugues.

Nao alterar nada nessa tela.

## C. Verificar grupos planejados

Procurar:

- ENAC Sistema Admin
- ENAC Diretoria
- ENAC Planejamento
- ENAC Compras Financeiro
- ENAC Cotacoes Contratos
- ENAC Campo Engenharia
- ENAC Leitura Auditoria

Registrar no template somente:

- `EXISTE`;
- `AUSENTE`;
- `NOME_DIFERENTE`;
- `NAO_VERIFICADO`;
- quantidade de membros, se visivel;
- observacao curta.

Nao copiar e-mails de membros para o relatorio. Se precisar registrar composicao, usar apenas quantidade ou papel funcional.

## D. Verificar permissoes do site

Registrar:

- quais grupos tem `Controle Total`;
- quais grupos tem `Editar`;
- quais grupos tem `Leitura`;
- se ha usuarios individuais com permissoes diretas relevantes.

Nao remover nem adicionar usuarios.

## E. Verificar listas administrativas

Para cada lista:

- ENAC Usuarios Perfis
- ENAC Alcadas
- ENAC Historico Configuracoes
- ENAC Snapshots Regras

Executar:

1. Abrir a lista.
2. Abrir Configuracoes da lista.
3. Abrir Permissoes para esta lista.
4. Verificar se herda permissoes do site.
5. Registrar `HERDA`, `PERMISSAO_UNICA` ou `NAO_VERIFICADO`.
6. Registrar grupos/papeis principais, se visiveis.

Nao quebrar heranca e nao alterar permissoes.

## F. Preencher template

Usar:

`sharepoint/auditoria-manual-grupos-permissoes-v2.6b3c.template.md`

Manter o preenchimento sanitizado:

- sem e-mails;
- sem tokens;
- sem codigos de autenticacao;
- sem dados de itens;
- sem dados operacionais.

## G. Enviar ao Codex

Depois da auditoria manual, enviar:

- grupos encontrados: `EXISTE` / `AUSENTE`;
- se ha grupos com nomes diferentes;
- se as listas administrativas herdam permissoes;
- se existem usuarios individuais com acesso direto relevante;
- riscos antes de quebrar heranca.

## Resultado esperado

A V2.6B.3C deve permitir decidir se a proxima etapa sera:

- V2.6B.4, aplicacao real controlada das permissoes administrativas;
- criacao manual de grupos;
- ajuste do plano antes de qualquer aplicacao;
- auditoria complementar com app/conta de maior permissao.
