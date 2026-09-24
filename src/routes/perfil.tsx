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
  Layers,
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
import { companionFromEquipped } from "@/lib/companion-assets";
import { CompanionRender } from "@/components/CompanionRender";

import { SakuraPetals } from "@/components/SakuraPetals";
import { getEquippedArt } from "@/lib/shop-asset-overrides";
import { AvatarCrown, NameplateTopCrown, getCrownArt, getCrownAccent } from "@/components/profile/AvatarCrown";
import { tableSkinByKey } from "@/lib/table-skins";
import { titleFromEquipped } from "@/lib/eclipse-cosmetics";
import { CosmeticTitle } from "@/components/profile/CosmeticTitle";
import { TableSkinPreviewButton } from "@/components/review/TableSkinPreviewModal";
import { CosmeticInventory } from "@/components/profile/CosmeticInventory";
import { Button } from "@/components/ui/button";
import { ProfileActivityFeed } from "@/components/ProfileActivityFeed";
import { FriendsList } from "@/components/profile/FriendsList";




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
  table: {
    label: "Mesa de revisão",
    hint: "Tematiza a tela de revisão: brasão, moldura e efeitos.",
    icon: Layers,
  },
  streak_flame: {
    label: "Chama de streak",
    hint: "Troca a chama da sua sequência na Home.",
    icon: Flame,
  },
  enemy_seal: {
    label: "Selo inimigo",
    hint: "Marca temática nas cartas inimigas durante a revisão.",
    icon: Swords,
  },
  title: {
    label: "Título",
    hint: "Título animado exibido abaixo do seu nome.",
    icon: Crown,
  },
  victory_splash: {
    label: "Splash de vitória",
    hint: "Animação em tela cheia ao vencer um duelo.",
    icon: Trophy,
  },
};

