import * as React from 'react';
import {
  erpApi,
  type ContaPagarElegibilidadeApi,
  type FornecedorApi,
  type ObraApi,
  type ProgramacaoPagamentoApi,
  type ProgramacaoPagamentoConferenciaChecklist,
  type ProgramacaoPagamentoStatus,
  type UsuarioApi
} from '../../services/erpApi';

interface ProgramacaoForm {
  data_prevista: string;
  forma_pagamento_prevista: string;
  observacoes: string;
  justificativa: string;
}

const marker = 'DEV_LOCAL_V3_5F';

const statusLabels: Record<ProgramacaoPagamentoStatus, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDA: 'Submetida',
  APROVADA: 'Aprovada',
  LIBERADA: 'Liberada',
  REPROVADA: 'Reprovada',
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

const conferenciaLabels: Record<string, string> = {
  PENDENTE_CONFERENCIA: 'Pendente',
  CONFERIDA: 'Conferida',
  BLOQUEADA_CONFERENCIA: 'Bloqueada',
  DEVOLVIDA: 'Devolvida'
};

const initialChecklist = (): ProgramacaoPagamentoConferenciaChecklist => ({
  fornecedor_conferido: true,
  documento_fiscal_conferido: true,
  valor_conferido: true,
  vencimento_conferido: true,
  obra_conferida: true,
  centro_custo_conferido: true,
  forma_pagamento_prevista_conferida: true,
  ressalva: false
});

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const emptyForm = (): ProgramacaoForm => ({
  data_prevista: addDays(5),
  forma_pagamento_prevista: `${marker} - forma prevista local`,
  observacoes: `${marker} - rascunho local sem execucao financeira`,
  justificativa: `${marker} - programacao local para liberacao futura`
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

const formatDateTime = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString('pt-BR') : '-';

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const isActiveDraft = (programacao: ProgramacaoPagamentoApi | null): boolean => programacao?.status === 'RASCUNHO';
type ProgramacaoView = 'consulta' | 'novo' | 'detalhe';

export function ProgramacoesPagamentoPage(): JSX.Element {
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [programacoes, setProgramacoes] = React.useState<ProgramacaoPagamentoApi[]>([]);
  const [contas, setContas] = React.useState<ContaPagarElegibilidadeApi[]>([]);
  const [selectedProgramacao, setSelectedProgramacao] = React.useState<ProgramacaoPagamentoApi | null>(null);
  const [form, setForm] = React.useState<ProgramacaoForm>(emptyForm());
  const [statusFilter, setStatusFilter] = React.useState<ProgramacaoPagamentoStatus | ''>('');
  const [actionUserId, setActionUserId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<ProgramacaoView>('consulta');

  const loadAll = React.useCallback(async (nextStatus = statusFilter): Promise<void> => {
    const [empresasResponse, fornecedoresResponse, obrasResponse, usuariosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.fornecedores.list(),
      erpApi.obras.list(),
      erpApi.usuarios.list()
    ]);
    const companyId = empresasResponse[0]?.id;
    const [programacoesResponse, contasResponse] = await Promise.all([
      erpApi.programacoesPagamento.list({ status: nextStatus }),
      erpApi.programacoesPagamento.contasElegiveis({ company_id: companyId, incluir_bloqueadas: true })
    ]);
    setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
    setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setProgramacoes(programacoesResponse);
    setContas(contasResponse);
    setActionUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'matheus.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, [statusFilter]);

  React.useEffect(() => {
    let active = true;
    loadAll()
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
  }, [loadAll]);

  const refresh = async (programacaoId = selectedProgramacao?.id): Promise<void> => {
    await loadAll();
    if (programacaoId) {
      setSelectedProgramacao(await erpApi.programacoesPagamento.get(programacaoId));
    }
  };

  const runAction = async (callback: () => Promise<ProgramacaoPagamentoApi>, successMessage: string): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await callback();
      setSelectedProgramacao(updated);
      await refresh(updated.id);
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const updateStatusFilter = (value: ProgramacaoPagamentoStatus | ''): void => {
    setStatusFilter(value);
    void loadAll(value).catch((filterError) => setError(getErrorMessage(filterError)));
  };

  const createDraft = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const empresas = await erpApi.empresas.list();
    const companyId = empresas[0]?.id;
    if (!companyId) {
      setError('Nenhuma empresa local encontrada.');
      return;
    }
    await runAction(async () => erpApi.programacoesPagamento.create({
      company_id: companyId,
      data_prevista: form.data_prevista,
      forma_pagamento_prevista: form.forma_pagamento_prevista || null,
      observacoes: form.observacoes || null,
      justificativa: form.justificativa || null,
      usuario_id: actionUserId || null
    }), 'Programação criada em rascunho.');
    setActiveView('detalhe');
    setForm(emptyForm());
  };

  const addConta = async (conta: ContaPagarElegibilidadeApi): Promise<void> => {
    if (!selectedProgramacao) {
      return;
    }
    await runAction(async () => erpApi.programacoesPagamento.adicionarConta(selectedProgramacao.id, {
      conta_pagar_id: conta.id,
      usuario_id: actionUserId || null,
      observacoes: `${marker} - conta adicionada ao rascunho`
    }), 'Conta adicionada à programação.');
  };

  const removeConta = async (contaPagarId: string): Promise<void> => {
    if (!selectedProgramacao) {
      return;
    }
    await runAction(async () => erpApi.programacoesPagamento.removerConta(selectedProgramacao.id, contaPagarId, {
      usuario_id: actionUserId || null,
      observacoes: `${marker} - remocao logica do rascunho`
    }), 'Conta removida logicamente da programação.');
  };

  const selectProgramacao = async (programacao: ProgramacaoPagamentoApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      setSelectedProgramacao(await erpApi.programacoesPagamento.get(programacao.id));
      setActiveView('detalhe');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="enac-web-page enac-finance-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Programação de Pagamento</h1>
      <p className="enac-web-lead">
        Programação local de contas aprovadas com alçada, liberação final e conferência financeira pré-baixa.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando programações locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {!loading && (
        <div className="enac-module-workspace">
          <div className="enac-ui-tabs" role="tablist" aria-label="Programações de pagamento">
            <button type="button" className={activeView === 'consulta' ? 'is-active' : ''} onClick={() => setActiveView('consulta')}>
              Consulta
            </button>
            <button type="button" className={activeView === 'novo' ? 'is-active' : ''} onClick={() => setActiveView('novo')}>
              Novo registro
            </button>
            <button type="button" className={activeView === 'detalhe' ? 'is-active' : ''} onClick={() => setActiveView('detalhe')}>
              Detalhes
            </button>
          </div>

          {activeView !== 'novo' && (
          <section className="enac-finance-main enac-module-panel" aria-label="Lista e detalhe de programações de pagamento">
            {activeView === 'consulta' && (
              <>
            <ProgramacaoFilters status={statusFilter} saving={saving} onStatusChange={updateStatusFilter} onRefresh={() => void refresh()} />
            <ProgramacoesTable
              programacoes={programacoes}
              selectedId={selectedProgramacao?.id}
              saving={saving}
              onSelect={(programacao) => void selectProgramacao(programacao)}
            />
              </>
            )}
            {activeView === 'detalhe' && selectedProgramacao && (
              <section className="enac-page-workarea enac-programacao-workarea" aria-label="Detalhe e contas da programação">
                <div className="enac-list-pane">
                  <ContasElegiveisTable
                    contas={contas}
                    selectedProgramacao={selectedProgramacao}
                    saving={saving}
                    onAdd={(conta) => void addConta(conta)}
                  />
                </div>
              <ProgramacaoDetail
                programacao={selectedProgramacao}
                usuarios={usuarios}
                actionUserId={actionUserId}
                saving={saving}
                onUserChange={setActionUserId}
                onSubmit={() => void runAction(() => erpApi.programacoesPagamento.submeter(selectedProgramacao.id, {
                  usuario_id: actionUserId || null,
                  justificativa: `${marker} - submissao para alcada`
                }), 'Programação submetida para aprovação.')}
                onApproveTecnico={() => void runAction(() => erpApi.programacoesPagamento.aprovar(selectedProgramacao.id, 'aprovar-tecnico', {
                  usuario_id: actionUserId,
                  observacoes: `${marker} - aprovacao tecnica sem pagamento`
                }), 'Aprovação técnica registrada.')}
                onApproveDiretoria={() => void runAction(() => erpApi.programacoesPagamento.aprovar(selectedProgramacao.id, 'aprovar-diretoria', {
                  usuario_id: actionUserId,
                  observacoes: `${marker} - aprovacao diretoria sem pagamento`
                }), 'Aprovação da diretoria registrada.')}
                onReprovar={() => void runAction(() => erpApi.programacoesPagamento.reprovar(selectedProgramacao.id, {
                  usuario_id: actionUserId || null,
                  justificativa: `${marker} - reprovacao local`
                }), 'Programação reprovada.')}
                onLiberar={() => void runAction(() => erpApi.programacoesPagamento.liberar(selectedProgramacao.id, {
                  usuario_id: actionUserId,
                  justificativa: `${marker} - liberacao final local sem execucao financeira`
                }), 'Programação liberada para execução futura.')}
                onConferirFinanceiro={(checklist, observacoes) => void runAction(() => erpApi.programacoesPagamento.conferirFinanceiro(selectedProgramacao.id, {
                  usuario_id: actionUserId,
                  observacoes,
                  checklist
                }), 'Conferência financeira registrada.')}
                onDevolverConferencia={(observacoes) => void runAction(() => erpApi.programacoesPagamento.devolverConferencia(selectedProgramacao.id, {
                  usuario_id: actionUserId,
                  observacoes
                }), 'Conferência devolvida.')}
                onCancelar={() => void runAction(() => erpApi.programacoesPagamento.cancelar(selectedProgramacao.id, {
                  usuario_id: actionUserId || null,
                  justificativa: `${marker} - cancelamento logico`
                }), 'Programação cancelada logicamente.')}
                onRemoveConta={(contaPagarId) => void removeConta(contaPagarId)}
              />
              </section>
            )}
            {activeView === 'detalhe' && !selectedProgramacao && (
              <div className="enac-cadastro-empty">Selecione uma programação na aba Consulta para visualizar detalhes e contas elegíveis.</div>
            )}
          </section>
          )}

          {activeView === 'novo' && (
          <section className="enac-finance-panel enac-module-panel" aria-label="Criar programação de pagamento">
            <form className="enac-cadastro-form enac-finance-form" onSubmit={(event) => void createDraft(event)}>
              <div className="enac-cadastro-form-head"><h3>Novo rascunho</h3></div>
              <div className="enac-cadastro-form-grid">
                <label>
                  <span>Data prevista<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input type="date" value={form.data_prevista} onChange={(event) => setForm({ ...form, data_prevista: event.target.value })} disabled={saving} required />
                </label>
                <label>
                  <span>Forma prevista</span>
                  <input value={form.forma_pagamento_prevista} onChange={(event) => setForm({ ...form, forma_pagamento_prevista: event.target.value })} disabled={saving} />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} disabled={saving} />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Justificativa</span>
                  <textarea value={form.justificativa} onChange={(event) => setForm({ ...form, justificativa: event.target.value })} disabled={saving} />
                </label>
              </div>
              <div className="enac-cadastro-actions">
                <button type="submit" disabled={saving || !form.data_prevista}>{saving ? 'Criando...' : 'Criar rascunho'}</button>
              </div>
            </form>

            <div className="enac-finance-preview">
              <span className="enac-web-card-label">Responsável da ação</span>
              <label className="enac-programacao-user">
                <span>Usuário</span>
                <select value={actionUserId} onChange={(event) => setActionUserId(event.target.value)} disabled={saving}>
                  <option value="">Selecione</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          )}
        </div>
      )}
    </section>
  );
}

function ProgramacaoFilters({
  status,
  saving,
  onStatusChange,
  onRefresh
}: {
  status: ProgramacaoPagamentoStatus | '';
  saving: boolean;
  onStatusChange: (status: ProgramacaoPagamentoStatus | '') => void;
  onRefresh: () => void;
}): JSX.Element {
  return (
    <div className="enac-solicitacoes-filters enac-programacao-filters">
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ProgramacaoPagamentoStatus | '')} disabled={saving}>
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="button" onClick={onRefresh} disabled={saving}>Atualizar</button>
    </div>
  );
}

