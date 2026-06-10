# Checklist V2.8E3 - Validacao Painel Interno

Data: 2026-06-09

## Pre-condicoes

- Pacote V2.8E3 publicado manualmente por Leon/Admin.
- Pagina de homologacao aberta em `?env=WebView`.
- Webpart carregada em pagina dedicada ou secao larga.

## Validacao Visual

- [ ] Fundo/area externa da webpart ocupa a largura disponivel.
- [ ] Menu lateral interno permanece a esquerda.
- [ ] Painel branco principal vai quase ate o lado direito util.
- [ ] Nao sobra grande area escura a direita dentro da webpart.
- [ ] Header branco estica na largura do painel.
- [ ] Cards do dashboard ocupam a largura do painel.
- [ ] Formularios, linhas e tabelas esticam no painel principal.
- [ ] Tabelas rolam internamente quando necessario.
- [ ] Nao ha scroll horizontal global da pagina.

## Validacao Responsiva

- [ ] Em notebook, menu lateral e conteudo continuam utilizaveis.
- [ ] Em tela menor, layout empilha conforme media query.
- [ ] Textos principais nao sobrepoem botoes ou tabelas.

## Nao Regressao

- [ ] Nenhuma regra de negocio alterada.
- [ ] Nenhum payload alterado.
- [ ] Nenhuma chamada REST alterada.
- [ ] Nenhuma trava de escrita alterada.
- [ ] Nenhuma acao operacional alterada.
- [ ] Nenhum script alterado.
- [ ] Power Automate nao iniciado.

## Evidencias

Registrar:

- URL testada;
- print antes/depois, se disponivel;
- largura aproximada da tela;
- navegador usado;
- se a area escura a direita foi reduzida.
