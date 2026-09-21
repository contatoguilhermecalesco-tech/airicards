// Desafios Diários — missões curtas de treino de inglês que rendem Arlys ✦ e LP.
// Três missões por dia (escolhidas de forma determinística a partir do perfil +
// data) e um Baú do Dia liberado quando as três são coletadas.
// Persistência: tabela `daily_challenges` (uma linha por perfil + dia).
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import { earn } from "@/lib/wallet-store";
import { awardLp } from "@/lib/rank-store";

export type MissionType =
  | "review_n"
  | "correct_n"
  | "defeat_enemies"
  | "writing"
  | "study_session"
  | "duel";

export type DailyMission = {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number; // Arlys ✦
  lp: number;
  claimed: boolean;
};

export type DailyMissionsState = {
  day: string;
  profileId: string;
  missions: DailyMission[];
  chestClaimed: boolean;
  loaded: boolean;
};

export const CHEST_REWARD = { arlys: 80, lp: 25 };

type Template = Omit<DailyMission, "progress" | "claimed">;

const POOL: Template[] = [
  {
    id: "m_review_20",
    type: "review_n",
    title: "Aquecimento",
    description: "Revise 20 cartas hoje",
    target: 20,
    reward: 35,
    lp: 10,
  },
  {
    id: "m_review_40",
    type: "review_n",
    title: "Sessão longa",
    description: "Revise 40 cartas hoje",
    target: 40,
    reward: 60,
    lp: 18,
  },
  {
    id: "m_correct_15",
    type: "correct_n",
    title: "Tradução afiada",
    description: "Acerte 15 traduções digitadas",
    target: 15,
    reward: 40,
    lp: 12,
  },
  {
    id: "m_correct_30",
    type: "correct_n",
    title: "Precisão",
    description: "Acerte 30 traduções digitadas",
    target: 30,
    reward: 65,
    lp: 20,
  },
  {
    id: "m_enemies_2",
    type: "defeat_enemies",
    title: "Caça às inimigas",
    description: "Derrote 2 cartas inimigas",
    target: 2,
    reward: 50,
    lp: 15,
  },
  {
    id: "m_enemies_1",
    type: "defeat_enemies",
    title: "Vingança",
    description: "Derrote 1 carta inimiga",
    target: 1,
    reward: 30,
    lp: 9,
  },
  {
    id: "m_writing_1",
    type: "writing",
    title: "Mão na escrita",
    description: "Escreva 1 redação e receba a correção",
    target: 1,
    reward: 55,
    lp: 16,
  },
  {
    id: "m_study_1",
    type: "study_session",
    title: "Treino do dia",
    description: "Complete 1 sessão de Reading, Listening ou Speaking",
    target: 1,
    reward: 45,
    lp: 14,
  },
  {
    id: "m_study_2",
    type: "study_session",
    title: "Dobradinha",
    description: "Complete 2 sessões de estudo guiado",
    target: 2,
    reward: 70,
    lp: 20,
  },
  {
    id: "m_duel_1",
    type: "duel",
    title: "Desafiante",
    description: "Participe de 1 duelo",
    target: 1,
    reward: 45,
    lp: 14,
  },
];

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickForDay(profileId: string, day: string): DailyMission[] {
  const seed = hash(`${profileId}:${day}`);
  const byType = new Map<MissionType, Template[]>();
  POOL.forEach((t) => {
    const arr = byType.get(t.type) ?? [];
    arr.push(t);
    byType.set(t.type, arr);
  });
  const types = [...byType.keys()];
  // Embaralha os tipos com um PRNG determinístico simples.
  let s = seed;
  const rand = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  // Garante uma missão de revisão sempre disponível.
  const ordered = ["review_n" as MissionType, ...types.filter((t) => t !== "review_n")];
  return ordered.slice(0, 3).map((type) => {
    const opts = byType.get(type)!;
    const tpl = opts[Math.floor(rand() * opts.length)];
    return { ...tpl, progress: 0, claimed: false };
  });
}

const empty = (): DailyMissionsState => ({
  day: todayKey(),
  profileId: "",
  missions: [],
  chestClaimed: false,
  loaded: false,
});

