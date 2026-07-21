import { createFileRoute, Outlet } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});
