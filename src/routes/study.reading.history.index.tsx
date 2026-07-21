import { createFileRoute } from "@tanstack/react-router";
import { StudyHistoryList } from "@/components/StudyHistoryList";

export const Route = createFileRoute("/study/reading/history/")({
  component: Page,
});

function Page() {
  return (
    <StudyHistoryList
      subject="reading"
      backTo="/study/reading"
      detailTo="/study/reading/history/$id"
      eyebrow="Segunda · Reading"
      title="Seu histórico de leitura"
      description="Revise os textos que você leu, suas respostas e a correção da IA."
      backLabel="Reading"
      emptyCTA="Ler agora"
    />
  );
}
