# Fluxos Validados no Protótipo Microsoft 365

Foram validados operacionalmente no ambiente Microsoft 365:

1. Requisição de material/serviço -> pedido de compra -> nota fiscal -> conta a pagar.
2. Medição de prestador -> nota fiscal -> conta a pagar.
3. Medição da obra -> faturamento -> conta a receber.
4. Alocação de equipe -> documentos/integrações -> liberação para trabalho.
5. Ocorrência de obra -> análise -> ação -> resolução -> validação.

## Fluxo oficial para o MVP atual

O MVP reorganiza o fluxo de compras e pagamento em:

`Solicitação da Obra -> Aguardando Cotação -> Cotação por Kemilly -> Aprovação por alçada -> Pedido de Compra por Matheus -> Execução da Compra por Matheus -> NF por Matheus -> Programação Bancária por Matheus -> Liberação Bancária por Leon -> Status Final por Leon -> Processo Concluído`

## Áreas já testadas

- Controle de obras.
- Requisições de material/serviço.
- Pedidos e compras.
- Notas fiscais.
- Fornecedores e prestadores.
- Medições da obra.
- Contratos de prestadores.
- Medições de prestadores.
- Contas a pagar.
- Contas a receber.
- Mão de obra e alocação.
- Documentos e integrações.
- Pendências e ocorrências.

## Registro automático de usuário

O protótipo Microsoft 365 já validou o uso do usuário autenticado, incluindo o campo "Criado por", para identificar quem envia formulários.

No MVP atual, esse conceito é simulado nos dados de tela e deve ser preservado na futura integração.

## V2.7A - fluxo de escrita restrita

A V2.7A prepara o fluxo de compras para escrita operacional restrita em itens `V2.7A-TESTE`: criar requisicao, complementar/cotar, aprovar por alcada, emitir pedido, vincular NF, programar pagamento e registrar historico. A execucao real em tenant deve ocorrer apenas em V2.7A.1, com flags habilitadas manualmente e sem Power Automate.
