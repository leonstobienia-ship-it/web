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
  const margemPortfolio = toNumber(kpis.receita_faturada_manual) > 0
    ? toNumber(kpis.receita_faturada_manual) - toNumber(kpis.custo_realizado)
    : toNumber(kpis.margem_realizada);
  const margemPct = toNumber(kpis.receita_faturada_manual) > 0
    ? (margemPortfolio / toNumber(kpis.receita_faturada_manual)) * 100
    : null;

  const primaryCards: Array<[string, unknown, 'money' | 'number' | 'percent']> = [
    ['Obras ativas', kpis.obras_ativas, 'number'],
    ['Contratado total', kpis.valor_total_contratado, 'money'],
    ['Orçamento previsto', kpis.orcamento_previsto, 'money'],
    ['Custo realizado', kpis.custo_realizado, 'money'],
    ['Receita faturada', kpis.receita_faturada_manual, 'money'],
    ['Margem realizada', kpis.margem_realizada, 'money'],
    ['Margem % faturada', margemPct, 'percent'],
    ['Contas vencidas', kpis.contas_vencidas, 'number'],
    ['Programações liberadas', kpis.programacoes_liberadas, 'number'],
    ['Medições pendentes', kpis.medicoes_pendentes, 'number'],
    ['Saldo a faturar', sumValues(dashboard.obras, 'saldo_a_faturar'), 'money'],
    ['Desvio orçamento', sumValues(dashboard.obras, 'desvio_orcamento'), 'money']
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
      <div className="enac-report-cards enac-dashboard-cards">
        {primaryCards.map(([label, value, type]) => (
          <article className="enac-report-card enac-dashboard-card" key={label}>
            <span>{label}</span>
            <strong>{type === 'money' ? formatMoney(value) : type === 'percent' ? formatPercent(value) : formatNumber(value)}</strong>
          </article>
        ))}
      </div>

      <section className="enac-dashboard-risks" aria-label="Alertas consolidados">
        {riskCards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </article>
        ))}
      </section>
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
