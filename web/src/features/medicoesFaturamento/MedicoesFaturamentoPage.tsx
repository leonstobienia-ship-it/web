import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type ClienteApi,
  type ContratoObraApi,
  type EmpresaApi,
  type MedicaoApi,
  type MedicaoItemPayload,
  type MedicaoPayload,
  type MedicaoStatus,
  type ObraApi,
  type PedidoFaturamentoApi,
  type UsuarioApi
} from '../../services/erpApi';

interface MedicaoForm {
  company_id: string;
  obra_id: string;
  cliente_id: string;
  centro_custo_id: string;
  numero: string;
  competencia: string;
  periodo_inicio: string;
  periodo_fim: string;
  contrato_obra_id: string;
  contrato_obra_aditivo_id: string;
  contrato_escopo: string;
  observacoes: string;
}

interface ItemForm {
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  centro_custo_id: string;
  etapa_servico: string;
}

const marker = 'DEV_LOCAL_V3_6';

const statusLabels: Record<MedicaoStatus, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDA: 'Submetida',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  DEVOLVIDA: 'Devolvida',
  CANCELADA: 'Cancelada',
  FATURAMENTO_SOLICITADO: 'Faturamento solicitado',
  FATURADO_MANUALMENTE: 'Faturado manualmente'
};

const pedidoStatusLabels: Record<string, string> = {
  SOLICITADO: 'Solicitado',
  APROVADO: 'Aprovado',
  FATURADO_MANUALMENTE: 'Faturado manualmente',
  CANCELADO: 'Cancelado'
};

const today = (): string => new Date().toISOString().slice(0, 10);

const currentCompetencia = (): string => new Date().toISOString().slice(0, 7);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const emptyMedicaoForm = (): MedicaoForm => ({
  company_id: '',
  obra_id: '',
  cliente_id: '',
  centro_custo_id: '',
  numero: '',
  competencia: currentCompetencia(),
  periodo_inicio: today(),
  periodo_fim: addDays(15),
  contrato_obra_id: '',
  contrato_obra_aditivo_id: '',
  contrato_escopo: `${marker} - escopo local de medicao`,
  observacoes: `${marker} - medicao local sem emissao fiscal real`
});

const emptyItemForm = (): ItemForm => ({
  descricao: `${marker} - servico medido`,
  unidade: 'un',
  quantidade: '1',
  valor_unitario: '1500',
  centro_custo_id: '',
  etapa_servico: `${marker} - etapa local`
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: unknown): string =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string | null | undefined): string =>
  value ? value.slice(0, 10).split('-').reverse().join('/') : '-';

const formatDateTime = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString('pt-BR') : '-';

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const canEditMedicao = (medicao: MedicaoApi | null): boolean =>
  medicao?.status === 'RASCUNHO' || medicao?.status === 'DEVOLVIDA';
type MedicaoView = 'consulta' | 'novo' | 'detalhe';

