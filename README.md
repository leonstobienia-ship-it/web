# Sistema Operacional ENAC

Projeto inicial do sistema operacional interno da ENAC Empreendimentos, Construção e Comércio Ltda.

Esta base é própria da ENAC e não utiliza arquivos, regras, módulos ou identidade do projeto Sistema SM. O objetivo desta etapa é estruturar documentação, modelo de dados, fundação SPFx/React e um protótipo navegável com dados simulados.

## Escopo do MVP

O MVP cobre o fluxo vertical de compras e pagamento:

`Solicitação da obra -> cotação -> aprovação parametrizada -> pedido de compra -> execução da compra -> nota fiscal -> programação bancária -> liberação bancária -> pagamento concluído`

Os demais processos validados no Microsoft 365 permanecem documentados como contexto e backlog, sem implementação completa nesta fase.

## Arquitetura prevista

- SPFx com React.
- Publicação futura como aba no Microsoft Teams.
- Protótipo atual preservado como V2.2 homologada, sem redesenho de interface.
- Persistência local do protótipo via `localStorage` para usuários, alçadas e histórico administrativo.
- SharePoint como fonte oficial de dados da V2.3 na webpart SPFx.
- Camada de serviços isolando acesso real aos dados em `SharePointEnacRepository.ts`.
- Administração / Configurações como fonte única simulada de usuários, perfis, alçadas, regras especiais e parâmetros gerais.

## V3.0 - Portal web

Na V3.0A, o Sistema ENAC passou a ter um host web Vite/React independente da webpart, com autenticação Microsoft Entra via MSAL e leitura SharePoint REST em modo readonly. O portal preserva a base visual e funcional existente, mas cadastros e solicitações ainda não eram persistidos nas listas quando operados pela tela web.

Na V3.0B, foi preparada a primeira escrita controlada do portal web: criação de nova requisição de compra na `Lista 02 — Requisições de Compra`, usando obras reais lidas da `Lista 01 - Controle de Obras ENAC` para preencher o lookup `ObraId`. A escrita permanece desabilitada por padrão e exige flags de teste, marcador `V3.0B-WEB-TESTE`, confirmação manual e aplicativo/escopo Entra com permissão delegada de escrita. Power Automate, cargas reais amplas, alterações de listas/permissões e demais ações operacionais continuam fora do escopo.

Na configuração do app write V3.0b, o projeto local passou a usar o app `ENAC Sistema - Write V3.0b` (`0df147e7-ab5c-407d-b1b1-bb350661bebf`) com escopo delegado `SharePoint / AllSites.Write`, preservando o app readonly `0dab19b3-8e48-4f89-ad94-1446b08d3781`. O validador local `scripts/web/validar-config-v3.0b.ps1` deve retornar `Status = OK`, `ClientIdWrite = true`, `ScopeWrite = true` e `Issues = []` antes de qualquer teste manual de escrita. O app write ainda precisa ter `http://localhost:5173/` cadastrado como Redirect URI SPA quando o Entra retornar `AADSTS500113`.

Na V3.0C, foi executado o primeiro teste real controlado de escrita do portal web. Foi criado um unico item de teste na `Lista 02 — Requisições de Compra`, ID `13`, com titulo `V3.0B-WEB-TESTE - TESTE_V3_0C_NAO_OPERACIONAL - validacao minima`, status `Recebida`, quantidade `1.11` e sem anexos. O item foi confirmado em modo readonly pelo formulario de exibicao do SharePoint. Nao houve `DELETE`, automacao, Power Automate, pedido, nota fiscal, conta a pagar, aprovacao ou etapa operacional posterior.

Na correcao pos-validacao da V3.0C, a aba `Requisições` passou a carregar os itens reais da Lista 02 apos reload, usando `listarSolicitacoes()` no reposititorio SharePoint. A falha observada era de leitura da interface, nao de gravacao: o item `REQ-13` existia no SharePoint, mas a tela detalhada ainda usava apenas dados locais iniciais.

Na V3.0D, a mesma correcao de leitura apos reload foi estendida para as listas cadastrais ja exibidas na interface: Clientes passam a ser derivados das obras reais da `Lista 01 - Controle de Obras ENAC`, Obras usam a Lista 01 real e Fornecedores usam a `Lista 06 - Fornecedores e Prestadores`. Administracao, usuarios, alcadas, historico e requisicoes mantem a leitura SharePoint ja existente. Nao houve nova escrita, alteracao de permissao, alteracao de listas/colunas, Power Automate ou criacao de novas telas.

## V3.2 - Fundação Operacional ERP

A V3.2 cria a fundação técnica para sair do blueprint V3.1 e preparar o ERP ENAC real com React, Node.js, PostgreSQL, Entra ID e SharePoint documental. A etapa não substitui o sistema atual, não executa escrita real no SharePoint, não altera permissões Entra, não cria automações e não aplica migration em produção.

Objetivo da V3.2:

- Separar a futura arquitetura modular do frontend.
- Criar backend mínimo em Node.js/TypeScript.
- Criar modelo inicial PostgreSQL em migration versionada.
- Criar modelos TypeScript iniciais das entidades do ERP.
- Documentar diagnóstico, módulos MVP, modelo de dados e checklist de aceite.

Estrutura criada:

```text
web/src/app
web/src/components
web/src/features
web/src/layouts
web/src/pages
web/src/services
web/src/types
web/src/utils
server/src
server/src/config
server/src/db
server/src/auth
server/src/modules
database/migrations
database/schema
docs/erp
tests/erp
```

Frontend:

```powershell
npm run web:dev
npm run web:build
```

Backend:

```powershell
cd server
npm install
npm run build
npm start
```

Endpoint inicial:

```http
GET /health
```

Retorno esperado:

```json
{
  "status": "ok",
  "service": "enac-erp-api",
  "timestamp": "ISO-8601",
  "environment": "development"
}
```

PostgreSQL:

- Migration inicial: `database/migrations/001_init_core.sql`.
- Documentação de schema: `database/schema/v3.2-modelo-inicial.md`.
- Status: preparado para ambiente local/controlado, ainda não aplicado em produção.
- A V3.2 não exige `DATABASE_URL`; o backend apenas informa se a variável está configurada.

Próximos passos:

- Extrair gradualmente o portal V3.1 de `web/src/main.tsx` para páginas/layouts/features.
- Criar ambiente PostgreSQL local seguro e validar a migration.
- Definir RLS, auditoria append-only e outbox antes de integrações externas.
- Implementar endpoints reais de cadastros mestres.
- Planejar migração controlada das listas/planilhas existentes sem interromper a operação atual.

## V3.3A - PostgreSQL local

A V3.3A prepara a validacao local da persistencia PostgreSQL do ERP ENAC. O banco esperado e local, via Docker, com database `enac_erp_dev` e seeds marcados como `DEV_LOCAL_V3_3A`.

Validação local concluída na V3.3A.1:

- Docker Compose subiu o container `enac-erp-postgres-dev`.
- PostgreSQL local ficou `healthy`.
- Backend Node rodou em `http://127.0.0.1:3333`.
- `/health` e `/health/db` retornaram `200 OK`.
- Endpoints de leitura retornaram dados locais com marcador `DEV_LOCAL_V3_3A`.

Subir PostgreSQL local:

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
docker compose ps
```

Configurar `.env` local:

- Use `.env.example` como base.
- Mantenha `DATABASE_URL` apontando para `127.0.0.1` e database `enac_erp_dev`.
- Use `postgres:5432` apenas se o backend tambem estiver em container na rede Docker Compose.
- Nao commitar `.env`.

Rodar migration e seed:

```powershell
cd server
npm install
npm run migrate
npm run seed
```

Rodar API:

```powershell
cd server
npm run build
npm start
```

Testar saude:

```powershell
Invoke-RestMethod http://127.0.0.1:3333/health
Invoke-RestMethod http://127.0.0.1:3333/health/db
```

Testar endpoints de leitura:

```powershell
Invoke-RestMethod http://127.0.0.1:3333/empresas
Invoke-RestMethod http://127.0.0.1:3333/usuarios
Invoke-RestMethod http://127.0.0.1:3333/clientes
Invoke-RestMethod http://127.0.0.1:3333/fornecedores
Invoke-RestMethod http://127.0.0.1:3333/obras
Invoke-RestMethod http://127.0.0.1:3333/centros-custo
```

Seguranca da V3.3A:

- A API bloqueia `DATABASE_URL` que nao seja local e que nao use `enac_erp_dev`.
- Nao ha POST/PUT/PATCH/DELETE.
- Nao ha escrita SharePoint.
- Nao ha alteracao Entra.
- Nao ha automacoes.

## V3.3B - Cadastros mestres operacionais

A V3.3B transforma clientes, fornecedores, centros de custo e obras em cadastros operacionais locais do ERP ENAC. A fonte de dados continua sendo o PostgreSQL local `enac_erp_dev`; nao ha SharePoint, Entra, automacoes, banco de producao ou `DELETE` fisico nesta etapa.

Rodar backend:

```powershell
cd server
npm install
npm run migrate
npm run build
npm start
```

Rodar frontend:

```powershell
npm run web:dev
```

Configure o frontend local com:

```text
VITE_ENAC_ERP_API_BASE_URL=http://127.0.0.1:3333
```

Testar saude:

```powershell
Invoke-RestMethod http://127.0.0.1:3333/health
Invoke-RestMethod http://127.0.0.1:3333/health/db
```

Endpoints de cadastros:

```text
GET    /clientes
GET    /clientes/:id
POST   /clientes
PATCH  /clientes/:id
PATCH  /clientes/:id/inativar
PATCH  /clientes/:id/reativar

