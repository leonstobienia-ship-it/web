import { createMasterCadastroHandler } from '../common/masterCrud.js';

export const handleClientes = createMasterCadastroHandler({
  entityName: 'Cliente',
  table: 'clientes',
  basePath: '/clientes',
  selectColumns: [
    'id',
    'company_id',
    'nome',
    'tipo_pessoa',
    'cpf_cnpj',
    'email',
    'telefone',
    'endereco',
    'responsavel',
    'observacoes',
    'status',
    'created_at',
    'updated_at'
  ],
  fields: [
    { column: 'company_id', required: true, kind: 'uuid' },
    { column: 'nome', required: true },
    { column: 'tipo_pessoa', required: true, kind: 'tipo_pessoa' },
    { column: 'cpf_cnpj' },
    { column: 'email', kind: 'email' },
    { column: 'telefone' },
    { column: 'endereco' },
    { column: 'responsavel' },
    { column: 'observacoes' },
    { column: 'status', kind: 'status' }
  ],
  orderBy: 'nome'
});
