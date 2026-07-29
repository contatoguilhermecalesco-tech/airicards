import type { TableSkin } from "@/lib/table-skins";
import { isDefaultTableSkin } from "@/lib/table-skins";

/**
 * Camadas visuais aplicadas por cima/atrás da carta durante a revisão:
 * verso ornamentado em marca d'água, moldura da mesa e cantoneiras luminosas.
 */
export function TableSkinCardLayer({ skin }: { skin: TableSkin }) {
  if (isDefaultTableSkin(skin)) return null;
  return (
    <>
      {/* Base interna: obsidiana escura, limpa, para o texto respirar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, hsl(var(--card) / 0.55) 0%, hsl(var(--card) / 0.92) 55%, hsl(var(--card) / 0.98) 100%)",
        }}
      />

      {/* Verso ornamentado apenas como textura muito sutil */}
      {skin.crest && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]"
        >
          <img
            src={skin.crest}
            alt=""
            loading="lazy"
            className="absolute left-1/2 top-1/2 h-[130%] w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-[0.07] saturate-[0.6] blur-[1px]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(65% 55% at 50% 50%, hsl(var(--card) / 0.96) 30%, hsl(var(--card) / 0.6) 75%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* Moldura pintada — só nas bordas, centro totalmente limpo */}
      {skin.frame && (
        <img
          aria-hidden
          src={skin.frame}
          alt=""
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full rounded-[28px] object-fill opacity-[0.55]"
          style={{
            maskImage:
              "radial-gradient(78% 72% at 50% 50%, transparent 42%, black 82%)",
            WebkitMaskImage:
              "radial-gradient(78% 72% at 50% 50%, transparent 42%, black 82%)",
          }}
        />
      )}


      {/* Cantoneiras luminosas */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <span
          key={c}
          aria-hidden
          className={[
            "pointer-events-none absolute h-10 w-10 rounded-[10px] opacity-70",
            c === "tl" && "left-3 top-3 border-l border-t",
            c === "tr" && "right-3 top-3 border-r border-t",
            c === "bl" && "bottom-3 left-3 border-b border-l",
            c === "br" && "bottom-3 right-3 border-b border-r",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ borderColor: `${skin.accent}66`, boxShadow: `0 0 18px -8px ${skin.accent}` }}
        />
      ))}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ boxShadow: `inset 0 0 0 1px ${skin.accent}40, inset 0 0 90px -40px ${skin.accent}` }}
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
