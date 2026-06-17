import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PoolClient, QueryResultRow } from 'pg';
import { getPool } from '../../db/client.js';
import { HttpError, isHttpError, methodNotAllowed, readJsonBody, sendError, sendJson } from '../../http.js';
import { assertUuid, optionalText, registrarAuditoria } from '../aprovacoes/aprovacoes.service.js';

type PlanejamentoStatus = 'RASCUNHO' | 'ATIVO' | 'REVISADO' | 'ENCERRADO' | 'CANCELADO';

interface PgErrorLike {
  code?: string;
  detail?: string;
}

interface PlanejamentoForUpdate extends QueryResultRow {
  id: string;
  company_id: string;
  obra_id: string;
  orcamento_id: string | null;
  contrato_obra_id: string | null;
  centro_custo_id: string | null;
  status: PlanejamentoStatus;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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

const requiredDate = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = optionalDate(payload, fieldName);
  if (!value) {
    throw new HttpError(400, 'validation_error', `Campo obrigatorio ausente: ${fieldName}.`);
  }
  return value;
};

const fetchPlanejamentoForUpdate = async (client: PoolClient, id: string): Promise<PlanejamentoForUpdate | undefined> => {
  const result = await client.query<PlanejamentoForUpdate>(
    `
    select id, company_id, obra_id, orcamento_id, contrato_obra_id, centro_custo_id, status
    from planejamento_executivo
    where id = $1
    for update
    `,
    [id]
  );
  return result.rows[0];
};

