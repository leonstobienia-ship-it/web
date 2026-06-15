import type { ServerResponse } from 'node:http';
import { query } from '../../db/client.js';
import { sendJson } from '../health/health.routes.js';

export const handleCentrosCusto = async (method: string, res: ServerResponse): Promise<void> => {
  if (method !== 'GET') {
    sendJson(res, 405, { status: 'method_not_allowed', allowed: ['GET'] });
    return;
  }

  try {
    const result = await query(`
      select id, company_id, codigo, nome, conta_analitica, status, created_at, updated_at
      from centros_custo
      order by codigo
    `);

    sendJson(res, 200, { data: result.rows });
  } catch (error) {
    sendJson(res, 503, { status: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
