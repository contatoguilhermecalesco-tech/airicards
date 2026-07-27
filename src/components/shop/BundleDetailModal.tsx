// Bundle detail modal — Valorant/LoL-style. Lists everything inside a bundle,
// shows individual total, savings and lets the user buy the whole set at once.
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { ArlysIcon } from "@/components/StatChip";
import { SakuraPetals } from "@/components/SakuraPetals";
import {
  ICONS,
  MiniProfileCard,
  RARITY_META,
  RarityChip,
  rarityFor,
} from "@/components/shop/shop-visuals";
import { getBundleContents, type ShopItem } from "@/lib/shop";
import { getShopAssetOverride } from "@/lib/shop-asset-overrides";

export function BundleDetailModal({
  bundle,
  wallet,
  ownedIds,
  onClose,
  onBuy,
  busy,
  splashUrl,
  artUrl,
}: {
  bundle: ShopItem;
  wallet: number;
  ownedIds: Set<string>;
  onClose: () => void;
  onBuy: () => void;
  busy: boolean;
  splashUrl?: string | null;
  artUrl?: string | null;
}) {
  const [contents, setContents] = useState<ShopItem[] | null>(null);
  const rarity = RARITY_META[rarityFor(bundle.price)];
  const Icon = ICONS[bundle.icon] ?? Sparkles;

  useEffect(() => {
    let alive = true;
    void getBundleContents(bundle).then((r) => {
      if (alive) setContents(r);
    });
    return () => {
      alive = false;
    };
  }, [bundle.id]);

  const separately = (contents ?? []).reduce((sum, c) => sum + (c.price ?? 0), 0);
  const savings = Math.max(0, separately - bundle.price);
  const savingsPct = separately > 0 ? Math.round((savings / separately) * 100) : 0;
  const allOwned =
    contents !== null &&
    contents.length > 0 &&
    contents.every(
      (c) =>
        c.kind !== "cosmetic" || // powerups always "buyable"
        ownedIds.has(c.id),
    );
  const canAfford = wallet >= bundle.price;

  return (
    <div
      className="fixed inset-0 z-[130] overflow-y-auto bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] shadow-2xl"
        >
          {/* Hero header */}
          <div className="relative isolate overflow-hidden">
            {splashUrl ? (
              <img
                src={splashUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{ background: rarity.gradient }}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
              }}
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition hover:bg-black/60"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RarityChip rarity={rarityFor(bundle.price)} size="md" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                    Bundle · {contents?.length ?? "…"} itens
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-3xl">
                  {bundle.name}
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/75">
                  {bundle.description || "Coleção especial airi."}
                </p>
              </div>

              {/* Bundle art / icon */}
              <div className="relative shrink-0">
                {artUrl ? (
                  <div
                    className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-black/40 backdrop-blur sm:h-28 sm:w-28"
                    style={{ boxShadow: `0 20px 50px -20px ${rarity.glow}` }}
                  >
                    <img src={artUrl} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <span
                    className="grid h-24 w-24 place-items-center rounded-2xl border border-white/25 bg-black/30 text-white shadow-xl backdrop-blur sm:h-28 sm:w-28"
                    style={{ background: rarity.gradient }}
                  >
                    <Icon className="h-10 w-10" strokeWidth={2.25} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contents grid */}
          <div className="max-h-[52vh] overflow-y-auto px-4 pb-4 sm:px-6">
            <div className="mb-3 mt-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Itens neste bundle
              </h3>
              {contents && contents.length > 0 && (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Compra tudo de uma vez
                </p>
              )}
            </div>

            {contents === null ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" strokeWidth={2.5} />
              </div>
            ) : contents.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.02] py-6 text-center text-xs text-foreground/50">
                Nenhum item configurado neste bundle ainda.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {contents.map((c) => (
                  <BundleItemRow key={c.id} item={c} owned={ownedIds.has(c.id)} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer — pricing + buy */}
          <div className="border-t border-white/[0.06] bg-black/25 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                {separately > 0 && savings > 0 && (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/90">
                    Economize {savings} ✦ ({savingsPct}%)
                  </p>
                )}
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="inline-flex items-center gap-1.5 text-2xl font-bold text-foreground">
                    <ArlysIcon className="h-5 w-5 text-violet-300" strokeWidth={2.5} />
                    {bundle.price}
                    <span className="text-sm font-medium text-muted-foreground">✦</span>
                  </span>
                  {separately > 0 && separately !== bundle.price && (
                    <span className="text-[12px] font-medium text-muted-foreground line-through">
                      {separately} ✦
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Seu saldo: <span className="tabular-nums">{wallet} ✦</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-white/[0.08]"
                >
                  Voltar
                </button>
                <button
                  onClick={onBuy}
                  disabled={busy || allOwned || !canAfford || (contents?.length ?? 0) === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" strokeWidth={2.5} />
                      Processando…
                    </>
                  ) : allOwned ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.75} />
                      Tudo adquirido
                    </>
                  ) : !canAfford ? (
                    "Arlys insuficientes"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                      Comprar bundle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BundleItemRow({ item, owned }: { item: ShopItem; owned: boolean }) {
  const rarity = RARITY_META[rarityFor(item.price)];
  const Icon = ICONS[item.icon] ?? Sparkles;
  const override = getShopAssetOverride(item.id);
  return (
    <li
      className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border ${rarity.border} bg-white/[0.02] p-2.5 transition hover:bg-white/[0.05]`}
    >
      {override?.art ? (
        <span
          className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl"
        >
          <img
            src={override.art}
            alt=""
            aria-hidden
            className="h-full w-full object-contain"
          />
        </span>
      ) : (
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg"
          style={{ background: rarity.gradient, boxShadow: `0 8px 22px -12px ${rarity.glow}` }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <RarityChip rarity={rarityFor(item.price)} />
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kindLabel(item.kind)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
          {item.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <ArlysIcon className="h-3 w-3 text-violet-300" strokeWidth={2.5} />
          {item.price} ✦
        </p>
      </div>
      {owned && (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
          <Check className="h-3 w-3" strokeWidth={2.75} />
          Já tem
        </span>
      )}
    </li>
  );
}

function kindLabel(k: string): string {
  switch (k) {
    case "pack":
      return "Pack";
    case "cosmetic":
      return "Cosmético";
    case "powerup":
      return "Power-up";
    case "bundle":
      return "Bundle";
    default:
      return k;
  }
}
