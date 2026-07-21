import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox, Sparkles } from "lucide-react";
import {
  initNotifications,
  markAllAsRead,
  markAsRead,
  useNotifications,
  useUnreadCount,
} from "@/lib/notifications-store";
import { subscribeProfile } from "@/lib/profile";

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

type Notif = ReturnType<typeof useNotifications>["notifications"][number];
type Tag = ReturnType<typeof useNotifications>["tags"][number];

function NotificationItem({
  n,
  tag,
  isRead,
}: {
  n: Notif;
  tag: Tag | null;
  isRead: boolean;
}) {
  const accent = tag?.color ?? "hsl(var(--primary))";
  return (
    <button
      onClick={() => void markAsRead(n.id)}
      className={`group relative flex w-full gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-accent/70 active:scale-[0.995] ${
        isRead ? "opacity-70" : ""
      }`}
    >
      {/* Left accent bar */}
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-[3px] rounded-full transition-all ${
          isRead ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: accent,
          boxShadow: isRead ? "none" : `0 0 12px ${accent}`,
        }}
      />
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!isRead && (
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
              />
            )}
            <p
              className={`truncate text-[13.5px] font-semibold tracking-tight ${
                isRead ? "text-foreground/75" : "text-foreground"
              }`}
            >
              {n.title}
            </p>
          </div>
          <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-wider tabular-nums text-foreground/50">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-foreground/75">
          {n.body}
        </p>
        {tag && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide"
            style={{
              backgroundColor: `${tag.color}1f`,
              color: tag.color,
              border: `1px solid ${tag.color}40`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: tag.color }}
            />
            {tag.name}
          </span>
        )}
      </div>
    </button>
  );
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, tags, readIds } = useNotifications();
  const unread = useUnreadCount();

  useEffect(() => {
    void initNotifications();
    const unsub = subscribeProfile(() => {
      void initNotifications();
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  const { news, older } = useMemo(() => {
    const news: Notif[] = [];
    const older: Notif[] = [];
    for (const n of notifications) {
      if (readIds.has(n.id)) older.push(n);
      else news.push(n);
    }
    return { news, older };
  }, [notifications, readIds]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          unread > 0
            ? "text-foreground hover:bg-accent"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
        aria-label="Notificações"
      >
        <Bell
          className={`h-[18px] w-[18px] ${unread > 0 ? "animate-[wiggle_2.5s_ease-in-out_infinite]" : ""}`}
          strokeWidth={2.25}
        />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-panel fixed left-1/2 top-[64px] w-[min(94vw,380px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-border/60 bg-surface-elevated/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:translate-x-0">
          {/* Header with subtle gradient */}
          <div className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(120% 100% at 0% 0%, hsl(var(--primary) / 0.18), transparent 60%)",
              }}
            />
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Bell className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-none text-foreground">
                    Notificações
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-none text-foreground/55">
                    {unread > 0
                      ? `${unread} não lida${unread > 1 ? "s" : ""}`
                      : "tudo em dia"}
                  </p>
                </div>
              </div>
              {unread > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2.5 py-1 text-[10.5px] font-semibold text-foreground/85 transition hover:bg-accent hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
                  Marcar todas
                </button>
              )}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Body */}
          <div className="max-h-[65vh] overflow-y-auto p-1.5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Inbox className="h-6 w-6 text-primary/80" strokeWidth={2} />
                  <Sparkles
                    className="absolute -right-1 -top-1 h-4 w-4 text-primary"
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Tudo tranquilo por aqui
                  </p>
                  <p className="mt-1 text-[11.5px] text-foreground/60">
                    Novas notificações aparecem aqui em tempo real.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {news.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-foreground/45">
                      Novas
                    </p>
                    <ul className="space-y-0.5">
                      {news.map((n) => (
                        <li key={n.id}>
                          <NotificationItem
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={false}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {older.length > 0 && (
                  <div>
                    {news.length > 0 && (
                      <div className="mx-3 my-1 h-px bg-border/60" />
                    )}
                    <p className="px-3 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-foreground/45">
                      Anteriores
                    </p>
                    <ul className="space-y-0.5">
                      {older.map((n) => (
                        <li key={n.id}>
                          <NotificationItem
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={true}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
