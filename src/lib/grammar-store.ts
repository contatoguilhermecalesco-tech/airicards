// Grammar progress store synced to Lovable Cloud per profile.
// Mirrors the flashcards/writing pattern: local cache + debounced cloud save + realtime pull.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import { awardLp, LP } from "@/lib/rank-store";
import type { GrammarLesson } from "@/lib/grammar.functions";

export type GrammarExerciseAnswer = string | number;

export type GrammarAttempt = {
  id: string;
  week: number;
  topic: string;
  score: number;
  total: number;
  completedAt: number;
};

export type GrammarChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type GrammarProgress = {
  lessons: Record<string, GrammarLesson>;
  attempts: GrammarAttempt[];
  notes: Record<string, string>;
  chats: Record<string, GrammarChatMessage[]>;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheKey(profileId: string) {
  return `airi.grammar.${profileId}.v2`;
}

function defaultProgress(): GrammarProgress {
  return { lessons: {}, attempts: [], notes: {}, chats: {} };
}

function loadCache(profileId: string): GrammarProgress {
  if (!isBrowser()) return defaultProgress();
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    return raw ? (JSON.parse(raw) as GrammarProgress) : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function saveCache(profileId: string, progress: GrammarProgress) {
  if (!isBrowser()) return;
  localStorage.setItem(cacheKey(profileId), JSON.stringify(progress));
}

let activeProfile: string | null = null;
let progress: GrammarProgress = defaultProgress();
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

async function pullFromCloud(profileId: string) {
  const { data, error } = await supabase
    .from("profile_data")
    .select("grammar_progress")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[airi/grammar] pull failed", error);
    return;
  }
  if (data && activeProfile === profileId) {
    const remote = (data as { grammar_progress?: GrammarProgress }).grammar_progress;
    progress = remote && typeof remote === "object" ? { ...defaultProgress(), ...remote } : defaultProgress();
    saveCache(profileId, progress);
    emit();
  }
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, progress);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("profile_data")
      .upsert(
        {
          profile_id: profileId,
          grammar_progress: progress as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "profile_id" },
      );
    if (error) console.error("[airi/grammar] save failed", error);
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
    progress = defaultProgress();
    emit();
    return;
  }
  progress = loadCache(profileId);
  emit();
  void pullFromCloud(profileId);
  realtimeChannel = supabase
    .channel(`grammar:${profileId}`)
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
  return () => listeners.delete(l);
}

export function useGrammarProgress(): GrammarProgress {
  return useSyncExternalStore(subscribe, () => progress, () => defaultProgress());
}

export function getLesson(week: number): GrammarLesson | undefined {
  return progress.lessons[String(week)];
}

export function saveLesson(lesson: GrammarLesson) {
  progress = {
    ...progress,
    lessons: { ...progress.lessons, [String(lesson.week)]: lesson },
  };
  emit();
  scheduleSave();
}

export function addAttempt(input: Omit<GrammarAttempt, "id" | "completedAt">): GrammarAttempt {
  const attempt: GrammarAttempt = {
    ...input,
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    completedAt: Date.now(),
  };
  progress = { ...progress, attempts: [attempt, ...progress.attempts] };
  emit();
  scheduleSave();
  // LP pela aula concluída — escalado pela nota (mínimo garantido).
  const pct = attempt.total > 0 ? (attempt.score / attempt.total) : 0;
  const lp = Math.round(LP.grammarLesson * Math.max(0.4, pct));
  awardLp(lp, "grammar.lesson");
  return attempt;
}

export function getAttemptsForWeek(week: number): GrammarAttempt[] {
  return progress.attempts.filter((a) => a.week === week);
}

export function getBestScoreForWeek(week: number): number | null {
  const attempts = getAttemptsForWeek(week);
  if (!attempts.length) return null;
  return Math.max(...attempts.map((a) => (a.score / a.total) * 100));
}

export function getNote(week: number): string {
  return progress.notes?.[String(week)] ?? "";
}

export function setNote(week: number, value: string) {
  progress = {
    ...progress,
    notes: { ...(progress.notes ?? {}), [String(week)]: value },
  };
  emit();
  scheduleSave();
}

export function getChat(week: number): GrammarChatMessage[] {
  return progress.chats?.[String(week)] ?? [];
}

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function appendChatMessage(
  week: number,
  message: Omit<GrammarChatMessage, "id" | "createdAt">,
): GrammarChatMessage {
  const msg: GrammarChatMessage = { ...message, id: makeId(), createdAt: Date.now() };
  const current = progress.chats?.[String(week)] ?? [];
  progress = {
    ...progress,
    chats: { ...(progress.chats ?? {}), [String(week)]: [...current, msg] },
  };
  emit();
  scheduleSave();
  return msg;
}

export function clearChat(week: number) {
  const chats = { ...(progress.chats ?? {}) };
  delete chats[String(week)];
  progress = { ...progress, chats };
  emit();
  scheduleSave();
}

export function deleteAttempt(id: string) {
  progress = { ...progress, attempts: progress.attempts.filter((a) => a.id !== id) };
  emit();
  scheduleSave();
}
