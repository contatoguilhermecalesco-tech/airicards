import { useMemo, useState, useCallback } from "react";
import {
  Bell,
  Gift,
  Swords,
  Trophy,
  Flame,
  Sparkles,
  Zap,
  Heart,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Megaphone,
  Calendar,
  GraduationCap,
  BookOpen,
  PenLine,
  Headphones,
  Mic,
  Languages,
  Target,
  Rocket,
  Clock,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { RankEmblem } from "@/components/RankBadge";
import { StreakFlame } from "@/components/StreakFlame";
import { ShardArt } from "@/components/hunt/ShardArt";
import { getEquippedArt } from "@/lib/shop-asset-overrides";
import { profileMeta, type ProfileId } from "@/lib/social-store";
import { useCurrentProfile } from "@/lib/profile";
import type { Notification, NotificationTag } from "@/lib/notifications-store";

export type NotifKind =
  | "shard"
  | "duel"
  | "gift"
  | "rank"
  | "streak"
  | "social"
  | "system"
  | "study"
  | "event"
  | "default";

export function inferKind(n: Notification): NotifKind {
  const s = `${n.title} ${n.body} ${n.action_route ?? ""}`.toLowerCase();
  if (/fragmento|shard|relic|cosmetic|skin|forja/.test(s)) return "shard";
  if (/duelo|duel|desafio/.test(s)) return "duel";
  if (/presente|gift|cart.a enviad|recebeu uma carta/.test(s)) return "gift";
  if (/rank|elo|subiu|promovido|tier|division/.test(s)) return "rank";
  if (/streak|sequencia|fogo|chama|dia seguido/.test(s)) return "streak";
  if (/kudos|reagiu|curtiu|comentou|social|feed/.test(s)) return "social";
  if (/prova|exam|estudo|study|licao|lição|reading|listening|writing|speaking|grammar/.test(s)) return "study";
  if (/evento|event|calend|agenda/.test(s)) return "event";
  return "system";
}

export function kindLabel(kind: NotifKind): string {
  switch (kind) {
    case "shard":
      return "Fragmento";
    case "duel":
      return "Duelo";
    case "gift":
      return "Presente";
    case "rank":
      return "Rank";
    case "streak":
      return "Streak";
    case "social":
      return "Social";
    case "study":
      return "Estudo";
    case "event":
      return "Evento";
    default:
      return "Sistema";
  }
}

export function kindIcon(kind: NotifKind): LucideIcon {
  switch (kind) {
    case "shard":
      return Sparkles;
    case "duel":
      return Swords;
    case "gift":
      return Gift;
    case "rank":
      return Trophy;
    case "streak":
      return Flame;
    case "social":
      return Heart;
    case "study":
      return GraduationCap;
    case "event":
      return Calendar;
    default:
      return Bell;
  }
}

export function timeGroup(iso: string): "today" | "yesterday" | "week" | "older" {
  const t = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - (startOfToday.getDay() || 7) * 86400000);

  if (t >= startOfToday) return "today";
  if (t >= startOfYesterday) return "yesterday";
  if (t >= startOfWeek) return "week";
  return "older";
}

export function groupLabel(key: "today" | "yesterday" | "week" | "older"): string {
  switch (key) {
    case "today":
      return "Hoje";
    case "yesterday":
      return "Ontem";
    case "week":
      return "Esta semana";
    default:
      return "Anteriores";
  }
}

export function timeAgo(iso: string) {
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

function parseRoute(route?: string | null): { to: string; search?: Record<string, string> } | null {
  if (!route) return null;
  const qIdx = route.indexOf("?");
  if (qIdx < 0) return { to: route };
  const to = route.slice(0, qIdx) || "/";
  const search: Record<string, string> = {};
  new URLSearchParams(route.slice(qIdx + 1)).forEach((v, k) => {
    search[k] = v;
  });
  return { to, search };
}

function extractProfileId(text: string): ProfileId | null {
  if (/guilherme|gui/i.test(text) && !/arlayne/i.test(text)) return "guilherme";
  if (/arlayne/i.test(text) && !/guilherme/i.test(text)) return "arlayne";
  return null;
}

function extractCosmeticId(text: string): string | null {
  // Tenta encontrar ids do tipo cosmetic.* ou bundle.* mencionados no texto.
  const m = text.match(/(cosmetic|bundle)\.[a-z_0-9.]+/);
  return m ? m[0] : null;
}

function extractTier(text: string): { tier?: string; division?: number } | null {
  const tierMatch = text.match(/(iron|bronze|silver|gold|platinum|diamond|master|grandmaster|challenger)/i);
  if (!tierMatch) return null;
  const divMatch = text.match(/(iv|iii|ii|i)\b/i);
  const roman: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4 };
  return { tier: tierMatch[1].toLowerCase(), division: divMatch ? roman[divMatch[1].toLowerCase()] : undefined };
}

