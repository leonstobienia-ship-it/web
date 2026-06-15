import type { ServerResponse } from 'node:http';
import { sendJson } from '../health/health.routes.js';

export const handleFornecedores = (_method: string, res: ServerResponse): void => {
  sendJson(res, 501, {
    status: 'not_implemented',
    module: 'fornecedores',
    message: 'Modulo preparado para a fundacao V3.2; persistencia sera implementada em fase posterior.'
  });
};
