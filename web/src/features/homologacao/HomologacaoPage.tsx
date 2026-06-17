import * as React from 'react';
import { erpApi } from '../../services/erpApi';

interface HomologacaoPageProps {
  onNavigate?: (section: string) => void;
}

interface HomologacaoStatus {
  usuarios: number;
  clientes: number;
  fornecedores: number;
  obras: number;
  obrasGerenciais: number;
  riscos: number;
  tarefas: number;
  documentos: number;
  valorContratado: number;
  receitaFaturada: number;
}

interface PerfilRoteiro {
  perfil: string;
  responsavel: string;
  foco: string;
  modulos: Array<{ label: string; section: string }>;
  passos: string[];
}

interface SessaoAssistida {
  ordem: string;
  titulo: string;
  publico: string;
  foco: string;
}

const marker = 'DEV_LOCAL_HOMOLOGACAO_ENAC_V316';

const emptyStatus: HomologacaoStatus = {
  usuarios: 0,
  clientes: 0,
  fornecedores: 0,
  obras: 0,
  obrasGerenciais: 0,
  riscos: 0,
  tarefas: 0,
  documentos: 0,
  valorContratado: 0,
  receitaFaturada: 0
};

const roteiros: PerfilRoteiro[] = [
  {
    perfil: 'Diretoria',
    responsavel: 'Leon',
    foco: 'margem, riscos e decisões pendentes',
    modulos: [
      { label: 'Dashboard', section: 'dashboard-executivo' },
      { label: 'Previsto x Realizado', section: 'previsto-realizado' },
      { label: 'Central de Tarefas', section: 'central-tarefas' }
    ],
    passos: ['Abrir Dashboard Executivo', 'Consultar margem por obra', 'Revisar riscos críticos', 'Consultar aprovações e tarefas']
  },
  {
    perfil: 'Planejamento',
    responsavel: 'Gustavo',
    foco: 'orçamento, planejamento, medições e desvios',
    modulos: [
      { label: 'Orçamentos', section: 'orcamentos-planejamento' },
      { label: 'Contratos', section: 'contratos-obra' },
      { label: 'Medições', section: 'medicoes-faturamento' }
    ],
    passos: ['Consultar orçamento aprovado', 'Revisar planejamento ativo', 'Conferir contrato e aditivo', 'Validar desvios previsto x realizado']
  },
  {
    perfil: 'Compras',
    responsavel: 'Matheus',
    foco: 'solicitação, cotação, mapa e pedido',
    modulos: [
      { label: 'Solicitações', section: 'solicitacoes-compra' },
      { label: 'Cotações', section: 'cotacoes' },
      { label: 'Pedidos', section: 'pedidos-compra' }
    ],
    passos: ['Criar ou consultar solicitação', 'Conferir cotação', 'Comparar mapa', 'Validar pedido confirmado']
  },
  {
    perfil: 'Financeiro',
    responsavel: 'Matheus',
    foco: 'NF, contas, programação, conferência e baixa manual controlada',
    modulos: [
      { label: 'Notas', section: 'notas-entrada' },
      { label: 'Contas', section: 'contas-pagar' },
      { label: 'Programações', section: 'programacoes-pagamento' },
      { label: 'Relatórios', section: 'relatorios-financeiros' }
    ],
    passos: ['Consultar NF', 'Validar conta a pagar', 'Revisar programação sem pagamento', 'Conferir baixa manual de teste']
  },
  {
    perfil: 'Campo',
    responsavel: 'Davison',
    foco: 'solicitações, pendências e medição',
    modulos: [
      { label: 'Solicitações', section: 'solicitacoes-compra' },
      { label: 'Riscos', section: 'riscos-pendencias' },
      { label: 'Medições', section: 'medicoes-faturamento' }
    ],
    passos: ['Criar solicitação de compra', 'Acompanhar status', 'Consultar pendências', 'Conferir medição de obra']
  },
  {
    perfil: 'Admin',
    responsavel: 'Admin teste',
    foco: 'acessos, auditoria e documentos mockados',
    modulos: [
      { label: 'Administração', section: 'administracao' },
      { label: 'Auditoria', section: 'auditoria' },
      { label: 'Documentos', section: 'documentos' }
    ],
    passos: ['Validar usuários e perfis', 'Revisar escopos e alçadas', 'Consultar auditoria', 'Conferir anexos mockados']
  }
];

