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
import { useEffect, useState, useRef, Suspense, lazy, type ReactNode } from "react";
import { Home, Library, LogOut, Shield, GraduationCap, Settings2, Swords, Trophy, Users2, MoreHorizontal, Sparkles, X, ChevronRight, ShoppingBag, Gem, UserRound } from "lucide-react";
import { useChangelogUnread, initChangelog } from "../lib/changelog-store";

import appCss from "../styles.css?url";
import airiLogo from "../assets/airi-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ProfileGate } from "../components/ProfileGate";
import { NotificationsBell } from "../components/NotificationsBell";
import { RankEmblem } from "../components/RankBadge";
import { useRank, TIER_LABEL, DIVISION_ROMAN, TIER_COLORS, isElite } from "../lib/rank-store";
import { useCurrentProfile, signOutProfile } from "../lib/profile";
import "@/lib/presence";

// Overlays só aparecem sob eventos raros (subiu de rank, streak milestone,
// primeiro acesso). Lazy-load remove ~586 linhas + suas deps do chunk inicial,
// reduzindo TTI da primeira navegação. Wrapping em Suspense com fallback null
// evita hydration mismatch — o servidor renderiza nada, o cliente carrega
// depois do primeiro paint.
const RankPromotionOverlay = lazy(() =>
  import("../components/RankPromotionOverlay").then((m) => ({ default: m.RankPromotionOverlay })),
);
const StreakMilestoneOverlay = lazy(() =>
  import("../components/StreakMilestoneOverlay").then((m) => ({ default: m.StreakMilestoneOverlay })),
);
const StreakChangeOverlay = lazy(() =>
  import("../components/StreakChangeOverlay").then((m) => ({ default: m.StreakChangeOverlay })),
);
const OnboardingTour = lazy(() =>
  import("../components/OnboardingTour").then((m) => ({ default: m.OnboardingTour })),
);
import { useSocialSync } from "../lib/social-store";
import { startActivityBridge } from "../lib/activity-bridge";
import { loadWallet, useWallet } from "../lib/wallet-store";


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
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "airi" },
      { name: "mobile-web-app-capable", content: "yes" },
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
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: airiLogo.url },
      { rel: "icon", type: "image/png", href: airiLogo.url },
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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600&display=swap",
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
function RankPill() {
  const rank = useRank();
  const colors = TIER_COLORS[rank.tier];
  const label = isElite(rank.tier)
    ? TIER_LABEL[rank.tier]
    : `${TIER_LABEL[rank.tier]} ${DIVISION_ROMAN[rank.division as 1 | 2 | 3 | 4]}`;
  return (
    <Link
      to="/rank"
      aria-label={`Rank: ${label} · ${rank.lp} LP`}
      className="tap-target group relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface/70 py-1 pl-1 pr-3 text-sm transition hover:bg-accent"
      style={{
        boxShadow: `0 0 0 1px ${colors.ring}22, 0 6px 20px -10px ${colors.glow}`,
      }}
    >
      <span className="grid h-7 w-9 place-items-center">
        <RankEmblem tier={rank.tier} division={rank.division} size={30} />
      </span>
      <span className="hidden flex-col leading-tight md:flex">
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: colors.text }}
        >
          {label}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {rank.lp} LP
        </span>
      </span>
      <span
        className="text-[11px] font-semibold md:hidden"
        style={{ color: colors.text }}
      >
        {rank.lp}
      </span>
    </Link>
  );
}

const MORE_ITEMS = [
  {
    to: "/perfil",
    label: "Meu perfil",
    description: "Cosméticos equipados e vitrine",
    icon: UserRound,
    color: "#a78bfa",
    matcher: (p: string) => p.startsWith("/perfil"),
  },
  {
    to: "/shop",
    label: "Loja",
    description: "Arlys ✦, decks, packs e mais",
    icon: ShoppingBag,
    color: "#c084fc",
    matcher: (p: string) => p.startsWith("/shop"),
  },
  {
    to: "/enemies",
    label: "Inimigas",
    description: "Cartas que você mais erra",
    icon: Swords,
    color: "#f87171",
    matcher: (p: string) => p.startsWith("/enemies"),
  },
  {
    to: "/rank",
    label: "Rank",
    description: "Seu elo e progressão",
    icon: Trophy,
    color: "#fbbf24",
    matcher: (p: string) => p.startsWith("/rank"),
  },
  {
    to: "/novidades",
    label: "Novidades",
    description: "O que há de novo no app",
    icon: Sparkles,
    color: "#a78bfa",
    matcher: (p: string) => p.startsWith("/novidades"),
  },
  {
    to: "/settings",
    label: "Configurações",
    description: "Preferências e conta",
    icon: Settings2,
    color: "#60a5fa",
    matcher: (p: string) => p.startsWith("/settings"),
  },
] as const;

