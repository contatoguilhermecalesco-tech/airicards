import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Moon, Sun, Sunrise, Sunset, Sparkles, Lock, GraduationCap, Flame, Trophy } from "lucide-react";
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
  useStreak,
  nextStreakMilestone,
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

// Reusable Liquid Glass surface — rim light + subtle depth, kept crisp
const GLASS_BASE =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-md backdrop-saturate-125 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_16px_40px_-24px_rgba(0,0,0,0.55)]";

function GlassHighlight() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
    />
  );
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
  const appSettings = useAppSettings();

  // Ring geometry — compact 104px ring
  const RING_R = 44;
  const ringC = 2 * Math.PI * RING_R;
  const dailyTarget = Math.max(1, due + reviewedToday);
  const reviewedPct = Math.min(1, reviewedToday / dailyTarget);
  const pctLabel = Math.round(reviewedPct * 100);

  return (
    <main className="relative mx-auto max-w-md px-5 pt-8 pb-24 sm:max-w-xl sm:pt-14">
      {/* Ambient aurora — soft violet layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            "radial-gradient(55% 55% at 18% 0%, rgba(167,139,250,0.22), transparent 65%), radial-gradient(45% 55% at 92% 6%, rgba(129,140,248,0.14), transparent 70%), radial-gradient(80% 40% at 50% 100%, rgba(139,92,246,0.06), transparent 70%)",
        }}
      />
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        }}
      />

      {/* Header */}
      <header className="animate-fade-in flex flex-col space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {eyebrow}
          </span>
          <span className="shrink-0">{icon}</span>
        </div>
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[38px]">
          {salute}
          {name ? `, ${name}` : ""}
        </h1>
      </header>

      {/* Hero — Liquid Glass */}
      <section
        className="animate-fade-in relative mt-7 sm:mt-8"
        style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
      >
        {/* soft halo behind glass */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[40px] bg-primary/15 opacity-40 blur-2xl"
        />
        <div
          className={`${GLASS_BASE} rounded-[28px] p-6 sm:p-8`}
        >
          <GlassHighlight />
          {/* specular sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-white/[0.04] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-primary/15 blur-2xl"
          />

          <div className="relative flex items-start justify-between gap-6">
            {/* Left — copy */}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Sessão de hoje
              </p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
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

            {/* Right — glass ring */}
            <div className="relative h-26 w-26 shrink-0" style={{ height: 104, width: 104 }}>
              {/* halo behind ring */}
              <div
                aria-hidden
                className="absolute inset-2 rounded-full bg-primary/15 opacity-70 blur-xl"
              />
              <svg viewBox="0 0 104 104" className="relative h-full w-full -rotate-90">
                <circle
                  cx="52" cy="52" r={RING_R}
                  stroke="rgba(255,255,255,0.07)" strokeWidth="9" fill="none"
                />
                <circle
                  cx="52" cy="52" r={RING_R}
                  stroke="url(#ringGrad)" strokeWidth="9" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - reviewedPct)}
                  className="transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ filter: "drop-shadow(0 0 4px rgba(167,139,250,0.35))" }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#DDD6FE" />
                    <stop offset="55%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#7C6BD8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
                  {reviewedToday}
                </p>
                <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {pctLabel}%
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="relative mt-7">
            {cards.length === 0 ? (
              <Link
                to="/library"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-white to-white/90 py-3.5 text-[14px] font-semibold text-background shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 hover:brightness-[1.02] active:scale-[0.98]"
              >
                Ir para a biblioteca
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
            ) : due === 0 ? (
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] py-3.5 text-[14px] font-medium text-muted-foreground">
                <Moon className="h-4 w-4" strokeWidth={2.25} />
                {nextDueInMs !== null ? `Próxima em ${formatNextIn(nextDueInMs)}` : "Tudo em dia"}
              </div>
            ) : (
              <button
                type="button"
                disabled={!canStart}
                onClick={() => canStart && setConfirmOpen(true)}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-white to-white/90 py-3.5 text-[14px] font-semibold text-background shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 hover:brightness-[1.02] active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
                />
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

      {/* Stats — glass chips */}
      <section
        className="animate-fade-in mt-6 grid grid-cols-2 gap-3"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <StatChip label="Decks" value={decks.length} />
        <StatChip label="Cartas" value={cards.length} />
      </section>

      {/* Método RRSLG */}
      {cycle && (
        <section
          className="animate-fade-in mt-6"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >
          <Link
            to="/study"
            className={`${GLASS_BASE} group block p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.055]`}
          >
            <GlassHighlight />
            <div className="relative flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_20px_-6px_rgba(167,139,250,0.5)]">
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

      {/* Prova mensal */}
      {appSettings.exam_visible && (
        <section
          className="animate-fade-in mt-6"
          style={{ animationDelay: "165ms", animationFillMode: "backwards" }}
        >
          <Link
            to="/exam"
            className={`${GLASS_BASE} group block p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30`}
          >
            <GlassHighlight />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/12 opacity-60 blur-2xl"
            />
            <div className="relative flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_20px_-6px_rgba(167,139,250,0.5)]">
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
      )}

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
                    className={`${GLASS_BASE} group flex items-center gap-4 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.055] active:scale-[0.995]`}
                  >
                    <GlassHighlight />
                    <div
                      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                        dueInDeck > 0
                          ? "border-primary/30 bg-primary/10 shadow-[0_0_20px_-6px_rgba(167,139,250,0.5)]"
                          : "border-white/[0.08] bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-[5px] border-2 ${
                          dueInDeck > 0 ? "border-primary" : "border-white/25"
                        }`}
                      />
                    </div>
                    <div className="relative min-w-0 flex-1">
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
                      className="relative h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground"
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
    <div className={`${GLASS_BASE} p-4 transition-colors hover:bg-white/[0.055]`}>
      <GlassHighlight />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="relative mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
