// Temporadas trimestrais estilo Riot. Regras puras (sem estado).
import type { Division, Tier } from "@/lib/rank-store";

export const PLACEMENT_EVENTS = 25; // acertos protegidos no início da temporada
export const PLACEMENT_MULTIPLIER = 1.5;

export type SeasonRecord = { season: string; tier: Tier; division: Division; reward: number };

export type SeasonTransition = {
  from: SeasonRecord;
  toSeason: string;
  toTier: Tier;
  toDivision: Division;
};

/** Dados imutáveis exibidos pela cerimônia de virada. */
export function createSeasonTransition(
  from: SeasonRecord,
  toSeason: string,
  reset: { tier: Tier; division: Division },
): SeasonTransition {
  return { from, toSeason, toTier: reset.tier, toDivision: reset.division };
}

const ORDER: Tier[] = ["iron","bronze","silver","gold","platinum","emerald","diamond","master","grandmaster","challenger"];

export function seasonFor(date: Date): { id: string; year: number; split: 1 | 2 | 3 | 4; start: Date; end: Date } {
  const year = date.getFullYear();
  const split = (Math.floor(date.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const start = new Date(year, (split - 1) * 3, 1);
  const end = new Date(year, split * 3, 1);
  return { id: `${year}-S${split}`, year, split, start, end };
}

export function seasonLabel(id: string): string {
  const [y, s] = id.split("-S");
  return `Temporada ${s} · ${y}`;
}

/** Soft reset: desce ~1 tier e sempre recomeça na divisão IV. */
const RESET_TO: Record<Tier, Tier> = {
  iron: "iron", bronze: "iron", silver: "iron", gold: "bronze", platinum: "silver",
  emerald: "gold", diamond: "platinum", master: "diamond", grandmaster: "diamond", challenger: "diamond",
};
export function softReset(tier: Tier): { tier: Tier; division: Division } {
  return { tier: RESET_TO[tier] ?? "iron", division: 4 };
}

/** Recompensa pelo pico da temporada encerrada. */
export function seasonReward(peak: Tier): number {
  const i = ORDER.indexOf(peak);
  if (i >= ORDER.indexOf("diamond")) return 400;
  if (i >= ORDER.indexOf("platinum")) return 260;
  if (peak === "gold") return 180;
  if (peak === "silver") return 100;
  return 50;
}

/** LP durante a calibração: nunca perde, ganha 1.5×. */
export function placementDelta(delta: number): number {
  return delta < 0 ? 0 : Math.round(delta * PLACEMENT_MULTIPLIER);
}
