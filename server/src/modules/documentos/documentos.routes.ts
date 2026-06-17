import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import { assertUuid, optionalText, registrarAuditoria } from '../aprovacoes/aprovacoes.service.js';

type DocumentoStatus = 'ATIVO' | 'INATIVO' | 'SUBSTITUIDO' | 'PENDENTE_ENVIO_FUTURO' | 'ERRO_REFERENCIA';
type TipoDocumento =
  | 'CONTRATO'
  | 'ADITIVO'
  | 'NF'
  | 'BOLETO_REFERENCIA'
  | 'COMPROVANTE_REFERENCIA'
  | 'MEDICAO'
  | 'FATURAMENTO'
  | 'ORCAMENTO'
  | 'PROPOSTA'
  | 'COTACAO'
  | 'PEDIDO'
  | 'FOTO_OBRA'
  | 'RELATORIO'
  | 'OUTROS';
type EntidadeTipo =
  | 'cliente'
  | 'fornecedor'
  | 'obra'
  | 'contrato_obra'
  | 'aditivo'
  | 'orcamento'
  | 'solicitacao_compra'
  | 'cotacao'
  | 'pedido_compra'
  | 'nota_fiscal_entrada'
  | 'conta_pagar'
  | 'programacao_pagamento'
  | 'baixa_manual'
  | 'medicao'
  | 'pedido_faturamento'
  | 'risco_pendencia'
  | 'tarefa'
  | 'auditoria';

interface DocumentoRow extends QueryResultRow {
  id: string;
  company_id: string;
  entidade_tipo: EntidadeTipo;
  entidade_id: string;
  obra_id: string | null;
  contrato_id: string | null;
  tipo_documento: TipoDocumento;
  nome_arquivo: string;
  extensao: string;
  mime_type: string | null;
  tamanho_bytes: string | number;
  descricao: string | null;
  observacao: string | null;
  origem: string;
  status: DocumentoStatus;
}

interface EntityContext extends QueryResultRow {
  company_id: string;
  obra_id: string | null;
  contrato_id: string | null;
}

interface PgErrorLike {
  code?: string;
  detail?: string;
}

const documentoStatusValues: DocumentoStatus[] = ['ATIVO', 'INATIVO', 'SUBSTITUIDO', 'PENDENTE_ENVIO_FUTURO', 'ERRO_REFERENCIA'];
const editableStatusValues: DocumentoStatus[] = ['ATIVO', 'PENDENTE_ENVIO_FUTURO', 'ERRO_REFERENCIA'];
const tipoDocumentoValues: TipoDocumento[] = [
  'CONTRATO',
  'ADITIVO',
  'NF',
  'BOLETO_REFERENCIA',
  'COMPROVANTE_REFERENCIA',
  'MEDICAO',
  'FATURAMENTO',
  'ORCAMENTO',
  'PROPOSTA',
  'COTACAO',
  'PEDIDO',
  'FOTO_OBRA',
  'RELATORIO',
  'OUTROS'
];
const entidadeTipoValues: EntidadeTipo[] = [
  'cliente',
  'fornecedor',
  'obra',
  'contrato_obra',
  'aditivo',
  'orcamento',
  'solicitacao_compra',
  'cotacao',
  'pedido_compra',
  'nota_fiscal_entrada',
  'conta_pagar',
  'programacao_pagamento',
  'baixa_manual',
  'medicao',
  'pedido_faturamento',
  'risco_pendencia',
  'tarefa',
  'auditoria'
];

