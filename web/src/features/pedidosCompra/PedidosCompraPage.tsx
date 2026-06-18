import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type CotacaoApi,
  type EmpresaApi,
  type FornecedorApi,
  type ObraApi,
  type PedidoCompraApi,
  type PedidoCompraStatus,
  type UsuarioApi
} from '../../services/erpApi';

interface PedidoFilters {
  status: PedidoCompraStatus | '';
  fornecedor_id: string;
  obra_id: string;
  centro_custo_id: string;
}

interface GenerateForm {
  cotacao_id: string;
  titulo: string;
  data_emissao: string;
  data_entrega_prevista: string;
  condicao_pagamento: string;
  observacoes: string;
}

interface EditForm {
  titulo: string;
  data_emissao: string;
  data_entrega_prevista: string;
  condicao_pagamento: string;
  observacoes: string;
}

const marker = 'DEV_LOCAL_V3_4C';

const statusLabels: Record<PedidoCompraStatus, string> = {
  RASCUNHO: 'Rascunho',
  EMITIDO: 'Emitido',
  ENVIADO_FORNECEDOR: 'Enviado ao fornecedor',
  CONFIRMADO: 'Confirmado',
  PARCIALMENTE_RECEBIDO: 'Parcialmente recebido',
  RECEBIDO: 'Recebido',
  CANCELADO: 'Cancelado'
};

const aprovacaoLabels: Record<string, string> = {
  PENDENTE_APROVACAO: 'Pendente',
  APROVADO_TECNICO: 'Aprovado técnico',
  APROVADO_DIRETORIA: 'Aprovado diretoria',
  REPROVADO: 'Reprovado',
  DEVOLVIDO: 'Devolvido',
  BLOQUEADO_ALCADA: 'Bloqueado por alçada'
};

const emptyFilters = (): PedidoFilters => ({
  status: '',
  fornecedor_id: '',
  obra_id: '',
  centro_custo_id: ''
});

const emptyGenerateForm = (): GenerateForm => ({
  cotacao_id: '',
  titulo: `${marker} - pedido de compra local`,
  data_emissao: new Date().toISOString().slice(0, 10),
  data_entrega_prevista: '',
  condicao_pagamento: '',
  observacoes: `${marker} - pedido local sem NF e sem financeiro`
});

const buildEditForm = (pedido: PedidoCompraApi | null): EditForm => ({
  titulo: pedido?.titulo || '',
  data_emissao: pedido?.data_emissao ? pedido.data_emissao.slice(0, 10) : '',
  data_entrega_prevista: pedido?.data_entrega_prevista ? pedido.data_entrega_prevista.slice(0, 10) : '',
  condicao_pagamento: pedido?.condicao_pagamento || '',
  observacoes: pedido?.observacoes || ''
});

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

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const canEdit = (pedido: PedidoCompraApi | null): boolean => pedido?.status === 'RASCUNHO';
const canCancel = (pedido: PedidoCompraApi): boolean => ['RASCUNHO', 'EMITIDO', 'ENVIADO_FORNECEDOR'].includes(pedido.status);
type PedidoView = 'consulta' | 'novo' | 'detalhe';

