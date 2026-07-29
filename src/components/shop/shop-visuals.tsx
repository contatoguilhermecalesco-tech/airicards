// Shared visual system for the airi Shop.
// Rarity tiers, accents, iconography, Discord-style profile preview helpers.
import { AURA_PROFILES } from "@/lib/aura";
import { AuraRing } from "@/components/AuraRing";
import { useCurrentProfile } from "@/lib/profile";
import { useProfileAvatar } from "@/lib/profile-avatars";
import type { ShopItem } from "@/lib/shop";
import {
  BookOpen,
  Briefcase,
  Crown,
  Flame,
  Gift,
  Heart,
  Layers,

  Moon,
  Palette,
  Plane,
  Plus,
  Shield,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideProps,
} from "lucide-react";

/* ---------------------- Rarity system ---------------------- */

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY_META: Record<
  Rarity,
  {
    label: string;
    // background gradient for banners / hero
    gradient: string;
    // solid ring color for borders/glow
    ring: string;
    // small chip classes (bg + text + border)
    chip: string;
    // border classes for cards
    border: string;
    // glow color rgba
    glow: string;
    // priority for "featured" pick
    weight: number;
  }
> = {
  common: {
    label: "Padrão",
    gradient: "linear-gradient(135deg,#3f3f46 0%,#27272a 100%)",
    ring: "#a1a1aa",
    chip: "border-white/15 bg-white/[0.06] text-white/70",
    border: "border-white/10",
    glow: "rgba(161,161,170,0.25)",
    weight: 1,
  },
  rare: {
    label: "Raro",
    gradient: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 50%,#0c4a6e 100%)",
    ring: "#38bdf8",
    chip: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    border: "border-sky-400/30",
    glow: "rgba(56,189,248,0.35)",
    weight: 2,
  },
  epic: {
    label: "Épico",
    gradient: "linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 45%,#4c1d95 100%)",
    ring: "#a78bfa",
    chip: "border-violet-400/40 bg-violet-500/15 text-violet-200",
    border: "border-violet-400/30",
    glow: "rgba(167,139,250,0.4)",
    weight: 3,
  },
  legendary: {
    label: "Lendário",
    gradient:
      "linear-gradient(135deg,#fef3c7 0%,#f59e0b 45%,#92400e 100%)",
    ring: "#fbbf24",
    chip: "border-amber-400/45 bg-amber-500/15 text-amber-200",
    border: "border-amber-400/40",
    glow: "rgba(251,191,36,0.45)",
    weight: 4,
  },
  mythic: {
    label: "Mítico",
    gradient:
      "linear-gradient(135deg,#f472b6 0%,#a855f7 40%,#3b0764 100%)",
    ring: "#f0abfc",
    chip: "border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-200",
    border: "border-fuchsia-400/45",
    glow: "rgba(240,171,252,0.5)",
    weight: 5,
  },
};

export function rarityFor(price: number): Rarity {
  if (price >= 501) return "mythic";
  if (price >= 351) return "legendary";
  if (price >= 201) return "epic";
  if (price >= 101) return "rare";
  return "common";
}

export const RARITY_ORDER: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

/* ---------------------- Icons & accents ---------------------- */

export const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  plane: Plane,
  briefcase: Briefcase,
  sparkles: Sparkles,
  crown: Crown,
  shield: Shield,
  zap: Zap,
  plus: Plus,
  palette: Palette,
  flame: Flame,
  moon: Moon,
  sun: Sun,
  book: BookOpen,
  swords: Swords,
  star: Star,
  target: Target,
  trophy: Trophy,
  heart: Heart,
  gift: Gift,
};

export const ACCENTS: Record<string, string> = {
  sky: "from-sky-400/20 to-sky-500/10 text-sky-200 border-sky-400/30",
  amber: "from-amber-400/20 to-orange-500/10 text-amber-200 border-amber-400/30",
  pink: "from-pink-400/20 to-fuchsia-500/10 text-pink-200 border-pink-400/30",
  violet: "from-violet-400/20 to-purple-500/10 text-violet-200 border-violet-400/30",
  emerald: "from-emerald-400/20 to-teal-500/10 text-emerald-200 border-emerald-400/30",
  lavender: "from-indigo-400/20 to-violet-500/10 text-indigo-200 border-indigo-400/30",
};

