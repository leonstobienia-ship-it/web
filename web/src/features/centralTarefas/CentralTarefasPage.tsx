import * as React from 'react';
import {
  erpApi,
  type CentralTarefaApi,
  type CentralTarefaManualPayload,
  type CentralTarefaPrioridade,
  type CentralTarefasFilters,
  type CentralTarefasModuloApi,
  type CentralTarefasResumoApi,
  type ObraApi,
  type PerfilApi,
  type UsuarioApi
} from '../../services/erpApi';

type CentralTab = 'minhas' | 'nova' | 'aprovacoes' | 'atrasadas' | 'criticas' | 'modulos';

interface CentralState {
  resumo: CentralTarefasResumoApi | null;
  minhas: CentralTarefaApi[];
  aprovacoes: CentralTarefaApi[];
  atrasadas: CentralTarefaApi[];
  criticas: CentralTarefaApi[];
  modulos: CentralTarefasModuloApi[];
}

interface CentralTarefasPageProps {
  onNavigate?: (section: string) => void;
}

const marker = 'DEV_LOCAL_V3_12';
const tabLabels: Record<CentralTab, string> = {
  minhas: 'Consulta',
  nova: 'Nova tarefa',
  aprovacoes: 'Aprovações',
  atrasadas: 'Atrasadas',
  criticas: 'Críticas',
  modulos: 'Por Módulo'
};

