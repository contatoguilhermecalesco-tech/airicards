// Sistema de rank estilo LoL — persistido em localStorage por perfil.
// Isolado por perfil (Guilherme / Arlayne), sem mesclar entre contas.
import { useSyncExternalStore } from "react";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";

export type Tier =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "emerald"
  | "diamond"
  | "master"
  | "grandmaster"
  | "challenger";

export type Division = 4 | 3 | 2 | 1 | null;

export type PromoSeries = {
  wins: number;
  losses: number;
  target: number; // vitórias necessárias
  maxLosses: number; // derrotas que cancelam
};

export type RankEvent = {
  at: number;
  delta: number;
  reason: string;
};

export type RankState = {
  tier: Tier;
  division: Division;
  lp: number;
  promo: PromoSeries | null;
  history: RankEvent[];
  totalEarned: number;
  totalLost: number;
  peakTier: Tier;
  peakDivision: Division;
};

export const TIER_ORDER: Tier[] = [
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
];

export const TIER_LABEL: Record<Tier, string> = {
  iron: "Ferro",
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
  emerald: "Esmeralda",
  diamond: "Diamante",
  master: "Mestre",
  grandmaster: "Grão-Mestre",
  challenger: "Desafiante",
};

export const DIVISION_ROMAN: Record<Exclude<Division, null>, string> = {
  4: "IV",
  3: "III",
  2: "II",
  1: "I",
};

// Paletas iOS sóbrias — sem neon. Cada tier tem cor primária + secundária
// para gradientes de emblema e halos de UI.
export const TIER_COLORS: Record<
  Tier,
  { from: string; to: string; ring: string; text: string; glow: string }
> = {
  iron: { from: "#6b6975", to: "#3a3841", ring: "#8a8794", text: "#c6c4cf", glow: "rgba(138,135,148,0.25)" },
  bronze: { from: "#c88a55", to: "#7a4a25", ring: "#e0a473", text: "#f0c7a3", glow: "rgba(224,164,115,0.28)" },
  silver: { from: "#d8dbe4", to: "#8b90a0", ring: "#e6e9f0", text: "#f2f4f9", glow: "rgba(230,233,240,0.28)" },
  gold: { from: "#f2c94c", to: "#a37619", ring: "#ffd66b", text: "#ffe9a8", glow: "rgba(255,214,107,0.32)" },
  platinum: { from: "#a7e5da", to: "#4c8a80", ring: "#c5f0e6", text: "#dcf5ee", glow: "rgba(197,240,230,0.28)" },
  emerald: { from: "#3ecf8e", to: "#1a6b48", ring: "#6be0aa", text: "#b6f0d3", glow: "rgba(107,224,170,0.3)" },
  diamond: { from: "#8ab8ff", to: "#2f4e9e", ring: "#b3d1ff", text: "#d8e6ff", glow: "rgba(179,209,255,0.3)" },
  master: { from: "#b78bff", to: "#5a2fa8", ring: "#d0b3ff", text: "#e6d6ff", glow: "rgba(208,179,255,0.35)" },
  grandmaster: { from: "#ff6b7a", to: "#8a1e2a", ring: "#ff96a2", text: "#ffcfd5", glow: "rgba(255,150,162,0.32)" },
  challenger: { from: "#f5f0ff", to: "#a48bff", ring: "#ffffff", text: "#ffffff", glow: "rgba(245,240,255,0.4)" },
};

const LP_PER_DIVISION = 100;
const PROMO_WINS_REQUIRED = 3;
const PROMO_MAX_LOSSES = 2;

// Elite (a partir de Mestre): LP total é livre. Faixas visuais:
const ELITE_GRANDMASTER_LP = 800;
const ELITE_CHALLENGER_LP = 2000;


export const INITIAL_RANK: RankState = {
  tier: "iron",
  division: 4,
  lp: 0,
  promo: null,
  history: [],
  totalEarned: 0,
  totalLost: 0,
  peakTier: "iron",
  peakDivision: 4,
};

