// Cosméticos temáticos além dos slots de perfil clássicos.
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
  glyph: "ember" | "eclipse" | "rune";
  /** Cor principal (CSS color). */
  color: string;
  /** Cor secundária para gradientes/brilho. */
  accent: string;
  /** Borda + fundo do medalhão. */
  ring: string;
  /** Halo do card. */
  halo: string;
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
};

export const VICTORY_SPLASH_THEMES: Record<string, VictorySplashTheme> = {
  ascensao_carmesim: {
    key: "ascensao_carmesim",
    name: "Ascensão Carmesim",
    headline: "VITÓRIA",
    subline: "O eclipse reconhece seu nome",
    color: "#ff5a6e",
    accent: "#2a0410",
  },
  ascensao_espiritual: {
    key: "ascensao_espiritual",
    name: "Ascensão Espiritual",
    headline: "VITÓRIA",
    subline: "O gelo se parte e o sangue da lua reconhece você",
    color: "#8fc7f5",
    accent: "#8e1b2b",
  },
};

export function victorySplashFromEquipped(equipped: EquippedMap): VictorySplashTheme | null {
  const k = keyFrom(equipped.victory_splash);
  return (k && VICTORY_SPLASH_THEMES[k]) || null;
}
