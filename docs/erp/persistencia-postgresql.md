# Persistencia PostgreSQL do ERP ENAC

## Principios V3.3A

- PostgreSQL local e fonte de validacao tecnica, nao ambiente de producao.
- O backend usa pool de conexoes (`pg.Pool`) com limite pequeno (`PG_POOL_MAX=5`) para desenvolvimento.
- Migrations sao executadas por script controlado e registradas em `schema_migrations`.
- Seeds sao idempotentes e marcadas com `DEV_LOCAL_V3_3A`.
- A conexao aceita apenas `localhost`, `127.0.0.1` ou `::1` e database `enac_erp_dev`.
- Backend local rodando diretamente no Windows/host deve usar `127.0.0.1:5432` ou `localhost:5432`.
- Hostname `postgres` deve ser usado apenas quando o backend tambem estiver em container na rede Docker Compose.
- `.env` e qualquer segredo local nunca devem ser commitados.

## Variaveis

| Variavel | Uso |
|---|---|
| `DATABASE_URL` | String de conexao preferencial |
| `POSTGRES_HOST` | Host local quando `DATABASE_URL` nao estiver definida |
| `POSTGRES_PORT` | Porta local, padrao `5432` |
| `POSTGRES_DB` | Banco local, padrao `enac_erp_dev` |
| `POSTGRES_USER` | Usuario local |
| `POSTGRES_PASSWORD` | Senha local de desenvolvimento |
| `PG_POOL_MAX` | Limite de conexoes no pool |
| `PG_IDLE_TIMEOUT_MS` | Timeout de conexao ociosa |
| `PG_CONNECTION_TIMEOUT_MS` | Timeout para abrir conexao |

## Host correto por cenário

| Cenario | Host recomendado no `DATABASE_URL` |
|---|---|
| Backend rodando no Windows/host | `127.0.0.1:5432` ou `localhost:5432` |
| Backend rodando em container na mesma rede Compose | `postgres:5432` |

Exemplo para backend local no Windows/host:

```text
DATABASE_URL=postgres://enac_erp_dev:enac_erp_dev_password@127.0.0.1:5432/enac_erp_dev
```

Exemplo apenas para backend em container Compose:

```text
DATABASE_URL=postgres://enac_erp_dev:enac_erp_dev_password@postgres:5432/enac_erp_dev
```

## Scripts

No diretorio `server`:

```powershell
npm run migrate
npm run seed
```

`migrate` executa todas as migrations `database/migrations/*.sql` em ordem, registrando cada uma em `schema_migrations`.

Migrations atuais:

- `001_init_core`: fundacao do modelo ERP.
- `002_cadastros_mestres`: campos e validacoes para clientes, fornecedores, centros de custo e obras.
- `004_solicitacoes_compra_mvp`: cabecalho, itens, status e indices da Solicitacao de Compra MVP.
- `005_cotacoes_mapa_comparativo`: primeira base de cotacoes e itens cotados.
- `006_cotacoes_fluxo_formal_v34b`: cotacao agregada, fornecedores participantes e mapa comparativo formal.
- `007_pedidos_compra_mvp`: pedido de compra MVP e itens herdados da cotacao vencedora.

Nao ha migration `003` na V3.3C porque as restricoes de duplicidade dos cadastros mestres ja existem nas migrations anteriores.

`seed` cria:

- empresa ENAC DEV;
- perfis DIRETORIA, PLANEJAMENTO, COMPRAS, FINANCEIRO e ENGENHARIA;
- usuarios leon.dev, gustavo.dev, matheus.dev e kemilly.dev;
- cliente dev;
- fornecedor dev;
- obra dev;
- centros de custo dev.

## Endpoints V3.3A somente leitura

| Endpoint | Origem |
|---|---|
| `GET /empresas` | `empresas` |
| `GET /usuarios` | `usuarios` + `perfis` |
| `GET /clientes` | `clientes` |
| `GET /fornecedores` | `fornecedores` |
| `GET /obras` | `obras` + `clientes` + `centros_custo` |
| `GET /centros-custo` | `centros_custo` |

Escrita via API permanece fora do escopo da V3.3A.

## Escrita local V3.3B

A V3.3B libera escrita apenas para cadastros mestres no PostgreSQL local:

- clientes;
- fornecedores;
- centros de custo;
- obras.

Operacoes permitidas:

