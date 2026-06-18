import * as React from 'react';

interface EnacPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function EnacPageHeader({ eyebrow, title, subtitle, children, actions, className }: EnacPageHeaderProps): JSX.Element {
  return (
    <header className={`enac-foundation-page-header${className ? ` ${className}` : ''}`}>
      <div>
        {eyebrow && <p className="enac-foundation-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(children || actions) && (
        <div className="enac-foundation-page-actions">
          {actions}
          {children}
        </div>
      )}
    </header>
  );
}
