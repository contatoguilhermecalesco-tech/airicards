// Vitrine hero for the airi Shop — game-client store layout.
// Mobile: a arte aparece inteira (proporção original, sem corte nem texto por cima),
// com o painel de compra abaixo e uma faixa de miniaturas dos destaques.
// Desktop: a arte preenche a vitrine com o texto à esquerda e miniaturas à direita.
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ArlysIcon } from "@/components/StatChip";
import { RARITY_META, RarityChip, type Rarity } from "@/components/shop/shop-visuals";
import type { ShopItem } from "@/lib/shop";
import type { PublishedDeckRow } from "@/lib/marketplace";

export type FeaturedItem = {
  id: string;
  kind: "pack" | "cosmetic" | "powerup" | "bundle" | "deck";
  name: string;
  description: string;
  price: number;
  rarity: Rarity;
  icon?: string;
  tagline?: string; // small overline
  raw: ShopItem | PublishedDeckRow;
  splashUrl?: string | null; // admin-curated background art (2400x1200)
  artUrl?: string | null; // admin-curated item art (1024x1024)
};

export function ShopHero({
  featured,
  wallet,
  onBuy,
  busyId,
  ownedIds,
}: {
  featured: FeaturedItem[];
  wallet: number;
  onBuy: (f: FeaturedItem) => void;
  busyId: string | null;
  ownedIds: Set<string>;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || featured.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  useEffect(() => {
    if (idx >= featured.length) setIdx(0);
  }, [featured.length, idx]);

  if (featured.length === 0) return null;
  const item = featured[idx];
  const rarity = RARITY_META[item.rarity];
  const owned = ownedIds.has(item.id);
  const canAfford = wallet >= item.price;
  const many = featured.length > 1;

  const go = (d: number) => setIdx((i) => (i + d + featured.length) % featured.length);

  const onTouchStart = (e: React.TouchEvent) => {
    setPaused(true);
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null || !many) return;
    const dx = end - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const buyDisabled =
    busyId === item.id ||
    owned ||
    (!canAfford && item.kind !== "deck" && item.kind !== "bundle");

  const buyLabel =
    busyId === item.id ? (
      <>
        <Sparkles className="h-4 w-4 shrink-0 animate-pulse" strokeWidth={2.5} />
        <span className="truncate">Adquirindo…</span>
      </>
    ) : owned ? (
      <span className="truncate">Adquirido</span>
    ) : item.kind === "bundle" ? (
      <span className="truncate">Ver conteúdo</span>
    ) : canAfford ? (
      <span className="truncate">Comprar</span>
    ) : (
      <span className="truncate">Faltam {item.price - wallet} ✦</span>
    );

  const art = item.splashUrl || item.artUrl || null;

  return (
    <section
      className="mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="shop-frame relative isolate overflow-hidden bg-shop-ink">
        {/* ---------- Arte ---------- */}
        <div
          className="relative sm:absolute sm:inset-0"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {art ? (
            <img
              key={item.id}
              src={art}
              alt={item.name}
              draggable={false}
              className="shop-art-in block h-auto w-full sm:h-full sm:object-cover sm:object-[70%_center]"
            />
          ) : (
            <div
              key={item.id}
              className="shop-art-in aspect-video w-full sm:h-full sm:aspect-auto"
              style={{ background: rarity.gradient }}
            />
          )}
          {/* Desktop: sombra lateral para leitura do texto */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--shop-ink) 92%, transparent) 0%, color-mix(in oklab, var(--shop-ink) 55%, transparent) 36%, transparent 64%), linear-gradient(0deg, color-mix(in oklab, var(--shop-ink) 70%, transparent) 0%, transparent 35%)",
            }}
          />
          {/* Mobile: setas e contador sobre a arte, sem cobrir o centro */}
          {many && (
            <>
              <button
                aria-label="Destaque anterior"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-shop-gold/40 bg-shop-ink/60 text-shop-parchment backdrop-blur sm:hidden"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                aria-label="Próximo destaque"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-shop-gold/40 bg-shop-ink/60 text-shop-parchment backdrop-blur sm:hidden"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="absolute right-2 top-2 z-20 border border-shop-gold/40 bg-shop-ink/70 px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-widest text-shop-parchment backdrop-blur sm:hidden">
                {idx + 1}/{featured.length}
              </span>
            </>
          )}
        </div>

        {/* ---------- Painel de compra ---------- */}
        <div className="relative z-10 border-t border-shop-gold/25 bg-shop-panel p-4 sm:flex sm:min-h-[440px] sm:items-end sm:border-t-0 sm:bg-transparent sm:p-8 sm:pb-24">
          <div className="min-w-0 sm:max-w-[520px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 border border-shop-gold/50 bg-shop-ink/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-shop-gold-bright">
                <Sparkles className="h-3 w-3" strokeWidth={2.75} />
                Em destaque
              </span>
              <RarityChip rarity={item.rarity} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-shop-parchment/70">
                {kindLabel(item.kind)}
              </span>
            </div>

            <h2 className="shop-title mt-2.5 text-[30px] font-semibold italic leading-none sm:leading-tight text-shop-parchment sm:text-[54px]">
              {item.name}
            </h2>
            {item.tagline && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-shop-gold">
                {item.tagline}
              </p>
            )}
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-shop-parchment/75 sm:line-clamp-4 sm:text-sm">
              {item.description || "Item exclusivo da loja airi."}
            </p>

            <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2 sm:flex sm:gap-3">
              <div className="inline-flex items-center gap-2 border border-shop-gold/35 bg-shop-ink/70 px-3 py-2">
                <ArlysIcon className="h-4 w-4 text-shop-gold-bright" strokeWidth={2.5} />
                <span className="text-xl font-bold leading-none tabular-nums text-shop-parchment">
                  {item.price}
                </span>
                <span className="text-[10px] font-semibold text-shop-parchment/60">✦</span>
              </div>
              <button
                onClick={() => onBuy(item)}
                disabled={buyDisabled}
                className="shop-gold-btn shop-title inline-flex min-w-0 items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase transition disabled:opacity-50 sm:min-w-[200px]"
              >
                {buyLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: setas */}
        {many && (
          <>
            <button
              aria-label="Destaque anterior"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-shop-gold/40 bg-shop-ink/50 text-shop-parchment backdrop-blur transition hover:border-shop-gold sm:grid"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <button
              aria-label="Próximo destaque"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-shop-gold/40 bg-shop-ink/50 text-shop-parchment backdrop-blur transition hover:border-shop-gold sm:grid"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </>
        )}

        {/* Desktop: faixa de miniaturas sobre a arte */}
        {many && (
          <div className="absolute bottom-5 right-5 z-20 hidden max-w-[60%] gap-2 overflow-x-auto sm:flex">
            {featured.map((f, i) => (
              <Thumb key={f.id} item={f} active={i === idx} onClick={() => setIdx(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: faixa de miniaturas abaixo */}
      {many && (
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
          {featured.map((f, i) => (
            <Thumb key={f.id} item={f} active={i === idx} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </section>
  );
}

function Thumb({
  item,
  active,
  onClick,
}: {
  item: FeaturedItem;
  active: boolean;
  onClick: () => void;
}) {
  const art = item.splashUrl || item.artUrl;
  return (
    <button
      onClick={onClick}
      aria-label={`Ver ${item.name}`}
      aria-current={active}
      className={`relative w-[104px] shrink-0 overflow-hidden border text-left transition sm:w-[120px] ${
        active
          ? "border-shop-gold-bright shadow-shop-gold"
          : "border-shop-gold/25 opacity-70 hover:opacity-100"
      }`}
    >
      <div
        className="aspect-video w-full bg-shop-ink"
        style={art ? undefined : { background: RARITY_META[item.rarity].gradient }}
      >
        {art && (
          <img src={art} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
        )}
      </div>
      <span className="block truncate bg-shop-ink/90 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-shop-parchment/85">
        {item.name}
      </span>
    </button>
  );
}

function kindLabel(k: FeaturedItem["kind"]) {
  switch (k) {
    case "deck":
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
