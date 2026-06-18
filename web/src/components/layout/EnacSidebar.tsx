import * as React from 'react';

interface EnacSidebarProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function EnacSidebar({ children, className, ariaLabel = 'Navegação ENAC' }: EnacSidebarProps): JSX.Element {
  return (
    <aside className={`enac-foundation-sidebar${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      {children}
    </aside>
  );
}
