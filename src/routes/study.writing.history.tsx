import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Trash2, MessageSquare } from "lucide-react";
import { useWritings, deleteWriting } from "@/lib/writing-store";

export const Route = createFileRoute("/study/writing/history")({
  component: HistoryPage,
});

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300 bg-emerald-500/10";
  if (score >= 60) return "text-amber-300 bg-amber-500/10";
  return "text-orange-300 bg-orange-500/10";
}

function HistoryPage() {
  const writings = useWritings();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        to="/study/writing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Writing
      </Link>

      <header className="mt-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Sexta · Writing
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Seu histórico de textos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revise seus textos, veja os erros anteriores e adicione anotações
          próprias para consolidar o aprendizado.
        </p>
      </header>

      {writings.length === 0 ? (
        <div className="glass-panel rounded-3xl border p-8 text-center">
          <FileText
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
            strokeWidth={2}
          />
          <p className="text-sm text-muted-foreground">
            Ainda não há textos por aqui. Escreva o primeiro e ele aparece
            automaticamente.
          </p>
          <Link
            to="/study/writing"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Escrever agora
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {writings.map((w) => {
            const preview =
              (w.prompt ? `${w.prompt} — ` : "") +
              w.text.slice(0, 140) +
              (w.text.length > 140 ? "…" : "");
            const issues = w.feedback.issues?.length ?? 0;
            return (
              <li key={w.id}>
                <Link
                  to="/study/writing/history/$id"
                  params={{ id: w.id }}
                  className="glass-panel group relative block rounded-3xl border p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1 ring-white/10 ${scoreTone(w.feedback.score)}`}
                    >
                      {w.feedback.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {formatDate(w.createdAt)}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{issues} correções</span>
                          {w.notes.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-primary/80">
                              <MessageSquare className="h-3 w-3" strokeWidth={2.25} />
                              {w.notes.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">
                        {preview}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Excluir este texto do histórico?")) {
                          deleteWriting(w.id);
                        }
                      }}
                      className="rounded-full p-2 text-muted-foreground opacity-60 transition hover:bg-red-500/10 hover:text-red-300 hover:opacity-100"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
