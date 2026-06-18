import * as React from 'react';
import {
  erpApi,
  type CentroCustoApi,
  type DocumentoApi,
  type DocumentoPayload,
  type EmpresaApi,
  type FornecedorApi,
  type NotaEntradaApi,
  type NotaEntradaStatus,
  type ObraApi,
  type PedidoCompraApi,
  type UsuarioApi
} from '../../services/erpApi';

interface NotaFilters {
  status: NotaEntradaStatus | '';
  fornecedor_id: string;
  pedido_id: string;
  obra_id: string;
  centro_custo_id: string;
}

interface NotaForm {
  pedido_id: string;
  numero: string;
  serie: string;
  chave_acesso: string;
  tipo_documento: string;
  data_emissao: string;
  data_entrada: string;
  valor_produtos: string;
  valor_servicos: string;
  valor_frete: string;
  valor_desconto: string;
  valor_impostos: string;
  observacoes: string;
}

interface NotaDocumentoDraft {
  nome_arquivo: string;
  extensao: string;
  mime_type: string;
  tamanho_bytes: number;
  selecionado_em: string;
  preview_url?: string;
  xml_preview?: string;
}

const marker = 'DEV_LOCAL_V3_5A';

const statusLabels: Record<NotaEntradaStatus, string> = {
  RASCUNHO: 'Rascunho',
  CONFERIDA: 'Conferida',
  DIVERGENTE: 'Divergente',
  APROVADA: 'Aprovada',
  PROVISIONADA: 'Provisionada',
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

const emptyFilters = (): NotaFilters => ({
  status: '',
  fornecedor_id: '',
  pedido_id: '',
  obra_id: '',
  centro_custo_id: ''
});

const today = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const nextNotaNumero = (): string => `NF-${marker}-${Date.now().toString().slice(-8)}`;

const emptyNotaForm = (): NotaForm => ({
  pedido_id: '',
  numero: nextNotaNumero(),
  serie: 'V35A',
  chave_acesso: '',
  tipo_documento: 'NOTA_FISCAL',
  data_emissao: today(),
  data_entrada: today(),
  valor_produtos: '',
  valor_servicos: '0',
  valor_frete: '0',
  valor_desconto: '0',
  valor_impostos: '0',
  observacoes: `${marker} - nota local sem XML, SEFAZ ou pagamento`
});

const buildEditForm = (nota: NotaEntradaApi | null): NotaForm => ({
  pedido_id: nota?.pedido_id || '',
  numero: nota?.numero || '',
  serie: nota?.serie || '',
  chave_acesso: nota?.chave_acesso || '',
  tipo_documento: nota?.tipo_documento || 'NOTA_FISCAL',
  data_emissao: nota?.data_emissao ? nota.data_emissao.slice(0, 10) : '',
  data_entrada: nota?.data_entrada ? nota.data_entrada.slice(0, 10) : '',
  valor_produtos: String(nota?.valor_produtos ?? ''),
  valor_servicos: String(nota?.valor_servicos ?? '0'),
  valor_frete: String(nota?.valor_frete ?? '0'),
  valor_desconto: String(nota?.valor_desconto ?? '0'),
  valor_impostos: String(nota?.valor_impostos ?? '0'),
  observacoes: nota?.observacoes || ''
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

const formatBytes = (value: string | number | null | undefined): string => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const statusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const fileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.trim().toLowerCase();
  return extension || 'bin';
};

const isPdfDraft = (draft: NotaDocumentoDraft | null): boolean =>
  Boolean(draft && (draft.extensao === 'pdf' || draft.mime_type.includes('pdf')));

const isXmlDraft = (draft: NotaDocumentoDraft | null): boolean =>
  Boolean(draft && (draft.extensao === 'xml' || draft.mime_type.includes('xml')));

const calculateTotal = (form: NotaForm): number =>
  Number((
    toNumber(form.valor_produtos) +
    toNumber(form.valor_servicos) +
    toNumber(form.valor_frete) +
    toNumber(form.valor_impostos) -
    toNumber(form.valor_desconto)
  ).toFixed(2));

const canEdit = (nota: NotaEntradaApi | null): boolean => nota?.status === 'RASCUNHO';
const canCancel = (nota: NotaEntradaApi): boolean => ['RASCUNHO', 'CONFERIDA', 'DIVERGENTE'].includes(nota.status);
type NotaView = 'consulta' | 'novo' | 'detalhe';

export function NotasEntradaPage(): JSX.Element {
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [fornecedores, setFornecedores] = React.useState<FornecedorApi[]>([]);
  const [obras, setObras] = React.useState<ObraApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioApi[]>([]);
  const [pedidosElegiveis, setPedidosElegiveis] = React.useState<PedidoCompraApi[]>([]);
  const [selectedPedido, setSelectedPedido] = React.useState<PedidoCompraApi | null>(null);
  const [notas, setNotas] = React.useState<NotaEntradaApi[]>([]);
  const [selectedNota, setSelectedNota] = React.useState<NotaEntradaApi | null>(null);
  const [filters, setFilters] = React.useState<NotaFilters>(emptyFilters());
  const [form, setForm] = React.useState<NotaForm>(emptyNotaForm());
  const [editForm, setEditForm] = React.useState<NotaForm>(buildEditForm(null));
  const [documentosNota, setDocumentosNota] = React.useState<DocumentoApi[]>([]);
  const [documentoDraft, setDocumentoDraft] = React.useState<NotaDocumentoDraft | null>(null);
  const [loadingDocumentos, setLoadingDocumentos] = React.useState<boolean>(false);
  const [approvalUserId, setApprovalUserId] = React.useState<string>('');
  const [cancelTarget, setCancelTarget] = React.useState<NotaEntradaApi | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [activeView, setActiveView] = React.useState<NotaView>('consulta');

  const empresa = empresas[0];

  const loadNotas = React.useCallback(async (nextFilters: NotaFilters): Promise<void> => {
    setNotas(await erpApi.notasEntrada.list(nextFilters));
  }, []);

  const loadDocumentosNota = React.useCallback(async (notaId?: string): Promise<void> => {
    if (!notaId) {
      setDocumentosNota([]);
      return;
    }

    setLoadingDocumentos(true);
    try {
      setDocumentosNota(await erpApi.documentos.entidade('nota_fiscal_entrada', notaId, {
        tipo_documento: 'NF',
        limit: '30'
      }));
    } finally {
      setLoadingDocumentos(false);
    }
  }, []);

  const loadReferences = React.useCallback(async (): Promise<void> => {
    const [empresasResponse, fornecedoresResponse, obrasResponse, centrosResponse, pedidosEmitidos, pedidosEnviados, pedidosConfirmados, usuariosResponse] = await Promise.all([
      erpApi.empresas.list(),
      erpApi.fornecedores.list(),
      erpApi.obras.list(),
      erpApi.centrosCusto.list(),
      erpApi.pedidosCompra.list({ status: 'EMITIDO' }),
      erpApi.pedidosCompra.list({ status: 'ENVIADO_FORNECEDOR' }),
      erpApi.pedidosCompra.list({ status: 'CONFIRMADO' }),
      erpApi.usuarios.list()
    ]);
    const pedidosResponse = [...pedidosEmitidos, ...pedidosEnviados, ...pedidosConfirmados];
    setEmpresas(empresasResponse);
    setFornecedores(fornecedoresResponse.filter((fornecedor) => fornecedor.status !== 'inativo'));
    setObras(obrasResponse.filter((obra) => obra.status !== 'inativo'));
    setCentrosCusto(centrosResponse.filter((centro) => centro.status !== 'inativo'));
    setUsuarios(usuariosResponse.filter((usuario) => usuario.status !== 'inativo' && usuario.ativo !== false));
    setPedidosElegiveis(pedidosResponse);
    setForm((current) => ({
      ...current,
      pedido_id: current.pedido_id || pedidosResponse[0]?.id || ''
    }));
    setApprovalUserId((current) => current || usuariosResponse.find((usuario) => usuario.email === 'matheus.dev.v35b@enac.local')?.id || usuariosResponse[0]?.id || '');
  }, []);

  React.useEffect(() => {
    let active = true;
    Promise.all([loadReferences(), loadNotas(emptyFilters())])
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
  }, [loadReferences, loadNotas]);

  React.useEffect(() => {
    setEditForm(buildEditForm(selectedNota));
  }, [selectedNota]);

  React.useEffect(() => {
    void loadDocumentosNota(selectedNota?.id).catch((documentosError) => setError(getErrorMessage(documentosError)));
  }, [loadDocumentosNota, selectedNota?.id]);

  React.useEffect(() => () => {
    if (documentoDraft?.preview_url) {
      URL.revokeObjectURL(documentoDraft.preview_url);
    }
  }, [documentoDraft?.preview_url]);

  React.useEffect(() => {
    if (!form.pedido_id) {
      setSelectedPedido(null);
      return;
    }

    let active = true;
    erpApi.pedidosCompra.get(form.pedido_id)
      .then((pedido) => {
        if (active) {
          setSelectedPedido(pedido);
          setForm((current) => ({
            ...current,
            valor_produtos: current.valor_produtos || String(pedido.valor_total)
          }));
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
  }, [form.pedido_id]);

  const refresh = async (notaId = selectedNota?.id): Promise<void> => {
    setError('');
    await Promise.all([loadReferences(), loadNotas(filters)]);
    if (notaId) {
      setSelectedNota(await erpApi.notasEntrada.get(notaId));
    }
  };

  const updateFilters = (field: keyof NotaFilters, value: string): void => {
    const nextFilters = { ...filters, [field]: value } as NotaFilters;
    setFilters(nextFilters);
    void loadNotas(nextFilters).catch((filterError) => setError(getErrorMessage(filterError)));
  };

  const updateForm = (field: keyof NotaForm, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditForm = (field: keyof NotaForm, value: string): void => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const clearDocumentoDraft = (): void => {
    setDocumentoDraft(null);
  };

  const buildDocumentoPayload = (nota: NotaEntradaApi, draft: NotaDocumentoDraft): DocumentoPayload => ({
    company_id: nota.company_id,
    entidade_tipo: 'nota_fiscal_entrada',
    entidade_id: nota.id,
    tipo_documento: 'NF',
    nome_arquivo: draft.nome_arquivo,
    extensao: draft.extensao,
    mime_type: draft.mime_type,
    tamanho_bytes: draft.tamanho_bytes,
    descricao: `Documento fiscal vinculado à NF ${nota.numero}${nota.serie ? `/${nota.serie}` : ''}.`,
    observacao: `${marker} - referência documental local; sem upload externo real ou SharePoint real.`,
    origem: 'ERP_LOCAL',
    status: 'ATIVO',
    referencia_local_mock: `mock://notas-fiscais-entrada/${nota.id}/${draft.nome_arquivo}`,
    usuario_id: approvalUserId || undefined
  });

  const createDocumentoReferencia = async (nota: NotaEntradaApi, draft: NotaDocumentoDraft): Promise<DocumentoApi> => {
    const created = await erpApi.documentos.create(buildDocumentoPayload(nota, draft));
    setDocumentosNota((current) => [created, ...current.filter((documento) => documento.id !== created.id)]);
    return created;
  };

  const buildDocumentoDraft = async (file: File): Promise<NotaDocumentoDraft> => {
    const extensao = fileExtension(file.name);
    const mimeType = file.type || (extensao === 'xml' ? 'application/xml' : 'application/octet-stream');
    const isPdf = extensao === 'pdf' || mimeType.includes('pdf');
    const isXml = extensao === 'xml' || mimeType.includes('xml');
    const xmlPreview = isXml ? (await file.text()).slice(0, 1800) : undefined;
    return {
      nome_arquivo: file.name,
      extensao,
      mime_type: mimeType,
      tamanho_bytes: file.size,
      selecionado_em: new Date().toISOString(),
      preview_url: isPdf ? URL.createObjectURL(file) : undefined,
      xml_preview: xmlPreview
    };
  };

  const handleDocumentoFile = async (event: React.ChangeEvent<HTMLInputElement>, nota?: NotaEntradaApi | null): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setError('');
    setMessage('');
    try {
      const draft = await buildDocumentoDraft(file);
      setDocumentoDraft(draft);
      if (!nota) {
        setMessage('Documento selecionado para prévia local. A referência será registrada após criar a nota.');
        return;
      }

      setSaving(true);
      await createDocumentoReferencia(nota, draft);
      setMessage('Referência documental da NF registrada localmente.');
    } catch (documentoError) {
      setError(getErrorMessage(documentoError));
    } finally {
      setSaving(false);
    }
  };

  const selectNota = async (nota: NotaEntradaApi): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      setSelectedNota(await erpApi.notasEntrada.get(nota.id));
      setActiveView('detalhe');
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setSaving(false);
    }
  };

  const createNota = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !empresa) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const total = calculateTotal(form);
      const nota = await erpApi.notasEntrada.gerarDoPedido({
        company_id: empresa.id,
        pedido_id: form.pedido_id,
        numero: form.numero,
        serie: form.serie || null,
        chave_acesso: form.chave_acesso || null,
        tipo_documento: form.tipo_documento || 'NOTA_FISCAL',
        data_emissao: form.data_emissao,
        data_entrada: form.data_entrada,
        valor_produtos: toNumber(form.valor_produtos),
        valor_servicos: toNumber(form.valor_servicos),
        valor_frete: toNumber(form.valor_frete),
        valor_desconto: toNumber(form.valor_desconto),
        valor_impostos: toNumber(form.valor_impostos),
        valor_total: total,
        observacoes: form.observacoes || null
      });
      const documentoSelecionado = documentoDraft;
      if (documentoSelecionado) {
        await createDocumentoReferencia(nota, documentoSelecionado);
      }
      setSelectedNota(nota);
      setActiveView('detalhe');
      setForm(emptyNotaForm());
      setMessage(documentoSelecionado ? 'Nota criada em rascunho e referência documental da NF registrada.' : 'Nota de entrada criada em rascunho.');
      await refresh(nota.id);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const saveNota = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (saving || !selectedNota) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const nota = await erpApi.notasEntrada.update(selectedNota.id, {
        numero: editForm.numero,
        serie: editForm.serie || null,
        chave_acesso: editForm.chave_acesso || null,
        tipo_documento: editForm.tipo_documento || 'NOTA_FISCAL',
        data_emissao: editForm.data_emissao,
        data_entrada: editForm.data_entrada,
        valor_produtos: toNumber(editForm.valor_produtos),
        valor_servicos: toNumber(editForm.valor_servicos),
        valor_frete: toNumber(editForm.valor_frete),
        valor_desconto: toNumber(editForm.valor_desconto),
        valor_impostos: toNumber(editForm.valor_impostos),
        valor_total: calculateTotal(editForm),
        observacoes: editForm.observacoes || null
      });
      setSelectedNota(nota);
      setMessage('Nota atualizada.');
      await refresh(nota.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (
    nota: NotaEntradaApi,
    action: 'conferir' | 'marcar-divergente' | 'reabrir-rascunho' | 'aprovar' | 'provisionar-conta-pagar' | 'cancelar'
  ): Promise<void> => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = action === 'provisionar-conta-pagar'
        ? (await erpApi.notasEntrada.provisionarContaPagar(nota.id, {
          data_vencimento: addDays(7),
          observacoes: `${marker} - conta provisionada pela nota fiscal de entrada`
        })).nota
        : await erpApi.notasEntrada.transition(nota.id, action);
      setSelectedNota(updated);
      setCancelTarget(null);
      setMessage(action === 'provisionar-conta-pagar' ? 'Conta a pagar provisionada.' : 'Status da nota atualizado.');
      await refresh(updated.id);
    } catch (transitionError) {
      setError(getErrorMessage(transitionError));
    } finally {
      setSaving(false);
    }
  };

  const approveNota = async (nota: NotaEntradaApi, action: 'aprovar-tecnico' | 'aprovar-diretoria'): Promise<void> => {
    if (saving || !approvalUserId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await erpApi.notasEntrada.aprovar(nota.id, action, {
        usuario_id: approvalUserId,
        observacoes: `${marker} - aprovacao local por alcada`
      });
      setSelectedNota(updated);
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
      <h1>Notas Fiscais de Entrada</h1>
      <p className="enac-web-lead">
        Lançamento local de nota fiscal de entrada vinculada a pedido de compra, sem XML, SEFAZ, prefeitura ou pagamento.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando notas locais.</div>}
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
          <div className="enac-ui-tabs" role="tablist" aria-label="Notas fiscais de entrada">
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
          <section className="enac-finance-main enac-module-panel" aria-label="Lista e detalhe de notas de entrada">
            {activeView === 'consulta' && (
              <>
            <NotaFiltersBar
              filters={filters}
              fornecedores={fornecedores}
              pedidos={pedidosElegiveis}
              obras={obras}
              centrosCusto={centrosCusto}
              saving={saving}
              onChange={updateFilters}
            />

            <div className="enac-cadastro-toolbar">
              <div>
                <h2>Lista de notas fiscais</h2>
                <p>{notas.length} nota(s) encontrada(s)</p>
              </div>
              <button type="button" className="enac-cadastro-secondary" onClick={() => void refresh()} disabled={saving}>
                Atualizar
              </button>
            </div>

            <NotasTable notas={notas} selectedId={selectedNota?.id} saving={saving} onSelect={(nota) => void selectNota(nota)} />
              </>
            )}

            {activeView === 'detalhe' && selectedNota && (
              <NotaDetail
                nota={selectedNota}
                editForm={editForm}
                documentos={documentosNota}
                documentoDraft={documentoDraft}
                loadingDocumentos={loadingDocumentos}
                saving={saving}
                cancelTarget={cancelTarget}
                usuarios={usuarios}
                approvalUserId={approvalUserId}
                onEditChange={updateEditForm}
                onSave={(event) => void saveNota(event)}
                onApprovalUserChange={setApprovalUserId}
                onApprove={(nota, action) => void approveNota(nota, action)}
                onTransition={(nota, action) => action === 'cancelar' ? setCancelTarget(nota) : void transition(nota, action)}
                onConfirmCancel={(nota) => void transition(nota, 'cancelar')}
                onDismissCancel={() => setCancelTarget(null)}
                onDocumentoFile={(event, nota) => void handleDocumentoFile(event, nota)}
                onClearDocumentoDraft={clearDocumentoDraft}
              />
            )}
            {activeView === 'detalhe' && !selectedNota && (
              <div className="enac-cadastro-empty">Selecione uma nota na aba Consulta para visualizar detalhes e ações.</div>
            )}
          </section>
          )}

          {activeView === 'novo' && (
          <section className="enac-finance-panel enac-module-panel enac-nf-new-grid" aria-label="Nova nota fiscal de entrada">
            <form className="enac-cadastro-form enac-finance-form" onSubmit={(event) => void createNota(event)}>
              <div className="enac-cadastro-form-head">
                <h3>Nova nota fiscal</h3>
              </div>

              <div className="enac-cadastro-form-grid">
                <label className="enac-solicitacao-span-2">
                  <span>Pedido confirmado<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <select value={form.pedido_id} onChange={(event) => updateForm('pedido_id', event.target.value)} disabled={saving} required>
                    <option value="">Selecione</option>
                    {pedidosElegiveis.map((pedido) => (
                      <option key={pedido.id} value={pedido.id}>
                        {pedido.codigo} - {pedido.titulo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Número<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input value={form.numero} onChange={(event) => updateForm('numero', event.target.value)} disabled={saving} required />
                </label>
                <label>
                  <span>Série</span>
                  <input value={form.serie} onChange={(event) => updateForm('serie', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Emissão<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input type="date" value={form.data_emissao} onChange={(event) => updateForm('data_emissao', event.target.value)} disabled={saving} required />
                </label>
                <label>
                  <span>Entrada<strong className="enac-cadastro-required">Obrigatório</strong></span>
                  <input type="date" value={form.data_entrada} onChange={(event) => updateForm('data_entrada', event.target.value)} disabled={saving} required />
                </label>
                <label>
                  <span>Valor produtos</span>
                  <input type="number" step="0.01" value={form.valor_produtos} onChange={(event) => updateForm('valor_produtos', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Valor serviços</span>
                  <input type="number" step="0.01" value={form.valor_servicos} onChange={(event) => updateForm('valor_servicos', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Frete</span>
                  <input type="number" step="0.01" value={form.valor_frete} onChange={(event) => updateForm('valor_frete', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Impostos</span>
                  <input type="number" step="0.01" value={form.valor_impostos} onChange={(event) => updateForm('valor_impostos', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Desconto</span>
                  <input type="number" step="0.01" value={form.valor_desconto} onChange={(event) => updateForm('valor_desconto', event.target.value)} disabled={saving} />
                </label>
                <label>
                  <span>Total calculado</span>
                  <input value={formatMoney(calculateTotal(form))} disabled />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Chave de acesso</span>
                  <input value={form.chave_acesso} onChange={(event) => updateForm('chave_acesso', event.target.value)} disabled={saving} />
                </label>
                <label className="enac-solicitacao-span-2">
                  <span>Observações</span>
                  <textarea value={form.observacoes} onChange={(event) => updateForm('observacoes', event.target.value)} disabled={saving} />
                </label>
              </div>

              {selectedPedido && <PedidoPreview pedido={selectedPedido} />}

              <div className="enac-nf-upload-strip">
                <label className="enac-nf-upload-button">
                  Anexar PDF/XML da NF
                  <input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(event) => void handleDocumentoFile(event)} disabled={saving} />
                </label>
                <span>Prévia local e metadados. O vínculo documental é gravado somente após criar a NF.</span>
              </div>

              <div className="enac-cadastro-actions">
                <button type="submit" disabled={saving || !form.pedido_id || !form.numero.trim() || calculateTotal(form) <= 0}>
                  {saving ? 'Salvando...' : 'Criar nota'}
                </button>
              </div>
            </form>
            <NotaDocumentoPanel
              title="Prévia do documento"
              documentos={[]}
              draft={documentoDraft}
              loading={false}
              emptyText="Nenhum documento selecionado. Use Anexar PDF/XML da NF para pré-visualizar e registrar a referência após criar a nota."
              onClearDraft={clearDocumentoDraft}
            />
          </section>
          )}
        </div>
      )}
    </section>
  );
}

function NotaFiltersBar({
  filters,
  fornecedores,
  pedidos,
  obras,
  centrosCusto,
  saving,
  onChange
}: {
  filters: NotaFilters;
  fornecedores: FornecedorApi[];
  pedidos: PedidoCompraApi[];
  obras: ObraApi[];
  centrosCusto: CentroCustoApi[];
  saving: boolean;
  onChange: (field: keyof NotaFilters, value: string) => void;
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
        <span>Pedido</span>
        <select value={filters.pedido_id} onChange={(event) => onChange('pedido_id', event.target.value)} disabled={saving}>
          <option value="">Todos</option>
          {pedidos.map((pedido) => <option key={pedido.id} value={pedido.id}>{pedido.codigo}</option>)}
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

function NotasTable({
  notas,
  selectedId,
  saving,
  onSelect
}: {
  notas: NotaEntradaApi[];
  selectedId?: string;
  saving: boolean;
  onSelect: (nota: NotaEntradaApi) => void;
}): JSX.Element {
  if (notas.length === 0) {
    return <div className="enac-cadastro-empty">Nenhuma nota de entrada encontrada.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-finance-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Status</th>
            <th>Aprovação</th>
            <th>Fornecedor</th>
            <th>Pedido</th>
            <th>Emissão</th>
            <th>Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota) => (
            <tr key={nota.id} className={selectedId === nota.id ? 'enac-finance-row-selected' : ''}>
              <td><strong>{nota.numero}{nota.serie ? `/${nota.serie}` : ''}</strong></td>
              <td><span className={`enac-finance-status enac-finance-status--${statusClass(nota.status)}`}>{statusLabels[nota.status]}</span></td>
              <td>{nota.aprovacao_status ? aprovacaoLabels[nota.aprovacao_status] || nota.aprovacao_status : '-'}</td>
              <td>{nota.fornecedor_nome}</td>
              <td>{nota.pedido_codigo}</td>
              <td>{formatDate(nota.data_emissao)}</td>
              <td>{formatMoney(nota.valor_total)}</td>
              <td><button type="button" onClick={() => onSelect(nota)} disabled={saving}>Detalhe</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotaDetail({
  nota,
  editForm,
  documentos,
  documentoDraft,
  loadingDocumentos,
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
  onDismissCancel,
  onDocumentoFile,
  onClearDocumentoDraft
}: {
  nota: NotaEntradaApi;
  editForm: NotaForm;
  documentos: DocumentoApi[];
  documentoDraft: NotaDocumentoDraft | null;
  loadingDocumentos: boolean;
  saving: boolean;
  cancelTarget: NotaEntradaApi | null;
  usuarios: UsuarioApi[];
  approvalUserId: string;
  onEditChange: (field: keyof NotaForm, value: string) => void;
  onSave: (event: React.FormEvent) => void;
  onApprovalUserChange: (value: string) => void;
  onApprove: (nota: NotaEntradaApi, action: 'aprovar-tecnico' | 'aprovar-diretoria') => void;
  onTransition: (
    nota: NotaEntradaApi,
    action: 'conferir' | 'marcar-divergente' | 'reabrir-rascunho' | 'aprovar' | 'provisionar-conta-pagar' | 'cancelar'
  ) => void;
  onConfirmCancel: (nota: NotaEntradaApi) => void;
  onDismissCancel: () => void;
  onDocumentoFile: (event: React.ChangeEvent<HTMLInputElement>, nota: NotaEntradaApi) => void;
  onClearDocumentoDraft: () => void;
}): JSX.Element {
  return (
    <section className="enac-finance-detail">
      <div className="enac-cadastro-toolbar">
        <div>
          <span className="enac-web-card-label">{nota.numero}{nota.serie ? `/${nota.serie}` : ''}</span>
          <h2>{nota.fornecedor_nome}</h2>
          <p>{nota.pedido_codigo} · {formatMoney(nota.valor_total)}</p>
        </div>
        <span className={`enac-finance-status enac-finance-status--${statusClass(nota.status)}`}>{statusLabels[nota.status]}</span>
      </div>

      <div className="enac-finance-meta">
        <div><span>Pedido</span><strong>{nota.pedido_codigo || '-'}</strong></div>
        <div><span>Obra</span><strong>{nota.obra_codigo || '-'}</strong></div>
        <div><span>Centro de custo</span><strong>{nota.centro_custo_codigo || '-'}</strong></div>
        <div><span>Emissão</span><strong>{formatDate(nota.data_emissao)}</strong></div>
        <div><span>Entrada</span><strong>{formatDate(nota.data_entrada)}</strong></div>
        <div><span>Chave</span><strong>{nota.chave_acesso || '-'}</strong></div>
        <div><span>Aprovação</span><strong>{nota.aprovacao_status ? aprovacaoLabels[nota.aprovacao_status] || nota.aprovacao_status : '-'}</strong></div>
        <div><span>Aprovador</span><strong>{nota.aprovado_por_nome || '-'}</strong></div>
      </div>

      {nota.status === 'CONFERIDA' && (
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
          <button type="button" onClick={() => onApprove(nota, 'aprovar-tecnico')} disabled={saving || !approvalUserId}>Aprovar técnico</button>
          <button type="button" onClick={() => onApprove(nota, 'aprovar-diretoria')} disabled={saving || !approvalUserId}>Aprovar diretoria</button>
        </div>
      )}

      <div className="enac-cadastro-row-actions enac-finance-actions">
        {nota.status === 'RASCUNHO' && <button type="button" onClick={() => onTransition(nota, 'conferir')} disabled={saving}>Conferir</button>}
        {nota.status === 'RASCUNHO' && <button type="button" onClick={() => onTransition(nota, 'marcar-divergente')} disabled={saving}>Marcar divergente</button>}
        {nota.status === 'DIVERGENTE' && <button type="button" onClick={() => onTransition(nota, 'reabrir-rascunho')} disabled={saving}>Reabrir rascunho</button>}
        {nota.status === 'APROVADA' && <button type="button" onClick={() => onTransition(nota, 'provisionar-conta-pagar')} disabled={saving}>Provisionar conta a pagar</button>}
        {canCancel(nota) && <button type="button" onClick={() => onTransition(nota, 'cancelar')} disabled={saving}>Cancelar</button>}
      </div>

      {cancelTarget?.id === nota.id && (
        <div className="enac-web-alert enac-web-alert--compact">
          <strong>Confirmar cancelamento da nota?</strong>
          <p>A nota ficará `CANCELADA` e não poderá gerar conta a pagar.</p>
          <div className="enac-cadastro-row-actions">
            <button type="button" onClick={() => onConfirmCancel(nota)} disabled={saving}>Confirmar cancelamento</button>
            <button type="button" className="enac-cadastro-secondary" onClick={onDismissCancel} disabled={saving}>Manter nota</button>
          </div>
        </div>
      )}

      {canEdit(nota) && (
        <form className="enac-cadastro-form enac-finance-edit-form" onSubmit={onSave}>
          <div className="enac-cadastro-form-head"><h3>Editar rascunho</h3></div>
          <div className="enac-cadastro-form-grid">
            <label><span>Número</span><input value={editForm.numero} onChange={(event) => onEditChange('numero', event.target.value)} disabled={saving} /></label>
            <label><span>Série</span><input value={editForm.serie} onChange={(event) => onEditChange('serie', event.target.value)} disabled={saving} /></label>
            <label><span>Emissão</span><input type="date" value={editForm.data_emissao} onChange={(event) => onEditChange('data_emissao', event.target.value)} disabled={saving} /></label>
            <label><span>Entrada</span><input type="date" value={editForm.data_entrada} onChange={(event) => onEditChange('data_entrada', event.target.value)} disabled={saving} /></label>
            <label><span>Valor produtos</span><input type="number" step="0.01" value={editForm.valor_produtos} onChange={(event) => onEditChange('valor_produtos', event.target.value)} disabled={saving} /></label>
            <label><span>Total calculado</span><input value={formatMoney(calculateTotal(editForm))} disabled /></label>
            <label className="enac-solicitacao-span-2"><span>Observações</span><textarea value={editForm.observacoes} onChange={(event) => onEditChange('observacoes', event.target.value)} disabled={saving} /></label>
          </div>
          <div className="enac-cadastro-actions">
            <button type="submit" disabled={saving || !editForm.numero.trim() || calculateTotal(editForm) <= 0}>{saving ? 'Salvando...' : 'Salvar rascunho'}</button>
          </div>
        </form>
      )}

      <NotaDocumentoPanel
        title="Documentos da NF"
        documentos={documentos}
        draft={documentoDraft}
        loading={loadingDocumentos}
        emptyText="Nenhum documento anexado. Use Anexar PDF/XML da NF para registrar metadados locais do arquivo fiscal."
        onClearDraft={onClearDocumentoDraft}
      >
        <label className="enac-nf-upload-button">
          Anexar PDF/XML da NF
          <input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(event) => onDocumentoFile(event, nota)} disabled={saving} />
        </label>
      </NotaDocumentoPanel>

      <NotaItemsTable nota={nota} />
    </section>
  );
}

function NotaDocumentoPanel({
  title,
  documentos,
  draft,
  loading,
  emptyText,
  onClearDraft,
  children
}: {
  title: string;
  documentos: DocumentoApi[];
  draft: NotaDocumentoDraft | null;
  loading: boolean;
  emptyText: string;
  onClearDraft: () => void;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <aside className="enac-nf-document-panel">
      <div className="enac-cadastro-toolbar">
        <div>
          <span className="enac-web-card-label">PDF/XML local</span>
          <h3>{title}</h3>
          <p>Metadados locais, sem upload externo e sem SharePoint real.</p>
        </div>
        {children}
      </div>

      {draft ? (
        <div className="enac-nf-document-preview">
          <div className="enac-nf-document-meta">
            <div><span>Arquivo selecionado</span><strong>{draft.nome_arquivo}</strong></div>
            <div><span>Tipo</span><strong>{draft.mime_type}</strong></div>
            <div><span>Tamanho</span><strong>{formatBytes(draft.tamanho_bytes)}</strong></div>
            <div><span>Selecionado em</span><strong>{formatDate(draft.selecionado_em)}</strong></div>
          </div>

          {isPdfDraft(draft) && draft.preview_url && (
            <iframe className="enac-nf-pdf-preview" title="Prévia local da nota fiscal em PDF" src={draft.preview_url} />
          )}

          {isXmlDraft(draft) && (
            <pre className="enac-nf-xml-preview">{draft.xml_preview || 'XML selecionado. Prévia textual indisponível.'}</pre>
          )}

          {!isPdfDraft(draft) && !isXmlDraft(draft) && (
            <div className="enac-cadastro-empty">Prévia visual indisponível para esta extensão. Os metadados serão preservados localmente.</div>
          )}

          <button type="button" className="enac-cadastro-secondary enac-nf-clear-document" onClick={onClearDraft}>
            Limpar prévia local
          </button>
        </div>
      ) : (
        <div className="enac-cadastro-empty">{emptyText}</div>
      )}

      <div className="enac-nf-document-list">
        <div className="enac-cadastro-toolbar">
          <div>
            <h4>Referências registradas</h4>
            <p>{loading ? 'Atualizando documentos...' : `${documentos.length} referência(s) local(is)`}</p>
          </div>
        </div>
        {documentos.length > 0 ? (
          documentos.map((documento) => (
            <article key={documento.id} className="enac-nf-document-card">
              <strong>{documento.nome_arquivo}</strong>
              <span>{String(documento.tipo_documento)} · {documento.extensao.toUpperCase()} · {formatBytes(documento.tamanho_bytes)}</span>
              <small>{documento.referencia_local_mock || documento.url_mock || 'Referência local registrada no ERP.'}</small>
            </article>
          ))
        ) : (
          <div className="enac-cadastro-empty">Nenhuma referência documental cadastrada para esta nota.</div>
        )}
      </div>
    </aside>
  );
}

function NotaItemsTable({ nota }: { nota: NotaEntradaApi }): JSX.Element {
  const itens = nota.itens || [];
  if (itens.length === 0) {
    return <div className="enac-cadastro-empty">Nota sem itens herdados.</div>;
  }

  return (
    <div className="enac-cadastro-table-wrap">
      <table className="enac-web-table enac-finance-items-table">
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
              <td>{toNumber(item.quantidade).toLocaleString('pt-BR')}</td>
              <td>{item.unidade}</td>
              <td>{formatMoney(item.valor_unitario)}</td>
              <td>{formatMoney(item.valor_total)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4}><strong>Total</strong></td>
            <td><strong>{formatMoney(nota.valor_total)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PedidoPreview({ pedido }: { pedido: PedidoCompraApi }): JSX.Element {
  return (
    <div className="enac-finance-preview">
      <span className="enac-web-card-label">{pedido.codigo}</span>
      <strong>{pedido.titulo}</strong>
      <p>{pedido.fornecedor_nome} · {formatMoney(pedido.valor_total)}</p>
      <div className="enac-finance-preview-list">
        {(pedido.itens || []).map((item) => (
          <div key={item.id}>
            <span>{item.descricao}</span>
            <strong>{formatMoney(item.valor_total)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
