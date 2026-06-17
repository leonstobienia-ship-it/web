# Pacote de Homologacao Assistida

## Finalidade

Este pacote organiza a conducao da homologacao real do ERP ENAC com a equipe, usando a massa local `DEV_LOCAL_HOMOLOGACAO_ENAC_V316` e a tela `Gestao > Homologacao`.

## Agenda sugerida

| Sessao | Perfil | Duracao | Saida esperada |
| --- | --- | --- | --- |
| Abertura | Todos | 30 min | Escopo, limites e forma de registrar feedback alinhados |
| Diretoria | Leon | 60 min | Validacao de indicadores, margem, riscos e aprovacoes criticas |
| Planejamento | Gustavo | 60 min | Validacao de contratos, orcamento, planejamento e medicoes |
| Compras | Matheus | 60 min | Validacao do fluxo solicitacao, cotacao, mapa e pedido |
| Financeiro | Matheus | 75 min | Validacao de NF, contas, programacao, conferencia e relatorios |
| Campo | Davison e Kemilly | 45 min | Validacao de solicitacoes, status, medicoes, pendencias e documentos |
| Admin | Admin teste | 45 min | Validacao de usuarios, perfis, alcadas, auditoria e documentos |
| Encerramento | Responsaveis | 60 min | Backlog priorizado para V3.18 |

## Matriz de responsabilidades

| Perfil | Responsavel | Modulos principais | Responsabilidade na homologacao |
| --- | --- | --- | --- |
| Diretoria | Leon | Dashboard Executivo, Previsto x Realizado, Riscos, Central de Tarefas | Validar leitura executiva, margem, alertas e aprovacoes criticas |
| Planejamento | Gustavo | Contratos, Aditivos, Orcamento Base, Planejamento Executivo, Medicoes | Validar aderencia do planejamento e rastreabilidade da obra |
| Compras | Matheus | Solicitacoes, Cotacoes, Mapa Comparativo, Pedidos, Fornecedores | Validar fluxo de compras e clareza operacional |
| Financeiro | Matheus | Notas, Contas a Pagar, Programacao, Liberacao, Conferencia, Baixa Manual, Relatorios, Documentos | Validar controles financeiros locais sem pagamento real |
| Campo | Davison e Kemilly | Solicitacao, Status, Medicoes, Pendencias, Documentos mockados | Validar uso em obra e clareza das entradas operacionais |
| Admin | Admin teste | Usuarios, Perfis, Escopos, Alcadas, Auditoria, Documentos, Seed | Validar governanca, rastreabilidade e suporte a homologacao |

## Checklist consolidado por perfil

### Diretoria / Leon

- [ ] Abrir Dashboard Executivo.
- [ ] Conferir indicadores principais.
- [ ] Abrir Previsto x Realizado.
- [ ] Validar margem por obra.
- [ ] Revisar alertas criticos.
- [ ] Revisar riscos.
- [ ] Consultar aprovacoes criticas e tarefas.

### Planejamento / Gustavo

- [ ] Abrir Contratos.
- [ ] Conferir aditivos aprovados.
- [ ] Abrir Orcamento Base.
- [ ] Conferir Planejamento Executivo.
- [ ] Abrir Medicoes.
- [ ] Validar Previsto x Realizado.
- [ ] Registrar pendencias de planejamento.

### Compras / Matheus

- [ ] Abrir Solicitacoes.
- [ ] Conferir Cotacoes.
- [ ] Conferir Mapa Comparativo.
- [ ] Abrir Pedido de Compra.
- [ ] Conferir Fornecedores.
- [ ] Revisar tarefas do perfil.

### Financeiro / Matheus

- [ ] Abrir Notas Fiscais de Entrada.
- [ ] Conferir Contas a Pagar.
- [ ] Abrir Programacao de Pagamento.
- [ ] Conferir Liberacao.
- [ ] Conferir Conferencia Financeira.
- [ ] Validar Baixa Manual Controlada de homologacao.
- [ ] Abrir Relatorios Financeiros.
- [ ] Conferir Documentos.

### Campo / Davison e Kemilly

- [ ] Abrir Solicitacao de Compra.
- [ ] Acompanhar status.
- [ ] Abrir Medicoes.
- [ ] Conferir pendencias de obra.
- [ ] Conferir documentos/fotos mockados.

### Admin

- [ ] Abrir Usuarios.
- [ ] Conferir Perfis.
- [ ] Conferir Escopos.
- [ ] Conferir Alcadas.
- [ ] Abrir Auditoria.
- [ ] Conferir Documentos.
- [ ] Executar seed de homologacao.

## Roteiro de abertura

1. Confirmar que o teste usa apenas ambiente local.
2. Informar o marker `DEV_LOCAL_HOMOLOGACAO_ENAC_V316`.
3. Reforcar que nao ha banco real, pagamento real, NFS-e real, SharePoint real ou automacao real.
4. Explicar como registrar feedback.
5. Definir responsavel pela captura de evidencias.
6. Validar a tela `Gestao > Homologacao` com todos.

## Roteiro de encerramento

1. Revisar feedbacks abertos.
2. Remover duplicidades.
3. Classificar severidade e prioridade.
4. Separar treinamento de correcao de sistema.
5. Definir itens candidatos a V3.18.
6. Registrar aceite, aceite com ressalvas ou reprova.

## Evidencias a coletar

- Print da tela testada.
- Perfil e usuario avaliador.
- Modulo e tela.
- Passo executado.
- Resultado esperado e obtido.
- Impacto operacional.
- Data e hora aproximada.
- ID ou codigo exibido, quando houver.

## Criterios de aprovacao

- Todos os perfis executaram o roteiro minimo.
- Nao houve falha critica sem contorno.
- Feedbacks foram classificados e priorizados.
- Itens de treinamento foram separados de bugs/regra/UX.
- Nao foram encontrados recursos proibidos funcionais.

## Criterios de reprovacao

- Falha critica impede um fluxo essencial.
- Dados da seed nao permitem validar o modulo.
- Tela essencial nao abre.
- Permissao ou alçada aparece incoerente para o perfil.
- Acoes proibidas funcionais aparecem no sistema.

## Preparacao para V3.18

A V3.18 deve ser aberta somente depois da coleta real de feedback. O backlog deve conter apenas itens aprovados para correcao, com evidencia e prioridade.
