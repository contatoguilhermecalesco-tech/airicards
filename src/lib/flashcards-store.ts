// Simple SM-2 inspired spaced repetition + localStorage store
import { useSyncExternalStore } from "react";

export type Card = {
  id: string;
  deckId: string;
  front: string; // English
  back: string; // Translation
  ease: number; // SM-2 ease factor
  interval: number; // days
  reps: number;
  dueAt: number; // ms epoch
  createdAt: number;
  lapses?: number; // vezes que errou
  successes?: number; // vezes que acertou
};

export type Deck = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
};

type State = {
  decks: Deck[];
  cards: Card[];
};

const STORAGE_KEY = "flashcards.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function load(): State {
  if (!isBrowser()) return { decks: [], cards: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decks: [], cards: [] };
    return JSON.parse(raw) as State;
  } catch {
    return { decks: [], cards: [] };
  }
}

let state: State = { decks: [], cards: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || !isBrowser()) return;
  state = load();
  hydrated = true;
}

function persist() {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureHydrated();
      return selector(state);
    },
    () => selector({ decks: [], cards: [] }),
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createDeck(name: string, description?: string): Deck {
  ensureHydrated();
  const deck: Deck = {
    id: uid(),
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: Date.now(),
  };
  state = { ...state, decks: [deck, ...state.decks] };
  emit();
  return deck;
}

export function deleteDeck(id: string) {
  ensureHydrated();
  state = {
    decks: state.decks.filter((d) => d.id !== id),
    cards: state.cards.filter((c) => c.deckId !== id),
  };
  emit();
}

export function updateDeck(id: string, patch: Partial<Pick<Deck, "name" | "description">>) {
  ensureHydrated();
  state = {
    ...state,
    decks: state.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  };
  emit();
}

export function createCard(deckId: string, front: string, back: string): Card {
  ensureHydrated();
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
  };
  state = { ...state, cards: [card, ...state.cards] };
  emit();
  return card;
}

export function deleteCard(id: string) {
  ensureHydrated();
  state = { ...state, cards: state.cards.filter((c) => c.id !== id) };
  emit();
}

export type Grade = "again" | "hard" | "good" | "easy";

// Classifica dificuldade automaticamente com base no histórico de erros/acertos.
export function autoClassify(card: Card): "hard" | "good" | "easy" {
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? 0;
  if (lapses >= 3 || (lapses > 0 && successes < lapses)) return "hard";
  if (successes >= 3 && lapses === 0) return "easy";
  return "good";
}

// Score de dificuldade: quanto maior, mais o usuário erra — prioriza na fila.
export function difficultyScore(card: Card): number {
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? 0;
  return lapses * 2 - successes * 0.5;
}

// Carta inimiga: 3+ erros. Vira um "chefe" do baralho que o jogador precisa derrotar.
export const ENEMY_THRESHOLD = 3;
export function isEnemy(card: Card): boolean {
  return (card.lapses ?? 0) >= ENEMY_THRESHOLD;
}
export function isDefeated(card: Card): boolean {
  // Uma inimiga é "derrotada" quando o jogador acerta mais vezes que errou.
  return isEnemy(card) && (card.successes ?? 0) > (card.lapses ?? 0);
}

export function reviewCard(id: string, grade: Grade) {
  ensureHydrated();
  const now = Date.now();
  const dayMs = 86_400_000;
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
        return {
          ...c,
          ease,
          interval,
          reps,
          dueAt: now + 60_000,
          lapses: lapses + 1,
          successes,
        };
      }

      const q = grade === "hard" ? 3 : grade === "good" ? 4 : 5;
      ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      reps += 1;

      if (reps === 1) interval = grade === "easy" ? 3 : 1;
      else if (reps === 2) interval = grade === "easy" ? 6 : 3;
      else interval = Math.round(interval * ease * (grade === "hard" ? 0.8 : 1));

      return {
        ...c,
        ease,
        interval,
        reps,
        dueAt: now + interval * dayMs,
        lapses,
        successes: successes + 1,
      };
    }),
  };
  emit();
}

export function getDueCards(deckId?: string, at: number = Date.now()): Card[] {
  ensureHydrated();
  return state.cards.filter(
    (c) => c.dueAt <= at && (deckId ? c.deckId === deckId : true),
  );
}

export function cardsForDeck(deckId: string): Card[] {
  ensureHydrated();
  return state.cards.filter((c) => c.deckId === deckId);
}
