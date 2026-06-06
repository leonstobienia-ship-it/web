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
- `sharepoint/listas-existentes.md`
- `sharepoint/list-schema.json`
- `sharepoint/mapeamento-listas-reais-v2.3.md`
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
