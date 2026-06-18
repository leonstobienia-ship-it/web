import * as React from 'react';

interface EnacEmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EnacEmptyState({ title, description, action, className }: EnacEmptyStateProps): JSX.Element {
  return (
    <div className={`enac-foundation-empty-state${className ? ` ${className}` : ''}`}>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
