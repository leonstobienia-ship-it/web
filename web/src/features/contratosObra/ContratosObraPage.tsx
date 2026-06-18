import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type ClienteApi,
  type ContratoObraApi,
  type ContratoObraAditivoApi,
  type ContratoObraAditivoPayload,
  type ContratoObraItemPayload,
  type ContratoObraPayload,
  type ContratoObraStatus,
  type EmpresaApi,
  type ObraApi,
  type UsuarioApi
} from '../../services/erpApi';

interface ContratoForm {
  company_id: string;
  cliente_id: string;
  obra_id: string;
  centro_custo_id: string;
  numero: string;
  objeto: string;
  escopo_resumo: string;
  valor_original: string;
  data_inicio: string;
  data_fim: string;
  percentual_retencao_previsto: string;
  impostos_previstos: string;
  observacoes: string;
}

interface ItemForm {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  centro_custo_id: string;
  etapa_servico: string;
}

interface AditivoForm {
  numero: string;
  tipo: string;
  descricao: string;
  escopo_descricao: string;
  valor_delta: string;
  prazo_delta_dias: string;
  nova_data_fim: string;
  justificativa: string;
}

const marker = 'DEV_LOCAL_V3_7';

const statusLabels: Record<ContratoObraStatus, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  SUSPENSO: 'Suspenso',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado'
};

const aditivoStatusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDO: 'Submetido',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  CANCELADO: 'Cancelado'
};

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const emptyContratoForm = (): ContratoForm => ({
  company_id: '',
  cliente_id: '',
  obra_id: '',
  centro_custo_id: '',
  numero: `CT-${Date.now()}`,
  objeto: `${marker} - contrato de obra local`,
  escopo_resumo: `${marker} - escopo comercial contratado sem emissao fiscal real`,
  valor_original: '10000',
  data_inicio: today(),
  data_fim: addDays(90),
  percentual_retencao_previsto: '0',
  impostos_previstos: `${marker} - campos informativos`,
  observacoes: `${marker} - contrato local sem banco, boleto, prefeitura ou CNAB`
});

const emptyItemForm = (): ItemForm => ({
  codigo: 'ITEM-01',
  descricao: `${marker} - servico contratado`,
  unidade: 'un',
  quantidade: '1',
  valor_unitario: '10000',
  centro_custo_id: '',
  etapa_servico: `${marker} - etapa contratual`
});

