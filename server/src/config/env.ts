import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '../.env' });
loadDotenv({ path: '.env' });

export interface ServerEnv {
  port: number;
  environment: string;
  databaseUrl: string;
  pgPoolMax: number;
  pgIdleTimeoutMs: number;
  pgConnectionTimeoutMs: number;
}

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value || 3333);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3333;
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value || fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const buildDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST || '127.0.0.1';
  const port = process.env.POSTGRES_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'enac_erp_dev';
  const user = process.env.POSTGRES_USER || 'enac_erp_dev';
  const password = process.env.POSTGRES_PASSWORD || 'enac_erp_dev_password';

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
};

export const assertLocalDatabaseUrl = (databaseUrl: string): void => {
  const url = new URL(databaseUrl);
  const allowedHosts = ['localhost', '127.0.0.1', '::1'];
  const databaseName = url.pathname.replace(/^\//, '');

  if (!allowedHosts.includes(url.hostname) || databaseName !== 'enac_erp_dev') {
    throw new Error('DATABASE_URL bloqueada: a V3.3A permite apenas banco local enac_erp_dev.');
  }
};

export const readEnv = (): ServerEnv => ({
  port: parsePort(process.env.PORT),
  environment: process.env.NODE_ENV || 'development',
  databaseUrl: buildDatabaseUrl(),
  pgPoolMax: parsePositiveInt(process.env.PG_POOL_MAX, 5),
  pgIdleTimeoutMs: parsePositiveInt(process.env.PG_IDLE_TIMEOUT_MS, 30000),
  pgConnectionTimeoutMs: parsePositiveInt(process.env.PG_CONNECTION_TIMEOUT_MS, 5000)
});
