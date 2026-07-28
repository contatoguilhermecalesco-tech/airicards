// Writing history store synced to Lovable Cloud per profile.
// Follows same pattern as flashcards-store: local cache + debounced cloud save + realtime pull.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";
import { awardLp, LP } from "@/lib/rank-store";
import { trackWritingComplete } from "@/lib/daily-challenges";
import type { WritingFeedback } from "@/lib/writing.functions";

export type WritingNote = {
  id: string;
  text: string;
  createdAt: number;
};

export type WritingEntry = {
  id: string;
  createdAt: number;
  updatedAt: number;
  prompt?: string;
  level?: "beginner" | "intermediate" | "advanced";
  text: string;
  feedback: WritingFeedback;
  notes: WritingNote[];
  revisedText?: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheKey(profileId: string) {
  return `airi.writings.${profileId}.v1`;
}
function loadCache(profileId: string): WritingEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    return raw ? (JSON.parse(raw) as WritingEntry[]) : [];
  } catch {
    return [];
  }
}
function saveCache(profileId: string, list: WritingEntry[]) {
  if (!isBrowser()) return;
  localStorage.setItem(cacheKey(profileId), JSON.stringify(list));
}

let activeProfile: string | null = null;
let writings: WritingEntry[] = [];
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function pullFromCloud(profileId: string) {
  const { data, error } = await supabase
    .from("profile_data")
    .select("writings")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[airi/writings] pull failed", error);
    return;
  }
  if (data && activeProfile === profileId) {
    const remote = ((data as { writings?: WritingEntry[] }).writings ?? []) as WritingEntry[];
    writings = Array.isArray(remote) ? remote : [];
    saveCache(profileId, writings);
    emit();
  }
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, writings);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("profile_data")
      .upsert(
        {
          profile_id: profileId,
          writings: writings as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "profile_id" },
      );
    if (error) console.error("[airi/writings] save failed", error);
  }, 400);
}

function setActive(profileId: string | null) {
  if (activeProfile === profileId) return;
  activeProfile = profileId;
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (!profileId) {
    writings = [];
    emit();
    return;
  }
  writings = loadCache(profileId);
  emit();
  void pullFromCloud(profileId);
  realtimeChannel = supabase
    .channel(`writings:${profileId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profile_data", filter: `profile_id=eq.${profileId}` },
      () => void pullFromCloud(profileId),
    )
    .subscribe();
}

if (isBrowser()) {
  const apply = () => setActive(getCurrentProfile()?.id ?? null);
  apply();
  void import("@/lib/profile").then(({ subscribeProfile }) => subscribeProfile(apply));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useWritings(): WritingEntry[] {
  return useSyncExternalStore(subscribe, () => writings, () => []);
}

export function getWriting(id: string): WritingEntry | undefined {
  return writings.find((w) => w.id === id);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function addWriting(input: Omit<WritingEntry, "id" | "createdAt" | "updatedAt" | "notes">): WritingEntry {
  const now = Date.now();
  const entry: WritingEntry = {
    ...input,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    notes: [],
  };
  writings = [entry, ...writings];
  emit();
  scheduleSave();
  // LP pela redação corrigida — nota ≥70 é bom, ≥90 é excelente.
  const s = entry.feedback?.score ?? 0;
  if (s >= 90) awardLp(LP.writingGreat, "writing.great");
  else if (s >= 70) awardLp(LP.writingGood, "writing.good");
  else awardLp(Math.max(5, Math.round(s * 0.2)), "writing.good");
  trackWritingComplete();
  return entry;
}

export function deleteWriting(id: string) {
  writings = writings.filter((w) => w.id !== id);
  emit();
  scheduleSave();
}

export function addNote(id: string, text: string) {
  const t = text.trim();
  if (!t) return;
  writings = writings.map((w) =>
    w.id === id
      ? { ...w, notes: [{ id: uid(), text: t, createdAt: Date.now() }, ...w.notes], updatedAt: Date.now() }
      : w,
  );
  emit();
  scheduleSave();
}

export function deleteNote(entryId: string, noteId: string) {
  writings = writings.map((w) =>
    w.id === entryId
      ? { ...w, notes: w.notes.filter((n) => n.id !== noteId), updatedAt: Date.now() }
      : w,
  );
  emit();
  scheduleSave();
}

export function setRevisedText(id: string, revised: string) {
  writings = writings.map((w) =>
    w.id === id ? { ...w, revisedText: revised, updatedAt: Date.now() } : w,
  );
  emit();
  scheduleSave();
}
