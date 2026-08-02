import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Inbox,
  Moon,
  Settings2,
  Flame,
  Gift,
  Swords,
  Trophy,
  Heart,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import {
  initNotifications,
  markAllAsRead,
  useNotifications,
  type Notification,
} from "@/lib/notifications-store";
import { useCurrentProfile } from "@/lib/profile";
import { isQuietNow, useNotificationPrefs } from "@/lib/notification-prefs";
import {
  NotificationRow,
  groupLabel,
  inferKind,
  kindIcon,
  kindLabel,
  timeGroup,
} from "@/lib/notification-ui";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — airi" },
      {
        name: "description",
        content: "Central de notificações do airi: tudo, não lidas, sistema e social.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Notificações — airi" },
      {
        property: "og:description",
        content: "Central de notificações do airi: tudo, não lidas, sistema e social.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

type Tab = "all" | "unread" | "system" | "social";

const TABS: { key: Tab; label: string; Icon: typeof Bell }[] = [
  { key: "all", label: "Tudo", Icon: Bell },
  { key: "unread", label: "Não lidas", Icon: Sparkles },
  { key: "system", label: "Sistema", Icon: Trophy },
  { key: "social", label: "Social", Icon: Heart },
];

function useGrouped(notifications: Notification[], tab: Tab, tagMap: Map<string, { color: string; name: string }>) {
  return useMemo(() => {
    let list = notifications;
    if (tab === "unread") {
      // será filtrado depois com readIds
    } else if (tab === "system") {
      list = notifications.filter((n) => {
        const k = inferKind(n);
        return k !== "social" && k !== "gift" && k !== "duel";
      });
    } else if (tab === "social") {
      list = notifications.filter((n) => {
        const k = inferKind(n);
        return k === "social" || k === "gift" || k === "duel";
      });
    }

    const groups = new Map<"today" | "yesterday" | "week" | "older", Notification[]>();
    for (const n of list) {
      const g = timeGroup(n.created_at);
      const arr = groups.get(g) ?? [];
      arr.push(n);
      groups.set(g, arr);
    }
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: groupLabel(key),
      items,
    }));
  }, [notifications, tab]);
}

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-foreground/55">{title}</p>
        <p className="text-[16px] font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px] text-foreground/50">{subtitle}</p>
      </div>
    </div>
  );
  return href ? (
    <Link to={href as any} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function NotificationsPage() {
  const profile = useCurrentProfile();
  const { notifications, tags, readIds } = useNotifications();
  const prefs = useNotificationPrefs();
  const quiet = isQuietNow(prefs);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    void initNotifications();
  }, []);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const filtered = useMemo(() => {
    if (tab === "unread") return notifications.filter((n) => !readIds.has(n.id));
    return notifications;
  }, [notifications, readIds, tab]);

  const grouped = useGrouped(filtered, tab, tagMap);
  const unreadCount = useMemo(() => notifications.filter((n) => !readIds.has(n.id)).length, [notifications, readIds]);

  const socialCount = useMemo(
    () => notifications.filter((n) => ["social", "gift", "duel"].includes(inferKind(n))).length,
    [notifications],
  );

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
              {profile?.name ?? "Perfil"}
            </p>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">Notificações</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-foreground/80 transition hover:bg-white/[0.06] hover:text-foreground"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Marcar tudo</span>
            </button>
          )}
          <Link
            to="/settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Preferências"
          >
            <Settings2 className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>
      </div>

      {/* Status / Resumo */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<Bell className="h-4 w-4" strokeWidth={2.25} />}
          title="Não lidas"
          value={String(unreadCount)}
          subtitle={unreadCount === 1 ? "nova notificação" : "novas notificações"}
        />
        <SummaryCard
          icon={<Heart className="h-4 w-4" strokeWidth={2.25} />}
          title="Social"
          value={String(socialCount)}
          subtitle="interações"
        />
        <SummaryCard
          icon={<Flame className="h-4 w-4" strokeWidth={2.25} />}
          title="Streak"
          value="Em dia"
          subtitle="continue revisando"
          href="/review"
        />
        <SummaryCard
          icon={<Gift className="h-4 w-4" strokeWidth={2.25} />}
          title="Fragmentos"
          value="Ver"
          subtitle="itens prontos"
          href="/forja"
        />
      </div>

      {quiet && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-foreground/70">
          <Moon className="h-3.5 w-3.5 text-primary/80" strokeWidth={2.25} />
          Modo silencioso ativo — sem som nem vibração agora.
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 scrollbar-hide">
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                active
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "text-foreground/60 hover:bg-white/[0.04] hover:text-foreground/90"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="space-y-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Inbox className="h-6 w-6 text-foreground/50" strokeWidth={2} />
            </div>
            <p className="text-[15px] font-semibold text-foreground/90">Sua caixa está limpa</p>
            <p className="max-w-xs text-[12.5px] leading-relaxed text-foreground/55">
              {tab === "unread"
                ? "Você já leu tudo. Boas notícias!"
                : tab === "social"
                  ? "Nenhuma interação social por enquanto. Que tal desafiar alguém?"
                  : "Nenhuma notificação por aqui. Volte mais tarde para novidades."}
            </p>
          </div>
        ) : (
          grouped.map(({ key, label, items }) =>
            items.length > 0 ? (
              <section key={`${tab}-${key}`}>
                <p className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                  {label}
                </p>
                <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                      isRead={readIds.has(n.id)}
                      onClick={() => {
                        if (!readIds.has(n.id)) {
                          // markAsRead é async; não bloqueia navegação
                          void import("@/lib/notifications-store").then((m) => m.markAsRead(n.id));
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
