# Roteiro V2.8A - Homologacao Assistida Do Fluxo Completo

Data: 2026-06-09

## Objetivo

Conduzir homologacao assistida do fluxo completo `Solicitacao -> Snapshot -> Aprovacao -> Pedido -> NF -> Programacao de Pagamento`, mantendo o ambiente controlado, sem Power Automate e sem liberacao ampla.

## Regras Antes De Iniciar

- Usar somente itens marcados como `V2.7A-TESTE` ou novo marcador aprovado para homologacao.
- Confirmar flags ligadas apenas durante o teste.
- Confirmar modo teste e confirmacao manual.
- Confirmar pre-validacao especifica antes de cada escrita.
- Nao executar Power Automate.
- Nao marcar pagamento como pago.
- Desligar flags e republicar pagina ao final.

## Etapa 1 - Requisicao

Checklist:

- usuario de Campo ou operador autorizado cria/usa solicitacao controlada;
- marcador de teste presente;
- obra, centro de custo, descricao e valor conferidos;
- status inicial conferido;
- historico inicial conferido.

Evidencias:

- item da Lista 02;
- status;
- campos com marcador;
- historico.

## Etapa 2 - Aprovacao

Checklist:

- snapshot gerado;
- regra de alcada resolvida;
- aprovador base e efetivo conferidos;
- aprovacao por usuario previsto ou Diretoria/alcada superior registrada;
- snapshot preservado apos aprovacao;
- historico criado.

Evidencias:

- item em ENAC Snapshots Regras;
- lookup `SnapshotAprovacaoCompra`;
- status da requisicao;
- historico.

## Etapa 3 - Pedido

Checklist:

- pedido criado na Lista 03;
- fornecedor lookup preenchido;
- obra preenchida;
- valor `6720` ou valor homologado conferido;
- centro de custo conferido;
- vinculo com requisicao conferido;
- historico criado.

Evidencias:

- item da Lista 03;
- numero da requisicao;
- fornecedor;
- status do pedido;
- historico.

## Etapa 4 - Nota Fiscal

Checklist:

- NF criada na Lista 04;
- numero da NF conferido;
- vinculo com pedido conferido;
- valor e vencimento conferidos;
- fornecedor e obra preenchidos;
- status da conferencia conferido;
- `Enviada para contabilidade?` conferido;
- historico criado.

Evidencias:

- item da Lista 04;
- numero da NF;
- status;
- valor;
- vencimento;
- historico.

## Etapa 5 - Programacao Financeira

Checklist:

- programacao criada na Lista 10;
- NF textual conferida;
- fornecedor/prestador e obra preenchidos;
- vencimento e data programada conferidos;
- valor bruto e liquido conferidos;
- conta, forma, categoria e origem conferidas;
- status `Programado`;
- data do pagamento vazia;
- comprovante vazio;
- historico criado.

Evidencias:

- item da Lista 10;
- status `Programado`;
- campos financeiros;
- historico.

## Etapa 6 - Auditoria Final

Checklist:

- historico ponta a ponta conferido;
- duplicidade conferida;
- NF, pedido e requisicao sem alteracoes indevidas;
- flags desligadas;
- pagina republicada com flags desligadas;
- Power Automate sem execucao planejada;
- run history do Power Automate verificado, se essa comprovacao for exigida.

## Criterios De Aceite Para Homologacao Assistida

- fluxo completo concluido em ambiente controlado;
- todos os registros rastreaveis;
- historico criado em cada etapa;
- sem escrita automatica;
- sem Power Automate;
- sem pagamento efetivo;
- pendencias documentadas para pre-producao.

## Criterios De Parada

Parar se:

- pre-validacao bloquear;
- houver duplicidade;
- marcador de teste ausente;
- usuario/perfil nao autorizado;
- snapshot ausente ou sobrescrito;
- Power Automate iniciar sem autorizacao;
- algum registro real nao marcado como teste for afetado.
