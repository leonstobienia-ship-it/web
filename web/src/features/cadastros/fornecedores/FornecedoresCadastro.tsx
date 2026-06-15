import * as React from 'react';
import { erpApi } from '../../../services/erpApi';
import { CadastroResourcePage } from '../CadastroResourcePage';
import type { CadastroResourceConfig } from '../types';

interface FornecedoresCadastroProps {
  companyId: string;
}

export function FornecedoresCadastro({ companyId }: FornecedoresCadastroProps): JSX.Element {
  const config = React.useMemo<CadastroResourceConfig>(() => ({
    singular: 'fornecedor',
    plural: 'Fornecedores',
    emptyText: 'Nenhum fornecedor cadastrado no PostgreSQL local.',
    initialValues: {
      company_id: companyId,
      nome: '',
      tipo_pessoa: 'juridica',
      cpf_cnpj: '',
      categoria: 'geral',
      email: '',
      telefone: '',
      endereco: '',
      observacoes: ''
    },
    fields: [
      { name: 'company_id', label: 'Empresa', type: 'hidden', required: true },
      { name: 'nome', label: 'Nome', required: true },
      {
        name: 'tipo_pessoa',
        label: 'Tipo de pessoa',
        type: 'select',
        required: true,
        options: [
          { value: 'juridica', label: 'Pessoa jurídica' },
          { value: 'fisica', label: 'Pessoa física' }
        ]
      },
      { name: 'cpf_cnpj', label: 'CPF/CNPJ' },
      { name: 'categoria', label: 'Categoria', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'telefone', label: 'Telefone', type: 'tel' },
      { name: 'endereco', label: 'Endereço' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' }
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'tipo_pessoa', label: 'Tipo' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
      { key: 'email', label: 'E-mail' },
      { key: 'status', label: 'Status' }
    ],
    list: erpApi.fornecedores.list,
    create: erpApi.fornecedores.create,
    update: erpApi.fornecedores.update,
    inativar: erpApi.fornecedores.inativar,
    reativar: erpApi.fornecedores.reativar
  }), [companyId]);

  return <CadastroResourcePage config={config} />;
}
