import type { ServerResponse } from 'node:http';
import { readEnv } from '../../config/env.js';
import { getDatabaseState } from '../../db/client.js';

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