- `GET`
- `POST`
- `PATCH`
- `PATCH /:id/inativar`
- `PATCH /:id/reativar`

Nao existe `DELETE` fisico. Inativacao e reativacao sao feitas por `status`.

As queries usam parametros do `pg` e o backend valida campos obrigatorios, UUID, `status`, `tipo_pessoa`, UF, datas e numeros antes de gravar.

## Solicitacao de Compra V3.4A

A V3.4A libera escrita local apenas para Solicitacao de Compra MVP:

- cabecalho em `solicitacoes_compra`;
- itens em `solicitacoes_compra_itens`;
- transicoes iniciais de status;
- edicao sem `DELETE` fisico.

Endpoints:

| Endpoint | Uso |
|---|---|
| `GET /solicitacoes-compra` | Lista solicitacoes, com filtros opcionais por `status`, `prioridade` e `obra_id` |
| `GET /solicitacoes-compra/:id` | Detalhe com itens ativos |
| `POST /solicitacoes-compra` | Cria rascunho com itens |
| `PATCH /solicitacoes-compra/:id` | Atualiza solicitacao editavel |
| `PATCH /solicitacoes-compra/:id/enviar` | `RASCUNHO -> ENVIADA` |
| `PATCH /solicitacoes-compra/:id/em-analise` | `ENVIADA -> EM_ANALISE` |
| `PATCH /solicitacoes-compra/:id/devolver` | `EM_ANALISE -> DEVOLVIDA` |
| `PATCH /solicitacoes-compra/:id/reabrir-rascunho` | `DEVOLVIDA -> RASCUNHO` |
| `PATCH /solicitacoes-compra/:id/cancelar` | Cancela `RASCUNHO`, `ENVIADA` ou `EM_ANALISE` |

Status controlados:

- `RASCUNHO`
- `ENVIADA`
- `EM_ANALISE`
- `APROVADA_PARA_COTACAO`
- `DEVOLVIDA`
- `CANCELADA`

`APROVADA_PARA_COTACAO` fica reservado para etapa futura. A V3.4A nao implementa cotacao, pedido de compra, nota fiscal, financeiro ou aprovacao por alcada.

Smoke test:

```powershell
cd server
npm.cmd run smoke:solicitacoes
```

O smoke cria registro local com marcador `DEV_LOCAL_V3_4A` e executa as transicoes permitidas ate `CANCELADA`.

## Cotacao e Mapa Comparativo V3.4B

A V3.4B libera escrita local para o processo de cotacao vinculado a solicitacoes de compra:

- cabecalho do processo em `cotacoes`;
- fornecedores participantes em `cotacoes_fornecedores`;
- valores por item e fornecedor em `cotacoes_itens`;
- consolidacao e vencedor em `mapa_comparativo_cotacao`;
- transicoes de status sem `DELETE` fisico.

Endpoints:

| Endpoint | Uso |
|---|---|
| `GET /cotacoes` | Lista cotacoes, com filtros opcionais por `solicitacao_id` e `status` |
| `GET /cotacoes/:id` | Detalhe com fornecedores e itens |
| `POST /cotacoes` | Cria cotacao em `RASCUNHO` com fornecedores participantes |
| `PATCH /cotacoes/:id` | Atualiza cabecalho editavel |
| `PATCH /cotacoes/:id/enviar-fornecedores` | `RASCUNHO -> ENVIADA_FORNECEDORES` |
| `PATCH /cotacoes/:id/registrar-respostas` | `ENVIADA_FORNECEDORES -> RESPOSTAS_RECEBIDAS` |
| `PATCH /cotacoes/:id/gerar-mapa` | `RESPOSTAS_RECEBIDAS -> MAPA_GERADO` |
| `PATCH /cotacoes/:id/escolher-fornecedor` | `MAPA_GERADO -> FORNECEDOR_ESCOLHIDO` |
| `PATCH /cotacoes/:id/cancelar` | Cancela status permitido |
| `GET /cotacoes/mapa-comparativo?cotacao_id=<uuid>` | Retorna comparativo por item e resumo |
| `GET /cotacoes/mapa-comparativo?solicitacao_id=<uuid>` | Retorna o ultimo mapa da solicitacao |

Status controlados:

- `RASCUNHO`
- `ENVIADA_FORNECEDORES`
- `RESPOSTAS_RECEBIDAS`
- `MAPA_GERADO`
- `FORNECEDOR_ESCOLHIDO`
- `CANCELADA`

