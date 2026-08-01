import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight, History, Sparkles, Trophy } from "lucide-react";
import { useExamState, monthLabel } from "@/lib/exam-store";
import { ExamResultView, LEVEL_COLOR, LEVEL_LABEL } from "@/components/exam/ExamResultView";

export const Route = createFileRoute("/exam/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de provas · airi" },
      {
        name: "description",
        content:
          "Todas as suas provas mensais de inglês: nota, nível CEFR e as considerações da IA sobre cada prova.",
      },
      { property: "og:title", content: "Histórico de provas · airi" },
      {
        property: "og:description",
        content: "Acompanhe a evolução do seu nível de inglês prova por prova.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamHistoryPage,
});

function ExamHistoryPage() {
  const { history } = useExamState();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const selected = history.find((r) => r.id === openId);
  if (selected) {
    return (
      <ExamResultView
        result={selected}
        onClose={() => setOpenId(null)}
        closeLabel="Voltar ao histórico"
      />
    );
  }

  const sorted = [...history].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <button
        type="button"
        onClick={() => void navigate({ to: "/exam" })}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} /> Prova mensal
      </button>

      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Histórico
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Suas provas mensais
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Cada prova guarda a nota, o nível CEFR estimado e as considerações da IA sobre o seu
          desempenho.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="ios-card rounded-3xl p-8 text-center">
          <History className="mx-auto h-10 w-10 text-primary/60" strokeWidth={1.75} />
          <h2 className="mt-4 text-lg font-semibold">Nenhuma prova concluída</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ao finalizar a prova do mês, ela aparece aqui com a análise completa.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="flex w-full items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${LEVEL_COLOR[r.level]} ring-1 ring-white/10`}
                >
                  <span className="text-sm font-semibold tabular-nums">{r.level}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">
                    {monthLabel(r.monthKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {r.score}/{r.total} · {r.percent}% · {LEVEL_LABEL[r.level]}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {r.feedback ? (
                      <>
                        <Sparkles className="h-3 w-3 text-primary" strokeWidth={2.5} />
                        <span className="truncate">{r.feedback.summary}</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="h-3 w-3" strokeWidth={2.5} />
                        Abra para ver as considerações da IA
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={2.25}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
