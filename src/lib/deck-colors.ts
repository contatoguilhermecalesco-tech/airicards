// Palette of vibrant iOS-style colors for decks.
// Each entry provides a "from" and "to" for a gradient, plus a solid tint.

export type DeckColor = {
  id: string;
  label: string;
  from: string;
  to: string;
  tint: string; // used for subtle backgrounds/borders
};

// Tuned for consistent luminance and saturation — sophisticated, not neon.
// "from" is the lighter stop, "to" the deeper stop; tint is used for borders/badges.
export const DECK_COLORS: DeckColor[] = [
  { id: "violet",   label: "Violeta",    from: "#8B7BD8", to: "#5B4BB8", tint: "#6E5DC7" },
  { id: "blue",     label: "Azul",       from: "#6B93D6", to: "#3A63A8", tint: "#4E7ABF" },
  { id: "cyan",     label: "Ciano",      from: "#6BB6C7", to: "#3A7F92", tint: "#4E96AC" },
  { id: "teal",     label: "Verde-água", from: "#6BB8A6", to: "#3A8878", tint: "#4E9E8E" },
  { id: "green",    label: "Verde",      from: "#7FB682", to: "#4A8B4E", tint: "#619E64" },
  { id: "lime",     label: "Lima",       from: "#A8BE6B", to: "#758A3A", tint: "#8FA24E" },
  { id: "yellow",   label: "Âmbar",      from: "#D4B26B", to: "#A17E3A", tint: "#B8974E" },
  { id: "orange",   label: "Laranja",    from: "#D69770", to: "#A56542", tint: "#BE7C56" },
  { id: "red",      label: "Vermelho",   from: "#D67878", to: "#A54A4A", tint: "#BE6161" },
  { id: "pink",     label: "Rosa",       from: "#D67AA8", to: "#A54A7A", tint: "#BE6191" },
  { id: "fuchsia",  label: "Fúcsia",     from: "#B87AD6", to: "#8A4AA5", tint: "#A161BE" },
  { id: "graphite", label: "Grafite",    from: "#8791A0", to: "#4A5568", tint: "#697384" },
];

export const DEFAULT_DECK_COLOR: DeckColor = DECK_COLORS[0];

export function getDeckColor(id?: string | null): DeckColor {
  if (!id) return DEFAULT_DECK_COLOR;
  return DECK_COLORS.find((c) => c.id === id) ?? DEFAULT_DECK_COLOR;
}

export function deckGradient(id?: string | null): string {
  const c = getDeckColor(id);
  return `linear-gradient(135deg, ${c.from}, ${c.to})`;
}