// -------- persistência por perfil (localStorage) ----------------------
function isBrowser() {
  return typeof window !== "undefined";
}
function keyFor(profileId: string) {
  return `airi.rank.${profileId}.v1`;
}
function load(profileId: string): RankState {
  if (!isBrowser()) return INITIAL_RANK;
  try {
    const raw = localStorage.getItem(keyFor(profileId));
    if (!raw) return INITIAL_RANK;
    const parsed = JSON.parse(raw) as RankState;
    return { ...INITIAL_RANK, ...parsed };
  } catch {
    return INITIAL_RANK;
  }
}
function save(profileId: string, state: RankState) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(state));
  } catch {}
}

// -------- estado em memória -------------------------------------------
let activeProfile: string | null = null;
let state: RankState = INITIAL_RANK;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

// -------- eventos de promoção (para animação de UI) --------------------
export type RankPromotionEvent = {
  fromTier: Tier;
  fromDivision: Division;
  toTier: Tier;
  toDivision: Division;
  kind: "tier" | "division";
  at: number;
};
const promoListeners = new Set<(e: RankPromotionEvent) => void>();
export function onRankPromotion(cb: (e: RankPromotionEvent) => void) {
  promoListeners.add(cb);
  return () => promoListeners.delete(cb);
}
function emitPromotion(e: RankPromotionEvent) {
  promoListeners.forEach((l) => {
    try { l(e); } catch {}
  });
}


export function setActiveRankProfile(profileId: string | null) {
  if (activeProfile === profileId) return;
  activeProfile = profileId;
  state = profileId ? load(profileId) : INITIAL_RANK;
  emit();
}

if (isBrowser()) {
  const apply = () => {
    const p = getCurrentProfile();
    setActiveRankProfile(p?.id ?? null);
  };
  apply();
  subscribeProfile(apply);
}

function persist() {
  if (activeProfile) save(activeProfile, state);
}

// -------- lógica de progressão ----------------------------------------

export function isElite(tier: Tier): boolean {
  return tier === "master" || tier === "grandmaster" || tier === "challenger";
}

function nextDivisionAfterPromo(tier: Tier, division: Division): { tier: Tier; division: Division } {
  if (tier === "diamond" && division === 1) return { tier: "master", division: null };
  if (division === 1) {
    const idx = TIER_ORDER.indexOf(tier);
    return { tier: TIER_ORDER[idx + 1] ?? tier, division: 4 };
  }
  if (division === null) return { tier, division: null };
  return { tier, division: (division - 1) as Division };
}

function prevDivision(tier: Tier, division: Division): { tier: Tier; division: Division } {
  if (division === null) return { tier, division: null }; // sem rebaixamento na elite
  if (division === 4) {
    const idx = TIER_ORDER.indexOf(tier);
    // Proteção: não cai de tier no rebaixamento (fica em IV do mesmo tier).
    if (idx === 0) return { tier: "iron", division: 4 };
    return { tier, division: 4 };
  }
  return { tier, division: (division + 1) as Division };
}

function eliteTierForLp(lp: number): Tier {
  if (lp >= ELITE_CHALLENGER_LP) return "challenger";
  if (lp >= ELITE_GRANDMASTER_LP) return "grandmaster";
  return "master";
}

function updatePeak(next: RankState): RankState {
  const currentIdx = TIER_ORDER.indexOf(next.tier);
  const peakIdx = TIER_ORDER.indexOf(next.peakTier);
  if (currentIdx > peakIdx) {
    return { ...next, peakTier: next.tier, peakDivision: next.division };
  }
  if (currentIdx === peakIdx) {
    // comparar divisões (menor número = maior divisão)
    const curDiv = next.division ?? 0;
    const peakDiv = next.peakDivision ?? 0;
    if (curDiv < peakDiv) return { ...next, peakDivision: next.division };
  }
  return next;
}

