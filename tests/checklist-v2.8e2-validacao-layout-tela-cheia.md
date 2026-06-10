# Checklist V2.8E2 - Validacao Layout Tela Cheia

Data: 2026-06-09

## Pre-condicoes

- Pacote V2.8E2 publicado manualmente por Leon/Admin.
- Pagina `Sistema ENAC - Homologação` aberta.
- Usuario administrador disponivel para validar layout.
- Usuario final disponivel para validar sem edicao de pagina.

## Desktop

- [ ] Sistema ENAC ocupa quase toda a largura util da pagina.
- [ ] Nao ha painel interno estreito preso ao lado esquerdo.
- [ ] Menu lateral interno fica a esquerda e ocupa a altura da aplicacao.
- [ ] Conteudo principal ocupa o restante da largura.
- [ ] Cards do dashboard expandem com a area disponivel.
- [ ] Nao sobra bloco grande vazio a direita dentro da webpart.
- [ ] Nao sobra faixa branca grande abaixo causada pelo shell do sistema.
- [ ] Nao ha scroll horizontal global da pagina.

## Notebook

- [ ] Menu lateral nao corta textos de forma critica.
- [ ] Conteudo principal permanece utilizavel.
- [ ] Cards ajustam sem sobreposicao.
- [ ] Tabelas usam scroll interno se necessario.

## Pagina Dedicada / App Page

- [ ] `SharePointFullPage` continua funcionando.
- [ ] `supportsFullBleed` continua habilitado.
- [ ] O sistema continua sendo a experiencia principal da pagina.
- [ ] Chrome restante do SharePoint nao impede o uso.

## Nao Regressao

- [ ] Nenhuma regra de negocio alterada.
- [ ] Nenhum payload alterado.
- [ ] Nenhuma chamada REST alterada.
- [ ] Nenhuma trava V2.6A/V2.7A alterada.
- [ ] Nenhuma acao operacional alterada.
- [ ] Nenhum Power Automate iniciado.
- [ ] Nenhuma lista/dado/permissao alterado durante a validacao.

## Evidencias

Registrar:

- URL testada;
- resolucao aproximada da tela;
- print desktop;
- print notebook, se possivel;
- usuario testado;
- observacao se o canvas do SharePoint ainda limitar a largura.
