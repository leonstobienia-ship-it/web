# Plano de Provisionamento SharePoint V2.3

## Premissas

- Não presumir que listas ou nomes internos já existem.
- Não recriar automaticamente listas/campos existentes.
- Validar nomes internos antes de apontar a webpart para produção.
- Não implementar Power Automate nesta rodada.

## Listas a validar

1. `ENAC Obras`
2. `ENAC Solicitacoes`
3. `ENAC Cotacoes`
4. `ENAC Pedidos Compra`
5. `ENAC Notas Fiscais`
6. `ENAC Programacoes Bancarias`
7. `ENAC Liberacoes Bancarias`
8. `ENAC Historico Processo`
9. `ENAC Usuarios Perfis`
10. `ENAC Alcadas`
11. `ENAC Regras Especiais`
12. `ENAC Parametros Gerais`
13. `ENAC Historico Configuracoes`
14. `ENAC Snapshots Regras`

## Listas novas prováveis

- `ENAC Snapshots Regras`, se ainda não existir.
- `ENAC Usuarios Perfis`, caso o cadastro atual esteja espalhado ou exista apenas em formulário.
- `ENAC Alcadas`, caso as regras atuais estejam fixas em Power Automate/listas antigas.

## Ordem de criação

1. Criar/validar `ENAC Obras`.
2. Criar/validar `ENAC Usuarios Perfis`.
3. Criar/validar `ENAC Alcadas`, com lookups/pessoas para aprovadores.
4. Criar/validar listas operacionais: solicitações, cotações, pedidos, NF, programação e liberação.
5. Criar/validar `ENAC Snapshots Regras`.
6. Criar lookup `ENAC Solicitacoes.SnapshotAprovacaoCompra` para `ENAC Snapshots Regras`.
7. Criar/validar históricos e parâmetros.
8. Configurar permissões SharePoint.

## Colunas críticas a criar ou ajustar

### ENAC Usuarios Perfis

- `UsuarioInternoId`: texto, obrigatório, único, indexado.
- `ContaMicrosoft365`: Pessoa ou Grupo, uma pessoa.
- `UsuarioAtivo`: Sim/Não.
- `SubstitutoTemporario`: Pessoa/lookup conforme decisão do tenant.
- `InicioSubstituicao`: data/hora.
- `FimSubstituicao`: data/hora.

### ENAC Alcadas

- `RegraInternaId`: texto, obrigatório, único, indexado.
- `Processo`: escolha.
- `TipoSolicitacao`: escolha.
- `Obra`: lookup para obra ou texto controlado “Todas”.
- `ValorMinimo`, `ValorMaximo`, `Ilimitado`.
- `AprovadorPrincipal`: Pessoa ou Grupo, uma pessoa.
- `AprovadorAdicional`: Pessoa ou Grupo, uma pessoa, opcional.
- `VigenciaInicial`, `VigenciaFinal`, `Ativo`.

### ENAC Snapshots Regras

- Campos de regra e valor.
- Campos de aprovador base.
- Campos de aprovador efetivo.
- `SubstituicaoAplicada`.
- `MotivoResolucaoAprovador`.
- `MotivoExcecao`.
- `DataHoraAplicacao`.

### ENAC Solicitacoes

- `SnapshotAprovacaoCompra`: lookup para `ENAC Snapshots Regras`.

## Mapeamento de nomes existentes

Antes de gravar dados:

1. Exportar nomes internos reais das listas existentes.
2. Comparar com `sharepoint/list-schema.json`.
3. Registrar divergências.
4. Adaptar `SharePointEnacRepository.ts` para nomes reais, se necessário.

## Permissões

- Administração de usuários e alçadas: apenas Administrador do Sistema.
- Histórico de configurações: inclusão controlada, sem edição comum.
- Snapshots: criação pelo sistema, sem edição comum.
- Listas operacionais: permissões por perfil ainda pendentes de desenho final.
