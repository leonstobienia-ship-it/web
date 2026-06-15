import * as React from 'react';
import {
  erpApi,
  type CotacaoApi,
  type CotacaoItemPayload,
  type CotacaoStatus,
  type EmpresaApi,
  type FornecedorApi,
  type MapaComparativoApi,
  type SolicitacaoCompraApi,
  type SolicitacaoCompraItemApi
} from '../../services/erpApi';

type FormMode = 'list' | 'create' | 'edit';

interface CotacaoFormState {
  fornecedor_id: string;
  data_recebimento: string;
  validade_proposta: string;
  prazo_entrega_dias: string;
  condicao_pagamento: string;
  frete: string;
  observacoes: string;
}

interface ItemPriceState {
  valor_unitario: string;
  observacoes: string;
}

const marker = 'DEV_LOCAL_V3_4B';

const statusLabels: Record<CotacaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  RECEBIDA: 'Recebida',
  DESCLASSIFICADA: 'Desclassificada',
  SELECIONADA: 'Selecionada',
  CANCELADA: 'Cancelada'
};

const solicitacaoStatusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  EM_ANALISE: 'Em análise',
  APROVADA_PARA_COTACAO: 'Aprovada para cotação',
  DEVOLVIDA: 'Devolvida',
  CANCELADA: 'Cancelada'
};

const emptyForm = (): CotacaoFormState => ({
  fornecedor_id: '',
  data_recebimento: new Date().toISOString().slice(0, 10),
  validade_proposta: '',
  prazo_entrega_dias: '',
  condicao_pagamento: '',
  frete: '',
  observacoes: ''
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
    throw new Error('Informe valores numéricos válidos para os itens da cotação.');
  }
  return parsed;
};

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const toSolicitacaoLabel = (solicitacao: SolicitacaoCompraApi): string =>
  `${solicitacao.codigo} - ${solicitacao.titulo} (${solicitacaoStatusLabels[solicitacao.status] || solicitacao.status})`;

const buildItemPrices = (items: SolicitacaoCompraItemApi[], cotacao?: CotacaoApi): Record<string, ItemPriceState> => {
  const prices: Record<string, ItemPriceState> = {};
  const cotacaoItems = cotacao?.itens || [];

  items.forEach((item) => {
    const cotacaoItem = cotacaoItems.find((quoteItem) => quoteItem.solicitacao_item_id === item.id);
    prices[item.id] = {
      valor_unitario: cotacaoItem ? String(cotacaoItem.valor_unitario) : '0',
      observacoes: cotacaoItem?.observacoes || ''
    };
  });

  return prices;
};

