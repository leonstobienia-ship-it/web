import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { EnacSistema } from '@enacSistema/components/EnacSistema';
import { SharePointEnacRepository } from '@enacSistema/services/SharePointEnacRepository';
import { SharePointFetchClient } from './sharePointFetchClient';
import { AcessosPage } from './features/acessos/AcessosPage';
import { AuditoriaLogsPage } from './features/auditoria/AuditoriaLogsPage';
import { CadastrosOperacionais } from './features/cadastros/CadastrosOperacionais';
import { CentralTarefasPage } from './features/centralTarefas/CentralTarefasPage';
import { ContasPagarPage } from './features/contasPagar/ContasPagarPage';
import { ContratosObraPage } from './features/contratosObra/ContratosObraPage';
import { CotacoesMapaPage } from './features/cotacoes/CotacoesMapaPage';
import { DashboardExecutivoPage } from './features/dashboardExecutivo/DashboardExecutivoPage';
import { DocumentosAnexosPage } from './features/documentos/DocumentosAnexosPage';
import { HomologacaoPage } from './features/homologacao/HomologacaoPage';
import { MedicoesFaturamentoPage } from './features/medicoesFaturamento/MedicoesFaturamentoPage';
import { NotasEntradaPage } from './features/notasEntrada/NotasEntradaPage';
import { OrcamentosPlanejamentoPage } from './features/orcamentosPlanejamento/OrcamentosPlanejamentoPage';
import { PedidosCompraPage } from './features/pedidosCompra/PedidosCompraPage';
import { PrevistoRealizadoPage } from './features/previstoRealizado/PrevistoRealizadoPage';
import { ProgramacoesPagamentoPage } from './features/programacoesPagamento/ProgramacoesPagamentoPage';
import { RelatoriosFinanceirosPage } from './features/relatoriosFinanceiros/RelatoriosFinanceirosPage';
import { RiscosPendenciasPage } from './features/riscosPendencias/RiscosPendenciasPage';
import { SolicitacoesCompraPage } from './features/solicitacoesCompra/SolicitacoesCompraPage';
import { EnacIcon, type EnacIconName } from './components/EnacIcon';
import enacLogoUrl from './assets/enac-logo-oficial.png';
import './styles.css';

const readonlyInventoryClientId = '0dab19b3-8e48-4f89-ad94-1446b08d3781';
const clientId = import.meta.env.VITE_ENAC_ENTRA_CLIENT_ID || '0dab19b3-8e48-4f89-ad94-1446b08d3781';
const tenantId = import.meta.env.VITE_ENAC_ENTRA_TENANT_ID || 'enaccombr.onmicrosoft.com';
const siteUrl = import.meta.env.VITE_ENAC_SHAREPOINT_SITE_URL || 'https://enaccombr.sharepoint.com/sites/Equipe.Obras';
const sharePointOrigin = siteUrl ? new URL(siteUrl).origin : '';
const sharePointScope = import.meta.env.VITE_ENAC_SHAREPOINT_SCOPE || `${sharePointOrigin}/AllSites.Read`;
const redirectUri = import.meta.env.VITE_ENAC_REDIRECT_URI ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://localhost:${window.location.port || '5173'}/`
    : window.location.origin);
const escritaWebV30BSolicitada = import.meta.env.VITE_ENAC_HABILITAR_ESCRITA_REQUISICAO_V30B === 'true';
const modoTesteWebV30BSolicitado = import.meta.env.VITE_ENAC_MODO_TESTE_WEB_V30B === 'true';
const confirmacaoWebV30B = import.meta.env.VITE_ENAC_CONFIRMACAO_MANUAL_V30B || '';
const usandoAppReadonlyInventario = clientId.toLowerCase() === readonlyInventoryClientId.toLowerCase();
const escopoEscritaWebV30B = /\/AllSites\.(Write|Manage|FullControl)$/i.test(sharePointScope);
const bloqueiosEscritaWebV30B = [
  escritaWebV30BSolicitada && usandoAppReadonlyInventario ? 'ClientId configurado e o aplicativo readonly de inventario; use um app separado de escrita.' : '',
  escritaWebV30BSolicitada && !escopoEscritaWebV30B ? 'Escopo SharePoint nao e de escrita; configure AllSites.Write, AllSites.Manage ou equivalente aprovado.' : '',
  escritaWebV30BSolicitada && !modoTesteWebV30BSolicitado ? 'Modo de teste V3.0b nao esta habilitado.' : '',
  escritaWebV30BSolicitada && confirmacaoWebV30B !== 'CONFIRMAR-ESCRITA-WEB-V3.0B-ENAC' ? 'Confirmacao manual V3.0b ausente ou divergente.' : ''
].filter(Boolean);
const escritaWebV30BLiberada = escritaWebV30BSolicitada && bloqueiosEscritaWebV30B.length === 0;
const flagsEscritaWebV30B = {
  habilitarEscritaRequisicaoV30B: escritaWebV30BLiberada,
  modoTesteWebV30B: escritaWebV30BLiberada,
  exigirConfirmacaoManualV30B: true,
  confirmacaoManualV30B: escritaWebV30BLiberada ? confirmacaoWebV30B : '',
  marcadorTesteWebV30B: 'V3.0B-WEB-TESTE' as const,
  registrarHistoricoWebV30B: import.meta.env.VITE_ENAC_REGISTRAR_HISTORICO_WEB_V30B === 'true'
};

