// Caça aos Fragmentos — modo colecionável do airi (estilo Hextech).
//
// Ao acertar cartas na revisão existe uma chance de cair um FRAGMENTO de um
// cosmético específico que você ainda não tem. Fragmento não é o item: ele
// libera o direito de FORJAR aquele cosmético pagando uma fração do preço em
// Arlys ✦. Fragmentos repetidos do mesmo cosmético deixam a forja mais barata,
// e fragmentos que você não quer podem ser dissolvidos em Arlys.
//
// Persistência: profile_data.data.meta.relicHunt (sincroniza PC ↔ celular).
import { useEffect, useState } from "react";
import { getMeta, setMeta } from "@/lib/flashcards-store";
import { earn, spend, grantCosmetic, getWallet } from "@/lib/wallet-store";
import { listShopItems } from "@/lib/shop";

export type ShardTier = "comum" | "raro" | "epico" | "mitico";

export type Shard = {
  /** id local do fragmento (permite duplicados). */
  id: string;
  /** chave do cosmético, ex. "crown:crepusculo". */
  key: string;
  name: string;
  slot: string;
  /** preço cheio do item na loja. */
  price: number;
  accent: string;
  tier: ShardTier;
  at: number;
};

export type ForgeLogEntry = {
  at: number;
  label: string;
  detail: string;
  tone: "forge" | "dissolve" | "drop";
};

export type HuntState = {
  /** Fragmentos guardados no inventário. */
  shards: Shard[];
  /** Cosméticos forjados na vida. */
  forged: number;
  /** Total de fragmentos que já caíram. */
  lifetime: number;
  log: ForgeLogEntry[];
};

const META_KEY = "relicHunt";

const EMPTY: HuntState = { shards: [], forged: 0, lifetime: 0, log: [] };

/** Fração do preço cheio paga na forja com 1 fragmento. */
export const FORGE_BASE_RATE = 0.45;
/** Desconto por fragmento duplicado do mesmo cosmético. */
const FORGE_DUP_DISCOUNT = 0.12;
const FORGE_MIN_RATE = 0.15;
/** Fração do preço devolvida ao dissolver um fragmento. */
const DISSOLVE_RATE = 0.1;

function tierFor(price: number): ShardTier {
  if (price >= 800) return "mitico";
  if (price >= 400) return "epico";
  if (price >= 150) return "raro";
  return "comum";
}

