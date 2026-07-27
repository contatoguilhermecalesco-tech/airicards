// Sistema de cartas inimigas — tiers, missões diárias/semanais e combo.
// Missões são sincronizadas via profile_data.data.meta.enemyMissions para
// PC e celular verem o mesmo progresso.
import { useEffect, useState } from "react";
import type { Card } from "@/lib/flashcards-store";
import { isEnemy, isDefeated, getMeta, setMeta, useMeta } from "@/lib/flashcards-store";
import { earn } from "@/lib/wallet-store";
import { awardLp } from "@/lib/rank-store";

// ---- Tiers ------------------------------------------------------------
export type EnemyTier = "wounded" | "elite" | "boss" | "nemesis" | "defeated";

export const TIER_META: Record<
  EnemyTier,
  { label: string; short: string; color: string; glow: string; icon: string }
> = {
  wounded: {
    label: "Ferida",
    short: "F",
    color: "hsl(var(--destructive) / 0.75)",
    glow: "hsl(var(--destructive) / 0.35)",
    icon: "🩸",
  },
  elite: {
    label: "Elite",
    short: "E",
    color: "hsl(28 90% 60%)",
    glow: "hsl(28 90% 60% / 0.45)",
    icon: "⚔️",
  },
  boss: {
    label: "Chefão",
    short: "C",
    color: "hsl(340 85% 60%)",
    glow: "hsl(340 85% 60% / 0.55)",
    icon: "👹",
  },
  nemesis: {
    label: "Nêmesis",
    short: "N",
    color: "hsl(280 90% 70%)",
    glow: "hsl(280 90% 70% / 0.6)",
    icon: "💀",
  },
  defeated: {
    label: "Derrotada",
    short: "V",
    color: "hsl(var(--success))",
    glow: "hsl(var(--success) / 0.4)",
    icon: "🏆",
  },
};

export function enemyTier(card: Card): EnemyTier {
  if (!isEnemy(card)) return "wounded";
  if (isDefeated(card)) return "defeated";
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? 0;
  const net = lapses - successes;
  if (net >= 7) return "nemesis";
  if (net >= 5) return "boss";
  if (net >= 3) return "elite";
  return "wounded";
}

// Ranking numérico para ordenar do mais perigoso pro mais brando.
export function tierRank(t: EnemyTier): number {
  switch (t) {
    case "nemesis":
      return 4;
    case "boss":
      return 3;
    case "elite":
      return 2;
    case "wounded":
      return 1;
    case "defeated":
      return 0;
  }
}

// ---- Combo (memória local, sessão da Arena) --------------------------
type ComboState = { count: number; best: number };
let combo: ComboState = { count: 0, best: 0 };
const comboListeners = new Set<(c: ComboState) => void>();
function emitCombo() {
  comboListeners.forEach((fn) => fn({ ...combo }));
}

export function resetCombo() {
  combo = { count: 0, best: 0 };
  emitCombo();
}
export function getComboCount(): number {
  return combo.count;
}
export function bumpCombo() {
  combo = { count: combo.count + 1, best: Math.max(combo.best, combo.count + 1) };
  emitCombo();
}
export function breakCombo() {
  combo = { count: 0, best: combo.best };
  emitCombo();
}
export function comboMultiplier(count: number): number {
  if (count >= 7) return 2;
  if (count >= 5) return 1.5;
  if (count >= 3) return 1.25;
  return 1;
}
export function useCombo(): ComboState {
  const [c, setC] = useState<ComboState>({ ...combo });
  useEffect(() => {
    const fn = (v: ComboState) => setC(v);
    comboListeners.add(fn);
    return () => {
      comboListeners.delete(fn);
    };
  }, []);
  return c;
}

// ---- Missões ---------------------------------------------------------
export type MissionKind =
  | "defeat_any" // derrotar N inimigas
  | "defeat_boss" // derrotar N chefões/nêmesis
  | "combo" // atingir combo X
  | "clear_wounded"; // derrotar N feridas

export type Mission = {
  id: string;
  kind: MissionKind;
  target: number;
  progress: number;
  claimed: boolean;
  rewardArlys: number;
  rewardLp: number;
  label: string;
  hint: string;
};

type MissionsState = {
  dailyKey: string;
  weeklyKey: string;
  daily: Mission[];
  weekly: Mission[];
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function weekKey() {
  const d = new Date();
  const first = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
  return `${d.getFullYear()}W${week}`;
}

function seededPick<T>(arr: T[], seed: string, n: number): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const idx = h % copy.length;
    out.push(copy.splice(idx, 1)[0]);
    h = (h * 1103515245 + 12345) >>> 0;
  }
  return out;
}

