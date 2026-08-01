// Caça aos Fragmentos — modo colecionável do airi (estilo Hextech).
//
// Regras (versão 2):
// • Revisando cartas, existe chance de cair um FRAGMENTO de um cosmético que
//   você ainda não tem. Só caem fragmentos de cosméticos que pertencem a
//   bundles ATIVOS na loja.
// • Junte 3 fragmentos do mesmo cosmético + 150 Arlys ✦ para forjar o item
//   permanentemente.
// • Não gostou do fragmento? Troque por outro (limite semanal) ou dissolva em
//   Arlys ✦.
//
// Persistência: profile_data.data.meta.relicHunt (sincroniza PC ↔ celular).
import { useEffect, useState } from "react";
import { getMeta, setMeta } from "@/lib/flashcards-store";
import { earn, spend, grantCosmetic, getWallet } from "@/lib/wallet-store";
import { listShopItems, bundleItemIds } from "@/lib/shop";

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
  tone: "forge" | "dissolve" | "drop" | "reroll";
};

export type HuntState = {
  /** Fragmentos guardados no inventário. */
  shards: Shard[];
  /** Cosméticos forjados na vida. */
  forged: number;
  /** Total de fragmentos que já caíram. */
  lifetime: number;
  /** Controle de trocas (rerolls) por semana. */
  rerolls: { week: string; used: number };
  log: ForgeLogEntry[];
};

const META_KEY = "relicHunt";

/** Fragmentos necessários para forjar 1 cosmético. */
export const SHARDS_PER_FORGE = 3;
/** Arlys ✦ cobrados na forja (fixo, independente do preço do item). */
export const FORGE_ARLYS_COST = 150;
/** Quantas trocas de fragmento por semana. */
export const REROLL_WEEKLY_LIMIT = 3;

/** Arlys devolvidos ao dissolver 1 fragmento, por raridade. */
const DISSOLVE_BY_TIER: Record<ShardTier, number> = {
  comum: 20,
  raro: 30,
  epico: 45,
  mitico: 60,
};

