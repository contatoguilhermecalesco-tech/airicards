import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell as BellIcon,
  ChevronRight,
  Coins,
  Crown,
  Database,
  Flame,
  GraduationCap,
  KeyRound,
  Package,
  ScrollText,
  Shield,
  ShoppingBag,
  Swords,
  Tag as TagIcon,
  Trophy,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PROFILES, useCurrentProfile, useIsAdmin, useProfileHydrated } from "@/lib/profile";
import { initNotifications } from "@/lib/notifications-store";
import { initChangelog } from "@/lib/changelog-store";
import {
  adminFetchAllProfileSessionsFn,
  adminResetHomeSessionsFn,
} from "@/lib/admin.functions";
import { type ProfileSessionInfo } from "@/lib/flashcards-store";

import { SessionsPanel } from "@/components/admin/SessionsPanel";
import { RankAdminSection } from "@/components/admin/RankAdminSection";
import { ProfilesRankOverview } from "@/components/admin/ProfilesRankOverview";
import { ExamAdminSection } from "@/components/admin/ExamAdminSection";
import { ArlysAdminSection } from "@/components/admin/ArlysAdminSection";
import { DuelsAdminSection } from "@/components/admin/DuelsAdminSection";
import { PinAdminSection } from "@/components/admin/PinAdminSection";
import { TagsSection } from "@/components/admin/TagsSection";
import { NotificationsSection } from "@/components/admin/NotificationsSection";
import { ChangelogSection } from "@/components/admin/ChangelogSection";
import { BackupSection } from "@/components/admin/BackupSection";
import { StreakAdminSection } from "@/components/admin/StreakAdminSection";
import { FeaturedSlotsSection } from "@/components/admin/FeaturedSlotsSection";
import { ShopItemsSection } from "@/components/admin/ShopItemsSection";
import { BundleBuilderSection } from "@/components/admin/BundleBuilderSection";

export const Route = createFileRoute("/admin")({
  component: AdminGate,
});

function AdminGate() {
  const hydrated = useProfileHydrated();
  const isAdmin = useIsAdmin();
  const profile = useCurrentProfile();
  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-sm text-muted-foreground">
        Carregando…
      </main>
    );
  }
  if (!profile || !isAdmin) {
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
    return null;
  }
  return <AdminPage />;
}

type PanelKey =
  | "sessions"
  | "rank-self"
  | "rank-all"
  | "exam"
  | "arlys"
  | "duels"
  | "pin"
  | "tags"
  | "notifications"
  | "changelog"
  | "backup"
  | "streak"
  | "vitrine"
  | "bundles"
  | "shop-items";

type PanelDef = {
  key: PanelKey;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  wide?: boolean;
};

const ADMIN_PANELS: PanelDef[] = [
  { key: "sessions", label: "Sessões", hint: "Zerar contadores por perfil", Icon: Users, color: "#a78bfa" },
  { key: "rank-self", label: "Meu rank", hint: "Ver / zerar o seu progresso", Icon: Crown, color: "#f5b301" },
  { key: "rank-all", label: "Ranks", hint: "Overview de todos os perfis", Icon: Trophy, color: "#fb923c" },
  { key: "exam", label: "Provas", hint: "Habilitar e resetar prova mensal", Icon: GraduationCap, color: "#22d3ee" },
  { key: "arlys", label: "Arlys ✦", hint: "Conceder / ajustar saldo", Icon: Coins, color: "#e879f9" },
  { key: "duels", label: "Duelos", hint: "Encerrar por WO / cancelar", Icon: Swords, color: "#f87171", wide: true },
  { key: "pin", label: "PIN", hint: "Redefinir / desvincular perfis", Icon: KeyRound, color: "#94a3b8" },
  { key: "tags", label: "Tags", hint: "Criar tags de notificação", Icon: TagIcon, color: "#60a5fa" },
  { key: "notifications", label: "Notificações", hint: "Enviar avisos e alertas", Icon: BellIcon, color: "#34d399" },
  { key: "changelog", label: "Patch notes", hint: "Publicar / editar novidades", Icon: ScrollText, color: "#c084fc", wide: true },
  { key: "backup", label: "Backup", hint: "Exportar / importar decks (JSON)", Icon: Database, color: "#38bdf8", wide: true },
  { key: "streak", label: "Streak", hint: "Ajustar sequência de dias", Icon: Flame, color: "#fb923c" },
  { key: "shop-items", label: "Itens da Loja", hint: "Habilitar, preço, remover", Icon: ShoppingBag, color: "#c084fc", wide: true },
  { key: "bundles", label: "Bundles", hint: "Pacotes + vitrine da loja (destaque)", Icon: Package, color: "#a855f7", wide: true },
];

