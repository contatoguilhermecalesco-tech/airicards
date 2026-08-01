// Aviso flutuante quando um fragmento de cosmético cai durante a revisão.
import { useEffect } from "react";
import { TIER_META, SLOT_LABEL, type ShardDrop } from "@/lib/relic-hunt";

export function ShardDropToast({
  drop,
  onDone,
}: {
  drop: ShardDrop;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone, drop]);

  const tier = TIER_META[drop.tier];

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[16%] z-[70] -translate-x-1/2 px-4"
    >
      <div
        className="luminho-pop flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{
          borderColor: `${tier.color}55`,
          background: "rgba(18,10,32,0.74)",
          boxShadow: `0 0 42px -8px ${tier.color}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        }}
      >
        <span className="relative grid h-12 w-12 place-items-center">
          <span
            className="luminho-halo absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${tier.color}55, transparent 70%)` }}
          />
          <ShardIcon accent={drop.accent} tier={tier.color} />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ color: tier.color }}
          >
            Fragmento {tier.label}
          </span>
          <span className="truncate text-[14px] font-bold tracking-tight text-white">
            {drop.name}
          </span>
          <span className="truncate text-[11px] text-white/55">
            {SLOT_LABEL[drop.slot] ?? drop.slot} · forje na Forja com Arlys ✦
          </span>
        </span>
      </div>
    </div>
  );
}

/** Lasca cristalina — o fragmento de cosmético. */
export function ShardIcon({
  accent,
  tier,
  size = 36,
}: {
  accent: string;
  tier: string;
  size?: number;
}) {
  const id = `shard-${accent.replace(/[^a-z0-9]/gi, "")}-${tier.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      className="luminho-bob relative"
      style={{ filter: `drop-shadow(0 0 9px ${tier})` }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="45%" stopColor={accent} />
          <stop offset="100%" stopColor={tier} />
        </linearGradient>
      </defs>
      <path
        d="M20 3 L31 14 L25 36 L14 33 L9 15 Z"
        fill={`url(#${id})`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1"
      />
      <path d="M20 3 L25 36 L14 33 Z" fill="rgba(255,255,255,0.22)" />
      <path d="M20 3 L31 14 L25 36 Z" fill="rgba(0,0,0,0.22)" />
      <path d="M13 12 L18 10 L17 18 Z" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}
