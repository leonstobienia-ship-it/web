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
