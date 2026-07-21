import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryDetail } from "@/components/StudyHistoryDetail";
import type { SpeakingPrompt, SpeakingGrade } from "@/lib/speaking.functions";

export const Route = createFileRoute("/study/speaking/history/$id")({
  component: Page,
});

type Payload = {
  prompt: SpeakingPrompt;
  spoken: string;
  grade: SpeakingGrade;
};

function Page() {
  const { id } = Route.useParams();
  return (
    <StudyHistoryDetail
      subject="speaking"
      id={id}
      listTo="/study/speaking/history"
      eyebrow="Speaking"
      renderBody={(entry) => {
        const p = entry.payload as Payload;
        if (!p?.prompt) return null;
        return (
          <div className="space-y-4">
            <section className="glass-panel rounded-3xl border p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Situação
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {p.prompt.prompt}
              </p>
              {p.prompt.modelAnswer && (
                <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Modelo
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">
                    {p.prompt.modelAnswer}
                  </p>
                  {p.prompt.translation && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.prompt.translation}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Sua fala
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {p.spoken}
              </p>
              {p.grade.refinedAttempt && p.grade.refinedAttempt !== p.spoken && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Provavelmente você disse:{" "}
                  <span className="text-foreground/90">
                    {p.grade.refinedAttempt}
                  </span>
                </p>
              )}
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <h2 className="text-sm font-semibold">Análise</h2>
              {p.grade.fidelity && (
                <p className="mt-2 text-sm text-foreground/90">{p.grade.fidelity}</p>
              )}
              {p.grade.strengths?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-emerald-300/80">
                    Pontos fortes
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {p.grade.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.grade.issues?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-wider text-amber-300/80">
                    Palavras a revisar
                  </p>
                  {p.grade.issues.map((it, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/5 bg-black/20 p-3 text-sm"
                    >
                      <p className="font-medium text-foreground/90">{it.word}</p>
                      <p className="text-muted-foreground">{it.problem}</p>
                      {it.tip && (
                        <p className="mt-1 text-xs text-emerald-300/80">{it.tip}</p>
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
