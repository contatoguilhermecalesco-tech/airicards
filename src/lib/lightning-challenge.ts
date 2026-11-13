// Desafio Relâmpago da Airi — regras puras (sem React/IO).
export const LIGHTNING_SECONDS = 45;
export const LIGHTNING_TARGET = 5;
export const LIGHTNING_REWARD = 15;
export const LIGHTNING_MIN_CARDS = 3;

export type LightningResult = "win" | "fail";

export type QuizCard = { id: string; front: string; back: string };
export type QuizQuestion = { cardId: string; prompt: string; answer: string; options: string[] };

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

export function rewardFor(result: LightningResult): number {
  return result === "win" ? LIGHTNING_REWARD : 0;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Monta uma pergunta de 3 alternativas usando outras cartas como distratores. */
export function buildQuestion(pool: QuizCard[], rnd: () => number = Math.random): QuizQuestion | null {
  const usable = pool.filter((c) => c.front.trim() && c.back.trim());
  if (usable.length < LIGHTNING_MIN_CARDS) return null;
  const target = usable[Math.floor(rnd() * usable.length)];
  const distractors = shuffle(
    Array.from(new Set(usable.filter((c) => c.back !== target.back).map((c) => c.back))),
    rnd,
  ).slice(0, 2);
  if (distractors.length < 2) return null;
  return {
    cardId: target.id,
    prompt: target.front,
    answer: target.back,
    options: shuffle([target.back, ...distractors], rnd),
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
