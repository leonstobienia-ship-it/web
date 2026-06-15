import * as React from 'react';
import { erpApi, type EmpresaApi } from '../../services/erpApi';
import { CentrosCustoCadastro } from './centrosCusto/CentrosCustoCadastro';
import { ClientesCadastro } from './clientes/ClientesCadastro';
import { FornecedoresCadastro } from './fornecedores/FornecedoresCadastro';
import { ObrasCadastro } from './obras/ObrasCadastro';

type CadastroTab = 'clientes' | 'fornecedores' | 'centros-custo' | 'obras';

const cadastroTabs: Array<{ key: CadastroTab; label: string }> = [
  { key: 'clientes', label: 'Clientes' },
  { key: 'fornecedores', label: 'Fornecedores' },
  { key: 'centros-custo', label: 'Centros de custo' },
  { key: 'obras', label: 'Obras' }
];

export function CadastrosOperacionais(): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<CadastroTab>('clientes');
  const [empresas, setEmpresas] = React.useState<EmpresaApi[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    erpApi.empresas.list()
      .then((response) => {
        setEmpresas(response);
        setError('');
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      })
      .finally(() => setLoading(false));
  }, []);

  const empresa = empresas[0];

  return (
    <section className="enac-web-page enac-cadastros-page">
      <p className="enac-web-eyebrow">PostgreSQL local</p>
      <h1>Cadastros mestres operacionais</h1>
      <p className="enac-web-lead">
        Operação local de clientes, fornecedores, centros de custo e obras com API Node.js e banco PostgreSQL de desenvolvimento.
      </p>

      {loading && <div className="enac-cadastro-empty">Carregando empresa local.</div>}
      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      {!loading && !error && !empresa && (
        <div className="enac-web-alert enac-web-alert--compact">
          Nenhuma empresa local encontrada. Rode a seed local antes de operar os cadastros.
        </div>
      )}

      {empresa && (
        <>
          <div className="enac-cadastros-context">
            <strong>{empresa.nome_fantasia || empresa.razao_social}</strong>
            <span>{empresa.cnpj}</span>
          </div>
          <div className="enac-cadastros-tabs" role="tablist" aria-label="Cadastros mestres">
            {cadastroTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'clientes' && <ClientesCadastro companyId={empresa.id} />}
          {activeTab === 'fornecedores' && <FornecedoresCadastro companyId={empresa.id} />}
          {activeTab === 'centros-custo' && <CentrosCustoCadastro companyId={empresa.id} />}
          {activeTab === 'obras' && <ObrasCadastro companyId={empresa.id} />}
        </>
      )}
    </section>
  );
}
