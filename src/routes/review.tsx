import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { X, Check, Swords, Trophy } from "lucide-react";
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

function Review() {
  const { deck: deckId } = Route.useSearch();
  

  // Session queue: freeze IDs at start so re-render doesn't reshuffle.
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

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-2xl flex-col px-5 pt-6 pb-10">
        <div className="flex items-center justify-between">
          {deckId ? (
            <Link
              to="/library/$deckId"
              params={{ deckId }}
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sair da sessão"
            >
              <X className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/"
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sair da sessão"
            >
              <X className="h-5 w-5" />
            </Link>
          )}
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {deckName ? deckName : "Todos os decks"}
          </div>
          <div className="w-10" />
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${
                sessionCount === 0
                  ? 0
                  : Math.min(100, (reviewed / sessionCount) * 100)
              }%`,
            }}
          />
        </div>

        {limitReached ? (
          <LimitReachedState />
        ) : queue.length === 0 && !current ? (
          <EmptyState />
        ) : finished || !current ? (
          <FinishedState reviewed={reviewed} deckId={deckId} />
        ) : (
          <div className="mt-10 flex flex-1 flex-col">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Carta {Math.min(index + 1, sessionCount)} de {sessionCount}
            </p>

            <div className="mt-6 flex flex-1 items-center justify-center">
              <div
                className={`ios-card relative w-full min-h-[280px] rounded-3xl px-6 py-10 sm:min-h-[340px] ${
                  isEnemy(current)
                    ? "ring-2 ring-destructive/40 shadow-[0_0_40px_-10px_hsl(var(--destructive)/0.6)]"
                    : ""
                }`}
              >
                {isEnemy(current) && (
                  <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive backdrop-blur">
                    <Swords className="h-3 w-3" strokeWidth={2.5} />
                    Carta inimiga · nv {current.lapses ?? 0}
                  </div>
                )}
                <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
                    Inglês
                  </p>
                  <p className="text-3xl font-semibold text-balance sm:text-4xl">
                    {current.front}
                  </p>

                  {showBack && (
                    <>
                      <div className="h-px w-16 bg-border" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Tradução
                      </p>
                      <p className="text-2xl font-medium text-muted-foreground text-balance sm:text-3xl">
                        {current.back}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {notice && (
              <div
                className={`pointer-events-none fixed inset-x-0 top-6 z-40 mx-auto flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
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

            <div className="mt-8">
              {!showBack ? (
                <button
                  onClick={() => setShowBack(true)}
                  className="w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
                >
                  Mostrar resposta
                </button>
              ) : askDifficulty ? (
                <div className="space-y-2">
                  <p className="text-center text-[13px] font-medium text-foreground">
                    Quão fácil foi acertar?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <GradeButton
                      label="Difícil"
                      hint="em breve"
                      tone="warning"
                      onClick={() => handleDifficulty("hard")}
                    />
                    <GradeButton
                      label="Médio"
                      hint="dias"
                      tone="primary"
                      onClick={() => handleDifficulty("good")}
                    />
                    <GradeButton
                      label="Fácil"
                      hint="semanas"
                      tone="success"
                      onClick={() => handleDifficulty("easy")}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <GradeButton
                    label="Errei"
                    hint="revisar mais vezes"
                    tone="destructive"
                    onClick={handleWrong}
                  />
                  <GradeButton
                    label="Acertei"
                    hint="classificar"
                    tone="success"
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
  onClick,
}: {
  label: string;
  hint?: string;
  tone: "destructive" | "warning" | "primary" | "success";
  onClick: () => void;
}) {
  const toneClass = {
    destructive:
      "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    warning:
      "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
    primary: "bg-primary/15 text-primary hover:bg-primary/25 border-primary/25",
    success: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border py-4 text-sm font-semibold transition ${toneClass}`}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 grid place-items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Nada para revisar agora</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Volte mais tarde — as próximas revisões aparecerão quando estiverem prontas.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

function LimitReachedState() {
  return (
    <div className="mt-20 grid place-items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Moon className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Limite diário atingido</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Você já fez suas 3 sessões globais de hoje. O descanso ajuda a fixar
        o que aprendeu — volte amanhã. Você ainda pode revisar decks
        individuais sempre que quiser.
      </p>
      <Link
        to="/library"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
      >
        Ir para a biblioteca
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
    <div className="mt-20 grid place-items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">Sessão concluída</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Você revisou {reviewed} carta{reviewed === 1 ? "" : "s"}. Muito bem!
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          to="/"
          className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Início
        </Link>
        {deckId && (
          <Link
            to="/library/$deckId"
            params={{ deckId }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Voltar ao deck
          </Link>
        )}
      </div>
    </div>
  );
}
