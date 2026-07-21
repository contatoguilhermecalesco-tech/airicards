import { TIER_COLORS, TIER_LABEL, DIVISION_ROMAN, isElite, type Tier, type Division } from "@/lib/rank-store";

type Props = {
  tier: Tier;
  division: Division;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

/**
 * Emblema estilo League of Legends — asas angulares metálicas com cristal central.
 * Silhueta pontiaguda, facetada, com brilhos metálicos.
 */
export function RankEmblem({ tier, division, size = 64 }: { tier: Tier; division: Division; size?: number }) {
  const colors = TIER_COLORS[tier];
  const uid = `${tier}-${division ?? "e"}`;
  const gBody = `rb-body-${uid}`;
  const gWing = `rb-wing-${uid}`;
  const gCrystal = `rb-cry-${uid}`;
  const gShine = `rb-shine-${uid}`;
  const gRim = `rb-rim-${uid}`;
  const gDark = `rb-dark-${uid}`;

  // Silhueta de asas anguladas — pontas afiadas para fora, cristal no centro.
  // viewBox 100x80 para dar largura das "asas"
  const leftWing =
    "M 50 20 L 26 14 L 8 22 L 14 32 L 4 34 L 18 44 L 10 50 L 30 52 L 42 60 L 50 46 Z";
  const rightWing =
    "M 50 20 L 74 14 L 92 22 L 86 32 L 96 34 L 82 44 L 90 50 L 70 52 L 58 60 L 50 46 Z";
  // Cristal central (losango vertical alongado)
  const crystal = "M 50 8 L 58 30 L 50 62 L 42 30 Z";

  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 100 80"
      aria-hidden
      className="drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]"
    >
      <defs>
        <linearGradient id={gBody} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="50%" stopColor={colors.to} />
          <stop offset="100%" stopColor={colors.from} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={gWing} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.ring} stopOpacity="0.95" />
          <stop offset="40%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <linearGradient id={gCrystal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="45%" stopColor={colors.ring} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <linearGradient id={gShine} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id={gRim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
        </linearGradient>
        <linearGradient id={gDark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={colors.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Halo ambiente */}
      <ellipse cx="50" cy="40" rx="48" ry="34" fill={`url(#${uid}-halo)`} opacity="0.9" />

      {/* --- ASA ESQUERDA --- */}
      <g>
        <path d={leftWing} fill={`url(#${gWing})`} />
        {/* Facetas internas */}
        <path d="M 50 20 L 26 14 L 30 26 L 50 30 Z" fill="rgba(255,255,255,0.22)" />
        <path d="M 8 22 L 26 14 L 30 26 L 14 32 Z" fill="rgba(0,0,0,0.18)" />
        <path d="M 14 32 L 30 26 L 34 40 L 18 44 Z" fill="rgba(255,255,255,0.12)" />
        <path d="M 18 44 L 34 40 L 42 60 L 30 52 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 50 20 L 50 46 L 42 60 L 34 40 L 30 26 Z" fill={`url(#${gDark})`} opacity="0.55" />
        {/* Rim highlight */}
        <path d={leftWing} fill="none" stroke={`url(#${gRim})`} strokeWidth="0.9" strokeLinejoin="round" />
        {/* Brilho superior */}
        <path d="M 50 20 L 26 14 L 8 22 L 22 20 L 36 20 Z" fill={`url(#${gShine})`} opacity="0.55" />
      </g>

      {/* --- ASA DIREITA --- */}
      <g>
        <path d={rightWing} fill={`url(#${gWing})`} />
        <path d="M 50 20 L 74 14 L 70 26 L 50 30 Z" fill="rgba(255,255,255,0.22)" />
        <path d="M 92 22 L 74 14 L 70 26 L 86 32 Z" fill="rgba(0,0,0,0.18)" />
        <path d="M 86 32 L 70 26 L 66 40 L 82 44 Z" fill="rgba(255,255,255,0.12)" />
        <path d="M 82 44 L 66 40 L 58 60 L 70 52 Z" fill="rgba(0,0,0,0.2)" />
        <path d="M 50 20 L 50 46 L 58 60 L 66 40 L 70 26 Z" fill={`url(#${gDark})`} opacity="0.55" />
        <path d={rightWing} fill="none" stroke={`url(#${gRim})`} strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M 50 20 L 74 14 L 92 22 L 78 20 L 64 20 Z" fill={`url(#${gShine})`} opacity="0.55" />
      </g>

      {/* --- BANDA CENTRAL METÁLICA (base do cristal) --- */}
      <g>
        <path
          d="M 34 44 L 66 44 L 62 54 L 38 54 Z"
          fill={`url(#${gBody})`}
          stroke={`url(#${gRim})`}
          strokeWidth="0.7"
        />
        <path d="M 34 44 L 66 44 L 62 48 L 38 48 Z" fill="rgba(255,255,255,0.28)" />
        <path d="M 38 54 L 62 54 L 58 58 L 42 58 Z" fill="rgba(0,0,0,0.35)" />
      </g>

      {/* --- CRISTAL CENTRAL --- */}
      <g>
        <path d={crystal} fill={`url(#${gCrystal})`} />
        {/* Facetas do cristal */}
        <path d="M 50 8 L 58 30 L 50 30 Z" fill="rgba(255,255,255,0.55)" />
        <path d="M 50 8 L 42 30 L 50 30 Z" fill="rgba(255,255,255,0.25)" />
        <path d="M 50 30 L 58 30 L 50 62 Z" fill="rgba(0,0,0,0.28)" />
        <path d="M 50 30 L 42 30 L 50 62 Z" fill="rgba(0,0,0,0.12)" />
        <path d={crystal} fill="none" stroke={`url(#${gRim})`} strokeWidth="0.8" strokeLinejoin="round" />
        {/* Reflexo especular */}
        <path d="M 48 12 L 52 12 L 51 26 L 49 26 Z" fill="rgba(255,255,255,0.9)" opacity="0.7" />
      </g>

      {/* --- ORNAMENTOS DE TIER (topo do cristal para tiers altos) --- */}
      {tier === "challenger" && (
        <g>
          {/* Coroa sobre o cristal */}
          <path
            d="M 42 8 L 46 2 L 50 6 L 54 2 L 58 8 Z"
            fill="rgba(255,255,255,0.95)"
            stroke={colors.ring}
            strokeWidth="0.6"
          />
          <circle cx="50" cy="6" r="1.4" fill={colors.from} />
        </g>
      )}
      {tier === "grandmaster" && (
        <g>
          {/* Chifres/picos flamejantes */}
          <path d="M 44 10 L 42 2 L 47 8 Z M 56 10 L 58 2 L 53 8 Z" fill={colors.ring} />
        </g>
      )}
      {tier === "master" && (
        <g>
          {/* Estrela sobre o cristal */}
          <path d="M 50 2 L 52 6 L 56 6 L 53 9 L 54 13 L 50 11 L 46 13 L 47 9 L 44 6 L 48 6 Z" fill="rgba(255,255,255,0.95)" />
        </g>
      )}

      {/* --- CHEVRONS DE DIVISÃO (iron..diamond) --- */}
      {!isElite(tier) && division !== null && (
        <g
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {Array.from({ length: 5 - division }).map((_, i) => (
            <path
              key={i}
              d={`M ${42 + i * 0.6} ${68 + i * 3} L 50 ${71 + i * 3} L ${58 - i * 0.6} ${68 + i * 3}`}
              opacity={0.95 - i * 0.18}
            />
          ))}
        </g>
      )}

      {/* Brilho especular geral */}
      <path
        d="M 10 18 Q 50 8 90 18 Q 70 24 50 24 Q 30 24 10 18 Z"
        fill="rgba(255,255,255,0.18)"
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
