import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import { assertUuid, optionalText, registrarAuditoria } from '../aprovacoes/aprovacoes.service.js';

type OrcamentoStatus = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'BLOQUEADO' | 'CANCELADO';
type PlanejamentoTipoItem = 'MATERIAL' | 'MAO_DE_OBRA' | 'EQUIPAMENTO' | 'SERVICO' | 'OUTROS';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface OrcamentoForUpdate extends QueryResultRow {
  id: string;
  company_id: string;
  obra_id: string;
  contrato_obra_id: string | null;
  centro_custo_id: string | null;
  status: OrcamentoStatus;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const competenciaPattern = /^\d{4}-\d{2}$/;
const itemTypes: PlanejamentoTipoItem[] = ['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO', 'OUTROS'];

const hasOwn = (payload: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(payload, key);

const assertAllowedFields = (payload: Record<string, unknown>, allowedFields: string[]): void => {
  const unknown = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (unknown.length > 0) {
    throw new HttpError(400, 'validation_error', 'Campos nao permitidos no payload.', unknown);
  }
};

const requiredText = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = optionalText(payload, fieldName);
  if (!value) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
  return value;
};

const optionalUuid = (payload: Record<string, unknown>, fieldName: string): string | null => {
  if (!hasOwn(payload, fieldName) || payload[fieldName] === null || payload[fieldName] === undefined || String(payload[fieldName]).trim() === '') {
    return null;
  }
  return assertUuid(payload[fieldName], fieldName);
};

const optionalUsuarioId = (payload: Record<string, unknown>): string | null => {
  const usuario = payload.usuario_id ?? payload.usuarioId;
  if (usuario === null || usuario === undefined || String(usuario).trim() === '') {
    return null;
  }
  return assertUuid(usuario, 'usuario_id');
};

const requiredUsuarioId = (payload: Record<string, unknown>): string => {
  const usuarioId = optionalUsuarioId(payload);
  if (!usuarioId) {
    throw new HttpError(400, 'validation_error', 'Campo obrigatorio ausente: usuario_id.');
  }
  return usuarioId;
};

const optionalDate = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = optionalText(payload, fieldName);
  if (!value) {
    return null;
  }
  if (!datePattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Data invalida em ${fieldName}. Use YYYY-MM-DD.`);
  }
  return value;
};

const optionalCompetencia = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = optionalText(payload, fieldName);
  if (!value) {
    return null;
  }
  if (!competenciaPattern.test(value)) {
    throw new HttpError(400, 'validation_error', `Competencia invalida em ${fieldName}. Use YYYY-MM.`);
  }
  return value;
};

const normalizeMoney = (value: unknown, fieldName: string, allowZero = true): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0 || (!allowZero && normalized <= 0)) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser ${allowZero ? 'maior ou igual a zero' : 'maior que zero'}.`);
  }
  return Number(normalized.toFixed(2));
};

const normalizeQuantity = (value: unknown, fieldName: string): number => {
  const normalized = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new HttpError(400, 'validation_error', `${fieldName} deve ser maior que zero.`);
  }
  return Number(normalized.toFixed(4));
};

const normalizePercent = (value: unknown, fieldName: string): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  return normalizeMoney(value, fieldName);
};

const normalizeItemType = (value: unknown): PlanejamentoTipoItem => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!itemTypes.includes(normalized as PlanejamentoTipoItem)) {
    throw new HttpError(400, 'validation_error', 'Tipo de item orcamentario invalido.');
  }
  return normalized as PlanejamentoTipoItem;
};

