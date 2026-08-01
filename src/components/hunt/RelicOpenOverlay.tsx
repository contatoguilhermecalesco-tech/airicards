// Abertura cinematográfica do Relicário.
import { useEffect, useState } from "react";
import { Sparkles, Coins, Wand2, Crown } from "lucide-react";
import type { RelicKind, RelicReward } from "@/lib/relic-hunt";
import { RELIC_META } from "@/lib/relic-hunt";

const TIER_LABEL: Record<RelicReward["tier"], string> = {
  comum: "Comum",
  raro: "Raro",
  epico: "Épico",
  mitico: "Mítico",
};

export function RelicOpenOverlay({
  kind,
  reward,
  onClose,
}: {
  kind: RelicKind;
  /** `null` enquanto o sorteio está em curso. */
  reward: RelicReward | null;
  onClose: () => void;
}) {
  const meta = RELIC_META[kind];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!reward) return;
    const t = setTimeout(() => setRevealed(true), 1150);
    return () => clearTimeout(t);
  }, [reward]);

  const Icon =
    reward?.tone === "arlys" ? Coins : reward?.tone === "powerup" ? Wand2 : Crown;

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center px-6"
      role="dialog"
      aria-modal="true"
      onClick={() => revealed && onClose()}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-[fade-in_320ms_ease-out]"
        style={{
          background: `radial-gradient(70% 55% at 50% 45%, ${meta.glow}, rgba(8,4,16,0.94) 68%, #06030c 100%)`,
          backdropFilter: "blur(10px)",
        }}
      />

      {/* raios */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 relic-rays"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 45%, ${meta.accent}22 0deg 3deg, transparent 3deg 13deg)`,
          maskImage: "radial-gradient(closest-side, black, transparent 74%)",
          WebkitMaskImage: "radial-gradient(closest-side, black, transparent 74%)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        {/* Relicário */}
        <div
          className={revealed ? "relic-burst" : "relic-shake"}
          style={{ filter: `drop-shadow(0 0 40px ${meta.glow})` }}
        >
          <svg width="132" height="132" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <linearGradient id="relic-shell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="45%" stopColor={meta.accent} />
                <stop offset="100%" stopColor="rgba(20,10,36,0.9)" />
              </linearGradient>
            </defs>
            <path
              d="M50 6 L84 26 L84 66 L50 94 L16 66 L16 26 Z"
              fill="url(#relic-shell)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.2"
            />
            <path d="M50 6 L84 26 L50 44 L16 26 Z" fill="rgba(255,255,255,0.28)" />
            <path d="M50 44 L84 26 L84 66 L50 94 Z" fill="rgba(0,0,0,0.28)" />
            <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.92)" opacity="0.85" />
            <path
              d="M50 40 L54 50 L50 60 L46 50 Z"
              fill={meta.accent}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="0.6"
            />
          </svg>
        </div>

        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: meta.accent }}
        >
          {meta.name}
        </p>

        {!revealed ? (
          <p className="mt-3 text-sm text-white/55">Abrindo…</p>
        ) : (
          <div className="mt-5 w-full animate-[fade-in_420ms_ease-out]">
            <div
              className="rounded-3xl border p-5 backdrop-blur-xl"
              style={{
                borderColor: `${meta.accent}44`,
                background: "rgba(16,9,28,0.72)",
                boxShadow: `0 0 60px -18px ${meta.glow}`,
              }}
            >
              <span
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
                style={{
                  background: `linear-gradient(140deg, ${meta.accent}33, rgba(255,255,255,0.06))`,
                  border: `1px solid ${meta.accent}55`,
                }}
              >
                <Icon className="h-6 w-6" style={{ color: meta.accent }} />
              </span>
              <p className="mt-3 text-lg font-bold tracking-tight text-white">
                {reward?.label}
              </p>
              <p className="mt-1 text-[13px] text-white/60">{reward?.detail}</p>
              <p
                className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color: meta.accent,
                  background: `${meta.accent}18`,
                  border: `1px solid ${meta.accent}33`,
                }}
              >
                <Sparkles className="h-3 w-3" />
                {reward ? TIER_LABEL[reward.tier] : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target mt-5 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
