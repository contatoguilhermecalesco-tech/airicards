// Client-only preferences for the Library UI (view mode, sort, filter, archive).
// Backed by localStorage, scoped per profile to avoid cross-profile leaks.
import { useSyncExternalStore } from "react";
import { getCurrentProfile } from "@/lib/profile";

export type LibraryViewMode = "grid" | "list" | "detailed";
export type LibrarySort = "recent" | "studied" | "size" | "alpha" | "progress";
export type LibraryFilter = "all" | "due" | "enemies" | "new" | "shared";

export type DeckPrefs = {
  view: LibraryViewMode;
  sort: LibrarySort;
  filter: LibraryFilter;
  archived: string[]; // deck ids
  sectioned: boolean; // grouped rows or flat list
};

export type CardViewMode = "grid" | "list";
export type CardSort = "recent" | "alpha" | "due" | "hardest";
export type CardFilter =
  | "all"
  | "word"
  | "sentence"
  | "expression"
  | "new"
  | "learning"
  | "mastered"
  | "enemies";

export type CardPrefs = {
  view: CardViewMode;
  sort: CardSort;
  filter: CardFilter;
};

const DEFAULT_DECK: DeckPrefs = {
  view: "grid",
  sort: "recent",
  filter: "all",
  archived: [],
  sectioned: true,
};
const DEFAULT_CARD: CardPrefs = { view: "list", sort: "recent", filter: "all" };

function scopedKey(base: string): string {
  const p = getCurrentProfile();
  return `airi:lib:${p?.id ?? "guest"}:${base}`;
}

function read<T>(base: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(scopedKey(base));
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) } as T;
  } catch {
    return fallback;
  }
}

function write<T>(base: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedKey(base), JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// ---- Deck-list prefs -------------------------------------------------------
let deckPrefsCache: DeckPrefs | null = null;
function getDeckPrefsSnapshot(): DeckPrefs {
  if (!deckPrefsCache) deckPrefsCache = read("deck-prefs", DEFAULT_DECK);
  return deckPrefsCache;
}
export function setDeckPrefs(patch: Partial<DeckPrefs>) {
  deckPrefsCache = { ...getDeckPrefsSnapshot(), ...patch };
  write("deck-prefs", deckPrefsCache);
  emit();
}
export function toggleArchived(deckId: string) {
  const cur = getDeckPrefsSnapshot();
  const has = cur.archived.includes(deckId);
  setDeckPrefs({
    archived: has ? cur.archived.filter((id) => id !== deckId) : [...cur.archived, deckId],
  });
}
export function useDeckPrefs(): DeckPrefs {
  return useSyncExternalStore(subscribe, getDeckPrefsSnapshot, () => DEFAULT_DECK);
}

// ---- Card-list prefs (per-deck) -------------------------------------------
const cardPrefsCache = new Map<string, CardPrefs>();
function getCardPrefsSnapshot(deckId: string): CardPrefs {
  let v = cardPrefsCache.get(deckId);
  if (!v) {
    v = read(`card-prefs:${deckId}`, DEFAULT_CARD);
    cardPrefsCache.set(deckId, v);
  }
  return v;
}
export function setCardPrefs(deckId: string, patch: Partial<CardPrefs>) {
  const next = { ...getCardPrefsSnapshot(deckId), ...patch };
  cardPrefsCache.set(deckId, next);
  write(`card-prefs:${deckId}`, next);
  emit();
}
export function useCardPrefs(deckId: string): CardPrefs {
  return useSyncExternalStore(
    subscribe,
    () => getCardPrefsSnapshot(deckId),
    () => DEFAULT_CARD,
  );
}
