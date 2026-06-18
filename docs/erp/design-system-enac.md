# Design System ENAC

## Finalidade

Este documento registra a foundation visual usada pelo ERP ENAC a partir da V3.18K.

## Identidade visual

- Sidebar grafite/preta.
- Vermelho ENAC como acento principal.
- Fundo gelo para canvas.
- Cards brancos.
- Cinza tecnico para textos, bordas e labels.
- Verde apenas para status positivo.

## Tokens principais

Os tokens vivem em `web/src/styles.css`.

- Cores: `--enac-red-*`, `--enac-graphite-*`, `--enac-gray-*`, `--enac-success-*`, `--enac-warning-*`, `--enac-danger-*`.
- Spacing: escala `--space-1` a `--space-10`.
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.
- Sombra: `--shadow-sm`, `--shadow-md`.
- Z-index: `--z-page-header`, `--z-filter-bar`, `--z-table-head`, `--z-detail-pane`, `--z-modal`.
- Shell: `--shell-sidebar-width`, `--shell-sidebar-collapsed-width`, `--shell-topbar-height`.

## Componentes

Componentes de layout:

- `EnacAppShell`
- `EnacSidebar`
- `EnacTopbar`
- `EnacPageHeader`
- `EnacSplitView`

Componentes de dados:

- `EnacKpiCard`
- `EnacFilterBar`
- `EnacDataTable`
- `EnacStatusChip`
- `EnacDetailPane`

Componentes de feedback e formulario:

- `EnacEmptyState`
- `EnacFormGrid`
- `EnacModal`

## Padrao de pagina

Cada tela operacional deve priorizar:

1. Consulta como entrada.
2. Filtros compactos.
3. Lista ou tabela densa.
4. Detalhe lateral em desktop.
5. Novo cadastro separado.
6. Empty state quando nao houver dados.

## Tabelas

- Linhas densas.
- Cabecalho sticky com fundo solido.
- Hover discreto.
- Status em chip.
- Scroll interno no container da tabela.
- Sem lista passando por tras de painel, filtro ou card.
- A partir da V3.18L, botoes de acao diretos em tabela, como `Detalhe`, usam padrao secundario compacto com borda vermelha, texto forte e coluna de acao controlada.
- Valores financeiros e quantidades usam numeros tabulares para facilitar comparacao.

## Detail pane

- Desktop: lateral direito, sticky, fundo branco, z-index controlado.
- Mobile: secao abaixo do conteudo, sem sticky.
- Deve estar dentro do grid da pagina.
- A partir da V3.18L, paineis laterais usam cabecalho compacto, borda superior vermelha, metadados em cards internos e scroll proprio.

## KPI cards V3.18L

Os cards KPI devem evitar colisao visual entre titulo e valor.

Padrao vigente:

- grid com largura minima de 238px e 260px nas telas de relatorio/dashboard;
- estrutura vertical: label, valor principal e rodape;
- valor principal com line-height fixo, numeros tabulares e quebra controlada;
- uma coluna no mobile;
- sem card estreito com valor e label competindo na mesma linha.

Esse padrao deve ser usado em Dashboard Executivo, Relatorios Financeiros, Previsto x Realizado, Documentos, Central, Riscos, Auditoria e Homologacao quando houver indicadores.

## Polimento V3.18M

A V3.18M define os ajustes finais de densidade e responsividade sobre a foundation:

- em mobile, a sidebar deve abrir como drawer sobre o conteudo, com backdrop e fechamento ao navegar;
- o conteudo mobile deve ocupar a largura total quando o menu estiver fechado;
- o Dashboard Executivo deve agrupar KPIs por visao executiva, operacao, financeiro, margem e alertas;
- cards executivos devem evitar massa unica de indicadores e usar valores compactos quando o numero financeiro for muito longo;
- tipografia de titulos, labels, botoes, tabelas e KPIs deve manter peso corporativo, mas sem competir com o conteudo;
- botoes diretos em tabela devem permanecer como acao secundaria compacta;
- paineis laterais devem preservar cabecalho claro, scroll proprio e composicao leve.

## Padrao V3.19 - Feedback e rastreabilidade

A V3.19 adiciona componentes leves para governanca operacional:

- `EnacNotification`: aviso padronizado com `aria-live`, tons `success`, `warning`, `error` e `info`, opcao de fechar e comportamento responsivo.
- `EnacAuditTrail`: linha do tempo visual para eventos mock de criacao, aprovacao, programacao, anexo, cancelamento logico e parametros.
- `EnacOperationalFlow`: sequencia visual do fluxo `Solicitacao -> Aprovacao -> Pedido -> NF -> Conta -> Programacao mock -> Historico`.

Regras de uso:

- toda criacao bem-sucedida deve exibir `EnacNotification` de sucesso;
- formulario de criacao deve ser limpo apos sucesso;
- erro de validacao nao deve limpar formulario;
- modo edicao nao deve limpar formulario automaticamente;
- botao de submit deve ficar desabilitado durante `saving`;
- anexos temporarios devem ser limpos apos a referencia local ser salva;
- trilhas V3.19 sao visuais/mock quando nao houver auditoria persistida.

## Documento da NF

O painel documental de Notas Fiscais de Entrada deve:

- mostrar metadados do PDF/XML em cards compactos;
- conter o preview PDF em altura maxima com rolagem interna;
- exibir XML em bloco pre-formatado compacto;
- manter referencias locais/mock, sem upload externo real e sem SharePoint real.

## Restricoes

O design system nao altera regra de negocio. Ele tambem nao cria backend, migration, endpoint, pagamento, baixa, CNAB, banco real, NFS-e real, prefeitura, boleto real, SharePoint/Graph/Entra/Power Automate reais, upload externo real ou `DELETE` fisico.
