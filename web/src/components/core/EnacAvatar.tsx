import * as React from 'react';

export interface EnacAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nome completo — as iniciais são derivadas dele. */
  name?: string;
  /** URL de imagem opcional; recai para iniciais em um chip grafite. */
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Avatar de usuário — iniciais sobre grafite, ou uma foto. */
export function EnacAvatar({ name = '', src, size = 'md', className, ...rest }: EnacAvatarProps): JSX.Element {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const cls = [
    'enac-avatar',
    size === 'sm' && 'enac-avatar--sm',
    size === 'lg' && 'enac-avatar--lg',
    className
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} title={name || undefined} {...rest}>
      {src ? <img src={src} alt={name} /> : initials || '–'}
    </span>
  );
}