/* ---------------------- Cosmetic slots & profile preview ---------------------- */

export type CosmeticVisual = {
  slot: "nameplate" | "decoration" | "badge" | "effect" | "generic";
  gradient: string;
  ring: string;
  chip: string;
  tag: string;
};

const DISCORD_PALETTE: Record<
  string,
  { gradient: string; ring: string; tag: string }
> = {
  sky: {
    gradient: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 45%,#1e3a8a 100%)",
    ring: "#38bdf8",
    tag: "Ártico",
  },
  amber: {
    gradient: "linear-gradient(135deg,#fde68a 0%,#f59e0b 45%,#b45309 100%)",
    ring: "#f59e0b",
    tag: "Solar",
  },
  pink: {
    gradient: "linear-gradient(135deg,#fbcfe8 0%,#ec4899 40%,#831843 100%)",
    ring: "#f472b6",
    tag: "Blossom",
  },
  violet: {
    gradient: "linear-gradient(135deg,#c4b5fd 0%,#8b5cf6 40%,#4c1d95 100%)",
    ring: "#a78bfa",
    tag: "Nebulosa",
  },
  emerald: {
    gradient: "linear-gradient(135deg,#a7f3d0 0%,#10b981 40%,#065f46 100%)",
    ring: "#34d399",
    tag: "Bosque",
  },
  lavender: {
    gradient: "linear-gradient(135deg,#e0e7ff 0%,#818cf8 40%,#3730a3 100%)",
    ring: "#a5b4fc",
    tag: "Lilás",
  },
  crimson: {
    gradient: "linear-gradient(135deg,#fda4af 0%,#e11d48 42%,#4c0519 100%)",
    ring: "#f43f5e",
    tag: "Eclipse",
  },
};

export function visualFor(item: ShopItem): CosmeticVisual {
  const slotRaw = String(item.payload.slot ?? "cosmetic").toLowerCase();
  const p = DISCORD_PALETTE[item.accent] ?? DISCORD_PALETTE.violet;
  let slot: CosmeticVisual["slot"] = "generic";
  if (
    slotRaw.includes("frame") ||
    slotRaw.includes("deck") ||
    slotRaw.includes("nameplate")
  )
    slot = "nameplate";
  else if (slotRaw.includes("aura") || slotRaw.includes("decoration"))
    slot = "decoration";
  else if (slotRaw.includes("badge") || slotRaw.includes("emblem"))
    slot = "badge";
  else if (slotRaw.includes("theme") || slotRaw.includes("effect"))
    slot = "effect";
  return {
    slot,
    gradient: p.gradient,
    ring: p.ring,
    chip: "text-white/85",
    tag: p.tag,
  };
}

export function slotLabel(v: CosmeticVisual["slot"]): string {
  switch (v) {
    case "nameplate":
      return "Nameplate";
    case "decoration":
      return "Decoração de avatar";
    case "badge":
      return "Badge de perfil";
    case "effect":
      return "Efeito de perfil";
    default:
      return "Cosmético";
  }
}

/* ---------------------- Discord-style avatar ---------------------- */

