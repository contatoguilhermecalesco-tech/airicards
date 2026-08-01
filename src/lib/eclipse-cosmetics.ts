// Cosméticos temáticos além dos slots de perfil clássicos.
import { COSMETIC_ART } from "@/lib/cosmetic-art";
// Cada slot aqui é lido direto do `equipped` da wallet (formato `slot:key`).
import type { EquippedMap } from "@/lib/wallet-store";

function keyFrom(value: string | undefined): string | null {
  if (!value) return null;
  const idx = value.indexOf(":");
  return idx === -1 ? value : value.slice(idx + 1);
}

/* ---------------- Chama de streak ---------------- */

export type StreakFlameTheme = {
  key: string;
  name: string;
  /** Ícone base do medalhão. */
  glyph: "ember" | "eclipse" | "rune" | "marionette";
  /** Cor principal (CSS color). */
  color: string;
  /** Cor secundária para gradientes/brilho. */
  accent: string;
  /** Borda + fundo do medalhão. */
  ring: string;
  /** Halo do card. */
  halo: string;
  /** Arte dedicada (usada pelos glyphs baseados em ilustração). */
  art?: string;
};

export const STREAK_FLAME_THEMES: Record<string, StreakFlameTheme> = {
  brasa_carmesim: {
    key: "brasa_carmesim",
    name: "Brasa Carmesim",
    glyph: "ember",
    color: "#ff5a6e",
    accent: "#7f1027",
    ring: "border-rose-400/30 bg-gradient-to-b from-rose-600/25 to-black/40 text-rose-200",
    halo: "radial-gradient(closest-side, rgba(244,63,94,0.38), transparent 70%)",
  },
  eclipse_vivo: {
    key: "eclipse_vivo",
    name: "Eclipse Vivo",
    glyph: "eclipse",
    color: "#ffd6a5",
    accent: "#4c0519",
    ring: "border-amber-200/25 bg-gradient-to-b from-amber-500/15 to-black/50 text-amber-100",
    halo: "radial-gradient(closest-side, rgba(251,191,36,0.30), transparent 70%)",
  },
  chama_espiritual: {
    key: "chama_espiritual",
    name: "Chama Espiritual",
    glyph: "rune",
    color: "#8fc7f5",
    accent: "#8e1b2b",
    ring: "border-sky-300/30 bg-gradient-to-b from-sky-400/18 to-[#2a0410]/60 text-sky-50",
    halo: "radial-gradient(closest-side, rgba(143,199,245,0.34), rgba(142,27,43,0.22) 55%, transparent 72%)",
  },
  chama_vigilia: {
    key: "chama_vigilia",
    name: "Chama da Vigília",
    glyph: "rune",
    color: "#bfe4ff",
    accent: "#0b1a3a",
    ring: "border-sky-200/30 bg-gradient-to-b from-sky-300/18 to-[#050a1c]/70 text-sky-50",
    halo: "radial-gradient(closest-side, rgba(191,228,255,0.32), transparent 72%)",
    art: COSMETIC_ART.chama_vigilia,
  },
  chama_marionete: {
    key: "chama_marionete",
    name: "Chama da Marionete",
    glyph: "marionette",
    color: "#ff4d63",
    accent: "#f5e7dd",
    ring: "border-rose-200/30 bg-gradient-to-b from-rose-700/30 to-[#10040a]/80 text-rose-50",
    halo: "radial-gradient(closest-side, rgba(255,77,99,0.36), rgba(245,231,221,0.14) 52%, transparent 74%)",
    art: COSMETIC_ART.chama_marionete,
  },
  chama_piscina: {
    key: "chama_piscina",
    name: "Chama Tropical",
    glyph: "rune",
    color: "#fbbf24",
    accent: "#06b6d4",
    ring: "border-cyan-300/30 bg-gradient-to-b from-amber-400/20 to-cyan-900/30 text-amber-50",
    halo: "radial-gradient(closest-side, rgba(251,191,36,0.35), rgba(6,182,212,0.18) 55%, transparent 72%)",
    art: COSMETIC_ART.chama_piscina,
  },
};


export function streakFlameFromEquipped(equipped: EquippedMap): StreakFlameTheme | null {
  const k = keyFrom(equipped.streak_flame);
  return (k && STREAK_FLAME_THEMES[k]) || null;
}

/* ---------------- Selo das cartas inimigas ---------------- */

export type EnemySealTheme = {
  key: string;
  name: string;
  color: string;
  accent: string;
  /** Texto curto estampado ao marcar erro. */
  missLabel: string;
  /** Texto curto estampado ao derrotar. */
  hitLabel: string;
  /** Arte dedicada do sigilo (opcional). */
  art?: string;
};