export function CotacoesMapaPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [solicitacoes, setSolicitacoes] = React.useState<SolicitacaoCompraApi[]>([]);
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [selectedSolicitacaoId, setSelectedSolicitacaoId] = React.useState<string>('');
  const [selectedSolicitacao, setSelectedSolicitacao] = React.useState<SolicitacaoCompraApi | null>(null);
  const [mapa, setMapa] = React.useState<MapaComparativoApi | null>(null);
  const [mode, setMode] = React.useState<FormMode>('list');
  const [selectedCotacao, setSelectedCotacao] = React.useState<CotacaoApi | null>(null);
  const [form, setForm] = React.useState<CotacaoFormState>(emptyForm());
  const [itemPrices, setItemPrices] = React.useState<Record<string, ItemPriceState>>({});
  const [loadingRefs, setLoadingRefs] = React.useState<boolean>(true);
  const [loadingMapa, setLoadingMapa] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const empresa = empresas[0];
  const solicitationItems = selectedSolicitacao?.itens || [];
  const canQuote = selectedSolicitacao?.status === 'EM_ANALISE';
  const quotedSupplierIds = new Set((mapa?.cotacoes || []).map((cotacao) => cotacao.fornecedor_id));

  const loadMapa = React.useCallback(async (solicitacaoId: string): Promise<void> => {
    if (!solicitacaoId) {
      setSelectedSolicitacao(null);
      setMapa(null);
      return;
    }

    setLoadingMapa(true);
    setError('');
    try {
      const [detalhe, mapaResponse] = await Promise.all([
        erpApi.solicitacoesCompra.get(solicitacaoId),
        erpApi.cotacoes.mapaComparativo(solicitacaoId)
      ]);
      setSelectedSolicitacao(detalhe);
      setMapa(mapaResponse);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingMapa(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      erpApi.empresas.list(),
      erpApi.solicitacoesCompra.list(),
      erpApi.fornecedores.list()
    ])
      .then(([empresasResponse, solicitacoesResponse, fornecedoresResponse]) => {
        if (!active) {
          return;
        }
        setEmpresas(empresasResponse);
        setSolicitacoes(solicitacoesResponse);
        setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
        const firstEligible = solicitacoesResponse.find((solicitacao) => solicitacao.status === 'EM_ANALISE') || solicitacoesResponse[0];
        setSelectedSolicitacaoId(firstEligible?.id || '');
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
    void loadMapa(selectedSolicitacaoId);
  }, [loadMapa, selectedSolicitacaoId]);

  const refreshAll = async (): Promise<void> => {
    setError('');
    const [solicitacoesResponse] = await Promise.all([
      erpApi.solicitacoesCompra.list(),
      selectedSolicitacaoId ? loadMapa(selectedSolicitacaoId) : Promise.resolve()
    ]);
    setSolicitacoes(solicitacoesResponse);
  };

  const openCreate = (): void => {
    if (!selectedSolicitacao) {
      return;
    }
    setMode('create');
    setSelectedCotacao(null);
    setForm({
      ...emptyForm(),
      observacoes: `${marker} - cotacao local`
    });
    setItemPrices(buildItemPrices(solicitationItems));
    setError('');
    setMessage('');
  };

  const openEdit = async (cotacao: CotacaoApi): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const detalhe = await erpApi.cotacoes.get(cotacao.id);
      setSelectedCotacao(detalhe);
      setForm({
        fornecedor_id: detalhe.fornecedor_id,
        data_recebimento: detalhe.data_recebimento.slice(0, 10),
        validade_proposta: detalhe.validade_proposta ? detalhe.validade_proposta.slice(0, 10) : '',
        prazo_entrega_dias: detalhe.prazo_entrega_dias === null || detalhe.prazo_entrega_dias === undefined ? '' : String(detalhe.prazo_entrega_dias),
        condicao_pagamento: detalhe.condicao_pagamento || '',
        frete: detalhe.frete || '',
        observacoes: detalhe.observacoes || ''
      });
      setItemPrices(buildItemPrices(solicitationItems, detalhe));
      setMode('edit');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: keyof CotacaoFormState, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItemPrice = (itemId: string, field: keyof ItemPriceState, value: string): void => {
    setItemPrices((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || { valor_unitario: '0', observacoes: '' }),
        [field]: value
      }
    }));
  };

  const buildItemsPayload = (): CotacaoItemPayload[] => {
    if (solicitationItems.length === 0) {
      throw new Error('A solicitação selecionada não possui itens ativos.');
    }

    return solicitationItems.map((item, index) => {
      const state = itemPrices[item.id];
      const valorUnitario = normalizeDecimal(state?.valor_unitario || '0');
      if (valorUnitario < 0) {
        throw new Error(`Valor unitário deve ser maior ou igual a zero no item ${index + 1}.`);
      }

      return {
        solicitacao_item_id: item.id,
        valor_unitario: valorUnitario,
        observacoes: state?.observacoes?.trim() || null
      };
    });
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !empresa || !selectedSolicitacao) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (!canQuote) {
        throw new Error('A solicitação precisa estar em análise para receber cotações.');
      }
      if (!form.fornecedor_id || !form.data_recebimento) {
        throw new Error('Fornecedor e data de recebimento são obrigatórios.');
      }

      const payload = {
        company_id: empresa.id,
        solicitacao_compra_id: selectedSolicitacao.id,
        fornecedor_id: form.fornecedor_id,
        data_recebimento: form.data_recebimento,
        validade_proposta: form.validade_proposta || null,
        prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
        condicao_pagamento: form.condicao_pagamento.trim() || null,
        frete: form.frete.trim() || null,
        observacoes: form.observacoes.trim() || null,
        itens: buildItemsPayload()
      };

      if (mode === 'edit' && selectedCotacao) {
        const { company_id: _companyId, solicitacao_compra_id: _solicitacaoId, ...updatePayload } = payload;
        await erpApi.cotacoes.update(selectedCotacao.id, updatePayload);
        setMessage('Cotação atualizada.');
      } else {
        await erpApi.cotacoes.create(payload);
        setMessage('Cotação registrada.');
      }

      setMode('list');
      setSelectedCotacao(null);
      setForm(emptyForm());
      setItemPrices({});
      await refreshAll();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (cotacao: CotacaoApi, action: 'selecionar' | 'desclassificar' | 'cancelar'): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload: Record<string, string | null> = {};
      if (action === 'selecionar') {
        payload.justificativa = `${marker} - selecionada no mapa comparativo local`;
      }
      if (action === 'desclassificar') {
        payload.motivo_desclassificacao = `${marker} - desclassificada no teste local`;
      }
      await erpApi.cotacoes.transition(cotacao.id, action, payload);
      setMessage(`Cotação ${statusLabels[action === 'selecionar' ? 'SELECIONADA' : action === 'desclassificar' ? 'DESCLASSIFICADA' : 'CANCELADA'].toLowerCase()}.`);
      await refreshAll();
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const availableFornecedores = fornecedores.filter((fornecedor) =>
    mode === 'edit' && selectedCotacao?.fornecedor_id === fornecedor.id ? true : !quotedSupplierIds.has(fornecedor.id)
  );

  return (
    <section className="enac-web-page enac-cotacoes-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Cotações e mapa comparativo</h1>
      <p className="enac-web-lead">
        Registro local de propostas por fornecedor e comparação por item para solicitações em análise.
      </p>

      {loadingRefs && <div className="enac-cadastro-empty">Carregando referências locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {empresa && (
        <div className="enac-cadastros-context">
          <strong>{empresa.nome_fantasia || empresa.razao_social}</strong>
          <span>{empresa.cnpj}</span>
        </div>
      )}

      {!loadingRefs && solicitacoes.length === 0 && (
        <div className="enac-web-alert enac-web-alert--compact">
          Nenhuma solicitação local encontrada. Crie uma solicitação e mova para análise antes de cotar.
        </div>
      )}

      {solicitacoes.length > 0 && (
        <div className="enac-cotacoes-layout">
          <section className="enac-cotacoes-main" aria-label="Mapa comparativo de cotações">
            <div className="enac-cotacoes-selector">
              <label>
                <span>Solicitação</span>
                <select
                  value={selectedSolicitacaoId}
                  onChange={(event) => {
                    setSelectedSolicitacaoId(event.target.value);
                    setMode('list');
                    setSelectedCotacao(null);
                  }}
                  disabled={saving || loadingMapa}
                >
                  {solicitacoes.map((solicitacao) => (
                    <option key={solicitacao.id} value={solicitacao.id}>{toSolicitacaoLabel(solicitacao)}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="enac-cadastro-secondary" onClick={() => void refreshAll()} disabled={saving || loadingMapa}>
                Atualizar
              </button>
            </div>

            {loadingMapa && <div className="enac-cadastro-empty">Carregando mapa comparativo.</div>}

            {selectedSolicitacao && !loadingMapa && (
              <>
                <div className="enac-cotacoes-summary">
                  <div>
                    <span className="enac-web-card-label">{selectedSolicitacao.codigo}</span>
                    <h2>{selectedSolicitacao.titulo}</h2>
                  </div>
                  <span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(selectedSolicitacao.status)}`}>
                    {solicitacaoStatusLabels[selectedSolicitacao.status] || selectedSolicitacao.status}
                  </span>
                  <dl>
                    <div><dt>Cotações</dt><dd>{mapa?.resumo.total_cotacoes || 0}</dd></div>
                    <div><dt>Comparáveis</dt><dd>{mapa?.resumo.total_cotacoes_comparaveis || 0}</dd></div>
                    <div><dt>Menor total</dt><dd>{formatMoney(mapa?.resumo.cotacao_menor_total?.valor_total)}</dd></div>
                  </dl>
                </div>

                {!canQuote && (
                  <div className="enac-web-alert enac-web-alert--compact">
                    Cotações só podem ser registradas quando a solicitação estiver em análise.
                  </div>
                )}

                <div className="enac-cadastro-toolbar">
                  <div>
                    <h2>Cotações recebidas</h2>
                    <p>{mapa?.cotacoes.length || 0} fornecedor(es) cotado(s)</p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreate}
                    disabled={!canQuote || saving || solicitationItems.length === 0 || availableFornecedores.length === 0}
                  >
                    Nova cotação
                  </button>
                </div>

                <CotacoesTable
                  cotacoes={mapa?.cotacoes || []}
                  saving={saving}
                  onEdit={(cotacao) => void openEdit(cotacao)}
                  onTransition={(cotacao, action) => void transition(cotacao, action)}
                />

                <MapaComparativoTable mapa={mapa} />
              </>
            )}
          </section>

          <aside className="enac-cotacoes-panel" aria-label="Formulário de cotação">
            {mode === 'list' && (
              <div className="enac-cadastro-empty">
                Selecione uma solicitação em análise e registre cotações por fornecedor. Pedido de compra fica para a V3.4C.
              </div>
            )}

            {mode !== 'list' && selectedSolicitacao && (
              <form className="enac-cadastro-form enac-cotacao-form" onSubmit={save}>
                <div className="enac-cadastro-form-head">
                  <h3>{mode === 'edit' ? 'Editar cotação' : 'Nova cotação'}</h3>
                  <button type="button" className="enac-cadastro-secondary" onClick={() => setMode('list')} disabled={saving}>
                    Cancelar
                  </button>
                </div>

                <div className="enac-cadastro-form-grid">
                  <label>
                    <span>Fornecedor<strong className="enac-cadastro-required">Obrigatório</strong></span>
                    <select value={form.fornecedor_id} onChange={(event) => updateForm('fornecedor_id', event.target.value)} disabled={saving || mode === 'edit'} required>
                      <option value="">Selecione</option>
                      {availableFornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Recebimento<strong className="enac-cadastro-required">Obrigatório</strong></span>
                    <input type="date" value={form.data_recebimento} onChange={(event) => updateForm('data_recebimento', event.target.value)} disabled={saving} required />
                  </label>
                  <label>
                    <span>Validade</span>
                    <input type="date" value={form.validade_proposta} onChange={(event) => updateForm('validade_proposta', event.target.value)} disabled={saving} />
                  </label>
                  <label>
                    <span>Prazo de entrega (dias)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.prazo_entrega_dias}
                      onChange={(event) => updateForm('prazo_entrega_dias', event.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label>
                    <span>Condição de pagamento</span>
                    <input value={form.condicao_pagamento} onChange={(event) => updateForm('condicao_pagamento', event.target.value)} disabled={saving} />
                  </label>
                  <label>
                    <span>Frete</span>
                    <input value={form.frete} onChange={(event) => updateForm('frete', event.target.value)} disabled={saving} />
                  </label>
                  <label className="enac-solicitacao-span-2">
                    <span>Observações</span>
                    <textarea value={form.observacoes} onChange={(event) => updateForm('observacoes', event.target.value)} disabled={saving} />
                  </label>
                </div>

                <div className="enac-cotacao-items">
                  {solicitationItems.map((item, index) => (
                    <div className="enac-cotacao-item" key={item.id}>
                      <div>
                        <strong>{index + 1}. {item.descricao}</strong>
                        <span>{Number(item.quantidade).toLocaleString('pt-BR')} {item.unidade}</span>
                      </div>
                      <label>
                        <span>Valor unitário<strong className="enac-cadastro-required">Obrigatório</strong></span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={itemPrices[item.id]?.valor_unitario || '0'}
                          onChange={(event) => updateItemPrice(item.id, 'valor_unitario', event.target.value)}
                          disabled={saving}
                          required
                        />
                      </label>
                      <label>
                        <span>Observação do item</span>
                        <input
                          value={itemPrices[item.id]?.observacoes || ''}
                          onChange={(event) => updateItemPrice(item.id, 'observacoes', event.target.value)}
                          disabled={saving}
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="enac-cadastro-actions">
                  <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cotação'}</button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

function CotacoesTable({
  cotacoes,
  saving,
  onEdit,
  onTransition
}: {
  cotacoes: CotacaoApi[];
  saving: boolean;
  onEdit: (cotacao: CotacaoApi) => void;
  onTransition: (cotacao: CotacaoApi, action: 'selecionar' | 'desclassificar' | 'cancelar') => void;
}): JSX.Element {
  if (cotacoes.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma cotação registrada para esta solicitação.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-cotacoes-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Fornecedor</th>
            <th>Status</th>
            <th>Total</th>
            <th>Prazo</th>
            <th>Validade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cotacoes.map((cotacao) => (
            <tr key={cotacao.id}>
              <td><strong>{cotacao.codigo}</strong></td>
              <td>{cotacao.fornecedor_nome}</td>
              <td>
                <span className={`enac-cotacao-status enac-cotacao-status--${statusClass(cotacao.status)}`}>
                  {statusLabels[cotacao.status]}
                </span>
              </td>
              <td>{formatMoney(cotacao.valor_total)}</td>
              <td>{cotacao.prazo_entrega_dias === null || cotacao.prazo_entrega_dias === undefined ? '-' : `${cotacao.prazo_entrega_dias} dias`}</td>
              <td>{formatDate(cotacao.validade_proposta)}</td>
              <td>
                <div className="enac-cadastro-row-actions">
                  {cotacao.status === 'RECEBIDA' && <button type="button" onClick={() => onEdit(cotacao)} disabled={saving}>Editar</button>}
                  {cotacao.status === 'RECEBIDA' && <button type="button" onClick={() => onTransition(cotacao, 'selecionar')} disabled={saving}>Selecionar</button>}
                  {cotacao.status === 'RECEBIDA' && <button type="button" onClick={() => onTransition(cotacao, 'desclassificar')} disabled={saving}>Desclassificar</button>}
                  {cotacao.status === 'RASCUNHO' && <button type="button" onClick={() => onTransition(cotacao, 'cancelar')} disabled={saving}>Cancelar</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapaComparativoTable({ mapa }: { mapa: MapaComparativoApi | null }): JSX.Element {
  if (!mapa || mapa.itens.length === 0) {
    return <div className="enac-cadastro-empty">Mapa comparativo indisponível sem itens da solicitação.</div>;
  }

  if (mapa.cotacoes.length === 0) {
    return <div className="enac-cadastro-empty">Registre cotações para montar o mapa comparativo.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-cotacoes-mapa-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qtd.</th>
            {mapa.cotacoes.map((cotacao) => (
              <th key={cotacao.id}>{cotacao.fornecedor_nome}</th>
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
              {mapa.cotacoes.map((cotacao) => {
                const comparativo = item.comparativos.find((quoteItem) => quoteItem.cotacao_id === cotacao.id);
                return (
                  <td key={cotacao.id} className={comparativo?.melhor_valor ? 'enac-cotacao-best' : ''}>
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
            {mapa.cotacoes.map((cotacao) => (
              <td key={cotacao.id} className={mapa.resumo.cotacao_menor_total?.id === cotacao.id ? 'enac-cotacao-best' : ''}>
                <strong>{formatMoney(cotacao.valor_total)}</strong>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
