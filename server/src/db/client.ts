import { Pool, type QueryResultRow } from 'pg';
import { assertLocalDatabaseUrl, readEnv } from '../config/env.js';

export interface DatabaseState {
  configured: boolean;
  provider: 'postgresql';
  localOnly: boolean;
  database: string;
}

let pool: Pool | undefined;

export const getPool = (): Pool => {
  if (pool) {
    return pool;
  }

  const env = readEnv();
  assertLocalDatabaseUrl(env.databaseUrl);

  pool = new Pool({
    connectionString: env.databaseUrl,
    max: env.pgPoolMax,
    idleTimeoutMillis: env.pgIdleTimeoutMs,
    connectionTimeoutMillis: env.pgConnectionTimeoutMs
  });

  return pool;
};

export const query = async <T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) =>
  getPool().query<T>(sql, params);

export const closePool = async (): Promise<void> => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
};

export const getDatabaseState = (): DatabaseState => {
  const env = readEnv();
  const url = new URL(env.databaseUrl);

  return {
    configured: Boolean(env.databaseUrl),
    provider: 'postgresql',
    localOnly: ['localhost', '127.0.0.1', '::1'].includes(url.hostname) && url.pathname === '/enac_erp_dev',
    database: url.pathname.replace(/^\//, '')
  };
};
