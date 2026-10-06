import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  Mic,
  PenLine,
  Sparkles,
} from "lucide-react";
import { useAppSettings } from "@/lib/app-settings";

export const Route = createFileRoute("/study/")({
  component: StudyIndex,
  head: () => ({
    meta: [
      { title: "Estudos | airi" },
      {
        name: "description",
        content: "Organize sua semana de inglês e acesse cada modo de aprendizagem no airi.",
      },
      { property: "og:title", content: "Estudos | airi" },
      {
        property: "og:description",
        content: "Sua rotina semanal de inglês, organizada em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Day = {
  id: string;
  label: string;
  area: string;
  desc: string;
  icon: React.ReactNode;
  to: "/study/reading" | "/study/listening" | "/study/speaking" | "/study/grammar" | "/study/writing";
  tone: string;
};

const DAYS: Day[] = [
  {
    id: "mon",
    label: "Segunda",
    area: "Reading",
    desc: "Leitura guiada com textos e interpretação.",
    icon: <BookOpen className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/reading",
    tone: "bg-study-reading/12 text-study-reading",
  },
  {
    id: "tue",
    label: "Terça",
    area: "Listening",
    desc: "Treino de escuta com áudios e transcrições.",
    icon: <Headphones className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/listening",
    tone: "bg-study-listening/12 text-study-listening",
  },
  {
    id: "wed",
    label: "Quarta",
    area: "Speaking",
    desc: "Fala guiada e prática de pronúncia.",
    icon: <Mic className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/speaking",
    tone: "bg-study-speaking/12 text-study-speaking",
  },
  {
    id: "thu",
    label: "Quinta",
    area: "Gramática",
    desc: "Fundamentos e exercícios de estrutura.",
    icon: <Sparkles className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/grammar",
    tone: "bg-study-grammar/12 text-study-grammar",
  },
  {
    id: "fri",
    label: "Sexta",
    area: "Writing",
    desc: "Escreva uma redação e receba correção com IA.",
    icon: <PenLine className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/writing",
    tone: "bg-study-writing/12 text-study-writing",
  },
];

function todayId(): string {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[new Date().getDay()];
}

function weekDates() {
  const now = new Date();
  const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  return DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { ...day, date: date.getDate() };
  });
}

function formattedToday() {
  const value = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StudyIndex() {
  const today = todayId();
  const { exam_visible } = useAppSettings();
  const current = DAYS.find((day) => day.id === today) ?? DAYS[0];
  const dates = weekDates();

  return (
    <main className="study-page mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-primary">{formattedToday()}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Estudos</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Um foco por dia, no seu ritmo.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border bg-surface-elevated px-3 py-2 text-xs text-muted-foreground sm:flex">
          <span className="h-2 w-2 rounded-full bg-success" />
          Semana ativa
        </div>
      </header>

      <nav aria-label="Semana de estudos" className="study-week mb-8 grid grid-cols-5 gap-1 rounded-2xl border bg-surface p-2 sm:gap-2 sm:p-3">
        {dates.map((day) => {
          const active = day.id === today;
          return (
            <Link
              key={day.id}
              to={day.to}
              aria-current={active ? "date" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 transition-colors sm:py-3 ${active ? "bg-primary text-primary-foreground shadow-study-focus" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <span className="text-[10px] font-semibold uppercase sm:text-xs">{day.label.slice(0, 3)}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10 sm:text-base">
                {day.date}
              </span>
            </Link>
          );
        })}
      </nav>

      <section aria-labelledby="today-title" className="mb-10">
        <p className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground">Foco de hoje</p>
        <Link to={current.to} className="study-focus group block overflow-hidden rounded-2xl border bg-surface-elevated p-5 transition-colors hover:border-primary/30 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${current.tone}`}>
              {current.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary">{current.label}</p>
              <h2 id="today-title" className="mt-0.5 text-xl font-semibold sm:text-2xl">{current.area}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{current.desc}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5" aria-hidden>
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
      </section>

      <section aria-labelledby="modes-title">
        <div className="mb-3 px-1">
          <h2 id="modes-title" className="text-sm font-semibold">Sua semana de inglês</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Modos organizados para cada habilidade.</p>
        </div>
        <div className="study-group overflow-hidden rounded-2xl border bg-surface">
          {DAYS.map((day) => {
            const active = day.id === today;
            return (
              <Link key={day.id} to={day.to} className="group flex min-h-20 items-center gap-3.5 border-b px-4 py-3.5 transition-colors last:border-b-0 hover:bg-accent/70 sm:px-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${day.tone}`}>
                  {day.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold">{day.area}</h3>
                    {active && <span className="text-[10px] font-semibold uppercase text-primary">Hoje</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{day.desc}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-muted-foreground sm:inline">{day.label}</span>
                  {active ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Prova mensal */}
      {exam_visible && (
      <section className="mt-10">
        <p className="mb-3 px-1 text-xs font-semibold uppercase text-muted-foreground">
          Avaliação
        </p>
        <Link
          to="/exam"
          className="group flex items-center gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:bg-accent/70 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Prova de nivelamento</p>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">25 questões para diagnosticar seu nível CEFR.</p>
          </div>
          <span className="text-xs font-medium text-primary">Mensal</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
      )}
    </main>
  );
}
