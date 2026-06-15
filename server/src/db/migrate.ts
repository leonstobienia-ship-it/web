import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { closePool, getPool } from './client.js';

const migrationId = '001_init_core';

const run = async (): Promise<void> => {
  const pool = getPool();
  const migrationPath = path.resolve(process.cwd(), '..', 'database', 'migrations', `${migrationId}.sql`);
  const sql = await readFile(migrationPath, 'utf8');

  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const existing = await pool.query('select id from schema_migrations where id = $1', [migrationId]);
  if (existing.rowCount && existing.rowCount > 0) {
    console.info(`Migration ${migrationId} ja aplicada. Nenhuma acao executada.`);
    return;
  }

  await pool.query(sql);
  await pool.query('insert into schema_migrations (id) values ($1)', [migrationId]);
  console.info(`Migration ${migrationId} aplicada com sucesso.`);
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
