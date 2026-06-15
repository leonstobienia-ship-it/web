# Cadastros Mestres ERP ENAC

## Papel no ERP

Os cadastros mestres sustentam os processos operacionais do ERP ENAC. Na V3.3B eles deixam de ser apenas blueprint e passam a operar localmente em PostgreSQL para validar persistencia, API e interface.

## Cadastros cobertos

### Clientes

Uso: partes contratantes, faturamento, propostas, contratos e obras.

Campos operacionais:

- `company_id`
- `nome`
- `tipo_pessoa`
- `cpf_cnpj`
- `email`
- `telefone`
- `endereco`
- `observacoes`
- `status`

### Fornecedores

Uso: compras, contratos de fornecedor, notas fiscais e contas a pagar.

Campos operacionais:

- `company_id`
- `nome`
- `tipo_pessoa`
- `cpf_cnpj`
- `categoria`
- `email`
- `telefone`
- `endereco`
- `observacoes`
- `status`

### Centros de custo

Uso: classificacao financeira e gerencial por obra, administrativo, comercial, financeiro ou operacao.

Campos operacionais:

- `company_id`
- `codigo`
- `nome`
- `tipo`
- `observacoes`
- `status`

### Obras

Uso: nucleo operacional para contratos, medicoes, compras, custos e faturamento.

Campos operacionais:

- `company_id`
- `cliente_id`
- `centro_custo_id`
- `codigo`
- `nome`
- `endereco`
- `cidade`
- `uf`
- `responsavel`
- `data_inicio_prevista`
- `data_fim_prevista`
- `valor_previsto`
- `observacoes`
- `status`

## Regras atuais

- `status` controlado: `ativo` ou `inativo`.
- `tipo_pessoa` controlado: `fisica` ou `juridica`.
- `uf` validada por sigla brasileira.
- `company_id` e chave primaria usam UUID.
- Nao ha `DELETE` fisico.
- Inativacao preserva historico e vinculos.
- Autenticacao, permissao por perfil, workflows e aprovacao ficam para etapas posteriores.

## Fonte de dados

Na V3.3B a fonte de dados dos cadastros e o PostgreSQL local `enac_erp_dev`.

SharePoint continua reservado para documentos e para a webpart historica ja validada em etapas anteriores. Esta etapa nao escreve no SharePoint.

