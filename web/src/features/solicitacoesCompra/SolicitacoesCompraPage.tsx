import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type EmpresaApi,
  type ObraApi,
  type SolicitacaoCompraApi,
  type SolicitacaoCompraItemApi,
  type SolicitacaoCompraItemPayload,
  type SolicitacaoCompraPrioridade,
  type SolicitacaoCompraStatus,
  type UsuarioApi
} from '../../services/erpApi';
import { EnacAuditTrail, EnacNotification, EnacOperationalFlow } from '../../components';
import {
  buildAuditTrailMock,
  buildFluxoOperacionalMock,
  resolveAprovadorMock
} from '../governanca/mockGovernanca';

type ViewMode = 'list' | 'create' | 'edit';

type TransitionAction = 'enviar' | 'em-analise' | 'devolver' | 'reabrir-rascunho' | 'cancelar';

interface SolicitacaoFormState {
  obra_id: string;
  centro_custo_id: string;
  solicitante_id: string;
  titulo: string;
  descricao: string;
  prioridade: SolicitacaoCompraPrioridade;
  data_necessidade: string;
  observacoes: string;
}

interface SolicitacaoItemFormState {
  localId: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_estimado_unitario: string;
  observacoes: string;
}

const emptyForm = (): SolicitacaoFormState => ({
  obra_id: '',
  centro_custo_id: '',
  solicitante_id: '',
  titulo: '',
  descricao: '',
  prioridade: 'NORMAL',
  data_necessidade: new Date().toISOString().slice(0, 10),
  observacoes: ''
});

const emptyItem = (): SolicitacaoItemFormState => ({
  localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  descricao: '',
  unidade: 'un',
  quantidade: '1',
  valor_estimado_unitario: '0',
  observacoes: ''
});

const statusLabels: Record<SolicitacaoCompraStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  EM_ANALISE: 'Em análise',
  APROVADA_PARA_COTACAO: 'Aprovada para cotação',
  DEVOLVIDA: 'Devolvida',
  CANCELADA: 'Cancelada'
};

const aprovacaoLabels: Record<string, string> = {
  PENDENTE_APROVACAO: 'Pendente',
  APROVADO_TECNICO: 'Aprovado técnico',
  APROVADO_DIRETORIA: 'Aprovado diretoria',
  REPROVADO: 'Reprovado',
  DEVOLVIDO: 'Devolvido',
  BLOQUEADO_ALCADA: 'Bloqueado por alçada'
};

const prioridadeLabels: Record<SolicitacaoCompraPrioridade, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
};

const transitionLabels: Record<TransitionAction, string> = {
  enviar: 'Enviar',
  'em-analise': 'Marcar em análise',
  devolver: 'Devolver',
  'reabrir-rascunho': 'Reabrir rascunho',
  cancelar: 'Cancelar'
};

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const formatMoney = (value: string | number | null | undefined): string => {
  const parsed = Number(value ?? 0);
  return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  return value.slice(0, 10).split('-').reverse().join('/');
};

const normalizeDecimal = (value: string): number => {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    throw new Error('Informe valores numéricos válidos nos itens.');
  }
  return parsed;
};

const itemTotal = (item: SolicitacaoItemFormState): number => {
  const quantidade = Number(String(item.quantidade || '0').replace(',', '.'));
  const valor = Number(String(item.valor_estimado_unitario || '0').replace(',', '.'));
  if (!Number.isFinite(quantidade) || !Number.isFinite(valor)) {
    return 0;
  }

  return quantidade * valor;
};

const detailItemTotal = (item: SolicitacaoCompraItemApi): number =>
  Number(item.quantidade || 0) * Number(item.valor_estimado_unitario || 0);

const toOptionLabel = (prefix: string | null | undefined, name: string | null | undefined): string =>
  [prefix, name].filter(Boolean).join(' - ') || '-';