let state: DailyMissionsState = empty();
const listeners = new Set<() => void>();
function emit() {
  state = { ...state, missions: [...state.missions] };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDailyMissions(): DailyMissionsState {
  return useSyncExternalStore(subscribe, () => state, () => empty());
}

export function getDailyMissions(): DailyMissionsState {
  return state;
}

let activeProfileId: string | null = null;

export async function loadDailyMissions(profileId: string) {
  activeProfileId = profileId;
  const day = todayKey();
  const { data } = await (supabase as any)
    .from("daily_challenges")
    .select("challenges, surprise_claimed")
    .eq("profile_id", profileId)
    .eq("day", day)
    .maybeSingle();

  const saved = (data?.challenges ?? []) as DailyMission[];
  const base = pickForDay(profileId, day);
  const missions = base.map((m) => {
    const prev = Array.isArray(saved) ? saved.find((s) => s.id === m.id) : undefined;
    return {
      ...m,
      progress: Math.min(m.target, prev?.progress ?? 0),
      claimed: prev?.claimed ?? false,
    };
  });

  state = {
    day,
    profileId,
    missions,
    chestClaimed: Boolean(data?.surprise_claimed),
    loaded: true,
  };
  emit();
}

async function persist() {
  if (!activeProfileId) return;
  const allClaimed = state.missions.every((m) => m.claimed);
  const { error } = await (supabase as any).from("daily_challenges").upsert(
    {
      profile_id: activeProfileId,
      day: state.day,
      challenges: state.missions,
      surprise_unlocked: allClaimed,
      surprise_claimed: state.chestClaimed,
    },
    { onConflict: "profile_id,day" },
  );
  if (error) console.error("[airi] daily missions persist error", error);
}

function bump(type: MissionType, amount = 1) {
  if (!state.loaded) return;
  // Virada de dia: recarrega antes de contar.
  if (state.day !== todayKey() && activeProfileId) {
    void loadDailyMissions(activeProfileId);
    return;
  }
  let changed = false;
  state.missions = state.missions.map((m) => {
    if (m.type !== type || m.claimed) return m;
    const next = Math.min(m.target, m.progress + amount);
    if (next !== m.progress) changed = true;
    return { ...m, progress: next };
  });
  if (changed) {
    emit();
    void persist();
  }
}

// ---- Trackers ----------------------------------------------------------
export function missionTrackReview(correct: boolean) {
  bump("review_n", 1);
  if (correct) bump("correct_n", 1);
}
export function missionTrackEnemyDefeated() {
  bump("defeat_enemies", 1);
}
export function missionTrackWriting() {
  bump("writing", 1);
}
export function missionTrackStudySession() {
  bump("study_session", 1);
}
export function missionTrackDuel() {
  bump("duel", 1);
}

// ---- Claim -------------------------------------------------------------
const claimListeners = new Set<(m: { title: string; reward: number; lp: number }) => void>();
export function onMissionClaimed(cb: (m: { title: string; reward: number; lp: number }) => void) {
  claimListeners.add(cb);
  return () => claimListeners.delete(cb);
}

export async function claimMission(id: string): Promise<boolean> {
  const m = state.missions.find((x) => x.id === id);
  if (!m || m.claimed || m.progress < m.target) return false;
  state.missions = state.missions.map((x) =>
    x.id === id ? { ...x, claimed: true } : x,
  );
  emit();
  await earn(m.reward, `Desafio diário: ${m.title}`);
  awardLp(m.lp, "daily.mission");
  await persist();
  claimListeners.forEach((cb) => {
    try {
      cb({ title: m.title, reward: m.reward, lp: m.lp });
    } catch {
      /* noop */
    }
  });
  return true;
}

export async function claimDailyChest(): Promise<boolean> {
  if (state.chestClaimed) return false;
  if (!state.missions.length || !state.missions.every((m) => m.claimed)) return false;
  state.chestClaimed = true;
  emit();
  await earn(CHEST_REWARD.arlys, "Baú dos desafios diários");
  awardLp(CHEST_REWARD.lp, "daily.chest");
  await persist();
  claimListeners.forEach((cb) => {
    try {
      cb({ title: "Baú do dia", reward: CHEST_REWARD.arlys, lp: CHEST_REWARD.lp });
    } catch {
      /* noop */
    }
  });
  return true;
}

// ---- Derived -----------------------------------------------------------
export function dailyMissionsTotals() {
  const total = state.missions.reduce((s, m) => s + m.reward, 0) + CHEST_REWARD.arlys;
  const earned =
    state.missions.filter((m) => m.claimed).reduce((s, m) => s + m.reward, 0) +
    (state.chestClaimed ? CHEST_REWARD.arlys : 0);
  const done = state.missions.filter((m) => m.claimed).length;
  const readyCount =
    state.missions.filter((m) => !m.claimed && m.progress >= m.target).length +
    (!state.chestClaimed && state.missions.length > 0 && state.missions.every((m) => m.claimed)
      ? 1
      : 0);
  return { total, earned, done, count: state.missions.length, readyCount };
}

// ---- Boot --------------------------------------------------------------
if (typeof window !== "undefined") {
  const p = getCurrentProfile();
  if (p) void loadDailyMissions(p.id);
  subscribeProfile(() => {
    const pp = getCurrentProfile();
    if (pp) void loadDailyMissions(pp.id);
    else {
      state = empty();
      emit();
    }
  });
}
