import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/study/reading/history")({
  head: () => ({
    meta: [
      { title: "Histórico de Reading — airi" },
      {
        name: "description",
        content: "Revise seus textos, respostas e correções de Reading no airi.",
      },
      { property: "og:title", content: "Histórico de Reading — airi" },
      {
        property: "og:description",
        content: "Todos os seus exercícios de leitura em um só lugar.",
      },
    ],
  }),
  component: () => <Outlet />,
});