type WebSection =
  | 'visao'
  | 'cadastros'
  | 'solicitacoes-compra'
  | 'cotacoes'
  | 'pedidos-compra'
  | 'notas-entrada'
  | 'contas-pagar'
  | 'programacoes-pagamento'
  | 'relatorios-financeiros'
  | 'contratos-obra'
  | 'orcamentos-planejamento'
  | 'planejamento-executivo'
  | 'medicoes-faturamento'
  | 'previsto-realizado'
  | 'dashboard-executivo'
  | 'riscos-pendencias'
  | 'central-tarefas'
  | 'homologacao'
  | 'auditoria'
  | 'documentos'
  | 'administracao'
  | 'estrutura'
  | 'mvp'
  | 'fluxos'
  | 'dados'
  | 'seguranca'
  | 'implantacao'
  | 'sistema';

interface IOperationalState {
  loading: boolean;
  error?: string;
  account?: AccountInfo;
  repository?: SharePointEnacRepository;
}

interface IWebErrorBoundaryState {
  error?: string;
}

class WebErrorBoundary extends React.Component<{ children: React.ReactNode }, IWebErrorBoundaryState> {
  public state: IWebErrorBoundaryState = {};

  public static getDerivedStateFromError(error: Error): IWebErrorBoundaryState {
    return { error: error.message || String(error) };
  }

  public componentDidCatch(error: Error): void {
    // Keep the portal visible and expose the error in the UI during web validation.
    console.error('Sistema ENAC web runtime error', error);
  }

  public render(): React.ReactNode {
    if (this.state.error) {
      return (
        <Page title="Sistema ENAC" eyebrow="Erro de execução">
          <div className="enac-web-alert">
            <strong>O sistema encontrou um erro ao abrir o módulo operacional.</strong>
            <p>{this.state.error}</p>
            <p>Recarregue a página após ajustar a autenticação ou envie esta mensagem para diagnóstico.</p>
          </div>
        </Page>
      );
    }

    return this.props.children;
  }
}

interface ISectionItem {
  key: WebSection;
  icon: EnacIconName;
  label: string;
  shortLabel?: string;
  description: string;
  profile: string;
}

interface ISectionGroup {
  title: string;
  icon: EnacIconName;
  tone: string;
  items: ISectionItem[];
}

type UserProfileKey = 'Campo' | 'Diretoria' | 'Planejamento' | 'Compras' | 'Financeiro' | 'Admin';

interface IUserProfileOption {
  key: UserProfileKey;
  userName: string;
  profileLabel: string;
  description: string;
}

const userProfileOptions: IUserProfileOption[] = [
  { key: 'Campo', userName: 'Leon Estevão Stobienia', profileLabel: 'Campo / Engenharia', description: 'Homologação local com foco operacional de obra' },
  { key: 'Diretoria', userName: 'Leon Estevão Stobienia', profileLabel: 'Diretoria / Decisão', description: 'Indicadores, aprovações e visão executiva' },
  { key: 'Planejamento', userName: 'Gustavo', profileLabel: 'Planejamento / Engenharia', description: 'Contratos, orçamento, medições e desvios' },
  { key: 'Compras', userName: 'Matheus', profileLabel: 'Compras / Suprimentos', description: 'Solicitações, cotações, pedidos e fornecedores' },
  { key: 'Financeiro', userName: 'Matheus', profileLabel: 'Financeiro / Controladoria', description: 'Notas, contas, programação e relatórios financeiros' },
  { key: 'Admin', userName: 'Admin teste', profileLabel: 'Administração / Acessos', description: 'Usuários, perfis, escopos, alçadas e auditoria' }
];

