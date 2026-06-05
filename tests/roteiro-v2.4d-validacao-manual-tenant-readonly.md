# Roteiro V2.4D - Validacao manual tenant readonly

Data: 2026-06-05

## Identificacao da validacao

- Site/pagina de teste: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/SitePages/Teste-Sistema-ENAC-V2.4E-Readonly.aspx`
- Usuario usado: Leon
- Data/hora: 2026-06-05
- Pacote usado: pacote SHIP V2.4F gerado a partir do commit `d37a514`
- Resultado final: aprovado com observacao nao bloqueante

## Checklist antes de publicar

- [ ] Confirmar que a pagina e restrita/teste.
- [ ] Confirmar que nao ha Power Automate envolvido.
- [ ] Confirmar que nao serao alteradas listas, colunas, permissoes ou itens.
- [ ] Confirmar que o pacote e o SHIP mais recente gerado na V2.4E.
- [ ] Para V2.4F, confirmar que o pacote e o SHIP mais recente gerado apos a correcao dos HTTP 400.
- [ ] Confirmar plano de rollback manual.

Resultado V2.4F: checklist atendido manualmente por Leon; Power Automate nao iniciado.

## Execucao manual

- [ ] Abrir App Catalog ou area autorizada de apps.
- [ ] Fazer upload do `.sppkg`, se autorizado.
- [ ] Instalar/disponibilizar no site de teste, se necessario.
- [ ] Adicionar webpart em pagina controlada.
- [ ] Abrir console do navegador.
- [ ] Recarregar a pagina.
- [ ] Capturar logs `[ENAC][V2.4C]` sem dados sensiveis.

## Diagnostico esperado

- [ ] Webpart renderiza.
- [ ] Visual permanece equivalente ao homologado.
- [ ] Console indica `origemDadosEfetiva: sharepoint`, se as leituras passarem.
- [ ] Contagem de usuarios/perfis registrada:
- [ ] Contagem de alcadas registrada:
- [ ] Contagem de requisicoes resumo registrada:
- [ ] Diagnostico readonly sem erro critico de permissao:
- [ ] V2.4F: GET de `ENAC Usuarios Perfis` sem HTTP 400.
- [ ] V2.4F: GET de `ENAC Alcadas` sem HTTP 400.

Resultado V2.4F:

- [x] Webpart renderizou.
- [x] Visual basico preservado.
- [x] GET de `ENAC Usuarios Perfis` (`99cb9bae-5589-4f8b-854b-08adce371e82`) retornou 200.
- [x] GET de `ENAC Alcadas` (`901d4458-15b4-427b-a869-161c63cf70ef`) retornou 200.
- [x] Erros 400 anteriores nao apareceram mais.

## Network

- [ ] Confirmar ausencia de `POST`.
- [ ] Confirmar ausencia de `MERGE`.
- [ ] Confirmar ausencia de `PATCH`.
- [ ] Confirmar ausencia de `DELETE`.
- [ ] Confirmar que chamadas observadas sao de leitura.

Resultado V2.4F: nao houve evidencia de `POST`, `MERGE`, `PATCH` ou `DELETE` da webpart.

## Warnings nao bloqueantes V2.4F

- Some icons were re-registered...
- `Uncaught ReferenceError: Cannot access 't' before initialization` em `suiteux.shell.search`.

Classificacao: eventos externos do shell/search do SharePoint, registrados para rastreabilidade e nao tratados como defeito da webpart ENAC nesta rodada.

## Criterios de parada

- [ ] Erro de permissao de leitura.
- [ ] Erro de renderizacao.
- [ ] Erro JavaScript recorrente.
- [ ] Qualquer tentativa de escrita.
- [ ] Alteracao visual indevida.

## Rollback

- [ ] Remover webpart da pagina de teste.
- [ ] Remover app do site, se necessario.
- [ ] Nao alterar listas para contornar falha.
- [ ] Registrar ressalva ou falha antes de nova rodada.

## Observacoes

Registrar apenas informacoes tecnicas e sanitizadas. Nao colar e-mails, nomes desnecessarios, documentos, anexos, tokens ou dados operacionais reais.
