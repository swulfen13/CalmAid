/**
 * Simple, calm line drawings for key first-aid steps.
 * Body = soft ink, the action (hands, arrows, water) = accent colour.
 * Pure SVG: works offline and adapts to dark mode via CSS variables.
 */

const B = { fill: 'none', stroke: 'var(--ill-body)', strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const A = { fill: 'none', stroke: 'var(--ill-accent)', strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const AF = { fill: 'var(--ill-accent)', stroke: 'none' };
const BF = { fill: 'var(--ill-skin)', stroke: 'var(--ill-body)', strokeWidth: 5 };

const Arrow = ({ x, y, dir = 'down', len = 26 }: { x: number; y: number; dir?: 'down' | 'up' | 'right' | 'left'; len?: number }) => {
  const d = {
    down: `M${x} ${y} v${len} m-9 -10 l9 10 l9 -10`,
    up: `M${x} ${y} v-${len} m-9 10 l9 -10 l9 10`,
    right: `M${x} ${y} h${len} m-10 -9 l10 9 l-10 9`,
    left: `M${x} ${y} h-${len} m10 -9 l-10 9 l10 9`,
  }[dir];
  return <path d={d} {...A} />;
};

/** Person lying on their back, head on the left. */
const Lying = ({ y = 120, small = false }: { y?: number; small?: boolean }) =>
  small ? (
    <g>
      <circle cx="80" cy={y - 16} r="15" {...BF} />
      <rect x="96" y={y - 30} width="70" height="30" rx="15" {...BF} />
      <path d={`M166 ${y - 22} h24 M166 ${y - 8} h24`} {...B} />
    </g>
  ) : (
    <g>
      <circle cx="42" cy={y - 20} r="18" {...BF} />
      <rect x="62" y={y - 38} width="110" height="38" rx="19" {...BF} />
      <path d={`M172 ${y - 28} h52 M172 ${y - 10} h52`} {...B} />
      <path d={`M14 ${y + 6} h220`} stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
    </g>
  );

const DRAWINGS: Record<string, (p: { number: string }) => React.ReactElement> = {
  phone: ({ number }) => (
    <g>
      <rect x="92" y="18" width="62" height="112" rx="12" {...B} />
      <path d="M114 30 h18" {...B} />
      <text x="123" y="84" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ill-accent)" fontFamily="inherit">
        {number}
      </text>
      <path d="M172 52 q12 22 0 44 M186 42 q20 32 0 64" {...A} />
      <path d="M74 52 q-12 22 0 44 M60 42 q-20 32 0 64" {...A} />
    </g>
  ),
  cpr: () => (
    <g>
      <Lying />
      {/* stacked hands on the chest */}
      <ellipse cx="104" cy="78" rx="18" ry="8" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <ellipse cx="104" cy="68" rx="18" ry="8" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <path d="M92 62 L84 18 M116 62 L124 18" {...A} />
      <Arrow x={150} y={20} len={40} />
      <text x="160" y="50" fontSize="15" fontWeight="700" fill="var(--ill-accent)" fontFamily="inherit">
        5–6 cm
      </text>
    </g>
  ),
  'cpr-baby': () => (
    <g>
      <Lying y={120} small />
      <rect x="114" y="62" width="8" height="30" rx="4" {...AF} />
      <rect x="126" y="62" width="8" height="30" rx="4" {...AF} />
      <Arrow x={170} y={30} len={36} />
      <text x="180" y="56" fontSize="15" fontWeight="700" fill="var(--ill-accent)" fontFamily="inherit">
        4 cm
      </text>
      <path d="M40 126 h180" stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  recovery: () => (
    <g>
      <circle cx="48" cy="96" r="18" {...BF} />
      {/* hand under cheek */}
      <path d="M36 116 q14 6 28 0" {...A} />
      <path d="M68 78 q60 -14 100 6 q8 20 -4 36 q-46 10 -96 -4 z" {...BF} />
      {/* bent top leg */}
      <path d="M160 92 l40 -10 l8 36" {...B} />
      <path d="M164 116 h56" {...B} />
      <path d="M14 136 h220" stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 70 q-14 -14 -6 -30" {...A} />
      <path d="M18 46 l6 -8 l8 6" {...A} />
    </g>
  ),
  pressure: () => (
    <g>
      <rect x="20" y="88" width="210" height="36" rx="18" {...BF} />
      <circle cx="122" cy="98" r="7" fill="#c0392b" />
      <rect x="92" y="62" width="62" height="30" rx="12" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <path d="M100 62 l-10 -40 M146 62 l10 -40" {...A} />
      <Arrow x={123} y={14} len={36} />
    </g>
  ),
  cool: () => (
    <g>
      <path d="M60 22 h70 v20 h-24 v12 h-22 v-12 h-24 z" {...B} />
      <path d="M90 66 v40 M100 66 v48 M110 66 v40" stroke="var(--ill-water)" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" />
      <rect x="30" y="112" width="190" height="28" rx="14" {...BF} />
      <text x="168" y="88" fontSize="18" fontWeight="800" fill="var(--ill-accent)" fontFamily="inherit">
        20 min
      </text>
    </g>
  ),
  backblows: () => (
    <g>
      {/* person bent forward */}
      <circle cx="70" cy="70" r="17" {...BF} />
      <path d="M86 66 q50 -20 84 6 l6 60" {...B} />
      <path d="M100 78 l-6 54" {...B} />
      <path d="M90 80 l-28 22" {...B} />
      {/* striking hand */}
      <ellipse cx="146" cy="38" rx="16" ry="9" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" transform="rotate(-20 146 38)" />
      <path d="M168 22 l26 -10" {...A} />
      <Arrow x={140} y={8} len={18} />
      <path d="M122 20 l-8 -8 M170 46 l10 4" {...A} />
    </g>
  ),
  'backblows-baby': () => (
    <g>
      {/* forearm */}
      <rect x="30" y="104" width="190" height="24" rx="12" {...BF} />
      {/* baby face down along the arm, head lower (left) */}
      <circle cx="62" cy="90" r="13" {...BF} />
      <rect x="76" y="76" width="70" height="26" rx="13" {...BF} />
      <path d="M146 84 h22 M146 96 h22" {...B} />
      <ellipse cx="112" cy="50" rx="16" ry="8" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <Arrow x={112} y={14} len={22} />
    </g>
  ),
  thrusts: () => (
    <g>
      <circle cx="96" cy="26" r="16" {...BF} />
      <path d="M96 42 v58 M96 100 l-18 40 M96 100 l18 40" {...B} />
      {/* helper arms around, fist at belly */}
      <circle cx="96" cy="80" r="10" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <path d="M150 60 q-30 6 -44 18 M150 96 q-30 -6 -44 -12" {...A} />
      <path d="M70 94 q-6 -20 10 -34" {...A} />
      <path d="M72 62 l8 -4 l2 9" {...A} />
    </g>
  ),
  'chest-baby': () => (
    <g>
      <circle cx="60" cy="96" r="15" {...BF} />
      <rect x="76" y="82" width="74" height="30" rx="15" {...BF} />
      <path d="M150 90 h24 M150 104 h24" {...B} />
      <rect x="100" y="48" width="8" height="30" rx="4" {...AF} />
      <rect x="112" y="48" width="8" height="30" rx="4" {...AF} />
      <Arrow x={150} y={24} len={30} />
      <path d="M30 124 h170" stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  sitting: () => (
    <g>
      <path d="M40 16 v124" stroke="var(--ill-ground)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="72" cy="40" r="16" {...BF} />
      <path d="M66 56 q-6 36 12 70 h70 l20 10" {...B} />
      <path d="M74 80 l40 14" {...B} />
      <path d="M30 140 h200" stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
      <path d="M110 30 q20 -10 34 6" {...A} />
    </g>
  ),
  legs: () => (
    <g>
      <circle cx="36" cy="112" r="16" {...BF} />
      <rect x="54" y="98" width="86" height="30" rx="15" {...BF} />
      <path d="M138 104 l60 -34 M138 120 l60 -34" {...B} />
      <rect x="168" y="80" width="56" height="48" rx="6" {...B} />
      <Arrow x={210} y={60} dir="up" len={30} />
      <path d="M14 130 h220" stroke="var(--ill-ground)" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  pen: () => (
    <g>
      <path d="M40 40 q30 -10 70 0 l20 100 h-60 z" {...BF} />
      <rect x="126" y="34" width="22" height="88" rx="8" transform="rotate(30 137 78)" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <Arrow x={196} y={60} dir="left" len={30} />
      <text x="168" y="40" fontSize="15" fontWeight="700" fill="var(--ill-accent)" fontFamily="inherit">
        thigh
      </text>
    </g>
  ),
  fast: () => (
    <g>
      <circle cx="80" cy="74" r="44" {...BF} />
      <circle cx="64" cy="64" r="4" fill="var(--ill-body)" />
      <circle cx="96" cy="66" r="4" fill="var(--ill-body)" />
      {/* drooping smile */}
      <path d="M58 92 q14 10 24 4 q8 -2 16 8" {...A} />
      <path d="M150 120 l20 -60 M196 120 l-4 -40" {...B} />
      <Arrow x={210} y={70} dir="up" len={30} />
    </g>
  ),
  nose: () => (
    <g>
      {/* head tilted forward, profile facing right */}
      <circle cx="112" cy="70" r="40" {...BF} />
      <path d="M150 66 l14 12 l-12 4" {...BF} />
      <circle cx="128" cy="60" r="3.5" fill="var(--ill-body)" />
      <path d="M96 108 q-6 18 -24 30" {...B} />
      {/* thumb + finger pinching the soft part of the nose */}
      <ellipse cx="166" cy="70" rx="7" ry="13" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <ellipse cx="150" cy="90" rx="13" ry="7" fill="var(--ill-accent-soft)" stroke="var(--ill-accent)" strokeWidth="5" />
      <path d="M172 82 q16 22 6 46" {...A} />
      {/* lean-forward arrow */}
      <path d="M60 30 q40 -22 80 -6" {...A} />
      <path d="M128 16 l12 8 l-10 10" {...A} />
      <text x="232" y="146" textAnchor="end" fontSize="15" fontWeight="700" fill="var(--ill-accent)" fontFamily="inherit">
        lean forward
      </text>
    </g>
  ),
};

export function Illustration({ name, number = '112' }: { name?: string; number?: string }) {
  const Drawing = name ? DRAWINGS[name] : undefined;
  if (!Drawing) return null;
  return (
    <figure className="illustration" aria-hidden="true">
      <svg viewBox="0 0 240 150" role="presentation">
        <Drawing number={number} />
      </svg>
    </figure>
  );
}
