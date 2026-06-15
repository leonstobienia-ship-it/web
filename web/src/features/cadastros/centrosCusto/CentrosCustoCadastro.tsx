import * as React from 'react';
import { erpApi } from '../../../services/erpApi';
import { CadastroResourcePage } from '../CadastroResourcePage';
import type { CadastroResourceConfig } from '../types';

interface CentrosCustoCadastroProps {
  companyId: string;
}

export function CentrosCustoCadastro({ companyId }: CentrosCustoCadastroProps): JSX.Element {
  const config = React.useMemo<CadastroResourceConfig>(() => ({
    singular: 'centro de custo',
    plural: 'Centros de custo',
    emptyText: 'Nenhum centro de custo cadastrado no PostgreSQL local.',
    initialValues: {
      company_id: companyId,
      codigo: '',
      nome: '',
      tipo: 'obra',
      conta_analitica: '',
      observacoes: ''
    },
    fields: [
      { name: 'company_id', label: 'Empresa', type: 'hidden', required: true },
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'obra', label: 'Obra' },
          { value: 'administrativo', label: 'Administrativo' },
          { value: 'operacional', label: 'Operacional' },
          { value: 'financeiro', label: 'Financeiro' },
          { value: 'comercial', label: 'Comercial' }
        ]
      },
      { name: 'conta_analitica', label: 'Conta analítica' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' }
    ],
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'conta_analitica', label: 'Conta analítica' },
      { key: 'status', label: 'Status' }
    ],
    list: erpApi.centrosCusto.list,
    create: erpApi.centrosCusto.create,
    update: erpApi.centrosCusto.update,
    inativar: erpApi.centrosCusto.inativar,
    reativar: erpApi.centrosCusto.reativar
  }), [companyId]);

  return <CadastroResourcePage config={config} />;
}
