import * as React from 'react';
import { EnacBadge } from '../core/EnacBadge';

export interface EnacTabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
}

export interface EnacTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Lista de abas — strings (id = label) ou {id,label,count}. */
  tabs: Array<string | EnacTabItem>;
  /** Id da aba ativa. */
  value: string;
  onChange?: (id: string) => void;
}

/** Abas segmentadas na página (Resumo · Tendência · Alertas …). */
export function EnacTabs({ tabs, value, onChange, className, ...rest }: EnacTabsProps): JSX.Element {
  return (
    <div className={['enac-tabs', className].filter(Boolean).join(' ')} role="tablist" {...rest}>
      {tabs.map((t) => {
        const id = typeof t === 'string' ? t : t.id;
        const label = typeof t === 'string' ? t : t.label;
        const count = typeof t === 'string' ? undefined : t.count;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'is-active' : undefined}
            onClick={() => onChange && onChange(id)}
          >
            {label}
            {count != null && <EnacBadge muted={!active}>{count}</EnacBadge>}
          </button>
        );
      })}
    </div>
  );
}
