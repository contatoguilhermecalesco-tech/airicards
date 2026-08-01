import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";
import { monthLabel, setExamFeedback, type ExamResult } from "@/lib/exam-store";
import { analyzeExamFn } from "@/lib/exam-feedback.functions";
import type { ExamDifficulty } from "@/lib/exam.functions";

export const LEVEL_LABEL: Record<ExamDifficulty, string> = {
  A1: "Iniciante",
  A2: "Básico",
  B1: "Intermediário",
  B2: "Intermediário avançado",
  C1: "Avançado",
  C2: "Proficiente",
};

export const LEVEL_COLOR: Record<ExamDifficulty, string> = {
  A1: "from-slate-400/30 to-slate-500/10",
  A2: "from-sky-400/30 to-sky-500/10",
  B1: "from-emerald-400/30 to-emerald-500/10",
  B2: "from-amber-400/30 to-amber-500/10",
  C1: "from-fuchsia-400/30 to-fuchsia-500/10",
  C2: "from-primary/40 to-primary/10",
};

function FeedbackList({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div
        className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}
      >
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
            <span className="text-primary">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Considerações da IA sobre a prova — gera sob demanda e guarda no histórico. */
export function ExamFeedbackSection({ result }: { result: ExamResult }) {
  const profile = useCurrentProfile();
  const [loading, setLoading] = useState(false);
  const requested = useRef(false);

  async function generate() {
    if (loading) return;
    setLoading(true);
    try {
      const misses = (result.questions ?? [])
        .filter((q) => result.answers?.[q.id] !== q.answer)
        .map((q) => {
          const chosen = result.answers?.[q.id];
          return {
            prompt: q.prompt,
            correct: q.options[q.answer] ?? "",
            chosen: chosen === undefined || chosen === null ? null : (q.options[chosen] ?? null),
            skill: q.skill,
            difficulty: q.difficulty,
          };
        });
      const feedback = await analyzeExamFn({
        data: {
          profileName: profile?.name ?? "Aluno",
          monthKey: result.monthKey,
          level: result.level,
          percent: result.percent,
          score: result.score,
          total: result.total,
          breakdown: result.breakdown as Record<string, { correct: number; total: number }>,
          skills: result.skills,
          misses,
        },
      });
      setExamFeedback(result.id, { feedback });
    } catch (e) {
      setExamFeedback(result.id, {
        feedbackError: e instanceof Error ? e.message : "Falha ao gerar as considerações.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (requested.current) return;
    if (result.feedback || result.feedbackError) return;
    requested.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.id]);

  const fb = result.feedback;

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold">Considerações da IA</h2>
          <p className="text-xs text-muted-foreground">Análise do seu desempenho nesta prova</p>
        </div>
        {fb && (
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Refazer
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          Analisando suas respostas…
        </div>
      )}

      {!loading && !fb && result.feedbackError && (
        <div className="space-y-3">
          <p className="text-sm text-red-200">{result.feedbackError}</p>
          <button
            type="button"
            onClick={() => void generate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-95"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && fb && (
        <div className="space-y-3">
          <p className="text-[14px] leading-relaxed text-foreground/90">{fb.summary}</p>
          <FeedbackList
            icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />}
            title="Pontos fortes"
            items={fb.strengths}
            tone="text-emerald-300"
          />
          <FeedbackList
            icon={<Target className="h-3.5 w-3.5" strokeWidth={2.5} />}
            title="A melhorar"
            items={fb.weaknesses}
            tone="text-amber-300"
          />
          <FeedbackList
            icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />}
            title="Plano do próximo mês"
            items={fb.plan}
            tone="text-primary"
          />
          {fb.nextGoal && (
            <p className="rounded-2xl bg-white/[0.03] p-4 text-[13px] leading-relaxed text-foreground/85">
              <strong className="text-primary">Próximo objetivo: </strong>
              {fb.nextGoal}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export function ExamResultView({
  result,
  onClose,
  closeLabel = "Voltar ao início",
}: {
  result: ExamResult;
  onClose: () => void;
  closeLabel?: string;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const questions = result.questions ?? [];

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br ${LEVEL_COLOR[result.level]} ring-1 ring-white/10`}
        >
          <Trophy className="h-8 w-8" strokeWidth={2.25} />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Prova de {monthLabel(result.monthKey)}
        </p>
        <h1 className="mt-2 text-6xl font-semibold tracking-tight tabular-nums">{result.level}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{LEVEL_LABEL[result.level]}</p>
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          {result.score} de {result.total} corretas · {result.percent}%
        </p>
      </header>

      <ExamFeedbackSection result={result} />

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
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
                        <CheckCircle2
                          className="h-5 w-5 shrink-0 text-emerald-400"
                          strokeWidth={2.25}
                        />
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
          {closeLabel}
        </button>
        <Link
          to="/exam/historico"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/5"
        >
          Histórico
        </Link>
      </div>
    </main>
  );
}
