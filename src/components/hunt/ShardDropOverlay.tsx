// Pop-up de drop — aviso discreto no topo durante a revisão.
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X, Sparkles } from "lucide-react";
import {
  TIER_META,
  SLOT_LABEL,
  SHARDS_PER_FORGE,
  shardCountFor,
  type ShardDrop,
} from "@/lib/relic-hunt";
import { getEquippedArt } from "@/lib/shop-asset-overrides";

export function ShardDropOverlay({
  drop,
  onClose,
}: {
  drop: ShardDrop;
  onClose: () => void;
}) {
  const tier = TIER_META[drop.tier];
  const [count] = useState(() => Math.min(SHARDS_PER_FORGE, shardCountFor(drop.key)));
  const missing = Math.max(0, SHARDS_PER_FORGE - count);
  const art = getEquippedArt(drop.key);

  useEffect(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[92] flex justify-center px-4 pt-4"
      role="status"
      aria-live="polite"
      aria-label={`Fragmento recebido: ${drop.name}`}
    >
      <div
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur-xl animate-fade-in"
        style={{
          borderColor: `${tier.color}40`,
          background:
            "linear-gradient(160deg, rgba(28,20,42,0.92), rgba(16,12,24,0.96))",
          boxShadow: `0 10px 40px -12px ${tier.color}55`,
        }}
      >
        {/* Miniatura do item (cinza = incompleto) */}
        <span
          className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40"
          style={{ boxShadow: `inset 0 0 14px ${tier.color}22` }}
        >
          {art ? (
            <img
              src={art}
              alt=""
              aria-hidden
              className="h-9 w-9 object-contain"
              style={{
                filter: "grayscale(0.85) brightness(0.75)",
                opacity: 0.9,
              }}
            />
          ) : (
            <Sparkles className="h-5 w-5 text-white/40" />
          )}
          {/* Selo de fragmento */}
          <span
            aria-hidden
            className="absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full border text-[9px] font-bold"
            style={{
              borderColor: `${tier.color}80`,
              background: "rgba(10,6,18,0.95)",
              color: tier.color,
            }}
          >
            {count}
          </span>
        </span>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.22em]"
            style={{ color: tier.color }}
          >
            Fragmento {tier.label}
          </p>
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {drop.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {SLOT_LABEL[drop.slot] ?? drop.slot} · {count}/{SHARDS_PER_FORGE}
          </p>
        </div>

        {/* Progresso compacto */}
        <div className="flex shrink-0 gap-1">
          {Array.from({ length: SHARDS_PER_FORGE }).map((_, i) => (
            <span
              key={i}
              className="grid h-6 w-6 place-items-center rounded-md border text-[10px]"
              style={{
                borderColor: i < count ? tier.color : "rgba(255,255,255,0.12)",
                background: i < count ? `${tier.color}22` : "transparent",
                color: i < count ? tier.color : "rgba(255,255,255,0.35)",
              }}
            >
              {i < count ? <Check className="h-3 w-3" /> : i + 1}
            </span>
          ))}
        </div>

        {/* Ações */}
        <div className="flex shrink-0 flex-col gap-1.5">
          <Link
            to="/forja"
            className="grid h-7 place-items-center rounded-lg px-2.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`,
              color: "#170c26",
            }}
          >
            Forja
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-6 w-6 place-items-center self-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
