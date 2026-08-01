import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
  ChevronRight,
} from "lucide-react";
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
import { useCurrentProfile } from "@/lib/profile";
import { useAppSettings } from "@/lib/app-settings";
import { generateMonthlyExam } from "@/lib/exam.functions";
import {
  useExamState,
  getMonthKey,
  monthLabel,
  startExam,
  answerCurrent,
  goToIndex,
  finishExam,
  cancelExam,
  getAvoidList,
  hasCompletedExamThisMonth,
  getResultForMonth,
} from "@/lib/exam-store";
import type { ExamDifficulty } from "@/lib/exam.functions";

export const Route = createFileRoute("/exam")({
  head: () => ({
    meta: [
      { title: "Prova de nível · airi" },
      {
        name: "description",
        content:
          "Prova mensal de nivelamento em inglês — 25 questões geradas por IA para diagnosticar seu nível CEFR.",
      },
      { property: "og:title", content: "Prova de nível · airi" },
      {
        property: "og:description",
        content: "Descubra seu nível de inglês com uma prova mensal completa.",
      },
    ],
  }),
  component: ExamPage,
});

const LEVEL_LABEL: Record<ExamDifficulty, string> = {
  A1: "Iniciante",
  A2: "Básico",
  B1: "Intermediário",
  B2: "Intermediário avançado",
  C1: "Avançado",
  C2: "Proficiente",
};

const LEVEL_COLOR: Record<ExamDifficulty, string> = {
  A1: "from-slate-400/30 to-slate-500/10",
  A2: "from-sky-400/30 to-sky-500/10",
  B1: "from-emerald-400/30 to-emerald-500/10",
  B2: "from-amber-400/30 to-amber-500/10",
  C1: "from-fuchsia-400/30 to-fuchsia-500/10",
  C2: "from-primary/40 to-primary/10",
};

