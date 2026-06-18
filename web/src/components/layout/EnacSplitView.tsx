import * as React from 'react';

interface EnacSplitViewProps {
  list: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function EnacSplitView({ list, detail, className, ariaLabel }: EnacSplitViewProps): JSX.Element {
  return (
    <section className={`enac-foundation-split-view${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      <div className="enac-foundation-list-pane">{list}</div>
      {detail && <div className="enac-foundation-detail-pane">{detail}</div>}
    </section>
  );
}
