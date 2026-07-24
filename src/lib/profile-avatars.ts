// Cross-profile avatar cache. Fetches avatarUrl from the `wallets.inventory` JSON
// for any profile ID, and keeps the current user's avatar in sync with the local
// wallet-store so UI updates instantly when they upload a new photo.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeWallet, getWallet } from "@/lib/wallet-store";

type Cache = Record<string, string | null>;
const cache: Cache = {};
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function fetchOnce(profileId: string) {
  if (inflight.has(profileId)) return inflight.get(profileId)!;
  const p = (async () => {
    const { data } = await supabase
      .from("wallets")
      .select("inventory")
      .eq("profile_id", profileId)
      .maybeSingle();
    const inv = (data?.inventory ?? {}) as { avatarUrl?: string };
    cache[profileId] = typeof inv.avatarUrl === "string" && inv.avatarUrl ? inv.avatarUrl : null;
    emit();
  })().finally(() => inflight.delete(profileId));
  inflight.set(profileId, p);
  return p;
}

export function primeAvatar(profileId: string) {
  if (typeof window === "undefined") return;
  if (profileId in cache) return;
  cache[profileId] = null;
  void fetchOnce(profileId);
}

export function setAvatarCache(profileId: string, url: string | null) {
  const clean = url && url.length > 0 ? url : null;
  if (cache[profileId] === clean) return;
  cache[profileId] = clean;
  emit();
}

export function refreshAvatar(profileId: string) {
  return fetchOnce(profileId);
}

// Keep current profile's avatar in sync with the local wallet store.
if (typeof window !== "undefined") {
  subscribeWallet(() => {
    const w = loadWallet();
    if (w.profileId && w.loaded) {
      setAvatarCache(w.profileId, w.avatarUrl || null);
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useProfileAvatar(profileId: string | undefined): string | null {
  const url = useSyncExternalStore(
    subscribe,
    () => (profileId ? cache[profileId] ?? null : null),
    () => null,
  );
  if (profileId && !(profileId in cache)) {
    // Lazily prime — safe: no-op on server, dedupes in-flight.
    primeAvatar(profileId);
  }
  return url;
}