const SLOT_ORDER: CosmeticSlot[] = [
  "nameplate",
  "decoration",
  "badge",
  "effect",
  "overlay",
  "veil",
  "companion",
  "table",
  "streak_flame",
  "enemy_seal",
  "title",
  "victory_splash",
];


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
  const [tab, setTab] = useState<"perfil" | "atividade">("perfil");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => setFlash(null), 2000);
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
      table: [],
      streak_flame: [],
      enemy_seal: [],
      title: [],
      victory_splash: [],


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

  const cosmeticTitle = titleFromEquipped(wallet.equipped);
  const nameplate = equippedItem.nameplate;
  const decoration = equippedItem.decoration;
  const badge = equippedItem.badge;
  const effect = equippedItem.effect;
  const companion = companionFromEquipped(wallet.equipped);

  // Curated art for each equipped slot (bundle-specific PNGs override the generic icon).
  const nameplateArt = getEquippedArt(wallet.equipped.nameplate);
  const crownArt = getCrownArt(wallet.equipped.nameplate);
  const crownAccent = getCrownAccent(wallet.equipped.nameplate);
  const decorationArt = getEquippedArt(wallet.equipped.decoration);
  const badgeArt = getEquippedArt(wallet.equipped.badge);
  const effectArt = getEquippedArt(wallet.equipped.effect);
  const veilArt = getEquippedArt(wallet.equipped.veil);
  const overlayArt = getEquippedArt(wallet.equipped.overlay);
  const veil = equippedItem.veil;
  // Chuva de Sakura vive no slot "overlay" — cai por cima da capa (effect).
  const showSakura = wallet.equipped.overlay === "overlay:chuva_sakura";
  // Rosas do Crepúsculo — mesma mecânica, pétalas rubras (bundle Crepúsculo Carmesim).
  const showCrimsonPetals = wallet.equipped.overlay === "overlay:rosas_crepusculo";
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
  // A cor do anel/blur em volta do avatar segue sempre a coroa equipada.
  const avatarRing = crownAccent ?? decorationPalette.ring;
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
    <main className="profile-page mx-auto max-w-6xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
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

      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
      {/* ============ PROFILE PREVIEW ============ */}
      <section
        className="relative overflow-hidden rounded-lg border border-border bg-profile-panel shadow-[0_24px_60px_-32px_var(--profile-shadow)] lg:sticky lg:top-24"
      >
        <div
          className={`relative h-[128px] w-full overflow-hidden sm:h-[144px] ${
            showBanner ? "cosmetic-banner-animated" : ""
          }`}
          style={{ background: "var(--profile-base)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 will-change-transform"
            style={{
              background: showBanner
                ? heroPalette.gradient
                : "linear-gradient(135deg,#2b2d31 0%,#1e1f22 100%)",
               transform: "scale(1.01)",
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
          {showCrimsonPetals && (
            <SakuraPetals density="normal" seed={31} withHalo variant="crimson" />
          )}
          {overlayArt && !showSakura && !showCrimsonPetals && (
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
           <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-md border border-border bg-profile-base/80 px-2.5 py-1 backdrop-blur-md">
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
             className={`group absolute -top-[52px] left-5 rounded-full sm:left-6 ${
              showDecoration ? "cosmetic-avatar-float" : ""
            }`}
            style={{
              padding: 6,
               background: "var(--profile-panel)",
              boxShadow: `0 12px 30px -8px ${avatarRing}55`,
            }}
          >
            {/* Aura art (decoration) — glow around avatar (screen blend keeps face visible) */}
            {decorationArt && (
              <img
                src={decorationArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] max-w-none object-contain mix-blend-screen opacity-90"
                style={{ animation: "spin 24s linear infinite" }}
              />
            )}
            <DiscordAvatar
              size={96}
              ring={avatarRing}
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
                className="absolute -right-1 -top-1 z-20 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur transition hover:bg-red-500/80 disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" strokeWidth={2.5} />
              </button>
            )}
            {/* Coroa (nameplate) — apoiada no topo do avatar */}
            {crownArt ? (
               <AvatarCrown crown={crownArt} size={96} />
            ) : nameplateArt ? (
               <NameplateTopCrown art={nameplateArt} size={96} />
            ) : null}
          </div>

          {companion && (
           <div
               className="pointer-events-none absolute -top-[44px] right-3 z-10 h-[82px] w-[82px] sm:right-5 sm:h-[92px] sm:w-[92px]"
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
                <CompanionRender companion={companion} />
              </div>

            </div>
          )}
        </div>


        {/* Info */}
         <div className="px-5 pb-6 pt-12 sm:px-6 sm:pt-14">
           <div>
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
            {cosmeticTitle && (
              <div className="mt-1.5">
                <CosmeticTitle theme={cosmeticTitle} />
              </div>
            )}

            <div className="mt-4 h-px w-full bg-border" />

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
             <div className="mt-2 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-md border border-border bg-profile-base">
              <StatChip
                label={rank ? TIER_LABEL[rank.tier] : "Sem rank"}
                value={rank && rank.division !== null ? DIVISION_ROMAN[rank.division] : ""}
                color={rank ? TIER_COLORS[rank.tier].ring : "#fbbf24"}
                accent
                 flat
                render={
                  rank ? (
                    <RankEmblem tier={rank.tier} division={rank.division} size={44} />
                  ) : null
                }
              />
               <StatChip icon={ArlysIcon} label="Arlys ✦" value={wallet.crystals.toString()} color="#a78bfa" accent flat />
              <StatChip
                icon={Sparkles}
                label="Cosméticos"
                value={`${totalEquipped}/${totalOwned}`}
                color="#38bdf8"
                 flat
              />
              <StatChip
                icon={Flame}
                label="LP"
                value={rank ? `${rank.lp}` : "—"}
                color="#f87171"
                 flat
              />
            </div>
          </div>
        </div>
      </section>

       <div className="min-w-0">
       <div className="mb-5 border-b border-border">
         <div className="flex min-w-0 items-center gap-6 overflow-x-auto">
           {(["perfil", "atividade"] as const).map((t) => (
             <button
               key={t}
               type="button"
               onClick={() => setTab(t)}
               className={`relative shrink-0 pb-3 text-[13px] font-semibold transition ${
                 tab === t
                   ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                   : "text-muted-foreground hover:text-foreground"
               }`}
             >
               {t === "perfil" ? "Perfil" : "Atividade"}
             </button>
           ))}
         </div>
       </div>
       {tab === "atividade" ? (
         <section className="min-w-0">
           <h2 className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
             Atividade recente
           </h2>
           <p className="mt-0.5 mb-4 text-[12px] text-muted-foreground">
             Linha do tempo dos seus últimos passos no airi.
           </p>
           {profile ? <ProfileActivityFeed profileId={profile.id} limit={30} /> : null}
         </section>
       ) : (
       <>
       {/* ============ SLOTS ============ */}
       <section className="min-w-0">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
              Meus cosméticos
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Um item por slot. Toque num slot para abrir seu inventário e trocar.
            </p>
          </div>
          <Link
            to="/shop"
            search={{ b: undefined }}
            className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border bg-profile-panel px-3 py-1.5 text-[11px] font-semibold text-foreground/90 transition hover:bg-profile-raised sm:inline-flex"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
            Loja
          </Link>
        </div>

        <CosmeticInventory
          slotOrder={SLOT_ORDER}
          slotMeta={SLOT_META}
          ownedBySlot={ownedBySlot}
          equippedItem={equippedItem}
          equippedKeys={wallet.equipped}
          keyOf={keyOf}
          paletteFor={paletteFor}
          iconFor={(it: ShopItem) => ICONS[it.icon] ?? Sparkles}
          busy={busy}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </section>


       <aside className="mt-6 grid gap-3 sm:grid-cols-2">


      {partner && <FriendsList friend={partner} />}



      {/* ============ HELP FOOTER ============ */}
       <section className="border-t border-border px-1 pt-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Onde meu perfil aparece?</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
               Seus cosméticos equipados aparecem no perfil, nas interações sociais e ao compartilhar conquistas.
            </p>
          </div>
        </div>
       </section>
       </aside>
       </>
       )}
       </div>
       </div>
    </main>
  );
}



