# Checklist V2.8E1 - Validacao Largura Total

Data: 2026-06-09

## Pre-condicoes

- Pacote SPFx V2.8E1 publicado manualmente por Leon/Admin.
- Webpart com `supportsFullBleed = true`.
- Webpart com `SharePointFullPage` preservado.
- Pagina `Sistema ENAC - Homologação` disponivel.

## Validacao Em Pagina Moderna

- [ ] A webpart pode ser adicionada em secao de largura total, se a opcao existir.
- [ ] O Sistema ENAC ocupa toda a largura disponivel da secao.
- [ ] Nao ha max-width aparente limitando o shell principal.
- [ ] A pagina nao cria scroll horizontal global.
- [ ] Menu lateral interno permanece estavel.
- [ ] Conteudo principal ocupa o espaco restante.
- [ ] Cards se distribuem adequadamente em desktop.
- [ ] Tabelas nao estouram a pagina; se necessario, rolam internamente.

## Validacao Em App Page

- [ ] Pagina dedicada/app page continua abrindo.
- [ ] `SharePointFullPage` continua funcional.
- [ ] A webpart continua ocupando a experiencia principal.
- [ ] Usuarios finais sem permissao de edicao nao veem comandos de edicao.

## Validacao De Nao Regressao

- [ ] Nenhuma regra de negocio alterada.
- [ ] Nenhum fluxo operacional alterado.
- [ ] Nenhum payload alterado.
- [ ] Nenhuma chamada REST nova.
- [ ] Nenhum Power Automate iniciado.
- [ ] Nenhuma lista/dado/permissao alterado durante a validacao.

## Observacoes

Se a opcao `Largura total` nao aparecer no SharePoint, registrar:

- tipo da pagina;
- template usado;
- se a pagina esta em modo app page;
- se ha restricao do site/canvas.
