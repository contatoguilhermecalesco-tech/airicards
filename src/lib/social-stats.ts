// Cross-profile stats — lê profile_data dos dois perfis para comparações lado a lado.
// Reaproveita realtime existente (canal separado, não interfere nas outras stores).
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES } from "@/lib/profile";
import type { Card, Streak } from "@/lib/flashcards-store";

export type ProfileStats = {
  profileId: string;
  streak: Streak | null;
  cards: Card[];
  decksCount: number;
};

type Store = Record<string, ProfileStats>;

let store: Store = {};
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let started = false;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function fetchAll() {
  const ids = PROFILES.map((p) => p.id);
  const { data, error } = await supabase
    .from("profile_data")
    .select("profile_id, data, home_sessions")
    .in("profile_id", ids);
  if (error || !data) return;
  const next: Store = {};
  for (const row of data as Array<{
    profile_id: string;
    data: unknown;
    home_sessions: unknown;
  }>) {
    const d =
      (row.data as { decks?: unknown[]; cards?: Card[] } | null) ?? {
        decks: [],
        cards: [],
      };
    const hs =
      (row.home_sessions as { streak?: Streak } | null) ?? {};
    next[row.profile_id] = {
      profileId: row.profile_id,
      streak: hs.streak ?? null,
      cards: (d.cards ?? []) as Card[],
      decksCount: (d.decks ?? []).length,
    };
  }
  store = next;
  emit();
}

export function startSocialStatsSync() {
  if (started) return;
  started = true;
  void fetchAll();
  channel = supabase
    .channel("social-stats")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profile_data" },
      () => {
        void fetchAll();
      },
    )
    .subscribe();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useProfileStats(profileId: string | undefined): ProfileStats | null {
  const snap = useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
  return profileId ? (snap[profileId] ?? null) : null;
}

export type DerivedStats = {
  streakCurrent: number;
  streakLongest: number;
  totalCards: number;
  mastered: number;
  learning: number;
  enemies: number;
  masteryPct: number;
  decksCount: number;
  weakByCategory: { word: number; sentence: number; expression: number };
};

/** Um cartão é "dominado" quando tem ≥3 acertos e menos de 3 lapsos. */
export function deriveStats(s: ProfileStats | null): DerivedStats {
  const cards = s?.cards ?? [];
  let mastered = 0;
  let enemies = 0;
  let learning = 0;
  const weak = { word: 0, sentence: 0, expression: 0 };
  for (const c of cards) {
    const lapses = c.lapses ?? 0;
    const successes = c.successes ?? 0;
    if (lapses >= 3) {
      enemies++;
      const m = (c.mode ?? "sentence") as keyof typeof weak;
      weak[m] = (weak[m] ?? 0) + 1;
    } else if (successes >= 3) {
      mastered++;
    } else {
      learning++;
    }
  }
  const total = cards.length;
  return {
    streakCurrent: s?.streak?.current ?? 0,
    streakLongest: s?.streak?.longest ?? 0,
    totalCards: total,
    mastered,
    learning,
    enemies,
    masteryPct: total ? Math.round((mastered / total) * 100) : 0,
    decksCount: s?.decksCount ?? 0,
    weakByCategory: weak,
  };
}
