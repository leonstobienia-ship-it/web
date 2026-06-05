# Mapeamento de Listas Reais SharePoint V2.3A

Este documento consolida o inventario readonly executado no site `https://enaccombr.sharepoint.com/sites/Equipe.Obras`.

Nenhuma lista operacional numerada foi recriada pela V2.3A. O provisionamento estrutural criou/reaproveitou apenas estruturas administrativas aprovadas e o campo complementar `SnapshotAprovacaoCompra`.

## Listas operacionais reais

| Entidade logica | Lista SharePoint real | GUID |
| --- | --- | --- |
| Obras | Lista 01 - Controle de Obras ENAC | `a9afadc1-f843-45c0-a628-4f49a8716832` |
| Solicitacoes / Requisicoes de Compra | Lista 02 — Requisições de Compra | `0a204b87-b9a1-4d16-8654-55567a62ed01` |
| Pedidos de Compra | Lista 03 — Pedidos de Compra | `18ca132a-c36a-42aa-9968-d87ecd547a79` |
| Notas Fiscais Recebidas | Lista 04 - Notas Fiscais Recebidas | `25aa4447-193d-418a-8e71-9bfd8e9995da` |
| Contas a Pagar | 05 — Contas a Pagar | `69b7469b-9cb9-4509-87dd-bba00b8142fd` |
| Fornecedores e Prestadores | Lista 06 - Fornecedores e Prestadores | `953cc56f-108b-4818-9ffc-cc522cd1b62d` |
| Medicoes da Obra | Lista 07 — Medições da Obra | `894faa02-cc30-406f-8101-96e4a0277e06` |
| Contratos de Prestadores / Servicos | Lista 08 — Contratos de Prestadores / Serviços | `43125331-ff6c-48ef-a374-95909eed19bc` |
| Medicoes de Prestadores / Liberacao | Lista 09 — Medições de Prestadores / Liberação de Pagamento | `7c48906c-69d1-4caa-a343-7f8b618bfd2c` |
| Programacao Financeira | Lista 10 — Contas a Pagar / Programação Financeira | `f0d253cc-3f42-46b8-bfd6-9dcb6fe9a680` |
| Contas a Receber / Faturamento | Lista 11 — Contas a Receber / Faturamento | `6d7339a2-8ef7-4f2f-bae7-83e7df0c5084` |
| Mao de Obra / Alocacao | Lista 12 — Mão de Obra / Alocação de Equipe | `5b9635fc-bfcb-4123-bb34-a9a47e13b53f` |
| Documentos de Funcionarios | Lista 13 — Documentos de Funcionários / Integrações | `f74b5014-8000-405c-9f0e-5eda4c17e2a4` |
| Pendencias / Ocorrencias | Lista 14 — Pendências, Ocorrências e Não Conformidades | `e2ac50ae-4db6-4fdd-be96-ee72104d0c1a` |

## Campos relevantes da Lista 01

| Campo exibido | Nome interno real | Tipo |
| --- | --- | --- |
| Nome da Obra | `NomedaObra` | Text |
| Cliente | `Cliente` | Text |
| Status da Obra | `StatusdaObra` | Choice |
| Centro de Custo | `CentrodeCusto` | Text |
| Pasta SharePoint da Obra | `PastaSharePointdaObra` | URL |
| Cronograma Planner | `CronogramaPlanner` | URL |
| Responsável Planejamento | `Respons_x00e1_velPlanejamento` | User |
| Responsável Compras Financeiro | `Respons_x00e1_velComprasFinancei` | User |
| Responsável Documental | `Respons_x00e1_velDocumental` | User |
| Diretor Responsável | `DiretorRespons_x00e1_vel` | User |
| Data de Início Prevista | `DatadeIn_x00ed_cioPrevista` | DateTime |
| Data de Término Prevista | `DatadeT_x00e9_rminoPrevista` | DateTime |
| Valor Contratado | `ValorContratado` | Currency |
| Observações | `Observa_x00e7__x00f5_es` | Note |

Nao criar `CodigoObra` na Lista 01 nesta rodada.

## Campos relevantes da Lista 02

| Campo exibido | Nome interno real | Tipo |
| --- | --- | --- |
| Obra | `Obra` | Lookup para Lista 01 / `NomedaObra` |
| Código da Obra | `C_x00f3_digodaObra` | Text |
| Centro de Custo | `CentrodeCusto` | Text |
| Tipo da Solicitação | `TipodaSolicita_x00e7__x00e3_o` | Choice |
| Descrição da Solicitação | `Descri_x00e7__x00e3_odaSolicita_` | Note |
| Prioridade | `Prioridade` | Choice |
| Data da Solicitação | `DatadaSolicita_x00e7__x00e3_o` | DateTime |
| Data Necessária na Obra | `DataNecess_x00e1_rianaObra` | DateTime |
| Status da Requisição | `StatusdaRequisi_x00e7__x00e3_o` | Choice |
| Aprovação Necessária? | `Aprova_x00e7__x00e3_oNecess_x00e` | Boolean |
| Aprovador | `Aprovador` | User |
| Solicitante | `Solicitante` | User |

`SnapshotAprovacaoCompra` foi adicionado a `Lista 02 — Requisições de Compra` como lookup para `ENAC Snapshots Regras` / `Title`.

Choices reais de `Tipo da Solicitação` / `TipodaSolicita_x00e7__x00e3_o`: Material, Serviço, Equipamento, Ferramenta, Locação, Terceiro/Prestador, EPI, Documento/Taxa, Outro.

## Decisoes de provisionamento

- Nao criar `ENACObras`.
- Nao criar `ENACSolicitacoes`.
- `ENAC Alcadas.Obra` foi provisionado como lookup para `Lista 01 - Controle de Obras ENAC`, exibindo `NomedaObra`.
- `ENAC Snapshots Regras.Solicitacao` foi provisionado como lookup para `Lista 02 — Requisições de Compra`, usando `ID`.
- `SnapshotAprovacaoCompra` foi adicionado a `Lista 02 — Requisições de Compra`, como lookup para `ENAC Snapshots Regras`.
- Nao criar `CodigoObra` na Lista 01 nesta rodada.

## Listas administrativas provisionadas

As listas abaixo foram criadas/reaproveitadas no provisionamento estrutural V2.3A:

- `ENAC Usuarios Perfis` / `Lists/ENACUsuariosPerfis`
- `ENAC Alcadas` / `Lists/ENACAlcadas`
- `ENAC Historico Configuracoes` / `Lists/ENACHistoricoConfiguracoes`
- `ENAC Snapshots Regras` / `Lists/ENACSnapshotsRegras`

## Configuracoes provisionadas das listas administrativas

| Lista | Versionamento | Anexos | Edicao em grade |
| --- | --- | --- | --- |
| `ENAC Usuarios Perfis` | Ativo | Desativados | Desativada |
| `ENAC Alcadas` | Ativo | Desativados | Desativada |
| `ENAC Historico Configuracoes` | Ativo | Desativados | Desativada |
| `ENAC Snapshots Regras` | Ativo | Desativados | Desativada |

Versionamento e bloqueio de edicao em grade reduzem risco operacional. Snapshots e historico somente serao considerados efetivamente protegidos apos definicao/aplicacao de permissoes especificas e uso controlado pelo sistema/automacao.
