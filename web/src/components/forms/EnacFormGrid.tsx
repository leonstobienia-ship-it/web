import * as React from 'react';

interface EnacFormGridProps {
  children: React.ReactNode;
  className?: string;
}

export function EnacFormGrid({ children, className }: EnacFormGridProps): JSX.Element {
  return <div className={`enac-foundation-form-grid${className ? ` ${className}` : ''}`}>{children}</div>;
}
