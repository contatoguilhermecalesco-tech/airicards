// Cutucadas ("pokes") entre os dois perfis — realtime + estado em módulo.
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import type { ProfileId } from "@/lib/social-store";

export type Poke = {
  id: string;
  fromProfile: ProfileId;
  toProfile: ProfileId;
  emoji: string;
  seen: boolean;
  createdAt: string;
};

export const POKE_COOLDOWN_MS = 30_000;

function mapPoke(row: any): Poke {
  return {
    id: row.id,
    fromProfile: row.from_profile,
    toProfile: row.to_profile,
    emoji: row.emoji ?? "👆",
    seen: !!row.seen,
    createdAt: row.created_at,
  };
}

let pokes: Poke[] = [];
let lastSentAt = 0;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let started = false;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function fetchPokes() {
  const { data } = await (supabase as any)
    .from("pokes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  pokes = (data ?? []).map(mapPoke);
  emit();
}

export function startPokesSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchPokes();
  subscribeProfile(() => {
    void fetchPokes();
  });
  channel = supabase
    .channel("pokes-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "pokes" }, () => {
      void fetchPokes();
    })
    .subscribe();
}

export function usePokesSync() {
  useEffect(() => {
    startPokesSync();
  }, []);
}

export function usePokes(): Poke[] {
  return useSyncExternalStore(
    subscribe,
    () => pokes,
    () => pokes,
  );
}

/** Cutucada recebida mais recente ainda não vista. */
export function useIncomingPoke(): Poke | null {
  const list = usePokes();
  const me = getCurrentProfile();
  if (!me) return null;
  return list.find((p) => p.toProfile === me.id && !p.seen) ?? null;
}

export function pokeCooldownLeft(): number {
  return Math.max(0, POKE_COOLDOWN_MS - (Date.now() - lastSentAt));
}

export async function sendPoke(
  from: ProfileId,
  to: ProfileId,
  emoji = "👆",
): Promise<{ ok: boolean; error?: "cooldown" | "unknown" }> {
  if (pokeCooldownLeft() > 0) return { ok: false, error: "cooldown" };
  lastSentAt = Date.now();
  const { error } = await (supabase as any)
    .from("pokes")
    .insert({ from_profile: from, to_profile: to, emoji });
  if (error) {
    lastSentAt = 0;
    console.error("sendPoke", error);
    return { ok: false, error: "unknown" };
  }
  await fetchPokes();
  return { ok: true };
}

export async function markPokeSeen(id: string): Promise<void> {
  pokes = pokes.map((p) => (p.id === id ? { ...p, seen: true } : p));
  emit();
  const { error } = await (supabase as any).from("pokes").update({ seen: true }).eq("id", id);
  if (error) console.error("markPokeSeen", error);
}

export function teardownPokes() {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  started = false;
}
