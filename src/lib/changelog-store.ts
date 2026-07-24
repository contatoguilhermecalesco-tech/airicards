// Store das "Novidades" do app — entradas do changelog visíveis para todos.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";

export type ChangelogCategory = "feature" | "improvement" | "fix";

export type ChangelogEntry = {
  id: string;
  title: string;
  body: string;
  category: ChangelogCategory;
  icon: string | null;
  created_at: string;
};

const LAST_SEEN_KEY = "airi.changelog.last-seen"; // por perfil: `${key}.${profileId}`

let entries: ChangelogEntry[] = [];
let lastSeen = 0;
let snapshot = { entries, lastSeen };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { entries, lastSeen };
  listeners.forEach((l) => l());
}

function isBrowser() {
  return typeof window !== "undefined";
}

function seenKey() {
  const p = getCurrentProfile();
  return p ? `${LAST_SEEN_KEY}.${p.id}` : LAST_SEEN_KEY;
}

function readLastSeen(): number {
  if (!isBrowser()) return 0;
  try {
    const v = window.localStorage.getItem(seenKey());
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

async function fetchAll() {
  const { data, error } = await supabase
    .from("changelog_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!error && data) {
    entries = data as ChangelogEntry[];
    emit();
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null;

export async function initChangelog() {
  if (!isBrowser()) return;
  lastSeen = readLastSeen();
  await fetchAll();
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  channel = supabase
    .channel("changelog-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "changelog_entries" },
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

const SERVER: typeof snapshot = { entries: [], lastSeen: 0 };

export function useChangelog() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  );
}

export function useChangelogUnread() {
  const s = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  );
  return s.entries.filter((e) => new Date(e.created_at).getTime() > s.lastSeen).length;
}

export function markAllChangelogSeen() {
  if (!isBrowser()) return;
  lastSeen = Date.now();
  try {
    window.localStorage.setItem(seenKey(), String(lastSeen));
  } catch {
    // ignore
  }
  emit();
}

// ===== Admin helpers =====
export async function createChangelogEntry(input: {
  title: string;
  body: string;
  category: ChangelogCategory;
  icon?: string | null;
}) {
  const { data, error } = await supabase
    .from("changelog_entries")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      icon: input.icon ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as ChangelogEntry;
}

export async function deleteChangelogEntry(id: string) {
  const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
  if (error) throw error;
  await fetchAll();
}
