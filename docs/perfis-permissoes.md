# Perfis e Permissões

## Campo / Engenheiro

- Cria solicitações de material, serviço, locação ou equipamento.
- Informa descrição, especificação técnica, quantidade, unidade, frente de serviço, data necessária, prioridade, justificativa de urgência, anexos e observações.
- Consulta próprias solicitações.
- Visualiza status e histórico resumido.
- Não vê alçadas administrativas, custos internos indevidos ou dados bancários.
- Pode ser cadastrado e mantido pelo Administrador do Sistema.

## Cotações e Contratos / Kemilly

- Recebe solicitações aguardando cotação.
- Cadastra até três propostas comerciais.
- Registra fornecedores, valores, prazos, frete, condição de pagamento e anexos.
- Recomenda fornecedor e justifica a recomendação.
- Justifica cotações incompletas.
- Apoia orçamentos.
- Gerencia contratos como módulo associado ou futura expansão do MVP.
- Não aprova compras nem pagamentos.
- Pode ser selecionada como usuária ativa nas regras administrativas apenas quando a permissão correspondente existir.

## Compras e Financeiro Operacional / Matheus

- Recebe compra aprovada.
- Emite pedido de compra.
- Executa a compra.
- Vincula nota fiscal.
- Registra boleto ou dados de pagamento.
- Programa pagamento no banco.
- Acompanha itens aguardando liberação.
- Não aprova a própria compra.
- Não libera pagamento bancário.
- Deve registrar divergência quando houver alteração de fornecedor, valor aprovado, quantidade relevante ou condição de pagamento.
- Não pode ser selecionado como aprovador de compra operacional executada por ele.

## Planejamento / Gustavo

- Analisa tecnicamente solicitações quando necessário.
- Aprova compras conforme alçada parametrizada pelo administrador.
- Acompanha solicitações e cotações da operação.
- Não registra nota fiscal, não programa pagamento e não libera banco.

## Diretoria / Leon

- Aprova compras conforme alçada parametrizada.
- Aprova exceções e divergências.
- Libera pagamentos bancários.
- Bloqueia ou solicita correção de pagamentos.
- Confirma pagamento realizado.
- Atualiza status finais.
- Visualiza painel executivo, histórico completo e últimas alterações administrativas.

## Administrador do Sistema / Leon

- Configura usuários e perfis.
- Configura alçadas parametrizáveis.
- Configura regras especiais.
- Configura parâmetros gerais do sistema.
- Consulta histórico de configurações.
- Permanece conceitualmente separado de Diretoria / Leon, embora o usuário inicial seja Leon nos dois papéis.
- Cadastra, edita, ativa/desativa usuários e define substitutos temporários.
- Cadastra, edita, ativa/desativa alçadas vinculadas aos usuários ativos.

## Identificação e seleção de usuários

- `ContaMicrosoft365` é a referência oficial para resolver o usuário autenticado.
- `EmailCorporativo` permanece para consulta e snapshots, mas não deve ser usado sozinho como identidade oficial.
- `UsuarioInternoId` deve ser obrigatório, único e indexado.
- Usuários inativos não podem ser selecionados para novas alçadas ou novas aprovações.
- Auditoria de criação/alteração deve preferir `Created`, `Modified`, `Author` e `Editor` nativos do SharePoint.

## V2.7A - bloqueio por perfil na escrita

Na V2.7A, a webpart deve consultar o usuario autenticado em `ENAC Usuarios Perfis` e bloquear escrita se o usuario estiver inativo, sem perfil compativel ou fora das flags de teste. Botoes ocultos nao sao considerados controle suficiente: os metodos de escrita tambem validam permissao.

A matriz detalhada esta em `docs/v2.7a-matriz-acoes-por-perfil.md`.