const entityContextQueries: Record<EntidadeTipo, string> = {
  cliente: `select company_id, null::uuid as obra_id, null::uuid as contrato_id from clientes where id = $1`,
  fornecedor: `select company_id, null::uuid as obra_id, null::uuid as contrato_id from fornecedores where id = $1`,
  obra: `select company_id, id as obra_id, null::uuid as contrato_id from obras where id = $1`,
  contrato_obra: `select company_id, obra_id, id as contrato_id from contratos_obra where id = $1`,
  aditivo: `
    select a.company_id, c.obra_id, a.contrato_id
    from contratos_obra_aditivos a
    left join contratos_obra c on c.id = a.contrato_id
    where a.id = $1
  `,
  orcamento: `select company_id, obra_id, contrato_obra_id as contrato_id from orcamentos_obra where id = $1`,
  solicitacao_compra: `select company_id, obra_id, null::uuid as contrato_id from solicitacoes_compra where id = $1`,
  cotacao: `
    select c.company_id, sc.obra_id, null::uuid as contrato_id
    from cotacoes c
    left join solicitacoes_compra sc on sc.id = c.solicitacao_compra_id
    where c.id = $1
  `,
  pedido_compra: `select company_id, obra_id, null::uuid as contrato_id from pedidos_compra where id = $1`,
  nota_fiscal_entrada: `select company_id, obra_id, null::uuid as contrato_id from notas_fiscais_entrada where id = $1`,
  conta_pagar: `select company_id, obra_id, null::uuid as contrato_id from contas_pagar where id = $1`,
  programacao_pagamento: `select company_id, obra_id, null::uuid as contrato_id from programacoes_pagamento where id = $1`,
  baixa_manual: `
    select b.company_id, coalesce(cp.obra_id, pp.obra_id) as obra_id, null::uuid as contrato_id
    from contas_pagar_baixas b
    left join contas_pagar cp on cp.id = b.conta_pagar_id
    left join programacoes_pagamento pp on pp.id = b.programacao_id
    where b.id = $1
  `,
  medicao: `select company_id, obra_id, contrato_obra_id as contrato_id from medicoes_obra where id = $1`,
  pedido_faturamento: `select company_id, obra_id, contrato_obra_id as contrato_id from pedidos_faturamento where id = $1`,
  risco_pendencia: `select company_id, obra_id, contrato_obra_id as contrato_id from riscos_pendencias where id = $1`,
  tarefa: `select company_id, obra_id, null::uuid as contrato_id from central_tarefas_manuais where id = $1`,
  auditoria: `select company_id, null::uuid as obra_id, null::uuid as contrato_id from auditoria_eventos where id = $1`
};
const reservedRoutes = new Set([
  'upload',
  'download',
  'sharepoint',
  'graph',
  'power-automate',
  'pagar',
  'baixar',
  'gerar-cnab',
  'integracao-bancaria',
  'emitir-nfse',
  'integrar-prefeitura',
  'gerar-boleto'
]);

const entityAliases: Record<string, EntidadeTipo> = {
  contrato: 'contrato_obra',
  contrato_de_obra: 'contrato_obra',
  contrato_obra_aditivo: 'aditivo',
  aditivo_contratual: 'aditivo',
  orcamento_obra: 'orcamento',
  solicitacao: 'solicitacao_compra',
  pedido: 'pedido_compra',
  nota: 'nota_fiscal_entrada',
  nota_entrada: 'nota_fiscal_entrada',
  nota_fiscal: 'nota_fiscal_entrada',
  programacao: 'programacao_pagamento',
  programacao_pagamento_item: 'programacao_pagamento',
  conta: 'conta_pagar',
  pendencia: 'risco_pendencia',
  risco: 'risco_pendencia',
  central_tarefa: 'tarefa',
  tarefa_manual: 'tarefa',
  auditoria_evento: 'auditoria'
};

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const nestedPayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : payload;

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload de documento.', unknown);
  }
};

const normalizeTextValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = normalizeTextValue(payload[fieldName]);
  if (!value) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
  if (value.length > 500) {
    throw new HttpError(400, 'validation_error', `Campo ${fieldName} excede 500 caracteres.`);
  }
  return value;
};

const optionalLongText = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = normalizeTextValue(payload[fieldName]);
  if (!value) {
    return null;
  }
  if (value.length > 2000) {
    throw new HttpError(400, 'validation_error', `Campo ${fieldName} excede 2000 caracteres.`);
  }
  return value;
};

const getUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId ?? payload.criado_por;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const optionalUuidFromPayload = (payload: Record<string, unknown>, fieldName: string): string | null => {
  if (!hasOwn(payload, fieldName) || payload[fieldName] === null || payload[fieldName] === undefined || String(payload[fieldName]).trim() === '') {
    return null;
  }
  return assertUuid(payload[fieldName], fieldName);
};