/** Concede/retira LP e recalcula tier/divisão. Retorna evento resultante. */
export function awardLp(delta: number, reason: string): {
  state: RankState;
  promoted: boolean;
  demoted: boolean;
  promoStarted: boolean;
  promoWon: boolean;
  promoLost: boolean;
} {
  const before = state;
  let next: RankState = {
    ...state,
    history: [{ at: Date.now(), delta, reason }, ...state.history].slice(0, 60),
    totalEarned: delta > 0 ? state.totalEarned + delta : state.totalEarned,
    totalLost: delta < 0 ? state.totalLost + -delta : state.totalLost,
  };

  let promoted = false;
  let demoted = false;
  let promoStarted = false;
  let promoWon = false;
  let promoLost = false;

  if (isElite(next.tier)) {
    // Elite: LP livre, sem promo/rebaixamento entre master/gm/challenger é automático por faixa.
    const newLp = Math.max(0, next.lp + delta);
    const newTier = eliteTierForLp(newLp);
    if (newTier !== next.tier) {
      // troca visual de faixa elite
      if (TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(next.tier)) promoted = true;
      else demoted = false; // não rebaixamos elite abaixo de mestre
    }
    next = { ...next, lp: newLp, tier: newTier, division: null };
  } else if (next.promo) {
    // Está em série de promoção
    const promo = next.promo;
    if (delta > 0) {
      const p = { ...promo, wins: promo.wins + 1 };
      if (p.wins >= p.target) {
        const jump = nextDivisionAfterPromo(next.tier, next.division);
        next = {
          ...next,
          tier: jump.tier,
          division: jump.division,
          lp: isElite(jump.tier) ? 0 : 0,
          promo: null,
        };
        promoted = true;
        promoWon = true;
      } else {
        next = { ...next, promo: p };
      }
    } else if (delta < 0) {
      const p = { ...promo, losses: promo.losses + 1 };
      if (p.losses >= p.maxLosses) {
        // falhou na promo — volta pra 75 LP
        next = { ...next, promo: null, lp: 75 };
        promoLost = true;
      } else {
        next = { ...next, promo: p };
      }
    }
  } else {
    // Fora da promo, dentro de iron..diamond
    let newLp = next.lp + delta;
    if (newLp >= LP_PER_DIVISION) {
      // dispara série de promoção — LP fica congelado em 100
      next = {
        ...next,
        lp: LP_PER_DIVISION,
        promo: { wins: 0, losses: 0, target: PROMO_WINS_REQUIRED, maxLosses: PROMO_MAX_LOSSES },
      };
      promoStarted = true;
    } else if (newLp < 0) {
      // possível rebaixamento
      const prev = prevDivision(next.tier, next.division);
      if (prev.tier === next.tier && prev.division === next.division) {
        // já está em Ferro IV — LP piso 0
        next = { ...next, lp: 0 };
      } else {
        next = { ...next, tier: prev.tier, division: prev.division, lp: 25 };
        demoted = true;
      }
    } else {
      next = { ...next, lp: newLp };
    }
  }

  next = updatePeak(next);
  state = next;
  persist();
  emit();

  // Dispara evento de promoção para UI (animação + confete)
  if (promoted) {
    const kind: "tier" | "division" =
      before.tier !== next.tier ? "tier" : "division";
    emitPromotion({
      fromTier: before.tier,
      fromDivision: before.division,
      toTier: next.tier,
      toDivision: next.division,
      kind,
      at: Date.now(),
    });
  }

  return { state: next, promoted, demoted, promoStarted, promoWon, promoLost };
}


