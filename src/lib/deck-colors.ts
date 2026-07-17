// Palette of vibrant iOS-style colors for decks.
// Each entry provides a "from" and "to" for a gradient, plus a solid tint.

export type DeckColor = {
  id: string;
  label: string;
  from: string;
  to: string;
  tint: string; // used for subtle backgrounds/borders
};

export const DECK_COLORS: DeckColor[] = [
  { id: "violet",   label: "Violeta",   from: "#A78BFA", to: "#7C3AED", tint: "#7C3AED" },
  { id: "blue",     label: "Azul",      from: "#60A5FA", to: "#2563EB", tint: "#2563EB" },
  { id: "cyan",     label: "Ciano",     from: "#67E8F9", to: "#0891B2", tint: "#0891B2" },
  { id: "teal",     label: "Verde-água",from: "#5EEAD4", to: "#0D9488", tint: "#0D9488" },
  { id: "green",    label: "Verde",     from: "#86EFAC", to: "#16A34A", tint: "#16A34A" },
  { id: "lime",     label: "Lima",      from: "#D9F99D", to: "#65A30D", tint: "#65A30D" },
  { id: "yellow",   label: "Amarelo",   from: "#FDE68A", to: "#D97706", tint: "#D97706" },
  { id: "orange",   label: "Laranja",   from: "#FDBA74", to: "#EA580C", tint: "#EA580C" },
  { id: "red",      label: "Vermelho",  from: "#FCA5A5", to: "#DC2626", tint: "#DC2626" },
  { id: "pink",     label: "Rosa",      from: "#F9A8D4", to: "#DB2777", tint: "#DB2777" },
  { id: "fuchsia",  label: "Fúcsia",    from: "#F0ABFC", to: "#C026D3", tint: "#C026D3" },
  { id: "graphite", label: "Grafite",   from: "#94A3B8", to: "#334155", tint: "#475569" },
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
