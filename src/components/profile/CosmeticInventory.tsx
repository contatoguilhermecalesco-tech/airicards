// Inventário de cosméticos — substitui a lista gigante de slots do perfil.
// Mostra uma grade compacta com os 12 slots (só o que está equipado) e abre
// um modal estilo "inventário de jogo" para trocar itens por slot.
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search, Sparkles, ShoppingBag, X } from "lucide-react";
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
  const slotIndex = Math.max(0, slotOrder.indexOf(activeSlot));

  function goSlot(dir: -1 | 1) {
    const next = (slotIndex + dir + slotOrder.length) % slotOrder.length;
    setActiveSlot(slotOrder[next]);
    setQuery("");
  }

  return (
    <>
      {/* ---------- grade compacta de slots ---------- */}
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-profile-panel sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
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
                className="group relative flex w-full items-center gap-3 overflow-hidden p-3 text-left transition hover:bg-profile-raised sm:min-h-[82px] sm:border-b sm:border-border"
              >
                {palette && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1 opacity-80 transition group-hover:opacity-100"
                    style={{ background: palette.gradient }}
                  />
                )}
                <span
                  className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-profile-base"
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
          className={[
            "flex max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-lg flex-col grid-cols-1 gap-0",
            "overflow-hidden rounded-[26px] border border-white/10 p-0 sm:max-w-2xl",
            "[&>button]:hidden",
          ].join(" ")}
          style={{
            background:
              "radial-gradient(120% 80% at 50% -10%, rgba(139,92,246,0.20), transparent 60%), #121016",
          }}
        >
          {/* ---------- topo com navegação lateral ---------- */}
          <div className="relative shrink-0 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goSlot(-1)}
                aria-label="Slot anterior"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition active:scale-95"
              >
                <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.5} />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-violet-300/70">
                  Inventário · {slotIndex + 1}/{slotOrder.length}
                </p>
                <h3 className="mt-0.5 truncate text-[17px] font-semibold leading-tight text-white">
                  {activeMeta.label}
                </h3>
              </div>

              <button
                onClick={() => goSlot(1)}
                aria-label="Próximo slot"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition active:scale-95"
              >
                <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.5} />
              </button>

              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition active:scale-95"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* pontinhos de progresso dos slots */}
            <div className="mt-2.5 flex justify-center gap-1">
              {slotOrder.map((s, i) => (
                <span
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    i === slotIndex ? "w-4 bg-violet-400" : "w-1 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ---------- vitrine do item equipado ---------- */}
          <div className="shrink-0 px-4 sm:px-5">
            {(() => {
              const eq = equippedItem[activeSlot];
              const art = getEquippedArt(activeEquippedKey);
              const p = eq ? paletteFor(eq.accent) : null;
              const Icon = eq ? iconFor(eq) : activeMeta.icon;
              return (
                <div
                  className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 p-3"
                  style={{ background: "rgba(255,255,255,0.035)" }}
                >
                  {p && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-35"
                      style={{ background: p.gradient }}
                    />
                  )}
                  <span className="relative grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/12 bg-black/45">
                    <ItemArt art={art} Icon={Icon} size={46} />
                  </span>
                  <div className="relative min-w-0 flex-1">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/45">
                      {eq ? "Equipado agora" : "Nada equipado"}
                    </p>
                    <p className="mt-0.5 truncate text-[14px] font-semibold text-white">
                      {eq ? eq.name : activeMeta.hint}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                          className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/85 transition active:scale-95 disabled:opacity-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>


          {/* ---------- grade de itens ---------- */}
          <div
            className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            {ownedBySlot[activeSlot].length > 3 && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <Search className="h-4 w-4 text-white/40" strokeWidth={2.5} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar item…"
                  className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/35"
                />
              </div>
            )}

            {listed.length === 0 ? (
              <div className="grid place-items-center gap-2 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center">
                <Sparkles className="h-6 w-6 text-white/25" strokeWidth={2} />
                <p className="text-[13px] text-white/55">
                  {query ? "Nenhum item com esse nome." : "Você ainda não tem itens deste tipo."}
                </p>
                {!query && (
                  <Link
                    to="/shop"
                    search={{ b: undefined }}
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[12px] font-semibold text-violet-200"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Ver na loja
                  </Link>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                        className={`group relative flex h-full w-full flex-col items-center gap-2.5 overflow-hidden rounded-3xl border p-3.5 text-center transition active:scale-[0.97] disabled:opacity-50 ${
                          isEquipped
                            ? "border-emerald-400/45 bg-emerald-400/[0.09]"
                            : "border-white/10 bg-white/[0.035]"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30 blur-[2px]"
                          style={{ background: p.gradient }}
                        />
                        {isEquipped && (
                          <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-400/90">
                            <Check className="h-3 w-3 text-black" strokeWidth={3} />
                          </span>
                        )}
                        <span className="relative grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-2xl border border-white/12 bg-black/45">
                          <ItemArt art={art} Icon={Icon} size={58} />
                        </span>
                        <span className="relative line-clamp-2 text-[12.5px] font-semibold leading-tight text-white">
                          {it.name}
                        </span>
                        <span
                          className={`relative mt-auto w-full rounded-full py-1.5 text-[10.5px] font-bold uppercase tracking-wider ${
                            isEquipped
                              ? "bg-emerald-400/15 text-emerald-200"
                              : "bg-white/[0.08] text-white/70"
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
        </DialogContent>
      </Dialog>

    </>
  );
}
