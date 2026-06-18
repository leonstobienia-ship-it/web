import * as React from 'react';

interface EnacAppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
}

export function EnacAppShell({ sidebar, topbar, children, collapsed = false }: EnacAppShellProps): JSX.Element {
  return (
    <div className={`enac-foundation-app-shell${collapsed ? ' is-collapsed' : ''}`}>
      {sidebar}
      <main className="enac-foundation-main">
        {topbar}
        <div className="enac-foundation-page-scroll">{children}</div>
      </main>
    </div>
  );
}
