import * as React from 'react';
import {
  EnacAvatar,
  EnacBadge,
  EnacButton,
  EnacCard,
  EnacEmptyState,
  EnacField,
  EnacIcon,
  EnacKpiCard,
  EnacNotification,
  EnacStatusChip,
  EnacTabs,
  type EnacIconName
} from '../../components';

interface Swatch {
  name: string;
  token: string;
  value: string;
  invert?: boolean;
}

const brandSwatches: Swatch[] = [
  { name: 'Vermelho ENAC', token: '--enac-red-500', value: '#c1121f', invert: true },
  { name: 'Hover', token: '--enac-red-600', value: '#af0f1e', invert: true },
  { name: 'Pressionado', token: '--enac-red-700', value: '#960d1a', invert: true },
  { name: 'Tint', token: '--enac-red-050', value: '#fcedef' }
];

const graphiteSwatches: Swatch[] = [
  { name: 'Grafite 950', token: '--enac-graphite-950', value: '#090d11', invert: true },
  { name: 'Grafite 900', token: '--enac-graphite-900', value: '#11161d', invert: true },
  { name: 'Grafite 800', token: '--enac-graphite-800', value: '#1b222b', invert: true },
  { name: 'Grafite 700', token: '--enac-graphite-700', value: '#27313c', invert: true }
];

const neutralSwatches: Swatch[] = [
  { name: 'Texto', token: '--enac-gray-900', value: '#111827', invert: true },
  { name: 'Esmaecido', token: '--enac-gray-600', value: '#4b5563', invert: true },
  { name: 'Borda forte', token: '--enac-gray-300', value: '#d1d5db' },
  { name: 'Borda', token: '--enac-gray-200', value: '#e5e7eb' },
  { name: 'Canvas', token: '--enac-gray-050', value: '#f8fafc' }
];

const statusSwatches: Swatch[] = [
  { name: 'Sucesso', token: '--enac-success-600', value: '#1e7a43', invert: true },
  { name: 'Atenção', token: '--enac-warning-600', value: '#a66a00', invert: true },
  { name: 'Perigo', token: '--enac-danger-600', value: '#b42318', invert: true }
];

interface TypeRow {
  token: string;
  size: string;
  weight: number;
  label: string;
  sample: string;
}

const typeScale: TypeRow[] = [
  { token: '--enac-fs-display', size: '28px', weight: 800, label: 'Display', sample: 'Sistema ENAC' },
  { token: '--enac-fs-h1', size: '24px', weight: 800, label: 'Título de página (h1)', sample: 'Pedidos de compra' },
  { token: '--enac-fs-h2', size: '20px', weight: 700, label: 'Subtítulo (h2)', sample: 'Resumo financeiro' },
  { token: '--enac-fs-h3', size: '16px', weight: 700, label: 'Título de card (h3)', sample: 'Alertas operacionais' },
  { token: '--enac-fs-body', size: '14px', weight: 400, label: 'Corpo', sample: 'A liberação exige conferência financeira.' },
  { token: '--enac-fs-micro', size: '11px', weight: 800, label: 'Micro (rótulos/cabeçalhos)', sample: 'CENTRO DE CUSTO' }
];

const spacingScale: Array<{ token: string; px: string }> = [
  { token: '--space-2', px: '4px' },
  { token: '--space-4', px: '8px' },
  { token: '--space-6', px: '12px' },
  { token: '--space-7', px: '16px' },
  { token: '--space-8', px: '20px' },
  { token: '--space-9', px: '24px' },
  { token: '--space-10', px: '32px' }
];

const radiusScale: Array<{ token: string; px: string }> = [
  { token: '--radius-sm', px: '2px' },
  { token: '--radius-md', px: '4px' },
  { token: '--radius-lg', px: '8px' },
  { token: '--radius-xl', px: '12px' },
  { token: '--radius-pill', px: '999px' }
];

