import * as React from 'react';

export type EnacTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface EnacKpiCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  tone?: EnacTone;
  icon?: React.ReactNode;
  className?: string;
}

export function EnacKpiCard({ label, value, helper, tone = 'brand', icon, className }: EnacKpiCardProps): JSX.Element {
  return (
    <article className={`enac-foundation-kpi-card is-${tone}${className ? ` ${className}` : ''}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper && <small>{helper}</small>}
      </div>
      {icon && <div className="enac-foundation-kpi-icon">{icon}</div>}
    </article>
  );
}
