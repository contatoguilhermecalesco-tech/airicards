// Store da prova mensal sincronizado com Lovable Cloud por perfil.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";
import { awardLp, LP } from "@/lib/rank-store";
import type { ExamDifficulty, ExamQuestion } from "@/lib/exam.functions";
import type { ExamFeedback } from "@/lib/exam-feedback.server";

export type ExamAnswer = {
  questionId: string;
  choice: number | null;
};

export type ExamCurrent = {
  monthKey: string;
  startedAt: number;
  questions: ExamQuestion[];
  answers: Record<string, number | null>;
  currentIndex: number;
};

export type ExamResult = {
  id: string;
  monthKey: string;
  startedAt: number;
  completedAt: number;
  score: number; // 0-25
  total: number; // 25
  percent: number; // 0-100
  level: ExamDifficulty;
  breakdown: Partial<Record<ExamDifficulty, { correct: number; total: number }>>;
  skills: Record<string, { correct: number; total: number }>;
  /** Snapshot das questões e respostas para revisão posterior. */
  questions: ExamQuestion[];
  answers: Record<string, number | null>;
  /** Trecho curto de cada questão, usado para evitar repetição futura. */
  fingerprints: string[];
  /** Considerações da IA sobre a prova (gerado após a finalização). */
  feedback?: ExamFeedback;
  /** Mensagem de erro caso a análise da IA falhe. */
  feedbackError?: string;
};

export type ExamState = {
  current: ExamCurrent | null;
  history: ExamResult[];
};

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheKey(profileId: string) {
  return `airi.exam.${profileId}.v1`;
}

function defaultState(): ExamState {
  return { current: null, history: [] };
}

function loadCache(profileId: string): ExamState {
  if (!isBrowser()) return defaultState();
  try {
    const raw = localStorage.getItem(cacheKey(profileId));
    return raw ? (JSON.parse(raw) as ExamState) : defaultState();
  } catch {
    return defaultState();
  }
}

function saveCache(profileId: string, state: ExamState) {
  if (!isBrowser()) return;
  localStorage.setItem(cacheKey(profileId), JSON.stringify(state));
}

let activeProfile: string | null = null;
let state: ExamState = defaultState();
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;

async function pull(profileId: string) {
  const { data, error } = await supabase
    .from("profile_data")
    .select("exams")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    console.error("[airi/exam] pull failed", error);
    return;
  }
  if (data && activeProfile === profileId) {
    const remote = (data as { exams?: ExamState }).exams;
    state = remote && typeof remote === "object" ? { ...defaultState(), ...remote } : defaultState();
    saveCache(profileId, state);
    emit();
  }
}

function scheduleSave() {
  if (!activeProfile || !isBrowser()) return;
  const profileId = activeProfile;
  saveCache(profileId, state);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("profile_data")
      .upsert(
        {
          profile_id: profileId,
          exams: state as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "profile_id" },
      );
    if (error) console.error("[airi/exam] save failed", error);
  }, 400);
}

