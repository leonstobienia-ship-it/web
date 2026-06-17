import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type ClienteApi,
  type ContratoObraApi,
  type ObraApi,
  type PrevistoRealizadoAgrupamentoApi,
  type PrevistoRealizadoCurvaApi,
  type PrevistoRealizadoDetalheFinanceiroApi,
  type PrevistoRealizadoFilters,
  type PrevistoRealizadoObraResumoApi,
  type PrevistoRealizadoPortfolioApi
} from '../../services/erpApi';

interface ReportColumn {
  key: string;
  label: string;
  type?: 'money' | 'percent' | 'date';
}

const marker = 'DEV_LOCAL_V3_9';

const emptyFilters = (): PrevistoRealizadoFilters => ({
  obra_id: '',
  cliente_id: '',
  centro_custo_id: '',
  contrato_id: '',
  competencia_de: '',
  competencia_ate: ''
});

const emptyDetalhes = (): {
  resumo: PrevistoRealizadoObraResumoApi | null;
  curva: PrevistoRealizadoCurvaApi[];
  pacotes: PrevistoRealizadoAgrupamentoApi[];
  centrosCusto: PrevistoRealizadoAgrupamentoApi[];
  contratos: PrevistoRealizadoAgrupamentoApi[];
  faturamento: PrevistoRealizadoDetalheFinanceiroApi | null;
  custos: PrevistoRealizadoDetalheFinanceiroApi | null;
} => ({
  resumo: null,
  curva: [],
  pacotes: [],
  centrosCusto: [],
  contratos: [],
  faturamento: null,
  custos: null
});

const moneyColumns = new Set([
  'valor_contratado',
  'valor_aditado',
  'valor_total_contratado',
  'orcamento_previsto',
  'custo_comprometido',
  'custo_realizado',
  'custo_baixado_manual',
  'custo_pedidos_confirmados',
  'custo_notas_aprovadas',
  'custo_contas_realizadas',
  'receita_medida',
  'receita_faturada_manual',
  'margem_prevista',
  'margem_realizada',
  'desvio_absoluto',
  'saldo_contratual',
  'saldo_orcamentario',
  'saldo_a_faturar',
  'valor_previsto',
  'valor_total',
  'valor_original',
  'valor_aberto',
  'valor_liquido_previsto',
  'valor_solicitado',
  'valor_baixado'
]);

