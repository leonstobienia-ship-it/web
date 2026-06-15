import * as React from 'react';
import { erpApi } from '../../../services/erpApi';
import { CadastroResourcePage } from '../CadastroResourcePage';
import type { CadastroResourceConfig } from '../types';

interface ClientesCadastroProps {
  companyId: string;
}

export function ClientesCadastro({ companyId }: ClientesCadastroProps): JSX.Element {
  const config = React.useMemo<CadastroResourceConfig>(() => ({
    singular: 'cliente',
    plural: 'Clientes',
    emptyText: 'Nenhum cliente cadastrado no PostgreSQL local.',
    initialValues: {
      company_id: companyId,
      nome: '',
      tipo_pessoa: 'juridica',
      cpf_cnpj: '',
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
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'telefone', label: 'Telefone', type: 'tel' },
      { name: 'endereco', label: 'Endereço' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' }
    ],
    columns: [
      { key: 'nome', label: 'Nome' },
      { key: 'tipo_pessoa', label: 'Tipo' },
      { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'status', label: 'Status' }
    ],
    list: erpApi.clientes.list,
    create: erpApi.clientes.create,
    update: erpApi.clientes.update,
    inativar: erpApi.clientes.inativar,
    reativar: erpApi.clientes.reativar
  }), [companyId]);

  return <CadastroResourcePage config={config} />;
}
