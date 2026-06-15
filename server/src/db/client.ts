import { readEnv } from '../config/env.js';

export interface DatabaseState {
  configured: boolean;
  provider: 'postgresql';
}

export const getDatabaseState = (): DatabaseState => {
  const env = readEnv();

  return {
    configured: Boolean(env.databaseUrl),
    provider: 'postgresql'
  };
};
