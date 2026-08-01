import florescerCrown from "@/assets/shop/florescer/crown.png";
import monarcaCrown from "@/assets/shop/monarca/crown.png";
import eclipseCrown from "@/assets/shop/eclipse/crown.png";
import florescerFrame from "@/assets/shop/florescer/frame.png";
import monarcaFrame from "@/assets/shop/monarca/frame.png";
import eclipseFrame from "@/assets/shop/eclipse/frame.png";
import espiritoCrown from "@/assets/shop/espirito/crown.png";
import espiritoFrame from "@/assets/shop/espirito/frame.png";
import princesaCrown from "@/assets/shop/princesa/crown.png";
import princesaFrame from "@/assets/shop/princesa/frame.png";
import piscinaCrown from "@/assets/shop/piscina/crown.png";
import piscinaRing from "@/assets/shop/piscina/ring.png";



/**
 * Coroas: arte apoiada no topo do avatar + círculo ornamentado em volta do
 * perfil (a moldura completa do bundle).
 */
export type CrownArt = {
  art: string;
  /** halo suave (rgba) usado atrás da coroa/anel */
  glow: string;
  /** cor sólida do bundle — usada no anel/blur dentro do perfil */
  accent: string;
  ring?: string;
  ringScale?: number;
};

export const CROWN_ART_BY_KEY: Record<string, CrownArt> = {
  "nameplate:coroa_guardia": {
    accent: "#c4a0ff",
    art: florescerCrown,
    glow: "rgba(196, 160, 255, 0.22)",
    ring: florescerFrame,
  },
  "nameplate:coroa_soberano": {
    accent: "#8b5cf6",
    art: monarcaCrown,
    glow: "rgba(139, 92, 246, 0.22)",
    ring: monarcaFrame,
  },
  "nameplate:coroa_crepusculo": {
    accent: "#e0435f",
    art: eclipseCrown,
    glow: "rgba(224, 67, 95, 0.22)",
    ring: eclipseFrame,
  },
  "nameplate:coroa_nevoa": {
    accent: "#8fc7f5",
    art: espiritoCrown,
    glow: "rgba(143, 199, 245, 0.22)",
    ring: espiritoFrame,
  },
  "nameplate:coroa_espinho_prata": {
    accent: "#93c5fd",
    art: princesaCrown,
    glow: "rgba(147, 197, 253, 0.24)",
    ring: princesaFrame,
  },
  "nameplate:coroa_piscina": {
    accent: "#22d3ee",
    art: piscinaCrown,
    glow: "rgba(34, 211, 238, 0.24)",
    ring: piscinaRing,
    // O anel da piscina tem o vão interno mais largo que os outros bundles,
    // então usa uma escala menor para abraçar o avatar da mesma forma.
    ringScale: 1.6,
  },
};


export function getCrownArt(walletKey: string | undefined | null) {
  if (!walletKey) return undefined;
  return CROWN_ART_BY_KEY[walletKey];
}

/**
 * Cor sólida do bundle da coroa equipada. Universal: qualquer lugar que
 * desenha o anel/blur em volta do avatar deve preferir esta cor, para que o
 * brilho dentro do perfil combine sempre com a coroa.
 */
export function getCrownAccent(walletKey: string | undefined | null): string | undefined {
  return getCrownArt(walletKey)?.accent;
}

/**
 * Círculo ornamentado em volta do avatar (moldura completa do bundle).
 */
export function AvatarRing({
  art,
  glow,
  size = 112,
  scale = 1.78,
}: {
  art: string;
  glow: string;
  size?: number;
  scale?: number;
}) {
  const width = size * scale;
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
  crown: CrownArt;
  size?: number;
}) {
  const width = size * 0.98;
  // Molduras circulares já trazem o brasão no topo — nesse caso o círculo
  // sozinho é o visual correto (estilo League of Legends).
  if (crown.ring) {
    return (
      <AvatarRing
        art={crown.ring}
        glow={crown.glow}
        size={size}
        scale={crown.ringScale ?? 1.78}
      />
    );
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
