// Aviso flutuante quando um Luminho aparece durante a revisão.
import { useEffect } from "react";
import type { LuminhoDrop } from "@/lib/relic-hunt";

export function LuminhoDropToast({
  drop,
  onDone,
}: {
  drop: LuminhoDrop;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone, drop]);

  const prism = drop.rarity === "prismatico";
  const accent = prism ? "#7dd3fc" : "#d8b4fe";

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[18%] z-[70] -translate-x-1/2"
    >
      <div
        className="luminho-pop flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{
          borderColor: `${accent}55`,
          background: "rgba(18,10,32,0.72)",
          boxShadow: `0 0 42px -8px ${accent}, inset 0 1px 0 rgba(255,255,255,0.12)`,
        }}
      >
        <span className="relative grid h-11 w-11 place-items-center">
          <span
            className="luminho-halo absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${accent}66, transparent 70%)` }}
          />
          <LuminhoSprite accent={accent} prism={prism} />
        </span>
        <span className="flex flex-col leading-tight">
          <span
            className="text-[13px] font-bold tracking-tight"
            style={{ color: accent }}
          >
            {prism ? "Luminho Prismático!" : `Luminho encontrado${drop.amount > 1 ? " ×2" : ""}`}
          </span>
          <span className="text-[11px] text-white/55">
            {prism ? "Guarde 3 para forjar o relicário raro" : "Junte 8 para forjar um relicário"}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Espírito de luz — corpinho redondo, olhos calmos e cauda de brasa. */
export function LuminhoSprite({
  accent,
  prism = false,
  size = 34,
}: {
  accent: string;
  prism?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      className="luminho-bob relative"
      style={{ filter: `drop-shadow(0 0 10px ${accent})` }}
    >
      <defs>
        <radialGradient id={`lum-body-${prism ? "p" : "c"}`} cx="42%" cy="34%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </radialGradient>
      </defs>
      {/* cauda */}
      <path
        d="M20 30 C 15 34, 13 38, 15 39 C 18 39, 21 35, 22 31 Z"
        fill={accent}
        opacity="0.7"
        className="luminho-tail"
      />
      <circle cx="20" cy="19" r="11" fill={`url(#lum-body-${prism ? "p" : "c"})`} />
      {prism && (
        <path
          d="M20 5 L23 12 L20 19 L17 12 Z"
          fill="rgba(255,255,255,0.9)"
          opacity="0.85"
        />
      )}
      {/* olhos */}
      <ellipse cx="16.4" cy="19" rx="1.35" ry="1.9" fill="#1b1030" />
      <ellipse cx="23.6" cy="19" rx="1.35" ry="1.9" fill="#1b1030" />
      {/* brilho */}
      <circle cx="15.5" cy="13.5" r="2.4" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}
