# Checklist V3.14 - Anexos e Documentos preparados para SharePoint

## Git e ambiente

- [ ] Branch inicial `main`.
- [ ] `main = origin/main = commit V3.13`.
- [ ] Tag `v3.13-auditoria-logs-rastreabilidade` existente.
- [ ] Tag V3.14 inexistente antes da etapa.
- [ ] Working tree limpo antes da etapa.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
- [ ] Docker/PostgreSQL healthy.
- [ ] `/health` OK.
- [ ] `/health/db` OK.

## Backend

- [ ] Migration `024_anexos_documentos_sharepoint_ready_v314.sql` criada.
- [ ] Tabela `documentos_anexos` criada.
- [ ] Tipos de entidade validados.
- [ ] `entidade_id` validado como UUID.
- [ ] Existencia da entidade de origem validada.
- [ ] Tipos de documento validados.
- [ ] Status documental validado.
- [ ] Inativacao logica implementada.
- [ ] Substituicao logica implementada.
- [ ] Auditoria registrada em `auditoria_eventos`.
- [ ] Nenhum endpoint de upload real criado.
- [ ] Nenhum endpoint de SharePoint real criado.
- [ ] Nenhum endpoint de Graph real criado.
- [ ] Nenhum endpoint de `DELETE` fisico criado.

## Frontend

- [ ] Tela `Documentos e Anexos` criada.
- [ ] Listagem de documentos funcionando.
- [ ] Filtros por entidade, tipo, status, obra, contrato e texto funcionando.
- [ ] Criacao de referencia documental funcionando.
- [ ] Edicao de metadados funcionando.
- [ ] Substituicao logica visivel.
- [ ] Inativacao logica visivel.
- [ ] Aviso de ausencia de upload real exibido.
- [ ] Nenhum botao de upload real exibido.
- [ ] Nenhum botao SharePoint real exibido.
- [ ] Nenhum botao Power Automate exibido.
- [ ] Nenhum botao de pagamento, baixa, CNAB, banco, NFS-e, prefeitura ou boleto real exibido.

## Smoke V3.14

- [ ] Criar documento de contrato.
- [ ] Criar documento de nota fiscal.
- [ ] Listar documentos.
- [ ] Buscar por entidade.
- [ ] Editar metadados.
- [ ] Substituir documento.
- [ ] Inativar documento.
- [ ] Confirmar `DELETE` fisico ausente.
- [ ] Confirmar upload real ausente.
- [ ] Confirmar SharePoint real ausente.
- [ ] Confirmar auditoria.
- [ ] Confirmar ausencia de pagamento, banco, CNAB, NFS-e real, prefeitura e boleto real.

## Validações

- [ ] `npm.cmd run build` em `server`.
- [ ] `npm.cmd run migrate`.
- [ ] Todos os smokes existentes.
- [ ] `npm.cmd run smoke:documentos`.
- [ ] `npm.cmd run web:build`.
- [ ] `npx.cmd tsc -p web/tsconfig.json --noEmit`.
- [ ] `npx.cmd tsc -p tsconfig.json --noEmit`.
- [ ] `git diff --check`.
- [ ] Browser desktop.
- [ ] Browser mobile.
- [ ] Varredura de termos proibidos.
- [ ] Varredura de `DELETE` fisico.

## Consolidação

- [ ] Commit local criado.
- [ ] Revalidacao pos-commit executada.
- [ ] Merge fast-forward na `main`.
- [ ] Push da `main`.
- [ ] Tag `v3.14-anexos-documentos-sharepoint-ready` criada e publicada.
- [ ] Working tree limpo no final.
- [ ] `main = origin/main = commit V3.14`.
- [ ] `.git/index.lock` ausente.
- [ ] `b004592_ANCESTOR_FALSE`.
