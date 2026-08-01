// Shared study history store for Reading / Listening / Speaking.
// Mirrors writing-store.ts: local cache + debounced cloud save + realtime pull.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/lib/profile";
import { trackJourneyStudySession } from "@/lib/journey-store";

export type StudySubject = "reading" | "listening" | "speaking";

export type StudyNote = { id: string; text: string; createdAt: number };

export type StudyEntry = {
  id: string;
  subject: StudySubject;
  createdAt: number;
  updatedAt: number;
  title: string;
  level?: string;
  score: number | null;
  // Subject-specific payload (passage/prompt/grade/attempt). Kept as unknown
  // on the store side; each page casts to its own type when rendering.
  payload: unknown;
  notes: StudyNote[];
};

type Buckets = Record<StudySubject, StudyEntry[]>;

function defaultBuckets(): Buckets {
  return { reading: [], listening: [], speaking: [] };
}

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheKey(profileId: string) {
  return `airi.studyHistory.${profileId}.v1`;
}

function loadCache(profileId: string): Buckets {
  if (!isBrowser()) return defaultBuckets();
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    if (!raw) return defaultBuckets();
    const parsed = JSON.parse(raw) as Partial<Buckets>;
    return { ...defaultBuckets(), ...parsed };
  } catch {
    return defaultBuckets();
  }
}

function saveCache(profileId: string, data: Buckets) {
  if (!isBrowser()) return;
  localStorage.setItem(cacheKey(profileId), JSON.stringify(data));
}

let activeProfile: string | null = null;
let buckets: Buckets = defaultBuckets();
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function pullFromCloud(profileId: string) {
  const { data, error } = await supabase
    .from("profile_data")
    .select("study_history" as never)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[airi/study-history] pull failed", error);
    return;
  }
  if (data && activeProfile === profileId) {
    const remote = (data as { study_history?: Partial<Buckets> }).study_history ?? {};
    buckets = { ...defaultBuckets(), ...remote };
    saveCache(profileId, buckets);
    emit();
  }
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, buckets);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("profile_data")
      .upsert(
        {
          profile_id: profileId,
          study_history: buckets as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "profile_id" },
      );
    if (error) console.error("[airi/study-history] save failed", error);
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
    buckets = defaultBuckets();
    emit();
    return;
  }
  buckets = loadCache(profileId);
  emit();
  void pullFromCloud(profileId);
  realtimeChannel = supabase
    .channel(`study-history:${profileId}`)
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

export function useStudyHistory(subject: StudySubject): StudyEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => buckets[subject],
    () => defaultBuckets()[subject],
  );
}

export function getStudyEntry(subject: StudySubject, id: string): StudyEntry | undefined {
  return buckets[subject].find((e) => e.id === id);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function addStudyEntry(
  subject: StudySubject,
  input: Omit<StudyEntry, "id" | "createdAt" | "updatedAt" | "notes" | "subject">,
): StudyEntry {
  const now = Date.now();
  const entry: StudyEntry = {
    ...input,
    subject,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    notes: [],
  };
  buckets = { ...buckets, [subject]: [entry, ...buckets[subject]] };
  emit();
  scheduleSave();
  // Jornada Compartilhada: qualquer sessão de estudo move o barco do casal.
  trackJourneyStudySession();
  return entry;
}

export function deleteStudyEntry(subject: StudySubject, id: string) {
  buckets = { ...buckets, [subject]: buckets[subject].filter((e) => e.id !== id) };
  emit();
  scheduleSave();
}

export function addStudyNote(subject: StudySubject, id: string, text: string) {
  const t = text.trim();
  if (!t) return;
  buckets = {
    ...buckets,
    [subject]: buckets[subject].map((e) =>
      e.id === id
        ? {
            ...e,
            notes: [{ id: uid(), text: t, createdAt: Date.now() }, ...e.notes],
            updatedAt: Date.now(),
          }
        : e,
    ),
  };
  emit();
  scheduleSave();
}

export function deleteStudyNote(subject: StudySubject, entryId: string, noteId: string) {
  buckets = {
    ...buckets,
    [subject]: buckets[subject].map((e) =>
      e.id === entryId
        ? { ...e, notes: e.notes.filter((n) => n.id !== noteId), updatedAt: Date.now() }
        : e,
    ),
  };
  emit();
  scheduleSave();
}
