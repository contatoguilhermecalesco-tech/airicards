// Admin — construtor de bundles (pacotes estilo Riot/LoL).
// Cria um item de kind='bundle' que agrupa cosméticos/power-ups/packs existentes.
// Também controla a Vitrine da Loja (1 bundle em destaque por vez).
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Crown,
  ImageIcon,
  Info,
  Loader2,
  Minus,
  Package,
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
  type ShopItem,
} from "@/lib/shop";
import { rarityFor, RARITY_META } from "@/components/shop/shop-visuals";
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
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string>(String(initial?.price ?? 0));
  const [icon, setIcon] = useState(initial?.icon ?? "crown");
  const [accent, setAccent] = useState(initial?.accent ?? "lavender");
  const [picked, setPicked] = useState<string[]>(
    initial ? bundleItemIds(initial) : [],
  );
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const candidateMap = useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return candidates.filter((c) => {
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.id.toLowerCase().includes(needle) ||
        c.kind.toLowerCase().includes(needle)
      );
    });
  }, [candidates, q]);

  const pickedItems = picked
    .map((id) => candidateMap.get(id))
    .filter((x): x is ShopItem => Boolean(x));
  const totalValue = pickedItems.reduce((s, x) => s + (x.price ?? 0), 0);
  const priceN = Number(price) || 0;
  const savings = Math.max(0, totalValue - priceN);
  const savingsPct = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function save() {
    setErr(null);
    if (!name.trim()) {
      setErr("Dê um nome ao bundle.");
      return;
    }
    if (picked.length < 2) {
      setErr("Um bundle precisa de pelo menos 2 itens.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && initial) {
        await updateShopBundle(initial.id, {
          name: name.trim(),
          description: desc.trim(),
          price: priceN,
          items: picked,
          icon,
          accent,
        });
      } else {
        const id = `bundle-${slug(name)}-${Date.now().toString(36)}`;
        await createShopBundle({
          id,
          name: name.trim(),
          description: desc.trim(),
          price: priceN,
          items: picked,
          icon,
          accent,
        });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-4 shadow-2xl sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">
              {isEdit ? "Editar bundle" : "Novo bundle"}
            </h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.1]"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            {/* Left — metadata */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Nome
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coleção Nêmesis — Bundle Épico"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Descrição
                </span>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="Descreva o pacote — o que torna esta coleção especial."
                  className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-1 block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    Preço ✦
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="col-span-1 block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    Ícone
                  </span>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {ICON_CHOICES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-1 block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    Cor
                  </span>
                  <select
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {ACCENT_CHOICES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Pricing summary */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    Valor separado
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {totalValue} ✦
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                    Preço do bundle
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {priceN} ✦
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    Desconto
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-200">
                    {savings} ✦ ({savingsPct}%)
                  </span>
                </div>
              </div>

              {/* Picked chips */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                  Itens no bundle ({picked.length})
                </p>
                {pickedItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 py-4 text-center text-[11px] text-foreground/40">
                    Selecione ao menos 2 itens à direita.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {pickedItems.map((p) => (
                      <li
                        key={p.id}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-2 pr-1 text-[11px]"
                      >
                        <span className="max-w-[140px] truncate font-semibold">{p.name}</span>
                        <span className="text-foreground/50">· {p.price} ✦</span>
                        <button
                          onClick={() => toggle(p.id)}
                          className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-white/10 text-foreground/70 hover:bg-white/20"
                        >
                          <Minus className="h-2.5 w-2.5" strokeWidth={3} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right — item picker */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Adicionar itens
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome, id ou tipo…"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
                />
              </div>
              <ul className="mt-2 max-h-[42vh] space-y-1 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-foreground/50">
                    Nenhum item encontrado.
                  </p>
                ) : (
                  filtered.map((c) => {
                    const active = picked.includes(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggle(c.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                            active
                              ? "border-primary/50 bg-primary/10"
                              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <KindBadge kind={c.kind} />
                              <p className="truncate text-[12.5px] font-semibold">{c.name}</p>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-foreground/50">
                              <ArlysIcon className="h-2.5 w-2.5 text-violet-300" strokeWidth={2.5} />
                              {c.price} ✦
                            </p>
                          </div>
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-white/15 text-foreground/40"
                            }`}
                          >
                            {active ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : (
                              <Plus className="h-3 w-3" strokeWidth={3} />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          {err && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
              {err}
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
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
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {isEdit ? "Salvar bundle" : "Criar bundle"}
            </button>
          </div>
        </div>
      </div>
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
