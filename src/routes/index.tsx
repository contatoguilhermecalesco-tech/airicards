import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Moon, Sun, Sunrise, Sunset, Sparkles, Flame, Crown, BookOpen, Target } from "lucide-react";
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
} from "@/lib/flashcards-store";
import { useCurrentProfile } from "@/lib/profile";
import { useCycleWeek, getTodayFocus } from "@/lib/cycle";
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
function Home() {
  const profile = useCurrentProfile();
  const cards = useStore((s) => s.cards);
  const reviewedToday = useCardsReviewedToday();
  const streak = useStreak();
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const { salute, icon, eyebrow } = greetingFor(hour);
  const name = profile?.name ?? "";
  const cycle = useCycleWeek();
  const todayFocus = getTodayFocus();

  // Rank do perfil
  const rank = useRank();

  const dailyTarget = Math.max(1, due + reviewedToday);
  const pctLabel = Math.round(Math.min(1, reviewedToday / dailyTarget) * 100);


  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-7 sm:max-w-xl sm:pt-10 lg:max-w-[1180px] lg:px-8 lg:pt-12">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]" style={{ background: "radial-gradient(60% 55% at 50% 0%, rgba(139,92,246,0.16), transparent 72%)" }} />

      <header className="animate-fade-in flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            {icon}<span>{eyebrow}</span>
          </div>
          <h1 className="mt-1 truncate text-[26px] font-semibold tracking-tight text-foreground sm:text-[32px]">{salute}{name ? `, ${name}` : ""}</h1>
        </div>
      </header>

      <section className="animate-fade-in mt-7" style={{ animationDelay: "50ms", animationFillMode: "backwards" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Seu próximo passo</p>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Sessão diária</span>
        </div>
        <div className="relative overflow-hidden rounded-[26px] border border-primary/20 bg-gradient-to-br from-[#a78bfa] via-[#8064d8] to-[#51418f] p-5 shadow-[0_18px_50px_-32px_rgba(139,92,246,0.55)] sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[25px] font-semibold leading-tight tracking-tight text-white sm:text-[30px]">{due === 0 ? "Tudo em dia!" : "Hora de aprender"}</h2>
                <p className="mt-2 max-w-[270px] text-sm leading-relaxed text-white/75">
                  {cards.length === 0 ? "Adicione seu primeiro deck e comece sua jornada." : due > 0 ? `${due} carta${due === 1 ? "" : "s"} esperando por você.` : nextDueInMs !== null ? `Sua próxima revisão estará disponível em ${formatNextIn(nextDueInMs)}.` : "Você concluiu suas revisões por enquanto. Que tal aprender algo novo?"}
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-white/15 text-white shadow-[0_0_28px_-12px_rgba(255,255,255,0.55)]">
                <BookOpen className="h-7 w-7" strokeWidth={1.8} />
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="text-white/75">Progresso de hoje</span><span className="font-semibold tabular-nums text-white">{pctLabel}%</span></div>
              <div role="progressbar" aria-label="Progresso das revisões de hoje" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctLabel} className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-white/80 to-white transition-all duration-700" style={{ width: `${pctLabel}%` }} />
              </div>
            </div>
            <div className="mt-5">
              {cards.length === 0 ? (
                <Link to="/library" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]">Criar meu primeiro deck <ArrowRight className="h-4 w-4" /></Link>
              ) : due > 0 ? (
                <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-[#51418f] shadow-[0_8px_24px_-12px_rgba(40,25,80,0.55)] transition-all hover:brightness-110 active:scale-[0.98]">Começar a estudar <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <Link to="/library" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/10">Explorar meus decks <BookOpen className="h-4 w-4" /></Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Iniciar sessão agora?</AlertDialogTitle><AlertDialogDescription>Você tem {due} carta{due === 1 ? "" : "s"} para revisar. As cartas voltam de minutos em minutos, então sempre haverá algo novo para praticar.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOpen(false); void navigate({ to: "/review" }); }}>Iniciar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="animate-fade-in mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
        <Link to="/streak" className="flex min-w-0 items-center gap-2.5"><Flame className="h-5 w-5 shrink-0 text-orange-300" /><span className="text-sm font-semibold tabular-nums text-foreground">{streak.current} {streak.current === 1 ? "dia" : "dias"}</span><span className="truncate text-xs text-muted-foreground">de sequência</span></Link>
        <span className="h-5 w-px bg-white/10" />
        <Link to="/rank" className="flex min-w-0 items-center gap-2 text-right"><Crown className="h-4 w-4 shrink-0" style={{ color: TIER_COLORS[rank.tier].glow }} /><span className="truncate text-xs font-medium text-foreground">{TIER_LABEL[rank.tier]} {!isElite(rank.tier) && DIVISION_ROMAN[rank.division as 1 | 2 | 3 | 4]}</span></Link>
      </section>

      {cycle && (
        <section className="animate-fade-in mt-6 space-y-3">
          <div className="relative overflow-hidden rounded-[26px] border border-emerald-200/15 bg-gradient-to-br from-[#4e9b78] via-[#286d60] to-[#183f43] p-4 text-white shadow-[0_18px_48px_-30px_rgba(45,160,125,0.65)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">Sua trilha de aprendizado</h2>
                  <p className="text-[11px] text-white/70">Semana {cycle.week} de 8</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-white">{Math.round((cycle.week / 8) * 100)}%</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5" aria-label={`Semana ${cycle.week} de 8`}>
              {Array.from({ length: 8 }, (_, index) => {
                const step = index + 1;
                const complete = step < cycle.week;
                const current = step === cycle.week;
                return (
                  <div key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span className={`h-2 w-full rounded-full transition-colors ${complete || current ? "bg-white" : "bg-black/20"} ${current ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-[#286d60]" : ""}`} />
                    <span className={`text-[9px] tabular-nums ${current ? "font-bold text-white" : complete ? "text-white/75" : "text-white/40"}`}>{step}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">{cycle.grammar.topic}</p>
              <p className="mt-0.5 text-xs text-white/75">{cycle.grammar.application}</p>
              <p className="mt-2 text-[11px] text-white/65">Foco de hoje: {todayFocus.label} · {todayFocus.focus}</p>
            </div>
            <Link to="/study" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:opacity-80">
              Ver minha trilha <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Link to="/desafios" className="group flex items-center gap-3 overflow-hidden rounded-[26px] border border-orange-200/15 bg-gradient-to-br from-[#e69a69] via-[#c66b63] to-[#854b73] px-4 py-4 text-white shadow-[0_18px_48px_-30px_rgba(220,120,110,0.65)] transition-all hover:brightness-105 active:scale-[0.99]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">Desafios diários</span>
              <span className="mt-0.5 block text-xs text-white/75">Complete missões e conquiste recompensas</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>
      )}

    </main>
  );
}