function weekKey(d = new Date()): string {
  const t = new Date(d);
  const day = (t.getDay() + 6) % 7; // segunda = 0
  t.setDate(t.getDate() - day);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(
    t.getDate(),
  ).padStart(2, "0")}`;
}

const EMPTY: HuntState = {
  shards: [],
  forged: 0,
  lifetime: 0,
  rerolls: { week: weekKey(), used: 0 },
  log: [],
};

function tierFor(price: number): ShardTier {
  if (price >= 500) return "mitico";
  if (price >= 320) return "epico";
  if (price >= 180) return "raro";
  return "comum";
}

function normalize(raw: Partial<HuntState> | undefined): HuntState {
  if (!raw) return { ...EMPTY, rerolls: { week: weekKey(), used: 0 } };
  const shards = Array.isArray(raw.shards) ? raw.shards : [];
  const rr = raw.rerolls;
  const currentWeek = weekKey();
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
        tier: s.price ? tierFor(s.price) : (s.tier ?? "comum"),
        at: Number(s.at ?? Date.now()),
      }))
      .slice(0, 120),
    forged: Math.max(0, Math.floor(raw.forged ?? 0)),
    lifetime: Math.max(0, Math.floor(raw.lifetime ?? 0)),
    rerolls:
      rr && rr.week === currentWeek
        ? { week: currentWeek, used: Math.max(0, Math.floor(rr.used ?? 0)) }
        : { week: currentWeek, used: 0 },
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

/** Trocas de fragmento restantes nesta semana. */
export function rerollsLeft(s: HuntState = state): number {
  const rr = s.rerolls?.week === weekKey() ? s.rerolls.used : 0;
  return Math.max(0, REROLL_WEEKLY_LIMIT - rr);
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
  /** Quantos fragmentos ainda faltam para forjar. */
  missing: number;
  /** Já pode forjar (3 fragmentos). */
  ready: boolean;
  /** Custo fixo em Arlys da forja. */
  cost: number;
  /** Arlys devolvidos ao dissolver 1 fragmento. */
  dissolveValue: number;
};

export function dissolveValue(tier: ShardTier): number {
  return DISSOLVE_BY_TIER[tier] ?? 20;
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
        missing: SHARDS_PER_FORGE - 1,
        ready: false,
        cost: FORGE_ARLYS_COST,
        dissolveValue: dissolveValue(sh.tier),
      });
    }
  }
  const out = [...map.values()];
  for (const st of out) {
    st.missing = Math.max(0, SHARDS_PER_FORGE - st.count);
    st.ready = st.count >= SHARDS_PER_FORGE;
  }
  const order: Record<ShardTier, number> = { mitico: 0, epico: 1, raro: 2, comum: 3 };
  return out.sort(
    (a, b) =>
      Number(b.ready) - Number(a.ready) ||
      order[a.tier] - order[b.tier] ||
      b.count - a.count,
  );
}

// ---- Drops -----------------------------------------------------------

export type ShardDrop = Shard;

type Candidate = Omit<Shard, "id" | "at">;

/**
 * Conjunto de posse tolerante a formatos antigos de chave: guarda a chave
 * completa ("slot:id") e também o id puro, para nunca sortear/guardar
 * fragmento de algo que o perfil já tem.
 */
function ownedKeys(): Set<string> {
  const set = new Set<string>();
  for (const k of getWallet().cosmetics) {
    set.add(k);
    const bare = k.includes(":") ? k.slice(k.indexOf(":") + 1) : k;
    set.add(bare);
  }
  return set;
}

function isOwnedKey(key: string, owned = ownedKeys()): boolean {
  const bare = key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
  return owned.has(key) || owned.has(bare);
}

/**
 * Cosméticos sorteáveis: apenas itens cosméticos que pertencem a bundles
 * ATIVOS na loja e que o perfil ainda não possui (nem via compra do bundle).
 */
async function candidatePool(exclude?: string): Promise<Candidate[]> {
  try {
    const items = await listShopItems();
    const owned = ownedKeys();

    // Bundles ativos; se o perfil já possui TODOS os cosméticos de um bundle,
    // ele não deve mais receber fragmentos daquele conjunto.
    const allowed = new Set<string>();
    for (const it of items) {
      if (it.kind !== "bundle" || !it.active) continue;
      for (const id of bundleItemIds(it)) allowed.add(id);
    }

    return items
      .filter((i) => i.kind === "cosmetic" && allowed.has(i.id))
      .map((i) => {
        const key = String(i.payload?.key ?? i.id);
        const slot = String(i.payload?.slot ?? "cosmetic");
        return {
          key: `${slot}:${key}`,
          name: i.name,
          slot,
          price: Math.max(0, i.price),
          accent: i.accent || "#d8b4fe",
          tier: tierFor(i.price),
        };
      })
      .filter((c) => !isOwnedKey(c.key, owned) && c.key !== exclude);
  } catch {
    return [];
  }
}


function weightedPick(pool: Candidate[]): Candidate | null {
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
}

function makeShard(pick: Candidate): Shard {
  return {
    ...pick,
    id: `${pick.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
  };
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

  const pick = weightedPick(await candidatePool());
  if (!pick) return null;

  const shard = makeShard(pick);
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

/** Quantos fragmentos do mesmo cosmético você já tem (para o pop-up de drop). */
export function shardCountFor(key: string, s: HuntState = state): number {
  return s.shards.filter((x) => x.key === key).length;
}

// ---- Forja / troca / dissolução ---------------------------------------

export type ForgeResult =
  | { ok: true; stack: ShardStack }
  | { ok: false; error: "no_shard" | "incomplete" | "owned" | "insufficient" };

/**
 * Forja o cosmético consumindo 3 fragmentos + 150 Arlys ✦.
 * Fragmentos extras do mesmo cosmético continuam no inventário.
 */
