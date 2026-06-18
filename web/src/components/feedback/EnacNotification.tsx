import * as React from 'react';

export type EnacNotificationTone = 'success' | 'warning' | 'error' | 'info';

export interface EnacNotificationProps {
  message: string;
  title?: string;
  tone?: EnacNotificationTone;
  onClose?: () => void;
}

const defaultTitle: Record<EnacNotificationTone, string> = {
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  info: 'Informação'
};

export function EnacNotification({
  message,
  title,
  tone = 'info',
  onClose
}: EnacNotificationProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  const role = tone === 'error' ? 'alert' : 'status';

  return (
    <div
      className={`enac-notification enac-notification--${tone}`}
      role={role}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className="enac-notification__body">
        <strong>{title || defaultTitle[tone]}</strong>
        <span>{message}</span>
      </div>
      {onClose && (
        <button type="button" className="enac-notification__close" onClick={onClose} aria-label="Fechar aviso">
          ×
        </button>
      )}
    </div>
  );
}