const getTransitionActions = (status: SolicitacaoCompraStatus): TransitionAction[] => {
  if (status === 'RASCUNHO') {
    return ['enviar', 'cancelar'];
  }
  if (status === 'ENVIADA') {
    return ['em-analise', 'cancelar'];
  }
  if (status === 'EM_ANALISE') {
    return ['devolver', 'cancelar'];
  }
  if (status === 'DEVOLVIDA') {
    return ['reabrir-rascunho'];
  }
  return [];
};

const statusClass = (status: SolicitacaoCompraStatus): string =>
  status.toLowerCase().replace(/_/g, '-');

const buildFormFromSolicitacao = (solicitacao: SolicitacaoCompraApi): SolicitacaoFormState => ({
  obra_id: solicitacao.obra_id,
  centro_custo_id: solicitacao.centro_custo_id,
  solicitante_id: solicitacao.solicitante_id,
  titulo: solicitacao.titulo,
  descricao: solicitacao.descricao || '',
  prioridade: solicitacao.prioridade,
  data_necessidade: solicitacao.data_necessidade.slice(0, 10),
  observacoes: solicitacao.observacoes || ''
});

const buildItemsFromSolicitacao = (solicitacao: SolicitacaoCompraApi): SolicitacaoItemFormState[] => {
  if (!solicitacao.itens || solicitacao.itens.length === 0) {
    return [emptyItem()];
  }

  return solicitacao.itens.map((item) => ({
    localId: item.id,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: String(item.quantidade),
    valor_estimado_unitario: String(item.valor_estimado_unitario),
    observacoes: item.observacoes || ''
  }));
};

