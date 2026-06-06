# Roteiro V2.5B - Validacao pagina publicada readonly

Data: 2026-06-05

## Preparacao

- [x] Confirmar que o pacote V2.5A mais recente ja esta no App Catalog.
- [x] Usar pagina restrita de teste: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/SitePages/Teste-Sistema-ENAC-V2.4E-Readonly.aspx`.
- [x] Publicar a pagina ou abrir visualizacao final, se adequado.
- [x] Nao executar Power Automate.
- [x] Nao alterar dados, listas, colunas ou permissoes.

## Validacao visual

- [x] Abrir a pagina como usuario autorizado.
- [x] Confirmar que a webpart renderiza.
- [x] Confirmar que o layout nao quebra fora do modo edicao.
- [x] Confirmar dashboard.
- [x] Confirmar menu lateral.
- [x] Confirmar `adminUsuarios` conforme evidencia V2.5A.
- [x] Confirmar `adminAlcadas` conforme evidencia V2.5A.
- [x] Confirmar `adminHistorico` conforme evidencia V2.5A.

Valores observados no dashboard publicado:

- `Solicitacoes ativas`: `7`;
- `Aguardando cotacao`: `0`;
- `Aguardando aprovacao`: `2`.

## DevTools

1. Abrir F12.
2. Abrir aba Network.
3. Filtrar por Fetch/XHR.
4. Marcar Preserve log.
5. Marcar Disable cache.
6. Recarregar com Ctrl+F5.

## Leituras esperadas

Filtrar por:

- `0a204b87`
- `99cb9bae`
- `901d4458`

Esperado:

- `200` para leitura normal;
- `304` aceitavel quando for cache/Not Modified;
- nao aceitar `400`, `401`, `403` ou `500`.

## Escrita

Filtrar por:

- `POST`
- `PATCH`
- `MERGE`
- `DELETE`

Esperado:

- nenhuma chamada da webpart ENAC.

## Registro para retorno ao Codex

Preencher:

1. Pagina publicada/visualizacao final abriu: sim.
2. Webpart renderizou: sim.
3. Dashboard: real, com cards `7`, `0` e `2`.
4. `adminUsuarios`: real, conforme validacao V2.5A.
5. `adminAlcadas`: real, conforme validacao V2.5A.
6. `adminHistorico`: real, conforme validacao V2.5A.
7. `0a204b87`: 200 confirmado na V2.5A; sem relato de erro na V2.5B.
8. `99cb9bae`: 200 confirmado na V2.5A; sem relato de erro na V2.5B.
9. `901d4458`: 200 confirmado na V2.5A; sem relato de erro na V2.5B.
10. Houve `POST/MERGE/PATCH/DELETE` da webpart: nao houve evidencia; escrita permanece bloqueada no codigo.
11. Resultado visual: normal.
12. Resultado final: aprovado.

## Resultado V2.5B

Status: `V2.5B APROVADA MANUALMENTE`

Observacao: a validacao final de ausencia de escrita em pagina publicada foi registrada pela declaracao manual de Leon e pela ausencia de erro visual. A base tecnica readonly ja estava confirmada por auditoria de codigo e pela validacao V2.5A.

## Criterios de aprovacao

- Pagina publicada ou visualizacao final abre.
- Webpart renderiza.
- Dashboard nao quebra.
- `adminUsuarios`, `adminAlcadas` e `adminHistorico` exibem dados reais readonly ou fallback seguro.
- Leituras principais retornam `200` ou `304` aceitavel.
- Nao ha `POST`, `PATCH`, `MERGE` ou `DELETE` da webpart.
- Visual permanece aceitavel fora do modo edicao.

## Criterios de parada

- Webpart nao renderiza.
- Layout quebra fora do modo edicao.
- Leituras principais retornam `400`, `401`, `403` ou `500`.
- Qualquer escrita da webpart.
- Power Automate e iniciado por engano.
- Alguma lista, permissao ou dado precisa ser alterado para passar no teste.
