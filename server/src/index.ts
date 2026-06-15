import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { handleCentrosCusto } from './modules/centrosCusto/centrosCusto.routes.js';
import { handleClientes } from './modules/clientes/clientes.routes.js';
import { handleEmpresas } from './modules/empresas/empresas.routes.js';
import { handleFornecedores } from './modules/fornecedores/fornecedores.routes.js';
import { handleHealth, handleHealthDb, sendJson } from './modules/health/health.routes.js';
import { handleObras } from './modules/obras/obras.routes.js';
import { handleUsuarios } from './modules/usuarios/usuarios.routes.js';
import type { ServerResponse } from 'node:http';

type RouteHandler = (method: string, res: ServerResponse) => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
  '/health': handleHealth,
  '/health/db': handleHealthDb,
  '/empresas': handleEmpresas,
  '/usuarios': handleUsuarios,
  '/clientes': handleClientes,
  '/fornecedores': handleFornecedores,
  '/obras': handleObras,
  '/centros-custo': handleCentrosCusto
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

  Promise.resolve(handler(req.method || 'GET', res)).catch((error) => {
    sendJson(res, 500, {
      status: 'error',
      service: 'enac-erp-api',
      message: error instanceof Error ? error.message : String(error)
    });
  });
});

server.listen(env.port, () => {
  console.info(`enac-erp-api listening on port ${env.port} (${env.environment})`);
});
