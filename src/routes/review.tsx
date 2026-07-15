import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import {
  useStore,
  getDueCards,
  reviewCard,
  type Grade,
} from "@/lib/flashcards-store";

type Search = { deck?: string };

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Revisão — Lume" },
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
    const due = getDueCards(deckId, Date.now());
    const shuffled = [...due].sort(() => Math.random() - 0.5);
    setQueue(shuffled.map((c) => c.id));
    setSessionCount(shuffled.length);
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

  function grade(g: Grade) {
    if (!current) return;
    reviewCard(current.id, g);
    setReviewed((n) => n + 1);
    // If "again", requeue to the end of the session
    if (g === "again") {
      setQueue((q) => [...q, current.id]);
    }
    setIndex((i) => i + 1);
    setShowBack(false);
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
              aria-label="Exit session"
            >
              <X className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/"
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Exit session"
            >
              <X className="h-5 w-5" />
            </Link>
          )}
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {deckName ? deckName : "All decks"}
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

        {queue.length === 0 && !current ? (
          <EmptyState />
        ) : finished || !current ? (
          <FinishedState reviewed={reviewed} deckId={deckId} />
        ) : (
          <div className="mt-10 flex flex-1 flex-col">
            <p className="text-center text-xs font-medium text-muted-foreground">
              Card {Math.min(index + 1, sessionCount)} of {sessionCount}
            </p>

            <div className="mt-6 flex flex-1 items-center justify-center">
              <div className="ios-card relative w-full min-h-[280px] rounded-3xl px-6 py-10 sm:min-h-[340px]">
                <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
                    English
                  </p>
                  <p className="text-3xl font-semibold text-balance sm:text-4xl">
                    {current.front}
                  </p>

                  {showBack && (
                    <>
                      <div className="h-px w-16 bg-border" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Translation
                      </p>
                      <p className="text-2xl font-medium text-muted-foreground text-balance sm:text-3xl">
                        {current.back}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              {!showBack ? (
                <button
                  onClick={() => setShowBack(true)}
                  className="w-full rounded-full bg-primary py-4 text-[15px] font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
                >
                  Show answer
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <GradeButton
                    label="Again"
                    hint="< 1m"
                    tone="destructive"
                    onClick={() => grade("again")}
                  />
                  <GradeButton
                    label="Hard"
                    hint="soon"
                    tone="warning"
                    onClick={() => grade("hard")}
                  />
                  <GradeButton
                    label="Good"
                    hint="days"
                    tone="primary"
                    onClick={() => grade("good")}
                  />
                  <GradeButton
                    label="Easy"
                    hint="weeks"
                    tone="success"
                    onClick={() => grade("easy")}
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
  hint,
  tone,
  onClick,
}: {
  label: string;
  hint: string;
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
      className={`flex flex-col items-center gap-0.5 rounded-2xl border py-4 text-sm font-semibold transition ${toneClass}`}
    >
      <span>{label}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
        {hint}
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 grid place-items-center text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Nothing due right now</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Come back later — your next reviews will show up when they're ready.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
      >
        Back home
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
      <h2 className="mt-5 text-2xl font-semibold">Session complete</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You reviewed {reviewed} card{reviewed === 1 ? "" : "s"}. Nicely done.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          to="/"
          className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Home
        </Link>
        {deckId && (
          <Link
            to="/library/$deckId"
            params={{ deckId }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Back to deck
          </Link>
        )}
      </div>
    </div>
  );
}
