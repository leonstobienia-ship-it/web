import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type ClienteApi,
  type ContratoObraApi,
  type DashboardExecutivoAlertaApi,
  type DashboardExecutivoDetalheApi,
  type DashboardExecutivoFilters,
  type DashboardExecutivoObraApi,
  type DashboardExecutivoRankingApi,
  type DashboardExecutivoResumoApi,
  type DashboardExecutivoTendenciaApi,
  type ObraApi
} from '../../services/erpApi';

interface ReportColumn {
  key: string;
  label: string;
  type?: 'money' | 'number' | 'percent';
}

interface DashboardState {
  resumo: DashboardExecutivoResumoApi | null;
  obras: DashboardExecutivoObraApi[];
  alertas: DashboardExecutivoAlertaApi[];
  tendencia: DashboardExecutivoTendenciaApi[];
  ranking: DashboardExecutivoRankingApi | null;
  financeiro: DashboardExecutivoDetalheApi | null;
  faturamento: DashboardExecutivoDetalheApi | null;
  operacional: DashboardExecutivoDetalheApi | null;
}

type DashboardKpiCard = {
  label: string;
  value: unknown;
  type: 'money' | 'number' | 'percent';
  tone?: 'primary' | 'warning' | 'danger';
  trend?: number[];
};

type SparkTone = 'brand' | 'success' | 'warning' | 'danger';

let sparkSeq = 0;

/** Tendência inline para os KPIs do dashboard (curva da série mensal real). */
function Sparkline({ data, tone = 'brand', width = 132, height = 30 }: { data: number[]; tone?: SparkTone; width?: number; height?: number }): JSX.Element | null {
  const gradientId = React.useMemo(() => `enac-spark-${sparkSeq++}`, []);
  if (!data || data.length < 2) {
    return null;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data.map((value, index): [number, number] => [
    (index / (data.length - 1)) * width,
    height - ((value - min) / span) * (height - 6) - 3
  ]);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `M0 ${height} ${points.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${width} ${height} Z`;
  const stroke =
    tone === 'success'
      ? 'var(--enac-success-600)'
      : tone === 'danger'
      ? 'var(--enac-danger-600)'
      : tone === 'warning'
      ? 'var(--enac-warning-600)'
      : 'var(--enac-red-500)';
  const last = points[points.length - 1];
  return (
    <svg className="enac-dashboard-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.16" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.4" fill={stroke} />
    </svg>
  );
}

const marker = 'DEV_LOCAL_V3_10';

const emptyFilters = (): DashboardExecutivoFilters => ({
  obra_id: '',
  cliente_id: '',
  centro_custo_id: '',
  contrato_id: '',
  status_obra: '',
  periodo_de: '',
  periodo_ate: ''
});

const emptyDashboard = (): DashboardState => ({
  resumo: null,
  obras: [],
  alertas: [],
  tendencia: [],
  ranking: null,
  financeiro: null,
  faturamento: null,
  operacional: null
});

const moneyColumns = new Set([
  'valor_contratado',
  'valor_aditado',
  'valor_total_contratado',
  'orcamento_previsto',
  'custo_comprometido',
  'custo_realizado',
  'custo_baixado_manual',
  'receita_medida',
  'receita_faturada_manual',
  'margem_prevista',
  'margem_realizada',
  'desvio_orcamento',
  'saldo_a_faturar',
  'saldo_orcamentario',
  'saldo_contratual',
  'contas_abertas_valor',
  'faturamento_pendente',
  'faturamento_previsto',
  'margem_mensal',
  'acumulado_previsto',
  'acumulado_faturado',
  'acumulado_custo',
  'valor'
]);

const numberColumns = new Set([
  'obras_total',
  'obras_ativas',
  'contratos_ativos',
  'contratos_encerrados',
  'contratos_suspensos',
  'contas_abertas',
  'contas_vencidas',
  'contas_a_vencer',
  'programacoes_liberadas',
  'programacoes_conferidas',
  'programacoes_pendentes',
  'baixas_manuais',
  'medicoes_pendentes',
  'pedidos_faturamento_pendentes',
  'planejamentos_atrasados',
  'orcamentos_sem_cronograma',
  'quantidade'
]);
type DashboardView = 'resumo' | 'tendencia' | 'ranking' | 'alertas' | 'obras' | 'financeiro' | 'faturamento' | 'operacional';

const activeFilters = (filters: DashboardExecutivoFilters): DashboardExecutivoFilters =>
  Object.entries(filters).reduce<DashboardExecutivoFilters>((acc, [key, value]) => {
    if (value && value.trim()) {
      acc[key] = value;
    }
    return acc;
  }, {});

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: unknown): string =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCompactMoney = (value: unknown): string => {
  const numericValue = toNumber(value);
  const absoluteValue = Math.abs(numericValue);
  const signal = numericValue < 0 ? '-' : '';

  if (absoluteValue >= 1000000) {
    return `${signal}R$ ${(absoluteValue / 1000000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} mi`;
  }

  if (absoluteValue >= 100000) {
    return `${signal}R$ ${(absoluteValue / 1000).toLocaleString('pt-BR', {
      maximumFractionDigits: 0
    })} mil`;
  }

  return formatMoney(numericValue);
};

