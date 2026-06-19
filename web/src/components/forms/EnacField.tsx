import * as React from 'react';

export interface EnacFieldOption {
  value: string;
  label: string;
}

export interface EnacFieldProps {
  /** Rótulo de campo em maiúsculas. */
  label?: React.ReactNode;
  /** Texto de apoio abaixo do controle. */
  hint?: React.ReactNode;
  required?: boolean;
  /** Controle embutido a renderizar quando nenhum filho é passado. */
  control?: 'input' | 'select' | 'textarea';
  /** Opções para control="select" (strings ou {value,label}). */
  options?: Array<string | EnacFieldOption>;
  /** Forneça um controle customizado em vez do embutido. */
  children?: React.ReactNode;
  className?: string;
  id?: string;
  [prop: string]: unknown;
}

let _id = 0;
const nextId = (): string => `enac-f-${++_id}`;

/** Campo de formulário rotulado — aplica os estilos de input/select/textarea da ENAC. */
export function EnacField({
  label,
  hint,
  required,
  control = 'input',
  options,
  children,
  className,
  id,
  ...rest
}: EnacFieldProps): JSX.Element {
  const autoId = React.useMemo(nextId, []);
  const fid = id || autoId;

  let field = children;
  if (!field) {
    if (control === 'select') {
      field = (
        <select id={fid} className="enac-select" {...rest}>
          {(options || []).map((o) => {
            const value = typeof o === 'string' ? o : o.value;
            const optionLabel = typeof o === 'string' ? o : o.label;
            return (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      );
    } else if (control === 'textarea') {
      field = <textarea id={fid} className="enac-textarea" {...rest} />;
    } else {
      field = <input id={fid} className="enac-input" {...rest} />;
    }
  }

  return (
    <div className={['enac-field', className].filter(Boolean).join(' ')}>
      {label != null && (
        <label className="enac-label" htmlFor={fid}>
          {label}
          {required && <span className="enac-field-required">*</span>}
        </label>
      )}
      {field}
      {hint != null && <small className="enac-field-hint">{hint}</small>}
    </div>
  );
}