export function DiscordAvatar({
  size = 48,
  ring,
  showDecoration,
  initial = "G",
  auraKey,
}: {
  size?: number;
  ring: string;
  showDecoration: boolean;
  initial?: string;
  auraKey?: string | null;
}) {
  const profile = useCurrentProfile();
  const avatarUrl = useProfileAvatar(profile?.id);
  const auraProfile =
    showDecoration && auraKey ? (AURA_PROFILES[auraKey] ?? null) : null;
  const inner = size - (showDecoration ? 10 : 0);
  const displayInitial =
    profile?.name?.charAt(0)?.toUpperCase() ?? initial;
  const inside = (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {showDecoration && !auraProfile && (
        <>
          <span
            className="cosmetic-ring-spin absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${ring}, transparent 35%, ${ring} 65%, transparent 100%)`,
              filter: "blur(0.5px)",
            }}
          />
          <span
            className="cosmetic-glow-pulse absolute -inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${ring}55, transparent 65%)`,
              filter: "blur(6px)",
            }}
          />
          <span
            className="absolute inset-[3px] rounded-full"
            style={{ background: "#1e1f22" }}
          />
        </>
      )}
      {showDecoration && auraProfile && (
        <span
          className="absolute inset-[3px] rounded-full"
          style={{ background: "#1e1f22" }}
        />
      )}
      <div
        className="relative grid place-items-center overflow-hidden rounded-full text-white font-semibold"
        style={{
          width: inner,
          height: inner,
          background: avatarUrl
            ? "#000"
            : "linear-gradient(135deg,#5865f2 0%,#7c3aed 100%)",
          fontSize: inner * 0.42,
          boxShadow: showDecoration ? `0 0 12px ${ring}55` : "none",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          displayInitial
        )}
      </div>
      <span
        className="absolute rounded-full border-2"
        style={{
          width: inner * 0.28,
          height: inner * 0.28,
          right: showDecoration ? 4 : 0,
          bottom: showDecoration ? 4 : 0,
          background: "#23a55a",
          borderColor: "#1e1f22",
        }}
      />
    </div>
  );
  if (auraProfile) {
    return (
      <AuraRing size={size} profile={auraProfile}>
        {inside}
      </AuraRing>
    );
  }
  return inside;
}

/* ---------------------- Mini profile card ---------------------- */

