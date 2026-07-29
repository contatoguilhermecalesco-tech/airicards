import { ArlysIcon } from "@/components/StatChip";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Crown,
  Eye,
  Flame,
  HelpCircle,
  LayoutGrid,
  List,
  Package,
  Palette,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";
import { useWallet, loadWallet, getWallet } from "@/lib/wallet-store";
import {
  buyPublishedDeck,
  buyShopItem,
  listShopItems,
  type ShopItem,
} from "@/lib/shop";
import { listPublishedDecks, type PublishedDeckRow } from "@/lib/marketplace";
import {
  ACCENTS,
  ICONS,
  MiniProfileCard,
  RARITY_META,
  RARITY_ORDER,
  RarityChip,
  rarityFor,
  slotLabel,
  visualFor,
  DiscordAvatar,
  PowerupCover,
  DeckCover,
  PackCover,
  powerupBadge,
  powerupPalette,
  collectionPalette,
  type Rarity,
} from "@/components/shop/shop-visuals";
import { ShopHero, type FeaturedItem } from "@/components/shop/ShopHero";
import { BundleDetailModal } from "@/components/shop/BundleDetailModal";
import {
  PurchaseSuccessOverlay,
  type PurchaseCelebration,
} from "@/components/shop/PurchaseSuccessOverlay";
import {
  listActiveFeaturedSlots,
  type FeaturedSlotRow,
} from "@/lib/featured-slots";
import { SHOP_ASSET_OVERRIDES } from "@/lib/shop-asset-overrides";
import { tableSkinByKey } from "@/lib/table-skins";
import { TableSkinPreviewModal } from "@/components/review/TableSkinPreviewModal";
import {
  CosmeticSlotPreview,
  hasSlotPreview,
  type PreviewSlot,
} from "@/components/shop/CosmeticSlotPreview";
import { cosmeticArtFor } from "@/lib/cosmetic-art";

// Curated visual overrides — keyed by shop item id. Falls back to
// featured_slots assets when admin uploads custom art.
const BUNDLE_ASSET_OVERRIDES = SHOP_ASSET_OVERRIDES;

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loja airi — Arlys ✦" },
      {
        name: "description",
        content:
          "Troque Arlys por decks premium, packs temáticos, cosméticos, power-ups e bundles exclusivos.",
      },
      { property: "og:title", content: "Loja airi — Arlys ✦" },
      {
        property: "og:description",
        content: "A loja airi — vitrine de coleções e cosméticos raros.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopPage,
});

/* ---------------------- Unified item model ---------------------- */

type Category = "all" | "decks" | "pack" | "cosmetic" | "powerup" | "bundle";
type ViewMode = "vitrine" | "grid" | "list";
type SortMode = "featured" | "price_asc" | "price_desc" | "recent";

type UnifiedItem = {
  id: string;
  kind: Exclude<Category, "all">;
  name: string;
  description: string;
  price: number;
  accent: string;
  icon: string;
  rarity: Rarity;
  createdAt: number;
  raw: ShopItem | PublishedDeckRow;
  bundleItems?: string[]; // for future bundle payloads
  owner?: string; // decks
};

const CATEGORIES: { id: Category; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "all", label: "Todos", icon: Sparkles },
  { id: "decks", label: "Decks", icon: BookOpen },
  { id: "pack", label: "Packs", icon: Package },
  { id: "cosmetic", label: "Cosméticos", icon: Palette },
  { id: "powerup", label: "Power-ups", icon: Shield },
  { id: "bundle", label: "Bundles", icon: Crown },
];

const SORTS: { id: SortMode; label: string }[] = [
  { id: "featured", label: "Destaques" },
  { id: "price_desc", label: "Mais caros" },
  { id: "price_asc", label: "Mais baratos" },
  { id: "recent", label: "Recentes" },
];

/* ---------------------- Page ---------------------- */

