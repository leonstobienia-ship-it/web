import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const serverRootDir = path.resolve(currentDir, '..', '..');
const projectRootDir = path.resolve(serverRootDir, '..');
const explicitDatabaseUrl = process.env.DATABASE_URL;

const loadDevelopmentEnv = (): void => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const envFiles = [
    path.join(projectRootDir, '.env'),
    path.join(serverRootDir, '.env')
  ];

  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      loadDotenv({ path: envFile, override: false });
    }
  }
};

loadDevelopmentEnv();

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

const hasPostgresParts = (): boolean =>
  Boolean(
    process.env.POSTGRES_HOST ||
    process.env.POSTGRES_PORT ||
    process.env.POSTGRES_DB ||
    process.env.POSTGRES_USER ||
    process.env.POSTGRES_PASSWORD
  );

const buildDatabaseUrlFromParts = (): string => {
  const host = process.env.POSTGRES_HOST || '127.0.0.1';
  const port = process.env.POSTGRES_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'enac_erp_dev';
  const user = process.env.POSTGRES_USER || 'enac_erp_dev';
  const password = process.env.POSTGRES_PASSWORD || 'enac_erp_dev_password';

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
};

const buildDatabaseUrl = (): string => {
  if (explicitDatabaseUrl) {
    return explicitDatabaseUrl;
  }

  if (hasPostgresParts()) {
    return buildDatabaseUrlFromParts();
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return buildDatabaseUrlFromParts();
};

export const assertLocalDatabaseUrl = (databaseUrl: string): void => {
  const url = new URL(databaseUrl);
  const allowedHosts = ['localhost', '127.0.0.1', '::1', 'postgres'];
  const databaseName = url.pathname.replace(/^\//, '');

  if (!allowedHosts.includes(url.hostname) || databaseName !== 'enac_erp_dev') {
    throw new Error('DATABASE_URL bloqueada: use apenas banco local enac_erp_dev em localhost, 127.0.0.1, ::1 ou postgres.');
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
