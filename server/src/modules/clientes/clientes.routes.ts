import type { ServerResponse } from 'node:http';
import { sendJson } from '../health/health.routes.js';

export const handleClientes = (_method: string, res: ServerResponse): void => {
  sendJson(res, 501, {
    status: 'not_implemented',
    module: 'clientes',
    message: 'Modulo preparado para a fundacao V3.2; persistencia sera implementada em fase posterior.'
  });
};
