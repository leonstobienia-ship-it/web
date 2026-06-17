import * as React from 'react';
import {
  erpApi,
  type ContaPagarApi,
  type ContaPagarBaixaApi,
  type ContaPagarBaixaStatus,
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

interface BaixaManualForm {
  data_baixa: string;
  valor_baixado: string;
  forma_pagamento_manual: string;
  observacoes: string;
  referencia_anexo: string;
  motivo_estorno: string;
}

const marker = 'DEV_LOCAL_V3_5G';

const statusLabels: Record<ContaPagarStatus, string> = {
  PROVISIONADA: 'Provisionada',
  APROVADA: 'Aprovada',
  AGUARDANDO_PROGRAMACAO: 'Aguardando programação',
  PROGRAMADA: 'Programada',
  BAIXADA_MANUAL: 'Baixada manual',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada'
};

const baixaStatusLabels: Record<ContaPagarBaixaStatus, string> = {
  BAIXA_PENDENTE: 'Pendente de baixa',
  BAIXADA_MANUAL: 'Baixada manual',
  BAIXA_ESTORNADA: 'Baixa estornada',
  BLOQUEADA_BAIXA: 'Bloqueada para baixa'
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
  observacoes: `${marker} - conta local sem integracao bancaria`
});

const buildEditForm = (conta: ContaPagarApi | null): ContaForm => ({
  nota_entrada_id: conta?.nota_entrada_id || '',
  data_vencimento: conta?.data_vencimento ? conta.data_vencimento.slice(0, 10) : '',
  forma_pagamento_prevista: conta?.forma_pagamento_prevista || '',
  observacoes: conta?.observacoes || ''
});

