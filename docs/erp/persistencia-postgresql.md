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

`migrate` executa `database/migrations/001_init_core.sql` apenas se `schema_migrations` ainda nao tiver `001_init_core`.

`seed` cria:

- empresa ENAC DEV;
- perfis DIRETORIA, PLANEJAMENTO, COMPRAS, FINANCEIRO e ENGENHARIA;
- usuarios leon.dev, gustavo.dev, matheus.dev e kemilly.dev;
- cliente dev;
- fornecedor dev;
- obra dev;
- centros de custo dev.

## Endpoints somente leitura

| Endpoint | Origem |
|---|---|
| `GET /empresas` | `empresas` |
| `GET /usuarios` | `usuarios` + `perfis` |
| `GET /clientes` | `clientes` |
| `GET /fornecedores` | `fornecedores` |
| `GET /obras` | `obras` + `clientes` + `centros_custo` |
| `GET /centros-custo` | `centros_custo` |

Escrita via API permanece fora do escopo da V3.3A.