// LP por tipo de ação — cap e piso já são aplicados pela função awardLp.
// LP por tipo de ação — valores balanceados para tornar a subida de rank
// consistente e progressivamente mais difícil (sem inflar recompensas).
export const LP = {
  reviewEasy: 3,
  reviewGood: 2,
  reviewHard: 1,
  reviewWrong: -4,
  enemyDefeated: 8,
  enemyEvolved: -12,
  streakDay: (days: number) => Math.min(12, Math.max(2, days * 2)),
  streakBroken: -35,
  streakBrokenFor: (prevCurrent: number) => {
    if (prevCurrent >= 7) return -35;
    if (prevCurrent >= 3) return -20;
    if (prevCurrent >= 1) return -10;
    return 0;
  },
  grammarLesson: 10,
  writingGood: 15,
  writingGreat: 30,
  examBonusByPercent: (pct: number) =>
    Math.round(25 + Math.max(0, pct - 30) * 1.4), // 25..123
  examFailed: -25,
  // Punições diárias — aplicadas por outros stores com cap.
  enemyIgnoredPerDay: -3,
  enemyIgnoredCapDaily: -15,
  decayPerDay: -2,
  decayCapDaily: -12,
};

/** Tier eligível para decaimento por inatividade (a partir de Ouro). */
export function isDecayEligible(tier: Tier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf("gold");
}


/**
 * LP acumulado necessário (a partir de Ferro IV, 0 LP) para *entrar* em um tier.
 * Cada tier tem 4 divisões (IV→I), cada uma 100 LP, e uma série de promoção.
 * Master é considerado como o topo da trilha de divisões (10 tiers × 400 LP = 3600).
 * Grão-Mestre/Desafiante usam LP absoluto do tier Elite (soma-se ao total de Master).
 */
export function lpToReachTier(tier: Tier): number {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return 0;
  // Cada tier abaixo do alvo contribui com 4 divisões × 100 LP
  const base = idx * 4 * LP_PER_DIVISION;
  if (tier === "grandmaster") return base + ELITE_GRANDMASTER_LP;
  if (tier === "challenger") return base + ELITE_CHALLENGER_LP;
  return base;
}


// -------- hooks e helpers ---------------------------------------------

const EMPTY = INITIAL_RANK;

export function getRank(): RankState {
  return state;
}

export function useRank(): RankState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => EMPTY,
  );
}

export function tierLabel(state: RankState): string {
  if (isElite(state.tier)) return TIER_LABEL[state.tier];
  return `${TIER_LABEL[state.tier]} ${DIVISION_ROMAN[state.division as Exclude<Division, null>]}`;
}

/** LP até a próxima divisão (para barra de progresso). */
export function progressToNext(state: RankState): { value: number; max: number; label: string } {
  if (isElite(state.tier)) {
    if (state.tier === "challenger") {
      return { value: state.lp, max: state.lp, label: "Topo do ranking" };
    }
    const nextThreshold =
      state.tier === "master" ? ELITE_GRANDMASTER_LP : ELITE_CHALLENGER_LP;
    return {
      value: state.lp,
      max: nextThreshold,
      label: `${nextThreshold - state.lp} LP para ${state.tier === "master" ? "Grão-Mestre" : "Desafiante"}`,
    };
  }
  const remaining = Math.max(0, LP_PER_DIVISION - state.lp);
  const isPromoToNextTier = state.division === 1;
  const jump = nextDivisionAfterPromo(state.tier, state.division);
  const nextLabel = isPromoToNextTier
    ? `promoção para ${TIER_LABEL[jump.tier]}${
        isElite(jump.tier) ? "" : ` ${DIVISION_ROMAN[jump.division as Exclude<Division, null>]}`
      }`
    : `${TIER_LABEL[jump.tier]} ${DIVISION_ROMAN[jump.division as Exclude<Division, null>]}`;
  return {
    value: state.lp,
    max: LP_PER_DIVISION,
    label: `${remaining} LP para ${nextLabel}`,
  };
}

/** Reseta rank do perfil ativo (usado pelo admin). */
export function resetRank() {
  state = INITIAL_RANK;
  persist();
  emit();
}