GET    /fornecedores
GET    /fornecedores/:id
POST   /fornecedores
PATCH  /fornecedores/:id
PATCH  /fornecedores/:id/inativar
PATCH  /fornecedores/:id/reativar

GET    /centros-custo
GET    /centros-custo/:id
POST   /centros-custo
PATCH  /centros-custo/:id
PATCH  /centros-custo/:id/inativar
PATCH  /centros-custo/:id/reativar

GET    /obras
GET    /obras/:id
POST   /obras
PATCH  /obras/:id
PATCH  /obras/:id/inativar
PATCH  /obras/:id/reativar
```

Testar cadastros no frontend:

1. Suba o PostgreSQL local com `docker compose up -d postgres`.
2. Rode `npm run migrate` no diretorio `server`.
3. Rode `npm start` no diretorio `server`.
4. Rode `npm run web:dev` na raiz.
5. Abra a aba `Cadastros` e valide clientes, fornecedores, centros de custo e obras.

Todos os dados de teste da V3.3B devem conter o marcador `DEV_LOCAL_V3_3B`. `.env` permanece local e ignorado.

## V3.3C - Estabilizacao dos cadastros

A V3.3C estabiliza o ambiente local e os cadastros mestres antes de qualquer modulo de compras. Nao ha SharePoint, Entra, automacoes, banco de producao, modulo de compras ou `DELETE` fisico.

Carregamento de `.env`:

- `process.env.DATABASE_URL` explicito tem prioridade.
- Em desenvolvimento, o backend carrega `.env` da raiz do projeto e `server/.env` por caminho absoluto.
- Sem `DATABASE_URL` explicito na sessao, a conexao local e montada pelos campos `POSTGRES_*` do `.env`.
- Em `NODE_ENV=production`, `.env` nao e carregado automaticamente.
- `.env` real permanece local e ignorado.

Para backend no Windows/host:

```text
DATABASE_URL=postgres://enac_erp_dev:enac_erp_dev_password@127.0.0.1:5432/enac_erp_dev
```

Para backend em container na rede Docker Compose:

```text
DATABASE_URL=postgres://enac_erp_dev:enac_erp_dev_password@postgres:5432/enac_erp_dev
```

Smoke test de cadastros, com API ja rodando:

```powershell
cd server
npm.cmd run smoke:cadastros
```

Troubleshooting de `GET /health/db` retornando `503`:

- confirme `docker compose ps`;
- confirme que o backend no Windows/host usa `127.0.0.1` ou `localhost`, nao `postgres`;
- confirme que a senha no `.env` local e a mesma usada pelo container/volume PostgreSQL existente;
- reinicie a API apos corrigir ambiente local.

## V3.4A - Solicitação de Compra MVP

A V3.4A implementa o MVP de Solicitação de Compra do ERP ENAC em PostgreSQL local, com backend Node/TypeScript e tela React. A etapa não implementa cotação, pedido de compra, nota fiscal, financeiro, aprovação por alçada, SharePoint, Entra, automações ou `DELETE` físico.

Aplicar migrations locais:

```powershell
docker compose up -d postgres
cd server
npm.cmd run migrate
```

Rodar backend:

```powershell
cd server
npm.cmd run build
npm.cmd start
```

Rodar frontend:

```powershell
npm.cmd run web:dev
```

Configure o frontend local com:

```text
VITE_ENAC_ERP_API_BASE_URL=http://127.0.0.1:3333
```

Endpoints de Solicitação de Compra:

```text
GET    /solicitacoes-compra
GET    /solicitacoes-compra/:id
POST   /solicitacoes-compra
PATCH  /solicitacoes-compra/:id
PATCH  /solicitacoes-compra/:id/enviar
PATCH  /solicitacoes-compra/:id/em-analise
PATCH  /solicitacoes-compra/:id/devolver
PATCH  /solicitacoes-compra/:id/reabrir-rascunho
PATCH  /solicitacoes-compra/:id/cancelar
```

Fluxo V3.4A:

```text
RASCUNHO -> ENVIADA -> EM_ANALISE -> DEVOLVIDA -> RASCUNHO
RASCUNHO | ENVIADA | EM_ANALISE -> CANCELADA
```

`APROVADA_PARA_COTACAO` existe no enum, mas não é usado operacionalmente nesta etapa.

Smoke test:

```powershell
cd server
npm.cmd run smoke:solicitacoes
```

O smoke cria uma solicitação local com 2 itens e marcador `DEV_LOCAL_V3_4A`, testa leitura e transições até `CANCELADA`.

Teste manual do frontend:

1. Suba PostgreSQL local e backend.
2. Rode `npm.cmd run web:dev`.
3. Abra `http://127.0.0.1:5173`.
4. Acesse `Solicitações de Compra`.
5. Crie uma solicitação `DEV_LOCAL_V3_4A` com 2 itens.
6. Edite enquanto estiver em rascunho.
7. Envie, marque em análise, devolva, reabra e cancele.
8. Confirme que solicitação cancelada não permite edição.

## V3.4B - Cotação e mapa comparativo

A V3.4B implementa a cotação local como processo agregado vinculado à solicitação de compra. A cotação nasce em `RASCUNHO`, recebe fornecedores participantes, registra respostas por item, gera mapa comparativo e permite escolher o fornecedor vencedor com justificativa. A etapa não implementa pedido de compra, nota fiscal, financeiro, aprovação por alçada, SharePoint, Entra, automações ou `DELETE` físico.

Aplicar migrations locais:

```powershell
docker compose up -d postgres
cd server
npm.cmd run migrate
```

Rodar backend:

```powershell
cd server
npm.cmd run build
npm.cmd start
```

Rodar frontend:

```powershell
npm.cmd run web:dev
```

Endpoints de cotação:

```text
GET    /cotacoes
GET    /cotacoes/:id
POST   /cotacoes
PATCH  /cotacoes/:id
PATCH  /cotacoes/:id/enviar-fornecedores
PATCH  /cotacoes/:id/registrar-respostas
PATCH  /cotacoes/:id/gerar-mapa
PATCH  /cotacoes/:id/escolher-fornecedor
PATCH  /cotacoes/:id/cancelar
GET    /cotacoes/mapa-comparativo?cotacao_id=<uuid>
GET    /cotacoes/mapa-comparativo?solicitacao_id=<uuid>
```

Fluxo V3.4B:

```text
Solicitação -> Cotação RASCUNHO
RASCUNHO -> ENVIADA_FORNECEDORES
ENVIADA_FORNECEDORES -> RESPOSTAS_RECEBIDAS
RESPOSTAS_RECEBIDAS -> MAPA_GERADO
MAPA_GERADO -> FORNECEDOR_ESCOLHIDO
RASCUNHO | ENVIADA_FORNECEDORES | RESPOSTAS_RECEBIDAS | MAPA_GERADO -> CANCELADA
```

Smoke test:

```powershell
cd server
npm.cmd run smoke:cotacoes
```

O smoke cria uma solicitação local com marcador `DEV_LOCAL_V3_4B`, move para `EM_ANALISE`, cria uma cotação formal com dois fornecedores, registra respostas, gera o mapa comparativo e escolhe o fornecedor vencedor.

Teste manual do frontend:

1. Suba PostgreSQL local e backend.
2. Rode `npm.cmd run web:dev`.
3. Abra `http://127.0.0.1:5173`.
4. Acesse `Cotações`.
5. Selecione uma solicitação local.
6. Crie uma cotação com fornecedores locais.
7. Envie aos fornecedores e registre respostas.
8. Gere o mapa comparativo.
9. Escolha o fornecedor vencedor com justificativa.

## V2.3 - Integração SharePoint

A V2.3 deve preservar a interface V2.2 homologada. A integração real fica concentrada na webpart SPFx, nos modelos e no repositório SharePoint.

Controle de versão confirmado:

- Baseline protegido em `master`: `d8ab5a0`.
- Branch de trabalho: `dev/v2.3-sharepoint-integracao`.
- Não foi criada tag retroativa da V2.2 porque não havia histórico anterior recuperável.

O inventário readonly V2.3A confirmou que as listas operacionais reais já existem no tenant com títulos numerados. O mapeamento oficial está em `sharepoint/mapeamento-listas-reais-v2.3.md`.

Para a V2.3, não criar `ENACObras` nem `ENACSolicitacoes`; usar:

- Obras: `Lista 01 - Controle de Obras ENAC`.
- Solicitações/Requisições: `Lista 02 — Requisições de Compra`.

