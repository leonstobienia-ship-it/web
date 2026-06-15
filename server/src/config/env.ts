export interface ServerEnv {
  port: number;
  environment: string;
  databaseUrl?: string;
}

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value || 3333);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3333;
};

export const readEnv = (): ServerEnv => ({
  port: parsePort(process.env.PORT),
  environment: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL
});
