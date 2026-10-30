import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Crown,
  Flame,
  Gem,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useCardsReviewedToday, useStreak } from "@/lib/flashcards-store";

export const Route = createFileRoute("/streak")({ component: StreakPage });

const MILESTONES = [
  { days: 7, name: "Primeira chama", reward: "Badge Brasa Inicial", detail: "Seu primeiro símbolo de consistência.", icon: Flame },
  { days: 14, name: "Duas semanas", reward: "Título Persistente", detail: "Um título para quem não perde o ritmo.", icon: Award },
  { days: 30, name: "Um mês de foco", reward: "Chama Incandescente", detail: "Uma chama especial para sua sequência.", icon: Zap },
  { days: 60, name: "Constância", reward: "Moldura de Conquista", detail: "Uma moldura que celebra sua disciplina.", icon: ShieldCheck },
  { days: 100, name: "Centenário", reward: "Aura de Centelha", detail: "Um efeito visual reservado a grandes sequências.", icon: Sparkles },
  { days: 180, name: "Meio ano", reward: "Joia da Dedicação", detail: "Um cosmético especial para sua coleção.", icon: Gem },
  { days: 365, name: "Lenda do AIRI", reward: "Coroa Lendária", detail: "O emblema máximo de um ano de consistência.", icon: Crown },
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
  const achievedDays = Math.max(streak.longest, streak.current);
  const nextReward = MILESTONES.find((milestone) => milestone.days > achievedDays);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-7 sm:px-6 sm:pt-10">
      <header className="mb-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300/80">AIRI / sua jornada</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Central de Streak</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Consistência não acontece de uma vez. Ela é construída em cada dia que você escolhe continuar.
            </p>
          </div>
          <div className="flex items-center gap-4 sm:pb-1">
            <Flame className="h-11 w-11 shrink-0 text-orange-300" fill="currentColor" fillOpacity={0.16} strokeWidth={1.5} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200/70">Sequência atual</p>
              <p className="mt-0.5 text-5xl font-semibold leading-none tracking-tight tabular-nums">{streak.current}<span className="ml-2 text-sm font-medium tracking-normal text-muted-foreground">dias</span></p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-white/10 py-6 sm:grid-cols-4 sm:gap-0">
          <Metric label="Maior sequência" value={streak.longest} suffix="dias" />
          <Metric label="Dias estudados" value={studiedLast30} suffix="últimos 30 dias" />
          <Metric label="Dias sem estudo" value={missedLast30} suffix="últimos 30 dias" />
          <Metric label="Consistência" value={consistency} suffix="% nos últimos 30 dias" />
        </div>
      </header>

      <section className="grid gap-8 border-b border-white/10 pb-9 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
        <div>
          <div className="flex items-center gap-2 text-orange-200"><Target className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Próximo marco</p></div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{streak.current}<span className="text-base font-normal text-muted-foreground"> / {nextMilestone} dias</span></p>
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-orange-200">{Math.max(0, nextMilestone - streak.current)} dias</span> restantes</p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.09]">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-200 transition-all" style={{ width: `${milestoneProgress}%` }} />
          </div>
          <p className="mt-2 text-right text-[10px] text-muted-foreground">{milestoneProgress}% do caminho</p>
        </div>
        <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-center gap-2 text-emerald-300"><TrendingUp className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Ritmo recente</p></div>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{consistency}<span className="ml-1 text-base font-normal text-muted-foreground">%</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{studiedLast30} de 30 dias com estudo registrado</p>
          <p className="mt-3 text-xs text-muted-foreground">Seu melhor mês recente foi <span className="font-semibold text-foreground">{bestMonth.label} · {bestMonth.count} dias</span>.</p>
        </div>
      </section>

      <section className="border-b border-white/10 py-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Visão anual</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Sua frequência</h2>
            <p className="mt-1 text-xs text-muted-foreground">Cada marca representa um dia dos últimos 12 meses.</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-white/10" /> Sem estudo</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-emerald-400" /> Estudou</span>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="min-w-[620px]">
            <div className="mb-2 flex justify-between px-1 text-[10px] text-muted-foreground">{monthLabels.map((day) => <span key={day.key}>{day.date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>)}</div>
            <div className="grid grid-flow-col grid-rows-7 gap-[5px]">
              {calendarDays.map(({ key, done, future }) => (
                <div key={key} title={`${formatDateKey(key)} · ${done ? "Estudou" : "Sem estudo registrado"}`} className={`aspect-square min-w-0 rounded-[2px] transition-colors ${future ? "bg-transparent" : done ? "bg-emerald-400/80 shadow-[0_0_7px_rgba(52,211,153,0.12)]" : "bg-white/[0.07]"} ${key === todayKey ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">O histórico detalhado é mantido a partir da ampliação do registro. Dias antigos que já não estavam armazenados não podem ser recuperados.</p>
      </section>

      <section className="border-b border-white/10 py-9">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">Tendência</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Sua evolução</h2>
          <p className="mt-1 text-xs text-muted-foreground">Dias em que você estudou ao longo das últimas semanas e meses.</p>
        </div>
        <div className="grid gap-9 lg:grid-cols-2 lg:gap-12">
          <EvolutionChart title="Por semana" items={weekly} max={weeklyMax} />
          <EvolutionChart title="Por mês" items={monthly} max={monthlyMax} />
        </div>
      </section>

      <section className="border-b border-white/10 py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">Marcos da jornada</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Conquistas de consistência</h2>
            <p className="mt-1 text-xs text-muted-foreground">Cada marco guarda um pedaço da sua evolução.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{achievedDays} <span className="text-xs font-normal text-muted-foreground">/ 365 dias</span></p>
            <p className="text-[10px] text-muted-foreground">{rewardProgress}% da jornada lendária</p>
          </div>
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-violet-400 to-amber-200" style={{ width: `${rewardProgress}%` }} />
        </div>
        <div className="mt-7 overflow-x-auto pb-3">
          <div className="relative grid min-w-[790px] grid-cols-7 gap-3 before:absolute before:left-[7%] before:right-[7%] before:top-[17px] before:h-px before:bg-white/10">
            {MILESTONES.map((milestone) => {
              const unlocked = achievedDays >= milestone.days;
              const isNext = nextReward?.days === milestone.days;
              const Icon = milestone.icon;
              return (
                <div key={milestone.days} className="relative flex flex-col items-center text-center">
                  <div className={`relative z-10 grid h-[35px] w-[35px] place-items-center rounded-full border transition-colors ${unlocked ? "border-amber-200/50 bg-amber-300/15 text-amber-200" : isNext ? "border-orange-300/60 bg-orange-300/10 text-orange-200 ring-4 ring-orange-300/[0.06]" : "border-white/10 bg-background text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={`mt-3 text-[11px] font-semibold ${unlocked ? "text-amber-100" : isNext ? "text-orange-100" : "text-muted-foreground"}`}>{milestone.days} dias</p>
                  <p className="mt-1 text-xs font-medium">{milestone.name}</p>
                  <p className="mt-1 max-w-[115px] text-[10px] leading-relaxed text-muted-foreground">{milestone.reward}</p>
                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide">{unlocked ? "Conquistado" : isNext ? "Próximo" : "Bloqueado"}</p>
                </div>
              );
            })}
          </div>
        </div>
        {nextReward && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5 text-amber-300" /> Próxima conquista: <span className="font-semibold text-foreground">{nextReward.name}</span> — faltam {Math.max(0, nextReward.days - achievedDays)} dias de sequência.</p>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">As recompensas exibidas aqui são marcos visuais de conquista; não são itens equipáveis no inventário.</p>
      </section>

      <section className="grid gap-5 py-8 sm:grid-cols-2 sm:gap-10">
        <div className="flex gap-3">
          <Flame className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
          <div><h3 className="text-sm font-semibold">Hoje</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reviewedToday > 0 ? "Você já estudou hoje. Sua sequência está protegida!" : "Ainda não há estudo registrado hoje. Faça uma revisão para manter sua sequência."}</p></div>
        </div>
        <div className="flex gap-3">
          <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div><h3 className="text-sm font-semibold">Sua maior conquista</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{streak.longest > 0 ? `Sua maior sequência foi de ${streak.longest} dias. Continue superando seus próprios recordes!` : "Seu primeiro dia de estudo dará início à sua jornada de streak."}</p></div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="sm:px-5 sm:border-l sm:border-white/10 first:sm:border-l-0 first:sm:pl-0">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}<span className="ml-1.5 text-[10px] font-normal tracking-normal text-muted-foreground">{suffix}</span></p>
    </div>
  );
}

function EvolutionChart({ title, items, max }: { title: string; items: { label: string; count: number }[]; max: number }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><span className="text-[10px] text-muted-foreground">dias estudados</span></div>
      <div className="flex h-32 items-end gap-2 border-b border-white/10 pb-0">
        {items.map((item) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] tabular-nums text-muted-foreground">{item.count || ""}</span>
            <div className="flex h-24 w-full items-end">
              <div className={`w-full rounded-t-[3px] transition-all ${item.count ? "bg-gradient-to-t from-violet-500/70 to-violet-300/90" : "bg-white/[0.045]"}`} style={{ height: item.count ? `${Math.max(5, item.count / max * 100)}%` : "2px" }} />
            </div>
            <span className="max-w-full truncate text-[9px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

