import * as React from 'react';
import { EnacIcon, type EnacIconName } from '../EnacIcon';

export type EnacButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';

export interface EnacButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tratamento visual. */
  variant?: EnacButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Ícone à esquerda — um EnacIconName ou ReactNode. Omita os filhos para um botão só de ícone. */
  icon?: EnacIconName | React.ReactNode;
  /** Ícone à direita. */
  iconRight?: EnacIconName | React.ReactNode;
  /** Largura total. */
  block?: boolean;
}

const VARIANTS: EnacButtonVariant[] = ['primary', 'secondary', 'ghost', 'subtle', 'danger'];

function isIconName(value: EnacIconName | React.ReactNode): value is EnacIconName {
  return typeof value === 'string';
}

function renderGlyph(glyph: EnacIconName | React.ReactNode): React.ReactNode {
  return isIconName(glyph) ? <EnacIcon name={glyph} /> : glyph;
}

/** O botão de ação da ENAC. Primary = vermelho ENAC; secondary = branco com borda vermelha. */
export function EnacButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  type = 'button',
  className,
  ...rest
}: EnacButtonProps): JSX.Element {
  const v: EnacButtonVariant = VARIANTS.indexOf(variant) >= 0 ? variant : 'primary';
  const iconOnly = icon != null && (children == null || children === '');
  const cls = [
    'enac-btn',
    `enac-btn--${v}`,
    size === 'sm' && 'enac-btn--sm',
    size === 'lg' && 'enac-btn--lg',
    block && 'enac-btn--block',
    iconOnly && 'enac-btn--icon',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cls} {...rest}>
      {icon != null && renderGlyph(icon)}
      {children != null && children !== '' && <span>{children}</span>}
      {iconRight != null && renderGlyph(iconRight)}
    </button>
  );
}