function ShopPage() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const router = useRouter();

  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [decks, setDecks] = useState<PublishedDeckRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [preview, setPreview] = useState<ShopItem | null>(null);
  const [tablePreviewSkinKey, setTablePreviewSkinKey] = useState<string | null>(null);
  const [slotPreview, setSlotPreview] = useState<{
    slot: PreviewSlot;
    key: string;
    name: string;
    price: number;
  } | null>(null);
  const [bundleOpen, setBundleOpen] = useState<ShopItem | null>(null);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlotRow[]>([]);
  const [celebration, setCelebration] = useState<PurchaseCelebration | null>(null);

  // Toolbar state
  const [category, setCategory] = useState<Category>("all");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");
  const [view, setView] = useState<ViewMode>("vitrine");
  const [affordableOnly, setAffordableOnly] = useState(false);

  useEffect(() => {
    if (profile) void loadWallet(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    listShopItems().then(setItems);
    listPublishedDecks().then(setDecks);
    listActiveFeaturedSlots().then(setFeaturedSlots).catch(() => setFeaturedSlots([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("airi.shop.helpSeen")) {
      setHelpOpen(true);
      localStorage.setItem("airi.shop.helpSeen", "1");
    }
  }, []);

  // Deep-link: /shop?b=<bundleId> — auto-open the bundle modal once items load.
  const search = Route.useSearch();
  useEffect(() => {
    if (!search.b || !items) return;
    const target = items.find((it) => it.id === search.b && it.kind === "bundle");
    if (target) setBundleOpen(target);
    // Clear the query param so refresh/close doesn't re-open.
    router.navigate({ to: "/shop", search: {}, replace: true });
  }, [search.b, items, router]);

  const handlePreview = (item: ShopItem) => {
    const slot = String(item.payload.slot ?? "").toLowerCase();
    if (slot === "table") {
      const key = `${slot}:${String(item.payload.key ?? item.id)}`;
      if (tableSkinByKey(key)) setTablePreviewSkinKey(key);
      return;
    }
    const key = String(item.payload.key ?? item.id);
    if (hasSlotPreview(slot, key)) {
      setSlotPreview({
        slot: slot as PreviewSlot,
        key,
        name: item.name,
        price: item.price,
      });
      return;
    }
    setPreview(item);
  };

  /* ---------------------- Unified list ---------------------- */

  const unified: UnifiedItem[] = useMemo(() => {
    // IDs contidos em algum bundle — mesmo que o bundle esteja inativo/oculto,
    // seus itens nunca aparecem soltos na loja (só via "ver conteúdo do bundle").
    const bundledIds = new Set<string>();
    (items ?? []).forEach((it) => {
      if (it.kind !== "bundle") return;
      const arr = (it.payload as { items?: unknown })?.items;
      if (Array.isArray(arr)) arr.forEach((x) => typeof x === "string" && bundledIds.add(x));
    });

    const list: UnifiedItem[] = [];
    (items ?? []).forEach((it) => {
      const kind = (it.kind as UnifiedItem["kind"]) ?? "pack";
      if (kind !== "bundle" && bundledIds.has(it.id)) return;
      list.push({
        id: it.id,
        kind,
        name: it.name,
        description: it.description,
        price: it.price,
        accent: it.accent,
        icon: it.icon,
        rarity: rarityFor(it.price),
        createdAt: 0,
        raw: it,
        bundleItems: Array.isArray((it.payload as { items?: unknown })?.items)
          ? ((it.payload as { items: string[] }).items ?? [])
          : undefined,
      });
    });
    (decks ?? [])
      .filter((d) => (d.price ?? 0) > 0)
      .forEach((d) => {
        list.push({
          id: d.id,
          kind: "decks",
          name: d.name,
          description: d.description || `Deck com ${d.card_count} cartas por ${d.owner_name}.`,
          price: d.price,
          accent: "violet",
          icon: "book",
          rarity: rarityFor(d.price),
          createdAt: +new Date(d.created_at),
          owner: d.owner_name,
          raw: d,
        });
      });
    return list;
  }, [items, decks]);

  /* ---------------------- Filter + sort ---------------------- */

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = unified.filter((u) => {
      if (category !== "all" && u.kind !== category) return false;
      // Raridade só se aplica a cosméticos e bundles.
      if (
        rarityFilter !== "all" &&
        (u.kind === "cosmetic" || u.kind === "bundle") &&
        u.rarity !== rarityFilter
      )
        return false;
      if (affordableOnly && u.price > wallet.crystals) return false;
      if (!needle) return true;
      return (
        u.name.toLowerCase().includes(needle) ||
        u.description.toLowerCase().includes(needle) ||
        (u.owner ?? "").toLowerCase().includes(needle)
      );
    });
    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "recent":
        list = [...list].sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "featured":
      default:
        list = [...list].sort((a, b) => {
          const wa = RARITY_META[a.rarity].weight;
          const wb = RARITY_META[b.rarity].weight;
          if (wb !== wa) return wb - wa;
          return b.price - a.price;
        });
    }
    return list;
  }, [unified, category, rarityFilter, affordableOnly, q, sort, wallet.crystals]);

  /* ---------------------- Featured for hero ---------------------- */

  const featured: FeaturedItem[] = useMemo(() => {
    // Prefer admin-curated slots when present.
    if (featuredSlots.length > 0) {
      const byId = new Map(unified.map((u) => [u.id, u]));
      const curated: FeaturedItem[] = [];
      for (const slot of featuredSlots) {
        const u = byId.get(slot.item_id);
        if (!u) continue;
        curated.push({
          id: u.id,
          kind: u.kind === "decks" ? "deck" : u.kind,
          name: u.name,
          description: slot.description_override || u.description,
          price: u.price,
          rarity: slot.rarity_override ?? u.rarity,
          icon: u.icon,
          tagline:
            slot.tagline ||
            (u.kind === "decks"
              ? `Por ${u.owner ?? "airi"}`
              : u.kind === "bundle"
                ? `Contém ${u.bundleItems?.length ?? "vários"} itens`
                : undefined),
          raw: u.raw,
          splashUrl: slot.splash_url ?? BUNDLE_ASSET_OVERRIDES[u.id]?.splash,
          artUrl: slot.art_url ?? BUNDLE_ASSET_OVERRIDES[u.id]?.art,
        });
      }
      // Auto-append any bundles not already curated so all bundles are always in the vitrine
      const curatedIds = new Set(curated.map((c) => c.id));
      for (const u of unified) {
        if (u.kind !== "bundle" || curatedIds.has(u.id)) continue;
        curated.push({
          id: u.id,
          kind: "bundle",
          name: u.name,
          description: u.description,
          price: u.price,
          rarity: u.rarity,
          icon: u.icon,
          tagline: `Contém ${u.bundleItems?.length ?? "vários"} itens`,
          raw: u.raw,
          splashUrl: BUNDLE_ASSET_OVERRIDES[u.id]?.splash,
          artUrl: BUNDLE_ASSET_OVERRIDES[u.id]?.art,
        });
      }
      if (curated.length > 0) return curated.slice(0, 6);
    }
    // Fallback: auto-pick top items by rarity weight + price
    const pool = unified
      .slice()
      .sort((a, b) => {
        const wa = RARITY_META[a.rarity].weight + (a.kind === "bundle" ? 2 : 0);
        const wb = RARITY_META[b.rarity].weight + (b.kind === "bundle" ? 2 : 0);
        if (wb !== wa) return wb - wa;
        return b.price - a.price;
      })
      .slice(0, 5);
    return pool.map<FeaturedItem>((u) => ({
      id: u.id,
      kind: u.kind === "decks" ? "deck" : u.kind,
      name: u.name,
      description: u.description,
      price: u.price,
      rarity: u.rarity,
      icon: u.icon,
      tagline:
        u.kind === "decks"
          ? `Por ${u.owner ?? "airi"}`
          : u.kind === "bundle"
            ? `Contém ${u.bundleItems?.length ?? "vários"} itens`
            : undefined,
      raw: u.raw,
      splashUrl: BUNDLE_ASSET_OVERRIDES[u.id]?.splash,
      artUrl: BUNDLE_ASSET_OVERRIDES[u.id]?.art,
    }));
  }, [unified, featuredSlots]);

  /* ---------------------- Owned set (cosmetics + decks bought) ---------------------- */

  const ownedIds = useMemo(() => {
    const s = new Set<string>();
    for (const it of items ?? []) {
      if (it.kind !== "cosmetic") continue;
      const key = `${String(it.payload.slot ?? "cosmetic")}:${String(it.payload.key ?? it.id)}`;
      if (wallet.cosmetics.includes(key)) s.add(it.id);
    }
    return s;
  }, [items, wallet.cosmetics]);

  /* ---------------------- Handlers ---------------------- */

  function toast(kind: "ok" | "err", msg: string) {
    setFlash({ kind, msg });
    setTimeout(() => setFlash(null), 2400);
  }

  function celebrate(u: UnifiedItem, message: string) {
    const override = SHOP_ASSET_OVERRIDES[u.id] ?? BUNDLE_ASSET_OVERRIDES[u.id];
    setCelebration({
      name: u.name,
      kindLabel:
        u.kind === "bundle"
          ? "Bundle desbloqueado"
          : u.kind === "cosmetic"
            ? "Cosmético"
            : u.kind === "powerup"
              ? "Power-up"
              : u.kind === "decks"
                ? "Deck"
                : "Pack",
      price: u.price,
      balance: Math.max(0, getWallet().crystals),
      art: override?.art ?? null,
      accent: RARITY_META[u.rarity]?.ring,
      message,
    });
  }

  async function handleBuyUnified(u: UnifiedItem) {
    if (!profile || busy) return;
    // Bundles show a detail modal first — never buy silently.
    if (u.kind === "bundle") {
      setBundleOpen(u.raw as ShopItem);
      return;
    }
    setBusy(u.id);
    if (u.kind === "decks") {
      const r = await buyPublishedDeck(profile.id, u.raw as PublishedDeckRow);
      setBusy(null);
      if (r.ok) {
        celebrate(u, r.message);
        if (r.deckId) setTimeout(() => router.navigate({ to: `/library/${r.deckId}` }), 700);
      } else {
        toast(
          "err",
          r.reason === "insufficient" ? "Arlys insuficientes." : "Não foi possível comprar.",
        );
      }
      return;
    }
    const r = await buyShopItem(profile.id, u.raw as ShopItem);
    setBusy(null);
    if (r.ok) celebrate(u, r.message);
    else
      toast(
        "err",
        r.reason === "insufficient"
          ? "Arlys insuficientes."
          : r.reason === "already_owned"
            ? "Você já tem este item."
            : "Não foi possível comprar.",
      );
  }

  async function confirmBuyBundle(item: ShopItem) {
    if (!profile || busy) return;
    setBusy(item.id);
    const r = await buyShopItem(profile.id, item);
    setBusy(null);
    if (r.ok) {
      const u = unified.find((x) => x.id === item.id);
      if (u) celebrate(u, r.message);
      setBundleOpen(null);
    } else {
      toast(
        "err",
        r.reason === "insufficient"
          ? "Arlys insuficientes."
          : r.reason === "already_owned"
            ? "Você já tem este item."
            : "Não foi possível comprar.",
      );
    }
  }

  function handleBuyFeatured(f: FeaturedItem) {
    const u = unified.find((x) => x.id === f.id);
    if (u) void handleBuyUnified(u);
  }

  /* ---------------------- Render ---------------------- */

  const loading = items === null || decks === null;

  return (
    <main className="mx-auto max-w-6xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      {/* Top bar: title + balance + help */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
            Loja airi
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Vitrine
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Coleções, cosméticos, power-ups e decks premium. Filtre, pesquise e escolha o seu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 backdrop-blur">
            <ArlysIcon className="h-5 w-5 text-violet-300" strokeWidth={2.25} />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Saldo
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {wallet.crystals}{" "}
                <span className="text-[11px] font-medium text-muted-foreground">✦</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-foreground/90 backdrop-blur transition hover:bg-white/[0.09]"
          >
            <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            Como funciona
          </button>
        </div>
      </header>

      {/* Vitrine hero */}
      {!loading && featured.length > 0 && (
        <ShopHero
          featured={featured}
          wallet={wallet.crystals}
          onBuy={handleBuyFeatured}
          busyId={busy}
          ownedIds={ownedIds}
        />
      )}

      {/* Category chips */}
      <div className="sticky top-14 z-10 -mx-2 mb-3 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-[oklch(0.14_0.02_285)]/85 p-1 backdrop-blur">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Search + sort + view */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
            strokeWidth={2.25}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, descrição ou criador…"
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-white/[0.06]"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold outline-none transition hover:bg-white/[0.06]"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-[oklch(0.14_0.02_285)]">
              {s.label}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-xs font-medium">
          {(
            [
              { id: "vitrine" as const, icon: Sparkles, label: "Vitrine" },
              { id: "grid" as const, icon: LayoutGrid, label: "Grid" },
              { id: "list" as const, icon: List, label: "Lista" },
            ]
          ).map((v) => {
            const Icon = v.icon;
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-label={v.label}
                title={v.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rarity chips + affordable */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(category === "all" || category === "cosmetic" || category === "bundle") && (
          <RarityFilter value={rarityFilter} onChange={setRarityFilter} />
        )}
        <button
          type="button"
          onClick={() => setAffordableOnly((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            affordableOnly
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          Só o que posso comprar
        </button>
      </div>

      <PurchaseSuccessOverlay data={celebration} onClose={() => setCelebration(null)} />

      {/* Toast */}
      {flash && (
        <div
          className={`fixed inset-x-0 top-24 z-40 mx-auto w-max max-w-[90%] rounded-full px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur ${
            flash.kind === "ok"
              ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
              : "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30"
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* Results */}
      <section>
        {loading ? (
          <SkeletonGrid view={view} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              q ? "Nada encontrado" : "Nenhum item por aqui"
            }
            hint={
              q
                ? "Tente ajustar a busca, categoria ou raridade."
                : "Volte em breve — a loja é atualizada com frequência."
            }
          />
        ) : view === "list" ? (
          <ul className="flex flex-col gap-2">
            {filtered.map((u) => (
              <ListRow
                key={`${u.kind}-${u.id}`}
                item={u}
                owned={ownedIds.has(u.id)}
                canAfford={wallet.crystals >= u.price}
                busy={busy === u.id}
                onBuy={() => handleBuyUnified(u)}
                onPreview={
                  u.kind === "cosmetic" ? () => handlePreview(u.raw as ShopItem) : undefined
                }
              />
            ))}
          </ul>
        ) : (
          <ul
            className={
              view === "vitrine"
                ? "grid gap-4 sm:grid-cols-2"
                : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {filtered.map((u) => {
              const slot = featuredSlots.find((s) => s.item_id === u.id);
              const splashUrl =
                u.kind === "bundle"
                  ? (slot?.splash_url ?? BUNDLE_ASSET_OVERRIDES[u.id]?.splash ?? null)
                  : null;
              const artUrl =
                u.kind === "bundle"
                  ? (slot?.art_url ?? BUNDLE_ASSET_OVERRIDES[u.id]?.art ?? null)
                  : null;
              return (
                <UnifiedCard
                  key={`${u.kind}-${u.id}`}
                  item={u}
                  view={view}
                  owned={ownedIds.has(u.id)}
                  stack={
                    u.kind === "powerup"
                      ? (wallet.powerups[String((u.raw as ShopItem).payload.effect ?? u.id)] ?? 0)
                      : 0
                  }
                  isMineDeck={
                    u.kind === "decks" && profile?.id === (u.raw as PublishedDeckRow).owner_profile_id
                  }
                  canAfford={wallet.crystals >= u.price}
                  busy={busy === u.id}
                  onBuy={() => handleBuyUnified(u)}
                  onPreview={
                    u.kind === "cosmetic" ? () => handlePreview(u.raw as ShopItem) : undefined
                  }
                  splashUrl={splashUrl}
                  artUrl={artUrl}
                />
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Como ganhar Arlys? Streak diário, subir de rank, vencer duelos, tirar boas notas na prova mensal.
      </p>

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
      {preview && <CosmeticPreview item={preview} onClose={() => setPreview(null)} />}
      {slotPreview && (
        <CosmeticSlotPreview
          slot={slotPreview.slot}
          itemKey={slotPreview.key}
          name={slotPreview.name}
          price={slotPreview.price}
          onClose={() => setSlotPreview(null)}
        />
      )}
      {tablePreviewSkinKey && (
        <TableSkinPreviewModal
          skin={tableSkinByKey(tablePreviewSkinKey)!}
          open={!!tablePreviewSkinKey}
          onClose={() => setTablePreviewSkinKey(null)}
        />
      )}
      {bundleOpen && (
        <BundleDetailModal
          bundle={bundleOpen}
          wallet={wallet.crystals}
          ownedIds={ownedIds}
          busy={busy === bundleOpen.id}
          onClose={() => setBundleOpen(null)}
          onBuy={() => void confirmBuyBundle(bundleOpen)}
          splashUrl={featuredSlots.find((s) => s.item_id === bundleOpen.id)?.splash_url ?? BUNDLE_ASSET_OVERRIDES[bundleOpen.id]?.splash}
          artUrl={featuredSlots.find((s) => s.item_id === bundleOpen.id)?.art_url ?? BUNDLE_ASSET_OVERRIDES[bundleOpen.id]?.art}
        />
      )}
    </main>
  );
}

/* ---------------------- Rarity filter row ---------------------- */

function RarityFilter({
  value,
  onChange,
}: {
  value: Rarity | "all";
  onChange: (r: Rarity | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
      <button
        onClick={() => onChange("all")}
        className={`rounded-full border px-3 py-1.5 uppercase tracking-wider transition ${
          value === "all"
            ? "border-white/30 bg-white/[0.1] text-foreground"
            : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
        }`}
      >
        Todas raridades
      </button>
      {RARITY_ORDER.map((r) => {
        const meta = RARITY_META[r];
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`rounded-full border px-3 py-1.5 uppercase tracking-wider transition ${
              active ? meta.chip : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------- Unified Card (grid + vitrine) ---------------------- */

function UnifiedCard({
  item,
  view,
  owned,
  stack,
  isMineDeck,
  canAfford,
  busy,
  onBuy,
  onPreview,
  splashUrl,
  artUrl,
}: {
  item: UnifiedItem;
  view: ViewMode;
  owned: boolean;
  stack: number;
  isMineDeck: boolean;
  canAfford: boolean;
  busy: boolean;
  onBuy: () => void;
  onPreview?: () => void;
  splashUrl?: string | null;
  artUrl?: string | null;
}) {
  const rarity = RARITY_META[item.rarity];
  const Icon = ICONS[item.icon] ?? Sparkles;
  const cosmeticArt = cosmeticArtFor(
    ((item.raw as ShopItem).payload ?? null) as Record<string, unknown> | null,
  );
  const isVitrine = view === "vitrine";
  const isPowerup = item.kind === "powerup";
  const puPal = isPowerup ? powerupPalette(item.accent) : null;
  const puBadge = isPowerup
    ? powerupBadge(((item.raw as ShopItem).payload ?? {}) as Record<string, unknown>)
    : undefined;

  return (
    <li
      className={`relative isolate overflow-hidden rounded-3xl border ${
        isPowerup ? "border-white/10" : rarity.border
      } bg-[oklch(0.15_0.02_285)] transition-all hover:-translate-y-0.5`}
      style={{
        boxShadow: isPowerup
          ? `0 20px 45px -30px ${puPal!.halo}`
          : `0 20px 45px -30px ${rarity.glow}`,
      }}
    >
      {isPowerup ? (
        <div className="relative">
          <PowerupCover
            accent={item.accent}
            icon={item.icon}
            height={isVitrine ? "h-32" : "h-28"}
            badge={puBadge}
          />
          {owned && (
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <Check className="h-3 w-3" strokeWidth={2.75} />
              Adquirido
            </span>
          )}
          {stack > 0 && !owned && (
            <span className="absolute right-3 bottom-3 inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              Estoque: {stack}
            </span>
          )}
        </div>
      ) : item.kind === "decks" ? (
        <div className="relative">
          <DeckCover
            accent={((item.raw as PublishedDeckRow).color_key as string) || item.accent}
            height={isVitrine ? "h-32" : "h-28"}
            cardCount={(item.raw as PublishedDeckRow).card_count}
            owner={item.owner}
          />
          {owned && (
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <Check className="h-3 w-3" strokeWidth={2.75} />
              Adquirido
            </span>
          )}
        </div>
      ) : item.kind === "pack" ? (
        <div className="relative">
          <PackCover
            accent={item.accent}
            height={isVitrine ? "h-32" : "h-28"}
            deckCount={item.bundleItems?.length}
          />
          {owned && (
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <Check className="h-3 w-3" strokeWidth={2.75} />
              Adquirido
            </span>
          )}
        </div>
      ) : item.kind === "bundle" ? (
        <div
          className={`relative w-full overflow-hidden ${isVitrine ? "h-40" : "h-32"}`}
          style={{
            background: splashUrl || artUrl
              ? "#0b0616"
              : rarity.gradient,
          }}
        >
          {(splashUrl || artUrl) && (
            <img
              src={(splashUrl || artUrl) as string}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* dark scrim for legibility */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
            }}
          />
          <span
            aria-hidden
            className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 opacity-70"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            }}
          />
          <div className="absolute inset-0 flex items-start justify-between p-3">
            <RarityChip rarity={item.rarity} />
            {owned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                <Check className="h-3 w-3" strokeWidth={2.75} />
                Adquirido
              </span>
            )}
          </div>
          <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
            Bundle
            {item.bundleItems?.length ? ` · ${item.bundleItems.length} itens` : ""}
          </span>
        </div>
      ) : (
        <div
          aria-hidden
          className={`relative w-full overflow-hidden ${isVitrine ? "h-28" : "h-20"}`}
          style={{
            background: cosmeticArt
              ? "radial-gradient(circle at 78% 55%, rgba(244,63,94,0.28), transparent 62%), linear-gradient(135deg,#1a0710 0%,#0b0409 100%)"
              : rarity.gradient,
          }}
        >
          <span
            aria-hidden
            className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 opacity-70"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
          {cosmeticArt && (
            <img
              src={cosmeticArt}
              alt=""
              loading="lazy"
              draggable={false}
              className="pointer-events-none absolute -right-2 top-1/2 h-[135%] -translate-y-1/2 object-contain opacity-95 drop-shadow-[0_10px_28px_rgba(244,63,94,0.45)]"
            />
          )}
          <div className="absolute inset-0 flex items-start justify-between p-3">
            <RarityChip rarity={item.rarity} />
            {owned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                <Check className="h-3 w-3" strokeWidth={2.75} />
                Adquirido
              </span>
            )}
            {stack > 0 && !owned && (
              <span className="inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                Estoque: {stack}
              </span>
            )}
          </div>
          {!cosmeticArt && (
            <div className="absolute bottom-3 left-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-black/30 text-white backdrop-blur"
                style={{ boxShadow: `0 6px 20px -6px ${rarity.glow}` }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {kindLabelBR(item.kind)}
              {item.owner ? ` · por ${item.owner}` : ""}
            </p>
            <h3 className="mt-0.5 truncate text-[15px] font-semibold text-foreground">
              {item.name}
            </h3>
          </div>
        </div>

        {/* cosmetic gets a mini profile preview inline for vitrine mode */}
        {isVitrine && item.kind === "cosmetic" && (
          <div className="mt-3">
            <MiniProfileCard item={item.raw as ShopItem} />
          </div>
        )}

        {item.kind === "bundle" && item.bundleItems && item.bundleItems.length > 0 && (
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            Contém {item.bundleItems.length} itens
          </p>
        )}

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] text-muted-foreground">
          {item.description || "Sem descrição."}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            <ArlysIcon className="h-3.5 w-3.5 text-violet-300" strokeWidth={2.5} />
            {item.price}
            <span className="text-[10px] font-medium text-muted-foreground">✦</span>
          </span>
          <div className="flex items-center gap-1.5">
            {onPreview && (
              <button
                onClick={onPreview}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-foreground/85 transition hover:bg-white/[0.08]"
              >
                <Eye className="h-3 w-3" strokeWidth={2.5} />
                Preview
              </button>
            )}
            <button
              onClick={onBuy}
              disabled={busy || owned || (!isMineDeck && item.kind !== "bundle" && !canAfford)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.5} />
                  …
                </>
              ) : owned ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                  Adquirido
                </>
              ) : isMineDeck ? (
                "Importar"
              ) : item.kind === "bundle" ? (
                "Ver conteúdo"
              ) : canAfford ? (
                "Comprar"
              ) : (
                "Sem Arlys"
              )}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------------------- List row ---------------------- */

function ListRow({
  item,
  owned,
  canAfford,
  busy,
  onBuy,
  onPreview,
}: {
  item: UnifiedItem;
  owned: boolean;
  canAfford: boolean;
  busy: boolean;
  onBuy: () => void;
  onPreview?: () => void;
}) {
  const rarity = RARITY_META[item.rarity];
  const Icon = ICONS[item.icon] ?? Sparkles;
  const cosmeticArt = cosmeticArtFor(
    ((item.raw as ShopItem).payload ?? null) as Record<string, unknown> | null,
  );
  const isPowerup = item.kind === "powerup";
  const isDeck = item.kind === "decks";
  const isPack = item.kind === "pack";
  const puPal = isPowerup ? powerupPalette(item.accent) : null;
  const colPal =
    isDeck
      ? collectionPalette(((item.raw as PublishedDeckRow).color_key as string) || item.accent)
      : isPack
        ? collectionPalette(item.accent)
        : null;
  const thumbBg = isPowerup
    ? `radial-gradient(circle at 30% 20%, ${puPal!.ring}, transparent 65%), linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7))`
    : colPal
      ? `radial-gradient(circle at 30% 20%, ${colPal.edge}, transparent 65%), linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7))`
      : rarity.gradient;
  const thumbGlow = isPowerup ? puPal!.halo : colPal ? colPal.glow : rarity.glow;
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border ${
        isPowerup ? "border-white/10" : rarity.border
      } bg-white/[0.03] p-3 transition hover:bg-white/[0.06]`}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-white"
        style={{ background: thumbBg, boxShadow: `0 6px 20px -8px ${thumbGlow}` }}
      >
        {cosmeticArt ? (
          <img
            src={cosmeticArt}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-9 w-9 object-contain"
          />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          {!isPowerup && !isDeck && !isPack && <RarityChip rarity={item.rarity} />}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {kindLabelBR(item.kind)}
          {item.owner ? ` · por ${item.owner}` : ""}
          {item.description ? ` — ${item.description}` : ""}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-1 text-sm font-semibold sm:inline-flex">
        <ArlysIcon className="h-3.5 w-3.5 text-violet-300" strokeWidth={2.5} />
        {item.price}
      </div>
      {onPreview && (
        <button
          onClick={onPreview}
          className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-foreground/85 transition hover:bg-white/[0.08] sm:inline-flex"
        >
          <Eye className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
      <button
        onClick={onBuy}
        disabled={busy || owned || !canAfford}
        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
      >
        {busy ? "…" : owned ? "Adquirido" : canAfford ? `${item.price} ✦` : "Sem Arlys"}
      </button>
    </li>
  );
}

/* ---------------------- Skeleton + empty ---------------------- */

function SkeletonGrid({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </ul>
    );
  }
  return (
    <ul className={view === "vitrine" ? "grid gap-4 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
        />
      ))}
    </ul>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="ios-card grid place-items-center rounded-3xl px-6 py-14 text-center">
      <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={2} />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ---------------------- Kind label ---------------------- */

function kindLabelBR(k: UnifiedItem["kind"]) {
  switch (k) {
    case "decks":
      return "Deck premium";
    case "pack":
      return "Pack de decks";
    case "cosmetic":
      return "Cosmético";
    case "powerup":
      return "Power-up";
    case "bundle":
      return "Bundle";
  }
}

/* ---------------------- Cosmetic preview (Discord-style) ---------------------- */

function CosmeticPreview({ item, onClose }: { item: ShopItem; onClose: () => void }) {
  const v = visualFor(item);
  const Icon = ICONS[item.icon] ?? Sparkles;
  const rarity = rarityFor(item.price);
  const showBanner = v.slot === "nameplate" || v.slot === "effect";
  const showDecoration = v.slot === "decoration";
  const showBadge = v.slot === "badge";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] overflow-hidden rounded-2xl border border-black/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
        style={{ background: "#232428" }}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white/80 hover:bg-black/60"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div
          className={`relative h-[110px] w-full overflow-hidden ${
            showBanner ? "cosmetic-banner-animated" : ""
          }`}
          style={{
            background: showBanner
              ? v.gradient
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
          <div className="absolute right-3 top-3">
            <RarityChip rarity={rarity} />
          </div>
        </div>

        <div className="relative px-4">
          <div
            className={`absolute -top-[46px] left-4 rounded-full ${
              showDecoration ? "cosmetic-avatar-float" : ""
            }`}
            style={{ padding: 5, background: "#232428" }}
          >
            <DiscordAvatar
              size={84}
              ring={v.ring}
              showDecoration={showDecoration}
              auraKey={String(item.payload.key ?? "")}
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-12">
          <div className="rounded-lg p-3" style={{ background: "#111214" }}>
            <div className="flex items-center gap-2">
              <p className="text-[17px] font-bold text-white leading-tight">Guilherme</p>
              {showBadge && (
                <span
                  className="relative inline-flex items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: v.gradient }}
                >
                  <span
                    aria-hidden
                    className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                    }}
                  />
                  <Icon className="relative h-3 w-3" strokeWidth={2.75} />
                  <span className="relative">{v.tag.toUpperCase()}</span>
                </span>
              )}
            </div>
            <p className="text-[13px] text-white/60 leading-tight">
              <span className="text-white/80">guilherme</span>
              <span className="text-white/40">.airi.com.br</span>
            </p>
            <div className="mt-3 h-px w-full" style={{ background: "#2b2d31" }} />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/80">
              Cosmético equipado
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-md text-white"
                style={{ background: v.gradient }}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{item.name}</p>
                <p className="truncate text-[11px] text-white/50">{slotLabel(v.slot)}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{ borderColor: "#1a1b1e", background: "#2b2d31" }}
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <ArlysIcon className="h-4 w-4 text-violet-300" strokeWidth={2.25} />
            {item.price}
            <span className="text-[11px] font-medium text-white/50">Arlys ✦</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/[0.12]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Help dialog ---------------------- */

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/25 via-fuchsia-500/15 to-indigo-500/25 px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-foreground/70 hover:bg-white/10 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
            <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Arlys ✦
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Como funciona a Loja</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua consistência em inglês vira Arlys. Gaste em decks, cosméticos, packs e bundles.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          <Section title="1 · Como ganhar Arlys" tone="violet">
            <RewardRow icon={<Flame className="h-4 w-4" strokeWidth={2.5} />} label="Streak diário" value="+20 base + 5 por dia" accent="amber" />
            <RewardRow icon={<Trophy className="h-4 w-4" strokeWidth={2.5} />} label="Subir divisão" value="+60 ✦" accent="sky" />
            <RewardRow icon={<Crown className="h-4 w-4" strokeWidth={2.5} />} label="Subir de tier" value="+200 ✦" accent="violet" />
            <RewardRow icon={<Swords className="h-4 w-4" strokeWidth={2.5} />} label="Vitória em duelo" value="+40 ✦" accent="pink" />
            <RewardRow icon={<Star className="h-4 w-4" strokeWidth={2.5} />} label="Prova mensal" value="+120 a +160 ✦" accent="emerald" />
          </Section>

          <Section title="2 · Raridades" tone="pink">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RARITY_ORDER.map((r) => {
                const meta = RARITY_META[r];
                return (
                  <div
                    key={r}
                    className="relative overflow-hidden rounded-2xl border border-white/10 p-3"
                    style={{ background: meta.gradient }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/80">
                      {r === "common" && "0–100 ✦"}
                      {r === "rare" && "101–200 ✦"}
                      {r === "epic" && "201–350 ✦"}
                      {r === "legendary" && "351–500 ✦"}
                      {r === "mythic" && "501+ ✦"}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="3 · O que existe na loja" tone="emerald">
            <Tile icon={<BookOpen className="h-4 w-4" strokeWidth={2.5} />} title="Decks premium" text="Decks curados por outros perfis, prontos pra estudar." />
            <Tile icon={<Package className="h-4 w-4" strokeWidth={2.5} />} title="Packs temáticos" text="Coleções por tema: viagem, negócios, tech, gírias, etc." />
            <Tile icon={<Palette className="h-4 w-4" strokeWidth={2.5} />} title="Cosméticos" text="Nameplates, auras, badges — puro estilo, sem afetar aprendizado." />
            <Tile icon={<Shield className="h-4 w-4" strokeWidth={2.5} />} title="Power-ups" text="Escudo de streak, dobrador de LP, revisão extra e mais." />
            <Tile icon={<Crown className="h-4 w-4" strokeWidth={2.5} />} title="Bundles" text="Pacotes especiais com várias coisas juntas — estilo skin bundle da Riot." />
          </Section>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            Entendi, bora comprar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "violet" | "pink" | "emerald";
  children: React.ReactNode;
}) {
  const dot =
    tone === "violet" ? "bg-violet-400" : tone === "pink" ? "bg-pink-400" : "bg-emerald-400";
  return (
    <div>
      <h3 className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RewardRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: keyof typeof ACCENTS;
}) {
  const acc = ACCENTS[accent] ?? ACCENTS.lavender;
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border bg-gradient-to-br p-3 ${acc}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Tile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[12px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