function normalize(raw: Partial<HuntState> | undefined): HuntState {
  if (!raw) return { ...EMPTY };
  const shards = Array.isArray(raw.shards) ? raw.shards : [];
  return {
    shards: shards
      .filter((s): s is Shard => Boolean(s && s.key && s.name))
      .map((s) => ({
        id: String(s.id ?? `${s.key}-${s.at ?? Date.now()}`),
        key: String(s.key),
        name: String(s.name),
        slot: String(s.slot ?? "effect"),
        price: Math.max(0, Math.floor(s.price ?? 0)),
        accent: String(s.accent ?? "#d8b4fe"),
        tier: s.tier ?? tierFor(s.price ?? 0),
        at: Number(s.at ?? Date.now()),
      }))
      .slice(0, 120),
    forged: Math.max(0, Math.floor(raw.forged ?? 0)),
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

// ---- Inventário / preços ---------------------------------------------

/** Agrupa fragmentos por cosmético. */
export type ShardStack = {
  key: string;
  name: string;
  slot: string;
  price: number;
  accent: string;
  tier: ShardTier;
  count: number;
  ids: string[];
  /** Custo em Arlys para forjar agora (já com desconto de duplicados). */
  cost: number;
  /** Quanto o próximo fragmento repetido economizaria. */
  nextCost: number;
  /** Arlys devolvidos ao dissolver 1 fragmento. */
  dissolveValue: number;
};

export function forgeCost(price: number, count: number): number {
  const rate = Math.max(
    FORGE_MIN_RATE,
    FORGE_BASE_RATE - FORGE_DUP_DISCOUNT * Math.max(0, count - 1),
  );
  return Math.max(5, Math.round((price * rate) / 5) * 5);
}

export function dissolveValue(price: number): number {
  return Math.max(3, Math.round((price * DISSOLVE_RATE) / 5) * 5);
}

export function shardStacks(s: HuntState = state): ShardStack[] {
  const map = new Map<string, ShardStack>();
  for (const sh of s.shards) {
    const cur = map.get(sh.key);
    if (cur) {
      cur.count += 1;
      cur.ids.push(sh.id);
    } else {
      map.set(sh.key, {
        key: sh.key,
        name: sh.name,
        slot: sh.slot,
        price: sh.price,
        accent: sh.accent,
        tier: sh.tier,
        count: 1,
        ids: [sh.id],
        cost: 0,
        nextCost: 0,
        dissolveValue: dissolveValue(sh.price),
      });
    }
  }
  const out = [...map.values()];
  for (const st of out) {
    st.cost = forgeCost(st.price, st.count);
    st.nextCost = forgeCost(st.price, st.count + 1);
  }
  const order: Record<ShardTier, number> = { mitico: 0, epico: 1, raro: 2, comum: 3 };
  return out.sort((a, b) => order[a.tier] - order[b.tier] || b.count - a.count);
}

// ---- Drops -----------------------------------------------------------

export type ShardDrop = Shard;

/** Sorteia um cosmético da loja que o perfil ainda não possui. */
async function pickUnownedCosmetic(): Promise<Omit<Shard, "id" | "at"> | null> {
  try {
    const items = await listShopItems();
    const owned = new Set(getWallet().cosmetics);
    const pool = items
      .filter((i) => i.kind === "cosmetic")
      .map((i) => {
        const key = String(i.payload?.key ?? i.id);
        const slot = String(i.payload?.slot ?? "effect");
        return {
          key: `${slot}:${key}`,
          name: i.name,
          slot,
          price: Math.max(0, i.price),
          accent: i.accent || "#d8b4fe",
          tier: tierFor(i.price),
        };
      })
      .filter((c) => !owned.has(c.key));
    if (pool.length === 0) return null;
    // Itens mais caros são mais raros de cair.
    const weights = pool.map((c) =>
      c.tier === "mitico" ? 1 : c.tier === "epico" ? 2 : c.tier === "raro" ? 4 : 6,
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  } catch {
    return null;
  }
}

/**
 * Sorteia um fragmento após um acerto. Streak da sessão e cartas inimigas
 * aumentam levemente a chance — esforço vira sorte, sem virar obrigação.
 */
export async function rollShard(opts: {
  runStreak: number;
  isEnemy: boolean;
}): Promise<ShardDrop | null> {
  const base = 0.09;
  const streakBonus = Math.min(0.08, opts.runStreak * 0.01);
  const enemyBonus = opts.isEnemy ? 0.05 : 0;
  if (Math.random() > base + streakBonus + enemyBonus) return null;

  const pick = await pickUnownedCosmetic();
  if (!pick) return null;

  const shard: Shard = {
    ...pick,
    id: `${pick.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };
  state.shards = [shard, ...state.shards].slice(0, 120);
  state.lifetime += 1;
  pushLog({
    at: shard.at,
    tone: "drop",
    label: `Fragmento: ${shard.name}`,
    detail: "Guardado no inventário da forja.",
  });
  return shard;
}

// ---- Forja / dissolução ----------------------------------------------

export type ForgeResult =
  | { ok: true; stack: ShardStack }
  | { ok: false; error: "no_shard" | "owned" | "insufficient" };

/**
 * Forja o cosmético usando os fragmentos guardados + Arlys.
 * Todos os fragmentos daquele cosmético são consumidos (já virou item).
 */
export async function forgeShard(key: string): Promise<ForgeResult> {
  const stack = shardStacks().find((s) => s.key === key);
  if (!stack) return { ok: false, error: "no_shard" };
  if (getWallet().cosmetics.includes(key)) {
    // Já possui (comprou na loja): fragmentos viram Arlys.
    await dissolveAll(key);
    return { ok: false, error: "owned" };
  }
  if (getWallet().crystals < stack.cost) return { ok: false, error: "insufficient" };

  const paid = await spend(stack.cost);
  if (!paid) return { ok: false, error: "insufficient" };

  await grantCosmetic(key);
  state.shards = state.shards.filter((s) => s.key !== key);
  state.forged += 1;
  pushLog({
    at: Date.now(),
    tone: "forge",
    label: stack.name,
    detail: `Forjado por ${stack.cost} ✦ — equipe no seu perfil.`,
  });
  return { ok: true, stack };
}

/** Dissolve 1 fragmento em Arlys. */
export async function dissolveShard(key: string): Promise<number> {
  const idx = state.shards.findIndex((s) => s.key === key);
  if (idx < 0) return 0;
  const shard = state.shards[idx];
  const value = dissolveValue(shard.price);
  state.shards = state.shards.filter((_, i) => i !== idx);
  await earn(value, "shard.dissolve");
  pushLog({
    at: Date.now(),
    tone: "dissolve",
    label: `+${value} ✦`,
    detail: `Fragmento de ${shard.name} dissolvido.`,
  });
  return value;
}

/** Dissolve todos os fragmentos de um cosmético. */
export async function dissolveAll(key: string): Promise<number> {
  const rows = state.shards.filter((s) => s.key === key);
  if (rows.length === 0) return 0;
  const value = rows.reduce((a, s) => a + dissolveValue(s.price), 0);
  state.shards = state.shards.filter((s) => s.key !== key);
  await earn(value, "shard.dissolve");
  pushLog({
    at: Date.now(),
    tone: "dissolve",
    label: `+${value} ✦`,
    detail: `${rows.length} fragmento(s) de ${rows[0].name} dissolvido(s).`,
  });
  return value;
}

/** Limpa fragmentos de cosméticos que o perfil já possui (comprou na loja). */
export function pruneOwnedShards() {
  const owned = new Set(getWallet().cosmetics);
  const before = state.shards.length;
  state.shards = state.shards.filter((s) => !owned.has(s.key));
  if (state.shards.length !== before) {
    emit();
    persist();
  }
}

function pushLog(entry: ForgeLogEntry) {
  state.log = [entry, ...state.log].slice(0, 30);
  emit();
  persist();
}

export const TIER_META: Record<ShardTier, { label: string; color: string }> = {
  comum: { label: "Comum", color: "#cbd5e1" },
  raro: { label: "Raro", color: "#7dd3fc" },
  epico: { label: "Épico", color: "#c4b5fd" },
  mitico: { label: "Mítico", color: "#fbbf24" },
};

export const SLOT_LABEL: Record<string, string> = {
  crown: "Coroa",
  avatar_ring: "Anel de perfil",
  table_skin: "Mesa de revisão",
  cardback: "Verso de carta",
  effect: "Efeito",
  aura: "Aura",
  nameplate: "Placa de nome",
  companion: "Companheiro",
  streak_flame: "Chama de sequência",
  enemy_seal: "Selo inimigo",
  title: "Título",
  victory_splash: "Splash de vitória",
  deck_frame: "Moldura de deck",
};
