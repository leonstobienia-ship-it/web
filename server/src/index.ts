import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { handleClientes } from './modules/clientes/clientes.routes.js';
import { handleFornecedores } from './modules/fornecedores/fornecedores.routes.js';
import { handleHealth, sendJson } from './modules/health/health.routes.js';
import { handleObras } from './modules/obras/obras.routes.js';

type RouteHandler = (method: string, res: Parameters<typeof handleHealth>[1]) => void;

const routes: Record<string, RouteHandler> = {
  '/health': handleHealth,
  '/clientes': handleClientes,
  '/fornecedores': handleFornecedores,
  '/obras': handleObras
};

const env = readEnv();

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const handler = routes[url.pathname];

  if (!handler) {
    sendJson(res, 404, {
      status: 'not_found',
      service: 'enac-erp-api',
      path: url.pathname
    });
    return;
  }

  handler(req.method || 'GET', res);
});

server.listen(env.port, () => {
  console.info(`enac-erp-api listening on port ${env.port} (${env.environment})`);
});
