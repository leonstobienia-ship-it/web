# Roteiro V2.5A - Validacao manual readonly na interface

Data: 2026-06-05

## Preparacao

- [ ] Usar o pacote SHIP mais recente: `sharepoint/solution/enac-sistema-spfx.sppkg`.
- [ ] Substituir manualmente o pacote no App Catalog, se autorizado.
- [ ] Abrir pagina restrita de teste.
- [ ] Abrir Console e Network do navegador.
- [ ] Nao iniciar Power Automate.

## Dashboard

- [ ] Webpart renderiza.
- [ ] Visual basico permanece preservado.
- [ ] Cards mostram `Solicitacoes ativas`, `Aguardando cotacao` e `Aguardando aprovacao`.
- [ ] Console indica fonte dos cards como SharePoint quando leituras passarem.
- [ ] Se SharePoint falhar, fallback local permanece funcional.

## Administracao - Usuarios

- [ ] Abrir `adminUsuarios`.
- [ ] Confirmar exibicao readonly de usuarios/perfis.
- [ ] Confirmar campos: Nome, Usuario interno, Perfil, Cargo/funcao, Status.
- [ ] Confirmar que e-mails reais nao sao exibidos por padrao.
- [ ] Confirmar ausencia de botao salvar/editar/excluir.

## Administracao - Alcadas

- [ ] Abrir `adminAlcadas`.
- [ ] Confirmar exibicao readonly de alcadas.
- [ ] Confirmar campos: Regra, Processo, Tipo, Faixa, Aprovador, Status.
- [ ] Confirmar valores monetarios em R$ pt-BR.
- [ ] Confirmar ausencia de botao criar/editar/excluir.

## Administracao - Historico

- [ ] Abrir `adminHistorico`.
- [ ] Confirmar historico readonly real quando houver dados.
- [ ] Confirmar fallback local se historico real nao estiver disponivel.

## Network

- [ ] Confirmar ausencia de `POST`.
- [ ] Confirmar ausencia de `MERGE`.
- [ ] Confirmar ausencia de `PATCH`.
- [ ] Confirmar ausencia de `DELETE`.
- [ ] Confirmar ausencia de HTTP 400 nos GET das listas administrativas ja corrigidas.

## Resultado

- Resultado final: aprovado / aprovado com ressalvas / nao aprovado.
- Observacoes sanitizadas:
