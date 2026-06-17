import * as React from 'react';
import {
  erpApi,
  type AlcadaApi,
  type AlcadaPayload,
  type CentroCustoApi,
  type EmpresaApi,
  type EscopoApi,
  type EscopoPayload,
  type ObraApi,
  type PerfilApi,
  type PerfilEscopoApi,
  type PerfilPayload,
  type UsuarioApi,
  type UsuarioPerfilApi,
  type ValidarAlcadaPayload,
  type ValidarAlcadaResponse
} from '../../services/erpApi';

type AdminTab = 'usuarios' | 'perfis' | 'escopos' | 'alcadas';

interface PerfilForm {
  id: string;
  nome: string;
  descricao: string;
}

interface EscopoForm {
  id: string;
  modulo: string;
  acao: string;
  descricao: string;
}

interface UsuarioPerfilForm {
  usuario_id: string;
  perfil_id: string;
  principal: boolean;
}

interface PerfilEscopoForm {
  perfil_id: string;
  escopo_id: string;
}

interface AlcadaForm {
  id: string;
  usuario_id: string;
  perfil_id: string;
  modulo: string;
  tipo_documento: string;
  acao: string;
  obra_id: string;
  centro_custo_id: string;
  valor_minimo: string;
  valor_maximo: string;
  observacoes: string;
}

interface ValidacaoForm {
  usuario_id: string;
  modulo: string;
  tipo_documento: string;
  acao: string;
  valor: string;
  obra_id: string;
  centro_custo_id: string;
}

const adminTabs: Array<{ key: AdminTab; label: string }> = [
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'perfis', label: 'Perfis' },
  { key: 'escopos', label: 'Escopos' },
  { key: 'alcadas', label: 'Alcadas' }
];

const modules = [
  'cadastros',
  'solicitacoes-compra',
  'cotacoes',
  'pedidos-compra',
  'notas-fiscais-entrada',
  'contas-pagar',
  'programacoes-pagamento',
  'usuarios',
  'perfis',
  'alcadas',
  'auditoria'
];

const actions = [
  'visualizar',
  'criar',
  'editar',
  'inativar',
  'reativar',
  'enviar',
  'aprovar_tecnico',
  'aprovar_diretoria',
  'conferir',
  'adicionar_conta',
  'remover_conta',
  'submeter',
  'liberar',
  'cancelar',
  'reprovar',
  'administrar'
];

const documentTypes = [
  'SOLICITACAO_COMPRA',
  'COTACAO',
  'PEDIDO_COMPRA',
  'NOTA_FISCAL_ENTRADA',
  'CONTA_PAGAR',
  'PROGRAMACAO_PAGAMENTO',
  'AUDITORIA'
];

const emptyPerfilForm = (): PerfilForm => ({ id: '', nome: '', descricao: '' });
const emptyEscopoForm = (): EscopoForm => ({ id: '', modulo: 'solicitacoes-compra', acao: 'visualizar', descricao: '' });
const emptyUsuarioPerfilForm = (): UsuarioPerfilForm => ({ usuario_id: '', perfil_id: '', principal: false });
const emptyPerfilEscopoForm = (): PerfilEscopoForm => ({ perfil_id: '', escopo_id: '' });
const emptyAlcadaForm = (): AlcadaForm => ({
  id: '',
  usuario_id: '',
  perfil_id: '',
  modulo: 'solicitacoes-compra',
  tipo_documento: 'SOLICITACAO_COMPRA',
  acao: 'aprovar_tecnico',
  obra_id: '',
  centro_custo_id: '',
  valor_minimo: '0',
  valor_maximo: '',
  observacoes: ''
});
const emptyValidacaoForm = (): ValidacaoForm => ({
  usuario_id: '',
  modulo: 'solicitacoes-compra',
  tipo_documento: 'SOLICITACAO_COMPRA',
  acao: 'aprovar_tecnico',
  valor: '15000',
  obra_id: '',
  centro_custo_id: ''
});

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const formatMoney = (value: string | number | null | undefined): string => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
};

const toNumber = (value: string): number => Number(String(value || '0').replace(',', '.'));

