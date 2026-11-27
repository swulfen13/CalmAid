/** Consistent line icons (24×24, currentColor) — same look on every device, unlike emojis. */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS: Record<string, React.ReactElement> = {
  unconscious: (
    <g {...P}>
      <circle cx="5" cy="15" r="2.2" />
      <path d="M8 14.5h9a3 3 0 0 1 3 3V18H8z" />
      <path d="M2 20h20" />
      <path d="M14 5h4l-4 4h4" />
    </g>
  ),
  bleeding: (
    <g {...P}>
      <path d="M12 2.8s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </g>
  ),
  burn: (
    <g {...P}>
      <path d="M12 2.5c.5 3-2.5 4.5-2.5 7.5 0 1 .5 2 1.3 2.4-.2-1.6.9-2.9 2.2-3.9.4 2.5 3 3.5 3 6.5a4 4 0 0 1-8 0c0-1 .3-2 .8-2.8C6.6 13.6 6 15 6 16.5a6 6 0 0 0 12 0c0-5-6-7-6-14z" />
    </g>
  ),
  choking: (
    <g {...P}>
      <circle cx="12" cy="6.5" r="3.5" />
      <path d="M9.5 10.5v3M14.5 10.5v3" />
      <path d="M5 21v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
      <path d="M7.5 12.5l2.5 1.2 2-1.2 2 1.2 2.5-1.2" />
    </g>
  ),
  circulation: (
    <g {...P}>
      <path d="M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1z" />
      <path d="M3.5 12h4l1.5-3 2.5 6 1.5-3h7.5" />
    </g>
  ),
  stroke: (
    <g {...P}>
      <path d="M9.5 3.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3 3 0 0 0 6 16.5a3 3 0 0 0 3.5 3.8V3.5z" />
      <path d="M14.5 3.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2 3 3 0 0 1-1.5 4.8 3 3 0 0 1-3.5 3.8V3.5z" />
      <path d="M12 3v18" />
    </g>
  ),
  seizure: (
    <g {...P}>
      <path d="M2 12h3l2-5 3 10 3-12 3 10 2-3h4" />
    </g>
  ),
  allergy: (
    <g {...P}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1.2" />
      <circle cx="15" cy="10" r="1.2" />
      <circle cx="12" cy="15" r="1.2" />
      <circle cx="8" cy="15.5" r=".6" />
      <circle cx="16" cy="15" r=".6" />
    </g>
  ),
  poisoning: (
    <g {...P}>
      <path d="M9 2.5h6M10 2.5v4L5.5 13a5.5 5.5 0 0 0 4.8 8.5h3.4a5.5 5.5 0 0 0 4.8-8.5L14 6.5v-4" />
      <path d="M10 13l4 4M14 13l-4 4" />
    </g>
  ),
  help: (
    <g {...P}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v9M7.5 12h9" />
    </g>
  ),
  learn: (
    <g {...P}>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4.5c3 2.5 8 2.5 11 0v-4.5" />
      <path d="M21.5 9.5v5" />
    </g>
  ),
  settings: (
    <g {...P}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </g>
  ),
  mic: (
    <g {...P}>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
    </g>
  ),
  camera: (
    <g {...P}>
      <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2.5h6L16.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </g>
  ),
  type: (
    <g {...P}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </g>
  ),
  phone: (
    <g {...P}>
      <path d="M21.5 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 4.2 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </g>
  ),
  shield: (
    <g {...P}>
      <path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </g>
  ),
  flask: (
    <g {...P}>
      <path d="M9 2.5h6M10 2.5v6.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V2.5" />
      <path d="M7 15h10" />
    </g>
  ),
  check: (
    <g {...P}>
      <path d="M4.5 12.5l5 5 10-11" />
    </g>
  ),
  chevron: (
    <g {...P}>
      <path d="M9 5l7 7-7 7" />
    </g>
  ),
  book: (
    <g {...P}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5" />
    </g>
  ),
  medical: (
    <g {...P}>
      <rect x="3" y="5" width="18" height="15" rx="2.5" />
      <path d="M9 5V3.5h6V5M12 9.5v6M9 12.5h6" />
    </g>
  ),
  list: (
    <g {...P}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" />
    </g>
  ),
  target: (
    <g {...P}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </g>
  ),
  chat: (
    <g {...P}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="3" />
    </g>
  ),
  question: (
    <g {...P}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.3 9a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4" />
      <path d="M12 17.5h.01" strokeWidth="3" />
    </g>
  ),
  pin: (
    <g {...P}>
      <path d="M12 21.5s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </g>
  ),
  volume: (
    <g {...P}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </g>
  ),
  mute: (
    <g {...P}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </g>
  ),
  lock: (
    <g {...P}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </g>
  ),
  pulse: (
    <g {...P}>
      <path d="M2 12h4l2-6 4 12 2-6h8" />
    </g>
  ),
};

export function Icon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {ICONS[name] ?? ICONS.help}
    </svg>
  );
}
