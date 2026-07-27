// Admin panel for curating the shop's featured vitrine (hero carousel).
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { RARITY_META, type Rarity } from "@/components/shop/shop-visuals";
import {
  createFeaturedSlot,
  deleteFeaturedSlot,
  listFeaturedSlots,
  reorderSlots,
  updateFeaturedSlot,
  uploadSlotAsset,
  type FeaturedSlotRow,
} from "@/lib/featured-slots";
import { listShopItems, type ShopItem } from "@/lib/shop";
import { listPublishedDecks, type PublishedDeckRow } from "@/lib/marketplace";

type RefItem = {
  kind: "shop_item" | "deck";
  id: string;
  label: string;
  sub: string;
  price: number;
};

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export function FeaturedSlotsSection() {
  const [slots, setSlots] = useState<FeaturedSlotRow[]>([]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [decks, setDecks] = useState<PublishedDeckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeaturedSlotRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [s, i, d] = await Promise.all([
        listFeaturedSlots(),
        listShopItems(),
        listPublishedDecks(),
      ]);
      setSlots(s);
      setItems(i);
      setDecks(d.filter((x) => x.price > 0));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  const refIndex = useMemo(() => {
    const map = new Map<string, RefItem>();
    for (const it of items) {
      map.set(`shop_item:${it.id}`, {
        kind: "shop_item",
        id: it.id,
        label: it.name,
        sub: `${it.kind} · ${it.price} ✦`,
        price: it.price,
      });
    }
    for (const d of decks) {
      map.set(`deck:${d.id}`, {
        kind: "deck",
        id: d.id,
        label: d.name,
        sub: `Deck · ${d.owner_name} · ${d.price} ✦`,
        price: d.price,
      });
    }
    return map;
  }, [items, decks]);

  async function move(id: string, dir: -1 | 1) {
    const idx = slots.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= slots.length) return;
    const next = [...slots];
    [next[idx], next[j]] = [next[j], next[idx]];
    setSlots(next);
    try {
      await reorderSlots(next.map((s) => s.id));
    } catch (e) {
      setErr((e as Error).message);
      void reload();
    }
  }

  async function toggleActive(row: FeaturedSlotRow) {
    setBusy(row.id);
    try {
      const upd = await updateFeaturedSlot(row.id, { active: !row.active });
      setSlots((prev) => prev.map((s) => (s.id === row.id ? upd : s)));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: FeaturedSlotRow) {
    if (!confirm(`Remover slot "${refIndex.get(`${row.item_kind}:${row.item_id}`)?.label ?? row.item_id}"?`))
      return;
    setBusy(row.id);
    try {
      await deleteFeaturedSlot(row);
      setSlots((prev) => prev.filter((s) => s.id !== row.id));
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
          <h3 className="text-sm font-semibold text-foreground">Vitrine da Loja</h3>
          <p className="mt-0.5 text-[11.5px] text-foreground/50">
            Controla o carrossel em destaque. Ative slots com splash art.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Novo slot
        </button>
      </div>

      {/* Image specs hint */}
      <div className="mb-3 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11.5px] text-foreground/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
        <div className="leading-relaxed">
          <strong className="text-foreground">Tamanhos oficiais:</strong>{" "}
          <span>Splash art </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px]">2400 × 1200</span>
          <span> (2:1) · Art quadrado </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px]">1024 × 1024</span>
          <span> (PNG transparente).</span>
          <p className="mt-1 text-foreground/50">
            Zona segura de texto: 40% esquerdo do splash. Personagem/item no lado direito.
          </p>
        </div>
      </div>

      {err && (
        <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
          {err}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-foreground/50">Carregando…</p>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-foreground/30" strokeWidth={2} />
          <p className="mt-2 text-xs text-foreground/50">
            Nenhum slot ainda. A loja usa o fallback automático.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {slots.map((s, i) => {
            const ref = refIndex.get(`${s.item_kind}:${s.item_id}`);
            const rarity = s.rarity_override ?? "common";
            return (
              <li
                key={s.id}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
              >
                {/* Preview thumb */}
                <div
                  className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10"
                  style={{ background: RARITY_META[rarity].gradient }}
                >
                  {s.splash_url ? (
                    <img
                      src={s.splash_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-white/70">
                      <ImageIcon className="h-4 w-4" strokeWidth={2} />
                    </span>
                  )}
                  {!s.active && (
                    <span className="absolute inset-0 bg-black/60 grid place-items-center text-[9px] font-semibold uppercase tracking-wider text-white/70">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">
                    {ref?.label ?? <span className="text-red-300">Item removido</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-foreground/50">
                    #{i + 1} · {ref?.sub ?? `${s.item_kind}:${s.item_id}`}
                    {s.tagline ? ` · "${s.tagline}"` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void move(s.id, -1)}
                    disabled={i === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground/70 transition hover:bg-white/[0.08] disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => void move(s.id, 1)}
                    disabled={i === slots.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground/70 transition hover:bg-white/[0.08] disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => void toggleActive(s)}
                    disabled={busy === s.id}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${
                      s.active
                        ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                        : "bg-white/[0.05] text-foreground/60 hover:bg-white/10"
                    }`}
                  >
                    {s.active ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-full bg-primary/20 px-2.5 py-1 text-[10.5px] font-semibold text-primary transition hover:bg-primary/30"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => void remove(s)}
                    disabled={busy === s.id}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && (
        <AddSlotModal
          refIndex={refIndex}
          existing={new Set(slots.map((s) => `${s.item_kind}:${s.item_id}`))}
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await reload();
          }}
          nextPosition={slots.length}
        />
      )}

      {editing && (
        <EditSlotModal
          slot={editing}
          ref={refIndex.get(`${editing.item_kind}:${editing.item_id}`)}
          onClose={() => setEditing(null)}
          onSaved={async (updated) => {
            setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

/* -------------------- Add modal -------------------- */

function AddSlotModal({
  refIndex,
  existing,
  onClose,
  onCreated,
  nextPosition,
}: {
  refIndex: Map<string, RefItem>;
  existing: Set<string>;
  onClose: () => void;
  onCreated: () => void;
  nextPosition: number;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const options = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return Array.from(refIndex.values())
      .filter((r) => !existing.has(`${r.kind}:${r.id}`))
      .filter((r) => !needle || r.label.toLowerCase().includes(needle) || r.sub.toLowerCase().includes(needle))
      .slice(0, 60);
  }, [refIndex, existing, q]);

  async function pick(r: RefItem) {
    setBusy(`${r.kind}:${r.id}`);
    setErr(null);
    try {
      await createFeaturedSlot({ item_kind: r.kind, item_id: r.id, position: nextPosition });
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <ModalShell title="Adicionar slot" onClose={onClose}>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar item ou deck…"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
      />
      {err && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
          {err}
        </p>
      )}
      <div className="mt-3 max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
        {options.length === 0 ? (
          <p className="py-6 text-center text-xs text-foreground/50">Nenhum item disponível.</p>
        ) : (
          options.map((r) => (
            <button
              key={`${r.kind}:${r.id}`}
              onClick={() => void pick(r)}
              disabled={busy === `${r.kind}:${r.id}`}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{r.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-foreground/50">{r.sub}</p>
              </div>
              {busy === `${r.kind}:${r.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={2.5} />
              ) : (
                <Plus className="h-4 w-4 text-primary" strokeWidth={2.5} />
              )}
            </button>
          ))
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------- Edit modal -------------------- */

function EditSlotModal({
  slot,
  ref,
  onClose,
  onSaved,
}: {
  slot: FeaturedSlotRow;
  ref: RefItem | undefined;
  onClose: () => void;
  onSaved: (row: FeaturedSlotRow) => void;
}) {
  const [tagline, setTagline] = useState(slot.tagline ?? "");
  const [desc, setDesc] = useState(slot.description_override ?? "");
  const [rarity, setRarity] = useState<Rarity | "">(slot.rarity_override ?? "");
  const [startsAt, setStartsAt] = useState(slot.starts_at ? toLocalInput(slot.starts_at) : "");
  const [endsAt, setEndsAt] = useState(slot.ends_at ? toLocalInput(slot.ends_at) : "");
  const [splashUrl, setSplashUrl] = useState(slot.splash_url);
  const [artUrl, setArtUrl] = useState(slot.art_url);
  const [uploading, setUploading] = useState<"splash" | "art" | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(variant: "splash" | "art", file: File) {
    setUploading(variant);
    setErr(null);
    try {
      const url = await uploadSlotAsset(slot.id, variant, file);
      if (variant === "splash") setSplashUrl(url);
      else setArtUrl(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const updated = await updateFeaturedSlot(slot.id, {
        tagline: tagline.trim() || null,
        description_override: desc.trim() || null,
        rarity_override: rarity || null,
        splash_url: splashUrl,
        art_url: artUrl,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      });
      onSaved(updated);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={`Editar · ${ref?.label ?? slot.item_id}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Splash upload */}
        <UploadField
          label="Splash art (2400 × 1200)"
          hint="Fundo do banner. JPG/PNG até ~800KB."
          previewUrl={splashUrl}
          aspect="2 / 1"
          busy={uploading === "splash"}
          onFile={(f) => void upload("splash", f)}
          onClear={() => setSplashUrl(null)}
        />

        {/* Art upload */}
        <UploadField
          label="Art do item (1024 × 1024) — opcional"
          hint="PNG transparente do item/personagem no lado direito."
          previewUrl={artUrl}
          aspect="1 / 1"
          busy={uploading === "art"}
          onFile={(f) => void upload("art", f)}
          onClear={() => setArtUrl(null)}
        />

        {/* Text overrides */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Tagline
            </span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={40}
              placeholder="NOVO · EDIÇÃO LIMITADA · VOLTOU"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Raridade (override)
            </span>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity | "")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Automática (pelo preço)</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_META[r].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
            Descrição (override)
          </span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            maxLength={240}
            placeholder="Deixe vazio para usar a descrição original do item."
            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Início (opcional)
            </span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Fim (opcional)
            </span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        {err && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
            {err}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
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
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />}
            Salvar
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* -------------------- Reusables -------------------- */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/70 transition hover:bg-white/[0.1]"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UploadField({
  label,
  hint,
  previewUrl,
  aspect,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  previewUrl: string | null;
  aspect: string;
  busy: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const id = `up-${label.replace(/\W+/g, "-")}`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
          {label}
        </span>
        {previewUrl && (
          <button
            onClick={onClear}
            className="text-[10.5px] font-semibold text-red-300 hover:text-red-200"
          >
            remover
          </button>
        )}
      </div>
      <label
        htmlFor={id}
        className="relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition hover:border-primary/50 hover:bg-white/[0.04]"
        style={{ aspectRatio: aspect }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center gap-1 text-foreground/50">
            <Upload className="h-5 w-5" strokeWidth={2} />
            <span className="text-[11px]">Escolher imagem</span>
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={2.5} />
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-[10.5px] text-foreground/45">{hint}</p>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
