import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/novidades")({
  component: () => <Outlet />,
});