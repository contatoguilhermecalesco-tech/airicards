import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Trash2, MessageSquare, ChevronRight } from "lucide-react";
import {
  deleteStudyEntry,
  useStudyHistory,
  type StudySubject,
} from "@/lib/study-history-store";

type DetailPath =
  | "/study/reading/history/$id"
  | "/study/listening/history/$id"
  | "/study/speaking/history/$id";

type Props = {
  subject: StudySubject;
  backTo: "/study/reading" | "/study/listening" | "/study/speaking";
  detailTo: DetailPath;
  eyebrow: string;
  title: string;
  description: string;
  backLabel: string;
  emptyCTA: string;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
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

export function StudyHistoryList({
  subject,
  backTo,
  detailTo,
  eyebrow,
  title,
  description,
  backLabel,
  emptyCTA,
}: Props) {
  const entries = useStudyHistory(subject);
  const navigate = useNavigate();

  const goToDetail = (id: string) => {
    // Resolve the $id template to a concrete URL so navigation works
    // regardless of how the router matches dynamic `to` templates.
    const url = detailTo.replace("$id", encodeURIComponent(id));
    navigate({ to: url } as never);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        {backLabel}
      </Link>

      <header className="mt-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      {entries.length === 0 ? (
        <div className="glass-panel rounded-3xl border p-8 text-center">
          <FileText
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
            strokeWidth={2}
          />
          <p className="text-sm text-muted-foreground">
            Ainda não há registros por aqui. Complete um exercício e ele
            aparece automaticamente.
          </p>
          <Link
            to={backTo}
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {emptyCTA}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => goToDetail(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    goToDetail(e.id);
                  }
                }}
                className="glass-panel group relative block cursor-pointer rounded-3xl border p-4 transition hover:border-primary/40 active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1 ring-white/10 ${scoreTone(e.score)}`}
                  >
                    {e.score ?? "—"}
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {formatDate(e.createdAt)}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {e.level && <span className="capitalize">{e.level}</span>}
                        {e.notes.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-primary/80">
                            <MessageSquare className="h-3 w-3" strokeWidth={2.25} />
                            {e.notes.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">
                      {e.title}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary/80">
                      Abrir exercício
                      <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (confirm("Excluir este registro do histórico?")) {
                      deleteStudyEntry(subject, e.id);
                    }
                  }}
                  className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground opacity-60 transition hover:bg-red-500/10 hover:text-red-300 hover:opacity-100"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
