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

## Inventario readonly V2.3A

Os nomes internos reais de listas e campos foram inventariados em modo readonly. O mapa consolidado está em `sharepoint/mapeamento-listas-reais-v2.3.md`.

As listas operacionais físicas já existem como listas numeradas de 01 a 14. A V2.3 não deve criar `ENACObras` nem `ENACSolicitacoes`; deve mapear essas entidades para:

- `Lista 01 - Controle de Obras ENAC`.
- `Lista 02 — Requisições de Compra`.

As listas administrativas abaixo não foram encontradas e ficam previstas para criação futura após dry-run aprovado:

- `ENAC Usuarios Perfis`.
- `ENAC Alcadas`.
- `ENAC Historico Configuracoes`.
- `ENAC Snapshots Regras`.

## Ponto de atenção

O arquivo `list-schema.json` define o contrato esperado pela V2.3, agora distinguindo listas operacionais reais já existentes e listas administrativas novas.

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
- `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`: lookup futuro para `ENAC Snapshots Regras`.
- `ENAC Alcadas.Obra`: lookup futuro para `Lista 01 - Controle de Obras ENAC`, exibindo `NomedaObra`.
