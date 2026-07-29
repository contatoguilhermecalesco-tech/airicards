import type { TableSkin } from "@/lib/table-skins";
import { isDefaultTableSkin } from "@/lib/table-skins";

/** Brasas/pétalas pré-sorteadas (estáveis entre renders). */
const EMBERS = [
  { left: 8, size: 9, dur: 12, delay: 0, drift: 30, opacity: 0.7 },
  { left: 19, size: 6, dur: 15, delay: 2.5, drift: -22, opacity: 0.5 },
  { left: 31, size: 11, dur: 10.5, delay: 5, drift: 40, opacity: 0.75 },
  { left: 44, size: 5, dur: 17, delay: 1.2, drift: -34, opacity: 0.45 },
  { left: 57, size: 8, dur: 13, delay: 6.5, drift: 26, opacity: 0.65 },
  { left: 68, size: 12, dur: 11, delay: 3.4, drift: -30, opacity: 0.7 },
  { left: 79, size: 6, dur: 16, delay: 8, drift: 34, opacity: 0.5 },
  { left: 91, size: 9, dur: 12.5, delay: 4.2, drift: -18, opacity: 0.6 },
];


/**
 * Camadas visuais da carta durante a revisão.
 * Em vez de esticar artes rasterizadas (que deformam), a moldura é desenhada
 * em CSS/SVG: filete duplo, cantoneiras em filigrana e um halo de eclipse.
 */
export function TableSkinCardLayer({ skin }: { skin: TableSkin }) {
  if (isDefaultTableSkin(skin)) return null;
  const a = skin.accent;

  return (
    <>
      {/* Base interna: obsidiana profunda com clareira central para o texto */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background: `radial-gradient(110% 90% at 50% 42%, hsl(var(--card) / 0.55) 0%, hsl(var(--card) / 0.94) 58%, #0a0407 100%)`,
        }}
      />

      {/* Halo do eclipse atrás do conteúdo */}
      <div
        aria-hidden
        className="table-skin-breathe pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${a}26, transparent 72%)` }}
      />

      {/* Pétalas/brasas caindo dentro da carta — nasce no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]"
      >
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="table-ember absolute -top-4"
            style={
              {
                left: `${e.left}%`,
                width: e.size,
                height: e.size * 0.62,
                borderRadius: "60% 40% 62% 38% / 58% 62% 38% 42%",
                background: `linear-gradient(140deg, ${a}, ${a}33)`,
                boxShadow: `0 0 ${e.size * 1.6}px -${e.size * 0.4}px ${a}`,
                filter: e.size < 7 ? "blur(0.4px)" : undefined,
                "--ember-duration": `${e.dur}s`,
                "--ember-delay": `${e.delay}s`,
                "--ember-drift": `${e.drift}px`,
                "--ember-opacity": `${e.opacity}`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Névoa viva no topo */}
        <div
          className="table-skin-breathe absolute inset-x-0 -top-6 h-24"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${a}2e, transparent 75%)`,
          }}
        />
        {/* Faixa de luz que atravessa o topo */}
        <div
          className="table-sheen absolute -top-2 left-0 h-28 w-1/3 -skew-x-12"
          style={{
            background: `linear-gradient(90deg, transparent, ${a}1f, transparent)`,
          }}
        />
      </div>


      {/* Filete duplo desenhado (nunca estica) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ boxShadow: `inset 0 0 0 1px ${a}59, inset 0 0 60px -28px ${a}` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[9px] rounded-[20px]"
        style={{
          boxShadow: `inset 0 0 0 1px ${a}2e`,
          background: `linear-gradient(160deg, ${a}0f, transparent 38%, transparent 62%, ${a}0f)`,
        }}
      />

      {/* Filigranas nas quinas */}
      {(
        [
          ["tl", "left-[14px] top-[14px]", ""],
          ["tr", "right-[14px] top-[14px]", "scale-x-[-1]"],
          ["bl", "bottom-[14px] left-[14px]", "scale-y-[-1]"],
          ["br", "bottom-[14px] right-[14px]", "scale-[-1]"],
        ] as const
      ).map(([k, pos, flip]) => (
        <svg
          key={k}
          aria-hidden
          viewBox="0 0 48 48"
          className={`pointer-events-none absolute h-9 w-9 ${pos} ${flip}`}
          style={{ color: a, filter: `drop-shadow(0 0 8px ${a}66)` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        >
          <path d="M2 18V6a4 4 0 0 1 4-4h12" opacity="0.9" />
          <path d="M2 30V10a8 8 0 0 1 8-8h20" opacity="0.35" />
          <path d="M8 8l8 8" opacity="0.5" />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      ))}

      {/* Ornamento superior/inferior: losango do eclipse */}
      {(["top-[6px]", "bottom-[6px]"] as const).map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`pointer-events-none absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 ${pos}`}
          style={{
            background: `linear-gradient(135deg, ${a}, transparent)`,
            boxShadow: `0 0 12px -2px ${a}`,
          }}
        />
      ))}

      {/* Brilho de vidro no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-[28px]"
        style={{
          background:
            "linear-gradient(to bottom, rgb(255 255 255 / 0.06), transparent)",
        }}
      />
    </>
  );
}

/** Estilo de borda/sombra da carta conforme a mesa equipada. */
export function tableSkinCardStyle(skin: TableSkin): React.CSSProperties {
  if (isDefaultTableSkin(skin)) return {};
  return {
    borderColor: `${skin.accent}52`,
    boxShadow: `0 40px 90px -40px ${skin.glow}, 0 0 0 1px ${skin.accent}1f, inset 0 1px 0 rgb(255 255 255 / 0.07)`,
  };
}