export function MedicoesFaturamentoPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [contratosObra, setContratosObra] = React.useState<ContratoObraApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [medicoes, setMedicoes] = React.useState<MedicaoApi[]>([]);
  const [pedidos, setPedidos] = React.useState<PedidoFaturamentoApi[]>([]);
  const [selectedMedicao, setSelectedMedicao] = React.useState<MedicaoApi | null>(null);
  const [selectedPedido, setSelectedPedido] = React.useState<PedidoFaturamentoApi | null>(null);
  const [form, setForm] = React.useState<MedicaoForm>(emptyMedicaoForm());
  const [itemForm, setItemForm] = React.useState<ItemForm>(emptyItemForm());
  const [statusFilter, setStatusFilter] = React.useState<MedicaoStatus | ''>('');
  const [actionUserId, setActionUserId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<MedicaoView>('consulta');

  const loadAll = React.useCallback(async (nextStatus = statusFilter): Promise<void> => {
    const [empresasResponse, clientesResponse, obrasResponse, centrosResponse, usuariosResponse, contratosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.clientes.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.usuarios.list(),
      erpApi.contratosObra.list({ status: 'ATIVO' })
    ]);
    const companyId = empresasResponse.find((empresa) => empresa.cnpj === '00.000.000/0001-33')?.id || empresasResponse[0]?.id || '';
    const [medicoesResponse, pedidosResponse] = await Promise.all([
      erpApi.medicoes.list({ status: nextStatus }),
      erpApi.pedidosFaturamento.list()
    ]);
    const activeClientes = clientesResponse.filter((cliente) => cliente.status !== 'inativo');
    const activeObras = obrasResponse.filter((obra) => obra.status !== 'inativo');
    const activeCentros = centrosResponse.filter((centro) => centro.status !== 'inativo');
    const defaultObra = activeObras.find((obra) => obra.company_id === companyId) || activeObras[0];
    const defaultClienteId = defaultObra?.cliente_id || activeClientes.find((cliente) => cliente.company_id === companyId)?.id || activeClientes[0]?.id || '';
    setEmpresas(empresasResponse);
    setClientes(activeClientes);
    setObras(activeObras);
    setCentrosCusto(activeCentros);
    setContratosObra(contratosResponse);
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setMedicoes(medicoesResponse);
    setPedidos(pedidosResponse);
    setForm((current) => ({
      ...current,
      company_id: current.company_id || companyId,
      obra_id: current.obra_id || defaultObra?.id || '',
      cliente_id: current.cliente_id || defaultClienteId,
      centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '',
      contrato_obra_id: current.contrato_obra_id,
      contrato_obra_aditivo_id: current.contrato_obra_aditivo_id
    }));
    setItemForm((current) => ({ ...current, centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '' }));
    setActionUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
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

  const refresh = async (medicaoId = selectedMedicao?.id, pedidoId = selectedPedido?.id): Promise<void> => {
    await loadAll();
    if (medicaoId) {
      setSelectedMedicao(await erpApi.medicoes.get(medicaoId));
    }
    if (pedidoId) {
      setSelectedPedido(await erpApi.pedidosFaturamento.get(pedidoId));
    }
  };

  const runAction = async <T,>(callback: () => Promise<T>, successMessage: string, after?: (result: T) => void): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await callback();
      after?.(result);
      await refresh(
        (result as MedicaoApi)?.id || selectedMedicao?.id,
        (result as PedidoFaturamentoApi)?.id || selectedPedido?.id
      );
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const createMedicao = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const payload: MedicaoPayload = {
      company_id: form.company_id,
      obra_id: form.obra_id,
      cliente_id: form.cliente_id,
      centro_custo_id: form.centro_custo_id || null,
      numero: form.numero || null,
      competencia: form.competencia,
      periodo_inicio: form.periodo_inicio,
      periodo_fim: form.periodo_fim,
      contrato_obra_id: form.contrato_obra_id || null,
      contrato_obra_aditivo_id: form.contrato_obra_aditivo_id || null,
      contrato_escopo: form.contrato_escopo || null,
      responsavel_id: actionUserId || null,
      usuario_id: actionUserId || null,
      observacoes: form.observacoes || null
    };
    await runAction(
      () => erpApi.medicoes.create(payload),
      'Medição criada em rascunho.',
      (created) => {
        setSelectedMedicao(created as MedicaoApi);
        setActiveView('detalhe');
      }
    );
    setForm((current) => ({ ...emptyMedicaoForm(), company_id: current.company_id, obra_id: current.obra_id, cliente_id: current.cliente_id, centro_custo_id: current.centro_custo_id }));
  };

  const createItem = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedMedicao) {
      return;
    }
    const payload: MedicaoItemPayload = {
      descricao: itemForm.descricao,
      unidade: itemForm.unidade,
      quantidade: toNumber(itemForm.quantidade),
      valor_unitario: toNumber(itemForm.valor_unitario),
      centro_custo_id: itemForm.centro_custo_id || null,
      etapa_servico: itemForm.etapa_servico || null,
      usuario_id: actionUserId || null
    };
    await runAction(
      () => erpApi.medicoes.addItem(selectedMedicao.id, payload),
      'Item adicionado à medição.',
      (updated) => setSelectedMedicao(updated as MedicaoApi)
    );
    setItemForm(emptyItemForm());
  };

  const selectMedicao = async (medicao: MedicaoApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const detail = await erpApi.medicoes.get(medicao.id);
      setSelectedMedicao(detail);
      setActiveView('detalhe');
      const pedido = detail.pedido_faturamento?.id ? await erpApi.pedidosFaturamento.get(detail.pedido_faturamento.id) : null;
      setSelectedPedido(pedido);
      setItemForm((current) => ({ ...current, centro_custo_id: detail.centro_custo_id || '' }));
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const selectObra = (obraId: string): void => {
    const obra = obras.find((item) => item.id === obraId);
    const contrato = contratosObra.find((item) => item.obra_id === obraId && item.status === 'ATIVO');
    const aditivo = contrato?.aditivos?.find((item) => item.status === 'APROVADO');
    setForm((current) => ({
      ...current,
      obra_id: obraId,
      cliente_id: obra?.cliente_id || current.cliente_id,
      centro_custo_id: obra?.centro_custo_id || current.centro_custo_id,
      contrato_obra_id: contrato?.id || '',
      contrato_obra_aditivo_id: aditivo?.id || ''
    }));
  };

  const updateStatusFilter = (value: MedicaoStatus | ''): void => {
    setStatusFilter(value);
    void loadAll(value).catch((filterError) => setError(getErrorMessage(filterError)));
  };

  const activeItens = selectedMedicao?.itens?.filter((item) => item.status === 'ATIVO') || [];
  const selectedPedidoId = selectedPedido?.id || selectedMedicao?.pedido_faturamento?.id || '';
  const contratosDaObra = contratosObra.filter((contrato) => !form.obra_id || contrato.obra_id === form.obra_id);
  const aditivosDoContrato = contratosDaObra
    .find((contrato) => contrato.id === form.contrato_obra_id)
    ?.aditivos?.filter((aditivo) => aditivo.status === 'APROVADO') || [];

  return (
    <section className="enac-web-page enac-medicoes-page">
      <p className="enac-web-eyebrow">PostgreSQL local · {marker}</p>
      <h1>Medições e Faturamento</h1>
      <p className="enac-web-lead">
        Controle interno de medição de obra e pedido de faturamento. Este módulo não emite nota fiscal real.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando medições locais.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {!loading && (
        <div className="enac-module-workspace enac-medicoes-layout">
          <div className="enac-ui-tabs" role="tablist" aria-label="Medições e faturamento">
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
          <section className="enac-finance-main enac-module-panel" aria-label="Lista e detalhe de medições">
            {activeView === 'consulta' && (
              <>
            <div className="enac-solicitacoes-filters enac-programacao-filters">
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => updateStatusFilter(event.target.value as MedicaoStatus | '')} disabled={saving}>
                  <option value="">Todos</option>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => void refresh()} disabled={saving}>Atualizar</button>
            </div>

            <MedicoesTable medicoes={medicoes} selectedId={selectedMedicao?.id} saving={saving} onSelect={(medicao) => void selectMedicao(medicao)} />
              </>
            )}

            {activeView === 'detalhe' && selectedMedicao && (
              <section className="enac-finance-detail enac-medicao-detail">
                <div className="enac-cadastro-toolbar">
                  <div>
                    <span className="enac-web-card-label">{selectedMedicao.numero}</span>
                    <h2>{selectedMedicao.obra_codigo} · {selectedMedicao.cliente_nome}</h2>
                    <p>{formatDate(selectedMedicao.periodo_inicio)} a {formatDate(selectedMedicao.periodo_fim)}</p>
                  </div>
                  <span className={`enac-finance-status enac-finance-status--${statusClass(selectedMedicao.status)}`}>
                    {statusLabels[selectedMedicao.status]}
                  </span>
                </div>

                <div className="enac-finance-meta">
                  <div><span>Valor bruto</span><strong>{formatMoney(selectedMedicao.valor_bruto)}</strong></div>
                  <div><span>Retenções previstas</span><strong>{formatMoney(selectedMedicao.retencoes_previstas)}</strong></div>
                  <div><span>Impostos estimados</span><strong>{formatMoney(selectedMedicao.impostos_estimados)}</strong></div>
                  <div><span>Líquido previsto</span><strong>{formatMoney(selectedMedicao.valor_liquido_previsto)}</strong></div>
                  <div><span>Contrato V3.7</span><strong>{selectedMedicao.contrato_obra_numero || '-'}</strong></div>
                  <div><span>Aditivo V3.7</span><strong>{selectedMedicao.contrato_obra_aditivo_numero || '-'}</strong></div>
                  <div><span>Aprovação</span><strong>{selectedMedicao.aprovacao_status || '-'}</strong></div>
                  <div><span>Aprovado por</span><strong>{selectedMedicao.aprovado_por_nome || '-'}</strong></div>
                  <div><span>Faturamento solicitado</span><strong>{formatDateTime(selectedMedicao.faturamento_solicitado_em)}</strong></div>
                  <div><span>Faturado manualmente</span><strong>{formatDateTime(selectedMedicao.faturado_manual_em)}</strong></div>
                </div>

                {selectedMedicao.bloqueio_alcada_motivo && (
                  <div className="enac-web-alert enac-web-alert--compact">{selectedMedicao.bloqueio_alcada_motivo}</div>
                )}
                {selectedMedicao.devolucao_motivo && (
                  <div className="enac-finance-preview"><span className="enac-web-card-label">Devolução</span><p>{selectedMedicao.devolucao_motivo}</p></div>
                )}
                {selectedMedicao.faturado_manual_observacoes && (
                  <div className="enac-finance-preview"><span className="enac-web-card-label">Faturamento manual</span><p>{selectedMedicao.faturado_manual_observacoes}</p></div>
                )}

                <div className="enac-cadastro-row-actions enac-finance-actions">
                  <label>
                    <span>Usuário</span>
                    <select value={actionUserId} onChange={(event) => setActionUserId(event.target.value)} disabled={saving}>
                      <option value="">Selecione</option>
                      {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>)}
                    </select>
                  </label>
                  {canEditMedicao(selectedMedicao) && <button type="button" onClick={() => void runAction(() => erpApi.medicoes.enviar(selectedMedicao.id, { usuario_id: actionUserId, observacoes: `${marker} - envio para analise` }), 'Medição submetida.', (updated) => setSelectedMedicao(updated as MedicaoApi))} disabled={saving || !actionUserId || activeItens.length === 0}>Enviar</button>}
                  {selectedMedicao.status === 'SUBMETIDA' && <button type="button" onClick={() => void runAction(() => erpApi.medicoes.aprovar(selectedMedicao.id, { usuario_id: actionUserId, observacoes: `${marker} - aprovacao interna` }), 'Medição aprovada.', (updated) => setSelectedMedicao(updated as MedicaoApi))} disabled={saving || !actionUserId}>Aprovar</button>}
                  {selectedMedicao.status === 'SUBMETIDA' && <button type="button" className="enac-cadastro-secondary" onClick={() => void runAction(() => erpApi.medicoes.devolver(selectedMedicao.id, { usuario_id: actionUserId, observacoes: `${marker} - devolucao para ajuste` }), 'Medição devolvida.', (updated) => setSelectedMedicao(updated as MedicaoApi))} disabled={saving || !actionUserId}>Devolver</button>}
                  {selectedMedicao.status !== 'CANCELADA' && selectedMedicao.status !== 'FATURADO_MANUALMENTE' && <button type="button" className="enac-cadastro-secondary" onClick={() => void runAction(() => erpApi.medicoes.cancelar(selectedMedicao.id, { usuario_id: actionUserId, observacoes: `${marker} - cancelamento logico` }), 'Medição cancelada logicamente.', (updated) => setSelectedMedicao(updated as MedicaoApi))} disabled={saving || !actionUserId}>Cancelar</button>}
                  {selectedMedicao.status === 'APROVADA' && <button type="button" onClick={() => void runAction(() => erpApi.pedidosFaturamento.create({ medicao_id: selectedMedicao.id, valor_solicitado: toNumber(selectedMedicao.valor_liquido_previsto), data_solicitacao: today(), usuario_id: actionUserId, responsavel_id: actionUserId, contrato_obra_id: selectedMedicao.contrato_obra_id || null, contrato_obra_aditivo_id: selectedMedicao.contrato_obra_aditivo_id || null, observacoes: `${marker} - pedido interno sem NFS-e real` }), 'Pedido de faturamento criado.', (created) => setSelectedPedido(created as PedidoFaturamentoApi))} disabled={saving || !actionUserId}>Criar pedido de faturamento</button>}
                </div>

                <section className="enac-programacao-contas">
                  <div className="enac-cadastro-toolbar">
                    <div><h2>Itens da medição</h2><p>{activeItens.length} item(ns) ativo(s)</p></div>
                  </div>
                  <div className="enac-cadastro-table-wrap">
                    <table className="enac-web-table enac-medicoes-table">
                      <thead><tr><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th>Centro de custo</th><th>Status</th><th>Ações</th></tr></thead>
                      <tbody>
                        {(selectedMedicao.itens || []).map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.descricao}</strong><br /><span>{item.etapa_servico || '-'}</span></td>
                            <td>{item.quantidade} {item.unidade}</td>
                            <td>{formatMoney(item.valor_unitario)}</td>
                            <td>{formatMoney(item.valor_total)}</td>
                            <td>{item.centro_custo_codigo || '-'}</td>
                            <td>{item.status}</td>
                            <td>
                              {canEditMedicao(selectedMedicao) && item.status === 'ATIVO' && (
                                <button type="button" onClick={() => void runAction(() => erpApi.medicoes.inativarItem(selectedMedicao.id, item.id, { usuario_id: actionUserId, observacoes: `${marker} - inativacao logica de item` }), 'Item inativado logicamente.', (updated) => setSelectedMedicao(updated as MedicaoApi))} disabled={saving || !actionUserId}>
                                  Inativar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(selectedMedicao.itens || []).length === 0 && <tr><td colSpan={7}>Nenhum item lançado.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                {canEditMedicao(selectedMedicao) && (
                  <form className="enac-cadastro-form enac-medicao-item-form" onSubmit={(event) => void createItem(event)}>
                    <div className="enac-cadastro-form-head"><h3>Adicionar item</h3></div>
                    <div className="enac-cadastro-form-grid">
                      <label className="enac-solicitacao-span-2">
                        <span>Descrição<strong className="enac-cadastro-required">Obrigatório</strong></span>
                        <input value={itemForm.descricao} onChange={(event) => setItemForm({ ...itemForm, descricao: event.target.value })} disabled={saving} required />
                      </label>
                      <label>
                        <span>Unidade</span>
                        <input value={itemForm.unidade} onChange={(event) => setItemForm({ ...itemForm, unidade: event.target.value })} disabled={saving} required />
                      </label>
                      <label>
                        <span>Quantidade</span>
                        <input type="number" min="0.0001" step="0.0001" value={itemForm.quantidade} onChange={(event) => setItemForm({ ...itemForm, quantidade: event.target.value })} disabled={saving} required />
                      </label>
                      <label>
                        <span>Valor unitário</span>
                        <input type="number" min="0" step="0.01" value={itemForm.valor_unitario} onChange={(event) => setItemForm({ ...itemForm, valor_unitario: event.target.value })} disabled={saving} required />
                      </label>
                      <label>
                        <span>Centro de custo</span>
                        <select value={itemForm.centro_custo_id} onChange={(event) => setItemForm({ ...itemForm, centro_custo_id: event.target.value })} disabled={saving}>
                          <option value="">Sem centro</option>
                          {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
                        </select>
                      </label>
                      <label className="enac-solicitacao-span-2">
                        <span>Etapa/serviço</span>
                        <input value={itemForm.etapa_servico} onChange={(event) => setItemForm({ ...itemForm, etapa_servico: event.target.value })} disabled={saving} />
                      </label>
                    </div>
                    <div className="enac-cadastro-actions"><button type="submit" disabled={saving}>Adicionar item</button></div>
                  </form>
                )}

                <PedidoFaturamentoPanel
                  pedidoId={selectedPedidoId}
                  selectedPedido={selectedPedido}
                  pedidos={pedidos}
                  actionUserId={actionUserId}
                  saving={saving}
                  onSelect={(pedido) => setSelectedPedido(pedido)}
                  onAprovar={() => selectedPedido && void runAction(() => erpApi.pedidosFaturamento.aprovar(selectedPedido.id, { usuario_id: actionUserId, observacoes: `${marker} - aprovacao de pedido interno` }), 'Pedido de faturamento aprovado.', (updated) => setSelectedPedido(updated as PedidoFaturamentoApi))}
                  onMarcarFaturado={() => selectedPedido && void runAction(() => erpApi.pedidosFaturamento.marcarFaturadoManualmente(selectedPedido.id, { usuario_id: actionUserId, data_faturamento: today(), observacoes: `${marker} - faturamento externo informado manualmente; nao emite NFS-e real` }), 'Faturamento manual registrado.', (updated) => setSelectedPedido(updated as PedidoFaturamentoApi))}
                />
              </section>
            )}
            {activeView === 'detalhe' && !selectedMedicao && (
              <div className="enac-cadastro-empty">Selecione uma medição na aba Consulta para visualizar detalhes e faturamento.</div>
            )}
          </section>
          )}

          {activeView === 'novo' && (
          <section className="enac-finance-panel enac-module-panel" aria-label="Criar medição">
            <form className="enac-cadastro-form enac-finance-form" onSubmit={(event) => void createMedicao(event)}>
              <div className="enac-cadastro-form-head"><h3>Nova medição</h3></div>
              <div className="enac-cadastro-form-grid">
                <label>
                  <span>Empresa</span>
                  <select value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })} disabled={saving} required>
                    <option value="">Selecione</option>
                    {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.razao_social}</option>)}
                  </select>
                </label>
                <label>
                  <span>Obra</span>
                  <select value={form.obra_id} onChange={(event) => selectObra(event.target.value)} disabled={saving} required>
                    <option value="">Selecione</option>
                    {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
                  </select>
                </label>
                <label>
                  <span>Cliente</span>
                  <select value={form.cliente_id} onChange={(event) => setForm({ ...form, cliente_id: event.target.value })} disabled={saving} required>
                    <option value="">Selecione</option>
                    {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
                  </select>
                </label>
                <label>
                  <span>Centro de custo</span>
                  <select value={form.centro_custo_id} onChange={(event) => setForm({ ...form, centro_custo_id: event.target.value })} disabled={saving}>
                    <option value="">Sem centro</option>
                    {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
                  </select>
                </label>
                <label>
                  <span>Número</span>
                  <input value={form.numero} onChange={(event) => setForm({ ...form, numero: event.target.value })} disabled={saving} placeholder="Gerado se vazio" />
                </label>
                <label>
                  <span>Competência</span>
                  <input type="month" value={form.competencia} onChange={(event) => setForm({ ...form, competencia: event.target.value })} disabled={saving} required />
                </label>
                <label>
                  <span>Período inicial</span>
                  <input type="date" value={form.periodo_inicio} onChange={(event) => setForm({ ...form, periodo_inicio: event.target.value })} disabled={saving} required />
                </label>
                <label>
                  <span>Período final</span>
                  <input type="date" value={form.periodo_fim} onChange={(event) => setForm({ ...form, periodo_fim: event.target.value })} disabled={saving} required />
                </label>
                <label>
                  <span>Contrato de obra</span>
                  <select value={form.contrato_obra_id} onChange={(event) => setForm({ ...form, contrato_obra_id: event.target.value, contrato_obra_aditivo_id: '' })} disabled={saving}>
                    <option value="">Sem contrato V3.7</option>
                    {contratosDaObra.map((contrato) => <option key={contrato.id} value={contrato.id}>{contrato.numero} - {formatMoney(contrato.valor_total_contratado)}</option>)}
                  </select>
                </label>
                <label>
                  <span>Aditivo aprovado</span>
                  <select value={form.contrato_obra_aditivo_id} onChange={(event) => setForm({ ...form, contrato_obra_aditivo_id: event.target.value })} disabled={saving || !form.contrato_obra_id}>
                    <option value="">Sem aditivo</option>
                    {aditivosDoContrato.map((aditivo) => <option key={aditivo.id} value={aditivo.id}>{aditivo.numero} - {formatMoney(aditivo.valor_delta)}</option>)}
                  </select>
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Contrato/escopo</span>
                  <textarea value={form.contrato_escopo} onChange={(event) => setForm({ ...form, contrato_escopo: event.target.value })} disabled={saving} />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} disabled={saving} />
                </label>
              </div>
              <div className="enac-cadastro-actions"><button type="submit" disabled={saving || !form.company_id || !form.obra_id || !form.cliente_id}>Criar medição</button></div>
            </form>

            <div className="enac-finance-preview">
              <span className="enac-web-card-label">Responsável da ação</span>
              <label className="enac-programacao-user">
                <span>Usuário</span>
                <select value={actionUserId} onChange={(event) => setActionUserId(event.target.value)} disabled={saving}>
                  <option value="">Selecione</option>
                  {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome} - {usuario.perfil_principal || 'perfil'}</option>)}
                </select>
              </label>
            </div>

            <div className="enac-finance-preview enac-medicoes-warning">
              <span className="enac-web-card-label">Limite da V3.6</span>
              <p>Registro interno. Não emite NFS-e real, não integra prefeitura, não gera boleto e não baixa recebível automaticamente.</p>
            </div>
          </section>
          )}
        </div>
      )}
    </section>
  );
}

