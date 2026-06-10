# Checklist V2.8E10 - Breakout medido

## Publicacao manual

- [ ] Publicar/substituir o pacote `.sppkg` gerado apos a V2.8E10.
- [ ] Atualizar o app no site, se a opcao aparecer.
- [ ] Abrir a pagina em janela anonima ou usar `Ctrl+F5` / `Ctrl+Shift+R`.

Pagina de referencia:

`/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`

## Marcadores

- [ ] O badge `UI V2.8E10` aparece no cabecalho.
- [ ] O texto `Breakout medido ativo` aparece no cabecalho.
- [ ] Nao aparece badge antigo `UI V2.8E9`.

Se `UI V2.8E10` nao aparecer, revisar cache/App Catalog/app instalado antes de avaliar o layout.

## Breakout e largura

- [ ] O conjunto menu lateral + painel branco ocupa a largura real disponivel.
- [ ] A area escura vazia a direita foi reduzida claramente.
- [ ] O painel branco chega perto da lateral direita util do navegador.
- [ ] O menu lateral permanece visivel e sem corte.
- [ ] A lateral esquerda nao corta.
- [ ] Nao ha barra horizontal global indevida.

## Responsividade

- [ ] Em desktop, o titulo `Sistema ENAC` nao quebra.
- [ ] Em tela menor, o layout volta a largura `100%` sem margem medida.
- [ ] Cards, tabelas, formularios e split layout continuam usaveis.

## Funcionalidade preservada

- [ ] Navegacao entre modulos funcionando.
- [ ] Formularios renderizando sem crash.
- [ ] Tabelas renderizando sem crash.
- [ ] Nenhuma escrita operacional indevida observada.
- [ ] Nenhum dado real criado, alterado ou excluido durante esta validacao.
- [ ] Power Automate nao iniciado.

## Se persistir

- [ ] Com `UI V2.8E10` visivel e largura ainda presa, inspecionar o DOM real do SharePoint/canvas para identificar o wrapper externo limitante.
