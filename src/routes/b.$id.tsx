import { createFileRoute, redirect } from "@tanstack/react-router";

// Short share link for bundles: /b/<bundleId> → /shop?b=<bundleId>
export const Route = createFileRoute("/b/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/shop", search: { b: params.id } });
  },
  head: () => ({
    meta: [
      { title: "airi — Bundle" },
      { name: "description", content: "Confira este bundle exclusivo da loja airi." },
      { property: "og:title", content: "airi — Bundle exclusivo" },
      { property: "og:description", content: "Confira este bundle exclusivo da loja airi." },
      { name: "robots", content: "noindex" },
    ],
  }),
});
