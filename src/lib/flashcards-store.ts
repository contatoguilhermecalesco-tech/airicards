// Spaced repetition store synced to Lovable Cloud per profile.
// Every mutation writes to Cloud (debounced) and Realtime pushes updates
// back to other devices, so PC/celular ficam sempre em sincronia por perfil.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";

export type CardMode = "word" | "sentence";
export type CardSource = string;

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  reps: number;
  dueAt: number;
  createdAt: number;
  lapses?: number;
  successes?: number;
  // Wave 1 — sentence mining (método RRSLG).
  mode?: CardMode;
  targetWord?: string;
  source?: CardSource;
};

export type Deck = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
};

type State = { decks: Deck[]; cards: Card[] };
export type Streak = {
  current: number;
  longest: number;
  lastDay: string; // dateKey of the last day the user reviewed ≥1 card
  startedOn?: string; // dateKey when the current streak began
};
type HomeSessions = {
  day: string;
  count: number;
  reviewed?: number;
  streak?: Streak;
};

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
export function nextStreakMilestone(current: number): number {
  for (const m of STREAK_MILESTONES) if (m > current) return m;
  return current + 100;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// --- Local cache keyed per profile so first paint is instant ---------
function cacheKey(profileId: string) {
  return `airi.cache.${profileId}.v1`;
}
function loadCache(profileId: string): {
  state: State;
  home: HomeSessions;
} {
  if (!isBrowser()) return { state: { decks: [], cards: [] }, home: { day: todayKey(), count: 0 } };
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    if (!raw) return { state: { decks: [], cards: [] }, home: { day: todayKey(), count: 0 } };
    return JSON.parse(raw);
  } catch {
    return { state: { decks: [], cards: [] }, home: { day: todayKey(), count: 0 } };
  }
}
function saveCache(profileId: string, state: State, home: HomeSessions) {
  if (!isBrowser()) return;
  localStorage.setItem(cacheKey(profileId), JSON.stringify({ state, home }));
}

// --- In-memory active state ------------------------------------------
let activeProfile: string | null = null;
let state: State = { decks: [], cards: [] };
let home: HomeSessions = { day: todayKey(), count: 0 };

const listeners = new Set<() => void>();
const homeListeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function emitHome() {
  homeListeners.forEach((l) => l());
}

// --- Cloud sync -------------------------------------------------------
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function pullFromCloud(profileId: string) {
  const { data, error } = await supabase
    .from("profile_data")
    .select("data, home_sessions")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[airi] pull failed", error);
    return;
  }
  if (data) {
    const remote = (data.data ?? { decks: [], cards: [] }) as State;
    const remoteHome = (data.home_sessions ?? { day: todayKey(), count: 0 }) as HomeSessions;
    if (activeProfile !== profileId) return; // profile switched meanwhile
    state = remote;
    home = remoteHome.day === todayKey() ? remoteHome : { day: todayKey(), count: 0 };
    saveCache(profileId, state, home);
    emit();
    emitHome();
  }
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, state, home);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("profile_data")
      .upsert(
        {
          profile_id: profileId,
          data: state as never,
          home_sessions: home as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );
    if (error) console.error("[airi] save failed", error);
  }, 400);
}