const iconNames: EnacIconName[] = [
  'home', 'dashboard', 'tasks', 'clipboard', 'cart', 'compare', 'invoice', 'payable',
  'calendar', 'report', 'contract', 'budget', 'ruler', 'chart', 'registry', 'documents',
  'access', 'shield', 'settings', 'database', 'warning', 'check', 'workflow', 'layers'
];

function SwatchGroup({ title, swatches }: { title: string; swatches: Swatch[] }): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <span className="enac-card-label">{title}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
        {swatches.map((s) => (
          <div key={s.token} style={{ border: '1px solid var(--enac-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ background: s.value, color: s.invert ? '#fff' : 'var(--enac-gray-900)', padding: 'var(--space-6)', fontWeight: 800, fontSize: 13 }}>
              {s.value}
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-6)', background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <code style={{ fontSize: 11, color: 'var(--enac-muted)' }}>{s.token}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesignSystemPage(): JSX.Element {
  const [tab, setTab] = React.useState('botoes');

  return (
    <section className="enac-web-page enac-foundation-page">
      <p className="enac-web-eyebrow">Fundação V3.18K · ENAC Design System</p>
      <h1>Design System</h1>
      <p className="enac-web-lead">
        Referência viva da linguagem visual do Sistema ENAC: tokens de cor e tipografia, escala de espaçamento,
        conjunto de ícones de linha e a biblioteca de componentes reutilizáveis. Grafite + vermelho ENAC sobre
        canvas cinza-gelo; verde somente para status positivo.
      </p>

      <div style={{ display: 'grid', gap: 'var(--space-9)', marginTop: 'var(--space-8)' }}>
        <EnacCard label="Cores" title="Paleta da marca">
          <div style={{ display: 'grid', gap: 'var(--space-7)' }}>
            <SwatchGroup title="Vermelho ENAC (acento)" swatches={brandSwatches} />
            <SwatchGroup title="Grafite (sidebar / superfícies escuras)" swatches={graphiteSwatches} />
            <SwatchGroup title="Neutros técnicos" swatches={neutralSwatches} />
            <SwatchGroup title="Status (verde só para positivo)" swatches={statusSwatches} />
          </div>
        </EnacCard>

        <EnacCard label="Tipografia" title="Escala — Inter (fallback Segoe UI)">
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {typeScale.map((t) => (
              <div key={t.token} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-7)', borderBottom: '1px solid var(--enac-border)', paddingBottom: 'var(--space-4)' }}>
                <div style={{ flex: '0 0 220px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                  <code style={{ fontSize: 11, color: 'var(--enac-muted)' }}>{t.token} · {t.size}</code>
                </div>
                <div style={{ fontSize: t.size, fontWeight: t.weight, color: 'var(--enac-text)' }}>{t.sample}</div>
              </div>
            ))}
            <div className="enac-num" style={{ fontSize: 20, fontWeight: 700 }}>
              Numerais tabulares: R$ 184.500,00 · R$ 8,4 mi · 19/06/2026
            </div>
          </div>
        </EnacCard>

        <EnacCard label="Espaçamento e raio" title="Escala de 2px e cantos">
          <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
            <div>
              <span className="enac-card-label">Espaçamento</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                {spacingScale.map((s) => (
                  <div key={s.token} style={{ textAlign: 'center' }}>
                    <div style={{ width: s.px, height: s.px, background: 'var(--enac-red-500)', borderRadius: 2, margin: '0 auto' }} />
                    <code style={{ fontSize: 11, color: 'var(--enac-muted)', display: 'block', marginTop: 4 }}>{s.px}</code>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="enac-card-label">Raio</span>
              <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                {radiusScale.map((r) => (
                  <div key={r.token} style={{ textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, background: 'var(--enac-gray-100)', border: '1px solid var(--enac-border-strong)', borderRadius: r.px }} />
                    <code style={{ fontSize: 11, color: 'var(--enac-muted)', display: 'block', marginTop: 4 }}>{r.token}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </EnacCard>

        <EnacCard label="Ícones" title="Conjunto de linha da ENAC">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 'var(--space-4)' }}>
            {iconNames.map((name) => (
              <div key={name} style={{ display: 'grid', justifyItems: 'center', gap: 6, padding: 'var(--space-6)', border: '1px solid var(--enac-border)', borderRadius: 'var(--radius-md)', background: '#fff', fontSize: 18, color: 'var(--enac-graphite-900)' }}>
                <EnacIcon name={name} className="enac-icon" />
                <code style={{ fontSize: 10.5, color: 'var(--enac-muted)' }}>{name}</code>
              </div>
            ))}
          </div>
        </EnacCard>

        <EnacCard label="Componentes" title="Biblioteca reutilizável">
          <EnacTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'botoes', label: 'Botões' },
              { id: 'formulario', label: 'Formulário' },
              { id: 'dados', label: 'Dados e status' },
              { id: 'feedback', label: 'Feedback' }
            ]}
          />

          <div style={{ marginTop: 'var(--space-7)' }}>
            {tab === 'botoes' && (
              <div style={{ display: 'grid', gap: 'var(--space-7)' }}>
                <div className="enac-row">
                  <EnacButton variant="primary">Aprovar</EnacButton>
                  <EnacButton variant="secondary">Devolver</EnacButton>
                  <EnacButton variant="ghost">Limpar</EnacButton>
                  <EnacButton variant="subtle">Pesquisar</EnacButton>
                  <EnacButton variant="danger">Cancelar</EnacButton>
                </div>
                <div className="enac-row">
                  <EnacButton size="sm" icon="cart">Novo pedido</EnacButton>
                  <EnacButton icon="check">Confirmar aprovação</EnacButton>
                  <EnacButton size="lg" variant="secondary" icon="report">Exportar</EnacButton>
                  <EnacButton variant="ghost" icon="settings" aria-label="Configurações" />
                </div>
                <div className="enac-row">
                  <EnacAvatar name="Leon Estevão Stobienia" />
                  <EnacAvatar name="Matheus" size="sm" />
                  <EnacAvatar name="Gustavo" size="lg" />
                  <EnacBadge>3</EnacBadge>
                  <EnacBadge muted>12</EnacBadge>
                </div>
              </div>
            )}

            {tab === 'formulario' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-7)' }}>
                <EnacField label="Fornecedor" required control="input" placeholder="Razão social" />
                <EnacField
                  label="Centro de custo"
                  control="select"
                  options={['Selecione', 'Obra Centro · 01', 'Obra Litoral · 02']}
                />
                <EnacField label="Observação" control="textarea" hint="Visível na trilha de auditoria." placeholder="Detalhe a tratativa" />
              </div>
            )}

            {tab === 'dados' && (
              <div style={{ display: 'grid', gap: 'var(--space-7)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
                  <EnacKpiCard label="Margem prevista" value="R$ 8,4 mi" helper="+3,2% no mês" tone="success" />
                  <EnacKpiCard label="Contas vencidas" value="R$ 312 mil" helper="4 títulos" tone="danger" />
                  <EnacKpiCard label="Pedidos em análise" value="27" helper="aguardando alçada" tone="warning" />
                </div>
                <div className="enac-row">
                  <EnacStatusChip tone="neutral">Rascunho</EnacStatusChip>
                  <EnacStatusChip tone="info">Em análise</EnacStatusChip>
                  <EnacStatusChip tone="success">Aprovada</EnacStatusChip>
                  <EnacStatusChip tone="warning">Programada</EnacStatusChip>
                  <EnacStatusChip tone="danger">Vencida</EnacStatusChip>
                </div>
              </div>
            )}

            {tab === 'feedback' && (
              <div style={{ display: 'grid', gap: 'var(--space-7)' }}>
                <EnacNotification tone="success" message="Programação criada sem baixa bancária real." />
                <EnacNotification tone="warning" message="A liberação exige conferência financeira." />
                <EnacEmptyState
                  title="Nenhum registro encontrado"
                  description="Ajuste os filtros ou inicie uma nova solicitação."
                  action={<EnacButton size="sm" icon="clipboard">Nova solicitação</EnacButton>}
                />
              </div>
            )}
          </div>
        </EnacCard>
      </div>
    </section>
  );
}
