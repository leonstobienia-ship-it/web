import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { EnacSistema } from '@enacSistema/components/EnacSistema';
import { SharePointEnacRepository } from '@enacSistema/services/SharePointEnacRepository';
import { SharePointFetchClient } from './sharePointFetchClient';
import './styles.css';

const clientId = import.meta.env.VITE_ENAC_ENTRA_CLIENT_ID || '0dab19b3-8e48-4f89-ad94-1446b08d3781';
const tenantId = import.meta.env.VITE_ENAC_ENTRA_TENANT_ID || 'enaccombr.onmicrosoft.com';
const siteUrl = import.meta.env.VITE_ENAC_SHAREPOINT_SITE_URL || 'https://enaccombr.sharepoint.com/sites/Equipe.Obras';
const sharePointOrigin = siteUrl ? new URL(siteUrl).origin : '';
const sharePointScope = import.meta.env.VITE_ENAC_SHAREPOINT_SCOPE || `${sharePointOrigin}/AllSites.Read`;

type WebSection = 'visao' | 'estrutura' | 'fluxos' | 'dados' | 'seguranca' | 'implantacao' | 'sistema';

interface IOperationalState {
  loading: boolean;
  error?: string;
  account?: AccountInfo;
  repository?: SharePointEnacRepository;
}

const sections: Array<{ key: WebSection; label: string }> = [
  { key: 'visao', label: 'Visão geral' },
  { key: 'estrutura', label: 'Estrutura' },
  { key: 'fluxos', label: 'Fluxos' },
  { key: 'dados', label: 'Listas SharePoint' },
  { key: 'seguranca', label: 'Entra e acesso' },
  { key: 'implantacao', label: 'Publicação' },
  { key: 'sistema', label: 'Sistema' }
];

const modules = [
  ['Clientes e obras', 'Cadastro base para separar solicitações por cliente, obra, centro de custo e local de entrega.'],
  ['Fornecedores', 'Base de fornecedores e dados de pagamento usados em cotações, pedidos e liberação financeira.'],
  ['Requisições', 'Entrada operacional do campo para materiais, serviços, locações, equipamentos, EPIs e documentos.'],
  ['Cotações', 'Registro de propostas, recomendação de fornecedor, prazo, frete e condição de pagamento.'],
  ['Aprovações', 'Alçadas parametrizadas por processo, tipo, obra, valor, aprovador principal e aprovador adicional.'],
  ['Pedidos, notas e pagamentos', 'Encadeamento de pedido de compra, nota fiscal, programação bancária e conclusão do pagamento.'],
  ['Administração', 'Usuários, perfis, alçadas, histórico de configuração e governança do sistema.']
];

const flows = [
  'Solicitação da obra',
  'Cotação',
  'Aprovação parametrizada',
  'Pedido de compra',
  'Execução da compra',
  'Nota fiscal',
  'Programação bancária',
  'Liberação bancária',
  'Pagamento concluído'
];

const lists = [
  ['Lista 01 - Controle de Obras ENAC', 'Obras, clientes, centro de custo e vínculos operacionais.'],
  ['Lista 02 — Requisições de Compra', 'Solicitações, status, aprovação necessária e snapshot de aprovação.'],
  ['Lista 03 — Pedidos de Compra', 'Pedidos gerados a partir das requisições aprovadas.'],
  ['Lista 04 - Notas Fiscais Recebidas', 'Notas fiscais, conferência, vencimento, fornecedor, obra e vínculo com pedido.'],
  ['Contas a pagar / programação financeira', 'Programação, forma de pagamento, origem, categoria e status.'],
  ['ENAC Usuarios Perfis', 'Perfis internos, status, conta Microsoft 365 e permissões de uso.'],
  ['ENAC Alcadas', 'Regras de aprovação por processo, tipo, valores e aprovadores.'],
  ['ENAC Historico Configuracoes', 'Auditoria administrativa e operacional.'],
  ['ENAC Snapshots Regras', 'Registro congelado da regra aplicada em aprovações.']
];

