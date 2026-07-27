import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { X, Check, Swords, Trophy, Skull, Flame, Focus, Minimize2, Keyboard, CornerDownLeft, HelpCircle, Sparkles, Zap } from "lucide-react";
import {
  useStore,
  getDueCards,
  getEnemyCards,
  reviewCard,
  difficultyScore,
  isEnemy,
  isDefeated,
  ENEMY_THRESHOLD,
  registerHomeSession,
} from "@/lib/flashcards-store";
import { matchAnswer } from "@/lib/answer-match";
import {
  enemyTier,
  TIER_META,
  useCombo,
  resetCombo,
  bumpCombo,
  breakCombo,
  comboMultiplier,
  onEnemyDefeated,
  onComboReached,
  getComboCount,
} from "@/lib/enemy-system";


type ReviewMode = "due" | "enemies";
type Search = { deck?: string; mode?: ReviewMode };

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Airi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    deck: typeof search.deck === "string" ? search.deck : undefined,
    mode: search.mode === "enemies" ? "enemies" : undefined,
  }),
  component: Review,
});

function renderSentence(sentence: string, target: string) {
  const t = target.trim();
  if (!t) return sentence;
  const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = sentence.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part) && part.toLowerCase() === t.toLowerCase() ? (
          <span
            key={i}
            className="rounded-md bg-primary/15 px-1.5 text-primary"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Review() {
  const { deck: deckId, mode } = Route.useSearch();
  const isEnemyRun = mode === "enemies";

  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const [dmgFx, setDmgFx] = useState<
    { id: number; text: string; tone: "damage" | "heal" }[]
  >([]);
  const [defeatFx, setDefeatFx] = useState<string | null>(null);
  const dmgIdRef = useRef(0);

  // Digitação obrigatória da tradução
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<
    | { correct: boolean; similarity: number; expected: string }
    | null
  >(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);


  const allCards = useStore((s) => s.cards);

  useEffect(() => {
    if (!deckId && !isEnemyRun) registerHomeSession();
    if (isEnemyRun) resetCombo();
    const source = isEnemyRun
      ? getEnemyCards(deckId).filter((c) => !isDefeated(c))
      : getDueCards(deckId, Date.now());
    const ordered = [...source].sort(
      (a, b) =>
        difficultyScore(b) - difficultyScore(a) + (Math.random() - 0.5) * 0.6,
    );
    setQueue(ordered.map((c) => c.id));
    setSessionCount(ordered.length);
    setIndex(0);
    setShowBack(false);
    setReviewed(0);
  }, [deckId, isEnemyRun]);

  const currentId = queue[index];
  const current = useMemo(
    () => allCards.find((c) => c.id === currentId),
    [allCards, currentId],
  );
  const currentIsEnemy = current ? isEnemy(current) : false;

  const deckName = useStore((s) =>
    deckId ? s.decks.find((d) => d.id === deckId)?.name : undefined,
  );

  const finished = queue.length > 0 && index >= queue.length;

  const [askDifficulty, setAskDifficulty] = useState(false);
  const [notice, setNotice] = useState<
    | { kind: "enemy-born" | "enemy-defeated"; text: string }
    | null
  >(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashNotice(n: NonNullable<typeof notice>) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(n);
    noticeTimer.current = setTimeout(() => setNotice(null), 1800);
  }

  function spawnDmg(text: string, tone: "damage" | "heal") {
    const id = ++dmgIdRef.current;
    setDmgFx((xs) => [...xs, { id, text, tone }]);
    setTimeout(() => setDmgFx((xs) => xs.filter((x) => x.id !== id)), 1200);
  }

  function resetAnswerState() {
    setTyped("");
    setVerdict(null);
    setShake(false);
  }

  // Foca o input ao trocar de carta
  useEffect(() => {
    resetAnswerState();
    setShowBack(false);
    setAskDifficulty(false);
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [currentId]);

  function submitTypedAnswer() {
    if (!current || verdict) return;
    const trimmed = typed.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const res = matchAnswer(trimmed, current.back);
    setVerdict({
      correct: res.correct,
      similarity: res.similarity,
      expected: res.bestExpected,
    });
    setShowBack(true);
    if (res.correct) {
      setAskDifficulty(true);
      if (isEnemyRun && isEnemy(current)) {
        bumpCombo();
        onComboReached(getComboCount());
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (isEnemyRun) breakCombo();
    }
  }

  function giveUp() {
    if (!current || verdict) return;
    setVerdict({ correct: false, similarity: 0, expected: current.back });
    setShowBack(true);
  }

  function handleWrong() {
    if (!current) return;
    const wasEnemy = isEnemy(current);
    const willBecomeEnemy =
      !wasEnemy && (current.lapses ?? 0) + 1 >= ENEMY_THRESHOLD;
    reviewCard(current.id, "again");
    setReviewed((n) => n + 1);
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 600);
    if (wasEnemy) spawnDmg("+1 HP", "heal");
    if (isEnemyRun) breakCombo();
    if (willBecomeEnemy) {
      flashNotice({
        kind: "enemy-born",
        text: "Um inimigo apareceu! Essa carta virou um chefe do seu baralho.",
      });
    }
    setIndex((i) => i + 1);
  }

  function handleDifficulty(g: "hard" | "good" | "easy") {
    if (!current) return;
    const wasEnemy = isEnemy(current);
    const tierBefore = wasEnemy ? enemyTier(current) : "wounded";
    const willDefeat =
      wasEnemy && (current.successes ?? 0) + 1 > (current.lapses ?? 0);
    const dmg = g === "easy" ? 2 : g === "good" ? 1 : 1;
    reviewCard(current.id, g);
    setReviewed((n) => n + 1);
    if (wasEnemy) spawnDmg(`-${dmg} HP`, "damage");
    if (willDefeat) {
      onEnemyDefeated(tierBefore);
      flashNotice({
        kind: "enemy-defeated",
        text: `${TIER_META[tierBefore].label} derrotada! +1 vitória.`,
      });
      setDefeatFx(current.front);
      setTimeout(() => setDefeatFx(null), 1400);
      setTimeout(() => {
        setIndex((i) => i + 1);
      }, 900);
      return;
    }
    setIndex((i) => i + 1);
  }


  const progressPct =
    sessionCount === 0 ? 0 : Math.min(100, (reviewed / sessionCount) * 100);

  // -------- Modo Foco (esconde chrome extra) --------
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("airi.focus-mode") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("airi.focus-mode", focusMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [focusMode]);

  // -------- Atalhos de teclado --------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();

      // Após acerto: escolher dificuldade
      if (verdict?.correct && askDifficulty) {
        if (k === "1" || k === "d") return handleDifficulty("hard");
        if (k === "2" || k === "m") return handleDifficulty("good");
        if (k === "3" || k === "f") return handleDifficulty("easy");
      }

      // Após erro: Enter para próxima
      if (verdict && !verdict.correct && e.key === "Enter") {
        e.preventDefault();
        return handleWrong();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [verdict, askDifficulty, finished, current]);





  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient halo — violet by default, blood-red for enemies */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[520px] -translate-x-1/2 rounded-full opacity-60 blur-2xl transition-all duration-500"
        style={{
          background: currentIsEnemy
            ? "radial-gradient(closest-side, hsl(var(--destructive) / 0.28), transparent 70%)"
            : "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent 70%)",
        }}
      />

      {/* Enemy full-screen vignette (pulsing) */}
      {currentIsEnemy && (
        <div
          aria-hidden
          className="enemy-vignette pointer-events-none fixed inset-0 z-10"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, transparent 45%, hsl(var(--destructive) / 0.22) 100%)",
          }}
        />
      )}

      {/* Hit flash on wrong answer */}
      {hitFlash && (
        <div
          aria-hidden
          className="enemy-flash pointer-events-none fixed inset-0 z-20 bg-destructive/25"
        />
      )}

      <div className="relative z-30 mx-auto flex min-h-screen max-w-2xl flex-col px-5 pt-5 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          {isEnemyRun ? (
            <Link
              to="/enemies"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground backdrop-blur-md transition hover:bg-white/[0.08] hover:text-foreground"
              aria-label="Sair da arena"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          ) : deckId ? (
            <Link
              to="/library/$deckId"
              params={{ deckId }}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground backdrop-blur-md transition hover:bg-white/[0.08] hover:text-foreground"
              aria-label="Sair da sessão"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          ) : (
            <Link
              to="/"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground backdrop-blur-md transition hover:bg-white/[0.08] hover:text-foreground"
              aria-label="Sair da sessão"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          )}
          {!focusMode && (
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${
                  isEnemyRun ? "text-destructive" : "text-muted-foreground/70"
                }`}
              >
                {isEnemyRun && <Skull className="h-3 w-3" strokeWidth={2.75} />}
                {isEnemyRun ? "Arena" : "Sessão"}
              </div>
              <div className="max-w-[180px] truncate text-[13px] font-medium text-foreground/90">
                {isEnemyRun
                  ? "Cartas inimigas"
                  : deckName
                  ? deckName
                  : "Todos os decks"}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!focusMode && (
              <div
                className={`grid h-10 min-w-10 place-items-center rounded-full border px-3 text-[12px] font-semibold tabular-nums backdrop-blur-md ${
                  isEnemyRun
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-white/[0.08] bg-white/[0.04] text-foreground/80"
                }`}
              >
                {Math.min(index + (finished ? 0 : 1), sessionCount)}
                <span className="mx-1 opacity-50">/</span>
                {sessionCount || 0}
              </div>
            )}
            <button
              onClick={() => setFocusMode((f) => !f)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-muted-foreground backdrop-blur-md transition hover:bg-white/[0.08] hover:text-foreground"
              aria-label={focusMode ? "Sair do modo foco" : "Ativar modo foco"}
              aria-pressed={focusMode}
              title={focusMode ? "Sair do modo foco" : "Modo foco"}
            >
              {focusMode ? (
                <Minimize2 className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <Focus className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Progress rail */}
        {!focusMode && (
          <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                isEnemyRun
                  ? "bg-gradient-to-r from-destructive/70 via-destructive to-destructive/70"
                  : "bg-gradient-to-r from-primary/70 via-primary to-primary/70"
              }`}
              style={{
                width: `${progressPct}%`,
                boxShadow: isEnemyRun
                  ? "0 0 12px hsl(var(--destructive) / 0.6)"
                  : "0 0 12px hsl(var(--primary) / 0.5)",
              }}
            />
          </div>
        )}

        {queue.length === 0 && !current ? (
          <EmptyState enemyRun={isEnemyRun} />
        ) : finished || !current ? (
          <FinishedState
            reviewed={reviewed}
            deckId={deckId}
            enemyRun={isEnemyRun}
          />
        ) : (
          <div className="mt-8 flex flex-1 flex-col">
            {/* Card */}
            <div className="flex flex-1 items-center justify-center">
              {currentIsEnemy ? (
                <EnemyCard
                  key={currentId}
                  front={current.front}
                  back={current.back}
                  targetWord={current.targetWord}
                  mode={current.mode}
                  lapses={current.lapses ?? 0}
                  successes={current.successes ?? 0}
                  showBack={showBack}
                />
              ) : (
                <NormalCard
                  key={currentId}
                  front={current.front}
                  back={current.back}
                  targetWord={current.targetWord}
                  mode={current.mode}
                  showBack={showBack}
                />
              )}
            </div>

            {/* Floating damage / heal numbers */}
            {dmgFx.length > 0 && (
              <div className="pointer-events-none fixed inset-x-0 top-1/2 z-40 mx-auto flex justify-center">
                {dmgFx.map((f) => (
                  <span
                    key={f.id}
                    className={`dmg-float absolute left-1/2 text-[34px] font-black tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] ${
                      f.tone === "damage"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                    style={{
                      textShadow:
                        f.tone === "damage"
                          ? "0 0 24px hsl(var(--success) / 0.9)"
                          : "0 0 24px hsl(var(--destructive) / 0.9)",
                    }}
                  >
                    {f.text}
                  </span>
                ))}
              </div>
            )}

            {/* Defeat cinematic overlay */}
            {defeatFx && (
              <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
                <div
                  className="defeat-fade absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(closest-side, hsl(var(--destructive) / 0.35), transparent 60%), linear-gradient(180deg, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.25))",
                    backdropFilter: "blur(6px)",
                  }}
                />
                <div
                  aria-hidden
                  className="defeat-ring absolute h-40 w-40 rounded-full border-2 border-destructive"
                  style={{ boxShadow: "0 0 60px hsl(var(--destructive) / 0.8)" }}
                />
                <div className="relative flex flex-col items-center gap-3 text-center">
                  <Skull
                    className="defeat-burst h-14 w-14 text-destructive"
                    strokeWidth={2.5}
                  />
                  <p className="defeat-burst text-[26px] font-black uppercase tracking-[0.28em] text-destructive-foreground">
                    Derrotado
                  </p>
                  <p className="defeat-fade max-w-[280px] truncate text-[13px] font-medium text-muted-foreground">
                    “{defeatFx}”
                  </p>
                </div>
              </div>
            )}

            {/* Notice */}
            {notice && (
              <div
                className={`pointer-events-none fixed inset-x-0 top-6 z-40 mx-auto flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 ${
                  notice.kind === "enemy-born"
                    ? "border-destructive/30 bg-destructive/15 text-destructive"
                    : "border-success/30 bg-success/15 text-success"
                }`}
              >
                {notice.kind === "enemy-born" ? (
                  <Swords className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                ) : (
                  <Trophy className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                )}
                <span>{notice.text}</span>
              </div>
            )}


            {/* Actions — digitação obrigatória */}
            <div className="mt-8">
              {!verdict ? (
                <TypeAnswerPanel
                  inputRef={inputRef}
                  value={typed}
                  onChange={setTyped}
                  onSubmit={submitTypedAnswer}
                  onGiveUp={giveUp}
                  isEnemy={currentIsEnemy}
                  shake={shake}
                />
              ) : verdict.correct ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <VerdictBanner
                    kind="correct"
                    userAnswer={typed}
                    expected={verdict.expected}
                    similarity={verdict.similarity}
                  />
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    {currentIsEnemy ? "Golpe certeiro? Classifique." : "Quão fácil foi?"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <GradeButton label="Difícil" tone="warning" onClick={() => handleDifficulty("hard")} />
                    <GradeButton label="Médio" tone="primary" onClick={() => handleDifficulty("good")} />
                    <GradeButton label="Fácil" tone="success" onClick={() => handleDifficulty("easy")} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <VerdictBanner
                    kind="wrong"
                    userAnswer={typed}
                    expected={verdict.expected}
                    similarity={verdict.similarity}
                  />
                  <button
                    onClick={handleWrong}
                    className="group relative w-full overflow-hidden rounded-full bg-foreground py-4 text-[15px] font-semibold text-background transition active:scale-[0.99]"
                    style={{
                      boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.35)",
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Próxima carta
                      <CornerDownLeft className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              )}

              {/* Dica de atalhos */}
              {!focusMode && (
                <p className="mt-4 hidden items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 sm:inline-flex">
                  <Keyboard className="h-3 w-3" strokeWidth={2.5} />
                  {!verdict
                    ? "Enter para verificar"
                    : verdict.correct
                    ? "1 Difícil · 2 Médio · 3 Fácil"
                    : "Enter para próxima"}
                </p>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------ Cards ---------------------------------- */

function NormalCard({
  front,
  back,
  targetWord,
  mode,
  showBack,
}: {
  front: string;
  back: string;
  targetWord?: string;
  mode?: "word" | "sentence" | "expression";
  showBack: boolean;
}) {
  return (
    <div
      className="group relative w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] px-6 py-10 sm:py-14 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        backdropFilter: "blur(20px) saturate(140%)",
        boxShadow:
          "0 30px 60px -30px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.06)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-6 text-center sm:min-h-[280px]">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70">
          <span className="h-1 w-1 rounded-full bg-primary/70" />
          {mode === "sentence" ? "Frase" : mode === "expression" ? "Expressão" : "Inglês"}
        </p>
        <p className="text-balance text-[26px] font-semibold leading-tight text-foreground sm:text-[34px]">
          {mode === "sentence" && targetWord
            ? renderSentence(front, targetWord)
            : front}
        </p>

        {showBack && (
          <div className="flex w-full flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="h-px w-12 bg-white/10" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
              Tradução
            </p>
            <p className="text-balance text-[20px] font-medium leading-snug text-muted-foreground sm:text-[24px]">
              {back}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EnemyCard({
  front,
  back,
  targetWord,
  mode,
  lapses,
  successes,
  showBack,
}: {
  front: string;
  back: string;
  targetWord?: string;
  mode?: "word" | "sentence" | "expression";
  lapses: number;
  successes: number;
  showBack: boolean;
}) {
  const hpMax = Math.max(lapses, 1);
  const hpNow = Math.max(0, lapses - successes);
  const hpPct = Math.max(6, Math.min(100, (hpNow / hpMax) * 100));
  const level = lapses;

  return (
    <div className="relative w-full">
      {/* Outer aura */}
      <div
        aria-hidden
        className="enemy-aura pointer-events-none absolute -inset-6 rounded-[40px] blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--destructive) / 0.5), transparent 70%)",
        }}
      />

      <div
        className="enemy-enter relative w-full overflow-hidden rounded-[28px] border border-destructive/40 px-6 py-10 sm:py-14"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--destructive) / 0.10) 0%, hsl(var(--background) / 0.6) 40%, hsl(var(--background) / 0.4) 100%)",
          backdropFilter: "blur(20px) saturate(140%)",
          boxShadow:
            "0 40px 80px -30px hsl(var(--destructive) / 0.55), inset 0 1px 0 hsl(var(--destructive) / 0.35), inset 0 0 0 1px hsl(var(--destructive) / 0.15)",
        }}
      >
        {/* Scanline sweep */}
        <div
          aria-hidden
          className="enemy-scan pointer-events-none absolute inset-x-0 h-24"
          style={{
            background:
              "linear-gradient(180deg, transparent, hsl(var(--destructive) / 0.18), transparent)",
          }}
        />

        {/* Rim highlight (red) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-destructive/50 to-transparent"
        />

        {/* Corner claws — decorative brackets */}
        <CornerBracket className="left-3 top-3" position="tl" />
        <CornerBracket className="right-3 top-3" position="tr" />
        <CornerBracket className="left-3 bottom-3" position="bl" />
        <CornerBracket className="right-3 bottom-3" position="br" />

        {/* Boss badge */}
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-destructive/50 bg-[hsl(var(--background))] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-destructive shadow-[0_6px_20px_-8px_hsl(var(--destructive)/0.8)]">
          <Swords className="h-3 w-3" strokeWidth={2.75} />
          Inimiga · nv {level}
        </div>

        <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-6 text-center sm:min-h-[280px]">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-destructive/90">
            <Flame className="h-3 w-3" strokeWidth={2.75} />
            {mode === "sentence" ? "Frase inimiga" : mode === "expression" ? "Expressão inimiga" : "Palavra inimiga"}
          </p>
          <p className="text-balance text-[26px] font-semibold leading-tight text-foreground sm:text-[34px]">
            {mode === "sentence" && targetWord
              ? renderSentence(front, targetWord)
              : front}
          </p>

          {showBack && (
            <div className="flex w-full flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="h-px w-12 bg-destructive/30" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                Tradução
              </p>
              <p className="text-balance text-[20px] font-medium leading-snug text-muted-foreground sm:text-[24px]">
                {back}
              </p>
            </div>
          )}
        </div>

        {/* HP bar */}
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
            <span className="text-destructive/90">Resistência</span>
            <span className="tabular-nums text-muted-foreground">
              {successes}/{lapses}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="hp-fill h-full rounded-full bg-gradient-to-r from-destructive/80 via-destructive to-destructive/80"
              style={{
                width: `${hpPct}%`,
                boxShadow: "0 0 10px hsl(var(--destructive) / 0.6)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CornerBracket({
  className,
  position,
}: {
  className?: string;
  position: "tl" | "tr" | "bl" | "br";
}) {
  const borders = {
    tl: "border-l-2 border-t-2 rounded-tl-lg",
    tr: "border-r-2 border-t-2 rounded-tr-lg",
    bl: "border-l-2 border-b-2 rounded-bl-lg",
    br: "border-r-2 border-b-2 rounded-br-lg",
  }[position];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute h-4 w-4 border-destructive/70 ${borders} ${className}`}
    />
  );
}

/* ---------------------------- Buttons ---------------------------------- */

function GradeButton({
  label,
  tone,
  icon,
  onClick,
}: {
  label: string;
  tone: "destructive" | "warning" | "primary" | "success";
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  const toneClass = {
    destructive:
      "border-destructive/25 bg-destructive/[0.08] text-destructive hover:bg-destructive/[0.15]",
    warning:
      "border-warning/25 bg-warning/[0.08] text-warning hover:bg-warning/[0.15]",
    primary:
      "border-primary/30 bg-primary/[0.10] text-primary hover:bg-primary/[0.18]",
    success:
      "border-success/25 bg-success/[0.08] text-success hover:bg-success/[0.15]",
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl border py-4 text-[14px] font-semibold backdrop-blur-md transition active:scale-[0.98] ${toneClass}`}
      style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.05)" }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ----------------------------- States ---------------------------------- */

function EmptyState({ enemyRun }: { enemyRun: boolean }) {
  return (
    <div className="mt-20 grid place-items-center text-center">
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl border backdrop-blur-md ${
          enemyRun
            ? "border-success/25 bg-success/10 text-success"
            : "border-white/[0.08] bg-primary/10 text-primary"
        }`}
      >
        {enemyRun ? (
          <Trophy className="h-6 w-6" strokeWidth={2.5} />
        ) : (
          <Check className="h-6 w-6" strokeWidth={2.5} />
        )}
      </div>
      <h2 className="mt-5 text-xl font-semibold">
        {enemyRun ? "Nenhuma inimiga ativa" : "Nada para revisar agora"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {enemyRun
          ? "Você derrotou todas as suas cartas inimigas. Excelente trabalho."
          : "Volte mais tarde — as próximas revisões aparecerão quando estiverem prontas."}
      </p>
      <Link
        to={enemyRun ? "/enemies" : "/"}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-95"
      >
        {enemyRun ? "Voltar à arena" : "Voltar ao início"}
      </Link>
    </div>
  );
}

function FinishedState({
  reviewed,
  deckId,
  enemyRun,
}: {
  reviewed: number;
  deckId?: string;
  enemyRun: boolean;
}) {
  return (
    <div className="mt-20 grid place-items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={`grid h-16 w-16 place-items-center rounded-2xl border backdrop-blur-md ${
          enemyRun
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-success/25 bg-success/10 text-success"
        }`}
        style={{
          boxShadow: enemyRun
            ? "0 20px 40px -20px hsl(var(--destructive) / 0.6)"
            : "0 20px 40px -20px hsl(var(--success) / 0.5)",
        }}
      >
        {enemyRun ? (
          <Swords className="h-7 w-7" strokeWidth={2.5} />
        ) : (
          <Trophy className="h-7 w-7" strokeWidth={2.5} />
        )}
      </div>
      <h2 className="mt-5 text-2xl font-semibold">
        {enemyRun ? "Arena encerrada" : "Sessão concluída"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Você enfrentou {reviewed} carta{reviewed === 1 ? "" : "s"}.{" "}
        {enemyRun ? "Continue implacável." : "Muito bem!"}
      </p>
      <div className="mt-6 flex gap-2">
        {enemyRun ? (
          <Link
            to="/enemies"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-95"
          >
            Voltar à arena
          </Link>
        ) : (
          <>
            <Link
              to="/"
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-white/[0.08]"
            >
              Início
            </Link>
            {deckId && (
              <Link
                to="/library/$deckId"
                params={{ deckId }}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-95"
              >
                Voltar ao deck
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------- Type answer + Verdict ----------------------- */

function TypeAnswerPanel({
  inputRef,
  value,
  onChange,
  onSubmit,
  onGiveUp,
  isEnemy,
  shake,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onGiveUp: () => void;
  isEnemy: boolean;
  shake: boolean;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <label className="mb-2 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Digite a tradução em português
        </span>
        <button
          type="button"
          onClick={onGiveUp}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 transition hover:text-foreground"
        >
          <HelpCircle className="h-3 w-3" strokeWidth={2.5} />
          Não sei
        </button>
      </label>

      <div
        className={`relative overflow-hidden rounded-2xl border transition ${
          shake ? "answer-shake" : ""
        } ${
          isEnemy
            ? "border-destructive/35 bg-destructive/[0.06]"
            : "border-white/[0.10] bg-white/[0.04]"
        }`}
        style={{
          boxShadow: isEnemy
            ? "0 12px 40px -20px hsl(var(--destructive) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.05)"
            : "0 12px 40px -20px hsl(var(--primary) / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.06)",
          backdropFilter: "blur(20px) saturate(140%)",
        }}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
            isEnemy
              ? "from-transparent via-destructive/50 to-transparent"
              : "from-transparent via-primary/50 to-transparent"
          }`}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          placeholder="Sua tradução…"
          className="w-full bg-transparent px-5 py-4 text-[17px] font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none sm:text-[18px]"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className={`mt-3 w-full rounded-full py-4 text-[15px] font-semibold transition active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 ${
          isEnemy
            ? "bg-destructive text-destructive-foreground"
            : "bg-foreground text-background"
        }`}
        style={{
          boxShadow: isEnemy
            ? "0 10px 30px -10px hsl(var(--destructive) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.2)"
            : "0 10px 30px -10px hsl(var(--primary) / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.3)",
        }}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {isEnemy ? (
            <>
              <Flame className="h-4 w-4" strokeWidth={2.75} />
              Atacar
            </>
          ) : (
            <>
              Verificar
              <CornerDownLeft className="h-4 w-4" strokeWidth={2.5} />
            </>
          )}
        </span>
      </button>
    </div>
  );
}

function VerdictBanner({
  kind,
  userAnswer,
  expected,
  similarity,
}: {
  kind: "correct" | "wrong";
  userAnswer: string;
  expected: string;
  similarity: number;
}) {
  const isRight = kind === "correct";
  const pct = Math.round(similarity * 100);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-4 py-4 ${
        isRight
          ? "border-success/30 bg-success/[0.08]"
          : "border-destructive/35 bg-destructive/[0.08]"
      }`}
      style={{
        boxShadow: isRight
          ? "0 12px 40px -20px hsl(var(--success) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.06)"
          : "0 12px 40px -20px hsl(var(--destructive) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.06)",
        backdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
            isRight ? "text-success" : "text-destructive"
          }`}
        >
          {isRight ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
              Correto
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" strokeWidth={2.75} />
              Errado
            </>
          )}
        </div>
        <div className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {pct}% de proximidade
        </div>
      </div>

      {userAnswer.trim() && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Sua resposta
          </p>
          <p
            className={`text-[15px] font-medium leading-snug ${
              isRight ? "text-foreground" : "text-destructive line-through decoration-destructive/50"
            }`}
          >
            {userAnswer}
          </p>
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          Tradução esperada
        </p>
        <p className="text-[16px] font-semibold leading-snug text-foreground">
          {expected}
        </p>
      </div>
    </div>
  );
}

