# Roteiro de Homologacao da Equipe

## Preparacao

1. Confirmar PostgreSQL local healthy.
2. Confirmar `/health` e `/health/db`.
3. Executar `npm.cmd run seed:homologacao`.
4. Executar `npm.cmd run smoke:homologacao`.
5. Abrir o frontend em `http://127.0.0.1:5173`.
6. Entrar no menu `Gestao > Homologacao`.

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

## Coleta de feedback

Registrar cada apontamento com:

- perfil;
- modulo;
- passo executado;
- resultado esperado;
- resultado obtido;
- impacto operacional;
- evidencia, quando houver;
- prioridade sugerida.

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
