interface Props {
  blockId: string;
  className?: string;
}

export default function BlockIcon({ blockId, className = 'w-10 h-10 text-forge-terracotta' }: Props) {
  const svg = (content: React.ReactNode, viewBox = '0 0 40 40') => (
    <svg viewBox={viewBox} className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {content}
    </svg>
  );

  switch (blockId) {
    // ── Layout ─────────────────────────────────────────────────────────────────
    case 'container':
      return svg(<rect x="4" y="8" width="32" height="24" rx="2" />);

    case 'section':
      return svg(
        <>
          <rect x="2" y="6" width="36" height="28" rx="2" />
          <line x1="2" y1="14" x2="38" y2="14" />
        </>,
      );

    case 'flex-row':
      return svg(
        <>
          <rect x="3" y="10" width="9" height="20" rx="1.5" />
          <rect x="15" y="10" width="9" height="20" rx="1.5" />
          <rect x="27" y="10" width="9" height="20" rx="1.5" />
        </>,
      );

    case 'flex-col':
      return svg(
        <>
          <rect x="8" y="4" width="24" height="8" rx="1.5" />
          <rect x="8" y="16" width="24" height="8" rx="1.5" />
          <rect x="8" y="28" width="24" height="8" rx="1.5" />
        </>,
      );

    case 'grid-2':
      return svg(
        <>
          <rect x="3" y="8" width="15" height="24" rx="1.5" />
          <rect x="22" y="8" width="15" height="24" rx="1.5" />
        </>,
      );

    case 'grid-3':
      return svg(
        <>
          <rect x="2" y="10" width="10" height="20" rx="1.5" />
          <rect x="15" y="10" width="10" height="20" rx="1.5" />
          <rect x="28" y="10" width="10" height="20" rx="1.5" />
        </>,
      );

    case 'divider':
      return svg(
        <>
          <line x1="4" y1="20" x2="36" y2="20" strokeWidth="2.5" />
        </>,
      );

    // ── Typography ─────────────────────────────────────────────────────────────
    case 'heading-1':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="currentColor">
          <text x="2" y="30" fontSize="22" fontWeight="800" fontFamily="sans-serif">H1</text>
        </svg>
      );

    case 'heading-2':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="currentColor">
          <text x="2" y="29" fontSize="19" fontWeight="700" fontFamily="sans-serif">H2</text>
        </svg>
      );

    case 'heading-3':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="currentColor">
          <text x="2" y="28" fontSize="16" fontWeight="600" fontFamily="sans-serif">H3</text>
        </svg>
      );

    case 'paragraph':
      return svg(
        <>
          <line x1="4" y1="12" x2="36" y2="12" />
          <line x1="4" y1="20" x2="36" y2="20" />
          <line x1="4" y1="28" x2="28" y2="28" />
        </>,
      );

    case 'label':
      return svg(
        <>
          <line x1="4" y1="20" x2="24" y2="20" strokeWidth="2.5" />
        </>,
      );

    case 'quote':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="currentColor">
          <text x="4" y="32" fontSize="36" fontFamily="Georgia, serif" opacity="0.85">"</text>
        </svg>
      );

    // ── Form ───────────────────────────────────────────────────────────────────
    case 'button-primary':
      return svg(
        <>
          <rect x="4" y="12" width="32" height="16" rx="8" fill="currentColor" stroke="none" />
          <line x1="13" y1="20" x2="27" y2="20" stroke="#111" strokeOpacity="0.5" strokeWidth="2" />
        </>,
      );

    case 'button-outline':
      return svg(<rect x="4" y="12" width="32" height="16" rx="8" />);

    case 'input-text':
      return svg(
        <>
          <rect x="4" y="10" width="32" height="14" rx="2" strokeWidth="1.5" />
          <line x1="9" y1="17" x2="19" y2="17" strokeWidth="1.5" />
          <line x1="20" y1="14" x2="20" y2="20" strokeWidth="1.5" />
        </>,
      );

    case 'textarea':
      return svg(
        <>
          <rect x="4" y="8" width="32" height="24" rx="2" />
          <line x1="8" y1="15" x2="32" y2="15" strokeWidth="1.2" />
          <line x1="8" y1="20" x2="32" y2="20" strokeWidth="1.2" />
          <line x1="8" y1="25" x2="22" y2="25" strokeWidth="1.2" />
        </>,
      );

    case 'select':
      return svg(
        <>
          <rect x="4" y="12" width="32" height="16" rx="2" />
          <polyline points="25,18 29,22 33,18" strokeWidth="1.8" />
        </>,
      );

    case 'badge':
      return svg(
        <>
          <rect x="6" y="14" width="28" height="12" rx="6" />
          <line x1="13" y1="20" x2="27" y2="20" strokeWidth="1.5" />
        </>,
      );

    // ── UI ─────────────────────────────────────────────────────────────────────
    case 'card':
      return svg(
        <>
          <rect x="4" y="6" width="32" height="28" rx="3" />
          <line x1="8" y1="15" x2="32" y2="15" strokeWidth="1.3" />
          <line x1="8" y1="21" x2="28" y2="21" strokeWidth="1.2" />
          <line x1="8" y1="26" x2="24" y2="26" strokeWidth="1.2" />
        </>,
      );

    case 'image':
      return svg(
        <>
          <rect x="4" y="8" width="32" height="24" rx="2" />
          <polyline points="4,25 13,16 20,22 27,15 36,25" strokeWidth="1.5" />
          <circle cx="13" cy="15" r="3" strokeWidth="1.5" />
        </>,
      );

    case 'avatar':
      return svg(
        <>
          <circle cx="20" cy="15" r="7" />
          <path d="M6 34 Q6 26 20 26 Q34 26 34 34" />
        </>,
      );

    case 'alert':
      return svg(
        <>
          <polygon points="20,6 37,34 3,34" strokeWidth="1.8" />
          <line x1="20" y1="17" x2="20" y2="25" strokeWidth="2" />
          <circle cx="20" cy="29" r="1" fill="currentColor" stroke="none" />
        </>,
      );

    default:
      return svg(<rect x="6" y="6" width="28" height="28" rx="2" />);
  }
}
