// Caça aos Luminhos — modo colecionável do airi.
// Ao acertar cartas na revisão, existe uma chance de aparecer um "Luminho"
// (espírito de luz). Juntando Luminhos você forja Relicários, que abrem
// recompensas aleatórias: Arlys ✦, power-ups e até cosméticos de bundle.
//
// Persistência: profile_data.data.meta.relicHunt (sincroniza PC ↔ celular).
import { useEffect, useState } from "react";
import { getMeta, setMeta } from "@/lib/flashcards-store";
import { earn, grantCosmetic, grantPowerup, getWallet } from "@/lib/wallet-store";
import { listShopItems } from "@/lib/shop";

export const LUMINHOS_PER_RELIC = 8;
export const LUMINHOS_PER_PRISM = 3;

export type RelicKind = "selado" | "prismatico";

export type RelicLogEntry = {
  at: number;
  kind: RelicKind;
  label: string;
  detail: string;
  tone: "arlys" | "powerup" | "cosmetic";
};

export type HuntState = {
  /** Luminhos comuns guardados. */
  luminhos: number;
  /** Luminhos prismáticos (raros) guardados. */
  prismas: number;
  /** Relicários já abertos. */
  opened: number;
  /** Total de Luminhos coletados na vida. */
  lifetime: number;
  /** Histórico das últimas aberturas. */
  log: RelicLogEntry[];
};

const META_KEY = "relicHunt";

const EMPTY: HuntState = { luminhos: 0, prismas: 0, opened: 0, lifetime: 0, log: [] };

function normalize(raw: Partial<HuntState> | undefined): HuntState {
  if (!raw) return { ...EMPTY };
  return {
    luminhos: Math.max(0, Math.floor(raw.luminhos ?? 0)),
    prismas: Math.max(0, Math.floor(raw.prismas ?? 0)),
    opened: Math.max(0, Math.floor(raw.opened ?? 0)),
    lifetime: Math.max(0, Math.floor(raw.lifetime ?? 0)),
    log: Array.isArray(raw.log) ? raw.log.slice(0, 30) : [],
  };
}

let state: HuntState = normalize(getMeta<HuntState>(META_KEY));
const listeners = new Set<(s: HuntState) => void>();

function emit() {
  state = { ...state };
  listeners.forEach((fn) => fn(state));
}
function persist() {
  setMeta<HuntState>(META_KEY, state);
}

export function getHunt(): HuntState {
  return state;
}

/** Recarrega do meta (troca de perfil / pull do cloud). */
export function refreshHunt() {
  state = normalize(getMeta<HuntState>(META_KEY));
  emit();
}