const sectionGroups: ISectionGroup[] = [
  {
    title: 'Operação',
    icon: 'operations',
    tone: 'Rotina e fila de trabalho',
    items: [
      { key: 'visao', icon: 'home', label: 'Visão geral', description: 'Mapa executivo e entrada por perfil', profile: 'Todos' },
      { key: 'central-tarefas', icon: 'tasks', label: 'Central de Tarefas', description: 'Fila de aprovações, pendências e ações manuais', profile: 'Todos' },
      { key: 'riscos-pendencias', icon: 'warning', label: 'Riscos e Pendências', description: 'Bloqueios operacionais e histórico de tratativas', profile: 'Campo' },
      { key: 'documentos', icon: 'documents', label: 'Documentos e Anexos', description: 'Referências documentais locais e vínculos por entidade', profile: 'Documentos' }
    ]
  },
  {
    title: 'Compras',
    icon: 'shopping',
    tone: 'Solicitação até pedido',
    items: [
      { key: 'cadastros', icon: 'registry', label: 'Cadastros', description: 'Empresas, obras, fornecedores e centros de custo', profile: 'Compras' },
      { key: 'solicitacoes-compra', icon: 'clipboard', label: 'Solicitações de Compra', shortLabel: 'Solicitações', description: 'Demandas de obra e compras internas', profile: 'Campo' },
      { key: 'cotacoes', icon: 'compare', label: 'Cotações', description: 'Mapa comparativo e escolha de fornecedor', profile: 'Compras' },
      { key: 'pedidos-compra', icon: 'cart', label: 'Pedidos de Compra', shortLabel: 'Pedidos', description: 'Formalização de compra aprovada', profile: 'Compras' }
    ]
  },
  {
    title: 'Financeiro',
    icon: 'finance',
    tone: 'Contas, programação e relatório',
    items: [
      { key: 'notas-entrada', icon: 'invoice', label: 'Notas Fiscais de Entrada', shortLabel: 'Notas Fiscais', description: 'Registro de documentos fiscais recebidos', profile: 'Financeiro' },
      { key: 'contas-pagar', icon: 'payable', label: 'Contas a Pagar', description: 'Provisionamento, aprovação e baixa manual controlada', profile: 'Financeiro' },
      { key: 'programacoes-pagamento', icon: 'calendar', label: 'Programações de Pagamento', shortLabel: 'Programações', description: 'Programação interna sem execução bancária', profile: 'Financeiro' },
      { key: 'relatorios-financeiros', icon: 'report', label: 'Relatórios Financeiros', shortLabel: 'Relatórios', description: 'Leitura gerencial de contas e baixas manuais', profile: 'Financeiro' }
    ]
  },
  {
    title: 'Obras',
    icon: 'projects',
    tone: 'Contrato, orçamento e medição',
    items: [
      { key: 'contratos-obra', icon: 'contract', label: 'Contratos de Obra', shortLabel: 'Contratos', description: 'Contrato vendido, escopo e aditivos', profile: 'Planejamento' },
      { key: 'orcamentos-planejamento', icon: 'budget', label: 'Orçamentos', description: 'Orçamento base, pacotes e cronograma', profile: 'Planejamento' },
      { key: 'planejamento-executivo', icon: 'timeline', label: 'Planejamento Executivo', description: 'Etapas, datas e responsáveis da execução', profile: 'Planejamento' },
      { key: 'medicoes-faturamento', icon: 'ruler', label: 'Medições e Faturamento', shortLabel: 'Medições', description: 'Medições, pedidos e faturamento manual', profile: 'Planejamento' },
      { key: 'previsto-realizado', icon: 'chart', label: 'Previsto x Realizado', description: 'Margem, curva mensal e desvios por obra', profile: 'Diretoria' }
    ]
  },
  {
    title: 'Gestão',
    icon: 'analytics',
    tone: 'Indicadores e governança',
    items: [
      { key: 'dashboard-executivo', icon: 'dashboard', label: 'Dashboard Executivo', shortLabel: 'Dashboard', description: 'Visão de diretoria, margem e alertas críticos', profile: 'Diretoria' },
      { key: 'homologacao', icon: 'check', label: 'Homologação', description: 'Seed local e roteiros de validação por perfil', profile: 'Todos' },
      { key: 'auditoria', icon: 'shield', label: 'Auditoria e Logs', description: 'Consulta rastreável de eventos do ERP', profile: 'Admin' }
    ]
  },
  {
    title: 'Administração',
    icon: 'settings',
    tone: 'Acessos, perfis e alçadas',
    items: [
      { key: 'administracao', icon: 'access', label: 'Administração de Acessos', shortLabel: 'Acessos', description: 'Usuários, perfis, escopos e limites de alçada', profile: 'Admin' }
    ]
  },
  {
    title: 'Base ERP',
    icon: 'database',
    tone: 'Arquitetura e implantação',
    items: [
      { key: 'estrutura', icon: 'architecture', label: 'Arquitetura', description: 'PostgreSQL, API, documentos e identidade', profile: 'Admin' },
      { key: 'mvp', icon: 'layers', label: 'MVP ERP', description: 'Escopo verticalizado do ERP ENAC', profile: 'Diretoria' },
      { key: 'fluxos', icon: 'workflow', label: 'Workflows', description: 'Fluxos-mãe e regras de operação', profile: 'Admin' },
      { key: 'dados', icon: 'database', label: 'Modelo de dados', description: 'Entidades e fronteiras transacionais', profile: 'Admin' },
      { key: 'seguranca', icon: 'shield', label: 'Segurança', description: 'Papéis, RLS, auditoria e menor privilégio', profile: 'Admin' },
      { key: 'implantacao', icon: 'roadmap', label: 'Roadmap', description: 'Fases, integrações futuras e relatórios', profile: 'Diretoria' }
    ]
  }
];

const sections = sectionGroups.flatMap((group) => group.items);
const sectionByKey = new Map<WebSection, ISectionItem>(sections.map((item) => [item.key, item]));

