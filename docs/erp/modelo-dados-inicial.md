# Modelo de Dados Inicial do ERP ENAC

## Escopo V3.2

Este documento traduz o blueprint V3.1 para uma fundacao de dados inicial. O objetivo e preparar contratos de dados para React, backend Node.js e PostgreSQL, sem migrar dados reais e sem escrever no SharePoint.

## Eixos obrigatorios

- `company_id`: base para multi-CNPJ e segregacao fiscal/financeira.
- `obra_id`: base para engenharia, compras, medicoes, AP, AR e rentabilidade.
- `centro_custo_id`: base para DRE simplificada, aprovacao e controle orcamentario.
- `status`: estado operacional padrao por entidade.
- `created_at`, `updated_at`, `created_by`, `updated_by`: trilha minima antes da auditoria append-only.

## Entidades iniciais

| Grupo | Entidades V3.2 |
|---|---|
| Organizacao | empresas, centros_custo |
| Acesso | usuarios, perfis |
| Partes | clientes, fornecedores |
| Obras | obras, medicoes_obra |
| Contratos | contratos_cliente, contratos_fornecedor |
| Compras | solicitacoes_compra, cotacoes, pedidos_compra |
| Fiscal/financeiro | notas_fiscais, contas_pagar, contas_receber |
| Documentos | documentos |

## Relacao com SharePoint

SharePoint continua recomendado para documentos e colaboracao. No modelo V3.2, a tabela `documentos` guarda apenas metadados, `sharepoint_url`, `sharepoint_item_id`, versao e vinculos com obra/contrato/entidade.

## Relacao com o sistema atual

As listas SharePoint existentes continuam preservadas para o sistema operacional atual. A V3.2 nao muda repositorios, permissoes, listas, colunas nem dados do tenant.
