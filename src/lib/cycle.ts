// 8-week RRSLG cycle helper (per profile, stored em localStorage).
// A "semana" começa no dia em que o perfil começa o ciclo, e cada 2
// semanas aciona um bloco do currículo de gramática do método.
import { useSyncExternalStore } from "react";
import { getCurrentProfile, subscribeProfile } from "@/lib/profile";

export type GrammarBlock = {
  weeks: [number, number];
  topic: string;
  application: string;
};

export const GRAMMAR_BLOCKS: GrammarBlock[] = [
  { weeks: [1, 2], topic: "Present Simple / Continuous", application: "Falar sobre hábitos e agora" },
  { weeks: [3, 4], topic: "Past Simple / Future (Will/Going to)", application: "Contar histórias e fazer planos" },
  { weeks: [5, 6], topic: "Present Perfect & Modal Verbs", application: "Experiências de vida e permissões" },
  { weeks: [7, 8], topic: "Prepositions & Complex Conjunctions", application: "Refinar a conexão entre as ideias" },
];

export const DAYS_OF_WEEK: {
  id: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  label: string;
  focus: string;
}[] = [
  { id: "sun", label: "Domingo", focus: "Light Day" },
  { id: "mon", label: "Segunda", focus: "Reading" },
  { id: "tue", label: "Terça", focus: "Listening" },
  { id: "wed", label: "Quarta", focus: "Speaking" },
  { id: "thu", label: "Quinta", focus: "Gramática" },
  { id: "fri", label: "Sexta", focus: "Writing" },
  { id: "sat", label: "Sábado", focus: "Immersion" },
];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function isBrowser() {
  return typeof window !== "undefined";
}

function key(profileId: string) {
  return `airi.cycle.${profileId}.v1`;
}

export function getCycleStart(profileId: string): number | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(key(profileId));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function ensureCycleStart(profileId: string): number {
  const existing = getCycleStart(profileId);
  if (existing) return existing;
  const now = Date.now();
  if (isBrowser()) localStorage.setItem(key(profileId), String(now));
  emit();
  return now;
}

export function resetCycle(profileId: string) {
  if (!isBrowser()) return;
  localStorage.setItem(key(profileId), String(Date.now()));
  emit();
}

export function getWeekNumber(profileId: string, at: number = Date.now()): number {
  const start = ensureCycleStart(profileId);
  const week = Math.floor((at - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(8, week));
}

export function getGrammarForWeek(week: number): GrammarBlock {
  return (
    GRAMMAR_BLOCKS.find((b) => week >= b.weeks[0] && week <= b.weeks[1]) ??
    GRAMMAR_BLOCKS[0]
  );
}

export function getTodayFocus() {
  const idx = new Date().getDay();
  return DAYS_OF_WEEK[idx];
}

export function cycleFinished(profileId: string, at: number = Date.now()): boolean {
  const start = ensureCycleStart(profileId);
  return at - start > 8 * 7 * 24 * 60 * 60 * 1000;
}

// React hook — subscribes to profile changes and cycle resets.
export function useCycleWeek(): { week: number; grammar: GrammarBlock } | null {
  const week = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      const unsubProfile = subscribeProfile(l);
      return () => {
        listeners.delete(l);
        unsubProfile();
      };
    },
    () => {
      const p = getCurrentProfile();
      if (!p) return null;
      return getWeekNumber(p.id);
    },
    () => null,
  );
  if (week === null) return null;
  return { week, grammar: getGrammarForWeek(week) };
}
