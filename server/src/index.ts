import { createServer } from 'node:http';
import { readEnv } from './config/env.js';
import { handleCentrosCusto } from './modules/centrosCusto/centrosCusto.routes.js';
import { handleClientes } from './modules/clientes/clientes.routes.js';
import { handleEmpresas } from './modules/empresas/empresas.routes.js';
import { handleFornecedores } from './modules/fornecedores/fornecedores.routes.js';
import { handleHealth, handleHealthDb, sendJson } from './modules/health/health.routes.js';
import { handleObras } from './modules/obras/obras.routes.js';
import { handleUsuarios } from './modules/usuarios/usuarios.routes.js';
import { sendNoContent } from './http.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type RouteHandler = (req: IncomingMessage, res: ServerResponse, url: URL) => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
  '/health': (req, res) => handleHealth(req.method || 'GET', res),
  '/health/db': (req, res) => handleHealthDb(req.method || 'GET', res),
  '/empresas': (req, res) => handleEmpresas(req.method || 'GET', res),
  '/usuarios': (req, res) => handleUsuarios(req.method || 'GET', res)
};

const prefixedRoutes: Array<{ basePath: string; handler: RouteHandler }> = [
  { basePath: '/clientes', handler: handleClientes },
  { basePath: '/fornecedores', handler: handleFornecedores },
  { basePath: '/obras', handler: handleObras },
  { basePath: '/centros-custo', handler: handleCentrosCusto }
];

const findHandler = (pathname: string): RouteHandler | undefined => {
  const exactHandler = routes[pathname];
  if (exactHandler) {
    return exactHandler;
  }

  return prefixedRoutes.find((route) => pathname === route.basePath || pathname.startsWith(`${route.basePath}/`))?.handler;
};

const env = readEnv();

const server = createServer((req, res) => {
  if ((req.method || '').toUpperCase() === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const handler = findHandler(url.pathname);

  if (!handler) {
    sendJson(res, 404, {
      status: 'not_found',
      service: 'enac-erp-api',
      path: url.pathname
    });
    return;
  }

  Promise.resolve(handler(req, res, url)).catch((error) => {
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
