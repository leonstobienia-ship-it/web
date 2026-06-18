import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type ContratoObraApi,
  type EmpresaApi,
  type ObraApi,
  type OrcamentoItemTipo,
  type OrcamentoObraApi,
  type OrcamentoObraCronogramaPayload,
  type OrcamentoObraItemPayload,
  type OrcamentoObraPacotePayload,
  type OrcamentoObraPayload,
  type OrcamentoObraResumoApi,
  type OrcamentoObraStatus,
  type PlanejamentoExecutivoApi,
  type PlanejamentoExecutivoPayload,
  type PlanejamentoExecutivoStatus,
  type UsuarioApi
} from '../../services/erpApi';

interface OrcamentoForm {
  company_id: string;
  obra_id: string;
  contrato_obra_id: string;
  centro_custo_id: string;
  codigo: string;
  versao: string;
  descricao: string;
  competencia_base: string;
  margem_prevista_percentual: string;
  observacoes: string;
}

interface PacoteForm {
  codigo: string;
  nome: string;
  descricao: string;
  etapa: string;
  centro_custo_id: string;
  ordem: string;
}

interface ItemForm {
  pacote_id: string;
  centro_custo_id: string;
  tipo: OrcamentoItemTipo;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario_previsto: string;
  insumo_descricao: string;
  mao_obra_categoria: string;
  equipamento_descricao: string;
  observacoes: string;
}

interface CronogramaForm {
  pacote_id: string;
  competencia: string;
  valor_previsto: string;
  percentual_fisico_previsto: string;
  observacoes: string;
}

interface PlanejamentoForm {
  obra_id: string;
  orcamento_id: string;
  contrato_obra_id: string;
  centro_custo_id: string;
  etapa: string;
  descricao: string;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  responsavel_id: string;
  observacoes: string;
}

const marker = 'DEV_LOCAL_V3_8';

const statusLabels: Record<OrcamentoObraStatus, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em revisão',
  APROVADO: 'Aprovado',
  BLOQUEADO: 'Bloqueado',
  CANCELADO: 'Cancelado'
};

const planejamentoStatusLabels: Record<PlanejamentoExecutivoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  REVISADO: 'Revisado',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado'
};

const tipoLabels: Record<OrcamentoItemTipo, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  EQUIPAMENTO: 'Equipamento',
  SERVICO: 'Serviço',
  OUTROS: 'Outros'
};

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const competenciaAtual = (): string => today().slice(0, 7);

const emptyOrcamentoForm = (): OrcamentoForm => ({
  company_id: '',
  obra_id: '',
  contrato_obra_id: '',
  centro_custo_id: '',
  codigo: `ORC-${Date.now()}`,
  versao: 'V1',
  descricao: `${marker} - orçamento base executivo`,
  competencia_base: competenciaAtual(),
  margem_prevista_percentual: '18',
  observacoes: `${marker} - orçamento local sem fiscal, boleto, banco ou CNAB`
});

const emptyPacoteForm = (): PacoteForm => ({
  codigo: 'PAC-01',
  nome: `${marker} - Etapa executiva`,
  descricao: `${marker} - pacote de serviço`,
  etapa: 'Execução',
  centro_custo_id: '',
  ordem: '1'
});

const emptyItemForm = (): ItemForm => ({
  pacote_id: '',
  centro_custo_id: '',
  tipo: 'MATERIAL',
  codigo: 'ITEM-01',
  descricao: `${marker} - item orçamentário`,
  unidade: 'un',
  quantidade: '1',
  valor_unitario_previsto: '1000',
  insumo_descricao: `${marker} - insumo previsto`,
  mao_obra_categoria: '',
  equipamento_descricao: '',
  observacoes: `${marker} - previsto local`
});

const emptyCronogramaForm = (): CronogramaForm => ({
  pacote_id: '',
  competencia: competenciaAtual(),
  valor_previsto: '1000',
  percentual_fisico_previsto: '10',
  observacoes: `${marker} - competência prevista`
});

