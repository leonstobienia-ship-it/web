import type { ServerResponse } from 'node:http';
import { readEnv } from '../../config/env.js';
import { getDatabaseState, query } from '../../db/client.js';
import { methodNotAllowed, sendJson } from '../../http.js';

export { sendJson } from '../../http.js';

export const handleHealth = (method: string, res: ServerResponse): void => {
  if (method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const env = readEnv();

  sendJson(res, 200, {
    status: 'ok',
    service: 'enac-erp-api',
    timestamp: new Date().toISOString(),
    environment: env.environment,
    database: getDatabaseState()
  });
};

export const handleHealthDb = async (method: string, res: ServerResponse): Promise<void> => {
  if (method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const result = await query<{ ok: number; database_name: string }>('select 1 as ok, current_database() as database_name');

    sendJson(res, 200, {
      status: 'ok',
      service: 'enac-erp-api',
      timestamp: new Date().toISOString(),
      environment: readEnv().environment,
      database: {
        connected: true,
        name: result.rows[0]?.database_name || 'unknown'
      }
    });
  } catch (error) {
    sendJson(res, 503, {
      status: 'error',
      service: 'enac-erp-api',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
};
