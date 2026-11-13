// Desafio Relâmpago da Airi — regras puras (sem React/IO).
export const LIGHTNING_SECONDS = 45;
export const LIGHTNING_TARGET = 5;
export const LIGHTNING_REWARD = 15;
export const LIGHTNING_MIN_CARDS = 4;
export const LIGHTNING_OPTIONS = 4;
/** Resposta abaixo deste tempo conta como "rápida" para o combo. */
export const LIGHTNING_FAST_SECONDS = 3;

export type LightningGrade = "S" | "A" | "B";
export const GRADE_TABLE: Record<LightningGrade, { arlys: number; lp: number; label: string }> = {
  S: { arlys: 30, lp: 6, label: "menos de 15s" },
  A: { arlys: 22, lp: 4, label: "15s a 25s" },
  B: { arlys: 15, lp: 2, label: "25s a 45s" },
};

/** Grau pelo tempo total da vitória: S < 15s, A < 25s, B até 45s. */
export function gradeFor(elapsedSeconds: number): LightningGrade {
  if (elapsedSeconds < 15) return "S";
  if (elapsedSeconds < 25) return "A";
  return "B";
}

/** Sequência de acertos rápidos -> multiplicador: 0 = 1x, 1 = 1.5x, 2+ = 2x. */
export function comboMultiplier(fastStreak: number): number {
  if (fastStreak >= 2) return 2;
  if (fastStreak === 1) return 1.5;
  return 1;
}

/** Atualiza a sequência rápida após um acerto. */
export function nextFastStreak(prev: number, answerSeconds: number): number {
  return answerSeconds < LIGHTNING_FAST_SECONDS ? prev + 1 : 0;
}

export type LightningResult = "win" | "fail";

export type QuizCard = { id: string; front: string; back: string };
export type QuizDirection = "en-pt" | "pt-en";
export type QuizQuestion = { cardId: string; prompt: string; answer: string; options: string[]; direction: QuizDirection };

export function lightningDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function lightningKey(profileId: string): string {
  return `airi-lightning:${profileId}`;
}

/** Vitória exige 5 acertos dentro dos 45s; prêmio só na vitória. */
export function resolveLightning(correct: number, elapsedSeconds: number): LightningResult {
  return correct >= LIGHTNING_TARGET && elapsedSeconds <= LIGHTNING_SECONDS ? "win" : "fail";
}

/** Morte súbita: qualquer erro encerra a partida como derrota. */
export function resolveAnswer(isCorrect: boolean, correctSoFar: number, elapsedSeconds: number): LightningResult | "continue" {
  if (!isCorrect) return "fail";
  if (correctSoFar >= LIGHTNING_TARGET) return resolveLightning(correctSoFar, elapsedSeconds);
  return "continue";
}

/** Milissegundos até a próxima meia-noite local (quando o desafio reabre). */
export function msUntilNextChallenge(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Arlys da partida: só na vitória, conforme o grau (padrão B = 15). */
export function rewardFor(result: LightningResult, elapsedSeconds = LIGHTNING_SECONDS): number {
  return result === "win" ? GRADE_TABLE[gradeFor(elapsedSeconds)].arlys : 0;
}

/** LP da partida: só na vitória, conforme o grau. */
export function lpFor(result: LightningResult, elapsedSeconds = LIGHTNING_SECONDS): number {
  return result === "win" ? GRADE_TABLE[gradeFor(elapsedSeconds)].lp : 0;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Monta uma pergunta de 4 alternativas usando outras cartas como distratores.
 * O sentido alterna: frente->verso (EN->PT) ou verso->frente (PT->EN).
 */
export function buildQuestion(
  pool: QuizCard[],
  rnd: () => number = Math.random,
  direction?: QuizDirection,
): QuizQuestion | null {
  const usable = pool.filter((c) => c.front.trim() && c.back.trim());
  if (usable.length < LIGHTNING_MIN_CARDS) return null;
  const dir: QuizDirection = direction ?? (rnd() < 0.5 ? "en-pt" : "pt-en");
  const ask = (c: QuizCard) => (dir === "en-pt" ? c.front : c.back);
  const reply = (c: QuizCard) => (dir === "en-pt" ? c.back : c.front);
  const target = usable[Math.floor(rnd() * usable.length)];
  const distractors = shuffle(
    Array.from(new Set(usable.map(reply).filter((r) => r !== reply(target)))),
    rnd,
  ).slice(0, LIGHTNING_OPTIONS - 1);
  if (distractors.length < LIGHTNING_OPTIONS - 1) return null;
  return {
    cardId: target.id,
    prompt: ask(target),
    answer: reply(target),
    options: shuffle([reply(target), ...distractors], rnd),
    direction: dir,
  };
}

export type LightningAccess = "available" | "played" | "closed";

/**
 * Decide se o desafio pode ser jogado agora.
 * - closed: admin fechou, ninguém joga.
 * - open: admin liberou, joga quantas vezes quiser.
 * - auto: 1x por dia; uma "liberação" do admin (releasedAt) depois da última partida libera nova rodada.
 * `played` é o valor salvo: "AAAA-MM-DD:resultado[:timestamp]".
 */
export function lightningAccess(
  mode: "auto" | "open" | "closed",
  releasedAt: number,
  played: string | null,
  now = new Date(),
): LightningAccess {
  if (mode === "closed") return "closed";
  if (mode === "open" || !played) return "available";
  if (!played.startsWith(lightningDay(now))) return "available";
  const ts = Number(played.split(":")[2] ?? 0) || 0;
  if (releasedAt > ts) return "available";
  return "played";
}