const formatNumber = (value: unknown): string =>
  toNumber(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

const formatPercent = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return `${toNumber(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const formatCell = (row: Record<string, unknown>, column: ReportColumn): string => {
  const value = row[column.key];
  if (column.type === 'money' || moneyColumns.has(column.key)) {
    return formatMoney(value);
  }
  if (column.type === 'number' || numberColumns.has(column.key)) {
    return formatNumber(value);
  }
  if (column.type === 'percent') {
    return formatPercent(value);
  }
  return value === null || value === undefined || value === '' ? '-' : String(value);
};

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const asRows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value as Array<Record<string, unknown>> : [];

const sumValues = (rows: DashboardExecutivoObraApi[], key: keyof DashboardExecutivoObraApi): number =>
  rows.reduce((acc, row) => acc + toNumber(row[key]), 0);

const formatDashboardValue = (card: DashboardKpiCard): string => {
  if (card.type === 'money') {
    return formatCompactMoney(card.value);
  }

  if (card.type === 'percent') {
    return formatPercent(card.value);
  }

  return formatNumber(card.value);
};

export function DashboardExecutivoPage(): JSX.Element {
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [obrasCadastro, setObrasCadastro] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [contratosCadastro, setContratosCadastro] = React.useState<ContratoObraApi[]>([]);
  const [filters, setFilters] = React.useState<DashboardExecutivoFilters>(emptyFilters());
  const [dashboard, setDashboard] = React.useState<DashboardState>(emptyDashboard());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<DashboardView>('resumo');

  const loadCatalogs = React.useCallback(async (): Promise<void> => {
    const [clientesResponse, obrasResponse, centrosResponse, contratosResponse] = await Promise.all([
      erpApi.clientes.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.contratosObra.list()
    ]);
    setClientes(clientesResponse.filter((cliente) => cliente.status !== 'inativo'));
    setObrasCadastro(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setCentrosCusto(centrosResponse.filter((centro) => centro.status !== 'inativo'));
    setContratosCadastro(contratosResponse);
  }, []);

  const loadDashboard = React.useCallback(async (nextFilters: DashboardExecutivoFilters): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const query = activeFilters(nextFilters);
      const [resumo, obras, alertas, tendencia, ranking, financeiro, faturamento, operacional] = await Promise.all([
        erpApi.dashboardExecutivo.resumo(query),
        erpApi.dashboardExecutivo.obras(query),
        erpApi.dashboardExecutivo.alertas(query),
        erpApi.dashboardExecutivo.tendenciaMensal(query),
        erpApi.dashboardExecutivo.rankingObras(query),
        erpApi.dashboardExecutivo.financeiro(query),
        erpApi.dashboardExecutivo.faturamento(query),
        erpApi.dashboardExecutivo.operacional(query)
      ]);
      setDashboard({ resumo, obras, alertas, tendencia, ranking, financeiro, faturamento, operacional });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const initialFilters = emptyFilters();
    setFilters(initialFilters);
    Promise.all([loadCatalogs(), loadDashboard(initialFilters)]).catch((loadError) => {
      setError(getErrorMessage(loadError));
      setLoading(false);
    });
  }, [loadCatalogs, loadDashboard]);

  const updateFilter = (field: keyof DashboardExecutivoFilters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const refresh = async (): Promise<void> => {
    await loadDashboard(filters);
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    await loadDashboard(nextFilters);
  };

  const kpis = dashboard.resumo?.kpis || {};
  const alertSummary = dashboard.resumo?.alertas_resumo || {};
  const operacionalTotais = (dashboard.operacional?.totais || {}) as Record<string, unknown>;
  const financeiroTotais = (dashboard.financeiro?.totais || {}) as Record<string, unknown>;
  const margemPortfolio = toNumber(kpis.receita_faturada_manual) > 0
    ? toNumber(kpis.receita_faturada_manual) - toNumber(kpis.custo_realizado)
    : toNumber(kpis.margem_realizada);
  const margemPct = toNumber(kpis.receita_faturada_manual) > 0
    ? (margemPortfolio / toNumber(kpis.receita_faturada_manual)) * 100
    : null;

  const trendOf = (key: string): number[] => dashboard.tendencia.map((row) => toNumber(row[key]));

  const primaryCards: DashboardKpiCard[] = [
    { label: 'Obras ativas', value: kpis.obras_ativas, type: 'number', tone: 'primary' },
    { label: 'Contratado total', value: kpis.valor_total_contratado, type: 'money', tone: 'primary', trend: trendOf('acumulado_previsto') },
    { label: 'Custo realizado', value: kpis.custo_realizado, type: 'money', trend: trendOf('custo_realizado') },
    { label: 'Receita faturada', value: kpis.receita_faturada_manual, type: 'money', trend: trendOf('receita_faturada_manual') },
    { label: 'Margem realizada', value: margemPortfolio, type: 'money', tone: margemPortfolio < 0 ? 'danger' : 'primary', trend: trendOf('margem_mensal') }
  ];

  const operationCards: DashboardKpiCard[] = [
    { label: 'Pedidos em aberto', value: operacionalTotais.pedidos_em_aberto ?? operacionalTotais.pedidos_abertos ?? 0, type: 'number' },
    { label: 'Pedidos aguardando aprovação', value: operacionalTotais.pedidos_aguardando_aprovacao ?? operacionalTotais.pedidos_pendentes_aprovacao ?? 0, type: 'number', tone: toNumber(operacionalTotais.pedidos_aguardando_aprovacao) > 0 ? 'warning' : undefined },
    { label: 'Compras em aprovação', value: operacionalTotais.valor_compras_em_aprovacao ?? 0, type: 'money' },
    { label: 'NFs pendentes de vínculo', value: operacionalTotais.notas_sem_pedido ?? operacionalTotais.notas_pendentes_vinculo ?? 0, type: 'number', tone: toNumber(operacionalTotais.notas_sem_pedido) > 0 ? 'warning' : undefined },
    { label: 'Medições pendentes', value: kpis.medicoes_pendentes, type: 'number', tone: toNumber(kpis.medicoes_pendentes) > 0 ? 'warning' : undefined },
    { label: 'Programações liberadas', value: kpis.programacoes_liberadas, type: 'number' }
  ];

  const financeCards: DashboardKpiCard[] = [
    { label: 'Contas vencidas', value: kpis.contas_vencidas, type: 'number', tone: toNumber(kpis.contas_vencidas) > 0 ? 'danger' : undefined },
    { label: 'Contas próximos 7 dias', value: financeiroTotais.contas_a_vencer_7_dias ?? financeiroTotais.contas_a_vencer ?? kpis.contas_a_vencer, type: 'number' },
    { label: 'Programações mock', value: financeiroTotais.programacoes_pendentes ?? kpis.programacoes_pendentes ?? 0, type: 'number' },
    { label: 'Saldo a faturar', value: sumValues(dashboard.obras, 'saldo_a_faturar'), type: 'money' }
  ];

  const marginCards: DashboardKpiCard[] = [
    { label: 'Orçamento previsto', value: kpis.orcamento_previsto, type: 'money' },
    { label: 'Margem % faturada', value: margemPct, type: 'percent', tone: margemPct !== null && margemPct < 0 ? 'danger' : undefined },
    { label: 'Desvio orçamento', value: sumValues(dashboard.obras, 'desvio_orcamento'), type: 'money', tone: toNumber(sumValues(dashboard.obras, 'desvio_orcamento')) > 0 ? 'warning' : undefined }
  ];

  const riskCards: Array<[string, unknown]> = [
    ['Sem orçamento aprovado', alertSummary.obras_sem_orcamento_aprovado],
    ['Sem contrato ativo', alertSummary.obras_sem_contrato_ativo],
    ['Custo acima previsto', alertSummary.obras_custo_acima_previsto],
    ['Margem negativa', alertSummary.obras_margem_negativa],
    ['Programação liberada sem conferência', alertSummary.programacoes_liberadas_nao_conferidas],
    ['Planejamento atrasado', alertSummary.planejamentos_atrasados]
  ];

  return (
    <section className="enac-web-page enac-report-page enac-dashboard-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Dashboard Executivo da Diretoria</h1>
      <p className="enac-web-lead">
        Visão consolidada de obras, margem, financeiro, faturamento e alertas operacionais em modo gerencial somente leitura.
      </p>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters enac-dashboard-filters" aria-label="Filtros dashboard executivo">
        <label>
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => updateFilter('obra_id', event.target.value)} disabled={loading}>
            <option value="">Todas</option>
            {obrasCadastro.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Cliente</span>
          <select value={filters.cliente_id || ''} onChange={(event) => updateFilter('cliente_id', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Centro de custo</span>
          <select value={filters.centro_custo_id || ''} onChange={(event) => updateFilter('centro_custo_id', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Contrato</span>
          <select value={filters.contrato_id || ''} onChange={(event) => updateFilter('contrato_id', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {contratosCadastro.map((contrato) => <option key={contrato.id} value={contrato.id}>{contrato.numero} - {contrato.status}</option>)}
          </select>
        </label>
        <label>
          <span>Status da obra</span>
          <select value={filters.status_obra || ''} onChange={(event) => updateFilter('status_obra', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>
        <label>
          <span>Período de</span>
          <input type="date" value={filters.periodo_de || ''} onChange={(event) => updateFilter('periodo_de', event.target.value)} disabled={loading} />
        </label>
        <label>
          <span>Período até</span>
          <input type="date" value={filters.periodo_ate || ''} onChange={(event) => updateFilter('periodo_ate', event.target.value)} disabled={loading} />
        </label>
        <div className="enac-dashboard-filter-actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Pesquisando...' : 'Pesquisar'}
          </button>
          <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>
            Limpar filtros
          </button>
        </div>
      </section>

      <div className="enac-ui-tabs" role="tablist" aria-label="Dashboard executivo">
        <button type="button" className={activeView === 'resumo' ? 'is-active' : ''} onClick={() => setActiveView('resumo')}>Resumo</button>
        <button type="button" className={activeView === 'tendencia' ? 'is-active' : ''} onClick={() => setActiveView('tendencia')}>Tendência</button>
        <button type="button" className={activeView === 'ranking' ? 'is-active' : ''} onClick={() => setActiveView('ranking')}>Ranking</button>
        <button type="button" className={activeView === 'alertas' ? 'is-active' : ''} onClick={() => setActiveView('alertas')}>Alertas</button>
        <button type="button" className={activeView === 'obras' ? 'is-active' : ''} onClick={() => setActiveView('obras')}>Obras</button>
        <button type="button" className={activeView === 'financeiro' ? 'is-active' : ''} onClick={() => setActiveView('financeiro')}>Financeiro</button>
        <button type="button" className={activeView === 'faturamento' ? 'is-active' : ''} onClick={() => setActiveView('faturamento')}>Faturamento</button>
        <button type="button" className={activeView === 'operacional' ? 'is-active' : ''} onClick={() => setActiveView('operacional')}>Operacional</button>
      </div>

      {activeView === 'resumo' && (
      <>
      <div className="enac-dashboard-summary-stack">
        <section className="enac-dashboard-kpi-group enac-dashboard-kpi-group--primary" aria-label="KPIs principais">
          <div className="enac-dashboard-group-head">
            <span>Visão executiva</span>
            <h2>Indicadores principais</h2>
          </div>
          <div className="enac-report-cards enac-dashboard-cards enac-dashboard-cards--primary">
            {primaryCards.map((card) => (
              <article className={`enac-report-card enac-dashboard-card ${card.tone ? `is-${card.tone}` : ''}`} key={card.label}>
                <span>{card.label}</span>
                <strong title={card.type === 'money' ? formatMoney(card.value) : formatDashboardValue(card)}>{formatDashboardValue(card)}</strong>
                {card.trend && card.trend.length > 1 && (
                  <Sparkline data={card.trend} tone={card.tone === 'danger' ? 'danger' : 'brand'} />
                )}
              </article>
            ))}
          </div>
        </section>

        <div className="enac-dashboard-kpi-groups">
          <section className="enac-dashboard-kpi-group" aria-label="KPIs de operação">
            <div className="enac-dashboard-group-head">
              <span>Operação</span>
              <h2>Rotina e obra</h2>
            </div>
            <div className="enac-report-cards enac-dashboard-cards enac-dashboard-cards--secondary">
              {operationCards.map((card) => (
                <article className={`enac-report-card enac-dashboard-card ${card.tone ? `is-${card.tone}` : ''}`} key={card.label}>
                  <span>{card.label}</span>
                  <strong>{formatDashboardValue(card)}</strong>
                </article>
              ))}
            </div>
          </section>
          <section className="enac-dashboard-kpi-group" aria-label="KPIs financeiros">
            <div className="enac-dashboard-group-head">
              <span>Financeiro</span>
              <h2>Vencimentos e saldo</h2>
            </div>
            <div className="enac-report-cards enac-dashboard-cards enac-dashboard-cards--secondary">
              {financeCards.map((card) => (
                <article className={`enac-report-card enac-dashboard-card ${card.tone ? `is-${card.tone}` : ''}`} key={card.label}>
                  <span>{card.label}</span>
                  <strong title={card.type === 'money' ? formatMoney(card.value) : formatDashboardValue(card)}>{formatDashboardValue(card)}</strong>
                </article>
              ))}
            </div>
          </section>
          <section className="enac-dashboard-kpi-group enac-dashboard-kpi-group--margin" aria-label="KPIs de margem">
            <div className="enac-dashboard-group-head">
              <span>Margem</span>
              <h2>Orçamento e desvio</h2>
            </div>
            <div className="enac-report-cards enac-dashboard-cards enac-dashboard-cards--secondary">
              {marginCards.map((card) => (
                <article className={`enac-report-card enac-dashboard-card ${card.tone ? `is-${card.tone}` : ''}`} key={card.label}>
                  <span>{card.label}</span>
                  <strong title={card.type === 'money' ? formatMoney(card.value) : formatDashboardValue(card)}>{formatDashboardValue(card)}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="enac-dashboard-kpi-group enac-dashboard-kpi-group--alerts" aria-label="Alertas consolidados">
          <div className="enac-dashboard-group-head">
            <span>Alertas</span>
            <h2>Pontos de atenção</h2>
          </div>
          <div className="enac-dashboard-risks">
            {riskCards.map(([label, value]) => (
              <article className={toNumber(value) > 0 ? 'is-warning' : 'is-muted'} key={label}>
                <span>{label}</span>
                <strong>{formatNumber(value)}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>
      </>
      )}

      {activeView === 'tendencia' && <DashboardTrend rows={dashboard.tendencia} />}

      {activeView === 'ranking' && (
      <div className="enac-dashboard-two-columns">
        <ReportTable
          title="Ranking por faturamento"
          rows={asRows(dashboard.ranking?.maior_faturamento)}
          columns={[
            { key: 'obra_codigo', label: 'Obra' },
            { key: 'obra_nome', label: 'Nome' },
            { key: 'cliente_nome', label: 'Cliente' },
            { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
            { key: 'margem_realizada', label: 'Margem', type: 'money' }
          ]}
        />
        <ReportTable
          title="Obras críticas por desvio"
          rows={asRows(dashboard.ranking?.maior_desvio_orcamento)}
          columns={[
            { key: 'obra_codigo', label: 'Obra' },
            { key: 'obra_nome', label: 'Nome' },
            { key: 'orcamento_previsto', label: 'Previsto', type: 'money' },
            { key: 'custo_realizado', label: 'Realizado', type: 'money' },
            { key: 'desvio_orcamento', label: 'Desvio', type: 'money' }
          ]}
        />
      </div>
      )}

      <div className="enac-report-grid">
        {activeView === 'alertas' && <AlertsPanel alertas={dashboard.alertas} />}
        {activeView === 'obras' && (
        <ReportTable
          title="Obras consolidadas"
          rows={dashboard.obras as Array<Record<string, unknown>>}
          columns={[
            { key: 'obra_codigo', label: 'Obra' },
            { key: 'obra_nome', label: 'Nome' },
            { key: 'cliente_nome', label: 'Cliente' },
            { key: 'valor_total_contratado', label: 'Contratado', type: 'money' },
            { key: 'orcamento_previsto', label: 'Previsto', type: 'money' },
            { key: 'custo_realizado', label: 'Realizado', type: 'money' },
            { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
            { key: 'margem_realizada', label: 'Margem', type: 'money' },
            { key: 'contas_vencidas', label: 'Vencidas', type: 'number' }
          ]}
        />
        )}
        {activeView === 'financeiro' && (
        <div className="enac-dashboard-two-columns">
          <ReportTable
            title="Financeiro"
            rows={asRows(dashboard.financeiro?.por_obra)}
            columns={[
              { key: 'obra_codigo', label: 'Obra' },
              { key: 'contas_abertas_valor', label: 'Em aberto', type: 'money' },
              { key: 'contas_vencidas', label: 'Vencidas', type: 'number' },
              { key: 'programacoes_liberadas', label: 'Liberadas', type: 'number' },
              { key: 'baixas_manuais', label: 'Baixas manuais', type: 'number' }
            ]}
          />
          <SummaryTable
            title="Totais financeiros"
            values={dashboard.financeiro?.totais}
            columns={[
              ['contas_abertas', 'Contas em aberto', 'number'],
              ['contas_abertas_valor', 'Valor em aberto', 'money'],
              ['contas_vencidas', 'Contas vencidas', 'number'],
              ['contas_a_vencer', 'A vencer', 'number'],
              ['programacoes_liberadas', 'Programações liberadas', 'number'],
              ['programacoes_conferidas', 'Programações conferidas', 'number'],
              ['custo_baixado_manual', 'Baixado manual', 'money']
            ]}
          />
        </div>
        )}
        {activeView === 'faturamento' && (
        <div className="enac-dashboard-two-columns">
          <ReportTable
            title="Faturamento"
            rows={asRows(dashboard.faturamento?.maiores_saldos_a_faturar)}
            columns={[
              { key: 'obra_codigo', label: 'Obra' },
              { key: 'receita_medida', label: 'Medido', type: 'money' },
              { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
              { key: 'faturamento_pendente', label: 'Pendente', type: 'money' },
              { key: 'saldo_a_faturar', label: 'Saldo', type: 'money' }
            ]}
          />
          <SummaryTable
            title="Totais de faturamento"
            values={dashboard.faturamento?.totais}
            columns={[
              ['receita_medida', 'Receita medida', 'money'],
              ['receita_faturada_manual', 'Receita faturada', 'money'],
              ['faturamento_pendente', 'Faturamento pendente', 'money'],
              ['pedidos_faturamento_pendentes', 'Pedidos pendentes', 'number'],
              ['saldo_a_faturar', 'Saldo a faturar', 'money']
            ]}
          />
        </div>
        )}
        {activeView === 'operacional' && (
        <div className="enac-dashboard-two-columns">
          <SummaryTable
            title="Operacional"
            values={dashboard.operacional?.totais}
            columns={[
              ['obras_total', 'Obras no filtro', 'number'],
              ['obras_ativas', 'Obras ativas', 'number'],
              ['medicoes_pendentes', 'Medições pendentes', 'number'],
              ['medicoes_aprovadas_sem_pedido', 'Medições aprovadas sem pedido', 'number'],
              ['pedidos_faturamento_pendentes', 'Pedidos de faturamento pendentes', 'number'],
              ['planejamentos_atrasados', 'Planejamentos atrasados', 'number'],
              ['orcamentos_sem_cronograma', 'Orçamentos sem cronograma', 'number']
            ]}
          />
          <ReportTable
            title="Status dos pedidos de compra"
            rows={asRows(dashboard.operacional?.status_pedidos_compra)}
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'quantidade', label: 'Quantidade', type: 'number' }
            ]}
          />
        </div>
        )}
      </div>
    </section>
  );
}

function DashboardTrend({ rows }: { rows: DashboardExecutivoTendenciaApi[] }): JSX.Element {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [
      toNumber(row.faturamento_previsto),
      toNumber(row.receita_faturada_manual),
      toNumber(row.custo_realizado)
    ])
  );

  return (
    <section className="enac-report-section enac-pr-chart" aria-label="Tendência mensal executiva">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Tendência mensal</h2>
          <p>{rows.length} competência(s)</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="enac-cadastro-empty">Sem tendência mensal para os filtros atuais.</div>
      ) : (
        <div className="enac-pr-chart-body">
          {rows.map((row) => (
            <article className="enac-pr-chart-row enac-dashboard-trend-row" key={row.competencia}>
              <strong>{row.competencia}</strong>
              <MetricBar label="Previsto" value={row.faturamento_previsto} maxValue={maxValue} variant="previsto" />
              <MetricBar label="Faturado" value={row.receita_faturada_manual} maxValue={maxValue} variant="faturado" />
              <MetricBar label="Custo" value={row.custo_realizado} maxValue={maxValue} variant="realizado" />
              <MetricBar label="Margem" value={row.margem_mensal} maxValue={maxValue} variant="margem" />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricBar({
  label,
  value,
  maxValue,
  variant
}: {
  label: string;
  value: unknown;
  maxValue: number;
  variant: 'previsto' | 'realizado' | 'faturado' | 'margem';
}): JSX.Element {
  const numericValue = toNumber(value);
  const width = Math.max(2, Math.min(100, (Math.abs(numericValue) / maxValue) * 100));

  return (
    <div className="enac-pr-metric">
      <span>{label}</span>
      <div className="enac-pr-bar">
        <i className={`enac-pr-bar-fill enac-pr-bar-fill--${variant}`} style={{ width: `${width}%` }} />
      </div>
      <strong>{formatMoney(numericValue)}</strong>
    </div>
  );
}

function AlertsPanel({ alertas }: { alertas: DashboardExecutivoAlertaApi[] }): JSX.Element {
  return (
    <section className="enac-report-section enac-dashboard-alert-panel">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Alertas executivos</h2>
          <p>{alertas.length} alerta(s)</p>
        </div>
      </div>
      {alertas.length === 0 ? (
        <div className="enac-cadastro-empty">Nenhum alerta para os filtros atuais.</div>
      ) : (
        <div className="enac-dashboard-alert-list">
          {alertas.slice(0, 24).map((alerta, index) => (
            <article className={`enac-dashboard-alert enac-dashboard-alert--${alerta.severidade.toLowerCase()}`} key={`${alerta.tipo}-${alerta.obra_id}-${index}`}>
              <span>{alerta.severidade}</span>
              <strong>{alerta.obra_codigo} · {alerta.obra_nome}</strong>
              <p>{alerta.mensagem}</p>
              {alerta.valor !== null && alerta.valor !== undefined && <small>{formatMoney(alerta.valor)}</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportTable({
  title,
  rows,
  columns
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  columns: ReportColumn[];
}): JSX.Element {
  return (
    <section className="enac-report-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{title}</h2>
          <p>{rows.length} registro(s)</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="enac-cadastro-empty">Sem dados para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-report-table enac-dashboard-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id || row.obra_id || row.tipo || row.status || index)}>
                  {columns.map((column) => <td key={column.key}>{formatCell(row, column)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SummaryTable({
  title,
  values,
  columns
}: {
  title: string;
  values?: Record<string, unknown> | null;
  columns: Array<[string, string, 'money' | 'number' | 'percent']>;
}): JSX.Element {
  const rows = columns.map(([key, label, type]) => ({ key, label, type, value: values?.[key] }));

  return (
    <section className="enac-report-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{title}</h2>
          <p>{rows.length} indicador(es)</p>
        </div>
      </div>
      <div className="enac-dashboard-summary-list">
        {rows.map((row) => (
          <div key={row.key}>
            <span>{row.label}</span>
            <strong>{row.type === 'money' ? formatMoney(row.value) : row.type === 'percent' ? formatPercent(row.value) : formatNumber(row.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
