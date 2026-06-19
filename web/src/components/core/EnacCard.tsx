import * as React from 'react';

export interface EnacCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Título do card. */
  title?: React.ReactNode;
  /** Rótulo vermelho em maiúsculas acima do título. */
  label?: React.ReactNode;
  /** Ações de cabeçalho alinhadas à direita. */
  actions?: React.ReactNode;
  /** Superfície cinza recuada em vez de branca. */
  soft?: boolean;
  /** Defina false para remover o padding do corpo (ex.: ao envolver uma tabela). */
  padded?: boolean;
}

/** Contêiner de superfície branca com cabeçalho rotulado + ações opcionais. */
export function EnacCard({
  children,
  title,
  label,
  actions,
  soft = false,
  padded = true,
  className,
  ...rest
}: EnacCardProps): JSX.Element {
  const cls = ['enac-card', soft && 'enac-card--soft', !padded && 'enac-card--flush', className]
    .filter(Boolean)
    .join(' ');
  const hasHead = title != null || label != null || actions != null;
  const headCls = ['enac-card-header', !padded && 'enac-card-header--flush'].filter(Boolean).join(' ');
  return (
    <section className={cls} {...rest}>
      {hasHead && (
        <header className={headCls}>
          <div className="enac-card-heading">
            {label != null && <span className="enac-card-label">{label}</span>}
            {title != null && <h3 className="enac-card-title">{title}</h3>}
          </div>
          {actions != null && <div className="enac-card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
