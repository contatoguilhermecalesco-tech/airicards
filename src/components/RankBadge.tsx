import { TIER_COLORS, TIER_LABEL, DIVISION_ROMAN, isElite, type Tier, type Division } from "@/lib/rank-store";

type Props = {
  tier: Tier;
  division: Division;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

/**
 * Emblema iOS-glass sofisticado — escudo ornamentado com laureis,
 * facetas metálicas e ícone central por tier. Sem neon, sem partículas.
 */
export function RankEmblem({ tier, division, size = 64 }: { tier: Tier; division: Division; size?: number }) {
  const colors = TIER_COLORS[tier];
  const uid = `${tier}-${division ?? "e"}`;
  const gradBody = `rb-body-${uid}`;
  const gradFacet = `rb-facet-${uid}`;
  const gradRim = `rb-rim-${uid}`;
  const gradGlow = `rb-glow-${uid}`;
  const clipShield = `rb-clip-${uid}`;

  // Escudo com topo levemente arqueado e ponta inferior — silhueta clássica.
  const shieldPath =
    "M32 2 C 44 2 55 5 60 8 L 60 30 C 60 46 48 56 32 62 C 16 56 4 46 4 30 L 4 8 C 9 5 20 2 32 2 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
    >
      <defs>
        <linearGradient id={gradBody} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} stopOpacity="1" />
          <stop offset="55%" stopColor={colors.to} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.to} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={gradFacet} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id={gradRim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
        <radialGradient id={gradGlow} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id={clipShield}>
          <path d={shieldPath} />
        </clipPath>
      </defs>

      {/* Halo externo suave */}
      <ellipse cx="32" cy="34" rx="30" ry="30" fill={colors.glow} opacity="0.55" />

      {/* Corpo do escudo */}
      <path d={shieldPath} fill={`url(#${gradBody})`} />

      {/* Facetas metálicas dentro do escudo */}
      <g clipPath={`url(#${clipShield})`}>
        <polygon points="4,8 32,32 4,52" fill={`url(#${gradFacet})`} opacity="0.55" />
        <polygon points="60,8 32,32 60,52" fill={`url(#${gradFacet})`} opacity="0.25" />
        <path d="M4 8 L 32 2 L 60 8 L 32 22 Z" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="32" cy="18" rx="22" ry="8" fill={`url(#${gradGlow})`} />
      </g>

      {/* Borda dupla */}
      <path
        d={shieldPath}
        fill="none"
        stroke={`url(#${gradRim})`}
        strokeWidth="1.4"
      />
      <path
        d="M32 6 C 42 6 52 8 57 11 L 57 30 C 57 44 46 53 32 58 C 18 53 7 44 7 30 L 7 11 C 12 8 22 6 32 6 Z"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.6"
      />

      {/* Laureis laterais — folhas estilizadas */}
      <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinecap="round">
        <path d="M 10 22 Q 6 30 10 40" />
        <path d="M 10 26 Q 7 27 6 25" />
        <path d="M 10 32 Q 6 33 5 31" />
        <path d="M 11 38 Q 7 39 7 36" />
        <path d="M 54 22 Q 58 30 54 40" />
        <path d="M 54 26 Q 57 27 58 25" />
        <path d="M 54 32 Q 58 33 59 31" />
        <path d="M 53 38 Q 57 39 57 36" />
      </g>

      {/* Ícone central por tier */}
      <g>
        {tier === "challenger" && (
          // Coroa real com joia
          <g>
            <path
              d="M 18 36 L 22 22 L 27 30 L 32 18 L 37 30 L 42 22 L 46 36 Z"
              fill="rgba(255,255,255,0.95)"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
            <rect x="19" y="37" width="26" height="4" rx="1.2" fill="rgba(255,255,255,0.95)" />
            <circle cx="22" cy="22" r="1.6" fill={colors.from} />
            <circle cx="32" cy="18" r="2" fill={colors.from} />
            <circle cx="42" cy="22" r="1.6" fill={colors.from} />
          </g>
        )}
        {tier === "grandmaster" && (
          // Espadas cruzadas + gema
          <g>
            <path d="M 20 20 L 44 44 M 44 20 L 20 44" stroke="rgba(255,255,255,0.95)" strokeWidth="2.4" strokeLinecap="round" />
            <polygon points="32,24 40,32 32,40 24,32" fill="rgba(255,255,255,0.95)" />
            <polygon points="32,24 40,32 32,32" fill="rgba(255,255,255,0.4)" />
          </g>
        )}
        {tier === "master" && (
          // Estrela de 6 pontas
          <g fill="rgba(255,255,255,0.95)">
            <polygon points="32,18 36,28 46,28 38,34 41,44 32,38 23,44 26,34 18,28 28,28" />
            <circle cx="32" cy="32" r="2.2" fill={colors.from} />
          </g>
        )}
        {tier === "diamond" && (
          <g>
            <polygon points="32,20 44,32 32,46 20,32" fill="rgba(255,255,255,0.95)" />
            <polygon points="32,20 44,32 32,32 20,32" fill="rgba(255,255,255,0.55)" />
            <path d="M 20 32 L 32 26 L 44 32" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" />
          </g>
        )}
        {tier === "emerald" && (
          // Folha / cristal facetado
          <g>
            <polygon points="32,20 42,26 42,38 32,44 22,38 22,26" fill="rgba(255,255,255,0.92)" />
            <path d="M 22 26 L 32 32 L 42 26 M 32 32 L 32 44" stroke="rgba(0,0,0,0.15)" strokeWidth="0.7" fill="none" />
          </g>
        )}
        {tier === "platinum" && (
          // Cristal alongado
          <g>
            <polygon points="32,18 40,28 36,44 28,44 24,28" fill="rgba(255,255,255,0.94)" />
            <path d="M 24 28 L 40 28 M 32 18 L 32 44" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6" />
          </g>
        )}
        {tier === "gold" && (
          // Sol / estrela clássica
          <g fill="rgba(255,255,255,0.95)">
            <path d="M 32 18 L 35 28 L 46 28 L 37 34 L 40 44 L 32 38 L 24 44 L 27 34 L 18 28 L 29 28 Z" />
          </g>
        )}
        {tier === "silver" && (
          // Losango prateado com contorno
          <g>
            <polygon points="32,22 42,32 32,42 22,32" fill="rgba(255,255,255,0.9)" />
            <polygon points="32,26 38,32 32,38 26,32" fill="rgba(255,255,255,0.5)" />
          </g>
        )}
        {tier === "bronze" && (
          // Escudo bronze menor
          <g>
            <path
              d="M 32 20 C 38 20 42 22 42 22 L 42 32 C 42 38 37 42 32 44 C 27 42 22 38 22 32 L 22 22 C 22 22 26 20 32 20 Z"
              fill="rgba(255,255,255,0.9)"
            />
            <path d="M 26 30 L 32 34 L 38 30" stroke={colors.to} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        )}
        {tier === "iron" && (
          // Machado / âncora sóbria
          <g fill="rgba(255,255,255,0.88)">
            <rect x="30.5" y="20" width="3" height="24" rx="1" />
            <path d="M 22 26 L 42 26 L 40 30 L 24 30 Z" />
            <circle cx="32" cy="42" r="2.5" fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="1.5" />
          </g>
        )}
      </g>

      {/* Chevrons de divisão (iron..diamond) */}
      {!isElite(tier) && division !== null && (
        <g
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {Array.from({ length: 5 - division }).map((_, i) => (
            <path
              key={i}
              d={`M ${26 - i * 1.2} ${50 + i * 0} L 32 ${52.5 + i * 0} L ${38 + i * 1.2} ${50 + i * 0}`}
              transform={`translate(0 ${i * 2.2})`}
              opacity={0.95 - i * 0.15}
            />
          ))}
        </g>
      )}

      {/* Highlight superior — vidro */}
      <path
        d="M 10 10 Q 32 4 54 10 Q 44 16 32 16 Q 20 16 10 10 Z"
        fill="rgba(255,255,255,0.28)"
      />
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
