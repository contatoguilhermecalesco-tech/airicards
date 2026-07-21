import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Moon, Sun, Sunrise, Sunset, Sparkles, Lock, GraduationCap } from "lucide-react";
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
import { useCycleWeek, getTodayFocus } from "@/lib/cycle";
import { useExamState, getMonthKey, hasCompletedExamThisMonth, monthLabel } from "@/lib/exam-store";
import { useAppSettings } from "@/lib/app-settings";

export const Route = createFileRoute("/")({
  component: Home,
});

type Greeting = { salute: string; icon: React.ReactNode; eyebrow: string };

function greetingFor(hour: number): Greeting {
  if (hour >= 5 && hour < 12)
    return {
      salute: "Bom dia",
      eyebrow: "Manhã",
      icon: <Sunrise className="h-5 w-5 text-amber-300" strokeWidth={2.25} />,
    };
  if (hour >= 12 && hour < 18)
    return {
      salute: "Boa tarde",
      eyebrow: "Tarde",
      icon: <Sun className="h-5 w-5 text-amber-400" strokeWidth={2.25} />,
    };
  if (hour >= 18 && hour < 23)
    return {
      salute: "Boa noite",
      eyebrow: "Noite",
      icon: <Sunset className="h-5 w-5 text-orange-300" strokeWidth={2.25} />,
    };
  return {
    salute: "Boa madrugada",
    eyebrow: "Madrugada",
    icon: <Moon className="h-5 w-5 text-indigo-300" strokeWidth={2.25} />,
  };
}