const profileShortcuts: Array<{ profile: string; focus: string; sections: WebSection[] }> = [
  { profile: 'Diretoria', focus: 'margem, alertas e decisões pendentes', sections: ['dashboard-executivo', 'previsto-realizado', 'homologacao'] },
  { profile: 'Planejamento', focus: 'contratos, orçamento, planejamento, medições e desvios', sections: ['contratos-obra', 'orcamentos-planejamento', 'planejamento-executivo', 'medicoes-faturamento'] },
  { profile: 'Compras', focus: 'demanda, cotação, pedido e fornecedor', sections: ['solicitacoes-compra', 'cotacoes', 'pedidos-compra'] },
  { profile: 'Financeiro', focus: 'NF, contas, programação, baixa manual e relatórios', sections: ['notas-entrada', 'contas-pagar', 'programacoes-pagamento'] },
  { profile: 'Campo', focus: 'solicitações, medições, riscos e evidências', sections: ['solicitacoes-compra', 'medicoes-faturamento', 'riscos-pendencias'] },
  { profile: 'Admin', focus: 'perfis, alçadas, auditoria e documentação', sections: ['administracao', 'auditoria', 'homologacao'] }
];

const architecturePillars = [
  ['Fonte de verdade', 'PostgreSQL', 'Transações, relacionamentos, RLS, particionamento, PITR e réplica para BI.'],
  ['Camada de negócio', 'API própria', 'Regras, auditoria, integrações, idempotência e políticas centralizadas.'],
  ['Frontend', 'SPA web autenticada', 'Experiência operacional para obra, financeiro, comercial e locação com SSO Entra.'],
  ['Documentos', 'SharePoint libraries', 'Contratos, ART/RRT, medições, propostas, evidências e comprovantes versionados.'],
  ['Relatórios', 'BI em réplica/warehouse', 'Dashboards sem sobrecarregar o banco transacional.'],
  ['Identidade', 'Entra ID + app roles', 'Grupos corporativos, MFA, menor privilégio e governança de acesso.']
];

const mvpModules = [
  ['Cadastros mestres', 'CNPJ, sites, imóveis, edifícios, salas, vagas, centros de custo, clientes, fornecedores e parceiros.'],
  ['CRM leve e comercial', 'Leads, oportunidades, propostas, versões, aprovações comerciais e histórico de negociação.'],
  ['Contratos', 'Obra, serviço e locação com partes, escopo, valores, prazos, reajustes, retenções, aditivos e documentos.'],
  ['Obras e medições', 'Projeto, WBS, orçamento base, cronograma físico-financeiro, diário, evidências e faturamento por medição.'],
  ['AR, AP e tesouraria', 'Recebíveis, régua de cobrança, inadimplência, contas a pagar, programação, baixa e conciliação.'],
  ['Locação e ocupação', 'Unidades, contratos, caução, cobrança recorrente, reajuste, renovação, rescisão e vacância.'],
  ['Estacionamento simples', 'Vagas, regras, mensalistas, uso por período, fechamento, cobrança e repasse por parceiro.']
];

const mvpBoundary = [
  ['Entra ID, usuários e papéis', 'Mobile app nativo'],
  ['Cadastros de CNPJ, site, imóvel, sala e partes', 'Restaurante como operação completa de PDV'],
  ['CRM leve, oportunidade e proposta', 'Cowork como operação full-service'],
  ['Contratos de obra e locação', 'Contabilidade estatutária completa dentro do ERP'],
  ['Obra, WBS, orçamento base e medição', 'Automações fiscais muito específicas por município'],
  ['Contas a receber, cobrança e baixa', 'Portal externo sofisticado com autosserviço amplo'],
  ['Contas a pagar, pagamento e conciliação', 'Analytics avançado preditivo']
];

const workflows = [
  {
    title: 'Comercial e orçamento',
    steps: ['Lead', 'Oportunidade', 'Proposta', 'Aprovação', 'Contrato'],
    rule: 'Alçada por valor e margem, versão de proposta e trilha de negociação.'
  },
  {
    title: 'Obras e medições',
    steps: ['Contrato', 'Obra/WBS', 'Execução', 'Medição', 'Faturamento'],
    rule: 'Medição não excede saldo aprovado; excesso exige aditivo ou change order.'
  },
  {
    title: 'Locação de salas',
    steps: ['Unidade', 'Proposta', 'Contrato', 'Cobrança recorrente', 'Reajuste'],
    rule: 'Contrato ativo, caução, índice/data-base, multa, juros e inadimplência controlados.'
  },
  {
    title: 'Estacionamento',
    steps: ['Regras', 'Uso', 'Fechamento', 'Cobrança', 'Repasse'],
    rule: 'Tarifa por período/usuário, ocupação e rateio por parceiro quando aplicável.'
  },
  {
    title: 'Financeiro',
    steps: ['Obrigação', 'Documento fiscal', 'Cobrança/pagamento', 'Baixa', 'Conciliação'],
    rule: 'Não pagar sem aprovação; não faturar sem fato gerador; estornos auditáveis.'
  }
];

