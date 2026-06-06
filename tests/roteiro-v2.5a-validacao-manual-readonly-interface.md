# Roteiro V2.5A - Validacao manual readonly na interface

Data: 2026-06-05

## Preparacao

- [x] Usar o pacote SHIP mais recente: `sharepoint/solution/enac-sistema-spfx.sppkg`.
- [x] Substituir manualmente o pacote no App Catalog, se autorizado.
- [x] Abrir pagina restrita de teste: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/SitePages/Teste-Sistema-ENAC-V2.4E-Readonly.aspx`.
- [x] Abrir Console e Network do navegador.
- [x] Nao iniciar Power Automate.

## Dashboard

- [x] Webpart renderiza.
- [x] Visual basico permanece preservado.
- [x] Lista 02 - Requisicoes de Compra (`0a204b87-b9a1-4d16-8654-55567a62ed01`) retornou GET/fetch 200.
- [x] Uma resposta 304 foi interpretada como cache/Not Modified, nao erro de leitura.
- [ ] Cards mostram `Solicitacoes ativas`, `Aguardando cotacao` e `Aguardando aprovacao`.
- [ ] Console indica fonte dos cards como SharePoint quando leituras passarem.
- [ ] Se SharePoint falhar, fallback local permanece funcional.

## Administracao - Usuarios

- [x] Abrir `adminUsuarios`.
- [x] Confirmar fonte `SharePoint readonly`.
- [x] Confirmar exibicao readonly de usuarios/perfis reais de teste.
- [x] Confirmar campos: Nome, Usuario interno, Perfil, Cargo/funcao.
- [x] Confirmar que e-mails reais nao sao exibidos por padrao.
- [ ] Confirmar ausencia de botao salvar/editar/excluir.

Usuarios observados: V2.3B-TESTE - Leon, Gustavo, Matheus e Kemilly.

## Administracao - Alcadas

- [x] Abrir `adminAlcadas`.
- [x] Confirmar fonte `SharePoint readonly`.
- [x] Confirmar exibicao readonly de alcadas reais de teste.
- [x] Confirmar campos: Regra, Processo, Tipo, Faixa, Aprovador, Status.
- [x] Confirmar valores monetarios em R$ pt-BR.
- [ ] Confirmar ausencia de botao criar/editar/excluir.

Alcadas observadas: `alc-v23b-teste-compra-ate-20000` e `alc-v23b-teste-compra-acima-20000`.

## Administracao - Historico

- [x] Abrir `adminHistorico`.
- [x] Confirmar fonte `SharePoint readonly`.
- [x] Confirmar historico readonly real quando houver dados.
- [ ] Confirmar fallback local se historico real nao estiver disponivel.

Historico observado: Parametro Geral; carga inicial de usuarios, alcadas e snapshot de teste V2.3B; usuario Leon Stobienia; justificativa de teste funcional controlado/provisionamento estrutural.

## Network

- [ ] Confirmar ausencia de `POST`.
- [ ] Confirmar ausencia de `MERGE`.
- [ ] Confirmar ausencia de `PATCH`.
- [ ] Confirmar ausencia de `DELETE`.
- [x] Confirmar ausencia de HTTP 400 nos GET das listas validadas.

Sem evidencia de escrita nos prints. O codigo validado mantem bloqueio tecnico de escrita. Pendencia opcional: confirmar filtros `POST`, `PATCH`, `MERGE` e `DELETE` no Network.

## Observacoes nao bloqueantes

- Warnings remanescentes aparentam ser do SharePoint/SuiteNav/Search, nao da webpart ENAC.
- Validacao visual realizada em pagina ainda em modo edicao; validar pagina publicada/visualizacao final antes de uso operacional.

## Resultado

- Resultado final: V2.5A aprovada manualmente com observacao nao bloqueante.
- Observacoes sanitizadas: sem erros HTTP 400 nas listas validadas; sem evidencia de escrita nos prints; Power Automate nao iniciado.
