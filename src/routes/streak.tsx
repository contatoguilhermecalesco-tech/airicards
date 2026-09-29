import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Flame, Target, Trophy, TrendingUp } from "lucide-react";
import { useCardsReviewedToday, useStreak } from "@/lib/flashcards-store";

export const Route = createFileRoute("/streak")({ component: StreakPage });

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatDateKey(key?: string) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StreakPage() {
  const streak = useStreak();
  const reviewedToday = useCardsReviewedToday();
  const history = streak.history ?? {};
  const today = new Date();

  const days = Array.from({ length: 56 }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (55 - index));
    const key = dateKey(d);
    return { key, date: d, done: history[key] === "done" };
  });

  const studiedDays = days.filter((d) => d.done).length;
  const consistency = Math.round((studiedDays / days.length) * 100);
  const last7 = days.slice(-7);
  const last7Done = last7.filter((d) => d.done).length;
  const nextMilestone = [3, 7, 14, 30, 60, 100, 180, 365].find((m) => m > streak.current) ?? streak.current + 100;
  const milestoneProgress = Math.min(100, Math.round((streak.current / nextMilestone) * 100));

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
      <header className="mb-7">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300/80">Seu progresso</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Streak & frequência</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Veja sua consistência, evolução e os dias em que você manteve o hábito de estudar.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-orange-300/20 bg-orange-400/[0.07] p-3 sm:block">
            <Flame className="h-7 w-7 text-orange-300" fill="currentColor" fillOpacity={0.2} />
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Flame className="h-4 w-4 text-orange-300" />} label="Streak atual" value={`${streak.current}`} suffix="dias" />
        <StatCard icon={<Trophy className="h-4 w-4 text-amber-300" />} label="Maior streak" value={`${streak.longest}`} suffix="dias" />
        <StatCard icon={<Target className="h-4 w-4 text-emerald-300" />} label="Consistência" value={`${consistency}%`} suffix="56 dias" />
      </section>

      <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,.8)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Sequência atual</p>
            <p className="mt-1 text-xs text-muted-foreground">Próximo marco: {nextMilestone} dias</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-orange-200">{streak.current}/{nextMilestone}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 transition-all" style={{ width: `${milestoneProgress}%` }} />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Últimos 7 dias</p>
            <p className="mt-1 text-xs text-muted-foreground">Frequência desta semana</p>
          </div>
          <span className="text-sm font-semibold tabular-nums">{last7Done}/7 dias</span>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-2">
          {last7.map(({ date, done }) => (
            <div key={date.toISOString()} className="text-center">
              <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">{date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</p>
              <div className={`mx-auto grid h-10 w-10 place-items-center rounded-xl border ${done ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-300" : "border-white/[0.07] bg-white/[0.035] text-muted-foreground/30"}`}>
                {done ? "✓" : "·"}
              </div>
            </div>
          ))}
        </div>
        {reviewedToday > 0 ? (
          <p className="mt-4 text-xs text-emerald-300">Você já estudou hoje — sequência protegida.</p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">Ainda não há revisão registrada hoje.</p>
        )}
      </section>

      <section className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-violet-300" />
          <div>
            <p className="text-sm font-semibold">Histórico de frequência</p>
            <p className="mt-1 text-xs text-muted-foreground">Cada ponto representa um dia em que você revisou pelo menos uma carta.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map(({ key, done }) => (
            <div key={key} title={`${formatDateKey(key)} · ${done ? "Estudou" : "Sem revisão"}`} className={`aspect-square rounded-md border ${done ? "border-emerald-300/20 bg-emerald-400/65" : "border-white/[0.045] bg-white/[0.035]"}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>56 dias atrás</span>
          <span>{studiedDays} dias estudados</span>
          <span>Hoje</span>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoCard icon={<TrendingUp className="h-4 w-4 text-violet-300" />} title="Ritmo" text={`${last7Done} dias ativos nos últimos 7. Continue criando regularidade.`} />
        <InfoCard icon={<CalendarDays className="h-4 w-4 text-sky-300" />} title="Início da sequência" text={formatDateKey(streak.startedOn)} />
      </section>
    </main>
  );
}

function StatCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[11px] font-medium uppercase tracking-wide">{label}</span></div>
      <div className="mt-3 flex items-baseline gap-1.5"><span className="text-2xl font-semibold tabular-nums">{value}</span><span className="text-xs text-muted-foreground">{suffix}</span></div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">{icon}<span className="text-sm font-semibold">{title}</span></div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
