import * as React from 'react';
import {
  erpApi,
  type AuditoriaDetalheApi,
  type AuditoriaEventoApi,
  type AuditoriaFilters,
  type AuditoriaModuloApi,
  type AuditoriaResumoApi,
  type CentroCustoApi,
  type ObraApi,
  type UsuarioApi
} from '../../services/erpApi';

type AuditoriaTab = 'eventos' | 'criticos' | 'modulos' | 'timeline';

interface AuditoriaState {
  resumo: AuditoriaResumoApi | null;
  eventos: AuditoriaEventoApi[];
  criticos: AuditoriaEventoApi[];
  modulos: AuditoriaModuloApi[];
}

const marker = 'DEV_LOCAL_V3_13';
const severityOptions = ['', 'CRITICA', 'ALTA', 'MEDIA', 'INFO'];
const resultOptions = ['', 'BLOQUEADO', 'APROVADO', 'REPROVADO', 'CANCELADO', 'DEVOLVIDO', 'LIBERADO', 'CONFERIDO', 'BAIXA_MANUAL', 'ESTORNO_BAIXA', 'REGISTRADO'];
const baseModuleOptions = [
  '',
  'administracao',
  'auditoria',
  'central-tarefas',
  'riscos-pendencias',
  'dashboard-executivo',
  'previsto-realizado',
  'orcamentos-planejamento',
  'contratos-obra',
  'medicoes-faturamento',
  'programacoes-pagamento',
  'contas-pagar',
  'notas-entrada',
  'pedidos-compra',
  'cotacoes',
  'solicitacoes-compra'
];

const emptyFilters = (): AuditoriaFilters => ({
  periodo_de: '',
  periodo_ate: '',
  usuario_id: '',
  modulo: '',
  acao: '',
  entidade: '',
  entidade_id: '',
  obra_id: '',
  contrato_id: '',
  centro_custo_id: '',
  severidade: '',
  resultado: '',
  texto: '',
  limit: '300'
});

