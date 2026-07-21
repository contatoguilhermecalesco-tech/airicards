import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  Settings2,
  Moon,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Trophy,
  Flame,
  Megaphone,
  Calendar,
  Gift,
  Zap,
  Heart,
  Info,
  GraduationCap,
  PenLine,
  Headphones,
  Mic,
  Languages,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  initNotifications,
  markAllAsRead,
  markAsRead,
  useNotifications,
} from "@/lib/notifications-store";
import { subscribeProfile } from "@/lib/profile";
import { isQuietNow, useNotificationPrefs } from "@/lib/notification-prefs";
import { playChime, vibratePulse } from "@/lib/notification-sound";

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
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const ESSENTIAL_PATTERN = /essenc|import|urg|alerta|critico|crítico/i;
function isEssentialTag(name?: string | null) {
  if (!name) return false;
  return ESSENTIAL_PATTERN.test(name);
}

type Notif = ReturnType<typeof useNotifications>["notifications"][number];
type Tag = ReturnType<typeof useNotifications>["tags"][number];

function iconFor(tagName?: string | null, title?: string): LucideIcon {
  const s = `${tagName ?? ""} ${title ?? ""}`.toLowerCase();
  if (/urg|alerta|crit|import/.test(s)) return AlertTriangle;
  if (/conquist|trof|troph|medalh|record/.test(s)) return Trophy;
  if (/streak|sequ[eê]ncia|fogo|flame/.test(s)) return Flame;
  if (/dica|tip|estud|aprend|licao|lição/.test(s)) return GraduationCap;
  if (/leit|read/.test(s)) return BookOpen;
  if (/escri|writ|reda/.test(s)) return PenLine;
  if (/listen|escut|áudio|audio/.test(s)) return Headphones;
  if (/speak|fala|pron/.test(s)) return Mic;
  if (/gram[aá]t|vocab|idioma|ingl/.test(s)) return Languages;
  if (/event|agenda|calend/.test(s)) return Calendar;
  if (/novidade|update|anunc|notíci|noticia/.test(s)) return Megaphone;
  if (/presente|gift|recomp|bônus|bonus/.test(s)) return Gift;
  if (/energ|boost|r[aá]pido|zap/.test(s)) return Zap;
  if (/amor|coraç|love|favorit/.test(s)) return Heart;
  if (/info|aviso/.test(s)) return Info;
  return Sparkles;
}

function Row({
  n,
  tag,
  isRead,
  onClick,
}: {
  n: Notif;
  tag: Tag | null;
  isRead: boolean;
  onClick: () => void;
}) {
  const accent = tag?.color ?? "hsl(var(--primary))";
  const Icon = iconFor(tag?.name, n.title);
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.04] active:bg-white/[0.06] ${
        isRead ? "opacity-70" : "opacity-100"
      }`}
    >
      <div className="relative mt-0.5 shrink-0">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-2xl border"
          style={{
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
            boxShadow: isRead ? "none" : `0 0 14px -4px ${accent}`,
          }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
            style={{ color: accent }}
          />
        </div>
        {!isRead && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[oklch(0.19_0.02_290)]"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`truncate text-[14px] font-semibold tracking-tight ${isRead ? "text-foreground/80" : "text-foreground"}`}>
            {n.title}
          </p>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground/50">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-foreground/70">
          {n.body}
        </p>
        {tag && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: tag.color }}
              aria-hidden
            />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: tag.color }}>
              {tag.name}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
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

  // Apply "essential only" filter — keeps only notifications whose tag looks essential.
  const visible = useMemo(() => {
    if (!prefs.essentialOnly) return notifications;
    return notifications.filter((n) => {
      const tag = n.tag_id ? tagMap.get(n.tag_id) : null;
      return isEssentialTag(tag?.name);
    });
  }, [notifications, prefs.essentialOnly, tagMap]);

  const unread = useMemo(
    () => visible.filter((n) => !readIds.has(n.id)).length,
    [visible, readIds],
  );

  const { news, older } = useMemo(() => {
    const news: Notif[] = [];
    const older: Notif[] = [];
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
    if (!prev) return; // first load — don't chime
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
        <div className="fixed left-1/2 top-[64px] z-50 w-[min(94vw,380px)] -translate-x-1/2 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[oklch(0.19_0.02_290/0.92)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:translate-x-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-foreground">
                Notificações
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground/55">
                {unread > 0
                  ? `${unread} nova${unread > 1 ? "s" : ""}`
                  : "Tudo em dia"}
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
                <p className="mt-1 text-[13px] font-semibold text-foreground/90">
                  Sua caixa está limpa
                </p>
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
                      {news.map((n) => (
                        <li key={n.id}>
                          <Row
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={false}
                            onClick={() => void markAsRead(n.id)}
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
                      {older.map((n) => (
                        <li key={n.id}>
                          <Row
                            n={n}
                            tag={n.tag_id ? tagMap.get(n.tag_id) ?? null : null}
                            isRead={true}
                            onClick={() => void markAsRead(n.id)}
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
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between text-[11.5px] font-medium text-foreground/70 transition hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                Preferências de notificação
              </span>
              <span className="text-foreground/40">›</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
