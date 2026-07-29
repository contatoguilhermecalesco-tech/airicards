import { useEffect, useRef, useState } from "react";
import type { TableSkin } from "@/lib/table-skins";
import { isDefaultTableSkin } from "@/lib/table-skins";

/** Poeira/faíscas em suspensão — configuração estável entre renders. */
const DUST = Array.from({ length: 18 }).map((_, i) => ({
  left: (i * 5.7 + 3) % 98,
  size: 1.5 + ((i * 7) % 4) * 0.9,
  duration: 18 + ((i * 5) % 7) * 3,
  delay: (i * 1.7) % 14,
  drift: (i % 2 ? 1 : -1) * (18 + ((i * 11) % 40)),
  opacity: 0.22 + ((i * 3) % 5) * 0.09,
}));

const RAYS = [
  { left: "16%", width: "9vw", duration: "13s", delay: "0s" },
  { left: "38%", width: "14vw", duration: "17s", delay: "-4s" },
  { left: "62%", width: "8vw", duration: "15s", delay: "-8s" },
  { left: "80%", width: "12vw", duration: "19s", delay: "-2s" },
];

/**
 * Camada de ambiente da Mesa de Revisão: arte de fundo viva — respiro lento
 * (ken burns), parallax no mouse, raios de luz, poeira e vinheta pulsante.
 */
export function TableSkinAmbient({ skin }: { skin: TableSkin }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setOffset({ x, y });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  if (isDefaultTableSkin(skin) || !skin.ambient) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Arte de fundo com parallax + deriva lenta */}
      <div
        className="absolute inset-0 transition-transform duration-[900ms] ease-out will-change-transform"
        style={{ transform: `translate3d(${offset.x * -14}px, ${offset.y * -10}px, 0)` }}
      >
        <img
          src={skin.ambient}
          alt=""
          loading="lazy"
          className="table-bg-drift h-full w-full object-cover opacity-[0.32] will-change-transform"
        />
      </div>

      {/* Raios de luz descendo da abóbada */}
      <div className="absolute inset-x-0 top-0 h-[75vh] mix-blend-screen">
        {RAYS.map((r, i) => (
          <span
            key={i}
            className="table-godray absolute top-[-10%] block h-[95%] origin-top"
            style={
              {
                left: r.left,
                width: r.width,
                "--ray-duration": r.duration,
                "--ray-delay": r.delay,
                background: `linear-gradient(to bottom, ${skin.glow}, transparent 78%)`,
                filter: "blur(22px)",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Poeira em suspensão subindo devagar */}
      <div className="absolute inset-0">
        {DUST.map((d, i) => (
          <span
            key={i}
            className="table-dust absolute bottom-[-6vh] block rounded-full"
            style={
              {
                left: `${d.left}%`,
                width: d.size,
                height: d.size,
                background: skin.accent,
                boxShadow: `0 0 ${d.size * 4}px ${skin.glow}`,
                "--dust-duration": `${d.duration}s`,
                "--dust-delay": `${d.delay}s`,
                "--dust-drift": `${d.drift}px`,
                "--dust-opacity": d.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Halo pulsante no topo */}
      <div
        className="table-skin-breathe absolute inset-x-0 top-0 h-[46vh]"
        style={{
          background: `radial-gradient(closest-side at 50% 0%, ${skin.glow}, transparent 72%)`,
        }}
      />

      {/* Pétalas da mesa */}
      {skin.particles && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="sakura-petal absolute -top-16 block"
              style={
                {
                  left: `${(i * 8.5 + 4) % 96}%`,
                  "--petal-duration": `${11 + (i % 5) * 2.5}s`,
                  "--petal-delay": `${i * 1.3}s`,
                  "--petal-drift": `${i % 2 ? -70 : 70}px`,
                  "--petal-opacity": 0.35,
                } as React.CSSProperties
              }
            >
              <img
                src={skin.particles}
                alt=""
                loading="lazy"
                className="sakura-petal-inner h-5 w-5 object-contain"
              />
            </span>
          ))}
        </div>
      )}

      {/* Vinheta base (mantém a carta em destaque) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 8%, transparent 14%, hsl(var(--background) / 0.72) 60%, hsl(var(--background) / 0.95) 100%)",
        }}
      />
      {/* Vinheta que respira na cor da mesa */}
      <div
        className="table-vignette-pulse absolute inset-0"
        style={{
          background: `radial-gradient(110% 75% at 50% 50%, transparent 46%, ${skin.glow} 130%)`,
        }}
      />
    </div>
  );
}

/** Flash de tela colorido pela mesa, disparado no acerto ou no erro. */
export function TableSkinFlash({
  skin,
  tone,
}: {
  skin: TableSkin;
  tone: "hit" | "miss";
}) {
  const color = tone === "hit" ? skin.hit : skin.miss;
  return (
    <div
      aria-hidden
      className="table-skin-flash pointer-events-none fixed inset-0 z-20"
      style={{
        background: `radial-gradient(120% 90% at 50% 50%, transparent 40%, ${color}38 100%)`,
      }}
    />
  );
}