Em 2026-06-04, o provisionamento estrutural V2.3A foi concluído no SharePoint com app separado de provisionamento. Foram criadas/reaproveitadas as listas administrativas `ENAC Usuarios Perfis`, `ENAC Alcadas`, `ENAC Historico Configuracoes` e `ENAC Snapshots Regras`, seus campos customizados, lookups e o campo `SnapshotAprovacaoCompra` na Lista 02.

Nenhuma lista operacional foi recriada: `ENACObras` e `ENACSolicitacoes` não foram criadas. O aplicativo readonly permaneceu separado do aplicativo de provisionamento. Power Automate ainda não foi iniciado.

Em 2026-06-04, o teste funcional controlado V2.3B foi executado com dados marcados como `V2.3B-TESTE`. A auditoria readonly confirmou usuários/perfis de teste, alçadas de compra, snapshot `SNAP-V2.3B-TESTE-001`, histórico administrativo e validação da Lista 02 por GUID.

Em 2026-06-05, a auditoria complementar V2.3C fechou a ressalva da V2.3B ao confirmar explicitamente a requisição de teste `ItemId=7`, o campo `SnapshotAprovacaoCompra`, o snapshot `SNAP-V2.3B-TESTE-001`, a regra `alc-v23b-teste-compra-ate-20000`, o valor `6720.00` e Gustavo como aprovador base/efetivo. Resultado: V2.3C aprovada; V2.3B validada funcionalmente sem ressalvas quanto ao vínculo requisição/snapshot/alçada. Power Automate ainda não foi iniciado e permissões finais ainda não estão concluídas.

Em 2026-06-05, a V2.4A foi iniciada como preparação técnica da integração funcional real da webpart/SPFx com SharePoint. A auditoria local confirmou que existe código em `src/webparts/enacSistema`, mas ainda não existe scaffold SPFx completo na raiz (`package.json`, `gulpfile.js`, `.yo-rc.json`, `tsconfig.json` e `config/*`). O plano técnico está em `docs/v2.4a-plano-integracao-spfx-sharepoint.md`.

Ainda em 2026-06-05, o scaffold SPFx mínimo foi migrado para a raiz, preservando o componente ENAC atual. `npm install`, `npx gulp clean` e `npx gulp build` foram executados localmente com sucesso. Não houve conexão ao SharePoint, publicação, Power Automate ou integração funcional nova. O resultado está documentado em `docs/v2.4a-build-spfx.md`.

Na V2.4B, a webpart passou a receber contexto SPFx real e instanciar `SharePointEnacRepository` em modo readonly. O diagnóstico técnico de leitura SharePoint usa apenas GET e fica restrito ao console em build debug, sem substituir ainda os dados visuais simulados e sem executar escrita. O build local passou com `npx gulp clean` e `npx gulp build`.

Na V2.4C, a webpart passou a carregar em estado interno os dados readonly de usuários/perfis, alçadas, requisições resumo e diagnóstico técnico, mantendo fallback local e preservando o visual homologado da V2.2. Os dados reais ainda são usados apenas para diagnóstico em console debug; não houve publicação, conexão SharePoint pelo Codex, escrita, Power Automate ou alteração em listas.

Na V2.4D, foi preparado pacote SPFx local para validação manual controlada no tenant em modo readonly. O pacote não foi publicado pelo Codex, permanece ignorado no Git e depende de autorização manual de Leon para upload em App Catalog/site de teste. Power Automate ainda não foi iniciado.

Na V2.4E, foi gerado pacote SPFx `--ship` local para validação manual readonly no tenant. Os e-mails mockados do fallback da webpart foram sanitizados para `example.invalid` antes do empacotamento, sem alterar o protótipo V2.2. O pacote permanece ignorado no Git e não foi publicado pelo Codex.

Na V2.4F, foram corrigidas consultas readonly REST que retornavam HTTP 400 no tenant por uso de propriedades inválidas em lookups customizados. A webpart passou a consultar lookups administrativos de forma conservadora e enriquecer aprovadores/substitutos em memória. Em validação manual no tenant, Leon confirmou GET 200 para `ENAC Usuarios Perfis` e `ENAC Alcadas`, webpart renderizada, visual básico preservado e ausência de escrita observada. Resultado: V2.4F aprovada manualmente com observação não bloqueante para warnings externos do shell/search do SharePoint. Power Automate ainda não foi iniciado.

Na V2.5A, a interface SPFx passou a consumir dados reais readonly em áreas existentes: cards prioritários do dashboard, Administração / Usuários, Administração / Alçadas e histórico administrativo quando disponível. Em validação manual no tenant, Leon confirmou Lista 02 com GET/fetch 200, usuários/perfis reais de teste, alçadas reais de teste, histórico real de teste, visual básico preservado e sem evidência de escrita nos prints. Resultado: V2.5A aprovada manualmente com observação não bloqueante para warnings externos do SharePoint e recomendação de validação posterior em página publicada/visualização final. Power Automate ainda não foi iniciado.

Na V2.5B, Leon validou manualmente a webpart em página publicada/visualização final readonly. A página publicada abriu fora do modo de edição, a webpart `Sistema Operacional ENAC` renderizou, o dashboard carregou com `Solicitações ativas: 7`, `Aguardando cotação: 0` e `Aguardando aprovação: 2`, o menu lateral ficou visível e o layout básico foi preservado sem sinal visual de quebra. A validação V2.5A já havia confirmado GET/fetch 200 para Lista 02, `ENAC Usuarios Perfis` e `ENAC Alcadas`, além de dados reais readonly em usuários, alçadas e histórico administrativo. Resultado: V2.5B aprovada manualmente, mantendo escrita bloqueada no código e Power Automate não iniciado.

Na V2.6A, foi preparada localmente a escrita controlada de snapshot pela webpart, limitada a teste futuro com `V2.3B-TESTE` ou `V2.6A-TESTE`. A escrita segue desabilitada por padrão, exige modo de teste, confirmação `TESTAR-ESCRITA-V2.6A-ENAC`, item marcado como teste e ação manual explícita. O pacote padrão não executa escrita automática e não expõe a ação de teste sem configuração deliberada.

Na V2.6A.1, a escrita controlada foi auditada localmente antes de qualquer teste no tenant. Não há caminho de escrita automática no carregamento; `POST/MERGE` permanecem restritos aos métodos de teste. A auditoria reforçou a trava de `vincularSnapshotARequisicaoTeste()` para bloquear sobrescrita quando `SnapshotAprovacaoCompra` já estiver preenchido. Resultado: próxima rodada pode ser apenas validação manual controlada, sem Power Automate e sem dados reais operacionais.

Na V2.6A.2, foram preparadas propriedades SPFx seguras para habilitação futura do teste manual de escrita, mantendo tudo desligado por padrão. A webpart agora permite configurar `habilitarEscritaTesteV26A`, `modoEscritaTesteV26A`, confirmação, item, valor e marcador de teste sem alterar código, e executa pré-validação readonly antes de qualquer ação manual de escrita. Codex não executou teste, não publicou pacote e não alterou o tenant.

Em 2026-06-06, Leon executou manualmente a validação V2.6A de escrita controlada em item de teste. O item 10 da Lista 02, requisição `V2.6A-TESTE-001`, recebeu o snapshot `SNAP-V2.6A-TESTE-10-20260606145447`, com histórico `V2.6A-TESTE snapshot 2`, usando a regra `alc-v23b-teste-compra-ate-20000` e aprovador base/efetivo `V2.3B-TESTE - Gustavo`. A confirmação textual usada foi `TESTAR-ESCRITA-V2.6A-ENAC`. Após o teste, Leon desligou as flags V2.6A, republicou a página com flags desligadas, manteve apenas uma webpart `Sistema ENAC` na página e o bloco de teste desapareceu. Power Automate não foi iniciado e a escrita operacional geral continua não liberada.

Na V2.6B, foi preparada a governança documental de permissões finas para listas administrativas e controle de acesso por perfil. A rodada criou matriz de permissões, política de acesso SharePoint/webpart, plano de permissões finas e controle futuro de interface por perfil. Não houve conexão ao SharePoint pelo Codex, publicação, instalação, alteração de tenant/listas/permissões/dados, escrita pela webpart, alteração de `src/prototype/app.js` ou Power Automate.

Na V2.6B.1, foi preparado um dry-run local de permissões finas. A rodada criou script PowerShell somente local, documentação e roteiro de validação para simular grupos, listas afetadas, permissões pretendidas, riscos e bloqueios de segurança. Permissões reais ainda não foram aplicadas, a escrita operacional continua não liberada e Power Automate ainda não foi iniciado.

Na V2.6B.2, foi preparado um script real protegido de permissões finas para aplicação futura. O modo padrão permanece dry-run local sem conexão; qualquer aplicação futura exige `-Apply`, confirmação textual `APLICAR-PERMISSOES-V2.6B-ENAC`, app diferente do readonly e rodada própria autorizada por Leon. Codex não executou aplicação, não conectou ao SharePoint, não alterou permissões reais e não iniciou Power Automate.

Na V2.6B.3, foi preparado um script conectado/readonly para auditoria manual do estado atual de grupos, listas administrativas, herança e permissões. Codex não executou o script, não conectou ao SharePoint, não aplicou permissões e não iniciou Power Automate. A execução, se aprovada, será manual por Leon e deverá gerar relatório sanitizado para revisão.