const emptyPlanejamentoForm = (): PlanejamentoForm => ({
  obra_id: '',
  orcamento_id: '',
  contrato_obra_id: '',
  centro_custo_id: '',
  etapa: `${marker} - etapa executiva`,
  descricao: `${marker} - planejamento operacional local`,
  data_inicio_prevista: today(),
  data_fim_prevista: addDays(30),
  responsavel_id: '',
  observacoes: `${marker} - sem integração fiscal ou bancária`
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

type OrcamentosPlanejamentoView = 'orcamentos' | 'planejamento';
type TelaTab = 'consulta' | 'novo';

export function OrcamentosPlanejamentoPage({ initialView = 'orcamentos' }: { initialView?: OrcamentosPlanejamentoView }): JSX.Element {
  const moduleView = initialView;
  const isPlanejamento = moduleView === 'planejamento';
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [contratos, setContratos] = React.useState<ContratoObraApi[]>([]);
  const [orcamentos, setOrcamentos] = React.useState<OrcamentoObraApi[]>([]);
  const [planejamentos, setPlanejamentos] = React.useState<PlanejamentoExecutivoApi[]>([]);
  const [selectedOrcamento, setSelectedOrcamento] = React.useState<OrcamentoObraApi | null>(null);
  const [selectedPlanejamento, setSelectedPlanejamento] = React.useState<PlanejamentoExecutivoApi | null>(null);
  const [resumo, setResumo] = React.useState<OrcamentoObraResumoApi | null>(null);
  const [orcamentoForm, setOrcamentoForm] = React.useState<OrcamentoForm>(emptyOrcamentoForm());
  const [pacoteForm, setPacoteForm] = React.useState<PacoteForm>(emptyPacoteForm());
  const [itemForm, setItemForm] = React.useState<ItemForm>(emptyItemForm());
  const [cronogramaForm, setCronogramaForm] = React.useState<CronogramaForm>(emptyCronogramaForm());
  const [planejamentoForm, setPlanejamentoForm] = React.useState<PlanejamentoForm>(emptyPlanejamentoForm());
  const [statusFilter, setStatusFilter] = React.useState<OrcamentoObraStatus | ''>('');
  const [planejamentoStatusFilter, setPlanejamentoStatusFilter] = React.useState<PlanejamentoExecutivoStatus | ''>('');
  const [obraFilter, setObraFilter] = React.useState<string>('');
  const [actionUserId, setActionUserId] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<TelaTab>('consulta');

  React.useEffect(() => {
    setActiveTab('consulta');
    setError('');
    setMessage('');
  }, [initialView]);

  const loadAll = React.useCallback(async (): Promise<void> => {
    const [empresasResponse, obrasResponse, centrosResponse, usuariosResponse, contratosResponse, orcamentosResponse, planejamentosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.usuarios.list(),
      erpApi.contratosObra.list({ status: 'ATIVO' }),
      erpApi.orcamentosObra.list({ status: statusFilter, obra_id: obraFilter || undefined }),
      erpApi.planejamentoExecutivo.list({ status: planejamentoStatusFilter, obra_id: obraFilter || undefined })
    ]);
    const companyId = empresasResponse.find((empresa) => empresa.cnpj === '00.000.000/0001-33')?.id || empresasResponse[0]?.id || '';
    const activeObras = obrasResponse.filter((obra) => obra.status !== 'inativo');
    const activeCentros = centrosResponse.filter((centro) => centro.status !== 'inativo');
    const defaultObra = activeObras.find((obra) => obra.company_id === companyId) || activeObras[0];
    const defaultContrato = contratosResponse.find((contrato) => contrato.obra_id === defaultObra?.id);
    setEmpresas(empresasResponse);
    setObras(activeObras);
    setCentrosCusto(activeCentros);
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setContratos(contratosResponse);
    setOrcamentos(orcamentosResponse);
    setPlanejamentos(planejamentosResponse);
    setOrcamentoForm((current) => ({
      ...current,
      company_id: current.company_id || companyId,
      obra_id: current.obra_id || defaultObra?.id || '',
      centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '',
      contrato_obra_id: current.contrato_obra_id || defaultContrato?.id || ''
    }));
    setPacoteForm((current) => ({ ...current, centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '' }));
    setItemForm((current) => ({ ...current, centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '' }));
    setPlanejamentoForm((current) => ({
      ...current,
      obra_id: current.obra_id || defaultObra?.id || '',
      centro_custo_id: current.centro_custo_id || defaultObra?.centro_custo_id || '',
      contrato_obra_id: current.contrato_obra_id || defaultContrato?.id || ''
    }));
    setActionUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'gustavo.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, [obraFilter, planejamentoStatusFilter, statusFilter]);

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

  const refresh = async (orcamentoId = selectedOrcamento?.id): Promise<void> => {
    await loadAll();
    if (orcamentoId) {
      const updated = await erpApi.orcamentosObra.get(orcamentoId);
      setSelectedOrcamento(updated);
      setResumo(await erpApi.orcamentosObra.resumo(orcamentoId));
    }
  };

  const selectOrcamento = async (id: string): Promise<void> => {
    const item = await erpApi.orcamentosObra.get(id);
    setSelectedOrcamento(item);
    setResumo(await erpApi.orcamentosObra.resumo(id));
    const firstPacote = item.pacotes?.find((pacote) => pacote.status === 'ATIVO');
    setPacoteForm((current) => ({ ...current, centro_custo_id: item.centro_custo_id || current.centro_custo_id }));
    setItemForm((current) => ({ ...current, pacote_id: firstPacote?.id || '', centro_custo_id: item.centro_custo_id || current.centro_custo_id }));
    setCronogramaForm((current) => ({ ...current, pacote_id: firstPacote?.id || '' }));
  };

  const runOrcamentoAction = async (callback: () => Promise<OrcamentoObraApi>, successMessage: string): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await callback();
      setSelectedOrcamento(updated);
      setResumo(await erpApi.orcamentosObra.resumo(updated.id));
      await refresh(updated.id);
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const runPlanejamentoAction = async (callback: () => Promise<PlanejamentoExecutivoApi>, successMessage: string): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await callback();
      setSelectedPlanejamento(updated);
      await loadAll();
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const selectObraForOrcamento = (obraId: string): void => {
    const obra = obras.find((item) => item.id === obraId);
    const contrato = contratos.find((item) => item.obra_id === obraId);
    setOrcamentoForm((current) => ({
      ...current,
      obra_id: obraId,
      centro_custo_id: obra?.centro_custo_id || current.centro_custo_id,
      contrato_obra_id: contrato?.id || ''
    }));
  };

  const createOrcamento = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const payload: OrcamentoObraPayload = {
      company_id: orcamentoForm.company_id,
      obra_id: orcamentoForm.obra_id,
      contrato_obra_id: orcamentoForm.contrato_obra_id || null,
      centro_custo_id: orcamentoForm.centro_custo_id || null,
      codigo: orcamentoForm.codigo,
      versao: orcamentoForm.versao || 'V1',
      descricao: orcamentoForm.descricao,
      competencia_base: orcamentoForm.competencia_base || null,
      margem_prevista_percentual: orcamentoForm.margem_prevista_percentual ? toNumber(orcamentoForm.margem_prevista_percentual) : null,
      observacoes: orcamentoForm.observacoes || null,
      usuario_id: actionUserId || null
    };
    await runOrcamentoAction(async () => erpApi.orcamentosObra.create(payload), 'Orçamento criado em rascunho.');
    setOrcamentoForm(emptyOrcamentoForm());
  };

  const addPacote = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedOrcamento) {
      return;
    }
    const payload: OrcamentoObraPacotePayload = {
      codigo: pacoteForm.codigo,
      nome: pacoteForm.nome,
      descricao: pacoteForm.descricao || null,
      etapa: pacoteForm.etapa || null,
      centro_custo_id: pacoteForm.centro_custo_id || null,
      ordem: pacoteForm.ordem ? Number(pacoteForm.ordem) : 0,
      usuario_id: actionUserId || null
    };
    await runOrcamentoAction(async () => erpApi.orcamentosObra.addPacote(selectedOrcamento.id, payload), 'Pacote cadastrado.');
    setPacoteForm(emptyPacoteForm());
  };

  const addItem = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedOrcamento) {
      return;
    }
    const payload: OrcamentoObraItemPayload = {
      pacote_id: itemForm.pacote_id || null,
      centro_custo_id: itemForm.centro_custo_id || null,
      tipo: itemForm.tipo,
      codigo: itemForm.codigo || null,
      descricao: itemForm.descricao,
      unidade: itemForm.unidade,
      quantidade: toNumber(itemForm.quantidade),
      valor_unitario_previsto: toNumber(itemForm.valor_unitario_previsto),
      insumo_descricao: itemForm.insumo_descricao || null,
      mao_obra_categoria: itemForm.mao_obra_categoria || null,
      equipamento_descricao: itemForm.equipamento_descricao || null,
      observacoes: itemForm.observacoes || null,
      usuario_id: actionUserId || null
    };
    await runOrcamentoAction(async () => erpApi.orcamentosObra.addItem(selectedOrcamento.id, payload), 'Item orçamentário cadastrado.');
    setItemForm((current) => ({ ...emptyItemForm(), pacote_id: current.pacote_id, centro_custo_id: current.centro_custo_id }));
  };

  const addCronograma = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selectedOrcamento) {
      return;
    }
    const payload: OrcamentoObraCronogramaPayload = {
      pacote_id: cronogramaForm.pacote_id || null,
      competencia: cronogramaForm.competencia,
      valor_previsto: toNumber(cronogramaForm.valor_previsto),
      percentual_fisico_previsto: cronogramaForm.percentual_fisico_previsto ? toNumber(cronogramaForm.percentual_fisico_previsto) : null,
      observacoes: cronogramaForm.observacoes || null,
      usuario_id: actionUserId || null
    };
    await runOrcamentoAction(async () => erpApi.orcamentosObra.addCronograma(selectedOrcamento.id, payload), 'Cronograma cadastrado.');
    setCronogramaForm((current) => ({ ...emptyCronogramaForm(), pacote_id: current.pacote_id }));
  };

  const createPlanejamento = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const payload: PlanejamentoExecutivoPayload = {
      company_id: orcamentoForm.company_id || empresas[0]?.id || '',
      obra_id: planejamentoForm.obra_id,
      orcamento_id: null,
      contrato_obra_id: planejamentoForm.contrato_obra_id || null,
      centro_custo_id: planejamentoForm.centro_custo_id || null,
      etapa: planejamentoForm.etapa,
      descricao: planejamentoForm.descricao || null,
      data_inicio_prevista: planejamentoForm.data_inicio_prevista,
      data_fim_prevista: planejamentoForm.data_fim_prevista,
      responsavel_id: planejamentoForm.responsavel_id || null,
      observacoes: planejamentoForm.observacoes || null,
      usuario_id: actionUserId || null
    };
    await runPlanejamentoAction(async () => erpApi.planejamentoExecutivo.create(payload), 'Planejamento executivo criado.');
    setPlanejamentoForm(emptyPlanejamentoForm());
  };

  if (loading) {
    return <section className="enac-cadastros-page"><p>{isPlanejamento ? 'Carregando planejamento executivo...' : 'Carregando orçamentos de obra...'}</p></section>;
  }

  const activePacotes = selectedOrcamento?.pacotes?.filter((pacote) => pacote.status === 'ATIVO') || [];
  const selectedContratoValor = toNumber(selectedOrcamento?.contrato_obra_valor_total);
  const diferencaContrato = selectedContratoValor ? selectedContratoValor - toNumber(selectedOrcamento?.valor_previsto_total) : 0;
  const totalOrcamentos = orcamentos.length;
  const totalPrevisto = orcamentos.reduce((total, item) => total + toNumber(item.valor_previsto_total), 0);
  const orcamentosAprovados = orcamentos.filter((item) => item.status === 'APROVADO').length;
  const totalPlanejamentos = planejamentos.length;
  const planejamentosAtivos = planejamentos.filter((item) => item.status === 'ATIVO').length;
  const planejamentosAtrasados = planejamentos.filter((item) =>
    ['RASCUNHO', 'ATIVO', 'REVISADO'].includes(item.status) && item.data_fim_prevista < today()
  ).length;

  const reload = (): void => {
    setError('');
    setMessage('');
    void loadAll().catch((reloadError) => setError(getErrorMessage(reloadError)));
  };

  const clearFilters = (): void => {
    setStatusFilter('');
    setPlanejamentoStatusFilter('');
    setObraFilter('');
  };

  return (
    <section className={`enac-cadastros-page enac-work-module ${isPlanejamento ? 'enac-work-module--planning' : 'enac-work-module--budget'}`}>
      <div className="enac-cadastros-header">
        <div>
          <p className="enac-web-eyebrow">{isPlanejamento ? 'V3.18H - Execução de obra' : 'V3.18H - Orçamento base'}</p>
          <h1>{isPlanejamento ? 'Planejamento Executivo' : 'Orçamentos de Obra'}</h1>
          <p className="enac-web-lead">
            {isPlanejamento
              ? 'Consulta e cadastro de etapas executivas, responsáveis, datas previstas, status, revisões e encerramento operacional.'
              : 'Consulta e cadastro de orçamento base, pacotes, itens, cronograma físico-financeiro, resumo previsto e status orçamentário.'}
          </p>
        </div>
        <button type="button" onClick={reload} disabled={saving}>Pesquisar</button>
      </div>

      <div className="enac-cadastros-context">
        <label>
          Usuário
          <select value={actionUserId} onChange={(event) => setActionUserId(event.target.value)}>
            <option value="">Selecione</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          Status
          {isPlanejamento ? (
            <select value={planejamentoStatusFilter} onChange={(event) => setPlanejamentoStatusFilter(event.target.value as PlanejamentoExecutivoStatus | '')}>
              <option value="">Todos</option>
              {(Object.keys(planejamentoStatusLabels) as PlanejamentoExecutivoStatus[]).map((status) => <option key={status} value={status}>{planejamentoStatusLabels[status]}</option>)}
            </select>
          ) : (
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrcamentoObraStatus | '')}>
              <option value="">Todos</option>
              {(Object.keys(statusLabels) as OrcamentoObraStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          )}
        </label>
        <label>
          Obra
          <select value={obraFilter} onChange={(event) => setObraFilter(event.target.value)}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <div className="enac-filter-actions">
          <button type="button" onClick={reload} disabled={saving}>Pesquisar</button>
          <button type="button" className="secondary" onClick={clearFilters} disabled={saving}>Limpar filtros</button>
        </div>
      </div>

      {error && <div className="enac-web-alert"><strong>Erro</strong><p>{error}</p></div>}
      {message && <div className="enac-web-alert enac-web-alert--success"><strong>{message}</strong></div>}

      <div className="enac-ui-tabs" role="tablist" aria-label={isPlanejamento ? 'Planejamento executivo' : 'Orçamentos de obra'}>
        <button type="button" className={activeTab === 'consulta' ? 'is-active' : ''} onClick={() => setActiveTab('consulta')}>
          Consulta
        </button>
        <button type="button" className={activeTab === 'novo' ? 'is-active' : ''} onClick={() => setActiveTab('novo')}>
          {isPlanejamento ? 'Novo planejamento' : 'Novo orçamento'}
        </button>
      </div>

      {!isPlanejamento && activeTab === 'novo' && (
        <form className="enac-cadastros-form enac-module-form" onSubmit={(event) => void createOrcamento(event)}>
          <h2>Novo orçamento</h2>
          <label>
            Empresa
            <select value={orcamentoForm.company_id} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, company_id: event.target.value })} required>
              <option value="">Selecione</option>
              {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.razao_social}</option>)}
            </select>
          </label>
          <label>
            Obra
            <select value={orcamentoForm.obra_id} onChange={(event) => selectObraForOrcamento(event.target.value)} required>
              <option value="">Selecione</option>
              {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
            </select>
          </label>
          <label>
            Contrato ativo
            <select value={orcamentoForm.contrato_obra_id} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, contrato_obra_id: event.target.value })}>
              <option value="">Sem contrato</option>
              {contratos.filter((contrato) => !orcamentoForm.obra_id || contrato.obra_id === orcamentoForm.obra_id).map((contrato) => (
                <option key={contrato.id} value={contrato.id}>{contrato.numero} - {formatMoney(contrato.valor_total_contratado)}</option>
              ))}
            </select>
          </label>
          <label>
            Centro de custo
            <select value={orcamentoForm.centro_custo_id} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, centro_custo_id: event.target.value })}>
              <option value="">Sem centro</option>
              {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
            </select>
          </label>
          <label>Código<input value={orcamentoForm.codigo} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, codigo: event.target.value })} required /></label>
          <label>Versão<input value={orcamentoForm.versao} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, versao: event.target.value })} /></label>
          <label>Competência base<input type="month" value={orcamentoForm.competencia_base} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, competencia_base: event.target.value })} /></label>
          <label>Margem prevista %<input value={orcamentoForm.margem_prevista_percentual} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, margem_prevista_percentual: event.target.value })} /></label>
          <label className="enac-form-full">Descrição<textarea value={orcamentoForm.descricao} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, descricao: event.target.value })} required /></label>
          <label className="enac-form-full">Observações<textarea value={orcamentoForm.observacoes} onChange={(event) => setOrcamentoForm({ ...orcamentoForm, observacoes: event.target.value })} /></label>
          <button type="submit" disabled={saving || !actionUserId}>Criar orçamento</button>
        </form>
      )}

      {!isPlanejamento && activeTab === 'consulta' && (
        <>
          <div className="enac-kpi-grid enac-module-summary">
            <article><span>Orçamentos</span><strong>{totalOrcamentos}</strong></article>
            <article><span>Aprovados</span><strong>{orcamentosAprovados}</strong></article>
            <article><span>Total previsto</span><strong>{formatMoney(totalPrevisto)}</strong></article>
            <article><span>Selecionado</span><strong>{selectedOrcamento ? selectedOrcamento.codigo : '-'}</strong></article>
          </div>

          <div className="enac-module-workspace">
            <div className="enac-cadastros-list">
              <h2>Consulta de orçamentos</h2>
              <table>
                <thead><tr><th>Código</th><th>Obra</th><th>Status</th><th>Total</th><th>Ações</th></tr></thead>
                <tbody>
                  {orcamentos.map((orcamento) => (
                    <tr key={orcamento.id} className={selectedOrcamento?.id === orcamento.id ? 'is-selected' : ''}>
                      <td><strong>{orcamento.codigo}</strong><br /><small>{orcamento.versao}</small></td>
                      <td>{orcamento.obra_codigo} - {orcamento.obra_nome}</td>
                      <td><span className={`enac-status enac-status--${statusClass(orcamento.status)}`}>{statusLabels[orcamento.status]}</span></td>
                      <td>{formatMoney(orcamento.valor_previsto_total)}</td>
                      <td><button type="button" onClick={() => void selectOrcamento(orcamento.id)}>Detalhe</button></td>
                    </tr>
                  ))}
                  {orcamentos.length === 0 && <tr><td colSpan={5}>Nenhum orçamento encontrado.</td></tr>}
                </tbody>
              </table>
            </div>

            {selectedOrcamento ? (
              <aside className="enac-cadastros-detail enac-module-detail">
                <div className="enac-cadastros-detail-header">
                  <div>
                    <p className="enac-web-eyebrow">Detalhe do orçamento</p>
                    <h2>{selectedOrcamento.codigo} - {selectedOrcamento.versao}</h2>
                    <p>{selectedOrcamento.descricao}</p>
                  </div>
                  <div className="enac-actions">
                    {selectedOrcamento.status === 'RASCUNHO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.enviarRevisao(selectedOrcamento.id, { usuario_id: actionUserId, observacoes: `${marker} - revisão` }), 'Orçamento enviado para revisão.')} disabled={saving || !actionUserId}>Enviar revisão</button>}
                    {selectedOrcamento.status === 'EM_REVISAO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.aprovar(selectedOrcamento.id, { usuario_id: actionUserId, observacoes: `${marker} - aprovado` }), 'Orçamento aprovado como vigente.')} disabled={saving || !actionUserId}>Aprovar</button>}
                    {selectedOrcamento.status !== 'CANCELADO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.bloquear(selectedOrcamento.id, { usuario_id: actionUserId, motivo: `${marker} - bloqueio lógico` }), 'Orçamento bloqueado.')} disabled={saving || !actionUserId}>Bloquear</button>}
                    {selectedOrcamento.status !== 'CANCELADO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.cancelar(selectedOrcamento.id, { usuario_id: actionUserId, motivo: `${marker} - cancelamento lógico` }), 'Orçamento cancelado.')} disabled={saving || !actionUserId}>Cancelar</button>}
                  </div>
                </div>

                <div className="enac-kpi-grid">
                  <article><span>Total previsto</span><strong>{formatMoney(selectedOrcamento.valor_previsto_total)}</strong></article>
                  <article><span>Contrato</span><strong>{selectedContratoValor ? formatMoney(selectedContratoValor) : '-'}</strong></article>
                  <article><span>Diferença</span><strong>{selectedContratoValor ? formatMoney(diferencaContrato) : '-'}</strong></article>
                  <article><span>Cronograma</span><strong>{resumo ? formatMoney(resumo.total_cronograma) : '-'}</strong></article>
                </div>

                <div className="enac-cadastros-grid">
                  <form className="enac-cadastros-form" onSubmit={(event) => void addPacote(event)}>
                    <h3>Pacotes</h3>
                    <label>Código<input value={pacoteForm.codigo} onChange={(event) => setPacoteForm({ ...pacoteForm, codigo: event.target.value })} required /></label>
                    <label>Nome<input value={pacoteForm.nome} onChange={(event) => setPacoteForm({ ...pacoteForm, nome: event.target.value })} required /></label>
                    <label>Etapa<input value={pacoteForm.etapa} onChange={(event) => setPacoteForm({ ...pacoteForm, etapa: event.target.value })} /></label>
                    <label>Ordem<input value={pacoteForm.ordem} onChange={(event) => setPacoteForm({ ...pacoteForm, ordem: event.target.value })} /></label>
                    <label className="enac-form-full">Descrição<textarea value={pacoteForm.descricao} onChange={(event) => setPacoteForm({ ...pacoteForm, descricao: event.target.value })} /></label>
                    <button type="submit" disabled={saving || selectedOrcamento.status !== 'RASCUNHO'}>Cadastrar pacote</button>
                  </form>
                  <div className="enac-cadastros-list">
                    <h3>Pacotes cadastrados</h3>
                    <table>
                      <thead><tr><th>Código</th><th>Nome</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
                      <tbody>
                        {(selectedOrcamento.pacotes || []).map((pacote) => (
                          <tr key={pacote.id}>
                            <td>{pacote.codigo}</td>
                            <td>{pacote.nome}</td>
                            <td>{formatMoney(pacote.valor_total_previsto)}</td>
                            <td>{pacote.status}</td>
                            <td>{pacote.status === 'ATIVO' && selectedOrcamento.status === 'RASCUNHO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.inativarPacote(selectedOrcamento.id, pacote.id, { usuario_id: actionUserId, motivo: `${marker} - inativar pacote` }), 'Pacote inativado.')} disabled={saving}>Inativar</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="enac-cadastros-grid">
                  <form className="enac-cadastros-form" onSubmit={(event) => void addItem(event)}>
                    <h3>Itens orçamentários</h3>
                    <label>
                      Pacote
                      <select value={itemForm.pacote_id} onChange={(event) => setItemForm({ ...itemForm, pacote_id: event.target.value })}>
                        <option value="">Sem pacote</option>
                        {activePacotes.map((pacote) => <option key={pacote.id} value={pacote.id}>{pacote.codigo} - {pacote.nome}</option>)}
                      </select>
                    </label>
                    <label>
                      Tipo
                      <select value={itemForm.tipo} onChange={(event) => setItemForm({ ...itemForm, tipo: event.target.value as OrcamentoItemTipo })}>
                        {(Object.keys(tipoLabels) as OrcamentoItemTipo[]).map((tipo) => <option key={tipo} value={tipo}>{tipoLabels[tipo]}</option>)}
                      </select>
                    </label>
                    <label>Código<input value={itemForm.codigo} onChange={(event) => setItemForm({ ...itemForm, codigo: event.target.value })} /></label>
                    <label>Descrição<input value={itemForm.descricao} onChange={(event) => setItemForm({ ...itemForm, descricao: event.target.value })} required /></label>
                    <label>Unidade<input value={itemForm.unidade} onChange={(event) => setItemForm({ ...itemForm, unidade: event.target.value })} required /></label>
                    <label>Quantidade<input value={itemForm.quantidade} onChange={(event) => setItemForm({ ...itemForm, quantidade: event.target.value })} required /></label>
                    <label>Valor unitário<input value={itemForm.valor_unitario_previsto} onChange={(event) => setItemForm({ ...itemForm, valor_unitario_previsto: event.target.value })} required /></label>
                    <label className="enac-form-full">Insumo / mão de obra / equipamento<textarea value={itemForm.insumo_descricao} onChange={(event) => setItemForm({ ...itemForm, insumo_descricao: event.target.value })} /></label>
                    <button type="submit" disabled={saving || selectedOrcamento.status !== 'RASCUNHO'}>Cadastrar item</button>
                  </form>
                  <div className="enac-cadastros-list">
                    <h3>Itens</h3>
                    <table>
                      <thead><tr><th>Tipo</th><th>Descrição</th><th>Qtd.</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>
                      <tbody>
                        {(selectedOrcamento.itens || []).map((item) => (
                          <tr key={item.id}>
                            <td>{tipoLabels[item.tipo]}</td>
                            <td>{item.descricao}<br /><small>{item.pacote_codigo || '-'}</small></td>
                            <td>{item.quantidade}</td>
                            <td>{formatMoney(item.valor_total_previsto)}</td>
                            <td>{item.status}</td>
                            <td>{item.status === 'ATIVO' && selectedOrcamento.status === 'RASCUNHO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.inativarItem(selectedOrcamento.id, item.id, { usuario_id: actionUserId, motivo: `${marker} - inativar item` }), 'Item inativado.')} disabled={saving}>Inativar</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="enac-cadastros-grid">
                  <form className="enac-cadastros-form" onSubmit={(event) => void addCronograma(event)}>
                    <h3>Cronograma físico-financeiro</h3>
                    <label>
                      Pacote
                      <select value={cronogramaForm.pacote_id} onChange={(event) => setCronogramaForm({ ...cronogramaForm, pacote_id: event.target.value })}>
                        <option value="">Sem pacote</option>
                        {activePacotes.map((pacote) => <option key={pacote.id} value={pacote.id}>{pacote.codigo} - {pacote.nome}</option>)}
                      </select>
                    </label>
                    <label>Competência<input type="month" value={cronogramaForm.competencia} onChange={(event) => setCronogramaForm({ ...cronogramaForm, competencia: event.target.value })} required /></label>
                    <label>Valor previsto<input value={cronogramaForm.valor_previsto} onChange={(event) => setCronogramaForm({ ...cronogramaForm, valor_previsto: event.target.value })} required /></label>
                    <label>% físico<input value={cronogramaForm.percentual_fisico_previsto} onChange={(event) => setCronogramaForm({ ...cronogramaForm, percentual_fisico_previsto: event.target.value })} /></label>
                    <label className="enac-form-full">Observações<textarea value={cronogramaForm.observacoes} onChange={(event) => setCronogramaForm({ ...cronogramaForm, observacoes: event.target.value })} /></label>
                    <button type="submit" disabled={saving || selectedOrcamento.status !== 'RASCUNHO'}>Cadastrar cronograma</button>
                  </form>
                  <div className="enac-cadastros-list">
                    <h3>Cronograma</h3>
                    <table>
                      <thead><tr><th>Competência</th><th>Pacote</th><th>Valor</th><th>% físico</th><th>Status</th><th>Ações</th></tr></thead>
                      <tbody>
                        {(selectedOrcamento.cronograma || []).map((linha) => (
                          <tr key={linha.id}>
                            <td>{linha.competencia}</td>
                            <td>{linha.pacote_codigo || '-'}</td>
                            <td>{formatMoney(linha.valor_previsto)}</td>
                            <td>{linha.percentual_fisico_previsto || '-'}</td>
                            <td>{linha.status}</td>
                            <td>{linha.status === 'ATIVO' && selectedOrcamento.status === 'RASCUNHO' && <button type="button" onClick={() => void runOrcamentoAction(() => erpApi.orcamentosObra.inativarCronograma(selectedOrcamento.id, linha.id, { usuario_id: actionUserId, motivo: `${marker} - inativar cronograma` }), 'Cronograma inativado.')} disabled={saving}>Inativar</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {resumo && (
                  <div className="enac-cadastros-list">
                    <h3>Resumo orçamentário</h3>
                    <table>
                      <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
                      <tbody>
                        <tr><td>Compras realizadas da obra</td><td>{formatMoney(resumo.valor_compras_realizado)}</td></tr>
                        <tr><td>Medições realizadas da obra</td><td>{formatMoney(resumo.valor_medido_realizado)}</td></tr>
                        <tr><td>Faturamento solicitado da obra</td><td>{formatMoney(resumo.valor_faturado_realizado)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </aside>
            ) : (
              <aside className="enac-cadastros-detail enac-module-detail">
                <div className="enac-cadastro-empty">Selecione um orçamento na consulta para visualizar pacotes, itens, cronograma e resumo.</div>
              </aside>
            )}
          </div>
        </>
      )}

      {isPlanejamento && activeTab === 'novo' && (
        <form className="enac-cadastros-form enac-module-form" onSubmit={(event) => void createPlanejamento(event)}>
          <h2>Novo planejamento</h2>
          <label>
            Obra
            <select value={planejamentoForm.obra_id} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, obra_id: event.target.value })} required>
              <option value="">Selecione</option>
              {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
            </select>
          </label>
          <label>
            Responsável
            <select value={planejamentoForm.responsavel_id} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, responsavel_id: event.target.value })}>
              <option value="">Sem responsável</option>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
            </select>
          </label>
          <label>Etapa<input value={planejamentoForm.etapa} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, etapa: event.target.value })} required /></label>
          <label>Início<input type="date" value={planejamentoForm.data_inicio_prevista} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, data_inicio_prevista: event.target.value })} required /></label>
          <label>Fim<input type="date" value={planejamentoForm.data_fim_prevista} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, data_fim_prevista: event.target.value })} required /></label>
          <label className="enac-form-full">Descrição<textarea value={planejamentoForm.descricao} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, descricao: event.target.value })} /></label>
          <label className="enac-form-full">Observações<textarea value={planejamentoForm.observacoes} onChange={(event) => setPlanejamentoForm({ ...planejamentoForm, observacoes: event.target.value })} /></label>
          <button type="submit" disabled={saving || !actionUserId}>Criar planejamento</button>
        </form>
      )}

      {isPlanejamento && activeTab === 'consulta' && (
        <>
          <div className="enac-kpi-grid enac-module-summary">
            <article><span>Planejamentos</span><strong>{totalPlanejamentos}</strong></article>
            <article><span>Ativos</span><strong>{planejamentosAtivos}</strong></article>
            <article><span>Atrasados</span><strong>{planejamentosAtrasados}</strong></article>
            <article><span>Selecionado</span><strong>{selectedPlanejamento ? selectedPlanejamento.etapa : '-'}</strong></article>
          </div>

          <div className="enac-module-workspace">
            <div className="enac-cadastros-list">
              <h2>Consulta de planejamentos</h2>
              <table>
                <thead><tr><th>Etapa</th><th>Obra</th><th>Responsável</th><th>Datas</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {planejamentos.map((planejamento) => (
                    <tr key={planejamento.id} className={selectedPlanejamento?.id === planejamento.id ? 'is-selected' : ''}>
                      <td><strong>{planejamento.etapa}</strong><br /><small>{planejamento.centro_custo_codigo || '-'}</small></td>
                      <td>{planejamento.obra_codigo} - {planejamento.obra_nome}</td>
                      <td>{planejamento.responsavel_nome || '-'}</td>
                      <td>{formatDate(planejamento.data_inicio_prevista)} a {formatDate(planejamento.data_fim_prevista)}</td>
                      <td><span className={`enac-status enac-status--${statusClass(planejamento.status)}`}>{planejamentoStatusLabels[planejamento.status]}</span></td>
                      <td><button type="button" onClick={() => setSelectedPlanejamento(planejamento)}>Detalhe</button></td>
                    </tr>
                  ))}
                  {planejamentos.length === 0 && <tr><td colSpan={6}>Nenhum planejamento encontrado.</td></tr>}
                </tbody>
              </table>
            </div>

            {selectedPlanejamento ? (
              <aside className="enac-cadastros-detail enac-module-detail">
                <div className="enac-cadastros-detail-header">
                  <div>
                    <p className="enac-web-eyebrow">Detalhe do planejamento</p>
                    <h2>{selectedPlanejamento.etapa}</h2>
                    <p>{selectedPlanejamento.descricao || 'Sem descrição operacional.'}</p>
                  </div>
                </div>
                <div className="enac-kpi-grid">
                  <article><span>Status</span><strong>{planejamentoStatusLabels[selectedPlanejamento.status]}</strong></article>
                  <article><span>Responsável</span><strong>{selectedPlanejamento.responsavel_nome || '-'}</strong></article>
                  <article><span>Início</span><strong>{formatDate(selectedPlanejamento.data_inicio_prevista)}</strong></article>
                  <article><span>Fim</span><strong>{formatDate(selectedPlanejamento.data_fim_prevista)}</strong></article>
                </div>
                <div className="enac-cadastros-list">
                  <h3>Histórico operacional</h3>
                  <table>
                    <tbody>
                      <tr><td>Obra</td><td>{selectedPlanejamento.obra_codigo} - {selectedPlanejamento.obra_nome}</td></tr>
                      <tr><td>Revisão</td><td>{selectedPlanejamento.revisao_motivo || '-'}</td></tr>
                      <tr><td>Encerramento</td><td>{selectedPlanejamento.encerramento_motivo || '-'}</td></tr>
                      <tr><td>Cancelamento</td><td>{selectedPlanejamento.cancelamento_motivo || '-'}</td></tr>
                      <tr><td>Observações</td><td>{selectedPlanejamento.observacoes || '-'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="enac-inline-actions">
                  {['RASCUNHO', 'REVISADO'].includes(selectedPlanejamento.status) && <button type="button" onClick={() => void runPlanejamentoAction(() => erpApi.planejamentoExecutivo.ativar(selectedPlanejamento.id, { usuario_id: actionUserId, observacoes: `${marker} - ativar` }), 'Planejamento ativado.')} disabled={saving || !actionUserId}>Ativar</button>}
                  {selectedPlanejamento.status === 'ATIVO' && <button type="button" onClick={() => void runPlanejamentoAction(() => erpApi.planejamentoExecutivo.revisar(selectedPlanejamento.id, { usuario_id: actionUserId, motivo: `${marker} - revisar` }), 'Planejamento revisado.')} disabled={saving || !actionUserId}>Revisar</button>}
                  {['ATIVO', 'REVISADO'].includes(selectedPlanejamento.status) && <button type="button" onClick={() => void runPlanejamentoAction(() => erpApi.planejamentoExecutivo.encerrar(selectedPlanejamento.id, { usuario_id: actionUserId, motivo: `${marker} - encerrar` }), 'Planejamento encerrado.')} disabled={saving || !actionUserId}>Encerrar</button>}
                  {selectedPlanejamento.status !== 'ENCERRADO' && <button type="button" onClick={() => void runPlanejamentoAction(() => erpApi.planejamentoExecutivo.cancelar(selectedPlanejamento.id, { usuario_id: actionUserId, motivo: `${marker} - cancelar` }), 'Planejamento cancelado.')} disabled={saving || !actionUserId}>Cancelar</button>}
                </div>
              </aside>
            ) : (
              <aside className="enac-cadastros-detail enac-module-detail">
                <div className="enac-cadastro-empty">Selecione uma etapa na consulta para visualizar datas, responsáveis, status e ações operacionais.</div>
              </aside>
            )}
          </div>
        </>
      )}
    </section>
  );
}
