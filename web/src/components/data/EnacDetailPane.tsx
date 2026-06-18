import * as React from 'react';

interface EnacDetailPaneProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function EnacDetailPane({ title, subtitle, children, actions, className }: EnacDetailPaneProps): JSX.Element {
  return (
    <aside className={`enac-foundation-detail-pane${className ? ` ${className}` : ''}`}>
      <div className="enac-foundation-detail-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="enac-foundation-detail-actions">{actions}</div>}
      </div>
      {children}
    </aside>
  );
}
