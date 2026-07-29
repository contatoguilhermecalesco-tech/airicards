// Angelical/epic falling sakura petals overlay — themed to the
// "Florescer Celestial" bundle. Pure CSS animations, GPU-friendly,
// pointer-events-none so it never blocks interactions.
import { useMemo } from "react";

type Density = "light" | "normal" | "epic";

const DENSITY_COUNT: Record<Density, number> = {
  light: 14,
  normal: 22,
  epic: 34,
};

// Deterministic-ish pseudo random from a seed so petals don't reshuffle each render.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const PETAL_TINTS = [
  "linear-gradient(135deg, #ffd6ee 0%, #f5a6d0 55%, #e578b4 100%)",
  "linear-gradient(135deg, #ffe6f4 0%, #f2b6d8 60%, #d778b8 100%)",
  "linear-gradient(135deg, #fff0d6 0%, #f8c78a 55%, #e59a5b 100%)", // gold accent
  "linear-gradient(135deg, #f0e6ff 0%, #c9b6f5 60%, #9d7fe0 100%)", // lavender accent
];

// Variante "Rosas do Crepúsculo" (bundle Eclipse Carmesim) — pétalas rubras.
const CRIMSON_TINTS = [
  "linear-gradient(135deg, #ffb3c1 0%, #e11d48 55%, #7f1d1d 100%)",
  "linear-gradient(135deg, #fda4af 0%, #be123c 60%, #4c0519 100%)",
  "linear-gradient(135deg, #fecdd3 0%, #f43f5e 55%, #881337 100%)",
  "linear-gradient(135deg, #f5d0d6 0%, #9f1239 60%, #3b0212 100%)",
];

export function SakuraPetals({
  density = "normal",
  seed = 7,
  className = "",
  withHalo = false,
  variant = "sakura",
}: {
  density?: Density;
  seed?: number;
  className?: string;
  withHalo?: boolean;
  variant?: "sakura" | "crimson";
}) {
  const crimson = variant === "crimson";
  const petals = useMemo(() => {
    const rand = seeded(seed);
    const tints = crimson ? CRIMSON_TINTS : PETAL_TINTS;
    const count = DENSITY_COUNT[density];
    return Array.from({ length: count }, (_, i) => {
      const size = 10 + Math.floor(rand() * 16); // 10-26px
      const tint = tints[Math.floor(rand() * tints.length)];
      return {
        id: i,
        left: `${rand() * 100}%`,
        size,
        tint,
        duration: 7 + rand() * 8, // 7-15s
        delay: -rand() * 12, // negative so animation is already in progress on mount
        drift: (rand() * 120 - 60).toFixed(0) + "px", // -60 to 60
        opacity: 0.55 + rand() * 0.4,
        blur: rand() < 0.25 ? 1 : 0, // some out-of-focus petals for depth
      };
    });
  }, [density, seed, crimson]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {withHalo && (
        <>
          <span
            className="sakura-halo absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: "140%",
              height: "60%",
              background: crimson
                ? "radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.32), rgba(136, 19, 55, 0.18) 45%, transparent 70%)"
                : "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 238, 0.35), rgba(157, 127, 224, 0.15) 45%, transparent 70%)",
              filter: "blur(2px)",
            }}
          />
          <span
            className="sakura-halo absolute inset-x-0 bottom-0"
            style={{
              height: "45%",
              background: crimson
                ? "linear-gradient(to top, rgba(190, 18, 60, 0.2), transparent)"
                : "linear-gradient(to top, rgba(229, 120, 180, 0.18), transparent)",
              animationDelay: "1.2s",
            }}
          />
        </>
      )}
      {petals.map((p) => (
        <span
          key={p.id}
          className="sakura-petal absolute top-0"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size * 0.7,
              filter: p.blur ? "blur(1.5px)" : undefined,
              "--petal-duration": `${p.duration}s`,
              "--petal-delay": `${p.delay}s`,
              "--petal-drift": p.drift,
              "--petal-opacity": String(p.opacity),
            } as React.CSSProperties
          }
        >
          <span
            className="sakura-petal-inner block h-full w-full"
            style={{
              background: p.tint,
              borderRadius: "100% 0 100% 0",
              boxShadow: crimson
                ? "0 0 7px rgba(244, 63, 94, 0.55), inset 0 0 4px rgba(255,255,255,0.25)"
                : "0 0 6px rgba(255, 190, 225, 0.55), inset 0 0 4px rgba(255,255,255,0.35)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
