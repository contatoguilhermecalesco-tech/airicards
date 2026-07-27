// Companion (pet) cosmetics — small character rendered next to the profile avatar.
// Each key maps to a transparent PNG asset and a soft glow color. Companions with
// a `frames` array animate through multiple poses (idle → bow → sword-draw).
import kitsuneUrl from "@/assets/shop/florescer/companion.png";
import igrisIdleUrl from "@/assets/shop/monarca/companion.png";
import igrisBowUrl from "@/assets/shop/monarca/companion-bow.png";
import igrisDrawUrl from "@/assets/shop/monarca/companion-draw.png";

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
    frames: [igrisIdleUrl, igrisBowUrl, igrisDrawUrl],
    flash: true,
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