`FORNECEDOR_ESCOLHIDO` nao cria pedido de compra. Pedido de compra fica para V3.4C.

Smoke test:

```powershell
cd server
npm.cmd run smoke:cotacoes
```

O smoke cria dados locais com marcador `DEV_LOCAL_V3_4B`, cria uma cotacao formal com dois fornecedores, registra respostas, valida o mapa comparativo e escolhe o fornecedor vencedor.

## Pedido de Compra V3.4C

A V3.4C libera escrita local para Pedido de Compra gerado a partir de cotacao com fornecedor vencedor:

- cabecalho em `pedidos_compra`;
- itens em `pedidos_compra_itens`;
- heranca de solicitacao, cotacao, fornecedor, obra e centro de custo;
- bloqueio de pedido ativo duplicado por cotacao;
- transicoes de status sem `DELETE` fisico.

Endpoints:

| Endpoint | Uso |
|---|---|
| `GET /pedidos-compra` | Lista pedidos, com filtros opcionais por `status`, `fornecedor_id`, `obra_id` e `centro_custo_id` |
| `GET /pedidos-compra/:id` | Detalhe com itens herdados |
| `POST /pedidos-compra/gerar-da-cotacao` | Gera pedido `RASCUNHO` a partir de cotacao vencedora |
| `PATCH /pedidos-compra/:id` | Atualiza campos basicos enquanto `RASCUNHO` |
| `PATCH /pedidos-compra/:id/emitir` | `RASCUNHO -> EMITIDO` |
| `PATCH /pedidos-compra/:id/enviar-fornecedor` | `EMITIDO -> ENVIADO_FORNECEDOR` |
| `PATCH /pedidos-compra/:id/confirmar` | `ENVIADO_FORNECEDOR -> CONFIRMADO` |
| `PATCH /pedidos-compra/:id/cancelar` | Cancela status permitido |

Status controlados:

- `RASCUNHO`
- `EMITIDO`
- `ENVIADO_FORNECEDOR`
- `CONFIRMADO`
- `PARCIALMENTE_RECEBIDO`
- `RECEBIDO`
- `CANCELADO`

`PARCIALMENTE_RECEBIDO` e `RECEBIDO` ficam reservados para etapa futura. A V3.4C nao implementa recebimento, nota fiscal, contas a pagar, programacao bancaria ou pagamento.

Smoke test:

```powershell
cd server
npm.cmd run smoke:pedidos
```

O smoke cria dados locais com marcador `DEV_LOCAL_V3_4C`, gera pedido a partir de cotacao vencedora, valida itens herdados, executa transicoes ate `CONFIRMADO` e valida duplicidade com `409`.

## Estabilizacao V3.3C

O carregamento de ambiente do backend passou a resolver `.env` por caminho absoluto:

- raiz do projeto: `.env`;
- diretorio `server`: `server/.env`.

Arquivos `.env` sao carregados apenas fora de `NODE_ENV=production` e nao sobrescrevem variaveis ja presentes em `process.env`. Assim, `DATABASE_URL` explicita na sessao continua tendo prioridade.

Quando nao ha `DATABASE_URL` explicita antes do carregamento do `.env`, o backend monta a conexao a partir de `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD`. Isso reduz fragilidade quando um `DATABASE_URL` local ficou desalinhado dos campos do container.

## Troubleshooting de conexao

Sintoma: `/health/db` retorna `503` com PostgreSQL aparentemente healthy.

Verifique:

- Backend no Windows/host deve usar `127.0.0.1:5432` ou `localhost:5432`.
- Backend em container Compose deve usar `postgres:5432`.
- O database deve continuar `enac_erp_dev`.
- A senha do `.env` local deve ser a mesma usada quando o container/volume foi criado.
- A API precisa ser reiniciada depois de corrigir `.env`.
- Se `DATABASE_URL` foi exportada explicitamente na sessao, ela vence sobre `.env`; feche a sessao ou remova a variavel para validar apenas o `.env`.

Comandos uteis:

```powershell
docker compose ps
cd server
npm.cmd start
Invoke-RestMethod http://127.0.0.1:3333/health/db
```

Se houver divergencia de senha entre `.env` e container ja existente, ajuste apenas o `.env` local ou recrie o volume local de desenvolvimento. Nao commitar `.env`.
