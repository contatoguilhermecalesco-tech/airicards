// Companion (pet) cosmetics — small character rendered next to the profile avatar.
// Each key maps to a transparent PNG asset and a soft glow color.
import kitsuneUrl from "@/assets/shop/florescer/companion.png";

export type CompanionProfile = {
  key: string;
  name: string;
  src: string;
  glow: string; // rgba/hex used for the soft aura behind the companion
  tagline: string;
};

const COMPANIONS: Record<string, CompanionProfile> = {
  kitsune_florescer: {
    key: "kitsune_florescer",
    name: "Raposa Guardiã",
    src: kitsuneUrl,
    glow: "#c084fc",
    tagline: "Espírito da cerejeira eterna.",
  },
};

export function companionFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): CompanionProfile | null {
  const key = equipped?.companion;
  if (!key) return null;
  return COMPANIONS[key] ?? null;
}

export function getCompanion(key: string): CompanionProfile | null {
  return COMPANIONS[key] ?? null;
}
