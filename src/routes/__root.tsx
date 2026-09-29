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
import { createPortal } from "react-dom";
import { Home, Library, LogOut, Shield, GraduationCap, Settings2, Swords, Target, Trophy, Users2, MoreHorizontal, Sparkles, X, ChevronRight, ChevronDown, ShoppingBag, UserRound } from "lucide-react";
import { useChangelogUnread, initChangelog } from "../lib/changelog-store";

import appCss from "../styles.css?url";
import airiLogo from "../assets/airi-logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ProfileGate } from "../components/ProfileGate";
import { NotificationsBell } from "../components/NotificationsBell";
import { SystemUpdatesBell } from "../components/SystemUpdatesBell";
import { RankEmblem } from "../components/RankBadge";
import { useRank, TIER_LABEL, DIVISION_ROMAN, TIER_COLORS, isElite } from "../lib/rank-store";
import { useCurrentProfile, signOutProfile } from "../lib/profile";
import { auraRingFromEquipped, auraProfileFromEquipped } from "../lib/aura";
import { AuraRing } from "../components/AuraRing";
import { getEquippedArt } from "../lib/shop-asset-overrides";
import { SyncIndicator } from "../components/SyncIndicator";
import { Toaster } from "@/components/ui/sonner";
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
const GiftReceivedOverlay = lazy(() =>
  import("../components/GiftReceivedOverlay").then((m) => ({ default: m.GiftReceivedOverlay })),
);
const PokeOverlay = lazy(() =>
  import("../components/PokeOverlay").then((m) => ({ default: m.PokeOverlay })),
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
    to: "/desafios",
    label: "Desafios diários",
    description: "Missões de hoje por Arlys ✦ e LP",
    icon: Target,
    color: "#34d399",
    matcher: (p: string) => p.startsWith("/desafios"),
  },
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
    to: "/forja",
    label: "Forja",
    description: "Fragmentos de cosméticos e forja com Arlys",
    icon: Sparkles,
    color: "#d8b4fe",
    matcher: (p: string) => p.startsWith("/forja"),
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
  if (typeof document === "undefined") return null;
  return createPortal(
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
    </div>,
    document.body,
  );
}

/**
 * TopBar — Premium Glassmorphism (Apple-style).
 * Pill flutuante centrada com nav interna também em pill; ativo = fill sutil,
 * inativos = 50% opacity que sobe no hover.
 */