const activeFilters = (filters: PrevistoRealizadoFilters): PrevistoRealizadoFilters =>
  Object.entries(filters).reduce<PrevistoRealizadoFilters>((acc, [key, value]) => {
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

const formatPercent = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return `${toNumber(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const formatDate = (value: unknown): string => {
  const raw = String(value || '');
  return raw ? raw.slice(0, 10).split('-').reverse().join('/') : '-';
};

const formatCell = (row: Record<string, unknown>, column: ReportColumn): string => {
  const value = row[column.key];
  if (column.type === 'money' || moneyColumns.has(column.key)) {
    return formatMoney(value);
  }
  if (column.type === 'percent') {
    return formatPercent(value);
  }
  if (column.type === 'date') {
    return formatDate(value);
  }
  return value === null || value === undefined || value === '' ? '-' : String(value);
};

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function PrevistoRealizadoPage(): JSX.Element {
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [obrasCadastro, setObrasCadastro] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [contratosCadastro, setContratosCadastro] = React.useState<ContratoObraApi[]>([]);
  const [filters, setFilters] = React.useState<PrevistoRealizadoFilters>(emptyFilters());
  const [portfolio, setPortfolio] = React.useState<PrevistoRealizadoPortfolioApi | null>(null);
  const [obrasResumo, setObrasResumo] = React.useState<PrevistoRealizadoObraResumoApi[]>([]);
  const [selectedObraId, setSelectedObraId] = React.useState<string>('');
  const [detalhes, setDetalhes] = React.useState(emptyDetalhes());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  const loadDetalhesObra = React.useCallback(async (obraId: string, nextFilters: PrevistoRealizadoFilters): Promise<void> => {
    if (!obraId) {
      setDetalhes(emptyDetalhes());
      return;
    }

    const curvaFilters = activeFilters({
      competencia_de: nextFilters.competencia_de,
      competencia_ate: nextFilters.competencia_ate
    });
    const [resumo, curva, pacotes, centros, contratos, faturamento, custos] = await Promise.all([
      erpApi.previstoRealizado.obraResumo(obraId),
      erpApi.previstoRealizado.curva(obraId, curvaFilters),
      erpApi.previstoRealizado.pacotes(obraId),
      erpApi.previstoRealizado.centrosCusto(obraId),
      erpApi.previstoRealizado.contratos(obraId),
      erpApi.previstoRealizado.faturamento(obraId),
      erpApi.previstoRealizado.custos(obraId)
    ]);
    setDetalhes({ resumo, curva, pacotes, centrosCusto: centros, contratos, faturamento, custos });
  }, []);

  const loadAll = React.useCallback(async (nextFilters: PrevistoRealizadoFilters, requestedObraId?: string): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const query = activeFilters({
        obra_id: nextFilters.obra_id,
        cliente_id: nextFilters.cliente_id,
        centro_custo_id: nextFilters.centro_custo_id,
        contrato_id: nextFilters.contrato_id
      });
      const [clientesResponse, obrasCadastroResponse, centrosResponse, contratosResponse, obrasResponse, portfolioResponse] = await Promise.all([
        erpApi.clientes.list(),
        erpApi.obras.list(),
        erpApi.centrosCusto.list(),
        erpApi.contratosObra.list(),
        erpApi.previstoRealizado.obras(query),
        erpApi.previstoRealizado.portfolioResumo(query)
      ]);
      const targetObraId = requestedObraId || nextFilters.obra_id || obrasResponse[0]?.obra_id || '';
      setClientes(clientesResponse.filter((cliente) => cliente.status !== 'inativo'));
      setObrasCadastro(obrasCadastroResponse.filter((obra) => obra.status !== 'inativo'));
      setCentrosCusto(centrosResponse.filter((centro) => centro.status !== 'inativo'));
      setContratosCadastro(contratosResponse);
      setObrasResumo(obrasResponse);
      setPortfolio(portfolioResponse);
      setSelectedObraId(targetObraId);
      await loadDetalhesObra(targetObraId, nextFilters);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [loadDetalhesObra]);

  React.useEffect(() => {
    const initialFilters = emptyFilters();
    setFilters(initialFilters);
    void loadAll(initialFilters);
  }, [loadAll]);

  const updateFilter = (field: keyof PrevistoRealizadoFilters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
    if (field === 'obra_id') {
      setSelectedObraId(value);
    }
  };

  const refresh = async (): Promise<void> => {
    await loadAll(filters, selectedObraId || filters.obra_id);
  };

  const resumo = detalhes.resumo;
  const totais = portfolio?.totais || {};
  const cardSource = resumo || totais;
  const summaryCards: Array<[string, unknown]> = [
    ['Contratado total', cardSource.valor_total_contratado],
    ['Aditivos', cardSource.valor_aditado],
    ['Orçamento previsto', cardSource.orcamento_previsto],
    ['Custo comprometido', cardSource.custo_comprometido],
    ['Custo realizado', cardSource.custo_realizado],
    ['Receita medida', cardSource.receita_medida],
    ['Receita faturada', cardSource.receita_faturada_manual],
    ['Margem prevista', cardSource.margem_prevista],
    ['Margem realizada', cardSource.margem_realizada],
    ['Desvio', cardSource.desvio_absoluto]
  ];

  const alertas = resumo ? [
    resumo.alerta_sem_orcamento_aprovado ? 'Sem orçamento aprovado para a obra selecionada.' : '',
    resumo.alerta_sem_contrato_ativo ? 'Sem contrato ativo ou encerrado associado.' : '',
    resumo.alerta_custo_acima_previsto ? 'Custo realizado acima do orçamento previsto.' : '',
    resumo.alerta_faturamento_abaixo_previsto ? 'Receita faturada abaixo da receita medida.' : '',
    resumo.alerta_margem_negativa ? 'Margem realizada negativa.' : ''
  ].filter(Boolean) : [];

  return (
    <section className="enac-web-page enac-report-page enac-pr-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Previsto x Realizado e Margem por Obra</h1>
      <p className="enac-web-lead">
        Visão gerencial de contratos, orçamento aprovado, custos, medições e faturamento manual em modo somente leitura.
      </p>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters" aria-label="Filtros previsto realizado">
        <label>
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => updateFilter('obra_id', event.target.value)} disabled={loading}>
            <option value="">Primeira obra da consulta</option>
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
          <span>Competência de</span>
          <input type="month" value={filters.competencia_de || ''} onChange={(event) => updateFilter('competencia_de', event.target.value)} disabled={loading} />
        </label>
        <label>
          <span>Competência até</span>
          <input type="month" value={filters.competencia_ate || ''} onChange={(event) => updateFilter('competencia_ate', event.target.value)} disabled={loading} />
        </label>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </section>

      <div className="enac-report-cards">
        {summaryCards.map(([label, value]) => (
          <article className="enac-report-card" key={label}>
            <span>{label}</span>
            <strong>{formatMoney(value)}</strong>
          </article>
        ))}
      </div>

      {alertas.length > 0 && (
        <section className="enac-pr-alerts">
          {alertas.map((alerta) => <span key={alerta}>{alerta}</span>)}
        </section>
      )}

      <CurveChart rows={detalhes.curva} />

      <div className="enac-report-grid">
        <ReportTable
          title="Obras no filtro"
          rows={obrasResumo}
          columns={[
            { key: 'obra_codigo', label: 'Obra' },
            { key: 'obra_nome', label: 'Nome' },
            { key: 'cliente_nome', label: 'Cliente' },
            { key: 'valor_total_contratado', label: 'Contratado', type: 'money' },
            { key: 'orcamento_previsto', label: 'Previsto', type: 'money' },
            { key: 'custo_realizado', label: 'Realizado', type: 'money' },
            { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
            { key: 'margem_realizada', label: 'Margem', type: 'money' },
            { key: 'desvio_percentual', label: 'Desvio %', type: 'percent' }
          ]}
        />
        <ReportTable
          title="Pacotes orçamentários"
          rows={detalhes.pacotes}
          columns={[
            { key: 'pacote_codigo', label: 'Pacote' },
            { key: 'pacote_nome', label: 'Nome' },
            { key: 'centro_custo_nome', label: 'Centro de custo' },
            { key: 'valor_previsto', label: 'Previsto', type: 'money' },
            { key: 'custo_realizado', label: 'Realizado', type: 'money' },
            { key: 'receita_medida', label: 'Medido', type: 'money' },
            { key: 'saldo_orcamentario', label: 'Saldo orçamento', type: 'money' },
            { key: 'margem_realizada', label: 'Margem', type: 'money' }
          ]}
        />
        <ReportTable
          title="Centros de custo"
          rows={detalhes.centrosCusto}
          columns={[
            { key: 'centro_custo_codigo', label: 'Código' },
            { key: 'centro_custo_nome', label: 'Nome' },
            { key: 'valor_previsto', label: 'Previsto', type: 'money' },
            { key: 'custo_comprometido', label: 'Comprometido', type: 'money' },
            { key: 'custo_realizado', label: 'Realizado', type: 'money' },
            { key: 'receita_medida', label: 'Medido', type: 'money' },
            { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
            { key: 'saldo_orcamentario', label: 'Saldo', type: 'money' }
          ]}
        />
        <ReportTable
          title="Contratos e aditivos aprovados"
          rows={detalhes.contratos}
          columns={[
            { key: 'numero', label: 'Contrato' },
            { key: 'status', label: 'Status' },
            { key: 'valor_contratado', label: 'Contratado', type: 'money' },
            { key: 'valor_aditado', label: 'Aditado', type: 'money' },
            { key: 'valor_total_contratado', label: 'Total', type: 'money' },
            { key: 'receita_medida', label: 'Medido', type: 'money' },
            { key: 'receita_faturada_manual', label: 'Faturado', type: 'money' },
            { key: 'saldo_contratual', label: 'Saldo', type: 'money' }
          ]}
        />
        <ReportTable
          title="Medições"
          rows={asRows(detalhes.faturamento?.medicoes)}
          columns={[
            { key: 'numero', label: 'Número' },
            { key: 'competencia', label: 'Competência' },
            { key: 'status', label: 'Status' },
            { key: 'valor_liquido_previsto', label: 'Valor', type: 'money' }
          ]}
        />
        <ReportTable
          title="Faturamento manual registrado"
          rows={asRows(detalhes.faturamento?.pedidos_faturamento)}
          columns={[
            { key: 'codigo', label: 'Código' },
            { key: 'status', label: 'Status' },
            { key: 'data_solicitacao', label: 'Solicitação', type: 'date' },
            { key: 'faturado_manual_data', label: 'Data registro', type: 'date' },
            { key: 'valor_solicitado', label: 'Valor', type: 'money' }
          ]}
        />
        <ReportTable
          title="Pedidos de compra"
          rows={asRows(detalhes.custos?.pedidos_compra)}
          columns={[
            { key: 'codigo', label: 'Código' },
            { key: 'status', label: 'Status' },
            { key: 'data_emissao', label: 'Emissão', type: 'date' },
            { key: 'valor_total', label: 'Valor', type: 'money' }
          ]}
        />
        <ReportTable
          title="Notas fiscais de entrada"
          rows={asRows(detalhes.custos?.notas_fiscais_entrada)}
          columns={[
            { key: 'numero', label: 'Número' },
            { key: 'serie', label: 'Série' },
            { key: 'status', label: 'Status' },
            { key: 'data_entrada', label: 'Entrada', type: 'date' },
            { key: 'valor_total', label: 'Valor', type: 'money' }
          ]}
        />
        <ReportTable
          title="Contas a pagar vinculadas"
          rows={asRows(detalhes.custos?.contas_pagar)}
          columns={[
            { key: 'numero_documento', label: 'Documento' },
            { key: 'status', label: 'Status' },
            { key: 'baixa_status', label: 'Baixa status' },
            { key: 'data_vencimento', label: 'Vencimento', type: 'date' },
            { key: 'valor_original', label: 'Original', type: 'money' },
            { key: 'valor_aberto', label: 'Aberto', type: 'money' }
          ]}
        />
      </div>
    </section>
  );
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
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
          <table className="enac-web-table enac-report-table enac-pr-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id || row.obra_id || row.pacote_id || row.centro_custo_id || row.numero || row.codigo || index)}>
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

function CurveChart({ rows }: { rows: PrevistoRealizadoCurvaApi[] }): JSX.Element {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [toNumber(row.previsto), toNumber(row.realizado), toNumber(row.faturado)])
  );

  return (
    <section className="enac-report-section enac-pr-chart" aria-label="Curva mensal previsto realizado">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Curva mensal</h2>
          <p>{rows.length} competência(s)</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="enac-cadastro-empty">Sem curva mensal para os filtros atuais.</div>
      ) : (
        <div className="enac-pr-chart-body">
          {rows.map((row) => (
            <article className="enac-pr-chart-row" key={row.competencia}>
              <strong>{row.competencia}</strong>
              <MetricBar label="Previsto" value={row.previsto} maxValue={maxValue} variant="previsto" />
              <MetricBar label="Realizado" value={row.realizado} maxValue={maxValue} variant="realizado" />
              <MetricBar label="Faturado" value={row.faturado} maxValue={maxValue} variant="faturado" />
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
  variant: 'previsto' | 'realizado' | 'faturado';
}): JSX.Element {
  const numericValue = toNumber(value);
  const width = Math.max(2, Math.min(100, (numericValue / maxValue) * 100));

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
