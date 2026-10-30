import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Moon, Sun, Sunrise, Sunset, Sparkles, GraduationCap, Flame, Swords, Skull, Crown, ShoppingBag, BookOpen, Zap } from "lucide-react";
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
function Home() {
  const profile = useCurrentProfile();
  const decks = useStore((s) => s.decks);
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
  const appSettings = useAppSettings();

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
        <Link to="/profile" aria-label="Abrir perfil" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-primary">
          {name ? name.slice(0, 1).toUpperCase() : "A"}
        </Link>
      </header>

      <section className="animate-fade-in mt-7" style={{ animationDelay: "50ms", animationFillMode: "backwards" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Seu próximo passo</p>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Sessão diária</span>
        </div>
        <div className="relative overflow-hidden rounded-[26px] border border-primary/20 bg-gradient-to-br from-[#211a35] via-[#171426] to-[#11101b] p-5 shadow-[0_18px_50px_-32px_rgba(139,92,246,0.55)] sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[25px] font-semibold leading-tight tracking-tight text-foreground sm:text-[30px]">{due === 0 ? "Tudo em dia!" : "Hora de aprender"}</h2>
                <p className="mt-2 max-w-[270px] text-sm leading-relaxed text-muted-foreground">
                  {cards.length === 0 ? "Adicione seu primeiro deck e comece sua jornada." : due > 0 ? `${due} carta${due === 1 ? "" : "s"} esperando por você.` : nextDueInMs !== null ? `Sua próxima revisão estará disponível em ${formatNextIn(nextDueInMs)}.` : "Você concluiu suas revisões por enquanto. Que tal aprender algo novo?"}
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_28px_-12px_rgba(167,139,250,0.8)]">
                <BookOpen className="h-7 w-7" strokeWidth={1.8} />
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Progresso de hoje</span><span className="font-semibold tabular-nums text-foreground">{pctLabel}%</span></div>
              <div role="progressbar" aria-label="Progresso das revisões de hoje" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctLabel} className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-300 via-primary to-fuchsia-400 transition-all duration-700" style={{ width: `${pctLabel}%` }} />
              </div>
            </div>
            <div className="mt-5">
              {cards.length === 0 ? (
                <Link to="/library" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]">Criar meu primeiro deck <ArrowRight className="h-4 w-4" /></Link>
              ) : due > 0 ? (
                <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(139,92,246,0.9)] transition-all hover:brightness-110 active:scale-[0.98]">Começar a estudar <ArrowRight className="h-4 w-4" /></button>
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

      {decks.length > 0 && (
        <section className="animate-fade-in mt-8" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Continue aprendendo</h2><p className="mt-0.5 text-xs text-muted-foreground">Seus espaços de estudo</p></div>
            <Link to="/library" className="text-xs font-semibold text-primary hover:opacity-80">Ver todos</Link>
          </div>
          <ul className="space-y-2">
            {decks.slice(0, 3).map((d) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const dueInDeck = cards.filter((c) => c.deckId === d.id && c.dueAt <= Date.now()).length;
              return (
                <li key={d.id}>
                  <Link to="/library/$deckId" params={{ deckId: d.id }} className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 transition-colors hover:border-primary/25 hover:bg-white/[0.055] active:scale-[0.995]">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" strokeWidth={1.8} /></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{d.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{dueInDeck > 0 ? `${dueInDeck} para revisar` : `${total} carta${total === 1 ? "" : "s"}`}</p></div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {cycle && (
        <Link to="/study" className="animate-fade-in mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 transition-colors hover:bg-white/[0.05]">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Plano de estudos</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{todayFocus.label} · {todayFocus.focus}</span></span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
      )}

      <section className="animate-fade-in mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Explore</p>
        <div className="grid grid-cols-4 gap-2">
          <Link to="/enemies" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]"><Skull className="h-5 w-5 text-rose-300" /><span className="text-[11px] font-medium text-muted-foreground">Chefões</span></Link>
          <Link to="/social" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]"><Swords className="h-5 w-5 text-fuchsia-300" /><span className="text-[11px] font-medium text-muted-foreground">Duelo</span></Link>
          {appSettings.exam_visible && <Link to="/exam" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]"><GraduationCap className="h-5 w-5 text-violet-300" /><span className="text-[11px] font-medium text-muted-foreground">Prova</span></Link>}
          <Link to="/shop" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]"><ShoppingBag className="h-5 w-5 text-amber-200" /><span className="text-[11px] font-medium text-muted-foreground">Loja</span></Link>
          <Link to="/inventory" className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-colors hover:bg-white/[0.04]"><Zap className="h-5 w-5 text-cyan-200" /><span className="text-[11px] font-medium text-muted-foreground">Power-ups</span></Link>
        </div>
      </section>
    </main>
  );
}
