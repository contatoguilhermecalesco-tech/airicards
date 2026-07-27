// Admin — gerência de itens da loja: habilitar/desabilitar, editar preço, excluir.
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import {
  listAllShopItems,
  updateShopItem,
  deleteShopItem,
  type ShopItem,
} from "@/lib/shop";

const KINDS = ["all", "pack", "cosmetic", "powerup"] as const;
type KindFilter = (typeof KINDS)[number];

export function ShopItemsSection() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>("");

  async function reload() {
    setLoading(true);
    try {
      setItems(await listAllShopItems());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (kind !== "all" && it.kind !== kind) return false;
      if (status === "active" && !it.active) return false;
      if (status === "inactive" && it.active) return false;
      if (needle && !it.name.toLowerCase().includes(needle) && !it.id.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [items, q, kind, status]);

  const counts = useMemo(() => {
    const active = items.filter((i) => i.active).length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  async function toggle(it: ShopItem) {
    setBusy(it.id);
    setErr(null);
    try {
      await updateShopItem(it.id, { active: !it.active });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, active: !x.active } : x)));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function savePrice(it: ShopItem) {
    const n = Number(priceDraft);
    if (!Number.isFinite(n) || n < 0) {
      setEditing(null);
      return;
    }
    setBusy(it.id);
    try {
      await updateShopItem(it.id, { price: Math.round(n) });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, price: Math.round(n) } : x)));
      setEditing(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(it: ShopItem) {
    if (!confirm(`Excluir "${it.name}" permanentemente?\n\nSe quiser apenas esconder da loja, use o botão Ativo/Inativo.`))
      return;
    setBusy(it.id);
    try {
      await deleteShopItem(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Itens da Loja</h3>
        <p className="mt-0.5 text-[11.5px] text-foreground/50">
          Habilite ou desabilite itens, edite preços e remova permanentemente.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <StatPill label="Total" value={counts.total} tone="neutral" />
        <StatPill label="Ativos" value={counts.active} tone="ok" />
        <StatPill label="Inativos" value={counts.inactive} tone="off" />
      </div>

      {/* Filters */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou id…"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-sm outline-none placeholder:text-foreground/40 focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === "all" ? "Todos" : k}
            </Chip>
          ))}
          <span className="mx-1 self-center text-foreground/20">·</span>
          <Chip active={status === "all"} onClick={() => setStatus("all")}>
            Qualquer status
          </Chip>
          <Chip active={status === "active"} onClick={() => setStatus("active")}>
            Só ativos
          </Chip>
          <Chip active={status === "inactive"} onClick={() => setStatus("inactive")}>
            Só inativos
          </Chip>
        </div>
      </div>

      {err && (
        <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11.5px] text-red-200">
          {err}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-foreground/50">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-foreground/50">
          Nenhum item com esses filtros.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((it) => (
            <li
              key={it.id}
              className={`flex items-center gap-2 rounded-2xl border p-2.5 transition ${
                it.active
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-white/[0.06] bg-white/[0.015] opacity-70"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold">{it.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${
                      it.kind === "pack"
                        ? "bg-fuchsia-500/20 text-fuchsia-200"
                        : it.kind === "cosmetic"
                          ? "bg-sky-500/20 text-sky-200"
                          : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {it.kind}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10.5px] text-foreground/40">
                  {it.id}
                </p>
              </div>

              {/* Price editor */}
              {editing === it.id ? (
                <input
                  autoFocus
                  type="number"
                  min={0}
                  value={priceDraft}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  onBlur={() => void savePrice(it)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void savePrice(it);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="w-20 rounded-lg border border-primary bg-black/40 px-2 py-1 text-right text-[12px] font-semibold outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing(it.id);
                    setPriceDraft(String(it.price));
                  }}
                  className="rounded-lg bg-white/[0.04] px-2 py-1 text-[12px] font-semibold text-foreground/80 transition hover:bg-white/[0.08]"
                  title="Editar preço"
                >
                  {it.price} ✦
                </button>
              )}

              <button
                onClick={() => void toggle(it)}
                disabled={busy === it.id}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${
                  it.active
                    ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                    : "bg-white/[0.05] text-foreground/60 hover:bg-white/10"
                } disabled:opacity-50`}
              >
                {busy === it.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                ) : it.active ? (
                  "Ativo"
                ) : (
                  "Inativo"
                )}
              </button>
              <button
                onClick={() => void remove(it)}
                disabled={busy === it.id}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-white/[0.04] text-foreground/60 hover:bg-white/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "ok" | "off";
}) {
  const styles =
    tone === "ok"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : tone === "off"
        ? "border-white/10 bg-white/[0.03] text-foreground/70"
        : "border-white/10 bg-white/[0.04] text-foreground";
  return (
    <div className={`rounded-2xl border px-3 py-2 ${styles}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-none">{value}</p>
    </div>
  );
}
