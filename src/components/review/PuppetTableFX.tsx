// VFX exclusivo da Mesa da Corte das Marionetes.
// Assinatura própria do bundle (nenhuma outra mesa tem isso):
//  • Ambiente: cortinas de veludo, refletor de palco, ribalta e máscaras
//    penduradas por fios que balançam.
//  • Acerto: os fios te erguem — a corte aplaude, o refletor abre, máscaras
//    sobem e pétalas brancas explodem no palco.
//  • Erro: os fios se rompem, a máscara racha, as cortinas fecham por um
//    instante e o palco sangra vermelho.
import type { TableSkin } from "@/lib/table-skins";

const MASKS = [
  { left: "12%", drop: 92, delay: "0s", size: 26 },
  { left: "28%", drop: 62, delay: "-1.6s", size: 18 },
  { left: "72%", drop: 74, delay: "-0.8s", size: 21 },
  { left: "88%", drop: 54, delay: "-2.4s", size: 16 },
];

/** Camadas de palco que ficam sempre visíveis durante a revisão. */
export function PuppetAmbient({ skin }: { skin: TableSkin }) {
  return (
    <>
      {/* Cortinas de veludo nas laterais */}
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          className="puppet-curtain absolute top-0 h-full w-[22vw] max-w-[280px]"
          style={{
            [side]: 0,
            background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${skin.miss}dd 0%, ${skin.miss}88 42%, transparent 100%)`,
            maskImage: `repeating-linear-gradient(${side === "left" ? "90deg" : "270deg"}, rgba(0,0,0,1) 0 14px, rgba(0,0,0,0.62) 14px 30px)`,
            WebkitMaskImage: `repeating-linear-gradient(${side === "left" ? "90deg" : "270deg"}, rgba(0,0,0,1) 0 14px, rgba(0,0,0,0.62) 14px 30px)`,
            opacity: 0.5,
          } as React.CSSProperties}
        />
      ))}

      {/* Refletor de palco vindo da coxia */}
      <div
        className="puppet-spot absolute left-1/2 top-[-18vh] h-[90vh] w-[62vw] -translate-x-1/2"
        style={{
          background: `conic-gradient(from 180deg at 50% 0%, transparent 0deg, ${skin.glow} 12deg, transparent 26deg)`,
          filter: "blur(30px)",
        }}
      />

      {/* Máscaras de porcelana penduradas por fios */}
      {MASKS.map((m, i) => (
        <span
          key={i}
          className="puppet-hang absolute top-0 flex flex-col items-center"
          style={{ left: m.left, ["--hang-delay" as string]: m.delay }}
        >
          <span
            className="block w-px"
            style={{
              height: m.drop,
              background: `linear-gradient(to bottom, ${skin.hit}77, ${skin.accent}44)`,
            }}
          />
          <span
            className="block rounded-b-full rounded-t-[40%] border"
            style={{
              width: m.size,
              height: m.size * 1.18,
              borderColor: `${skin.hit}66`,
              background: `linear-gradient(180deg, #f6eef0ee, ${skin.accent}55)`,
              boxShadow: `0 0 14px -2px ${skin.glow}`,
              opacity: 0.42,
            }}
          />
        </span>
      ))}

      {/* Ribalta (footlights) na base do palco */}
      <div
        className="puppet-footlights absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          background: `linear-gradient(to top, ${skin.accent}3a, transparent 78%)`,
        }}
      />
    </>
  );
}

const SNAP_THREADS = [18, 32, 46, 58, 70, 84];
const APPLAUSE = Array.from({ length: 22 }).map((_, i) => ({
  left: (i * 4.6 + 3) % 97,
  delay: (i % 7) * 0.08,
  size: 4 + ((i * 5) % 6),
  drift: (i % 2 ? 1 : -1) * (20 + ((i * 13) % 60)),
  dur: 1.1 + ((i * 3) % 5) * 0.16,
}));