Na V2.6B.3A, o script readonly de auditoria de permissões foi corrigido para tolerar falta de permissão em `Get-PnPGroup`. A auditoria agora registra grupos como `NAO_CONFIRMADO` quando a enumeração for negada, continua auditando listas administrativas e gera relatório parcial sanitizado. Nenhuma aplicação, escrita, alteração de permissões ou Power Automate foi executado pelo Codex.

Na V2.6B.3B, foi registrado o relatório readonly gerado manualmente por Leon em `sharepoint/auditoria-permissoes-finas-v2.6b3.md`. A auditoria confirmou as quatro listas administrativas e mostrou `Heranca unica False` em todas, indicando que permissões finas ainda não foram aplicadas. Grupos planejados e permissões detalhadas permaneceram não confirmados por limitação de permissão de leitura.

Na V2.6B.3C, foi preparada a auditoria manual orientada de grupos e permissões no SharePoint. A etapa existe para Leon confirmar manualmente grupos planejados, permissões do site, herança das listas administrativas e usuários individuais com acesso direto antes de qualquer `Apply`. Nenhuma alteração no tenant será feita nesta etapa.

Na V2.6B.3D, foi registrado o resultado da auditoria manual de grupos e permissões. O site usa os grupos padrão `Obras em Andamento Owners`, `Members` e `Visitors`; os grupos ENAC planejados não estão aplicados às permissões do site; e as quatro listas administrativas ainda herdam permissões do site. Permissões finas administrativas seguem não implementadas.

Na V2.6B.4-PREP, foi preparada a criação/revisão manual dos grupos ENAC antes de qualquer aplicação real de permissões. A etapa define grupos, membros iniciais por função sem e-mails, roteiro manual e template de relatório. Nenhum `Apply` foi autorizado, nenhuma permissão foi aplicada e Power Automate continua fora do escopo.

Ainda na V2.6B.4-PREP, Leon criou manualmente os sete grupos ENAC planejados e adicionou os membros funcionais previstos. O registro foi feito sem e-mails em `sharepoint/auditoria-grupos-enac-v2.6b4-prep.md`. Permissões administrativas finas ainda não foram aplicadas e as listas administrativas devem permanecer herdando permissões até a V2.6B.4.

Na V2.6B.4, foi preparada a aplicação real controlada das permissões administrativas nas quatro listas administrativas. O script protegido foi ajustado para validar grupos existentes, não criar grupos, não alterar membros, quebrar herança apenas das listas administrativas e aplicar permissões aos grupos ENAC. Codex não executou o script nem conectou ao SharePoint.

Na V2.6B.4A, foi corrigida a falha de preflight em `Get-PnPGroup`. O script deixou de enumerar todos os grupos, passou a validar grupos por nome exato e ganhou o modo `-ConnectedPreflight`, que conecta para validar site/listas/grupos/níveis sem aplicar alterações. Nenhuma permissão foi aplicada pelo Codex.

Na V2.6B.4B, foi registrada falha controlada no `Apply`: o `ConnectedPreflight` passou, mas a primeira operação real `Set-PnPList -BreakRoleInheritance` em `ENAC Usuarios Perfis` retornou `Access is denied. 0x80070005`. A expectativa técnica é que nenhuma permissão tenha sido aplicada, mas Leon deve confirmar manualmente que as quatro listas administrativas continuam herdando permissões.

Na V2.6B.4C, Leon confirmou manualmente que as quatro listas administrativas estao com permissoes exclusivas. A situacao foi registrada como estado parcial: a heranca esta quebrada, mas a matriz final de grupos ENAC ainda nao esta comprovada como concluida. A finalizacao deve ser manual, uma lista por vez, sem reutilizar o script de `Apply`, sem alterar listas operacionais e sem iniciar Power Automate.

Na V2.6B.4D, Leon confirmou manualmente a conclusao das permissoes administrativas nas quatro listas. Os grupos ENAC foram aplicados conforme matriz, `Obras em Andamento Owners` foi mantido, `Obras em Andamento Members` e `Obras em Andamento Visitors` foram removidos das quatro listas, nenhuma lista operacional foi alterada e Power Automate nao foi iniciado. A V2.6B.4 fica encerrada como concluida manualmente por Leon, sujeita apenas a auditorias futuras.

Na V2.7A, foi preparada a base tecnica de escrita operacional restrita e controlada, ainda sem Power Automate e sem liberacao ampla. A webpart ganhou flags explicitas desligadas por padrao, pre-validacao de perfil via `ENAC Usuarios Perfis.ContaMicrosoft365`, metodos de escrita protegidos no reposititorio e matriz documental para itens `V2.7A-TESTE`. Codex nao conectou ao SharePoint, nao alterou tenant/listas/dados e nao modificou as permissoes administrativas V2.6B.4D.

Na V2.7A.1, o build/pacote local da V2.7A foi validado com Node `v22.18.0` encontrado fora do PATH em instalacao local da Adobe. `tsc --noEmit`, `gulp clean`, `gulp bundle`, `gulp bundle --ship` e `gulp package-solution --ship` passaram. O pacote `sharepoint/solution/enac-sistema-spfx.sppkg` foi gerado localmente e permanece ignorado no Git. Codex nao publicou, nao instalou app, nao conectou ao SharePoint, nao alterou tenant/listas/dados e nao iniciou Power Automate.

Na rodada `V2.7A-RECUPERAR`, a base anteriormente reportada como ausente foi reconferida e estava presente no historico local: `2f39ba3 feat: preparar escrita operacional restrita v2.7a`. A validacao local foi repetida com Node `v22.22.3`, incluindo `tsc`, `npm install`, `gulp clean`, `gulp build`, `gulp bundle --ship` e `gulp package-solution --ship`, todos com sucesso. Codex removeu apenas um relatorio local obsoleto nao rastreado de base ausente, preservou `README-RoG_Leon.md`, nao conectou ao SharePoint e nao alterou tenant/listas/dados.

Na V2.7A.2, foi preparado o roteiro do primeiro teste funcional controlado da escrita operacional restrita. A escrita permanece desligada por padrao e o teste manual deve ficar limitado ao item `V2.7A-TESTE-001`, com marcador `V2.7A-TESTE`, em pagina restrita. A primeira acao recomendada e atualizar status de `Aberta` ou `Recebida` para `Aguardando aprovacao`, sem executar pedido, nota fiscal, pagamento ou Power Automate. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.2A, a pre-validacao operacional foi corrigida para ser especifica do item de teste. A validacao generica de flags/perfil nao libera mais escrita: o Property Pane deve informar `itemTesteOperacionalIdV27A`, acao, status destino e confirmacao; a webpart deve ler o item por GET, confirmar marcador `V2.7A-TESTE`, status atual, transicao, campo alterado, valor previsto e historico antes de exibir o botao. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.2B, a leitura do item de teste foi corrigida para usar a Lista 02 por GUID `0a204b87-b9a1-4d16-8654-55567a62ed01` e internal names reais do inventario, incluindo `Descri_x00e7__x00e3_odaSolicita_` e `Observa_x00e7__x00f5_es`. O painel passa a exibir HTTP da leitura, modo GUID, campos retornados, campos com marcador e valores lidos. A execucao permanece bloqueada se o item 11 nao for resolvido ou se `pode executar` nao for `sim`. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.2C, a execucao foi corrigida apos a pre-validacao especifica aprovar o item 11. A interface deixou de chamar o metodo generico de atualizacao e passou a usar `executarAtualizacaoStatusRequisicaoV27A()`, restrito a revalidar o item por GET, executar MERGE apenas em `StatusdaRequisi_x00e7__x00e3_o` e registrar historico operacional. A primeira escrita permitida continua limitada ao status do item `V2.7A-TESTE`; pedido, NF, pagamento, snapshot e Power Automate seguem fora do escopo. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.2D, Leon registrou a validacao manual da escrita operacional restrita corrigida na V2.7A.2C. Em 2026-06-08, o item 11 da `Lista 02 — Requisições de Compra`, marcado como `V2.7A-TESTE`, teve o campo `StatusdaRequisi_x00e7__x00e3_o` alterado de `Recebida` para `Aguardando aprovação`, com historico operacional criado e HTTP de escrita `204`. Nao houve `PATCH`/`DELETE`, nenhum outro item foi alterado, as flags V2.7A foram desligadas e a pagina foi republicada com flags desligadas. A validacao e restrita a transicao unica controlada de status; pedido, NF, pagamento, snapshot e Power Automate nao foram testados.

