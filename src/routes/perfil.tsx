import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  Crown,
  Flame,
  
  Gift,
  Heart,
  Moon,
  Palette,
  Plane,
  Plus,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Trash2,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { StatChip, ArlysIcon } from "@/components/StatChip";
import { useCurrentProfile } from "@/lib/profile";
import { PROFILES } from "@/lib/profile";
import {
  useWallet,
  loadWallet,
  equipCosmetic,
  unequipSlot,
  slotOf,
  setBio,
  setAvatarUrl,
  type CosmeticSlot,
} from "@/lib/wallet-store";
import { listShopItems, type ShopItem } from "@/lib/shop";
import { useRank, TIER_LABEL, DIVISION_ROMAN, TIER_COLORS } from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";
import { useStreak } from "@/lib/flashcards-store";
import { compressAvatarFile } from "@/lib/image-compress";
import { ProfileActivityFeed } from "@/components/ProfileActivityFeed";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { companionFromEquipped } from "@/lib/companion-assets";
import { SakuraPetals } from "@/components/SakuraPetals";
import { getEquippedArt } from "@/lib/shop-asset-overrides";


export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — airi" },
      {
        name: "description",
        content:
          "Seu perfil airi no estilo Discord: equipe cosméticos, veja seu streak, rank e Arlys ✦.",
      },
      { property: "og:title", content: "Meu perfil — airi" },
      {
        property: "og:description",
        content: "Vitrine dos seus cosméticos e conquistas no airi.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

// ---------- palette (Discord-inspired) ----------
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
};

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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

function paletteFor(accent: string) {
  return DISCORD_PALETTE[accent] ?? DISCORD_PALETTE.violet;
}

function keyOf(item: ShopItem) {
  return `${String(item.payload.slot ?? "cosmetic")}:${String(item.payload.key ?? item.id)}`;
}

const SLOT_META: Record<
  CosmeticSlot,
  { label: string; hint: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  nameplate: {
    label: "Nameplate",
    hint: "Banner colorido atrás do seu nome.",
    icon: Palette,
  },
  decoration: {
    label: "Decoração de avatar",
    hint: "Aura animada em volta da sua foto.",
    icon: Sparkles,
  },
  badge: {
    label: "Badge de perfil",
    hint: "Selo brilhante ao lado do seu nome.",
    icon: Star,
  },
  effect: {
    label: "Capa de perfil",
    hint: "Imagem de fundo do banner do seu perfil.",
    icon: Zap,
  },
  overlay: {
    label: "Efeito sobre a capa",
    hint: "Efeito animado que aparece por cima da capa.",
    icon: Sparkles,
  },
  companion: {
    label: "Companheiro",
    hint: "Um espírito que acompanha seu perfil.",
    icon: Heart,
  },
  veil: {
    label: "Véu de perfil",
    hint: "Camada translúcida com brilhos por cima do banner.",
    icon: Sparkles,
  },
};

const SLOT_ORDER: CosmeticSlot[] = ["nameplate", "decoration", "badge", "effect", "overlay", "veil", "companion"];

