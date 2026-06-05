# Roteiro V2.4D - Validacao manual tenant readonly

Data: 2026-06-05

## Identificacao da validacao

- Site/pagina de teste:
- Usuario usado:
- Data/hora:
- Pacote usado: `sharepoint/solution/enac-sistema-spfx.sppkg` gerado em modo SHIP na V2.4E
- Resultado final: aprovado / aprovado com ressalvas / nao aprovado

## Checklist antes de publicar

- [ ] Confirmar que a pagina e restrita/teste.
- [ ] Confirmar que nao ha Power Automate envolvido.
- [ ] Confirmar que nao serao alteradas listas, colunas, permissoes ou itens.
- [ ] Confirmar que o pacote e o SHIP mais recente gerado na V2.4E.
- [ ] Confirmar plano de rollback manual.

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

## Network

- [ ] Confirmar ausencia de `POST`.
- [ ] Confirmar ausencia de `MERGE`.
- [ ] Confirmar ausencia de `PATCH`.
- [ ] Confirmar ausencia de `DELETE`.
- [ ] Confirmar que chamadas observadas sao de leitura.

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
