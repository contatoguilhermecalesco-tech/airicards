import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";

export type SystemUpdateStatus = "maintenance" | "offline" | "degraded" | "info" | "resolved";

export type SystemUpdate = {
  id: string;
  title: string;
  body: string;
  status: SystemUpdateStatus;
  affected_area: string | null;
  icon: string;
  color: string;
  action_label: string | null;
  action_route: string | null;
  created_at: string;
  updated_at: string;
};

type Snapshot = { updates: SystemUpdate[]; readIds: Set<string>; loading: boolean };

let updates: SystemUpdate[] = [];
let readIds = new Set<string>();
let activeProfile: string | null = null;
let loading = true;
let snapshot: Snapshot = { updates, readIds, loading };
const serverSnapshot: Snapshot = { updates: [], readIds: new Set<string>(), loading: true };
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;

function emit() {
  snapshot = { updates, readIds, loading };
  listeners.forEach((listener) => listener());
}

async function fetchUpdates() {
  const { data, error } = await supabase
    .from("system_updates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  updates = (data ?? []) as SystemUpdate[];
}

async function fetchReads(profileId: string) {
  const { data, error } = await supabase
    .from("system_update_reads")
    .select("update_id")
    .eq("profile_id", profileId);
  if (error) throw error;
  readIds = new Set((data ?? []).map((row) => row.update_id));
}

export async function initSystemUpdates() {
  if (typeof window === "undefined") return;
  const profile = getCurrentProfile();
  activeProfile = profile?.id ?? null;
  loading = true;
  emit();
  try {
    await fetchUpdates();
    if (activeProfile) await fetchReads(activeProfile);
    else readIds = new Set();
  } catch (error) {
    console.error("[airi] system updates load failed", error);
  } finally {
    loading = false;
    emit();
  }

  if (channel) void supabase.removeChannel(channel);
  channel = supabase
    .channel("system-updates-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "system_updates" }, () => {
      void fetchUpdates().then(emit).catch((error) => console.error("[airi] system updates refresh failed", error));
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "system_update_reads" }, () => {
      if (!activeProfile) return;
      void fetchReads(activeProfile).then(emit).catch((error) => console.error("[airi] system reads refresh failed", error));
    })
    .subscribe();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSystemUpdates() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}

export function useSystemUpdatesUnread() {
  const state = useSystemUpdates();
  return state.updates.filter((update) => !state.readIds.has(update.id)).length;
}

export async function markSystemUpdateRead(updateId: string) {
  const profile = getCurrentProfile();
  if (!profile || readIds.has(updateId)) return;
  readIds = new Set(readIds).add(updateId);
  emit();
  const { error } = await supabase
    .from("system_update_reads")
    .upsert({ update_id: updateId, profile_id: profile.id }, { onConflict: "update_id,profile_id" });
  if (error) console.error("[airi] system update read failed", error);
}

export async function markAllSystemUpdatesRead() {
  const profile = getCurrentProfile();
  if (!profile) return;
  const unread = updates.filter((update) => !readIds.has(update.id));
  if (!unread.length) return;
  const next = new Set(readIds);
  unread.forEach((update) => next.add(update.id));
  readIds = next;
  emit();
  const { error } = await supabase.from("system_update_reads").upsert(
    unread.map((update) => ({ update_id: update.id, profile_id: profile.id })),
    { onConflict: "update_id,profile_id" },
  );
  if (error) console.error("[airi] system updates read-all failed", error);
}

export async function createSystemUpdate(input: Omit<SystemUpdate, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("system_updates").insert(input);
  if (error) throw error;
  await fetchUpdates();
  emit();
}

export async function deleteSystemUpdate(id: string) {
  const { error } = await supabase.from("system_updates").delete().eq("id", id);
  if (error) throw error;
  await fetchUpdates();
  emit();
}
