// Ritual de forja — marteladas, faíscas, vibração e revelação do cosmético.
// Forja crítica revela uma variante (Áurea / Platina) com brilho extra.
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Crown } from "lucide-react";
import {
  TIER_META,
  SLOT_LABEL,
  VARIANT_META,
  type ForgeVariant,
  type ShardStack,
} from "@/lib/relic-hunt";
import { ShardArt } from "@/components/hunt/ShardArt";
import { playForgeHammer, playForgeReveal, vibrateForge } from "@/lib/forge-fx";

function Sparks({ color, count = 18 }: { color: string; count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random();
        const dist = 90 + Math.random() * 130;
        return {
          i,
          sx: `${Math.cos(angle) * dist}px`,
          sy: `${Math.sin(angle) * dist}px`,
          sd: `${700 + Math.random() * 600}ms`,
          delay: `${Math.random() * 160}ms`,
          size: 3 + Math.random() * 4,
        };
      }),
    [count],
  );
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {bits.map((b) => (
        <span
          key={b.i}
          className="forge-spark absolute rounded-full"
          style={
            {
              width: b.size,
              height: b.size,
              background: color,
              boxShadow: `0 0 12px ${color}`,
              "--sx": b.sx,
              "--sy": b.sy,
              "--sd": b.sd,
              "--sdelay": b.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

function Embers({ color }: { color: string }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        i,
        left: `${8 + Math.random() * 84}%`,
        sd: `${1800 + Math.random() * 1400}ms`,
        delay: `${Math.random() * 1200}ms`,
        size: 2 + Math.random() * 3,
      })),
    [],
  );
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56">
      {bits.map((b) => (
        <span
          key={b.i}
          className="forge-ember absolute bottom-0 rounded-full"
          style={
            {
              left: b.left,
              width: b.size,
              height: b.size,
              background: color,
              boxShadow: `0 0 10px ${color}`,
              "--sd": b.sd,
              "--sdelay": b.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function ForgeOverlay({
  stack,
  done,
  variant,
  onClose,
}: {
  stack: ShardStack;
  /** true quando a forja terminou (item já concedido). */
  done: boolean;
  /** variante da forja crítica, quando houver. */
  variant?: ForgeVariant | null;
  onClose: () => void;
}) {
  const tier = TIER_META[stack.tier];
  const vMeta = variant ? VARIANT_META[variant] : null;
  const glow = vMeta?.color ?? tier.color;
  const [revealed, setRevealed] = useState(false);

  // Marteladas + vibração assim que o ritual começa.
  useEffect(() => {
    playForgeHammer();
    vibrateForge(false);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setRevealed(true);
      playForgeReveal(Boolean(variant));
      vibrateForge(Boolean(variant));
    }, 1050);
    return () => clearTimeout(t);
  }, [done, variant]);

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
          background: `radial-gradient(70% 55% at 50% 45%, ${glow}44, rgba(8,4,16,0.94) 68%, #06030c 100%)`,
          backdropFilter: "blur(10px)",
        }}
      />
      <div
        aria-hidden
        className="relic-rays absolute inset-0 opacity-50"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 45%, ${glow}22 0deg 3deg, transparent 3deg 13deg)`,
          maskImage: "radial-gradient(closest-side, black, transparent 74%)",
          WebkitMaskImage: "radial-gradient(closest-side, black, transparent 74%)",
        }}
      />
      <Embers color={glow} />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative grid place-items-center">
          {revealed && (
            <>
              <span
                aria-hidden
                className="forge-ring absolute h-40 w-40 rounded-full border-2"
                style={{ borderColor: `${glow}99` }}
              />
              <span
                aria-hidden
                className="forge-ring absolute h-40 w-40 rounded-full border"
                style={{ borderColor: `${glow}55`, ["--sdelay" as string]: "160ms" }}
              />
              <Sparks color={glow} count={variant ? 26 : 18} />
            </>
          )}
          <div
            className={revealed ? "relic-burst" : "relic-shake"}
            style={{ filter: `drop-shadow(0 0 40px ${glow})` }}
          >
            <ShardArt
              cosmeticKey={stack.key}
              accent={stack.accent}
              tierColor={glow}
              size={132}
              complete
            />
          </div>
        </div>

        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: glow }}
        >
          {revealed ? (vMeta ? "Forja crítica" : "Forjado") : "Forjando…"}
        </p>

        {revealed && (
          <div className="mt-5 w-full animate-[fade-in_420ms_ease-out]">
            <div
              className="rounded-3xl border p-5 backdrop-blur-xl"
              style={{
                borderColor: `${glow}44`,
                background: "rgba(16,9,28,0.72)",
                boxShadow: `0 0 60px -18px ${glow}`,
              }}
            >
              <p className="text-lg font-bold tracking-tight text-white">{stack.name}</p>
              <p className="mt-1 text-[13px] text-white/60">
                {SLOT_LABEL[stack.slot] ?? stack.slot} · equipe no seu perfil
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <p
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: tier.color,
                    background: `${tier.color}18`,
                    border: `1px solid ${tier.color}33`,
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  {tier.label}
                </p>
                {vMeta && (
                  <p
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      color: "#1a1207",
                      background: vMeta.color,
                      boxShadow: `0 0 24px -6px ${vMeta.color}`,
                    }}
                  >
                    <Crown className="h-3 w-3" />
                    Variante {vMeta.label}
                  </p>
                )}
              </div>
              {vMeta && (
                <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                  A bigorna acertou o ponto: este cosmético nasceu numa versão{" "}
                  {vMeta.label.toLowerCase()} — só sua.
                </p>
              )}
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
