import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { Home, Library, LogOut, Shield, GraduationCap, Settings2, Swords, Trophy } from "lucide-react";

import appCss from "../styles.css?url";
import airiLogo from "../assets/airi-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ProfileGate } from "../components/ProfileGate";
import { NotificationsBell } from "../components/NotificationsBell";
import { useCurrentProfile, signOutProfile } from "../lib/profile";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Tentar de novo
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#231e2c" },
      { title: "airi" },
      {
        name: "description",
        content:
          "Aprenda inglês com repetição!!!",
      },
      {
        property: "og:title",
        content: "airi",
      },
      {
        property: "og:description",
        content:
          "Aprenda inglês com repetição!!!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "airi" },
      { name: "twitter:description", content: "Aprenda inglês com repetição!!!" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/fSE9nIncamQ6thBvnCyu3ZzOV1N2/social-images/social-1784155934586-72e471ee-7eec-482a-853f-99c18d7552c9.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/fSE9nIncamQ6thBvnCyu3ZzOV1N2/social-images/social-1784155934586-72e471ee-7eec-482a-853f-99c18d7552c9.webp" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Navegação responsiva:
 * - Mobile (<640px): TopBar minimalista (logo + notificações + perfil) e
 *   BottomBar fixa com os 4 destinos principais, respeitando safe-area do iOS.
 * - Desktop (≥640px): tudo consolidado no topo, sem barra inferior.
 * Todos os alvos clicáveis usam `tap-target` (>=44x44) para ergonomia touch.
 */
function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isReview = pathname.startsWith("/review");
  if (isReview) return null;

  const linkClass = (active: boolean) =>
    `tap-target inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
      active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-panel border-b">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-[clamp(0.75rem,4vw,1.5rem)] py-2.5">
          <Link to="/" className="tap-target flex items-center gap-2.5" aria-label="airi — início">
            <img
              src={airiLogo.url}
              alt=""
              className="h-10 w-10 rounded-2xl object-contain sm:h-11 sm:w-11"
            />
            <span className="text-[17px] font-semibold lowercase tracking-tight">
              airi
            </span>
          </Link>
          {/* Navegação principal — visível só em ≥sm; no mobile vai para BottomBar */}
          <div className="hidden items-center gap-1 sm:flex">
            <Link to="/" className={linkClass(pathname === "/")}>
              <Home className="h-4 w-4" strokeWidth={2.25} />
              <span>Início</span>
            </Link>
            <Link
              to="/library"
              className={linkClass(pathname.startsWith("/library"))}
            >
              <Library className="h-4 w-4" strokeWidth={2.25} />
              <span>Biblioteca</span>
            </Link>
            <Link
              to="/study"
              className={linkClass(pathname.startsWith("/study"))}
            >
              <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
              <span>Estudo</span>
            </Link>
            <Link
              to="/enemies"
              className={linkClass(pathname.startsWith("/enemies"))}
            >
              <Swords className="h-4 w-4" strokeWidth={2.25} />
              <span>Inimigas</span>
            </Link>
            <Link
              to="/rank"
              className={linkClass(pathname.startsWith("/rank"))}
            >
              <Trophy className="h-4 w-4" strokeWidth={2.25} />
              <span>Rank</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationsBell />
            <ProfileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}

/**
 * Barra inferior fixa (mobile). Escondida em ≥sm.
 * Grid de 4 colunas iguais para hierarquia visual previsível independente
 * do tamanho do texto (fluid), sempre com área de toque ≥44px.
 */
function BottomBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isReview = pathname.startsWith("/review");
  if (isReview) return null;

  const items = [
    { to: "/", label: "Início", icon: Home, active: pathname === "/" },
    { to: "/library", label: "Biblioteca", icon: Library, active: pathname.startsWith("/library") },
    { to: "/study", label: "Estudo", icon: GraduationCap, active: pathname.startsWith("/study") },
    { to: "/enemies", label: "Inimigas", icon: Swords, active: pathname.startsWith("/enemies") },
    { to: "/rank", label: "Rank", icon: Trophy, active: pathname.startsWith("/rank") },
  ] as const;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 sm:hidden"
    >
      <div className="glass-panel border-t safe-bottom">
        <ul className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-2 pt-1.5">
          {items.map(({ to, label, icon: Icon, active }) => (
            <li key={to}>
              <Link
                to={to}
                className={`tap-target flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition ${active ? "text-primary" : ""}`}
                  strokeWidth={2.25}
                />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function ProfileMenu() {
  const profile = useCurrentProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!profile) return null;

  return (
    <div ref={ref} className="relative ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="tap-target flex items-center gap-2 rounded-full border border-border bg-surface/80 py-1 pl-1 pr-2 text-sm font-medium text-foreground transition hover:bg-accent sm:pr-3"
        aria-label={`Perfil de ${profile.name}`}
      >
        <span
          aria-hidden
          className="h-6 w-9 rounded-full ring-1 ring-white/10 sm:w-10"
          style={{ backgroundImage: profile.gradient }}
        />
        <span className="hidden sm:inline">{profile.name}</span>
      </button>
      {open && (
        <div className="glass-panel absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5 shadow-card">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">Conectado como</p>
            <p className="text-sm font-medium">{profile.name}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="tap-target flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
          >
            <Settings2 className="h-4 w-4" strokeWidth={2.25} />
            Preferências
          </Link>
          {profile.id === "guilherme" && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="tap-target flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
            >
              <Shield className="h-4 w-4" strokeWidth={2.25} />
              Admin
            </Link>
          )}
          <button
            onClick={() => {
              setOpen(false);
              signOutProfile();
            }}
            className="tap-target flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} />
            Trocar de perfil
          </button>
        </div>
      )}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileGate>
        {/*
          Layout base:
          - min-h-dvh cobre 100% da altura visível no Safari mobile (sem "salto" da barra).
          - pb-24 no mobile reserva espaço para a BottomBar fixa; sm:pb-0 desativa em desktop.
        */}
        <div className="min-h-dvh pb-24 sm:pb-0">
          <TopBar />
          <Outlet />
          <BottomBar />
        </div>
      </ProfileGate>
    </QueryClientProvider>
  );
}