const prioridadeOptions: Array<CentralTarefaPrioridade | ''> = ['', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const statusOptions = ['', 'ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'PENDENTE_APROVACAO', 'BLOQUEADO_ALCADA', 'PENDENTE_LIBERACAO', 'PENDENTE_CONFERENCIA'];
const moduleOptions = [
  '',
  'central-tarefas',
  'solicitacoes-compra',
  'cotacoes',
  'pedidos-compra',
  'notas-entrada',
  'contas-pagar',
  'programacoes-pagamento',
  'contratos-obra',
  'orcamentos-planejamento',
  'medicoes-faturamento',
  'previsto-realizado',
  'dashboard-executivo',
  'riscos-pendencias'
];
const navigableSections = new Set(moduleOptions.filter(Boolean));
const finalManualStatuses = new Set(['CONCLUIDA', 'CANCELADA']);

const emptyFilters = (): CentralTarefasFilters => ({
  modulo: '',
  prioridade: '',
  status: '',
  obra_id: '',
  responsavel_id: '',
  perfil_id: '',
  usuario_id: '',
  prazo_de: '',
  prazo_ate: '',
  texto: ''
});

const emptyForm = (): CentralTarefaManualPayload => ({
  titulo: '',
  descricao: '',
  modulo: 'central-tarefas',
  prioridade: 'MEDIA',
  responsavel_id: '',
  perfil_id: '',
  prazo: '',
  obra_id: '',
  cliente_id: '',
  usuario_id: '',
  comentario: ''
});

const emptyCentralState = (): CentralState => ({
  resumo: null,
  minhas: [],
  aprovacoes: [],
  atrasadas: [],
  criticas: [],
  modulos: []
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const cleanFilters = (filters: CentralTarefasFilters): CentralTarefasFilters =>
  Object.entries(filters).reduce<CentralTarefasFilters>((acc, [key, value]) => {
    if (value && value.trim()) {
      acc[key] = value.trim();
    }
    return acc;
  }, {});

const formatDate = (value: unknown): string => {
  if (!value) {
    return '-';
  }
  return String(value).slice(0, 10);
};

const labelize = (value: string | null | undefined): string => value ? value.replace(/[-_]/g, ' ') : '-';

const taskCount = (items: CentralTarefaApi[]): string => `${items.length.toLocaleString('pt-BR')} registro(s)`;

export function CentralTarefasPage({ onNavigate }: CentralTarefasPageProps): JSX.Element {
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [perfis, setPerfis] = React.useState<PerfilApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [filters, setFilters] = React.useState<CentralTarefasFilters>(emptyFilters());
  const [form, setForm] = React.useState<CentralTarefaManualPayload>(emptyForm());
  const [state, setState] = React.useState<CentralState>(emptyCentralState());
  const [activeTab, setActiveTab] = React.useState<CentralTab>('minhas');
  const [selected, setSelected] = React.useState<CentralTarefaApi | null>(null);
  const [actionNote, setActionNote] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const loadCatalogs = React.useCallback(async (): Promise<CentralTarefasFilters> => {
    const [usuariosData, perfisData, obrasData] = await Promise.all([
      erpApi.usuarios.list(),
      erpApi.perfis.list({ status: 'ativo' }),
      erpApi.obras.list()
    ]);
    const activeUsers = usuariosData.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo);
    const activePerfis = perfisData.filter((perfil) => perfil.status !== 'inativo');
    const activeObras = obrasData.filter((obra) => obra.status !== 'inativo');
    const defaultUserId = activeUsers[0]?.id || '';
    const defaultPerfilId = activePerfis[0]?.id || '';
    setUsuarios(activeUsers);
    setPerfis(activePerfis);
    setObras(activeObras);
    const nextFilters = { ...emptyFilters(), usuario_id: defaultUserId };
    setFilters(nextFilters);
    setForm((current) => ({
      ...current,
      usuario_id: current.usuario_id || defaultUserId,
      responsavel_id: current.responsavel_id || defaultUserId,
      perfil_id: current.perfil_id || defaultPerfilId
    }));
    return nextFilters;
  }, []);

  const loadCentral = React.useCallback(async (nextFilters: CentralTarefasFilters): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = cleanFilters(nextFilters);
      const [resumo, minhas, aprovacoes, atrasadas, criticas, modulos] = await Promise.all([
        erpApi.centralTarefas.resumo(activeFilters),
        erpApi.centralTarefas.minhas(activeFilters),
        erpApi.centralTarefas.aprovacoes(activeFilters),
        erpApi.centralTarefas.atrasadas(activeFilters),
        erpApi.centralTarefas.criticas(activeFilters),
        erpApi.centralTarefas.porModulo(activeFilters)
      ]);
      setState({ resumo, minhas, aprovacoes, atrasadas, criticas, modulos });
      setSelected((current) => {
        if (!current) {
          return minhas[0] || aprovacoes[0] || atrasadas[0] || criticas[0] || null;
        }
        const exists = [...minhas, ...aprovacoes, ...atrasadas, ...criticas].find((item) => item.id === current.id);
        return exists || current;
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCatalogs().then((initialFilters) => loadCentral(initialFilters)).catch((loadError) => {
      setError(getErrorMessage(loadError));
      setLoading(false);
    });
  }, [loadCatalogs, loadCentral]);

  const refresh = async (): Promise<void> => {
    await loadCentral(filters);
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    await loadCentral(nextFilters);
  };

  const createManual = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      const selectedObra = obras.find((obra) => obra.id === form.obra_id);
      const created = await erpApi.centralTarefas.criarManual({
        ...form,
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        modulo: form.modulo || 'central-tarefas',
        origem: 'MANUAL',
        prioridade: form.prioridade || 'MEDIA',
        responsavel_id: form.responsavel_id || undefined,
        perfil_id: form.perfil_id || undefined,
        prazo: form.prazo || undefined,
        obra_id: form.obra_id || undefined,
        cliente_id: form.cliente_id || selectedObra?.cliente_id || undefined,
        usuario_id: form.usuario_id || undefined,
        comentario: form.comentario || undefined
      });
      setSelected(created);
      setActionNote('');
      setForm((current) => ({
        ...emptyForm(),
        usuario_id: current.usuario_id,
        responsavel_id: current.responsavel_id,
        perfil_id: current.perfil_id
      }));
      await loadCentral(filters);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const selectTask = async (task: CentralTarefaApi): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      if (task.manual_id) {
        setSelected(await erpApi.centralTarefas.get(task.manual_id));
      } else {
        setSelected(task);
      }
      setActionNote('');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const runManualAction = async (action: 'marcarVista' | 'iniciar' | 'concluir' | 'cancelar'): Promise<void> => {
    if (!selected?.manual_id) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        usuario_id: form.usuario_id || undefined,
        observacoes: actionNote || undefined,
        motivo: action === 'cancelar' ? actionNote || undefined : undefined
      };
      const updated = await erpApi.centralTarefas[action](selected.manual_id, payload);
      setSelected(updated);
      setActionNote('');
      await loadCentral(filters);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const navigateToTask = (task: CentralTarefaApi): void => {
    const target = String(task.navigation_section || task.modulo || '');
    if (onNavigate && navigableSections.has(target)) {
      onNavigate(target);
    }
  };

  const visibleTasks = activeTab === 'aprovacoes'
    ? state.aprovacoes
    : activeTab === 'atrasadas'
      ? state.atrasadas
      : activeTab === 'criticas'
        ? state.criticas
        : state.minhas;
  const selectedIsManual = Boolean(selected?.manual_id);
  const selectedIsFinal = selected ? finalManualStatuses.has(String(selected.status)) : true;

  return (
    <section className="enac-web-page enac-central-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Central de Tarefas e Aprovações</h1>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters enac-central-filters" aria-label="Filtros da central de tarefas">
        <label>
          <span>Módulo</span>
          <select value={filters.modulo || ''} onChange={(event) => setFilters((current) => ({ ...current, modulo: event.target.value }))} disabled={loading}>
            {moduleOptions.map((modulo) => <option key={modulo || 'todos'} value={modulo}>{modulo ? labelize(modulo) : 'Todos'}</option>)}
          </select>
        </label>
        <label>
          <span>Prioridade</span>
          <select value={filters.prioridade || ''} onChange={(event) => setFilters((current) => ({ ...current, prioridade: event.target.value as CentralTarefaPrioridade | '' }))} disabled={loading}>
            {prioridadeOptions.map((prioridade) => <option key={prioridade || 'todas'} value={prioridade}>{prioridade || 'Todas'}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={filters.status || ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} disabled={loading}>
            {statusOptions.map((status) => <option key={status || 'todos'} value={status}>{status ? labelize(status) : 'Todos'}</option>)}
          </select>
        </label>
        <label>
          <span>Usuário</span>
          <select value={filters.usuario_id || ''} onChange={(event) => setFilters((current) => ({ ...current, usuario_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Responsável</span>
          <select value={filters.responsavel_id || ''} onChange={(event) => setFilters((current) => ({ ...current, responsavel_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Perfil</span>
          <select value={filters.perfil_id || ''} onChange={(event) => setFilters((current) => ({ ...current, perfil_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => setFilters((current) => ({ ...current, obra_id: event.target.value }))} disabled={loading}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Prazo até</span>
          <input type="date" value={filters.prazo_ate || ''} onChange={(event) => setFilters((current) => ({ ...current, prazo_ate: event.target.value }))} disabled={loading} />
        </label>
        <label>
          <span>Busca</span>
          <input value={filters.texto || ''} onChange={(event) => setFilters((current) => ({ ...current, texto: event.target.value }))} disabled={loading} />
        </label>
        <div className="enac-central-filter-actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>Pesquisar</button>
          <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>Limpar filtros</button>
        </div>
      </section>

      <div className="enac-report-cards enac-central-cards">
        <CentralCard label="Minhas tarefas" value={state.minhas.length} />
        <CentralCard label="Aprovações pendentes" value={state.resumo?.aprovacoes_pendentes || 0} />
        <CentralCard label="Atrasadas" value={state.resumo?.atrasadas || 0} />
        <CentralCard label="Críticas" value={state.resumo?.criticas || 0} />
        <CentralCard label="Por módulo" value={state.resumo?.modulos_com_tarefas || 0} />
      </div>

      <div className="enac-central-tabs" role="tablist" aria-label="Visões da central">
        {(Object.keys(tabLabels) as CentralTab[]).map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'nova' && (
      <section className="enac-report-section enac-central-manual">
        <div className="enac-cadastro-toolbar">
          <div>
            <h2>Tarefa manual auxiliar</h2>
            <p>Responsável, perfil, prazo e prioridade</p>
          </div>
        </div>
        <div className="enac-central-form-grid">
          <label>
            <span>Título</span>
            <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} disabled={saving} />
          </label>
          <label>
            <span>Prioridade</span>
            <select value={form.prioridade || 'MEDIA'} onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value as CentralTarefaPrioridade }))} disabled={saving}>
              {prioridadeOptions.filter(Boolean).map((prioridade) => <option key={prioridade} value={prioridade}>{prioridade}</option>)}
            </select>
          </label>
          <label>
            <span>Responsável</span>
            <select value={form.responsavel_id || ''} onChange={(event) => setForm((current) => ({ ...current, responsavel_id: event.target.value }))} disabled={saving}>
              <option value="">Sem responsável</option>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Perfil</span>
            <select value={form.perfil_id || ''} onChange={(event) => setForm((current) => ({ ...current, perfil_id: event.target.value }))} disabled={saving}>
              <option value="">Sem perfil</option>
              {perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Prazo</span>
            <input type="date" value={form.prazo || ''} onChange={(event) => setForm((current) => ({ ...current, prazo: event.target.value }))} disabled={saving} />
          </label>
          <label>
            <span>Obra</span>
            <select value={form.obra_id || ''} onChange={(event) => setForm((current) => ({ ...current, obra_id: event.target.value }))} disabled={saving}>
              <option value="">Sem obra</option>
              {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Usuário da ação</span>
            <select value={form.usuario_id || ''} onChange={(event) => setForm((current) => ({ ...current, usuario_id: event.target.value }))} disabled={saving}>
              <option value="">Não informado</option>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
            </select>
          </label>
          <label className="enac-central-span-2">
            <span>Descrição</span>
            <textarea value={form.descricao || ''} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} disabled={saving} />
          </label>
          <label className="enac-central-span-2">
            <span>Comentário inicial</span>
            <input value={form.comentario || ''} onChange={(event) => setForm((current) => ({ ...current, comentario: event.target.value }))} disabled={saving} />
          </label>
        </div>
        <button type="button" onClick={() => void createManual()} disabled={saving || !form.titulo.trim()}>
          Criar tarefa
        </button>
      </section>
      )}

      {activeTab !== 'nova' && (
      <div className="enac-central-layout">
        {activeTab === 'modulos' ? (
          <ModuleTable modulos={state.modulos} loading={loading} />
        ) : (
          <TaskTable
            tasks={visibleTasks}
            loading={loading}
            selectedId={selected?.id}
            onSelect={(task) => void selectTask(task)}
            onNavigate={navigateToTask}
          />
        )}

        <TaskDetail
          selected={selected}
          saving={saving}
          actionNote={actionNote}
          selectedIsManual={selectedIsManual}
          selectedIsFinal={selectedIsFinal}
          canNavigate={Boolean(selected && onNavigate && navigableSections.has(String(selected.navigation_section || selected.modulo || '')))}
          onActionNote={setActionNote}
          onNavigate={() => selected && navigateToTask(selected)}
          onMarcarVista={() => void runManualAction('marcarVista')}
          onIniciar={() => void runManualAction('iniciar')}
          onConcluir={() => void runManualAction('concluir')}
          onCancelar={() => void runManualAction('cancelar')}
        />
      </div>
      )}
    </section>
  );
}

function CentralCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <article className="enac-report-card enac-dashboard-card enac-central-card">
      <span>{label}</span>
      <strong>{value.toLocaleString('pt-BR')}</strong>
    </article>
  );
}

function TaskTable({
  tasks,
  loading,
  selectedId,
  onSelect,
  onNavigate
}: {
  tasks: CentralTarefaApi[];
  loading: boolean;
  selectedId?: string;
  onSelect: (task: CentralTarefaApi) => void;
  onNavigate: (task: CentralTarefaApi) => void;
}): JSX.Element {
  return (
    <section className="enac-report-section enac-central-table-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Tarefas</h2>
          <p>{loading ? 'Atualizando...' : taskCount(tasks)}</p>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="enac-cadastro-empty">Sem tarefas para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-central-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Módulo</th>
                <th>Origem</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Idade</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className={selectedId === task.id ? 'is-selected' : ''} onClick={() => onSelect(task)}>
                  <td>
                    <strong>{task.titulo}</strong>
                    <small>{task.obra_codigo || task.cliente_nome || '-'}</small>
                  </td>
                  <td>{labelize(task.modulo)}</td>
                  <td>{labelize(task.origem)}</td>
                  <td><span className={`enac-central-chip enac-central-chip--${String(task.status).toLowerCase()}`}>{labelize(task.status)}</span></td>
                  <td><span className={`enac-central-priority enac-central-priority--${String(task.prioridade).toLowerCase()}`}>{task.prioridade}</span></td>
                  <td>{task.responsavel_nome || task.perfil_nome || '-'}</td>
                  <td>{formatDate(task.prazo)}{task.atrasada ? ' · atrasada' : ''}</td>
                  <td>{Number(task.idade_dias || 0).toLocaleString('pt-BR')} dia(s)</td>
                  <td>
                    <button
                      type="button"
                      className="enac-dashboard-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        onNavigate(task);
                      }}
                    >
                      Abrir módulo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ModuleTable({ modulos, loading }: { modulos: CentralTarefasModuloApi[]; loading: boolean }): JSX.Element {
  return (
    <section className="enac-report-section enac-central-table-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Módulos com tarefas</h2>
          <p>{loading ? 'Atualizando...' : `${modulos.length.toLocaleString('pt-BR')} módulo(s)`}</p>
        </div>
      </div>
      {modulos.length === 0 ? (
        <div className="enac-cadastro-empty">Sem módulos para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-central-table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Abertas</th>
                <th>Aprovações</th>
                <th>Atrasadas</th>
                <th>Críticas</th>
                <th>Próximo prazo</th>
                <th>Último evento</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map((modulo) => (
                <tr key={modulo.modulo}>
                  <td><strong>{labelize(modulo.modulo)}</strong></td>
                  <td>{modulo.abertas.toLocaleString('pt-BR')}</td>
                  <td>{modulo.aprovacoes.toLocaleString('pt-BR')}</td>
                  <td>{modulo.atrasadas.toLocaleString('pt-BR')}</td>
                  <td>{modulo.criticas.toLocaleString('pt-BR')}</td>
                  <td>{formatDate(modulo.proximo_prazo)}</td>
                  <td>{formatDate(modulo.ultimo_evento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TaskDetail({
  selected,
  saving,
  actionNote,
  selectedIsManual,
  selectedIsFinal,
  canNavigate,
  onActionNote,
  onNavigate,
  onMarcarVista,
  onIniciar,
  onConcluir,
  onCancelar
}: {
  selected: CentralTarefaApi | null;
  saving: boolean;
  actionNote: string;
  selectedIsManual: boolean;
  selectedIsFinal: boolean;
  canNavigate: boolean;
  onActionNote: (value: string) => void;
  onNavigate: () => void;
  onMarcarVista: () => void;
  onIniciar: () => void;
  onConcluir: () => void;
  onCancelar: () => void;
}): JSX.Element {
  if (!selected) {
    return (
      <section className="enac-report-section enac-central-detail">
        <div className="enac-cadastro-empty">Selecione uma tarefa para ver contexto e ações permitidas.</div>
      </section>
    );
  }

  return (
    <section className="enac-report-section enac-central-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{selected.titulo}</h2>
          <p>{labelize(selected.modulo)} · {labelize(selected.origem)}</p>
        </div>
      </div>

      <div className="enac-central-detail-grid">
        <div><span>Status</span><strong>{labelize(selected.status)}</strong></div>
        <div><span>Prioridade</span><strong>{selected.prioridade}</strong></div>
        <div><span>Tipo</span><strong>{labelize(String(selected.tipo))}</strong></div>
        <div><span>Prazo</span><strong>{formatDate(selected.prazo)}</strong></div>
        <div><span>Responsável</span><strong>{selected.responsavel_nome || '-'}</strong></div>
        <div><span>Perfil</span><strong>{selected.perfil_nome || '-'}</strong></div>
        <div><span>Obra</span><strong>{selected.obra_codigo || '-'}</strong></div>
        <div><span>Idade</span><strong>{Number(selected.idade_dias || 0).toLocaleString('pt-BR')} dia(s)</strong></div>
      </div>

      {selected.descricao && <p className="enac-central-description">{selected.descricao}</p>}

      <label className="enac-central-action-note">
        <span>Observação</span>
        <textarea value={actionNote} onChange={(event) => onActionNote(event.target.value)} disabled={saving} />
      </label>

      <div className="enac-central-actions">
        <button type="button" className="enac-dashboard-secondary" onClick={onNavigate} disabled={!canNavigate || saving}>Abrir módulo</button>
        {selectedIsManual && (
          <>
            <button type="button" onClick={onMarcarVista} disabled={saving}>Marcar vista</button>
            <button type="button" onClick={onIniciar} disabled={saving || selectedIsFinal}>Iniciar</button>
            <button type="button" onClick={onConcluir} disabled={saving || selectedIsFinal}>Concluir</button>
            <button type="button" className="enac-dashboard-secondary" onClick={onCancelar} disabled={saving || selectedIsFinal || !actionNote.trim()}>Cancelar</button>
          </>
        )}
      </div>

      {selectedIsManual && (
        <div className="enac-central-history">
          <h3>Histórico</h3>
          {(selected.historico || []).length === 0 ? (
            <div className="enac-cadastro-empty">Sem histórico.</div>
          ) : (
            (selected.historico || []).slice(0, 10).map((item) => (
              <article key={String(item.id)}>
                <strong>{String(item.acao || '-')}</strong>
                <span>{String(item.status_anterior || '-')} → {String(item.status_novo || '-')}</span>
                <small>{String(item.usuario_nome || item.created_at || '')}</small>
                {item.comentario ? <p>{String(item.comentario)}</p> : null}
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