function setActive(profileId: string | null) {
  if (activeProfile === profileId) return;
  activeProfile = profileId;
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  if (!profileId) {
    state = defaultState();
    emit();
    return;
  }
  state = loadCache(profileId);
  emit();
  void pull(profileId);
  channel = supabase
    .channel(`exam:${profileId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profile_data", filter: `profile_id=eq.${profileId}` },
      () => void pull(profileId),
    )
    .subscribe();
}

if (isBrowser()) {
  const apply = () => setActive(getCurrentProfile()?.id ?? null);
  apply();
  subscribeProfile(apply);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useExamState(): ExamState {
  return useSyncExternalStore(subscribe, () => state, () => defaultState());
}

export function getMonthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function hasCompletedExamThisMonth(monthKey = getMonthKey()): boolean {
  return state.history.some((r) => r.monthKey === monthKey);
}

export function getResultForMonth(monthKey: string): ExamResult | undefined {
  return state.history.find((r) => r.monthKey === monthKey);
}

export function startExam(questions: ExamQuestion[], monthKey = getMonthKey()) {
  const current: ExamCurrent = {
    monthKey,
    startedAt: Date.now(),
    questions,
    answers: {},
    currentIndex: 0,
  };
  state = { ...state, current };
  emit();
  scheduleSave();
}

export function answerCurrent(choice: number) {
  if (!state.current) return;
  const q = state.current.questions[state.current.currentIndex];
  if (!q) return;
  state = {
    ...state,
    current: {
      ...state.current,
      answers: { ...state.current.answers, [q.id]: choice },
    },
  };
  emit();
  scheduleSave();
}

export function goToIndex(i: number) {
  if (!state.current) return;
  const clamped = Math.max(0, Math.min(state.current.questions.length - 1, i));
  state = { ...state, current: { ...state.current, currentIndex: clamped } };
  emit();
  scheduleSave();
}

export function cancelExam() {
  state = { ...state, current: null };
  emit();
  scheduleSave();
}

function percentToLevel(pct: number): ExamDifficulty {
  if (pct >= 92) return "C2";
  if (pct >= 80) return "C1";
  if (pct >= 65) return "B2";
  if (pct >= 48) return "B1";
  if (pct >= 30) return "A2";
  return "A1";
}

export function finishExam(): ExamResult | null {
  if (!state.current) return null;
  const { current } = state;
  let correct = 0;
  const breakdown: ExamResult["breakdown"] = {};
  const skills: ExamResult["skills"] = {};
  for (const q of current.questions) {
    const ans = current.answers[q.id];
    const ok = ans === q.answer;
    if (ok) correct += 1;
    const b = breakdown[q.difficulty] ?? { correct: 0, total: 0 };
    b.total += 1;
    if (ok) b.correct += 1;
    breakdown[q.difficulty] = b;
    const s = skills[q.skill] ?? { correct: 0, total: 0 };
    s.total += 1;
    if (ok) s.correct += 1;
    skills[q.skill] = s;
  }
  const total = current.questions.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const level = percentToLevel(percent);
  const fingerprints = current.questions.map((q) => q.prompt.slice(0, 80));
  const result: ExamResult = {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    monthKey: current.monthKey,
    startedAt: current.startedAt,
    completedAt: Date.now(),
    score: correct,
    total,
    percent,
    level,
    breakdown,
    skills,
    questions: current.questions,
    answers: current.answers,
    fingerprints,
  };
  state = {
    current: null,
    history: [result, ...state.history.filter((h) => h.monthKey !== current.monthKey)],
  };
  emit();
  scheduleSave();
  // LP pela prova mensal — bônus proporcional ou punição em caso de reprovação (<50%).
  if (percent < 50) {
    awardLp(LP.examFailed, "exam.failed");
  } else {
    awardLp(LP.examBonusByPercent(percent), "exam.completed");
  }
  return result;
}

/** Retorna hashes/trechos das provas anteriores para o gerador evitar repetir. */
export function getAvoidList(): string[] {
  const list: string[] = [];
  for (const r of state.history) {
    for (const f of r.fingerprints ?? []) list.push(f);
    if (list.length > 300) break;
  }
  return list;
}

/** Guarda (ou limpa) as considerações da IA de uma prova do histórico. */
export function setExamFeedback(
  resultId: string,
  patch: { feedback?: ExamFeedback; feedbackError?: string },
) {
  const idx = state.history.findIndex((r) => r.id === resultId);
  if (idx < 0) return;
  const history = [...state.history];
  const prev = history[idx]!;
  history[idx] = {
    ...prev,
    feedback: patch.feedback ?? (patch.feedbackError ? undefined : prev.feedback),
    feedbackError: patch.feedbackError,
  };
  state = { ...state, history };
  emit();
  scheduleSave();
}

export function getResultById(id: string): ExamResult | undefined {
  return state.history.find((r) => r.id === id);
}

export function resetExamsForProfile() {
  state = defaultState();
  emit();
  scheduleSave();
}

/** Reseta o histórico de provas de qualquer perfil (uso admin). */
export async function resetExamsForProfileId(profileId: string): Promise<void> {
  const fresh = defaultState();
  const { error } = await supabase
    .from("profile_data")
    .update({ exams: fresh as never, updated_at: new Date().toISOString() })
    .eq("profile_id", profileId);
  if (error) {
    console.error("[airi/exam] admin reset failed", error);
    throw error;
  }
  if (activeProfile === profileId) {
    state = fresh;
    saveCache(profileId, state);
    emit();
  }
}
