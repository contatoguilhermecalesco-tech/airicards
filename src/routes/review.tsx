import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { X, Check, Swords, Trophy, Sparkles } from "lucide-react";
import {
  useStore,
  getDueCards,
  reviewCard,
  difficultyScore,
  isEnemy,
  ENEMY_THRESHOLD,
  registerHomeSession,
} from "@/lib/flashcards-store";


type Search = { deck?: string };

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Airi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    deck: typeof search.deck === "string" ? search.deck : undefined,
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
  const { deck: deckId } = Route.useSearch();

  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const allCards = useStore((s) => s.cards);

  useEffect(() => {
    if (!deckId) registerHomeSession();
    const due = getDueCards(deckId, Date.now());
    const ordered = [...due].sort(
      (a, b) =>
        difficultyScore(b) - difficultyScore(a) + (Math.random() - 0.5) * 0.6,
    );
    setQueue(ordered.map((c) => c.id));
    setSessionCount(ordered.length);
    setIndex(0);
    setShowBack(false);
    setReviewed(0);
  }, [deckId]);

  const currentId = queue[index];
  const current = useMemo(
    () => allCards.find((c) => c.id === currentId),
    [allCards, currentId],
  );

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
      {/* Ambient halos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[520px] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent 70%)",
        }}
      />
      {current && isEnemy(current) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[380px] opacity-70 blur-2xl transition-opacity"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 20%, hsl(var(--destructive) / 0.18), transparent 70%)",
          }}
        />
      )}

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-5 pt-5 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          {deckId ? (
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
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
              Sessão
            </div>
            <div className="max-w-[180px] truncate text-[13px] font-medium text-foreground/90">
              {deckName ? deckName : "Todos os decks"}
            </div>
          </div>
          <div className="grid h-10 min-w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 text-[12px] font-semibold tabular-nums text-foreground/80 backdrop-blur-md">
            {Math.min(index + (finished ? 0 : 1), sessionCount)}
            <span className="mx-1 text-muted-foreground/50">/</span>
            {sessionCount || 0}
          </div>
        </div>

        {/* Progress rail */}
        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/70 transition-[width] duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
            }}
          />
        </div>

        {queue.length === 0 && !current ? (
          <EmptyState />
        ) : finished || !current ? (
          <FinishedState reviewed={reviewed} deckId={deckId} />
        ) : (
          <div className="mt-8 flex flex-1 flex-col">
            {/* Card */}
            <div className="flex flex-1 items-center justify-center">
              <div
                key={currentId}
                className={`group relative w-full overflow-hidden rounded-[28px] border px-6 py-10 sm:py-14 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  isEnemy(current)
                    ? "border-destructive/25 bg-gradient-to-b from-destructive/[0.06] to-transparent"
                    : "border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02]"
                }`}
                style={{
                  backdropFilter: "blur(20px) saturate(140%)",
                  boxShadow: isEnemy(current)
                    ? "0 30px 60px -30px hsl(var(--destructive) / 0.35), inset 0 1px 0 hsl(var(--destructive) / 0.15)"
                    : "0 30px 60px -30px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.06)",
                }}
              >
                {/* Rim highlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />

                {isEnemy(current) && (
                  <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-destructive/40 bg-[hsl(var(--background))]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive backdrop-blur">
                    <Swords className="h-3 w-3" strokeWidth={2.5} />
                    Inimiga · nv {current.lapses ?? 0}
                  </div>
                )}

                <div className="flex min-h-[220px] flex-col items-center justify-center gap-6 text-center sm:min-h-[280px]">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70">
                    <span className="h-1 w-1 rounded-full bg-primary/70" />
                    {current.mode === "sentence" ? "Frase" : "Inglês"}
                  </p>
                  <p className="text-balance text-[26px] font-semibold leading-tight text-foreground sm:text-[34px]">
                    {current.mode === "sentence" && current.targetWord
                      ? renderSentence(current.front, current.targetWord)
                      : current.front}
                  </p>

                  {showBack && (
                    <div className="flex w-full flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <div className="h-px w-12 bg-white/10" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                        Tradução
                      </p>
                      <p className="text-balance text-[20px] font-medium leading-snug text-muted-foreground sm:text-[24px]">
                        {current.back}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                  className="group relative w-full overflow-hidden rounded-full bg-foreground py-4 text-[15px] font-semibold text-background transition active:scale-[0.99]"
                  style={{
                    boxShadow:
                      "0 10px 30px -10px hsl(var(--primary) / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.35)",
                  }}
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                    Mostrar resposta
                  </span>
                </button>
              ) : askDifficulty ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <p className="text-center text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                    Quão fácil foi?
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
                    label="Errei"
                    tone="destructive"
                    icon={<X className="h-4 w-4" strokeWidth={2.75} />}
                    onClick={handleWrong}
                  />
                  <GradeButton
                    label="Acertei"
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

function EmptyState() {
  return (
    <div className="mt-20 grid place-items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.08] bg-primary/10 text-primary backdrop-blur-md">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Nada para revisar agora</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Volte mais tarde — as próximas revisões aparecerão quando estiverem prontas.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-95"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

function FinishedState({
  reviewed,
  deckId,
}: {
  reviewed: number;
  deckId?: string;
}) {
  return (
    <div className="mt-20 grid place-items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className="grid h-16 w-16 place-items-center rounded-2xl border border-success/25 bg-success/10 text-success backdrop-blur-md"
        style={{ boxShadow: "0 20px 40px -20px hsl(var(--success) / 0.5)" }}
      >
        <Trophy className="h-7 w-7" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">Sessão concluída</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Você revisou {reviewed} carta{reviewed === 1 ? "" : "s"}. Muito bem!
      </p>
      <div className="mt-6 flex gap-2">
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
      </div>
    </div>
  );
}
