import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Plus, Trash2 } from "lucide-react";
import {
  addStudyNote,
  deleteStudyEntry,
  deleteStudyNote,
  getStudyEntry,
  useStudyHistory,
  type StudyEntry,
  type StudySubject,
} from "@/lib/study-history-store";

type Props = {
  subject: StudySubject;
  id: string;
  listTo: "/study/reading/history" | "/study/listening/history" | "/study/speaking/history";
  eyebrow: string;
  renderBody: (entry: StudyEntry) => ReactNode;
};

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreTone(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return "text-emerald-300 bg-emerald-500/10";
  if (s >= 60) return "text-amber-300 bg-amber-500/10";
  return "text-orange-300 bg-orange-500/10";
}

export function StudyHistoryDetail({
  subject,
  id,
  listTo,
  eyebrow,
  renderBody,
}: Props) {
  // Re-render on store change.
  useStudyHistory(subject);
  const entry = getStudyEntry(subject, id);
  const [note, setNote] = useState("");

  if (!entry) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link
          to={listTo}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Voltar
        </Link>
        <div className="glass-panel mt-6 rounded-3xl border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Registro não encontrado ou removido.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          to={listTo}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Histórico
        </Link>
        <button
          onClick={() => {
            if (confirm("Excluir este registro?")) {
              deleteStudyEntry(subject, entry.id);
              window.history.back();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-rose-300/90 transition hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Excluir
        </button>
      </div>

      <header className="mt-4 mb-6 flex items-start gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold ring-1 ring-white/10 ${scoreTone(entry.score)}`}
        >
          {entry.score ?? "—"}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {eyebrow} · {formatDateTime(entry.createdAt)}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{entry.title}</h1>
          {entry.level && (
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              Nível: {entry.level}
            </p>
          )}
        </div>
      </header>

      {renderBody(entry)}

      {/* Notes */}
      <section className="glass-panel mt-6 rounded-3xl border p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary/80" strokeWidth={2.25} />
          <h2 className="text-sm font-semibold">Suas anotações</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Registre lições que quer levar para os próximos exercícios.
        </p>

        <div className="mt-3 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addStudyNote(subject, entry.id, note);
                setNote("");
              }
            }}
            placeholder="Ex.: revisar linking em 'want to'"
            className="flex-1 rounded-2xl border border-border bg-surface/60 px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
          <button
            onClick={() => {
              addStudyNote(subject, entry.id, note);
              setNote("");
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Salvar
          </button>
        </div>

        {entry.notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {entry.notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-foreground/90">{n.text}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteStudyNote(subject, entry.id, n.id)}
                  className="rounded-full p-1.5 text-muted-foreground opacity-60 transition hover:bg-red-500/10 hover:text-red-300 hover:opacity-100"
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
