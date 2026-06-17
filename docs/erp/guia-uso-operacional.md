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

- Cabecalho da aplicacao mostra area e modulo ativo.
- Cabecalho mostra usuario de homologacao e perfil ativo.
- Menu lateral exibe logo ENAC, grupos por area e icones discretos para facilitar reconhecimento visual.
- Grupos do menu usam indicador visual de expansao sem texto auxiliar de abrir/recolher.
- A topbar nao possui seletor redundante de modulo; a navegacao principal fica concentrada no menu lateral.
- `Administracao de Acessos` concentra usuarios, perfis, escopos e alcadas.
- A tela antiga nao aparece na navegacao principal nem na visao geral da homologacao.
- Modulos operacionais usam abas para separar consulta, novo registro e detalhes quando aplicavel.
- Relatorios Financeiros e Dashboard Executivo usam abas por assunto para reduzir rolagem longa.
- Riscos e Pendencias separa lista, cadastro manual, conversao de alerta e detalhe/historico.
- Cards resumem indicadores principais.
- Tabelas mantem rolagem horizontal quando o conteudo e largo.
- Botoes desabilitados indicam bloqueio visual sem remover o contexto da acao.
- Chips e status usam cores consistentes por situacao.

## Responsividade

Desktop:

- menu lateral fixo com rolagem propria;
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

A validacao visual da V3.15 deve passar por:

- Browser interno desktop;
- Browser interno mobile;
- ausencia de erro de console;
- ausencia de overlay de framework;
- navegacao por areas principais;
- build frontend;
- TypeScript.

Smokes backend seguem obrigatorios para garantir que a revisao visual nao quebrou contratos existentes.
