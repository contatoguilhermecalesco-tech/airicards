import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Check,
  Crown,
  Flame,
  Gem,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useCardsReviewedToday, useStreak } from "@/lib/flashcards-store";

export const Route = createFileRoute("/streak")({ component: StreakPage });

const MILESTONES = [
  { days: 7, name: "Primeira chama", reward: "Badge Brasa Inicial", detail: "Seu primeiro símbolo de consistência.", icon: Flame, tone: "orange" },
  { days: 14, name: "Duas semanas", reward: "Título Persistente", detail: "Um título para quem não perde o ritmo.", icon: Award, tone: "amber" },
  { days: 30, name: "Um mês de foco", reward: "Chama Incandescente", detail: "Uma chama especial para sua sequência.", icon: Zap, tone: "rose" },
  { days: 60, name: "Constância", reward: "Moldura de Conquista", detail: "Uma moldura que celebra sua disciplina.", icon: ShieldCheck, tone: "violet" },
  { days: 100, name: "Centenário", reward: "Aura de Centelha", detail: "Um efeito visual reservado a grandes sequências.", icon: Sparkles, tone: "sky" },
  { days: 180, name: "Meio ano", reward: "Joia da Dedicação", detail: "Um cosmético especial para sua coleção.", icon: Gem, tone: "cyan" },
  { days: 365, name: "Lenda do AIRI", reward: "Coroa Lendária", detail: "O emblema máximo de um ano de consistência.", icon: Crown, tone: "yellow" },
] as const;

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function StreakPage() {
  const streak = useStreak();
  const reviewedToday = useCardsReviewedToday();
  const history = streak.history ?? {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);

  const calendarStart = startOfWeek(today);
  calendarStart.setDate(calendarStart.getDate() - 51 * 7);
  const calendarDays = Array.from({ length: 364 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    const key = dateKey(date);
    return { key, date, done: history[key] === "done", future: date > today };
  });
  const last30 = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const key = dateKey(date);
    return { key, date, done: history[key] === "done" };
  });
  const studiedLast30 = last30.filter((day) => day.done).length;
  const missedLast30 = 30 - studiedLast30;
  const consistency = Math.round((studiedLast30 / 30) * 100);

  const weekly = Array.from({ length: 8 }, (_, index) => {
    const start = startOfWeek(today);
    start.setDate(start.getDate() - (7 * (7 - index)));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = calendarDays.filter((day) => day.date >= start && day.date < end && day.date <= today && day.done).length;
    return {
      label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
      count,
    };
  });

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const count = calendarDays.filter((day) => day.date >= start && day.date < end && day.date <= today && day.done).length;
    return {
      label: start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      count,
    };
  });

  const bestMonth = monthly.reduce((best, month) => month.count > best.count ? month : best, monthly[0]);
  const nextMilestone = MILESTONES.find((milestone) => milestone.days > streak.current)?.days ?? 365;
  const previousMilestone = [...MILESTONES].reverse().find((milestone) => milestone.days <= streak.current)?.days ?? 0;
  const milestoneProgress = Math.min(100, Math.round(((streak.current - previousMilestone) / Math.max(1, nextMilestone - previousMilestone)) * 100));
  const rewardProgress = Math.min(100, Math.round((Math.max(streak.longest, streak.current) / 365) * 100));
  const weeklyMax = Math.max(1, ...weekly.map((week) => week.count));
  const monthlyMax = Math.max(1, ...monthly.map((month) => month.count));
  const monthLabels = calendarDays.filter((day, index) => day.date.getDate() === 1 || index === 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">Sua jornada · AIRI</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Central de Streak</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Cada dia estudado fortalece seu hábito. Acompanhe sua frequência e desbloqueie conquistas ao longo da jornada.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-orange-300/20 bg-orange-400/[0.07] px-4 py-3">
            <Flame className="h-8 w-8 text-orange-300" fill="currentColor" fillOpacity={0.18} />
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-orange-200/70">Sequência atual</p><p className="text-2xl font-bold tabular-nums">{streak.current} <span className="text-xs font-medium text-muted-foreground">dias</span></p></div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Flame className="h-4 w-4 text-orange-300" />} label="Streak atual" value={String(streak.current)} suffix="dias" />
        <StatCard icon={<Trophy className="h-4 w-4 text-amber-300" />} label="Maior streak" value={String(streak.longest)} suffix="dias" />
        <StatCard icon={<Check className="h-4 w-4 text-emerald-300" />} label="Dias estudados" value={String(studiedLast30)} suffix="últimos 30 dias" />
        <StatCard icon={<CalendarDays className="h-4 w-4 text-rose-300" />} label="Dias sem estudo" value={String(missedLast30)} suffix="últimos 30 dias" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-3xl border border-orange-300/15 bg-gradient-to-br from-orange-400/[0.10] via-rose-400/[0.045] to-transparent p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">Próximo marco</p><p className="mt-1 text-xs text-muted-foreground">Continue estudando diariamente para alcançar sua próxima conquista.</p></div>
            <div className="rounded-2xl bg-orange-300/10 p-3 text-orange-200"><Target className="h-5 w-5" /></div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-3"><p className="text-3xl font-bold tabular-nums">{streak.current}<span className="text-sm font-medium text-muted-foreground"> / {nextMilestone} dias</span></p><p className="text-xs font-semibold text-orange-200">{Math.max(0, nextMilestone - streak.current)} dias restantes</p></div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 transition-all" style={{ width: `${milestoneProgress}%` }} /></div>
          <p className="mt-2 text-right text-[10px] text-muted-foreground">{milestoneProgress}% concluído</p>
        </div>
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-300" /><p className="text-sm font-semibold">Consistência recente</p></div>
          <p className="mt-4 text-3xl font-bold tabular-nums">{consistency}<span className="ml-1 text-sm font-medium text-muted-foreground">%</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{studiedLast30} de 30 dias com estudo registrado</p>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="rounded-full bg-emerald-400" style={{ width: `${consistency}%` }} /></div>
          <p className="mt-3 text-[11px] text-muted-foreground">Melhor mês recente: <span className="font-semibold text-foreground">{bestMonth.label} · {bestMonth.count} dias</span></p>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-violet-300" /><div><h2 className="text-sm font-semibold">Calendário de frequência</h2><p className="mt-1 text-xs text-muted-foreground">Últimos 12 meses · cada quadrado representa um dia</p></div></div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-white/10" /> Sem estudo</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Estudou</span></div>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-[620px]">
            <div className="mb-2 flex justify-between px-1 text-[10px] text-muted-foreground">{monthLabels.map((day) => <span key={day.key}>{day.date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>)}</div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {calendarDays.map(({ key, done }) => (
                <div key={key} title={`${formatDateKey(key)} · ${done ? "Estudou" : "Sem estudo registrado"}`} className={`aspect-square min-w-0 rounded-[3px] border ${future ? "border-transparent bg-transparent" : done ? "border-emerald-300/30 bg-emerald-400/75" : "border-white/[0.035] bg-white/[0.055]"} ${key === todayKey ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">O histórico detalhado é mantido a partir da ampliação do registro. Dias antigos que já não estavam armazenados não podem ser recuperados.</p>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <EvolutionCard title="Evolução semanal" subtitle="Dias estudados em cada uma das últimas 8 semanas" items={weekly} max={weeklyMax} />
        <EvolutionCard title="Evolução mensal" subtitle="Dias estudados em cada um dos últimos 6 meses" items={monthly} max={monthlyMax} />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Conquistas de consistência</p><h2 className="mt-1 text-xl font-semibold">Recompensas de Streak</h2><p className="mt-1 text-xs text-muted-foreground">Marcos especiais que celebram sua dedicação.</p></div>
          <div className="text-right"><p className="text-xs font-semibold tabular-nums">{Math.max(streak.longest, streak.current)} / 365 dias</p><p className="text-[10px] text-muted-foreground">Jornada lendária · {rewardProgress}%</p></div>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-violet-400 to-amber-200" style={{ width: `${rewardProgress}%` }} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MILESTONES.map((milestone) => {
            const unlocked = Math.max(streak.longest, streak.current) >= milestone.days;
            const Icon = milestone.icon;
            return (
              <article key={milestone.days} className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${unlocked ? "border-amber-300/25 bg-gradient-to-br from-amber-300/[0.10] to-white/[0.025]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${unlocked ? "border-amber-200/25 bg-amber-300/15 text-amber-200" : "border-white/[0.07] bg-white/[0.04] text-muted-foreground"}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{milestone.name}</h3>{unlocked ? <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300">Conquistado</span> : <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">{milestone.days} dias</span>}</div><p className="mt-1 text-xs font-medium text-amber-100/90">{milestone.reward}</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{milestone.detail}</p></div>
                  {unlocked && <Star className="h-4 w-4 shrink-0 fill-amber-300 text-amber-300" />}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoCard icon={<Flame className="h-4 w-4 text-orange-300" />} title="Hoje" text={reviewedToday > 0 ? "Você já estudou hoje. Sua sequência está protegida!" : "Ainda não há estudo registrado hoje. Faça uma revisão para manter sua sequência."} />
        <InfoCard icon={<Trophy className="h-4 w-4 text-amber-300" />} title="Sua maior conquista" text={streak.longest > 0 ? `Sua maior sequência foi de ${streak.longest} dias. Continue superando seus próprios recordes!` : "Seu primeiro dia de estudo dará início à sua jornada de streak."} />
      </section>
    </main>
  );
}

function StatCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div><div className="mt-3 flex flex-wrap items-baseline gap-1.5"><span className="text-2xl font-semibold tabular-nums">{value}</span><span className="text-[10px] text-muted-foreground">{suffix}</span></div></div>;
}

function EvolutionCard({ title, subtitle, items, max }: { title: string; subtitle: string; items: { label: string; count: number }[]; max: number }) {
  return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6"><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div><div className="mt-5 flex h-36 items-end gap-2">{items.map((item) => <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] tabular-nums text-muted-foreground">{item.count || ""}</span><div className="flex h-24 w-full items-end rounded-t-md bg-white/[0.055]"><div className="w-full rounded-t-md bg-gradient-to-t from-orange-500/70 to-amber-300/80 transition-all" style={{ height: `${item.count / max * 100}%`, minHeight: item.count ? "4px" : 0 }} /></div><span className="max-w-full truncate text-[9px] text-muted-foreground">{item.label}</span></div>)}</div></section>;
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-center gap-2">{icon}<span className="text-sm font-semibold">{title}</span></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p></div>;
}
