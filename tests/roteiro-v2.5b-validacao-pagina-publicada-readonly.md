# Roteiro V2.5B - Validacao pagina publicada readonly

Data: 2026-06-05

## Preparacao

- [ ] Confirmar que o pacote V2.5A mais recente ja esta no App Catalog.
- [ ] Usar pagina restrita de teste: `https://enaccombr.sharepoint.com/sites/Equipe.Obras/SitePages/Teste-Sistema-ENAC-V2.4E-Readonly.aspx`.
- [ ] Publicar a pagina ou abrir visualizacao final, se adequado.
- [ ] Nao executar Power Automate.
- [ ] Nao alterar dados, listas, colunas ou permissoes.

## Validacao visual

- [ ] Abrir a pagina como usuario autorizado.
- [ ] Confirmar que a webpart renderiza.
- [ ] Confirmar que o layout nao quebra fora do modo edicao.
- [ ] Confirmar dashboard.
- [ ] Confirmar menu lateral.
- [ ] Confirmar `adminUsuarios`.
- [ ] Confirmar `adminAlcadas`.
- [ ] Confirmar `adminHistorico`.

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

1. Pagina publicada/visualizacao final abriu: sim/nao
2. Webpart renderizou: sim/nao
3. Dashboard: real/fallback/quebrou
4. `adminUsuarios`: real/fallback/quebrou
5. `adminAlcadas`: real/fallback/quebrou
6. `adminHistorico`: real/fallback/quebrou
7. `0a204b87`: 200/304/outro
8. `99cb9bae`: 200/304/outro
9. `901d4458`: 200/304/outro
10. Houve `POST/MERGE/PATCH/DELETE` da webpart: sim/nao
11. Resultado visual: normal/com ressalva/quebrado
12. Resultado final: aprovado/aprovado com ressalvas/nao aprovado

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
