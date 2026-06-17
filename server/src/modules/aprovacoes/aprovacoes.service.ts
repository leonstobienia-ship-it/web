import type { PoolClient, QueryResultRow } from 'pg';
import { HttpError } from '../../http.js';

export type AcaoAprovacao = 'aprovar_tecnico' | 'aprovar_diretoria';
export type StatusAprovacao =
  | 'PENDENTE_APROVACAO'
  | 'APROVADO_TECNICO'
  | 'APROVADO_DIRETORIA'
  | 'REPROVADO'
  | 'DEVOLVIDO'
  | 'BLOQUEADO_ALCADA';

interface UsuarioRow extends QueryResultRow {
  id: string;
  company_id: string;
  nome: string;
  email: string;
}

interface RegraAlcadaRow extends QueryResultRow {
  id: string;
  efeito: string;
}

export interface PayloadDecisaoAprovacao {
  usuarioId: string;
  observacoes: string | null;
}

export interface ValidarAlcadaDocumentoInput {
  companyId: string;
  usuarioId: string;
  modulo: string;
  tipoDocumento: string;
  acao: AcaoAprovacao;
  valor: number;
  obraId: string | null;
  centroCustoId: string | null;
}

export interface ResultadoAlcadaDocumento {
  aprovado: boolean;
  decisao: 'PERMITIDO' | 'NEGADO';
  motivo: string;
  usuario: UsuarioRow;
  perfis: QueryResultRow[];
  regra: RegraAlcadaRow | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const assertUuid = (value: unknown, fieldName: string): string => {
  const normalized = String(value ?? '').trim();
  if (!uuidPattern.test(normalized)) {
    throw new HttpError(400, 'validation_error', `Campo UUID invalido: ${fieldName}.`);
  }
  return normalized;
};

export const optionalText = (payload: Record<string, unknown>, fieldName: string): string | null => {
  const value = payload[fieldName];
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

export const getPayloadDecisaoAprovacao = (payload: Record<string, unknown>): PayloadDecisaoAprovacao => {
  const nestedPayload = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : payload;
  const usuarioValue = nestedPayload.usuario_id ?? nestedPayload.usuarioId;
  if (usuarioValue === undefined || usuarioValue === null || String(usuarioValue).trim() === '') {
    throw new HttpError(400, 'validation_error', 'Campo UUID invalido: usuario_id.', {
      payload_keys: Object.keys(nestedPayload)
    });
  }
  return {
    usuarioId: assertUuid(usuarioValue, 'usuario_id'),
    observacoes: optionalText(nestedPayload, 'observacoes')
  };
};

export const normalizarAcaoAprovacao = (action: string): AcaoAprovacao => {
  if (action === 'aprovar-tecnico') {
    return 'aprovar_tecnico';
  }
  if (action === 'aprovar-diretoria') {
    return 'aprovar_diretoria';
  }
  throw new HttpError(404, 'not_found', 'Acao de aprovacao nao encontrada.');
};

export const statusAprovacaoPorAcao = (acao: AcaoAprovacao): StatusAprovacao =>
  acao === 'aprovar_diretoria' ? 'APROVADO_DIRETORIA' : 'APROVADO_TECNICO';

export const validarAlcadaDocumento = async (
  client: PoolClient,
  input: ValidarAlcadaDocumentoInput
): Promise<ResultadoAlcadaDocumento> => {
  const valor = Number(input.valor.toFixed(2));
  const usuario = await client.query<UsuarioRow>(
    `
    select id, company_id, nome, email
    from usuarios
    where id = $1 and status = 'ativo' and ativo = true
    `,
    [input.usuarioId]
  );
  const user = usuario.rows[0];
  if (!user) {
    throw new HttpError(404, 'not_found', 'Usuario ativo nao encontrado.');
  }
  if (user.company_id !== input.companyId) {
    throw new HttpError(400, 'validation_error', 'Usuario nao pertence a empresa do documento.');
  }

  const perfis = await client.query(
    `
    select p.id, p.nome
    from usuarios_perfis up
    join perfis p on p.id = up.perfil_id
    where up.usuario_id = $1 and up.status = 'ativo' and p.status = 'ativo'
    order by up.principal desc, p.nome
    `,
    [input.usuarioId]
  );
  const perfilIds = perfis.rows.map((perfil) => perfil.id);

  const rules = await client.query<RegraAlcadaRow>(
    `
    select
      a.id,
      a.usuario_id,
      u.nome as usuario_nome,
      a.perfil_id,
      p.nome as perfil_nome,
      a.modulo,
      a.tipo_documento,
      a.acao,
      a.obra_id,
      a.centro_custo_id,
      a.valor_minimo,
      a.valor_maximo,
      a.efeito,
      a.observacoes
    from alcadas_aprovacao a
    left join usuarios u on u.id = a.usuario_id
    left join perfis p on p.id = a.perfil_id
    where a.company_id = $1
      and a.status = 'ativo'
      and a.modulo = $2
      and a.tipo_documento = $3
      and a.acao = $4
      and a.valor_minimo <= $5
      and (a.valor_maximo is null or a.valor_maximo >= $5)
      and (a.usuario_id = $6 or a.perfil_id = any($7::uuid[]))
      and (a.obra_id is null or a.obra_id = $8)
      and (a.centro_custo_id is null or a.centro_custo_id = $9)
    order by
      (a.usuario_id is not null) desc,
      (a.obra_id is not null) desc,
      (a.centro_custo_id is not null) desc,
      a.valor_minimo desc,
      a.valor_maximo asc nulls last,
      a.created_at desc
    limit 1
    `,
    [
      input.companyId,
      input.modulo,
      input.tipoDocumento,
      input.acao,
      valor,
      input.usuarioId,
      perfilIds,
      input.obraId,
      input.centroCustoId
    ]
  );
  const regra = rules.rows[0] || null;
  const aprovado = Boolean(regra && regra.efeito === 'PERMITIR');
  return {
    aprovado,
    decisao: aprovado ? 'PERMITIDO' : 'NEGADO',
    motivo: regra
      ? `Regra ${regra.efeito} encontrada.`
      : 'Nenhuma alcada ativa cobre usuario, perfil, modulo, acao, tipo de documento e valor.',
    usuario: user,
    perfis: perfis.rows,
    regra
  };
};

export const registrarAuditoria = async (
  client: PoolClient,
  companyId: string | null,
  entidade: string,
  entidadeId: string | null,
  acao: string,
  payload: Record<string, unknown>,
  usuarioId: string | null = null
): Promise<void> => {
  await client.query(
    `
    insert into auditoria_eventos (company_id, entidade, entidade_id, acao, payload, created_by)
    values ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [companyId, entidade, entidadeId, acao, JSON.stringify(payload), usuarioId]
  );
};

export const persistirBloqueioAlcada = async (
  client: PoolClient,
  tableName: string,
  id: string,
  motivo: string,
  observacoes: string | null,
  usuarioId: string
): Promise<void> => {
  await client.query(
    `
    update ${tableName}
    set
      aprovacao_status = 'BLOQUEADO_ALCADA',
      aprovado_por = $1,
      aprovado_em = now(),
      aprovacao_observacoes = $2,
      bloqueio_alcada_motivo = $3,
      updated_at = now()
    where id = $4
    `,
    [usuarioId, observacoes, motivo, id]
  );
};
