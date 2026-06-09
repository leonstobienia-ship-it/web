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

Na V2.7A.4C/V2.7A.4D, a validacao manual de `AprovarCompra` foi registrada como pendente de auditoria porque Leon observou o campo visual `Snapshot da Aprovação de Compra` vazio no formulario do SharePoint. A rotina foi corrigida localmente para confirmar `SnapshotAprovacaoCompra` por GET apos o MERGE de status, registrar historico somente quando o snapshot for preservado e retornar alerta critico se o lookup nao for comprovado. Codex nao conectou ao SharePoint, nao alterou tenant/listas/dados e nao executou nova escrita operacional.

Na V2.7A.4E, Leon confirmou manualmente que o campo `Snapshot da Aprovação de Compra` do item `11` permaneceu vinculado ao snapshot `3` / `SNAP-V2.7A-TESTE-11-20260609025123` apos `AprovarCompra`. A acao fica VALIDADA MANUALMENTE para Diretoria como alçada superior, com status `Aguardando aprovação -> Aprovada para compra`, historico criado, HTTP escrita `204`, sem pedido, NF, pagamento ou Power Automate. Isso nao representa liberacao ampla de producao.

Na V2.7A.5, `CriarPedidoCompra` foi preparado apenas como diagnostico/pre-validacao no Property Pane. A execucao permanece bloqueada porque a estrutura real da `Lista 03 — Pedidos de Compra` ainda exige auditoria readonly: o inventario local confirma o GUID `18ca132a-c36a-42aa-9968-d87ecd547a79` e campos como `ValordoPedido`, `DatadoPedido` e `StatusdoPedido`, mas nao confirma `SolicitacaoId`, choices de status nem obrigatoriedade/campo correto de fornecedor. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.5A, foi preparado um script PowerShell readonly para Leon auditar manualmente a estrutura real da `Lista 03 — Pedidos de Compra`: `scripts/sharepoint/11-auditoria-lista03-pedidos-readonly.ps1`. O script deve gerar relatórios em `reports/` e nao foi executado pelo Codex. `CriarPedidoCompra` continua bloqueado ate o resultado da auditoria confirmar campo de vinculo, fornecedor correto, choices de `StatusdoPedido` e campos obrigatorios.

Na V2.7A.5B, `CriarPedidoCompra` foi adaptado localmente ao schema real confirmado da `Lista 03 — Pedidos de Compra`. Como a auditoria readonly nao confirmou `SolicitacaoId`, o pedido passa a usar vinculo textual temporario por `N_x00ba_daRequisi_x00e7__x00e3_o`; o fornecedor obrigatorio usa `Fornecedor0Id`; e o status inicial previsto e `Em elaboração`. A execucao futura exige `fornecedorTesteIdV27A` valido, pre-validacao sem alertas, inexistencia de pedido anterior e confirmacao manual. Codex nao conectou ao SharePoint, nao publicou pacote, nao alterou tenant/listas/dados e nao executou escrita.

Na V2.7A.5C, Leon registrou a validacao manual de `CriarPedidoCompra`. Em 09/06/2026, apos pre-validacao aprovada, foi criado o pedido item `3` na `Lista 03 — Pedidos de Compra`, vinculado textualmente por `N_x00ba_daRequisi_x00e7__x00e3_o = V2.7A-TESTE-001`, com fornecedor correto no lookup `Fornecedor0` (`00.000.000/0001-00`), valor `6720`, status `Em elaboração`, historico criado e HTTP escrita `201`. O item `11` permaneceu em `Aprovada para compra`, o snapshot `3` permaneceu vinculado, nao houve `PATCH`/`DELETE`, NF/pagamento nao foram criados, as flags V2.7A foram desligadas e a pagina foi republicada. A acao fica validada manualmente como controlada, sem liberacao ampla de producao e sem Power Automate.

Na V2.7A.6, foi preparada a proxima etapa `VincularNotaFiscal` como auditoria readonly da `Lista 04 - Notas Fiscais Recebidas`, GUID `25aa4447-193d-418a-8e71-9bfd8e9995da`. O inventario local indica campos como `N_x00ba_doPedido`, `N_x00ba_daNotaFiscal`, `Fornecedor0`, `ValorBrutodaNF`, `DatadeEmiss_x00e3_o`, `DatadeVencimento` e `StatusdaConfer_x00ea_ncia`, mas ainda falta auditoria especifica para confirmar vinculo com pedido, choices, obrigatoriedade, anexo/documento e inexistencia de NF de teste. Foi criado script readonly para execucao manual por Leon; `VincularNotaFiscal` permanece bloqueada e nenhum TypeScript de escrita foi preparado.

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
