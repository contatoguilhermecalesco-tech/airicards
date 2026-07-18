import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Target,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  Trash2,
  PenLine,
  Save,
} from "lucide-react";
import {
  useWritings,
  addNote,
  deleteNote,
  deleteWriting,
  setRevisedText,
} from "@/lib/writing-store";

export const Route = createFileRoute("/study/writing/history/$id")({
  component: HistoryDetailPage,
});

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryDetailPage() {
  const { id } = Route.useParams();
  const writings = useWritings();
  const navigate = useNavigate();
  const entry = writings.find((w) => w.id === id);

  const [noteDraft, setNoteDraft] = useState("");
  const [revisedDraft, setRevisedDraft] = useState<string | null>(null);

  if (!entry) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link
          to="/study/writing/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Histórico
        </Link>
        <div className="glass-panel mt-6 rounded-3xl border p-8 text-center text-sm text-muted-foreground">
          Este texto não foi encontrado (pode ter sido apagado).
        </div>
      </main>
    );
  }

  const fb = entry.feedback;
  const scoreColor =
    fb.score >= 80
      ? "text-emerald-300"
      : fb.score >= 60
        ? "text-amber-300"
        : "text-orange-300";

  const revised = revisedDraft ?? entry.revisedText ?? "";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/study/writing/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Histórico
        </Link>
        <button
          onClick={() => {
            if (confirm("Excluir este texto do histórico?")) {
              deleteWriting(entry.id);
              void navigate({ to: "/study/writing/history" });
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-red-500/40 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Excluir
        </button>
      </div>

      <header className="mt-4 mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {formatDate(entry.createdAt)}
          {entry.level && ` · ${entry.level}`}
        </p>
        {entry.prompt && (
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {entry.prompt}
          </h1>
        )}
      </header>

      {/* Score + feedback */}
      <section className="glass-panel relative overflow-hidden rounded-3xl border p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-400/20 to-transparent"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <span className={`text-2xl font-bold ${scoreColor}`}>{fb.score}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Feedback do professor
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">
              {fb.overallFeedback}
            </p>
          </div>
        </div>
      </section>

      {/* Original text */}
      <section className="glass-panel mt-3 rounded-3xl border p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <PenLine className="h-4 w-4 text-foreground/80" strokeWidth={2.25} />
          Seu texto original
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {entry.text}
        </p>
      </section>

      {/* Corrected */}
      {fb.correctedText && (
        <section className="glass-panel mt-3 rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-300" strokeWidth={2.5} />
            Versão corrigida
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {fb.correctedText}
          </p>
        </section>
      )}

      {/* Issues */}
      {fb.issues.length > 0 && (
        <section className="glass-panel mt-3 rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-300" strokeWidth={2.25} />
            Erros e correções ({fb.issues.length})
          </div>
          <div className="mt-3 space-y-3">
            {fb.issues.map((iss, i) => (
              <article key={i} className="rounded-2xl border border-border bg-surface/40 p-4">
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
                    <Lightbulb className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
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

      {/* Strengths / improvements / nextSteps */}
      {fb.strengths.length > 0 && (
        <section className="glass-panel mt-3 rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-emerald-300" strokeWidth={2.25} />
            O que já está bom
          </div>
          <ul className="mt-3 space-y-2">
            {fb.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-emerald-300">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fb.improvements.length > 0 && (
        <section className="glass-panel mt-3 rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-sky-300" strokeWidth={2.25} />
            Pontos de melhoria
          </div>
          <ul className="mt-3 space-y-2">
            {fb.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-sky-300">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fb.nextSteps.length > 0 && (
        <section className="glass-panel mt-3 rounded-3xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={2.25} />
            Próximos passos
          </div>
          <ul className="mt-3 space-y-2">
            {fb.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span className="text-primary">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Minha revisão */}
      <section className="glass-panel mt-3 rounded-3xl border p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <PenLine className="h-4 w-4 text-primary" strokeWidth={2.25} />
          Minha revisão
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Reescreva o texto do seu jeito aplicando o que aprendeu. Salvo só pra
          você.
        </p>
        <textarea
          value={revised}
          onChange={(e) => setRevisedDraft(e.target.value)}
          placeholder="Rewrite your text applying the corrections…"
          rows={6}
          className="mt-3 w-full resize-y rounded-2xl border border-border bg-surface/50 px-4 py-3 text-[16px] leading-relaxed outline-none transition focus:border-primary/50"
        />
        <button
          onClick={() => {
            setRevisedText(entry.id, revised);
            setRevisedDraft(null);
          }}
          disabled={revisedDraft === null}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-4 w-4" strokeWidth={2.25} />
          Salvar revisão
        </button>
      </section>

      {/* Anotações */}
      <section className="glass-panel mt-3 rounded-3xl border p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary" strokeWidth={2.25} />
          Anotações ({entry.notes.length})
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Escreva lembretes, dúvidas ou aprendizados sobre este texto.
        </p>

        <div className="mt-3 flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && noteDraft.trim()) {
                addNote(entry.id, noteDraft);
                setNoteDraft("");
              }
            }}
            placeholder="Adicionar uma anotação…"
            className="flex-1 rounded-2xl border border-border bg-surface/50 px-4 py-2.5 text-[16px] outline-none transition focus:border-primary/50"
          />
          <button
            onClick={() => {
              if (!noteDraft.trim()) return;
              addNote(entry.id, noteDraft);
              setNoteDraft("");
            }}
            disabled={!noteDraft.trim()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>

        {entry.notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {entry.notes.map((n) => (
              <li
                key={n.id}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-surface/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">
                    {n.text}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(entry.id, n.id)}
                  className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                  aria-label="Excluir anotação"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