const buildBaixaManualForm = (conta: ContaPagarApi | null): BaixaManualForm => ({
  data_baixa: addDays(0),
  valor_baixado: conta ? String(toNumber(conta.valor_aberto).toFixed(2)) : '',
  forma_pagamento_manual: `${marker} - registro manual`,
  observacoes: `${marker} - baixa manual administrativa sem banco real`,
  referencia_anexo: '',
  motivo_estorno: `${marker} - estorno administrativo controlado`
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
const canBaixarManual = (conta: ContaPagarApi): boolean =>
  conta.status === 'APROVADA'
  && conta.baixa_status !== 'BAIXADA_MANUAL'
  && conta.programacao_baixa_status === 'LIBERADA'
  && conta.programacao_baixa_liberacao_status === 'LIBERADA'
  && conta.programacao_baixa_conferencia_status === 'CONFERIDA'
  && toNumber(conta.valor_aberto) > 0
  && conta.divergencia_pendente !== true
  && conta.ativo !== false;

const getBaixaBloqueios = (conta: ContaPagarApi): string[] => {
  const bloqueios: string[] = [];
  if (conta.ativo === false) {
    bloqueios.push('Conta inativa.');
  }
  if (conta.status === 'CANCELADA') {
    bloqueios.push('Conta cancelada.');
  } else if (conta.status === 'BAIXADA_MANUAL') {
    bloqueios.push('Conta já baixada manualmente.');
  } else if (conta.status !== 'APROVADA') {
    bloqueios.push('Conta precisa estar aprovada.');
  }
  if (conta.divergencia_pendente) {
    bloqueios.push('Conta com divergência pendente.');
  }
  if (!conta.programacao_baixa_id) {
    bloqueios.push('Sem programação ativa vinculada.');
  }
  if (conta.programacao_baixa_status && conta.programacao_baixa_status !== 'LIBERADA') {
    bloqueios.push('Programação ainda não liberada.');
  }
  if (conta.programacao_baixa_liberacao_status && conta.programacao_baixa_liberacao_status !== 'LIBERADA') {
    bloqueios.push('Liberação final pendente.');
  }
  if (conta.programacao_baixa_conferencia_status !== 'CONFERIDA') {
    bloqueios.push('Conferência financeira final pendente.');
  }
  if (toNumber(conta.valor_aberto) <= 0 && conta.status !== 'BAIXADA_MANUAL') {
    bloqueios.push('Sem saldo aberto.');
  }
  return bloqueios;
};

export function ContasPagarPage(): JSX.Element {
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [notasAprovadas, setNotasAprovadas] = React.useState<NotaEntradaApi[]>([]);
  const [selectedNota, setSelectedNota] = React.useState<NotaEntradaApi | null>(null);
  const [contas, setContas] = React.useState<ContaPagarApi[]>([]);
  const [selectedConta, setSelectedConta] = React.useState<ContaPagarApi | null>(null);
  const [baixas, setBaixas] = React.useState<ContaPagarBaixaApi[]>([]);
  const [filters, setFilters] = React.useState<ContaFilters>(emptyFilters());
  const [form, setForm] = React.useState<ContaForm>(emptyContaForm());
  const [editForm, setEditForm] = React.useState<ContaForm>(buildEditForm(null));
  const [baixaForm, setBaixaForm] = React.useState<BaixaManualForm>(buildBaixaManualForm(null));
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
    setBaixaForm(buildBaixaManualForm(selectedConta));
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
      const [conta, historico] = await Promise.all([
        erpApi.contasPagar.get(contaId),
        erpApi.contasPagar.baixas(contaId)
      ]);
      setSelectedConta(conta);
      setBaixas(historico);
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

  const updateBaixaForm = (field: keyof BaixaManualForm, value: string): void => {
    setBaixaForm((current) => ({ ...current, [field]: value }));
  };

  const selectConta = async (conta: ContaPagarApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const [detail, historico] = await Promise.all([
        erpApi.contasPagar.get(conta.id),
        erpApi.contasPagar.baixas(conta.id)
      ]);
      setSelectedConta(detail);
      setBaixas(historico);
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

  const registrarBaixaManual = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !selectedConta || !approvalUserId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.contasPagar.baixarManual(selectedConta.id, {
        usuario_id: approvalUserId,
        data_baixa: baixaForm.data_baixa,
        valor_baixado: toNumber(baixaForm.valor_baixado),
        forma_pagamento_manual: baixaForm.forma_pagamento_manual,
        observacoes: baixaForm.observacoes,
        referencia_anexo: baixaForm.referencia_anexo || null
      });
      setSelectedConta(updated);
      setMessage('Baixa manual registrada.');
      await refresh(updated.id);
    } catch (baixaError) {
      setError(getErrorMessage(baixaError));
    } finally {
      setSaving(false);
    }
  };

  const estornarBaixaManual = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !selectedConta || !approvalUserId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.contasPagar.estornarBaixa(selectedConta.id, {
        usuario_id: approvalUserId,
        observacoes: baixaForm.motivo_estorno
      });
      setSelectedConta(updated);
      setMessage('Estorno da baixa manual registrado.');
      await refresh(updated.id);
    } catch (estornoError) {
      setError(getErrorMessage(estornoError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="enac-web-page enac-finance-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Contas a Pagar</h1>
      <p className="enac-web-lead">
        Conta a pagar provisionada a partir de nota fiscal de entrada aprovada, com baixa manual administrativa controlada e sem integração bancária.
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
                baixaForm={baixaForm}
                baixas={baixas}
                saving={saving}
                cancelTarget={cancelTarget}
                usuarios={usuarios}
                approvalUserId={approvalUserId}
                onEditChange={updateEditForm}
                onBaixaChange={updateBaixaForm}
                onSave={(event) => void saveConta(event)}
                onBaixarManual={(event) => void registrarBaixaManual(event)}
                onEstornarBaixa={(event) => void estornarBaixaManual(event)}
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
  baixaForm,
  baixas,
  saving,
  cancelTarget,
  usuarios,
  approvalUserId,
  onEditChange,
  onBaixaChange,
  onSave,
  onBaixarManual,
  onEstornarBaixa,
  onApprovalUserChange,
  onApprove,
  onTransition,
  onConfirmCancel,
  onDismissCancel
}: {
  conta: ContaPagarApi;
  editForm: ContaForm;
  baixaForm: BaixaManualForm;
  baixas: ContaPagarBaixaApi[];
  saving: boolean;
  cancelTarget: ContaPagarApi | null;
  usuarios: UsuarioApi[];
  approvalUserId: string;
  onEditChange: (field: keyof ContaForm, value: string) => void;
  onBaixaChange: (field: keyof BaixaManualForm, value: string) => void;
  onSave: (event: React.FormEvent) => void;
  onBaixarManual: (event: React.FormEvent) => void;
  onEstornarBaixa: (event: React.FormEvent) => void;
  onApprovalUserChange: (value: string) => void;
  onApprove: (conta: ContaPagarApi, action: 'aprovar-tecnico' | 'aprovar-diretoria') => void;
  onTransition: (conta: ContaPagarApi, action: 'cancelar') => void;
  onConfirmCancel: (conta: ContaPagarApi) => void;
  onDismissCancel: () => void;
}): JSX.Element {
  const baixaStatus = conta.baixa_status || 'BAIXA_PENDENTE';
  const bloqueiosBaixa = getBaixaBloqueios(conta);
  const baixaElegivel = canBaixarManual(conta);

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
        <div><span>Baixa</span><strong>{baixaStatusLabels[baixaStatus]}</strong></div>
        <div><span>Programação</span><strong>{conta.programacao_baixa_codigo || '-'}</strong></div>
        <div><span>Liberação</span><strong>{conta.programacao_baixa_liberacao_status || '-'}</strong></div>
        <div><span>Conferência</span><strong>{conta.programacao_baixa_conferencia_status || '-'}</strong></div>
        <div><span>Responsável baixa</span><strong>{conta.baixado_manual_por_nome || '-'}</strong></div>
        <div><span>Valor baixado</span><strong>{conta.baixa_manual_valor ? formatMoney(conta.baixa_manual_valor) : '-'}</strong></div>
      </div>

      {conta.bloqueio_baixa_motivo && (
        <div className="enac-web-alert enac-web-alert--compact">
          {conta.bloqueio_baixa_motivo}
        </div>
      )}

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
          <p>A conta ficará CANCELADA por controle lógico, sem remoção física.</p>
          <div className="enac-cadastro-row-actions">
            <button type="button" onClick={() => onConfirmCancel(conta)} disabled={saving}>Confirmar cancelamento</button>
            <button type="button" className="enac-cadastro-secondary" onClick={onDismissCancel} disabled={saving}>Manter conta</button>
          </div>
        </div>
      )}

      <section className="enac-finance-baixa-panel" aria-label="Baixa manual controlada">
        <div className="enac-cadastro-toolbar">
          <div>
            <span className="enac-web-card-label">V3.5G</span>
            <h3>Baixa manual</h3>
            <p>Registro administrativo local, condicionado a programação liberada e conferida.</p>
          </div>
          <span className={`enac-finance-status enac-finance-status--${statusClass(baixaStatus)}`}>{baixaStatusLabels[baixaStatus]}</span>
        </div>

        {!baixaElegivel && conta.status !== 'BAIXADA_MANUAL' && (
          <div className="enac-web-alert enac-web-alert--compact">
            <strong>Baixa manual bloqueada</strong>
            <ul>
              {bloqueiosBaixa.map((bloqueio) => <li key={bloqueio}>{bloqueio}</li>)}
            </ul>
          </div>
        )}

        {baixaElegivel && (
          <form className="enac-cadastro-form enac-finance-edit-form" onSubmit={onBaixarManual}>
            <div className="enac-cadastro-form-grid">
              <label>
                <span>Data da baixa<strong className="enac-cadastro-required">Obrigatório</strong></span>
                <input type="date" value={baixaForm.data_baixa} onChange={(event) => onBaixaChange('data_baixa', event.target.value)} disabled={saving} required />
              </label>
              <label>
                <span>Valor<strong className="enac-cadastro-required">Obrigatório</strong></span>
                <input type="number" min="0.01" step="0.01" value={baixaForm.valor_baixado} onChange={(event) => onBaixaChange('valor_baixado', event.target.value)} disabled={saving} required />
              </label>
              <label>
                <span>Forma manual<strong className="enac-cadastro-required">Obrigatório</strong></span>
                <input value={baixaForm.forma_pagamento_manual} onChange={(event) => onBaixaChange('forma_pagamento_manual', event.target.value)} disabled={saving} required />
              </label>
              <label>
                <span>Referência de anexo</span>
                <input value={baixaForm.referencia_anexo} onChange={(event) => onBaixaChange('referencia_anexo', event.target.value)} disabled={saving} />
              </label>
              <label className="enac-solicitacao-span-2">
                <span>Observação<strong className="enac-cadastro-required">Obrigatório</strong></span>
                <textarea value={baixaForm.observacoes} onChange={(event) => onBaixaChange('observacoes', event.target.value)} disabled={saving} required />
              </label>
            </div>
            <div className="enac-cadastro-actions">
              <button type="submit" disabled={saving || !approvalUserId || !baixaForm.data_baixa || !baixaForm.valor_baixado || !baixaForm.forma_pagamento_manual || !baixaForm.observacoes}>
                {saving ? 'Registrando...' : 'Registrar baixa manual'}
              </button>
            </div>
          </form>
        )}

        {conta.status === 'BAIXADA_MANUAL' && (
          <form className="enac-cadastro-form enac-finance-edit-form" onSubmit={onEstornarBaixa}>
            <div className="enac-cadastro-form-grid">
              <label className="enac-solicitacao-span-2">
                <span>Motivo do estorno<strong className="enac-cadastro-required">Obrigatório</strong></span>
                <textarea value={baixaForm.motivo_estorno} onChange={(event) => onBaixaChange('motivo_estorno', event.target.value)} disabled={saving} required />
              </label>
            </div>
            <div className="enac-cadastro-actions">
              <button type="submit" className="enac-cadastro-secondary" disabled={saving || !approvalUserId || !baixaForm.motivo_estorno}>
                {saving ? 'Estornando...' : 'Estornar baixa'}
              </button>
            </div>
          </form>
        )}

        <BaixasHistory baixas={baixas} />
      </section>

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

function BaixasHistory({ baixas }: { baixas: ContaPagarBaixaApi[] }): JSX.Element {
  if (baixas.length === 0) {
    return <div className="enac-cadastro-empty">Nenhum histórico de baixa manual registrado.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap enac-finance-baixa-history">
      <table className="enac-web-table enac-finance-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Ação</th>
            <th>Status</th>
            <th>Responsável</th>
            <th>Valor</th>
            <th>Resultado</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {baixas.map((baixa) => (
            <tr key={baixa.id}>
              <td>{formatDate(baixa.created_at)}</td>
              <td>{baixa.acao}</td>
              <td>{baixa.baixa_status}</td>
              <td>{baixa.usuario_nome || baixa.usuario_id || '-'}</td>
              <td>{formatMoney(baixa.valor_baixado)}</td>
              <td>{baixa.resultado}</td>
              <td>{baixa.observacoes || baixa.motivo || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