const checklist = [
  'Seed rodada com marcador local',
  'Perfis operacionais conseguem abrir seus módulos',
  'Dashboard mostra dados da obra principal',
  'Previsto x realizado exibe margem e curva',
  'Riscos, tarefas e documentos aparecem com dados mockados',
  'Nenhum fluxo executa pagamento, CNAB, NFS-e, banco ou upload externo'
];

const sessoesAssistidas: SessaoAssistida[] = [
  { ordem: '01', titulo: 'Abertura', publico: 'Todos', foco: 'escopo, limites e forma de registrar feedback' },
  { ordem: '02', titulo: 'Diretoria', publico: 'Leon', foco: 'dashboard, margem, riscos e aprovações críticas' },
  { ordem: '03', titulo: 'Planejamento', publico: 'Gustavo', foco: 'contratos, orçamento, planejamento e medições' },
  { ordem: '04', titulo: 'Compras', publico: 'Matheus', foco: 'solicitação, cotação, mapa e pedido' },
  { ordem: '05', titulo: 'Financeiro', publico: 'Matheus', foco: 'NF, contas, programação, conferência e relatórios' },
  { ordem: '06', titulo: 'Campo', publico: 'Davison e Kemilly', foco: 'solicitações, status, pendências e documentos mockados' },
  { ordem: '07', titulo: 'Admin', publico: 'Admin teste', foco: 'usuários, perfis, alçadas, auditoria e documentos' },
  { ordem: '08', titulo: 'Encerramento', publico: 'Responsáveis', foco: 'aceite, ressalvas e backlog V3.18' }
];

const criteriosAceite = [
  'Todos os perfis executaram o roteiro mínimo',
  'Feedbacks foram registrados com evidência e severidade',
  'Não houve bloqueio crítico sem contorno',
  'Backlog V3.18 foi priorizado após feedback real'
];