export function MiniProfileCard({
  item,
  showBadge,
}: {
  item: ShopItem;
  showBadge?: boolean;
}) {
  const v = visualFor(item);
  const Icon = ICONS[item.icon] ?? Sparkles;
  const showBanner = v.slot === "nameplate" || v.slot === "effect";
  const showDecoration = v.slot === "decoration";
  const isBadge = v.slot === "badge" || showBadge;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5"
      style={{ background: "#232428" }}
    >
      <div
        className={`relative h-14 w-full overflow-hidden ${
          showBanner ? "cosmetic-banner-animated" : ""
        }`}
        style={{
          background: showBanner
            ? v.gradient
            : "linear-gradient(135deg,#2b2d31,#1e1f22)",
        }}
      >
        {showBanner && (
          <span
            aria-hidden
            className="cosmetic-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        )}
      </div>
      <div className="relative px-3 pb-3 pt-0">
        <div className="-mt-6 flex items-end justify-between gap-2">
          <div
            className={`rounded-full ${showDecoration ? "cosmetic-avatar-float" : ""}`}
            style={{ padding: 3, background: "#232428" }}
          >
            <DiscordAvatar
              size={44}
              ring={v.ring}
              showDecoration={showDecoration}
              auraKey={String(item.payload.key ?? "")}
            />
          </div>
          {isBadge && (
            <span
              className="relative mb-1 inline-flex items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
              style={{ background: v.gradient }}
            >
              <span
                aria-hidden
                className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                }}
              />
              <Icon className="relative h-3 w-3" strokeWidth={2.75} />
              <span className="relative">{v.tag}</span>
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-white leading-tight">
          Guilherme
        </p>
        <p className="text-[11px] text-white/50 leading-tight">
          <span className="text-white/70">guilherme</span>
          <span className="text-white/40">.airi.com.br</span>
        </p>
      </div>
    </div>
  );
}

/* ---------------------- Rarity chip ---------------------- */

export function RarityChip({
  rarity,
  size = "sm",
}: {
  rarity: Rarity;
  size?: "sm" | "md";
}) {
  const r = RARITY_META[rarity];
  const pad = size === "md" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wider ${pad} ${r.chip}`}
    >
      {r.label}
    </span>
  );
}

/* ---------------------- Power-up cover ---------------------- */

// Per-accent palette for power-up covers. Each entry paints a layered
// radial + linear background, a soft halo behind the icon and orbital
// sparkle colors — so covers feel like collectibles, not flat swatches.
const POWERUP_PALETTE: Record<
  string,
  { base: string; halo: string; ring: string; spark: string; tag: string }
> = {
  sky: {
    base: "radial-gradient(120% 100% at 20% 15%, #38bdf8 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #1e3a8a 0%, transparent 60%), linear-gradient(160deg,#0c1a3b 0%,#0a1024 100%)",
    halo: "rgba(56,189,248,0.55)",
    ring: "#7dd3fc",
    spark: "#e0f2fe",
    tag: "Protetor",
  },
  amber: {
    base: "radial-gradient(120% 100% at 25% 20%, #fbbf24 0%, transparent 55%), radial-gradient(140% 100% at 90% 100%, #7c2d12 0%, transparent 60%), linear-gradient(160deg,#3b1a0a 0%,#1a0b06 100%)",
    halo: "rgba(251,191,36,0.55)",
    ring: "#fcd34d",
    spark: "#fef3c7",
    tag: "Aurífero",
  },
  violet: {
    base: "radial-gradient(120% 100% at 20% 15%, #a78bfa 0%, transparent 55%), radial-gradient(130% 100% at 95% 95%, #3b0764 0%, transparent 60%), linear-gradient(160deg,#1e1244 0%,#0d0821 100%)",
    halo: "rgba(167,139,250,0.55)",
    ring: "#c4b5fd",
    spark: "#ede9fe",
    tag: "Arcano",
  },
  lavender: {
    base: "radial-gradient(120% 100% at 25% 15%, #818cf8 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #312e81 0%, transparent 60%), linear-gradient(160deg,#171a3a 0%,#0a0b1c 100%)",
    halo: "rgba(165,180,252,0.55)",
    ring: "#a5b4fc",
    spark: "#e0e7ff",
    tag: "Etéreo",
  },
  pink: {
    base: "radial-gradient(120% 100% at 25% 15%, #f472b6 0%, transparent 55%), radial-gradient(120% 100% at 90% 95%, #831843 0%, transparent 60%), linear-gradient(160deg,#3a0f28 0%,#1a0713 100%)",
    halo: "rgba(244,114,182,0.55)",
    ring: "#f9a8d4",
    spark: "#fce7f3",
    tag: "Coração",
  },
  emerald: {
    base: "radial-gradient(120% 100% at 20% 15%, #34d399 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #064e3b 0%, transparent 60%), linear-gradient(160deg,#0a2e26 0%,#04140f 100%)",
    halo: "rgba(52,211,153,0.55)",
    ring: "#6ee7b7",
    spark: "#d1fae5",
    tag: "Verdejante",
  },
};

export function powerupPalette(accent: string) {
  return POWERUP_PALETTE[accent] ?? POWERUP_PALETTE.violet;
}

export function PowerupCover({
  accent,
  icon,
  height = "h-28",
  badge,
}: {
  accent: string;
  icon: string;
  height?: string;
  badge?: string;
}) {
  const p = powerupPalette(accent);
  const Icon = ICONS[icon] ?? Sparkles;
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${height}`}
      style={{ background: p.base }}
    >
      {/* subtle dot grid to add texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(120% 100% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* halo behind the icon */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full cosmetic-glow-pulse"
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle, ${p.halo} 0%, transparent 65%)`,
          filter: "blur(6px)",
        }}
      />

      {/* orbital sparkles */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full cosmetic-sparkle"
          style={{
            background: p.spark,
            boxShadow: `0 0 8px ${p.spark}`,
            transform: `rotate(${i * 90}deg) translate(48px) rotate(-${i * 90}deg)`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      {/* shine sweep */}
      <span
        aria-hidden
        className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
        }}
      />

      {/* central icon medallion */}
      <span
        className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border text-white backdrop-blur"
        style={{
          width: 56,
          height: 56,
          background: "rgba(0,0,0,0.32)",
          borderColor: p.ring,
          boxShadow: `0 0 24px ${p.halo}`,
        }}
      >
        <Icon className="h-7 w-7" strokeWidth={2.1} style={{ color: p.ring }} />
      </span>

      {/* accent tag top-left */}
      <span
        className="absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur"
        style={{
          borderColor: `${p.ring}66`,
          background: "rgba(0,0,0,0.35)",
        }}
      >
        Power-up · {p.tag}
      </span>

      {badge && (
        <span
          className="absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur"
          style={{
            borderColor: `${p.ring}55`,
            background: "rgba(0,0,0,0.35)",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function powerupBadge(payload: Record<string, unknown>): string | undefined {
  const uses = Number(payload?.uses);
  const dur = Number(payload?.duration_h);
  const max = Number(payload?.max);
  if (Number.isFinite(dur) && dur > 0) return `${dur}h`;
  if (Number.isFinite(max) && max > 1) return `Estoca ${max}`;
  if (Number.isFinite(uses) && uses > 1) return `${uses} usos`;
  return undefined;
}

/* ---------------------- Deck & Pack covers ---------------------- */

const COLLECTION_PALETTE: Record<
  string,
  { base: string; edge: string; glow: string; spark: string; tag: string }
> = {
  lavender: {
    base: "radial-gradient(120% 100% at 20% 15%, #a5b4fc 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #312e81 0%, transparent 60%), linear-gradient(160deg,#171a3a 0%,#0a0b1c 100%)",
    edge: "#a5b4fc",
    glow: "rgba(165,180,252,0.55)",
    spark: "#e0e7ff",
    tag: "Lilás",
  },
  violet: {
    base: "radial-gradient(120% 100% at 20% 15%, #a78bfa 0%, transparent 55%), radial-gradient(130% 100% at 95% 95%, #3b0764 0%, transparent 60%), linear-gradient(160deg,#1e1244 0%,#0d0821 100%)",
    edge: "#c4b5fd",
    glow: "rgba(167,139,250,0.55)",
    spark: "#ede9fe",
    tag: "Arcano",
  },
  sky: {
    base: "radial-gradient(120% 100% at 20% 15%, #38bdf8 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #1e3a8a 0%, transparent 60%), linear-gradient(160deg,#0c1a3b 0%,#0a1024 100%)",
    edge: "#7dd3fc",
    glow: "rgba(56,189,248,0.5)",
    spark: "#e0f2fe",
    tag: "Ártico",
  },
  amber: {
    base: "radial-gradient(120% 100% at 25% 20%, #fbbf24 0%, transparent 55%), radial-gradient(140% 100% at 90% 100%, #7c2d12 0%, transparent 60%), linear-gradient(160deg,#3b1a0a 0%,#1a0b06 100%)",
    edge: "#fcd34d",
    glow: "rgba(251,191,36,0.5)",
    spark: "#fef3c7",
    tag: "Solar",
  },
  pink: {
    base: "radial-gradient(120% 100% at 25% 15%, #f472b6 0%, transparent 55%), radial-gradient(120% 100% at 90% 95%, #831843 0%, transparent 60%), linear-gradient(160deg,#3a0f28 0%,#1a0713 100%)",
    edge: "#f9a8d4",
    glow: "rgba(244,114,182,0.5)",
    spark: "#fce7f3",
    tag: "Blossom",
  },
  emerald: {
    base: "radial-gradient(120% 100% at 20% 15%, #34d399 0%, transparent 55%), radial-gradient(120% 100% at 90% 90%, #064e3b 0%, transparent 60%), linear-gradient(160deg,#0a2e26 0%,#04140f 100%)",
    edge: "#6ee7b7",
    glow: "rgba(52,211,153,0.5)",
    spark: "#d1fae5",
    tag: "Verdejante",
  },
};

export function collectionPalette(key: string) {
  return COLLECTION_PALETTE[key] ?? COLLECTION_PALETTE.violet;
}

export function DeckCover({
  accent,
  height = "h-28",
  cardCount,
  owner,
}: {
  accent: string;
  height?: string;
  cardCount?: number;
  owner?: string;
}) {
  const p = collectionPalette(accent);
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${height}`}
      style={{ background: p.base }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(120% 100% at 50% 55%, black 40%, transparent 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full cosmetic-glow-pulse"
        style={{
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${p.glow} 0%, transparent 65%)`,
          filter: "blur(8px)",
        }}
      />
      {[-14, 0, 14].map((rot, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-lg border backdrop-blur"
          style={{
            width: 46,
            height: 62,
            transform: `translate(-50%,-50%) rotate(${rot}deg) translateY(-2px)`,
            background: i === 1 ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.35)",
            borderColor: `${p.edge}${i === 1 ? "cc" : "55"}`,
            boxShadow: i === 1 ? `0 6px 22px -4px ${p.glow}` : "none",
          }}
        >
          <span
            className="absolute left-1.5 right-1.5 top-2 h-[2px] rounded-full"
            style={{ background: `${p.edge}aa` }}
          />
          <span
            className="absolute left-1.5 top-5 h-[2px] w-6 rounded-full"
            style={{ background: `${p.edge}66` }}
          />
          <span
            className="absolute left-1.5 top-7 h-[2px] w-4 rounded-full"
            style={{ background: `${p.edge}55` }}
          />
        </span>
      ))}
      <span
        aria-hidden
        className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
        }}
      />
      <span
        className="absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur"
        style={{ borderColor: `${p.edge}66`, background: "rgba(0,0,0,0.35)" }}
      >
        Deck · {p.tag}
      </span>
      {typeof cardCount === "number" && cardCount > 0 && (
        <span
          className="absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur"
          style={{ borderColor: `${p.edge}55`, background: "rgba(0,0,0,0.35)" }}
        >
          {cardCount} cartas
        </span>
      )}
      {owner && (
        <span
          className="absolute bottom-2 left-3 rounded-full px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          por {owner}
        </span>
      )}
    </div>
  );
}

export function PackCover({
  accent,
  height = "h-28",
  deckCount,
}: {
  accent: string;
  height?: string;
  deckCount?: number;
}) {
  const p = collectionPalette(accent);
  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden ${height}`}
      style={{ background: p.base }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(120% 100% at 50% 55%, black 40%, transparent 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full cosmetic-glow-pulse"
        style={{
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${p.glow} 0%, transparent 65%)`,
          filter: "blur(8px)",
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border"
        style={{
          width: 84,
          height: 66,
          background: "rgba(0,0,0,0.35)",
          borderColor: `${p.edge}99`,
          boxShadow: `0 10px 26px -6px ${p.glow}`,
        }}
      >
        <span
          className="absolute left-0 right-0 top-3 h-3 rounded-sm"
          style={{ background: `${p.edge}55` }}
        />
        <span
          className="absolute top-0 bottom-0 left-1/2 w-2 -translate-x-1/2"
          style={{ background: `${p.edge}cc` }}
        />
        <span
          className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2"
          style={{ background: `${p.edge}cc` }}
        />
        <span
          className="absolute left-1/2 top-0 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: p.edge, boxShadow: `0 0 10px ${p.glow}` }}
        />
      </span>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full cosmetic-sparkle"
          style={{
            background: p.spark,
            boxShadow: `0 0 8px ${p.spark}`,
            transform: `rotate(${i * 90 + 30}deg) translate(54px) rotate(-${i * 90 + 30}deg)`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      <span
        aria-hidden
        className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        }}
      />
      <span
        className="absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur"
        style={{ borderColor: `${p.edge}66`, background: "rgba(0,0,0,0.35)" }}
      >
        Pack · {p.tag}
      </span>
      {typeof deckCount === "number" && deckCount > 0 && (
        <span
          className="absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur"
          style={{ borderColor: `${p.edge}55`, background: "rgba(0,0,0,0.35)" }}
        >
          {deckCount} decks
        </span>
      )}
    </div>
  );
}


