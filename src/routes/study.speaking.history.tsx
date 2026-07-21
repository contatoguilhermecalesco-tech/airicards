import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryList } from "@/components/StudyHistoryList";

export const Route = createFileRoute("/study/speaking/history")({
  head: () => ({
    meta: [
      { title: "Histórico de Speaking — airi" },
      {
        name: "description",
        content: "Revise suas falas e correções de Speaking no airi.",
      },
      { property: "og:title", content: "Histórico de Speaking — airi" },
      {
        property: "og:description",
        content: "Todos os seus exercícios de fala em um só lugar.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <StudyHistoryList
      subject="speaking"
      backTo="/study/speaking"
      detailTo="/study/speaking/history/$id"
      eyebrow="Quarta · Speaking"
      title="Seu histórico de fala"
      description="Revise o que você falou, o modelo esperado e a análise da IA."
      backLabel="Speaking"
      emptyCTA="Falar agora"
    />
  );
}