function getConfigError(): string | null {
  if (!clientId || clientId.indexOf('00000000-0000-0000-0000-000000000000') >= 0) {
    return 'Configure VITE_ENAC_ENTRA_CLIENT_ID.';
  }

  if (!tenantId || tenantId.indexOf('00000000-0000-0000-0000-000000000000') >= 0) {
    return 'Configure VITE_ENAC_ENTRA_TENANT_ID.';
  }

  if (!siteUrl || !sharePointOrigin) {
    return 'Configure VITE_ENAC_SHAREPOINT_SITE_URL.';
  }

  return null;
}

async function createOperationalState(): Promise<IOperationalState> {
  const configError = getConfigError();
  if (configError) {
    return { loading: false, error: configError };
  }

  const msal = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin
    },
    cache: {
      cacheLocation: 'sessionStorage'
    }
  });

  await msal.initialize();
  const redirectResult = await msal.handleRedirectPromise();
  const account = redirectResult?.account || msal.getAllAccounts()[0];

  if (!account) {
    await msal.loginRedirect({ scopes: [sharePointScope] });
    return { loading: true };
  }

  msal.setActiveAccount(account);

  const getAccessToken = async (): Promise<string> => {
    const activeAccount = msal.getActiveAccount() as AccountInfo;
    try {
      const result = await msal.acquireTokenSilent({ account: activeAccount, scopes: [sharePointScope] });
      return result.accessToken;
    } catch {
      await msal.acquireTokenRedirect({ account: activeAccount, scopes: [sharePointScope] });
      return '';
    }
  };

  return {
    loading: false,
    account,
    repository: new SharePointEnacRepository({
      siteUrl,
      spHttpClient: new SharePointFetchClient(getAccessToken)
    })
  };
}

