# Plano de Provisionamento SharePoint V2.3

## Premissas

- O inventario readonly V2.3A confirmou listas operacionais numeradas já existentes.
- Não recriar automaticamente listas/campos existentes.
- Validar nomes internos antes de apontar a webpart para produção.
- Não implementar Power Automate nesta rodada.
- O aplicativo readonly atual serve apenas para inventário e dry-run de leitura.

## Listas a validar

1. `Lista 01 - Controle de Obras ENAC`
2. `Lista 02 — Requisições de Compra`
3. `Lista 03 — Pedidos de Compra`
4. `Lista 04 - Notas Fiscais Recebidas`
5. `05 — Contas a Pagar`
6. `Lista 10 — Contas a Pagar / Programação Financeira`
7. Demais listas operacionais 06 a 14 conforme `mapeamento-listas-reais-v2.3.md`
8. Bibliotecas padrão do site, apenas se forem referenciadas por campos URL/anexo
9. `ENAC Usuarios Perfis`
10. `ENAC Alcadas`
11. `ENAC Historico Configuracoes`
12. `ENAC Snapshots Regras`

## Listas novas prováveis

- `ENAC Usuarios Perfis`.
- `ENAC Alcadas`.
- `ENAC Historico Configuracoes`.
- `ENAC Snapshots Regras`.

Não criar `ENACObras`, `ENAC Obras`, `ENACSolicitacoes` ou `ENAC Solicitacoes` como listas físicas nesta rodada.

## Ordem de criação

1. Validar `Lista 01 - Controle de Obras ENAC`.
2. Validar `Lista 02 — Requisições de Compra`.
3. Criar/validar `ENAC Usuarios Perfis`.
4. Criar/validar `ENAC Alcadas`, com lookup de obra para a Lista 01.
5. Criar/validar `ENAC Historico Configuracoes`.
6. Criar/validar `ENAC Snapshots Regras`.
7. Criar lookup `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra` para `ENAC Snapshots Regras`.
8. Configurar permissões SharePoint somente em rodada futura autorizada.

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
- `Obra`: lookup para `Lista 01 - Controle de Obras ENAC` / `NomedaObra`, com regra geral controlada.
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

### Lista 02 — Requisições de Compra

- `SnapshotAprovacaoCompra`: lookup para `ENAC Snapshots Regras`.

## Mapeamento de nomes existentes

Antes de gravar dados:

1. Usar `sharepoint/mapeamento-listas-reais-v2.3.md` como referência física.
2. Comparar com `sharepoint/list-schema.json`.
3. Registrar divergências no dry-run.
4. Adaptar `SharePointEnacRepository.ts` para nomes reais somente após provisionamento aprovado.

## Permissões

- Administração de usuários e alçadas: apenas Administrador do Sistema.
- Histórico de configurações: inclusão controlada, sem edição comum.
- Snapshots: criação pelo sistema, sem edição comum.
- Listas operacionais: permissões por perfil ainda pendentes de desenho final.
