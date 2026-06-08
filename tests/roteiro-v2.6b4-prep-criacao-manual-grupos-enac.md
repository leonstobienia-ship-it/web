# Roteiro V2.6B.4-PREP - Criacao Manual dos Grupos ENAC

Data: 2026-06-08

## Objetivo

Orientar Leon a criar ou revisar manualmente os grupos ENAC no SharePoint, sem aplicar permissoes nas listas administrativas.

## A. Abrir site

Abrir:

`https://enaccombr.sharepoint.com/sites/Equipe.Obras`

## B. Abrir permissoes do site

Acessar:

1. Configuracoes do site.
2. Permissoes do site.
3. Configuracoes avancadas de permissoes, ou equivalente em portugues.

## C. Criar ou revisar grupos

Conferir estes nomes exatamente:

- ENAC Sistema Admin
- ENAC Diretoria
- ENAC Planejamento
- ENAC Compras Financeiro
- ENAC Cotacoes Contratos
- ENAC Campo Engenharia
- ENAC Leitura Auditoria

Para cada grupo:

- se ja existir, nao duplicar;
- se nao existir, criar com nome exatamente igual;
- registrar `EXISTE`, `CRIADO`, `JA_EXISTIA` ou `NAO_CRIADO`;
- conferir membros iniciais por funcao;
- nao copiar e-mails para o relatorio;
- nao conceder permissao nas listas administrativas nesta etapa.

## D. Membros iniciais por funcao

| Grupo | Membros iniciais por funcao |
| --- | --- |
| ENAC Sistema Admin | Leon |
| ENAC Diretoria | Leon |
| ENAC Planejamento | Gustavo |
| ENAC Compras Financeiro | Matheus |
| ENAC Cotacoes Contratos | Kemilly |
| ENAC Campo Engenharia | Inicialmente vazio ou equipe de campo futura |
| ENAC Leitura Auditoria | Inicialmente vazio ou uso futuro |

Nao incluir jovens aprendizes em grupos administrativos. Nao incluir usuarios externos sem decisao explicita.

## E. Nao alterar listas

Nao quebrar heranca e nao alterar permissoes de:

- ENAC Usuarios Perfis
- ENAC Alcadas
- ENAC Historico Configuracoes
- ENAC Snapshots Regras

## F. Preencher relatorio

Usar:

`sharepoint/auditoria-grupos-enac-v2.6b4-prep.template.md`

Registrar somente status, quantidade de membros e observacoes curtas. Nao registrar e-mails.

## G. Informar ao Codex

Apos a execucao manual, informar:

- quais grupos foram criados;
- quais grupos ja existiam;
- quantidade de membros por grupo;
- se as permissoes das listas administrativas foram mantidas inalteradas;
- se houve duvida ou erro na criacao.

## Resultado esperado

Os grupos ENAC ficam prontos para a V2.6B.4, ou as pendencias ficam claras antes de qualquer aplicacao real.

## Resultado registrado

Leon criou manualmente os sete grupos ENAC planejados e adicionou os membros funcionais previstos.

O relatorio preenchido esta em `sharepoint/auditoria-grupos-enac-v2.6b4-prep.md`.

Confirmacoes registradas:

- permissoes das listas administrativas nao foram alteradas;
- heranca das listas administrativas foi preservada;
- script 11 nao foi executado;
- `-Apply` nao foi usado;
- Power Automate nao foi iniciado.
