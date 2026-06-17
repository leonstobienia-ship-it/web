import * as React from 'react';
import {
  erpApi,
  type ContaPagarApi,
  type ContaPagarStatus,
  type FornecedorApi,
  type NotaEntradaApi,
  type NotaEntradaStatus,
  type ObraApi,
  type UsuarioApi
} from '../../services/erpApi';

interface ContaFilters {
  status: ContaPagarStatus | '';
  fornecedor_id: string;
  obra_id: string;
  vencimento_de: string;
  vencimento_ate: string;
}

interface ContaForm {
  nota_entrada_id: string;
  data_vencimento: string;
  forma_pagamento_prevista: string;
  observacoes: string;
}

const marker = 'DEV_LOCAL_V3_5A';

const statusLabels: Record<ContaPagarStatus, string> = {
  PROVISIONADA: 'Provisionada',
  APROVADA: 'Aprovada',
  AGUARDANDO_PROGRAMACAO: 'Aguardando programação',
  PROGRAMADA: 'Programada',
  PAGA: 'Paga',
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

const notaStatusLabels: Record<NotaEntradaStatus, string> = {
  RASCUNHO: 'Rascunho',
  CONFERIDA: 'Conferida',
  DIVERGENTE: 'Divergente',
  APROVADA: 'Aprovada',
  PROVISIONADA: 'Provisionada',
  CANCELADA: 'Cancelada'
};

const emptyFilters = (): ContaFilters => ({
  status: '',
  fornecedor_id: '',
  obra_id: '',
  vencimento_de: '',
  vencimento_ate: ''
});

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const emptyContaForm = (): ContaForm => ({
  nota_entrada_id: '',
  data_vencimento: addDays(7),
  forma_pagamento_prevista: `${marker} - forma local`,
  observacoes: `${marker} - conta local sem programacao bancaria, pagamento ou baixa`
});

const buildEditForm = (conta: ContaPagarApi | null): ContaForm => ({
  nota_entrada_id: conta?.nota_entrada_id || '',
  data_vencimento: conta?.data_vencimento ? conta.data_vencimento.slice(0, 10) : '',
  forma_pagamento_prevista: conta?.forma_pagamento_prevista || '',
  observacoes: conta?.observacoes || ''
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const toNumber = (value: string | number | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: string | number | null | undefined): string =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string | null | undefined): string =>
  value ? value.slice(0, 10).split('-').reverse().join('/') : '-';

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const canEdit = (conta: ContaPagarApi | null): boolean => conta?.status === 'PROVISIONADA';
const canCancel = (conta: ContaPagarApi): boolean => conta.status === 'PROVISIONADA';

export function ContasPagarPage(): JSX.Element {
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [notasAprovadas, setNotasAprovadas] = React.useState<NotaEntradaApi[]>([]);
  const [selectedNota, setSelectedNota] = React.useState<NotaEntradaApi | null>(null);
  const [contas, setContas] = React.useState<ContaPagarApi[]>([]);
  const [selectedConta, setSelectedConta] = React.useState<ContaPagarApi | null>(null);
  const [filters, setFilters] = React.useState<ContaFilters>(emptyFilters());
  const [form, setForm] = React.useState<ContaForm>(emptyContaForm());
  const [editForm, setEditForm] = React.useState<ContaForm>(buildEditForm(null));
  const [approvalUserId, setApprovalUserId] = React.useState<string>('');
  const [cancelTarget, setCancelTarget] = React.useState<ContaPagarApi | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const loadContas = React.useCallback(async (nextFilters: ContaFilters): Promise<void> => {
    setContas(await erpApi.contasPagar.list(nextFilters));
  }, []);

  const loadReferences = React.useCallback(async (): Promise<void> => {
    const [fornecedoresResponse, obrasResponse, notasResponse, usuariosResponse] = await Promise.all([
      erpApi.fornecedores.list(),
      erpApi.obras.list(),
      erpApi.notasEntrada.list({ status: 'APROVADA' }),
      erpApi.usuarios.list()
    ]);
    setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
    setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setNotasAprovadas(notasResponse);
    setForm((current) => ({
      ...current,
      nota_entrada_id: current.nota_entrada_id || notasResponse[0]?.id || ''
    }));
    setApprovalUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'matheus.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, []);

  React.useEffect(() => {
    let active = true;
    Promise.all([loadReferences(), loadContas(emptyFilters())])
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
  }, [loadReferences, loadContas]);

  React.useEffect(() => {
    setEditForm(buildEditForm(selectedConta));
  }, [selectedConta]);

  React.useEffect(() => {
    if (!form.nota_entrada_id) {
      setSelectedNota(null);
      return;
    }
    let active = true;
    erpApi.notasEntrada.get(form.nota_entrada_id)
      .then((nota) => {
        if (active) {
          setSelectedNota(nota);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(getErrorMessage(loadError));
        }
      });

    return () => {
      active = false;
    };
  }, [form.nota_entrada_id]);

  const refresh = async (contaId = selectedConta?.id): Promise<void> => {
    setError('');
    await Promise.all([loadReferences(), loadContas(filters)]);
    if (contaId) {
      setSelectedConta(await erpApi.contasPagar.get(contaId));
    }
  };

  const updateFilters = (field: keyof ContaFilters, value: string): void => {
    const nextFilters = { ...filters, [field]: value } as ContaFilters;
    setFilters(nextFilters);
    void loadContas(nextFilters).catch((filterError) => setError(getErrorMessage(filterError)));
  };

  const updateForm = (field: keyof ContaForm, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditForm = (field: keyof ContaForm, value: string): void => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const selectConta = async (conta: ContaPagarApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      setSelectedConta(await erpApi.contasPagar.get(conta.id));
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const gerarConta = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const conta = await erpApi.contasPagar.provisionarDaNota({
        nota_entrada_id: form.nota_entrada_id,
        data_vencimento: form.data_vencimento,
        forma_pagamento_prevista: form.forma_pagamento_prevista || null,
        observacoes: form.observacoes || null
      });
      setSelectedConta(conta);
      setForm(emptyContaForm());
      setMessage('Conta a pagar provisionada.');
      await refresh(conta.id);
    } catch (generateError) {
      setError(getErrorMessage(generateError));
    } finally {
      setSaving(false);
    }
  };

  const saveConta = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !selectedConta) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const conta = await erpApi.contasPagar.update(selectedConta.id, {
        data_vencimento: editForm.data_vencimento,
        forma_pagamento_prevista: editForm.forma_pagamento_prevista || null,
        observacoes: editForm.observacoes || null
      });
      setSelectedConta(conta);
      setMessage('Conta atualizada.');
      await refresh(conta.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (conta: ContaPagarApi, action: 'cancelar'): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.contasPagar.transition(conta.id, action);
      setSelectedConta(updated);
      setCancelTarget(null);
      setMessage('Status da conta atualizado.');
      await refresh(updated.id);
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const approveConta = async (conta: ContaPagarApi, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<void> => {
    if (saving || !approvalUserId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.contasPagar.aprovar(conta.id, action, {
        usuario_id: approvalUserId,
        observacoes: `${marker} - aprovacao interna local sem pagamento`
      });
      setSelectedConta(updated);
      setMessage('Aprovação registrada.');
      await refresh(updated.id);
    } catch (approveError) {
      setError(getErrorMessage(approveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="enac-web-page enac-finance-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Contas a Pagar</h1>
      <p className="enac-web-lead">
        Conta a pagar inicial provisionada a partir de nota fiscal de entrada aprovada, sem programação bancária, pagamento ou baixa.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando contas locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {!loading && (
        <div className="enac-finance-layout">
          <section className="enac-finance-main" aria-label="Lista e detalhe de contas a pagar">
            <ContaFiltersBar
              filters={filters}
              fornecedores={fornecedores}
              obras={obras}
              saving={saving}
              onChange={updateFilters}
            />

            <div className="enac-cadastro-toolbar">
              <div>
                <h2>Lista de contas</h2>
                <p>{contas.length} conta(s) encontrada(s)</p>
              </div>
              <button type="button" className="enac-cadastro-secondary" onClick={() => void refresh()} disabled={saving}>
                Atualizar
              </button>
            </div>

            <ContasTable contas={contas} selectedId={selectedConta?.id} saving={saving} onSelect={(conta) => void selectConta(conta)} />

            {selectedConta && (
              <ContaDetail
                conta={selectedConta}
                editForm={editForm}
                saving={saving}
                cancelTarget={cancelTarget}
                usuarios={usuarios}
                approvalUserId={approvalUserId}
                onEditChange={updateEditForm}
                onSave={(event) => void saveConta(event)}
                onApprovalUserChange={setApprovalUserId}
                onApprove={(conta, action) => void approveConta(conta, action)}
                onTransition={(conta, action) => action === 'cancelar' ? setCancelTarget(conta) : void transition(conta, action)}
                onConfirmCancel={(conta) => void transition(conta, 'cancelar')}
                onDismissCancel={() => setCancelTarget(null)}
              />
            )}
          </section>

          <aside className="enac-finance-panel" aria-label="Gerar conta a pagar">
            <form className="enac-cadastro-form enac-finance-form" onSubmit={(event) => void gerarConta(event)}>
              <div className="enac-cadastro-form-head"><h3>Gerar conta</h3></div>
              <div className="enac-cadastro-form-grid">
                <label className="enac-solicitacao-span-2">
                  <span>Nota aprovada<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <select value={form.nota_entrada_id} onChange={(event) => updateForm('nota_entrada_id', event.target.value)} disabled={saving} required>
                    <option value="">Selecione</option>
                    {notasAprovadas.map((nota) => (
                      <option key={nota.id} value={nota.id}>
                        {nota.numero}{nota.serie ? `/${nota.serie}` : ''} - {formatMoney(nota.valor_total)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Vencimento<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input type="date" value={form.data_vencimento} onChange={(event) => updateForm('data_vencimento', event.target.value)} disabled={saving} required />
                </label>
                <label>
                  <span>Forma prevista</span>
                  <input value={form.forma_pagamento_prevista} onChange={(event) => updateForm('forma_pagamento_prevista', event.target.value)} disabled={saving} />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea value={form.observacoes} onChange={(event) => updateForm('observacoes', event.target.value)} disabled={saving} />
                </label>
              </div>

              {selectedNota && <NotaPreview nota={selectedNota} />}

              <div className="enac-cadastro-actions">
                <button type="submit" disabled={saving || !form.nota_entrada_id || !form.data_vencimento}>
                  {saving ? 'Gerando...' : 'Gerar conta'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}

function ContaFiltersBar({
  filters,
  fornecedores,
  obras,
  saving,
  onChange
}: {
  filters: ContaFilters;
  fornecedores: FornecedorApi[];
  obras: ObraApi[];
  saving: boolean;
  onChange: (field: keyof ContaFilters, value: string) => void;
}): JSX.Element {
  return (
    <div className="enac-solicitacoes-filters">
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => onChange('status', event.target.value)} disabled={saving}>
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        <span>Fornecedor</span>
        <select value={filters.fornecedor_id} onChange={(event) => onChange('fornecedor_id', event.target.value)} disabled={saving}>
          <option value="">Todos</option>
          {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
        </select>
      </label>
      <label>
        <span>Obra</span>
        <select value={filters.obra_id} onChange={(event) => onChange('obra_id', event.target.value)} disabled={saving}>
          <option value="">Todas</option>
          {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
        </select>
      </label>
      <label>
        <span>Vencimento de</span>
        <input type="date" value={filters.vencimento_de} onChange={(event) => onChange('vencimento_de', event.target.value)} disabled={saving} />
      </label>
      <label>
        <span>Vencimento até</span>
        <input type="date" value={filters.vencimento_ate} onChange={(event) => onChange('vencimento_ate', event.target.value)} disabled={saving} />
      </label>
    </div>
  );
}

function ContasTable({
  contas,
  selectedId,
  saving,
  onSelect
}: {
  contas: ContaPagarApi[];
  selectedId?: string;
  saving: boolean;
  onSelect: (conta: ContaPagarApi) => void;
}): JSX.Element {
  if (contas.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma conta a pagar encontrada.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-finance-table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Status</th>
            <th>Aprovação</th>
            <th>Fornecedor</th>
            <th>Vencimento</th>
            <th>Valor aberto</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((conta) => (
            <tr key={conta.id} className={selectedId === conta.id ? 'enac-finance-row-selected' : ''}>
              <td><strong>{conta.numero_documento}</strong></td>
              <td><span className={`enac-finance-status enac-finance-status--${statusClass(conta.status)}`}>{statusLabels[conta.status]}</span></td>
              <td>{conta.aprovacao_status ? aprovacaoLabels[conta.aprovacao_status] || conta.aprovacao_status : '-'}</td>
              <td>{conta.fornecedor_nome}</td>
              <td>{formatDate(conta.data_vencimento)}</td>
              <td>{formatMoney(conta.valor_aberto)}</td>
              <td><button type="button" onClick={() => onSelect(conta)} disabled={saving}>Detalhe</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContaDetail({
  conta,
  editForm,
  saving,
  cancelTarget,
  usuarios,
  approvalUserId,
  onEditChange,
  onSave,
  onApprovalUserChange,
  onApprove,
  onTransition,
  onConfirmCancel,
  onDismissCancel
}: {
  conta: ContaPagarApi;
  editForm: ContaForm;
  saving: boolean;
  cancelTarget: ContaPagarApi | null;
  usuarios: UsuarioApi[];
  approvalUserId: string;
  onEditChange: (field: keyof ContaForm, value: string) => void;
  onSave: (event: React.FormEvent) => void;
  onApprovalUserChange: (value: string) => void;
  onApprove: (conta: ContaPagarApi, action: 'aprovar-tecnico' | 'aprovar-diretoria') => void;
  onTransition: (conta: ContaPagarApi, action: 'cancelar') => void;
  onConfirmCancel: (conta: ContaPagarApi) => void;
  onDismissCancel: () => void;
}): JSX.Element {
  return (
    <section className="enac-finance-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <span className="enac-web-card-label">{conta.numero_documento}</span>
          <h2>{conta.fornecedor_nome}</h2>
          <p>{conta.pedido_codigo} · {formatMoney(conta.valor_original)}</p>
        </div>
        <span className={`enac-finance-status enac-finance-status--${statusClass(conta.status)}`}>{statusLabels[conta.status]}</span>
      </div>

      <div className="enac-finance-meta">
        <div><span>Nota</span><strong>{conta.nota_numero}{conta.nota_serie ? `/${conta.nota_serie}` : ''}</strong></div>
        <div><span>Pedido</span><strong>{conta.pedido_codigo || '-'}</strong></div>
        <div><span>Obra</span><strong>{conta.obra_codigo || '-'}</strong></div>
        <div><span>Centro de custo</span><strong>{conta.centro_custo_codigo || '-'}</strong></div>
        <div><span>Vencimento</span><strong>{formatDate(conta.data_vencimento)}</strong></div>
        <div><span>Valor aberto</span><strong>{formatMoney(conta.valor_aberto)}</strong></div>
        <div><span>Aprovação</span><strong>{conta.aprovacao_status ? aprovacaoLabels[conta.aprovacao_status] || conta.aprovacao_status : '-'}</strong></div>
        <div><span>Aprovador</span><strong>{conta.aprovado_por_nome || '-'}</strong></div>
      </div>

      {conta.status === 'PROVISIONADA' && (
        <div className="enac-cadastro-row-actions enac-finance-actions">
          <label>
            <span>Aprovador</span>
            <select value={approvalUserId} onChange={(event) => onApprovalUserChange(event.target.value)} disabled={saving}>
              <option value="">Selecione</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => onApprove(conta, 'aprovar-tecnico')} disabled={saving || !approvalUserId}>Aprovar técnico</button>
          <button type="button" onClick={() => onApprove(conta, 'aprovar-diretoria')} disabled={saving || !approvalUserId}>Aprovar diretoria</button>
        </div>
      )}

      <div className="enac-cadastro-row-actions enac-finance-actions">
        {canCancel(conta) && <button type="button" onClick={() => onTransition(conta, 'cancelar')} disabled={saving}>Cancelar</button>}
      </div>

      {cancelTarget?.id === conta.id && (
        <div className="enac-web-alert enac-web-alert--compact">
          <strong>Confirmar cancelamento da conta?</strong>
          <p>A conta ficará `CANCELADA`. Esta etapa não executa pagamento, baixa ou conciliação.</p>
          <div className="enac-cadastro-row-actions">
            <button type="button" onClick={() => onConfirmCancel(conta)} disabled={saving}>Confirmar cancelamento</button>
            <button type="button" className="enac-cadastro-secondary" onClick={onDismissCancel} disabled={saving}>Manter conta</button>
          </div>
        </div>
      )}

      {canEdit(conta) && (
        <form className="enac-cadastro-form enac-finance-edit-form" onSubmit={onSave}>
          <div className="enac-cadastro-form-head"><h3>Editar conta provisionada</h3></div>
          <div className="enac-cadastro-form-grid">
            <label>
              <span>Vencimento</span>
              <input type="date" value={editForm.data_vencimento} onChange={(event) => onEditChange('data_vencimento', event.target.value)} disabled={saving} />
            </label>
            <label>
              <span>Forma prevista</span>
              <input value={editForm.forma_pagamento_prevista} onChange={(event) => onEditChange('forma_pagamento_prevista', event.target.value)} disabled={saving} />
            </label>
            <label className="enac-solicitacao-span-2">
              <span>Observações</span>
              <textarea value={editForm.observacoes} onChange={(event) => onEditChange('observacoes', event.target.value)} disabled={saving} />
            </label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving || !editForm.data_vencimento}>{saving ? 'Salvando...' : 'Salvar conta'}</button>
          </div>
        </form>
      )}
    </section>
  );
}

function NotaPreview({ nota }: { nota: NotaEntradaApi }): JSX.Element {
  return (
    <div className="enac-finance-preview">
      <span className="enac-web-card-label">{nota.numero}{nota.serie ? `/${nota.serie}` : ''}</span>
      <strong>{nota.fornecedor_nome}</strong>
      <p>{nota.pedido_codigo} · {formatMoney(nota.valor_total)}</p>
      <div className="enac-finance-preview-list">
        <div><span>Emissão</span><strong>{formatDate(nota.data_emissao)}</strong></div>
        <div><span>Status</span><strong>{notaStatusLabels[nota.status]}</strong></div>
      </div>
    </div>
  );
}
