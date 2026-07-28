// Provações do Primeiro Bundle — jornada de boas-vindas sem prazo.
// Substitui o antigo sistema diário: os desafios ficam abertos até serem
// cumpridos, e a jornada inteira some assim que o usuário compra qualquer
// bundle da loja. Recompensas somam exatamente 1.100 ✦ (preço mítico).
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import { earn } from "@/lib/wallet-store";
import { getRank, TIER_ORDER, subscribeAllRanks } from "@/lib/rank-store";

export type JourneyStepType =
  | "review_n"
  | "correct_n"
  | "defeat_enemies"
  | "win_duel"
  | "rank_tier";

export type JourneyStep = {
  id: string;
  type: JourneyStepType;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
};

export type JourneyState = {
  profileId: string;
  steps: JourneyStep[];
  hasFirstBundle: boolean;
  loaded: boolean;
};

const JOURNEY_KEY = "first_bundle_journey";

const STEP_TEMPLATES: Omit<JourneyStep, "progress" | "claimed">[] = [
  {
    id: "step_review",
    type: "review_n",
    title: "Primeiros passos",
    description: "Revise 10 cartas no seu ritmo",
    target: 10,
    reward: 150,
  },
  {
    id: "step_correct",
    type: "correct_n",
    title: "Ouvido afiado",
    description: "Acerte 15 traduções digitadas",
    target: 15,
    reward: 200,
  },
  {
    id: "step_enemies",
    type: "defeat_enemies",
    title: "Caçadora",
    description: "Derrote 1 carta inimiga",
    target: 1,
    reward: 200,
  },
  {
    id: "step_duel",
    type: "win_duel",
    title: "Duelista",
    description: "Participe de 1 duelo (ganhando ou perdendo)",
    target: 1,
    reward: 150,
  },
  {
    id: "step_rank",
    type: "rank_tier",
    title: "Despertar",
    description: "Alcance o rank Ferro I ou superior",
    target: 1,
    reward: 200,
  },
];

function freshSteps(): JourneyStep[] {
  return STEP_TEMPLATES.map((t) => ({ ...t, progress: 0, claimed: false }));
}

const emptyState = (id = ""): JourneyState => ({
  profileId: id,
  steps: freshSteps(),
  hasFirstBundle: false,
  loaded: false,
});

let state: JourneyState = emptyState();
const listeners = new Set<() => void>();
function emit() {
  state = { ...state, steps: [...state.steps] };
  listeners.forEach((l) => l());
}