const normalizeEntidadeTipo = (value: unknown): EntidadeTipo => {
  const normalized = normalizeTextValue(value)?.toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) {
    throw new HttpError(400, 'validation_error', 'Campo obrigatorio ausente: entidade_tipo.');
  }
  const aliased = entityAliases[normalized] || normalized;
  if (!entidadeTipoValues.includes(aliased as EntidadeTipo)) {
    throw new HttpError(400, 'validation_error', 'Entidade documental nao permitida.', entidadeTipoValues);
  }
  return aliased as EntidadeTipo;
};

const normalizeTipoDocumento = (value: unknown): TipoDocumento => {
  const normalized = normalizeTextValue(value)?.toUpperCase().replace(/[\s-]+/g, '_');
  if (!normalized || !tipoDocumentoValues.includes(normalized as TipoDocumento)) {
    throw new HttpError(400, 'validation_error', 'Tipo de documento invalido.', tipoDocumentoValues);
  }
  return normalized as TipoDocumento;
};

const normalizeStatus = (value: unknown, fallback: DocumentoStatus): DocumentoStatus => {
  const normalized = normalizeTextValue(value)?.toUpperCase().replace(/[\s-]+/g, '_');
  if (!normalized) {
    return fallback;
  }
  if (!documentoStatusValues.includes(normalized as DocumentoStatus)) {
    throw new HttpError(400, 'validation_error', 'Status documental invalido.', documentoStatusValues);
  }
  return normalized as DocumentoStatus;
};

const normalizeExtension = (payload: Record<string, unknown>, nomeArquivo: string): string => {
  const explicit = normalizeTextValue(payload.extensao)?.replace(/^\./, '').toLowerCase();
  const derived = nomeArquivo.includes('.') ? nomeArquivo.split('.').pop()?.toLowerCase() : undefined;
  const extension = explicit || derived;
  if (!extension || !/^[a-z0-9]{1,16}$/i.test(extension)) {
    throw new HttpError(400, 'validation_error', 'Extensao documental invalida ou ausente.');
  }
  return extension;
};

const normalizeTamanhoBytes = (value: unknown): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric) || numeric < 0) {
    throw new HttpError(400, 'validation_error', 'tamanho_bytes deve ser inteiro maior ou igual a zero.');
  }
  return numeric;
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const addParam = (params: unknown[], value: unknown): string => {
  params.push(value);
  return `$${params.length}`;
};

const ensureEntityContext = async (client: PoolClient, entidadeTipo: EntidadeTipo, entidadeId: string): Promise<EntityContext> => {
  const result = await client.query<EntityContext>(entityContextQueries[entidadeTipo], [entidadeId]);
  const context = result.rows[0];
  if (!context) {
    throw new HttpError(404, 'not_found', `Entidade ${entidadeTipo} nao encontrada para vinculo documental.`);
  }
  return context;
};

const getDefaultCompanyId = async (client: PoolClient): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `select id from empresas where cnpj = '00.000.000/0001-33' limit 1`
  );
  const companyId = result.rows[0]?.id;
  if (!companyId) {
    throw new HttpError(404, 'not_found', 'Empresa local DEV nao encontrada.');
  }
  return companyId;
};

const resolveContext = async (
  client: PoolClient,
  payload: Record<string, unknown>,
  entidadeTipo: EntidadeTipo,
  entidadeId: string
): Promise<{ companyId: string; obraId: string | null; contratoId: string | null }> => {
  const context = await ensureEntityContext(client, entidadeTipo, entidadeId);
  const explicitCompanyId = optionalUuidFromPayload(payload, 'company_id');
  const companyId = explicitCompanyId || context.company_id || await getDefaultCompanyId(client);
  if (explicitCompanyId && context.company_id && explicitCompanyId !== context.company_id) {
    throw new HttpError(400, 'validation_error', 'company_id nao pertence a entidade vinculada.');
  }

  const explicitObraId = optionalUuidFromPayload(payload, 'obra_id');
  const explicitContratoId = optionalUuidFromPayload(payload, 'contrato_id') || optionalUuidFromPayload(payload, 'contrato_obra_id');
  if (explicitObraId && context.obra_id && explicitObraId !== context.obra_id) {
    throw new HttpError(400, 'validation_error', 'obra_id diverge da entidade vinculada.');
  }
  if (explicitContratoId && context.contrato_id && explicitContratoId !== context.contrato_id) {
    throw new HttpError(400, 'validation_error', 'contrato_id diverge da entidade vinculada.');
  }

  return {
    companyId,
    obraId: context.obra_id || explicitObraId,
    contratoId: context.contrato_id || explicitContratoId
  };
};

