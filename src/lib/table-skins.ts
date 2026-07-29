// Mesas de Revisão — "skins" que tematizam a tela de revisão inteira.
// Slot de cosmético: `table`. A mesa padrão (Vidro Airi) é gratuita e usada
// sempre que nada estiver equipado, então todo mundo vê o sistema funcionando.
import eclipseAmbient from "@/assets/shop/eclipse/table-ambient.jpg";
import eclipseFrame from "@/assets/shop/eclipse/table-frame.png";
import eclipseCrest from "@/assets/shop/eclipse/table-cardback.png";
import eclipsePetals from "@/assets/shop/eclipse/petals-overlay.png";


export type TableSkin = {
  id: string;
  /** Chave completa no formato `table:<id>` (como fica na carteira). */
  key: string;
  name: string;
  tagline: string;
  /** Arte ambiente atrás da mesa (opcional). */
  ambient?: string;
  /** Moldura sobreposta na carta (opcional). */
  frame?: string;
  /** Brasão/verso usado como marca d'água e no resumo da sessão. */
  crest?: string;
  /** Partículas que caem sobre a mesa (opcional). */
  particles?: string;
  /** Cor principal da mesa (CSS color). */
  accent: string;
  /** Brilho difuso usado em halos e sombras. */
  glow: string;
  /** Cor do feedback de acerto. */
  hit: string;
  /** Cor do feedback de erro. */
  miss: string;
};

export const DEFAULT_TABLE_SKIN: TableSkin = {
  id: "vidro_airi",
  key: "table:vidro_airi",
  name: "Vidro Airi",
  tagline: "A mesa clássica: vidro escuro e violeta suave.",
  accent: "hsl(var(--primary))",
  glow: "hsl(var(--primary) / 0.35)",
  hit: "hsl(var(--success))",
  miss: "hsl(var(--destructive))",
};

export const TABLE_SKINS: Record<string, TableSkin> = {
  [DEFAULT_TABLE_SKIN.key]: DEFAULT_TABLE_SKIN,
  "table:mesa_eclipse": {
    id: "mesa_eclipse",
    key: "table:mesa_eclipse",
    name: "Mesa do Eclipse",
    tagline: "Catedral em ruínas, renda carmesim e o brasão do eclipse.",
    ambient: eclipseAmbient,
    frame: eclipseFrame,
    crest: eclipseCrest,
    particles: eclipsePetals,
    accent: "#e0435f",
    glow: "rgba(190, 26, 56, 0.42)",
    hit: "#ff6b8a",
    miss: "#8e0b22",
  },
};


export function tableSkinFromEquipped(
  equipped: Record<string, string | undefined> | undefined | null,
): TableSkin {
  const key = equipped?.table;
  if (!key) return DEFAULT_TABLE_SKIN;
  return TABLE_SKINS[key] ?? DEFAULT_TABLE_SKIN;
}

export function tableSkinByKey(key?: string | null): TableSkin | undefined {
  if (!key) return undefined;
  return TABLE_SKINS[key];
}

export function isDefaultTableSkin(skin: TableSkin) {
  return skin.id === DEFAULT_TABLE_SKIN.id;
}
