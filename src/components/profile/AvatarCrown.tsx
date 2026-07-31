import florescerCrown from "@/assets/shop/florescer/crown.png";
import monarcaCrown from "@/assets/shop/monarca/crown.png";
import eclipseCrown from "@/assets/shop/eclipse/crown.png";
import florescerFrame from "@/assets/shop/florescer/frame.png";
import monarcaFrame from "@/assets/shop/monarca/frame.png";
import eclipseFrame from "@/assets/shop/eclipse/frame.png";
import espiritoCrown from "@/assets/shop/espirito/crown.png";
import espiritoRing from "@/assets/shop/espirito/aura.png";

/**
 * Coroas: arte apoiada no topo do avatar + círculo ornamentado em volta do
 * perfil (a moldura completa do bundle).
 */
export const CROWN_ART_BY_KEY: Record<
  string,
  { art: string; glow: string; ring?: string }
> = {
  "nameplate:coroa_guardia": {
    art: florescerCrown,
    glow: "rgba(196, 160, 255, 0.22)",
    ring: florescerFrame,
  },
  "nameplate:coroa_soberano": {
    art: monarcaCrown,
    glow: "rgba(139, 92, 246, 0.22)",
    ring: monarcaFrame,
  },
  "nameplate:coroa_crepusculo": {
    art: eclipseCrown,
    glow: "rgba(224, 67, 95, 0.22)",
    ring: eclipseFrame,
  },
  "nameplate:coroa_nevoa": {
    art: espiritoCrown,
    glow: "rgba(143, 199, 245, 0.22)",
  },
};

export function getCrownArt(walletKey: string | undefined | null) {
  if (!walletKey) return undefined;
  return CROWN_ART_BY_KEY[walletKey];
}

/**
 * Círculo ornamentado em volta do avatar (moldura completa do bundle).
 */
export function AvatarRing({
  art,
  glow,
  size = 112,
}: {
  art: string;
  glow: string;
  size?: number;
}) {
  const width = size * 1.78;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ width, height: width }}
    >
      <div
        className="absolute inset-[14%] rounded-full blur-lg"
        style={{ background: glow }}
      />
      <img
        src={art}
        alt=""
        loading="lazy"
        className="relative block h-full w-full max-w-none object-contain"
        style={{ filter: `drop-shadow(0 3px 10px ${glow})` }}
      />
    </div>
  );
}

/**
 * Coroa apoiada no topo do avatar + círculo em volta. Deve ser renderizada
 * dentro do wrapper relativo do avatar (posicionamento absoluto).
 */
export function AvatarCrown({
  crown,
  size = 112,
}: {
  crown: { art: string; glow: string; ring?: string };
  size?: number;
}) {
  const width = size * 0.98;
  // Molduras circulares já trazem o brasão no topo — nesse caso o círculo
  // sozinho é o visual correto (estilo League of Legends).
  if (crown.ring) {
    return <AvatarRing art={crown.ring} glow={crown.glow} size={size} />;
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
      style={{ width, top: -size * 0.42 }}
    >
      <div
        className="absolute inset-x-4 bottom-1 h-5 rounded-full blur-lg"
        style={{ background: crown.glow }}
      />
      <img
        src={crown.art}
        alt=""
        loading="lazy"
        className="crown-float relative block w-full object-contain"
        style={{ filter: `drop-shadow(0 4px 10px ${crown.glow})` }}
      />
    </div>
  );
}

/**
 * Moldura circular completa em volta do avatar (estilo League of Legends).
 */
export function NameplateTopCrown({
  art,
  size = 112,
}: {
  art: string;
  size?: number;
}) {
  return (
    <AvatarRing art={art} glow="rgba(192,132,252,0.18)" size={size} />
  );
}
