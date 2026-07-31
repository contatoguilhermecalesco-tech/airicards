// Aura profiles equipped in the "decoration" slot. Each aura has a ring color,
// optional secondary color for dual-tone rings, and a "kind" that AuraAvatar
// uses to dispatch to a distinct animated look.
//
// kind:
//  - "spin"      : classic conic ring rotating (default)
//  - "dual"      : two counter-rotating rings (secondary color arcs)
//  - "hueshift"  : rainbow/hologram — spin + hue rotation
//  - "flicker"   : phoenix-like pulse with warm flames
//  - "pulseRay"  : solar ray burst radial pulse
//  - "sparkle"   : orbiting sparkle particles + soft ring
//  - "glitch"    : neon RGB shift, chromatic aberration
//  - "crystal"   : slow shimmer, icy crystalline
//  - "cosmic"    : multi-color conic + sparkles

export type AuraKind =
  | "spin"
  | "dual"
  | "hueshift"
  | "flicker"
  | "pulseRay"
  | "sparkle"
  | "glitch"
  | "crystal"
  | "cosmic";

export type AuraProfile = {
  ring: string;
  secondary?: string;
  kind: AuraKind;
  speed?: "slow" | "normal" | "fast";
};

export const AURA_PROFILES: Record<string, AuraProfile> = {
  // classic set (kept for compatibility)
  violet:  { ring: "#a78bfa", kind: "spin" },
  ember:   { ring: "#fb923c", kind: "spin" },
  arctic:  { ring: "#7dd3fc", kind: "spin" },
  sakura:  { ring: "#f9a8d4", kind: "spin" },
  emerald: { ring: "#6ee7b7", kind: "spin" },
  prism:   { ring: "#c4b5fd", secondary: "#fca5f5", kind: "hueshift" },

  // new epic set
  nebula:    { ring: "#c084fc", secondary: "#f472b6", kind: "dual", speed: "slow" },
  phoenix:   { ring: "#f97316", secondary: "#fbbf24", kind: "flicker", speed: "fast" },
  void:      { ring: "#7c3aed", secondary: "#1e1b4b", kind: "dual", speed: "slow" },
  solar:     { ring: "#fbbf24", secondary: "#fde68a", kind: "pulseRay" },
  glacier:   { ring: "#93c5fd", secondary: "#e0f2fe", kind: "crystal", speed: "slow" },
  bloom:     { ring: "#f9a8d4", secondary: "#fbcfe8", kind: "sparkle" },
  hologram:  { ring: "#67e8f9", secondary: "#f0abfc", kind: "hueshift", speed: "fast" },
  neon:      { ring: "#f0abfc", secondary: "#22d3ee", kind: "glitch", speed: "fast" },
  abyss:     { ring: "#14b8a6", secondary: "#0f172a", kind: "dual", speed: "slow" },
  cosmic:    { ring: "#a78bfa", secondary: "#22d3ee", kind: "cosmic" },

  // Névoa Espiritual (bundle) — gelo azul com brasa carmesim
  nevoa_espiritual: { ring: "#8fc7f5", secondary: "#8e1b2b", kind: "crystal", speed: "slow" },
};

export const AURA_RING: Record<string, string> = Object.fromEntries(
  Object.entries(AURA_PROFILES).map(([k, v]) => [k, v.ring]),
);

export function auraKeyFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): string | null {
  const key = equipped?.decoration;
  if (!key) return null;
  return key.split(":")[1]?.toLowerCase() ?? null;
}

export function auraProfileFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): AuraProfile | null {
  const id = auraKeyFromEquipped(equipped);
  if (!id) return null;
  return AURA_PROFILES[id] ?? { ring: "#a78bfa", kind: "spin" };
}

export function auraRingFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): string | null {
  return auraProfileFromEquipped(equipped)?.ring ?? null;
}