const dataModelGroups = [
  ['Organização', 'legal_entity, branch, site, building, unit, parking_space, cost_center, analytic_account'],
  ['Pessoas e acesso', 'party, person, company_party, contact, user_account, role, user_role, access_scope'],
  ['Comercial', 'lead, opportunity, proposal, proposal_item, activity, attachment'],
  ['Contratos', 'contract, contract_party, contract_term, contract_index_rule, contract_addendum, signature_event'],
  ['Obras', 'project, project_wbs, budget_baseline, budget_line, schedule_line, field_diary, measurement, measurement_item'],
  ['Financeiro', 'receivable, payable, payment, receipt, bank_account, bank_transaction, reconciliation_event'],
  ['Fiscal e integrações', 'fiscal_document, tax_rule, withholding_rule, nfse_event, webhook_event, integration_job'],
  ['Plataforma', 'document_ref, audit_event, workflow_instance, notification, integration_job']
];

const roles = [
  ['Admin', 'Todos os módulos, parametrização e auditoria', 'Papel excepcional, monitorado e com menor uso possível.'],
  ['Gestor de obra', 'Obras, contratos técnicos, medições, OS, diário e evidências', 'Sem acesso irrestrito à tesouraria.'],
  ['Financeiro', 'AP, AR, cobrança, baixa, conciliação e fiscal operacional', 'Não altera escopo técnico sem workflow.'],
  ['Comercial', 'CRM, propostas, contratos comerciais e agenda', 'Sem baixa financeira e sem editar medição.'],
  ['Locador/adm. imóveis', 'Imóveis, salas, contratos de locação, ocupação e inadimplência', 'Sem centros de custo globais.'],
  ['Operador terceiro/locatário', 'Portal restrito por contrato/site', 'Acesso somente às próprias unidades, cobranças e chamados.']
];

const nonFunctionalRequirements = [
  ['Segregação', 'legal_entity_id, site_id e RLS no banco; filtro obrigatório no backend.'],
  ['Auditoria', 'Eventos append-only para login, aprovação, baixa, estorno, alteração contratual e exportação.'],
  ['Resiliência', 'Outbox, filas, webhooks idempotentes, retries controlados e alertas de falha.'],
  ['Documentos', 'SharePoint com versionamento, metadados e vínculo por contrato, obra, unidade, título ou chamado.'],
  ['Backup', 'Base backup, WAL archiving, PITR e testes periódicos de restore.'],
  ['Performance', 'Consultas paginadas e indexadas; dashboards em camada analítica.']
];

const reports = [
  ['Fluxo de caixa', 'Diário', 'Previsto x realizado, saldo projetado por dia/semana e desvio.'],
  ['AR/AP e inadimplência', 'Diário', 'Aging, vencido, a vencer, recuperação, acordos e carteira ativa.'],
  ['Medição de obra', 'Semanal', 'Valor medido, acumulado, saldo contratual, retenções e pendências.'],
  ['Ocupação de salas', 'Diário/semanal', 'm² ocupados, vacância, receita potencial e contratos a vencer.'],
  ['Rentabilidade por obra', 'Semanal', 'Receita, custo, margem, a faturar, a pagar e exposição de caixa.'],
  ['CRM leve', 'Semanal', 'Leads por origem, oportunidades por estágio, conversão e forecast.']
];

const integrations = [
  ['Entra ID', 'SSO, MFA, grupos e app roles para papéis de aplicação.'],
  ['Microsoft Graph / SharePoint', 'Documentos, notificações, bibliotecas e metadados com scopes restritos.'],
  ['Gateway de cobrança', 'Pix, boleto, cartão, links de pagamento, webhooks e conciliação.'],
  ['Bancos', 'Extrato, CNAB/API, liquidação e matching por título/ID externo.'],
  ['Fiscal', 'NFS-e por município/provedor, NF-e quando aplicável, retenções e eventos fiscais.'],
  ['BI', 'Power BI ou Metabase sobre réplica/ETL, não diretamente no OLTP.']
];

const roadmap = [
  ['MVP', 'Blueprint detalhado, cadastros, CRM leve, contratos, obras/WBS/medições, AR/AP, cobrança, locação e go-live controlado.'],
  ['v1', 'Integrações fiscal/gateway/BI, estacionamento ampliado, portal externo básico, auditoria e observabilidade.'],
  ['v2', 'Automação avançada, renegociação, analytics, portais ampliados para terceiros e locatários.']
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
      redirectUri
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
      spHttpClient: new SharePointFetchClient(getAccessToken, siteUrl)
    })
  };
}