export function NotificationVisual({
  n,
  tag,
  size = 44,
}: {
  n: Notification;
  tag?: NotificationTag | null;
  size?: number;
}) {
  const kind = inferKind(n);
  const accent = tag?.color ?? "hsl(var(--primary))";

  if (kind === "shard") {
    const cosmeticId = extractCosmeticId(`${n.title} ${n.body} ${n.action_route ?? ""}`);
    const art = cosmeticId ? getEquippedArt(cosmeticId) : null;
    return (
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08]"
        style={{ width: size, height: size, background: `color-mix(in oklab, ${accent} 12%, transparent)` }}
      >
        {art ? (
          <img src={art} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <Sparkles className="h-5 w-5" style={{ color: accent }} strokeWidth={2.2} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    );
  }

  if (kind === "duel") {
    const p1 = extractProfileId(n.title) ?? "guilherme";
    const p2 = p1 === "guilherme" ? "arlayne" : "guilherme";
    const m1 = profileMeta(p1);
    const m2 = profileMeta(p2);
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ProfileAvatar initial={m1.initial} gradient={m1.gradient} size={size * 0.62} className="absolute left-0 top-0" />
        <ProfileAvatar
          initial={m2.initial}
          gradient={m2.gradient}
          size={size * 0.62}
          className="absolute bottom-0 right-0"
        />
        <div className="absolute left-1/2 top-1/2 z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background ring-1 ring-white/10">
          <Swords className="h-2.5 w-2.5 text-foreground/80" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  if (kind === "gift" || kind === "social") {
    const fromId = extractProfileId(n.title) ?? extractProfileId(n.body) ?? "guilherme";
    const meta = profileMeta(fromId);
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ProfileAvatar initial={meta.initial} gradient={meta.gradient} size={size} />
        <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-background ring-1 ring-white/10">
          {kind === "gift" ? (
            <Gift className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
          ) : (
            <Heart className="h-2.5 w-2.5 text-rose-400" strokeWidth={2.5} />
          )}
        </div>
      </div>
    );
  }

  if (kind === "rank") {
    const parsed = extractTier(`${n.title} ${n.body}`);
    if (parsed?.tier) {
      return (
        <div className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
          <RankEmblem
            tier={parsed.tier as any}
            division={(parsed.division ?? 4) as any}
            size={size * 1.15}
          />
        </div>
      );
    }
  }

  if (kind === "streak") {
    return (
      <div className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <StreakFlame count={7} size={size} />
      </div>
    );
  }

  const Icon = kindIcon(kind);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl border"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklab, ${accent} 14%, transparent)`,
        borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
      }}
    >
      <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={2.2} />
    </div>
  );
}

const REACTION_EMOJIS = ["🔥", "❤️", "👏", "🎁", "😮"];

function reactionsKey(notificationId: string) {
  return `airi.notif.reactions.${notificationId}`;
}

function readReactions(notificationId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(reactionsKey(notificationId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeReactions(notificationId: string, list: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(reactionsKey(notificationId), JSON.stringify(list));
}

export function NotificationReactions({ notificationId }: { notificationId: string }) {
  const [picked, setPicked] = useState<string[]>(() => readReactions(notificationId));

  const toggle = useCallback(
    (emoji: string) => {
      const next = picked.includes(emoji) ? picked.filter((e) => e !== emoji) : [...picked, emoji];
      setPicked(next);
      writeReactions(notificationId, next);
    },
    [picked, notificationId],
  );

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const active = picked.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              toggle(emoji);
            }}
            className={`inline-flex h-7 items-center justify-center rounded-full px-2 text-[13px] transition ${
              active
                ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                : "bg-white/[0.04] text-foreground/60 hover:bg-white/[0.08] hover:text-foreground"
            }`}
            aria-pressed={active}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

export function NotificationRow({
  n,
  tag,
  isRead,
  onClick,
  compact = false,
}: {
  n: Notification;
  tag?: NotificationTag | null;
  isRead: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const kind = inferKind(n);
  const accent = tag?.color ?? "hsl(var(--primary))";
  const route = parseRoute(n.action_route);

  const body = (
    <div
      className={`group relative flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.04] active:bg-white/[0.06] ${
        isRead ? "opacity-75" : "opacity-100"
      } ${compact ? "" : "sm:px-4 sm:py-3"}`}
    >
      <div className="relative mt-0.5 shrink-0">
        <NotificationVisual n={n} tag={tag} size={compact ? 40 : 48} />
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
          <p
            className={`truncate ${compact ? "text-[13px]" : "text-[14px]"} font-semibold tracking-tight ${
              isRead ? "text-foreground/80" : "text-foreground"
            }`}
          >
            {n.title}
          </p>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground/50">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p
          className={`mt-0.5 line-clamp-2 ${compact ? "text-[11.5px]" : "text-[12.5px]"} leading-relaxed text-foreground/70`}
        >
          {n.body}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {tag && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tag.color }} aria-hidden />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: tag.color }}
              >
                {tag.name}
              </span>
            </span>
          )}
          <span className="text-[10px] font-medium text-foreground/40">· {kindLabel(kind)}</span>
          {n.action_route && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
              {n.action_label?.trim() || "Abrir"}
            </span>
          )}
        </div>
        {!compact && (kind === "social" || kind === "gift") && <NotificationReactions notificationId={n.id} />}
      </div>
    </div>
  );

  if (route && onClick) {
    return (
      <button onClick={onClick} className="block w-full">
        {body}
      </button>
    );
  }

  if (route) {
    return (
      <Link
        to={route.to as any}
        search={route.search as any}
        className="block w-full"
        onClick={() => onClick?.()}
      >
        {body}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="block w-full">
      {body}
    </button>
  );
}
