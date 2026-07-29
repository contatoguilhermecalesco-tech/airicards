import type { TableSkin } from "@/lib/table-skins";
import { isDefaultTableSkin } from "@/lib/table-skins";

/**
 * Camadas visuais aplicadas por cima/atrás da carta durante a revisão:
 * brasão em marca d'água + moldura da mesa equipada.
 */
export function TableSkinCardLayer({ skin }: { skin: TableSkin }) {
  if (isDefaultTableSkin(skin)) return null;
  return (
    <>
      {skin.crest && (
        <img
          aria-hidden
          src={skin.crest}
          alt=""
          loading="lazy"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.07] mix-blend-screen"
        />
      )}
      {skin.frame && (
        <img
          aria-hidden
          src={skin.frame}
          alt=""
          loading="lazy"
          className="cosmetic-veil-float pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22] mix-blend-screen"
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{ boxShadow: `inset 0 0 0 1px ${skin.accent}33, inset 0 0 60px -30px ${skin.accent}` }}
      />
    </>
  );
}

/** Estilo de borda/sombra da carta conforme a mesa equipada. */
export function tableSkinCardStyle(skin: TableSkin): React.CSSProperties {
  if (isDefaultTableSkin(skin)) return {};
  return {
    borderColor: `${skin.accent}3d`,
    boxShadow: `0 30px 70px -34px ${skin.glow}, inset 0 1px 0 rgb(255 255 255 / 0.07)`,
  };
}