// ---------- avatar with optional decoration ring ----------
function DiscordAvatar({
  size,
  ring,
  showDecoration,
  initial = "G",
  avatarUrl,
}: {
  size: number;
  ring: string;
  showDecoration: boolean;
  initial?: string;
  avatarUrl?: string;
}) {
  const inner = size - (showDecoration ? 10 : 0);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {showDecoration && (
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
          <span className="absolute inset-[3px] rounded-full" style={{ background: "#1e1f22" }} />
        </>
      )}
      <div
        className="relative grid place-items-center overflow-hidden rounded-full text-white font-semibold"
        style={{
          width: inner,
          height: inner,
          background: avatarUrl ? "#000" : "linear-gradient(135deg,#5865f2 0%,#7c3aed 100%)",
          fontSize: inner * 0.42,
          boxShadow: showDecoration ? `0 0 12px ${ring}55` : "none",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          initial
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
}

// ---------- page ----------
function PerfilPage() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const rank = useRank();
  const streak = useStreak();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parallax suave — reagimos ao scroll do window.
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await compressAvatarFile(file);
      await setAvatarUrl(dataUrl);
      setFlash("Foto atualizada.");
      setTimeout(() => setFlash(null), 1600);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Não foi possível ler a imagem.");
      setTimeout(() => setFlash(null), 2200);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onRemoveAvatar() {
    if (!wallet.avatarUrl) return;
    setUploadingAvatar(true);
    try {
      await setAvatarUrl("");
      setFlash("Foto removida.");
      setTimeout(() => setFlash(null), 1400);
    } finally {
      setUploadingAvatar(false);
    }
  }

  useEffect(() => {
    setBioDraft(wallet.bio ?? "");
  }, [wallet.bio, wallet.profileId]);

  const partner = profile ? PROFILES.find((p) => p.id !== profile.id) ?? null : null;


  useEffect(() => {
    if (profile) void loadWallet(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    listShopItems().then(setItems);
  }, []);

  // Map key → ShopItem for lookups (accent, name, icon, price).
  const byKey = useMemo(() => {
    const m = new Map<string, ShopItem>();
    (items ?? [])
      .filter((i) => i.kind === "cosmetic")
      .forEach((i) => m.set(keyOf(i), i));
    return m;
  }, [items]);

  // Owned cosmetics as ShopItems, grouped by slot.
  const ownedBySlot = useMemo(() => {
    const groups: Record<CosmeticSlot, ShopItem[]> = {
      nameplate: [],
      decoration: [],
      badge: [],
      effect: [],
      overlay: [],
      companion: [],
      veil: [],
    };
    wallet.cosmetics.forEach((k) => {
      const it = byKey.get(k);
      if (!it) return;
      const s = slotOf(k);
      groups[s].push(it);
    });
    return groups;
  }, [wallet.cosmetics, byKey]);

  // Currently equipped items
  const equippedItem: Partial<Record<CosmeticSlot, ShopItem>> = {};
  for (const s of SLOT_ORDER) {
    const key = wallet.equipped[s];
    if (key) {
      const it = byKey.get(key);
      if (it) equippedItem[s] = it;
    }
  }

  const nameplate = equippedItem.nameplate;
  const decoration = equippedItem.decoration;
  const badge = equippedItem.badge;
  const effect = equippedItem.effect;
  const companion = companionFromEquipped(wallet.equipped);

  // Curated art for each equipped slot (bundle-specific PNGs override the generic icon).
  const nameplateArt = getEquippedArt(wallet.equipped.nameplate);
  const decorationArt = getEquippedArt(wallet.equipped.decoration);
  const badgeArt = getEquippedArt(wallet.equipped.badge);
  const effectArt = getEquippedArt(wallet.equipped.effect);
  const veilArt = getEquippedArt(wallet.equipped.veil);
  const overlayArt = getEquippedArt(wallet.equipped.overlay);
  const veil = equippedItem.veil;
  // Chuva de Sakura vive no slot "overlay" — cai por cima da capa (effect).
  const showSakura = wallet.equipped.overlay === "overlay:chuva_sakura";
  // A capa (effect) usa a imagem de fundo em cover, sem mix-blend.
  const hasCoverArt = !!effectArt;

  // Hero palette: prioritize effect → veil → decoration → badge → default.
  // Nameplate is NOT included — it only decorates the avatar (frame), not the banner.
  const heroItem = effect ?? veil ?? decoration ?? badge;
  const heroPalette = heroItem ? paletteFor(heroItem.accent) : DISCORD_PALETTE.violet;
  const showBanner = !!effect || !!veil;
  const showDecoration = !!decoration;
  const decorationPalette = decoration ? paletteFor(decoration.accent) : heroPalette;
  const badgePalette = badge ? paletteFor(badge.accent) : heroPalette;
  const BadgeIcon = badge ? (ICONS[badge.icon] ?? Sparkles) : Sparkles;

  const initial = (profile?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const handleUser = profile ? profile.name.toLowerCase().replace(/\s+/g, "") : "";
  const handleSuffix = ".airi.com.br";

  const statusLabel = useMemo(() => {
    const hour = new Date().getHours();
    if (streak?.current && streak.current >= 1) {
      return `Streak ${streak.current}d 🔥`;
    }
    if (hour >= 6 && hour < 12) return "Bom dia — pronto pra estudar";
    if (hour >= 12 && hour < 18) return "Aprendendo airi ✨";
    if (hour >= 18 && hour < 23) return "Foco da noite";
    return "Modo coruja 🌙";
  }, [streak?.current]);

  async function handleEquip(item: ShopItem) {
    if (busy) return;
    const k = keyOf(item);
    setBusy(k);
    await equipCosmetic(k);
    setBusy(null);
    setFlash(`${item.name} equipado.`);
    setTimeout(() => setFlash(null), 1600);
  }
  async function handleUnequip(slot: CosmeticSlot) {
    if (busy) return;
    setBusy(slot);
    await unequipSlot(slot);
    setBusy(null);
    setFlash("Slot liberado.");
    setTimeout(() => setFlash(null), 1400);
  }

  const totalOwned = wallet.cosmetics.length;
  const totalEquipped = Object.keys(wallet.equipped).length;

  return (
    <main className="mx-auto max-w-4xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      {flash && (
        <div className="fixed inset-x-0 top-24 z-40 mx-auto w-max max-w-[90%] rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/30 backdrop-blur">
          {flash}
        </div>
      )}

      {/* ============ HERO (parallax + status) ============ */}
      <section
        className="relative overflow-hidden rounded-3xl border border-black/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
        style={{ background: "#232428" }}
      >
        {/* Banner com parallax suave (translateY em função do scroll) */}
        <div
          className={`relative h-[190px] w-full overflow-hidden sm:h-[220px] ${
            showBanner ? "cosmetic-banner-animated" : ""
          }`}
          style={{ background: "#1a1b1e" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 will-change-transform"
            style={{
              background: showBanner
                ? heroPalette.gradient
                : "linear-gradient(135deg,#2b2d31 0%,#1e1f22 100%)",
              transform: `translate3d(0, ${scrollY * 0.35}px, 0) scale(${1 + Math.min(scrollY, 300) * 0.0006})`,
            }}
          />
          {/* orbes de profundidade — reagem em direção oposta */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-10 h-64 w-64 rounded-full opacity-70 will-change-transform"
            style={{
              background: `radial-gradient(circle, ${heroPalette.ring}66, transparent 65%)`,
              filter: "blur(30px)",
              transform: `translate3d(0, ${scrollY * -0.15}px, 0)`,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full opacity-60 will-change-transform"
            style={{
              background: `radial-gradient(circle, ${decorationPalette.ring}55, transparent 65%)`,
              filter: "blur(24px)",
              transform: `translate3d(0, ${scrollY * -0.08}px, 0)`,
            }}
          />
          {showBanner && (
            <span
              aria-hidden
              className="cosmetic-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
              }}
            />
          )}
          {effect && (
            <>
              <span
                aria-hidden
                className="cosmetic-sparkle pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-white"
                style={{ top: "22%", left: "70%", animationDelay: "0.2s" }}
              />
              <span
                aria-hidden
                className="cosmetic-sparkle pointer-events-none absolute h-1 w-1 rounded-full bg-white"
                style={{ top: "55%", left: "18%", animationDelay: "0.9s" }}
              />
              <span
                aria-hidden
                className="cosmetic-sparkle pointer-events-none absolute h-1 w-1 rounded-full bg-white"
                style={{ top: "35%", left: "45%", animationDelay: "1.6s" }}
              />
            </>
          )}
        {effectArt && (
            <img
              src={effectArt}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}
          {veilArt && (
            <>
              <img
                src={veilArt}
                alt=""
                aria-hidden
                className="cosmetic-veil-float pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
              />
              <span
                aria-hidden
                className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                }}
              />
            </>
          )}
          {showSakura && <SakuraPetals density="normal" seed={19} withHalo />}
          {overlayArt && !showSakura && (
            <img
              src={overlayArt}
              alt=""
              aria-hidden
              className="cosmetic-veil-float pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
            />
          )}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 60%, transparent)",
            }}
          />

          {/* Status pill flutuante (top-right) */}
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 backdrop-blur-md">
            <span
              className="relative inline-flex h-1.5 w-1.5"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Avatar + upload */}
        <div className="relative px-5 sm:px-6">
          <div
            className={`group absolute -top-[60px] left-5 rounded-full sm:left-6 ${
              showDecoration ? "cosmetic-avatar-float" : ""
            }`}
            style={{
              padding: 6,
              background: "#232428",
              boxShadow: `0 12px 30px -8px ${decorationPalette.ring}55`,
            }}
          >
            <DiscordAvatar
              size={112}
              ring={decorationPalette.ring}
              showDecoration={showDecoration}
              initial={initial}
              avatarUrl={wallet.avatarUrl || undefined}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Trocar foto de perfil"
              className="absolute inset-[6px] grid place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
            >
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
                <Camera className="h-3 w-3" strokeWidth={2.5} />
                {uploadingAvatar ? "Enviando…" : wallet.avatarUrl ? "Trocar" : "Foto"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
            {wallet.avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={uploadingAvatar}
                aria-label="Remover foto"
                className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-red-500/80 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" strokeWidth={2.5} />
              </button>
            )}
            {/* Aura art (decoration) — glow behind avatar */}
            {decorationArt && (
              <img
                src={decorationArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] max-w-none object-contain animate-spin-slow"
                style={{ animation: "spin 24s linear infinite" }}
              />
            )}
            {/* Frame art (nameplate) — decorative branch/ring around avatar */}
            {nameplateArt && (
              <img
                src={nameplateArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] max-w-none object-contain drop-shadow-[0_6px_20px_rgba(192,132,252,0.45)]"
              />
            )}
          </div>

          {companion && (
            <div
              className="pointer-events-none absolute -top-[52px] right-3 z-10 h-[92px] w-[92px] sm:right-5 sm:h-[104px] sm:w-[104px]"
              aria-hidden
            >
              <div
                className="companion-glow absolute inset-0 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${companion.glow}80, transparent 70%)` }}
              />
              {/* Sparkle particles */}
              {[
                { sx: "-18px", sy: "-8px", dur: "2.4s", delay: "0s", size: 6 },
                { sx: "16px", sy: "-14px", dur: "2.8s", delay: "0.6s", size: 5 },
                { sx: "22px", sy: "18px", dur: "3.1s", delay: "1.2s", size: 4 },
                { sx: "-20px", sy: "16px", dur: "2.6s", delay: "1.8s", size: 5 },
              ].map((p, i) => (
                <span
                  key={i}
                  className="companion-sparkle absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: companion.glow,
                    boxShadow: `0 0 8px ${companion.glow}`,
                    ["--sx" as any]: p.sx,
                    ["--sy" as any]: p.sy,
                    ["--dur" as any]: p.dur,
                    ["--delay" as any]: p.delay,
                  }}
                />
              ))}
              <div className="companion-hop absolute inset-0">
                <img
                  src={companion.src}
                  alt={companion.name}
                  className="companion-idle relative h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(192,132,252,0.55)]"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>


        {/* Info */}
        <div className="px-5 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-16">
          <div className="rounded-xl p-4 sm:p-5" style={{ background: "#111214" }}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[20px] font-bold leading-tight text-white sm:text-[22px]">
                {profile?.name ?? "…"}
              </p>
              {badge && (
                <span
                  className="relative inline-flex items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: badgePalette.gradient }}
                >
                  <span
                    aria-hidden
                    className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                    }}
                  />
                  {badgeArt ? (
                    <img
                      src={badgeArt}
                      alt=""
                      aria-hidden
                      className="relative h-4 w-4 object-contain"
                    />
                  ) : (
                    <BadgeIcon className="relative h-3 w-3" strokeWidth={2.75} />
                  )}
                  <span className="relative">{badge.name.toUpperCase()}</span>
                </span>
              )}
            </div>
            <p className="text-[13px] leading-tight text-white/60">
              <span className="text-white/80">{handleUser}</span>
              <span className="text-white/40">{handleSuffix}</span>
            </p>

            <div className="mt-3 h-px w-full" style={{ background: "#2b2d31" }} />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Sobre mim
              </p>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="text-[11px] font-semibold text-violet-300 transition hover:text-violet-200"
                >
                  Editar
                </button>
              )}
            </div>
            {editingBio ? (
              <div className="mt-1.5 space-y-2">
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value.slice(0, 180))}
                  rows={3}
                  placeholder="Conte algo sobre você — estudando, metas, curiosidades…"
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13px] leading-snug text-white outline-none focus:border-violet-400/50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">{bioDraft.length}/180</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setBioDraft(wallet.bio ?? "");
                        setEditingBio(false);
                      }}
                      disabled={savingBio}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        setSavingBio(true);
                        await setBio(bioDraft);
                        setSavingBio(false);
                        setEditingBio(false);
                        setFlash("Bio atualizada.");
                        setTimeout(() => setFlash(null), 1400);
                      }}
                      disabled={savingBio}
                      className="rounded-lg bg-violet-500 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                    >
                      {savingBio ? "Salvando…" : "Salvar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-white/80">
                {wallet.bio?.trim() || "Toque em editar para adicionar sua bio."}
              </p>
            )}


            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">
              Membro airi
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatChip
                label={rank ? TIER_LABEL[rank.tier] : "Sem rank"}
                value={rank && rank.division !== null ? DIVISION_ROMAN[rank.division] : ""}
                color={rank ? TIER_COLORS[rank.tier].ring : "#fbbf24"}
                accent
                render={
                  rank ? (
                    <RankEmblem tier={rank.tier} division={rank.division} size={44} />
                  ) : null
                }
              />
              <StatChip icon={ArlysIcon} label="Arlys ✦" value={wallet.crystals.toString()} color="#a78bfa" accent />
              <StatChip
                icon={Sparkles}
                label="Cosméticos"
                value={`${totalEquipped}/${totalOwned}`}
                color="#38bdf8"
              />
              <StatChip
                icon={Flame}
                label="LP"
                value={rank ? `${rank.lp}` : "—"}
                color="#f87171"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ SLOTS ============ */}
      <section className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
              Meus cosméticos
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Equipe até 4 itens — um por slot. Trocas são instantâneas e aparecem aqui no seu
              perfil.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-foreground/90 transition hover:bg-white/[0.08] sm:inline-flex"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
            Loja
          </Link>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SLOT_ORDER.map((slot) => {
            const meta = SLOT_META[slot];
            const owned = ownedBySlot[slot];
            const equippedKey = wallet.equipped[slot];
            const equippedShop = equippedItem[slot];
            return (
              <li
                key={slot}
                className="relative overflow-hidden rounded-2xl border border-white/10 p-4"
                style={{ background: "#1e1f22" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <meta.icon className="h-4 w-4 text-foreground/80" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white">{meta.label}</p>
                      <p className="truncate text-[11px] text-white/50">{meta.hint}</p>
                    </div>
                  </div>
                  {equippedKey && (
                    <button
                      onClick={() => handleUnequip(slot)}
                      disabled={busy === slot}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:opacity-50"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {equippedShop ? (
                  <div
                    className="mt-3 flex items-center gap-2 rounded-xl p-2"
                    style={{ background: paletteFor(equippedShop.accent).gradient }}
                  >
                    <span
                      className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-black/25 text-white backdrop-blur"
                    >
                      {(() => {
                        const art = getEquippedArt(wallet.equipped[slot]);
                        if (art) {
                          return (
                            <img src={art} alt="" aria-hidden className="h-8 w-8 object-contain" />
                          );
                        }
                        const Icon = ICONS[equippedShop.icon] ?? Sparkles;
                        return <Icon className="h-4 w-4" strokeWidth={2.5} />;
                      })()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {equippedShop.name}
                      </p>
                      <p className="truncate text-[11px] font-medium text-white/85">
                        Equipado
                      </p>
                    </div>
                    <Check
                      className="ml-auto h-4 w-4 shrink-0 text-white"
                      strokeWidth={2.75}
                    />
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5 text-[12px] text-white/50">
                    Nenhum item equipado neste slot.
                  </p>
                )}

                {owned.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Disponíveis ({owned.length})
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {owned.map((it) => {
                        const k = keyOf(it);
                        const isEquipped = equippedKey === k;
                        const p = paletteFor(it.accent);
                        return (
                          <li key={k}>
                            <button
                              onClick={() => (isEquipped ? handleUnequip(slot) : handleEquip(it))}
                              disabled={busy === k}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
                                isEquipped
                                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                                  : "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.1]"
                              }`}
                              title={isEquipped ? "Equipado — clique para remover" : "Equipar"}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: p.ring }}
                              />
                              <span className="max-w-[9rem] truncate">{it.name}</span>
                              {isEquipped && <Check className="h-3 w-3" strokeWidth={2.75} />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <p className="text-[12px] text-white/55">Nenhum item deste tipo ainda.</p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
                    >
                      Ver na loja
                      <ArrowLeft className="h-3 w-3 rotate-180" strokeWidth={2.5} />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ============ ACTIVITY TIMELINE ============ */}
      {profile && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
                Atividade recente
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Linha do tempo dos seus últimos passos no airi.
              </p>
            </div>
          </div>
          <ProfileActivityFeed profileId={profile.id} />
        </section>
      )}

      {/* ============ PARTNER LINK ============ */}
      {partner && (
        <section className="mt-6">
          <Link
            to="/perfil/$id"
            params={{ id: partner.id }}
            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]"
          >
            <ProfileAvatar
              profileId={partner.id}
              initial={partner.name.charAt(0).toUpperCase()}
              gradient={partner.gradient}
              size={48}
              fontScale={0.36}
              ring="rgba(255,255,255,0.15)"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Perfil do parceiro
              </p>
              <p className="mt-0.5 truncate text-[15px] font-semibold text-white">
                Ver perfil de {partner.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-white/50">
                Cosméticos equipados, rank, streak e bio
              </p>
            </div>
            <ArrowLeft
              className="h-4 w-4 shrink-0 rotate-180 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/80"
              strokeWidth={2.5}
            />
          </Link>
        </section>
      )}



      {/* ============ HELP FOOTER ============ */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Onde meu perfil aparece?</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Esta é a sua vitrine airi. Todo cosmético que você compra na loja fica guardado aqui e
              pode ser equipado nos 6 slots (nameplate, decoração, badge, efeito, véu e
              companheiro). O banner e a aura acompanham você em previews sociais, no perfil e ao
              compartilhar conquistas.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}



