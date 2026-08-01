// Animação de forja — o fragmento se completa e o cosmético nasce.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { TIER_META, SLOT_LABEL, type ShardStack } from "@/lib/relic-hunt";
import { ShardArt } from "@/components/hunt/ShardArt";

export function ForgeOverlay({
  stack,
  done,
  onClose,
}: {
  stack: ShardStack;
  /** true quando a forja terminou (item já concedido). */
  done: boolean;
  onClose: () => void;
}) {
  const tier = TIER_META[stack.tier];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setRevealed(true), 1050);
    return () => clearTimeout(t);
  }, [done]);

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
          background: `radial-gradient(70% 55% at 50% 45%, ${tier.color}44, rgba(8,4,16,0.94) 68%, #06030c 100%)`,
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        aria-hidden
        className="relic-rays absolute inset-0 opacity-50"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 45%, ${tier.color}22 0deg 3deg, transparent 3deg 13deg)`,
          maskImage: "radial-gradient(closest-side, black, transparent 74%)",
          WebkitMaskImage: "radial-gradient(closest-side, black, transparent 74%)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div
          className={revealed ? "relic-burst" : "relic-shake"}
          style={{ filter: `drop-shadow(0 0 40px ${tier.color})` }}
        >
          <ShardArt
            cosmeticKey={stack.key}
            accent={stack.accent}
            tierColor={tier.color}
            size={132}
            complete
          />

        </div>

        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: tier.color }}
        >
          {revealed ? "Forjado" : "Forjando…"}
        </p>

        {revealed && (
          <div className="mt-5 w-full animate-[fade-in_420ms_ease-out]">
            <div
              className="rounded-3xl border p-5 backdrop-blur-xl"
              style={{
                borderColor: `${tier.color}44`,
                background: "rgba(16,9,28,0.72)",
                boxShadow: `0 0 60px -18px ${tier.color}`,
              }}
            >
              <p className="text-lg font-bold tracking-tight text-white">{stack.name}</p>
              <p className="mt-1 text-[13px] text-white/60">
                {SLOT_LABEL[stack.slot] ?? stack.slot} · equipe no seu perfil
              </p>
              <p
                className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  color: tier.color,
                  background: `${tier.color}18`,
                  border: `1px solid ${tier.color}33`,
                }}
              >
                <Sparkles className="h-3 w-3" />
                {tier.label}
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
