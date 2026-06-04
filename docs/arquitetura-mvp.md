# Arquitetura do MVP

## Objetivo técnico

Preparar uma aplicação interna integrada ao Microsoft 365, com SPFx e React, para substituir a operação direta em listas extensas por telas de trabalho orientadas por perfil.

A V2.3 inicia a integração real com SharePoint na webpart SPFx. O protótipo HTML local permanece preservado como demonstração V2.2 homologada.

## Camadas

- Interface: React em SPFx, com navegação lateral e telas por etapa do processo.
- Protótipo navegável: HTML, CSS e JavaScript em `src/prototype`.
- Estado de tela: componentes React consumindo repositório SharePoint na V2.3.
- Persistência local do protótipo: `localStorage` para usuários, alçadas e histórico administrativo.
- Serviços: repositórios isolados para integração SharePoint.
- Backend V2.3: listas SharePoint reais inventariadas, com listas operacionais numeradas reaproveitadas e listas administrativas criadas apenas apos dry-run aprovado.
- Documentos futuros: bibliotecas SharePoint para propostas, pedidos, notas fiscais, boletos, comprovantes, contratos e anexos.
- Integrações futuras: Power Automate, Teams, contabilidade e eventuais APIs financeiras.

## Princípios

- Não expor estrutura de listas ao usuário.
- Preencher automaticamente solicitante, obra, cliente, código da obra e centro de custo sempre que possível.
- Exibir formulários progressivos por etapa, mantendo dados técnicos, comerciais e financeiros necessários para decisão.
- Ocultar apenas campos automáticos, administrativos ou indevidos para o perfil.
- Registrar histórico de cada evento relevante.
- Usar Administração / Configurações como fonte única simulada para usuários, perfis, alçadas, regras especiais e parâmetros gerais.
- Vincular alçadas a usuários cadastrados por ID interno, evitando regras soltas por nome.
- Exibir valores financeiros com formatação `pt-BR` em Real e manter armazenamento numérico.
- Usar campos `input type="date"` para datas editáveis e exibir datas em formato brasileiro nas telas de leitura.
- Preparar troca futura de backend sem redesenhar a interface.
- Separar funções de direção operacional e administração do sistema, mesmo quando exercidas inicialmente por Leon.

## Webpart oficial

Namespace oficial:

`src/webparts/enacSistema`

Componentes e telas esperadas:

- `EnacSistema`: componente raiz.
- `Dashboard`: visão inicial por perfil.
- `NovaSolicitacao`: formulário técnico da obra.
- `MinhasSolicitacoes`: acompanhamento do solicitante.
- `FilaCotacoes`: cotações e recomendação por Kemilly.
- `AprovacoesPendentes`: fila por alçada parametrizada.
- `PedidoCompra`: emissão do pedido por Matheus.
- `NotaFiscal`: vínculo de NF, boleto e divergências por Matheus.
- `ProgramacaoBancaria`: programação do pagamento no banco por Matheus.
- `LiberacaoBancaria`: liberação, bloqueio, correção e confirmação final por Leon.
- `HistoricoProcesso`: linha do tempo auditável.
- `AdministracaoUsuarios`: usuários, perfis, permissões e substitutos.
- `AdministracaoAlcadas`: regras parametrizadas de aprovação.
- `AdministracaoRegrasEspeciais`: cotações, emergência, divergências, NF e liberação bancária.
- `AdministracaoParametrosGerais`: tipos, prioridades, status e anexos obrigatórios.
- `HistoricoConfiguracoes`: auditoria de alterações administrativas.

## Fluxo oficial do MVP

1. Solicitação da obra.
2. Aguardando cotação.
3. Cotação por Kemilly.
4. Aprovação conforme alçada parametrizada.
5. Pedido de compra por Matheus.
6. Execução da compra por Matheus.
7. Vinculação da nota fiscal por Matheus.
8. Programação do pagamento no banco por Matheus.
9. Liberação bancária por Leon.
10. Atualização final do status do pagamento por Leon.
11. Processo concluído.

## Auditoria de regras

Quando uma solicitação é encaminhada para aprovação, a aplicação deve gravar um snapshot da regra vigente: identificação da regra, processo, faixa de valor, valor analisado, aprovador base, aprovador efetivo, substituição aplicada, exceção aplicada se houver e data/hora da submissão.

O snapshot deve incluir ID, nome e e-mail do aprovador base e do aprovador efetivo, preservando o contexto mesmo que o cadastro do usuário ou a regra de alçada sejam alterados depois.

Alterações futuras em alçadas não podem alterar retroativamente processos já submetidos, aprovados ou concluídos.

## Resolução de alçada e substituição

1. Identificar o usuário autenticado por `ENAC Usuarios Perfis.ContaMicrosoft365`.
2. Usar `UsuarioInternoId` como identificador interno obrigatório, único e indexado.
3. Selecionar regras ativas e vigentes na data da solicitação.
4. Filtrar por processo, tipo de solicitação, obra e valor.
5. Preferir regra específica de obra sobre regra geral equivalente.
6. Bloquear valor máximo menor que valor mínimo, salvo regra ilimitada.
7. Validar sobreposição e lacunas de regras.
8. Resolver substituição temporária pelo cadastro do usuário, não pela alçada.
9. Criar snapshot imutável em `ENAC Snapshots Regras`.
10. Vincular o snapshot de compra em `Lista 02 — Requisições de Compra.SnapshotAprovacaoCompra`.

## Mapeamento SharePoint V2.3A

O inventario readonly confirmou que as listas operacionais ja existem no tenant. A arquitetura deve usar `Lista 01 - Controle de Obras ENAC` para obras e `Lista 02 — Requisições de Compra` para solicitações de compra, sem criar `ENACObras` ou `ENACSolicitacoes`.

O campo `ENAC Alcadas.Obra` deve ser planejado como lookup para `Lista 01 - Controle de Obras ENAC`, exibindo `NomedaObra`. O campo `SnapshotAprovacaoCompra` deve ser adicionado futuramente à `Lista 02 — Requisições de Compra` como lookup para `ENAC Snapshots Regras`.

O mapa físico completo está em `sharepoint/mapeamento-listas-reais-v2.3.md`.

## Limite de segurança

A arquitetura está preparada para Power Automate e permissões reais, mas a V2.3 ainda não implementa fluxos de aprovação nem segurança definitiva. Alterações de usuários e alçadas devem ser restringidas por permissões SharePoint a administradores autorizados.

## Integração futura com Teams

A solução SPFx deverá ser empacotada, publicada no catálogo de aplicativos e adicionada como aba no Teams. O protótipo atual não executa essa publicação.
