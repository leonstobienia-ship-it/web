# Plano de Permissoes Finas V2.6B

Data: 2026-06-08

## Escopo

Plano documental. Codex nao aplicou permissoes no tenant, nao conectou ao SharePoint, nao publicou pacote e nao iniciou Power Automate.

## Grupos SharePoint sugeridos

- `ENAC Sistema Admin`
- `ENAC Diretoria`
- `ENAC Planejamento`
- `ENAC Compras Financeiro`
- `ENAC Cotacoes Contratos`
- `ENAC Campo Engenharia`
- `ENAC Leitura Auditoria`

## Membros iniciais sugeridos

| Grupo | Membros iniciais | Observacao |
| --- | --- | --- |
| ENAC Sistema Admin | Leon | Administracao tecnica do sistema |
| ENAC Diretoria | Leon | Aprovacoes, excecoes e liberacao bancaria |
| ENAC Planejamento | Gustavo | Aprovacoes conforme alçada |
| ENAC Compras Financeiro | Matheus | Pedido, NF e programacao |
| ENAC Cotacoes Contratos | Kemilly | Cotacoes e contratos |
| ENAC Campo Engenharia | Campo / Engenheiro | Criacao e acompanhamento |
| ENAC Leitura Auditoria | Definir | Leitura controlada para auditoria |

## Heranca de permissoes

### Manter heranca inicialmente

- Listas operacionais enquanto o fluxo real ainda estiver em validacao.
- Bibliotecas/documentos ainda nao mapeados nesta rodada.

### Avaliar quebra de heranca

- `ENAC Usuarios Perfis`
- `ENAC Alcadas`
- `ENAC Historico Configuracoes`
- `ENAC Snapshots Regras`

## Permissoes por lista administrativa

| Lista | Leitura | Edicao | Administracao | Observacao |
| --- | --- | --- | --- | --- |
| ENAC Usuarios Perfis | Diretoria leitura restrita, Sistema Admin | Sistema Admin | Sistema Admin | Dados sensiveis de perfis/permissoes |
| ENAC Alcadas | Planejamento/Diretoria leitura, Sistema Admin | Sistema Admin | Sistema Admin | Impacta aprovacoes futuras |
| ENAC Historico Configuracoes | Diretoria, Sistema Admin, Auditoria | Apenas sistema/controlado | Sistema Admin | Append-only ou inclusao controlada |
| ENAC Snapshots Regras | Perfis envolvidos em leitura, Diretoria, Auditoria | Apenas sistema | Sistema Admin | Imutavel apos criacao |

## Permissoes por lista operacional de referencia

| Lista | Permissao sugerida |
| --- | --- |
| Lista 01 - Controle de Obras ENAC | Leitura para operacao; edicao por responsaveis autorizados |
| Lista 02 — Requisições de Compra | Campo cria/proprio; Compras/Planejamento/Diretoria conforme processo |
| Lista 03 — Pedidos de Compra | Compras/Financeiro edita; demais leitura conforme perfil |
| Lista 04 - Notas Fiscais Recebidas | Compras/Financeiro edita; Diretoria leitura |
| 05 — Contas a Pagar | Compras/Financeiro edita; Diretoria libera/consulta |
| Lista 10 — Contas a Pagar / Programação Financeira | Compras/Financeiro programa; Diretoria libera |

## Riscos

- Quebrar permissao em lista operacional pode interromper formulario, webpart ou fluxo existente.
- Permissoes item-level podem gerar comportamento inesperado em views/consultas REST.
- Power Automate futuro pode precisar de conta de servico ou permissao elevada.
- Grupos Microsoft 365/SharePoint precisam ser governados para evitar acesso excessivo.
- Controle client-side da webpart nao substitui permissao real.

## Plano de rollback

Antes de qualquer aplicacao real futura:

1. Exportar permissoes atuais das listas.
2. Registrar heranca atual.
3. Aplicar mudanca em ambiente/pagina de teste.
4. Validar leitura e escrita por perfil.
5. Se houver falha, restaurar heranca ou grupos anteriores.
6. Registrar rollback em historico administrativo.

## Scripts futuros

Somente em rodada autorizada:

- script dry-run para listar grupos, membros e permissoes atuais;
- script dry-run para simular mudancas;
- script de aplicacao real apenas apos aprovacao;
- script de rollback documentado.

Nenhum script de aplicacao real foi criado nesta rodada.

## V2.6B.1 - Dry-run local

Foi preparado um script local de dry-run em `scripts/sharepoint/10-permissoes-finas-v2.6b-dryrun.ps1`.

O script nao conecta ao SharePoint, nao cria grupos, nao quebra heranca, nao altera permissoes, nao altera listas, nao altera itens, nao adiciona ou remove usuarios, nao publica pacote e nao inicia Power Automate.

A aplicacao real permanece bloqueada. Qualquer rodada futura para permissao real devera usar script separado, autorizacao textual explicita de Leon e, preferencialmente, registro previo das permissoes atuais para rollback.

## V2.6B.2 - Script real protegido

Foi preparado o script protegido `scripts/sharepoint/11-permissoes-finas-v2.6b-apply.ps1`.

Sem `-Apply`, o script funciona como dry-run local e nao conecta ao SharePoint. Com `-Apply`, exige confirmacao textual `APLICAR-PERMISSOES-V2.6B-ENAC`, app diferente do readonly, site `/sites/Equipe.Obras` e ambiente explicito.

A V2.6B.2 nao executou o script em modo de aplicacao. Nenhuma permissao real foi aplicada. Membros reais dos grupos permanecem pendentes e listas operacionais continuam apenas planejadas.

## V2.6B.3 - Auditoria readonly conectada

Foi preparado o script `scripts/sharepoint/12-permissoes-finas-v2.6b-readonly-auditoria.ps1` para execucao manual por Leon.

O script conecta apenas para leitura, nao possui parametro de aplicacao e nao contem comandos de escrita. Ele inventaria grupos planejados, grupos relacionados a ENAC, listas administrativas, heranca e permissoes atuais quando a API permitir.

Codex nao executou a conexao. O relatorio esperado e `sharepoint/auditoria-permissoes-finas-v2.6b3.md`, que so devera ser versionado se estiver sanitizado.
