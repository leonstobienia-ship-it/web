import * as React from 'react';
import {
  erpApi,
  type ContratoObraApi,
  type DocumentoApi,
  type DocumentoFilters,
  type DocumentoPayload,
  type ObraApi,
  type UsuarioApi
} from '../../services/erpApi';

type DocumentoAction = 'create' | 'update' | 'replace';

interface DocumentosState {
  documentos: DocumentoApi[];
  tipos: string[];
  status: string[];
}

interface DocumentoFormState {
  company_id: string;
  entidade_tipo: string;
  entidade_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  extensao: string;
  mime_type: string;
  tamanho_bytes: string;
  descricao: string;
  observacao: string;
  origem: string;
  status: string;
  referencia_local_mock: string;
  sharepoint_site_id_mock: string;
  sharepoint_drive_id_mock: string;
  sharepoint_item_id_mock: string;
  url_mock: string;
  usuario_id: string;
  motivo: string;
}

const marker = 'DEV_LOCAL_V3_14';
const entidadeOptions = [
  ['cliente', 'Cliente'],
  ['fornecedor', 'Fornecedor'],
  ['obra', 'Obra'],
  ['contrato_obra', 'Contrato de obra'],
  ['aditivo', 'Aditivo'],
  ['orcamento', 'Orçamento'],
  ['solicitacao_compra', 'Solicitação de compra'],
  ['cotacao', 'Cotação'],
  ['pedido_compra', 'Pedido de compra'],
  ['nota_fiscal_entrada', 'Nota fiscal de entrada'],
  ['conta_pagar', 'Conta a pagar'],
  ['programacao_pagamento', 'Programação de pagamento'],
  ['baixa_manual', 'Baixa manual'],
  ['medicao', 'Medição'],
  ['pedido_faturamento', 'Pedido de faturamento'],
  ['risco_pendencia', 'Risco ou pendência'],
  ['tarefa', 'Tarefa'],
  ['auditoria', 'Auditoria']
];

const emptyFilters = (): DocumentoFilters => ({
  entidade_tipo: '',
  tipo_documento: '',
  status: '',
  obra_id: '',
  contrato_id: '',
  texto: '',
  limit: '300'
});

const emptyForm = (): DocumentoFormState => ({
  company_id: '',
  entidade_tipo: 'contrato_obra',
  entidade_id: '',
  tipo_documento: 'CONTRATO',
  nome_arquivo: '',
  extensao: '',
  mime_type: 'application/pdf',
  tamanho_bytes: '0',
  descricao: '',
  observacao: '',
  origem: 'ERP_LOCAL',
  status: 'ATIVO',
  referencia_local_mock: '',
  sharepoint_site_id_mock: '',
  sharepoint_drive_id_mock: '',
  sharepoint_item_id_mock: '',
  url_mock: '',
  usuario_id: '',
  motivo: ''
});