/** Impacto de acerto/erro no palco. */
export function PuppetImpact({
  skin,
  tone,
  seed,
  contained = false,
}: {
  skin: TableSkin;
  tone: "hit" | "miss";
  seed: number;
  /** Prévia da loja: fica dentro da caixa em vez de cobrir a tela. */
  contained?: boolean;
}) {
  const color = tone === "hit" ? skin.hit : skin.miss;

  return (
    <div
      key={seed}
      aria-hidden
      className={`pointer-events-none inset-0 overflow-hidden ${contained ? "absolute z-20" : "fixed z-30"}`}
    >
      {/* Clarão do palco */}
      <div
        className="table-impact-flash absolute inset-0"
        style={{
          background:
            tone === "hit"
              ? `radial-gradient(70% 55% at 50% 40%, ${color}42, transparent 66%)`
              : `radial-gradient(130% 95% at 50% 50%, transparent 28%, ${skin.miss}77 100%)`,
        }}
      />

      {tone === "hit" ? (
        <>
          {/* Refletor abrindo em leque */}
          <div
            className="puppet-spot-snap absolute left-1/2 top-[-22vh] h-[110vh] w-[70vw] -translate-x-1/2"
            style={{
              background: `conic-gradient(from 180deg at 50% 0%, transparent 0deg, ${color}55 14deg, transparent 30deg)`,
              filter: "blur(18px)",
            }}
          />

          {/* Fios te erguendo: sobem puxando luz */}
          {SNAP_THREADS.map((left, i) => (
            <span
              key={left}
              className="puppet-thread-yank absolute top-0 w-px"
              style={{
                left: `${left}%`,
                height: "46vh",
                background: `linear-gradient(to bottom, transparent, ${color})`,
                animationDelay: `${i * 0.045}s`,
                boxShadow: `0 0 10px ${color}`,
              }}
            />
          ))}

          {/* Máscara da corte ascendendo */}
          <span
            className="puppet-mask-rise absolute left-1/2 top-[42vh] block h-16 w-14 -translate-x-1/2 rounded-b-full rounded-t-[42%] border"
            style={{
              borderColor: `${color}aa`,
              background: `linear-gradient(180deg, #fdf5f7, ${skin.accent}cc)`,
              boxShadow: `0 0 40px -6px ${color}`,
            }}
          />

          {/* Aplauso de pétalas brancas */}
          {APPLAUSE.map((p, i) => (
            <span
              key={i}
              className="puppet-applause absolute bottom-[8vh] block rounded-full"
              style={
                {
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  background: i % 3 === 0 ? skin.accent : "#f7ecef",
                  boxShadow: `0 0 8px ${skin.glow}`,
                  "--ap-delay": `${p.delay}s`,
                  "--ap-drift": `${p.drift}px`,
                  "--ap-dur": `${p.dur}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </>
      ) : (
        <>
          {/* Fios se rompendo e caindo */}
          {SNAP_THREADS.map((left, i) => (
            <span
              key={left}
              className="puppet-thread-snap absolute top-0 w-px origin-top"
              style={{
                left: `${left}%`,
                height: "38vh",
                background: `linear-gradient(to bottom, ${skin.hit}cc, transparent)`,
                animationDelay: `${i * 0.06}s`,
              }}
            />
          ))}

          {/* Máscara rachando no centro */}
          <div className="puppet-mask-break absolute left-1/2 top-1/2 h-24 w-20 -translate-x-1/2 -translate-y-1/2">
            <div
              className="absolute inset-0 rounded-b-full rounded-t-[42%] border"
              style={{
                borderColor: `${skin.hit}88`,
                background: `linear-gradient(180deg, #f4e9ec, ${skin.miss}cc)`,
                boxShadow: `0 0 34px -8px ${skin.miss}`,
              }}
            />
            <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full">
              {[
                "M50 4 L44 40 L54 62 L46 116",
                "M50 30 L22 58 M50 46 L80 66",
                "M50 70 L30 104 M50 76 L72 108",
              ].map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={skin.miss}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              ))}
            </svg>
          </div>

          {/* Cortinas fechando por um instante */}
          <div
            className="puppet-curtain-close-l absolute inset-y-0 left-0 w-1/2"
            style={{
              background: `linear-gradient(90deg, ${skin.miss}f2 0%, ${skin.miss}b0 70%, ${skin.miss}55 100%)`,
              maskImage: "repeating-linear-gradient(90deg, rgba(0,0,0,1) 0 18px, rgba(0,0,0,0.6) 18px 38px)",
              WebkitMaskImage:
                "repeating-linear-gradient(90deg, rgba(0,0,0,1) 0 18px, rgba(0,0,0,0.6) 18px 38px)",
            }}
          />
          <div
            className="puppet-curtain-close-r absolute inset-y-0 right-0 w-1/2"
            style={{
              background: `linear-gradient(270deg, ${skin.miss}f2 0%, ${skin.miss}b0 70%, ${skin.miss}55 100%)`,
              maskImage: "repeating-linear-gradient(270deg, rgba(0,0,0,1) 0 18px, rgba(0,0,0,0.6) 18px 38px)",
              WebkitMaskImage:
                "repeating-linear-gradient(270deg, rgba(0,0,0,1) 0 18px, rgba(0,0,0,0.6) 18px 38px)",
            }}
          />

          {/* Sangramento vermelho nas bordas */}
          <div
            className="puppet-bleed absolute inset-0"
            style={{
              background: `radial-gradient(105% 75% at 50% 50%, transparent 46%, ${skin.miss}66 92%, ${skin.miss}aa 100%)`,
            }}
          />
        </>
      )}
    </div>
  );
}
