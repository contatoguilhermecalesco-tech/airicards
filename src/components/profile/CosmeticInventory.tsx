// Inventário de cosméticos — substitui a lista gigante de slots do perfil.
// Mostra uma grade compacta com os 12 slots (só o que está equipado) e abre
// um modal estilo "inventário de jogo" para trocar itens por slot.
import { useMemo, useState } from "react";
import { Check, Search, Sparkles, ShoppingBag, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ShopItem } from "@/lib/shop";
import type { CosmeticSlot } from "@/lib/wallet-store";
import { getEquippedArt } from "@/lib/shop-asset-overrides";
import { tableSkinByKey } from "@/lib/table-skins";
import { TableSkinPreviewButton } from "@/components/review/TableSkinPreviewModal";

export type SlotMetaMap = Record<
  CosmeticSlot,
  {
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
>;

type Props = {
  slotOrder: CosmeticSlot[];
  slotMeta: SlotMetaMap;
  ownedBySlot: Record<CosmeticSlot, ShopItem[]>;
  equippedItem: Partial<Record<CosmeticSlot, ShopItem>>;
  equippedKeys: Partial<Record<CosmeticSlot, string>>;
  keyOf: (item: ShopItem) => string;
  paletteFor: (accent: string) => { gradient: string; ring: string; tag: string };
  iconFor: (item: ShopItem) => React.ComponentType<{ className?: string; strokeWidth?: number }>;
  busy: string | null;
  onEquip: (item: ShopItem) => void;
  onUnequip: (slot: CosmeticSlot) => void;
};

function ItemArt({
  art,
  Icon,
  size = 40,
}: {
  art?: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  size?: number;
}) {
  return art ? (
    <img
      src={art}
      alt=""
      aria-hidden
      className="object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <Icon className="h-5 w-5 text-white/90" strokeWidth={2.25} />
  );
}

export function CosmeticInventory({
  slotOrder,
  slotMeta,
  ownedBySlot,
  equippedItem,
  equippedKeys,
  keyOf,
  paletteFor,
  iconFor,
  busy,
  onEquip,
  onUnequip,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>(slotOrder[0]);
  const [query, setQuery] = useState("");

  const totalOwned = useMemo(
    () => slotOrder.reduce((acc, s) => acc + ownedBySlot[s].length, 0),
    [slotOrder, ownedBySlot],
  );
  const totalEquipped = slotOrder.filter((s) => equippedKeys[s]).length;

  function openSlot(slot: CosmeticSlot) {
    setActiveSlot(slot);
    setQuery("");
    setOpen(true);
  }

  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = ownedBySlot[activeSlot] ?? [];
    return q ? arr.filter((i) => i.name.toLowerCase().includes(q)) : arr;
  }, [ownedBySlot, activeSlot, query]);

  const activeMeta = slotMeta[activeSlot];
  const activeEquippedKey = equippedKeys[activeSlot];

  return (
    <>
      {/* ---------- grade compacta de slots ---------- */}
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {slotOrder.map((slot) => {
          const meta = slotMeta[slot];
          const item = equippedItem[slot];
          const owned = ownedBySlot[slot].length;
          const art = getEquippedArt(equippedKeys[slot]);
          const palette = item ? paletteFor(item.accent) : null;
          const Icon = item ? iconFor(item) : meta.icon;
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => openSlot(slot)}
                className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-white/10 p-2.5 text-left transition hover:border-white/20"
                style={{ background: "#1e1f22" }}
              >
                {palette && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-25 transition group-hover:opacity-40"
                    style={{ background: palette.gradient }}
                  />
                )}
                <span
                  className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40"
                >
                  <ItemArt art={art} Icon={Icon} size={34} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] font-semibold text-white">
                    {item ? item.name : owned > 0 ? "Slot vazio" : "Sem itens"}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-white/45">
                    {owned} {owned === 1 ? "item" : "itens"}
                  </span>
                </span>
                {item && (
                  <Check className="relative h-4 w-4 shrink-0 text-emerald-300" strokeWidth={2.75} />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] text-white/45">
        {totalEquipped} de {slotOrder.length} slots equipados · {totalOwned} itens no inventário.
        Toque num slot para trocar.
      </p>

      {/* ---------- modal de inventário ---------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-3xl gap-0 overflow-hidden border-white/10 p-0"
          style={{ background: "#141317" }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                Inventário
              </p>
              <h3 className="truncate text-[15px] font-semibold text-white">{activeMeta.label}</h3>
              <p className="truncate text-[11px] text-white/50">{activeMeta.hint}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {activeSlot === "table" &&
                (() => {
                  const sk =
                    tableSkinByKey(activeEquippedKey) ??
                    (listed[0] ? tableSkinByKey(keyOf(listed[0])) : undefined);
                  return sk ? <TableSkinPreviewButton skin={sk} /> : null;
                })()}
              {activeEquippedKey && (
                <button
                  onClick={() => onUnequip(activeSlot)}
                  disabled={busy === activeSlot}
                  className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-white/85 transition hover:bg-white/[0.1] disabled:opacity-50"
                >
                  Remover
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.1]"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex max-h-[70vh] flex-col sm:flex-row">
            {/* abas de slot */}
            <div className="shrink-0 overflow-x-auto border-b border-white/10 sm:max-h-[70vh] sm:w-52 sm:overflow-y-auto sm:border-b-0 sm:border-r">
              <ul className="flex gap-1 p-2 sm:flex-col">
                {slotOrder.map((slot) => {
                  const meta = slotMeta[slot];
                  const on = slot === activeSlot;
                  const count = ownedBySlot[slot].length;
                  return (
                    <li key={slot} className="shrink-0">
                      <button
                        onClick={() => {
                          setActiveSlot(slot);
                          setQuery("");
                        }}
                        className={`flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold transition ${
                          on
                            ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30"
                            : "text-white/70 hover:bg-white/[0.06]"
                        }`}
                      >
                        <meta.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                        <span className="truncate">{meta.label}</span>
                        <span
                          className={`ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] sm:inline ${
                            equippedKeys[slot]
                              ? "bg-emerald-400/15 text-emerald-200"
                              : "bg-white/[0.06] text-white/45"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* grade de itens */}
            <div className="min-w-0 flex-1 overflow-y-auto p-3">
              {ownedBySlot[activeSlot].length > 3 && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-white/40" strokeWidth={2.5} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar item…"
                    className="w-full bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/35"
                  />
                </div>
              )}

              {listed.length === 0 ? (
                <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
                  <Sparkles className="h-5 w-5 text-white/30" strokeWidth={2} />
                  <p className="text-[12.5px] text-white/55">
                    {query ? "Nenhum item com esse nome." : "Você ainda não tem itens deste tipo."}
                  </p>
                  {!query && (
                    <Link
                      to="/shop"
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-violet-200 transition hover:bg-white/[0.1]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Ver na loja
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listed.map((it) => {
                    const k = keyOf(it);
                    const isEquipped = activeEquippedKey === k;
                    const p = paletteFor(it.accent);
                    const art = getEquippedArt(k);
                    const Icon = iconFor(it);
                    return (
                      <li key={k}>
                        <button
                          onClick={() => (isEquipped ? onUnequip(activeSlot) : onEquip(it))}
                          disabled={busy === k}
                          className={`group relative flex h-full w-full flex-col items-center gap-2 overflow-hidden rounded-2xl border p-3 text-center transition disabled:opacity-50 ${
                            isEquipped
                              ? "border-emerald-400/40 bg-emerald-400/[0.08]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-30"
                            style={{ background: p.gradient }}
                          />
                          <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/45">
                            <ItemArt art={art} Icon={Icon} size={44} />
                          </span>
                          <span className="relative line-clamp-2 text-[12px] font-semibold text-white">
                            {it.name}
                          </span>
                          <span
                            className={`relative mt-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isEquipped
                                ? "bg-emerald-400/15 text-emerald-200"
                                : "bg-white/[0.07] text-white/60"
                            }`}
                          >
                            {isEquipped ? "Equipado" : "Equipar"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
