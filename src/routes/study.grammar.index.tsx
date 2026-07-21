import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Check,
  X,
  Lightbulb,
  Loader2,
  RotateCcw,
  Trophy,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useCycleWeek, getGrammarForWeek } from "@/lib/cycle";
import { generateGrammarLesson, type GrammarLesson, type GrammarExercise } from "@/lib/grammar.functions";
import { useGrammarProgress, saveLesson, addAttempt, getBestScoreForWeek } from "@/lib/grammar-store";

export const Route = createFileRoute("/study/grammar/")({
  component: GrammarPage,
});

type StringMap = Record<string, string>;
type BoolMap = Record<string, boolean>;
type FeedbackMap = Record<string, "correct" | "wrong">;

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.!?]$/, "");
}

function GrammarPage() {
  const cycle = useCycleWeek();
  const [selectedWeek, setSelectedWeek] = useState(cycle?.week ?? 1);
  const progress = useGrammarProgress();
  const lesson = progress.lessons[String(selectedWeek)];
  const attempts = useMemo(
    () => progress.attempts.filter((a) => a.week === selectedWeek),
    [progress.attempts, selectedWeek],
  );
  const bestScore = useMemo(() => getBestScoreForWeek(selectedWeek), [selectedWeek, progress.attempts]);

  useEffect(() => {
    if (cycle) setSelectedWeek(cycle.week);
  }, [cycle?.week]);

  const [answers, setAnswers] = useState<StringMap>({});
  const [checked, setChecked] = useState<BoolMap>({});
  const [feedback, setFeedback] = useState<FeedbackMap>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const generate = useServerFn(generateGrammarLesson);
  const grammar = getGrammarForWeek(selectedWeek);

  useEffect(() => {
    setAnswers({});
    setChecked({});
    setFeedback({});
    setCompleted(false);
    setError(null);
  }, [selectedWeek, lesson?.topic]);

  async function onGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const result = await generate({
        data: {
          week: selectedWeek,
          topic: grammar.topic,
          application: grammar.application,
          level: "intermediate",
        },
      });
      saveLesson(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar aula.");
    } finally {
      setGenerating(false);
    }
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function checkExercise(ex: GrammarExercise) {
    const user = answers[ex.id] ?? "";
    const ok = normalizeAnswer(user) === normalizeAnswer(ex.answer);
    setChecked((prev) => ({ ...prev, [ex.id]: true }));
    setFeedback((prev) => ({ ...prev, [ex.id]: ok ? "correct" : "wrong" }));
  }

  function resetExercise(id: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setChecked((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const allChecked = lesson ? lesson.exercises.every((e) => checked[e.id]) : false;
  const score = lesson ? lesson.exercises.filter((e) => feedback[e.id] === "correct").length : 0;

  function onComplete() {
    if (!lesson) return;
    addAttempt({
      week: lesson.week,
      topic: lesson.topic,
      score,
      total: lesson.exercises.length,
    });
    setCompleted(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/study"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Áreas de estudo
        </Link>
      </div>

      <header className="mt-4 mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400/30 to-fuchsia-500/10 ring-1 ring-white/10">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Quinta · Gramática</p>
          <h1 className="text-2xl font-semibold tracking-tight">Trilha de gramática</h1>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-sm text-muted-foreground">
          Escolha a semana para estudar o bloco de gramática do ciclo RRSLG.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => {
            const active = w === selectedWeek;
            const block = getGrammarForWeek(w);
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-left transition ${
                  active
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border bg-surface/40 text-muted-foreground hover:border-white/15 hover:text-foreground"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Semana {w}</span>
                <span className="hidden text-xs sm:inline">· {block.topic}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="glass-panel relative overflow-hidden rounded-3xl border p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-400/20 to-violet-500/10 opacity-60"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Bloco da semana {selectedWeek}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{grammar.topic}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{grammar.application}</p>
            </div>
            {bestScore !== null && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                <Trophy className="h-3.5 w-3.5" strokeWidth={2.25} />
                {Math.round(bestScore)}%
              </div>
            )}
          </div>

          {!lesson && !generating && (
            <div className="mt-6">
              <button
                onClick={onGenerate}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Gerar aula da semana {selectedWeek}
              </button>
              {attempts.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Você já fez {attempts.length} tentativa{attempts.length > 1 ? "s" : ""} nesta semana.
                </p>
              )}
            </div>
          )}

          {generating && (
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              Criando aula com IA…
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {lesson && (
        <div className="mt-6 space-y-6">
          <section className="glass-panel rounded-3xl border p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-fuchsia-300" strokeWidth={2.25} />
              <h3 className="font-semibold">Explicação</h3>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {lesson.explanation}
            </p>

            {lesson.examples.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exemplos</p>
                {lesson.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/60 bg-surface/40 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">{ex.en}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{ex.pt}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Exercícios</h3>
              {completed && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  Aula concluída · {score}/{lesson.exercises.length}
                </span>
              )}
            </div>

            {lesson.exercises.map((ex, idx) => {
              const isChecked = checked[ex.id];
              const status = feedback[ex.id];
              return (
                <div
                  key={ex.id}
                  className={`glass-panel rounded-3xl border p-5 transition ${
                    isChecked
                      ? status === "correct"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium leading-relaxed">{ex.question}</p>
                  </div>

                  {ex.type === "multiple-choice" && ex.options && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {ex.options.map((opt) => {
                        const selected = answers[ex.id] === opt;
                        return (
                          <button
                            key={opt}
                            disabled={isChecked}
                            onClick={() => setAnswer(ex.id, opt)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              selected
                                ? "border-primary/50 bg-primary/15 text-foreground"
                                : "border-border bg-surface/30 text-foreground/90 hover:border-white/15 hover:bg-surface/60"
                            } ${isChecked ? "opacity-80" : ""}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ex.type === "fill-blank" && (
                    <input
                      type="text"
                      disabled={isChecked}
                      value={answers[ex.id] ?? ""}
                      onChange={(e) => setAnswer(ex.id, e.target.value)}
                      placeholder="Complete a frase…"
                      className="mt-4 w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[16px] outline-none transition focus:border-primary/50 disabled:opacity-70"
                    />
                  )}

                  {!isChecked ? (
                    <button
                      onClick={() => checkExercise(ex)}
                      disabled={!answers[ex.id]}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      Verificar
                      <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {status === "correct" ? (
                          <>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                              <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
                            </div>
                            <span className="text-sm font-medium text-emerald-300">Correto</span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">
                              <X className="h-3.5 w-3.5 text-rose-300" strokeWidth={3} />
                            </div>
                            <span className="text-sm font-medium text-rose-300">Incorreto</span>
                            <span className="text-sm text-muted-foreground">
                              Resposta: <span className="text-foreground">{ex.answer}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-start gap-2 rounded-2xl bg-white/5 p-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={2.25} />
                        <p className="text-sm leading-relaxed text-foreground/85">{ex.explanation}</p>
                      </div>
                      <button
                        onClick={() => resetExercise(ex.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Tentar de novo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!completed && allChecked && (
              <button
                onClick={onComplete}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Concluir aula · {score}/{lesson.exercises.length}
              </button>
            )}

            {completed && (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <Trophy className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={2.25} />
                <p className="mt-3 text-lg font-semibold text-foreground">
                  Aula da semana {selectedWeek} concluída!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você acertou {score} de {lesson.exercises.length} exercícios.
                </p>
                <button
                  onClick={onGenerate}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium transition hover:bg-surface"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                  Gerar nova aula
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