function ExamPage() {
  const profile = useCurrentProfile();
  const state = useExamState();
  const { exam_visible } = useAppSettings();
  const isAdmin = profile?.id === "guilherme";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const monthKey = getMonthKey();
  const alreadyDone = hasCompletedExamThisMonth(monthKey);
  const currentResult = getResultForMonth(monthKey);

  async function start() {
    if (!profile) return;
    setError(null);
    setLoading(true);
    try {
      const { questions } = await generateMonthlyExam({
        data: {
          monthKey,
          profileName: profile.name,
          avoid: getAvoidList(),
        },
      });
      startExam(questions, monthKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar a prova.");
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    finishExam();
    setConfirmFinish(false);
    setShowResult(true);
  }

  if (state.current) {
    return (
      <>
        <ExamRunner
          onFinish={() => setConfirmFinish(true)}
          onCancel={() => cancelExam()}
        />
        <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar prova?</AlertDialogTitle>
              <AlertDialogDescription>
                Ao finalizar, o resultado é calculado e a prova deste mês é fechada.
                Você só poderá refazer no próximo mês.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar respondendo</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinish}>Finalizar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }


  if (showResult && currentResult) {
    return (
      <ResultView
        result={currentResult}
        onClose={() => {
          setShowResult(false);
          void navigate({ to: "/" });
        }}
      />
    );
  }

  if (!exam_visible && !isAdmin) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="ios-card rounded-3xl p-8">
          <Sparkles className="mx-auto h-10 w-10 text-primary/60" strokeWidth={1.75} />
          <h1 className="mt-4 text-xl font-semibold">Prova indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A prova de nivelamento está pausada no momento. Volte em breve.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} /> Início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <button
        type="button"
        onClick={() => void navigate({ to: "/" })}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} /> Voltar
      </button>

      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Prova mensal · {monthLabel(monthKey)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Descubra seu nível de inglês
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Uma prova completa com <strong className="text-foreground">25 questões</strong>{" "}
          geradas por IA — vocabulário, gramática, leitura e escuta — para diagnosticar
          seu nível CEFR de A1 a C2. Feita uma vez por mês, com questões sempre novas.
        </p>
      </header>

      {alreadyDone && currentResult && (
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${LEVEL_COLOR[currentResult.level]} ring-1 ring-white/10`}>
              <Trophy className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Você já concluiu a prova deste mês
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {currentResult.level}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {LEVEL_LABEL[currentResult.level]}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowResult(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:opacity-80"
          >
            Ver detalhes da prova <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </section>
      )}

      <section className="glass-panel rounded-3xl border p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Como funciona</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary">•</span> 25 questões de múltipla escolha, com dificuldade progressiva (A1 → C2).</li>
          <li className="flex gap-2"><span className="text-primary">•</span> Cada questão avalia uma habilidade: gramática, vocabulário, leitura, escuta, phrasal verbs, collocations e uso.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> No fim, a IA calcula seu nível CEFR e mostra os pontos fortes e a melhorar.</li>
          <li className="flex gap-2"><span className="text-primary">•</span> Disponível uma vez por mês — todo dia 1° uma nova prova é liberada.</li>
        </ul>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading || alreadyDone}
          onClick={() => void start()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-background transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              Preparando prova personalizada…
            </>
          ) : alreadyDone ? (
            <>Prova concluída — volte no dia 1° do próximo mês</>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              Iniciar prova
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Reserve cerca de 15-20 minutos sem distrações.
        </p>
      </section>

      <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar prova?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao finalizar, o resultado é calculado e a prova deste mês é fechada.
              Você só poderá refazer no próximo mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar respondendo</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinish}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function ExamRunner({ onFinish, onCancel }: { onFinish: () => void; onCancel: () => void }) {
  const state = useExamState();
  const current = state.current!;
  const total = current.questions.length;
  const index = Math.max(0, Math.min(total - 1, current.currentIndex));
  const q = current.questions[index];
  const totalAnswered = current.questions.filter(
    (item) => current.answers[item.id] !== undefined && current.answers[item.id] !== null,
  ).length;
  const isLast = index === total - 1;
  const selected = q ? current.answers[q.id] : undefined;

  useEffect(() => {
    if (current.currentIndex !== index) goToIndex(index);
  }, [current.currentIndex, index]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  if (!q) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="ios-card rounded-3xl p-8">
          <h1 className="text-xl font-semibold">Prova indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível carregar as questões desta prova. Cancele e inicie novamente.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Cancelar prova
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm("Cancelar prova? Todo o progresso será perdido.")) onCancel();
          }}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          Cancelar
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold tabular-nums text-muted-foreground">
          <span>{current.currentIndex + 1}</span>
          <span className="text-muted-foreground/50">/</span>
          <span>{current.questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-500"
          style={{ width: `${((current.currentIndex + 1) / current.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {q.skill.replace("-", " ")}
        </span>
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          {q.difficulty}
        </span>
      </div>

      {q.context && (
        <blockquote className="mb-5 rounded-2xl border-l-2 border-primary/40 bg-white/[0.03] p-4 text-[14px] leading-relaxed text-foreground/85">
          {q.context}
        </blockquote>
      )}

      <h2 className="mb-6 text-[19px] font-semibold leading-snug tracking-tight text-foreground sm:text-[21px]">
        {q.prompt}
      </h2>

      <div className="space-y-2.5">
        {q.options.map((opt, idx) => {
          const isSel = selected === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => answerCurrent(idx)}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-[15px] transition ${
                isSel
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-white/[0.06] bg-white/[0.025] text-foreground/90 hover:border-white/[0.12] hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-semibold ${
                  isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/15 text-muted-foreground"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goToIndex(current.currentIndex - 1)}
          disabled={current.currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-sm text-foreground transition hover:bg-white/[0.05] disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} /> Anterior
        </button>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {totalAnswered}/{current.questions.length} respondidas
        </p>
        {isLast ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={totalAnswered < current.questions.length}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
          >
            Finalizar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goToIndex(current.currentIndex + 1)}
            disabled={selected === undefined || selected === null}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-95 disabled:opacity-40"
          >
            Próxima <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
      </div>
    </main>
  );
}

function ResultView({
  result,
  onClose,
}: {
  result: NonNullable<ReturnType<typeof getResultForMonth>>;
  onClose: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const questions = result.questions ?? [];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br ${LEVEL_COLOR[result.level]} ring-1 ring-white/10`}>
          <Trophy className="h-8 w-8" strokeWidth={2.25} />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Prova de {monthLabel(result.monthKey)}
        </p>
        <h1 className="mt-2 text-6xl font-semibold tracking-tight tabular-nums">
          {result.level}
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">{LEVEL_LABEL[result.level]}</p>
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          {result.score} de {result.total} corretas · {result.percent}%
        </p>
      </header>

      {/* Breakdown por dificuldade */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Por dificuldade
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(["A1", "A2", "B1", "B2", "C1", "C2"] as ExamDifficulty[]).map((d) => {
            const b = result.breakdown[d];
            if (!b) return null;
            const pct = Math.round((b.correct / b.total) * 100);
            return (
              <div key={d} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{d}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {b.correct}/{b.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Breakdown por skill */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Por habilidade
        </h2>
        <div className="space-y-2">
          {Object.entries(result.skills).map(([skill, s]) => {
            const pct = Math.round((s.correct / s.total) * 100);
            return (
              <div
                key={skill}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"
              >
                <span className="w-32 text-xs font-medium capitalize text-foreground">
                  {skill.replace("-", " ")}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
                  {s.correct}/{s.total}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {questions.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setReviewOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:opacity-80"
          >
            {reviewOpen ? "Ocultar" : "Revisar"} respostas
            <ChevronRight
              className={`h-4 w-4 transition-transform ${reviewOpen ? "rotate-90" : ""}`}
              strokeWidth={2.25}
            />
          </button>
          {reviewOpen && (
            <div className="mt-4 space-y-3">
              {questions.map((q, i) => {
                const ans = result.answers?.[q.id];
                const ok = ans === q.answer;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
                  >
                    <div className="flex items-start gap-2">
                      {ok ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2.25} />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-red-400" strokeWidth={2.25} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {i + 1}. {q.skill} · {q.difficulty}
                        </p>
                        <p className="mt-1 text-sm text-foreground">{q.prompt}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Correta: <span className="text-emerald-300">{q.options[q.answer]}</span>
                          {!ok && ans !== undefined && ans !== null && (
                            <>
                              {" · "}
                              Sua: <span className="text-red-300">{q.options[ans]}</span>
                            </>
                          )}
                        </p>
                        {q.explanation && (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition hover:brightness-95"
        >
          Voltar ao início
        </button>
        <Link
          to="/study"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/5"
        >
          Estudar
        </Link>
      </div>
    </main>
  );
}
