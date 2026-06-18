import * as React from 'react';
import {
  erpApi,
  type CotacaoApi,
  type CotacaoFornecedorApi,
  type CotacaoStatus,
  type EmpresaApi,
  type FornecedorApi,
  type MapaComparativoApi,
  type SolicitacaoCompraApi,
  type SolicitacaoCompraItemApi,
  type UsuarioApi
} from '../../services/erpApi';

interface CreateFormState {
  titulo: string;
  prazo_resposta: string;
  observacoes: string;
}

interface ItemResponseState {
  valor_unitario: string;
  marca_modelo: string;
  prazo_entrega_dias: string;
  observacoes: string;
}

type ResponseState = Record<string, Record<string, ItemResponseState>>;

const marker = 'DEV_LOCAL_V3_4B';

const statusLabels: Record<CotacaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA_FORNECEDORES: 'Enviada aos fornecedores',
  RESPOSTAS_RECEBIDAS: 'Respostas recebidas',
  MAPA_GERADO: 'Mapa gerado',
  FORNECEDOR_ESCOLHIDO: 'Fornecedor escolhido',
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

const solicitacaoStatusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  EM_ANALISE: 'Em análise',
  APROVADA_PARA_COTACAO: 'Aprovada para cotação',
  DEVOLVIDA: 'Devolvida',
  CANCELADA: 'Cancelada'
};

const emptyCreateForm = (): CreateFormState => ({
  titulo: `${marker} - cotacao operacional`,
  prazo_resposta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  observacoes: `${marker} - cotacao local sem pedido de compra`
});

