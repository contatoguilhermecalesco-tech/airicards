import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/study/writing/history")({
  component: () => <Outlet />,
});
