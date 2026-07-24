// Spaced repetition store synced to Lovable Cloud per profile.
// Every mutation writes to Cloud (debounced) and Realtime pushes updates
// back to other devices, so PC/celular ficam sempre em sincronia por perfil.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";
import { awardLp, getRank, isDecayEligible, LP } from "@/lib/rank-store";

export type CardMode = "word" | "sentence" | "expression";
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
export type StreakDayStatus = "done";
export type Streak = {
  current: number;
  longest: number;
  lastDay: string; // dateKey of the last day the user reviewed ≥1 card
  startedOn?: string; // dateKey when the current streak began
  history?: Record<string, StreakDayStatus>; // últimos ~60 dias
  milestonesReached?: number[]; // marcos já recompensados
};
type PunishmentsState = {
  streakBrokenAppliedFor?: string; // dayKey da lastDay já penalizada
  enemyPenaltyDay?: string; // dayKey em que já foi cobrada punição de inimigos ignorados
  decayLastDay?: string; // último dia em que foi aplicado decay
};
type HomeSessions = {
  day: string;
  count: number;
  reviewed?: number;
  streak?: Streak;
  punishments?: PunishmentsState;
};

/** Marcos de streak (em dias). Cruzá-los concede LP extra e uma celebração. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
export function nextStreakMilestone(current: number): number {
  for (const m of STREAK_MILESTONES) if (m > current) return m;
  return current + 100;
}

// ---- Streak milestone event bus (para celebração global) --------------
export type StreakMilestoneEvent = { days: number; lpGained: number; at: number };
type StreakMilestoneListener = (e: StreakMilestoneEvent) => void;
const streakMilestoneListeners = new Set<StreakMilestoneListener>();
export function onStreakMilestone(fn: StreakMilestoneListener): () => void {
  streakMilestoneListeners.add(fn);
  return () => streakMilestoneListeners.delete(fn);
}
function emitStreakMilestone(e: StreakMilestoneEvent) {
  streakMilestoneListeners.forEach((l) => l(e));
}

// ---- Streak change event bus — ganho/perda visual global --------------
export type StreakChangeEvent =
  | { kind: "gained"; current: number; at: number }
  | { kind: "lost"; previous: number; at: number };
type StreakChangeListener = (e: StreakChangeEvent) => void;
const streakChangeListeners = new Set<StreakChangeListener>();
export function onStreakChange(fn: StreakChangeListener): () => void {
  streakChangeListeners.add(fn);
  return () => streakChangeListeners.delete(fn);
}
function emitStreakChange(e: StreakChangeEvent) {
  streakChangeListeners.forEach((l) => l(e));
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
// Timestamp da nossa última escrita bem-sucedida. Realtime devolve nossos
// próprios writes; se puxarmos o remoto durante esse eco enquanto ainda há
// mutações locais em curso, o item deletado "volta" na UI. Ignoramos pulls
// dentro de uma janela curta após o save local.
let lastLocalSaveAt = 0;
const REMOTE_ECHO_WINDOW_MS = 2000;

async function pullFromCloud(profileId: string, opts?: { force?: boolean }) {
  if (!opts?.force && Date.now() - lastLocalSaveAt < REMOTE_ECHO_WINDOW_MS) {
    // É provavelmente o eco do nosso próprio save — ignora.
    return;
  }
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

async function persistNow(profileId: string) {
  saveCache(profileId, state, home);
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
  if (error) {
    console.error("[airi] save failed", error);
    return;
  }
  lastLocalSaveAt = Date.now();
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, state, home);
  if (saveTimer) clearTimeout(saveTimer);
  // Debounce curto — mutações UI (delete/edit) sentem-se instantâneas mas
  // ainda agrupamos escritas em rajada (ex.: revisão sequencial).
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void persistNow(profileId);
  }, 150);
}

/**
 * Força a persistência imediata do estado atual em profile_data, sem esperar
 * o debounce. Útil em operações críticas (delete, compra de deck, import)
 * onde precisamos garantir que a mudança ficou salva antes de qualquer pull.
 */
