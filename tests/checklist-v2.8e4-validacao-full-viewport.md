# Checklist V2.8E4 - Validacao full viewport controlado

## Publicacao manual

- [ ] Publicar manualmente o pacote `.sppkg` gerado apos a V2.8E4.
- [ ] Confirmar que o App Catalog aceitou o pacote sem alerta inesperado.
- [ ] Instalar/atualizar o app no site de homologacao.
- [ ] Abrir a pagina dedicada do Sistema ENAC em modo publicado.

## Marcador visual

- [ ] O badge `UI V2.8E4` aparece no cabecalho.
- [ ] O badge aparece ao lado do indicador `Homologação assistida`.
- [ ] O badge nao aparece como dado operacional.

Se o badge nao aparecer, interromper a validacao visual de largura e revisar cache/publicacao/App Catalog.

## Largura e viewport

- [ ] O fundo da webpart ocupa a largura util do navegador.
- [ ] O menu lateral permanece fixo a esquerda.
- [ ] O painel principal se expande ate a direita.
- [ ] A sobra escura a direita foi reduzida drasticamente.
- [ ] Nao ha barra horizontal global indevida na pagina.
- [ ] Tabelas largas usam scroll interno quando necessario.
- [ ] O layout continua usavel em viewport menor.

## Elementos internos

- [ ] Header alinhado.
- [ ] Cards de metricas redistribuidos na largura.
- [ ] Tabelas renderizadas sem corte lateral.
- [ ] Formularios ocupam a largura do painel.
- [ ] Split layout aproveita a area disponivel.
- [ ] Navegacao lateral continua operando.

## Funcionalidade preservada

- [ ] Troca de modulos/telas sem erro.
- [ ] Formularios renderizam sem crash.
- [ ] Tabelas renderizam sem crash.
- [ ] Nenhum registro real e criado durante validacao visual.
- [ ] Nenhuma escrita operacional indevida e observada.
- [ ] Console do navegador sem erro critico da webpart.

## Diagnostico se persistir

- [ ] Badge ausente: pacote V2.8E4 nao carregou ou cache/publicacao esta pendente.
- [ ] Badge presente e largura inalterada: limite provavelmente esta no canvas/coluna/iframe da pagina SharePoint.
- [ ] Badge presente e scroll horizontal global: ajustar o breakout controlado ou validar pagina dedicada/app page.