const fetchOrcamentoForUpdate = async (client: PoolClient, id: string): Promise<OrcamentoForUpdate | undefined> => {
  const result = await client.query<OrcamentoForUpdate>(
    `
    select id, company_id, obra_id, contrato_obra_id, centro_custo_id, status
    from orcamentos_obra
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const assertEditable = (orcamento: OrcamentoForUpdate): void => {
  if (orcamento.status !== 'RASCUNHO') {
    throw new HttpError(409, 'status_conflict', `Orcamento em status ${orcamento.status} nao permite edicao estrutural.`);
  }
};

const assertRefs = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  contratoObraId: string | null,
  centroCustoId: string | null
): Promise<string | null> => {
  const result = await client.query<{
    obra_status: string;
    cliente_id: string | null;
    obra_centro_custo_id: string | null;
    contrato_status: string | null;
    contrato_obra_id: string | null;
    centro_status: string | null;
  }>(
    `
    select
      o.status as obra_status,
      o.cliente_id,
      o.centro_custo_id as obra_centro_custo_id,
      co.status as contrato_status,
      co.obra_id as contrato_obra_id,
      cc.status as centro_status
    from obras o
    left join contratos_obra co on co.id = $3 and co.company_id = $1
    left join centros_custo cc on cc.id = $4 and cc.company_id = $1
    where o.id = $2 and o.company_id = $1
    `,
    [companyId, obraId, contratoObraId, centroCustoId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new HttpError(404, 'not_found', 'Obra nao encontrada para a empresa informada.');
  }
  if (row.obra_status !== 'ativo') {
    throw new HttpError(409, 'obra_inativa', 'Obra inativa nao permite orcamento base.');
  }
  if (contratoObraId) {
    if (!row.contrato_status) {
      throw new HttpError(404, 'not_found', 'Contrato de obra nao encontrado para vinculo com orcamento.');
    }
    if (row.contrato_status !== 'ATIVO') {
      throw new HttpError(409, 'contrato_inativo', 'Somente contrato ativo pode ser vinculado ao orcamento.');
    }
    if (row.contrato_obra_id !== obraId) {
      throw new HttpError(409, 'contrato_obra_divergente', 'Contrato informado nao pertence a obra do orcamento.');
    }
  }
  if (centroCustoId && row.centro_status !== 'ativo') {
    throw new HttpError(409, 'centro_custo_inativo', 'Centro de custo inativo nao permite orcamento base.');
  }
  return row.cliente_id;
};

const recalcOrcamentoTotais = async (client: PoolClient, orcamentoId: string): Promise<void> => {
  await client.query(
    `
    update orcamentos_obra o
    set
      valor_previsto_total = coalesce(t.total, 0),
      valor_material = coalesce(t.material, 0),
      valor_mao_obra = coalesce(t.mao_obra, 0),
      valor_equipamento = coalesce(t.equipamento, 0),
      valor_servico = coalesce(t.servico, 0),
      valor_outros = coalesce(t.outros, 0),
      updated_at = now()
    from (
      select
        $1::uuid as orcamento_id,
        sum(valor_total_previsto) filter (where status = 'ATIVO')::numeric(14,2) as total,
        sum(valor_total_previsto) filter (where status = 'ATIVO' and tipo = 'MATERIAL')::numeric(14,2) as material,
        sum(valor_total_previsto) filter (where status = 'ATIVO' and tipo = 'MAO_DE_OBRA')::numeric(14,2) as mao_obra,
        sum(valor_total_previsto) filter (where status = 'ATIVO' and tipo = 'EQUIPAMENTO')::numeric(14,2) as equipamento,
        sum(valor_total_previsto) filter (where status = 'ATIVO' and tipo = 'SERVICO')::numeric(14,2) as servico,
        sum(valor_total_previsto) filter (where status = 'ATIVO' and tipo = 'OUTROS')::numeric(14,2) as outros
      from orcamentos_obra_itens
      where orcamento_id = $1
    ) t
    where o.id = t.orcamento_id
    `,
    [orcamentoId]
  );
};

const fetchOrcamento = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    select
      o.id,
      o.company_id,
      o.obra_id,
      ob.codigo as obra_codigo,
      ob.nome as obra_nome,
      o.cliente_id,
      c.nome as cliente_nome,
      o.contrato_obra_id,
      co.numero as contrato_obra_numero,
      co.valor_total_contratado as contrato_obra_valor_total,
      o.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      o.codigo,
      o.versao,
      o.descricao,
      o.competencia_base,
      o.valor_previsto_total,
      o.valor_material,
      o.valor_mao_obra,
      o.valor_equipamento,
      o.valor_servico,
      o.valor_outros,
      o.margem_prevista_percentual,
      o.observacoes,
      o.status,
      o.enviado_revisao_por,
      o.enviado_revisao_em,
      o.aprovado_por,
      aprovador.nome as aprovado_por_nome,
      o.aprovado_em,
      o.aprovado_observacoes,
      o.bloqueio_motivo,
      o.cancelamento_motivo,
      o.created_at,
      o.updated_at,
      coalesce(pacotes.pacotes, '[]'::json) as pacotes,
      coalesce(itens.itens, '[]'::json) as itens,
      coalesce(cronograma.cronograma, '[]'::json) as cronograma
    from orcamentos_obra o
    join obras ob on ob.id = o.obra_id
    left join clientes c on c.id = o.cliente_id
    left join contratos_obra co on co.id = o.contrato_obra_id
    left join centros_custo cc on cc.id = o.centro_custo_id
    left join usuarios aprovador on aprovador.id = o.aprovado_por
    left join lateral (
      select json_agg(json_build_object(
        'id', p.id,
        'orcamento_id', p.orcamento_id,
        'codigo', p.codigo,
        'nome', p.nome,
        'descricao', p.descricao,
        'etapa', p.etapa,
        'centro_custo_id', p.centro_custo_id,
        'centro_custo_codigo', pcc.codigo,
        'ordem', p.ordem,
        'status', p.status,
        'valor_total_previsto', coalesce(pi.valor_total_previsto, 0),
        'created_at', p.created_at,
        'updated_at', p.updated_at
      ) order by p.ordem, p.created_at) as pacotes
      from orcamentos_obra_pacotes p
      left join centros_custo pcc on pcc.id = p.centro_custo_id
      left join lateral (
        select sum(valor_total_previsto)::numeric(14,2) as valor_total_previsto
        from orcamentos_obra_itens i
        where i.pacote_id = p.id and i.status = 'ATIVO'
      ) pi on true
      where p.orcamento_id = o.id
    ) pacotes on true
    left join lateral (
      select json_agg(json_build_object(
        'id', i.id,
        'orcamento_id', i.orcamento_id,
        'pacote_id', i.pacote_id,
        'pacote_codigo', p.codigo,
        'pacote_nome', p.nome,
        'centro_custo_id', i.centro_custo_id,
        'centro_custo_codigo', icc.codigo,
        'tipo', i.tipo,
        'codigo', i.codigo,
        'descricao', i.descricao,
        'unidade', i.unidade,
        'quantidade', i.quantidade,
        'valor_unitario_previsto', i.valor_unitario_previsto,
        'valor_total_previsto', i.valor_total_previsto,
        'insumo_descricao', i.insumo_descricao,
        'mao_obra_categoria', i.mao_obra_categoria,
        'equipamento_descricao', i.equipamento_descricao,
        'observacoes', i.observacoes,
        'status', i.status,
        'created_at', i.created_at,
        'updated_at', i.updated_at
      ) order by i.created_at) as itens
      from orcamentos_obra_itens i
      left join orcamentos_obra_pacotes p on p.id = i.pacote_id
      left join centros_custo icc on icc.id = i.centro_custo_id
      where i.orcamento_id = o.id
    ) itens on true
    left join lateral (
      select json_agg(json_build_object(
        'id', cr.id,
        'orcamento_id', cr.orcamento_id,
        'pacote_id', cr.pacote_id,
        'pacote_codigo', p.codigo,
        'pacote_nome', p.nome,
        'competencia', cr.competencia,
        'valor_previsto', cr.valor_previsto,
        'percentual_fisico_previsto', cr.percentual_fisico_previsto,
        'observacoes', cr.observacoes,
        'status', cr.status,
        'created_at', cr.created_at,
        'updated_at', cr.updated_at
      ) order by cr.competencia, cr.created_at) as cronograma
      from orcamentos_obra_cronograma cr
      left join orcamentos_obra_pacotes p on p.id = cr.pacote_id
      where cr.orcamento_id = o.id
    ) cronograma on true
    where o.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const listOrcamentos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`o.status = $${params.length}`);
  }
  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`o.obra_id = $${params.length}`);
  }
  const contratoId = url.searchParams.get('contrato_obra_id');
  if (contratoId) {
    params.push(assertUuid(contratoId, 'contrato_obra_id'));
    conditions.push(`o.contrato_obra_id = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      o.id,
      o.company_id,
      o.obra_id,
      ob.codigo as obra_codigo,
      ob.nome as obra_nome,
      o.cliente_id,
      c.nome as cliente_nome,
      o.contrato_obra_id,
      co.numero as contrato_obra_numero,
      co.valor_total_contratado as contrato_obra_valor_total,
      o.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      o.codigo,
      o.versao,
      o.descricao,
      o.competencia_base,
      o.valor_previsto_total,
      o.valor_material,
      o.valor_mao_obra,
      o.valor_equipamento,
      o.valor_servico,
      o.valor_outros,
      o.margem_prevista_percentual,
      o.status,
      o.created_at,
      o.updated_at
    from orcamentos_obra o
    join obras ob on ob.id = o.obra_id
    left join clientes c on c.id = o.cliente_id
    left join contratos_obra co on co.id = o.contrato_obra_id
    left join centros_custo cc on cc.id = o.centro_custo_id
    ${where}
    order by o.created_at desc
    `,
    params
  );
  return result.rows;
};

const createOrcamento = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'obra_id',
    'contrato_obra_id',
    'centro_custo_id',
    'codigo',
    'versao',
    'descricao',
    'competencia_base',
    'margem_prevista_percentual',
    'observacoes',
    'usuario_id'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const obraId = assertUuid(payload.obra_id, 'obra_id');
  const contratoObraId = optionalUuid(payload, 'contrato_obra_id');
  const centroCustoId = optionalUuid(payload, 'centro_custo_id');
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const clienteId = await assertRefs(client, companyId, obraId, contratoObraId, centroCustoId);
    const created = await client.query<{ id: string }>(
      `
      insert into orcamentos_obra (
        company_id,
        obra_id,
        cliente_id,
        contrato_obra_id,
        centro_custo_id,
        codigo,
        versao,
        descricao,
        competencia_base,
        margem_prevista_percentual,
        observacoes,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      returning id
      `,
      [
        companyId,
        obraId,
        clienteId,
        contratoObraId,
        centroCustoId,
        requiredText(payload, 'codigo'),
        optionalText(payload, 'versao') || 'V1',
        requiredText(payload, 'descricao'),
        optionalCompetencia(payload, 'competencia_base'),
        normalizePercent(payload.margem_prevista_percentual, 'margem_prevista_percentual'),
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, companyId, 'orcamento_obra', created.rows[0].id, 'criar', {
      codigo: requiredText(payload, 'codigo'),
      obra_id: obraId,
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(created.rows[0].id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateOrcamento = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['contrato_obra_id', 'centro_custo_id', 'codigo', 'versao', 'descricao', 'competencia_base', 'margem_prevista_percentual', 'observacoes', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, id);
    if (!orcamento) {
      throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    }
    assertEditable(orcamento);
    const nextContratoId = hasOwn(payload, 'contrato_obra_id') ? optionalUuid(payload, 'contrato_obra_id') : orcamento.contrato_obra_id;
    const nextCentroId = hasOwn(payload, 'centro_custo_id') ? optionalUuid(payload, 'centro_custo_id') : orcamento.centro_custo_id;
    const clienteId = await assertRefs(client, orcamento.company_id, orcamento.obra_id, nextContratoId, nextCentroId);
    const updates: Array<{ column: string; value: unknown }> = [{ column: 'cliente_id', value: clienteId }];
    if (hasOwn(payload, 'contrato_obra_id')) updates.push({ column: 'contrato_obra_id', value: nextContratoId });
    if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: nextCentroId });
    if (hasOwn(payload, 'codigo')) updates.push({ column: 'codigo', value: requiredText(payload, 'codigo') });
    if (hasOwn(payload, 'versao')) updates.push({ column: 'versao', value: optionalText(payload, 'versao') || 'V1' });
    if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
    if (hasOwn(payload, 'competencia_base')) updates.push({ column: 'competencia_base', value: optionalCompetencia(payload, 'competencia_base') });
    if (hasOwn(payload, 'margem_prevista_percentual')) updates.push({ column: 'margem_prevista_percentual', value: normalizePercent(payload.margem_prevista_percentual, 'margem_prevista_percentual') });
    if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update orcamentos_obra
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, id]
    );
    await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra', id, 'editar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const mudarStatusOrcamento = async (id: string, payload: Record<string, unknown>, action: 'enviar_revisao' | 'aprovar' | 'bloquear' | 'cancelar') => {
  assertUuid(id, 'id');
  const usuarioId = requiredUsuarioId(payload);
  const observacoes = optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa') || optionalText(payload, 'motivo');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, id);
    if (!orcamento) {
      throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    }
    if (action === 'enviar_revisao') {
      if (orcamento.status !== 'RASCUNHO') {
        throw new HttpError(409, 'status_conflict', `Orcamento em status ${orcamento.status} nao permite envio para revisao.`);
      }
      const counts = await client.query<{ itens: number; cronograma: number }>(
        `
        select
          (select count(*)::int from orcamentos_obra_itens where orcamento_id = $1 and status = 'ATIVO') as itens,
          (select count(*)::int from orcamentos_obra_cronograma where orcamento_id = $1 and status = 'ATIVO') as cronograma
        `,
        [id]
      );
      if (!counts.rows[0] || counts.rows[0].itens < 1 || counts.rows[0].cronograma < 1) {
        throw new HttpError(409, 'orcamento_incompleto', 'Orcamento precisa de ao menos um item ativo e uma linha de cronograma ativa.');
      }
      await client.query(
        `
        update orcamentos_obra
        set status = 'EM_REVISAO',
            enviado_revisao_por = $1,
            enviado_revisao_em = now(),
            updated_by = $1,
            updated_at = now()
        where id = $2
        `,
        [usuarioId, id]
      );
    }
    if (action === 'aprovar') {
      if (orcamento.status !== 'EM_REVISAO') {
        throw new HttpError(409, 'status_conflict', `Orcamento em status ${orcamento.status} nao permite aprovacao.`);
      }
      const existing = await client.query<{ id: string; codigo: string }>(
        `
        select id, codigo
        from orcamentos_obra
        where company_id = $1 and obra_id = $2 and status = 'APROVADO' and id <> $3
        limit 1
        `,
        [orcamento.company_id, orcamento.obra_id, id]
      );
      if (existing.rows[0]) {
        throw new HttpError(409, 'orcamento_vigente_duplicado', `Obra ja possui orcamento aprovado vigente: ${existing.rows[0].codigo}.`);
      }
      await client.query(
        `
        update orcamentos_obra
        set status = 'APROVADO',
            aprovado_por = $1,
            aprovado_em = now(),
            aprovado_observacoes = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, observacoes, id]
      );
    }
    if (action === 'bloquear') {
      if (orcamento.status === 'CANCELADO') {
        throw new HttpError(409, 'status_conflict', 'Orcamento cancelado nao pode ser bloqueado.');
      }
      await client.query(
        `
        update orcamentos_obra
        set status = 'BLOQUEADO',
            bloqueado_por = $1,
            bloqueado_em = now(),
            bloqueio_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, observacoes, id]
      );
    }
    if (action === 'cancelar') {
      if (orcamento.status === 'CANCELADO') {
        throw new HttpError(409, 'status_conflict', 'Orcamento ja esta cancelado.');
      }
      await client.query(
        `
        update orcamentos_obra
        set status = 'CANCELADO',
            cancelado_por = $1,
            cancelado_em = now(),
            cancelamento_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, observacoes, id]
      );
    }
    await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra', id, action, {
      observacoes,
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const addPacote = async (orcamentoId: string, payload: Record<string, unknown>) => {
  assertUuid(orcamentoId, 'id');
  assertAllowedFields(payload, ['codigo', 'nome', 'descricao', 'etapa', 'centro_custo_id', 'ordem', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const centroCustoId = optionalUuid(payload, 'centro_custo_id') || orcamento.centro_custo_id;
    await client.query(
      `
      insert into orcamentos_obra_pacotes (
        orcamento_id, company_id, codigo, nome, descricao, etapa, centro_custo_id, ordem, created_by, updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      `,
      [
        orcamentoId,
        orcamento.company_id,
        requiredText(payload, 'codigo'),
        requiredText(payload, 'nome'),
        optionalText(payload, 'descricao'),
        optionalText(payload, 'etapa'),
        centroCustoId,
        Number(payload.ordem || 0),
        usuarioId
      ]
    );
    await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_pacote', orcamentoId, 'criar', {
      codigo: requiredText(payload, 'codigo'),
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updatePacote = async (orcamentoId: string, pacoteId: string, payload: Record<string, unknown>, inativar = false) => {
  assertUuid(orcamentoId, 'id');
  assertUuid(pacoteId, 'pacoteId');
  assertAllowedFields(payload, ['codigo', 'nome', 'descricao', 'etapa', 'centro_custo_id', 'ordem', 'usuario_id', 'motivo', 'observacoes', 'justificativa']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const pacote = await client.query('select id from orcamentos_obra_pacotes where id = $1 and orcamento_id = $2 for update', [pacoteId, orcamentoId]);
    if (!pacote.rows[0]) throw new HttpError(404, 'not_found', 'Pacote orcamentario nao encontrado.');
    if (inativar) {
      await client.query(
        `
        update orcamentos_obra_pacotes
        set status = 'INATIVO',
            inativado_por = $1,
            inativado_em = now(),
            inativacao_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa'), pacoteId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_pacote', pacoteId, 'inativar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    } else {
      const updates: Array<{ column: string; value: unknown }> = [];
      if (hasOwn(payload, 'codigo')) updates.push({ column: 'codigo', value: requiredText(payload, 'codigo') });
      if (hasOwn(payload, 'nome')) updates.push({ column: 'nome', value: requiredText(payload, 'nome') });
      if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: optionalText(payload, 'descricao') });
      if (hasOwn(payload, 'etapa')) updates.push({ column: 'etapa', value: optionalText(payload, 'etapa') });
      if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
      if (hasOwn(payload, 'ordem')) updates.push({ column: 'ordem', value: Number(payload.ordem || 0) });
      if (updates.length === 0) throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
      const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
      await client.query(
        `
        update orcamentos_obra_pacotes
        set ${assignments.join(', ')},
            updated_by = $${updates.length + 1},
            updated_at = now()
        where id = $${updates.length + 2}
        `,
        [...updates.map((update) => update.value), usuarioId, pacoteId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_pacote', pacoteId, 'editar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    }
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const listSubitems = async (orcamentoId: string, table: 'pacotes' | 'itens' | 'cronograma'): Promise<QueryResultRow[]> => {
  assertUuid(orcamentoId, 'id');
  if (table === 'pacotes') {
    const result = await getPool().query('select * from orcamentos_obra_pacotes where orcamento_id = $1 order by ordem, created_at', [orcamentoId]);
    return result.rows;
  }
  if (table === 'itens') {
    const result = await getPool().query('select * from orcamentos_obra_itens where orcamento_id = $1 order by created_at', [orcamentoId]);
    return result.rows;
  }
  const result = await getPool().query('select * from orcamentos_obra_cronograma where orcamento_id = $1 order by competencia, created_at', [orcamentoId]);
  return result.rows;
};

const addItem = async (orcamentoId: string, payload: Record<string, unknown>) => {
  assertUuid(orcamentoId, 'id');
  assertAllowedFields(payload, [
    'pacote_id',
    'centro_custo_id',
    'tipo',
    'codigo',
    'descricao',
    'unidade',
    'quantidade',
    'valor_unitario_previsto',
    'insumo_descricao',
    'mao_obra_categoria',
    'equipamento_descricao',
    'observacoes',
    'usuario_id'
  ]);
  const usuarioId = optionalUsuarioId(payload);
  const quantidade = normalizeQuantity(payload.quantidade, 'quantidade');
  const valorUnitario = normalizeMoney(payload.valor_unitario_previsto, 'valor_unitario_previsto');
  const valorTotal = Number((quantidade * valorUnitario).toFixed(2));
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const pacoteId = optionalUuid(payload, 'pacote_id');
    if (pacoteId) {
      const pacote = await client.query('select id from orcamentos_obra_pacotes where id = $1 and orcamento_id = $2 and status = $3', [pacoteId, orcamentoId, 'ATIVO']);
      if (!pacote.rows[0]) throw new HttpError(404, 'not_found', 'Pacote ativo nao encontrado para o orcamento.');
    }
    await client.query(
      `
      insert into orcamentos_obra_itens (
        orcamento_id,
        pacote_id,
        company_id,
        centro_custo_id,
        tipo,
        codigo,
        descricao,
        unidade,
        quantidade,
        valor_unitario_previsto,
        valor_total_previsto,
        insumo_descricao,
        mao_obra_categoria,
        equipamento_descricao,
        observacoes,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
      `,
      [
        orcamentoId,
        pacoteId,
        orcamento.company_id,
        optionalUuid(payload, 'centro_custo_id') || orcamento.centro_custo_id,
        normalizeItemType(payload.tipo),
        optionalText(payload, 'codigo'),
        requiredText(payload, 'descricao'),
        requiredText(payload, 'unidade'),
        quantidade,
        valorUnitario,
        valorTotal,
        optionalText(payload, 'insumo_descricao'),
        optionalText(payload, 'mao_obra_categoria'),
        optionalText(payload, 'equipamento_descricao'),
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await recalcOrcamentoTotais(client, orcamentoId);
    await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_item', orcamentoId, 'criar', {
      tipo: normalizeItemType(payload.tipo),
      valor_total_previsto: valorTotal,
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateItem = async (orcamentoId: string, itemId: string, payload: Record<string, unknown>, inativar = false) => {
  assertUuid(orcamentoId, 'id');
  assertUuid(itemId, 'itemId');
  assertAllowedFields(payload, [
    'pacote_id',
    'centro_custo_id',
    'tipo',
    'codigo',
    'descricao',
    'unidade',
    'quantidade',
    'valor_unitario_previsto',
    'insumo_descricao',
    'mao_obra_categoria',
    'equipamento_descricao',
    'observacoes',
    'usuario_id',
    'motivo',
    'justificativa'
  ]);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const item = await client.query<{ quantidade: string; valor_unitario_previsto: string }>(
      'select quantidade, valor_unitario_previsto from orcamentos_obra_itens where id = $1 and orcamento_id = $2 for update',
      [itemId, orcamentoId]
    );
    if (!item.rows[0]) throw new HttpError(404, 'not_found', 'Item orcamentario nao encontrado.');
    if (inativar) {
      await client.query(
        `
        update orcamentos_obra_itens
        set status = 'INATIVO',
            inativado_por = $1,
            inativado_em = now(),
            inativacao_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa'), itemId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_item', itemId, 'inativar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    } else {
      const quantidade = hasOwn(payload, 'quantidade') ? normalizeQuantity(payload.quantidade, 'quantidade') : Number(item.rows[0].quantidade);
      const valorUnitario = hasOwn(payload, 'valor_unitario_previsto') ? normalizeMoney(payload.valor_unitario_previsto, 'valor_unitario_previsto') : Number(item.rows[0].valor_unitario_previsto);
      const updates: Array<{ column: string; value: unknown }> = [{ column: 'valor_total_previsto', value: Number((quantidade * valorUnitario).toFixed(2)) }];
      if (hasOwn(payload, 'pacote_id')) updates.push({ column: 'pacote_id', value: optionalUuid(payload, 'pacote_id') });
      if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: optionalUuid(payload, 'centro_custo_id') });
      if (hasOwn(payload, 'tipo')) updates.push({ column: 'tipo', value: normalizeItemType(payload.tipo) });
      if (hasOwn(payload, 'codigo')) updates.push({ column: 'codigo', value: optionalText(payload, 'codigo') });
      if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: requiredText(payload, 'descricao') });
      if (hasOwn(payload, 'unidade')) updates.push({ column: 'unidade', value: requiredText(payload, 'unidade') });
      if (hasOwn(payload, 'quantidade')) updates.push({ column: 'quantidade', value: quantidade });
      if (hasOwn(payload, 'valor_unitario_previsto')) updates.push({ column: 'valor_unitario_previsto', value: valorUnitario });
      if (hasOwn(payload, 'insumo_descricao')) updates.push({ column: 'insumo_descricao', value: optionalText(payload, 'insumo_descricao') });
      if (hasOwn(payload, 'mao_obra_categoria')) updates.push({ column: 'mao_obra_categoria', value: optionalText(payload, 'mao_obra_categoria') });
      if (hasOwn(payload, 'equipamento_descricao')) updates.push({ column: 'equipamento_descricao', value: optionalText(payload, 'equipamento_descricao') });
      if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
      const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
      await client.query(
        `
        update orcamentos_obra_itens
        set ${assignments.join(', ')},
            updated_by = $${updates.length + 1},
            updated_at = now()
        where id = $${updates.length + 2}
        `,
        [...updates.map((update) => update.value), usuarioId, itemId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_item', itemId, 'editar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    }
    await recalcOrcamentoTotais(client, orcamentoId);
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const addCronograma = async (orcamentoId: string, payload: Record<string, unknown>) => {
  assertUuid(orcamentoId, 'id');
  assertAllowedFields(payload, ['pacote_id', 'competencia', 'valor_previsto', 'percentual_fisico_previsto', 'observacoes', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const pacoteId = optionalUuid(payload, 'pacote_id');
    await client.query(
      `
      insert into orcamentos_obra_cronograma (
        orcamento_id, pacote_id, company_id, competencia, valor_previsto, percentual_fisico_previsto, observacoes, created_by, updated_by
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      `,
      [
        orcamentoId,
        pacoteId,
        orcamento.company_id,
        requiredText(payload, 'competencia'),
        normalizeMoney(payload.valor_previsto, 'valor_previsto'),
        normalizePercent(payload.percentual_fisico_previsto, 'percentual_fisico_previsto'),
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_cronograma', orcamentoId, 'criar', {
      competencia: requiredText(payload, 'competencia'),
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updateCronograma = async (orcamentoId: string, cronogramaId: string, payload: Record<string, unknown>, inativar = false) => {
  assertUuid(orcamentoId, 'id');
  assertUuid(cronogramaId, 'cronogramaId');
  assertAllowedFields(payload, ['pacote_id', 'competencia', 'valor_previsto', 'percentual_fisico_previsto', 'observacoes', 'usuario_id', 'motivo', 'justificativa']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const orcamento = await fetchOrcamentoForUpdate(client, orcamentoId);
    if (!orcamento) throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
    assertEditable(orcamento);
    const cronograma = await client.query('select id from orcamentos_obra_cronograma where id = $1 and orcamento_id = $2 for update', [cronogramaId, orcamentoId]);
    if (!cronograma.rows[0]) throw new HttpError(404, 'not_found', 'Linha de cronograma nao encontrada.');
    if (inativar) {
      await client.query(
        `
        update orcamentos_obra_cronograma
        set status = 'INATIVO',
            inativado_por = $1,
            inativado_em = now(),
            inativacao_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa'), cronogramaId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_cronograma', cronogramaId, 'inativar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    } else {
      const updates: Array<{ column: string; value: unknown }> = [];
      if (hasOwn(payload, 'pacote_id')) updates.push({ column: 'pacote_id', value: optionalUuid(payload, 'pacote_id') });
      if (hasOwn(payload, 'competencia')) updates.push({ column: 'competencia', value: requiredText(payload, 'competencia') });
      if (hasOwn(payload, 'valor_previsto')) updates.push({ column: 'valor_previsto', value: normalizeMoney(payload.valor_previsto, 'valor_previsto') });
      if (hasOwn(payload, 'percentual_fisico_previsto')) updates.push({ column: 'percentual_fisico_previsto', value: normalizePercent(payload.percentual_fisico_previsto, 'percentual_fisico_previsto') });
      if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
      if (updates.length === 0) throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
      const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
      await client.query(
        `
        update orcamentos_obra_cronograma
        set ${assignments.join(', ')},
            updated_by = $${updates.length + 1},
            updated_at = now()
        where id = $${updates.length + 2}
        `,
        [...updates.map((update) => update.value), usuarioId, cronogramaId]
      );
      await registrarAuditoria(client, orcamento.company_id, 'orcamento_obra_cronograma', cronogramaId, 'editar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    }
    await client.query('commit');
    return fetchOrcamento(orcamentoId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const getResumo = async (id: string): Promise<QueryResultRow> => {
  assertUuid(id, 'id');
  const result = await getPool().query(
    `
    select
      o.id,
      o.codigo,
      o.status,
      o.valor_previsto_total,
      o.valor_material,
      o.valor_mao_obra,
      o.valor_equipamento,
      o.valor_servico,
      o.valor_outros,
      co.valor_total_contratado,
      (co.valor_total_contratado - o.valor_previsto_total)::numeric(14,2) as diferenca_contrato_orcamento,
      coalesce(cronograma.total_cronograma, 0)::numeric(14,2) as total_cronograma,
      coalesce(compras.valor_compras, 0)::numeric(14,2) as valor_compras_realizado,
      coalesce(medido.valor_medido, 0)::numeric(14,2) as valor_medido_realizado,
      coalesce(faturado.valor_faturado, 0)::numeric(14,2) as valor_faturado_realizado,
      coalesce(por_tipo.totais, '[]'::json) as totais_por_tipo,
      coalesce(por_pacote.totais, '[]'::json) as totais_por_pacote
    from orcamentos_obra o
    left join contratos_obra co on co.id = o.contrato_obra_id
    left join lateral (
      select sum(valor_previsto) as total_cronograma
      from orcamentos_obra_cronograma cr
      where cr.orcamento_id = o.id and cr.status = 'ATIVO'
    ) cronograma on true
    left join lateral (
      select sum(valor_total) as valor_compras
      from pedidos_compra pc
      where pc.obra_id = o.obra_id and pc.status <> 'CANCELADO'
    ) compras on true
    left join lateral (
      select sum(valor_bruto) as valor_medido
      from medicoes_obra m
      where m.obra_id = o.obra_id and m.status <> 'CANCELADA'
    ) medido on true
    left join lateral (
      select sum(valor_solicitado) as valor_faturado
      from pedidos_faturamento pf
      where pf.obra_id = o.obra_id and pf.status <> 'CANCELADO'
    ) faturado on true
    left join lateral (
      select json_agg(json_build_object('tipo', tipo, 'valor_total', valor_total) order by tipo) as totais
      from (
        select tipo, sum(valor_total_previsto)::numeric(14,2) as valor_total
        from orcamentos_obra_itens
        where orcamento_id = o.id and status = 'ATIVO'
        group by tipo
      ) t
    ) por_tipo on true
    left join lateral (
      select json_agg(json_build_object('pacote_id', pacote_id, 'pacote_codigo', codigo, 'pacote_nome', nome, 'valor_total', valor_total) order by codigo) as totais
      from (
        select p.id as pacote_id, p.codigo, p.nome, coalesce(sum(i.valor_total_previsto), 0)::numeric(14,2) as valor_total
        from orcamentos_obra_pacotes p
        left join orcamentos_obra_itens i on i.pacote_id = p.id and i.status = 'ATIVO'
        where p.orcamento_id = o.id and p.status = 'ATIVO'
        group by p.id, p.codigo, p.nome
      ) p
    ) por_pacote on true
    where o.id = $1
    `,
    [id]
  );
  const row = result.rows[0];
  if (!row) {
    throw new HttpError(404, 'not_found', 'Orcamento de obra nao encontrado.');
  }
  return row;
};

export const getOrcamentoVigentePorObra = async (obraId: string): Promise<QueryResultRow | undefined> => {
  assertUuid(obraId, 'id');
  const result = await getPool().query(
    `
    select
      o.id,
      o.company_id,
      o.obra_id,
      ob.codigo as obra_codigo,
      ob.nome as obra_nome,
      o.contrato_obra_id,
      co.numero as contrato_obra_numero,
      o.codigo,
      o.versao,
      o.descricao,
      o.valor_previsto_total,
      o.valor_material,
      o.valor_mao_obra,
      o.valor_equipamento,
      o.valor_servico,
      o.valor_outros,
      o.status,
      o.aprovado_em
    from orcamentos_obra o
    join obras ob on ob.id = o.obra_id
    left join contratos_obra co on co.id = o.contrato_obra_id
    where o.obra_id = $1 and o.status = 'APROVADO'
    order by o.aprovado_em desc nulls last
    limit 1
    `,
    [obraId]
  );
  return result.rows[0];
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }
  const pgError = toPgError(error);
  if (pgError.code === '23505') {
    sendError(res, 409, 'unique_violation', 'Orcamento, pacote ou vigencia duplicada para chave unica.', pgError.detail);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para orcamento de obra.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor ou status invalido em orcamento de obra.', pgError.detail);
    return;
  }
  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handleOrcamentosObra = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/orcamentos-obra';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listOrcamentos(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createOrcamento(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (method === 'GET') {
        const orcamento = await fetchOrcamento(id);
        if (!orcamento) {
          sendError(res, 404, 'not_found', 'Orcamento de obra nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: orcamento });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updateOrcamento(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'enviar-revisao') {
        sendJson(res, 200, { data: await mudarStatusOrcamento(id, await readJsonBody(req), 'enviar_revisao') });
        return;
      }
      if (action === 'aprovar') {
        sendJson(res, 200, { data: await mudarStatusOrcamento(id, await readJsonBody(req), 'aprovar') });
        return;
      }
      if (action === 'bloquear') {
        sendJson(res, 200, { data: await mudarStatusOrcamento(id, await readJsonBody(req), 'bloquear') });
        return;
      }
      if (action === 'cancelar') {
        sendJson(res, 200, { data: await mudarStatusOrcamento(id, await readJsonBody(req), 'cancelar') });
        return;
      }
    }

    if (parts.length === 2 && parts[1] === 'resumo' && method === 'GET') {
      sendJson(res, 200, { data: await getResumo(parts[0]) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'pacotes') {
      const [id] = parts;
      if (method === 'GET') {
        sendJson(res, 200, { data: await listSubitems(id, 'pacotes') });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 200, { data: await addPacote(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 3 && parts[1] === 'pacotes' && method === 'PATCH') {
      sendJson(res, 200, { data: await updatePacote(parts[0], parts[2], await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'pacotes' && parts[3] === 'inativar' && method === 'PATCH') {
      sendJson(res, 200, { data: await updatePacote(parts[0], parts[2], await readJsonBody(req), true) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'itens') {
      const [id] = parts;
      if (method === 'GET') {
        sendJson(res, 200, { data: await listSubitems(id, 'itens') });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 200, { data: await addItem(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 3 && parts[1] === 'itens' && method === 'PATCH') {
      sendJson(res, 200, { data: await updateItem(parts[0], parts[2], await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'itens' && parts[3] === 'inativar' && method === 'PATCH') {
      sendJson(res, 200, { data: await updateItem(parts[0], parts[2], await readJsonBody(req), true) });
      return;
    }

    if (parts.length === 2 && parts[1] === 'cronograma') {
      const [id] = parts;
      if (method === 'GET') {
        sendJson(res, 200, { data: await listSubitems(id, 'cronograma') });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 200, { data: await addCronograma(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 3 && parts[1] === 'cronograma' && method === 'PATCH') {
      sendJson(res, 200, { data: await updateCronograma(parts[0], parts[2], await readJsonBody(req)) });
      return;
    }

    if (parts.length === 4 && parts[1] === 'cronograma' && parts[3] === 'inativar' && method === 'PATCH') {
      sendJson(res, 200, { data: await updateCronograma(parts[0], parts[2], await readJsonBody(req), true) });
      return;
    }

    sendError(res, 404, 'not_found', 'Rota de orcamento de obra nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