Na V2.7A.3, foi preparada localmente a proxima acao controlada: `CriarSnapshotAprovacaoOperacional`. A pre-validacao passa a exigir item `V2.7A-TESTE`, status `Aguardando aprovação`, `SnapshotAprovacaoCompra` vazio, valor de teste, regra/alçada resolvida e aprovador base/efetivo resolvidos. A execucao manual futura fica limitada a criar snapshot em `ENAC Snapshots Regras`, vincular `SnapshotAprovacaoCompra` no item de teste e registrar historico operacional, sem aprovar compra, criar pedido, NF, pagamento ou Power Automate. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.3A, foi corrigida a normalizacao do campo `Aprovação Necessária?` na pre-validacao do snapshot operacional. Leon confirmou que o SharePoint retornava o internal name `Aprova_x00e7__x00e3_oNecess_x00e` e que o valor era `Sim`, mas a tela bloqueava com `APROVACAO_NAO_NECESSARIA`. A webpart agora resolve candidatos de campo e normaliza boolean/choice como `Sim`, `Nao` ou `Nao resolvido`, distinguindo `APROVACAO_NAO_NECESSARIA` de `APROVACAO_NECESSARIA_NAO_RESOLVIDA`. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.3B, Leon validou manualmente o snapshot operacional no tenant. Em 2026-06-09, a acao `CriarSnapshotAprovacaoOperacional` criou o snapshot ID `3`, title `SNAP-V2.7A-TESTE-11-20260609025123`, e vinculou `SnapshotAprovacaoCompra` no item `11` da `Lista 02 — Requisições de Compra`, mantendo o status em `Aguardando aprovação`. O historico operacional foi criado, HTTP escrita `204`, sem `PATCH`/`DELETE`, sem outro item alterado, com flags desligadas e pagina republicada. Power Automate nao foi iniciado. A validacao e restrita a acao controlada de snapshot operacional; pedido, NF e pagamento nao foram testados.

Na V2.7A.4, foi analisada a proxima acao `CriarPedidoCompra`. A regra atual do codigo e da documentacao exige status `Aprovada` ou `Aprovada para compra`; portanto o item `11`, ainda em `Aguardando aprovação`, nao esta elegivel para pedido. A Lista 03 de pedidos esta mapeada como `Lista 03 — Pedidos de Compra`, GUID `18ca132a-c36a-42aa-9968-d87ecd547a79`, mas seus campos obrigatorios reais ainda precisam de pre-validacao readonly antes de qualquer escrita. A acao de pedido nao foi liberada nesta rodada; a recomendacao e preparar antes uma etapa controlada de `AprovarCompra`.

Na V2.7A.4A, foi preparada localmente a acao controlada `AprovarCompra`. A choice real confirmada no inventario sanitizado para o status aprovado da Lista 02 e `Aprovada para compra`; `Aprovada` nao consta como choice real da lista. A pre-validacao passa a exigir item `V2.7A-TESTE`, status atual `Aguardando aprovação`, `SnapshotAprovacaoCompra` preenchido, aprovacao necessaria resolvida, valor `6720`, regra/aprovador do snapshot resolvidos, usuario autenticado correspondente ao aprovador do snapshot, perfil permitido e confirmacao manual exata. A execucao futura fica restrita a MERGE somente em `StatusdaRequisi_x00e7__x00e3_o` e registro de historico operacional, sem criar pedido, NF, pagamento ou Power Automate. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.4B, foi implementada localmente a aprovacao por Diretoria como alcada superior para `AprovarCompra`. A regra vale somente quando o item esta em `Aguardando aprovação`, o destino e `Aprovada para compra`, existe snapshot vinculado, o usuario esta ativo com perfil `Diretoria`, possui permissao de aprovacao, o marcador `V2.7A-TESTE` esta confirmado e o historico registra aprovador previsto, aprovador efetivo e justificativa de alcada superior. O caso esperado para o item `11` e aprovador previsto `V2.3B-TESTE - Gustavo` e aprovador efetivo operacional `V2.3B-TESTE - Leon / Diretoria`, com diagnostico `DIRETORIA_ALCADA_SUPERIOR_VALIDADA`. A regra nao libera bypass amplo, nao cria pedido e mantem Power Automate fora do escopo.

Na V2.8E, foi preparada a pagina dedicada tipo app para o Sistema ENAC. O manifest da webpart passou a suportar `SharePointFullPage`, preservando `SharePointWebPart`, para permitir uso em Single Part App Page / `SingleWebPartAppPage`. Foram documentados a pagina `Sistema ENAC - Homologação`, a URL esperada `/sites/Equipe.Obras/SitePages/Sistema-ENAC-Homologacao.aspx`, recomendacoes de permissao para usuarios finais sem edicao de pagina e um script manual protegido para conversao/criacao posterior. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados/permissoes e nao iniciou Power Automate.

Na V2.8E1, foi habilitado `supportsFullBleed` no manifest da webpart e o SCSS do shell principal foi ajustado para usar `width: 100%`, `max-width: none` e `margin: 0`, preservando `SharePointFullPage`. O objetivo e permitir melhor uso de secoes `Largura total` / `Full-width column` em paginas modernas e reduzir limitacoes internas de largura sem usar `100vw` global. Nenhuma regra, payload, fluxo operacional, alçada, status, chamada REST ou trava de escrita foi alterada.

Na V2.8E2, o layout interno foi ajustado para comportamento de tela cheia: o shell principal passou a usar `min-height: calc(100vh - 48px)`, menu lateral e painel principal foram esticados para a altura util, o shell deixou de parecer um card estreito com borda/radius, e os cards do dashboard passaram a usar grid responsivo com `auto-fit`. Nao foi usado `100vw` global e nenhuma regra, payload, fluxo, chamada REST, status, alçada, trava ou Power Automate foi alterado.

Na V2.8E3, foi corrigido o painel branco interno que ainda ficava estreito mesmo com o fundo da webpart ocupando a pagina. O diagnostico apontou falta de stretch/largura explicita nos wrappers internos `.appHeader`, `.contentPanel`, `.metrics`, `.split`, `.row`, `form` e `table`. O SCSS agora força `justify-self: stretch`, `width: 100%` e `max-width: none` nesses elementos, sem hack global no SharePoint e sem alterar regras, payloads, fluxos, chamadas REST ou travas.

Na V2.8E4, foi aplicado full viewport controlado na classe raiz `.enacSistema`, com breakout restrito ao root da webpart (`calc(100vw - 16px)` e margens relativas ao viewport) para testar se a limitacao restante vem do canvas/coluna SharePoint. A webpart ganhou o marcador visual discreto `UI V2.8E4` no cabecalho para confirmar que o pacote publicado realmente carregou. Nao foi usado CSS global para esconder SharePoint e nenhuma regra, payload, fluxo, chamada REST, status, alçada, trava ou Power Automate foi alterado.

Na V2.8E6, o pacote SPFx foi versionado de `1.0.0.0` para `1.0.0.1` em `config/package-solution.json`, com feature version tambem em `1.0.0.1`, para forcar rastreabilidade no App Catalog e validar cache/site/app instalado. O cabecalho ganhou os marcadores temporarios `UI V2.8E6` e `Layout: full viewport ativo`. O manifest preserva `SharePointWebPart`, `SharePointFullPage` e `supportsFullBleed: true`. Nao houve alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E7, foi corrigido o corte lateral causado pelo breakout full viewport da V2.8E4/V2.8E6. Como o marcador visual apareceu no tenant, a publicacao/cache estavam carregando; o problema era a margem negativa em `.enacSistema`, que deslocava o root para fora da viewport no WebView. O root voltou para `width: 100%`, `max-width: none` e `margin: 0`, preservando os wrappers internos fluidos. O marcador visual foi atualizado para `UI V2.8E7`. Nao houve hack global SharePoint nem alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E8, o painel branco interno foi reforcado para ocupar a largura util disponivel dentro do shell do Sistema ENAC. O diagnostico apontou que o shell real e a propria `.enacSistema`, com `aside` e `main`, sem wrapper `.appShell`; a limitacao vinha de stretch implicito no grid/main e da rigidez do cabecalho, especialmente `.headerMeta` com `min-width: 360px` comprimindo a identidade. Foram adicionados stretch explicito no root/main, largura fixa controlada no menu, titulo sem quebra em desktop e marcador `UI V2.8E8`. Nao foi reintroduzida margem negativa nem houve alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E9, o grid principal foi separado em uma estrutura visual explicita com `.viewport` envolvendo `.enacSistema`, e classes proprias `.sideNav` e `.mainPanel` para o menu e painel. O wrapper externo passou a usar flex com stretch e o grid recebeu `flex: 1 1 auto`, garantindo que o conjunto menu lateral + painel branco tente ocupar 100% da largura disponivel do fundo. O marcador visual foi atualizado para `UI V2.8E9`. Nao foi reintroduzida margem negativa, `100vw` deslocado, corte lateral, hack global SharePoint ou alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E10, foi aplicado breakout medido em runtime no wrapper `.viewport`: o componente mede `getBoundingClientRect().left` e a largura real do viewport, grava `--enac-breakout-left` e `--enac-viewport-width` no proprio elemento, e o CSS usa essas variaveis para deslocar somente o necessario. Isso evita a margem negativa fixa que cortava a esquerda e supera o `width: 100%` preso ao canvas estreito. O marcador visual foi atualizado para `UI V2.8E10` e `Breakout medido ativo`. Nao houve hack global SharePoint nem alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E11, foi feito ajuste fino do breakout medido para evitar excesso lateral: a largura deixou de usar o viewport bruto e passou a descontar o deslocamento medido e um safety gap de `16px` (`viewportWidth - measuredLeft - 16`). O objetivo e manter o painel largo sem ultrapassar a largura util nem gerar scroll horizontal global. O cabecalho agora exibe `UI V2.8E11`, `Breakout medido ativo` e `Ajuste fino de largura ativo`. Nao houve alteracao de regra, payload, fluxo, chamada REST, status, alçada, trava operacional ou Power Automate.

