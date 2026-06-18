import * as React from 'react';
import type { EnacTone } from './EnacKpiCard';

interface EnacStatusChipProps {
  children: React.ReactNode;
  tone?: EnacTone;
  className?: string;
}

export function EnacStatusChip({ children, tone = 'neutral', className }: EnacStatusChipProps): JSX.Element {
  return (
    <span className={`enac-foundation-status-chip is-${tone}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  );
}
