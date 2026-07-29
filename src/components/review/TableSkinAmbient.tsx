import type { TableSkin } from "@/lib/table-skins";
import { isDefaultTableSkin } from "@/lib/table-skins";

/**
 * Camada de ambiente da Mesa de Revisão: arte de fundo desfocada + vinheta,
 * sempre discreta para não competir com o texto da carta.
 */
export function TableSkinAmbient({ skin }: { skin: TableSkin }) {
  if (isDefaultTableSkin(skin) || !skin.ambient) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <img
        src={skin.ambient}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-[0.26]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 8%, transparent 12%, hsl(var(--background) / 0.8) 62%, hsl(var(--background) / 0.96) 100%)",
        }}
      />
      <div
        className="table-skin-breathe absolute inset-x-0 top-0 h-[46vh]"
        style={{
          background: `radial-gradient(closest-side at 50% 0%, ${skin.glow}, transparent 72%)`,
        }}
      />
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
