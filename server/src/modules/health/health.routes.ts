import type { ServerResponse } from 'node:http';
import { readEnv } from '../../config/env.js';
import { getDatabaseState, query } from '../../db/client.js';

export const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(payload));
};

export const handleHealth = (_method: string, res: ServerResponse): void => {
  const env = readEnv();

  sendJson(res, 200, {
    status: 'ok',
    service: 'enac-erp-api',
    timestamp: new Date().toISOString(),
    environment: env.environment,
    database: getDatabaseState()
  });
};

export const handleHealthDb = async (_method: string, res: ServerResponse): Promise<void> => {
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