function MedicoesTable({
  medicoes,
  selectedId,
  saving,
  onSelect
}: {
  medicoes: MedicaoApi[];
  selectedId?: string;
  saving: boolean;
  onSelect: (medicao: MedicaoApi) => void;
}): JSX.Element {
  if (medicoes.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma medição encontrada.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-medicoes-table">
        <thead><tr><th>Número</th><th>Status</th><th>Competência</th><th>Obra</th><th>Cliente</th><th>Total</th><th>Ações</th></tr></thead>
        <tbody>
          {medicoes.map((medicao) => (
            <tr key={medicao.id} className={selectedId === medicao.id ? 'enac-finance-row-selected' : ''}>
              <td><strong>{medicao.numero}</strong></td>
              <td><span className={`enac-finance-status enac-finance-status--${statusClass(medicao.status)}`}>{statusLabels[medicao.status]}</span></td>
              <td>{String(medicao.competencia || '').slice(0, 7)}</td>
              <td>{medicao.obra_codigo || '-'}</td>
              <td>{medicao.cliente_nome || '-'}</td>
              <td>{formatMoney(medicao.valor_liquido_previsto)}<br /><span>{medicao.itens_ativos || 0} item(ns)</span></td>
              <td><button type="button" onClick={() => onSelect(medicao)} disabled={saving}>Detalhe</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PedidoFaturamentoPanel({
  pedidoId,
  selectedPedido,
  pedidos,
  actionUserId,
  saving,
  onSelect,
  onAprovar,
  onMarcarFaturado
}: {
  pedidoId: string;
  selectedPedido: PedidoFaturamentoApi | null;
  pedidos: PedidoFaturamentoApi[];
  actionUserId: string;
  saving: boolean;
  onSelect: (pedido: PedidoFaturamentoApi) => void;
  onAprovar: () => void;
  onMarcarFaturado: () => void;
}): JSX.Element {
  const pedido = selectedPedido || pedidos.find((item) => item.id === pedidoId) || null;

  return (
    <section className="enac-programacao-contas">
      <div className="enac-cadastro-toolbar">
        <div><h2>Pedido de faturamento</h2><p>{pedido ? pedido.codigo : 'Sem pedido ativo para a medição'}</p></div>
      </div>
      {pedido ? (
        <>
          <div className="enac-finance-meta">
            <div><span>Código</span><strong>{pedido.codigo}</strong></div>
            <div><span>Status</span><strong>{pedidoStatusLabels[pedido.status] || pedido.status}</strong></div>
            <div><span>Valor solicitado</span><strong>{formatMoney(pedido.valor_solicitado)}</strong></div>
            <div><span>Data solicitação</span><strong>{formatDate(pedido.data_solicitacao)}</strong></div>
            <div><span>Aprovação</span><strong>{pedido.aprovacao_status || '-'}</strong></div>
            <div><span>Faturado em</span><strong>{formatDateTime(pedido.faturado_manual_em)}</strong></div>
          </div>
          {pedido.bloqueio_alcada_motivo && <div className="enac-web-alert enac-web-alert--compact">{pedido.bloqueio_alcada_motivo}</div>}
          {pedido.faturado_manual_observacoes && <div className="enac-finance-preview"><span className="enac-web-card-label">Observações</span><p>{pedido.faturado_manual_observacoes}</p></div>}
          <div className="enac-cadastro-row-actions enac-finance-actions">
            <button type="button" onClick={() => onSelect(pedido)} disabled={saving}>Atualizar pedido</button>
            {pedido.status === 'SOLICITADO' && <button type="button" onClick={onAprovar} disabled={saving || !actionUserId}>Aprovar pedido</button>}
            {pedido.status === 'APROVADO' && <button type="button" onClick={onMarcarFaturado} disabled={saving || !actionUserId}>Marcar faturado manualmente</button>}
          </div>
        </>
      ) : (
        <div className="enac-cadastro-empty">Crie um pedido a partir de uma medição aprovada.</div>
      )}
    </section>
  );
}