export const ENEMY_SEAL_THEMES: Record<string, EnemySealTheme> = {
  selo_eclipse: {
    key: "selo_eclipse",
    name: "Selo do Eclipse",
    color: "#ff4d63",
    accent: "#2a0410",
    missLabel: "MARCADO",
    hitLabel: "SELO ROMPIDO",
  },
  selo_espiritual: {
    key: "selo_espiritual",
    name: "Selo Espiritual",
    color: "#8fc7f5",
    accent: "#8e1b2b",
    missLabel: "SELO SANGRADO",
    hitLabel: "GELO ROMPIDO",
  },
  olho_vigilia: {
    key: "olho_vigilia",
    name: "Olho da Vigília",
    color: "#bfe4ff",
    accent: "#050a1c",
    missLabel: "VIGIADO",
    hitLabel: "GELO PARTIDO",
    art: COSMETIC_ART.olho_vigilia,
  },
  selo_marionete: {
    key: "selo_marionete",
    name: "Selo da Marionete",
    color: "#ff4d63",
    accent: "#10040a",
    missLabel: "AMARRADO",
    hitLabel: "FIOS CORTADOS",
    art: COSMETIC_ART.selo_marionete,
  },
  selo_piscina: {
    key: "selo_piscina",
    name: "Selo Solar",
    color: "#fbbf24",
    accent: "#0891b2",
    missLabel: "QUEIMOU",
    hitLabel: "MERGULHOU",
    art: COSMETIC_ART.selo_piscina,
  },
};


export function enemySealFromEquipped(equipped: EquippedMap): EnemySealTheme | null {
  const k = keyFrom(equipped.enemy_seal);
  return (k && ENEMY_SEAL_THEMES[k]) || null;
}

/* ---------------- Título animado ---------------- */

export type TitleTheme = {
  key: string;
  name: string;
  /** Texto exibido no perfil. */
  text: string;
  gradient: string;
};

export const TITLE_THEMES: Record<string, TitleTheme> = {
  arauto_eclipse: {
    key: "arauto_eclipse",
    name: "Arauto do Eclipse",
    text: "Arauto do Eclipse",
    gradient: "linear-gradient(90deg,#7f1027,#ff5a6e,#ffd6a5,#ff5a6e,#7f1027)",
  },
  guardia_nevoa: {
    key: "guardia_nevoa",
    name: "Guardião da Névoa",
    text: "Guardião da Névoa",
    gradient: "linear-gradient(90deg,#1e3a8a,#60a5fa,#e0f2fe,#60a5fa,#1e3a8a)",
  },
};

export function titleFromEquipped(equipped: EquippedMap): TitleTheme | null {
  const k = keyFrom(equipped.title);
  return (k && TITLE_THEMES[k]) || null;
}

/* ---------------- Splash de vitória em duelo ---------------- */

export type VictorySplashTheme = {
  key: string;
  name: string;
  headline: string;
  subline: string;
  color: string;
  accent: string;
  art?: string;
};

export const VICTORY_SPLASH_THEMES: Record<string, VictorySplashTheme> = {
  ascensao_carmesim: {
    key: "ascensao_carmesim",
    name: "Ascensão Carmesim",
    headline: "VITÓRIA",
    subline: "O eclipse reconhece seu nome",
    color: "#ff5a6e",
    accent: "#2a0410",
    art: COSMETIC_ART.ascensao_carmesim,
  },
  ascensao_espiritual: {
    key: "ascensao_espiritual",
    name: "Ascensão Espiritual",
    headline: "VITÓRIA",
    subline: "O gelo se parte e o sangue da lua reconhece você",
    color: "#8fc7f5",
    accent: "#0a1430",
    art: COSMETIC_ART.ascensao_espiritual,
  },
  ascensao_vigilia: {
    key: "ascensao_vigilia",
    name: "Ascensão da Vigília",
    headline: "VITÓRIA",
    subline: "O rito de gelo coroa sua vigília",
    color: "#bfe4ff",
    accent: "#050a1c",
    art: COSMETIC_ART.ascensao_vigilia,
  },
  ascensao_marionete: {
    key: "ascensao_marionete",
    name: "Ascensão da Marionete",
    headline: "VITÓRIA",
    subline: "A corte aplaude — os fios agora são seus",
    color: "#ff4d63",
    accent: "#10040a",
    art: COSMETIC_ART.ascensao_marionete,
  },
  ascensao_piscina: {
    key: "ascensao_piscina",
    name: "Splash de Verão",
    headline: "VITÓRIA",
    subline: "A piscina inteira comemora seu mergulho",
    color: "#22d3ee",
    accent: "#f59e0b",
    art: COSMETIC_ART.ascensao_piscina,
  },
};


export function victorySplashFromEquipped(equipped: EquippedMap): VictorySplashTheme | null {
  const k = keyFrom(equipped.victory_splash);
  return (k && VICTORY_SPLASH_THEMES[k]) || null;
}