Na V2.8E12, foi feito acabamento final do cabecalho: o logo ENAC saiu do banner e passou para o topo do menu lateral no lugar de `Módulos`; o banner manteve `Sistema ENAC`, subtitulo, perfil atual e `Homologação assistida`; e os marcadores tecnicos `UI V2.8E11`, `Breakout medido ativo` e `Ajuste fino de largura ativo` foram removidos da interface. A alteracao foi somente visual, sem alterar regras, payloads, fluxos, chamadas REST, status, alçadas, travas operacionais ou Power Automate.

Na V2.8E13, foi removido o fundo branco aplicado por CSS ao logo do menu lateral. O PNG foi mantido intacto e confirmado com canal alpha; o ajuste removeu `background`, `border-radius` e `padding` que criavam o efeito de card/pill branco em `.sideNavLogo`, preservando o banner sem logo e sem marcadores tecnicos. A alteracao foi somente visual, sem alterar regras, payloads, fluxos, chamadas REST, status, alçadas, travas operacionais ou Power Automate.

Na V2.9A, foi preparada a base funcional de administracao de usuarios, perfis/categorias e alcadas. O banner passou a separar `Usuário` fixo, vindo do contexto/cadastro, de `Perfil de acesso`, restrito aos perfis autorizados do usuario. Menus administrativos `Usuários`, `Alçadas` e `Auditoria` passam a aparecer apenas para perfil ativo `AdministradorSistema`. As telas administrativas ganharam UI preparada e bloqueada para `CriarUsuarioSistema`, `AtualizarUsuarioPerfilStatus` e `AtualizarAlcadaUsuario`, dependentes de auditoria readonly do schema, pre-validacao, confirmacao manual e historico. Foi criado script readonly para auditar `ENAC Usuarios Perfis` e `ENAC Alcadas`. Nenhuma escrita administrativa, alteracao de tenant/listas/dados, publicacao pelo Codex ou Power Automate foi executada.

Na V2.9B, foi preparada a pre-validacao de escrita administrativa controlada. O Property Pane ganhou flags desligadas por padrao para `habilitarEscritaAdministrativaV29B`, `modoTesteAdministrativoV29B`, token de confirmacao, acao administrativa, usuario, alcada e campos de payload. O painel V2.9B aparece apenas para `AdministradorSistema` ativo e exibe payload/historico previstos para `CriarUsuarioSistema`, `AtualizarUsuarioPerfilStatus` e `AtualizarAlcadaUsuario`, mantendo o botao de execucao real bloqueado nesta rodada. Nenhuma escrita administrativa real, alteracao de tenant/listas/dados, publicacao pelo Codex ou Power Automate foi executada.

Na V2.7A.4C/V2.7A.4D, a validacao manual de `AprovarCompra` foi registrada como pendente de auditoria porque Leon observou o campo visual `Snapshot da Aprovação de Compra` vazio no formulario do SharePoint. A rotina foi corrigida localmente para confirmar `SnapshotAprovacaoCompra` por GET apos o MERGE de status, registrar historico somente quando o snapshot for preservado e retornar alerta critico se o lookup nao for comprovado. Codex nao conectou ao SharePoint, nao alterou tenant/listas/dados e nao executou nova escrita operacional.

Na V2.7A.4E, Leon confirmou manualmente que o campo `Snapshot da Aprovação de Compra` do item `11` permaneceu vinculado ao snapshot `3` / `SNAP-V2.7A-TESTE-11-20260609025123` apos `AprovarCompra`. A acao fica VALIDADA MANUALMENTE para Diretoria como alçada superior, com status `Aguardando aprovação -> Aprovada para compra`, historico criado, HTTP escrita `204`, sem pedido, NF, pagamento ou Power Automate. Isso nao representa liberacao ampla de producao.

Na V2.7A.5, `CriarPedidoCompra` foi preparado apenas como diagnostico/pre-validacao no Property Pane. A execucao permanece bloqueada porque a estrutura real da `Lista 03 — Pedidos de Compra` ainda exige auditoria readonly: o inventario local confirma o GUID `18ca132a-c36a-42aa-9968-d87ecd547a79` e campos como `ValordoPedido`, `DatadoPedido` e `StatusdoPedido`, mas nao confirma `SolicitacaoId`, choices de status nem obrigatoriedade/campo correto de fornecedor. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.5A, foi preparado um script PowerShell readonly para Leon auditar manualmente a estrutura real da `Lista 03 — Pedidos de Compra`: `scripts/sharepoint/11-auditoria-lista03-pedidos-readonly.ps1`. O script deve gerar relatórios em `reports/` e nao foi executado pelo Codex. `CriarPedidoCompra` continua bloqueado ate o resultado da auditoria confirmar campo de vinculo, fornecedor correto, choices de `StatusdoPedido` e campos obrigatorios.

Na V2.7A.5B, `CriarPedidoCompra` foi adaptado localmente ao schema real confirmado da `Lista 03 — Pedidos de Compra`. Como a auditoria readonly nao confirmou `SolicitacaoId`, o pedido passa a usar vinculo textual temporario por `N_x00ba_daRequisi_x00e7__x00e3_o`; o fornecedor obrigatorio usa `Fornecedor0Id`; e o status inicial previsto e `Em elaboração`. A execucao futura exige `fornecedorTesteIdV27A` valido, pre-validacao sem alertas, inexistencia de pedido anterior e confirmacao manual. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.5C, Leon registrou a validacao manual de `CriarPedidoCompra`. Em 09/06/2026, apos pre-validacao aprovada, foi criado o pedido item `3` na `Lista 03 — Pedidos de Compra`, vinculado textualmente por `N_x00ba_daRequisi_x00e7__x00e3_o = V2.7A-TESTE-001`, com fornecedor correto no lookup `Fornecedor0` (`00.000.000/0001-00`), valor `6720`, status `Em elaboração`, historico criado e HTTP escrita `201`. O item `11` permaneceu em `Aprovada para compra`, o snapshot `3` permaneceu vinculado, nao houve `PATCH`/`DELETE`, NF/pagamento nao foram criados, as flags V2.7A foram desligadas e a pagina foi republicada. A acao fica validada manualmente como controlada, sem liberacao ampla de producao e sem Power Automate.

Na V2.7A.6, foi preparada a proxima etapa `VincularNotaFiscal` como auditoria readonly da `Lista 04 - Notas Fiscais Recebidas`, GUID `25aa4447-193d-418a-8e71-9bfd8e9995da`. O inventario local indica campos como `N_x00ba_doPedido`, `N_x00ba_daNotaFiscal`, `Fornecedor0`, `ValorBrutodaNF`, `DatadeEmiss_x00e3_o`, `DatadeVencimento` e `StatusdaConfer_x00ea_ncia`, mas ainda falta auditoria especifica para confirmar vinculo com pedido, choices, obrigatoriedade, anexo/documento e inexistencia de NF de teste. Foi criado script readonly para execucao manual por Leon; `VincularNotaFiscal` permanece bloqueada e nenhum TypeScript de escrita foi preparado.

Na V2.7A.7B, `ProgramarPagamento` foi preparado localmente para usar a `Lista 10 - Contas a Pagar / Programacao Financeira`, GUID `f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680`, enquanto a Lista 05 permanece como referencia/legado nesta rodada. A prevalidação exige NF `Lista 04-4`, numero `NF-V2.7A-TESTE-001`, pedido `PED-V2.7A-TESTE-11-20260609125401`, valor `6720`, status `Recebida`, contabilidade `não`, fornecedor, obra, vencimento, choices da Lista 10 e inexistencia de pagamento anterior. A escrita futura criara somente programacao com status `Programado`, forma `Pix`, conta `Itaú ENAC`, categoria `Material de Obra` e origem `Compra de Material`, sem marcar como pago, sem enviar para contabilidade e sem Power Automate. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.7C, Leon validou manualmente `ProgramarPagamento` no tenant em 09/06/2026. A acao criou a programacao financeira `Lista 10-3`, title `PAG-V2.7A-TESTE-NF-4-NF-V2.7A-TESTE-001-20260609161247`, a partir da NF `Lista 04-4` / `NF-V2.7A-TESTE-001`, pedido `Lista 03-3` e requisicao `Lista 02-11`. Foram confirmados fornecedor, obra, centro de custo `V2.7A-TESTE`, valor bruto/liquido `6720`, vencimento/data programada `16/06/2026`, status `Programado`, forma `Pix`, conta `Itaú ENAC`, categoria `Material de Obra`, origem `Compra de Material`, historico criado e HTTP escrita `201`. Pagamento efetivo, data de pagamento e comprovante nao foram criados; NF, pedido e requisicao nao foram alterados indevidamente; nao houve `PATCH`/`DELETE`. Power Automate nao foi verificado diretamente no run history, sem indicio observado e nao iniciado pelo Codex. A validacao nao representa liberacao ampla de producao.