export function SolicitacoesCompraPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [solicitacoes, setSolicitacoes] = React.useState<SolicitacaoCompraApi[]>([]);
  const [selected, setSelected] = React.useState<SolicitacaoCompraApi | null>(null);
  const [mode, setMode] = React.useState<ViewMode>('list');
  const [form, setForm] = React.useState<SolicitacaoFormState>(emptyForm());
  const [items, setItems] = React.useState<SolicitacaoItemFormState[]>([emptyItem()]);
  const [statusFilter, setStatusFilter] = React.useState<SolicitacaoCompraStatus | ''>('');
  const [prioridadeFilter, setPrioridadeFilter] = React.useState<SolicitacaoCompraPrioridade | ''>('');
  const [obraFilter, setObraFilter] = React.useState<string>('');
  const [approvalUserId, setApprovalUserId] = React.useState<string>('');
  const [loadingRefs, setLoadingRefs] = React.useState<boolean>(true);
  const [loadingList, setLoadingList] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const empresa = empresas[0];

  const loadSolicitacoes = React.useCallback(async (): Promise<void> => {
    setLoadingList(true);
    setError('');
    try {
      setSolicitacoes(await erpApi.solicitacoesCompra.list({
        status: statusFilter,
        prioridade: prioridadeFilter,
        obra_id: obraFilter
      }));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingList(false);
    }
  }, [obraFilter, prioridadeFilter, statusFilter]);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      erpApi.empresas.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.usuarios.list()
    ])
      .then(([empresasResponse, obrasResponse, centrosResponse, usuariosResponse]) => {
        if (!active) {
          return;
        }
        setEmpresas(empresasResponse);
        setObras(obrasResponse);
        setCentrosCusto(centrosResponse);
        setUsuarios(usuariosResponse);
        setApprovalUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
      })
      .catch((loadError) => {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (active) {
          setLoadingRefs(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    void loadSolicitacoes();
  }, [loadSolicitacoes]);

  const openCreate = (): void => {
    setMode('create');
    setSelected(null);
    setForm(emptyForm());
    setItems([emptyItem()]);
    setError('');
    setMessage('');
  };

  const openDetail = async (solicitacao: SolicitacaoCompraApi): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      setSelected(await erpApi.solicitacoesCompra.get(solicitacao.id));
      setMode('list');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (solicitacao: SolicitacaoCompraApi): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const detalhe = await erpApi.solicitacoesCompra.get(solicitacao.id);
      setSelected(detalhe);
      setForm(buildFormFromSolicitacao(detalhe));
      setItems(buildItemsFromSolicitacao(detalhe));
      setMode('edit');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof SolicitacaoFormState, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (localId: string, field: keyof Omit<SolicitacaoItemFormState, 'localId'>, value: string): void => {
    setItems((current) => current.map((item) => item.localId === localId ? { ...item, [field]: value } : item));
  };

  const addItem = (): void => {
    setItems((current) => [...current, emptyItem()]);
  };

  const removeItem = (localId: string): void => {
    setItems((current) => current.filter((item) => item.localId !== localId));
  };

  const buildItemsPayload = (): SolicitacaoCompraItemPayload[] => {
    if (items.length === 0) {
      throw new Error('Inclua ao menos um item na solicitação.');
    }

    return items.map((item, index) => {
      const descricao = item.descricao.trim();
      const unidade = item.unidade.trim();
      const quantidade = normalizeDecimal(item.quantidade);
      const valorEstimadoUnitario = normalizeDecimal(item.valor_estimado_unitario || '0');

      if (!descricao) {
        throw new Error(`Preencha a descrição do item ${index + 1}.`);
      }
      if (!unidade) {
        throw new Error(`Preencha a unidade do item ${index + 1}.`);
      }
      if (quantidade <= 0) {
        throw new Error(`Quantidade deve ser maior que zero no item ${index + 1}.`);
      }
      if (valorEstimadoUnitario < 0) {
        throw new Error(`Valor unitário deve ser maior ou igual a zero no item ${index + 1}.`);
      }

      return {
        descricao,
        unidade,
        quantidade,
        valor_estimado_unitario: valorEstimadoUnitario,
        observacoes: item.observacoes.trim() || null
      };
    });
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !empresa) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        company_id: empresa.id,
        obra_id: form.obra_id,
        centro_custo_id: form.centro_custo_id,
        solicitante_id: form.solicitante_id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        prioridade: form.prioridade,
        data_necessidade: form.data_necessidade,
        observacoes: form.observacoes.trim() || null,
        itens: buildItemsPayload()
      };

      if (!payload.obra_id || !payload.centro_custo_id || !payload.solicitante_id || !payload.titulo || !payload.descricao || !payload.data_necessidade) {
        throw new Error('Preencha todos os campos obrigatórios da solicitação.');
      }

      if (mode === 'edit' && selected) {
        const { company_id: _companyId, ...updatePayload } = payload;
        const updated = await erpApi.solicitacoesCompra.update(selected.id, updatePayload);
        setSelected(updated);
        setMessage('Solicitação atualizada.');
      } else {
        const created = await erpApi.solicitacoesCompra.create(payload);
        setSelected(created);
        setForm(emptyForm());
        setItems([emptyItem()]);
        setMessage('Solicitação criada com sucesso. O formulário foi limpo e a lista foi atualizada.');
      }

      setMode('list');
      await loadSolicitacoes();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (solicitacao: SolicitacaoCompraApi, action: TransitionAction): Promise<void> => {
    if (saving) {
      return;
    }

    if (action === 'cancelar' && !window.confirm(`Cancelar a solicitação ${solicitacao.codigo}?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await erpApi.solicitacoesCompra.transition(solicitacao.id, action);
      setSelected(updated);
      setMessage(`Solicitação atualizada: ${statusLabels[updated.status]}.`);
      await loadSolicitacoes();
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const approveSolicitacao = async (solicitacao: SolicitacaoCompraApi, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<void> => {
    if (saving || !approvalUserId) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await erpApi.solicitacoesCompra.aprovar(solicitacao.id, action, {
        usuario_id: approvalUserId,
        observacoes: 'DEV_LOCAL_V3_5C - aprovacao local por alcada'
      });
      setSelected(updated);
      setMessage('Aprovação registrada.');
      await loadSolicitacoes();
    } catch (approveError) {
      setError(getErrorMessage(approveError));
    } finally {
      setSaving(false);
    }
  };

  const totalForm = items.reduce((total, item) => total + itemTotal(item), 0);
  const referenciasCarregadas = !loadingRefs && Boolean(empresa) && obras.length > 0 && centrosCusto.length > 0 && usuarios.length > 0;

  return (
    <section className="enac-web-page enac-solicitacoes-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Solicitações de Compra</h1>
      <p className="enac-web-lead">
        Registro MVP de solicitações de compra com itens, obra, centro de custo, solicitante e fluxo inicial até análise.
      </p>

      {loadingRefs && <div className="enac-cadastro-empty">Carregando referências locais.</div>}
      <EnacNotification tone="success" message={message} onClose={() => setMessage('')} />
      <EnacNotification tone="error" message={error} onClose={() => setError('')} />

      {!loadingRefs && !empresa && (
        <div className="enac-web-alert enac-web-alert--compact">
          Nenhuma empresa local encontrada. Rode migration e seed antes de criar solicitações.
        </div>
      )}

      {empresa && (
        <>
          <div className="enac-cadastros-context">
            <strong>{empresa.nome_fantasia || empresa.razao_social}</strong>
            <span>{empresa.cnpj}</span>
          </div>

          {!referenciasCarregadas && (
            <div className="enac-web-alert enac-web-alert--compact">
              Solicitações exigem ao menos uma obra, um centro de custo e um usuário local. Rode a seed ou cadastre as referências.
            </div>
          )}

          <div className="enac-solicitacoes-layout">
            <section className="enac-solicitacoes-list" aria-label="Lista de solicitações de compra">
              <div className="enac-cadastro-toolbar">
                <div>
                  <h2>Fila local</h2>
                  <p>{solicitacoes.length} solicitação(ões) carregada(s)</p>
                </div>
                <button type="button" onClick={openCreate} disabled={!referenciasCarregadas || saving || loadingList}>Nova solicitação</button>
              </div>

              <div className="enac-solicitacoes-filters" aria-label="Filtros de solicitações">
                <label>
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SolicitacaoCompraStatus | '')} disabled={saving}>
                    <option value="">Todos</option>
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Prioridade</span>
                  <select
                    value={prioridadeFilter}
                    onChange={(event) => setPrioridadeFilter(event.target.value as SolicitacaoCompraPrioridade | '')}
                    disabled={saving}
                  >
                    <option value="">Todas</option>
                    {Object.entries(prioridadeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Obra</span>
                  <select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)} disabled={saving}>
                    <option value="">Todas</option>
                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="enac-cadastro-secondary" onClick={() => void loadSolicitacoes()} disabled={saving || loadingList}>
                  Atualizar
                </button>
              </div>

              {loadingList && <div className="enac-cadastro-empty">Carregando solicitações.</div>}

              {!loadingList && solicitacoes.length === 0 && mode === 'list' && (
                <div className="enac-cadastro-empty">Nenhuma solicitação encontrada no PostgreSQL local.</div>
              )}

              {!loadingList && solicitacoes.length > 0 && (
                <div className="enac-cadastro-table-wrap">
                  <table className="enac-web-table enac-solicitacoes-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Título</th>
                        <th>Obra</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Aprovação</th>
                        <th>Total</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitacoes.map((solicitacao) => (
                        <tr key={solicitacao.id}>
                          <td><strong>{solicitacao.codigo}</strong></td>
                          <td>{solicitacao.titulo}</td>
                          <td>{toOptionLabel(solicitacao.obra_codigo, solicitacao.obra_nome)}</td>
                          <td>{prioridadeLabels[solicitacao.prioridade]}</td>
                          <td>
                            <span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(solicitacao.status)}`}>
                              {statusLabels[solicitacao.status]}
                            </span>
                          </td>
                          <td>{solicitacao.aprovacao_status ? aprovacaoLabels[solicitacao.aprovacao_status] || solicitacao.aprovacao_status : '-'}</td>
                          <td>{formatMoney(solicitacao.valor_estimado_total)}</td>
                          <td>
                            <div className="enac-cadastro-row-actions">
                              <button type="button" onClick={() => void openDetail(solicitacao)} disabled={saving}>Detalhes</button>
                              {solicitacao.status !== 'CANCELADA' && solicitacao.status !== 'APROVADA_PARA_COTACAO' && (
                                <button type="button" onClick={() => void openEdit(solicitacao)} disabled={saving}>Editar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="enac-solicitacoes-panel" aria-label="Detalhe da solicitação">
              {mode === 'list' && !selected && (
                <div className="enac-cadastro-empty">
                  Selecione uma solicitação para ver detalhes ou crie um novo rascunho.
                </div>
              )}

              {mode === 'list' && selected && (
                <SolicitacaoDetail
                  solicitacao={selected}
                  saving={saving}
                  usuarios={usuarios}
                  approvalUserId={approvalUserId}
                  onEdit={() => void openEdit(selected)}
                  onApprovalUserChange={setApprovalUserId}
                  onApprove={(action) => void approveSolicitacao(selected, action)}
                  onTransition={(action) => void transition(selected, action)}
                />
              )}

              {mode !== 'list' && (
                <form className="enac-cadastro-form enac-solicitacao-form" onSubmit={save}>
                  <div className="enac-cadastro-form-head">
                    <h3>{mode === 'edit' ? 'Editar solicitação' : 'Nova solicitação'}</h3>
                    <button type="button" className="enac-cadastro-secondary" onClick={() => setMode('list')} disabled={saving}>
                      Cancelar
                    </button>
                  </div>

                  <div className="enac-cadastro-form-grid">
                    <label>
                      <span>Título<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <input value={form.titulo} onChange={(event) => updateForm('titulo', event.target.value)} disabled={saving} required />
                    </label>
                    <label>
                      <span>Obra<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <select value={form.obra_id} onChange={(event) => updateForm('obra_id', event.target.value)} disabled={saving} required>
                        <option value="">Selecione</option>
                        {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Centro de custo<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <select
                        value={form.centro_custo_id}
                        onChange={(event) => updateForm('centro_custo_id', event.target.value)}
                        disabled={saving}
                        required
                      >
                        <option value="">Selecione</option>
                        {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Solicitante<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <select value={form.solicitante_id} onChange={(event) => updateForm('solicitante_id', event.target.value)} disabled={saving} required>
                        <option value="">Selecione</option>
                        {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Prioridade<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <select
                        value={form.prioridade}
                        onChange={(event) => updateForm('prioridade', event.target.value as SolicitacaoCompraPrioridade)}
                        disabled={saving}
                        required
                      >
                        {Object.entries(prioridadeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Data de necessidade<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <input
                        type="date"
                        value={form.data_necessidade}
                        onChange={(event) => updateForm('data_necessidade', event.target.value)}
                        disabled={saving}
                        required
                      />
                    </label>
                    <label className="enac-solicitacao-span-2">
                      <span>Descrição<strong className="enac-cadastro-required">Obrigatório</strong></span>
                      <textarea value={form.descricao} onChange={(event) => updateForm('descricao', event.target.value)} disabled={saving} required />
                    </label>
                    <label className="enac-solicitacao-span-2">
                      <span>Observações</span>
                      <textarea value={form.observacoes} onChange={(event) => updateForm('observacoes', event.target.value)} disabled={saving} />
                    </label>
                  </div>

                  <div className="enac-solicitacao-items-head">
                    <div>
                      <h4>Itens</h4>
                      <p>Total estimado: {formatMoney(totalForm)}</p>
                    </div>
                    <button type="button" className="enac-cadastro-secondary" onClick={addItem} disabled={saving}>Adicionar item</button>
                  </div>

                  <div className="enac-solicitacao-items">
                    {items.map((item, index) => (
                      <div className="enac-solicitacao-item" key={item.localId}>
                        <div className="enac-solicitacao-item-title">
                          <strong>Item {index + 1}</strong>
                          <button type="button" className="enac-cadastro-secondary" onClick={() => removeItem(item.localId)} disabled={saving}>
                            Remover
                          </button>
                        </div>
                        <div className="enac-cadastro-form-grid">
                          <label>
                            <span>Descrição<strong className="enac-cadastro-required">Obrigatório</strong></span>
                            <input value={item.descricao} onChange={(event) => updateItem(item.localId, 'descricao', event.target.value)} disabled={saving} required />
                          </label>
                          <label>
                            <span>Unidade<strong className="enac-cadastro-required">Obrigatório</strong></span>
                            <input value={item.unidade} onChange={(event) => updateItem(item.localId, 'unidade', event.target.value)} disabled={saving} required />
                          </label>
                          <label>
                            <span>Quantidade<strong className="enac-cadastro-required">Obrigatório</strong></span>
                            <input
                              type="number"
                              min="0.0001"
                              step="0.0001"
                              value={item.quantidade}
                              onChange={(event) => updateItem(item.localId, 'quantidade', event.target.value)}
                              disabled={saving}
                              required
                            />
                          </label>
                          <label>
                            <span>Valor unitário</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.valor_estimado_unitario}
                              onChange={(event) => updateItem(item.localId, 'valor_estimado_unitario', event.target.value)}
                              disabled={saving}
                            />
                          </label>
                          <label className="enac-solicitacao-span-2">
                            <span>Observações do item</span>
                            <textarea
                              value={item.observacoes}
                              onChange={(event) => updateItem(item.localId, 'observacoes', event.target.value)}
                              disabled={saving}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="enac-cadastro-actions">
                    <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar rascunho'}</button>
                  </div>
                </form>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

function SolicitacaoDetail({
  solicitacao,
  saving,
  usuarios,
  approvalUserId,
  onEdit,
  onApprovalUserChange,
  onApprove,
  onTransition
}: {
  solicitacao: SolicitacaoCompraApi;
  saving: boolean;
  usuarios: UsuarioApi[];
  approvalUserId: string;
  onEdit: () => void;
  onApprovalUserChange: (value: string) => void;
  onApprove: (action: 'aprovar-tecnico' | 'aprovar-diretoria') => void;
  onTransition: (action: TransitionAction) => void;
}): JSX.Element {
  const actions = getTransitionActions(solicitacao.status);
  const canEdit = solicitacao.status !== 'CANCELADA' && solicitacao.status !== 'APROVADA_PARA_COTACAO';
  const canApprove = ['ENVIADA', 'EM_ANALISE'].includes(solicitacao.status);
  const approvalMock = resolveAprovadorMock(solicitacao.valor_estimado_total);
  const flowKey = solicitacao.status === 'APROVADA_PARA_COTACAO'
    ? 'compra'
    : ['ENVIADA', 'EM_ANALISE'].includes(solicitacao.status)
      ? 'aprovacao'
      : 'solicitacao';
  const auditEvents = buildAuditTrailMock({
    module: 'Solicitações de Compra',
    code: solicitacao.codigo,
    createdAt: solicitacao.created_at,
    status: statusLabels[solicitacao.status],
    approvalStatus: solicitacao.aprovacao_status,
    approvedBy: solicitacao.aprovado_por_nome,
    approvedAt: solicitacao.aprovado_em,
    value: solicitacao.valor_estimado_total
  });

  return (
    <article className="enac-solicitacao-detail">
      <header>
        <div>
          <span className="enac-web-card-label">{solicitacao.codigo}</span>
          <h2>{solicitacao.titulo}</h2>
        </div>
        <span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(solicitacao.status)}`}>
          {statusLabels[solicitacao.status]}
        </span>
      </header>

      <dl className="enac-solicitacao-meta">
        <div><dt>Obra</dt><dd>{toOptionLabel(solicitacao.obra_codigo, solicitacao.obra_nome)}</dd></div>
        <div><dt>Centro de custo</dt><dd>{toOptionLabel(solicitacao.centro_custo_codigo, solicitacao.centro_custo_nome)}</dd></div>
        <div><dt>Solicitante</dt><dd>{solicitacao.solicitante_nome || '-'}</dd></div>
        <div><dt>Prioridade</dt><dd>{prioridadeLabels[solicitacao.prioridade]}</dd></div>
        <div><dt>Necessidade</dt><dd>{formatDate(solicitacao.data_necessidade)}</dd></div>
        <div><dt>Total</dt><dd>{formatMoney(solicitacao.valor_estimado_total)}</dd></div>
        <div><dt>Aprovação</dt><dd>{solicitacao.aprovacao_status ? aprovacaoLabels[solicitacao.aprovacao_status] || solicitacao.aprovacao_status : '-'}</dd></div>
        <div><dt>Aprovador</dt><dd>{solicitacao.aprovado_por_nome || '-'}</dd></div>
      </dl>

      <div className="enac-v319-stack">
        <EnacOperationalFlow steps={buildFluxoOperacionalMock(flowKey)} />
        <section className="enac-governance-card" aria-label="Governança mock da solicitação">
          <div className="enac-governance-card__head">
            <span className="enac-web-card-label">Alçada mock</span>
            <h3>{approvalMock.badge}</h3>
            <p>{approvalMock.motivo}</p>
          </div>
          <div className="enac-governance-card__grid">
            <div><span>Origem</span><strong>Campo</strong></div>
            <div><span>Aprovador</span><strong>{approvalMock.aprovador}</strong></div>
            <div><span>Responsável compra</span><strong>Matheus</strong></div>
            <div><span>Prioridade</span><strong>{prioridadeLabels[solicitacao.prioridade]}</strong></div>
          </div>
        </section>
      </div>

      <section>
        <h3>Descrição</h3>
        <p>{solicitacao.descricao || '-'}</p>
      </section>

      {solicitacao.observacoes && (
        <section>
          <h3>Observações</h3>
          <p>{solicitacao.observacoes}</p>
        </section>
      )}

      <section>
        <h3>Itens</h3>
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-solicitacao-detail-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Qtd.</th>
                <th>Valor unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(solicitacao.itens || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.descricao}</td>
                  <td>{item.unidade}</td>
                  <td>{Number(item.quantidade).toLocaleString('pt-BR')}</td>
                  <td>{formatMoney(item.valor_estimado_unitario)}</td>
                  <td>{formatMoney(detailItemTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="enac-solicitacao-detail-actions">
        {canApprove && (
          <label>
            <span>Aprovador</span>
            <select value={approvalUserId} onChange={(event) => onApprovalUserChange(event.target.value)} disabled={saving}>
              <option value="">Selecione</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>
              ))}
            </select>
          </label>
        )}
        {canApprove && <button type="button" onClick={() => onApprove('aprovar-tecnico')} disabled={saving || !approvalUserId}>Aprovar técnico</button>}
        {canApprove && <button type="button" onClick={() => onApprove('aprovar-diretoria')} disabled={saving || !approvalUserId}>Aprovar diretoria</button>}
        {canEdit && <button type="button" className="enac-cadastro-secondary" onClick={onEdit} disabled={saving}>Editar</button>}
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className={action === 'cancelar' ? 'enac-solicitacao-danger' : ''}
            onClick={() => onTransition(action)}
            disabled={saving}
          >
            {transitionLabels[action]}
          </button>
        ))}
      </footer>
      <EnacAuditTrail events={auditEvents} />
    </article>
  );
}
