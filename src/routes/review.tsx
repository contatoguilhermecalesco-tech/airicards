import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { X, Check, Swords, Trophy, Sparkles, Skull, Flame } from "lucide-react";
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

  const allCards = useStore((s) => s.cards);

  useEffect(() => {
    if (!deckId && !isEnemyRun) registerHomeSession();
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

  function handleWrong() {
    if (!current) return;
    const wasEnemy = isEnemy(current);
    const willBecomeEnemy =
      !wasEnemy && (current.lapses ?? 0) + 1 >= ENEMY_THRESHOLD;
    reviewCard(current.id, "again");
    setReviewed((n) => n + 1);
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 600);
    if (willBecomeEnemy) {
      flashNotice({
        kind: "enemy-born",
        text: "Um inimigo apareceu! Essa carta virou um chefe do seu baralho.",
      });
    }
    setIndex((i) => i + 1);
    setShowBack(false);
    setAskDifficulty(false);
  }

  function handleRight() {
    setAskDifficulty(true);
  }

  function handleDifficulty(g: "hard" | "good" | "easy") {
    if (!current) return;
    const wasEnemy = isEnemy(current);
    const willDefeat =
      wasEnemy && (current.successes ?? 0) + 1 > (current.lapses ?? 0);
    reviewCard(current.id, g);
    setReviewed((n) => n + 1);
    if (willDefeat) {
      flashNotice({
        kind: "enemy-defeated",
        text: "Inimigo derrotado! +1 vitória contra as cartas difíceis.",
      });
    }
    setIndex((i) => i + 1);
    setShowBack(false);
    setAskDifficulty(false);
  }

  const progressPct =
    sessionCount === 0 ? 0 : Math.min(100, (reviewed / sessionCount) * 100);

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
        </div>

        {/* Progress rail */}
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

            {/* Actions */}
            <div className="mt-8">
              {!showBack ? (
                <button
                  onClick={() => setShowBack(true)}
                  className={`group relative w-full overflow-hidden rounded-full py-4 text-[15px] font-semibold transition active:scale-[0.99] ${
                    currentIsEnemy
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-foreground text-background"
                  }`}
                  style={{
                    boxShadow: currentIsEnemy
                      ? "0 10px 30px -10px hsl(var(--destructive) / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.25)"
                      : "0 10px 30px -10px hsl(var(--primary) / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.35)",
                  }}
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    {currentIsEnemy ? (
                      <>
                        <Flame className="h-4 w-4" strokeWidth={2.75} />
                        Encarar o inimigo
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                        Mostrar resposta
                      </>
                    )}
                  </span>
                </button>
              ) : askDifficulty ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <p className="text-center text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                    {currentIsEnemy ? "Golpe certeiro?" : "Quão fácil foi?"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <GradeButton
                      label="Difícil"
                      tone="warning"
                      onClick={() => handleDifficulty("hard")}
                    />
                    <GradeButton
                      label="Médio"
                      tone="primary"
                      onClick={() => handleDifficulty("good")}
                    />
                    <GradeButton
                      label="Fácil"
                      tone="success"
                      onClick={() => handleDifficulty("easy")}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                  <GradeButton
                    label={currentIsEnemy ? "Levei dano" : "Errei"}
                    tone="destructive"
                    icon={
                      currentIsEnemy ? (
                        <Skull className="h-4 w-4" strokeWidth={2.75} />
                      ) : (
                        <X className="h-4 w-4" strokeWidth={2.75} />
                      )
                    }
                    onClick={handleWrong}
                  />
                  <GradeButton
                    label={currentIsEnemy ? "Acertei" : "Acertei"}
                    tone="success"
                    icon={<Check className="h-4 w-4" strokeWidth={2.75} />}
                    onClick={handleRight}
                  />
                </div>
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
  mode?: "word" | "sentence";
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
          {mode === "sentence" ? "Frase" : "Inglês"}
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
  mode?: "word" | "sentence";
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
            {mode === "sentence" ? "Frase inimiga" : "Palavra inimiga"}
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
