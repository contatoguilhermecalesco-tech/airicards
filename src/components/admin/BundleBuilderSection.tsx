// Admin — construtor de bundles (pacotes estilo Riot/LoL).
// Cria um item de kind='bundle' que agrupa cosméticos/power-ups/packs existentes.
// Também controla a Vitrine da Loja (1 bundle em destaque por vez).
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  ImageIcon,
  Info,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  bundleItemIds,
  createShopBundle,
  deleteShopItem,
  listAllShopItems,
  updateShopBundle,
  updateShopItem,
  updateBundleChildItem,
  type ShopItem,
} from "@/lib/shop";
import {
  rarityFor,
  rarityOfItem,
  RARITY_META,
  RARITY_ORDER,
  type Rarity,
} from "@/components/shop/shop-visuals";
import { getShopAssetOverride } from "@/lib/shop-asset-overrides";
import { ArlysIcon } from "@/components/StatChip";
import {
  createFeaturedSlot,
  deleteFeaturedSlot,
  listFeaturedSlots,
  type FeaturedSlotRow,
} from "@/lib/featured-slots";
import { BundleVitrineEditor } from "./BundleVitrineEditor";

const ICON_CHOICES = [
  "crown",
  "sparkles",
  "star",
  "gift",
  "trophy",
  "flame",
  "heart",
  "swords",
  "shield",
];

const ACCENT_CHOICES = ["lavender", "violet", "pink", "sky", "emerald", "amber"];

