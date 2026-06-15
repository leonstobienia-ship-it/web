import { createMasterCadastroHandler } from '../common/masterCrud.js';

export const handleObras = createMasterCadastroHandler({
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
