import type { TableSkin } from "@/lib/table-skins";

/**
 * VFX cinematográfico de impacto da Mesa de Revisão.
 * - Acerto: onda de choque + explosão de estilhaços + brilho ascendente.
 * - Erro: rachaduras de gelo na tela + congelamento das bordas + queda de cacos.
 * Tudo usa as cores da mesa equipada, então cada bundle ganha sua própria assinatura.
 */

const SHARDS = Array.from({ length: 18 }).map((_, i) => {
  const angle = (i / 18) * 360 + (i % 3) * 7;
  return {
    angle,
    distance: 120 + ((i * 37) % 160),
    size: 6 + ((i * 13) % 14),
    delay: (i % 5) * 0.035,
    spin: (i % 2 ? 1 : -1) * (120 + ((i * 29) % 220)),
  };
});

const CRACKS = [
  "M50 50 L14 6 M50 50 L30 2 M50 50 L2 26",
  "M50 50 L86 6 M50 50 L70 2 M50 50 L98 28",
  "M50 50 L10 92 M50 50 L34 99 M50 50 L2 70",
  "M50 50 L90 94 M50 50 L66 99 M50 50 L99 72",
];

export function TableSkinImpact({
  skin,
  tone,
  seed,
}: {
  skin: TableSkin;
  tone: "hit" | "miss";
  seed: number;
}) {
  const color = tone === "hit" ? skin.hit : skin.miss;
  const accent = tone === "hit" ? skin.accent : skin.miss;

  return (
    <div
      key={seed}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {/* Clarão radial */}
      <div
        className="table-impact-flash absolute inset-0"
        style={{
          background:
            tone === "hit"
              ? `radial-gradient(80% 60% at 50% 45%, ${color}3d, transparent 62%)`
              : `radial-gradient(120% 90% at 50% 50%, transparent 34%, ${color}66 100%)`,
        }}
      />

      {/* Onda de choque */}
      <div
        className="table-impact-ring absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 220,
          height: 220,
          marginLeft: -110,
          marginTop: -110,
          border: `2px solid ${color}`,
          boxShadow: `0 0 60px -6px ${color}, inset 0 0 40px -10px ${color}`,
        }}
      />
      <div
        className="table-impact-ring table-impact-ring-late absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 220,
          height: 220,
          marginLeft: -110,
          marginTop: -110,
          border: `1px solid ${accent}99`,
        }}
      />

      {/* Estilhaços */}
      <div className="absolute left-1/2 top-1/2">
        {SHARDS.map((s, i) => (
          <span
            key={i}
            className="table-impact-shard absolute block"
            style={
              {
                width: s.size,
                height: s.size * 2.1,
                marginLeft: -s.size / 2,
                background: `linear-gradient(180deg, ${color}, ${accent}00)`,
                clipPath: "polygon(50% 0%, 100% 62%, 50% 100%, 0% 62%)",
                filter: `drop-shadow(0 0 6px ${color})`,
                "--shard-angle": `${s.angle}deg`,
                "--shard-distance": `${tone === "hit" ? s.distance : s.distance * 0.6}px`,
                "--shard-delay": `${s.delay}s`,
                "--shard-spin": `${s.spin}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Rachaduras (erro) */}
      {tone === "miss" && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="table-impact-cracks absolute inset-0 h-full w-full"
        >
          {CRACKS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="0.28"
              strokeLinecap="round"
              opacity="0.85"
              style={{ filter: `drop-shadow(0 0 2px ${color})` }}
            />
          ))}
        </svg>
      )}

      {/* Geada nas bordas (erro) */}
      {tone === "miss" && (
        <div
          className="table-impact-frost absolute inset-0"
          style={{
            background: `radial-gradient(110% 80% at 50% 50%, transparent 52%, ${skin.accent}2e 88%, ${skin.accent}55 100%)`,
            backdropFilter: "blur(1.5px)",
          }}
        />
      )}

      {/* Coluna de luz ascendente (acerto) */}
      {tone === "hit" && (
        <div
          className="table-impact-beam absolute bottom-0 left-1/2 h-[70vh] w-[46vw] -translate-x-1/2"
          style={{
            background: `linear-gradient(to top, ${color}33, transparent 76%)`,
            filter: "blur(26px)",
          }}
        />
      )}
    </div>
  );
}