const emptyAditivoForm = (): AditivoForm => ({
  numero: `AD-${Date.now()}`,
  tipo: 'VALOR_ESCOPO',
  descricao: `${marker} - aditivo de escopo e valor`,
  escopo_descricao: `${marker} - ampliacao de escopo aprovada internamente`,
  valor_delta: '5000',
  prazo_delta_dias: '15',
  nova_data_fim: addDays(120),
  justificativa: `${marker} - aditivo local sem faturamento automatico`
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

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

export function ContratosObraPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [contratos, setContratos] = React.useState<ContratoObraApi[]>([]);
  const [selectedContrato, setSelectedContrato] = React.useState<ContratoObraApi | null>(null);
  const [form, setForm] = React.useState<ContratoForm>(emptyContratoForm());
  const [itemForm, setItemForm] = React.useState<ItemForm>(emptyItemForm());
  const [aditivoForm, setAditivoForm] = React.useState<AditivoForm>(emptyAditivoForm());
  const [statusFilter, setStatusFilter] = React.useState<ContratoObraStatus | ''>('');
  const [clienteFilter, setClienteFilter] = React.useState<string>('');
  const [obraFilter, setObraFilter] = React.useState<string>('');
  const [actionUserId, setActionUserId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const loadAll = React.useCallback(async (): Promise<void> => {
    const [empresasResponse, clientesResponse, obrasResponse, centrosResponse, usuariosResponse, contratosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.clientes.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.usuarios.list(),
      erpApi.contratosObra.list({ status: statusFilter, cliente_id: clienteFilter || undefined, obra_id: obraFilter || undefined })
    ]);
    const companyId = empresasResponse.find((empresa) => empresa.cnpj === '00.000.000/0001-33')?.id || empresasResponse[0]?.id || '';
    const activeClientes = clientesResponse.filter((cliente) => cliente.status !== 'inativo');
    const activeObras = obrasResponse.filter((obra) => obra.status !== 'inativo');
    const activeCentros = centrosResponse.filter((centro) => centro.status !== 'inativo');
    const defaultObra = activeObras.find((obra) => obra.company_id === companyId) || activeObras[0];
    const defaultClienteId = defaultObra?.cliente_id || activeClientes.find((cliente) => cliente.company_id === companyId)?.id || activeClientes[0]?.id || '';
    setEmpresas(empresasResponse);
    setClientes(activeClientes);
    setObras(activeObras);
    setCentrosCusto(activeCentros);
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setContratos(contratosResponse);
    setForm((current) => ({
      ...current,
      company_id: current.company_id || companyId,
      obra_id: current.obra_id || defaultObra?.id || '',
      cliente_id: current.cliente_id || defaultClienteId,
      centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || ''
    }));
    setItemForm((current) => ({ ...current, centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '' }));
    setActionUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, [clienteFilter, obraFilter, statusFilter]);

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

  const refresh = async (contratoId = selectedContrato?.id): Promise<void> => {
    await loadAll();
    if (contratoId) {
      setSelectedContrato(await erpApi.contratosObra.get(contratoId));
    }
  };

  const runAction = async (callback: () => Promise<ContratoObraApi>, successMessage: string): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await callback();
      setSelectedContrato(updated);
      await refresh(updated.id);
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const createContrato = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const payload: ContratoObraPayload = {
      company_id: form.company_id,
      cliente_id: form.cliente_id,
      obra_id: form.obra_id,
      centro_custo_id: form.centro_custo_id || null,
      numero: form.numero,
      objeto: form.objeto,
      escopo_resumo: form.escopo_resumo,
      valor_original: toNumber(form.valor_original),
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      percentual_retencao_previsto: form.percentual_retencao_previsto ? toNumber(form.percentual_retencao_previsto) : null,
      impostos_previstos: form.impostos_previstos || null,
      observacoes: form.observacoes || null,
      usuario_id: actionUserId || null
    };
    await runAction(async () => erpApi.contratosObra.create(payload), 'Contrato criado em rascunho.');
    setForm(emptyContratoForm());
  };

  const addItem = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedContrato) {
      return;
    }
    const payload: ContratoObraItemPayload = {
      codigo: itemForm.codigo || null,
      descricao: itemForm.descricao,
      unidade: itemForm.unidade,
      quantidade: toNumber(itemForm.quantidade),
      valor_unitario: toNumber(itemForm.valor_unitario),
      centro_custo_id: itemForm.centro_custo_id || null,
      etapa_servico: itemForm.etapa_servico || null,
      usuario_id: actionUserId || null
    };
    await runAction(async () => erpApi.contratosObra.addItem(selectedContrato.id, payload), 'Item de escopo criado.');
    setItemForm(emptyItemForm());
  };

  const createAditivo = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedContrato) {
      return;
    }
    const payload: ContratoObraAditivoPayload = {
      numero: aditivoForm.numero,
      tipo: aditivoForm.tipo || 'VALOR_ESCOPO',
      descricao: aditivoForm.descricao,
      escopo_descricao: aditivoForm.escopo_descricao || null,
      valor_delta: toNumber(aditivoForm.valor_delta),
      prazo_delta_dias: aditivoForm.prazo_delta_dias ? Math.trunc(toNumber(aditivoForm.prazo_delta_dias)) : null,
      nova_data_fim: aditivoForm.nova_data_fim || null,
      justificativa: aditivoForm.justificativa || null,
      usuario_id: actionUserId || null
    };
    await runAction(async () => erpApi.contratosObra.createAditivo(selectedContrato.id, payload), 'Aditivo criado em rascunho.');
    setAditivoForm(emptyAditivoForm());
  };

  const selectContrato = async (contrato: ContratoObraApi): Promise<void> => {
    setError('');
    setMessage('');
    setSelectedContrato(await erpApi.contratosObra.get(contrato.id));
  };

  const activeUsers = usuarios.filter((usuario) => usuario.ativo !== false);

  if (loading) {
    return <section className="enac-cadastros-page enac-foundation-page"><p>Carregando contratos de obra.</p></section>;
  }

  return (
    <section className="enac-cadastros-page enac-foundation-page">
      <p className="enac-web-eyebrow">POSTGRESQL LOCAL · {marker}</p>
      <h1>Contratos de Obra</h1>
      <p className="enac-web-lead">
        Base contratual de obras, escopo comercial e aditivos. O faturamento permanece manual e não há emissão fiscal real,
        prefeitura, boleto, banco ou CNAB.
      </p>

      {error && <div className="enac-web-alert"><strong>Erro</strong><p>{error}</p></div>}
      {message && <div className="enac-web-alert enac-web-alert--success"><strong>{message}</strong></div>}

      <div className="enac-cadastros-context">
        <span>{contratos.length} contrato(s)</span>
        <label>
          Usuario
          <select value={actionUserId} onChange={(event) => setActionUserId(event.target.value)}>
            {activeUsers.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="enac-cadastro-form">
        <div className="enac-cadastro-form-head">
          <h3>Novo contrato</h3>
        </div>
        <form onSubmit={(event) => void createContrato(event)}>
          <div className="enac-cadastro-form-grid">
            <label><span>Empresa</span><select value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })}>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.razao_social}</option>)}</select></label>
            <label><span>Cliente</span><select value={form.cliente_id} onChange={(event) => setForm({ ...form, cliente_id: event.target.value })}>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label>
            <label><span>Obra</span><select value={form.obra_id} onChange={(event) => {
              const obra = obras.find((item) => item.id === event.target.value);
              setForm({ ...form, obra_id: event.target.value, cliente_id: obra?.cliente_id || form.cliente_id, centro_custo_id: obra?.centro_custo_id || form.centro_custo_id });
            }}>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}</select></label>
            <label><span>Centro de custo</span><select value={form.centro_custo_id} onChange={(event) => setForm({ ...form, centro_custo_id: event.target.value })}><option value="">Sem centro</option>{centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}</select></label>
            <label><span>Numero</span><input value={form.numero} onChange={(event) => setForm({ ...form, numero: event.target.value })} /></label>
            <label><span>Valor original</span><input type="number" min="0" step="0.01" value={form.valor_original} onChange={(event) => setForm({ ...form, valor_original: event.target.value })} /></label>
            <label><span>Inicio</span><input type="date" value={form.data_inicio} onChange={(event) => setForm({ ...form, data_inicio: event.target.value })} /></label>
            <label><span>Fim</span><input type="date" value={form.data_fim} onChange={(event) => setForm({ ...form, data_fim: event.target.value })} /></label>
            <label><span>Retencao prevista %</span><input type="number" min="0" step="0.01" value={form.percentual_retencao_previsto} onChange={(event) => setForm({ ...form, percentual_retencao_previsto: event.target.value })} /></label>
            <label><span>Impostos previstos</span><input value={form.impostos_previstos} onChange={(event) => setForm({ ...form, impostos_previstos: event.target.value })} /></label>
            <label><span>Objeto</span><textarea value={form.objeto} onChange={(event) => setForm({ ...form, objeto: event.target.value })} /></label>
            <label><span>Escopo</span><textarea value={form.escopo_resumo} onChange={(event) => setForm({ ...form, escopo_resumo: event.target.value })} /></label>
            <label><span>Observacoes</span><textarea value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} /></label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving || !form.company_id || !form.cliente_id || !form.obra_id}>Criar contrato</button>
          </div>
        </form>
      </div>

      <div className="enac-cadastro-toolbar">
        <div>
          <h2>Lista de contratos</h2>
          <p>Filtre por status, cliente ou obra.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={saving}>Atualizar</button>
      </div>
      <div className="enac-cadastro-form-grid">
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ContratoObraStatus | '')}><option value="">Todos</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label><span>Cliente</span><select value={clienteFilter} onChange={(event) => setClienteFilter(event.target.value)}><option value="">Todos</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label>
        <label><span>Obra</span><select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)}><option value="">Todas</option>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}</select></label>
      </div>

      <div className="enac-cadastro-table-wrap">
        <table className="enac-cadastro-table">
          <thead>
            <tr><th>Numero</th><th>Status</th><th>Cliente</th><th>Obra</th><th>Total</th><th>Medido</th><th>Saldo</th><th>Acoes</th></tr>
          </thead>
          <tbody>
            {contratos.map((contrato) => (
              <tr key={contrato.id}>
                <td>{contrato.numero}</td>
                <td><span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(contrato.status)}`}>{statusLabels[contrato.status]}</span></td>
                <td>{contrato.cliente_nome}</td>
                <td>{contrato.obra_codigo}</td>
                <td>{formatMoney(contrato.valor_total_contratado)}</td>
                <td>{formatMoney(contrato.valor_medido)}</td>
                <td>{formatMoney(contrato.saldo_contratual)}</td>
                <td><button type="button" onClick={() => void selectContrato(contrato)}>Detalhe</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedContrato && (
        <article className="enac-solicitacao-detail">
          <header>
            <div>
              <h2>{selectedContrato.numero}</h2>
              <p>{selectedContrato.objeto}</p>
            </div>
            <span className={`enac-solicitacao-status enac-solicitacao-status--${statusClass(selectedContrato.status)}`}>{statusLabels[selectedContrato.status]}</span>
          </header>

          <div className="enac-web-grid">
            <div><span>Valor original</span><strong>{formatMoney(selectedContrato.valor_original)}</strong></div>
            <div><span>Aditivos aprovados</span><strong>{formatMoney(selectedContrato.valor_aditivos)}</strong></div>
            <div><span>Total contratado</span><strong>{formatMoney(selectedContrato.valor_total_contratado)}</strong></div>
            <div><span>Saldo contratual</span><strong>{formatMoney(selectedContrato.saldo_contratual)}</strong></div>
            <div><span>Vigencia</span><strong>{formatDate(selectedContrato.data_inicio)} a {formatDate(selectedContrato.data_fim)}</strong></div>
            <div><span>Obra</span><strong>{selectedContrato.obra_codigo}</strong></div>
          </div>

          <div className="enac-solicitacao-detail-actions">
            {selectedContrato.status === 'RASCUNHO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.ativar(selectedContrato.id, { usuario_id: actionUserId, observacoes: `${marker} - ativacao local` }), 'Contrato ativado.')} disabled={saving || !actionUserId}>Ativar</button>}
            {selectedContrato.status === 'ATIVO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.suspender(selectedContrato.id, { usuario_id: actionUserId, motivo: `${marker} - suspensao logica` }), 'Contrato suspenso.')} disabled={saving || !actionUserId}>Suspender</button>}
            {['ATIVO', 'SUSPENSO'].includes(selectedContrato.status) && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.encerrar(selectedContrato.id, { usuario_id: actionUserId, motivo: `${marker} - encerramento logico` }), 'Contrato encerrado.')} disabled={saving || !actionUserId}>Encerrar</button>}
            {!['CANCELADO', 'ENCERRADO'].includes(selectedContrato.status) && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.cancelar(selectedContrato.id, { usuario_id: actionUserId, motivo: `${marker} - cancelamento logico` }), 'Contrato cancelado.')} disabled={saving || !actionUserId}>Cancelar</button>}
          </div>

          <h3>Itens de escopo</h3>
          {selectedContrato.status === 'RASCUNHO' && (
            <form className="enac-cadastro-form" onSubmit={(event) => void addItem(event)}>
              <div className="enac-cadastro-form-grid">
                <label><span>Codigo</span><input value={itemForm.codigo} onChange={(event) => setItemForm({ ...itemForm, codigo: event.target.value })} /></label>
                <label><span>Descricao</span><input value={itemForm.descricao} onChange={(event) => setItemForm({ ...itemForm, descricao: event.target.value })} /></label>
                <label><span>Unidade</span><input value={itemForm.unidade} onChange={(event) => setItemForm({ ...itemForm, unidade: event.target.value })} /></label>
                <label><span>Quantidade</span><input type="number" min="0" step="0.0001" value={itemForm.quantidade} onChange={(event) => setItemForm({ ...itemForm, quantidade: event.target.value })} /></label>
                <label><span>Valor unitario</span><input type="number" min="0" step="0.01" value={itemForm.valor_unitario} onChange={(event) => setItemForm({ ...itemForm, valor_unitario: event.target.value })} /></label>
                <label><span>Centro de custo</span><select value={itemForm.centro_custo_id} onChange={(event) => setItemForm({ ...itemForm, centro_custo_id: event.target.value })}><option value="">Sem centro</option>{centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo}</option>)}</select></label>
                <label><span>Etapa</span><input value={itemForm.etapa_servico} onChange={(event) => setItemForm({ ...itemForm, etapa_servico: event.target.value })} /></label>
              </div>
              <div className="enac-cadastro-actions"><button type="submit" disabled={saving}>Adicionar item</button></div>
            </form>
          )}
          <table className="enac-cadastro-table">
            <thead><tr><th>Codigo</th><th>Descricao</th><th>Status</th><th>Qtd.</th><th>Valor</th><th>Acoes</th></tr></thead>
            <tbody>
              {(selectedContrato.itens || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo || '-'}</td>
                  <td>{item.descricao}</td>
                  <td>{item.status}</td>
                  <td>{toNumber(item.quantidade)}</td>
                  <td>{formatMoney(item.valor_total)}</td>
                  <td>{selectedContrato.status === 'RASCUNHO' && item.status === 'ATIVO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.inativarItem(selectedContrato.id, item.id, { usuario_id: actionUserId, motivo: `${marker} - inativacao logica` }), 'Item inativado.')} disabled={saving}>Inativar</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Aditivos</h3>
          {['ATIVO', 'SUSPENSO'].includes(selectedContrato.status) && (
            <form className="enac-cadastro-form" onSubmit={(event) => void createAditivo(event)}>
              <div className="enac-cadastro-form-grid">
                <label><span>Numero</span><input value={aditivoForm.numero} onChange={(event) => setAditivoForm({ ...aditivoForm, numero: event.target.value })} /></label>
                <label><span>Tipo</span><input value={aditivoForm.tipo} onChange={(event) => setAditivoForm({ ...aditivoForm, tipo: event.target.value })} /></label>
                <label><span>Valor</span><input type="number" min="0" step="0.01" value={aditivoForm.valor_delta} onChange={(event) => setAditivoForm({ ...aditivoForm, valor_delta: event.target.value })} /></label>
                <label><span>Prazo dias</span><input type="number" min="0" step="1" value={aditivoForm.prazo_delta_dias} onChange={(event) => setAditivoForm({ ...aditivoForm, prazo_delta_dias: event.target.value })} /></label>
                <label><span>Nova data fim</span><input type="date" value={aditivoForm.nova_data_fim} onChange={(event) => setAditivoForm({ ...aditivoForm, nova_data_fim: event.target.value })} /></label>
                <label><span>Descricao</span><textarea value={aditivoForm.descricao} onChange={(event) => setAditivoForm({ ...aditivoForm, descricao: event.target.value })} /></label>
                <label><span>Escopo</span><textarea value={aditivoForm.escopo_descricao} onChange={(event) => setAditivoForm({ ...aditivoForm, escopo_descricao: event.target.value })} /></label>
                <label><span>Justificativa</span><textarea value={aditivoForm.justificativa} onChange={(event) => setAditivoForm({ ...aditivoForm, justificativa: event.target.value })} /></label>
              </div>
              <div className="enac-cadastro-actions"><button type="submit" disabled={saving}>Criar aditivo</button></div>
            </form>
          )}
          <table className="enac-cadastro-table">
            <thead><tr><th>Numero</th><th>Status</th><th>Valor</th><th>Nova data</th><th>Acoes</th></tr></thead>
            <tbody>
              {(selectedContrato.aditivos || []).map((aditivo: ContratoObraAditivoApi) => (
                <tr key={aditivo.id}>
                  <td>{aditivo.numero}</td>
                  <td>{aditivoStatusLabels[aditivo.status] || aditivo.status}</td>
                  <td>{formatMoney(aditivo.valor_delta)}</td>
                  <td>{formatDate(aditivo.nova_data_fim)}</td>
                  <td>
                    {aditivo.status === 'RASCUNHO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.submeterAditivo(selectedContrato.id, aditivo.id, { usuario_id: actionUserId, observacoes: `${marker} - submissao` }), 'Aditivo submetido.')} disabled={saving}>Submeter</button>}
                    {aditivo.status === 'SUBMETIDO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.aprovarAditivo(selectedContrato.id, aditivo.id, { usuario_id: actionUserId, observacoes: `${marker} - aprovacao` }), 'Aditivo aprovado.')} disabled={saving}>Aprovar</button>}
                    {aditivo.status === 'SUBMETIDO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.reprovarAditivo(selectedContrato.id, aditivo.id, { usuario_id: actionUserId, motivo: `${marker} - reprovacao` }), 'Aditivo reprovado.')} disabled={saving}>Reprovar</button>}
                    {aditivo.status !== 'APROVADO' && aditivo.status !== 'CANCELADO' && <button type="button" onClick={() => void runAction(() => erpApi.contratosObra.cancelarAditivo(selectedContrato.id, aditivo.id, { usuario_id: actionUserId, motivo: `${marker} - cancelamento` }), 'Aditivo cancelado.')} disabled={saving}>Cancelar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