const baseDocumentSelect = `
  select
    d.*,
    e.nome_fantasia as empresa_nome,
    o.codigo as obra_codigo,
    o.nome as obra_nome,
    co.numero as contrato_numero,
    criador.nome as criado_por_nome,
    atualizador.nome as atualizado_por_nome,
    inativador.nome as inativado_por_nome,
    substituto.nome_arquivo as substituido_por_nome_arquivo,
    anterior.nome_arquivo as substitui_nome_arquivo
  from documentos_anexos d
  left join empresas e on e.id = d.company_id
  left join obras o on o.id = d.obra_id
  left join contratos_obra co on co.id = d.contrato_id
  left join usuarios criador on criador.id = d.criado_por
  left join usuarios atualizador on atualizador.id = d.atualizado_por
  left join usuarios inativador on inativador.id = d.inativado_por
  left join documentos_anexos substituto on substituto.id = d.substituido_por_documento_id
  left join documentos_anexos anterior on anterior.id = d.substitui_documento_id
`;

const safeLimit = (url: URL, fallback = 300): number => {
  const raw = Number(url.searchParams.get('limit') || fallback);
  return Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 500) : fallback;
};

const addListFilters = (url: URL, params: unknown[], conditions: string[]): void => {
  const companyId = url.searchParams.get('company_id');
  if (companyId) {
    conditions.push(`d.company_id = ${addParam(params, assertUuid(companyId, 'company_id'))}`);
  }

  const entidadeTipo = url.searchParams.get('entidade_tipo') || url.searchParams.get('entidade');
  if (entidadeTipo) {
    conditions.push(`d.entidade_tipo = ${addParam(params, normalizeEntidadeTipo(entidadeTipo))}`);
  }

  const entidadeId = url.searchParams.get('entidade_id');
  if (entidadeId) {
    conditions.push(`d.entidade_id = ${addParam(params, assertUuid(entidadeId, 'entidade_id'))}`);
  }

  const status = url.searchParams.get('status');
  if (status) {
    conditions.push(`d.status = ${addParam(params, normalizeStatus(status, 'ATIVO'))}`);
  }

  const tipoDocumento = url.searchParams.get('tipo_documento') || url.searchParams.get('tipo');
  if (tipoDocumento) {
    conditions.push(`d.tipo_documento = ${addParam(params, normalizeTipoDocumento(tipoDocumento))}`);
  }

  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    conditions.push(`d.obra_id = ${addParam(params, assertUuid(obraId, 'obra_id'))}`);
  }

  const contratoId = url.searchParams.get('contrato_id') || url.searchParams.get('contrato_obra_id');
  if (contratoId) {
    conditions.push(`d.contrato_id = ${addParam(params, assertUuid(contratoId, 'contrato_id'))}`);
  }

  const texto = url.searchParams.get('texto');
  if (texto && texto.trim()) {
    const search = addParam(params, `%${texto.trim()}%`);
    conditions.push(`(
      d.nome_arquivo ilike ${search}
      or d.descricao ilike ${search}
      or d.observacao ilike ${search}
      or d.referencia_local_mock ilike ${search}
      or d.entidade_tipo ilike ${search}
    )`);
  }
};