function WebPortal(): JSX.Element {
  const [section, setSection] = React.useState<WebSection>('visao');
  const [operationalState, setOperationalState] = React.useState<IOperationalState>({ loading: false });
  const [activeProfileKey, setActiveProfileKey] = React.useState<UserProfileKey>('Campo');
  const [navCollapsed, setNavCollapsed] = React.useState<boolean>(() => window.innerWidth <= 840);
  const currentSection = sectionByKey.get(section) || sections[0];
  const currentGroup = sectionGroups.find((group) => group.items.some((item) => item.key === section));
  const [openGroupTitles, setOpenGroupTitles] = React.useState<Set<string>>(() => new Set([currentGroup?.title || 'Operação']));
  const activeProfile = userProfileOptions.find((profile) => profile.key === activeProfileKey) || userProfileOptions[0];

  React.useEffect(() => {
    const authResponse = window.location.hash.indexOf('code=') >= 0 ||
      window.location.hash.indexOf('error=') >= 0 ||
      window.location.search.indexOf('code=') >= 0 ||
      window.location.search.indexOf('error=') >= 0;

    if (!authResponse) {
      return;
    }

    setSection('sistema');
    setOperationalState({ loading: true });
    createOperationalState()
      .then(setOperationalState)
      .catch((error) => {
        setOperationalState({
          loading: false,
          error: error instanceof Error ? error.message : String(error)
        });
      });
  }, []);

  React.useEffect(() => {
    if (!currentGroup) {
      return;
    }

    setOpenGroupTitles((previous) => {
      if (previous.has(currentGroup.title)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(currentGroup.title);
      return next;
    });
  }, [currentGroup?.title]);

  const toggleGroup = (title: string): void => {
    setOpenGroupTitles((previous) => {
      const next = new Set(previous);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const navigateToSection = (target: WebSection): void => {
    setSection(target);
    if (window.innerWidth <= 840) {
      setNavCollapsed(true);
      window.requestAnimationFrame(() => {
        document.querySelector('.enac-web-main')?.scrollIntoView({ block: 'start' });
      });
    }
  };

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
    <div className={`enac-web-shell ${navCollapsed ? 'is-nav-collapsed' : ''}`}>
      <aside className="enac-web-nav" aria-label="Navegação do Sistema ENAC">
        <div className="enac-web-brand">
          <img src={enacLogoUrl} alt="ENAC" />
          <strong>Sistema ENAC</strong>
          <span>ERP operacional local</span>
          <button
            type="button"
            className="enac-web-nav-collapse"
            aria-label="Alternar menu lateral"
            aria-pressed={navCollapsed}
            title="Alternar menu lateral"
            onClick={() => setNavCollapsed((current) => !current)}
          >
            <EnacIcon name={navCollapsed ? 'chevron-right' : 'chevron-left'} />
          </button>
        </div>
        <nav className="enac-web-nav-groups">
          {sectionGroups.map((group) => {
            const groupActive = group.items.some((item) => item.key === section);
            const groupOpen = groupActive || openGroupTitles.has(group.title);
            return (
              <section className={`enac-web-nav-group ${groupActive ? 'is-active-group' : ''}`} key={group.title} aria-label={group.title}>
                <button
                  type="button"
                  className="enac-web-nav-group-toggle"
                  aria-expanded={groupOpen}
                  title={group.title}
                  onClick={() => toggleGroup(group.title)}
                >
                  <span>
                    <EnacIcon name={group.icon} />
                    <strong>{group.title}</strong>
                    <small>{group.tone}</small>
                  </span>
                  <EnacIcon className="enac-web-nav-chevron" name={groupOpen ? 'chevron-up' : 'chevron-down'} />
                </button>
                {groupOpen && (
                  <div className="enac-web-nav-items">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        data-section={item.key}
                        className={section === item.key ? 'is-active' : ''}
                        aria-current={section === item.key ? 'page' : undefined}
                        title={item.label}
                        onClick={() => navigateToSection(item.key)}
                      >
                        <EnacIcon name={item.icon} />
                        <span>{item.shortLabel || item.label}</span>
                        <small>{item.profile}</small>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </aside>
      <main className="enac-web-main">
        <header className="enac-web-topbar">
          <div className="enac-web-module-title">
            <span>{currentGroup?.title || 'ERP ENAC'}</span>
            <strong>{currentSection.label}</strong>
            <div className="enac-web-context-line">
              <small>{currentSection.description}</small>
              <small className="enac-web-environment">Homologação local</small>
            </div>
          </div>
          <div className="enac-web-user-panel" aria-label="Usuário e perfil ativo">
            <div className="enac-web-user-summary">
              <span>Usuário</span>
              <strong>{activeProfile.userName}</strong>
              <small>Homologação local</small>
            </div>
            <label className="enac-web-profile-select">
              <span>Perfil ativo</span>
              <select value={activeProfileKey} onChange={(event) => setActiveProfileKey(event.target.value as UserProfileKey)}>
                {userProfileOptions.map((profile) => (
                  <option key={profile.key} value={profile.key}>{profile.profileLabel}</option>
                ))}
              </select>
              <small>{activeProfile.description}</small>
            </label>
          </div>
        </header>
        {section !== 'sistema' && <ContentSection section={section} onNavigate={navigateToSection} />}
        {section === 'sistema' && (
          <WebErrorBoundary>
            <OperationalSection state={operationalState} onOpenSystem={abrirSistema} />
          </WebErrorBoundary>
        )}
      </main>
    </div>
  );
}

function ContentSection({ section, onNavigate }: { section: WebSection; onNavigate: (section: WebSection) => void }): JSX.Element {
  if (section === 'cadastros') {
    return <CadastrosOperacionais />;
  }

  if (section === 'solicitacoes-compra') {
    return <SolicitacoesCompraPage />;
  }

  if (section === 'cotacoes') {
    return <CotacoesMapaPage />;
  }

  if (section === 'pedidos-compra') {
    return <PedidosCompraPage />;
  }

  if (section === 'notas-entrada') {
    return <NotasEntradaPage />;
  }

  if (section === 'contas-pagar') {
    return <ContasPagarPage />;
  }

  if (section === 'programacoes-pagamento') {
    return <ProgramacoesPagamentoPage />;
  }

  if (section === 'relatorios-financeiros') {
    return <RelatoriosFinanceirosPage />;
  }

  if (section === 'contratos-obra') {
    return <ContratosObraPage />;
  }

  if (section === 'orcamentos-planejamento') {
    return <OrcamentosPlanejamentoPage initialView="orcamentos" />;
  }

  if (section === 'planejamento-executivo') {
    return <OrcamentosPlanejamentoPage initialView="planejamento" />;
  }

  if (section === 'medicoes-faturamento') {
    return <MedicoesFaturamentoPage />;
  }

  if (section === 'previsto-realizado') {
    return <PrevistoRealizadoPage />;
  }

  if (section === 'dashboard-executivo') {
    return <DashboardExecutivoPage />;
  }

  if (section === 'riscos-pendencias') {
    return <RiscosPendenciasPage />;
  }

  if (section === 'central-tarefas') {
    return <CentralTarefasPage onNavigate={(target) => onNavigate(target as WebSection)} />;
  }

  if (section === 'homologacao') {
    return <HomologacaoPage onNavigate={(target) => onNavigate(target as WebSection)} />;
  }

  if (section === 'auditoria') {
    return <AuditoriaLogsPage />;
  }

  if (section === 'documentos') {
    return <DocumentosAnexosPage />;
  }

  if (section === 'administracao') {
    return <AcessosPage />;
  }

  if (section === 'estrutura') {
    return (
      <Page title="Arquitetura alvo do ERP" eyebrow="PostgreSQL + API + SharePoint documental">
        <div className="enac-web-stack">
          <p className="enac-web-lead">
            A base transacional recomendada passa a ser PostgreSQL, com backend próprio para regras,
            auditoria e integrações. SharePoint continua como camada documental e colaborativa.
          </p>
          <div className="enac-web-grid">
            {architecturePillars.map(([title, decision, description]) => (
              <article className="enac-web-card" key={title}>
                <span className="enac-web-card-label">{title}</span>
                <h3>{decision}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  if (section === 'mvp') {
    return (
      <Page title="MVP verticalizado ENAC" eyebrow="Obra, contrato, aluguel, recebimento e caixa">
        <div className="enac-web-stack">
          <p className="enac-web-lead">
            O MVP cobre o coração econômico da ENAC: cadastros mestres, CRM leve, contratos,
            obras e medições, contas a receber, contas a pagar, tesouraria, locação e ocupação.
          </p>
          <div className="enac-web-grid">
            {mvpModules.map(([title, description]) => (
              <article className="enac-web-card" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <table className="enac-web-table">
            <thead><tr><th>Entrar no MVP</th><th>Ficar para depois</th></tr></thead>
            <tbody>
              {mvpBoundary.map(([included, later]) => <tr key={included}><td>{included}</td><td>{later}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Page>
    );
  }

  if (section === 'fluxos') {
    return (
      <Page title="Workflows de negócio" eyebrow="Cinco fluxos-mãe">
        <div className="enac-web-grid enac-web-grid--two">
          {workflows.map((workflow) => (
            <article className="enac-web-card" key={workflow.title}>
              <h3>{workflow.title}</h3>
              <p className="enac-web-flow-line">{workflow.steps.join(' -> ')}</p>
              <p>{workflow.rule}</p>
            </article>
          ))}
        </div>
      </Page>
    );
  }

  if (section === 'dados') {
    return (
      <Page title="Modelo de dados operacional" eyebrow="Transações por CNPJ, site e contrato">
        <div className="enac-web-stack">
          <p className="enac-web-lead">
            Toda transação deve nascer com contexto empresarial e locacional. Entidades de alto volume
            como ledger, auditoria, webhooks e eventos bancários devem ser candidatas a particionamento.
          </p>
          <table className="enac-web-table">
            <thead><tr><th>Grupo</th><th>Entidades essenciais</th></tr></thead>
            <tbody>
              {dataModelGroups.map(([group, entities]) => <tr key={group}><td><strong>{group}</strong></td><td>{entities}</td></tr>)}
            </tbody>
          </table>
          <div className="enac-web-note">
            O ERP guarda metadados de negócio e vínculos; os arquivos binários ficam em bibliotecas SharePoint
            com versionamento, metadados e permissões adequadas.
          </div>
        </div>
      </Page>
    );
  }

  if (section === 'seguranca') {
    return (
      <Page title="Segurança, papéis e governança" eyebrow="Entra ID, RLS e auditoria">
        <div className="enac-web-stack">
          <table className="enac-web-table">
            <thead><tr><th>Papel</th><th>Escopo</th><th>Restrição recomendada</th></tr></thead>
            <tbody>
              {roles.map(([role, scope, restriction]) => <tr key={role}><td><strong>{role}</strong></td><td>{scope}</td><td>{restriction}</td></tr>)}
            </tbody>
          </table>
          <div className="enac-web-grid enac-web-grid--two">
            {nonFunctionalRequirements.map(([title, description]) => (
              <article className="enac-web-card" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  if (section === 'implantacao') {
    return (
      <Page title="Roadmap e integrações" eyebrow="Implantação incremental">
        <div className="enac-web-stack">
          <div className="enac-web-roadmap">
            {roadmap.map(([phase, description]) => (
              <article key={phase}>
                <span>{phase}</span>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <table className="enac-web-table">
            <thead><tr><th>Integração</th><th>Finalidade no ERP</th></tr></thead>
            <tbody>
              {integrations.map(([name, purpose]) => <tr key={name}><td><strong>{name}</strong></td><td>{purpose}</td></tr>)}
            </tbody>
          </table>
          <table className="enac-web-table">
            <thead><tr><th>Relatório</th><th>Frequência</th><th>Métricas mínimas</th></tr></thead>
            <tbody>
              {reports.map(([report, cadence, metrics]) => <tr key={report}><td><strong>{report}</strong></td><td>{cadence}</td><td>{metrics}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Page>
    );
  }

  return (
    <Page title="ERP próprio para a ENAC" eyebrow="Blueprint executivo convertido em portal">
      <div className="enac-web-stack">
        <section className="enac-web-hero">
          <div>
            <p>
              O ERP ENAC local está organizado por perfis e módulos operacionais para compras,
              obras, financeiro, gestão e administração. A V3.18F consolida o padrão visual
              de ERP, com menu compacto, ícones SVG, telas por abas e leitura objetiva para homologação.
            </p>
          </div>
          <dl>
            <div><dt>MVP</dt><dd>7 frentes</dd></div>
            <div><dt>Fonte de verdade alvo</dt><dd>PostgreSQL</dd></div>
            <div><dt>Documentos</dt><dd>SharePoint-ready local</dd></div>
            <div><dt>UX V3.18F</dt><dd>ERP visual</dd></div>
          </dl>
        </section>

        <section className="enac-web-profile-map" aria-label="Fluxo por perfil operacional">
          {profileShortcuts.map((profile) => (
            <article key={profile.profile}>
              <div>
                <span>{profile.profile}</span>
                <p>{profile.focus}</p>
              </div>
              <div className="enac-web-profile-actions">
                {profile.sections.map((target) => {
                  const item = sectionByKey.get(target);
                  return item ? (
                    <button key={target} type="button" data-section={target} onClick={() => onNavigate(target)}>
                      {item.shortLabel || item.label}
                    </button>
                  ) : null;
                })}
              </div>
            </article>
          ))}
        </section>
      </div>
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
    return (
      <Page title="Consulta histórica" eyebrow="Carregando">
        <div className="enac-web-alert">
          <strong>Consulta histórica mantida fora da navegação operacional.</strong>
          <p>O ERP operacional atual está nos módulos da navegação principal.</p>
        </div>
        <p>Preparando autenticação Microsoft Entra.</p>
      </Page>
    );
  }

  if (state.error || !state.account || !state.repository) {
    return (
      <Page title="Consulta histórica" eyebrow="Configuração necessária">
        <div className="enac-web-alert">
          <strong>Consulta histórica mantida fora da navegação operacional.</strong>
          <p>O ERP operacional atual está nos módulos da navegação principal.</p>
        </div>
        <div className="enac-web-alert">
          <strong>{state.error || 'A autenticação ainda não foi iniciada.'}</strong>
          <p>Configure as variáveis no ambiente local ou no Netlify e cadastre a URL de retorno no Microsoft Entra.</p>
          <button type="button" onClick={onOpenSystem}>Tentar novamente</button>
        </div>
      </Page>
    );
  }

  return (
    <>
      <div className="enac-web-alert enac-web-alert--compact">
        <strong>Tela legada mantida apenas para consulta.</strong>
        <p>O ERP operacional atual está nos módulos da navegação principal.</p>
      </div>
      {escritaWebV30BSolicitada && bloqueiosEscritaWebV30B.length > 0 && (
        <div className="enac-web-alert enac-web-alert--compact">
          <strong>Escrita V3.0b bloqueada por configuração.</strong>
          <ul>
            {bloqueiosEscritaWebV30B.map((bloqueio) => <li key={bloqueio}>{bloqueio}</li>)}
          </ul>
        </div>
      )}
      {escritaWebV30BLiberada && (
        <div className="enac-web-alert enac-web-alert--compact enac-web-alert--success">
          <strong>Escrita V3.0b liberada para teste controlado.</strong>
          <p>Somente nova requisição com marcador V3.0B-WEB-TESTE será enviada para a Lista 02.</p>
        </div>
      )}
      <EnacSistema
        currentUserName={state.account.name || state.account.username || 'Usuario ENAC'}
        currentUserEmail={state.account.username}
        currentUserPerfil="Campo"
        origemDados="sharepoint"
        diagnosticoReadonly={true}
        repository={state.repository}
        siteUrl={siteUrl}
        flagsEscritaWebV30B={flagsEscritaWebV30B}
      />
    </>
  );
}

ReactDOM.render(<WebPortal />, document.getElementById('root'));
