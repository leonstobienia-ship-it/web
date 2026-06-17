# Roteiro de Homologacao da Equipe

## Preparacao

1. Confirmar PostgreSQL local healthy.
2. Confirmar `/health` e `/health/db`.
3. Executar `npm.cmd run seed:homologacao`.
4. Executar `npm.cmd run smoke:homologacao`.
5. Abrir o frontend em `http://127.0.0.1:5173`.
6. Entrar no menu `Gestao > Homologacao`.
7. Abrir este pacote junto com `docs/erp/pacote-homologacao-assistida.md`.
8. Registrar feedback usando `docs/erp/modelo-feedback-homologacao.md`.

## Marcador

Todos os dados da seed usam o marcador:

```text
DEV_LOCAL_HOMOLOGACAO_ENAC_V316
```

## Roteiro por perfil

| Perfil | Responsavel | Modulos |
| --- | --- | --- |
| Diretoria | Leon | Dashboard Executivo, Previsto x Realizado, Central de Tarefas |
| Planejamento | Gustavo | Orcamentos, Contratos, Medicoes, Previsto x Realizado |
| Compras | Matheus | Solicitacoes, Cotacoes, Pedidos, Fornecedores |
| Financeiro | Matheus | Notas, Contas a Pagar, Programacoes, Relatorios |
| Campo | Davison | Solicitacoes, Riscos, Medicoes |
| Admin | Admin teste | Administracao, Auditoria, Documentos |

## Sessoes assistidas

| Ordem | Sessao | Publico | Objetivo |
| --- | --- | --- | --- |
| 1 | Abertura | Todos | Confirmar escopo, limites, ambiente e forma de registrar feedback |
| 2 | Diretoria | Leon | Validar indicadores, margem, riscos e aprovacoes criticas |
| 3 | Planejamento | Gustavo | Validar contrato, aditivo, orcamento, planejamento e medicao |
| 4 | Compras | Matheus | Validar solicitacao, cotacao, mapa, pedido e fornecedores |
| 5 | Financeiro | Matheus | Validar NF, contas, programacao, conferencia, baixa manual de teste e relatorios |
| 6 | Campo | Davison e Kemilly | Validar solicitacoes, status, medicoes, pendencias e documentos mockados |
| 7 | Admin | Admin teste | Validar usuarios, perfis, alcadas, auditoria e documentos |
| 8 | Encerramento | Responsaveis | Consolidar aceite, ressalvas e backlog V3.18 |

## Coleta de feedback

Registrar cada apontamento com:

- perfil;
- usuario avaliador;
- modulo;
- tela;
- tipo;
- severidade;
- prioridade;
- passo executado;
- resultado esperado;
- resultado obtido;
- impacto operacional;
- evidencia, quando houver;
- decisao;
- responsavel;
- versao alvo;
- status.

## Criterios de aceite

- Todos os perfis executaram seu roteiro minimo.
- A seed local foi localizada na tela Homologacao.
- Feedbacks foram registrados e classificados.
- Nao houve bloqueio critico sem contorno.
- Nao houve acao proibida funcional.

## Criterios de bloqueio

- API ou PostgreSQL indisponivel.
- Seed ou smoke de homologacao falha.
- Tela essencial nao abre.
- Perfil nao consegue validar seu modulo principal.
- Pagamento real, CNAB, banco real, NFS-e real, prefeitura, boleto real, upload externo, SharePoint real, Graph real, Entra real, Power Automate real ou `DELETE` fisico aparece como acao funcional.

## Fora do escopo

- Pagamento real.
- Baixa bancaria.
- CNAB.
- Banco real.
- NFS-e real.
- Prefeitura.
- Boleto real.
- SharePoint real.
- Microsoft Graph real.
- Entra real.
- Power Automate.
- Upload externo.

## Abertura da V3.18

Abrir V3.18 somente depois da coleta de feedback real e priorizada pela equipe.
