import type { EnacAuditTrailEvent } from '../../components';
import type { EnacOperationalStep } from '../../components';
import type { RegraAlcadaMock, ResolucaoAprovacaoMock } from './types';

const now = (): string => new Date().toISOString();

export const marcadorGovernancaV319 = 'DEV_LOCAL_V3_19';

export const regraAlcadaComprasMock: RegraAlcadaMock = {
  id: 'alcada-compras-v319',
  modulo: 'compras-financeiro',
  tipo_documento: 'PEDIDO_COMPRA_CONTA_PROGRAMACAO',
  acao: 'aprovar',
  limite_tecnico: 20000,
  aprovador_tecnico: 'Gustavo',
  aprovador_diretoria: 'Leon',
  observacao: 'Parâmetro mock local. Não altera processos já submetidos.'
};

export const perfisGovernancaMock = [
  { nome: 'Matheus', papel: 'compras, pedidos, NF e pagamento operacional mock' },
  { nome: 'Gustavo', papel: 'aprovação dentro da alçada configurada' },
  { nome: 'Leon', papel: 'aprovação acima da alçada e liberações diretivas' },
  { nome: 'Kemilly', papel: 'apoio orçamento e planejamento' },
  { nome: 'Campo', papel: 'solicitação operacional' },
  { nome: 'Diretoria/Admin', papel: 'parametrização e visão ampla' }
] as const;

export const resolveAprovadorMock = (valor: string | number | null | undefined): ResolucaoAprovacaoMock => {
  const numericValue = Number(String(valor || '0').replace(',', '.'));
  const limite = regraAlcadaComprasMock.limite_tecnico;
  const acimaDaAlcada = Number.isFinite(numericValue) && numericValue > limite;

  return {
    aprovador: acimaDaAlcada ? regraAlcadaComprasMock.aprovador_diretoria : regraAlcadaComprasMock.aprovador_tecnico,
    badge: acimaDaAlcada ? 'Aguardando Leon' : 'Aguardando Gustavo',
    motivo: acimaDaAlcada
      ? `Valor acima de R$ ${limite.toLocaleString('pt-BR')}; requer diretoria.`
      : `Valor dentro da alçada técnica de R$ ${limite.toLocaleString('pt-BR')}.`,
    limite,
    nivel: acimaDaAlcada ? 'diretoria' : 'tecnico'
  };
};

export const buildAuditTrailMock = ({
  module,
  code,
  createdAt,
  status,
  approvalStatus,
  approvedBy,
  approvedAt,
  value,
  extraEvents = []
}: {
  module: string;
  code: string;
  createdAt?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  value?: string | number | null;
  extraEvents?: EnacAuditTrailEvent[];
}): EnacAuditTrailEvent[] => {
  const approval = resolveAprovadorMock(value);
  const events: EnacAuditTrailEvent[] = [
    {
      id: `${code}-created`,
      action: 'Criado',
      module,
      user: 'Matheus / Campo',
      timestamp: createdAt || now(),
      statusTo: status || 'Rascunho',
      note: `${marcadorGovernancaV319}: registro criado em ambiente local.`,
      tone: 'neutral'
    }
  ];

  if (approvalStatus && approvalStatus !== 'PENDENTE_APROVACAO') {
    events.push({
      id: `${code}-approval`,
      action: approvalStatus.includes('REPROVADO') ? 'Reprovado' : 'Aprovado',
      module,
      user: approvedBy || approval.aprovador,
      timestamp: approvedAt || now(),
      statusFrom: 'PENDENTE_APROVACAO',
      statusTo: approvalStatus,
      note: approval.motivo,
      tone: approvalStatus.includes('REPROVADO') ? 'danger' : 'success'
    });
  } else {
    events.push({
      id: `${code}-waiting-approval`,
      action: approval.badge,
      module,
      user: approval.aprovador,
      timestamp: now(),
      statusFrom: status || '-',
      statusTo: 'PENDENTE_APROVACAO',
      note: approval.motivo,
      tone: approval.nivel === 'diretoria' ? 'warning' : 'neutral'
    });
  }

  return [...events, ...extraEvents];
};

export const buildFluxoOperacionalMock = (activeKey: string): EnacOperationalStep[] => {
  const ordered = [
    ['solicitacao', 'Solicitação'],
    ['aprovacao', 'Aprovação'],
    ['compra', 'Compra / pedido'],
    ['nf', 'NF vinculada'],
    ['conta', 'Conta a pagar'],
    ['programacao', 'Programação mock'],
    ['auditoria', 'Histórico']
  ] as const;
  const activeIndex = ordered.findIndex(([key]) => key === activeKey);

  return ordered.map(([key, label], index) => ({
    key,
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
    detail: key === 'programacao' ? 'Sem execução bancária' : undefined
  }));
};