export async function forgeShard(key: string): Promise<ForgeResult> {
  const stack = shardStacks().find((s) => s.key === key);
  if (!stack) return { ok: false, error: "no_shard" };
  if (getWallet().cosmetics.includes(key)) {
    // Já possui (comprou na loja): fragmentos viram Arlys.
    await dissolveAll(key);
    return { ok: false, error: "owned" };
  }
  if (!stack.ready) return { ok: false, error: "incomplete" };
  if (getWallet().crystals < FORGE_ARLYS_COST) return { ok: false, error: "insufficient" };

  const paid = await spend(FORGE_ARLYS_COST);
  if (!paid) return { ok: false, error: "insufficient" };

  await grantCosmetic(key);
  // Consome exatamente 3 fragmentos daquele cosmético.
  let toRemove = SHARDS_PER_FORGE;
  state.shards = state.shards.filter((s) => {
    if (s.key === key && toRemove > 0) {
      toRemove -= 1;
      return false;
    }
    return true;
  });
  state.forged += 1;
  pushLog({
    at: Date.now(),
    tone: "forge",
    label: stack.name,
    detail: `Forjado por ${SHARDS_PER_FORGE} fragmentos + ${FORGE_ARLYS_COST} ✦ — equipe no seu perfil.`,
  });
  return { ok: true, stack };
}

export type RerollResult =
  | { ok: true; shard: Shard; left: number }
  | { ok: false; error: "no_shard" | "limit" | "empty_pool" };

/**
 * Troca 1 fragmento por um fragmento de OUTRO cosmético (limite semanal).
 */
export async function rerollShard(key: string): Promise<RerollResult> {
  if (rerollsLeft() <= 0) return { ok: false, error: "limit" };
  const idx = state.shards.findIndex((s) => s.key === key);
  if (idx < 0) return { ok: false, error: "no_shard" };

  const pick = weightedPick(await candidatePool(key));
  if (!pick) return { ok: false, error: "empty_pool" };

  const old = state.shards[idx];
  const shard = makeShard(pick);
  state.shards = [shard, ...state.shards.filter((_, i) => i !== idx)];
  state.rerolls = { week: weekKey(), used: (state.rerolls?.used ?? 0) + 1 };
  pushLog({
    at: shard.at,
    tone: "reroll",
    label: `${old.name} → ${shard.name}`,
    detail: `Fragmento trocado. ${rerollsLeft()} troca(s) restantes nesta semana.`,
  });
  return { ok: true, shard, left: rerollsLeft() };
}

/** Dissolve 1 fragmento em Arlys. */
export async function dissolveShard(key: string): Promise<number> {
  const idx = state.shards.findIndex((s) => s.key === key);
  if (idx < 0) return 0;
  const shard = state.shards[idx];
  const value = dissolveValue(shard.tier);
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
  const value = rows.reduce((a, s) => a + dissolveValue(s.tier), 0);
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

/**
 * Retira 1 fragmento do inventário para enviar de presente. Devolve o
 * fragmento removido (ou null se não houver).
 */
export function takeShardForGift(key: string, toName: string): Shard | null {
  const idx = state.shards.findIndex((s) => s.key === key);
  if (idx < 0) return null;
  const shard = state.shards[idx];
  state.shards = state.shards.filter((_, i) => i !== idx);
  pushLog({
    at: Date.now(),
    tone: "reroll",
    label: `Enviado: ${shard.name}`,
    detail: `Fragmento enviado de presente para ${toName}.`,
  });
  return shard;
}

/** Devolve um fragmento ao inventário (presente recusado / cancelado). */
export function restoreShard(shard: Omit<Shard, "id" | "at">, detail: string) {
  const full = makeShard(shard as Candidate);
  state.shards = [full, ...state.shards].slice(0, 120);
  pushLog({
    at: full.at,
    tone: "drop",
    label: full.name,
    detail,
  });
}

/** Guarda um fragmento recebido de presente. */
export function receiveGiftedShard(
  shard: Omit<Shard, "id" | "at">,
  fromName: string,
): Shard {
  const full = makeShard(shard as Candidate);
  state.shards = [full, ...state.shards].slice(0, 120);
  state.lifetime += 1;
  pushLog({
    at: full.at,
    tone: "drop",
    label: `Presente: ${full.name}`,
    detail: `Fragmento recebido de ${fromName}.`,
  });
  return full;
}

/** Limpa fragmentos de cosméticos que o perfil já possui (comprou na loja). */

export function pruneOwnedShards() {
  const owned = ownedKeys();
  const before = state.shards.length;
  state.shards = state.shards.filter((s) => !isOwnedKey(s.key, owned));

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
  raro: { label: "Raro", color: "#af95df" },
  epico: { label: "Épico", color: "#d1a8ff" },
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