const emptyItemResponse = (): ItemResponseState => ({
  valor_unitario: '0',
  marca_modelo: '',
  prazo_entrega_dias: '',
  observacoes: `${marker} - resposta local`
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

const normalizeDecimal = (value: string): number => {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    throw new Error('Informe valores numéricos válidos nas respostas dos fornecedores.');
  }
  return parsed;
};

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const canCreateCotacao = (solicitacao: SolicitacaoCompraApi | null): boolean =>
  Boolean(solicitacao && solicitacao.status !== 'CANCELADA');

const canCancel = (cotacao: CotacaoApi): boolean =>
  ['RASCUNHO', 'ENVIADA_FORNECEDORES', 'RESPOSTAS_RECEBIDAS', 'MAPA_GERADO'].includes(cotacao.status);

const toSolicitacaoLabel = (solicitacao: SolicitacaoCompraApi): string =>
  `${solicitacao.codigo} - ${solicitacao.titulo} (${solicitacaoStatusLabels[solicitacao.status] || solicitacao.status})`;

const buildInitialResponses = (cotacao: CotacaoApi, itens: SolicitacaoCompraItemApi[]): ResponseState => {
  const initial: ResponseState = {};
  (cotacao.fornecedores || []).forEach((fornecedor, fornecedorIndex) => {
    initial[fornecedor.fornecedor_id] = {};
    itens.forEach((item, itemIndex) => {
      const savedItem = (cotacao.itens || []).find(
        (cotacaoItem) =>
          cotacaoItem.fornecedor_id === fornecedor.fornecedor_id &&
          cotacaoItem.solicitacao_item_id === item.id
      );
      const suggestedValue = fornecedorIndex === 0 ? 12 + itemIndex : 10 + itemIndex;
      initial[fornecedor.fornecedor_id][item.id] = {
        valor_unitario: savedItem ? String(savedItem.valor_unitario) : String(suggestedValue),
        marca_modelo: savedItem?.marca_modelo || `${marker} - marca local`,
        prazo_entrega_dias: savedItem?.prazo_entrega_dias ? String(savedItem.prazo_entrega_dias) : '5',
        observacoes: savedItem?.observacoes || `${marker} - resposta fornecedor local`
      };
    });
  });
  return initial;
};

export function CotacoesMapaPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [solicitacoes, setSolicitacoes] = React.useState<SolicitacaoCompraApi[]>([]);
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [selectedSolicitacaoId, setSelectedSolicitacaoId] = React.useState<string>('');
  const [selectedSolicitacao, setSelectedSolicitacao] = React.useState<SolicitacaoCompraApi | null>(null);
  const [cotacoes, setCotacoes] = React.useState<CotacaoApi[]>([]);
  const [selectedCotacao, setSelectedCotacao] = React.useState<CotacaoApi | null>(null);
  const [mapa, setMapa] = React.useState<MapaComparativoApi | null>(null);
  const [createForm, setCreateForm] = React.useState<CreateFormState>(emptyCreateForm());
  const [supplierSelection, setSupplierSelection] = React.useState<Set<string>>(new Set());
  const [responses, setResponses] = React.useState<ResponseState>({});
  const [justificativa, setJustificativa] = React.useState<string>(`${marker} - menor valor total escolhido no mapa`);
  const [approvalUserId, setApprovalUserId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const empresa = empresas[0];
  const solicitationItems = selectedSolicitacao?.itens || [];

  const loadCotacoes = React.useCallback(async (solicitacaoId: string): Promise<void> => {
    if (!solicitacaoId) {
      setCotacoes([]);
      setSelectedCotacao(null);
      setMapa(null);
      return;
    }
    const response = await erpApi.cotacoes.list({ solicitacao_id: solicitacaoId });
    setCotacoes(response);
    if (response.length === 0) {
      setSelectedCotacao(null);
      setMapa(null);
    }
  }, []);

  const loadCotacaoDetail = React.useCallback(async (cotacaoId: string): Promise<void> => {
    const detail = await erpApi.cotacoes.get(cotacaoId);
    setSelectedCotacao(detail);
    setResponses(buildInitialResponses(detail, solicitationItems));
    try {
      setMapa(await erpApi.cotacoes.mapaComparativo(cotacaoId));
    } catch {
      setMapa(null);
    }
  }, [solicitationItems]);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      erpApi.empresas.list(),
      erpApi.solicitacoesCompra.list(),
      erpApi.fornecedores.list(),
      erpApi.usuarios.list()
    ])
      .then(([empresasResponse, solicitacoesResponse, fornecedoresResponse, usuariosResponse]) => {
        if (!active) {
          return;
        }
        setEmpresas(empresasResponse);
        setSolicitacoes(solicitacoesResponse);
        setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
        setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
        setApprovalUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
        const firstEligible = solicitacoesResponse.find((solicitacao) => solicitacao.status !== 'CANCELADA') || solicitacoesResponse[0];
        setSelectedSolicitacaoId(firstEligible?.id || '');
      })
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
  }, []);

  React.useEffect(() => {
    let active = true;
    if (!selectedSolicitacaoId) {
      setSelectedSolicitacao(null);
      return;
    }

    erpApi.solicitacoesCompra.get(selectedSolicitacaoId)
      .then((solicitacao) => {
        if (active) {
          setSelectedSolicitacao(solicitacao);
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
  }, [selectedSolicitacaoId]);

  React.useEffect(() => {
    void loadCotacoes(selectedSolicitacaoId).catch((loadError) => setError(getErrorMessage(loadError)));
  }, [loadCotacoes, selectedSolicitacaoId]);

  const refresh = async (cotacaoId = selectedCotacao?.id): Promise<void> => {
    setError('');
    await loadCotacoes(selectedSolicitacaoId);
    if (cotacaoId) {
      await loadCotacaoDetail(cotacaoId);
    }
  };

  const toggleSupplier = (fornecedorId: string): void => {
    setSupplierSelection((current) => {
      const next = new Set(current);
      if (next.has(fornecedorId)) {
        next.delete(fornecedorId);
      } else {
        next.add(fornecedorId);
      }
      return next;
    });
  };

  const createCotacao = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !empresa || !selectedSolicitacao) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!canCreateCotacao(selectedSolicitacao)) {
        throw new Error('Solicitação cancelada não permite cotação.');
      }
      if (supplierSelection.size === 0) {
        throw new Error('Selecione pelo menos um fornecedor.');
      }
      const created = await erpApi.cotacoes.create({
        company_id: empresa.id,
        solicitacao_id: selectedSolicitacao.id,
        titulo: createForm.titulo,
        prazo_resposta: createForm.prazo_resposta || null,
        observacoes: createForm.observacoes || null,
        fornecedores: Array.from(supplierSelection).map((fornecedorId) => ({ fornecedor_id: fornecedorId }))
      });
      setCreateForm(emptyCreateForm());
      setSupplierSelection(new Set());
      setMessage('Cotação criada em rascunho.');
      await refresh(created.id);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (cotacao: CotacaoApi, action: 'enviar-fornecedores' | 'gerar-mapa' | 'cancelar'): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await erpApi.cotacoes.transition(cotacao.id, action, {
        justificativa: `${marker} - transicao local ${action}`
      });
      setMessage('Status da cotação atualizado.');
      await refresh(cotacao.id);
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const updateResponse = (
    fornecedorId: string,
    itemId: string,
    field: keyof ItemResponseState,
    value: string
  ): void => {
    setResponses((current) => ({
      ...current,
      [fornecedorId]: {
        ...(current[fornecedorId] || {}),
        [itemId]: {
          ...emptyItemResponse(),
          ...(current[fornecedorId]?.[itemId] || {}),
          [field]: value
        }
      }
    }));
  };

  const submitResponses = async (): Promise<void> => {
    if (saving || !selectedCotacao) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const fornecedoresPayload = (selectedCotacao.fornecedores || []).map((fornecedor) => ({
        fornecedor_id: fornecedor.fornecedor_id,
        prazo_entrega_dias: 5,
        condicao_pagamento: `${marker} - pagamento local`,
        observacoes: `${marker} - resposta local`,
        itens: solicitationItems.map((item) => {
          const state = responses[fornecedor.fornecedor_id]?.[item.id] || emptyItemResponse();
          const valorUnitario = normalizeDecimal(state.valor_unitario);
          if (valorUnitario < 0) {
            throw new Error('Valor unitário deve ser maior ou igual a zero.');
          }
          return {
            solicitacao_item_id: item.id,
            valor_unitario: valorUnitario,
            marca_modelo: state.marca_modelo || null,
            prazo_entrega_dias: state.prazo_entrega_dias ? Number(state.prazo_entrega_dias) : null,
            observacoes: state.observacoes || null
          };
        })
      }));

      await erpApi.cotacoes.registrarRespostas(selectedCotacao.id, { fornecedores: fornecedoresPayload });
      setMessage('Respostas dos fornecedores registradas.');
      await refresh(selectedCotacao.id);
    } catch (responseError) {
      setError(getErrorMessage(responseError));
    } finally {
      setSaving(false);
    }
  };

  const chooseSupplier = async (fornecedor: CotacaoFornecedorApi): Promise<void> => {
    if (saving || !selectedCotacao) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      await erpApi.cotacoes.escolherFornecedor(selectedCotacao.id, {
        fornecedor_id: fornecedor.fornecedor_id,
        criterio_decisao: 'MENOR_PRECO',
        justificativa
      });
      setMessage('Fornecedor vencedor escolhido.');
      await refresh(selectedCotacao.id);
    } catch (chooseError) {
      setError(getErrorMessage(chooseError));
    } finally {
      setSaving(false);
    }
  };

  const approveCotacao = async (cotacao: CotacaoApi, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<void> => {
    if (saving || !approvalUserId) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.cotacoes.aprovar(cotacao.id, action, {
        usuario_id: approvalUserId,
        observacoes: `${marker} - aprovacao local por alcada`
      });
      setSelectedCotacao(updated);
      setMessage('Aprovação registrada.');
      await refresh(updated.id);
    } catch (approveError) {
      setError(getErrorMessage(approveError));
    } finally {
      setSaving(false);
    }
  };

  const selectedWinner = mapa?.resumo.fornecedor_vencedor;
  const lowerTotalSupplier = mapa?.resumo.fornecedor_menor_total;

  return (
    <section className="enac-web-page enac-cotacoes-page enac-foundation-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Cotações e mapa comparativo</h1>
      <p className="enac-web-lead">
        Cotação operacional vinculada à solicitação de compra, com fornecedores, respostas e mapa comparativo local.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando referências locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {empresa && (
        <div className="enac-cadastros-context">
          <strong>{empresa.nome_fantasia || empresa.razao_social}</strong>
          <span>{empresa.cnpj}</span>
        </div>
      )}

      {!loading && solicitacoes.length > 0 && (
        <div className="enac-cotacoes-layout">
          <section className="enac-cotacoes-main" aria-label="Cotações e mapa comparativo">
            <div className="enac-cotacoes-selector">
              <label>
                <span>Solicitação</span>
                <select
                  value={selectedSolicitacaoId}
                  onChange={(event) => {
                    setSelectedSolicitacaoId(event.target.value);
                    setSelectedCotacao(null);
                    setMapa(null);
                  }}
                  disabled={saving}
                >
                  {solicitacoes.map((solicitacao) => (
                    <option key={solicitacao.id} value={solicitacao.id}>{toSolicitacaoLabel(solicitacao)}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="enac-cadastro-secondary" onClick={() => void refresh()} disabled={saving}>
                Atualizar
              </button>
            </div>

            {selectedSolicitacao && (
              <div className="enac-cotacoes-summary">
                <div>
                  <span className="enac-web-card-label">{selectedSolicitacao.codigo}</span>
                  <h2>{selectedSolicitacao.titulo}</h2>
                </div>
                <span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(selectedSolicitacao.status)}`}>
                  {solicitacaoStatusLabels[selectedSolicitacao.status] || selectedSolicitacao.status}
                </span>
                <dl>
                  <div><dt>Cotações</dt><dd>{cotacoes.length}</dd></div>
                  <div><dt>Itens</dt><dd>{solicitationItems.length}</dd></div>
                  <div><dt>Fornecedores</dt><dd>{fornecedores.length}</dd></div>
                </dl>
              </div>
            )}

            <div className="enac-cadastro-toolbar">
              <div>
                <h2>Lista de cotações</h2>
                <p>{cotacoes.length} cotação(ões) para a solicitação selecionada</p>
              </div>
            </div>

            <CotacoesTable
              cotacoes={cotacoes}
              saving={saving}
              selectedId={selectedCotacao?.id}
              onSelect={(cotacao) => void loadCotacaoDetail(cotacao.id).catch((detailError) => setError(getErrorMessage(detailError)))}
              onTransition={(cotacao, action) => void transition(cotacao, action)}
            />

            {selectedCotacao && (
              <section className="enac-cotacao-detail">
                <div className="enac-cadastro-toolbar">
                  <div>
                    <span className="enac-web-card-label">{selectedCotacao.codigo}</span>
                    <h2>{selectedCotacao.titulo}</h2>
                    <p>{statusLabels[selectedCotacao.status]}</p>
                  </div>
                  <span className={`enac-cotacao-status enac-cotacao-status--${statusClass(selectedCotacao.status)}`}>
                    {statusLabels[selectedCotacao.status]}
                  </span>
                </div>

                <div className="enac-cotacoes-summary">
                  <dl>
                    <div><dt>Aprovação</dt><dd>{selectedCotacao.aprovacao_status ? aprovacaoLabels[selectedCotacao.aprovacao_status] || selectedCotacao.aprovacao_status : '-'}</dd></div>
                    <div><dt>Aprovador</dt><dd>{selectedCotacao.aprovado_por_nome || '-'}</dd></div>
                  </dl>
                </div>

                {['MAPA_GERADO', 'FORNECEDOR_ESCOLHIDO'].includes(selectedCotacao.status) && (
                  <div className="enac-cadastro-row-actions">
                    <label>
                      <span>Aprovador</span>
                      <select value={approvalUserId} onChange={(event) => setApprovalUserId(event.target.value)} disabled={saving}>
                        <option value="">Selecione</option>
                        {usuarios.map((usuario) => (
                          <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => void approveCotacao(selectedCotacao, 'aprovar-tecnico')} disabled={saving || !approvalUserId}>Aprovar técnico</button>
                    <button type="button" onClick={() => void approveCotacao(selectedCotacao, 'aprovar-diretoria')} disabled={saving || !approvalUserId}>Aprovar diretoria</button>
                  </div>
                )}

                <FornecedoresTable fornecedores={selectedCotacao.fornecedores || []} />

                {selectedCotacao.status === 'ENVIADA_FORNECEDORES' && (
                  <ResponseEditor
                    fornecedores={selectedCotacao.fornecedores || []}
                    itens={solicitationItems}
                    responses={responses}
                    saving={saving}
                    onChange={updateResponse}
                    onSubmit={() => void submitResponses()}
                  />
                )}

                {(selectedCotacao.status === 'RESPOSTAS_RECEBIDAS' ||
                  selectedCotacao.status === 'MAPA_GERADO' ||
                  selectedCotacao.status === 'FORNECEDOR_ESCOLHIDO') && (
                  <MapaComparativo
                    mapa={mapa}
                    lowerTotalSupplier={lowerTotalSupplier}
                    selectedWinner={selectedWinner}
                    justificativa={justificativa}
                    saving={saving}
                    onJustificativaChange={setJustificativa}
                    onChoose={(fornecedor) => void chooseSupplier(fornecedor)}
                  />
                )}
              </section>
            )}
          </section>

          <aside className="enac-cotacoes-panel" aria-label="Nova cotação">
            <form className="enac-cadastro-form enac-cotacao-form" onSubmit={(event) => void createCotacao(event)}>
              <div className="enac-cadastro-form-head">
                <h3>Nova cotação</h3>
              </div>
              <div className="enac-cadastro-form-grid">
                <label className="enac-solicitacao-span-2">
                  <span>Título<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input
                    value={createForm.titulo}
                    onChange={(event) => setCreateForm((current) => ({ ...current, titulo: event.target.value }))}
                    disabled={saving}
                    required
                  />
                </label>
                <label>
                  <span>Prazo de resposta</span>
                  <input
                    type="date"
                    value={createForm.prazo_resposta}
                    onChange={(event) => setCreateForm((current) => ({ ...current, prazo_resposta: event.target.value }))}
                    disabled={saving}
                  />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea
                    value={createForm.observacoes}
                    onChange={(event) => setCreateForm((current) => ({ ...current, observacoes: event.target.value }))}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="enac-cotacao-suppliers">
                <h4>Fornecedores</h4>
                {fornecedores.map((fornecedor) => (
                  <label key={fornecedor.id} className="enac-cotacao-checkbox">
                    <input
                      type="checkbox"
                      checked={supplierSelection.has(fornecedor.id)}
                      onChange={() => toggleSupplier(fornecedor.id)}
                      disabled={saving}
                    />
                    <span>{fornecedor.nome}</span>
                  </label>
                ))}
              </div>

              <div className="enac-cadastro-actions">
                <button type="submit" disabled={saving || !selectedSolicitacao || supplierSelection.size === 0}>
                  {saving ? 'Salvando...' : 'Criar cotação'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}

function CotacoesTable({
  cotacoes,
  saving,
  selectedId,
  onSelect,
  onTransition
}: {
  cotacoes: CotacaoApi[];
  saving: boolean;
  selectedId?: string;
  onSelect: (cotacao: CotacaoApi) => void;
  onTransition: (cotacao: CotacaoApi, action: 'enviar-fornecedores' | 'gerar-mapa' | 'cancelar') => void;
}): JSX.Element {
  if (cotacoes.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma cotação criada para esta solicitação.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-cotacoes-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Título</th>
            <th>Status</th>
            <th>Aprovação</th>
            <th>Fornecedores</th>
            <th>Vencedor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cotacoes.map((cotacao) => (
            <tr key={cotacao.id} className={selectedId === cotacao.id ? 'enac-cotacao-row-selected' : ''}>
              <td><strong>{cotacao.codigo}</strong></td>
              <td>{cotacao.titulo}</td>
              <td>
                <span className={`enac-cotacao-status enac-cotacao-status--${statusClass(cotacao.status)}`}>
                  {statusLabels[cotacao.status]}
                </span>
              </td>
              <td>{cotacao.aprovacao_status ? aprovacaoLabels[cotacao.aprovacao_status] || cotacao.aprovacao_status : '-'}</td>
              <td>{cotacao.fornecedores_count || 0}</td>
              <td>{cotacao.fornecedor_vencedor_nome || '-'}</td>
              <td>
                <div className="enac-cadastro-row-actions">
                  <button type="button" onClick={() => onSelect(cotacao)} disabled={saving}>Detalhe</button>
                  {cotacao.status === 'RASCUNHO' && (
                    <button type="button" onClick={() => onTransition(cotacao, 'enviar-fornecedores')} disabled={saving}>
                      Enviar
                    </button>
                  )}
                  {cotacao.status === 'RESPOSTAS_RECEBIDAS' && (
                    <button type="button" onClick={() => onTransition(cotacao, 'gerar-mapa')} disabled={saving}>
                      Gerar mapa
                    </button>
                  )}
                  {canCancel(cotacao) && (
                    <button type="button" onClick={() => onTransition(cotacao, 'cancelar')} disabled={saving}>
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FornecedoresTable({ fornecedores }: { fornecedores: CotacaoFornecedorApi[] }): JSX.Element {
  if (fornecedores.length === 0) {
    return <div className="enac-cadastro-empty">Nenhum fornecedor participante.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-cotacoes-table">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Status</th>
            <th>Total</th>
            <th>Prazo</th>
            <th>Pagamento</th>
          </tr>
        </thead>
        <tbody>
          {fornecedores.map((fornecedor) => (
            <tr key={fornecedor.id}>
              <td>{fornecedor.fornecedor_nome}</td>
              <td>{fornecedor.status}</td>
              <td>{formatMoney(fornecedor.valor_total)}</td>
              <td>{fornecedor.prazo_entrega_dias ? `${fornecedor.prazo_entrega_dias} dias` : '-'}</td>
              <td>{fornecedor.condicao_pagamento || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponseEditor({
  fornecedores,
  itens,
  responses,
  saving,
  onChange,
  onSubmit
}: {
  fornecedores: CotacaoFornecedorApi[];
  itens: SolicitacaoCompraItemApi[];
  responses: ResponseState;
  saving: boolean;
  onChange: (fornecedorId: string, itemId: string, field: keyof ItemResponseState, value: string) => void;
  onSubmit: () => void;
}): JSX.Element {
  return (
    <div className="enac-cotacao-response-editor">
      <h3>Respostas por fornecedor</h3>
      {fornecedores.map((fornecedor) => (
        <div className="enac-cotacao-response-card" key={fornecedor.id}>
          <h4>{fornecedor.fornecedor_nome}</h4>
          {itens.map((item) => {
            const state = responses[fornecedor.fornecedor_id]?.[item.id] || emptyItemResponse();
            return (
              <div className="enac-cotacao-response-grid" key={item.id}>
                <strong>{item.descricao}</strong>
                <span>{Number(item.quantidade).toLocaleString('pt-BR')} {item.unidade}</span>
                <label>
                  <span>Valor unitário</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state.valor_unitario}
                    onChange={(event) => onChange(fornecedor.fornecedor_id, item.id, 'valor_unitario', event.target.value)}
                    disabled={saving}
                  />
                </label>
                <label>
                  <span>Marca/modelo</span>
                  <input
                    value={state.marca_modelo}
                    onChange={(event) => onChange(fornecedor.fornecedor_id, item.id, 'marca_modelo', event.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>
            );
          })}
        </div>
      ))}
      <div className="enac-cadastro-actions">
        <button type="button" onClick={onSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Registrar respostas'}</button>
      </div>
    </div>
  );
}

function MapaComparativo({
  mapa,
  lowerTotalSupplier,
  selectedWinner,
  justificativa,
  saving,
  onJustificativaChange,
  onChoose
}: {
  mapa: MapaComparativoApi | null;
  lowerTotalSupplier?: CotacaoFornecedorApi | null;
  selectedWinner?: CotacaoFornecedorApi | null;
  justificativa: string;
  saving: boolean;
  onJustificativaChange: (value: string) => void;
  onChoose: (fornecedor: CotacaoFornecedorApi) => void;
}): JSX.Element {
  if (!mapa) {
    return <div className="enac-cadastro-empty">Mapa comparativo ainda não disponível.</div>;
  }

  return (
    <div className="enac-cotacao-map">
      <div className="enac-cotacoes-summary">
        <div>
          <span className="enac-web-card-label">Mapa comparativo</span>
          <h2>{selectedWinner ? `Vencedor: ${selectedWinner.fornecedor_nome}` : 'Comparação de respostas'}</h2>
        </div>
        <dl>
          <div><dt>Fornecedores</dt><dd>{mapa.resumo.total_fornecedores}</dd></div>
          <div><dt>Respostas</dt><dd>{mapa.resumo.total_respostas}</dd></div>
          <div><dt>Menor total</dt><dd>{formatMoney(lowerTotalSupplier?.valor_total)}</dd></div>
        </dl>
      </div>

      <div className="enac-cadastro-table-wrap">
        <table className="enac-web-table enac-cotacoes-mapa-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd.</th>
              {mapa.fornecedores.map((fornecedor) => (
                <th key={fornecedor.id}>{fornecedor.fornecedor_nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mapa.itens.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.descricao}</strong>
                  <span>{item.unidade}</span>
                </td>
                <td>{Number(item.quantidade).toLocaleString('pt-BR')}</td>
                {mapa.fornecedores.map((fornecedor) => {
                  const comparativo = item.comparativos.find((entry) => entry.fornecedor_id === fornecedor.fornecedor_id);
                  return (
                    <td key={fornecedor.id} className={comparativo?.melhor_valor ? 'enac-cotacao-best' : ''}>
                      {comparativo ? (
                        <>
                          <strong>{formatMoney(comparativo.valor_total)}</strong>
                          <span>{formatMoney(comparativo.valor_unitario)} / un.</span>
                        </>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td><strong>Total</strong></td>
              <td>-</td>
              {mapa.fornecedores.map((fornecedor) => (
                <td key={fornecedor.id} className={lowerTotalSupplier?.id === fornecedor.id ? 'enac-cotacao-best' : ''}>
                  <strong>{formatMoney(fornecedor.valor_total)}</strong>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {!selectedWinner && lowerTotalSupplier && (
        <div className="enac-cotacao-winner">
          <label>
            <span>Justificativa da escolha</span>
            <textarea value={justificativa} onChange={(event) => onJustificativaChange(event.target.value)} disabled={saving} />
          </label>
          <button type="button" onClick={() => onChoose(lowerTotalSupplier)} disabled={saving || !justificativa.trim()}>
            Escolher menor total
          </button>
        </div>
      )}
    </div>
  );
}