export function AcessosPage(): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('usuarios');
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [perfis, setPerfis] = React.useState<PerfilApi[]>([]);
  const [escopos, setEscopos] = React.useState<EscopoApi[]>([]);
  const [usuariosPerfis, setUsuariosPerfis] = React.useState<UsuarioPerfilApi[]>([]);
  const [perfisEscopos, setPerfisEscopos] = React.useState<PerfilEscopoApi[]>([]);
  const [alcadas, setAlcadas] = React.useState<AlcadaApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [perfilForm, setPerfilForm] = React.useState<PerfilForm>(emptyPerfilForm());
  const [escopoForm, setEscopoForm] = React.useState<EscopoForm>(emptyEscopoForm());
  const [usuarioPerfilForm, setUsuarioPerfilForm] = React.useState<UsuarioPerfilForm>(emptyUsuarioPerfilForm());
  const [perfilEscopoForm, setPerfilEscopoForm] = React.useState<PerfilEscopoForm>(emptyPerfilEscopoForm());
  const [alcadaForm, setAlcadaForm] = React.useState<AlcadaForm>(emptyAlcadaForm());
  const [validacaoForm, setValidacaoForm] = React.useState<ValidacaoForm>(emptyValidacaoForm());
  const [validacao, setValidacao] = React.useState<ValidarAlcadaResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');

  const companyId = empresas[0]?.id || '';

  const loadAll = React.useCallback(async (): Promise<void> => {
    const [
      empresasResponse,
      usuariosResponse,
      perfisResponse,
      escoposResponse,
      usuariosPerfisResponse,
      perfisEscoposResponse,
      alcadasResponse,
      obrasResponse,
      centrosCustoResponse
    ] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.usuarios.list(),
      erpApi.perfis.list(),
      erpApi.escopos.list(),
      erpApi.usuariosPerfis.list(),
      erpApi.perfisEscopos.list(),
      erpApi.alcadas.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list()
    ]);
    setEmpresas(empresasResponse);
    setUsuarios(usuariosResponse);
    setPerfis(perfisResponse);
    setEscopos(escoposResponse);
    setUsuariosPerfis(usuariosPerfisResponse);
    setPerfisEscopos(perfisEscoposResponse);
    setAlcadas(alcadasResponse);
    setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setCentrosCusto(centrosCustoResponse.filter((centro) => centro.status !== 'inativo'));
  }, []);

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

  const refresh = async (): Promise<void> => {
    setError('');
    await loadAll();
  };

  const runAction = async (callback: () => Promise<void>, successMessage: string): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await callback();
      await refresh();
      setMessage(successMessage);
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setSaving(false);
    }
  };

  const savePerfil = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      const payload: PerfilPayload = {
        company_id: companyId,
        nome: perfilForm.nome,
        descricao: perfilForm.descricao || null
      };
      if (perfilForm.id) {
        await erpApi.perfis.update(perfilForm.id, payload);
      } else {
        await erpApi.perfis.create(payload);
      }
      setPerfilForm(emptyPerfilForm());
    }, perfilForm.id ? 'Perfil atualizado.' : 'Perfil criado.');
  };

  const saveEscopo = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      const payload: EscopoPayload = {
        company_id: companyId,
        modulo: escopoForm.modulo,
        acao: escopoForm.acao,
        descricao: escopoForm.descricao || null
      };
      if (escopoForm.id) {
        await erpApi.escopos.update(escopoForm.id, payload);
      } else {
        await erpApi.escopos.create(payload);
      }
      setEscopoForm(emptyEscopoForm());
    }, escopoForm.id ? 'Escopo atualizado.' : 'Escopo criado.');
  };

  const saveUsuarioPerfil = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      await erpApi.usuariosPerfis.create(usuarioPerfilForm);
      setUsuarioPerfilForm(emptyUsuarioPerfilForm());
    }, 'Vinculo usuario-perfil salvo.');
  };

  const savePerfilEscopo = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      await erpApi.perfisEscopos.create(perfilEscopoForm);
      setPerfilEscopoForm(emptyPerfilEscopoForm());
    }, 'Vinculo perfil-escopo salvo.');
  };

  const saveAlcada = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      const payload: AlcadaPayload = {
        company_id: companyId,
        usuario_id: alcadaForm.usuario_id || null,
        perfil_id: alcadaForm.perfil_id || null,
        modulo: alcadaForm.modulo,
        tipo_documento: alcadaForm.tipo_documento,
        acao: alcadaForm.acao,
        obra_id: alcadaForm.obra_id || null,
        centro_custo_id: alcadaForm.centro_custo_id || null,
        valor_minimo: toNumber(alcadaForm.valor_minimo),
        valor_maximo: alcadaForm.valor_maximo ? toNumber(alcadaForm.valor_maximo) : null,
        efeito: 'PERMITIR',
        observacoes: alcadaForm.observacoes || null
      };
      if (alcadaForm.id) {
        await erpApi.alcadas.update(alcadaForm.id, payload);
      } else {
        await erpApi.alcadas.create(payload);
      }
      setAlcadaForm(emptyAlcadaForm());
    }, alcadaForm.id ? 'Alcada atualizada.' : 'Alcada criada.');
  };

  const validarAlcada = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    await runAction(async () => {
      const payload: ValidarAlcadaPayload = {
        usuario_id: validacaoForm.usuario_id,
        modulo: validacaoForm.modulo,
        tipo_documento: validacaoForm.tipo_documento,
        acao: validacaoForm.acao,
        valor: toNumber(validacaoForm.valor),
        obra_id: validacaoForm.obra_id || null,
        centro_custo_id: validacaoForm.centro_custo_id || null
      };
      setValidacao(await erpApi.alcadas.validar(payload));
    }, 'Validacao executada.');
  };

  return (
    <section className="enac-web-page enac-acessos-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Perfis, escopos e alçadas</h1>
      <p className="enac-web-lead">
        Administração local de acesso e regras de alçada para futuras aprovações de compra, NF e contas a pagar, sem pagamento ou baixa.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando matriz de acesso.</div>}
      {message && <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">{message}</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {!loading && !companyId && (
        <div className="enac-web-alert enac-web-alert--compact">Nenhuma empresa local encontrada. Rode as migrations e seeds locais.</div>
      )}

      {!loading && companyId && (
        <>
          <div className="enac-cadastros-tabs" role="tablist" aria-label="Administracao de acessos">
            {adminTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'usuarios' && (
            <UsuariosPanel
              usuarios={usuarios}
              perfis={perfis}
              vinculos={usuariosPerfis}
              form={usuarioPerfilForm}
              saving={saving}
              onFormChange={setUsuarioPerfilForm}
              onSubmit={(event) => void saveUsuarioPerfil(event)}
              onInativar={(id) => void runAction(() => erpApi.usuariosPerfis.inativar(id).then(() => undefined), 'Vinculo inativado.')}
              onReativar={(id) => void runAction(() => erpApi.usuariosPerfis.reativar(id).then(() => undefined), 'Vinculo reativado.')}
            />
          )}

          {activeTab === 'perfis' && (
            <PerfisPanel
              perfis={perfis}
              escopos={escopos}
              vinculos={perfisEscopos}
              form={perfilForm}
              linkForm={perfilEscopoForm}
              saving={saving}
              onFormChange={setPerfilForm}
              onLinkFormChange={setPerfilEscopoForm}
              onSubmit={(event) => void savePerfil(event)}
              onLinkSubmit={(event) => void savePerfilEscopo(event)}
              onEdit={setPerfilForm}
              onInativar={(id) => void runAction(() => erpApi.perfis.inativar(id).then(() => undefined), 'Perfil inativado.')}
              onReativar={(id) => void runAction(() => erpApi.perfis.reativar(id).then(() => undefined), 'Perfil reativado.')}
              onLinkInativar={(id) => void runAction(() => erpApi.perfisEscopos.inativar(id).then(() => undefined), 'Escopo removido do perfil.')}
              onLinkReativar={(id) => void runAction(() => erpApi.perfisEscopos.reativar(id).then(() => undefined), 'Escopo reativado no perfil.')}
            />
          )}

          {activeTab === 'escopos' && (
            <EscoposPanel
              escopos={escopos}
              form={escopoForm}
              saving={saving}
              onFormChange={setEscopoForm}
              onSubmit={(event) => void saveEscopo(event)}
              onEdit={setEscopoForm}
              onInativar={(id) => void runAction(() => erpApi.escopos.inativar(id).then(() => undefined), 'Escopo inativado.')}
              onReativar={(id) => void runAction(() => erpApi.escopos.reativar(id).then(() => undefined), 'Escopo reativado.')}
            />
          )}

          {activeTab === 'alcadas' && (
            <AlcadasPanel
              usuarios={usuarios}
              perfis={perfis}
              obras={obras}
              centrosCusto={centrosCusto}
              alcadas={alcadas}
              form={alcadaForm}
              validacaoForm={validacaoForm}
              validacao={validacao}
              saving={saving}
              onFormChange={setAlcadaForm}
              onValidacaoFormChange={setValidacaoForm}
              onSubmit={(event) => void saveAlcada(event)}
              onValidar={(event) => void validarAlcada(event)}
              onEdit={setAlcadaForm}
              onInativar={(id) => void runAction(() => erpApi.alcadas.inativar(id).then(() => undefined), 'Alcada inativada.')}
              onReativar={(id) => void runAction(() => erpApi.alcadas.reativar(id).then(() => undefined), 'Alcada reativada.')}
            />
          )}
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  return <span className={`enac-cadastro-status enac-cadastro-status--${status}`}>{status}</span>;
}

function UsuariosPanel({
  usuarios,
  perfis,
  vinculos,
  form,
  saving,
  onFormChange,
  onSubmit,
  onInativar,
  onReativar
}: {
  usuarios: UsuarioApi[];
  perfis: PerfilApi[];
  vinculos: UsuarioPerfilApi[];
  form: UsuarioPerfilForm;
  saving: boolean;
  onFormChange: (form: UsuarioPerfilForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-acessos-grid">
      <section className="enac-acessos-main">
        <div className="enac-cadastro-toolbar"><div><h2>Usuarios locais</h2><p>{usuarios.length} registro(s)</p></div></div>
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-acessos-table">
            <thead><tr><th>Usuario</th><th>Email</th><th>Perfil principal</th><th>Perfis ativos</th><th>Status</th></tr></thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.nome}</strong></td>
                  <td>{usuario.email}</td>
                  <td>{usuario.perfil_principal || '-'}</td>
                  <td>{usuario.perfis?.map((perfil) => perfil.nome).join(', ') || '-'}</td>
                  <td><StatusBadge status={usuario.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="enac-acessos-side">
        <form className="enac-cadastro-form" onSubmit={onSubmit}>
          <div className="enac-cadastro-form-head"><h3>Vincular perfil</h3></div>
          <div className="enac-cadastro-form-grid">
            <label>
              <span>Usuario</span>
              <select value={form.usuario_id} onChange={(event) => onFormChange({ ...form, usuario_id: event.target.value })} disabled={saving} required>
                <option value="">Selecione</option>
                {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
              </select>
            </label>
            <label>
              <span>Perfil</span>
              <select value={form.perfil_id} onChange={(event) => onFormChange({ ...form, perfil_id: event.target.value })} disabled={saving} required>
                <option value="">Selecione</option>
                {perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
              </select>
            </label>
            <label className="enac-acessos-check">
              <input type="checkbox" checked={form.principal} onChange={(event) => onFormChange({ ...form, principal: event.target.checked })} disabled={saving} />
              <span>Perfil principal</span>
            </label>
          </div>
          <div className="enac-cadastro-actions"><button type="submit" disabled={saving || !form.usuario_id || !form.perfil_id}>Salvar vinculo</button></div>
        </form>
        <VinculosUsuariosTable vinculos={vinculos} saving={saving} onInativar={onInativar} onReativar={onReativar} />
      </aside>
    </div>
  );
}

function VinculosUsuariosTable({
  vinculos,
  saving,
  onInativar,
  onReativar
}: {
  vinculos: UsuarioPerfilApi[];
  saving: boolean;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-acessos-table">
        <thead><tr><th>Usuario</th><th>Perfil</th><th>Principal</th><th>Status</th><th>Acoes</th></tr></thead>
        <tbody>
          {vinculos.map((vinculo) => (
            <tr key={vinculo.id}>
              <td>{vinculo.usuario_nome}</td>
              <td>{vinculo.perfil_nome}</td>
              <td>{vinculo.principal ? 'Sim' : 'Nao'}</td>
              <td><StatusBadge status={vinculo.status} /></td>
              <td>
                <div className="enac-cadastro-row-actions">
                  {vinculo.status === 'ativo'
                    ? <button type="button" onClick={() => onInativar(vinculo.id)} disabled={saving}>Inativar</button>
                    : <button type="button" onClick={() => onReativar(vinculo.id)} disabled={saving}>Reativar</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PerfisPanel({
  perfis,
  escopos,
  vinculos,
  form,
  linkForm,
  saving,
  onFormChange,
  onLinkFormChange,
  onSubmit,
  onLinkSubmit,
  onEdit,
  onInativar,
  onReativar,
  onLinkInativar,
  onLinkReativar
}: {
  perfis: PerfilApi[];
  escopos: EscopoApi[];
  vinculos: PerfilEscopoApi[];
  form: PerfilForm;
  linkForm: PerfilEscopoForm;
  saving: boolean;
  onFormChange: (form: PerfilForm) => void;
  onLinkFormChange: (form: PerfilEscopoForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onLinkSubmit: (event: React.FormEvent) => void;
  onEdit: (form: PerfilForm) => void;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
  onLinkInativar: (id: string) => void;
  onLinkReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-acessos-grid">
      <section className="enac-acessos-main">
        <div className="enac-cadastro-toolbar"><div><h2>Perfis</h2><p>{perfis.length} perfil(is)</p></div></div>
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-acessos-table">
            <thead><tr><th>Nome</th><th>Descricao</th><th>Escopos</th><th>Status</th><th>Acoes</th></tr></thead>
            <tbody>
              {perfis.map((perfil) => (
                <tr key={perfil.id}>
                  <td><strong>{perfil.nome}</strong></td>
                  <td>{perfil.descricao || '-'}</td>
                  <td>{perfil.escopos_count || 0}</td>
                  <td><StatusBadge status={perfil.status} /></td>
                  <td>
                    <div className="enac-cadastro-row-actions">
                      <button type="button" onClick={() => onEdit({ id: perfil.id, nome: perfil.nome, descricao: perfil.descricao || '' })} disabled={saving}>Editar</button>
                      {perfil.status === 'ativo'
                        ? <button type="button" onClick={() => onInativar(perfil.id)} disabled={saving}>Inativar</button>
                        : <button type="button" onClick={() => onReativar(perfil.id)} disabled={saving}>Reativar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="enac-acessos-side">
        <form className="enac-cadastro-form" onSubmit={onSubmit}>
          <div className="enac-cadastro-form-head"><h3>{form.id ? 'Editar perfil' : 'Criar perfil'}</h3></div>
          <div className="enac-cadastro-form-grid">
            <label><span>Nome</span><input value={form.nome} onChange={(event) => onFormChange({ ...form, nome: event.target.value })} disabled={saving} required /></label>
            <label><span>Descricao</span><input value={form.descricao} onChange={(event) => onFormChange({ ...form, descricao: event.target.value })} disabled={saving} /></label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving || !form.nome}>{form.id ? 'Salvar perfil' : 'Criar perfil'}</button>
            {form.id && <button type="button" className="enac-cadastro-secondary" onClick={() => onFormChange(emptyPerfilForm())} disabled={saving}>Limpar</button>}
          </div>
        </form>
        <form className="enac-cadastro-form" onSubmit={onLinkSubmit}>
          <div className="enac-cadastro-form-head"><h3>Vincular escopo</h3></div>
          <div className="enac-cadastro-form-grid">
            <label>
              <span>Perfil</span>
              <select value={linkForm.perfil_id} onChange={(event) => onLinkFormChange({ ...linkForm, perfil_id: event.target.value })} disabled={saving} required>
                <option value="">Selecione</option>
                {perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
              </select>
            </label>
            <label>
              <span>Escopo</span>
              <select value={linkForm.escopo_id} onChange={(event) => onLinkFormChange({ ...linkForm, escopo_id: event.target.value })} disabled={saving} required>
                <option value="">Selecione</option>
                {escopos.map((escopo) => <option key={escopo.id} value={escopo.id}>{escopo.modulo}/{escopo.acao}</option>)}
              </select>
            </label>
          </div>
          <div className="enac-cadastro-actions"><button type="submit" disabled={saving || !linkForm.perfil_id || !linkForm.escopo_id}>Salvar escopo</button></div>
        </form>
        <VinculosEscoposTable vinculos={vinculos} saving={saving} onInativar={onLinkInativar} onReativar={onLinkReativar} />
      </aside>
    </div>
  );
}

function VinculosEscoposTable({
  vinculos,
  saving,
  onInativar,
  onReativar
}: {
  vinculos: PerfilEscopoApi[];
  saving: boolean;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-acessos-table">
        <thead><tr><th>Perfil</th><th>Escopo</th><th>Status</th><th>Acoes</th></tr></thead>
        <tbody>
          {vinculos.slice(0, 16).map((vinculo) => (
            <tr key={vinculo.id}>
              <td>{vinculo.perfil_nome}</td>
              <td>{vinculo.modulo}/{vinculo.acao}</td>
              <td><StatusBadge status={vinculo.status} /></td>
              <td>
                <div className="enac-cadastro-row-actions">
                  {vinculo.status === 'ativo'
                    ? <button type="button" onClick={() => onInativar(vinculo.id)} disabled={saving}>Inativar</button>
                    : <button type="button" onClick={() => onReativar(vinculo.id)} disabled={saving}>Reativar</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EscoposPanel({
  escopos,
  form,
  saving,
  onFormChange,
  onSubmit,
  onEdit,
  onInativar,
  onReativar
}: {
  escopos: EscopoApi[];
  form: EscopoForm;
  saving: boolean;
  onFormChange: (form: EscopoForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEdit: (form: EscopoForm) => void;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-acessos-grid">
      <section className="enac-acessos-main">
        <div className="enac-cadastro-toolbar"><div><h2>Escopos</h2><p>{escopos.length} escopo(s)</p></div></div>
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-acessos-table">
            <thead><tr><th>Modulo</th><th>Acao</th><th>Descricao</th><th>Status</th><th>Acoes</th></tr></thead>
            <tbody>
              {escopos.map((escopo) => (
                <tr key={escopo.id}>
                  <td><strong>{escopo.modulo}</strong></td>
                  <td>{escopo.acao}</td>
                  <td>{escopo.descricao || '-'}</td>
                  <td><StatusBadge status={escopo.status} /></td>
                  <td>
                    <div className="enac-cadastro-row-actions">
                      <button type="button" onClick={() => onEdit({ id: escopo.id, modulo: escopo.modulo, acao: escopo.acao, descricao: escopo.descricao || '' })} disabled={saving}>Editar</button>
                      {escopo.status === 'ativo'
                        ? <button type="button" onClick={() => onInativar(escopo.id)} disabled={saving}>Inativar</button>
                        : <button type="button" onClick={() => onReativar(escopo.id)} disabled={saving}>Reativar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="enac-acessos-side">
        <form className="enac-cadastro-form" onSubmit={onSubmit}>
          <div className="enac-cadastro-form-head"><h3>{form.id ? 'Editar escopo' : 'Criar escopo'}</h3></div>
          <div className="enac-cadastro-form-grid">
            <SelectField label="Modulo" value={form.modulo} options={modules} disabled={saving} onChange={(value) => onFormChange({ ...form, modulo: value })} />
            <SelectField label="Acao" value={form.acao} options={actions} disabled={saving} onChange={(value) => onFormChange({ ...form, acao: value })} />
            <label className="enac-solicitacao-span-2"><span>Descricao</span><input value={form.descricao} onChange={(event) => onFormChange({ ...form, descricao: event.target.value })} disabled={saving} /></label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving}>{form.id ? 'Salvar escopo' : 'Criar escopo'}</button>
            {form.id && <button type="button" className="enac-cadastro-secondary" onClick={() => onFormChange(emptyEscopoForm())} disabled={saving}>Limpar</button>}
          </div>
        </form>
      </aside>
    </div>
  );
}

function AlcadasPanel({
  usuarios,
  perfis,
  obras,
  centrosCusto,
  alcadas,
  form,
  validacaoForm,
  validacao,
  saving,
  onFormChange,
  onValidacaoFormChange,
  onSubmit,
  onValidar,
  onEdit,
  onInativar,
  onReativar
}: {
  usuarios: UsuarioApi[];
  perfis: PerfilApi[];
  obras: ObraApi[];
  centrosCusto: CentroCustoApi[];
  alcadas: AlcadaApi[];
  form: AlcadaForm;
  validacaoForm: ValidacaoForm;
  validacao: ValidarAlcadaResponse | null;
  saving: boolean;
  onFormChange: (form: AlcadaForm) => void;
  onValidacaoFormChange: (form: ValidacaoForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onValidar: (event: React.FormEvent) => void;
  onEdit: (form: AlcadaForm) => void;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
}): JSX.Element {
  return (
    <div className="enac-acessos-grid">
      <section className="enac-acessos-main">
        <div className="enac-cadastro-toolbar"><div><h2>Regras de alcada</h2><p>{alcadas.length} regra(s)</p></div></div>
        <div className="enac-cadastro-table-wrap">
          <table className="enac-web-table enac-acessos-table">
            <thead><tr><th>Responsavel</th><th>Modulo</th><th>Acao</th><th>Faixa</th><th>Status</th><th>Acoes</th></tr></thead>
            <tbody>
              {alcadas.map((alcada) => (
                <tr key={alcada.id}>
                  <td><strong>{alcada.usuario_nome || alcada.perfil_nome || '-'}</strong></td>
                  <td>{alcada.modulo}<br />{alcada.tipo_documento}</td>
                  <td>{alcada.acao}</td>
                  <td>{formatMoney(alcada.valor_minimo)} ate {alcada.valor_maximo ? formatMoney(alcada.valor_maximo) : 'sem limite'}</td>
                  <td><StatusBadge status={alcada.status} /></td>
                  <td>
                    <div className="enac-cadastro-row-actions">
                      <button
                        type="button"
                        onClick={() => onEdit({
                          id: alcada.id,
                          usuario_id: alcada.usuario_id || '',
                          perfil_id: alcada.perfil_id || '',
                          modulo: alcada.modulo,
                          tipo_documento: alcada.tipo_documento,
                          acao: alcada.acao,
                          obra_id: alcada.obra_id || '',
                          centro_custo_id: alcada.centro_custo_id || '',
                          valor_minimo: String(alcada.valor_minimo),
                          valor_maximo: alcada.valor_maximo ? String(alcada.valor_maximo) : '',
                          observacoes: alcada.observacoes || ''
                        })}
                        disabled={saving}
                      >
                        Editar
                      </button>
                      {alcada.status === 'ativo'
                        ? <button type="button" onClick={() => onInativar(alcada.id)} disabled={saving}>Inativar</button>
                        : <button type="button" onClick={() => onReativar(alcada.id)} disabled={saving}>Reativar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="enac-acessos-side">
        <AlcadaFormView
          usuarios={usuarios}
          perfis={perfis}
          obras={obras}
          centrosCusto={centrosCusto}
          form={form}
          saving={saving}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
        />
        <ValidacaoFormView
          usuarios={usuarios}
          obras={obras}
          centrosCusto={centrosCusto}
          form={validacaoForm}
          validacao={validacao}
          saving={saving}
          onFormChange={onValidacaoFormChange}
          onSubmit={onValidar}
        />
      </aside>
    </div>
  );
}

function AlcadaFormView({
  usuarios,
  perfis,
  obras,
  centrosCusto,
  form,
  saving,
  onFormChange,
  onSubmit
}: {
  usuarios: UsuarioApi[];
  perfis: PerfilApi[];
  obras: ObraApi[];
  centrosCusto: CentroCustoApi[];
  form: AlcadaForm;
  saving: boolean;
  onFormChange: (form: AlcadaForm) => void;
  onSubmit: (event: React.FormEvent) => void;
}): JSX.Element {
  return (
    <form className="enac-cadastro-form" onSubmit={onSubmit}>
      <div className="enac-cadastro-form-head"><h3>{form.id ? 'Editar alcada' : 'Criar alcada'}</h3></div>
      <div className="enac-cadastro-form-grid">
        <label>
          <span>Usuario</span>
          <select value={form.usuario_id} onChange={(event) => onFormChange({ ...form, usuario_id: event.target.value, perfil_id: event.target.value ? '' : form.perfil_id })} disabled={saving}>
            <option value="">Sem usuario especifico</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Perfil</span>
          <select value={form.perfil_id} onChange={(event) => onFormChange({ ...form, perfil_id: event.target.value, usuario_id: event.target.value ? '' : form.usuario_id })} disabled={saving}>
            <option value="">Sem perfil especifico</option>
            {perfis.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>)}
          </select>
        </label>
        <SelectField label="Modulo" value={form.modulo} options={modules} disabled={saving} onChange={(value) => onFormChange({ ...form, modulo: value })} />
        <SelectField label="Tipo documento" value={form.tipo_documento} options={documentTypes} disabled={saving} onChange={(value) => onFormChange({ ...form, tipo_documento: value })} />
        <SelectField label="Acao" value={form.acao} options={actions} disabled={saving} onChange={(value) => onFormChange({ ...form, acao: value })} />
        <label><span>Valor minimo</span><input value={form.valor_minimo} onChange={(event) => onFormChange({ ...form, valor_minimo: event.target.value })} disabled={saving} required /></label>
        <label><span>Valor maximo</span><input value={form.valor_maximo} onChange={(event) => onFormChange({ ...form, valor_maximo: event.target.value })} disabled={saving} /></label>
        <label>
          <span>Obra</span>
          <select value={form.obra_id} onChange={(event) => onFormChange({ ...form, obra_id: event.target.value })} disabled={saving}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Centro de custo</span>
          <select value={form.centro_custo_id} onChange={(event) => onFormChange({ ...form, centro_custo_id: event.target.value })} disabled={saving}>
            <option value="">Todos</option>
            {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
          </select>
        </label>
        <label className="enac-solicitacao-span-2"><span>Observacoes</span><textarea value={form.observacoes} onChange={(event) => onFormChange({ ...form, observacoes: event.target.value })} disabled={saving} /></label>
      </div>
      <div className="enac-cadastro-actions">
        <button type="submit" disabled={saving || (!form.usuario_id && !form.perfil_id)}>{form.id ? 'Salvar alcada' : 'Criar alcada'}</button>
        {form.id && <button type="button" className="enac-cadastro-secondary" onClick={() => onFormChange(emptyAlcadaForm())} disabled={saving}>Limpar</button>}
      </div>
    </form>
  );
}

function ValidacaoFormView({
  usuarios,
  obras,
  centrosCusto,
  form,
  validacao,
  saving,
  onFormChange,
  onSubmit
}: {
  usuarios: UsuarioApi[];
  obras: ObraApi[];
  centrosCusto: CentroCustoApi[];
  form: ValidacaoForm;
  validacao: ValidarAlcadaResponse | null;
  saving: boolean;
  onFormChange: (form: ValidacaoForm) => void;
  onSubmit: (event: React.FormEvent) => void;
}): JSX.Element {
  return (
    <form className="enac-cadastro-form" onSubmit={onSubmit}>
      <div className="enac-cadastro-form-head"><h3>Validar alcada</h3></div>
      <div className="enac-cadastro-form-grid">
        <label>
          <span>Usuario</span>
          <select value={form.usuario_id} onChange={(event) => onFormChange({ ...form, usuario_id: event.target.value })} disabled={saving} required>
            <option value="">Selecione</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
          </select>
        </label>
        <SelectField label="Modulo" value={form.modulo} options={modules} disabled={saving} onChange={(value) => onFormChange({ ...form, modulo: value })} />
        <SelectField label="Tipo documento" value={form.tipo_documento} options={documentTypes} disabled={saving} onChange={(value) => onFormChange({ ...form, tipo_documento: value })} />
        <SelectField label="Acao" value={form.acao} options={actions} disabled={saving} onChange={(value) => onFormChange({ ...form, acao: value })} />
        <label><span>Valor</span><input value={form.valor} onChange={(event) => onFormChange({ ...form, valor: event.target.value })} disabled={saving} required /></label>
        <label>
          <span>Obra</span>
          <select value={form.obra_id} onChange={(event) => onFormChange({ ...form, obra_id: event.target.value })} disabled={saving}>
            <option value="">Todas</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Centro de custo</span>
          <select value={form.centro_custo_id} onChange={(event) => onFormChange({ ...form, centro_custo_id: event.target.value })} disabled={saving}>
            <option value="">Todos</option>
            {centrosCusto.map((centro) => <option key={centro.id} value={centro.id}>{centro.codigo} - {centro.nome}</option>)}
          </select>
        </label>
      </div>
      <div className="enac-cadastro-actions"><button type="submit" disabled={saving || !form.usuario_id}>Validar</button></div>
      {validacao && (
        <div className={`enac-web-alert enac-web-alert--compact ${validacao.aprovado ? 'enac-web-alert--success' : ''}`}>
          <strong>{validacao.decisao}</strong>
          <p>{validacao.motivo}</p>
        </div>
      )}
    </form>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