const claimListeners = new Set<(step: JourneyStep) => void>();
export function onJourneyStepClaimed(cb: (step: JourneyStep) => void) {
  claimListeners.add(cb);
  return () => claimListeners.delete(cb);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useJourney(): JourneyState {
  return useSyncExternalStore(subscribe, () => state, () => emptyState());
}

export function getJourney(): JourneyState {
  return state;
}

let activeProfileId: string | null = null;

async function detectFirstBundle(profileId: string): Promise<boolean> {
  const { data } = await supabase
    .from("shop_purchases")
    .select("id")
    .eq("buyer_profile_id", profileId)
    .eq("item_kind", "bundle")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function loadJourney(profileId: string) {
  activeProfileId = profileId;

  const [hasBundle, journeyRow] = await Promise.all([
    detectFirstBundle(profileId),
    (supabase as any)
      .from("daily_challenges")
      .select("challenges")
      .eq("profile_id", profileId)
      .eq("day", JOURNEY_KEY)
      .maybeSingle(),
  ]);

  const rawSteps = (journeyRow?.data?.challenges ?? []) as JourneyStep[];
  const merged: JourneyStep[] = STEP_TEMPLATES.map((tpl) => {
    const saved = rawSteps.find((s) => s.id === tpl.id);
    return {
      ...tpl,
      progress: saved ? Math.min(tpl.target, saved.progress ?? 0) : 0,
      claimed: saved?.claimed ?? false,
    };
  });

  state = {
    profileId,
    steps: merged,
    hasFirstBundle: hasBundle,
    loaded: true,
  };
  emit();

  // Sincroniza progresso vindo de sinais externos (rank) sem esperar evento.
  refreshRankProgress();
}

async function persist() {
  if (!activeProfileId) return;
  const { error } = await (supabase as any)
    .from("daily_challenges")
    .upsert(
      {
        profile_id: activeProfileId,
        day: JOURNEY_KEY,
        challenges: state.steps,
      },
      { onConflict: "profile_id,day" },
    );
  if (error) console.error("[airi] journey persist error", error);
}

function bump(type: JourneyStepType, amount = 1) {
  if (!state.loaded || state.hasFirstBundle) return;
  let changed = false;
  state.steps = state.steps.map((s) => {
    if (s.type !== type || s.claimed) return s;
    const next = Math.min(s.target, s.progress + amount);
    if (next !== s.progress) changed = true;
    return { ...s, progress: next };
  });
  if (changed) {
    emit();
    void persist();
  }
}

// ---- Trackers (mesmos nomes públicos do módulo antigo) -----------------

export function trackReview(correct: boolean) {
  bump("review_n", 1);
  if (correct) bump("correct_n", 1);
}
export function trackEnemyDefeated() {
  bump("defeat_enemies", 1);
}
// Desafio de escrita retirado da jornada — mantido como no-op para compatibilidade.
export function trackWritingComplete() {
  /* no-op */
}
export function trackDuelWin() {
  bump("win_duel", 1);
}
// Removido: `trackStudyMinutes` não faz mais sentido sem prazo.
export function trackStudyMinutes(_minutes: number) {
  // no-op para compat com chamadas antigas — não conta na jornada.
}

export function refreshRankProgress() {
  if (!state.loaded || state.hasFirstBundle) return;
  const rank = getRank();
  const tierIdx = TIER_ORDER.indexOf(rank.tier);
  const ironIdx = TIER_ORDER.indexOf("iron");
  const reached = tierIdx >= ironIdx && tierIdx >= 0 ? 1 : 0;
  const step = state.steps.find((s) => s.id === "step_rank");
  if (step && !step.claimed && step.progress !== reached) {
    state.steps = state.steps.map((s) =>
      s.id === "step_rank" ? { ...s, progress: reached } : s,
    );
    emit();
    void persist();
  }
}

export async function claimJourneyStep(id: string): Promise<boolean> {
  if (!state.loaded) return false;
  const step = state.steps.find((s) => s.id === id);
  if (!step || step.claimed || step.progress < step.target) return false;
  state.steps = state.steps.map((s) =>
    s.id === id ? { ...s, claimed: true } : s,
  );
  emit();
  await earn(step.reward, `Provação: ${step.title}`);
  await persist();
  claimListeners.forEach((cb) => {
    try {
      cb(step);
    } catch {
      /* noop */
    }
  });
  return true;
}

export function markFirstBundlePurchased() {
  if (!state.hasFirstBundle) {
    state.hasFirstBundle = true;
    emit();
  }
}

// ---- Derived helpers ---------------------------------------------------

export function journeyTotals() {
  const total = state.steps.reduce((sum, s) => sum + s.reward, 0);
  const earned = state.steps
    .filter((s) => s.claimed)
    .reduce((sum, s) => sum + s.reward, 0);
  const completed = state.steps.filter((s) => s.claimed).length;
  return { total, earned, completed, count: state.steps.length };
}

export function currentJourneyStep(): JourneyStep | null {
  return state.steps.find((s) => !s.claimed) ?? null;
}

// ---- Boot & subscriptions ---------------------------------------------

if (typeof window !== "undefined") {
  const p = getCurrentProfile();
  if (p) void loadJourney(p.id);

  subscribeProfile(() => {
    const pp = getCurrentProfile();
    if (pp) void loadJourney(pp.id);
    else {
      state = emptyState();
      emit();
    }
  });

  subscribeAllRanks(() => refreshRankProgress());
}
