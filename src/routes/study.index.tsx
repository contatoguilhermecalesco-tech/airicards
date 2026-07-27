import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Headphones, Mic, PenLine, Sparkles } from "lucide-react";
import { useAppSettings } from "@/lib/app-settings";

export const Route = createFileRoute("/study/")({
  component: StudyIndex,
});

type Day = {
  id: string;
  label: string;
  area: string;
  desc: string;
  icon: React.ReactNode;
  to?: string;
  accent: string;
};

const DAYS: Day[] = [
  {
    id: "mon",
    label: "Segunda",
    area: "Reading",
    desc: "Leitura guiada com textos e interpretação.",
    icon: <BookOpen className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/reading",
    accent: "from-sky-400/25 to-sky-500/10",
  },
  {
    id: "tue",
    label: "Terça",
    area: "Listening",
    desc: "Treino de escuta com áudios e transcrições.",
    icon: <Headphones className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/listening",
    accent: "from-emerald-400/25 to-emerald-500/10",
  },
  {
    id: "wed",
    label: "Quarta",
    area: "Speaking",
    desc: "Fala guiada e prática de pronúncia.",
    icon: <Mic className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/speaking",
    accent: "from-orange-400/25 to-orange-500/10",
  },
  {
    id: "thu",
    label: "Quinta",
    area: "Gramática",
    desc: "Fundamentos e exercícios de estrutura.",
    icon: <Sparkles className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/grammar",
    accent: "from-fuchsia-400/25 to-fuchsia-500/10",
  },
  {
    id: "fri",
    label: "Sexta",
    area: "Writing",
    desc: "Escreva uma redação e receba correção com IA.",
    icon: <PenLine className="h-5 w-5" strokeWidth={2.25} />,
    to: "/study/writing",
    accent: "from-violet-400/30 to-violet-500/10",
  },
];

function todayId(): string {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[new Date().getDay()];
}

function StudyIndex() {
  const today = todayId();
  const { exam_visible } = useAppSettings();
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Áreas de estudo</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Sua semana de inglês
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Um foco por dia — construindo o idioma sem sobrecarga.
        </p>
      </header>

      <div className="grid gap-3">
        {DAYS.map((d) => {
          const active = d.id === today;
          const available = Boolean(d.to);
          const content = (
            <div
              className={`glass-panel relative overflow-hidden rounded-3xl border p-5 transition ${
                available ? "hover:border-white/20" : "opacity-70"
              }`}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${d.accent} opacity-60`}
              />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  {d.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {d.label}
                    </span>
                    {active && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        Hoje
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-lg font-semibold">{d.area}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
                </div>
                {!available && (
                  <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                )}
              </div>
              {!available && (
                <p className="relative mt-3 text-xs text-muted-foreground">Em breve</p>
              )}
            </div>
          );
          return d.to ? (
            <Link key={d.id} to={d.to} className="block">
              {content}
            </Link>
          ) : (
            <div key={d.id}>{content}</div>
          );
        })}
      </div>

      {/* Prova mensal */}
      {exam_visible && (
      <section className="mt-8">
        <p className="mb-3 px-1 text-xs uppercase tracking-wider text-muted-foreground">
          Avaliação
        </p>
        <Link
          to="/exam"
          className="glass-panel relative block overflow-hidden rounded-3xl border p-5 transition hover:border-primary/30"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/[0.05] opacity-60"
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25 text-primary">
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Todo mês
              </span>
              <p className="mt-0.5 text-lg font-semibold">Prova de nivelamento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                25 questões geradas por IA para diagnosticar seu nível CEFR.
              </p>
            </div>
          </div>
        </Link>
      </section>
      )}
    </main>
  );
}
