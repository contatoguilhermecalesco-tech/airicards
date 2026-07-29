import florescerCrown from "@/assets/shop/florescer/crown.png";
import monarcaCrown from "@/assets/shop/monarca/crown.png";
import eclipseCrown from "@/assets/shop/eclipse/crown.png";

/**
 * Coroas de verdade: arte recortada que fica APOIADA no topo do avatar,
 * em vez da moldura circular que envolvia o rosto inteiro.
 */
export const CROWN_ART_BY_KEY: Record<string, { art: string; glow: string }> = {
  "nameplate:coroa_guardia": { art: florescerCrown, glow: "rgba(196, 160, 255, 0.55)" },
  "nameplate:coroa_soberano": { art: monarcaCrown, glow: "rgba(139, 92, 246, 0.55)" },
  "nameplate:coroa_crepusculo": { art: eclipseCrown, glow: "rgba(224, 67, 95, 0.55)" },
};

export function getCrownArt(walletKey: string | undefined | null) {
  if (!walletKey) return undefined;
  return CROWN_ART_BY_KEY[walletKey];
}

/**
 * Coroa apoiada no topo do avatar. Deve ser renderizada dentro do wrapper
 * relativo do avatar (posicionamento absoluto).
 */
export function AvatarCrown({
  crown,
  size = 112,
}: {
  crown: { art: string; glow: string };
  size?: number;
}) {
  const width = size * 0.98;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
      style={{ width, top: -size * 0.42 }}
    >
      <div
        className="absolute inset-x-4 bottom-1 h-6 rounded-full blur-xl"
        style={{ background: crown.glow }}
      />
      <img
        src={crown.art}
        alt=""
        loading="lazy"
        className="crown-float relative block w-full object-contain"
        style={{ filter: `drop-shadow(0 6px 14px ${crown.glow})` }}
      />
    </div>
  );
}

/**
 * Para molduras circulares (nameplate legacy): mostra apenas a METADE DE CIMA
 * da arte, apoiada no topo do avatar — sem a parte de baixo envolvendo o rosto.
 */
export function NameplateTopCrown({
  art,
  size = 112,
}: {
  art: string;
  size?: number;
}) {
  const width = size * 1.68;
  const artHeight = width;
  // Recorta a arte mostrando só a faixa superior (coroa).
  const visible = artHeight * 0.4;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 overflow-hidden"
      style={{ width, height: visible, top: -size * 0.4 }}
    >
      <img
        src={art}
        alt=""
        loading="lazy"
        className="crown-float absolute left-0 top-0 block max-w-none object-contain"
        style={{
          width,
          height: artHeight,
          filter: "drop-shadow(0 6px 18px rgba(192,132,252,0.45))",
        }}
      />
    </div>
  );
}
