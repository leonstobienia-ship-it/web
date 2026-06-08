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
