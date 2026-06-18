import * as React from 'react';

interface EnacFilterBarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function EnacFilterBar({ children, actions, className, ariaLabel = 'Filtros' }: EnacFilterBarProps): JSX.Element {
  return (
    <section className={`enac-foundation-filter-bar${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      <div className="enac-foundation-filter-grid">{children}</div>
      {actions && <div className="enac-foundation-filter-actions">{actions}</div>}
    </section>
  );
}
