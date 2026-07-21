import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  GraduationCap,
  Target,
  Layers,
  AlertTriangle,
  Scale,
  Library,
  Flag,
  Eye,
  EyeOff,
  MessageCircle,
  NotebookPen,
  History,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useCycleWeek, getGrammarForWeek } from "@/lib/cycle";
import {
  generateGrammarLesson,
  type GrammarLesson,
  type GrammarExercise,
} from "@/lib/grammar.functions";
import { askGrammarTutor } from "@/lib/grammar-tutor.functions";
import {
  useGrammarProgress,
  saveLesson,
  addAttempt,
  getBestScoreForWeek,
  setNote,
  appendChatMessage,
  clearChat,
  deleteAttempt,
  type GrammarChatMessage,
  type GrammarAttempt,
} from "@/lib/grammar-store";

export const Route = createFileRoute("/study/grammar/")({
  component: GrammarPage,
});

type StringMap = Record<string, string>;
type BoolMap = Record<string, boolean>;
type FeedbackMap = Record<string, "correct" | "wrong">;
type Tab = "aula" | "exercicios" | "tutor" | "notas" | "historico" | "resumo";

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?;,"']+$/g, "")
    .replace(/^[.!?;,"']+/g, "");
}

function exerciseIsCorrect(ex: GrammarExercise, user: string): boolean {
  const u = normalizeAnswer(user);
  if (!u) return false;
  const candidates = [ex.answer, ...(ex.acceptedAnswers ?? [])].map(normalizeAnswer);
  return candidates.includes(u);
}

function ensureLessonShape(lesson: GrammarLesson | undefined): GrammarLesson | undefined {
  if (!lesson) return undefined;
  return {
    ...lesson,
    introduction: lesson.introduction ?? lesson.explanation ?? "",
    objectives: lesson.objectives ?? [],
    sections: lesson.sections ?? [],
    contrasts: lesson.contrasts ?? [],
    commonMistakes: lesson.commonMistakes ?? [],
    examples: lesson.examples ?? [],
    glossary: lesson.glossary ?? [],
    nextSteps: lesson.nextSteps ?? [],
    exercises: lesson.exercises ?? [],
    summary: lesson.summary ?? "",
  };
}

const TYPE_LABEL: Record<GrammarExercise["type"], string> = {
  "multiple-choice": "Múltipla escolha",
  "fill-blank": "Preenchimento",
  "error-correction": "Correção de erro",
  "translation-en-pt": "Tradução EN → PT",
  "translation-pt-en": "Tradução PT → EN",
  transformation: "Transformação",
};

function GrammarPage() {
  const cycle = useCycleWeek();
  const [selectedWeek, setSelectedWeek] = useState(cycle?.week ?? 1);
  const progress = useGrammarProgress();
  const rawLesson = progress.lessons[String(selectedWeek)];
  const lesson = useMemo(() => ensureLessonShape(rawLesson), [rawLesson]);
  const attempts = useMemo(
    () => progress.attempts.filter((a) => a.week === selectedWeek),
    [progress.attempts, selectedWeek],
  );
  const bestScore = useMemo(
    () => getBestScoreForWeek(selectedWeek),
    [selectedWeek, progress.attempts],
  );

  useEffect(() => {
    if (cycle) setSelectedWeek(cycle.week);
  }, [cycle?.week]);

  const [tab, setTab] = useState<Tab>("aula");
  const [answers, setAnswers] = useState<StringMap>({});
  const [checked, setChecked] = useState<BoolMap>({});
  const [feedback, setFeedback] = useState<FeedbackMap>({});
  const [revealHints, setRevealHints] = useState<BoolMap>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const generate = useServerFn(generateGrammarLesson);
  const grammar = getGrammarForWeek(selectedWeek);

  useEffect(() => {
    setAnswers({});
    setChecked({});
    setFeedback({});
    setRevealHints({});
    setCompleted(false);
    setError(null);
    setTab("aula");
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
    const ok = exerciseIsCorrect(ex, user);
    setChecked((prev) => ({ ...prev, [ex.id]: true }));
    setFeedback((prev) => ({ ...prev, [ex.id]: ok ? "correct" : "wrong" }));
  }

  function resetExercise(id: string) {
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setChecked((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setFeedback((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  const allChecked = lesson ? lesson.exercises.every((e) => checked[e.id]) : false;
  const score = lesson
    ? lesson.exercises.filter((e) => feedback[e.id] === "correct").length
    : 0;
  const total = lesson?.exercises.length ?? 0;
  const scorePct = total ? Math.round((score / total) * 100) : 0;

  function onComplete() {
    if (!lesson) return;
    addAttempt({
      week: lesson.week,
      topic: lesson.topic,
      score,
      total: lesson.exercises.length,
    });
    setCompleted(true);
    setTab("resumo");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 pb-24">
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
          <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Quinta · Gramática
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Trilha de gramática</h1>
        </div>
      </header>

      <section className="mb-6">
        <p className="text-sm text-muted-foreground">
          Escolha a semana para uma aula completa — no estilo de professor universitário.
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
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Semana {w}
                </span>
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Bloco da semana {selectedWeek}
              </p>
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
                Gerar aula completa da semana {selectedWeek}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                A aula inclui explicação em camadas, contrastes com o português, erros
                comuns, glossário e 12 exercícios variados.
              </p>
              {attempts.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Você já fez {attempts.length} tentativa{attempts.length > 1 ? "s" : ""}{" "}
                  nesta semana.
                </p>
              )}
            </div>
          )}

          {generating && (
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              Preparando aula completa com IA…
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
        <>
          <nav className="sticky top-2 z-20 mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface/80 p-1 backdrop-blur-xl">
            {(
              [
                { id: "aula", label: "Aula" },
                { id: "exercicios", label: `Exercícios · ${total}` },
                { id: "tutor", label: "Tutor" },
                { id: "notas", label: "Notas" },
                { id: "historico", label: "Histórico" },
                { id: "resumo", label: "Resumo" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "aula" && <LessonView lesson={lesson} onStart={() => setTab("exercicios")} />}
          {tab === "tutor" && (
            <TutorView
              week={selectedWeek}
              lesson={lesson}
              chat={progress.chats?.[String(selectedWeek)] ?? []}
            />
          )}
          {tab === "notas" && (
            <NotesView
              week={selectedWeek}
              value={progress.notes?.[String(selectedWeek)] ?? ""}
            />
          )}
          {tab === "historico" && (
            <HistoryView attempts={attempts} onDelete={(id: string) => deleteAttempt(id)} />
          )}


          {tab === "exercicios" && (
            <div className="mt-6 space-y-4">
              {lesson.exercises.map((ex, idx) => {
                const isChecked = checked[ex.id];
                const status = feedback[ex.id];
                const showHint = revealHints[ex.id];
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
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-foreground">
                          {idx + 1}
                        </span>
                        {TYPE_LABEL[ex.type]}
                      </span>
                      {ex.hint && !isChecked && (
                        <button
                          onClick={() =>
                            setRevealHints((p) => ({ ...p, [ex.id]: !p[ex.id] }))
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
                        >
                          {showHint ? (
                            <EyeOff className="h-3 w-3" strokeWidth={2.25} />
                          ) : (
                            <Eye className="h-3 w-3" strokeWidth={2.25} />
                          )}
                          Dica
                        </button>
                      )}
                    </div>

                    {ex.prompt && (
                      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-fuchsia-300/90">
                        {ex.prompt}
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                      {ex.question}
                    </p>

                    {showHint && ex.hint && !isChecked && (
                      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3">
                        <Lightbulb
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                          strokeWidth={2.25}
                        />
                        <p className="text-xs leading-relaxed text-amber-100/90">{ex.hint}</p>
                      </div>
                    )}

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

                    {ex.type !== "multiple-choice" && (
                      <textarea
                        disabled={isChecked}
                        value={answers[ex.id] ?? ""}
                        onChange={(e) => setAnswer(ex.id, e.target.value)}
                        placeholder={
                          ex.type === "fill-blank"
                            ? "Complete a lacuna…"
                            : ex.type === "translation-pt-en"
                            ? "Escreva sua tradução em inglês…"
                            : ex.type === "translation-en-pt"
                            ? "Escreva sua tradução em português…"
                            : "Escreva a frase corrigida ou reescrita…"
                        }
                        rows={ex.type === "fill-blank" ? 1 : 2}
                        className="mt-4 w-full resize-none rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[15px] outline-none transition focus:border-primary/50 disabled:opacity-70"
                      />
                    )}

                    {!isChecked ? (
                      <button
                        onClick={() => checkExercise(ex)}
                        disabled={!answers[ex.id]?.trim()}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        Verificar
                        <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {status === "correct" ? (
                            <>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                                <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
                              </div>
                              <span className="text-sm font-medium text-emerald-300">
                                Correto
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">
                                <X className="h-3.5 w-3.5 text-rose-300" strokeWidth={3} />
                              </div>
                              <span className="text-sm font-medium text-rose-300">Incorreto</span>
                              <span className="text-sm text-muted-foreground">
                                Resposta:{" "}
                                <span className="font-medium text-foreground">{ex.answer}</span>
                              </span>
                            </>
                          )}
                        </div>
                        {ex.acceptedAnswers && ex.acceptedAnswers.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Também aceito: {ex.acceptedAnswers.join(" · ")}
                          </p>
                        )}
                        <div className="flex items-start gap-2 rounded-2xl bg-white/5 p-3">
                          <Lightbulb
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                            strokeWidth={2.25}
                          />
                          <p className="text-sm leading-relaxed text-foreground/85">
                            {ex.explanation}
                          </p>
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

              <div className="glass-panel sticky bottom-3 rounded-2xl border p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>
                    {Object.keys(checked).length}/{total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(Object.keys(checked).length / Math.max(1, total)) * 100}%`,
                    }}
                  />
                </div>
                {!completed && allChecked && (
                  <button
                    onClick={onComplete}
                    className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                  >
                    Concluir aula · {score}/{total} ({scorePct}%)
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "resumo" && (
            <SummaryView
              lesson={lesson}
              score={score}
              total={total}
              scorePct={scorePct}
              completed={completed}
              onRegenerate={onGenerate}
              onReview={() => setTab("aula")}
            />
          )}
        </>
      )}
    </main>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-3xl border p-5">
      <div className="flex items-center gap-2">
        <span className="text-fuchsia-300">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function LessonView({ lesson, onStart }: { lesson: GrammarLesson; onStart: () => void }) {
  return (
    <div className="mt-6 space-y-5">
      {lesson.introduction && (
        <SectionCard icon={<BookOpen className="h-4 w-4" strokeWidth={2.25} />} title="Abertura">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {lesson.introduction}
          </p>
        </SectionCard>
      )}

      {lesson.objectives.length > 0 && (
        <SectionCard
          icon={<Target className="h-4 w-4" strokeWidth={2.25} />}
          title="Objetivos desta aula"
        >
          <ul className="space-y-2">
            {lesson.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {lesson.sections.map((s, i) => (
        <SectionCard
          key={i}
          icon={<Layers className="h-4 w-4" strokeWidth={2.25} />}
          title={s.title}
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {s.content}
          </p>
        </SectionCard>
      ))}

      {lesson.formation && (
        <SectionCard
          icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} />}
          title="Formação da estrutura"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["Afirmativa", lesson.formation.affirmative],
                ["Negativa", lesson.formation.negative],
                ["Interrogativa", lesson.formation.interrogative],
                ["Forma curta", lesson.formation.short],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-surface/40 p-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">{val}</p>
                </div>
              ))}
          </div>
          {lesson.formation.notes && lesson.formation.notes.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {lesson.formation.notes.map((n, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  · {n}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {lesson.contrasts.length > 0 && (
        <SectionCard
          icon={<Scale className="h-4 w-4" strokeWidth={2.25} />}
          title="Contrastes importantes"
        >
          <div className="space-y-4">
            {lesson.contrasts.map((c, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.title}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[c.a, c.b].map((side, j) => (
                    <div
                      key={j}
                      className="rounded-2xl border border-border/60 bg-surface/40 p-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300/90">
                        {side.label}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{side.example}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Quando: {side.when}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {lesson.commonMistakes.length > 0 && (
        <SectionCard
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={2.25} />}
          title="Erros comuns de brasileiros"
        >
          <div className="space-y-3">
            {lesson.commonMistakes.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-surface/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300 line-through decoration-rose-400/60">
                    {m.wrong}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                    {m.right}
                  </span>
                </div>
                {m.why && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.why}</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {lesson.register && (
        <SectionCard icon={<Flag className="h-4 w-4" strokeWidth={2.25} />} title="Registro e uso">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {lesson.register}
          </p>
        </SectionCard>
      )}

      {lesson.examples.length > 0 && (
        <SectionCard
          icon={<Library className="h-4 w-4" strokeWidth={2.25} />}
          title="Exemplos comentados"
        >
          <div className="space-y-3">
            {lesson.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-surface/40 p-4"
              >
                <p className="text-sm font-medium text-foreground">{ex.en}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ex.pt}</p>
                {ex.note && (
                  <p className="mt-2 text-xs italic text-fuchsia-300/90">↳ {ex.note}</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {lesson.glossary.length > 0 && (
        <SectionCard
          icon={<BookOpen className="h-4 w-4" strokeWidth={2.25} />}
          title="Glossário"
        >
          <dl className="space-y-2">
            {lesson.glossary.map((g, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] px-3 py-2">
                <dt className="text-sm font-semibold text-foreground">{g.term}</dt>
                <dd className="text-xs leading-relaxed text-muted-foreground">
                  {g.definition}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      )}

      <button
        onClick={onStart}
        className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
      >
        Ir para os exercícios →
      </button>
    </div>
  );
}

function SummaryView({
  lesson,
  score,
  total,
  scorePct,
  completed,
  onRegenerate,
  onReview,
}: {
  lesson: GrammarLesson;
  score: number;
  total: number;
  scorePct: number;
  completed: boolean;
  onRegenerate: () => void;
  onReview: () => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      {completed && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <Trophy className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={2.25} />
          <p className="mt-3 text-lg font-semibold text-foreground">
            Aula concluída · {score}/{total} ({scorePct}%)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {scorePct >= 80
              ? "Excelente domínio — pronto para aplicar em produção."
              : scorePct >= 60
              ? "Bom progresso. Revise os erros e refaça em breve."
              : "Reveja a explicação e refaça — a repetição é o segredo."}
          </p>
        </div>
      )}

      {lesson.summary && (
        <SectionCard
          icon={<BookOpen className="h-4 w-4" strokeWidth={2.25} />}
          title="Resumo da aula"
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {lesson.summary}
          </p>
        </SectionCard>
      )}

      {lesson.nextSteps.length > 0 && (
        <SectionCard
          icon={<Target className="h-4 w-4" strokeWidth={2.25} />}
          title="Próximos passos"
        >
          <ul className="space-y-2">
            {lesson.nextSteps.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onReview}
          className="flex-1 rounded-2xl border border-border bg-surface/60 py-3 text-sm font-medium transition hover:bg-surface"
        >
          Revisar a aula
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          Gerar nova aula
        </button>
      </div>
    </div>
  );
}

// ---------------- Tutor Chat ----------------

function TutorView({
  week,
  lesson,
  chat,
}: {
  week: number;
  lesson: GrammarLesson;
  chat: GrammarChatMessage[];
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askGrammarTutor);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setError(null);
    appendChatMessage(week, { role: "user", content: question });
    setLoading(true);
    try {
      const history = chat.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const { answer } = await ask({
        data: {
          week,
          topic: lesson.topic,
          application: lesson.application,
          lessonSummary: lesson.summary || lesson.introduction,
          question,
          history,
        },
      });
      appendChatMessage(week, { role: "assistant", content: answer });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao consultar o tutor.");
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    `Me dê 3 exemplos práticos de ${lesson.topic}.`,
    "Qual o erro mais comum de brasileiros aqui?",
    "Contraste esse tópico com o português.",
    "Como usar isso em uma conversa informal?",
  ];

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="glass-panel rounded-3xl border p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400/30 to-violet-500/10 ring-1 ring-white/10">
            <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Tutor de gramática</p>
            <p className="text-xs text-muted-foreground">
              Pergunte qualquer dúvida sobre <span className="text-foreground">{lesson.topic}</span>.
              O tutor conhece o conteúdo desta aula.
            </p>
          </div>
          {chat.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Limpar toda a conversa desta semana?")) clearChat(week);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" strokeWidth={2.25} />
              Limpar
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="glass-panel max-h-[55vh] min-h-[240px] overflow-y-auto rounded-3xl border p-4"
      >
        {chat.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <MessageCircle className="h-8 w-8 text-fuchsia-300/70" strokeWidth={1.75} />
            <p className="text-sm text-muted-foreground">
              Sem dúvidas registradas ainda. Comece com uma sugestão:
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border bg-surface/40 px-3 py-1.5 text-xs text-foreground/85 transition hover:border-white/20 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {chat.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
              O tutor está pensando…
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="glass-panel sticky bottom-2 rounded-3xl border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Pergunte algo sobre esta aula…"
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border border-border bg-surface/40 px-4 py-3 text-sm outline-none transition focus:border-primary/50"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            aria-label="Enviar"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.25} />
            )}
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: GrammarChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${
          isUser
            ? "bg-primary/20 text-foreground ring-primary/30"
            : "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-500/25"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : (
          <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/15 text-foreground"
            : "border border-border bg-surface/60 text-foreground/90"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

// ---------------- Notes ----------------

function NotesView({ week, value }: { week: number; value: string }) {
  const [draft, setDraft] = useState(value);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [week, value]);

  useEffect(() => {
    if (draft === value) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setNote(week, draft);
      setSavedAt(Date.now());
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, week, value]);

  return (
    <div className="mt-6 space-y-4">
      <div className="glass-panel rounded-3xl border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-fuchsia-500/10 ring-1 ring-white/10">
            <NotebookPen className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Suas anotações</p>
            <p className="text-xs text-muted-foreground">
              Sincronizadas na nuvem. Uma anotação por semana.
            </p>
          </div>
          {savedAt && (
            <span className="text-[11px] text-emerald-300">Salvo</span>
          )}
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Escreva aqui suas anotações da aula: exemplos que te marcaram, dúvidas, insights…"
        rows={16}
        className="w-full resize-y rounded-3xl border border-border bg-surface/40 p-5 text-[15px] leading-relaxed outline-none transition focus:border-primary/50"
      />

      <p className="px-1 text-[11px] text-muted-foreground">
        {draft.length} caractere{draft.length === 1 ? "" : "s"} · salva automaticamente
      </p>
    </div>
  );
}

// ---------------- History ----------------

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function HistoryView({
  attempts,
  onDelete,
}: {
  attempts: GrammarAttempt[];
  onDelete: (id: string) => void;
}) {
  if (attempts.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface/40 p-8 text-center">
        <History className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.75} />
        <p className="mt-3 text-sm font-medium">Sem tentativas ainda</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Complete a lista de exercícios para registrar aqui.
        </p>
      </div>
    );
  }

  const avg =
    attempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) / attempts.length;
  const best = Math.max(...attempts.map((a) => (a.score / a.total) * 100));

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Tentativas", value: attempts.length.toString() },
          { label: "Média", value: `${Math.round(avg)}%` },
          { label: "Melhor", value: `${Math.round(best)}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface/40 p-3 text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-2">
        {attempts.map((a) => {
          const pct = Math.round((a.score / a.total) * 100);
          const tone =
            pct >= 80
              ? "text-emerald-300 bg-emerald-500/15"
              : pct >= 60
              ? "text-amber-300 bg-amber-500/15"
              : "text-rose-300 bg-rose-500/15";
          return (
            <li
              key={a.id}
              className="glass-panel flex items-center gap-3 rounded-2xl border p-3"
            >
              <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${tone}`}>
                {pct}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.topic}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.score}/{a.total} · {formatDate(a.completedAt)}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remover essa tentativa do histórico?")) onDelete(a.id);
                }}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-white/5 hover:text-rose-300"
                aria-label="Excluir tentativa"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