export function BundleBuilderSection() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [slots, setSlots] = useState<FeaturedSlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [vitrineFor, setVitrineFor] = useState<{ bundle: ShopItem; slot: FeaturedSlotRow } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [it, sl] = await Promise.all([listAllShopItems(), listFeaturedSlots()]);
      setItems(it);
      setSlots(sl);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  const bundles = useMemo(() => items.filter((i) => i.kind === "bundle"), [items]);
  const candidates = useMemo(
    () => items.filter((i) => i.kind !== "bundle"),
    [items],
  );

  // Featured slot for a bundle (item_kind='shop_item', item_id=bundle.id)
  const slotForBundle = useMemo(() => {
    const map = new Map<string, FeaturedSlotRow>();
    for (const s of slots) {
      if (s.item_kind === "shop_item") map.set(s.item_id, s);
    }
    return map;
  }, [slots]);

  async function toggleActive(b: ShopItem) {
    setBusy(b.id);
    try {
      await updateShopItem(b.id, { active: !b.active });
      setItems((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)),
      );
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(b: ShopItem) {
    if (
      !confirm(
        `Excluir bundle "${b.name}"?\n\nOs itens dentro não são apagados — só o pacote.`,
      )
    )
      return;
    setBusy(b.id);
    try {
      // If featured, remove the slot too
      const s = slotForBundle.get(b.id);
      if (s) await deleteFeaturedSlot(s).catch(() => undefined);
      await deleteShopItem(b.id);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function feature(b: ShopItem) {
    setBusy(b.id);
    setErr(null);
    try {
      // Only one featured slot allowed — remove all existing first
      for (const s of slots) {
        await deleteFeaturedSlot(s).catch(() => undefined);
      }
      await createFeaturedSlot({ item_kind: "shop_item", item_id: b.id, position: 0 });
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function unfeature(b: ShopItem) {
    const s = slotForBundle.get(b.id);
    if (!s) return;
    setBusy(b.id);
    setErr(null);
    try {
      await deleteFeaturedSlot(s);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Bundles &amp; Vitrine</h3>
          <p className="mt-0.5 text-[11.5px] text-foreground/50">
            Pacotes estilo Riot — ative na loja, destaque na vitrine e configure splash art.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Novo bundle
        </button>
      </div>

      {/* Image specs hint */}
      <div className="mb-3 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11.5px] text-foreground/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
        <div className="leading-relaxed">
          <strong className="text-foreground">Vitrine:</strong>{" "}
          <span>apenas 1 bundle em destaque. Splash </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px]">2400 × 1200</span>
          <span> · Art </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px]">1024 × 1024</span>
          <span>. Personagem à direita, zona segura de texto à esquerda.</span>
        </div>
      </div>

      {err && (
        <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
          {err}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-foreground/50">Carregando…</p>
      ) : bundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <Crown className="mx-auto h-6 w-6 text-foreground/30" strokeWidth={2} />
          <p className="mt-2 text-xs text-foreground/50">
            Nenhum bundle ainda. Crie o primeiro pacote de coleção.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bundles.map((b) => {
            const ids = bundleItemIds(b);
            const featuredSlot = slotForBundle.get(b.id);
            const isFeatured = Boolean(featuredSlot);
            const rarity = RARITY_META[featuredSlot?.rarity_override ?? rarityFor(b.price)];
            const splashUrl = featuredSlot?.splash_url ?? getShopAssetOverride(b.id)?.splash ?? getShopAssetOverride(b.id)?.art;
            return (
              <li
                key={b.id}
                className={`rounded-2xl border p-2.5 transition ${
                  isFeatured
                    ? "border-amber-400/40 bg-amber-500/[0.05]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:h-24 sm:w-40"
                    style={{ background: rarity.gradient }}
                  >
                    {splashUrl ? (
                      <img src={splashUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-white/70">
                        <ImageIcon className="h-4 w-4" strokeWidth={2} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold">{b.name}</p>
                      {isFeatured && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-amber-200">
                          <Star className="h-2.5 w-2.5" strokeWidth={2.75} />
                          Vitrine
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-foreground/50">
                      {ids.length} itens · {b.price} ✦ · {b.active ? "Ativo na loja" : "Inativo"}
                      {featuredSlot?.tagline ? ` · "${featuredSlot.tagline}"` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => void toggleActive(b)}
                    disabled={busy === b.id}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${
                      b.active
                        ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                        : "bg-white/[0.05] text-foreground/60 hover:bg-white/10"
                    }`}
                  >
                    {b.active ? "Ativo na loja" : "Inativo"}
                  </button>
                  {isFeatured ? (
                    <>
                      <button
                        onClick={() => setVitrineFor({ bundle: b, slot: featuredSlot! })}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10.5px] font-semibold text-amber-200 transition hover:bg-amber-500/30"
                      >
                        <Star className="h-3 w-3" strokeWidth={2.75} />
                        Editar vitrine
                      </button>
                      <button
                        onClick={() => void unfeature(b)}
                        disabled={busy === b.id}
                        className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10.5px] font-semibold text-foreground/60 transition hover:bg-white/10"
                      >
                        Tirar do destaque
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => void feature(b)}
                      disabled={busy === b.id}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10.5px] font-semibold text-amber-200 transition hover:bg-amber-500/25"
                    >
                      <Star className="h-3 w-3" strokeWidth={2.75} />
                      {slots.length > 0 ? "Substituir destaque" : "Destacar na vitrine"}
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(b)}
                    className="rounded-full bg-primary/20 px-2.5 py-1 text-[10.5px] font-semibold text-primary transition hover:bg-primary/30"
                  >
                    Editar bundle
                  </button>
                  <button
                    onClick={() => void remove(b)}
                    disabled={busy === b.id}
                    className="ml-auto grid h-7 w-7 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <BundleEditor
          candidates={candidates}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await reload();
          }}
        />
      )}

      {editing && (
        <BundleEditor
          candidates={candidates}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}

      {vitrineFor && (
        <BundleVitrineEditor
          slot={vitrineFor.slot}
          bundleName={vitrineFor.bundle.name}
          onClose={() => setVitrineFor(null)}
          onSaved={async () => {
            setVitrineFor(null);
            await reload();
          }}
        />
      )}
    </section>
  );
}

/* -------------------- Editor modal -------------------- */

type ChildPatch = { name?: string; price?: number; rarity?: string | null; uses?: number | null };

function BundleEditor({
  candidates,
  initial,
  onClose,
  onSaved,
}: {
  candidates: ShopItem[];
  initial?: ShopItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial);
  const [tab, setTab] = useState<"info" | "items" | "price">("info");
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(String(initial?.price ?? 0));
  const [icon, setIcon] = useState(initial?.icon ?? "crown");
  const [accent, setAccent] = useState(initial?.accent ?? "lavender");
  const [rarity, setRarity] = useState<string>(
    typeof initial?.payload?.rarity === "string" ? String(initial.payload.rarity) : "",
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState<string>(String(initial?.sort_order ?? 0));
  const [picked, setPicked] = useState<string[]>(initial ? bundleItemIds(initial) : []);
  const [patches, setPatches] = useState<Record<string, ChildPatch>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const candidateMap = useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );

  // Item já com o patch local aplicado (para o resumo de preços refletir edições).
  function withPatch(it: ShopItem): ShopItem {
    const p = patches[it.id];
    if (!p) return it;
    const payload = { ...(it.payload ?? {}) } as Record<string, unknown>;
    if (p.rarity !== undefined) {
      if (p.rarity) payload.rarity = p.rarity;
      else delete payload.rarity;
    }
    if (p.uses !== undefined) {
      if (p.uses && p.uses > 0) payload.uses = p.uses;
      else delete payload.uses;
    }
    return {
      ...it,
      name: p.name ?? it.name,
      price: p.price ?? it.price,
      payload,
    };
  }

  const pickedItems = picked
    .map((id) => candidateMap.get(id))
    .filter((x): x is ShopItem => Boolean(x))
    .map(withPatch);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return candidates.filter((c) => {
      if (picked.includes(c.id)) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.id.toLowerCase().includes(needle) ||
        c.kind.toLowerCase().includes(needle)
      );
    });
  }, [candidates, q, picked]);

  const totalValue = pickedItems.reduce((s, x) => s + (x.price ?? 0), 0);
  const priceN = Number(price) || 0;
  const savings = Math.max(0, totalValue - priceN);
  const savingsPct = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;
  const effRarity = (rarity || rarityFor(priceN)) as Rarity;
  const dirtyChildren = Object.keys(patches).length;

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function move(id: string, dir: -1 | 1) {
    setPicked((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function patchChild(id: string, patch: ChildPatch) {
    setPatches((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function applyDiscount(pct: number) {
    setPrice(String(Math.max(0, Math.round((totalValue * (100 - pct)) / 100))));
  }

  async function save() {
    setErr(null);
    if (!name.trim()) {
      setErr("Dê um nome ao bundle.");
      setTab("info");
      return;
    }
    if (picked.length < 2) {
      setErr("Um bundle precisa de pelo menos 2 itens.");
      setTab("items");
      return;
    }
    setSaving(true);
    try {
      // 1) salva as edições dos itens que estão dentro do bundle
      for (const [id, patch] of Object.entries(patches)) {
        const base = candidateMap.get(id);
        if (!base) continue;
        await updateBundleChildItem(base, patch);
      }
      // 2) salva o bundle
      const common = {
        name: name.trim(),
        description: desc.trim(),
        price: priceN,
        items: picked,
        icon,
        accent,
        rarity: rarity || null,
        sort_order: Number(sortOrder) || 0,
        active,
      };
      if (isEdit && initial) {
        await updateShopBundle(initial.id, { ...common, basePayload: initial.payload ?? {} });
      } else {
        await createShopBundle({
          id: `bundle-${slug(name)}-${Date.now().toString(36)}`,
          ...common,
        });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: typeof tab; label: string; hint?: string }[] = [
    { id: "info", label: "Detalhes" },
    { id: "items", label: `Itens · ${picked.length}` },
    { id: "price", label: "Preço" },
  ];

  return (
    <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full items-stretch justify-center sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full flex-col overflow-hidden border-white/10 bg-[oklch(0.14_0.02_285)] shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-4xl sm:rounded-3xl sm:border"
        >
          {/* Header */}
          <div className="shrink-0 border-b border-white/10 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">
                  {isEdit ? name || "Editar bundle" : "Novo bundle"}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground/50">
                  <span
                    className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${RARITY_META[effRarity].chip}`}
                  >
                    {RARITY_META[effRarity].label}
                  </span>
                  {picked.length} itens · {priceN} ✦
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.1]"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-white/[0.05] text-foreground/60 hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {tab === "info" && (
              <div className="space-y-3">
                <label className="block">
                  <span className={LBL}>Nome</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coleção Nêmesis — Bundle Épico"
                    className={INPUT}
                  />
                </label>
                <label className="block">
                  <span className={LBL}>Descrição</span>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={3}
                    placeholder="Descreva o pacote — o que torna esta coleção especial."
                    className={`${INPUT} resize-none`}
                  />
                </label>

                <div>
                  <span className={LBL}>Raridade</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRarity("")}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        rarity === ""
                          ? "border-primary/60 bg-primary/20 text-primary"
                          : "border-white/10 bg-white/[0.03] text-foreground/60"
                      }`}
                    >
                      Automática ({RARITY_META[rarityFor(priceN)].label})
                    </button>
                    {RARITY_ORDER.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRarity(r)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                          rarity === r
                            ? RARITY_META[r].chip
                            : "border-white/10 bg-white/[0.03] text-foreground/50"
                        }`}
                      >
                        {RARITY_META[r].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <label className="block">
                    <span className={LBL}>Ícone</span>
                    <select value={icon} onChange={(e) => setIcon(e.target.value)} className={INPUT}>
                      {ICON_CHOICES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={LBL}>Cor</span>
                    <select value={accent} onChange={(e) => setAccent(e.target.value)} className={INPUT}>
                      {ACCENT_CHOICES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={LBL}>Ordem</span>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className={INPUT}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setActive((v) => !v)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition ${
                    active
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="text-[12.5px] font-semibold">
                    {active ? "Ativo na loja" : "Oculto da loja"}
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition ${active ? "bg-emerald-400" : "bg-white/15"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${active ? "left-[1.375rem]" : "left-0.5"}`}
                    />
                  </span>
                </button>
              </div>
            )}

            {tab === "items" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className={LBL}>No bundle ({picked.length})</p>
                  <button
                    onClick={() => setAdding((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/30"
                  >
                    <Plus className="h-3 w-3" strokeWidth={3} />
                    Adicionar item
                  </button>
                </div>

                {adding && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2.5">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nome, id ou tipo…"
                        className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
                      />
                    </div>
                    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
                      {filtered.length === 0 ? (
                        <p className="py-5 text-center text-[11px] text-foreground/50">
                          Nenhum item disponível.
                        </p>
                      ) : (
                        filtered.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => toggle(c.id)}
                              className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition hover:bg-white/[0.07]"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <KindBadge kind={c.kind} />
                                  <p className="truncate text-[12.5px] font-semibold">{c.name}</p>
                                </div>
                                <p className="mt-0.5 text-[10.5px] text-foreground/50">{c.price} ✦</p>
                              </div>
                              <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}

                {pickedItems.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-[11.5px] text-foreground/40">
                    Nenhum item ainda — adicione pelo menos 2.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {pickedItems.map((it, idx) => {
                      const open = expanded === it.id;
                      const r = rarityOfItem(it);
                      const uses = Number(it.payload?.uses ?? 0) || 0;
                      const changed = Boolean(patches[it.id]);
                      return (
                        <li
                          key={it.id}
                          className={`overflow-hidden rounded-2xl border ${
                            changed ? "border-primary/40 bg-primary/[0.06]" : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center gap-2 p-2.5">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => move(it.id, -1)}
                                disabled={idx === 0}
                                className="grid h-5 w-5 place-items-center rounded bg-white/[0.06] text-foreground/60 disabled:opacity-25"
                              >
                                <ChevronUp className="h-3 w-3" strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => move(it.id, 1)}
                                disabled={idx === pickedItems.length - 1}
                                className="grid h-5 w-5 place-items-center rounded bg-white/[0.06] text-foreground/60 disabled:opacity-25"
                              >
                                <ChevronDown className="h-3 w-3" strokeWidth={3} />
                              </button>
                            </div>

                            <button
                              onClick={() => setExpanded(open ? null : it.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <KindBadge kind={it.kind} />
                                <span
                                  className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${RARITY_META[r].chip}`}
                                >
                                  {RARITY_META[r].label}
                                </span>
                                {changed && (
                                  <span className="rounded-full bg-primary/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                                    editado
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-[12.5px] font-semibold">{it.name}</p>
                              <p className="text-[10.5px] text-foreground/50">
                                {it.price} ✦{it.kind === "powerup" && uses ? ` · ${uses} usos` : ""}
                              </p>
                            </button>

                            <button
                              onClick={() => setExpanded(open ? null : it.id)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-foreground/70"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => toggle(it.id)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-200"
                            >
                              <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                            </button>
                          </div>

                          {open && (
                            <div className="space-y-2.5 border-t border-white/10 bg-black/25 p-3">
                              <label className="block">
                                <span className={LBL}>Nome do item</span>
                                <input
                                  value={it.name}
                                  onChange={(e) => patchChild(it.id, { name: e.target.value })}
                                  className={INPUT}
                                />
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                  <span className={LBL}>Preço ✦</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={it.price}
                                    onChange={(e) =>
                                      patchChild(it.id, { price: Number(e.target.value) || 0 })
                                    }
                                    className={INPUT}
                                  />
                                </label>
                                {it.kind === "powerup" && (
                                  <label className="block">
                                    <span className={LBL}>Quantidade (usos)</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={uses || 1}
                                      onChange={(e) =>
                                        patchChild(it.id, { uses: Number(e.target.value) || 1 })
                                      }
                                      className={INPUT}
                                    />
                                  </label>
                                )}
                              </div>
                              <div>
                                <span className={LBL}>Raridade do item</span>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => patchChild(it.id, { rarity: null })}
                                    className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
                                      !it.payload?.rarity
                                        ? "border-primary/60 bg-primary/20 text-primary"
                                        : "border-white/10 bg-white/[0.03] text-foreground/60"
                                    }`}
                                  >
                                    Auto
                                  </button>
                                  {RARITY_ORDER.map((rr) => (
                                    <button
                                      key={rr}
                                      type="button"
                                      onClick={() => patchChild(it.id, { rarity: rr })}
                                      className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider transition ${
                                        it.payload?.rarity === rr
                                          ? RARITY_META[rr].chip
                                          : "border-white/10 bg-white/[0.03] text-foreground/50"
                                      }`}
                                    >
                                      {RARITY_META[rr].label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10.5px] text-foreground/40">
                                id: <span className="font-mono">{it.id}</span>
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {tab === "price" && (
              <div className="space-y-3">
                <label className="block">
                  <span className={LBL}>Preço do bundle ✦</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`${INPUT} text-lg font-semibold tabular-nums`}
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {[20, 30, 40, 50, 60].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyDiscount(pct)}
                      disabled={totalValue === 0}
                      className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-foreground/70 transition hover:bg-white/[0.12] disabled:opacity-40"
                    >
                      −{pct}%
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <Row label="Valor separado" value={`${totalValue} ✦`} />
                  <Row label="Preço do bundle" value={`${priceN} ✦`} />
                  <Row
                    label="Desconto"
                    value={`${savings} ✦ (${savingsPct}%)`}
                    accent="text-emerald-200"
                  />
                  <Row
                    label="Raridade final"
                    value={RARITY_META[effRarity].label}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <p className={LBL}>Preço por item</p>
                  <ul className="mt-1.5 space-y-1">
                    {pickedItems.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center justify-between gap-2 text-[11.5px]"
                      >
                        <span className="truncate text-foreground/70">{it.name}</span>
                        <span className="shrink-0 tabular-nums text-foreground/50">{it.price} ✦</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            {err && (
              <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
                {err}
              </p>
            )}
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[11px] text-foreground/50">
                {picked.length} itens · {priceN} ✦
                {dirtyChildren > 0 ? ` · ${dirtyChildren} item(ns) editado(s)` : ""}
              </p>
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LBL = "text-[11px] font-semibold uppercase tracking-wider text-foreground/60";
const INPUT =
  "mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary";

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className={`${LBL} ${accent ?? ""}`}>{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent ?? ""}`}>{value}</span>
    </div>
  );
}


function KindBadge({ kind }: { kind: string }) {
  const styles =
    kind === "pack"
      ? "bg-fuchsia-500/20 text-fuchsia-200"
      : kind === "cosmetic"
        ? "bg-sky-500/20 text-sky-200"
        : kind === "powerup"
          ? "bg-amber-500/20 text-amber-200"
          : "bg-white/10 text-foreground/70";
  const Icon =
    kind === "pack" ? Package : kind === "cosmetic" ? Sparkles : Crown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${styles}`}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.75} />
      {kind}
    </span>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32) || "bundle";
}
