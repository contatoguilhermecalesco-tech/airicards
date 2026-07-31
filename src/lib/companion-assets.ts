// Companion (pet) cosmetics — small character rendered next to the profile avatar.
// Each key maps to a transparent PNG asset and a soft glow color. Companions with
// a `frames` array animate through multiple poses (idle → bow → sword-draw).
import kitsuneUrl from "@/assets/shop/florescer/companion.png";
import igrisIdleUrl from "@/assets/shop/monarca/companion.png";
import igrisRise1Url from "@/assets/shop/monarca/companion-rise1.png";
import igrisRise2Url from "@/assets/shop/monarca/companion-rise2.png";
import igrisStandUrl from "@/assets/shop/monarca/companion-stand.png";
import igrisDrawUrl from "@/assets/shop/monarca/companion-draw.png";
import corvoUrl from "@/assets/shop/eclipse/companion.png";
import nevoaIdleUrl from "@/assets/shop/espirito/companion-idle.png";
import nevoaWakeUrl from "@/assets/shop/espirito/companion-wake.png";
import nevoaOrbitUrl from "@/assets/shop/espirito/companion-orbit.png";
import nevoaStrikeUrl from "@/assets/shop/espirito/companion-strike.png";


export type CompanionProfile = {
  key: string;
  name: string;
  src: string;
  glow: string; // rgba/hex used for the soft aura behind the companion
  tagline: string;
  frames?: string[]; // optional multi-pose sequence — src should equal frames[0]
  flash?: boolean;   // enables the violet slash-flash burst on the final frame
};

const COMPANIONS: Record<string, CompanionProfile> = {
  kitsune_florescer: {
    key: "kitsune_florescer",
    name: "Raposa Guardiã",
    src: kitsuneUrl,
    glow: "#c084fc",
    tagline: "Espírito da cerejeira eterna.",
  },
  igris_cavaleiro: {
    key: "igris_cavaleiro",
    name: "Igris, o Cavaleiro-Sombra",
    src: igrisIdleUrl,
    glow: "#a855f7",
    tagline: "Primeiro cavaleiro do exército das sombras.",
    frames: [igrisIdleUrl, igrisRise1Url, igrisRise2Url, igrisStandUrl, igrisDrawUrl],
    flash: true,
  },
  corvo_carmesim: {
    key: "corvo_carmesim",
    name: "Corvo do Crepúsculo",
    src: corvoUrl,
    glow: "#f43f5e",
    tagline: "Arauto do eclipse, guardião das rosas.",
  },
  cordeiro_espiritual: {
    key: "cordeiro_espiritual",
    name: "Cordeiro Espiritual",
    src: cordeiroUrl,
    glow: "#60a5fa",
    tagline: "Espírito do santuário, guia das almas na névoa.",
  },

};

export function companionFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): CompanionProfile | null {
  const raw = equipped?.companion;
  if (!raw) return null;
  // Wallet stores keys as "companion:<key>" — strip the slot prefix if present.
  const key = raw.includes(":") ? raw.split(":").pop()! : raw;
  return COMPANIONS[key] ?? COMPANIONS[raw] ?? null;
}

export function getCompanion(key: string): CompanionProfile | null {
  return COMPANIONS[key] ?? null;
}
