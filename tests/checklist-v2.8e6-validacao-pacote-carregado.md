# Checklist V2.8E6 - Validacao de pacote carregado/cache

## App Catalog

- [ ] Fazer upload/substituicao de `enac-sistema-spfx.sppkg`.
- [ ] Confirmar que o SharePoint reconhece o pacote.
- [ ] Confirmar versao `1.0.0.1` no App Catalog.
- [ ] Confirmar ausencia de alerta inesperado.
- [ ] Registrar print ou observacao da tela de confirmacao.

## Site de homologacao

- [ ] Acessar `Equipe.Obras`.
- [ ] Ir em `Conteudo do site` > `Aplicativos`.
- [ ] Localizar o app do Sistema ENAC.
- [ ] Acionar `Atualizar`, se disponivel.
- [ ] Aguardar alguns minutos apos atualizacao.

## Cache/navegador

- [ ] Abrir a pagina em janela anonima.
- [ ] Testar `Ctrl+F5`.
- [ ] Testar `Ctrl+Shift+R`.
- [ ] Se necessario, fechar e reabrir o navegador.

Pagina de referencia:

`/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`

## Marcadores esperados

- [ ] O badge `UI V2.8E6` aparece no cabecalho.
- [ ] A linha `Layout: full viewport ativo` aparece no cabecalho.
- [ ] Os marcadores aparecem independentemente do perfil selecionado.

Se `UI V2.8E6` nao aparecer, tratar como problema de pacote/app/cache antes de qualquer nova mudanca de CSS.

## Validacao visual

- [ ] O painel principal usa a largura util.
- [ ] A area escura a direita reduziu.
- [ ] Menu lateral permanece a esquerda.
- [ ] Nao ha barra horizontal global indevida.
- [ ] Tabelas usam scroll interno quando necessario.
- [ ] Cards, formularios e split layout continuam usaveis.

## Diagnostico

- [ ] `UI V2.8E6` ausente: pacote novo nao carregou.
- [ ] `UI V2.8E6` presente e layout estreito: limite provavel no canvas/coluna/iframe SharePoint.
- [ ] `UI V2.8E6` presente e layout correto: V2.8E6 validada visualmente.

## Funcionalidade preservada

- [ ] Navegacao entre modulos sem erro.
- [ ] Renderizacao de tabelas sem crash.
- [ ] Renderizacao de formularios sem crash.
- [ ] Nenhum registro real criado.
- [ ] Nenhuma escrita operacional indevida observada.
- [ ] Power Automate nao iniciado nesta validacao.
