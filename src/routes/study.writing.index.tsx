import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PenLine,
  Sparkles,
  ArrowLeft,
  Check,
  Lightbulb,
  Target,
  AlertCircle,
  Loader2,
  History,
  Library,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { correctWriting, type WritingFeedback } from "@/lib/writing.functions";
import { addWriting } from "@/lib/writing-store";
import { createCard, useStore } from "@/lib/flashcards-store";

export const Route = createFileRoute("/study/writing/")({
  component: WritingPage,
});


function WritingPage() {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate",
  );
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCorrect = useServerFn(correctWriting);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= 10 && !loading;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    setFeedback(null);
    try {
      const result = await runCorrect({
        data: { text: text.trim(), prompt: prompt.trim() || undefined, level },
      });
      setFeedback(result);
      addWriting({
        text: text.trim(),
        prompt: prompt.trim() || undefined,
        level,
        feedback: result,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao corrigir.");
    } finally {
      setLoading(false);
    }
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
        <Link
          to="/study/writing/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-foreground/90 transition hover:bg-accent"
        >
          <History className="h-3.5 w-3.5" strokeWidth={2.25} />
          Histórico
        </Link>
      </div>

      <header className="mt-4 mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/30 to-violet-500/10 ring-1 ring-white/10">
          <PenLine className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Sexta · Writing
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Escreva. Corrija. Evolua.
          </h1>
        </div>
      </header>

      {!feedback && (
        <section className="glass-panel rounded-3xl border p-5">
          <label className="block text-sm font-medium">Tema (opcional)</label>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex.: Describe your perfect weekend"
            className="mt-2 w-full rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[16px] outline-none transition focus:border-primary/50"
          />


          <div className="mt-5 flex items-center justify-between">
            <label className="text-sm font-medium">Seu texto em inglês</label>
            <span className="text-xs text-muted-foreground">
              {wordCount} palavras {wordCount < 10 && "· mín. 10"}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write freely — mistakes are welcome. That's how you learn."
            rows={10}
            className="mt-2 w-full resize-y rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[16px] leading-relaxed outline-none transition focus:border-primary/50"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Nível:</span>
            {(["beginner", "intermediate", "advanced"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  level === l
                    ? "bg-primary/20 text-primary"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "beginner" ? "Iniciante" : l === "intermediate" ? "Intermediário" : "Avançado"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                Corrigindo…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Corrigir com IA
              </>
            )}
          </button>
        </section>
      )}

      {feedback && (
        <FeedbackView
          feedback={feedback}
          originalText={text}
          prompt={prompt}
          onRestart={() => {
            setFeedback(null);
          }}
          onNew={() => {
            setFeedback(null);
            setText("");
            setPrompt("");
          }}
        />
      )}
    </main>
  );
}

function FeedbackView({
  feedback,
  originalText,
  prompt,
  onRestart,
  onNew,
}: {
  feedback: WritingFeedback;
  originalText: string;
  prompt: string;
  onRestart: () => void;
  onNew: () => void;
}) {
  const scoreColor =
    feedback.score >= 80
      ? "text-emerald-300"
      : feedback.score >= 60
        ? "text-amber-300"
        : "text-orange-300";

  return (
    <div className="space-y-4">
      {/* Score + overall */}
      <section className="glass-panel relative overflow-hidden rounded-3xl border p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-400/20 to-transparent"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <span className={`text-2xl font-bold ${scoreColor}`}>{feedback.score}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Feedback do professor
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">
              {feedback.overallFeedback}
            </p>
          </div>
        </div>
      </section>

      {/* Corrected version */}
      {feedback.correctedText && (
        <section className="glass-panel rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-300" strokeWidth={2.5} />
            Versão corrigida
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {feedback.correctedText}
          </p>
        </section>
      )}

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <section className="glass-panel rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-emerald-300" strokeWidth={2.25} />
            O que já está bom
          </div>
          <ul className="mt-3 space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-emerald-300">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Issues (the teaching core) */}
      {feedback.issues.length > 0 && (
        <section className="glass-panel rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-300" strokeWidth={2.25} />
            Erros e como corrigir ({feedback.issues.length})
          </div>
          <div className="mt-3 space-y-3">
            {feedback.issues.map((iss, i) => (
              <article
                key={i}
                className="rounded-2xl border border-border bg-surface/40 p-4"
              >
                <div className="mb-2 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {iss.type}
                </div>
                <div className="grid gap-1.5 text-sm">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Original:</span>
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[13px] text-red-200 line-through decoration-red-400/50">
                      {iss.original}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Correção:</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[13px] text-emerald-200">
                      {iss.correction}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">
                  {iss.explanation}
                </p>
                {iss.tip && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-primary/10 p-3 text-[13px] text-foreground/90">
                    <Lightbulb
                      className="h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2.25}
                    />
                    <span>
                      <span className="font-medium">Dica: </span>
                      {iss.tip}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Improvements */}
      {feedback.improvements.length > 0 && (
        <section className="glass-panel rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-sky-300" strokeWidth={2.25} />
            Pontos de melhoria
          </div>
          <ul className="mt-3 space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-sky-300">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Next steps */}
      {feedback.nextSteps.length > 0 && (
        <section className="glass-panel rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={2.25} />
            Próximos passos
          </div>
          <ul className="mt-3 space-y-2">
            {feedback.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-primary">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SaveToDeckPanel
        originalText={originalText}
        prompt={prompt}
        feedback={feedback}
      />


      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium transition hover:bg-accent"
        >
          Revisar meu texto
        </button>
        <button
          onClick={onNew}
          className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Escrever outro
        </button>
      </div>
    </div>
  );
}

function SaveToDeckPanel({
  originalText,
  prompt,
  feedback,
}: {
  originalText: string;
  prompt: string;
  feedback: WritingFeedback;
}) {
  const decks = useStore((s) => s.decks);
  const [open, setOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<string>(decks[0]?.id ?? "");
  const [saveCorrected, setSaveCorrected] = useState(true);
  const [pickedIssues, setPickedIssues] = useState<Record<number, boolean>>({});
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const source = useMemo(() => {
    const base = "Writing";
    return prompt.trim() ? `${base} · ${prompt.trim().slice(0, 60)}` : base;
  }, [prompt]);

  const issueCount = feedback.issues.length;
  const pickedIssueCount = Object.values(pickedIssues).filter(Boolean).length;
  const totalToSave = (saveCorrected && feedback.correctedText ? 1 : 0) + pickedIssueCount;

  function toggleIssue(i: number) {
    setPickedIssues((p) => ({ ...p, [i]: !p[i] }));
  }
  function selectAllIssues(v: boolean) {
    const next: Record<number, boolean> = {};
    feedback.issues.forEach((_, i) => (next[i] = v));
    setPickedIssues(next);
  }

  function save() {
    if (!selectedDeck || totalToSave === 0) return;
    let n = 0;
    if (saveCorrected && feedback.correctedText) {
      createCard(selectedDeck, originalText.trim(), feedback.correctedText.trim(), {
        mode: "sentence",
        source,
      });
      n++;
    }
    feedback.issues.forEach((iss, i) => {
      if (!pickedIssues[i]) return;
      const back = iss.explanation
        ? `${iss.correction}\n\n${iss.explanation}`
        : iss.correction;
      const isSentence = /\s/.test(iss.original) || iss.original.length > 24;
      createCard(selectedDeck, iss.original, back, {
        mode: isSentence ? "sentence" : "word",
        source: `${source} · ${iss.type}`,
      });
      n++;
    });
    setSavedCount(n);
    setPickedIssues({});
  }

  return (
    <section className="glass-panel mt-4 rounded-3xl border p-5">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center gap-2 text-left"
      >
        <Library className="h-4 w-4 text-sky-300" strokeWidth={2.25} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Salvar como cartas
        </p>
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          {decks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <p className="text-muted-foreground">
                Você ainda não tem decks. Crie um na biblioteca para salvar
                cartas a partir do seu texto.
              </p>
              <Link
                to="/library"
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/15"
              >
                <Plus className="h-3.5 w-3.5" /> Ir para biblioteca
              </Link>
            </div>
          ) : (
            <>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Deck
              </label>
              <select
                value={selectedDeck}
                onChange={(e) => {
                  setSelectedDeck(e.target.value);
                  setSavedCount(null);
                }}
                className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-sky-400/40"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {feedback.correctedText && (
                <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                  <input
                    type="checkbox"
                    checked={saveCorrected}
                    onChange={(e) => setSaveCorrected(e.target.checked)}
                    className="mt-0.5 accent-sky-400"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-foreground/90">
                      Texto completo (seu original → versão corrigida)
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      {feedback.correctedText}
                    </span>
                  </span>
                </label>
              )}

              {issueCount > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Correções ({issueCount})
                    </p>
                    <div className="flex gap-1 text-[11px]">
                      <button
                        onClick={() => selectAllIssues(true)}
                        className="rounded-full px-2 py-1 text-sky-300 hover:bg-sky-400/10"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => selectAllIssues(false)}
                        className="rounded-full px-2 py-1 text-muted-foreground hover:bg-white/5"
                      >
                        Nenhum
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {feedback.issues.map((iss, i) => (
                      <li key={i}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                          <input
                            type="checkbox"
                            checked={!!pickedIssues[i]}
                            onChange={() => toggleIssue(i)}
                            className="mt-0.5 accent-sky-400"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-1.5">
                              <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[12px] text-red-200 line-through decoration-red-400/50">
                                {iss.original}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[12px] text-emerald-200">
                                {iss.correction}
                              </span>
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={save}
                disabled={totalToSave === 0}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {totalToSave === 0
                  ? "Selecione ao menos 1 item"
                  : `Salvar ${totalToSave} carta${totalToSave > 1 ? "s" : ""} no deck`}
              </button>

              {savedCount !== null && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  {savedCount} {savedCount === 1 ? "carta adicionada" : "cartas adicionadas"} ao deck.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
