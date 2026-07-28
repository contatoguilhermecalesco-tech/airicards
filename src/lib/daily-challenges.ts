// Desafios Surpresa diários — envelope de 3 provações + recompensas em Arlys.
// Integrado com revisão, duelos, writing e cartas inimigas para dar sensação
// de progresso e ajudar o usuário a juntar ✦ para bundles.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import { earn } from "@/lib/wallet-store";

export type ChallengeType =
  | "review_n"
  | "correct_n"
  | "defeat_enemies"
  | "win_duel"
  | "study_minutes"
  | "writing";

export type Challenge = {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
};

export type DailyChallenges = {
  profileId: string;
  day: string;
  challenges: Challenge[];
  surprise: Challenge | null;
  surpriseUnlocked: boolean;
  surpriseClaimed: boolean;
  loaded: boolean;
};

const CHALLENGE_TEMPLATES: Array<{
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  reward: number;
}> = [
  { type: "review_n", title: "Revisor dedicado", description: "Revise {n} cartas hoje", target: 15, reward: 35 },
  { type: "correct_n", title: "Mira afiada", description: "Acerte {n} traduções", target: 10, reward: 45 },
  { type: "defeat_enemies", title: "Caçador de inimigos", description: "Derrote {n} cartas inimigas", target: 3, reward: 50 },
  { type: "win_duel", title: "Duelista", description: "Vença 1 duelo", target: 1, reward: 55 },
  { type: "study_minutes", title: "Foco total", description: "Estude por {n} minutos", target: 10, reward: 30 },
  { type: "writing", title: "Escritor", description: "Complete 1 exercício de writing", target: 1, reward: 40 },
];

