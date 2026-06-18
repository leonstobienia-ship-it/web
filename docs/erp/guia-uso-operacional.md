# ERP - Guia de Uso Operacional

## Estrutura do menu

A navegacao do ERP ENAC esta organizada por areas:

| Area | Modulos |
| --- | --- |
| Operacao | Visao geral, Central de Tarefas, Riscos e Pendencias, Documentos e Anexos |
| Compras | Cadastros, Solicitacoes de Compra, Cotacoes, Pedidos de Compra |
| Financeiro | Notas Fiscais de Entrada, Contas a Pagar, Programacoes de Pagamento, Relatorios Financeiros |
| Obras | Contratos de Obra, Orcamentos, Planejamento Executivo, Medicoes e Faturamento, Previsto x Realizado |
| Gestao | Dashboard Executivo, Homologacao, Auditoria e Logs |
| Administracao | Administracao de Acessos |
| Base ERP | Arquitetura, MVP ERP, Workflows, Modelo de dados, Seguranca, Roadmap |

## Uso por perfil

### Diretoria

Priorizar:

- Dashboard Executivo;
- Previsto x Realizado;
- Central de Tarefas;
- Riscos e Pendencias criticas.

Objetivo: acompanhar margem, exposicao, aprovacoes e alertas.

### Planejamento

Priorizar:

- Contratos de Obra;
- Orcamentos;
- Planejamento Executivo;
- Medicoes e Faturamento;
- Previsto x Realizado.

Objetivo: comparar contrato, escopo, orcamento, medicao e desvio.

### Compras

Priorizar:

- Cadastros;
- Solicitacoes de Compra;
- Cotacoes;
- Pedidos de Compra.

Objetivo: conduzir a demanda ate o pedido formalizado.

### Financeiro

Priorizar:

- Notas Fiscais de Entrada;
- Contas a Pagar;
- Programacoes de Pagamento;
- Relatorios Financeiros.

Objetivo: controlar provisionamento, aprovacao, programacao, conferencia e baixa manual controlada.

### Campo

Priorizar:

- Solicitacoes de Compra;
- Medicoes e Faturamento;
- Riscos e Pendencias;
- Documentos e Anexos.

Objetivo: registrar demandas, evidencias, medicoes e bloqueios operacionais.

### Admin

Priorizar:

- Administracao de Acessos;
- Auditoria e Logs;
- Documentos e Anexos;
- Seguranca.

Objetivo: manter usuarios, perfis, escopos, alcadas e rastreabilidade.

## Padroes de tela

- A V3.18G define o padrao visual executivo atual do ERP ENAC.
- A identidade visual usa sidebar grafite, vermelho ENAC para destaque institucional, cinza tecnico para metadados e superficies branco/gelo para conteudo.
- O logo oficial fica em `web/src/assets/enac-logo-oficial.png` e deve ser usado sem alterar cores, transparencia ou proporcao.
- Cabecalho da aplicacao mostra area e modulo ativo.
- Cabecalho mostra usuario de homologacao e perfil ativo.
- Cabecalho mostra o ambiente local de homologacao quando aplicavel.
- Menu lateral exibe logo ENAC, grupos por area e icones SVG internos para facilitar reconhecimento visual.
- Em desktop, o menu lateral pode ser alternado para modo compacto sem remover a navegacao por grupos.
- Em mobile, o menu inicia recolhido e abre como painel de navegacao compacto.
- Grupos do menu usam indicador visual de expansao sem texto auxiliar de abrir/recolher.
- A topbar nao possui seletor redundante de modulo; a navegacao principal fica concentrada no menu lateral.
- `Administracao de Acessos` concentra usuarios, perfis, escopos e alcadas.
- A tela antiga nao aparece na navegacao principal nem na visao geral da homologacao.
- Modulos operacionais usam abas para separar consulta, novo registro e detalhes quando aplicavel.
- Central de Tarefas usa Consulta como aba inicial e deixa Nova tarefa manual em aba propria.
- Relatorios Financeiros e Dashboard Executivo usam abas por assunto para reduzir rolagem longa.
- Riscos e Pendencias separa lista, cadastro manual, conversao de alerta e detalhe/historico.
- A V3.18H separa `Obras > Orcamentos` e `Obras > Planejamento Executivo` em telas independentes.
- `Orcamentos` trata somente orcamento base, pacotes, itens, cronograma fisico-financeiro, resumo e status orcamentario.
- `Planejamento Executivo` trata somente etapas, responsaveis, datas, status, revisoes e encerramento/cancelamento operacional ja existente.
- Nao ha aba `Planejamento Executivo` dentro de Orcamentos nem aba `Orcamentos` dentro de Planejamento Executivo.
- A V3.18I ajusta o logo oficial no menu para usar transparencia real, sem card branco e sem distorcer a imagem.
- A V3.18I restringe grids de duas colunas aos cadastros que precisam deles, reduzindo espacos vazios abaixo das abas operacionais.
- `Notas Fiscais de Entrada` exibe `Anexar PDF/XML da NF` no novo registro e nos detalhes.
- O anexo de NF usa apenas preview local e referencia documental mock/local; nao ha upload externo real nem SharePoint real.
- O painel de documento da NF mostra metadados, preview PDF local quando suportado, trecho XML e referencias cadastradas no modulo `Documentos e Anexos`.
- Cards resumem indicadores principais com densidade de ERP, sem ocupar a tela como material promocional.
- Tabelas usam fonte compacta, bordas leves, rolagem horizontal quando o conteudo e largo e quebra de texto controlada.
- Paineis laterais de detalhe usam destaque vermelho e ficam sticky em desktop quando a largura permite.
- Botoes desabilitados indicam bloqueio visual sem remover o contexto da acao.
- Chips e status usam cores consistentes por situacao.

## Responsividade

Desktop:

- menu lateral fixo com rolagem propria;
- opcao de menu compacto para ganhar largura util;
- conteudo em largura util expandida;
- detalhes podem permanecer em painel lateral.

Notebook/tablet:

- menu lateral reduzido;
- cards e paineis quebram em menos colunas;
- filtros e acoes preservam leitura.

Mobile:

- menu e conteudo empilhados;
- topbar deixa de ser fixa;
- botoes de acao ocupam largura total quando necessario;
- tabelas continuam em rolagem horizontal, sem reduzir textos criticos a ponto de ficarem ilegiveis.

## Limites operacionais

A revisao UX vigente nao cria operacao financeira, fiscal, bancaria ou documental real.

Permanece proibido nesta etapa:

- pagamento funcional;
- baixa nova alem da baixa manual controlada ja existente;
- CNAB;
- integracao bancaria;
- boleto real;
- NFS-e real;
- integracao com prefeitura;
- SharePoint real;
- Microsoft Graph real;
- Entra real;
- Power Automate real;
- upload real externo;
- `DELETE` fisico.

Documentos e Anexos continuam apenas com metadados locais e campos mock preparados para integracao futura.

## Validacao UX

A validacao visual vigente deve passar por:

- Browser interno desktop;
- Browser interno mobile;
- ausencia de erro de console;
- ausencia de overlay de framework;
- navegacao por areas principais;
- ausencia de texto visual legado no menu;
- ausencia do seletor `Navegar para tela`;
- separacao de consulta, novo cadastro e detalhe nas telas operacionais;
- build frontend;
- TypeScript.

Smokes backend seguem obrigatorios para garantir que a revisao visual nao quebrou contratos existentes.