const camposFeedback = [
  'perfil, usuário avaliador, módulo e tela',
  'tipo, severidade, prioridade e descrição',
  'passo a passo, esperado, obtido e evidência',
  'impacto, decisão, responsável, versão alvo e status'
];

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: unknown): string =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function HomologacaoPage({ onNavigate }: HomologacaoPageProps): JSX.Element {
  const [status, setStatus] = React.useState<HomologacaoStatus>(emptyStatus);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  const loadStatus = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [usuarios, clientes, fornecedores, obras, previsto, dashboard, riscos, tarefasResumo, documentos] = await Promise.all([
        erpApi.usuarios.list(),
        erpApi.clientes.list(),
        erpApi.fornecedores.list(),
        erpApi.obras.list(),
        erpApi.previstoRealizado.obras(),
        erpApi.dashboardExecutivo.resumo(),
        erpApi.riscosPendencias.list({ texto: marker }),
        erpApi.centralTarefas.resumo({ texto: marker }),
        erpApi.documentos.list({ texto: marker, limit: '100' })
      ]);

      setStatus({
        usuarios: usuarios.filter((usuario) => usuario.email.includes('homologacao.v316')).length,
        clientes: clientes.filter((cliente) => cliente.observacoes === marker).length,
        fornecedores: fornecedores.filter((fornecedor) => fornecedor.observacoes === marker).length,
        obras: obras.filter((obra) => obra.observacoes === marker).length,
        obrasGerenciais: previsto.filter((obra) => String(obra.obra_codigo || '').startsWith('HOMO-')).length,
        riscos: riscos.length,
        tarefas: tarefasResumo.total || 0,
        documentos: documentos.length,
        valorContratado: toNumber(dashboard.kpis.valor_total_contratado),
        receitaFaturada: toNumber(dashboard.kpis.receita_faturada_manual)
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const openSection = (section: string): void => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const indicadores: Array<[string, string]> = [
    ['Usuários', status.usuarios.toLocaleString('pt-BR')],
    ['Clientes', status.clientes.toLocaleString('pt-BR')],
    ['Fornecedores', status.fornecedores.toLocaleString('pt-BR')],
    ['Obras', status.obras.toLocaleString('pt-BR')],
    ['Obras gerenciais', status.obrasGerenciais.toLocaleString('pt-BR')],
    ['Riscos', status.riscos.toLocaleString('pt-BR')],
    ['Tarefas', status.tarefas.toLocaleString('pt-BR')],
    ['Documentos', status.documentos.toLocaleString('pt-BR')],
    ['Contratado total', formatMoney(status.valorContratado)],
    ['Receita faturada', formatMoney(status.receitaFaturada)]
  ];

  return (
    <section className="enac-web-page enac-homologacao-page">
      <p className="enac-web-eyebrow">Homologação local · {marker}</p>
      <h1>Homologação por Perfil</h1>

      {error && <div className="enac-web-alert enac-web-alert--compact">{error}</div>}

      <section className="enac-homologacao-status" aria-label="Status da seed">
        <div>
          <span>Status</span>
          <strong>{loading ? 'Atualizando' : status.obras > 0 ? 'Seed localizada' : 'Seed não localizada'}</strong>
          <small>Dados de homologação local. Não usar como produção.</small>
        </div>
        <button type="button" onClick={() => void loadStatus()} disabled={loading}>
          Atualizar status
        </button>
      </section>

      <section className="enac-report-section enac-homologacao-pacote" aria-label="Pacote de Homologação Assistida">
        <div className="enac-cadastro-toolbar">
          <div>
            <h2>Pacote de Homologação Assistida</h2>
            <p>Roteiro de sessões, critérios e coleta de feedback para V3.18</p>
          </div>
        </div>
        <div className="enac-homologacao-package-grid">
          <article>
            <h3>Sequência das sessões</h3>
            <ol className="enac-homologacao-session-list">
              {sessoesAssistidas.map((sessao) => (
                <li key={sessao.ordem}>
                  <strong>{sessao.ordem} · {sessao.titulo}</strong>
                  <span>{sessao.publico}</span>
                  <small>{sessao.foco}</small>
                </li>
              ))}
            </ol>
          </article>
          <article>
            <h3>Critérios de aceite</h3>
            <ul>
              {criteriosAceite.map((criterio) => <li key={criterio}>{criterio}</li>)}
            </ul>
            <div className="enac-homologacao-notice">
              Ambiente local de homologação. V3.18 somente após feedback real priorizado.
            </div>
          </article>
          <article>
            <h3>Registro de feedback</h3>
            <ul>
              {camposFeedback.map((campo) => <li key={campo}>{campo}</li>)}
            </ul>
            <div className="enac-homologacao-notice">
              Usar o modelo em docs/erp/modelo-feedback-homologacao.md.
            </div>
          </article>
        </div>
      </section>

      <div className="enac-report-cards enac-homologacao-cards">
        {indicadores.map(([label, value]) => (
          <article className="enac-report-card enac-dashboard-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <section className="enac-report-section">
        <div className="enac-cadastro-toolbar">
          <div>
            <h2>Roteiros por perfil</h2>
            <p>{roteiros.length} perfil(is)</p>
          </div>
        </div>
        <div className="enac-homologacao-roteiros">
          {roteiros.map((roteiro) => (
            <article key={roteiro.perfil}>
              <div className="enac-homologacao-roteiro-head">
                <div>
                  <span>{roteiro.perfil}</span>
                  <strong>{roteiro.responsavel}</strong>
                  <small>{roteiro.foco}</small>
                </div>
                <div className="enac-homologacao-links">
                  {roteiro.modulos.map((modulo) => (
                    <button key={modulo.section} type="button" onClick={() => openSection(modulo.section)}>
                      {modulo.label}
                    </button>
                  ))}
                </div>
              </div>
              <ol>
                {roteiro.passos.map((passo) => <li key={passo}>{passo}</li>)}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="enac-report-section">
        <div className="enac-cadastro-toolbar">
          <div>
            <h2>Checklist manual</h2>
            <p>{checklist.length} item(ns)</p>
          </div>
        </div>
        <div className="enac-homologacao-checklist">
          {checklist.map((item) => (
            <label key={item}>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}
