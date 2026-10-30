import { getMeta, setMeta, useMeta } from "@/lib/flashcards-store";
import type { Card } from "@/lib/flashcards-store";

export type StudySessionRecord = {
  id: string;
  date: number;
  cards: number;
  correct: number;
  wrong: number;
  durationMs: number;
  lp: number;
  xp: number;
  deckName: string;
  hour: number;
};

const SESSION_KEY = "studyPerformanceSessions";
const MAX_SESSIONS = 500;

export function useStudySessions() {
  return useMeta<StudySessionRecord[]>(SESSION_KEY) ?? [];
}

export function recordStudySession(input: Omit<StudySessionRecord, "id" | "date" | "hour"> & { hour?: number }) {
  const now = Date.now();
  const current = getMeta<StudySessionRecord[]>(SESSION_KEY) ?? [];
  const next: StudySessionRecord[] = [{
    ...input,
    id: `session-${now}-${Math.random().toString(36).slice(2, 7)}`,
    date: now,
    hour: input.hour ?? new Date(now).getHours(),
  }, ...current].slice(0, MAX_SESSIONS);
  setMeta(SESSION_KEY, next);
}

export type Weakness = {
  id: string;
  label: string;
  detail: string;
  cards: Card[];
  rate: number;
};

export function getWeaknesses(cards: Card[]): Weakness[] {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const text = `${card.front} ${card.back} ${card.targetWord ?? ""}`.toLowerCase();
    const source = (card.source ?? "").toLowerCase();
    let id = card.mode === "expression" ? "expressions" : card.mode === "sentence" ? "sentences" : "vocabulary";
    if (/listen|audio|transcri/.test(source)) id = "listening";
    else if (/writ|essay|redac/.test(source)) id = "writing";
    else if (/\b(phrasal verb|give up|look up|put off|turn on|take off|run out|find out)\b/.test(text)) id = "phrasal";
    else if (/\b(am|is|are|was|were|have|has|had|will|would|did|does)\b/.test(text)) id = "grammar";
    else if (card.mode === "sentence") id = "translation";
    const list = groups.get(id) ?? [];
    list.push(card);
    groups.set(id, list);
  }
  const labels: Record<string, { label: string; detail: string }> = {
    vocabulary: { label: "Vocabulário", detail: "Palavras e seus significados" },
    expressions: { label: "Expressões", detail: "Combinações e expressões naturais" },
    phrasal: { label: "Phrasal verbs", detail: "Verbos acompanhados de partículas" },
    grammar: { label: "Gramática", detail: "Estruturas e tempos verbais" },
    translation: { label: "Tradução de frases", detail: "Compreensão e construção de frases" },
    listening: { label: "Listening", detail: "Compreensão de áudio e transcrições" },
    writing: { label: "Escrita", detail: "Produção escrita e construção de textos" },
    sentences: { label: "Construção de frases", detail: "Frases completas e contexto" },
  };
  return [...groups.entries()].map(([id, items]) => {
    const attempts = items.reduce((sum, card) => sum + (card.lapses ?? 0) + (card.successes ?? card.reps), 0);
    const misses = items.reduce((sum, card) => sum + (card.lapses ?? 0), 0);
    const rate = attempts ? Math.round((misses / attempts) * 100) : 0;
    return { id, ...labels[id], cards: items, rate };
  }).filter((item) => item.cards.length > 0 && item.rate > 0)
    .sort((a, b) => b.rate - a.rate || b.cards.length - a.cards.length);
}

export function classifyCard(card: Card, now = Date.now()): "forgetting" | "unstable" | "almost" | "mastered" {
  const lapses = card.lapses ?? 0;
  const successes = card.successes ?? card.reps ?? 0;
  if (card.dueAt <= now && lapses >= 2 && successes <= lapses) return "forgetting";
  if (lapses > 0 && successes <= lapses + 1) return "unstable";
  if (card.dueAt <= now || successes < 3) return "almost";
  return "mastered";
}
