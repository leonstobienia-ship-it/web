import * as React from 'react';

export type EnacIconName =
  | 'access'
  | 'analytics'
  | 'architecture'
  | 'budget'
  | 'calendar'
  | 'cart'
  | 'chart'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'clipboard'
  | 'compare'
  | 'contract'
  | 'dashboard'
  | 'database'
  | 'documents'
  | 'finance'
  | 'home'
  | 'invoice'
  | 'layers'
  | 'operations'
  | 'payable'
  | 'projects'
  | 'registry'
  | 'report'
  | 'roadmap'
  | 'ruler'
  | 'settings'
  | 'shield'
  | 'shopping'
  | 'tasks'
  | 'timeline'
  | 'warning'
  | 'workflow';

interface EnacIconProps {
  name: EnacIconName;
  className?: string;
}

export function EnacIcon({ name, className }: EnacIconProps): JSX.Element {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {renderIcon(name)}
    </svg>
  );
}

function renderIcon(name: EnacIconName): React.ReactNode {
  switch (name) {
    case 'access':
      return (
        <>
          <path d="M16.5 10.5V8a4.5 4.5 0 0 0-9 0v2.5" />
          <rect x="5" y="10.5" width="14" height="9" rx="2" />
          <path d="M12 14v2" />
        </>
      );
    case 'analytics':
      return (
        <>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15l3-4 3 2 4-6" />
          <path d="M8 19v-4" />
          <path d="M14 19v-6" />
          <path d="M19 19V7" />
        </>
      );
    case 'architecture':
      return (
        <>
          <rect x="4" y="4" width="6" height="5" rx="1" />
          <rect x="14" y="4" width="6" height="5" rx="1" />
          <rect x="9" y="15" width="6" height="5" rx="1" />
          <path d="M7 9v3h5v3" />
          <path d="M17 9v3h-5" />
        </>
      );
    case 'budget':
      return (
        <>
          <path d="M5 5h14" />
          <path d="M5 10h14" />
          <path d="M5 15h8" />
          <path d="M7 5v14" />
          <path d="M17 5v7" />
          <path d="M15 18h5" />
          <path d="M17.5 15.5v5" />
        </>
      );
    case 'calendar':
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="M8 14h3" />
          <path d="M14 14h2" />
        </>
      );
    case 'cart':
      return (
        <>
          <path d="M4 5h2l2 10h9l2-7H7" />
          <circle cx="10" cy="19" r="1" />
          <circle cx="17" cy="19" r="1" />
        </>
      );
    case 'chart':
      return (
        <>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M7 15l3-4 4 3 5-7" />
        </>
      );
    case 'check':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.5 12.5l2.2 2.2 4.8-5.2" />
        </>
      );
    case 'chevron-down':
      return <path d="M7 10l5 5 5-5" />;
    case 'chevron-left':
      return <path d="M14 7l-5 5 5 5" />;
    case 'chevron-right':
      return <path d="M10 7l5 5-5 5" />;
    case 'chevron-up':
      return <path d="M7 14l5-5 5 5" />;
    case 'clipboard':
      return (
        <>
          <rect x="6" y="5" width="12" height="15" rx="2" />
          <path d="M9 5a3 3 0 0 1 6 0" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
        </>
      );
    case 'compare':
      return (
        <>
          <path d="M7 7h11" />
          <path d="M14 4l4 3-4 3" />
          <path d="M17 17H6" />
          <path d="M10 14l-4 3 4 3" />
        </>
      );
    case 'contract':
      return (
        <>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h4" />
          <path d="M10 12h5" />
          <path d="M10 16h4" />
        </>
      );
    case 'dashboard':
      return (
        <>
          <path d="M5 13a7 7 0 1 1 14 0" />
          <path d="M12 13l4-4" />
          <path d="M6 17h12" />
        </>
      );
    case 'database':
      return (
        <>
          <ellipse cx="12" cy="5" rx="7" ry="3" />
          <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
        </>
      );
    case 'documents':
      return (
        <>
          <path d="M8 4h8l3 3v12H8z" />
          <path d="M16 4v4h3" />
          <path d="M5 7v13h10" />
        </>
      );
    case 'finance':
      return (
        <>
          <path d="M12 3v18" />
          <path d="M16 7.5c-.7-1-2-1.5-3.8-1.5-2 0-3.2.9-3.2 2.2 0 3.2 7.2 1.6 7.2 5.6 0 1.6-1.5 2.7-4 2.7-1.9 0-3.4-.6-4.2-1.8" />
        </>
      );
    case 'home':
      return (
        <>
          <path d="M4 11l8-7 8 7" />
          <path d="M7 10.5V20h10v-9.5" />
          <path d="M10 20v-5h4v5" />
        </>
      );
    case 'invoice':
      return (
        <>
          <path d="M7 4h10v16l-2-1-2 1-2-1-2 1-2-1z" />
          <path d="M10 9h4" />
          <path d="M10 13h4" />
          <path d="M10 16h2" />
        </>
      );
    case 'layers':
      return (
        <>
          <path d="M12 3l8 4-8 4-8-4z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 17l8 4 8-4" />
        </>
      );
    case 'operations':
      return (
        <>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </>
      );
    case 'payable':
      return (
        <>
          <path d="M5 5h14v14H5z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
          <path d="M14 17l2 2 4-4" />
        </>
      );
    case 'projects':
      return (
        <>
          <path d="M4 20h16" />
          <path d="M6 20V8l6-4 6 4v12" />
          <path d="M10 20v-6h4v6" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
        </>
      );
    case 'registry':
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h4" />
          <path d="M8 13h8" />
          <path d="M8 17h6" />
        </>
      );
    case 'report':
      return (
        <>
          <path d="M6 4h12v16H6z" />
          <path d="M9 15v-4" />
          <path d="M12 15V8" />
          <path d="M15 15v-6" />
        </>
      );
    case 'roadmap':
      return (
        <>
          <path d="M6 18c4 0 4-12 8-12h4" />
          <path d="M18 6l-2-2" />
          <path d="M18 6l-2 2" />
          <circle cx="6" cy="18" r="2" />
        </>
      );
    case 'ruler':
      return (
        <>
          <path d="M4 17L17 4l3 3L7 20z" />
          <path d="M13 8l2 2" />
          <path d="M10 11l2 2" />
          <path d="M7 14l2 2" />
        </>
      );
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="M5.6 5.6l2.1 2.1" />
          <path d="M16.3 16.3l2.1 2.1" />
          <path d="M18.4 5.6l-2.1 2.1" />
          <path d="M7.7 16.3l-2.1 2.1" />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M12 3l7 3v5c0 4.6-2.8 7.8-7 10-4.2-2.2-7-5.4-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </>
      );
    case 'shopping':
      return (
        <>
          <path d="M6 8h12l-1 12H7z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </>
      );
    case 'tasks':
      return (
        <>
          <path d="M9 6h11" />
          <path d="M9 12h11" />
          <path d="M9 18h11" />
          <path d="M4 6l1 1 2-2" />
          <path d="M4 12l1 1 2-2" />
          <path d="M4 18l1 1 2-2" />
        </>
      );
    case 'timeline':
      return (
        <>
          <path d="M5 6h4" />
          <path d="M5 12h10" />
          <path d="M5 18h14" />
          <circle cx="9" cy="6" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="19" cy="18" r="2" />
        </>
      );
    case 'warning':
      return (
        <>
          <path d="M12 4l9 16H3z" />
          <path d="M12 9v5" />
          <path d="M12 17h.01" />
        </>
      );
    case 'workflow':
      return (
        <>
          <rect x="4" y="5" width="5" height="5" rx="1" />
          <rect x="15" y="14" width="5" height="5" rx="1" />
          <path d="M9 7.5h5a3 3 0 0 1 3 3V14" />
          <path d="M15 11l2 3 2-3" />
        </>
      );
    default:
      return null;
  }
}
