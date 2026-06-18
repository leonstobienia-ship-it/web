import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type FornecedorApi,
  type ObraApi,
  type RelatorioAgingApi,
  type RelatorioAgrupadoApi,
  type RelatorioContaResumoApi,
  type RelatorioFinanceiroFilters,
  type RelatorioFluxoPrevistoApi,
  type RelatorioProgramacaoResumoApi
} from '../../services/erpApi';

interface ReportState {
  contasResumo: RelatorioContaResumoApi | null;
  aging: RelatorioAgingApi[];
  porFornecedor: RelatorioAgrupadoApi[];
  porObra: RelatorioAgrupadoApi[];
  porCentroCusto: RelatorioAgrupadoApi[];
  programacoesResumo: RelatorioProgramacaoResumoApi | null;
  fluxoPrevisto: RelatorioFluxoPrevistoApi[];
}

interface ReportColumn {
  key: string;
  label: string;
  type?: 'money' | 'date' | 'boolean';
}

const marker = 'DEV_LOCAL_V3_5H';

const emptyFilters = (): RelatorioFinanceiroFilters => ({
  periodo_de: '',
  periodo_ate: '',
  fornecedor_id: '',
  obra_id: '',
  centro_custo_id: '',
  status: '',
  vencimento_de: '',
  vencimento_ate: '',
  valor_min: '',
  valor_max: ''
});

const emptyReportState = (): ReportState => ({
  contasResumo: null,
  aging: [],
  porFornecedor: [],
  porObra: [],
  porCentroCusto: [],
  programacoesResumo: null,
  fluxoPrevisto: []
});

const statusOptions = [
  'PROVISIONADA',
  'APROVADA',
  'PROGRAMADA',
  'BAIXADA_MANUAL',
  'CANCELADA',
  'RASCUNHO',
  'SUBMETIDA',
  'LIBERADA',
  'REPROVADA'
];
type FinanceReportView = 'resumo' | 'status' | 'aging' | 'vencimentos' | 'programacoes' | 'agrupamentos' | 'fluxo' | 'baixas';

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: unknown): string =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: unknown): string => {
  const raw = String(value || '');
  return raw ? raw.slice(0, 10).split('-').reverse().join('/') : '-';
};

