import type { ServerResponse } from 'node:http';
import { query } from '../../db/client.js';
import { sendJson } from '../health/health.routes.js';

export const handleObras = async (method: string, res: ServerResponse): Promise<void> => {
  if (method !== 'GET') {
    sendJson(res, 405, { status: 'method_not_allowed', allowed: ['GET'] });
    return;
  }

  try {
    const result = await query(`
      select
        o.id,
        o.company_id,
        o.codigo,
        o.nome,
        o.endereco,
        o.status,
        c.nome as cliente,
        cc.codigo as centro_custo_codigo,
        cc.nome as centro_custo
      from obras o
      left join clientes c on c.id = o.cliente_id
      left join centros_custo cc on cc.id = o.centro_custo_id
      order by o.codigo
    `);

    sendJson(res, 200, { data: result.rows });
  } catch (error) {
    sendJson(res, 503, { status: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