function useMoreState() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMoreActive = MORE_ITEMS.some((i) => i.matcher(pathname));
  return { pathname, isMoreActive };
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unreadNews = useChangelogUnread();
  useEffect(() => {
    if (open) void initChangelog();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Mais opções"
    >
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/[0.09] bg-[hsl(var(--background))]/95 backdrop-blur-2xl shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)] sm:rounded-3xl sm:mx-4 sm:shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Grabber (mobile) */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-9 rounded-full bg-white/15" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary/80">
              airi
            </p>
            <h2 className="mt-0.5 text-[20px] font-semibold tracking-tight text-foreground">
              Mais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.08] hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 pb-5 pt-1 sm:px-5 sm:pb-6">
          <ul className="flex flex-col gap-2">
            {MORE_ITEMS.map(({ to, label, description, icon: Icon, color }) => {
              const isNews = to === "/novidades";
              const badge = isNews && unreadNews > 0 ? unreadNews : 0;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={onClose}
                    className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 transition hover:-translate-y-px hover:border-white/[0.14] hover:bg-white/[0.06]"
                  >
                    <div
                      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                      style={{
                        backgroundColor: `${color}1f`,
                        borderColor: `${color}40`,
                        color,
                        boxShadow: `0 6px 20px -8px ${color}55`,
                      }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                        <span className="truncate">{label}</span>
                        {badge > 0 && (
                          <span
                            className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-primary-foreground"
                            style={{ backgroundColor: color }}
                          >
                            {badge}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-foreground/55">
                        {description}
                      </p>
                    </div>

                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-foreground/70"
                      strokeWidth={2.25}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="safe-bottom" />
      </div>
    </div>
  );
}

function TopBar() {
  const { pathname, isMoreActive } = useMoreState();
  const isReview = pathname.startsWith("/review");
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadNews = useChangelogUnread();
  if (isReview) return null;

  const linkClass = (active: boolean) =>
    `tap-target relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition lg:px-3.5 lg:text-sm ${
      active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
    }`;

  const navItems = [
    { to: "/", label: "Início", icon: Home, active: pathname === "/" },
    { to: "/library", label: "Biblioteca", icon: Library, active: pathname.startsWith("/library") },
    { to: "/study", label: "Estudo", icon: GraduationCap, active: pathname.startsWith("/study") },
    { to: "/social", label: "Social", icon: Users2, active: pathname.startsWith("/social") || pathname.startsWith("/duel") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-panel border-b">
        <nav className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-[clamp(0.75rem,3vw,1.5rem)] py-2.5 lg:gap-6">
          {/* Esquerda: logo */}
          <Link to="/" className="tap-target flex items-center gap-2.5" aria-label="airi — início">
            <img
              src={airiLogo.url}
              alt=""
              className="h-10 w-10 rounded-2xl object-contain sm:h-11 sm:w-11"
            />
            <span className="hidden text-[17px] font-semibold lowercase tracking-tight sm:inline">
              airi
            </span>
          </Link>

          {/* Centro: navegação principal (≥sm) */}
          <div className="hidden items-center justify-center gap-0.5 sm:flex lg:gap-1">
            {navItems.map(({ to, label, icon: Icon, active }) => (
              <Link key={to} to={to} className={linkClass(active)}>
                <Icon className="h-4 w-4" strokeWidth={2.25} />
                <span>{label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`${linkClass(isMoreActive)} relative`}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={2.25} />
              <span>Mais</span>
              {unreadNews > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground">
                  {unreadNews}
                </span>
              )}
            </button>
          </div>

          {/* Direita: rank + notificações + perfil */}
          <div className="flex shrink-0 items-center gap-1.5 justify-self-end sm:gap-2">
            <RankPill />
            <NotificationsBell />
            <ProfileMenu />
          </div>
        </nav>
      </div>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </header>
  );
}

/**
 * Barra inferior fixa (mobile). Escondida em ≥sm.
 */
function BottomBar() {
  const { pathname, isMoreActive } = useMoreState();
  const isReview = pathname.startsWith("/review");
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadNews = useChangelogUnread();
  if (isReview) return null;

  const items = [
    { to: "/", label: "Início", icon: Home, active: pathname === "/" },
    { to: "/library", label: "Biblioteca", icon: Library, active: pathname.startsWith("/library") },
    { to: "/study", label: "Estudo", icon: GraduationCap, active: pathname.startsWith("/study") },
    { to: "/social", label: "Social", icon: Users2, active: pathname.startsWith("/social") || pathname.startsWith("/duel") },
  ] as const;

  return (
    <>
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
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={`tap-target relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                  isMoreActive ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-haspopup="dialog"
                aria-expanded={moreOpen}
              >
                <MoreHorizontal
                  className={`h-[22px] w-[22px] transition ${isMoreActive ? "text-primary" : ""}`}
                  strokeWidth={2.25}
                />
                <span className="truncate">Mais</span>
                {unreadNews > 0 && (
                  <span className="absolute right-1 top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground">
                    {unreadNews}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}


function ProfileMenu() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
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
          className="relative block h-7 w-7 overflow-hidden rounded-full ring-1 ring-white/15"
          style={{
            backgroundImage: wallet.avatarUrl ? undefined : profile.gradient,
            background: wallet.avatarUrl ? "#000" : undefined,
          }}
        >
          {wallet.avatarUrl && (
            <img
              src={wallet.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
        </span>
        <span className="hidden sm:inline">{profile.name}</span>
      </button>
      {open && (
        <div className="glass-panel absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5 shadow-card">
          <div className="flex items-center gap-3 px-3 py-2">
            <span
              aria-hidden
              className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15"
              style={{
                backgroundImage: wallet.avatarUrl ? undefined : profile.gradient,
                background: wallet.avatarUrl ? "#000" : undefined,
              }}
            >
              {wallet.avatarUrl && (
                <img src={wallet.avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Conectado como</p>
              <p className="truncate text-sm font-medium">{profile.name}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="tap-target flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent"
          >
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
            Meu perfil
          </Link>
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
  const profile = useCurrentProfile();
  useSocialSync();
  useEffect(() => {
    startActivityBridge();
  }, []);
  useEffect(() => {
    if (profile) void loadWallet(profile.id);
  }, [profile?.id]);

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
          <Suspense fallback={null}>
            <RankPromotionOverlay />
            <StreakMilestoneOverlay />
            <StreakChangeOverlay />
            <OnboardingTour />
          </Suspense>
        </div>
      </ProfileGate>

    </QueryClientProvider>
  );
}