const DAILY_POOL: Omit<Mission, "id" | "progress" | "claimed">[] = [
  { kind: "defeat_any", target: 2, rewardArlys: 25, rewardLp: 8, label: "Bata 2 inimigas", hint: "Derrote qualquer carta inimiga." },
  { kind: "defeat_any", target: 3, rewardArlys: 40, rewardLp: 12, label: "Trio caído", hint: "Derrote 3 inimigas hoje." },
  { kind: "combo", target: 5, rewardArlys: 30, rewardLp: 10, label: "Combo x5", hint: "Faça 5 acertos seguidos na Arena." },
  { kind: "clear_wounded", target: 2, rewardArlys: 20, rewardLp: 6, label: "Sem sobreviventes", hint: "Derrote 2 cartas feridas." },
];
const WEEKLY_POOL: Omit<Mission, "id" | "progress" | "claimed">[] = [
  { kind: "defeat_boss", target: 1, rewardArlys: 120, rewardLp: 40, label: "Caça ao chefão", hint: "Derrote 1 chefão ou nêmesis." },
  { kind: "defeat_any", target: 10, rewardArlys: 150, rewardLp: 45, label: "Purificação", hint: "Derrote 10 inimigas nesta semana." },
  { kind: "combo", target: 8, rewardArlys: 100, rewardLp: 30, label: "Fúria", hint: "Alcance combo x8 na Arena." },
];

const META_KEY = "enemyMissions";

function rollDaily(): Mission[] {
  const picks = seededPick(DAILY_POOL, `d-${todayKey()}`, 2);
  return picks.map((m, i) => ({ ...m, id: `d${i}-${m.kind}`, progress: 0, claimed: false }));
}
function rollWeekly(): Mission[] {
  const picks = seededPick(WEEKLY_POOL, `w-${weekKey()}`, 1);
  return picks.map((m, i) => ({ ...m, id: `w${i}-${m.kind}`, progress: 0, claimed: false }));
}

function reconcile(stored: MissionsState | undefined): MissionsState {
  const today = todayKey();
  const week = weekKey();
  if (!stored) {
    return { dailyKey: today, weeklyKey: week, daily: rollDaily(), weekly: rollWeekly() };
  }
  let { daily, weekly, dailyKey: dKey, weeklyKey: wKey } = stored;
  if (dKey !== today) {
    daily = rollDaily();
    dKey = today;
  }
  if (wKey !== week) {
    weekly = rollWeekly();
    wKey = week;
  }
  return { dailyKey: dKey, weeklyKey: wKey, daily, weekly };
}

function loadState(): MissionsState {
  return reconcile(getMeta<MissionsState>(META_KEY));
}

let missions: MissionsState = loadState();
const missionsListeners = new Set<(s: MissionsState) => void>();
function emitMissions() {
  missionsListeners.forEach((fn) => fn(structuredClone(missions)));
}
function persistMissions() {
  setMeta<MissionsState>(META_KEY, missions);
}

export function refreshMissionsForCurrentProfile() {
  missions = loadState();
  emitMissions();
}

export function useMissions(): MissionsState {
  // Ouve o meta do store; quando o cloud puxa (outro device), reconciliamos
  // e emitimos para os componentes.
  const remote = useMeta<MissionsState>(META_KEY);
  const [s, setS] = useState<MissionsState>(() => structuredClone(missions));
  useEffect(() => {
    const fn = (v: MissionsState) => setS(v);
    missionsListeners.add(fn);
    refreshMissionsForCurrentProfile();
    return () => {
      missionsListeners.delete(fn);
    };
  }, []);
  useEffect(() => {
    // Quando o snapshot remoto muda (pull do cloud), reconciliamos com
    // as chaves do dia/semana e atualizamos as listeners locais.
    const next = reconcile(remote);
    missions = next;
    setS(structuredClone(next));
  }, [remote]);
  return s;
}

function bumpMission(m: Mission, amount: number) {
  if (m.claimed) return;
  m.progress = Math.min(m.target, m.progress + amount);
}
function bumpToAtLeast(m: Mission, value: number) {
  if (m.claimed) return;
  m.progress = Math.max(m.progress, Math.min(m.target, value));
}

export function onEnemyDefeated(tier: EnemyTier) {
  for (const m of [...missions.daily, ...missions.weekly]) {
    if (m.kind === "defeat_any") bumpMission(m, 1);
    if (m.kind === "defeat_boss" && (tier === "boss" || tier === "nemesis")) bumpMission(m, 1);
    if (m.kind === "clear_wounded" && tier === "wounded") bumpMission(m, 1);
  }
  persistMissions();
  emitMissions();
}

export function onComboReached(count: number) {
  for (const m of [...missions.daily, ...missions.weekly]) {
    if (m.kind === "combo") bumpToAtLeast(m, count);
  }
  persistMissions();
  emitMissions();
}

export async function claimMission(id: string) {
  const all = [...missions.daily, ...missions.weekly];
  const m = all.find((x) => x.id === id);
  if (!m || m.claimed || m.progress < m.target) return;
  m.claimed = true;
  persistMissions();
  emitMissions();
  if (m.rewardArlys > 0) await earn(m.rewardArlys, `mission.${m.kind}`);
  if (m.rewardLp > 0) awardLp(m.rewardLp, `mission.${m.kind}`);
}
