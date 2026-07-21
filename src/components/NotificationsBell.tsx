import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
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
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const tagMap = new Map(tags.map((t) => [t.id, t]));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Notificações"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="glass-panel fixed left-1/2 top-[64px] w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-border/60 bg-surface-elevated/95 p-1.5 shadow-card backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:translate-x-0">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
            {unread > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
                Marcar todas
              </button>
            )}
          </div>
          <div className="my-1 h-px bg-border/70" />
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-foreground/70">
                Nenhuma notificação por aqui ainda.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {notifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  const tag = n.tag_id ? tagMap.get(n.tag_id) : null;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => void markAsRead(n.id)}
                        className={`group relative flex w-full flex-col gap-1.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent ${
                          isRead ? "opacity-60" : ""
                        }`}
                      >
                        {!isRead && (
                          <span
                            aria-hidden
                            className="absolute left-1 top-3.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/80"
                          />
                        )}
                        <div className="flex items-center justify-between gap-2 pl-3">
                          <p className={`truncate text-sm font-semibold ${isRead ? "text-foreground/80" : "text-foreground"}`}>
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[11px] tabular-nums text-foreground/55">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="pl-3 text-[13px] leading-relaxed text-foreground/85">
                          {n.body}
                        </p>
                        {tag && (
                          <span
                            className="ml-3 mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${tag.color}33`,
                              color: tag.color,
                              border: `1px solid ${tag.color}66`,
                              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                            }}
                          >
                            {tag.name}
                          </span>
                        )}
                        {isRead && (
                          <Check
                            className="absolute right-2 top-2 h-3.5 w-3.5 text-foreground/50 opacity-0 group-hover:opacity-100"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