const formatCell = (row: Record<string, unknown>, column: ReportColumn): string => {
  const value = row[column.key];
  if (column.type === 'money') {
    return formatMoney(value);
  }
  if (column.type === 'date') {
    return formatDate(value);
  }
  if (column.type === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  return value === null || value === undefined || value === '' ? '-' : String(value);
};

const activeFilters = (filters: RelatorioFinanceiroFilters): RelatorioFinanceiroFilters =>
  (Object.keys(filters) as Array<keyof RelatorioFinanceiroFilters>).reduce<RelatorioFinanceiroFilters>((acc, key) => {
    const value = filters[key];
    if (value !== undefined && String(value).trim() !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function RelatoriosFinanceirosPage(): JSX.Element {
  const [filters, setFilters] = React.useState<RelatorioFinanceiroFilters>(emptyFilters());
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [reports, setReports] = React.useState<ReportState>(emptyReportState());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<FinanceReportView>('resumo');

  const loadReports = React.useCallback(async (nextFilters: RelatorioFinanceiroFilters): Promise<void> => {
    const query = activeFilters(nextFilters);
    const [
      contasResumo,
      aging,
      porFornecedor,
      porObra,
      porCentroCusto,
      programacoesResumo,
      fluxoPrevisto
    ] = await Promise.all([
      erpApi.relatoriosFinanceiros.contasResumo(query),
      erpApi.relatoriosFinanceiros.contasAging(query),
      erpApi.relatoriosFinanceiros.contasPorFornecedor(query),
      erpApi.relatoriosFinanceiros.contasPorObra(query),
      erpApi.relatoriosFinanceiros.contasPorCentroCusto(query),
      erpApi.relatoriosFinanceiros.programacoesResumo(query),
      erpApi.relatoriosFinanceiros.fluxoPrevisto(query)
    ]);
    setReports({ contasResumo, aging, porFornecedor, porObra, porCentroCusto, programacoesResumo, fluxoPrevisto });
  }, []);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      erpApi.fornecedores.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      loadReports(emptyFilters())
    ])
      .then(([fornecedoresResponse, obrasResponse, centrosResponse]) => {
        if (!active) {
          return;
        }
        setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
        setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
        setCentrosCusto(centrosResponse.filter((centro) => centro.status !== 'inativo'));
      })
      .catch((loadError) => {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadReports]);

  const updateFilter = (field: keyof RelatorioFinanceiroFilters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      await loadReports(filters);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    setLoading(true);
    setError('');
    try {
      await loadReports(nextFilters);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setLoading(false);
    }
  };

  const totais = reports.contasResumo?.totais || {};
  const totaisProgramacoes = reports.programacoesResumo?.totais || {};
  const summaryCards: Array<[string, unknown]> = [
    ['Total provisionado', totais.total_provisionado],
    ['Total aprovado', totais.total_aprovado],
    ['Total programado', totais.total_programado],
    ['Total liberado', totais.total_liberado],
    ['Total conferido', totais.total_conferido],
    ['Total baixado manualmente', totais.total_baixado_manual],
    ['Saldo em aberto', totais.saldo_aberto],
    ['Programações liberadas', totaisProgramacoes.programacoes_liberadas]
  ];

  return (
    <section className="enac-web-page enac-report-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Relatórios Financeiros</h1>
      <p className="enac-web-lead">
        Painéis de Contas a Pagar, Programações, Liberações, Conferências e Baixas Manuais em modo somente leitura.
      </p>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters" aria-label="Filtros de relatórios financeiros">
        <label>
          <span>Período de</span>
          <input type="date" value={filters.periodo_de || ''} onChange={(event) => updateFilter('periodo_de', event.target.value)} disabled={loading} />
        </label>
        <label>
          <span>Período até</span>
          <input type="date" value={filters.periodo_ate || ''} onChange={(event) => updateFilter('periodo_ate', event.target.value)} disabled={loading} />
        </label>
        <label>
          <span>Fornecedor</span>
          <select value={filters.fornecedor_id || ''} onChange={(event) => updateFilter('fornecedor_id', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => updateFilter('obra_id', event.target.value)} disabled={loading}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
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
          <span>Status</span>
          <select value={filters.status || ''} onChange={(event) => updateFilter('status', event.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          <span>Valor mínimo</span>
          <input type="number" min="0" step="0.01" value={filters.valor_min || ''} onChange={(event) => updateFilter('valor_min', event.target.value)} disabled={loading} />
        </label>
        <label>
          <span>Valor máximo</span>
          <input type="number" min="0" step="0.01" value={filters.valor_max || ''} onChange={(event) => updateFilter('valor_max', event.target.value)} disabled={loading} />
        </label>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Pesquisando...' : 'Pesquisar'}
        </button>
        <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>
          Limpar filtros
        </button>
      </section>

      <div className="enac-ui-tabs" role="tablist" aria-label="Relatórios financeiros">
        <button type="button" className={activeView === 'resumo' ? 'is-active' : ''} onClick={() => setActiveView('resumo')}>Resumo</button>
        <button type="button" className={activeView === 'status' ? 'is-active' : ''} onClick={() => setActiveView('status')}>Status</button>
        <button type="button" className={activeView === 'aging' ? 'is-active' : ''} onClick={() => setActiveView('aging')}>Aging</button>
        <button type="button" className={activeView === 'vencimentos' ? 'is-active' : ''} onClick={() => setActiveView('vencimentos')}>Vencimentos</button>
        <button type="button" className={activeView === 'programacoes' ? 'is-active' : ''} onClick={() => setActiveView('programacoes')}>Programações</button>
        <button type="button" className={activeView === 'agrupamentos' ? 'is-active' : ''} onClick={() => setActiveView('agrupamentos')}>Agrupamentos</button>
        <button type="button" className={activeView === 'fluxo' ? 'is-active' : ''} onClick={() => setActiveView('fluxo')}>Fluxo previsto</button>
        <button type="button" className={activeView === 'baixas' ? 'is-active' : ''} onClick={() => setActiveView('baixas')}>Baixas manuais</button>
      </div>

      {activeView === 'resumo' && (
      <div className="enac-report-cards">
        {summaryCards.map(([label, value]) => (
          <article className="enac-report-card" key={label}>
            <span>{label}</span>
            <strong>{typeof value === 'number' || String(value || '').includes('.') ? formatMoney(value) : value || '0'}</strong>
          </article>
        ))}
      </div>
      )}

      <div className="enac-report-grid">
        {activeView === 'status' && <ReportTable
          title="Contas por status"
          rows={reports.contasResumo?.por_status || []}
          columns={[
            { key: 'status', label: 'Status' },
            { key: 'quantidade', label: 'Qtd.' },
            { key: 'total_original', label: 'Total', type: 'money' },
            { key: 'saldo_aberto', label: 'Saldo', type: 'money' },
            { key: 'total_baixado_manual', label: 'Baixado manual', type: 'money' }
          ]}
        />}
        {activeView === 'aging' && <ReportTable
          title="Aging financeiro"
          rows={reports.aging}
          columns={[
            { key: 'bucket', label: 'Faixa' },
            { key: 'quantidade', label: 'Qtd.' },
            { key: 'saldo_aberto', label: 'Saldo', type: 'money' }
          ]}
        />}
        {activeView === 'vencimentos' && <ReportTable
          title="Contas por vencimento"
          rows={reports.contasResumo?.por_vencimento || []}
          columns={[
            { key: 'data_vencimento', label: 'Vencimento', type: 'date' },
            { key: 'numero_documento', label: 'Documento' },
            { key: 'status', label: 'Status' },
            { key: 'fornecedor_nome', label: 'Fornecedor' },
            { key: 'valor_aberto', label: 'Saldo', type: 'money' },
            { key: 'vencida', label: 'Vencida', type: 'boolean' }
          ]}
        />}
        {activeView === 'programacoes' && <ReportTable
          title="Programações"
          rows={reports.programacoesResumo?.programacoes || []}
          columns={[
            { key: 'data_prevista', label: 'Data', type: 'date' },
            { key: 'codigo', label: 'Código' },
            { key: 'status', label: 'Status' },
            { key: 'liberacao_status', label: 'Liberação' },
            { key: 'conferencia_status', label: 'Conferência' },
            { key: 'valor_total', label: 'Total', type: 'money' }
          ]}
        />}
        {activeView === 'fluxo' && <ReportTable
          title="Fluxo previsto de saída"
          rows={reports.fluxoPrevisto}
          columns={[
            { key: 'data_prevista', label: 'Data', type: 'date' },
            { key: 'quantidade_contas', label: 'Qtd.' },
            { key: 'saida_prevista', label: 'Saída prevista', type: 'money' },
            { key: 'valor_programado', label: 'Programado', type: 'money' },
            { key: 'valor_liberado', label: 'Liberado', type: 'money' },
            { key: 'valor_conferido', label: 'Conferido', type: 'money' }
          ]}
        />}
        {activeView === 'agrupamentos' && (
        <>
        <ReportTable
          title="Por fornecedor"
          rows={reports.porFornecedor}
          columns={groupColumns}
        />
        <ReportTable
          title="Por obra"
          rows={reports.porObra}
          columns={groupColumns}
        />
        <ReportTable
          title="Por centro de custo"
          rows={reports.porCentroCusto}
          columns={groupColumns}
        />
        </>
        )}
        {activeView === 'baixas' && <ReportTable
          title="Baixas manuais por período"
          rows={reports.contasResumo?.baixas_manuais_por_periodo || []}
          columns={[
            { key: 'data_baixa', label: 'Data', type: 'date' },
            { key: 'quantidade', label: 'Qtd.' },
            { key: 'total_baixado', label: 'Total', type: 'money' }
          ]}
        />}
      </div>
    </section>
  );
}

const groupColumns: ReportColumn[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'nome', label: 'Nome' },
  { key: 'quantidade', label: 'Qtd.' },
  { key: 'total_original', label: 'Total', type: 'money' },
  { key: 'saldo_aberto', label: 'Saldo', type: 'money' },
  { key: 'total_baixado_manual', label: 'Baixado manual', type: 'money' },
  { key: 'vencidas', label: 'Vencidas' }
];

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
          <table className="enac-web-table enac-report-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id || row.codigo || row.bucket || row.data_prevista || row.data_baixa || index)}>
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
