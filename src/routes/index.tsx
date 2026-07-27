import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Moon, Sun, Sunrise, Sunset, Sparkles, Lock, GraduationCap, Flame, Trophy, AlertTriangle, Check, Swords, Skull, Crown, ShoppingBag, TrendingUp, Layers, BookOpen } from "lucide-react";
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
  isEnemy,
  isDefeated,
  type Streak,
} from "@/lib/flashcards-store";
import { useCurrentProfile } from "@/lib/profile";
import { useCycleWeek, getTodayFocus } from "@/lib/cycle";
import { useExamState, getMonthKey, hasCompletedExamThisMonth, monthLabel } from "@/lib/exam-store";
import { useAppSettings } from "@/lib/app-settings";
import { useRank, TIER_COLORS, TIER_LABEL, DIVISION_ROMAN, isElite } from "@/lib/rank-store";


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
  const streak = useStreak();
  const nextMilestone = nextStreakMilestone(streak.current);
  const milestoneProgress = streak.current === 0 ? 0 : Math.min(1, streak.current / nextMilestone);
  const studiedToday = reviewedToday > 0;
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
  const timeLabel = useMemo(() => {
    const d = new Date();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
    return `${hh}:${mm} · ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
  }, [now]);
  const name = profile?.name ?? "";
  const cycle = useCycleWeek();
  const todayFocus = getTodayFocus();
  const ankiPending = due > 0 && reviewedToday === 0;

  // Enemies (chefões ativos)
  const enemies = useMemo(
    () => cards.filter((c) => isEnemy(c) && !isDefeated(c)),
    [cards],
  );
  const enemyDue = useMemo(
    () => enemies.filter((c) => c.dueAt <= now).length,
    [enemies, now],
  );

  // Rank do perfil
  const rank = useRank();

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
  const pendingPct = Math.min(1, due / dailyTarget);
  const pctLabel = Math.round(reviewedPct * 100);

  // ---- Insights (contexto para os stats) --------------------------------
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const cardsThisWeek = useMemo(
    () => cards.filter((c) => c.createdAt >= weekAgo).length,
    [cards, weekAgo],
  );
  const masteredCount = useMemo(
    () => cards.filter((c) => (c.reps ?? 0) >= 3 && !isEnemy(c)).length,
    [cards],
  );
  const masteryPct = cards.length === 0 ? 0 : Math.round((masteredCount / cards.length) * 100);
  const dueDeckCount = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.dueAt <= now) set.add(c.deckId);
    });
    return set.size;
  }, [cards, now]);



  return (
    <main className="relative mx-auto max-w-md px-5 pt-8 pb-24 sm:max-w-xl sm:pt-14 lg:max-w-[1180px] lg:px-8 lg:pt-16 lg:grid lg:grid-cols-12 lg:gap-x-5 lg:gap-y-5 lg:items-start lg:auto-rows-min">
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
      <header className="animate-fade-in flex flex-col space-y-1.5 lg:col-span-12 lg:row-start-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {eyebrow}
          </span>
          <span className="shrink-0">{icon}</span>
          <span
            aria-hidden
            className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40"
          />
          <span className="truncate text-[11px] font-medium tabular-nums text-muted-foreground/70">
            {timeLabel}
          </span>
        </div>
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[38px]">
          {salute}
          {name ? `, ${name}` : ""}
        </h1>
      </header>


      {/* Hero — Liquid Glass */}
      <section
        className="animate-fade-in relative mt-7 sm:mt-8 lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:row-span-2 lg:mt-0"
        style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
      >

        {/* soft halo behind glass — dual-tone violet→fuchsia */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[40px] opacity-50 blur-2xl"
          style={{
            background:
              "linear-gradient(120deg, rgba(167,139,250,0.28) 0%, rgba(232,121,249,0.18) 100%)",
          }}
        />
        <div
          className={`${GLASS_BASE} rounded-[28px] p-6 sm:p-8`}
        >
          <GlassHighlight />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-white/[0.04] blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-primary/15 blur-2xl"
          />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            {/* Ring — hero centerpiece on mobile, right side on ≥sm */}
            <div
              className="relative order-1 shrink-0 sm:order-2"
              style={{ height: 148, width: 148 }}
            >
              <div
                aria-hidden
                className="absolute inset-3 rounded-full bg-primary/20 opacity-70 blur-xl"
              />
              <svg viewBox="0 0 104 104" className="relative h-full w-full -rotate-90">
                <circle
                  cx="52" cy="52" r={RING_R}
                  stroke="rgba(255,255,255,0.07)" strokeWidth="7" fill="none"
                />
                {pendingPct > 0 && (
                  <circle
                    cx="52" cy="52" r={RING_R}
                    stroke="rgba(167,139,250,0.22)" strokeWidth="7" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${ringC * pendingPct} ${ringC}`}
                    strokeDashoffset={-ringC * reviewedPct}
                  />
                )}
                <circle
                  cx="52" cy="52" r={RING_R}
                  stroke="url(#ringGrad)" strokeWidth="7" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - reviewedPct)}
                  className="transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,0.45))" }}
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
                <p className="text-[28px] font-semibold leading-none tracking-tighter tabular-nums text-foreground sm:text-[32px]">
                  {pctLabel}%
                </p>
                <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Meta diária
                </p>
              </div>
            </div>

            {/* Copy — centered on mobile, left on ≥sm */}
            <div className="order-2 min-w-0 flex-1 space-y-1 text-center sm:order-1 sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                  Sessão de hoje
                </span>
                {due > 0 && (
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span aria-hidden className="absolute inset-0 rounded-full bg-primary/70 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[24px] font-medium leading-tight tracking-tight text-foreground sm:text-[28px]">
                {due === 0
                  ? "Tudo em dia por agora"
                  : `${due} carta${due === 1 ? "" : "s"} te esperam`}
              </p>
              <p className="pt-1 text-[13px] text-muted-foreground/80">
                {pending > 0 && nextDueInMs !== null
                  ? `+${pending} voltando em ${formatNextIn(nextDueInMs)}`
                  : reviewedToday > 0
                    ? `${reviewedToday} revisada${reviewedToday === 1 ? "" : "s"} hoje`
                    : "Sua sessão diária te espera."}
              </p>
              {/* Insight row — dá contexto humano ao número */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 sm:justify-start">
                {masteryPct > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-emerald-300/80" />
                    <span className="tabular-nums text-foreground/85">{masteryPct}%</span>
                    <span>dominado</span>
                  </span>
                )}
                {dueDeckCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary/80" />
                    <span className="tabular-nums text-foreground/85">{dueDeckCount}</span>
                    <span>deck{dueDeckCount === 1 ? "" : "s"} com pendências</span>
                  </span>
                )}
                {reviewedToday > 0 && streak.current > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-300" strokeWidth={2.5} />
                    <span className="tabular-nums text-foreground/85">dia {streak.current}</span>
                  </span>
                )}
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

      {/* Atalhos — pills discretas estilo iOS */}
      <section
        className="animate-fade-in mt-6 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:col-span-12 lg:col-start-1 lg:row-start-6 lg:mt-0 lg:flex-wrap lg:overflow-visible"
        style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
      >

        <QuickPill
          to="/social"
          label="Duelo"
          icon={<Swords className="h-3.5 w-3.5" strokeWidth={2.25} />}
          accent="text-fuchsia-200"
        />
        <QuickPill
          to="/enemies"
          label="Chefões"
          badge={enemies.length > 0 ? enemies.length : undefined}
          icon={<Skull className="h-3.5 w-3.5" strokeWidth={2.25} />}
          accent="text-rose-200"
        />
        <QuickPill
          to="/rank"
          label={isElite(rank.tier) ? TIER_LABEL[rank.tier] : `${TIER_LABEL[rank.tier]} ${DIVISION_ROMAN[rank.division as 1 | 2 | 3 | 4]}`}
          icon={<Crown className="h-3.5 w-3.5" strokeWidth={2.25} />}
          accent="text-white"
          dotColor={TIER_COLORS[rank.tier].glow}
        />
        <QuickPill
          to="/shop"
          label="Loja"
          icon={<ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.25} />}
          accent="text-amber-200"
        />
      </section>

      {/* Streak — sequência de dias */}
      <div className="contents lg:block lg:col-span-4 lg:col-start-9 lg:row-start-2 [&>section]:lg:mt-0">
        <StreakCard streak={streak} studiedToday={studiedToday} nextMilestone={nextMilestone} milestoneProgress={milestoneProgress} />
      </div>


      {/* Chefões pendentes — alerta gamificado */}
      {enemies.length > 0 && (
        <section
          className="animate-fade-in mt-6 lg:col-span-4 lg:col-start-9 lg:row-start-4 lg:mt-0"
          style={{ animationDelay: "110ms", animationFillMode: "backwards" }}
        >

          <Link
            to="/enemies"
            className={`${GLASS_BASE} group relative block overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300/30`}
          >
            <GlassHighlight />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-rose-500/20 opacity-70 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-fuchsia-500/10 opacity-60 blur-2xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-rose-300/30 bg-gradient-to-b from-rose-400/25 to-rose-600/10 text-rose-200 shadow-[0_0_24px_-6px_rgba(244,63,94,0.55)]">
                <Skull className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300/90">
                    Arena · chefões ativos
                  </p>
                  {enemyDue > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-100">
                      {enemyDue} agora
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[14px] font-medium text-foreground">
                  {enemies.length} carta{enemies.length === 1 ? "" : "s"} inimiga{enemies.length === 1 ? "" : "s"} te encarando
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Derrote-as para reconquistar seu domínio
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-rose-200/60 transition-all group-hover:translate-x-0.5 group-hover:text-rose-100"
                strokeWidth={2.25}
              />
            </div>
          </Link>
        </section>
      )}

      {/* Stats — glass chips com contexto */}
      <section
        className="animate-fade-in mt-6 grid grid-cols-2 gap-2.5 lg:col-span-8 lg:col-start-1 lg:row-start-4 lg:mt-0 lg:grid-cols-4 lg:gap-3"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <StatChip
          label="Decks"
          value={decks.length}
          hint={dueDeckCount > 0 ? `${dueDeckCount} com pendências` : "todos em dia"}
          icon={<Layers className="h-3 w-3" strokeWidth={2.5} />}
        />
        <StatChip
          label="Cartas"
          value={cards.length}
          hint={cardsThisWeek > 0 ? `+${cardsThisWeek} esta semana` : "adicione a primeira"}
          icon={<BookOpen className="h-3 w-3" strokeWidth={2.5} />}
          trend={cardsThisWeek > 0}
        />
        <StatChip
          label="Revisadas"
          value={reviewedToday}
          hint={reviewedToday > 0 ? `hoje · ${pctLabel}% da meta` : "comece agora"}
          icon={<Check className="h-3 w-3" strokeWidth={2.5} />}
          accent
        />
        <StatChip
          label="Domínio"
          value={masteryPct}
          suffix="%"
          hint={masteredCount > 0 ? `${masteredCount} carta${masteredCount === 1 ? "" : "s"}` : "revise para subir"}
          icon={<Trophy className="h-3 w-3" strokeWidth={2.5} />}
        />
      </section>

      {/* Rank tile — bento direita */}
      <RankTile rank={rank} />




      {/* Método RRSLG */}
      {cycle && (
        <section
          className="animate-fade-in mt-6 lg:col-span-6 lg:col-start-1 lg:row-start-5 lg:mt-0"
          style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
        >

          <Link
            to="/study"
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-transparent p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/25 hover:from-violet-900/50"
          >
            <GlassHighlight />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/20 opacity-70 blur-2xl"
            />

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
          className="animate-fade-in mt-6 lg:col-span-6 lg:col-start-7 lg:row-start-5 lg:mt-0"
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
          className="animate-fade-in mt-10 lg:col-span-12 lg:col-start-1 lg:row-start-7 lg:mt-4"
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
          <ul className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
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

function StatChip({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`${GLASS_BASE} p-3 transition-colors hover:bg-white/[0.055] ${
        accent ? "border-primary/25 bg-primary/[0.06]" : ""
      }`}
    >
      <GlassHighlight />
      <p className={`relative text-[10px] font-semibold uppercase tracking-[0.14em] ${accent ? "text-primary/90" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className={`relative mt-1 text-[20px] font-semibold leading-none tabular-nums ${accent ? "text-primary-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function QuickPill({
  to,
  label,
  icon,
  accent,
  badge,
  dotColor,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  badge?: number;
  dotColor?: string;
}) {
  return (
    <Link
      to={to as "/social"}
      className="group relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] active:scale-[0.97]"
    >
      {dotColor && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
        />
      )}
      <span className={accent}>{icon}</span>
      <span className="text-[11.5px] font-semibold tracking-tight text-foreground/90">
        {label}
      </span>
      {badge !== undefined && (
        <span className="ml-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500/90 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}


// ---- Streak card ---------------------------------------------------------

function StreakCard({
  streak,
  studiedToday,
  nextMilestone,
  milestoneProgress,
}: {
  streak: Streak;
  studiedToday: boolean;
  nextMilestone: number;
  milestoneProgress: number;
}) {
  const now = new Date();

  const atRisk = streak.current > 0 && !studiedToday && now.getHours() >= 19;
  const isBroken = streak.current === 0 && streak.longest > 0;
  const isActive = streak.current > 0;


  // Estado visual da chama
  const flameState: "ashes" | "risk" | "alive" | "empty" = isBroken
    ? "ashes"
    : atRisk
      ? "risk"
      : isActive
        ? "alive"
        : "empty";

  const flameClasses = {
    ashes: "border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] text-muted-foreground/50",
    risk: "border-amber-300/25 bg-gradient-to-b from-amber-400/15 to-amber-500/5 text-amber-200",
    alive: "border-orange-300/25 bg-gradient-to-b from-orange-400/25 to-rose-500/10 text-orange-200",
    empty: "border-white/[0.08] bg-white/[0.04] text-muted-foreground",
  }[flameState];

  const haloBg = {
    ashes: "radial-gradient(closest-side, rgba(148,163,184,0.15), transparent 70%)",
    risk: "radial-gradient(closest-side, rgba(251,191,36,0.28), transparent 70%)",
    alive: "radial-gradient(closest-side, rgba(251,146,60,0.35), transparent 70%)",
    empty: "radial-gradient(closest-side, rgba(167,139,250,0.20), transparent 70%)",
  }[flameState];

  const haloOpacity = flameState === "alive" ? "opacity-80" : flameState === "risk" ? "opacity-60" : flameState === "ashes" ? "opacity-40" : "opacity-20";

  return (
    <section
      className="animate-fade-in mt-6"
      style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
    >
      <div className={`${GLASS_BASE} relative p-4`}>
        <GlassHighlight />

        {/* ambient halo */}
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500 ${haloOpacity}`}
          style={{ background: haloBg }}
        />

        {/* Smoke wisps when broken */}
        {flameState === "ashes" && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute left-[26px] top-1 h-8 w-3 rounded-full bg-white/10 blur-md motion-safe:animate-[smokeRise_3600ms_ease-in-out_infinite]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-[38px] top-2 h-6 w-2 rounded-full bg-white/[0.06] blur-md motion-safe:animate-[smokeRise_4200ms_ease-in-out_infinite_600ms]"
            />
          </>
        )}

        <div className="relative flex items-center gap-4">
          <div
            className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition-colors ${flameClasses}`}
          >
            <Flame
              className={`h-[22px] w-[22px] transition-transform ${
                flameState === "alive" && studiedToday ? "motion-safe:animate-pulse" : ""
              } ${flameState === "risk" ? "motion-safe:animate-[flicker_1400ms_ease-in-out_infinite]" : ""} ${
                flameState === "ashes" ? "opacity-40 rotate-6" : ""
              }`}
              strokeWidth={2.25}
              fill={isActive ? "currentColor" : "none"}
              fillOpacity={
                flameState === "alive" ? (studiedToday ? 0.3 : 0.18) : flameState === "risk" ? 0.22 : 0
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p
                className={`text-[22px] font-semibold leading-none tabular-nums transition-colors ${
                  flameState === "ashes" ? "text-muted-foreground/60 line-through decoration-1" : "text-foreground"
                }`}
              >
                {isBroken ? streak.longest : streak.current}
              </p>
              <p className="text-[13px] font-medium text-muted-foreground">
                {isBroken
                  ? "dias · recorde"
                  : `${streak.current === 1 ? "dia" : "dias"} seguido${streak.current === 1 ? "" : "s"}`}
              </p>
              {!isBroken && streak.longest > 0 && streak.current >= streak.longest && streak.current > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  <Trophy className="h-2.5 w-2.5" strokeWidth={2.5} />
                  recorde
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
              {isBroken
                ? "Sua chama apagou · revise hoje para reacender"
                : streak.current === 0
                  ? "Revise 1 carta hoje para começar sua sequência"
                  : studiedToday
                    ? `Continue amanhã · próximo marco ${nextMilestone} dias`
                    : `Revise hoje para manter · próximo marco ${nextMilestone} dias`}
            </p>
            {/* progress toward next milestone */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isBroken
                    ? "bg-white/10"
                    : flameState === "risk"
                      ? "bg-gradient-to-r from-amber-300 to-orange-300"
                      : "bg-gradient-to-r from-orange-300 via-amber-300 to-rose-300"
                }`}
                style={{ width: `${isBroken ? 0 : milestoneProgress * 100}%` }}
              />
            </div>
          </div>
        </div>


        {/* Contextual banners */}
        {isBroken && (
          <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" strokeWidth={2.5} />
            <p className="text-[11px] font-medium text-muted-foreground">
              Perdeu {streak.longest} dia{streak.longest === 1 ? "" : "s"} de sequência. Recomece agora.
            </p>
          </div>
        )}
        {atRisk && !isBroken && (
          <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-400/[0.07] px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" strokeWidth={2.5} />
            <p className="text-[11px] font-medium text-amber-100/90">
              Sua chama está fraca · sequência de {streak.current} dia{streak.current === 1 ? "" : "s"} termina à meia-noite
            </p>
          </div>
        )}
        {studiedToday && streak.current > 0 && !atRisk && !isBroken && (
          <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-orange-300/20 bg-orange-400/[0.05] px-3 py-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.75} />
            <p className="text-[11px] font-medium text-muted-foreground">
              +1 dia conquistado hoje · recorde {streak.longest}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(0); opacity: 1; }
          25% { transform: scale(0.96) rotate(-2deg); opacity: 0.85; }
          50% { transform: scale(1.03) rotate(1deg); opacity: 1; }
          75% { transform: scale(0.98) rotate(-1deg); opacity: 0.9; }
        }
        @keyframes smokeRise {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          60% { opacity: 0.35; }
          100% { transform: translateY(-24px) scale(1.6); opacity: 0; }
        }
      `}</style>
    </section>
  );
}