Na V2.8A, o fluxo manual completo foi consolidado documentalmente para preparar homologacao assistida: `Solicitacao -> Snapshot -> Aprovacao -> Pedido -> NF -> Programacao de Pagamento`. A rodada criou dossie tecnico, matriz de listas/campos/vinculos, matriz de status/transicoes, riscos pre-homologacao e roteiro de homologacao assistida. O fluxo esta pronto para homologacao assistida controlada, mas nao para producao ampla: ainda ha vinculos textuais temporarios entre requisicao/pedido/NF/programacao, status intermediarios nao testados, comprovantes/anexos e contabilidade fora do fluxo validado, e Power Automate continua sem inicio. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.8B, foi preparado o pacote documental para Leon conduzir homologacao assistida com a equipe, ainda sem execucao pelo Codex. A etapa definiu plano de reuniao, checklist executivo, matriz de participantes e responsabilidades, criterios de aprovacao/reprovacao, plano de parada/contingencia, roteiro de equipe e checklist de evidencias. O marcador sugerido para a homologacao e `V2.8B-HOMOLOGACAO`; dados sensiveis reais, pagamento efetivo, comprovante real e Power Automate ficam fora do escopo. A etapa tambem separou pendencias nao bloqueantes para V2.8B das pendencias bloqueantes para producao ampla.

Na V2.8B-UI, a webpart recebeu melhoria visual pre-homologacao com identidade ENAC: logo no cabecalho e menu lateral, titulo institucional, badge de homologacao assistida, navegacao mais clara, cards/tabelas/forms com acabamento corporativo e chips visuais de status. A etapa foi exclusivamente visual/UX: nao alterou regras, fluxos, payloads, chamadas REST, travas V2.6A/V2.7A, `src/prototype/app.js` ou backup V2.2. Power Automate permaneceu fora do escopo.

Na V2.8C, foram preparadas correcoes pre-homologacao: logo PNG com transparencia, cabeçalho mais compacto, identidade exibida apenas uma vez, acentuacoes visiveis corrigidas, limpeza visual de prefixos `V2.3B-TESTE -`, `usr-` e `USR-`, e telas administrativas com controles preparados/desabilitados para futura alteracao controlada de perfil, status e alçada. A limpeza de dados ficou apenas em inventario readonly/dry-run por script, sem delecao. Nenhuma regra, payload, chamada REST operacional ou fluxo validado foi alterado; Power Automate continuou fora do escopo.

Na V2.8D, foi preparada a limpeza controlada dos dados transacionais de teste identificados no inventario readonly V2.8C. A etapa classificou seis itens candidatos para limpeza futura, preservou snapshots, historico, usuarios/perfis e alcadas como evidencia/configuracao, e criou script com dry-run por padrao, whitelist fixa, checagem de `Title`/marcador, suporte a `-WhatIf` e token obrigatorio para qualquer remocao futura. Codex nao conectou ao SharePoint, nao executou limpeza/delecao, nao publicou pacote, nao alterou tenant/listas/dados e nao iniciou Power Automate.

Na V2.8D1, foi corrigido o dry-run da limpeza controlada apos Leon observar falha de leitura por parameter set em todos os seis candidatos. A leitura passou a usar `Get-PnPListItem -Id` por item whitelistado, sem combinar `-Query` e `-Fields`, e os relatorios passaram a destacar leitura, bloqueios, erros, totais e autorizacao para execucao. O dry-run anterior fica invalido para autorizar limpeza; execucao real continua bloqueada ate novo dry-run limpo e revisado por Leon.

## Protótipo

Abra no navegador:

`src/prototype/index.html`

O protótipo permite alternar perfis:

- Campo / Engenheiro.
- Cotações e Contratos / Kemilly.
- Compras e Financeiro Operacional / Matheus.
- Planejamento / Gustavo.
- Diretoria / Leon.
- Administrador do Sistema / Leon.

## Administração

O perfil `Administrador do Sistema / Leon` é separado conceitualmente de `Diretoria / Leon`. A diretoria decide, aprova, libera pagamentos e atualiza status finais; a administração parametriza usuários, perfis, alçadas e regras do sistema.

Telas administrativas do protótipo:

- Usuários e Perfis.
- Alçadas de Aprovação.
- Regras Especiais.
- Parâmetros Gerais.
- Histórico de Configurações.

Alterações administrativas registram auditoria e não alteram retroativamente processos já submetidos, aprovados ou concluídos, pois cada submissão para aprovação grava snapshot da regra aplicada.

No protótipo, usuários podem ser cadastrados, editados, ativados/desativados e usados como aprovadores nas regras de alçada. Campos financeiros são exibidos em Real brasileiro e campos de data editáveis usam calendário HTML.

## Arquivos principais

