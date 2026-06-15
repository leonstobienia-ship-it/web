# Modulos MVP do ERP ENAC

## Frentes do MVP

| Modulo | Objetivo | Entidades base |
|---|---|---|
| Cadastros mestres | Organizar CNPJs, partes, obras e centros de custo | empresas, clientes, fornecedores, obras, centros_custo |
| Acesso e papeis | Preparar menor privilegio e futura RLS | usuarios, perfis |
| Contratos | Controlar contratos de cliente e fornecedor | contratos_cliente, contratos_fornecedor, documentos |
| Compras | Conectar solicitacao, cotacao e pedido | solicitacoes_compra, cotacoes, pedidos_compra |
| Fiscal operacional | Registrar nota fiscal como fato documental/fiscal | notas_fiscais, documentos |
| Financeiro operacional | Preparar AP, AR, cobranca, pagamento e baixa futura | contas_pagar, contas_receber |
| Obras e medicoes | Medir obra, gerar faturamento e controlar saldo | obras, medicoes_obra, contratos_cliente |
| Documentos | Vincular evidencias e arquivos SharePoint a entidades do ERP | documentos |

## Fora da fundacao V3.2

- Escrita real no SharePoint.
- Alteracao de permissoes Entra.
- Automacoes.
- Conexao com banco de producao.
- Migracao de dados legados.
- Portal externo de terceiros/locatarios.
- Restaurante como PDV.
- Cowork full-service.
