import * as React from 'react';

interface EnacTopbarProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function EnacTopbar({ title, subtitle, rightSlot }: EnacTopbarProps): JSX.Element {
  return (
    <header className="enac-foundation-topbar">
      <div>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {rightSlot && <div className="enac-foundation-topbar-actions">{rightSlot}</div>}
    </header>
  );
}
