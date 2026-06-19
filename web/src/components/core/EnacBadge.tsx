import * as React from 'react';

export interface EnacBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Usa o tratamento cinza neutro em vez do vermelho ENAC. */
  muted?: boolean;
}

/** Badge pequeno de contagem para itens de nav, abas e filas de tarefas. */
export function EnacBadge({ children, muted = false, className, ...rest }: EnacBadgeProps): JSX.Element {
  const cls = ['enac-badge', muted && 'enac-badge--muted', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}