function AdminPage() {
  const [rows, setRows] = useState<ProfileSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  async function load() {
    setLoading(true);
    const data = (await adminFetchAllProfileSessionsFn()).map((r) => ({
      profileId: r.profile_id,
      day: r.home_sessions?.day ?? "",
      count: r.home_sessions?.count ?? 0,
      reviewed: r.home_sessions?.reviewed ?? 0,
    }));
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    void initNotifications();
    void initChangelog();
  }, []);

  function nameFor(profileId: string) {
    return PROFILES.find((p) => p.id === profileId)?.name ?? profileId;
  }
  function gradientFor(profileId: string) {
    return (
      PROFILES.find((p) => p.id === profileId)?.gradient ??
      "linear-gradient(135deg, oklch(0.6 0.05 260), oklch(0.4 0.05 260))"
    );
  }

  const merged: ProfileSessionInfo[] = PROFILES.map((p) => {
    const found = rows.find((r) => r.profileId === p.id);
    return found ?? { profileId: p.id, day: "", count: 0, reviewed: 0 };
  });
  rows.forEach((r) => {
    if (!merged.find((m) => m.profileId === r.profileId)) merged.push(r);
  });

  async function handleReset(profileId: string) {
    setBusyId(profileId);
    try {
      await adminResetHomeSessionsFn({ data: { profileId } });
      await load();
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  const activePanel = ADMIN_PANELS.find((p) => p.key === openPanel) ?? null;

  return (
    <main className="mx-auto max-w-3xl px-5 pt-8 pb-24 sm:pt-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Shield className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground">Painel de controle</p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground transition hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Voltar
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ADMIN_PANELS.map((p) => (
          <button
            key={p.key}
            onClick={() => setOpenPanel(p.key)}
            className="group relative flex min-h-[92px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.05] active:scale-[0.98]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
              style={{ background: `linear-gradient(90deg, transparent, ${p.color}66, transparent)` }}
            />
            <div className="flex items-center justify-between">
              <span
                className="grid h-8 w-8 place-items-center rounded-xl border"
                style={{
                  backgroundColor: `${p.color}18`,
                  borderColor: `${p.color}3d`,
                  color: p.color,
                }}
              >
                <p.Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 text-foreground/25 transition group-hover:translate-x-0.5 group-hover:text-foreground/60"
                strokeWidth={2.5}
              />
            </div>
            <div className="mt-2">
              <p className="text-[13px] font-semibold tracking-tight text-foreground">{p.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-foreground/45">{p.hint}</p>
            </div>
          </button>
        ))}
      </section>

      <Dialog open={openPanel !== null} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <DialogContent className={cn("gap-3 p-0 sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col", activePanel?.wide && "sm:max-w-3xl")}>
          {activePanel && (
            <>
              <DialogHeader className="border-b border-white/[0.06] px-5 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                    style={{
                      backgroundColor: `${activePanel.color}18`,
                      borderColor: `${activePanel.color}3d`,
                      color: activePanel.color,
                    }}
                  >
                    <activePanel.Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1 pr-8 text-left">
                    <DialogTitle className="truncate text-[15px] font-semibold">
                      {activePanel.label}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 truncate text-[11.5px] text-foreground/50">
                      {activePanel.hint}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {openPanel === "sessions" && (
                  <SessionsPanel
                    merged={merged}
                    loading={loading}
                    load={() => void load()}
                    busyId={busyId}
                    onAskReset={setConfirmId}
                    nameFor={nameFor}
                    gradientFor={gradientFor}
                  />
                )}
                {openPanel === "rank-self" && <RankAdminSection />}
                {openPanel === "rank-all" && <ProfilesRankOverview />}
                {openPanel === "exam" && <ExamAdminSection />}
                {openPanel === "arlys" && <ArlysAdminSection />}
                {openPanel === "duels" && <DuelsAdminSection />}
                {openPanel === "pin" && <PinAdminSection />}
                {openPanel === "tags" && <TagsSection />}
                {openPanel === "notifications" && <NotificationsSection />}
                {openPanel === "changelog" && <ChangelogSection />}
                {openPanel === "backup" && <BackupSection />}
                {openPanel === "streak" && <StreakAdminSection />}
                {openPanel === "vitrine" && <FeaturedSlotsSection />}
                {openPanel === "shop-items" && <ShopItemsSection />}
                {openPanel === "bundles" && <BundleBuilderSection />}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar sessões?</AlertDialogTitle>
            <AlertDialogDescription>
              O contador de sessões de <strong>{confirmId ? nameFor(confirmId) : ""}</strong> volta
              para zero. As cartas em si não são afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && void handleReset(confirmId)}>
              Zerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
