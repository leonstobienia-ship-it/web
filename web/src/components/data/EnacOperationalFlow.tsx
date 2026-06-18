import * as React from 'react';

export type EnacOperationalStepState = 'done' | 'active' | 'pending' | 'blocked';

export interface EnacOperationalStep {
  key: string;
  label: string;
  state: EnacOperationalStepState;
  detail?: string;
}

export interface EnacOperationalFlowProps {
  title?: string;
  steps: EnacOperationalStep[];
}

export function EnacOperationalFlow({
  title = 'Fluxo operacional',
  steps
}: EnacOperationalFlowProps): JSX.Element {
  return (
    <section className="enac-operational-flow" aria-label={title}>
      <div className="enac-operational-flow__head">
        <span className="enac-web-card-label">V3.19</span>
        <h3>{title}</h3>
      </div>
      <ol className="enac-operational-flow__steps">
        {steps.map((step) => (
          <li className={`enac-operational-flow__step is-${step.state}`} key={step.key}>
            <span>{step.label}</span>
            {step.detail && <small>{step.detail}</small>}
          </li>
        ))}
      </ol>
    </section>
  );
}
