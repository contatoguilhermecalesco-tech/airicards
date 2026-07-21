import { TIER_COLORS, TIER_LABEL, DIVISION_ROMAN, isElite, type Tier, type Division } from "@/lib/rank-store";

type Props = {
  tier: Tier;
  division: Division;
  size?: number; // px
  showLabel?: boolean;
  className?: string;
};

/**
 * Emblema geométrico iOS-glass — sem neon, sem partículas.
 * Iron..Diamond: escudo hexagonal com chevrons da divisão.
 * Master: estrela.
 * Grandmaster: gema (losango).
 * Challenger: coroa.
 */
export function RankEmblem({ tier, division, size = 64 }: { tier: Tier; division: Division; size?: number }) {
  const colors = TIER_COLORS[tier];
  const gradId = `rank-grad-${tier}`;
  const ringId = `rank-ring-${tier}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className="drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
        </linearGradient>
      </defs>

      {/* Forma base — hexágono para todos, com detalhes específicos por tier */}
      <polygon
        points="32,3 57,17 57,47 32,61 7,47 7,17"
        fill={`url(#${gradId})`}
        stroke={`url(#${ringId})`}
        strokeWidth="1.2"
      />
      {/* Rim light no topo */}
      <path
        d="M 12 15 L 32 4 L 52 15"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {tier === "challenger" && (
        // Coroa
        <g fill="rgba(255,255,255,0.92)">
          <path d="M 18 38 L 22 24 L 28 32 L 32 20 L 36 32 L 42 24 L 46 38 Z" />
          <rect x="18" y="40" width="28" height="4" rx="1" />
        </g>
      )}
      {tier === "grandmaster" && (
        // Gema losango
        <g>
          <polygon points="32,18 44,32 32,46 20,32" fill="rgba(255,255,255,0.92)" />
          <polygon points="32,18 44,32 32,32" fill="rgba(255,255,255,0.35)" />
        </g>
      )}
      {tier === "master" && (
        // Estrela
        <path
          d="M 32 18 L 35.5 28 L 46 28.5 L 37.5 34.5 L 41 45 L 32 39 L 23 45 L 26.5 34.5 L 18 28.5 L 28.5 28 Z"
          fill="rgba(255,255,255,0.92)"
        />
      )}
      {!isElite(tier) && division !== null && (
        // Chevrons — número = 5 - divisão (Iron IV = 1 chevron, Iron I = 4)
        <g fill="rgba(255,255,255,0.85)">
          {Array.from({ length: 5 - division }).map((_, i) => (
            <path
              key={i}
              d={`M 22 ${28 + i * 5} L 32 ${33 + i * 5} L 42 ${28 + i * 5}`}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export function RankBadge({ tier, division, size = 40, showLabel = true, className = "" }: Props) {
  const colors = TIER_COLORS[tier];
  const label = isElite(tier)
    ? TIER_LABEL[tier]
    : `${TIER_LABEL[tier]} ${DIVISION_ROMAN[division as Exclude<Division, null>]}`;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <RankEmblem tier={tier} division={division} size={size} />
      {showLabel && (
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: colors.text }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
