import * as React from 'react';
import { erpApi, type CadastroRecord, type CentroCustoApi, type ClienteApi } from '../../../services/erpApi';
import { CadastroResourcePage } from '../CadastroResourcePage';
import type { CadastroOption, CadastroResourceConfig } from '../types';

interface ObrasCadastroProps {
  companyId: string;
}

const ufOptions: CadastroOption[] = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
].map((uf) => ({ value: uf, label: uf }));

const toOptions = (records: Array<ClienteApi | CentroCustoApi>, getLabel: (record: ClienteApi | CentroCustoApi) => string): CadastroOption[] =>
  records.map((record) => ({ value: record.id, label: getLabel(record) }));

export function ObrasCadastro({ companyId }: ObrasCadastroProps): JSX.Element {
  const [clientes, setClientes] = React.useState<ClienteApi[]>([]);
  const [centrosCusto, setCentrosCusto] = React.useState<CentroCustoApi[]>([]);
  const [optionsError, setOptionsError] = React.useState<string>('');

  React.useEffect(() => {
    let active = true;

    Promise.all([erpApi.clientes.list(), erpApi.centrosCusto.list()])
      .then(([clientesResponse, centrosResponse]) => {
        if (!active) {
          return;
        }
        setClientes(clientesResponse);
        setCentrosCusto(centrosResponse);
        setOptionsError('');
      })
      .catch((error) => {
        if (active) {
          setOptionsError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const clienteOptions = React.useMemo(
    () => toOptions(clientes, (record) => `${record.nome}${record.status === 'inativo' ? ' (inativo)' : ''}`),
    [clientes]
  );
  const centroCustoOptions = React.useMemo(
    () => toOptions(centrosCusto, (record) => `${record.codigo} - ${record.nome}${record.status === 'inativo' ? ' (inativo)' : ''}`),
    [centrosCusto]
  );

  const config = React.useMemo<CadastroResourceConfig>(() => ({
    singular: 'obra',
    plural: 'Obras',
    emptyText: 'Nenhuma obra cadastrada no PostgreSQL local.',
    initialValues: {
      company_id: companyId,
      cliente_id: '',
      centro_custo_id: '',
      codigo: '',
      nome: '',
      endereco: '',
      cidade: '',
      uf: '',
      responsavel: '',
      data_inicio_prevista: '',
      data_fim_prevista: '',
      valor_previsto: '',
      observacoes: ''
    },
    fields: [
      { name: 'company_id', label: 'Empresa', type: 'hidden', required: true },
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'cliente_id', label: 'Cliente', type: 'select', options: clienteOptions },
      { name: 'centro_custo_id', label: 'Centro de custo', type: 'select', options: centroCustoOptions },
      { name: 'endereco', label: 'Endereço' },
      { name: 'cidade', label: 'Cidade' },
      { name: 'uf', label: 'UF', type: 'select', options: ufOptions },
      { name: 'responsavel', label: 'Responsável' },
      { name: 'data_inicio_prevista', label: 'Início previsto', type: 'date' },
      { name: 'data_fim_prevista', label: 'Fim previsto', type: 'date' },
      { name: 'valor_previsto', label: 'Valor previsto', type: 'number', step: '0.01' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' }
    ],
    columns: [
      { key: 'codigo', label: 'Código' },
      { key: 'nome', label: 'Nome' },
      { key: 'cliente_id', label: 'Cliente', format: (record: CadastroRecord) => clientes.find((cliente) => cliente.id === record.cliente_id)?.nome || '-' },
      {
        key: 'centro_custo_id',
        label: 'Centro de custo',
        format: (record: CadastroRecord) => {
          const centro = centrosCusto.find((item) => item.id === record.centro_custo_id);
          return centro ? `${centro.codigo} - ${centro.nome}` : '-';
        }
      },
      { key: 'uf', label: 'UF' },
      { key: 'status', label: 'Status' }
    ],
    list: erpApi.obras.list,
    create: erpApi.obras.create,
    update: erpApi.obras.update,
    inativar: erpApi.obras.inativar,
    reativar: erpApi.obras.reativar
  }), [centroCustoOptions, centrosCusto, clienteOptions, clientes, companyId]);

  return (
    <>
      {optionsError && <div className="enac-web-alert enac-web-alert--compact">{optionsError}</div>}
      <CadastroResourcePage config={config} />
    </>
  );
}
