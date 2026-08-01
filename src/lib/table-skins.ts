// Mesas de Revisão — "skins" que tematizam a tela de revisão inteira.
// Slot de cosmético: `table`. A mesa padrão (Vidro Airi) é gratuita e usada
// sempre que nada estiver equipado, então todo mundo vê o sistema funcionando.
import eclipseAmbient from "@/assets/shop/eclipse/table-ambient.jpg";
import eclipseFrame from "@/assets/shop/eclipse/table-frame.png";
import eclipseCrest from "@/assets/shop/eclipse/table-cardback.png";
import eclipsePetals from "@/assets/shop/eclipse/petals-overlay.png";
import espiritoAmbient from "@/assets/shop/espirito/table-ambient.jpg";
import espiritoTableFrame from "@/assets/shop/espirito/table-frame.png";
import espiritoCrest from "@/assets/shop/espirito/table-cardback.png";
import espiritoPetals from "@/assets/shop/espirito/petals-overlay.png";
import princesaAmbient from "@/assets/shop/princesa/table-ambient.jpg";
import princesaTableFrame from "@/assets/shop/princesa/table-frame.png";
import princesaCrest from "@/assets/shop/princesa/table-cardback.png";
import princesaFrost from "@/assets/shop/princesa/frost-overlay.png";

import marioneteAmbient from "@/assets/shop/marionete/table-ambient.jpg";
import marioneteTableFrame from "@/assets/shop/marionete/table-frame.png";
import marioneteCrest from "@/assets/shop/marionete/table-cardback.png";
import marionetePetals from "@/assets/shop/marionete/petals-overlay.png";

import piscinaAmbient from "@/assets/shop/piscina/table-ambient.jpg";
import piscinaTableFrame from "@/assets/shop/piscina/table-frame.png";
import piscinaCrest from "@/assets/shop/piscina/table-cardback.png";





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
  /** Assinatura de VFX da mesa. `puppet` usa o teatro de marionetes. */
  vfx?: "default" | "puppet";
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
    name: "Altar do Eclipse",
    tagline: "A nave da catedral em ruínas: luz do eclipse, rosas e brasas carmesim.",
    ambient: eclipseAmbient,
    frame: eclipseFrame,
    crest: eclipseCrest,
    particles: eclipsePetals,
    accent: "#e0435f",
    glow: "rgba(190, 26, 56, 0.42)",
    hit: "#ff6b8a",
    miss: "#8e0b22",
  },
  "table:mesa_espiritual": {
    id: "mesa_espiritual",
    key: "table:mesa_espiritual",
    name: "Altar da Névoa",
    tagline: "O altar congelado sob a lua: gelo azul, lâminas espectrais e brasas de sangue.",
    ambient: espiritoAmbient,
    frame: espiritoTableFrame,
    crest: espiritoCrest,
    particles: espiritoPetals,
    accent: "#8fc7f5",
    glow: "rgba(143, 199, 245, 0.38)",
    hit: "#bfe4ff",
    miss: "#8e1b2b",
  },
  "table:mesa_vigilia_prateada": {
    id: "mesa_vigilia_prateada",
    key: "table:mesa_vigilia_prateada",
    name: "Mesa do Rito de Gelo",
    tagline: "A cripta congelada da vigília: velas de safira, espinhos de prata e gelo eterno.",
    ambient: princesaAmbient,
    frame: princesaTableFrame,
    crest: princesaCrest,
    particles: princesaFrost,
    accent: "#9fd2ff",
    glow: "rgba(120, 185, 255, 0.55)",
    hit: "#dff1ff",
    miss: "#3f7fd6",
  },
  "table:mesa_marionetes": {
    id: "mesa_marionetes",
    key: "table:mesa_marionetes",
    name: "Mesa da Corte das Marionetes",
    tagline: "O palco gótico do teatro eterno: cortinas de veludo rubro, máscaras de porcelana e pétalas que caem como fios.",
    ambient: marioneteAmbient,
    frame: marioneteTableFrame,
    crest: marioneteCrest,
    particles: marionetePetals,
    accent: "#d9445f",
    glow: "rgba(185, 28, 60, 0.45)",
    hit: "#ff8aa0",
    miss: "#7a1329",
    vfx: "puppet",
  },
  "table:mesa_piscina": {
    id: "mesa_piscina",
    key: "table:mesa_piscina",
    name: "Mesa da Piscina Infinita",
    tagline: "Azulejos azul-piscina, boias douradas e peixes bobos nadando entre as cartas.",
    ambient: piscinaAmbient,
    frame: piscinaTableFrame,
    crest: piscinaCrest,
    accent: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.38)",
    hit: "#fde047",
    miss: "#f43f5e",
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
