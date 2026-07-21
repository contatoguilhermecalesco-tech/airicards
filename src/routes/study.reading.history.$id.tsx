import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryDetail } from "@/components/StudyHistoryDetail";
import type { ReadingPassage, ReadingGrade } from "@/lib/reading.functions";

export const Route = createFileRoute("/study/reading/history/$id")({
  component: Page,
});

type Payload = {
  passage: ReadingPassage;
  question: string;
  guidance?: string;
  answer: string;
  grade: ReadingGrade;
};

function Page() {
  const { id } = Route.useParams();
  return (
    <StudyHistoryDetail
      subject="reading"
      id={id}
      listTo="/study/reading/history"
      eyebrow="Reading"
      renderBody={(entry) => {
        const p = entry.payload as Payload;
        if (!p?.passage) return null;
        return (
          <div className="space-y-4">
            <section className="glass-panel rounded-3xl border p-5">
              <h2 className="text-sm font-semibold">Texto</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {p.passage.text}
              </p>
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Pergunta
              </p>
              <p className="mt-1 text-sm text-foreground/90">{p.question}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                Sua resposta
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {p.answer}
              </p>
            </section>

            <section className="glass-panel rounded-3xl border p-5">
              <h2 className="text-sm font-semibold">Correção</h2>
              {p.grade.summary && (
                <p className="mt-2 text-sm text-foreground/90">{p.grade.summary}</p>
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
              {p.grade.improvements?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-amber-300/80">
                    A melhorar
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {p.grade.improvements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {p.grade.modelAnswer && (
                <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Resposta modelo
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">
                    {p.grade.modelAnswer}
                  </p>
                </div>
              )}
            </section>
          </div>
        );
      }}
    />
  );
}
