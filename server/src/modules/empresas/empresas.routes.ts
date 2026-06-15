import type { ServerResponse } from 'node:http';
import { query } from '../../db/client.js';
import { methodNotAllowed, sendJson } from '../../http.js';

export const handleEmpresas = async (method: string, res: ServerResponse): Promise<void> => {
  if (method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const result = await query(`
      select id, razao_social, nome_fantasia, cnpj, regime_tributario, status, created_at, updated_at
      from empresas
      order by razao_social
    `);

    sendJson(res, 200, { data: result.rows });
  } catch (error) {
    sendJson(res, 503, { status: 'error', code: 'database_error', message: error instanceof Error ? error.message : String(error) });
  }
};