const emptyState = (): DocumentosState => ({
  documentos: [],
  tipos: [],
  status: []
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

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

const formatBytes = (value: string | number | null | undefined): string => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const cleanFilters = (filters: DocumentoFilters): DocumentoFilters =>
  Object.entries(filters).reduce<DocumentoFilters>((acc, [key, value]) => {
    if (value && value.trim()) {
      acc[key] = value.trim();
    }
    return acc;
  }, {});

const documentToForm = (documento: DocumentoApi, usuarioId = ''): DocumentoFormState => ({
  company_id: documento.company_id || '',
  entidade_tipo: documento.entidade_tipo || 'contrato_obra',
  entidade_id: documento.entidade_id || '',
  tipo_documento: String(documento.tipo_documento || 'OUTROS'),
  nome_arquivo: documento.nome_arquivo || '',
  extensao: documento.extensao || '',
  mime_type: documento.mime_type || '',
  tamanho_bytes: String(documento.tamanho_bytes || '0'),
  descricao: documento.descricao || '',
  observacao: documento.observacao || '',
  origem: documento.origem || 'ERP_LOCAL',
  status: String(documento.status || 'ATIVO'),
  referencia_local_mock: documento.referencia_local_mock || '',
  sharepoint_site_id_mock: documento.sharepoint_site_id_mock || '',
  sharepoint_drive_id_mock: documento.sharepoint_drive_id_mock || '',
  sharepoint_item_id_mock: documento.sharepoint_item_id_mock || '',
  url_mock: documento.url_mock || '',
  usuario_id: usuarioId,
  motivo: ''
});

const toPayload = (form: DocumentoFormState, action: DocumentoAction): DocumentoPayload => {
  const payload: DocumentoPayload = {
    tipo_documento: form.tipo_documento,
    nome_arquivo: form.nome_arquivo.trim(),
    extensao: form.extensao.trim() || undefined,
    mime_type: form.mime_type.trim() || undefined,
    tamanho_bytes: Number(form.tamanho_bytes || 0),
    descricao: form.descricao.trim() || undefined,
    observacao: form.observacao.trim() || undefined,
    origem: form.origem.trim() || 'ERP_LOCAL',
    status: form.status || 'ATIVO',
    referencia_local_mock: form.referencia_local_mock.trim() || undefined,
    sharepoint_site_id_mock: form.sharepoint_site_id_mock.trim() || undefined,
    sharepoint_drive_id_mock: form.sharepoint_drive_id_mock.trim() || undefined,
    sharepoint_item_id_mock: form.sharepoint_item_id_mock.trim() || undefined,
    url_mock: form.url_mock.trim() || undefined,
    usuario_id: form.usuario_id || undefined
  };

  if (action === 'create') {
    payload.company_id = form.company_id || undefined;
    payload.entidade_tipo = form.entidade_tipo;
    payload.entidade_id = form.entidade_id.trim();
  }
  if (action === 'replace') {
    payload.motivo = form.motivo.trim() || 'Substituição documental local.';
  }
  return payload;
};

export function DocumentosAnexosPage(): JSX.Element {
  const [filters, setFilters] = React.useState<DocumentoFilters>(emptyFilters());
  const [state, setState] = React.useState<DocumentosState>(emptyState());
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [contratos, setContratos] = React.useState<ContratoObraApi[]>([]);
  const [selected, setSelected] = React.useState<DocumentoApi | null>(null);
  const [form, setForm] = React.useState<DocumentoFormState>(emptyForm());
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  const defaultUsuarioId = React.useMemo(() => usuarios[0]?.id || '', [usuarios]);

  const loadCatalogs = React.useCallback(async (): Promise<void> => {
    const [tipos, statusValues, usuariosData, obrasData, contratosData] = await Promise.all([
      erpApi.documentos.tipos(),
      erpApi.documentos.status(),
      erpApi.usuarios.list(),
      erpApi.obras.list(),
      erpApi.contratosObra.list()
    ]);
    setState((current) => ({ ...current, tipos, status: statusValues }));
    setUsuarios(usuariosData.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo));
    setObras(obrasData.filter((obra) => obra.status !== 'inativo'));
    setContratos(contratosData);
    setForm((current) => current.usuario_id ? current : { ...current, usuario_id: usuariosData[0]?.id || '' });
  }, []);

  const loadDocumentos = React.useCallback(async (nextFilters: DocumentoFilters): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const documentos = await erpApi.documentos.list(cleanFilters(nextFilters));
      setState((current) => ({ ...current, documentos }));
      setSelected((current) => {
        if (current && documentos.some((documento) => documento.id === current.id)) {
          return current;
        }
        return documentos[0] || null;
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCatalogs()
      .then(() => loadDocumentos(filters))
      .catch((loadError) => {
        setError(getErrorMessage(loadError));
        setLoading(false);
      });
  }, [filters, loadCatalogs, loadDocumentos]);

  React.useEffect(() => {
    if (selected) {
      setForm(documentToForm(selected, form.usuario_id || defaultUsuarioId));
    }
  }, [defaultUsuarioId, selected]);

  const refresh = async (): Promise<void> => {
    await loadDocumentos(filters);
  };

  const clearFilters = async (): Promise<void> => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    await loadDocumentos(nextFilters);
  };

  const updateForm = (field: keyof DocumentoFormState, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = (): void => {
    setSelected(null);
    setForm({ ...emptyForm(), usuario_id: defaultUsuarioId });
    setSuccess('');
    setError('');
  };

  const saveCreate = async (): Promise<void> => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const created = await erpApi.documentos.create(toPayload(form, 'create'));
      setSelected(created);
      setSuccess('Referência documental criada.');
      await loadDocumentos(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const saveUpdate = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await erpApi.documentos.update(selected.id, toPayload(form, 'update'));
      setSelected(updated);
      setSuccess('Metadados atualizados.');
      await loadDocumentos(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const saveReplace = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await erpApi.documentos.substituir(selected.id, toPayload(form, 'replace'));
      setSelected(result.substituto);
      setSuccess('Referência substituída logicamente.');
      await loadDocumentos(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const saveInactivate = async (): Promise<void> => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await erpApi.documentos.inativar(selected.id, {
        usuario_id: form.usuario_id || undefined,
        motivo: form.motivo.trim() || 'Inativação lógica local.'
      });
      setSelected(updated);
      setSuccess('Referência inativada logicamente.');
      await loadDocumentos(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const filteredCount = state.documentos.length.toLocaleString('pt-BR');
  const ativos = state.documentos.filter((documento) => documento.status === 'ATIVO').length;
  const pendentes = state.documentos.filter((documento) => documento.status === 'PENDENTE_ENVIO_FUTURO').length;
  const substituidos = state.documentos.filter((documento) => documento.status === 'SUBSTITUIDO').length;
  const inativos = state.documentos.filter((documento) => documento.status === 'INATIVO').length;

  return (
    <section className="enac-web-page enac-doc-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Documentos e Anexos</h1>

      <div className="enac-web-alert enac-web-alert--compact enac-doc-warning">
        Esta versão não faz upload real para SharePoint. Apenas registra metadados e referência para integração futura.
      </div>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}
      {success && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{success}</div>}

      <section className="enac-report-filters enac-doc-filters" aria-label="Filtros de documentos">
        <label>
          <span>Entidade</span>
          <select value={filters.entidade_tipo || ''} onChange={(event) => setFilters((current) => ({ ...current, entidade_tipo: event.target.value }))} disabled={loading}>
            <option value="">Todas</option>
            {entidadeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select value={filters.tipo_documento || ''} onChange={(event) => setFilters((current) => ({ ...current, tipo_documento: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {state.tipos.map((tipo) => <option key={tipo} value={tipo}>{labelize(tipo)}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={filters.status || ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {state.status.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
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
          <span>Contrato</span>
          <select value={filters.contrato_id || ''} onChange={(event) => setFilters((current) => ({ ...current, contrato_id: event.target.value }))} disabled={loading}>
            <option value="">Todos</option>
            {contratos.map((contrato) => <option key={contrato.id} value={contrato.id}>{contrato.numero} - {contrato.objeto}</option>)}
          </select>
        </label>
        <label>
          <span>Busca</span>
          <input value={filters.texto || ''} onChange={(event) => setFilters((current) => ({ ...current, texto: event.target.value }))} disabled={loading} />
        </label>
        <div className="enac-doc-filter-actions">
          <button type="button" onClick={() => void refresh()} disabled={loading}>Pesquisar</button>
          <button type="button" className="enac-dashboard-secondary" onClick={() => void clearFilters()} disabled={loading}>Limpar filtros</button>
        </div>
      </section>

      <div className="enac-report-cards enac-doc-cards">
        <DocCard label="Referências" value={filteredCount} />
        <DocCard label="Ativas" value={ativos.toLocaleString('pt-BR')} />
        <DocCard label="Pendentes futuras" value={pendentes.toLocaleString('pt-BR')} />
        <DocCard label="Substituídas" value={substituidos.toLocaleString('pt-BR')} />
        <DocCard label="Inativas" value={inativos.toLocaleString('pt-BR')} />
      </div>

      <div className="enac-doc-layout">
        <DocumentTable documentos={state.documentos} loading={loading} selectedId={selected?.id} onSelect={setSelected} />

        <aside className="enac-report-section enac-doc-detail">
          <div className="enac-cadastro-toolbar">
            <div>
              <h2>{selected ? selected.nome_arquivo : 'Nova referência'}</h2>
              <p>{selected ? `${labelize(selected.entidade_tipo)} · ${selected.entidade_id}` : 'Metadados locais sem arquivo binário'}</p>
            </div>
            <button type="button" className="enac-dashboard-secondary" onClick={resetForm} disabled={saving}>Nova</button>
          </div>

          {selected && <DocumentSummary documento={selected} />}

          <DocumentForm
            form={form}
            tipos={state.tipos}
            statusValues={state.status}
            usuarios={usuarios}
            selected={selected}
            saving={saving}
            onChange={updateForm}
            onCreate={() => void saveCreate()}
            onUpdate={() => void saveUpdate()}
            onReplace={() => void saveReplace()}
            onInactivate={() => void saveInactivate()}
          />
        </aside>
      </div>
    </section>
  );
}

function DocCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <article className="enac-report-card enac-dashboard-card enac-doc-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DocumentTable({
  documentos,
  loading,
  selectedId,
  onSelect
}: {
  documentos: DocumentoApi[];
  loading: boolean;
  selectedId?: string;
  onSelect: (documento: DocumentoApi) => void;
}): JSX.Element {
  return (
    <section className="enac-report-section enac-doc-table-section">
      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Referências documentais</h2>
          <p>{loading ? 'Atualizando...' : `${documentos.length.toLocaleString('pt-BR')} documento(s)`}</p>
        </div>
      </div>
      {documentos.length === 0 ? (
        <div className="enac-cadastro-empty">Sem documentos para os filtros atuais.</div>
      ) : (
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-doc-table">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Vínculo</th>
                <th>Status</th>
                <th>Atualização</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => (
                <tr key={documento.id} className={selectedId === documento.id ? 'is-selected' : ''} onClick={() => onSelect(documento)}>
                  <td>
                    <strong>{documento.nome_arquivo}</strong>
                    <small>{documento.extensao.toUpperCase()} · {formatBytes(documento.tamanho_bytes)}</small>
                  </td>
                  <td>{labelize(String(documento.tipo_documento))}</td>
                  <td>{documento.origem}</td>
                  <td>
                    <strong>{labelize(documento.entidade_tipo)}</strong>
                    <small>{documento.obra_codigo || documento.contrato_numero || documento.entidade_id}</small>
                  </td>
                  <td><span className={`enac-doc-chip enac-doc-chip--${String(documento.status).toLowerCase()}`}>{labelize(String(documento.status))}</span></td>
                  <td>{formatDateTime(documento.atualizado_em || documento.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DocumentSummary({ documento }: { documento: DocumentoApi }): JSX.Element {
  return (
    <div className="enac-doc-summary">
      <div><span>Empresa</span><strong>{documento.empresa_nome || documento.company_id}</strong></div>
      <div><span>Obra</span><strong>{documento.obra_codigo ? `${documento.obra_codigo} - ${documento.obra_nome || ''}` : '-'}</strong></div>
      <div><span>Contrato</span><strong>{documento.contrato_numero || '-'}</strong></div>
      <div><span>Criado por</span><strong>{documento.criado_por_nome || '-'}</strong></div>
      <div><span>Criado em</span><strong>{formatDateTime(documento.criado_em)}</strong></div>
      <div><span>Mock futuro</span><strong>{documento.sharepoint_item_id_mock || documento.referencia_local_mock || '-'}</strong></div>
    </div>
  );
}

function DocumentForm({
  form,
  tipos,
  statusValues,
  usuarios,
  selected,
  saving,
  onChange,
  onCreate,
  onUpdate,
  onReplace,
  onInactivate
}: {
  form: DocumentoFormState;
  tipos: string[];
  statusValues: string[];
  usuarios: UsuarioApi[];
  selected: DocumentoApi | null;
  saving: boolean;
  onChange: (field: keyof DocumentoFormState, value: string) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onReplace: () => void;
  onInactivate: () => void;
}): JSX.Element {
  const inactive = selected?.status === 'INATIVO' || selected?.status === 'SUBSTITUIDO';
  return (
    <div className="enac-doc-form">
      <label>
        <span>Entidade</span>
        <select value={form.entidade_tipo} onChange={(event) => onChange('entidade_tipo', event.target.value)} disabled={saving || Boolean(selected)}>
          {entidadeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        <span>Entidade ID</span>
        <input value={form.entidade_id} onChange={(event) => onChange('entidade_id', event.target.value)} disabled={saving || Boolean(selected)} placeholder="UUID da origem" />
      </label>
      <label>
        <span>Tipo</span>
        <select value={form.tipo_documento} onChange={(event) => onChange('tipo_documento', event.target.value)} disabled={saving || inactive}>
          {tipos.map((tipo) => <option key={tipo} value={tipo}>{labelize(tipo)}</option>)}
        </select>
      </label>
      <label>
        <span>Status</span>
        <select value={form.status} onChange={(event) => onChange('status', event.target.value)} disabled={saving || inactive}>
          {statusValues.filter((status) => status !== 'INATIVO' && status !== 'SUBSTITUIDO').map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
        </select>
      </label>
      <label className="enac-doc-span-2">
        <span>Nome do arquivo</span>
        <input value={form.nome_arquivo} onChange={(event) => onChange('nome_arquivo', event.target.value)} disabled={saving || inactive} placeholder="contrato-obra.pdf" />
      </label>
      <label>
        <span>Extensão</span>
        <input value={form.extensao} onChange={(event) => onChange('extensao', event.target.value)} disabled={saving || inactive} placeholder="pdf" />
      </label>
      <label>
        <span>MIME type</span>
        <input value={form.mime_type} onChange={(event) => onChange('mime_type', event.target.value)} disabled={saving || inactive} placeholder="application/pdf" />
      </label>
      <label>
        <span>Tamanho bytes</span>
        <input type="number" min="0" value={form.tamanho_bytes} onChange={(event) => onChange('tamanho_bytes', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>Usuário</span>
        <select value={form.usuario_id} onChange={(event) => onChange('usuario_id', event.target.value)} disabled={saving}>
          <option value="">Sem usuário</option>
          {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
        </select>
      </label>
      <label className="enac-doc-span-2">
        <span>Descrição</span>
        <textarea value={form.descricao} onChange={(event) => onChange('descricao', event.target.value)} disabled={saving || inactive} />
      </label>
      <label className="enac-doc-span-2">
        <span>Observação</span>
        <textarea value={form.observacao} onChange={(event) => onChange('observacao', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>Referência local mock</span>
        <input value={form.referencia_local_mock} onChange={(event) => onChange('referencia_local_mock', event.target.value)} disabled={saving || inactive} placeholder="mock://documentos/..." />
      </label>
      <label>
        <span>Origem</span>
        <input value={form.origem} onChange={(event) => onChange('origem', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>Site mock</span>
        <input value={form.sharepoint_site_id_mock} onChange={(event) => onChange('sharepoint_site_id_mock', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>Drive mock</span>
        <input value={form.sharepoint_drive_id_mock} onChange={(event) => onChange('sharepoint_drive_id_mock', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>Item mock</span>
        <input value={form.sharepoint_item_id_mock} onChange={(event) => onChange('sharepoint_item_id_mock', event.target.value)} disabled={saving || inactive} />
      </label>
      <label>
        <span>URL mock</span>
        <input value={form.url_mock} onChange={(event) => onChange('url_mock', event.target.value)} disabled={saving || inactive} />
      </label>
      <label className="enac-doc-span-2">
        <span>Motivo</span>
        <textarea value={form.motivo} onChange={(event) => onChange('motivo', event.target.value)} disabled={saving} />
      </label>
      <div className="enac-doc-actions">
        <button type="button" onClick={onCreate} disabled={saving || Boolean(selected)}>Criar referência</button>
        <button type="button" onClick={onUpdate} disabled={saving || !selected || inactive}>Salvar metadados</button>
        <button type="button" onClick={onReplace} disabled={saving || !selected || inactive}>Substituir referência</button>
        <button type="button" className="enac-dashboard-secondary" onClick={onInactivate} disabled={saving || !selected || inactive}>Inativar</button>
      </div>
    </div>
  );
}
