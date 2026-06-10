# Checklist V2.8E9 - Grid principal em largura total

## Publicacao manual

- [ ] Publicar/substituir o pacote `.sppkg` gerado apos a V2.8E9.
- [ ] Atualizar o app no site, se a opcao aparecer.
- [ ] Abrir a pagina em janela anonima ou usar `Ctrl+F5` / `Ctrl+Shift+R`.

Pagina de referencia:

`/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`

## Marcadores

- [ ] O badge `UI V2.8E9` aparece no cabecalho.
- [ ] A linha `Layout: full viewport ativo` aparece no cabecalho.
- [ ] Nao aparece badge antigo `UI V2.8E8`.

Se `UI V2.8E9` nao aparecer, revisar cache/App Catalog/app instalado antes de avaliar o layout.

## Grid principal

- [ ] O menu lateral preto e o painel branco formam um conjunto largo.
- [ ] O conjunto `aside + main` ocupa a largura disponivel do fundo.
- [ ] O painel branco vai ate perto da lateral direita util.
- [ ] A grande area escura vazia a direita desapareceu ou reduziu claramente.
- [ ] O menu lateral permanece com largura fixa e sem corte.
- [ ] O painel principal ocupa o restante da largura.

## Regressao visual

- [ ] A lateral esquerda nao voltou a cortar.
- [ ] Nao ha barra horizontal global indevida.
- [ ] O titulo `Sistema ENAC` nao quebra no desktop.
- [ ] Cards, tabelas, formularios e split layout continuam usaveis.
- [ ] Em tela menor, o layout continua responsivo.

## Funcionalidade preservada

- [ ] Navegacao entre modulos funcionando.
- [ ] Formularios renderizando sem crash.
- [ ] Tabelas renderizando sem crash.
- [ ] Nenhuma escrita operacional indevida observada.
- [ ] Nenhum dado real criado, alterado ou excluido durante esta validacao.
- [ ] Power Automate nao iniciado.

## Se persistir

- [ ] Com `UI V2.8E9` visivel e grid ainda estreito, inspecionar o DOM real no navegador para identificar wrapper externo do SharePoint/canvas limitando a webpart.
