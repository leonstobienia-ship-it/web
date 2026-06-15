import type { ServerResponse } from 'node:http';
import { query } from '../../db/client.js';
import { methodNotAllowed, sendJson } from '../../http.js';

export const handleUsuarios = async (method: string, res: ServerResponse): Promise<void> => {
  if (method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const result = await query(`
      select u.id, u.nome, u.email, u.cargo_funcao, u.ativo, u.status, p.nome as perfil_principal
      from usuarios u
      left join perfis p on p.id = u.perfil_principal_id
      order by u.nome
    `);

    sendJson(res, 200, { data: result.rows });
  } catch (error) {
    sendJson(res, 503, { status: 'error', code: 'database_error', message: error instanceof Error ? error.message : String(error) });
  }
};
