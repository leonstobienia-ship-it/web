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

## Detail pane

- Desktop: lateral direito, sticky, fundo branco, z-index controlado.
- Mobile: secao abaixo do conteudo, sem sticky.
- Deve estar dentro do grid da pagina.

## Restricoes

O design system nao altera regra de negocio. Ele tambem nao cria backend, migration, endpoint, pagamento, baixa, CNAB, banco real, NFS-e real, prefeitura, boleto real, SharePoint/Graph/Entra/Power Automate reais, upload externo real ou `DELETE` fisico.