const emptyState = (): AuditoriaState => ({
  resumo: null,
  eventos: [],
  criticos: [],
  modulos: []
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const cleanFilters = (filters: AuditoriaFilters): AuditoriaFilters =>
  Object.entries(filters).reduce<AuditoriaFilters>((acc, [key, value]) => {
    if (value && value.trim()) {
      acc[key] = value.trim();
    }
    return acc;
  }, {});

const labelize = (value: string | null | undefined): string => value ? value.replace(/[-_]/g, ' ') : '-';

const formatDateTime = (value: unknown): string => {
  if (!value) {
    return '-';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const eventCount = (items: AuditoriaEventoApi[]): string => `${items.length.toLocaleString('pt-BR')} evento(s)`;

const payloadPreview = (payload: Record<string, unknown> | undefined): string => {
  if (!payload) {
    return '{}';
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

const isHighlightAction = (event: AuditoriaEventoApi): boolean => {
  const joined = `${event.acao} ${event.resultado} ${event.payload ? JSON.stringify(event.payload) : ''}`.toLowerCase();
  return joined.includes('bloquear') ||
    joined.includes('negado') ||
    joined.includes('aprovar') ||
    joined.includes('reprovar') ||
    joined.includes('cancelar') ||
    joined.includes('baixar_manual') ||
    joined.includes('aditivo') ||
    joined.includes('orcamento') ||
    joined.includes('contrato');
};

export function AuditoriaLogsPage(): JSX.Element {
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [filters, setFilters] = React.useState<AuditoriaFilters>(emptyFilters());
  const [state, setState] = React.useState<AuditoriaState>(emptyState());
  const [selected, setSelected] = React.useState<AuditoriaEventoApi | null>(null);
  const [detail, setDetail] = React.useState<AuditoriaDetalheApi | null>(null);
  const [activeTab, setActiveTab] = React.useState<AuditoriaTab>('eventos');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const loadCatalogs = React.useCallback(async (): Promise<void> => {
    const [usuariosData, obrasData, centrosData] = await Promise.all([
      erpApi.usuarios.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list()
    ]);
    setUsuarios(usuariosData.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo));
    setObras(obrasData.filter((obra) => obra.status !== 'inativo'));
    setCentrosCusto(centrosData.filter((centro) => centro.status !== 'inativo'));
  }, []);

  const loadAuditoria = React.useCallback(async (nextFilters: AuditoriaFilters): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = cleanFilters(nextFilters);
      const [resumo, eventos, criticos, modulos] = await Promise.all([
        erpApi.auditoria.resumo(activeFilters),
        erpApi.auditoria.eventos(activeFilters),
        erpApi.auditoria.eventosCriticos(activeFilters),
        erpApi.auditoria.modulos(activeFilters)
      ]);
      setState({ resumo, eventos, criticos, modulos });
      setSelected((current) => {
        if (current && eventos.some((event) => event.id === current.id)) {
          return current;
        }
        return eventos[0] || null;
      });
      setDetail(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCatalogs()
      .then(() => loadAuditoria(filters))
      .catch((loadError) => {
        setError(getErrorMessage(loadError));
        setLoading(false);
      });
  }, [filters, loadAuditoria, loadCatalogs]);

  const refresh = async (): Promise<void> => {
    await loadAuditoria(filters);
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    await loadAuditoria(nextFilters);
  };

  const selectEvent = async (event: AuditoriaEventoApi): Promise<void> => {
    setSelected(event);
    setLoadingDetail(true);
    setError('');
    try {
      setDetail(await erpApi.auditoria.get(event.id));
      setActiveTab('timeline');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setLoadingDetail(false);
    }
  };

  const moduleOptions = React.useMemo(() => {
    const dynamic = state.modulos.map((item) => item.modulo).filter(Boolean);
    return Array.from(new Set([...baseModuleOptions, ...dynamic]));
  }, [state.modulos]);

  const actionOptions = React.useMemo(() => {
    const actions = state.eventos.map((event) => event.acao).filter(Boolean);
    return ['', ...Array.from(new Set(actions)).sort()];
  }, [state.eventos]);

  const selectedEvent = detail?.evento || selected;
  const timeline = detail?.timeline || [];
  const highlighted = state.eventos.filter(isHighlightAction).slice(0, 6);

  return (
    <section className="enac-web-page enac-audit-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Auditoria e Logs</h1>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters enac-audit-filters" aria-label="Filtros de auditoria">
        <label>
          <span>Período de</span>
          <input type="date" value={filters.periodo_de || ''} onChange={(event) => setFilters((current) => ({ ...current, periodo_de: event.target.value }))} disabled={loading} />
        </label>
        <label>
          <span>Período até</span>
          <input type="date" value={filters.periodo_ate || ''} onChange={(event) => setFilters((current) => ({ ...current, periodo_ate: event.target.value }))} disabled={loading} />
        </label>
        <label>
          <span>Usuário</span>
          <select value={filters.usuario_id || ''} onChange={(event) => setFilters((current) => ({ ...current, usuario_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Módulo</span>
          <select value={filters.modulo || ''} onChange={(event) => setFilters((current) => ({ ...current, modulo: event.target.value }))} disabled={loading}>
            {moduleOptions.map((modulo) => <option key={modulo || 'todos'} value={modulo}>{modulo ? labelize(modulo) : 'Todos'}</option>)}
          </select>
        </label>
        <label>
          <span>Ação</span>
          <select value={filters.acao || ''} onChange={(event) => setFilters((current) => ({ ...current, acao: event.target.value }))} disabled={loading}>
            {actionOptions.map((acao) => <option key={acao || 'todas'} value={acao}>{acao ? labelize(acao) : 'Todas'}</option>)}
          </select>
        </label>
        <label>
          <span>Entidade</span>
          <input value={filters.entidade || ''} onChange={(event) => setFilters((current) => ({ ...current, entidade: event.target.value }))} disabled={loading} placeholder="conta_pagar" />
        </label>
        <label>
          <span>Entidade ID</span>
          <input value={filters.entidade_id || ''} onChange={(event) => setFilters((current) => ({ ...current, entidade_id: event.target.value }))} disabled={loading} placeholder="UUID" />
        </label>
        <label>
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => setFilters((current) => ({ ...current, obra_id: event.target.value }))} disabled={loading}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Centro de custo</span>
          <select value={filters.centro_custo_id || ''} onChange={(event) => setFilters((current) => ({ ...current, centro_custo_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Contrato ID</span>
          <input value={filters.contrato_id || ''} onChange={(event) => setFilters((current) => ({ ...current, contrato_id: event.target.value }))} disabled={loading} placeholder="UUID" />
        </label>
        <label>
          <span>Severidade</span>
          <select value={filters.severidade || ''} onChange={(event) => setFilters((current) => ({ ...current, severidade: event.target.value }))} disabled={loading}>
            {severityOptions.map((severity) => <option key={severity || 'todas'} value={severity}>{severity || 'Todas'}</option>)}
          </select>
        </label>
        <label>
          <span>Resultado</span>
          <select value={filters.resultado || ''} onChange={(event) => setFilters((current) => ({ ...current, resultado: event.target.value }))} disabled={loading}>
            {resultOptions.map((result) => <option key={result || 'todos'} value={result}>{result ? labelize(result) : 'Todos'}</option>)}
          </select>
        </label>
        <label>
          <span>Busca</span>
          <input value={filters.texto || ''} onChange={(event) => setFilters((current) => ({ ...current, texto: event.target.value }))} disabled={loading} />
        </label>
        <div className="enac-audit-filter-actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>Atualizar</button>
          <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>Limpar filtros</button>
        </div>
      </section>

      <div className="enac-report-cards enac-audit-cards">
        <AuditCard label="Eventos" value={state.resumo?.total || 0} />
        <AuditCard label="Críticos" value={state.resumo?.criticos || 0} />
        <AuditCard label="Bloqueios por alçada" value={state.resumo?.bloqueios_alcada || 0} />
        <AuditCard label="Aprovações" value={state.resumo?.aprovacoes || 0} />
        <AuditCard label="Módulos" value={state.resumo?.modulos_distintos || 0} />
      </div>

      <section className="enac-report-section enac-audit-highlights">
        <div className="enac-cadastro-toolbar">
          <div>
            <h2>Eventos destacados</h2>
            <p>Bloqueios, decisões, cancelamentos, baixa manual e mudanças contratuais</p>
          </div>
        </div>
        {highlighted.length === 0 ? (
          <div className="enac-cadastro-empty">Sem eventos destacados nos filtros atuais.</div>
        ) : (
          <div className="enac-audit-highlight-grid">
            {highlighted.map((event) => (
              <button key={event.id} type="button" onClick={() => void selectEvent(event)}>
                <span className={`enac-audit-chip enac-audit-chip--${String(event.severidade).toLowerCase()}`}>{event.severidade}</span>
                <strong>{labelize(event.acao)}</strong>
                <small>{labelize(event.modulo)} · {formatDateTime(event.created_at)}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="enac-audit-tabs" role="tablist" aria-label="Visões de auditoria">
        <button type="button" className={activeTab === 'eventos' ? 'is-active' : ''} onClick={() => setActiveTab('eventos')}>Eventos</button>
        <button type="button" className={activeTab === 'criticos' ? 'is-active' : ''} onClick={() => setActiveTab('criticos')}>Críticos</button>
        <button type="button" className={activeTab === 'modulos' ? 'is-active' : ''} onClick={() => setActiveTab('modulos')}>Por módulo</button>
        <button type="button" className={activeTab === 'timeline' ? 'is-active' : ''} onClick={() => setActiveTab('timeline')}>Timeline</button>
      </div>

      <div className="enac-audit-layout">
        {activeTab === 'modulos' ? (
          <AuditModulesTable modulos={state.modulos} loading={loading} />
        ) : activeTab === 'timeline' ? (
          <AuditTimeline timeline={timeline} selected={selectedEvent} loading={loadingDetail} onSelect={(event) => void selectEvent(event)} />
        ) : (
          <AuditEventsTable
            events={activeTab === 'criticos' ? state.criticos : state.eventos}
            loading={loading}
            selectedId={selectedEvent?.id}
            onSelect={(event) => void selectEvent(event)}
          />
        )}

        <AuditDetail selected={selectedEvent} detail={detail} loading={loadingDetail} />
      </div>
    </section>
  );
}

function AuditCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <article className="enac-report-card enac-dashboard-card enac-audit-card">
      <span>{label}</span>
      <strong>{value.toLocaleString('pt-BR')}</strong>
    </article>
  );
}

function AuditEventsTable({
  events,
  loading,
  selectedId,
  onSelect
}: {
  events: AuditoriaEventoApi[];
  loading: boolean;
  selectedId?: string;
  onSelect: (event: AuditoriaEventoApi) => void;
}): JSX.Element {
  return (
    <section className="enac-report-section enac-audit-table-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Eventos</h2>
          <p>{loading ? 'Atualizando...' : eventCount(events)}</p>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="enac-cadastro-empty">Sem eventos para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-audit-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Módulo</th>
                <th>Entidade</th>
                <th>Ação</th>
                <th>Resultado</th>
                <th>Severidade</th>
                <th>Usuário</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className={selectedId === event.id ? 'is-selected' : ''} onClick={() => onSelect(event)}>
                  <td>{formatDateTime(event.created_at)}</td>
                  <td>{labelize(event.modulo)}</td>
                  <td>
                    <strong>{labelize(event.entidade)}</strong>
                    <small>{event.entidade_id || '-'}</small>
                  </td>
                  <td>{labelize(event.acao)}</td>
                  <td><span className="enac-audit-result">{labelize(event.resultado)}</span></td>
                  <td><span className={`enac-audit-chip enac-audit-chip--${String(event.severidade).toLowerCase()}`}>{event.severidade}</span></td>
                  <td>{event.usuario_nome || event.usuario_email || '-'}</td>
                  <td>{event.status_anterior || event.status_novo ? `${event.status_anterior || '-'} -> ${event.status_novo || '-'}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AuditModulesTable({ modulos, loading }: { modulos: AuditoriaModuloApi[]; loading: boolean }): JSX.Element {
  return (
    <section className="enac-report-section enac-audit-table-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Eventos por módulo</h2>
          <p>{loading ? 'Atualizando...' : `${modulos.length.toLocaleString('pt-BR')} módulo(s)`}</p>
        </div>
      </div>
      {modulos.length === 0 ? (
        <div className="enac-cadastro-empty">Sem módulos para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-audit-table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Total</th>
                <th>Críticos</th>
                <th>Bloqueios</th>
                <th>Aprovações</th>
                <th>Negativas</th>
                <th>Último evento</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map((modulo) => (
                <tr key={modulo.modulo}>
                  <td><strong>{labelize(modulo.modulo)}</strong></td>
                  <td>{modulo.total.toLocaleString('pt-BR')}</td>
                  <td>{modulo.criticos.toLocaleString('pt-BR')}</td>
                  <td>{modulo.bloqueios.toLocaleString('pt-BR')}</td>
                  <td>{modulo.aprovacoes.toLocaleString('pt-BR')}</td>
                  <td>{modulo.negativas.toLocaleString('pt-BR')}</td>
                  <td>{formatDateTime(modulo.ultimo_evento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AuditTimeline({
  timeline,
  selected,
  loading,
  onSelect
}: {
  timeline: AuditoriaEventoApi[];
  selected: AuditoriaEventoApi | null;
  loading: boolean;
  onSelect: (event: AuditoriaEventoApi) => void;
}): JSX.Element {
  return (
    <section className="enac-report-section enac-audit-timeline-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Trilha cronológica</h2>
          <p>{loading ? 'Carregando...' : selected ? `${labelize(selected.entidade)} · ${selected.entidade_id || '-'}` : 'Selecione um evento'}</p>
        </div>
      </div>
      {!selected ? (
        <div className="enac-cadastro-empty">Selecione um evento para ver a timeline por entidade.</div>
      ) : timeline.length === 0 ? (
        <div className="enac-cadastro-empty">Sem timeline para a entidade selecionada.</div>
      ) : (
        <div className="enac-audit-timeline">
          {timeline.map((event) => (
            <button key={event.id} type="button" className={selected.id === event.id ? 'is-selected' : ''} onClick={() => onSelect(event)}>
              <span>{formatDateTime(event.created_at)}</span>
              <strong>{labelize(event.acao)}</strong>
              <small>{labelize(event.resultado)} · {event.usuario_nome || '-'}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AuditDetail({
  selected,
  detail,
  loading
}: {
  selected: AuditoriaEventoApi | null;
  detail: AuditoriaDetalheApi | null;
  loading: boolean;
}): JSX.Element {
  if (!selected) {
    return (
      <section className="enac-report-section enac-audit-detail">
        <div className="enac-cadastro-empty">Selecione um evento para ver payload, usuário e rastreabilidade.</div>
      </section>
    );
  }

  return (
    <section className="enac-report-section enac-audit-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{labelize(selected.acao)}</h2>
          <p>{loading ? 'Carregando detalhe...' : `${labelize(selected.entidade)} · ${formatDateTime(selected.created_at)}`}</p>
        </div>
      </div>
      <div className="enac-audit-detail-grid">
        <div><span>Resultado</span><strong>{labelize(selected.resultado)}</strong></div>
        <div><span>Severidade</span><strong>{selected.severidade}</strong></div>
        <div><span>Módulo</span><strong>{labelize(selected.modulo)}</strong></div>
        <div><span>Usuário</span><strong>{selected.usuario_nome || selected.usuario_email || '-'}</strong></div>
        <div><span>Entidade ID</span><strong>{selected.entidade_id || '-'}</strong></div>
        <div><span>Timeline</span><strong>{(detail?.timeline.length || 0).toLocaleString('pt-BR')} evento(s)</strong></div>
      </div>
      {selected.descricao_resumida && <p className="enac-audit-description">{selected.descricao_resumida}</p>}
      <div className="enac-audit-immutability">
        Logs são exibidos em modo somente leitura. A V3.13 não oferece edição ou exclusão de eventos.
      </div>
      <pre className="enac-audit-payload">{payloadPreview(selected.payload)}</pre>
    </section>
  );
}