function ProgramacoesTable({
  programacoes,
  selectedId,
  saving,
  onSelect
}: {
  programacoes: ProgramacaoPagamentoApi[];
  selectedId?: string;
  saving: boolean;
  onSelect: (programacao: ProgramacaoPagamentoApi) => void;
}): JSX.Element {
  if (programacoes.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma programação encontrada.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-programacao-table">
        <thead><tr><th>Código</th><th>Status</th><th>Data prevista</th><th>Fornecedor</th><th>Grupo</th><th>Total</th><th>Ações</th></tr></thead>
        <tbody>
          {programacoes.map((programacao) => (
            <tr key={programacao.id} className={selectedId === programacao.id ? 'enac-finance-row-selected' : ''}>
              <td><strong>{programacao.codigo}</strong></td>
              <td><span className={`enac-finance-status enac-finance-status--${statusClass(programacao.status)}`}>{statusLabels[programacao.status]}</span></td>
              <td>{formatDate(programacao.data_prevista)}</td>
              <td>{programacao.fornecedor_nome || '-'}</td>
              <td>{programacao.obra_codigo || '-'} / {programacao.centro_custo_codigo || '-'}</td>
              <td>{formatMoney(programacao.valor_total)}<br /><span>{programacao.quantidade_contas || 0} conta(s)</span></td>
              <td><button type="button" onClick={() => onSelect(programacao)} disabled={saving}>Detalhe</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgramacaoDetail({
  programacao,
  usuarios,
  actionUserId,
  saving,
  onUserChange,
  onSubmit,
  onApproveTecnico,
  onApproveDiretoria,
  onReprovar,
  onLiberar,
  onConferirFinanceiro,
  onDevolverConferencia,
  onCancelar,
  onRemoveConta
}: {
  programacao: ProgramacaoPagamentoApi;
  usuarios: UsuarioApi[];
  actionUserId: string;
  saving: boolean;
  onUserChange: (value: string) => void;
  onSubmit: () => void;
  onApproveTecnico: () => void;
  onApproveDiretoria: () => void;
  onReprovar: () => void;
  onLiberar: () => void;
  onConferirFinanceiro: (checklist: ProgramacaoPagamentoConferenciaChecklist, observacoes: string) => void;
  onDevolverConferencia: (observacoes: string) => void;
  onCancelar: () => void;
  onRemoveConta: (contaPagarId: string) => void;
}): JSX.Element {
  const contas = programacao.contas || [];
  const [conferenciaObservacoes, setConferenciaObservacoes] = React.useState<string>(`${marker} - conferencia financeira final pre-baixa`);
  const [conferenciaChecklist, setConferenciaChecklist] = React.useState<ProgramacaoPagamentoConferenciaChecklist>(initialChecklist());
  const podeConferir = programacao.status === 'LIBERADA' && programacao.conferencia_status !== 'CONFERIDA';
  const checklistFields: Array<{ key: keyof Omit<ProgramacaoPagamentoConferenciaChecklist, 'ressalva'>; label: string }> = [
    { key: 'fornecedor_conferido', label: 'Fornecedor' },
    { key: 'documento_fiscal_conferido', label: 'Documento fiscal' },
    { key: 'valor_conferido', label: 'Valor' },
    { key: 'vencimento_conferido', label: 'Vencimento' },
    { key: 'obra_conferida', label: 'Obra' },
    { key: 'centro_custo_conferido', label: 'Centro de custo' },
    { key: 'forma_pagamento_prevista_conferida', label: 'Forma prevista' }
  ];

  React.useEffect(() => {
    setConferenciaObservacoes(`${marker} - conferencia financeira final pre-baixa`);
    setConferenciaChecklist(initialChecklist());
  }, [programacao.id]);

  const updateChecklist = (key: keyof ProgramacaoPagamentoConferenciaChecklist, value: boolean): void => {
    setConferenciaChecklist((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="enac-finance-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <span className="enac-web-card-label">{programacao.codigo}</span>
          <h2>{formatDate(programacao.data_prevista)} · {formatMoney(programacao.valor_total)}</h2>
          <p>{programacao.fornecedor_nome || 'Fornecedor agrupado pela primeira conta'}</p>
        </div>
        <span className={`enac-finance-status enac-finance-status--${statusClass(programacao.status)}`}>{statusLabels[programacao.status]}</span>
      </div>

      <div className="enac-finance-meta">
        <div><span>Obra</span><strong>{programacao.obra_codigo || '-'}</strong></div>
        <div><span>Centro de custo</span><strong>{programacao.centro_custo_codigo || '-'}</strong></div>
        <div><span>Forma prevista</span><strong>{programacao.forma_pagamento_prevista || '-'}</strong></div>
        <div><span>Aprovação</span><strong>{programacao.aprovacao_status ? aprovacaoLabels[programacao.aprovacao_status] || programacao.aprovacao_status : '-'}</strong></div>
        <div><span>Aprovador</span><strong>{programacao.aprovado_por_nome || '-'}</strong></div>
        <div><span>Submetido em</span><strong>{programacao.submetido_em ? formatDate(programacao.submetido_em) : '-'}</strong></div>
        <div><span>Liberação</span><strong>{programacao.liberacao_status || '-'}</strong></div>
        <div><span>Liberado por</span><strong>{programacao.liberado_por_nome || '-'}</strong></div>
        <div><span>Liberado em</span><strong>{formatDateTime(programacao.liberado_em)}</strong></div>
        <div><span>Valor liberado</span><strong>{programacao.liberacao_valor_total ? formatMoney(programacao.liberacao_valor_total) : '-'}</strong></div>
        <div><span>Conferência</span><strong>{conferenciaLabels[programacao.conferencia_status || ''] || programacao.conferencia_status || '-'}</strong></div>
        <div><span>Conferente</span><strong>{programacao.conferido_por_nome || '-'}</strong></div>
        <div><span>Conferido em</span><strong>{formatDateTime(programacao.conferido_em)}</strong></div>
        <div><span>Valor conferido</span><strong>{programacao.conferencia_valor_total ? formatMoney(programacao.conferencia_valor_total) : '-'}</strong></div>
      </div>

      {programacao.bloqueio_alcada_motivo && (
        <div className="enac-web-alert enac-web-alert--compact">{programacao.bloqueio_alcada_motivo}</div>
      )}
      {programacao.bloqueio_liberacao_motivo && (
        <div className="enac-web-alert enac-web-alert--compact">{programacao.bloqueio_liberacao_motivo}</div>
      )}
      {programacao.bloqueio_conferencia_motivo && (
        <div className="enac-web-alert enac-web-alert--compact">{programacao.bloqueio_conferencia_motivo}</div>
      )}
      {programacao.liberacao_justificativa && (
        <div className="enac-finance-preview">
          <span className="enac-web-card-label">Justificativa da liberação</span>
          <p>{programacao.liberacao_justificativa}</p>
        </div>
      )}
      {programacao.conferencia_observacoes && (
        <div className="enac-finance-preview">
          <span className="enac-web-card-label">Observações da conferência</span>
          <p>{programacao.conferencia_observacoes}</p>
        </div>
      )}

      <div className="enac-cadastro-row-actions enac-finance-actions">
        <label>
          <span>Usuário</span>
          <select value={actionUserId} onChange={(event) => onUserChange(event.target.value)} disabled={saving}>
            <option value="">Selecione</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>)}
          </select>
        </label>
        {programacao.status === 'RASCUNHO' && <button type="button" onClick={onSubmit} disabled={saving || contas.length === 0}>Submeter</button>}
        {programacao.status === 'SUBMETIDA' && <button type="button" onClick={onApproveTecnico} disabled={saving || !actionUserId}>Aprovar técnico</button>}
        {programacao.status === 'SUBMETIDA' && <button type="button" onClick={onApproveDiretoria} disabled={saving || !actionUserId}>Aprovar diretoria</button>}
        {programacao.status === 'SUBMETIDA' && <button type="button" onClick={onReprovar} disabled={saving}>Reprovar</button>}
        {programacao.status === 'APROVADA' && <button type="button" onClick={onLiberar} disabled={saving || !actionUserId}>Liberar programação</button>}
        {programacao.status !== 'CANCELADA' && <button type="button" className="enac-cadastro-secondary" onClick={onCancelar} disabled={saving}>Cancelar</button>}
      </div>

      {podeConferir && (
        <div className="enac-finance-preview enac-conferencia-panel">
          <div>
            <span className="enac-web-card-label">Conferência financeira</span>
            <p>Status atual: {conferenciaLabels[programacao.conferencia_status || ''] || programacao.conferencia_status || 'Pendente'}</p>
          </div>
          <div className="enac-conferencia-checklist">
            {checklistFields.map((field) => (
              <label key={field.key}>
                <input
                  type="checkbox"
                  checked={conferenciaChecklist[field.key]}
                  onChange={(event) => updateChecklist(field.key, event.target.checked)}
                  disabled={saving}
                />
                <span>{field.label}</span>
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={conferenciaChecklist.ressalva === true}
                onChange={(event) => updateChecklist('ressalva', event.target.checked)}
                disabled={saving}
              />
              <span>Ressalva</span>
            </label>
          </div>
          <label className="enac-conferencia-observacao">
            <span>Observações</span>
            <textarea
              value={conferenciaObservacoes}
              onChange={(event) => setConferenciaObservacoes(event.target.value)}
              disabled={saving}
            />
          </label>
          <div className="enac-cadastro-row-actions enac-conferencia-actions">
            <button type="button" onClick={() => onConferirFinanceiro(conferenciaChecklist, conferenciaObservacoes)} disabled={saving || !actionUserId}>
              Conferir financeiro
            </button>
            <button type="button" className="enac-cadastro-secondary" onClick={() => onDevolverConferencia(conferenciaObservacoes)} disabled={saving || !actionUserId || !conferenciaObservacoes.trim()}>
              Devolver conferência
            </button>
          </div>
        </div>
      )}

      <div className="enac-cadastro-table-wrap">
        <table className="enac-web-table enac-programacao-table">
          <thead><tr><th>Conta</th><th>Fornecedor</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id}>
                <td><strong>{conta.numero_documento}</strong></td>
                <td>{conta.fornecedor_nome || '-'}</td>
                <td>{formatDate(conta.data_vencimento)}</td>
                <td>{formatMoney(conta.valor_programado)}</td>
                <td>{conta.status}</td>
                <td>
                  {programacao.status === 'RASCUNHO' && (
                    <button type="button" onClick={() => onRemoveConta(conta.conta_pagar_id)} disabled={saving}>Remover</button>
                  )}
                </td>
              </tr>
            ))}
            {contas.length === 0 && <tr><td colSpan={6}>Nenhuma conta vinculada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContasElegiveisTable({
  contas,
  selectedProgramacao,
  saving,
  onAdd
}: {
  contas: ContaPagarElegibilidadeApi[];
  selectedProgramacao: ProgramacaoPagamentoApi | null;
  saving: boolean;
  onAdd: (conta: ContaPagarElegibilidadeApi) => void;
}): JSX.Element {
  return (
    <section className="enac-programacao-contas">
      <div className="enac-cadastro-toolbar">
        <div><h2>Contas para programação</h2><p>{contas.length} conta(s) avaliadas</p></div>
      </div>
      <div className="enac-cadastro-table-wrap">
        <table className="enac-web-table enac-programacao-table">
          <thead><tr><th>Conta</th><th>Status</th><th>Fornecedor</th><th>Vencimento</th><th>Valor</th><th>Elegibilidade</th><th>Ações</th></tr></thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id}>
                <td><strong>{conta.numero_documento}</strong></td>
                <td>{conta.status}<br />{conta.aprovacao_status || '-'}</td>
                <td>{conta.fornecedor_nome || '-'}</td>
                <td>{formatDate(conta.data_vencimento)}</td>
                <td>{formatMoney(conta.valor_aberto)}</td>
                <td>
                  {conta.elegivel
                    ? <span className="enac-programacao-ok">Elegível</span>
                    : <span className="enac-programacao-block">{conta.bloqueios[0] || 'Bloqueada'}</span>}
                </td>
                <td>
                  <button type="button" onClick={() => onAdd(conta)} disabled={saving || !isActiveDraft(selectedProgramacao) || !conta.elegivel}>
                    Adicionar
                  </button>
                </td>
              </tr>
            ))}
            {contas.length === 0 && <tr><td colSpan={7}>Nenhuma conta encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