const SURPRISE_TEMPLATE: Challenge = {
  id: "surprise",
  type: "correct_n",
  title: "Provação suprema",
  description: "Acerte 20 traduções sem errar para abrir o envelope dourado",
  target: 20,
  progress: 0,
  reward: 120,
  claimed: false,
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

function pickChallenges(profileId: string, day: string): Challenge[] {
  const seed = `${profileId}:${day}`;
  const shuffled = [...CHALLENGE_TEMPLATES].sort(
    () => seededRandom(seed + Math.random()) - 0.5,
  );
  return shuffled.slice(0, 3).map((t, idx) => ({
    id: `c${idx}`,
    type: t.type,
    title: t.title,
    description: t.description.replace("{n}", String(t.target)),
    target: t.target,
    progress: 0,
    reward: t.reward,
    claimed: false,
  }));
}

function empty(profileId = ""): DailyChallenges {
  return {
    profileId,
    day: todayKey(),
    challenges: [],
    surprise: null,
    surpriseUnlocked: false,
    surpriseClaimed: false,
    loaded: false,
  };
}

let state: DailyChallenges = empty();
const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDailyChallenges(): DailyChallenges {
  return useSyncExternalStore(subscribe, () => state, () => empty());
}

let activeProfileId: string | null = null;
let loadPromise: Promise<void> | null = null;

export async function loadDailyChallenges(profileId: string, force = false) {
  if (!force && activeProfileId === profileId && state.loaded) return;
  activeProfileId = profileId;
  const day = todayKey();

  loadPromise = (async () => {
    const { data, error } = await supabase
      .from("daily_challenges")
      .select("challenges, surprise_unlocked, surprise_claimed")
      .eq("profile_id", profileId)
      .eq("day", day)
      .maybeSingle();

    if (error) {
      console.error("[airi] daily challenges load error", error);
      state = empty(profileId);
      emit();
      return;
    }

    if (data) {
      const raw = (data.challenges ?? []) as Challenge[];
      state = {
        profileId,
        day,
        challenges: raw.map((c) => ({
          ...c,
          progress: Math.min(c.target, c.progress ?? 0),
          claimed: c.claimed ?? false,
        })),
        surprise: SURPRISE_TEMPLATE,
        surpriseUnlocked: data.surprise_unlocked ?? false,
        surpriseClaimed: data.surprise_claimed ?? false,
        loaded: true,
      };
    } else {
      const challenges = pickChallenges(profileId, day);
      state = {
        profileId,
        day,
        challenges,
        surprise: SURPRISE_TEMPLATE,
        surpriseUnlocked: false,
        surpriseClaimed: false,
        loaded: true,
      };
      await persist();
    }
    emit();
  })();
  await loadPromise;
}

async function persist() {
  if (!activeProfileId) return;
  const { error } = await supabase.from("daily_challenges").upsert(
    {
      profile_id: activeProfileId,
      day: state.day,
      challenges: state.challenges,
      surprise_unlocked: state.surpriseUnlocked,
      surprise_claimed: state.surpriseClaimed,
    },
    { onConflict: "profile_id,day" },
  );
  if (error) console.error("[airi] daily challenges persist error", error);
}

function ensureLoaded() {
  const p = getCurrentProfile();
  if (p && (!state.loaded || state.profileId !== p.id || state.day !== todayKey())) {
    void loadDailyChallenges(p.id);
  }
}

if (typeof window !== "undefined") {
  ensureLoaded();
  subscribeProfile(() => {
    const p = getCurrentProfile();
    if (p) void loadDailyChallenges(p.id);
    else {
      state = empty();
      emit();
    }
  });
}

// ---- Progress tracking ------------------------------------------------

function bump(type: ChallengeType, amount = 1, predicate?: (c: Challenge) => boolean) {
  if (!state.loaded) return;
  let changed = false;
  state.challenges = state.challenges.map((c) => {
    if (c.type !== type) return c;
    if (predicate && !predicate(c)) return c;
    const next = Math.min(c.target, c.progress + amount);
    if (next !== c.progress) changed = true;
    return { ...c, progress: next };
  });
  if (changed) {
    checkSurpriseUnlock();
    emit();
    void persist();
  }
}

function checkSurpriseUnlock() {
  if (state.surpriseUnlocked || state.surpriseClaimed) return;
  const completedStandard = state.challenges.filter((c) => c.progress >= c.target).length;
  if (completedStandard >= 2) {
    state.surpriseUnlocked = true;
  }
}

export function trackReview(correct: boolean) {
  bump("review_n", 1);
  if (correct) bump("correct_n", 1);
}

export function trackEnemyDefeated() {
  bump("defeat_enemies", 1);
}

export function trackDuelWin() {
  bump("win_duel", 1);
}

export function trackWritingComplete() {
  bump("writing", 1);
}

export function trackStudyMinutes(minutes: number) {
  bump("study_minutes", minutes);
}

// ---- Claim rewards -----------------------------------------------------

export async function claimChallenge(id: string): Promise<boolean> {
  if (!state.loaded) return false;
  const idx = state.challenges.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  const c = state.challenges[idx];
  if (c.progress < c.target || c.claimed) return false;
  state.challenges = state.challenges.map((x, i) =>
    i === idx ? { ...x, claimed: true } : x,
  );
  emit();
  await earn(c.reward, `Desafio: ${c.title}`);
  await persist();
  return true;
}

export async function claimSurprise(): Promise<boolean> {
  if (!state.loaded || !state.surpriseUnlocked || state.surpriseClaimed || !state.surprise) return false;
  state.surpriseClaimed = true;
  emit();
  await earn(state.surprise.reward, "Envelope dourado surpresa");
  await persist();
  return true;
}

export function totalEarnableToday(): number {
  if (!state.loaded) return 0;
  const standard = state.challenges.reduce((sum, c) => sum + c.reward, 0);
  const surprise = state.surprise && !state.surpriseClaimed ? state.surprise.reward : 0;
  return standard + surprise;
}

export function remainingEarnableToday(): number {
  if (!state.loaded) return 0;
  const standard = state.challenges
    .filter((c) => !c.claimed && c.progress >= c.target)
    .reduce((sum, c) => sum + c.reward, 0);
  const surprise =
    state.surprise && state.surpriseUnlocked && !state.surpriseClaimed ? state.surprise.reward : 0;
  return standard + surprise;
}
