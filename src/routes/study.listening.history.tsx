import { createFileRoute, Outlet } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});
