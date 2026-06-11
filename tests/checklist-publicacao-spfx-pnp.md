# Checklist - Publicacao SPFx via PnP.PowerShell

## Antes de publicar

- [ ] Confirmar que `src/prototype/app.js` nao foi alterado.
- [ ] Confirmar que o backup V2.2 nao foi alterado.
- [ ] Confirmar que nao ha mudancas de listas, dados, permissoes funcionais ou Power Automate no escopo.
- [ ] Confirmar que o pacote existe em `sharepoint\solution\enac-sistema-spfx.sppkg`.
- [ ] Confirmar que o pacote foi gerado apos `gulp bundle --ship` e `gulp package-solution --ship`.
- [ ] Rodar dry-run do script `18-publicar-pacote-spfx-pnp.ps1`.
- [ ] Conferir `reports/v2.x-publicacao-spfx-pnp-dryrun.md`.

## Publicacao controlada

- [ ] Obter autorizacao explicita de Leon para executar publicacao automatizada.
- [ ] Executar o script com `-Execute` e token `CONFIRMAR-PUBLICACAO-SPFX-SISTEMA-ENAC`.
- [ ] Fazer login apenas por fluxo interativo ou device login.
- [ ] Confirmar que o relatorio `reports/v2.x-publicacao-spfx-pnp-execucao.md` foi criado.
- [ ] Confirmar que o relatorio nao contem tokens, senhas ou credenciais.

## Validacao apos publicacao

- [ ] Abrir o App Catalog e confirmar que o pacote foi atualizado.
- [ ] Abrir o site `https://enaccombr.sharepoint.com/sites/Equipe.Obras`.
- [ ] Confirmar que o app Sistema ENAC esta instalado/atualizado.
- [ ] Abrir a pagina de homologacao do Sistema ENAC: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/SitePages/Sistema-ENAC---Homologação.aspx?env=WebView`.
- [ ] Validar em cache novo que o asset SPFx carregado corresponde ao build atual.
- [ ] Confirmar que a tela inicial abre sem erro.
- [ ] Confirmar que nenhuma lista ou dado operacional foi alterado durante a publicacao.

## Registro

- [ ] Registrar versao do pacote publicada.
- [ ] Registrar data/hora da publicacao.
- [ ] Registrar usuario que executou a publicacao.
- [ ] Registrar resultado da validacao visual da pagina.
- [ ] Registrar riscos ou pendencias encontrados.
