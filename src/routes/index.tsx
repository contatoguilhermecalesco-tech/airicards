import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Flame, Layers } from "lucide-react";
import { useStore, getDueCards } from "@/lib/flashcards-store";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const due = useStore((s) => getDueCards(undefined, Date.now()).length);

  return (
    <main className="mx-auto max-w-3xl px-5 pt-10 pb-24 sm:pt-16">
      <section className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
          Today
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-balance sm:text-5xl">
          {due > 0 ? "You have cards to review." : "You're all caught up."}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground text-balance">
          A calm space to grow your English vocabulary — one card at a time,
          spaced just right.
        </p>
      </section>

      <section className="mt-10">
        <div className="ios-card relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 35%, transparent), transparent)",
            }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
                {due} due now
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Start reviewing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cards.length === 0
                  ? "Create your first deck to begin."
                  : "Short sessions, long memory."}
              </p>
            </div>
            {cards.length === 0 ? (
              <Link
                to="/library"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
              >
                Go to library
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            ) : (
              <Link
                to="/review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-40"
                disabled={due === 0}
                aria-disabled={due === 0}
                onClick={(e) => {
                  if (due === 0) e.preventDefault();
                }}
              >
                {due > 0 ? "Start session" : "Nothing due"}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Layers className="h-4 w-4" />} label="Decks" value={decks.length} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Cards" value={cards.length} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Due" value={due} accent />
      </section>

      {decks.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your decks
            </h3>
            <Link to="/library" className="text-sm text-primary hover:opacity-80">
              See all
            </Link>
          </div>
          <ul className="space-y-2">
            {decks.slice(0, 4).map((d) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const dueInDeck = cards.filter(
                (c) => c.deckId === d.id && c.dueAt <= Date.now(),
              ).length;
              return (
                <li key={d.id}>
                  <Link
                    to="/library/$deckId"
                    params={{ deckId: d.id }}
                    className="ios-card flex items-center justify-between rounded-2xl px-5 py-4 transition hover:bg-accent/40"
                  >
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {total} card{total === 1 ? "" : "s"}
                        {dueInDeck > 0 && ` · ${dueInDeck} due`}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground"
                      strokeWidth={2.25}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="ios-card rounded-2xl px-4 py-4">
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
