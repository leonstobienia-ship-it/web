import * as React from 'react';

interface EnacModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
}

export function EnacModal({ open, title, children, actions, onClose }: EnacModalProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="enac-foundation-modal-backdrop" role="presentation">
      <section className="enac-foundation-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          {onClose && <button type="button" onClick={onClose} aria-label="Fechar">Fechar</button>}
        </header>
        <div>{children}</div>
        {actions && <footer>{actions}</footer>}
      </section>
    </div>
  );
}
