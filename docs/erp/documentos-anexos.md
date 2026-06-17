# ERP - Documentos e Anexos

## Finalidade

O modulo de Documentos e Anexos registra referencias documentais vinculadas a entidades operacionais do ERP ENAC.

A finalidade da V3.14 e preparar o contrato de dados para SharePoint futuro sem integrar SharePoint real e sem armazenar arquivos binarios no PostgreSQL.

## Estrutura

Tabela principal:

- `documentos_anexos`.

Campos principais:

- `id`;
- `company_id`;
- `entidade_tipo`;
- `entidade_id`;
- `obra_id`;
- `contrato_id`;
- `tipo_documento`;
- `nome_arquivo`;
- `extensao`;
- `mime_type`;
- `tamanho_bytes`;
- `descricao`;
- `observacao`;
- `origem`;
- `status`;
- `referencia_local_mock`;
- `sharepoint_site_id_mock`;
- `sharepoint_drive_id_mock`;
- `sharepoint_item_id_mock`;
- `url_mock`;
- `criado_por`;
- `criado_em`;
- `atualizado_por`;
- `atualizado_em`;
- `inativado_por`;
- `inativado_em`;
- `motivo_inativacao`.

## Entidades aceitas

O backend aceita documentos para:

- cliente;
- fornecedor;
- obra;
- contrato de obra;
- aditivo;
- orcamento;
- solicitacao de compra;
- cotacao;
- pedido de compra;
- nota fiscal de entrada;
- conta a pagar;
- programacao de pagamento;
- baixa manual;
- medicao;
- pedido de faturamento;
- risco/pendencia;
- tarefa;
- auditoria.

Na criacao, o backend valida que `entidade_tipo` e permitido, que `entidade_id` e UUID e que a entidade existe na tabela de origem.

## Tipos de documento

Tipos suportados:

- `CONTRATO`;
- `ADITIVO`;
- `NF`;
- `BOLETO_REFERENCIA`;
- `COMPROVANTE_REFERENCIA`;
- `MEDICAO`;
- `FATURAMENTO`;
- `ORCAMENTO`;
- `PROPOSTA`;
- `COTACAO`;
- `PEDIDO`;
- `FOTO_OBRA`;
- `RELATORIO`;
- `OUTROS`.

Os tipos com sufixo `REFERENCIA` existem apenas para catalogacao documental. Eles nao geram boleto, pagamento, baixa, CNAB ou integracao bancaria.

## Ciclo de vida

Status:

- `ATIVO`;
- `INATIVO`;
- `SUBSTITUIDO`;
- `PENDENTE_ENVIO_FUTURO`;
- `ERRO_REFERENCIA`.

Operacoes:

- criar referencia documental;
- editar metadados;
- substituir referencia, preservando vinculo com documento anterior;
- inativar logicamente.

Nao existe exclusao fisica.

## Auditoria

Eventos registrados em `auditoria_eventos`:

- `criar`;
- `editar`;
- `criar_substituicao`;
- `substituir`;
- `inativar`.

O payload de auditoria marca `modulo = documentos`, `sharepoint_real = false` e `upload_real = false`.

## Frontend

Tela:

- `Documentos e Anexos`.

Recursos:

- listagem geral;
- filtros por entidade, tipo, status, obra, contrato e texto;
- cards de resumo;
- criacao de referencia;
- edicao de metadados;
- substituicao logica;
- inativacao logica;
- aviso fixo de ausencia de upload real.

## Limites

- Nao faz upload real.
- Nao faz download real.
- Nao usa SharePoint real.
- Nao usa Microsoft Graph real.
- Nao usa Entra real.
- Nao usa Power Automate.
- Nao armazena binario pesado no banco.
- Nao executa pagamento.
- Nao cria baixa nova.
- Nao gera CNAB.
- Nao emite NFS-e real.
- Nao integra prefeitura.
- Nao gera boleto real.
- Nao usa `DELETE` fisico.

## Roadmap SharePoint

A integracao real futura deve ser tratada em V4.x com autorizacao explicita. O desenho recomendado inclui:

- app Microsoft Graph dedicada;
- escopos minimos aprovados;
- upload versionado em biblioteca SharePoint;
- metadados sincronizados com `documentos_anexos`;
- auditoria de requisicoes externas;
- retries controlados;
- reconciliacao local x SharePoint;
- bloqueio de escrita sem confirmacao operacional.
