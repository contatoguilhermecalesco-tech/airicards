import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Flame, Layers, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useStore,
  useCardsReviewedToday,
} from "@/lib/flashcards-store";
import { useCurrentProfile } from "@/lib/profile";


export const Route = createFileRoute("/")({
  component: Home,
});

type Greeting = {
  salute: string;
  icon: React.ReactNode;
};

function greetingFor(hour: number): Greeting {
  if (hour >= 5 && hour < 12)
    return { salute: "Bom dia", icon: <Sunrise className="h-6 w-6 text-amber-300" strokeWidth={2.25} /> };
  if (hour >= 12 && hour < 18)
    return { salute: "Boa tarde", icon: <Sun className="h-6 w-6 text-amber-400" strokeWidth={2.25} /> };
  if (hour >= 18 && hour < 23)
    return { salute: "Boa noite", icon: <Sunset className="h-6 w-6 text-orange-300" strokeWidth={2.25} /> };
  return { salute: "Boa madrugada", icon: <Moon className="h-6 w-6 text-indigo-300" strokeWidth={2.25} /> };
}

function formatNextIn(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `em ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `em ${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

function contextLine({
  due,
  totalCards,
  reviewedToday,
  nextDueInMs,
}: {
  due: number;
  totalCards: number;
  reviewedToday: number;
  nextDueInMs: number | null;
}): string {
  if (totalCards === 0) return "Crie seu primeiro deck para começar.";
  if (due > 0)
    return `${due} carta${due === 1 ? "" : "s"} te esperando${reviewedToday > 0 ? ` — ${reviewedToday} revisadas hoje` : ""}.`;
  if (nextDueInMs !== null) {
    const when = formatNextIn(nextDueInMs);
    if (reviewedToday > 0)
      return `${reviewedToday} revisadas hoje — próxima ${when}.`;
    return `Próxima revisão ${when}.`;
  }
  if (reviewedToday > 0) return `Tudo em dia — ${reviewedToday} revisadas hoje.`;
  return "Tudo em dia por aqui.";
}


function Home() {
  const profile = useCurrentProfile();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const sessionsToday = useHomeSessionsToday();
  const reviewedToday = useCardsReviewedToday();
  const sessionsLeft = Math.max(0, HOME_DAILY_LIMIT - sessionsToday);
  const now = useMemo(() => Date.now(), [cards]);
  const due = useMemo(
    () => cards.filter((c) => c.dueAt <= now).length,
    [cards, now],
  );
  const nextDueInMs = useMemo(() => {
    const futures = cards.map((c) => c.dueAt).filter((t) => t > now);
    if (futures.length === 0) return null;
    return Math.min(...futures) - now;
  }, [cards, now]);
  const canStart = due > 0 && sessionsLeft > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const { salute, icon } = greetingFor(hour);
  const name = profile?.name ?? "";
  const context = contextLine({ due, totalCards: cards.length, sessionsToday, reviewedToday, sessionsLeft, nextDueInMs });

  // Ring geometry
  const OUTER_R = 54;
  const INNER_R = 30;
  const outerC = 2 * Math.PI * OUTER_R;
  const innerC = 2 * Math.PI * INNER_R;
  const sessionsPct = Math.min(1, sessionsToday / HOME_DAILY_LIMIT);
  // Target: full ring when reviewed >= due at start of day. Fallback to due+reviewed as denominator.
  const dailyTarget = Math.max(1, due + reviewedToday);
  const reviewedPct = Math.min(1, reviewedToday / dailyTarget);

  return (
    <main className="relative mx-auto max-w-3xl px-5 pt-8 pb-24 sm:pt-14">
      {/* Ambient backdrop — soft, no neon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] opacity-40"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 0%, rgba(167,139,250,0.14), transparent 70%), radial-gradient(45% 60% at 85% 5%, rgba(96,165,250,0.10), transparent 70%)",
        }}
      />

      {/* Dynamic greeting */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <h1 className="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-[30px] font-bold leading-tight tracking-tight text-transparent sm:text-4xl">
            {salute}
            {name ? `, ${name}` : ""}
          </h1>
          <span className="shrink-0">{icon}</span>
        </div>
        <p className="text-[15px] text-muted-foreground">{context}</p>
      </header>

      {/* Ring hero */}
      <section className="mt-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
          <div className="flex items-center gap-6 sm:gap-8">
            {/* iOS-style concentric rings */}
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                {/* Outer track */}
                <circle
                  cx="64" cy="64" r={OUTER_R}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none"
                />
                {/* Outer progress — sessions */}
                <circle
                  cx="64" cy="64" r={OUTER_R}
                  stroke="url(#gradSessions)" strokeWidth="12" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={outerC}
                  strokeDashoffset={outerC * (1 - sessionsPct)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
                {/* Inner track */}
                <circle
                  cx="64" cy="64" r={INNER_R}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none"
                />
                {/* Inner progress — reviewed */}
                <circle
                  cx="64" cy="64" r={INNER_R}
                  stroke="url(#gradReviewed)" strokeWidth="12" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={innerC}
                  strokeDashoffset={innerC * (1 - reviewedPct)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B7BD8" />
                    <stop offset="100%" stopColor="#5B4BB8" />
                  </linearGradient>
                  <linearGradient id="gradReviewed" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="100%" stopColor="#8B7BD8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Stats */}
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/80">
                  Sessões
                </p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {sessionsToday}
                  <span className="text-muted-foreground/70"> de {HOME_DAILY_LIMIT}</span>
                </p>
              </div>
              <div className="h-px w-8 bg-white/10" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary/60">
                  Revisadas
                </p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {reviewedToday}
                  <span className="text-muted-foreground/70"> hoje</span>
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          {cards.length === 0 ? (
            <Link
              to="/library"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition hover:brightness-110 active:scale-[0.98]"
            >
              Ir para a biblioteca
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          ) : sessionsLeft === 0 ? (
            <div className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-[15px] font-medium text-muted-foreground">
              <Moon className="h-4 w-4" strokeWidth={2.25} />
              Volte amanhã
            </div>
          ) : (
            <button
              type="button"
              disabled={!canStart}
              onClick={() => canStart && setConfirmOpen(true)}
              className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition hover:brightness-110 active:scale-[0.98] ${
                !canStart ? "pointer-events-none opacity-40" : ""
              }`}
            >
              {due > 0 ? "Iniciar sessão" : "Nada para revisar"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar sessão agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {due} carta{due === 1 ? "" : "s"} para revisar. Esta
              sessão contará como {sessionsToday + 1} de {HOME_DAILY_LIMIT} hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void navigate({ to: "/review" });
              }}
            >
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Layers className="h-4 w-4" />} label="Decks" value={decks.length} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Cartas" value={cards.length} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Para revisar" value={due} accent />
      </section>

      {decks.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Seus decks
            </h3>
            <Link to="/library" className="text-sm text-primary hover:opacity-80">
              Ver todos
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
                        {total} carta{total === 1 ? "" : "s"}
                        {dueInDeck > 0 && ` · ${dueInDeck} para revisar`}
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