const listDocumentos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  addListFilters(url, params, conditions);
  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    ${baseDocumentSelect}
    ${where}
    order by d.criado_em desc
    limit ${safeLimit(url)}
    `,
    params
  );
  return result.rows;
};

const listDocumentosPorEntidade = async (entidadeTipo: string, entidadeId: string, url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [
    normalizeEntidadeTipo(entidadeTipo),
    assertUuid(entidadeId, 'entidade_id')
  ];
  const conditions = [`d.entidade_tipo = $1`, `d.entidade_id = $2`];
  addListFilters(url, params, conditions);
  const result = await getPool().query(
    `
    ${baseDocumentSelect}
    where ${conditions.join(' and ')}
    order by d.criado_em desc
    limit ${safeLimit(url)}
    `,
    params
  );
  return result.rows;
};

const fetchDocumento = async (id: string, client?: PoolClient, forUpdate = false): Promise<DocumentoRow | undefined> => {
  const executor = client || getPool();
  const result = await executor.query<DocumentoRow>(
    `
    ${baseDocumentSelect}
    where d.id = $1
    ${forUpdate ? 'for update of d' : ''}
    `,
    [assertUuid(id, 'id')]
  );
  return result.rows[0];
};

const buildDocumentInput = async (
  client: PoolClient,
  rawPayload: Record<string, unknown>,
  fallback?: Pick<DocumentoRow, 'entidade_tipo' | 'entidade_id' | 'company_id' | 'obra_id' | 'contrato_id'>
) => {
  const payload = nestedPayload(rawPayload);
  const entidadeTipo = hasOwn(payload, 'entidade_tipo') ? normalizeEntidadeTipo(payload.entidade_tipo) : fallback?.entidade_tipo;
  const entidadeId = hasOwn(payload, 'entidade_id') ? assertUuid(payload.entidade_id, 'entidade_id') : fallback?.entidade_id;
  if (!entidadeTipo || !entidadeId) {
    throw new HttpError(400, 'validation_error', 'entidade_tipo e entidade_id sao obrigatorios.');
  }

  const nomeArquivo = requiredText(payload, 'nome_arquivo');
  const tipoDocumento = normalizeTipoDocumento(payload.tipo_documento);
  const context = await resolveContext(client, { ...payload, company_id: payload.company_id || fallback?.company_id }, entidadeTipo, entidadeId);
  if (fallback?.company_id && context.companyId !== fallback.company_id) {
    throw new HttpError(400, 'validation_error', 'Documento substituto deve pertencer a mesma empresa do documento original.');
  }
  return {
    payload,
    entidadeTipo,
    entidadeId,
    companyId: context.companyId,
    obraId: context.obraId || fallback?.obra_id || null,
    contratoId: context.contratoId || fallback?.contrato_id || null,
    tipoDocumento,
    nomeArquivo,
    extensao: normalizeExtension(payload, nomeArquivo),
    mimeType: normalizeTextValue(payload.mime_type) || 'application/octet-stream',
    tamanhoBytes: normalizeTamanhoBytes(payload.tamanho_bytes),
    descricao: optionalLongText(payload, 'descricao'),
    observacao: optionalLongText(payload, 'observacao') || optionalLongText(payload, 'observacoes'),
    origem: normalizeTextValue(payload.origem) || 'ERP_LOCAL',
    status: normalizeStatus(payload.status, 'ATIVO'),
    referenciaLocalMock: optionalLongText(payload, 'referencia_local_mock'),
    sharepointSiteIdMock: optionalLongText(payload, 'sharepoint_site_id_mock'),
    sharepointDriveIdMock: optionalLongText(payload, 'sharepoint_drive_id_mock'),
    sharepointItemIdMock: optionalLongText(payload, 'sharepoint_item_id_mock'),
    urlMock: optionalLongText(payload, 'url_mock'),
    usuarioId: getUsuarioId(payload)
  };
};

const insertDocumento = async (
  client: PoolClient,
  rawPayload: Record<string, unknown>,
  substituiDocumentoId: string | null = null,
  fallback?: Pick<DocumentoRow, 'entidade_tipo' | 'entidade_id' | 'company_id' | 'obra_id' | 'contrato_id'>
): Promise<string> => {
  const doc = await buildDocumentInput(client, rawPayload, fallback);
  const inserted = await client.query<{ id: string }>(
    `
    insert into documentos_anexos (
      company_id, entidade_tipo, entidade_id, obra_id, contrato_id, tipo_documento,
      nome_arquivo, extensao, mime_type, tamanho_bytes, descricao, observacao, origem, status,
      referencia_local_mock, sharepoint_site_id_mock, sharepoint_drive_id_mock,
      sharepoint_item_id_mock, url_mock, substitui_documento_id, criado_por, atualizado_por
    )
    values (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17,
      $18, $19, $20, $21, $21
    )
    returning id
    `,
    [
      doc.companyId,
      doc.entidadeTipo,
      doc.entidadeId,
      doc.obraId,
      doc.contratoId,
      doc.tipoDocumento,
      doc.nomeArquivo,
      doc.extensao,
      doc.mimeType,
      doc.tamanhoBytes,
      doc.descricao,
      doc.observacao,
      doc.origem,
      doc.status,
      doc.referenciaLocalMock,
      doc.sharepointSiteIdMock,
      doc.sharepointDriveIdMock,
      doc.sharepointItemIdMock,
      doc.urlMock,
      substituiDocumentoId,
      doc.usuarioId
    ]
  );

  await registrarAuditoria(client, doc.companyId, 'documento_anexo', inserted.rows[0].id, substituiDocumentoId ? 'criar_substituicao' : 'criar', {
    modulo: 'documentos',
    entidade_tipo: doc.entidadeTipo,
    entidade_id: doc.entidadeId,
    tipo_documento: doc.tipoDocumento,
    nome_arquivo: doc.nomeArquivo,
    status: doc.status,
    substitui_documento_id: substituiDocumentoId,
    sharepoint_real: false,
    upload_real: false
  }, doc.usuarioId);

  return inserted.rows[0].id;
};

const createDocumento = async (rawPayload: Record<string, unknown>): Promise<DocumentoRow | undefined> => {
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'company_id', 'entidade_tipo', 'entidade_id', 'obra_id', 'contrato_id', 'contrato_obra_id',
    'tipo_documento', 'nome_arquivo', 'extensao', 'mime_type', 'tamanho_bytes', 'descricao',
    'observacao', 'observacoes', 'origem', 'status', 'referencia_local_mock',
    'sharepoint_site_id_mock', 'sharepoint_drive_id_mock', 'sharepoint_item_id_mock', 'url_mock',
    'usuario_id', 'usuarioId', 'criado_por'
  ]);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const id = await insertDocumento(client, payload);
    await client.query('commit');
    return fetchDocumento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateDocumento = async (id: string, rawPayload: Record<string, unknown>): Promise<DocumentoRow | undefined> => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'tipo_documento', 'nome_arquivo', 'extensao', 'mime_type', 'tamanho_bytes', 'descricao',
    'observacao', 'observacoes', 'origem', 'status', 'referencia_local_mock',
    'sharepoint_site_id_mock', 'sharepoint_drive_id_mock', 'sharepoint_item_id_mock', 'url_mock',
    'usuario_id', 'usuarioId'
  ]);

  const client = await getPool().connect();
  try {
    await client.query('begin');
    const current = await fetchDocumento(id, client, true);
    if (!current) {
      throw new HttpError(404, 'not_found', 'Documento nao encontrado.');
    }
    if (!editableStatusValues.includes(current.status)) {
      throw new HttpError(409, 'status_conflict', `Documento em status ${current.status} nao permite edicao.`);
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    const changedFields: string[] = [];
    const setField = (column: string, value: unknown, fieldName: string): void => {
      sets.push(`${column} = ${addParam(params, value)}`);
      changedFields.push(fieldName);
    };

    if (hasOwn(payload, 'tipo_documento')) setField('tipo_documento', normalizeTipoDocumento(payload.tipo_documento), 'tipo_documento');
    if (hasOwn(payload, 'nome_arquivo')) {
      const nomeArquivo = requiredText(payload, 'nome_arquivo');
      setField('nome_arquivo', nomeArquivo, 'nome_arquivo');
      if (!hasOwn(payload, 'extensao')) {
        setField('extensao', normalizeExtension(payload, nomeArquivo), 'extensao');
      }
    }
    if (hasOwn(payload, 'extensao')) setField('extensao', normalizeExtension(payload, String(payload.nome_arquivo || current.nome_arquivo)), 'extensao');
    if (hasOwn(payload, 'mime_type')) setField('mime_type', normalizeTextValue(payload.mime_type), 'mime_type');
    if (hasOwn(payload, 'tamanho_bytes')) setField('tamanho_bytes', normalizeTamanhoBytes(payload.tamanho_bytes), 'tamanho_bytes');
    if (hasOwn(payload, 'descricao')) setField('descricao', optionalLongText(payload, 'descricao'), 'descricao');
    if (hasOwn(payload, 'observacao') || hasOwn(payload, 'observacoes')) setField('observacao', optionalLongText(payload, 'observacao') || optionalLongText(payload, 'observacoes'), 'observacao');
    if (hasOwn(payload, 'origem')) setField('origem', normalizeTextValue(payload.origem) || 'ERP_LOCAL', 'origem');
    if (hasOwn(payload, 'status')) {
      const nextStatus = normalizeStatus(payload.status, current.status);
      if (!editableStatusValues.includes(nextStatus)) {
        throw new HttpError(400, 'validation_error', 'Use endpoints dedicados para INATIVO ou SUBSTITUIDO.');
      }
      setField('status', nextStatus, 'status');
    }
    if (hasOwn(payload, 'referencia_local_mock')) setField('referencia_local_mock', optionalLongText(payload, 'referencia_local_mock'), 'referencia_local_mock');
    if (hasOwn(payload, 'sharepoint_site_id_mock')) setField('sharepoint_site_id_mock', optionalLongText(payload, 'sharepoint_site_id_mock'), 'sharepoint_site_id_mock');
    if (hasOwn(payload, 'sharepoint_drive_id_mock')) setField('sharepoint_drive_id_mock', optionalLongText(payload, 'sharepoint_drive_id_mock'), 'sharepoint_drive_id_mock');
    if (hasOwn(payload, 'sharepoint_item_id_mock')) setField('sharepoint_item_id_mock', optionalLongText(payload, 'sharepoint_item_id_mock'), 'sharepoint_item_id_mock');
    if (hasOwn(payload, 'url_mock')) setField('url_mock', optionalLongText(payload, 'url_mock'), 'url_mock');

    const usuarioId = getUsuarioId(payload);
    setField('atualizado_por', usuarioId, 'atualizado_por');
    sets.push('atualizado_em = now()');
    params.push(id);

    await client.query(`update documentos_anexos set ${sets.join(', ')} where id = $${params.length}`, params);
    await registrarAuditoria(client, current.company_id, 'documento_anexo', id, 'editar', {
      modulo: 'documentos',
      campos: changedFields,
      status_anterior: current.status,
      sharepoint_real: false,
      upload_real: false
    }, usuarioId);
    await client.query('commit');
    return fetchDocumento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const inativarDocumento = async (id: string, rawPayload: Record<string, unknown>): Promise<DocumentoRow | undefined> => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, ['usuario_id', 'usuarioId', 'motivo', 'motivo_inativacao', 'observacoes', 'observacao']);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'motivo_inativacao') || optionalText(payload, 'observacoes') || optionalText(payload, 'observacao');
  if (!motivo) {
    throw new HttpError(400, 'validation_error', 'Motivo obrigatorio para inativar documento.');
  }
  const usuarioId = getUsuarioId(payload);
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const current = await fetchDocumento(id, client, true);
    if (!current) {
      throw new HttpError(404, 'not_found', 'Documento nao encontrado.');
    }
    if (current.status === 'SUBSTITUIDO') {
      throw new HttpError(409, 'status_conflict', 'Documento substituido nao permite inativacao direta.');
    }
    await client.query(
      `
      update documentos_anexos
      set status = 'INATIVO',
          inativado_por = $1,
          inativado_em = now(),
          motivo_inativacao = $2,
          atualizado_por = $1,
          atualizado_em = now()
      where id = $3
      `,
      [usuarioId, motivo, id]
    );
    await registrarAuditoria(client, current.company_id, 'documento_anexo', id, 'inativar', {
      modulo: 'documentos',
      status_anterior: current.status,
      status_novo: 'INATIVO',
      motivo,
      sharepoint_real: false,
      upload_real: false
    }, usuarioId);
    await client.query('commit');
    return fetchDocumento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const substituirDocumento = async (id: string, rawPayload: Record<string, unknown>): Promise<Record<string, unknown>> => {
  assertUuid(id, 'id');
  const payload = nestedPayload(rawPayload);
  assertAllowedFields(payload, [
    'tipo_documento', 'nome_arquivo', 'extensao', 'mime_type', 'tamanho_bytes', 'descricao',
    'observacao', 'observacoes', 'origem', 'status', 'referencia_local_mock',
    'sharepoint_site_id_mock', 'sharepoint_drive_id_mock', 'sharepoint_item_id_mock', 'url_mock',
    'usuario_id', 'usuarioId', 'motivo', 'justificativa'
  ]);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'justificativa') || optionalText(payload, 'observacoes') || 'Substituicao documental local.';
  const client = await getPool().connect();

  try {
    await client.query('begin');
    const current = await fetchDocumento(id, client, true);
    if (!current) {
      throw new HttpError(404, 'not_found', 'Documento nao encontrado.');
    }
    if (!editableStatusValues.includes(current.status)) {
      throw new HttpError(409, 'status_conflict', `Documento em status ${current.status} nao permite substituicao.`);
    }
    const usuarioId = getUsuarioId(payload);
    const newId = await insertDocumento(client, {
      ...payload,
      entidade_tipo: current.entidade_tipo,
      entidade_id: current.entidade_id,
      company_id: current.company_id,
      tipo_documento: payload.tipo_documento || current.tipo_documento
    }, id, current);
    await client.query(
      `
      update documentos_anexos
      set status = 'SUBSTITUIDO',
          substituido_por_documento_id = $1,
          atualizado_por = $2,
          atualizado_em = now(),
          motivo_inativacao = $3
      where id = $4
      `,
      [newId, usuarioId, motivo, id]
    );
    await registrarAuditoria(client, current.company_id, 'documento_anexo', id, 'substituir', {
      modulo: 'documentos',
      status_anterior: current.status,
      status_novo: 'SUBSTITUIDO',
      documento_substituto_id: newId,
      motivo,
      sharepoint_real: false,
      upload_real: false
    }, usuarioId);
    await client.query('commit');
    return {
      substituido: await fetchDocumento(id),
      substituto: await fetchDocumento(newId)
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  const pgError = toPgError(error);
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para documento.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor fora do contrato permitido para documento.', pgError.detail);
    return;
  }

  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleDocumentos = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/documentos';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listDocumentos(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createDocumento(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1 && parts[0] === 'tipos') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: tipoDocumentoValues });
      return;
    }

    if (parts.length === 1 && parts[0] === 'status') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: documentoStatusValues });
      return;
    }

    if (parts.length === 3 && parts[0] === 'entidade') {
      if (method !== 'GET') {
        methodNotAllowed(res, ['GET']);
        return;
      }
      sendJson(res, 200, { data: await listDocumentosPorEntidade(parts[1], parts[2], url) });
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (reservedRoutes.has(id.toLowerCase())) {
        sendError(res, 404, 'not_found', 'Rota de documentos nao encontrada.');
        return;
      }
      assertUuid(id, 'id');
      if (method === 'GET') {
        const documento = await fetchDocumento(id);
        if (!documento) {
          sendError(res, 404, 'not_found', 'Documento nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: documento });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updateDocumento(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && parts[1] === 'inativar') {
      const [id] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await inativarDocumento(id, await readJsonBody(req)) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'substituir') {
      const [id] = parts;
      if (method !== 'PATCH') {
        methodNotAllowed(res, ['PATCH']);
        return;
      }
      sendJson(res, 200, { data: await substituirDocumento(id, await readJsonBody(req)) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de documentos nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
