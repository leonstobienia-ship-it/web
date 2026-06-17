import { createMasterCadastroHandler } from '../common/masterCrud.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { methodNotAllowed, sendError, sendJson } from '../../http.js';
import { assertUuid } from '../aprovacoes/aprovacoes.service.js';
import { getOrcamentoVigentePorObra } from '../orcamentosObra/orcamentosObra.routes.js';

const handleObrasCrud = createMasterCadastroHandler({
  entityName: 'Obra',
  table: 'obras',
  basePath: '/obras',
  selectColumns: [
    'id',
    'company_id',
    'cliente_id',
    'centro_custo_id',
    'codigo',
    'nome',
    'endereco',
    'cidade',
    'uf',
    'responsavel',
    'data_inicio_prevista',
    'data_fim_prevista',
    'valor_previsto',
    'status',
    'observacoes',
    'created_at',
    'updated_at'
  ],
  fields: [
    { column: 'company_id', required: true, kind: 'uuid' },
    { column: 'cliente_id', kind: 'uuid' },
    { column: 'centro_custo_id', kind: 'uuid' },
    { column: 'codigo', required: true },
    { column: 'nome', required: true },
    { column: 'endereco' },
    { column: 'cidade' },
    { column: 'uf', kind: 'uf' },
    { column: 'responsavel' },
    { column: 'data_inicio_prevista', kind: 'date' },
    { column: 'data_fim_prevista', kind: 'date' },
    { column: 'valor_previsto', kind: 'number' },
    { column: 'observacoes' },
    { column: 'status', kind: 'status' }
  ],
  orderBy: 'codigo'
});

export const handleObras = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const method = req.method || 'GET';
  const relativePath = url.pathname === '/obras' ? '' : url.pathname.slice('/obras'.length);
  const parts = relativePath.split('/').filter(Boolean);

  if (parts.length === 2 && parts[1] === 'orcamento-vigente') {
    if (method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }
    try {
      const obraId = assertUuid(parts[0], 'id');
      const vigente = await getOrcamentoVigentePorObra(obraId);
      if (!vigente) {
        sendError(res, 404, 'not_found', 'Obra nao possui orcamento aprovado vigente.');
        return;
      }
      sendJson(res, 200, { data: vigente });
    } catch (error) {
      sendError(res, 400, 'validation_error', error instanceof Error ? error.message : String(error));
    }
    return;
  }

  await handleObrasCrud(req, res, url);
};
