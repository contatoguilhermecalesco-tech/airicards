import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryList } from "@/components/StudyHistoryList";

export const Route = createFileRoute("/study/listening/history")({
  head: () => ({
    meta: [
      { title: "Histórico de Listening — airi" },
      {
        name: "description",
        content: "Revise suas transcrições e correções de Listening no airi.",
      },
      { property: "og:title", content: "Histórico de Listening — airi" },
      {
        property: "og:description",
        content: "Todos os seus exercícios de compreensão auditiva em um só lugar.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <StudyHistoryList
      subject="listening"
      backTo="/study/listening"
      detailTo="/study/listening/history/$id"
      eyebrow="Terça · Listening"
      title="Seu histórico de escuta"
      description="Revise os áudios que você transcreveu e as correções da IA."
      backLabel="Listening"
      emptyCTA="Escutar agora"
    />
  );
}
