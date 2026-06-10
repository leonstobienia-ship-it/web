# Checklist V2.8E11 - Largura sem overflow

## Publicacao manual

- [ ] Publicar/substituir o pacote `.sppkg` gerado apos a V2.8E11.
- [ ] Atualizar o app no site, se a opcao aparecer.
- [ ] Abrir a pagina em janela anonima ou usar `Ctrl+F5` / `Ctrl+Shift+R`.

Pagina de referencia:

`/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`

## Marcadores

- [ ] O badge `UI V2.8E11` aparece no cabecalho.
- [ ] O texto `Breakout medido ativo` aparece no cabecalho.
- [ ] O texto `Ajuste fino de largura ativo` aparece no cabecalho.
- [ ] Nao aparece badge antigo `UI V2.8E10`.

## Largura

- [ ] O painel continua largo.
- [ ] O painel nao passa da largura util do navegador.
- [ ] Nao ha scroll horizontal global.
- [ ] A lateral esquerda nao corta.
- [ ] A area escura a direita nao volta a dominar a tela.

## Conteudo

- [ ] Menu lateral permanece visivel.
- [ ] Header e titulo continuam alinhados.
- [ ] Cards, tabelas, formularios e split layout continuam usaveis.
- [ ] Tabelas mantem scroll horizontal interno quando necessario.

## Funcionalidade preservada

- [ ] Navegacao entre modulos funcionando.
- [ ] Formularios renderizando sem crash.
- [ ] Tabelas renderizando sem crash.
- [ ] Nenhuma escrita operacional indevida observada.
- [ ] Nenhum dado real criado, alterado ou excluido durante esta validacao.
- [ ] Power Automate nao iniciado.

## Se persistir

- [ ] Se ainda houver leve overflow com `UI V2.8E11` visivel, considerar elevar o safety gap de `16px` para `24px` em rodada futura.
