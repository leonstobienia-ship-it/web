# Regras de Negócio

## Fluxo oficial do MVP

1. Campo ou área técnica cria solicitação de material, serviço, locação ou equipamento.
2. O sistema registra automaticamente solicitante, data/hora, obra, código, cliente, centro de custo e status inicial.
3. A solicitação entra como `Aguardando cotação`.
4. Kemilly registra propostas comerciais, recomenda fornecedor e justifica cotações incompletas quando houver menos de três propostas.
5. O sistema determina a alçada necessária conforme valor recomendado e regras especiais configuradas.
6. O processo é enviado para aprovação com snapshot da regra aplicada.
7. Gustavo ou Leon aprova, reprova, solicita ajuste ou solicita nova cotação conforme alçada parametrizada.
8. Após aprovação, Matheus emite o pedido de compra.
9. Matheus executa a compra e acompanha o recebimento da NF.
10. Matheus vincula nota fiscal, boleto ou dados de pagamento.
11. Matheus programa o pagamento no banco.
12. Leon libera, bloqueia, solicita correção, confirma pagamento realizado e atualiza o status final.
13. O histórico completo permanece disponível no detalhe.

## Status oficiais

- Solicitação criada.
- Aguardando cotação.
- Em cotação.
- Aguardando aprovação.
- Aprovada para compra.
- Pedido emitido.
- Compra realizada / Aguardando NF.
- NF vinculada.
- Pagamento programado no banco.
- Aguardando liberação bancária.
- Pagamento liberado.
- Pago / Concluído.
- Reprovada.
- Cancelada.
- Divergência identificada.

## Usabilidade e formulários

- Campo vê formulário técnico completo para abrir a solicitação: obra, tipo, descrição, especificação, quantidade, unidade, frente de serviço, data necessária, prioridade, justificativa de urgência, anexo opcional e observações.
- Dados automáticos de campo ficam em leitura ou ocultos: solicitante, data/hora, código da obra, cliente, centro de custo e status inicial.
- Kemilly vê dados originais em leitura e campos comerciais para até três propostas, frete, condição de pagamento, anexos, recomendação e justificativas.
- Gustavo e Leon veem comparativo de cotações, justificativas, histórico e regra de alçada aplicada.
- Matheus vê dados aprovados em leitura e preenche pedido, execução da compra, NF, boleto/dados de pagamento e programação bancária.
- Leon vê dados financeiros e anexos para liberação bancária e atualização final.
- Todos os valores financeiros exibidos em telas, tabelas, histórico e Administração devem usar Real brasileiro.
- Formulários editáveis de valor mantêm entrada numérica com duas casas decimais e identificação visual de moeda.
- Datas editáveis usam calendário HTML; histórico automático permanece somente leitura.

## Exceções

- Menos de três cotações exige justificativa.
- Compra emergencial exige justificativa e encaminhamento para Leon quando configurado.
- Alteração de fornecedor após aprovação gera divergência e encaminhamento para Leon.
- Alteração de valor após aprovação gera divergência e encaminhamento para Leon.
- Alteração relevante de quantidade ou condição de pagamento após aprovação gera divergência.
- NF divergente do pedido aprovado bloqueia continuidade normal e encaminha para Leon.
- Liberação bancária de qualquer pagamento é exclusiva de Leon.
- Matheus não pode aprovar a própria compra.

## Administração do sistema

O perfil Administrador do Sistema configura usuários, perfis, alçadas, regras especiais e parâmetros gerais. Ele é separado de Diretoria / Leon, mesmo que Leon seja o usuário inicial dos dois papéis.

Na V2.3, usuários e alçadas passam a ser dados SharePoint da webpart. O protótipo HTML V2.2 pode continuar demonstrando persistência local sem representar a fonte oficial de dados.

Usuários devem ser identificados oficialmente por `ContaMicrosoft365`, mantendo `UsuarioInternoId` obrigatório, único e indexado para vínculos internos e snapshots.

Alçadas, regras especiais e parâmetros gerais devem ser tratados como dados administrativos simulados, não como constantes fixas de regra operacional.

## Validações administrativas

- Valor final da alçada não pode ser inferior ao valor inicial.
- Aprovadores inativos não podem ser selecionados em regras ativas.
- Regras ativas não podem ter faixas sobrepostas para o mesmo processo, tipo e obra.
- Regras devem evitar lacunas de aprovação.
- Regras específicas de obra prevalecem sobre regras gerais equivalentes.
- Submissões sem regra aplicável devem ser bloqueadas.
- Matheus não pode ser configurado como aprovador de compra operacional executada por ele.
- Regras precisam ter vigência válida.
- Substituição temporária é resolvida no cadastro do usuário, não diretamente na alçada.

## Snapshot de aprovação

Ao enviar um processo para aprovação, o sistema grava a regra vigente aplicada. O processo deve manter esse snapshot no histórico, impedindo que mudanças futuras de alçada alterem decisões já submetidas, aprovadas ou concluídas.

O snapshot registra ID da regra, resumo da regra, valor submetido, aprovador base, aprovador efetivo, substituição aplicada, motivo de resolução, exceção aplicada e data/hora da submissão.

Na estrutura real do tenant, a entidade lógica `ENAC Solicitacoes` corresponde à lista física `Lista 02 — Requisições de Compra`. Essa lista deve receber futuramente o campo específico `SnapshotAprovacaoCompra`, evitando campo genérico que conflite com futuros snapshots de pagamento, medição ou liberação bancária.

`ENAC Obras` corresponde à lista física `Lista 01 - Controle de Obras ENAC`. Não criar `ENACObras`, `ENACSolicitacoes` nem `CodigoObra` na Lista 01 nesta rodada.

## Escrita operacional V2.7A

Na V2.7A, a escrita operacional permanece restrita a itens de teste `V2.7A-TESTE` e depende de flags explicitas na webpart. Cada acao deve validar usuario ativo, perfil, transicao de status, marcador de teste, campos obrigatorios e historico.

Gustavo e Leon devem aprovar conforme alcadas parametrizadas em `ENAC Alcadas`; o codigo nao deve fixar diretamente limites por pessoa. Matheus executa pedido, NF e programacao, mas nao aprova a propria compra. Kemilly atua apenas em cotacoes/contratos quando a acao estiver no escopo.
