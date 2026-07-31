// Vitrine hero for the airi Shop — cinematic, Riot/LoL-store inspired.
// Rotates through featured items automatically and on manual nav.
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (paused || featured.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  useEffect(() => {
    // keep idx in range if the featured list shrinks
    if (idx >= featured.length) setIdx(0);
  }, [featured.length, idx]);

  if (featured.length === 0) return null;
  const item = featured[idx];
  const rarity = RARITY_META[item.rarity];
  const owned = ownedIds.has(item.id);
  const canAfford = wallet >= item.price;

  const advance = () => setIdx((i) => (i + 1) % featured.length);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <section
      className={`relative isolate mb-5 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0611] ${featured.length > 1 ? "cursor-pointer" : ""}`}
      onClick={() => featured.length > 1 && advance()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >

      {/* Backdrop — admin splash art if present, else rarity gradient.
          Mobile: splash inteira no topo (aspect 16/9, sem corte).
          Desktop: splash preenche o hero (16/9) com o texto por cima. */}
      {item.splashUrl ? (
        <div className="relative w-full aspect-[16/9] sm:absolute sm:inset-0 sm:z-0 sm:aspect-auto sm:h-full">
          <img
            aria-hidden
            src={item.splashUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          {/* Mobile: fade curto só na base, para emendar com o bloco de texto */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:hidden"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(10,6,17,0.55) 55%, #0a0611 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.12) 68%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/2 sm:block"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </div>
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-90"
            style={{ background: rarity.gradient }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 85% 15%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(0,0,0,0.45), transparent 50%)",
            }}
          />
        </>
      )}
      {/* Grain-ish shimmer */}
      <span
        aria-hidden
        className="cosmetic-shimmer pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3 opacity-40"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
        }}
      />

      <div className="relative z-10 grid gap-4 p-4 sm:aspect-[16/9] sm:max-h-[68vh] sm:grid-cols-[minmax(0,1fr)_260px] sm:gap-6 sm:p-8">


        <div className="min-w-0 self-center">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
              <Sparkles className="h-3 w-3" strokeWidth={2.75} />
              Em destaque
            </span>
            <RarityChip rarity={item.rarity} size="md" />
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">
              {kindLabel(item.kind)}
            </span>
          </div>

          <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl">
            {item.name}
          </h2>
          {item.tagline && (
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 sm:text-[13px]">
              {item.tagline}
            </p>
          )}
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-white/85 line-clamp-3 sm:line-clamp-none sm:text-sm">
            {item.description || "Item exclusivo da loja airi."}
          </p>


          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/30 px-3 py-2 backdrop-blur sm:px-4 sm:py-2.5">
              <ArlysIcon className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={2.5} />
              <span className="text-xl font-bold leading-none tabular-nums text-white sm:text-2xl">
                {item.price}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Arlys ✦
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onBuy(item); }}
              disabled={busyId === item.id || owned || (!canAfford && item.kind !== "deck" && item.kind !== "bundle")}
              className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-black shadow-xl transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 sm:px-5 sm:text-sm"
            >
              {busyId === item.id ? (
                <>
                  <Sparkles className="h-4 w-4 shrink-0 animate-pulse" strokeWidth={2.5} />
                  <span className="truncate">Adquirindo…</span>
                </>
              ) : owned ? (
                <span className="truncate">Adquirido</span>
              ) : item.kind === "bundle" ? (
                <>
                  <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">Ver conteúdo</span>
                </>
              ) : canAfford ? (
                <>
                  <ArlysIcon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">
                    <span className="hidden sm:inline">Comprar por </span>
                    {item.price} ✦
                  </span>
                </>
              ) : (
                <span className="truncate">Faltam {item.price - wallet} ✦</span>
              )}
            </button>
            {featured.length > 1 && (
              <button
                aria-label="Próximo bundle"
                onClick={(e) => { e.stopPropagation(); advance(); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:px-4 sm:text-sm"
              >
                <span className="whitespace-nowrap">Próximo</span>
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Controls */}
      {featured.length > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + featured.length) % featured.length); }}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/30 text-white/90 backdrop-blur transition hover:bg-black/50 sm:grid"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            aria-label="Próximo"
            onClick={(e) => { e.stopPropagation(); advance(); }}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/30 text-white/90 backdrop-blur transition hover:bg-black/50 sm:grid"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5" onClick={stop}>
            {featured.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir para destaque ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

        </>
      )}
    </section>
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