const assertPlanejamentoRefs = async (
  client: PoolClient,
  companyId: string,
  obraId: string,
  orcamentoId: string | null,
  contratoObraId: string | null,
  centroCustoId: string | null,
  responsavelId: string | null
): Promise<void> => {
  const result = await client.query<{
    obra_status: string;
    orcamento_obra_id: string | null;
    orcamento_status: string | null;
    contrato_obra_id: string | null;
    contrato_status: string | null;
    centro_status: string | null;
    responsavel_status: string | null;
    responsavel_ativo: boolean | null;
  }>(
    `
    select
      o.status as obra_status,
      orc.obra_id as orcamento_obra_id,
      orc.status as orcamento_status,
      co.obra_id as contrato_obra_id,
      co.status as contrato_status,
      cc.status as centro_status,
      u.status as responsavel_status,
      u.ativo as responsavel_ativo
    from obras o
    left join orcamentos_obra orc on orc.id = $3 and orc.company_id = $1
    left join contratos_obra co on co.id = $4 and co.company_id = $1
    left join centros_custo cc on cc.id = $5 and cc.company_id = $1
    left join usuarios u on u.id = $6 and u.company_id = $1
    where o.id = $2 and o.company_id = $1
    `,
    [companyId, obraId, orcamentoId, contratoObraId, centroCustoId, responsavelId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new HttpError(404, 'not_found', 'Obra nao encontrada para planejamento executivo.');
  }
  if (row.obra_status !== 'ativo') {
    throw new HttpError(409, 'obra_inativa', 'Obra inativa nao permite planejamento executivo.');
  }
  if (orcamentoId && (!row.orcamento_status || row.orcamento_obra_id !== obraId)) {
    throw new HttpError(409, 'orcamento_obra_divergente', 'Orcamento informado nao pertence a obra do planejamento.');
  }
  if (contratoObraId && (!row.contrato_status || row.contrato_obra_id !== obraId)) {
    throw new HttpError(409, 'contrato_obra_divergente', 'Contrato informado nao pertence a obra do planejamento.');
  }
  if (centroCustoId && row.centro_status !== 'ativo') {
    throw new HttpError(409, 'centro_custo_inativo', 'Centro de custo inativo nao permite planejamento executivo.');
  }
  if (responsavelId && (row.responsavel_status !== 'ativo' || row.responsavel_ativo !== true)) {
    throw new HttpError(409, 'responsavel_inativo', 'Responsavel inativo nao permite planejamento executivo.');
  }
};

const fetchPlanejamento = async (id: string): Promise<QueryResultRow | undefined> => {
  const result = await getPool().query(
    `
    select
      p.id,
      p.company_id,
      p.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      p.orcamento_id,
      orc.codigo as orcamento_codigo,
      orc.versao as orcamento_versao,
      p.contrato_obra_id,
      co.numero as contrato_obra_numero,
      p.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      cc.nome as centro_custo_nome,
      p.etapa,
      p.descricao,
      p.data_inicio_prevista,
      p.data_fim_prevista,
      p.responsavel_id,
      u.nome as responsavel_nome,
      p.observacoes,
      p.status,
      p.ativado_por,
      p.ativado_em,
      p.revisado_por,
      p.revisado_em,
      p.revisao_motivo,
      p.encerrado_por,
      p.encerrado_em,
      p.encerramento_motivo,
      p.cancelado_por,
      p.cancelado_em,
      p.cancelamento_motivo,
      p.created_at,
      p.updated_at
    from planejamento_executivo p
    join obras o on o.id = p.obra_id
    left join orcamentos_obra orc on orc.id = p.orcamento_id
    left join contratos_obra co on co.id = p.contrato_obra_id
    left join centros_custo cc on cc.id = p.centro_custo_id
    left join usuarios u on u.id = p.responsavel_id
    where p.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const listPlanejamentos = async (url: URL): Promise<QueryResultRow[]> => {
  const params: unknown[] = [];
  const conditions: string[] = [];
  const status = url.searchParams.get('status');
  if (status) {
    params.push(status.trim().toUpperCase());
    conditions.push(`p.status = $${params.length}`);
  }
  const obraId = url.searchParams.get('obra_id');
  if (obraId) {
    params.push(assertUuid(obraId, 'obra_id'));
    conditions.push(`p.obra_id = $${params.length}`);
  }
  const orcamentoId = url.searchParams.get('orcamento_id');
  if (orcamentoId) {
    params.push(assertUuid(orcamentoId, 'orcamento_id'));
    conditions.push(`p.orcamento_id = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const result = await getPool().query(
    `
    select
      p.id,
      p.company_id,
      p.obra_id,
      o.codigo as obra_codigo,
      o.nome as obra_nome,
      p.orcamento_id,
      orc.codigo as orcamento_codigo,
      orc.versao as orcamento_versao,
      p.contrato_obra_id,
      co.numero as contrato_obra_numero,
      p.centro_custo_id,
      cc.codigo as centro_custo_codigo,
      p.etapa,
      p.descricao,
      p.data_inicio_prevista,
      p.data_fim_prevista,
      p.responsavel_id,
      u.nome as responsavel_nome,
      p.observacoes,
      p.status,
      p.created_at,
      p.updated_at
    from planejamento_executivo p
    join obras o on o.id = p.obra_id
    left join orcamentos_obra orc on orc.id = p.orcamento_id
    left join contratos_obra co on co.id = p.contrato_obra_id
    left join centros_custo cc on cc.id = p.centro_custo_id
    left join usuarios u on u.id = p.responsavel_id
    ${where}
    order by p.data_inicio_prevista, p.created_at
    `,
    params
  );
  return result.rows;
};

const createPlanejamento = async (payload: Record<string, unknown>) => {
  assertAllowedFields(payload, [
    'company_id',
    'obra_id',
    'orcamento_id',
    'contrato_obra_id',
    'centro_custo_id',
    'etapa',
    'descricao',
    'data_inicio_prevista',
    'data_fim_prevista',
    'responsavel_id',
    'observacoes',
    'usuario_id'
  ]);
  const companyId = assertUuid(payload.company_id, 'company_id');
  const obraId = assertUuid(payload.obra_id, 'obra_id');
  const orcamentoId = optionalUuid(payload, 'orcamento_id');
  const contratoObraId = optionalUuid(payload, 'contrato_obra_id');
  const centroCustoId = optionalUuid(payload, 'centro_custo_id');
  const responsavelId = optionalUuid(payload, 'responsavel_id');
  const dataInicio = requiredDate(payload, 'data_inicio_prevista');
  const dataFim = requiredDate(payload, 'data_fim_prevista');
  if (dataFim < dataInicio) {
    throw new HttpError(400, 'validation_error', 'data_fim_prevista nao pode ser anterior a data_inicio_prevista.');
  }
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await assertPlanejamentoRefs(client, companyId, obraId, orcamentoId, contratoObraId, centroCustoId, responsavelId);
    const created = await client.query<{ id: string }>(
      `
      insert into planejamento_executivo (
        company_id,
        obra_id,
        orcamento_id,
        contrato_obra_id,
        centro_custo_id,
        etapa,
        descricao,
        data_inicio_prevista,
        data_fim_prevista,
        responsavel_id,
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
        orcamentoId,
        contratoObraId,
        centroCustoId,
        requiredText(payload, 'etapa'),
        optionalText(payload, 'descricao'),
        dataInicio,
        dataFim,
        responsavelId,
        optionalText(payload, 'observacoes'),
        usuarioId
      ]
    );
    await registrarAuditoria(client, companyId, 'planejamento_executivo', created.rows[0].id, 'criar', {
      obra_id: obraId,
      orcamento_id: orcamentoId,
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchPlanejamento(created.rows[0].id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const updatePlanejamento = async (id: string, payload: Record<string, unknown>) => {
  assertUuid(id, 'id');
  assertAllowedFields(payload, ['orcamento_id', 'contrato_obra_id', 'centro_custo_id', 'etapa', 'descricao', 'data_inicio_prevista', 'data_fim_prevista', 'responsavel_id', 'observacoes', 'usuario_id']);
  const usuarioId = optionalUsuarioId(payload);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const planejamento = await fetchPlanejamentoForUpdate(client, id);
    if (!planejamento) throw new HttpError(404, 'not_found', 'Planejamento executivo nao encontrado.');
    if (!['RASCUNHO', 'REVISADO'].includes(planejamento.status)) {
      throw new HttpError(409, 'status_conflict', `Planejamento em status ${planejamento.status} nao permite edicao.`);
    }
    const nextOrcamentoId = hasOwn(payload, 'orcamento_id') ? optionalUuid(payload, 'orcamento_id') : planejamento.orcamento_id;
    const nextContratoId = hasOwn(payload, 'contrato_obra_id') ? optionalUuid(payload, 'contrato_obra_id') : planejamento.contrato_obra_id;
    const nextCentroId = hasOwn(payload, 'centro_custo_id') ? optionalUuid(payload, 'centro_custo_id') : planejamento.centro_custo_id;
    const nextResponsavelId = hasOwn(payload, 'responsavel_id') ? optionalUuid(payload, 'responsavel_id') : null;
    await assertPlanejamentoRefs(client, planejamento.company_id, planejamento.obra_id, nextOrcamentoId, nextContratoId, nextCentroId, nextResponsavelId);
    const updates: Array<{ column: string; value: unknown }> = [];
    if (hasOwn(payload, 'orcamento_id')) updates.push({ column: 'orcamento_id', value: nextOrcamentoId });
    if (hasOwn(payload, 'contrato_obra_id')) updates.push({ column: 'contrato_obra_id', value: nextContratoId });
    if (hasOwn(payload, 'centro_custo_id')) updates.push({ column: 'centro_custo_id', value: nextCentroId });
    if (hasOwn(payload, 'etapa')) updates.push({ column: 'etapa', value: requiredText(payload, 'etapa') });
    if (hasOwn(payload, 'descricao')) updates.push({ column: 'descricao', value: optionalText(payload, 'descricao') });
    if (hasOwn(payload, 'data_inicio_prevista')) updates.push({ column: 'data_inicio_prevista', value: requiredDate(payload, 'data_inicio_prevista') });
    if (hasOwn(payload, 'data_fim_prevista')) updates.push({ column: 'data_fim_prevista', value: requiredDate(payload, 'data_fim_prevista') });
    if (hasOwn(payload, 'responsavel_id')) updates.push({ column: 'responsavel_id', value: nextResponsavelId });
    if (hasOwn(payload, 'observacoes')) updates.push({ column: 'observacoes', value: optionalText(payload, 'observacoes') });
    if (updates.length === 0) throw new HttpError(400, 'validation_error', 'Informe ao menos um campo para atualizar.');
    const assignments = updates.map((update, index) => `${update.column} = $${index + 1}`);
    await client.query(
      `
      update planejamento_executivo
      set ${assignments.join(', ')},
          updated_by = $${updates.length + 1},
          updated_at = now()
      where id = $${updates.length + 2}
      `,
      [...updates.map((update) => update.value), usuarioId, id]
    );
    await registrarAuditoria(client, planejamento.company_id, 'planejamento_executivo', id, 'editar', { marker: 'DEV_LOCAL_V3_8' }, usuarioId);
    await client.query('commit');
    return fetchPlanejamento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const mudarStatusPlanejamento = async (id: string, payload: Record<string, unknown>, action: 'ativar' | 'revisar' | 'encerrar' | 'cancelar') => {
  assertUuid(id, 'id');
  const usuarioId = requiredUsuarioId(payload);
  const motivo = optionalText(payload, 'motivo') || optionalText(payload, 'observacoes') || optionalText(payload, 'justificativa');
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const planejamento = await fetchPlanejamentoForUpdate(client, id);
    if (!planejamento) throw new HttpError(404, 'not_found', 'Planejamento executivo nao encontrado.');
    if (action === 'ativar') {
      if (!['RASCUNHO', 'REVISADO'].includes(planejamento.status)) {
        throw new HttpError(409, 'status_conflict', `Planejamento em status ${planejamento.status} nao permite ativacao.`);
      }
      await client.query(
        `
        update planejamento_executivo
        set status = 'ATIVO',
            ativado_por = $1,
            ativado_em = now(),
            updated_by = $1,
            updated_at = now()
        where id = $2
        `,
        [usuarioId, id]
      );
    }
    if (action === 'revisar') {
      if (planejamento.status !== 'ATIVO') {
        throw new HttpError(409, 'status_conflict', `Planejamento em status ${planejamento.status} nao permite revisao.`);
      }
      await client.query(
        `
        update planejamento_executivo
        set status = 'REVISADO',
            revisado_por = $1,
            revisado_em = now(),
            revisao_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, motivo, id]
      );
    }
    if (action === 'encerrar') {
      if (!['ATIVO', 'REVISADO'].includes(planejamento.status)) {
        throw new HttpError(409, 'status_conflict', `Planejamento em status ${planejamento.status} nao permite encerramento.`);
      }
      await client.query(
        `
        update planejamento_executivo
        set status = 'ENCERRADO',
            encerrado_por = $1,
            encerrado_em = now(),
            encerramento_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, motivo, id]
      );
    }
    if (action === 'cancelar') {
      if (planejamento.status === 'ENCERRADO') {
        throw new HttpError(409, 'status_conflict', 'Planejamento encerrado nao pode ser cancelado.');
      }
      await client.query(
        `
        update planejamento_executivo
        set status = 'CANCELADO',
            cancelado_por = $1,
            cancelado_em = now(),
            cancelamento_motivo = $2,
            updated_by = $1,
            updated_at = now()
        where id = $3
        `,
        [usuarioId, motivo, id]
      );
    }
    await registrarAuditoria(client, planejamento.company_id, 'planejamento_executivo', id, action, {
      motivo,
      marker: 'DEV_LOCAL_V3_8'
    }, usuarioId);
    await client.query('commit');
    return fetchPlanejamento(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

const toPgError = (error: unknown): PgErrorLike =>
  typeof error === 'object' && error !== null ? error as PgErrorLike : {};

const handleError = (res: ServerResponse, error: unknown): void => {
  if (isHttpError(error)) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }
  const pgError = toPgError(error);
  if (pgError.code === '23503') {
    sendError(res, 400, 'foreign_key_violation', 'Referencia invalida para planejamento executivo.', pgError.detail);
    return;
  }
  if (pgError.code === '23514') {
    sendError(res, 400, 'check_violation', 'Valor ou status invalido em planejamento executivo.', pgError.detail);
    return;
  }
  sendError(res, 503, 'database_error', error instanceof Error ? error.message : String(error));
};

export const handlePlanejamentoExecutivo = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const basePath = '/planejamento-executivo';
  const relativePath = url.pathname === basePath ? '' : url.pathname.slice(basePath.length);
  const parts = relativePath.split('/').filter(Boolean);

  try {
    if (parts.length === 0) {
      if (method === 'GET') {
        sendJson(res, 200, { data: await listPlanejamentos(url) });
        return;
      }
      if (method === 'POST') {
        sendJson(res, 201, { data: await createPlanejamento(await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'POST']);
      return;
    }

    if (parts.length === 1) {
      const [id] = parts;
      if (method === 'GET') {
        const planejamento = await fetchPlanejamento(id);
        if (!planejamento) {
          sendError(res, 404, 'not_found', 'Planejamento executivo nao encontrado.');
          return;
        }
        sendJson(res, 200, { data: planejamento });
        return;
      }
      if (method === 'PATCH') {
        sendJson(res, 200, { data: await updatePlanejamento(id, await readJsonBody(req)) });
        return;
      }
      methodNotAllowed(res, ['GET', 'PATCH']);
      return;
    }

    if (parts.length === 2 && method === 'PATCH') {
      const [id, action] = parts;
      if (action === 'ativar' || action === 'revisar' || action === 'encerrar' || action === 'cancelar') {
        sendJson(res, 200, { data: await mudarStatusPlanejamento(id, await readJsonBody(req), action) });
        return;
      }
    }

    sendError(res, 404, 'not_found', 'Rota de planejamento executivo nao encontrada.');
  } catch (error) {
    handleError(res, error);
  }
};
