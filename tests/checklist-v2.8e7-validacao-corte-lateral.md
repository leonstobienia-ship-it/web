# Checklist V2.8E7 - Validacao de corte lateral

## Publicacao manual

- [ ] Publicar/substituir o pacote `.sppkg` gerado apos a V2.8E7.
- [ ] Atualizar o app no site, se a opcao aparecer.
- [ ] Abrir a pagina em janela anonima ou fazer `Ctrl+F5` / `Ctrl+Shift+R`.

Pagina de referencia:

`/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`

## Marcador

- [ ] O badge `UI V2.8E7` aparece no cabecalho.
- [ ] A linha `Layout: full viewport ativo` aparece no cabecalho.
- [ ] Nao aparece mais badge antigo `UI V2.8E4` ou `UI V2.8E6`.

Se `UI V2.8E7` nao aparecer, revisar cache/App Catalog/app instalado antes de avaliar o layout.

## Corte lateral

- [ ] O logo ENAC aparece inteiro.
- [ ] O titulo `Sistema ENAC` aparece inteiro.
- [ ] O menu lateral interno aparece completo.
- [ ] A primeira coluna do sistema nao fica fora da tela.
- [ ] Nao existe corte lateral esquerdo em WebView.
- [ ] Nao existe barra horizontal global indevida.

## Largura e layout

- [ ] O painel principal continua fluido.
- [ ] A area escura a direita nao volta a dominar a tela.
- [ ] Cards e metricas continuam responsivos.
- [ ] Tabelas usam scroll interno quando necessario.
- [ ] Formularios continuam sem sobreposicao.

## Funcionalidade preservada

- [ ] Navegacao entre modulos funcionando.
- [ ] Formularios renderizando sem crash.
- [ ] Tabelas renderizando sem crash.
- [ ] Nenhuma escrita operacional indevida observada.
- [ ] Nenhum dado real criado, alterado ou excluido durante esta validacao.
- [ ] Power Automate nao iniciado.