export function PedidosCompraPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [cotacoesElegiveis, setCotacoesElegiveis] = React.useState<CotacaoApi[]>([]);
  const [pedidos, setPedidos] = React.useState<PedidoCompraApi[]>([]);
  const [selectedPedido, setSelectedPedido] = React.useState<PedidoCompraApi | null>(null);
  const [selectedCotacao, setSelectedCotacao] = React.useState<CotacaoApi | null>(null);
  const [filters, setFilters] = React.useState<PedidoFilters>(emptyFilters());
  const [generateForm, setGenerateForm] = React.useState<GenerateForm>(emptyGenerateForm());
  const [editForm, setEditForm] = React.useState<EditForm>(buildEditForm(null));
  const [approvalUserId, setApprovalUserId] = React.useState<string>('');
  const [cancelTarget, setCancelTarget] = React.useState<PedidoCompraApi | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<PedidoView>('consulta');

  const empresa = empresas[0];

  const loadPedidos = React.useCallback(async (nextFilters: PedidoFilters): Promise<void> => {
    const response = await erpApi.pedidosCompra.list(nextFilters);
    setPedidos(response);
  }, []);

  const loadReferences = React.useCallback(async (): Promise<void> => {
    const [empresasResponse, fornecedoresResponse, obrasResponse, centrosResponse, cotacoesResponse, usuariosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.fornecedores.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.cotacoes.list({ status: 'FORNECEDOR_ESCOLHIDO' }),
      erpApi.usuarios.list()
    ]);
    setEmpresas(empresasResponse);
    setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
    setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setCentrosCusto(centrosResponse.filter((centro) => centro.status !== 'inativo'));
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setCotacoesElegiveis(cotacoesResponse.filter((cotacao) => ['APROVADO_TECNICO', 'APROVADO_DIRETORIA'].includes(String(cotacao.aprovacao_status || ''))));
    setGenerateForm((current) => ({
      ...current,
      cotacao_id: current.cotacao_id || cotacoesResponse.find((cotacao) => ['APROVADO_TECNICO', 'APROVADO_DIRETORIA'].includes(String(cotacao.aprovacao_status || '')))?.id || ''
    }));
    setApprovalUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, []);

  React.useEffect(() => {
    let active = true;
    Promise.all([loadReferences(), loadPedidos(emptyFilters())])
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
  }, [loadReferences, loadPedidos]);

  React.useEffect(() => {
    setEditForm(buildEditForm(selectedPedido));
  }, [selectedPedido]);

  React.useEffect(() => {
    if (!generateForm.cotacao_id) {
      setSelectedCotacao(null);
      return;
    }
    let active = true;
    erpApi.cotacoes.get(generateForm.cotacao_id)
      .then((cotacao) => {
        if (active) {
          setSelectedCotacao(cotacao);
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
  }, [generateForm.cotacao_id]);

  const refresh = async (pedidoId = selectedPedido?.id): Promise<void> => {
    setError('');
    await Promise.all([loadReferences(), loadPedidos(filters)]);
    if (pedidoId) {
      setSelectedPedido(await erpApi.pedidosCompra.get(pedidoId));
    }
  };

  const updateFilters = (field: keyof PedidoFilters, value: string): void => {
    const nextFilters = { ...filters, [field]: value } as PedidoFilters;
    setFilters(nextFilters);
    void loadPedidos(nextFilters).catch((filterError) => setError(getErrorMessage(filterError)));
  };

  const selectPedido = async (pedido: PedidoCompraApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      setSelectedPedido(await erpApi.pedidosCompra.get(pedido.id));
      setActiveView('detalhe');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const generatePedido = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !empresa) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!generateForm.cotacao_id) {
        throw new Error('Selecione uma cotação com fornecedor vencedor.');
      }
      const pedido = await erpApi.pedidosCompra.gerarDaCotacao({
        company_id: empresa.id,
        cotacao_id: generateForm.cotacao_id,
        titulo: generateForm.titulo,
        data_emissao: generateForm.data_emissao || null,
        data_entrega_prevista: generateForm.data_entrega_prevista || null,
        condicao_pagamento: generateForm.condicao_pagamento || null,
        observacoes: generateForm.observacoes || null
      });
      setSelectedPedido(pedido);
      setActiveView('detalhe');
      setGenerateForm(emptyGenerateForm());
      setMessage('Pedido de compra gerado em rascunho.');
      await refresh(pedido.id);
    } catch (generateError) {
      setError(getErrorMessage(generateError));
    } finally {
      setSaving(false);
    }
  };

  const savePedido = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !selectedPedido) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const pedido = await erpApi.pedidosCompra.update(selectedPedido.id, {
        titulo: editForm.titulo,
        data_emissao: editForm.data_emissao || null,
        data_entrega_prevista: editForm.data_entrega_prevista || null,
        condicao_pagamento: editForm.condicao_pagamento || null,
        observacoes: editForm.observacoes || null
      });
      setSelectedPedido(pedido);
      setMessage('Pedido atualizado.');
      await refresh(pedido.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (pedido: PedidoCompraApi, action: 'emitir' | 'enviar-fornecedor' | 'confirmar' | 'cancelar'): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.pedidosCompra.transition(pedido.id, action);
      setSelectedPedido(updated);
      setCancelTarget(null);
      setMessage('Status do pedido atualizado.');
      await refresh(updated.id);
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const approvePedido = async (pedido: PedidoCompraApi, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<void> => {
    if (saving || !approvalUserId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.pedidosCompra.aprovar(pedido.id, action, {
        usuario_id: approvalUserId,
        observacoes: `${marker} - aprovacao local por alcada`
      });
      setSelectedPedido(updated);
      setMessage('Aprovação registrada.');
      await refresh(updated.id);
    } catch (approveError) {
      setError(getErrorMessage(approveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="enac-web-page enac-pedidos-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Pedidos de Compra</h1>
      <p className="enac-web-lead">
        Pedido de Compra MVP gerado a partir de cotação com fornecedor vencedor, sem nota fiscal e sem financeiro.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando pedidos locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {empresa && (
        <div className="enac-cadastros-context">
          <strong>{empresa.nome_fantasia || empresa.razao_social}</strong>
          <span>{empresa.cnpj}</span>
        </div>
      )}

      {!loading && (
        <div className="enac-module-workspace">
          <div className="enac-ui-tabs" role="tablist" aria-label="Pedidos de compra">
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
          <section className="enac-pedidos-main enac-module-panel" aria-label="Lista e detalhe de pedidos de compra">
            {activeView === 'consulta' && (
              <>
            <PedidoFiltersBar
              filters={filters}
              fornecedores={fornecedores}
              obras={obras}
              centrosCusto={centrosCusto}
              saving={saving}
              onChange={updateFilters}
            />

            <div className="enac-cadastro-toolbar">
              <div>
                <h2>Lista de pedidos</h2>
                <p>{pedidos.length} pedido(s) encontrado(s)</p>
              </div>
              <button type="button" className="enac-cadastro-secondary" onClick={() => void refresh()} disabled={saving}>
                Atualizar
              </button>
            </div>

            <PedidosTable pedidos={pedidos} selectedId={selectedPedido?.id} saving={saving} onSelect={(pedido) => void selectPedido(pedido)} />
              </>
            )}

            {activeView === 'detalhe' && selectedPedido && (
              <PedidoDetail
                pedido={selectedPedido}
                editForm={editForm}
                saving={saving}
                cancelTarget={cancelTarget}
                usuarios={usuarios}
                approvalUserId={approvalUserId}
                onEditChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))}
                onSave={(event) => void savePedido(event)}
                onApprovalUserChange={setApprovalUserId}
                onApprove={(pedido, action) => void approvePedido(pedido, action)}
                onTransition={(pedido, action) => action === 'cancelar' ? setCancelTarget(pedido) : void transition(pedido, action)}
                onConfirmCancel={(pedido) => void transition(pedido, 'cancelar')}
                onDismissCancel={() => setCancelTarget(null)}
              />
            )}
            {activeView === 'detalhe' && !selectedPedido && (
              <div className="enac-cadastro-empty">Selecione um pedido na aba Consulta para visualizar detalhes e ações.</div>
            )}
          </section>
          )}

          {activeView === 'novo' && (
          <section className="enac-pedidos-panel enac-module-panel" aria-label="Gerar pedido de compra">
            <form className="enac-cadastro-form enac-pedido-form" onSubmit={(event) => void generatePedido(event)}>
              <div className="enac-cadastro-form-head">
                <h3>Gerar pedido</h3>
              </div>

              <div className="enac-cadastro-form-grid">
                <label className="enac-solicitacao-span-2">
                  <span>Cotação vencedora<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <select
                    value={generateForm.cotacao_id}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, cotacao_id: event.target.value }))}
                    disabled={saving}
                    required
                  >
                    <option value="">Selecione</option>
                    {cotacoesElegiveis.map((cotacao) => (
                      <option key={cotacao.id} value={cotacao.id}>
                        {cotacao.codigo} - {cotacao.titulo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Título<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input
                    value={generateForm.titulo}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, titulo: event.target.value }))}
                    disabled={saving}
                    required
                  />
                </label>
                <label>
                  <span>Emissão</span>
                  <input
                    type="date"
                    value={generateForm.data_emissao}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, data_emissao: event.target.value }))}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Entrega prevista</span>
                  <input
                    type="date"
                    value={generateForm.data_entrega_prevista}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, data_entrega_prevista: event.target.value }))}
                    disabled={saving}
                  />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Condição de pagamento</span>
                  <input
                    value={generateForm.condicao_pagamento}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, condicao_pagamento: event.target.value }))}
                    disabled={saving}
                  />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea
                    value={generateForm.observacoes}
                    onChange={(event) => setGenerateForm((current) => ({ ...current, observacoes: event.target.value }))}
                    disabled={saving}
                  />
                </label>
              </div>

              {selectedCotacao && <CotacaoPreview cotacao={selectedCotacao} />}

              <div className="enac-cadastro-actions">
                <button type="submit" disabled={saving || !generateForm.cotacao_id || !generateForm.titulo.trim()}>
                  {saving ? 'Gerando...' : 'Gerar pedido'}
                </button>
              </div>
            </form>
          </section>
          )}
        </div>
      )}
    </section>
  );
}

