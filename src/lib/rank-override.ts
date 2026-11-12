// Regras puras para o Admin definir manualmente o elo de um perfil.
import type { Division, RankState, Tier } from "@/lib/rank-store";
import { seasonFor } from "@/lib/season-engine";

export const ADMIN_TIERS: Tier[] = [
  "iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger",
];

const ELITE: Tier[] = ["master", "grandmaster", "challenger"];
export const ELITE_LP_RANGE: Record<"master" | "grandmaster" | "challenger", [number, number]> = {
  master: [0, 799],
  grandmaster: [800, 1999],
  challenger: [2000, 99999],
};

export function isEliteTier(tier: Tier) {
  return ELITE.includes(tier);
}

/** Normaliza tier/divisão/LP para um estado válido do motor de rank. */
export function normalizeRankTarget(tier: Tier, division: Division, lp: number) {
  const safeLp = Number.isFinite(lp) ? Math.floor(lp) : 0;
  if (isEliteTier(tier)) {
    const [min, max] = ELITE_LP_RANGE[tier as keyof typeof ELITE_LP_RANGE];
    return { tier, division: null as Division, lp: Math.min(max, Math.max(min, safeLp)) };
  }
  const div = (division === 1 || division === 2 || division === 3 || division === 4 ? division : 4) as Division;
  return { tier, division: div, lp: Math.min(99, Math.max(0, safeLp)) };
}

const BASE: RankState = {
  tier: "iron", division: 4, lp: 0, promo: null, history: [], totalEarned: 0, totalLost: 0,
  peakTier: "iron", peakDivision: 4,
};

/** Constrói o novo rank definido pelo admin, preservando estatísticas e histórico. */
export function buildAdminRank(
  current: Partial<RankState> | null,
  target: { tier: Tier; division: Division; lp: number },
  label: string,
  now = new Date(),
): RankState {
  const base: RankState = { ...BASE, ...(current ?? {}) };
  const t = normalizeRankTarget(target.tier, target.division, target.lp);
  return {
    ...base,
    tier: t.tier,
    division: t.division,
    lp: t.lp,
    promo: null,
    peakTier: t.tier,
    peakDivision: t.division,
    season: seasonFor(now).id,
    placementsLeft: 0,
    seasonTransition: undefined,
    adminOverrideAt: now.getTime(),
    history: [{ at: now.getTime(), delta: 0, reason: `Elo definido pelo admin: ${label}` }, ...(base.history ?? [])].slice(0, 60),
  };
}

/** Escolhe o estado canônico entre dois dispositivos: ajuste do admin mais recente vence; senão, maior LP ganho. */
export function pickCanonicalRank(a: RankState, b: RankState): RankState {
  const ao = a.adminOverrideAt ?? 0;
  const bo = b.adminOverrideAt ?? 0;
  if (ao !== bo) return bo > ao ? b : a;
  return (b.totalEarned ?? 0) > (a.totalEarned ?? 0) ? b : a;
}