function WebPortal(): JSX.Element {
  const [section, setSection] = React.useState<WebSection>('visao');
  const [operationalState, setOperationalState] = React.useState<IOperationalState>({ loading: false });

  const abrirSistema = async (): Promise<void> => {
    setSection('sistema');
    if (operationalState.account || operationalState.loading) {
      return;
    }

    setOperationalState({ loading: true });
    try {
      setOperationalState(await createOperationalState());
    } catch (error) {
      setOperationalState({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return (
    <div className="enac-web-shell">
      <aside className="enac-web-nav" aria-label="Navegação do Sistema ENAC">
        <div className="enac-web-brand">
          <strong>Sistema ENAC</strong>
          <span>Portal operacional web</span>
        </div>
        <nav>
          {sections.map((item) => (
            <button
              key={item.key}
              type="button"
              className={section === item.key ? 'is-active' : ''}
              onClick={() => item.key === 'sistema' ? abrirSistema() : setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="enac-web-main">
        {section !== 'sistema' && <ContentSection section={section} onOpenSystem={abrirSistema} />}
        {section === 'sistema' && <OperationalSection state={operationalState} onOpenSystem={abrirSistema} />}
      </main>
    </div>
  );
}

function ContentSection({ section, onOpenSystem }: { section: WebSection; onOpenSystem: () => void }): JSX.Element {
  if (section === 'estrutura') {
    return (
      <Page title="Estrutura do Projeto" eyebrow="Arquitetura preservada">
        <div className="enac-web-grid">
          {modules.map(([title, description]) => (
            <article className="enac-web-card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </Page>
    );
  }

  if (section === 'fluxos') {
    return (
      <Page title="Fluxo Operacional" eyebrow="MVP de compras e pagamento">
        <ol className="enac-web-flow">
          {flows.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </Page>
    );
  }

  if (section === 'dados') {
    return (
      <Page title="Listas SharePoint" eyebrow="Fonte oficial de dados">
        <table className="enac-web-table">
          <thead><tr><th>Lista</th><th>Uso no sistema</th></tr></thead>
          <tbody>
            {lists.map(([title, description]) => <tr key={title}><td>{title}</td><td>{description}</td></tr>)}
          </tbody>
        </table>
      </Page>
    );
  }

  if (section === 'seguranca') {
    return (
      <Page title="Microsoft Entra e Acesso" eyebrow="Identidade e segurança">
        <div className="enac-web-grid enac-web-grid--two">
          <article className="enac-web-card"><h3>Login corporativo</h3><p>O portal usa MSAL no navegador e autenticação Microsoft Entra para identificar o usuário.</p></article>
          <article className="enac-web-card"><h3>Permissão por perfil</h3><p>A visibilidade de módulos depende do cadastro em ENAC Usuarios Perfis e das permissões finas no SharePoint.</p></article>
          <article className="enac-web-card"><h3>SharePoint REST</h3><p>As chamadas usam token Bearer delegado e mantêm as listas SharePoint como origem oficial.</p></article>
          <article className="enac-web-card"><h3>Escrita controlada</h3><p>As rotas de escrita continuam protegidas por flags, modo de teste, marcadores e confirmação manual.</p></article>
        </div>
      </Page>
    );
  }

  if (section === 'implantacao') {
    return (
      <Page title="Publicação Netlify" eyebrow="Site web independente da webpart">
        <div className="enac-web-steps">
          <p><strong>Build:</strong> <code>npm run web:build</code></p>
          <p><strong>Publicação:</strong> diretório <code>dist-web</code></p>
          <p><strong>Variáveis:</strong> configurar <code>VITE_ENAC_ENTRA_CLIENT_ID</code>, <code>VITE_ENAC_ENTRA_TENANT_ID</code> e <code>VITE_ENAC_SHAREPOINT_SITE_URL</code> no Netlify.</p>
          <p><strong>Redirect URI:</strong> cadastrar a URL do site Netlify no app registration do Microsoft Entra.</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Sistema Operacional ENAC" eyebrow="Da webpart ao portal web">
      <section className="enac-web-hero">
        <div>
          <p>
            Este portal reúne a documentação operacional, a estrutura técnica e o acesso ao sistema
            que usa listas SharePoint como fonte de dados e Microsoft Entra como identidade.
          </p>
          <button type="button" onClick={onOpenSystem}>Abrir sistema</button>
        </div>
        <dl>
          <div><dt>Origem dos dados</dt><dd>SharePoint Lists</dd></div>
          <div><dt>Identidade</dt><dd>Microsoft Entra</dd></div>
          <div><dt>Publicação</dt><dd>Netlify</dd></div>
          <div><dt>Base preservada</dt><dd>React + modelos ENAC</dd></div>
        </dl>
      </section>
    </Page>
  );
}

function Page({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="enac-web-page">
      <p className="enac-web-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </section>
  );
}

function OperationalSection({ state, onOpenSystem }: { state: IOperationalState; onOpenSystem: () => void }): JSX.Element {
  if (state.loading) {
    return <Page title="Sistema ENAC" eyebrow="Carregando"><p>Preparando autenticação Microsoft Entra.</p></Page>;
  }

  if (state.error || !state.account || !state.repository) {
    return (
      <Page title="Sistema ENAC" eyebrow="Configuração necessária">
        <div className="enac-web-alert">
          <strong>{state.error || 'A autenticação ainda não foi iniciada.'}</strong>
          <p>Configure as variáveis no ambiente local ou no Netlify e cadastre a URL de retorno no Microsoft Entra.</p>
          <button type="button" onClick={onOpenSystem}>Tentar novamente</button>
        </div>
      </Page>
    );
  }

  return (
    <EnacSistema
      currentUserName={state.account.name || state.account.username || 'Usuario ENAC'}
      currentUserEmail={state.account.username}
      currentUserPerfil="Campo"
      origemDados="sharepoint"
      diagnosticoReadonly={true}
      repository={state.repository}
      siteUrl={siteUrl}
    />
  );
}

ReactDOM.render(<WebPortal />, document.getElementById('root'));