export function setActiveProfileId(profileId: string | null) {
  if (activeProfile === profileId) return;
  activeProfile = profileId;

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  if (!profileId) {
    state = { decks: [], cards: [] };
    home = { day: todayKey(), count: 0 };
    emit();
    emitHome();
    return;
  }

  // Instant paint from local cache.
  const cached = loadCache(profileId);
  state = cached.state;
  home = cached.home.day === todayKey() ? cached.home : { day: todayKey(), count: 0 };
  emit();
  emitHome();

  // Refresh from Cloud, then subscribe to Realtime updates from other devices.
  void pullFromCloud(profileId);
  realtimeChannel = supabase
    .channel(`profile_data:${profileId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profile_data", filter: `profile_id=eq.${profileId}` },
      () => {
        void pullFromCloud(profileId);
      },
    )
    .subscribe();
}

// Boot: hydrate for whoever is already selected in localStorage, and
// re-hydrate whenever the current profile changes (Netflix-style switch).
if (isBrowser()) {
  const applyCurrent = () => {
    const p = getCurrentProfile();
    setActiveProfileId(p?.id ?? null);
  };
  applyCurrent();
  void import("@/lib/profile").then(({ subscribeProfile }) => {
    subscribeProfile(applyCurrent);
  });
}

// --- React hooks ------------------------------------------------------
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector({ decks: [], cards: [] }),
  );
}

// --- Mutations --------------------------------------------------------
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createDeck(name: string, description?: string, color?: string): Deck {
  const deck: Deck = {
    id: uid(),
    name: name.trim(),
    description: description?.trim() || undefined,
    color: color || undefined,
    createdAt: Date.now(),
  };
  state = { ...state, decks: [deck, ...state.decks] };
  emit();
  scheduleSave();
  return deck;
}

export function deleteDeck(id: string) {
  state = {
    decks: state.decks.filter((d) => d.id !== id),
    cards: state.cards.filter((c) => c.deckId !== id),
  };
  emit();
  scheduleSave();
}

export function updateDeck(id: string, patch: Partial<Pick<Deck, "name" | "description" | "color">>) {
  state = {
    ...state,
    decks: state.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  };
  emit();
  scheduleSave();
}

export function createCard(
  deckId: string,
  front: string,
  back: string,
  extras?: { mode?: CardMode; targetWord?: string; source?: CardSource },
): Card {
  const card: Card = {
    id: uid(),
    deckId,
    front: front.trim(),
    back: back.trim(),
    ease: 2.5,
    interval: 0,
    reps: 0,
    dueAt: Date.now(),
    createdAt: Date.now(),
    ...(extras?.mode ? { mode: extras.mode } : {}),
    ...(extras?.targetWord?.trim() ? { targetWord: extras.targetWord.trim() } : {}),
    ...(extras?.source ? { source: extras.source } : {}),
  };
  state = { ...state, cards: [card, ...state.cards] };
  emit();
  scheduleSave();
  return card;
}

export function deleteCard(id: string) {
  state = { ...state, cards: state.cards.filter((c) => c.id !== id) };
  emit();
  scheduleSave();
}

export type Grade = "again" | "hard" | "good" | "easy";

export function autoClassify(card: Card): "hard" | "good" | "easy" {
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? 0;
  if (lapses >= 3 || (lapses > 0 && successes < lapses)) return "hard";
  if (successes >= 3 && lapses === 0) return "easy";
  return "good";
}

export function difficultyScore(card: Card): number {
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? 0;
  return lapses * 2 - successes * 0.5;
}

export const ENEMY_THRESHOLD = 3;
export function isEnemy(card: Card): boolean {
  return (card.lapses ?? 0) >= ENEMY_THRESHOLD;
}
export function isDefeated(card: Card): boolean {
  return isEnemy(card) && (card.successes ?? 0) > (card.lapses ?? 0);
}

export function reviewCard(id: string, grade: Grade) {
  const now = Date.now();
  const minuteMs = 60_000;
  // Cadência contínua: as cartas voltam de minutos em minutos para o usuário
  // sempre ter algo para revisar. Teto baixo (~10 min) mantém o fluxo ativo.
  const MAX_MINUTES = 10;
  state = {
    ...state,
    cards: state.cards.map((c) => {
      if (c.id !== id) return c;
      let { ease, interval, reps } = c;
      const lapses = c.lapses ?? 0;
      const successes = c.successes ?? 0;

      if (grade === "again") {
        reps = 0;
        interval = 0;
        ease = Math.max(1.3, ease - 0.2);
        return { ...c, ease, interval, reps, dueAt: now + minuteMs, lapses: lapses + 1, successes };
      }

      const q = grade === "hard" ? 3 : grade === "good" ? 4 : 5;
      ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      reps += 1;

      // Passos curtos em minutos (hard / good / easy)
      if (reps === 1) interval = grade === "hard" ? 1 : grade === "good" ? 2 : 4;
      else if (reps === 2) interval = grade === "hard" ? 2 : grade === "good" ? 4 : 7;
      else {
        const factor = grade === "hard" ? 1.15 : grade === "good" ? 1.35 : 1.6;
        interval = Math.round(Math.max(interval, 1) * factor);
      }
      interval = Math.min(interval, MAX_MINUTES);

      return { ...c, ease, interval, reps, dueAt: now + interval * minuteMs, lapses, successes: successes + 1 };
    }),
  };


  // Track cards revisadas hoje for the Home hero ring.
  refreshHomeDay();
  home = { ...home, reviewed: (home.reviewed ?? 0) + 1 };
  emitHome();
  emit();
  scheduleSave();
}


export function getDueCards(deckId?: string, at: number = Date.now()): Card[] {
  return state.cards.filter((c) => c.dueAt <= at && (deckId ? c.deckId === deckId : true));
}

export function getEnemyCards(deckId?: string): Card[] {
  return state.cards.filter(
    (c) => isEnemy(c) && (deckId ? c.deckId === deckId : true),
  );
}

export function cardsForDeck(deckId: string): Card[] {
  return state.cards.filter((c) => c.deckId === deckId);
}

// --- Home stats (sem limite diário) ----------------------------------
// Mantemos o contador só para estatística; sessões são ilimitadas agora.
export const HOME_DAILY_LIMIT = Infinity;

function refreshHomeDay() {
  const today = todayKey();
  if (home.day !== today) {
    home = { day: today, count: 0, reviewed: 0 };
    scheduleSave();
    emitHome();
  }
}

export function getHomeSessionsToday(): number {
  refreshHomeDay();
  return home.count;
}

export function getCardsReviewedToday(): number {
  refreshHomeDay();
  return home.reviewed ?? 0;
}

export function canStartHomeSession(): boolean {
  return true;
}

export function registerHomeSession() {
  refreshHomeDay();
  home = { ...home, day: todayKey(), count: home.count + 1 };
  emitHome();
  scheduleSave();
}


export function useHomeSessionsToday(): number {
  return useSyncExternalStore(
    (l) => {
      homeListeners.add(l);
      return () => homeListeners.delete(l);
    },
    () => getHomeSessionsToday(),
    () => 0,
  );
}

export function useCardsReviewedToday(): number {
  return useSyncExternalStore(
    (l) => {
      homeListeners.add(l);
      return () => homeListeners.delete(l);
    },
    () => getCardsReviewedToday(),
    () => 0,
  );
}

// --- Admin helpers ----------------------------------------------------
export type ProfileSessionInfo = {
  profileId: string;
  day: string;
  count: number;
  reviewed: number;
};

export async function fetchAllProfileSessions(): Promise<ProfileSessionInfo[]> {
  const { data, error } = await supabase
    .from("profile_data")
    .select("profile_id, home_sessions");
  if (error) {
    console.error("[airi] fetchAllProfileSessions failed", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const hs = (row.home_sessions ?? {}) as HomeSessions;
    return {
      profileId: row.profile_id as string,
      day: hs.day ?? "",
      count: hs.count ?? 0,
      reviewed: hs.reviewed ?? 0,
    };
  });
}

export async function resetHomeSessionsForProfile(profileId: string): Promise<void> {
  const fresh: HomeSessions = { day: todayKey(), count: 0, reviewed: 0 };
  const { error } = await supabase
    .from("profile_data")
    .update({ home_sessions: fresh as never, updated_at: new Date().toISOString() })
    .eq("profile_id", profileId);
  if (error) {
    console.error("[airi] resetHomeSessionsForProfile failed", error);
    throw error;
  }
  // If it's the active profile, refresh local state immediately.
  if (activeProfile === profileId) {
    home = fresh;
    saveCache(profileId, state, home);
    emitHome();
  }
}