function formatNextIn(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function Home() {
  const profile = useCurrentProfile();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const reviewedToday = useCardsReviewedToday();
  const now = useMemo(() => Date.now(), [cards]);
  const due = useMemo(
    () => cards.filter((c) => c.dueAt <= now).length,
    [cards, now],
  );
  const pending = useMemo(
    () => cards.filter((c) => c.dueAt > now).length,
    [cards, now],
  );
  const nextDueInMs = useMemo(() => {
    const futures = cards.map((c) => c.dueAt).filter((t) => t > now);
    if (futures.length === 0) return null;
    return Math.min(...futures) - now;
  }, [cards, now]);
  const canStart = due > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const { salute, icon, eyebrow } = greetingFor(hour);
  const name = profile?.name ?? "";
  const cycle = useCycleWeek();
  const todayFocus = getTodayFocus();
  const ankiPending = due > 0 && reviewedToday === 0;

  // Prova mensal
  const examState = useExamState();
  const examMonthKey = getMonthKey();
  const examDone = hasCompletedExamThisMonth(examMonthKey);
  const examResult = examState.history.find((h) => h.monthKey === examMonthKey);

  // Ring geometry — compact 96px ring
  const RING_R = 40;
  const ringC = 2 * Math.PI * RING_R;
  const dailyTarget = Math.max(1, due + reviewedToday);
  const reviewedPct = Math.min(1, reviewedToday / dailyTarget);
  const pctLabel = Math.round(reviewedPct * 100);

  return (
    <main className="relative mx-auto max-w-md px-5 pt-8 pb-24 sm:max-w-xl sm:pt-14">
      {/* Ambient backdrop — soft */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 0%, rgba(167,139,250,0.14), transparent 70%), radial-gradient(45% 60% at 90% 8%, rgba(96,165,250,0.08), transparent 70%)",
        }}
      />

      {/* Header — eyebrow + salute + ciclo RRSLG */}
      <header className="animate-fade-in flex flex-col space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {eyebrow}
          </span>
          <span className="shrink-0">{icon}</span>
          {cycle && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Semana {cycle.week}<span className="text-muted-foreground/50">/8</span>
              <span className="text-primary/80">· {todayFocus.focus}</span>
            </span>
          )}
        </div>
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[38px]">
          {salute}
          {name ? `, ${name}` : ""}
        </h1>
      </header>

      {/* Hero — assimétrico: stats à esquerda, anel à direita */}
      <section
        className="animate-fade-in relative mt-7 sm:mt-8"
        style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
      >
        {/* soft halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[36px] bg-primary/10 opacity-70 blur-2xl"
        />
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[color-mix(in_oklab,var(--surface-elevated)_92%,transparent)] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
          <div className="flex items-start justify-between gap-6">
            {/* Left — copy */}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Sessão de hoje
              </p>
              <p className="mt-1 text-[26px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {due}
                <span className="ml-1.5 text-[15px] font-medium text-muted-foreground/80">
                  {due === 1 ? "carta agora" : "cartas agora"}
                </span>
              </p>
              {pending > 0 && (
                <p className="pt-1 text-[12px] font-medium text-primary/85 tabular-nums">
                  +{pending} voltando{nextDueInMs !== null ? ` em ${formatNextIn(nextDueInMs)}` : ""}
                </p>
              )}
            </div>

            {/* Right — compact ring */}
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
                <circle
                  cx="48" cy="48" r={RING_R}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none"
                />
                <circle
                  cx="48" cy="48" r={RING_R}
                  stroke="url(#ringGrad)" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - reviewedPct)}
                  className="transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="100%" stopColor="#8B7BD8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-semibold leading-none tabular-nums text-foreground">
                  {reviewedToday}
                </p>
                <p className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {pctLabel}%
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-7">
            {cards.length === 0 ? (
              <Link
                to="/library"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
              >
                Ir para a biblioteca
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
            ) : due === 0 ? (
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] py-3.5 text-[14px] font-medium text-muted-foreground">
                <Moon className="h-4 w-4" strokeWidth={2.25} />
                {nextDueInMs !== null ? `Próxima em ${formatNextIn(nextDueInMs)}` : "Tudo em dia"}
              </div>
            ) : (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => canStart && setConfirmOpen(true)}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
              >
                Iniciar sessão
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar sessão agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {due} carta{due === 1 ? "" : "s"} para revisar. As cartas
              voltam de minutos em minutos, então sempre haverá algo novo para
              praticar.
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

      {/* Stats — 2 chips minimalistas */}
      <section
        className="animate-fade-in mt-6 grid grid-cols-2 gap-3"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <StatChip label="Decks" value={decks.length} />
        <StatChip label="Cartas" value={cards.length} />
      </section>

      {/* Método RRSLG — semana + foco do dia */}
      {cycle && (
        <section
          className="animate-fade-in mt-6"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >
          <Link
            to="/study"
            className="group block rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Método RRSLG
                  </p>
                  {ankiPending && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-warning">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                      Anki primeiro
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[14px] font-medium text-foreground">
                  {todayFocus.label} · {todayFocus.focus}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Gramática da semana: <span className="text-foreground/80">{cycle.grammar.topic}</span>
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                strokeWidth={2.25}
              />
            </div>
          </Link>
        </section>
      )}


      {/* Prova mensal de nivelamento */}
      <section
        className="animate-fade-in mt-6"
        style={{ animationDelay: "165ms", animationFillMode: "backwards" }}
      >
        <Link
          to="/exam"
          className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.10] via-white/[0.03] to-transparent p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
          />
          <div className="relative flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Prova de nível · {monthLabel(examMonthKey)}
                </p>
                {examDone && examResult && (
                  <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    {examResult.level}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-[14px] font-medium text-foreground">
                {examDone
                  ? `Nível ${examResult?.level ?? ""} · ${examResult?.percent ?? 0}% de acerto`
                  : "25 questões para descobrir seu nível CEFR"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {examDone
                  ? "Ver detalhes e revisar respostas"
                  : "Feita uma vez por mês · nova prova gerada por IA"}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
              strokeWidth={2.25}
            />
          </div>
        </Link>
      </section>

      {/* Decks list */}
      {decks.length > 0 && (
        <section
          className="animate-fade-in mt-10"
          style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
        >
          <div className="mb-4 flex items-baseline justify-between px-1">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              Seus decks
            </h2>
            <Link
              to="/library"
              className="text-[13px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Ver todos
            </Link>
          </div>
          <ul className="space-y-2.5">
            {decks.slice(0, 4).map((d, i) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const dueInDeck = cards.filter(
                (c) => c.deckId === d.id && c.dueAt <= Date.now(),
              ).length;
              return (
                <li
                  key={d.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${240 + i * 60}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <Link
                    to="/library/$deckId"
                    params={{ deckId: d.id }}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.08] hover:bg-white/[0.04] active:scale-[0.995]"
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                        dueInDeck > 0
                          ? "border-primary/30 bg-primary/10"
                          : "border-white/[0.06] bg-white/[0.03]"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-[5px] border-2 ${
                          dueInDeck > 0 ? "border-primary" : "border-white/25"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-foreground">
                        {d.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground tabular-nums">
                        {total} carta{total === 1 ? "" : "s"}
                        {dueInDeck > 0 && (
                          <span className="text-primary/85">
                            {" · "}
                            {dueInDeck} para revisar
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
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

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 transition-colors hover:bg-white/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
