import { createMasterCadastroHandler } from '../common/masterCrud.js';

export const handleCentrosCusto = createMasterCadastroHandler({
  entityName: 'Centro de custo',
  table: 'centros_custo',
  basePath: '/centros-custo',
  selectColumns: [
    'id',
    'company_id',
    'codigo',
    'nome',
    'tipo',
    'conta_analitica',
    'observacoes',
    'status',
    'created_at',
    'updated_at'
  ],
  fields: [
    { column: 'company_id', required: true, kind: 'uuid' },
    { column: 'codigo', required: true },
    { column: 'nome', required: true },
    {
      column: 'tipo',
      required: true,
      kind: 'enum',
      enumValues: ['administrativo', 'obra', 'operacional', 'financeiro', 'comercial']
    },
    { column: 'conta_analitica' },
    { column: 'observacoes' },
    { column: 'status', kind: 'status' }
  ],
  orderBy: 'codigo'
});