function PedidoFiltersBar({
  filters,
  fornecedores,
  obras,
  centrosCusto,
  saving,
  onChange
}: {
  filters: PedidoFilters;
  fornecedores: FornecedorApi[];
  obras: ObraApi[];
  centrosCusto: CentroCustoApi[];
  saving: boolean;
  onChange: (field: keyof PedidoFilters, value: string) => void;
}): JSX.Element {
  return (
    <div className="enac-solicitacoes-filters">
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => onChange('status', event.target.value)} disabled={saving}>
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
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
        <span>Centro de custo</span>
        <select value={filters.centro_custo_id} onChange={(event) => onChange('centro_custo_id', event.target.value)} disabled={saving}>
          <option value="">Todos</option>
          {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
        </select>
      </label>
    </div>
  );
}

function PedidosTable({
  pedidos,
  selectedId,
  saving,
  onSelect
}: {
  pedidos: PedidoCompraApi[];
  selectedId?: string;
  saving: boolean;
  onSelect: (pedido: PedidoCompraApi) => void;
}): JSX.Element {
  if (pedidos.length === 0) {
    return <div className="enac-cadastro-empty">Nenhum pedido de compra encontrado.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-pedidos-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Título</th>
            <th>Status</th>
            <th>Aprovação</th>
            <th>Fornecedor</th>
            <th>Obra</th>
            <th>Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className={selectedId === pedido.id ? 'enac-pedido-row-selected' : ''}>
              <td><strong>{pedido.codigo}</strong></td>
              <td>{pedido.titulo}</td>
              <td>
                <span className={`enac-pedido-status enac-pedido-status--${statusClass(pedido.status)}`}>
                  {statusLabels[pedido.status]}
                </span>
              </td>
              <td>{pedido.aprovacao_status ? aprovacaoLabels[pedido.aprovacao_status] || pedido.aprovacao_status : '-'}</td>
              <td>{pedido.fornecedor_nome}</td>
              <td>{pedido.obra_codigo || '-'}</td>
              <td>{formatMoney(pedido.valor_total)}</td>
              <td>
                <button type="button" onClick={() => onSelect(pedido)} disabled={saving}>Detalhe</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PedidoDetail({
  pedido,
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
  pedido: PedidoCompraApi;
  editForm: EditForm;
  saving: boolean;
  cancelTarget: PedidoCompraApi | null;
  usuarios: UsuarioApi[];
  approvalUserId: string;
  onEditChange: (field: keyof EditForm, value: string) => void;
  onSave: (event: React.FormEvent) => void;
  onApprovalUserChange: (value: string) => void;
  onApprove: (pedido: PedidoCompraApi, action: 'aprovar-tecnico' | 'aprovar-diretoria') => void;
  onTransition: (pedido: PedidoCompraApi, action: 'emitir' | 'enviar-fornecedor' | 'confirmar' | 'cancelar') => void;
  onConfirmCancel: (pedido: PedidoCompraApi) => void;
  onDismissCancel: () => void;
}): JSX.Element {
  return (
    <section className="enac-pedido-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <span className="enac-web-card-label">{pedido.codigo}</span>
          <h2>{pedido.titulo}</h2>
          <p>{pedido.fornecedor_nome} · {formatMoney(pedido.valor_total)}</p>
        </div>
        <span className={`enac-pedido-status enac-pedido-status--${statusClass(pedido.status)}`}>
          {statusLabels[pedido.status]}
        </span>
      </div>

      <div className="enac-pedido-meta">
        <div><span>Solicitação</span><strong>{pedido.solicitacao_codigo || '-'}</strong></div>
        <div><span>Cotação</span><strong>{pedido.cotacao_codigo || '-'}</strong></div>
        <div><span>Obra</span><strong>{pedido.obra_codigo || '-'}</strong></div>
        <div><span>Centro de custo</span><strong>{pedido.centro_custo_codigo || '-'}</strong></div>
        <div><span>Emissão</span><strong>{formatDate(pedido.data_emissao)}</strong></div>
        <div><span>Entrega</span><strong>{formatDate(pedido.data_entrega_prevista)}</strong></div>
        <div><span>Aprovação</span><strong>{pedido.aprovacao_status ? aprovacaoLabels[pedido.aprovacao_status] || pedido.aprovacao_status : '-'}</strong></div>
        <div><span>Aprovador</span><strong>{pedido.aprovado_por_nome || '-'}</strong></div>
      </div>

      {pedido.status === 'RASCUNHO' && (
        <div className="enac-cadastro-row-actions enac-pedido-actions">
          <label>
            <span>Aprovador</span>
            <select value={approvalUserId} onChange={(event) => onApprovalUserChange(event.target.value)} disabled={saving}>
              <option value="">Selecione</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => onApprove(pedido, 'aprovar-tecnico')} disabled={saving || !approvalUserId}>Aprovar técnico</button>
          <button type="button" onClick={() => onApprove(pedido, 'aprovar-diretoria')} disabled={saving || !approvalUserId}>Aprovar diretoria</button>
        </div>
      )}

      <div className="enac-cadastro-row-actions enac-pedido-actions">
        {pedido.status === 'RASCUNHO' && <button type="button" onClick={() => onTransition(pedido, 'emitir')} disabled={saving}>Emitir</button>}
        {pedido.status === 'EMITIDO' && <button type="button" onClick={() => onTransition(pedido, 'enviar-fornecedor')} disabled={saving}>Enviar ao fornecedor</button>}
        {pedido.status === 'ENVIADO_FORNECEDOR' && <button type="button" onClick={() => onTransition(pedido, 'confirmar')} disabled={saving}>Confirmar</button>}
        {canCancel(pedido) && <button type="button" onClick={() => onTransition(pedido, 'cancelar')} disabled={saving}>Cancelar</button>}
      </div>

      {cancelTarget?.id === pedido.id && (
        <div className="enac-web-alert enac-web-alert--compact">
          <strong>Confirmar cancelamento do pedido?</strong>
          <p>O pedido ficará `CANCELADO` e não poderá ser editado nesta etapa.</p>
          <div className="enac-cadastro-row-actions">
            <button type="button" onClick={() => onConfirmCancel(pedido)} disabled={saving}>Confirmar cancelamento</button>
            <button type="button" className="enac-cadastro-secondary" onClick={onDismissCancel} disabled={saving}>Manter pedido</button>
          </div>
        </div>
      )}

      {canEdit(pedido) && (
        <form className="enac-cadastro-form enac-pedido-edit-form" onSubmit={onSave}>
          <div className="enac-cadastro-form-head">
            <h3>Editar rascunho</h3>
          </div>
          <div className="enac-cadastro-form-grid">
            <label className="enac-solicitacao-span-2">
              <span>Título</span>
              <input value={editForm.titulo} onChange={(event) => onEditChange('titulo', event.target.value)} disabled={saving} />
            </label>
            <label>
              <span>Emissão</span>
              <input type="date" value={editForm.data_emissao} onChange={(event) => onEditChange('data_emissao', event.target.value)} disabled={saving} />
            </label>
            <label>
              <span>Entrega prevista</span>
              <input type="date" value={editForm.data_entrega_prevista} onChange={(event) => onEditChange('data_entrega_prevista', event.target.value)} disabled={saving} />
            </label>
            <label className="enac-solicitacao-span-2">
              <span>Condição de pagamento</span>
              <input value={editForm.condicao_pagamento} onChange={(event) => onEditChange('condicao_pagamento', event.target.value)} disabled={saving} />
            </label>
            <label className="enac-solicitacao-span-2">
              <span>Observações</span>
              <textarea value={editForm.observacoes} onChange={(event) => onEditChange('observacoes', event.target.value)} disabled={saving} />
            </label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving || !editForm.titulo.trim()}>{saving ? 'Salvando...' : 'Salvar rascunho'}</button>
          </div>
        </form>
      )}

      <PedidoItemsTable pedido={pedido} />
    </section>
  );
}

function PedidoItemsTable({ pedido }: { pedido: PedidoCompraApi }): JSX.Element {
  const itens = pedido.itens || [];
  if (itens.length === 0) {
    return <div className="enac-cadastro-empty">Pedido sem itens herdados.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-pedidos-itens-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qtd.</th>
            <th>Un.</th>
            <th>Valor unitário</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.descricao}</strong></td>
              <td>{Number(item.quantidade).toLocaleString('pt-BR')}</td>
              <td>{item.unidade}</td>
              <td>{formatMoney(item.valor_unitario)}</td>
              <td>{formatMoney(item.valor_total)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4}><strong>Total</strong></td>
            <td><strong>{formatMoney(pedido.valor_total)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CotacaoPreview({ cotacao }: { cotacao: CotacaoApi }): JSX.Element {
  return (
    <div className="enac-pedido-cotacao-preview">
      <span className="enac-web-card-label">{cotacao.codigo}</span>
      <strong>{cotacao.titulo}</strong>
      <p>{cotacao.fornecedor_vencedor_nome || 'Fornecedor vencedor definido no mapa'} · {formatMoney(cotacao.valor_total)}</p>
    </div>
  );
}
