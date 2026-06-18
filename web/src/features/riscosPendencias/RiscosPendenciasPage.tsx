import * as React from 'react';
import {
  erpApi,
  type ClienteApi,
  type ContratoObraApi,
  type ObraApi,
  type RiscoPendenciaApi,
  type RiscoPendenciaPayload,
  type RiscoPendenciaPrioridade,
  type RiscoPendenciaStatus,
  type RiscoPendenciaTipo,
  type RiscosPendenciasFilters,
  type UsuarioApi
} from '../../services/erpApi';

const marker = 'DEV_LOCAL_V3_11';

const statusOptions: Array<RiscoPendenciaStatus | ''> = ['', 'ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA', 'RESOLVIDA', 'CANCELADA'];
const editableStatusOptions: Array<Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'> | ''> = ['', 'ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIRO', 'BLOQUEADA'];
const prioridadeOptions: Array<RiscoPendenciaPrioridade | ''> = ['', 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const tipoOptions: Array<RiscoPendenciaTipo | ''> = ['', 'FINANCEIRO', 'COMPRA', 'CONTRATO', 'OBRA', 'MEDICAO', 'FATURAMENTO', 'ORCAMENTO', 'MARGEM', 'DOCUMENTACAO', 'OUTROS'];
const finalStatuses = new Set<RiscoPendenciaStatus>(['RESOLVIDA', 'CANCELADA']);

const emptyFilters = (): RiscosPendenciasFilters => ({
  status: '',
  prioridade: '',
  tipo: '',
  responsavel_id: '',
  obra_id: '',
  cliente_id: '',
  vencida: '',
  texto: ''
});

const emptyForm = (): RiscoPendenciaPayload => ({
  titulo: '',
  descricao: '',
  tipo: 'OUTROS',
  prioridade: 'MEDIA',
  responsavel_id: '',
  prazo: '',
  obra_id: '',
  cliente_id: '',
  contrato_obra_id: '',
  usuario_id: '',
  comentario: ''
});

const emptyAlertForm = () => ({
  tipo: 'MARGEM_NEGATIVA',
  severidade: 'CRITICO',
  mensagem: '',
  obra_id: '',
  cliente_id: '',
  responsavel_id: '',
  prazo: '',
  usuario_id: ''
});

const activeFilters = (filters: RiscosPendenciasFilters): RiscosPendenciasFilters =>
  Object.entries(filters).reduce<RiscosPendenciasFilters>((acc, [key, value]) => {
    if (value && value.trim()) {
      acc[key] = value;
    }
    return acc;
  }, {});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const formatDate = (value: unknown): string => {
  if (!value) {
    return '-';
  }
  return String(value).slice(0, 10);
};

const statusLabel = (status: string): string => status.replace(/_/g, ' ');
type RiscoView = 'lista' | 'manual' | 'alerta' | 'detalhes';

export function RiscosPendenciasPage(): JSX.Element {
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [contratos, setContratos] = React.useState<ContratoObraApi[]>([]);
  const [filters, setFilters] = React.useState<RiscosPendenciasFilters>(emptyFilters());
  const [form, setForm] = React.useState<RiscoPendenciaPayload>(emptyForm());
  const [alertForm, setAlertForm] = React.useState(emptyAlertForm());
  const [pendencias, setPendencias] = React.useState<RiscoPendenciaApi[]>([]);
  const [selected, setSelected] = React.useState<RiscoPendenciaApi | null>(null);
  const [editStatus, setEditStatus] = React.useState<Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'> | ''>('');
  const [editPrioridade, setEditPrioridade] = React.useState<RiscoPendenciaPrioridade | ''>('');
  const [editPrazo, setEditPrazo] = React.useState<string>('');
  const [comment, setComment] = React.useState<string>('');
  const [actionNote, setActionNote] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<RiscoView>('lista');

  const loadCatalogs = React.useCallback(async (): Promise<void> => {
    const [usuariosData, clientesData, obrasData, contratosData] = await Promise.all([
      erpApi.usuarios.list(),
      erpApi.clientes.list(),
      erpApi.obras.list(),
      erpApi.contratosObra.list()
    ]);
    const activeUsers = usuariosData.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo);
    setUsuarios(activeUsers);
    setClientes(clientesData.filter((cliente) => cliente.status !== 'inativo'));
    setObras(obrasData.filter((obra) => obra.status !== 'inativo'));
    setContratos(contratosData);
    const defaultUserId = activeUsers[0]?.id || '';
    setForm((current) => ({ ...current, usuario_id: current.usuario_id || defaultUserId, responsavel_id: current.responsavel_id || defaultUserId }));
    setAlertForm((current) => ({ ...current, usuario_id: current.usuario_id || defaultUserId, responsavel_id: current.responsavel_id || defaultUserId }));
  }, []);

  const loadPendencias = React.useCallback(async (nextFilters: RiscosPendenciasFilters): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await erpApi.riscosPendencias.list(activeFilters(nextFilters));
      setPendencias(data);
      if (selected && data.every((item) => item.id !== selected.id)) {
        setSelected(null);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selected]);

  React.useEffect(() => {
    const initialFilters = emptyFilters();
    setFilters(initialFilters);
    Promise.all([loadCatalogs(), loadPendencias(initialFilters)]).catch((loadError) => {
      setError(getErrorMessage(loadError));
      setLoading(false);
    });
  }, [loadCatalogs, loadPendencias]);

  const refresh = async (): Promise<void> => {
    await loadPendencias(filters);
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    await loadPendencias(nextFilters);
  };

  const selectPendencia = async (id: string): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      const detail = await erpApi.riscosPendencias.get(id);
      setSelected(detail);
      const editableStatus = finalStatuses.has(detail.status)
        ? ''
        : detail.status as Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'>;
      setEditStatus(editableStatus);
      setEditPrioridade(detail.prioridade);
      setEditPrazo(formatDate(detail.prazo) === '-' ? '' : formatDate(detail.prazo));
      setComment('');
      setActionNote('');
      setActiveView('detalhes');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const createPendencia = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      const created = await erpApi.riscosPendencias.create({
        ...form,
        responsavel_id: form.responsavel_id || undefined,
        prazo: form.prazo || undefined,
        obra_id: form.obra_id || undefined,
        cliente_id: form.cliente_id || undefined,
        contrato_obra_id: form.contrato_obra_id || undefined,
        usuario_id: form.usuario_id || undefined,
        comentario: form.comentario || undefined
      });
      setForm((current) => ({ ...emptyForm(), usuario_id: current.usuario_id, responsavel_id: current.responsavel_id }));
      await loadPendencias(filters);
      await selectPendencia(created.id);
      setActiveView('detalhes');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const updateSelected = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await erpApi.riscosPendencias.update(selected.id, {
        prioridade: editPrioridade || undefined,
        status: editStatus || undefined,
        prazo: editPrazo || undefined,
        usuario_id: form.usuario_id || undefined,
        comentario: actionNote || 'Atualizacao operacional'
      });
      setSelected(updated);
      await loadPendencias(filters);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: 'iniciar' | 'bloquear' | 'resolver' | 'cancelar'): Promise<void> => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        usuario_id: form.usuario_id || undefined,
        observacoes: actionNote || undefined,
        motivo: actionNote || undefined,
        resolucao: action === 'resolver' ? actionNote || 'Pendencia resolvida.' : undefined
      };
      const updated = await erpApi.riscosPendencias[action](selected.id, payload);
      setSelected(updated);
      setActionNote('');
      await loadPendencias(filters);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (): Promise<void> => {
    if (!selected || !comment.trim()) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await erpApi.riscosPendencias.comentar(selected.id, {
        usuario_id: form.usuario_id || undefined,
        comentario: comment
      });
      setSelected(updated);
      setComment('');
    } catch (commentError) {
      setError(getErrorMessage(commentError));
    } finally {
      setSaving(false);
    }
  };

  const generateFromAlert = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      const created = await erpApi.riscosPendencias.gerarDeAlerta({
        usuario_id: alertForm.usuario_id || undefined,
        responsavel_id: alertForm.responsavel_id || undefined,
        prazo: alertForm.prazo || undefined,
        alerta: {
          tipo: alertForm.tipo,
          severidade: alertForm.severidade,
          mensagem: alertForm.mensagem,
          obra_id: alertForm.obra_id || undefined,
          cliente_id: alertForm.cliente_id || undefined
        }
      });
      setAlertForm((current) => ({ ...emptyAlertForm(), usuario_id: current.usuario_id, responsavel_id: current.responsavel_id }));
      await loadPendencias(filters);
      await selectPendencia(created.id);
      setActiveView('detalhes');
    } catch (alertError) {
      setError(getErrorMessage(alertError));
    } finally {
      setSaving(false);
    }
  };

  const stats = React.useMemo(() => ({
    abertas: pendencias.filter((item) => item.status === 'ABERTA').length,
    emAndamento: pendencias.filter((item) => item.status === 'EM_ANDAMENTO').length,
    criticas: pendencias.filter((item) => item.prioridade === 'CRITICA').length,
    vencidas: pendencias.filter((item) => item.vencida).length,
    aVencer: pendencias.filter((item) => item.a_vencer).length,
    resolvidas: pendencias.filter((item) => item.status === 'RESOLVIDA').length
  }), [pendencias]);

  const selectedIsFinal = selected ? finalStatuses.has(selected.status) : true;

  return (
    <section className="enac-web-page enac-risk-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Riscos e Pendências</h1>
      <p className="enac-web-lead">
        Pendências operacionais com responsável, prazo, prioridade, vínculo de origem, histórico e resolução auditada.
      </p>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-report-filters enac-risk-filters" aria-label="Filtros de riscos e pendências">
        <label>
          <span>Status</span>
          <select value={filters.status || ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as RiscoPendenciaStatus | '' }))} disabled={loading}>
            {statusOptions.map((status) => <option key={status || 'todos'} value={status}>{status ? statusLabel(status) : 'Todos'}</option>)}
          </select>
        </label>
        <label>
          <span>Prioridade</span>
          <select value={filters.prioridade || ''} onChange={(event) => setFilters((current) => ({ ...current, prioridade: event.target.value as RiscoPendenciaPrioridade | '' }))} disabled={loading}>
            {prioridadeOptions.map((prioridade) => <option key={prioridade || 'todas'} value={prioridade}>{prioridade || 'Todas'}</option>)}
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select value={filters.tipo || ''} onChange={(event) => setFilters((current) => ({ ...current, tipo: event.target.value as RiscoPendenciaTipo | '' }))} disabled={loading}>
            {tipoOptions.map((tipo) => <option key={tipo || 'todos'} value={tipo}>{tipo || 'Todos'}</option>)}
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
          <span>Obra</span>
          <select value={filters.obra_id || ''} onChange={(event) => setFilters((current) => ({ ...current, obra_id: event.target.value }))} disabled={loading}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Cliente</span>
          <select value={filters.cliente_id || ''} onChange={(event) => setFilters((current) => ({ ...current, cliente_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Vencidas</span>
          <select value={filters.vencida || ''} onChange={(event) => setFilters((current) => ({ ...current, vencida: event.target.value }))} disabled={loading}>
            <option value="">Todas</option>
            <option value="true">Somente vencidas</option>
          </select>
        </label>
        <label>
          <span>Busca</span>
          <input value={filters.texto || ''} onChange={(event) => setFilters((current) => ({ ...current, texto: event.target.value }))} disabled={loading} />
        </label>
        <div className="enac-risk-filter-actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>Pesquisar</button>
          <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>Limpar filtros</button>
        </div>
      </section>

      <div className="enac-report-cards enac-risk-cards">
        <RiskCard label="Abertas" value={stats.abertas} />
        <RiskCard label="Em andamento" value={stats.emAndamento} />
        <RiskCard label="Críticas" value={stats.criticas} />
        <RiskCard label="Vencidas" value={stats.vencidas} />
        <RiskCard label="A vencer" value={stats.aVencer} />
        <RiskCard label="Resolvidas" value={stats.resolvidas} />
      </div>

      <div className="enac-ui-tabs" role="tablist" aria-label="Riscos e pendências">
        <button type="button" className={activeView === 'lista' ? 'is-active' : ''} onClick={() => setActiveView('lista')}>
          Consulta
        </button>
        <button type="button" className={activeView === 'manual' ? 'is-active' : ''} onClick={() => setActiveView('manual')}>
          Nova pendência manual
        </button>
        <button type="button" className={activeView === 'alerta' ? 'is-active' : ''} onClick={() => setActiveView('alerta')}>
          Converter alerta
        </button>
        <button type="button" className={activeView === 'detalhes' ? 'is-active' : ''} onClick={() => setActiveView('detalhes')}>
          Detalhes
        </button>
      </div>

      <div className="enac-risk-layout">
        {activeView === 'manual' && (
        <section className="enac-report-section enac-risk-form-panel">
          <div className="enac-cadastro-toolbar">
            <div>
              <h2>Nova pendência</h2>
              <p>Cadastro manual com vínculo operacional</p>
            </div>
          </div>
          <div className="enac-risk-form-grid">
            <label>
              <span>Título</span>
              <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} disabled={saving} />
            </label>
            <label>
              <span>Tipo</span>
              <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as RiscoPendenciaTipo }))} disabled={saving}>
                {tipoOptions.filter(Boolean).map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </label>
            <label>
              <span>Prioridade</span>
              <select value={form.prioridade} onChange={(event) => setForm((current) => ({ ...current, prioridade: event.target.value as RiscoPendenciaPrioridade }))} disabled={saving}>
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
              <span>Cliente</span>
              <select value={form.cliente_id || ''} onChange={(event) => setForm((current) => ({ ...current, cliente_id: event.target.value }))} disabled={saving}>
                <option value="">Sem cliente</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
              </select>
            </label>
            <label>
              <span>Contrato</span>
              <select value={form.contrato_obra_id || ''} onChange={(event) => setForm((current) => ({ ...current, contrato_obra_id: event.target.value }))} disabled={saving}>
                <option value="">Sem contrato</option>
                {contratos.map((contrato) => <option key={contrato.id} value={contrato.id}>{contrato.numero} - {contrato.status}</option>)}
              </select>
            </label>
            <label>
              <span>Usuário da ação</span>
              <select value={form.usuario_id || ''} onChange={(event) => setForm((current) => ({ ...current, usuario_id: event.target.value }))} disabled={saving}>
                <option value="">Não informado</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
              </select>
            </label>
            <label className="enac-risk-span-2">
              <span>Descrição</span>
              <textarea value={form.descricao || ''} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} disabled={saving} />
            </label>
            <label className="enac-risk-span-2">
              <span>Comentário inicial</span>
              <input value={form.comentario || ''} onChange={(event) => setForm((current) => ({ ...current, comentario: event.target.value }))} disabled={saving} />
            </label>
          </div>
          <button type="button" onClick={() => void createPendencia()} disabled={saving || !form.titulo.trim()}>
            Criar pendência
          </button>
        </section>
        )}

        {activeView === 'alerta' && (
        <section className="enac-report-section enac-risk-form-panel">
          <div className="enac-cadastro-toolbar">
            <div>
              <h2>Alerta do dashboard</h2>
              <p>Conversão sugerida para acompanhamento</p>
            </div>
          </div>
          <div className="enac-risk-form-grid">
            <label>
              <span>Tipo do alerta</span>
              <input value={alertForm.tipo} onChange={(event) => setAlertForm((current) => ({ ...current, tipo: event.target.value }))} disabled={saving} />
            </label>
            <label>
              <span>Severidade</span>
              <select value={alertForm.severidade} onChange={(event) => setAlertForm((current) => ({ ...current, severidade: event.target.value }))} disabled={saving}>
                <option value="CRITICO">CRITICO</option>
                <option value="ALTO">ALTO</option>
                <option value="MEDIO">MEDIO</option>
                <option value="BAIXO">BAIXO</option>
              </select>
            </label>
            <label>
              <span>Responsável</span>
              <select value={alertForm.responsavel_id} onChange={(event) => setAlertForm((current) => ({ ...current, responsavel_id: event.target.value }))} disabled={saving}>
                <option value="">Sem responsável</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
              </select>
            </label>
            <label>
              <span>Prazo</span>
              <input type="date" value={alertForm.prazo} onChange={(event) => setAlertForm((current) => ({ ...current, prazo: event.target.value }))} disabled={saving} />
            </label>
            <label>
              <span>Obra</span>
              <select value={alertForm.obra_id} onChange={(event) => setAlertForm((current) => ({ ...current, obra_id: event.target.value }))} disabled={saving}>
                <option value="">Sem obra</option>
                {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
              </select>
            </label>
            <label>
              <span>Cliente</span>
              <select value={alertForm.cliente_id} onChange={(event) => setAlertForm((current) => ({ ...current, cliente_id: event.target.value }))} disabled={saving}>
                <option value="">Sem cliente</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
              </select>
            </label>
            <label className="enac-risk-span-2">
              <span>Mensagem</span>
              <textarea value={alertForm.mensagem} onChange={(event) => setAlertForm((current) => ({ ...current, mensagem: event.target.value }))} disabled={saving} />
            </label>
          </div>
          <button type="button" onClick={() => void generateFromAlert()} disabled={saving || !alertForm.mensagem.trim()}>
            Gerar pendência
          </button>
        </section>
        )}
      </div>

      {activeView === 'lista' && (
      <div className="enac-risk-layout enac-risk-layout--single">
        <RiskTable pendencias={pendencias} loading={loading} selectedId={selected?.id} onSelect={(id) => void selectPendencia(id)} />
      </div>
      )}

      {activeView === 'detalhes' && (
      <div className="enac-risk-layout enac-risk-layout--single">
        <RiskDetail
          selected={selected}
          saving={saving}
          selectedIsFinal={selectedIsFinal}
          editStatus={editStatus}
          editPrioridade={editPrioridade}
          editPrazo={editPrazo}
          actionNote={actionNote}
          comment={comment}
          onEditStatus={setEditStatus}
          onEditPrioridade={setEditPrioridade}
          onEditPrazo={setEditPrazo}
          onActionNote={setActionNote}
          onComment={setComment}
          onUpdate={() => void updateSelected()}
          onAction={(action) => void runAction(action)}
          onAddComment={() => void addComment()}
        />
      </div>
      )}
    </section>
  );
}

function RiskCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <article className="enac-report-card enac-dashboard-card">
      <span>{label}</span>
      <strong>{value.toLocaleString('pt-BR')}</strong>
    </article>
  );
}

function RiskTable({
  pendencias,
  loading,
  selectedId,
  onSelect
}: {
  pendencias: RiscoPendenciaApi[];
  loading: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <section className="enac-report-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Lista de pendências</h2>
          <p>{loading ? 'Atualizando...' : `${pendencias.length} registro(s)`}</p>
        </div>
      </div>
      {pendencias.length === 0 ? (
        <div className="enac-cadastro-empty">Sem pendências para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-risk-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Tipo</th>
                <th>Prazo</th>
                <th>Responsável</th>
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {pendencias.map((pendencia) => (
                <tr
                  key={pendencia.id}
                  className={selectedId === pendencia.id ? 'is-selected' : ''}
                  onClick={() => onSelect(pendencia.id)}
                >
                  <td>{pendencia.codigo}</td>
                  <td>
                    <strong>{pendencia.titulo}</strong>
                    <small>{pendencia.obra_codigo || pendencia.cliente_nome || '-'}</small>
                  </td>
                  <td><span className={`enac-risk-chip enac-risk-chip--${pendencia.status.toLowerCase()}`}>{statusLabel(pendencia.status)}</span></td>
                  <td><span className={`enac-risk-priority enac-risk-priority--${pendencia.prioridade.toLowerCase()}`}>{pendencia.prioridade}</span></td>
                  <td>{pendencia.tipo}</td>
                  <td>{formatDate(pendencia.prazo)}{pendencia.vencida ? ' · vencida' : ''}</td>
                  <td>{pendencia.responsavel_nome || '-'}</td>
                  <td>{pendencia.origem || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RiskDetail({
  selected,
  saving,
  selectedIsFinal,
  editStatus,
  editPrioridade,
  editPrazo,
  actionNote,
  comment,
  onEditStatus,
  onEditPrioridade,
  onEditPrazo,
  onActionNote,
  onComment,
  onUpdate,
  onAction,
  onAddComment
}: {
  selected: RiscoPendenciaApi | null;
  saving: boolean;
  selectedIsFinal: boolean;
  editStatus: Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'> | '';
  editPrioridade: RiscoPendenciaPrioridade | '';
  editPrazo: string;
  actionNote: string;
  comment: string;
  onEditStatus: (value: Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'> | '') => void;
  onEditPrioridade: (value: RiscoPendenciaPrioridade | '') => void;
  onEditPrazo: (value: string) => void;
  onActionNote: (value: string) => void;
  onComment: (value: string) => void;
  onUpdate: () => void;
  onAction: (action: 'iniciar' | 'bloquear' | 'resolver' | 'cancelar') => void;
  onAddComment: () => void;
}): JSX.Element {
  if (!selected) {
    return (
      <section className="enac-report-section enac-risk-detail">
        <div className="enac-cadastro-empty">Selecione uma pendência para ver histórico, comentários e ações.</div>
      </section>
    );
  }

  return (
    <section className="enac-report-section enac-risk-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>{selected.codigo}</h2>
          <p>{selected.titulo}</p>
        </div>
      </div>

      <div className="enac-risk-detail-grid">
        <div><span>Status</span><strong>{statusLabel(selected.status)}</strong></div>
        <div><span>Prioridade</span><strong>{selected.prioridade}</strong></div>
        <div><span>Tipo</span><strong>{selected.tipo}</strong></div>
        <div><span>Prazo</span><strong>{formatDate(selected.prazo)}</strong></div>
        <div><span>Responsável</span><strong>{selected.responsavel_nome || '-'}</strong></div>
        <div><span>Obra</span><strong>{selected.obra_codigo || '-'}</strong></div>
      </div>

      {selected.descricao && <p className="enac-risk-description">{selected.descricao}</p>}
      {selected.dashboard_alerta_tipo && <p className="enac-risk-description">Alerta vinculado: {selected.dashboard_alerta_tipo}</p>}
      {selected.resolucao && <p className="enac-risk-description">Resolução: {selected.resolucao}</p>}

      <div className="enac-risk-edit">
        <label>
          <span>Status</span>
          <select value={editStatus} onChange={(event) => onEditStatus(event.target.value as Exclude<RiscoPendenciaStatus, 'RESOLVIDA' | 'CANCELADA'> | '')} disabled={saving || selectedIsFinal}>
            {editableStatusOptions.map((status) => <option key={status || 'sem-status'} value={status}>{status ? statusLabel(status) : 'Manter'}</option>)}
          </select>
        </label>
        <label>
          <span>Prioridade</span>
          <select value={editPrioridade} onChange={(event) => onEditPrioridade(event.target.value as RiscoPendenciaPrioridade | '')} disabled={saving || selectedIsFinal}>
            {prioridadeOptions.map((prioridade) => <option key={prioridade || 'sem-prioridade'} value={prioridade}>{prioridade || 'Manter'}</option>)}
          </select>
        </label>
        <label>
          <span>Prazo</span>
          <input type="date" value={editPrazo} onChange={(event) => onEditPrazo(event.target.value)} disabled={saving || selectedIsFinal} />
        </label>
        <label>
          <span>Observação da ação</span>
          <input value={actionNote} onChange={(event) => onActionNote(event.target.value)} disabled={saving} />
        </label>
      </div>

      <div className="enac-risk-actions">
        <button type="button" onClick={onUpdate} disabled={saving || selectedIsFinal}>Salvar edição</button>
        <button type="button" onClick={() => onAction('iniciar')} disabled={saving || selectedIsFinal}>Iniciar</button>
        <button type="button" onClick={() => onAction('bloquear')} disabled={saving || selectedIsFinal || !actionNote.trim()}>Bloquear</button>
        <button type="button" onClick={() => onAction('resolver')} disabled={saving || selectedIsFinal || !actionNote.trim()}>Resolver</button>
        <button type="button" onClick={() => onAction('cancelar')} disabled={saving || selectedIsFinal || !actionNote.trim()}>Cancelar</button>
      </div>

      <div className="enac-risk-comment">
        <label>
          <span>Novo comentário</span>
          <textarea value={comment} onChange={(event) => onComment(event.target.value)} disabled={saving} />
        </label>
        <button type="button" onClick={onAddComment} disabled={saving || !comment.trim()}>Comentar</button>
      </div>

      <div className="enac-risk-history">
        <h3>Histórico</h3>
        {(selected.historico || []).length === 0 ? (
          <div className="enac-cadastro-empty">Sem histórico.</div>
        ) : (
          (selected.historico || []).slice(0, 12).map((item) => (
            <article key={String(item.id)}>
              <strong>{String(item.acao || '-')}</strong>
              <span>{String(item.status_anterior || '-')} → {String(item.status_novo || '-')}</span>
              <small>{String(item.usuario_nome || item.created_at || '')}</small>
              {item.comentario ? <p>{String(item.comentario)}</p> : null}
            </article>
          ))
        )}
      </div>

      <div className="enac-risk-history">
        <h3>Comentários</h3>
        {(selected.comentarios || []).length === 0 ? (
          <div className="enac-cadastro-empty">Sem comentários.</div>
        ) : (
          (selected.comentarios || []).slice(0, 8).map((item) => (
            <article key={String(item.id)}>
              <strong>{String(item.created_by_nome || 'Usuário')}</strong>
              <small>{String(item.created_at || '')}</small>
              <p>{String(item.comentario || '')}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