function TopBar() {
  const { pathname, isMoreActive } = useMoreState();
  const isReview = pathname.startsWith("/review");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const unreadNews = useChangelogUnread();

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [moreOpen]);

  if (isReview) return null;

  const navItems = [
    { to: "/", label: "Início", icon: Home, active: pathname === "/" },
    { to: "/library", label: "Biblioteca", icon: Library, active: pathname.startsWith("/library") },
    { to: "/study", label: "Estudo", icon: GraduationCap, active: pathname.startsWith("/study") },
    { to: "/social", label: "Social", icon: Users2, active: pathname.startsWith("/social") || pathname.startsWith("/duel") },
  ] as const;

  const pillLink = (active: boolean) =>
    `tap-target relative inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-center text-[13px] font-medium transition-all duration-200 lg:px-4 ${
      active
        ? "bg-primary/12 text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)]"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
    }`;

  return (
    <header className="relative z-40 w-full sm:sticky sm:top-0">
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 sm:pt-4">
        <nav className="airi-desktop-nav relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-3xl px-3 py-2 sm:rounded-full sm:px-4 sm:py-2 md:px-5">

          {/* Esquerda: logo */}
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <Link to="/" className="tap-target flex shrink-0 items-center gap-2" aria-label="airi — início">
              <span className="relative">
                <img
                  src={airiLogo.url}
                  alt=""
                  className="h-9 w-9 rounded-xl object-contain shadow-glow"
                />
              </span>
              <span className="hidden text-[15px] font-semibold lowercase text-foreground sm:inline">
                airi
              </span>
              <span className="hidden sm:inline">
                <SyncIndicator minimal />
              </span>
            </Link>
          </div>

          {/* Centro: nav em pill (desktop) */}
          <div className="hidden items-center gap-0.5 justify-self-center md:flex">
            {navItems.map((i) => {
              const Icon = i.icon;
              return <Link key={i.to} to={i.to} className={pillLink(i.active)}>
                <Icon className="h-4 w-4" strokeWidth={2} />
                {i.label}
              </Link>
            })}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className={`${pillLink(isMoreActive || moreOpen)} relative`}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                Recursos
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                {unreadNews > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground">
                    {unreadNews}
                  </span>
                )}
              </button>
              {moreOpen && (
                <div className="airi-mega-menu absolute left-1/2 top-full mt-3 w-[min(680px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200" role="menu">
                  <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
                    <div className="grid grid-cols-2 gap-1">
                      {MORE_ITEMS.map(({ to, label, description, icon: Icon }) => (
                        <Link key={to} to={to} onClick={() => setMoreOpen(false)} className="group flex min-w-0 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-accent" role="menuitem">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-primary">
                            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-foreground">{label}</span>
                            <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-muted-foreground">{description}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-col rounded-xl border border-border bg-secondary/55 p-4">
                      <span className="text-[10px] font-semibold uppercase text-primary">Destaque de hoje</span>
                      <Target className="mt-5 h-8 w-8 text-primary" strokeWidth={1.75} />
                      <p className="mt-3 text-sm font-semibold text-foreground">Desafios diários</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Treine inglês, conclua missões e ganhe Arlys ✦ e LP.</p>
                      <Link to="/desafios" onClick={() => setMoreOpen(false)} className="mt-auto flex items-center justify-between rounded-lg bg-primary/12 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20">
                        Abrir desafios <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Placeholder do centro no mobile (mantém grid consistente) */}
          <div className="md:hidden" aria-hidden />

          {/* Direita: rank + notif + perfil */}
          <div className="flex shrink-0 items-center gap-2 justify-self-end md:gap-3">
            <span className="sm:hidden">
              <SyncIndicator minimal />
            </span>
            <RankPill />
            <SystemUpdatesBell />
            <NotificationsBell />
            <ProfileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}

/**
 * BottomBar — Barra inferior full-width com blur pesado (mobile).
 * Sem pill flutuante; anexada ao rodapé com border-top e safe-area.
 * Ativo destacado com cor primária + ponto luminoso; inativos em white/40.
 */
function BottomBar() {
  const { pathname, isMoreActive } = useMoreState();
  const isReview = pathname.startsWith("/review");
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadNews = useChangelogUnread();
  if (isReview) return null;

  const items: Array<{
    key: string;
    to?: string;
    label: string;
    icon: typeof Home;
    active: boolean;
    isMore?: boolean;
    badge?: number;
  }> = [
    { key: "/", to: "/", label: "Início", icon: Home, active: pathname === "/" },
    { key: "/library", to: "/library", label: "Biblioteca", icon: Library, active: pathname.startsWith("/library") },
    { key: "/study", to: "/study", label: "Estudo", icon: GraduationCap, active: pathname.startsWith("/study") },
    { key: "/social", to: "/social", label: "Social", icon: Users2, active: pathname.startsWith("/social") || pathname.startsWith("/duel") },
    { key: "more", label: "Mais", icon: MoreHorizontal, active: isMoreActive, isMore: true, badge: unreadNews },
  ];

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md sm:hidden"
      >
        <ul className="airi-mobile-nav grid grid-cols-5 items-center px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.active;
            const cls = `tap-target group relative flex h-[68px] w-full items-center justify-center transition-all active:scale-[0.94] duration-200`;
            const iconWrap = (
              <span className={`relative z-10 grid h-12 w-12 place-items-center rounded-full transition-all duration-300 ${active ? "-translate-y-6 bg-primary text-primary-foreground shadow-glow ring-[7px] ring-background" : "text-muted-foreground group-hover:text-foreground"}`}>
                <Icon
                  className="h-[22px] w-[22px] transition-colors"
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-semibold text-destructive-foreground ring-2 ring-background">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            );
            const label = (
              <span
                className={`pointer-events-none absolute bottom-1.5 text-[9px] font-semibold transition-all ${active ? "translate-y-1 opacity-0" : "text-muted-foreground opacity-100"}`}
              >
                {item.label}
              </span>
            );
            if (item.isMore) {
              return (
                <li key="more">
                  <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className={cls}
                    aria-haspopup="dialog"
                    aria-expanded={moreOpen}
                  >
                    {iconWrap}
                    {label}
                  </button>
                </li>
              );
            }
            if (!item.to) return null;
            return (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className={cls}
                  aria-current={active ? "page" : undefined}
                >
                  {iconWrap}
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}



function AuraAvatar({
  size,
  gradient,
  avatarUrl,
  ring,
  profile,
}: {
  size: number;
  gradient: string;
  avatarUrl?: string | null;
  ring: string | null;
  profile: ReturnType<typeof auraProfileFromEquipped>;
}) {
  const wallet = useWallet();
  const showAura = !!ring;
  const inner = showAura ? size - 6 : size;
  const nameplateArt = getEquippedArt(wallet.equipped.nameplate);
  const decorationArt = getEquippedArt(wallet.equipped.decoration);
  const badgeArt = getEquippedArt(wallet.equipped.badge);
  return (
    <AuraRing size={size} profile={showAura ? profile : null}>
      <span
        className="relative block overflow-visible rounded-full"
        style={{ width: inner, height: inner }}
      >
        {decorationArt && (
          <img
            src={decorationArt}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[160%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 animate-[spin_9s_linear_infinite] object-contain opacity-90 mix-blend-screen drop-shadow-[0_0_10px_rgba(192,132,252,0.55)]"
          />
        )}
        <span
          className="relative z-[5] block h-full w-full overflow-hidden rounded-full ring-1 ring-white/15"
          style={{
            backgroundImage: avatarUrl ? undefined : gradient,
            background: avatarUrl ? "#000" : undefined,
            boxShadow: showAura && ring ? `0 0 10px ${ring}55` : undefined,
          }}
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}
        </span>

        {nameplateArt && (
          <img
            src={nameplateArt}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[45%] z-10 h-[168%] w-[168%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_6px_rgba(192,132,252,0.55)]"
          />
        )}
        {badgeArt && (
          <img
            src={badgeArt}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-1 -right-1 h-[42%] w-[42%] rounded-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          />
        )}
      </span>
    </AuraRing>
  );
}

function ProfileMenu() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ring = auraRingFromEquipped(wallet.equipped);
  const auraProfile = auraProfileFromEquipped(wallet.equipped);

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
        <AuraAvatar
          size={28}
          gradient={profile.gradient}
          avatarUrl={wallet.avatarUrl}
          ring={ring}
          profile={auraProfile}
        />
        <span className="hidden sm:inline">{profile.name}</span>
      </button>
      {open && (
        <div className="glass-panel absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5 shadow-card">
          <div className="flex items-center gap-3 px-3 py-2">
            <AuraAvatar
              size={40}
              gradient={profile.gradient}
              avatarUrl={wallet.avatarUrl}
              ring={ring}
              profile={auraProfile}
            />
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
        <div className="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))] sm:pb-0">
          <TopBar />
          <Outlet />
          <BottomBar />
          <Suspense fallback={null}>
            <RankPromotionOverlay />
            <StreakMilestoneOverlay />
            <StreakChangeOverlay />
            <OnboardingTour />
            <GiftReceivedOverlay />
            <PokeOverlay />
          </Suspense>
        </div>
      </ProfileGate>
      <Toaster />
    </QueryClientProvider>
  );
}