- `docs/arquitetura-mvp.md`
- `docs/regras-negocio.md`
- `docs/fluxos-validados.md`
- `docs/perfis-permissoes.md`
- `docs/alcadas-aprovacao.md`
- `docs/backlog.md`
- `docs/v2.3-sharepoint-integracao.md`
- `docs/v2.4a-plano-integracao-spfx-sharepoint.md`
- `docs/v2.4a-build-spfx.md`
- `docs/v2.4b-integracao-readonly-webpart-sharepoint.md`
- `docs/v2.4c-consumo-readonly-estado-webpart.md`
- `docs/v2.4d-validacao-manual-tenant-readonly.md`
- `docs/v2.4e-pacote-ship-readonly-validacao-manual.md`
- `docs/v2.4f-correcao-consultas-readonly-rest.md`
- `docs/v2.5a-consumo-readonly-interface.md`
- `docs/v2.5b-validacao-pagina-publicada-readonly.md`
- `docs/v2.6a-escrita-controlada-snapshot-webpart.md`
- `docs/v2.6a1-auditoria-pre-teste-escrita-controlada.md`
- `docs/v2.6a2-habilitacao-segura-teste-escrita.md`
- `docs/v2.6a-validacao-manual-escrita-controlada.md`
- `docs/v2.6b-matriz-permissoes-finas.md`
- `docs/v2.6b-politica-acesso-sharepoint-webpart.md`
- `docs/v2.6b-controle-interface-por-perfil.md`
- `docs/v2.6b1-dryrun-permissoes-finas.md`
- `docs/v2.6b2-script-real-protegido-permissoes-finas.md`
- `docs/v2.6b3-auditoria-readonly-permissoes-finas.md`
- `docs/v2.6b3b-registro-auditoria-readonly-permissoes-finas.md`
- `docs/v2.6b3c-auditoria-manual-grupos-permissoes.md`
- `docs/v2.6b3d-registro-auditoria-manual-grupos-permissoes.md`
- `docs/v2.6b4-prep-criacao-manual-grupos-enac.md`
- `docs/v2.6b4-prep-registro-grupos-criados.md`
- `docs/v2.6b4-aplicacao-real-controlada-permissoes-administrativas.md`
- `docs/v2.6b4a-falha-preflight-get-pnpgroup.md`
- `docs/v2.6b4b-falha-breakroleinheritance-access-denied.md`
- `docs/v2.6b4c-estado-parcial-heranca-quebrada.md`
- `docs/v2.6b4d-registro-final-permissoes-administrativas.md`
- `docs/v2.7a-escrita-operacional-restrita.md`
- `docs/v2.7a-matriz-acoes-por-perfil.md`
- `docs/v2.7a-transicoes-status-fluxo-compras.md`
- `docs/v2.7a1-validacao-build-pacote-node22.md`
- `docs/v2.7a-recuperacao-base-ausente.md`
- `docs/v2.7a2-teste-funcional-controlado.md`
- `docs/v2.7a2a-prevalidacao-item-especifico.md`
- `docs/v2.7a2b-correcao-leitura-item-teste.md`
- `docs/v2.7a2c-correcao-execucao-status.md`
- `docs/v2.7a2d-validacao-manual-escrita-operacional.md`
- `docs/v2.7a3-teste-snapshot-operacional.md`
- `docs/v2.7a3a-correcao-aprovacao-necessaria-snapshot.md`
- `docs/v2.7a3b-validacao-manual-snapshot-operacional.md`
- `docs/v2.7a4-teste-criar-pedido-compra.md`
- `docs/v2.7a4c-validacao-manual-aprovar-compra-diretoria.md`
- `docs/v2.7a4d-auditoria-preservacao-snapshot-aprovar-compra.md`
- `docs/v2.7a4e-validacao-final-aprovar-compra-pos-auditoria.md`
- `docs/v2.7a5-teste-criar-pedido-compra.md`
- `docs/v2.7a5a-auditoria-readonly-lista03-pedidos.md`
- `docs/v2.7a5b-ajuste-criar-pedido-schema-lista03.md`
- `docs/v2.7a5c-validacao-manual-criar-pedido-compra.md`
- `docs/v2.7a6-teste-vincular-nota-fiscal.md`
- `docs/v2.7a6a-auditoria-readonly-lista04-notas-fiscais.md`
- `docs/v2.7a6b-ajuste-vincular-nf-schema-lista04.md`
- `docs/v2.7a6c-validacao-manual-vincular-nota-fiscal.md`
- `docs/v2.7a7-teste-programar-pagamento.md`
- `docs/v2.7a7a-auditoria-readonly-lista-pagamentos.md`
- `docs/v2.7a7b-ajuste-programar-pagamento-lista10.md`
- `docs/v2.7a7c-validacao-manual-programar-pagamento.md`
- `docs/v2.8a-consolidacao-fluxo-manual-completo.md`
- `docs/v2.8a-matriz-listas-campos-vinculos.md`
- `docs/v2.8a-matriz-status-transicoes.md`
- `docs/v2.8a-riscos-e-pendencias-pre-homologacao.md`
- `docs/v2.8b-plano-homologacao-assistida.md`
- `docs/v2.8b-checklist-executivo-homologacao.md`
- `docs/v2.8b-matriz-participantes-responsabilidades.md`
- `docs/v2.8b-criterios-aprovacao-reprovacao.md`
- `docs/v2.8b-plano-parada-e-contingencia.md`
- `docs/v2.8b-ui-melhoria-visual-identidade-enac.md`
- `docs/v2.8c-correcoes-pre-homologacao-ui-admin-limpeza.md`
- `docs/v2.8c-plano-limpeza-dados-teste.md`
- `docs/v2.8d-analise-inventario-limpeza.md`
- `docs/v2.8d-plano-limpeza-controlada-dados-teste.md`
- `docs/v2.8d1-correcao-dryrun-limpeza-controlada.md`
- `docs/v2.8e12-ajuste-final-cabecalho-logo.md`
- `docs/v2.8e13-remover-fundo-logo-menu.md`
- `docs/v2.9a-base-administracao-usuarios-alcadas.md`
- `docs/v2.9a-regras-acesso-perfis-categorias.md`
- `docs/v2.9a-banner-usuario-perfil.md`
- `docs/v2.9b-escrita-administrativa-controlada.md`
- `docs/v2.9b-payloads-usuarios-alcadas.md`
- `docs/v2.9b-regras-admin-historico.md`
- `docs/v2.9c-administracao-pelo-sistema.md`
- `docs/v2.9c-prevalidacao-escrita-admin.md`
- `docs/v2.9c-historico-administrativo.md`
- `docs/v2.9c1-correcao-prevalidacao-duplicidade-usuario.md`
- `docs/v2.9c2-corrigir-bad-request-escrita-admin.md`
- `docs/v2.8e-pagina-dedicada-sistema-enac.md`
- `docs/v2.8e-acesso-permissoes-pagina-sistema.md`
- `docs/v2.8e1-full-bleed-largura-total-webpart.md`
- `docs/v2.8e2-ajuste-layout-tela-cheia.md`
- `docs/v2.8e3-corrigir-painel-interno-largura.md`
- `docs/v2.8e4-full-viewport-controlado.md`
- `docs/v2.8e6-versionamento-cache-publicacao-spfx.md`
- `docs/v2.8e7-corrigir-corte-lateral-full-viewport.md`
- `docs/v2.8e8-painel-branco-largura-total.md`
- `docs/v2.8e9-forcar-grid-principal-largura-total.md`
- `docs/v2.8e10-breakout-medido-viewport.md`
- `docs/v2.8e11-ajuste-fino-breakout-medido.md`
- `sharepoint/plano-permissoes-finas-v2.6b.md`
- `sharepoint/auditoria-permissoes-finas-v2.6b3.md`
- `sharepoint/listas-existentes.md`
- `sharepoint/list-schema.json`
- `sharepoint/mapeamento-listas-reais-v2.3.md`
- `tests/roteiro-v2.6b1-dryrun-permissoes-finas.md`
- `tests/roteiro-v2.6b2-revisao-script-permissoes-finas.md`
- `tests/roteiro-v2.6b3-auditoria-readonly-permissoes-finas.md`
- `tests/roteiro-v2.6b3c-auditoria-manual-grupos-permissoes.md`
- `tests/roteiro-v2.6b4-prep-criacao-manual-grupos-enac.md`
- `tests/roteiro-v2.6b4-aplicacao-real-controlada-permissoes-administrativas.md`
- `tests/roteiro-v2.6b4c-finalizacao-manual-permissoes-administrativas.md`
- `tests/roteiro-v2.7a-escrita-operacional-restrita.md`
- `tests/roteiro-v2.7a2-teste-funcional-controlado.md`
- `tests/roteiro-v2.7a3-teste-snapshot-operacional.md`
- `tests/roteiro-v2.7a4-teste-criar-pedido-compra.md`
- `tests/roteiro-v2.7a4a-teste-aprovar-compra.md`
- `tests/roteiro-v2.7a5-teste-criar-pedido-compra.md`
- `tests/roteiro-v2.7a6-teste-vincular-nota-fiscal.md`
- `tests/roteiro-v2.7a7-teste-programar-pagamento.md`
- `tests/roteiro-v2.8a-homologacao-assistida-fluxo-completo.md`
- `tests/roteiro-v2.8b-homologacao-assistida-equipe.md`
- `tests/checklist-v2.8b-evidencias.md`
- `tests/checklist-v2.8c-validacao-visual-admin.md`
- `tests/checklist-v2.8d-limpeza-controlada.md`
- `tests/checklist-v2.8e12-validacao-cabecalho-logo.md`
- `tests/checklist-v2.8e13-validacao-logo-menu.md`
- `tests/checklist-v2.9a-validacao-admin-usuarios-alcadas.md`
- `tests/checklist-v2.9b-prevalidacao-admin.md`
- `tests/checklist-v2.9c-escrita-admin-controlada.md`
- `tests/checklist-v2.9c1-prevalidacao-usuario-existente.md`
- `tests/checklist-v2.9c2-escrita-admin-sem-400.md`
- `tests/checklist-v2.8e-validacao-pagina-app.md`
- `tests/checklist-v2.8e1-validacao-largura-total.md`
- `tests/checklist-v2.8e2-validacao-layout-tela-cheia.md`
- `tests/checklist-v2.8e3-validacao-painel-interno.md`
- `tests/checklist-v2.8e4-validacao-full-viewport.md`
- `tests/checklist-v2.8e6-validacao-pacote-carregado.md`
- `tests/checklist-v2.8e7-validacao-corte-lateral.md`
- `tests/checklist-v2.8e8-validacao-painel-branco.md`
- `tests/checklist-v2.8e9-validacao-grid-principal.md`
- `tests/checklist-v2.8e10-validacao-breakout-medido.md`
- `tests/checklist-v2.8e11-validacao-largura-sem-overflow.md`
- `reports/lista04-notas-fiscais-fields-readonly.json`
- `reports/lista04-notas-fiscais-fields-readonly.md`
- `docs/v2.7a4b-aprovacao-diretoria-alcada-superior.md`
- `sharepoint/auditoria-manual-grupos-permissoes-v2.6b3c.template.md`
- `sharepoint/auditoria-manual-grupos-permissoes-v2.6b3c.md`
- `sharepoint/auditoria-grupos-enac-v2.6b4-prep.template.md`
- `sharepoint/auditoria-grupos-enac-v2.6b4-prep.md`
- `sharepoint/auditoria-pos-aplicacao-permissoes-v2.6b4.template.md`
- `sharepoint/auditoria-pos-aplicacao-manual-permissoes-v2.6b4c.template.md`
- `sharepoint/auditoria-pos-aplicacao-manual-permissoes-v2.6b4d.md`
- `scripts/sharepoint/10-permissoes-finas-v2.6b-dryrun.ps1`
- `scripts/sharepoint/11-permissoes-finas-v2.6b-apply.ps1`
- `scripts/sharepoint/12-permissoes-finas-v2.6b-readonly-auditoria.ps1`
- `scripts/sharepoint/11-auditoria-lista03-pedidos-readonly.ps1`
- `scripts/sharepoint/12-auditoria-lista04-notas-fiscais-readonly.ps1`
- `scripts/sharepoint/13-auditoria-lista05-contas-pagar-readonly.ps1`
- `scripts/sharepoint/14-inventario-limpeza-dados-teste-readonly.ps1`
- `scripts/sharepoint/15-limpeza-dados-teste-controlada.ps1`
- `scripts/sharepoint/17-auditoria-usuarios-alcadas-readonly.ps1`
- `scripts/sharepoint/16-criar-pagina-sistema-enac-app-page.ps1`
- `src/prototype/`
- `src/webparts/enacSistema/`
- `tests/fluxos-mvp.md`

## Implementação oficial

A implementação oficial da webpart é `src/webparts/enacSistema`.

A árvore antiga `src/webparts/sistemaEnac` continha lógica obsoleta e não deve ser usada como base funcional. Ela foi arquivada como marcador em `src/webparts/_legacy/sistemaEnac`, sem manter código operacional conflitante.

## Decisões pendentes

- Revisar o plano V2.6A antes de subir pacote e antes de qualquer teste de escrita no tenant.
- Definir se aprovações finais serão mantidas em Power Automate ou migrarão para lógica da aplicação.
- Confirmar perfis finais por grupo Microsoft 365.
- Definir governança formal para alteração de parâmetros administrativos.
- Implementar permissões reais SharePoint/Teams e fluxos Power Automate. Até isso existir, a V2.3 ainda não representa a segurança definitiva do fluxo.
