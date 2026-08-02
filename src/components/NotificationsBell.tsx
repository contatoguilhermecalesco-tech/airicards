import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Inbox,
  Settings2,
  Moon,
  ArrowUpRight,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  initNotifications,
  markAllAsRead,
  markAsRead,
  useNotifications,
  type Notification,
} from "@/lib/notifications-store";
import { subscribeProfile } from "@/lib/profile";
import { isQuietNow, useNotificationPrefs } from "@/lib/notification-prefs";
import { playChime, vibratePulse } from "@/lib/notification-sound";
import { NotificationRow, inferKind } from "@/lib/notification-ui";

function isSocial(n: Notification) {
  const k = inferKind(n);
  return k === "social" || k === "gift" || k === "duel";
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, tags, readIds } = useNotifications();
  const prefs = useNotificationPrefs();

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

  const visible = useMemo(() => {
    if (!prefs.essentialOnly) return notifications;
    const ESSENTIAL_PATTERN = /essenc|import|urg|alerta|critico|crítico/i;
    return notifications.filter((n) => {
      const tag = n.tag_id ? tagMap.get(n.tag_id) : null;
      return tag ? ESSENTIAL_PATTERN.test(tag.name) : false;
    });
  }, [notifications, prefs.essentialOnly, tagMap]);

  const unread = useMemo(() => visible.filter((n) => !readIds.has(n.id)).length, [visible, readIds]);

  const { news, older } = useMemo(() => {
    const news: Notification[] = [];
    const older: Notification[] = [];
    for (const n of visible) {
      if (readIds.has(n.id)) older.push(n);
      else news.push(n);
    }
    return { news, older };
  }, [visible, readIds]);

  // Chime + vibrate when a truly new notification arrives (after first mount).
  const lastIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const current = new Set(visible.map((n) => n.id));
    const prev = lastIdsRef.current;
    lastIdsRef.current = current;
    if (!prev) return;
    let hasNew = false;
    current.forEach((id) => {
      if (!prev.has(id)) hasNew = true;
    });
    if (!hasNew) return;
    if (isQuietNow(prefs)) return;
    if (prefs.sound) playChime();
    if (prefs.vibration) vibratePulse();
  }, [visible, prefs]);

  const quiet = isQuietNow(prefs);

  const handleClick = (n: Notification) => {
    void markAsRead(n.id);
    setOpen(false);
    if (n.action_route) {
      const route = n.action_route;
      const qIdx = route.indexOf("?");
      if (qIdx >= 0) {
        const pathname = route.slice(0, qIdx) || "/";
        const params = new URLSearchParams(route.slice(qIdx + 1));
        const search: Record<string, string> = {};
        params.forEach((v, k) => {
          search[k] = v;
        });
        void navigate({ to: pathname as any, search: search as any });
      } else {
        void navigate({ to: route as any });
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          unread > 0
            ? "text-foreground hover:bg-accent"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
      >
        {quiet ? (
          <BellOff className="h-[18px] w-[18px]" strokeWidth={2.25} />
        ) : (
          <Bell className="h-[18px] w-[18px]" strokeWidth={2.25} />
        )}
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[64px] z-50 w-[min(94vw,420px)] -translate-x-1/2 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[oklch(0.19_0.02_290/0.92)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:translate-x-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-foreground">Notificações</p>
              <p className="mt-0.5 text-[11.5px] text-foreground/55">
                {unread > 0 ? `${unread} nova${unread > 1 ? "s" : ""}` : "Tudo em dia"}
                {prefs.essentialOnly && " · só essenciais"}
                {quiet && " · silencioso"}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {unread > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium text-foreground/80 transition hover:bg-white/[0.06] hover:text-foreground"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Marcar tudo
                </button>
              )}
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 transition hover:bg-white/[0.06] hover:text-foreground"
                title="Preferências"
              >
                <Settings2 className="h-4 w-4" strokeWidth={2.25} />
              </Link>
            </div>
          </div>

          {quiet && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11.5px] text-foreground/70">
              <Moon className="h-3.5 w-3.5 text-primary/80" strokeWidth={2.25} />
              Modo silencioso ativo — sem som nem vibração agora.
            </div>
          )}

          <div className="h-px bg-white/[0.06]" />

          {/* Body */}
          <div className="max-h-[65vh] overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <Inbox className="h-5 w-5 text-foreground/50" strokeWidth={2} />
                </div>
                <p className="mt-1 text-[13px] font-semibold text-foreground/90">Sua caixa está limpa</p>
                <p className="text-[11.5px] text-foreground/55">
                  {prefs.essentialOnly
                    ? "Nenhuma notificação essencial no momento."
                    : "Volte mais tarde para novidades."}
                </p>
              </div>
            ) : (
              <>
                {news.length > 0 && (
                  <div>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                      Novas
                    </p>
                    <ul className="space-y-0.5">
                      {news.slice(0, 5).map((n) => (
                        <li key={n.id}>
                          <NotificationRow
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={false}
                            onClick={() => handleClick(n)}
                            compact
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {older.length > 0 && (
                  <div>
                    {news.length > 0 && <div className="mx-3 my-1 h-px bg-white/[0.05]" />}
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                      Anteriores
                    </p>
                    <ul className="space-y-0.5">
                      {older.slice(0, 4).map((n) => (
                        <li key={n.id}>
                          <NotificationRow
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={true}
                            onClick={() => handleClick(n)}
                            compact
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-3 py-2.5">
            <Link
              to="/notificacoes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-2 py-1.5 text-[12px] font-medium text-foreground/70 transition hover:bg-white/[0.04] hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                Ver central completa
              </span>
              <ChevronRight className="h-4 w-4 text-foreground/40" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
