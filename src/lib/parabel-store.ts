import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import type { ParabelFeedback } from "@/lib/parabel.functions";

export type ParabelEntry = {
  id: string;
  createdAt: number;
  scenarioId: string;
  scenarioTitle: string;
  level: "beginner" | "intermediate" | "advanced";
  answer: string;
  feedback: ParabelFeedback;
};

function isBrowser() { return typeof window !== "undefined"; }
function cacheKey(id: string) { return `airi.parabel.${id}.v1`; }
function loadCache(id: string): ParabelEntry[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(cacheKey(id)) ?? "[]") as ParabelEntry[]; }
  catch { return []; }
}
function saveCache(id: string, list: ParabelEntry[]) {
  if (isBrowser()) localStorage.setItem(cacheKey(id), JSON.stringify(list));
}

let activeProfile: string | null = null;
let entries: ParabelEntry[] = [];
const listeners = new Set<() => void>();
function emit() { listeners.forEach((listener) => listener()); }
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function pull(profileId: string) {
  const { data, error } = await supabase.from("profile_data").select("parabel_history").eq("profile_id", profileId).maybeSingle();
  if (error) { console.error("[airi/parabel] pull failed", error); return; }
  if (data && activeProfile === profileId) {
    entries = Array.isArray(data.parabel_history) ? data.parabel_history as unknown as ParabelEntry[] : [];
    saveCache(profileId, entries);
    emit();
  }
}
function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, entries);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (activeProfile !== profileId) return;
    const { error } = await supabase.from("profile_data").upsert({
      profile_id: profileId, parabel_history: entries as never, updated_at: new Date().toISOString(),
    }, { onConflict: "profile_id" });
    if (error) console.error("[airi/parabel] save failed", error);
  }, 400);
}
function setActive(profileId: string | null) {
  if (activeProfile === profileId) return;
  activeProfile = profileId;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (channel) { void supabase.removeChannel(channel); channel = null; }
  if (!profileId) { entries = []; emit(); return; }
  entries = loadCache(profileId);
  emit();
  void pull(profileId);
  channel = supabase.channel(`parabel:${profileId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "profile_data", filter: `profile_id=eq.${profileId}` }, () => void pull(profileId))
    .subscribe();
}
if (isBrowser()) {
  const apply = () => setActive(getCurrentProfile()?.id ?? null);
  apply();
  void subscribeProfile(apply);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useParabelHistory() {
  return useSyncExternalStore(subscribe, () => entries, () => []);
}
export function addParabelEntry(input: Omit<ParabelEntry, "id" | "createdAt">): ParabelEntry {
  const entry = { ...input, id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), createdAt: Date.now() };
  entries = [entry, ...entries].slice(0, 100);
  emit();
  scheduleSave();
  return entry;
}
