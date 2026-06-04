# Listas SharePoint Existentes

O protótipo Microsoft 365 já utiliza listas e bibliotecas para operação da ENAC. Na V2.3, a webpart SPFx passa a tratar o SharePoint como fonte oficial de dados, sem provisionar listas automaticamente.

## Áreas mapeadas

- Obras.
- Requisições de material/serviço.
- Cotações.
- Pedidos e compras.
- Notas fiscais.
- Programação de pagamentos.
- Liberação bancária.
- Fornecedores e prestadores.
- Medições da obra.
- Contratos de prestadores.
- Medições de prestadores.
- Contas a pagar.
- Contas a receber.
- Mão de obra e alocação.
- Documentos e integrações.
- Pendências e ocorrências.
- Administração de usuários, perfis, alçadas e parâmetros.
- Histórico de configurações.
- Snapshots de regras aplicadas.

## Ponto de atenção

Os nomes internos reais de listas e campos devem ser confirmados antes de apontar a webpart para produção. O arquivo `list-schema.json` define o contrato esperado pela V2.3.

## Padrão de nomes internos

- Novos campos/listas devem usar nomes internos estáveis, sem espaços e sem acentos.
- Se lista ou campo já existir com nome interno diferente, não recriar automaticamente.
- Documentar o mapeamento entre nome existente e nome esperado pelo sistema.
- Preferir campos nativos `Created`, `Modified`, `Author` e `Editor` para auditoria.
- `ENAC Snapshots Regras` deve ser tratado como histórico imutável.
- `ENAC Historico Configuracoes` deve ser histórico de inclusão controlada.

## Campos críticos V2.3

- `ENAC Usuarios Perfis.UsuarioInternoId`: obrigatório, único e indexado.
- `ENAC Usuarios Perfis.ContaMicrosoft365`: Pessoa ou Grupo, uma pessoa, referência oficial do usuário autenticado.
- `ENAC Alcadas.RegraInternaId`: obrigatório, único e indexado.
- `ENAC Solicitacoes.SnapshotAprovacaoCompra`: lookup para `ENAC Snapshots Regras`.