export function useHunt(): HuntState {
  const [s, setS] = useState<HuntState>(state);
  useEffect(() => {
    const fn = (v: HuntState) => setS(v);
    listeners.add(fn);
    refreshHunt();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return s;
}

// ---- Drops -----------------------------------------------------------

export type LuminhoDrop = {
  rarity: "comum" | "prismatico";
  /** Quantos Luminhos vieram nesse drop. */
  amount: number;
};

/**
 * Sorteia um drop após um acerto. Streak da sessão e cartas inimigas
 * aumentam levemente a chance — esforço vira sorte, sem virar obrigação.
 */
export function rollLuminho(opts: {
  runStreak: number;
  isEnemy: boolean;
}): LuminhoDrop | null {
  const base = 0.16;
  const streakBonus = Math.min(0.12, opts.runStreak * 0.015);
  const enemyBonus = opts.isEnemy ? 0.08 : 0;
  const chance = base + streakBonus + enemyBonus;
  if (Math.random() > chance) return null;

  // 1 em 14 drops vem prismático.
  if (Math.random() < 0.07) {
    state.prismas += 1;
    state.lifetime += 1;
    emit();
    persist();
    return { rarity: "prismatico", amount: 1 };
  }
  const amount = Math.random() < 0.18 ? 2 : 1;
  state.luminhos += amount;
  state.lifetime += amount;
  emit();
  persist();
  return { rarity: "comum", amount };
}

export function canForge(kind: RelicKind): boolean {
  return kind === "selado"
    ? state.luminhos >= LUMINHOS_PER_RELIC
    : state.prismas >= LUMINHOS_PER_PRISM;
}

// ---- Recompensas -----------------------------------------------------

export type RelicReward = {
  tone: "arlys" | "powerup" | "cosmetic";
  label: string;
  detail: string;
  /** Raridade visual da recompensa. */
  tier: "comum" | "raro" | "epico" | "mitico";
};

type Weighted<T> = { w: number; value: T };

function pickWeighted<T>(rows: Weighted<T>[]): T {
  const total = rows.reduce((a, r) => a + r.w, 0);
  let r = Math.random() * total;
  for (const row of rows) {
    r -= row.w;
    if (r <= 0) return row.value;
  }
  return rows[rows.length - 1].value;
}

const POWERUPS: { effect: string; label: string }[] = [
  { effect: "hint", label: "Sussurro (dica em 1 carta)" },
  { effect: "shield", label: "Escudo de Névoa (perdoa 1 erro)" },
  { effect: "double_arlys", label: "Eco Dourado (Arlys em dobro)" },
];

/** Sorteia um cosmético que o perfil ainda não tem. */
async function pickUnownedCosmetic(): Promise<{ key: string; name: string } | null> {
  try {
    const items = await listShopItems();
    const owned = new Set(getWallet().cosmetics);
    const pool = items
      .filter((i) => i.kind === "cosmetic")
      .map((i) => {
        const key = String(i.payload?.key ?? i.id);
        const slot = String(i.payload?.slot ?? "effect");
        return { key: `${slot}:${key}`, name: i.name };
      })
      .filter((c) => !owned.has(c.key));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  } catch {
    return null;
  }
}

/**
 * Abre um relicário. Consome os Luminhos, concede a recompensa e devolve
 * o que saiu para a animação de abertura mostrar.
 */
export async function openRelic(kind: RelicKind): Promise<RelicReward | null> {
  if (!canForge(kind)) return null;
  if (kind === "selado") state.luminhos -= LUMINHOS_PER_RELIC;
  else state.prismas -= LUMINHOS_PER_PRISM;
  state.opened += 1;
  emit();
  persist();

  const wantsCosmetic =
    kind === "prismatico" ? Math.random() < 0.55 : Math.random() < 0.12;

  if (wantsCosmetic) {
    const cos = await pickUnownedCosmetic();
    if (cos) {
      await grantCosmetic(cos.key);
      const reward: RelicReward = {
        tone: "cosmetic",
        label: cos.name,
        detail: "Cosmético desbloqueado — equipe no seu perfil.",
        tier: kind === "prismatico" ? "mitico" : "epico",
      };
      pushLog(kind, reward);
      return reward;
    }
  }

  const outcome = pickWeighted<"arlys_p" | "arlys_m" | "arlys_g" | "powerup">(
    kind === "prismatico"
      ? [
          { w: 10, value: "arlys_m" },
          { w: 34, value: "arlys_g" },
          { w: 26, value: "powerup" },
        ]
      : [
          { w: 40, value: "arlys_p" },
          { w: 28, value: "arlys_m" },
          { w: 6, value: "arlys_g" },
          { w: 26, value: "powerup" },
        ],
  );

  let reward: RelicReward;
  if (outcome === "powerup") {
    const p = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const uses = kind === "prismatico" ? 3 : 1;
    await grantPowerup(p.effect, uses);
    reward = {
      tone: "powerup",
      label: p.label,
      detail: `${uses}× uso${uses > 1 ? "s" : ""} adicionado ao inventário.`,
      tier: kind === "prismatico" ? "epico" : "raro",
    };
  } else {
    const amount =
      outcome === "arlys_p"
        ? 25 + Math.floor(Math.random() * 36)
        : outcome === "arlys_m"
          ? 90 + Math.floor(Math.random() * 71)
          : 260 + Math.floor(Math.random() * 241);
    await earn(amount, "relic.open");
    reward = {
      tone: "arlys",
      label: `${amount} Arlys ✦`,
      detail:
        amount >= 260
          ? "Veio um jorro de luz do relicário."
          : "Direto pra sua carteira.",
      tier: amount >= 260 ? "epico" : amount >= 90 ? "raro" : "comum",
    };
  }
  pushLog(kind, reward);
  return reward;
}

function pushLog(kind: RelicKind, reward: RelicReward) {
  state.log = [
    { at: Date.now(), kind, label: reward.label, detail: reward.detail, tone: reward.tone },
    ...state.log,
  ].slice(0, 30);
  emit();
  persist();
}

export const RELIC_META: Record<
  RelicKind,
  { name: string; tagline: string; accent: string; glow: string; cost: string }
> = {
  selado: {
    name: "Relicário Selado",
    tagline: "Forjado com 8 Luminhos. Arlys, power-ups e uma chance de cosmético.",
    accent: "#c4b5fd",
    glow: "rgba(167,139,250,0.55)",
    cost: `${LUMINHOS_PER_RELIC} Luminhos`,
  },
  prismatico: {
    name: "Relicário Prismático",
    tagline: "Raro. Mais da metade das aberturas larga um cosmético de bundle.",
    accent: "#7dd3fc",
    glow: "rgba(125,211,252,0.6)",
    cost: `${LUMINHOS_PER_PRISM} Luminhos prismáticos`,
  },
};