export async function flushSave(): Promise<void> {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await persistNow(profileId);
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
  home = cached.home.day === todayKey() ? cached.home : { ...cached.home, day: todayKey(), count: 0 };
  emit();
  emitHome();
  // Punições diárias com base no estado carregado.
  runDailyPunishments();

  // Refresh from Cloud, then subscribe to Realtime updates from other devices.
  void pullFromCloud(profileId).then(() => runDailyPunishments());
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
  // Persistência imediata — evita eco/pull que "traz" o deck de volta.
  void flushSave();
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

export function updateCard(
  id: string,
  patch: Partial<Pick<Card, "front" | "back" | "mode" | "source" | "targetWord">>,
) {
  state = {
    ...state,
    cards: state.cards.map((c) => {
      if (c.id !== id) return c;
      const next: Card = { ...c };
      if (patch.front !== undefined) next.front = patch.front.trim();
      if (patch.back !== undefined) next.back = patch.back.trim();
      if (patch.mode !== undefined) next.mode = patch.mode;
      if (patch.source !== undefined) {
        const s = patch.source.trim();
        if (s) next.source = s;
        else delete next.source;
      }
      if (patch.targetWord !== undefined) {
        const t = patch.targetWord.trim();
        if (t) next.targetWord = t;
        else delete next.targetWord;
      }
      return next;
    }),
  };
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
  // Capturar estado da carta antes da mutação (para detectar viradas de rank).
  const prevCard = state.cards.find((c) => c.id === id);
  const wasEnemyBefore = prevCard ? isEnemy(prevCard) && !isDefeated(prevCard) : false;
  const wasBelowEnemyBefore = prevCard ? (prevCard.lapses ?? 0) < ENEMY_THRESHOLD : false;

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

  // --- Rank / LP ------------------------------------------------------
  if (grade === "again") {
    awardLp(LP.reviewWrong, "review.wrong");
  } else {
    const delta = grade === "easy" ? LP.reviewEasy : grade === "good" ? LP.reviewGood : LP.reviewHard;
    awardLp(delta, `review.${grade}`);
  }
  // Detecta viradas de rank sobre a carta:
  const nextCard = state.cards.find((c) => c.id === id);
  if (nextCard) {
    // Inimigo derrotado (era inimigo ativo, agora defeated).
    if (wasEnemyBefore && isDefeated(nextCard)) {
      awardLp(LP.enemyDefeated, "enemy.defeated");
    }
    // Virou inimigo agora (era não-inimigo, passou do threshold de lapses).
    if (wasBelowEnemyBefore && isEnemy(nextCard) && !isDefeated(nextCard)) {
      awardLp(LP.enemyEvolved, "enemy.evolved");
    }
  }

  // Track cards revisadas hoje for the Home hero ring.
  refreshHomeDay();
  const wasFirstToday = (home.reviewed ?? 0) === 0;
  home = { ...home, reviewed: (home.reviewed ?? 0) + 1 };
  if (wasFirstToday) {
    const prev = home.streak;
    const prevCurrent = prev?.current ?? 0;
    const nextStreak = bumpStreak(prev, todayKey());
    home = { ...home, streak: nextStreak };
    // Bônus diário de streak.
    if (nextStreak.current > 0) {
      awardLp(LP.streakDay(nextStreak.current), "streak.day");
    }
    // Ganhou dia — celebra visualmente.
    if (nextStreak.current > prevCurrent) {
      emitStreakChange({ kind: "gained", current: nextStreak.current, at: Date.now() });
    }
    // Marco atingido? Recompensa em LP + evento de celebração.
    maybeRewardMilestone(prevCurrent, nextStreak.current);
  }
  emitHome();
  emit();
  scheduleSave();
}

// --- Streak -----------------------------------------------------------
function dayKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function parseDayKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function yesterdayKey(today: string): string {
  const dt = parseDayKey(today);
  dt.setDate(dt.getDate() - 1);
  return dayKeyFromDate(dt);
}
function daysBetween(a: string, b: string): number {
  const da = parseDayKey(a).getTime();
  const db = parseDayKey(b).getTime();
  return Math.round((db - da) / 86_400_000);
}

/** Poda histórico para manter só os últimos ~60 dias. */
function pruneHistory(history: Record<string, StreakDayStatus> | undefined): Record<string, StreakDayStatus> {
  const out: Record<string, StreakDayStatus> = {};
  if (!history) return out;
  const today = todayKey();
  const cutoff = parseDayKey(today).getTime() - 60 * 86_400_000;
  for (const [k, v] of Object.entries(history)) {
    if (parseDayKey(k).getTime() >= cutoff) out[k] = v;
  }
  return out;
}

function bumpStreak(prev: Streak | undefined, today: string): Streak {
  const yday = yesterdayKey(today);
  const history = pruneHistory(prev?.history);
  history[today] = "done";
  if (!prev || !prev.lastDay) {
    return {
      current: 1,
      longest: Math.max(1, prev?.longest ?? 0),
      lastDay: today,
      startedOn: today,
      milestonesReached: prev?.milestonesReached ?? [],
      history,
    };
  }
  if (prev.lastDay === today) return prev; // already counted today

  const continued = prev.lastDay === yday;
  const nextCurrent = continued ? prev.current + 1 : 1;

  return {
    current: nextCurrent,
    longest: Math.max(prev.longest ?? 0, nextCurrent),
    lastDay: today,
    startedOn: continued ? prev.startedOn ?? today : today,
    milestonesReached: prev.milestonesReached ?? [],
    history,
  };
}

/** Recompensa em LP ao cruzar um marco (uma única vez por marco). */
function maybeRewardMilestone(prevCurrent: number, nextCurrent: number) {
  const stored = home.streak;
  if (!stored) return;
  const reached = new Set(stored.milestonesReached ?? []);
  const newlyReached: number[] = [];
  for (const m of STREAK_MILESTONES) {
    if (nextCurrent >= m && prevCurrent < m && !reached.has(m)) {
      newlyReached.push(m);
      reached.add(m);
    }
  }
  if (newlyReached.length === 0) return;
  // Recompensa pelo maior marco cruzado neste bump.
  const top = newlyReached[newlyReached.length - 1];
  const bonus = LP.streakMilestone(top);
  if (bonus > 0) awardLp(bonus, `streak.milestone:${top}`);
  home = {
    ...home,
    streak: { ...stored, milestonesReached: Array.from(reached).sort((a, b) => a - b) },
  };
  // Notifica a UI para tocar a celebração.
  emitStreakMilestone({ days: top, lpGained: bonus, at: Date.now() });
}

/** Returns the effective streak, resetting to 0 if user missed ≥2 days. */
let streakSnapshot: Streak = { current: 0, longest: 0, lastDay: "" };
let streakSnapshotKey = "";
function computeStreak(): Streak {
  refreshHomeDay();
  const s = home.streak;
  const today = todayKey();
  if (!s || !s.lastDay) {
    return { current: 0, longest: s?.longest ?? 0, lastDay: "" };
  }
  if (s.lastDay === today || s.lastDay === yesterdayKey(today)) return s;
  // Streak quebrado.
  return {
    current: 0,
    longest: s.longest ?? s.current ?? 0,
    lastDay: s.lastDay,
    milestonesReached: s.milestonesReached ?? [],
    history: pruneHistory(s.history),
  };
}
export function getStreak(): Streak {
  const s = computeStreak();
  // Punição por streak quebrado — aplicada uma vez por lastDay perdido.
  maybePenalizeBrokenStreak(s);
  const key = `${s.current}|${s.longest}|${s.lastDay}|${s.startedOn ?? ""}|${(s.milestonesReached ?? []).join(",")}|${Object.keys(s.history ?? {}).length}`;
  if (key !== streakSnapshotKey) {
    streakSnapshotKey = key;
    streakSnapshot = s;
  }
  return streakSnapshot;
}

function maybePenalizeBrokenStreak(effective: Streak) {
  const stored = home.streak;
  if (!stored || !stored.lastDay) return;
  // Só penalizamos quando o streak efetivo caiu a 0 e o storage guarda um streak anterior > 0.
  const prevCurrent = stored.current ?? 0;
  if (effective.current !== 0 || prevCurrent <= 0) return;
  const marker = home.punishments?.streakBrokenAppliedFor;
  if (marker === stored.lastDay) return;
  const delta = LP.streakBrokenFor(prevCurrent);
  if (delta < 0) {
    awardLp(delta, "streak.broken");
  }
  home = {
    ...home,
    streak: { ...stored, current: 0 },
    punishments: { ...(home.punishments ?? {}), streakBrokenAppliedFor: stored.lastDay },
  };
  emitStreakChange({ kind: "lost", previous: prevCurrent, at: Date.now() });
  emitHome();
  scheduleSave();
}

/** Executa checagens diárias de punição (inimigos ignorados, decaimento por inatividade). */
function runDailyPunishments() {
  if (!isBrowser() || !activeProfile) return;
  const today = todayKey();
  const punishments: PunishmentsState = { ...(home.punishments ?? {}) };
  let changed = false;

  // 1) Streak quebrado — cobre o caso de ainda não termos chamado getStreak.
  maybePenalizeBrokenStreak(computeStreak());

  // 2) Inimigos ignorados: cartas inimigas com vencimento > 24h atrás.
  if (punishments.enemyPenaltyDay !== today) {
    const dayMs = 86_400_000;
    const cutoff = Date.now() - dayMs;
    const overdueEnemies = state.cards.filter(
      (c) => isEnemy(c) && !isDefeated(c) && c.dueAt < cutoff,
    ).length;
    if (overdueEnemies > 0) {
      const raw = overdueEnemies * LP.enemyIgnoredPerDay; // negativo
      const capped = Math.max(LP.enemyIgnoredCapDaily, raw);
      awardLp(capped, `punish.enemies_ignored:${overdueEnemies}`);
      punishments.enemyPenaltyDay = today;
      changed = true;
    } else {
      punishments.enemyPenaltyDay = today;
      changed = true;
    }
  }

  // 3) Decaimento por inatividade (a partir de Ouro): mais de 3 dias sem revisar.
  const rank = getRank();
  if (isDecayEligible(rank.tier) && punishments.decayLastDay !== today) {
    const lastDay = home.streak?.lastDay;
    if (lastDay) {
      const [ly, lm, ld] = lastDay.split("-").map(Number);
      const last = new Date(ly, lm - 1, ld).getTime();
      const now = Date.now();
      const daysIdle = Math.floor((now - last) / 86_400_000);
      const extra = daysIdle - 3;
      if (extra > 0) {
        const raw = extra * LP.decayPerDay; // negativo
        const capped = Math.max(LP.decayCapDaily, raw);
        awardLp(capped, `punish.decay:${daysIdle}d`);
      }
    }
    punishments.decayLastDay = today;
    changed = true;
  }

  if (changed) {
    home = { ...home, punishments };
    emitHome();
    scheduleSave();
  }
}
const EMPTY_STREAK: Streak = { current: 0, longest: 0, lastDay: "" };
export function useStreak(): Streak {
  return useSyncExternalStore(
    (l) => {
      homeListeners.add(l);
      return () => homeListeners.delete(l);
    },
    () => getStreak(),
    () => EMPTY_STREAK,
  );
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

