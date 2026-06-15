import { createMasterCadastroHandler } from '../common/masterCrud.js';

export const handleFornecedores = createMasterCadastroHandler({
  entityName: 'Fornecedor',
  table: 'fornecedores',
  basePath: '/fornecedores',
  selectColumns: [
    'id',
    'company_id',
    'nome',
    'tipo_pessoa',
    'cpf_cnpj',
    'categoria',
    'email',
    'telefone',
    'endereco',
    'contato',
    'pix',
    'dados_bancarios',
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
    { column: 'categoria', required: true },
    { column: 'email' },
    { column: 'telefone' },
    { column: 'endereco' },
    { column: 'contato' },
    { column: 'pix' },
    { column: 'dados_bancarios' },
    { column: 'observacoes' },
    { column: 'status', kind: 'status' }
  ],
  orderBy: 'nome'
});
