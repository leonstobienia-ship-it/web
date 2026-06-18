import * as React from 'react';

export interface EnacAuditTrailEvent {
  id: string;
  action: string;
  module: string;
  user: string;
  timestamp: string;
  note?: string;
  statusFrom?: string;
  statusTo?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface EnacAuditTrailProps {
  title?: string;
  description?: string;
  events: EnacAuditTrailEvent[];
  emptyText?: string;
}

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function EnacAuditTrail({
  title = 'Histórico e auditoria mock',
  description = 'Eventos locais para rastreabilidade visual; sem integração externa real.',
  events,
  emptyText = 'Sem eventos de auditoria mock para este registro.'
}: EnacAuditTrailProps): JSX.Element {
  return (
    <section className="enac-audit-trail" aria-label={title}>
      <div className="enac-audit-trail__head">
        <span className="enac-web-card-label">Rastreabilidade</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {events.length === 0 ? (
        <div className="enac-cadastro-empty">{emptyText}</div>
      ) : (
        <ol className="enac-audit-trail__list">
          {events.map((event) => (
            <li className={`enac-audit-trail__event is-${event.tone || 'neutral'}`} key={event.id}>
              <div>
                <strong>{event.action}</strong>
                <span>{event.module} · {event.user}</span>
              </div>
              <time dateTime={event.timestamp}>{formatDateTime(event.timestamp)}</time>
              {(event.statusFrom || event.statusTo) && (
                <small>
                  {event.statusFrom || '-'} → {event.statusTo || '-'}
                </small>
              )}
              {event.note && <p>{event.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
