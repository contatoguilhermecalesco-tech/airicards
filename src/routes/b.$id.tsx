import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import florescerSplash from "@/assets/shop/florescer/splash-hero.jpg";
import monarcaSplash from "@/assets/shop/monarca/splash-hero.jpg";
import eclipseSplash from "@/assets/shop/eclipse/splash-hero.jpg";

// Absolute base used to build og:image URLs so WhatsApp / social scrapers
// can fetch the preview image without JS.
const PUBLIC_BASE = "https://airicards.lovable.app";

// Curated splash art per bundle id. New bundles can be added here to get
// a rich WhatsApp / social preview when shared via /b/<id>.
// PATTERN: every bundle listed here shows its splash art on WhatsApp / social
// previews instead of the site icon. Add new bundles to both maps below.
const BUNDLE_SPLASH: Record<string, string> = {
  "bundle.florescer_celestial": florescerSplash,
  "bundle.monarca_sombras": monarcaSplash,
  "bundle.eclipse_carmesim": eclipseSplash,
};

const BUNDLE_META: Record<string, { title: string; description: string }> = {
  "bundle.florescer_celestial": {
    title: "airi — Florescer Celestial",
    description:
      "Bundle exclusivo com aura, moldura, capa, overlay de sakura, véu e companheiro Kitsune. Confira na loja airi.",
  },
  "bundle.monarca_sombras": {
    title: "airi — Monarca das Sombras",
    description:
      "Bundle mítico com aura sombria, coroa do soberano, portal do monarca, exército de sombras, manto e Igris, o Cavaleiro-Sombra. Confira na loja airi.",
  },
  "bundle.eclipse_carmesim": {
    title: "airi — Véu do Crepúsculo",
    description:
      "Bundle mítico com aura do véu carmesim, coroa do crepúsculo, catedral do eclipse, rosas do crepúsculo, véu rubro, Corvo do Crepúsculo e itens de streak, selo, título, vitória e skin de mesa. Confira na loja airi.",
  },
};

// Fallback splash usada quando um bundle ainda não tem arte curada mapeada —
// garante que o WhatsApp sempre mostre uma splash art e nunca o ícone do site.
const DEFAULT_BUNDLE_SPLASH = florescerSplash;

function toAbsolute(url: string): string {
  if (!url) return `${PUBLIC_BASE}/og-default.png`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${PUBLIC_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Short share link for bundles: /b/<bundleId>
// Renders proper OG meta (splash art) then redirects to /shop?b=<id> on mount.
export const Route = createFileRoute("/b/$id")({
  component: BundleShareRedirect,
  head: ({ params }) => {
    const id = params.id;
    const meta = BUNDLE_META[id] ?? {
      title: "airi — Bundle exclusivo",
      description: "Confira este bundle exclusivo da loja airi.",
    };
    const splash = BUNDLE_SPLASH[id] ?? DEFAULT_BUNDLE_SPLASH;
    const image = toAbsolute(splash);
    const tags: Array<Record<string, string>> = [
      { title: meta.title },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: meta.title },
      { name: "twitter:description", content: meta.description },
      { name: "robots", content: "noindex" },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: meta.title },
      { name: "twitter:image", content: image },
    ];
    return { meta: tags };
  },
});

function BundleShareRedirect() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/shop", search: { b: id }, replace: true });
  }, [id, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Abrindo bundle…</p>
    </div>
  );
}
