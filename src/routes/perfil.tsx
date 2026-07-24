import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  Crown,
  Flame,
  Gem,
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
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";
import {
  useWallet,
  loadWallet,
  equipCosmetic,
  unequipSlot,
  slotOf,
  type CosmeticSlot,
} from "@/lib/wallet-store";
import { listShopItems, type ShopItem } from "@/lib/shop";
import { useRank, TIER_LABEL, DIVISION_ROMAN } from "@/lib/rank-store";

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
    label: "Efeito de perfil",
    hint: "Brilhos e reflexos no banner.",
    icon: Zap,
  },
};

const SLOT_ORDER: CosmeticSlot[] = ["nameplate", "decoration", "badge", "effect"];

// ---------- avatar with optional decoration ring ----------
function DiscordAvatar({
  size,
  ring,
  showDecoration,
  initial = "G",
}: {
  size: number;
  ring: string;
  showDecoration: boolean;
  initial?: string;
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
        className="relative grid place-items-center rounded-full text-white font-semibold"
        style={{
          width: inner,
          height: inner,
          background: "linear-gradient(135deg,#5865f2 0%,#7c3aed 100%)",
          fontSize: inner * 0.42,
          boxShadow: showDecoration ? `0 0 12px ${ring}55` : "none",
        }}
      >
        {initial}
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
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

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

  // Hero palette: prioritize nameplate → effect → decoration → badge → default violet.
  const heroItem = nameplate ?? effect ?? decoration ?? badge;
  const heroPalette = heroItem ? paletteFor(heroItem.accent) : DISCORD_PALETTE.violet;
  const showBanner = !!nameplate || !!effect;
  const showDecoration = !!decoration;
  const decorationPalette = decoration ? paletteFor(decoration.accent) : heroPalette;
  const badgePalette = badge ? paletteFor(badge.accent) : heroPalette;
  const BadgeIcon = badge ? (ICONS[badge.icon] ?? Sparkles) : Sparkles;

  const initial = (profile?.name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const handle = profile ? `${profile.name.toLowerCase().replace(/\s+/g, "")}.airi` : "";

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

      {/* ============ HERO (Discord-style big profile card) ============ */}
      <section
        className="relative overflow-hidden rounded-3xl border border-black/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
        style={{ background: "#232428" }}
      >
        {/* Banner */}
        <div
          className={`relative h-[160px] w-full overflow-hidden sm:h-[190px] ${
            showBanner ? "cosmetic-banner-animated" : ""
          }`}
          style={{
            background: showBanner
              ? heroPalette.gradient
              : "linear-gradient(135deg,#2b2d31 0%,#1e1f22 100%)",
          }}
        >
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
                className="cosmetic-glow-pulse pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.28), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2), transparent 45%)",
                }}
              />
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
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }}
          />
        </div>

        {/* Avatar */}
        <div className="relative px-5 sm:px-6">
          <div
            className={`absolute -top-[54px] left-5 rounded-full sm:left-6 ${
              showDecoration ? "cosmetic-avatar-float" : ""
            }`}
            style={{ padding: 6, background: "#232428" }}
          >
            <DiscordAvatar
              size={104}
              ring={decorationPalette.ring}
              showDecoration={showDecoration}
              initial={initial}
            />
          </div>
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
                  <BadgeIcon className="relative h-3 w-3" strokeWidth={2.75} />
                  <span className="relative">{badgePalette.tag.toUpperCase()}</span>
                </span>
              )}
            </div>
            <p className="text-[13px] leading-tight text-white/60">{handle}</p>

            <div className="mt-3 h-px w-full" style={{ background: "#2b2d31" }} />

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">
              Sobre mim
            </p>
            <p className="mt-1 text-[13px] leading-snug text-white/80">
              Estudando inglês todo dia com airi. 🔥 Streak em andamento.
            </p>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">
              Membro airi
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatChip
                icon={Trophy}
                label={rank ? TIER_LABEL[rank.tier] : "—"}
                value={rank ? DIVISION_ROMAN[rank.division] : ""}
                color="#fbbf24"
              />
              <StatChip icon={Gem} label="Arlys ✦" value={wallet.crystals.toString()} color="#a78bfa" />
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
                      className="grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white backdrop-blur"
                    >
                      {(() => {
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

      {/* ============ HELP FOOTER ============ */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Onde meu perfil aparece?</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Esta é a sua vitrine airi. Todo cosmético que você compra na loja fica guardado aqui
              e pode ser equipado nos 4 slots (nameplate, decoração, badge e efeito). O banner e a
              aura acompanham você em previews sociais, no perfil e ao compartilhar conquistas.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-white/5 px-2.5 py-2"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
        style={{ background: `${color}22`, color }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/50">
          {label}
        </p>
        <p className="truncate text-[13px] font-semibold text-white">{value || "—"}</p>
      </div>
    </div>
  );
}
