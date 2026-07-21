import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryDetail } from "@/components/StudyHistoryDetail";
import type { ListeningPassage, ListeningGrade } from "@/lib/listening.functions";

export const Route = createFileRoute("/study/listening/history/$id")({
  component: Page,
});

type Payload = {
  passage: ListeningPassage;
  attempt: string;
  grade: ListeningGrade;
};

function Page() {
  const { id } = Route.useParams();
  return (
    <StudyHistoryDetail
      subject="listening"
      id={id}
      listTo="/study/listening/history"
      eyebrow="Listening"
      renderBody={(entry) => {
        const p = entry.payload as Payload;
        if (!p?.passage) return null;
        return (
          <div className="space-y-4">
            <section className="glass-panel rounded-3xl border p-5">
              <h2 className="text-sm font-semibold">Transcrição original</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {p.passage.transcript}
              </p>
              {p.passage.translation && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.passage.translation}
                </p>
              )}
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Sua transcrição
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {p.attempt}
              </p>
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <h2 className="text-sm font-semibold">Análise</h2>
              {p.grade.accuracy && (
                <p className="mt-2 text-sm text-foreground/90">{p.grade.accuracy}</p>
              )}
              {p.grade.strengths?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-emerald-300/80">
                    O que você captou bem
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {p.grade.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.grade.misses?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-wider text-amber-300/80">
                    Trechos difíceis
                  </p>
                  {p.grade.misses.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/5 bg-black/20 p-3 text-sm"
                    >
                      <p>
                        <span className="text-muted-foreground">Você ouviu: </span>
                        <span className="text-rose-200">{m.heard}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Era: </span>
                        <span className="text-emerald-200">{m.actual}</span>
                      </p>
                      {m.tip && (
                        <p className="mt-1 text-xs text-muted-foreground">{m.tip}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {p.grade.advice && (
                <p className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3 text-sm text-foreground/90">
                  {p.grade.advice}
                </p>
              )}
            </section>
          </div>
        );
      }}
    />
  );
}
