// Mapeia a aura equipada (slot "decoration") para uma cor de anel usada
// nos avatares fora da loja (navbar, dropdown, etc.).
export const AURA_RING: Record<string, string> = {
  violet: "#a78bfa",
  ember: "#fb923c",
  arctic: "#7dd3fc",
  sakura: "#f9a8d4",
  emerald: "#6ee7b7",
  prism: "#c4b5fd",
};

export function auraRingFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): string | null {
  const key = equipped?.decoration;
  if (!key) return null;
  const id = key.split(":")[1]?.toLowerCase() ?? "";
  return AURA_RING[id] ?? "#a78bfa";
}
