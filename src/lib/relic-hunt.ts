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

export type ForgeVariant = "aurea" | "platina";

export type HuntState = {
  /** Fragmentos guardados no inventário. */
  shards: Shard[];
  /** Cosméticos forjados na vida. */
  forged: number;
  /** Total de fragmentos que já caíram. */
  lifetime: number;
  /** Controle de trocas (rerolls) por semana. */
  rerolls: { week: string; used: number };
  /** Variantes conquistadas em forjas críticas: chave do cosmético → variante. */
  variants: Record<string, ForgeVariant>;
  /** Arlys já sacados por dissolução nesta semana (teto anti-inflação). */
  dissolveWeek: { week: string; arlys: number };
  /** Controle de drops do dia (teto diário + intervalo entre quedas). */
  dropDay: { day: string; count: number; lastAt: number };
  log: ForgeLogEntry[];
};


const META_KEY = "relicHunt";

/** Fragmentos necessários para forjar 1 cosmético. */
export const SHARDS_PER_FORGE = 3;
/** Arlys ✦ cobrados na forja (fixo, independente do preço do item). */
export const FORGE_ARLYS_COST = 150;
/** Quantas trocas de fragmento por semana. */
export const REROLL_WEEKLY_LIMIT = 3;
/** Limite de fragmentos no inventário — força decisões. */
export const SHARD_CAP = 10;
/** Fragmentos consumidos numa fusão (raridades iguais, cosméticos diferentes). */
export const FUSION_INPUT = 3;
/** Dias até o fragmento começar a perder brilho. */
export const DULL_AFTER_DAYS = 14;
/** Dias até o fragmento ficar totalmente opaco. */
export const DULL_MAX_DAYS = 30;
/** Teto semanal de Arlys sacados por dissolução. */
export const DISSOLVE_WEEKLY_CAP = 300;
/** Chance de forja crítica (variante áurea) e de variante platina. */
export const CRIT_FORGE_CHANCE = 0.14;
export const PLATINA_FORGE_CHANCE = 0.04;
/** Máximo de fragmentos que podem cair por dia. */
export const DROP_DAILY_CAP = 3;
/** Intervalo mínimo entre dois fragmentos (min). */
export const DROP_COOLDOWN_MIN = 12;
/** Chance base de drop por acerto. */
export const DROP_BASE_CHANCE = 0.045;

export const VARIANT_META: Record<ForgeVariant, { label: string; color: string }> = {
  aurea: { label: "Áurea", color: "#f3c969" },
  platina: { label: "Platina", color: "#dbe7f3" },
};

/** Arlys devolvidos ao dissolver 1 fragmento, por raridade. */
const DISSOLVE_BY_TIER: Record<ShardTier, number> = {
  comum: 20,
  raro: 30,
  epico: 45,
  mitico: 60,
};

const DAY = 86_400_000;

/** Fator de brilho (1 → intacto, 0.5 → totalmente opaco). */
export function shineFactor(at: number, now = Date.now()): number {
  const days = Math.max(0, (now - at) / DAY);
  if (days <= DULL_AFTER_DAYS) return 1;
  if (days >= DULL_MAX_DAYS) return 0.5;
  const t = (days - DULL_AFTER_DAYS) / (DULL_MAX_DAYS - DULL_AFTER_DAYS);
  return 1 - 0.5 * t;
}

/** Valor real de dissolução de 1 fragmento, já com perda de brilho. */
export function shardDissolveValue(shard: Shard, now = Date.now()): number {
  const base = DISSOLVE_BY_TIER[shard.tier] ?? 20;
  return Math.max(5, Math.round(base * shineFactor(shard.at, now)));
}


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
  variants: {},
  dissolveWeek: { week: weekKey(), arlys: 0 },
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
      .slice(0, SHARD_CAP),
    forged: Math.max(0, Math.floor(raw.forged ?? 0)),
    lifetime: Math.max(0, Math.floor(raw.lifetime ?? 0)),
    rerolls:
      rr && rr.week === currentWeek
        ? { week: currentWeek, used: Math.max(0, Math.floor(rr.used ?? 0)) }
        : { week: currentWeek, used: 0 },
    variants:
      raw.variants && typeof raw.variants === "object"
        ? Object.fromEntries(
            Object.entries(raw.variants).filter(
              ([, v]) => v === "aurea" || v === "platina",
            ),
          )
        : {},
    dissolveWeek:
      raw.dissolveWeek && raw.dissolveWeek.week === currentWeek
        ? {
            week: currentWeek,
            arlys: Math.max(0, Math.floor(raw.dissolveWeek.arlys ?? 0)),
          }
        : { week: currentWeek, arlys: 0 },
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

/** Arlys ainda sacáveis por dissolução nesta semana. */
export function dissolveLeft(s: HuntState = state): number {
  const used = s.dissolveWeek?.week === weekKey() ? s.dissolveWeek.arlys : 0;
  return Math.max(0, DISSOLVE_WEEKLY_CAP - used);
}

/** Vagas livres no inventário. */
export function shardSlotsLeft(s: HuntState = state): number {
  return Math.max(0, SHARD_CAP - s.shards.length);
}

/** Variante conquistada em forja crítica (ou null). */
export function variantOf(key: string, s: HuntState = state): ForgeVariant | null {
  return s.variants?.[key] ?? null;
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
  /** Arlys devolvidos ao dissolver 1 fragmento (já com perda de brilho). */
  dissolveValue: number;
  /** Brilho do fragmento mais antigo da pilha (1 → intacto). */
  shine: number;
  /** Fragmento perdendo valor por tempo guardado. */
  dull: boolean;
};

export function dissolveValue(tier: ShardTier): number {
  return DISSOLVE_BY_TIER[tier] ?? 20;
}


export function shardStacks(s: HuntState = state): ShardStack[] {
  const now = Date.now();
  const map = new Map<string, ShardStack>();
  for (const sh of s.shards) {
    const shine = shineFactor(sh.at, now);
    const value = shardDissolveValue(sh, now);
    const cur = map.get(sh.key);
    if (cur) {
      cur.count += 1;
      cur.ids.push(sh.id);
      // A pilha mostra o fragmento mais desbotado (o primeiro a ser dissolvido).
      if (shine < cur.shine) {
        cur.shine = shine;
        cur.dissolveValue = value;
      }
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
        dissolveValue: value,
        shine,
        dull: false,
      });
    }
  }
  const out = [...map.values()];
  for (const st of out) {
    st.missing = Math.max(0, SHARDS_PER_FORGE - st.count);
    st.ready = st.count >= SHARDS_PER_FORGE;
    st.dull = st.shine < 1;
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
  // Inventário cheio: nada cai até você forjar, fundir ou dissolver.
  if (shardSlotsLeft() <= 0) return null;
  const base = 0.09;
  const streakBonus = Math.min(0.08, opts.runStreak * 0.01);
  const enemyBonus = opts.isEnemy ? 0.05 : 0;
  if (Math.random() > base + streakBonus + enemyBonus) return null;

  const pick = weightedPick(await candidatePool());
  if (!pick) return null;

  const shard = makeShard(pick);
  state.shards = [shard, ...state.shards].slice(0, SHARD_CAP);
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
  | { ok: true; stack: ShardStack; variant: ForgeVariant | null }
  | { ok: false; error: "no_shard" | "incomplete" | "owned" | "insufficient" };

/**
 * Forja o cosmético consumindo 3 fragmentos + 150 Arlys ✦.
 * Fragmentos extras do mesmo cosmético continuam no inventário.
 * Há chance de FORJA CRÍTICA: o item nasce numa variante áurea ou platina.
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

  const roll = Math.random();
  const variant: ForgeVariant | null =
    roll < PLATINA_FORGE_CHANCE
      ? "platina"
      : roll < PLATINA_FORGE_CHANCE + CRIT_FORGE_CHANCE
        ? "aurea"
        : null;
  if (variant) {
    state.variants = { ...state.variants, [key]: variant };
  }

  pushLog({
    at: Date.now(),
    tone: "forge",
    label: variant ? `${stack.name} · ${VARIANT_META[variant].label}` : stack.name,
    detail: variant
      ? `Forja crítica! Variante ${VARIANT_META[variant].label} conquistada.`
      : `Forjado por ${SHARDS_PER_FORGE} fragmentos + ${FORGE_ARLYS_COST} ✦ — equipe no seu perfil.`,
  });
  return { ok: true, stack, variant };
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

/** Credita Arlys de dissolução respeitando o teto semanal. */
async function payDissolve(value: number): Promise<{ paid: number; capped: number }> {
  const left = dissolveLeft();
  const paid = Math.max(0, Math.min(value, left));
  if (paid > 0) {
    await earn(paid, "shard.dissolve");
    state.dissolveWeek = {
      week: weekKey(),
      arlys: (state.dissolveWeek?.week === weekKey() ? state.dissolveWeek.arlys : 0) + paid,
    };
  }
  return { paid, capped: value - paid };
}

export type DissolveResult = { paid: number; capped: number };

/** Dissolve 1 fragmento em Arlys (sempre o mais desbotado da pilha). */
export async function dissolveShard(key: string): Promise<DissolveResult> {
  const rows = state.shards.filter((s) => s.key === key);
  if (rows.length === 0) return { paid: 0, capped: 0 };
  // O fragmento mais antigo (menos brilhante) sai primeiro.
  const target = rows.reduce((a, b) => (a.at <= b.at ? a : b));
  const value = shardDissolveValue(target);
  state.shards = state.shards.filter((s) => s.id !== target.id);
  const res = await payDissolve(value);
  pushLog({
    at: Date.now(),
    tone: "dissolve",
    label: `+${res.paid} ✦`,
    detail: res.capped
      ? `Fragmento de ${target.name} dissolvido — teto semanal atingido (${res.capped} ✦ perdidos).`
      : `Fragmento de ${target.name} dissolvido.`,
  });
  return res;
}

/** Dissolve todos os fragmentos de um cosmético. */
export async function dissolveAll(key: string): Promise<number> {
  const rows = state.shards.filter((s) => s.key === key);
  if (rows.length === 0) return 0;
  const value = rows.reduce((a, s) => a + shardDissolveValue(s), 0);
  state.shards = state.shards.filter((s) => s.key !== key);
  const res = await payDissolve(value);
  pushLog({
    at: Date.now(),
    tone: "dissolve",
    label: `+${res.paid} ✦`,
    detail: res.capped
      ? `${rows.length} fragmento(s) de ${rows[0].name} dissolvido(s) — teto semanal atingido.`
      : `${rows.length} fragmento(s) de ${rows[0].name} dissolvido(s).`,
  });
  return res.paid;
}

// ---- Fusão -----------------------------------------------------------

export type FusionTarget = {
  key: string;
  name: string;
  slot: string;
  price: number;
  accent: string;
  tier: ShardTier;
};

/**
 * Cosméticos que podem ser escolhidos como alvo de uma fusão daquela raridade.
 */
export async function fusionTargets(tier: ShardTier): Promise<FusionTarget[]> {
  const pool = await candidatePool();
  return pool
    .filter((c) => c.tier === tier)
    .map((c) => ({
      key: c.key,
      name: c.name,
      slot: c.slot,
      price: c.price,
      accent: c.accent,
      tier: c.tier,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Fragmentos de cosméticos DIFERENTES disponíveis para fundir, por raridade. */
export function fusionPool(tier: ShardTier, s: HuntState = state): ShardStack[] {
  return shardStacks(s).filter((st) => st.tier === tier);
}

export type FusionResult =
  | { ok: true; shard: Shard }
  | { ok: false; error: "need_three" | "same_item" | "mixed_tier" | "no_shard" | "bad_target" };

/**
 * Funde 3 fragmentos de cosméticos DIFERENTES da MESMA raridade em 1 fragmento
 * de um cosmético escolhido por você (mesma raridade).
 */
export async function fuseShards(
  keys: string[],
  targetKey: string,
): Promise<FusionResult> {
  const unique = [...new Set(keys)];
  if (unique.length !== FUSION_INPUT) {
    return { ok: false, error: unique.length < keys.length ? "same_item" : "need_three" };
  }

  const picked: Shard[] = [];
  for (const k of unique) {
    const rows = state.shards.filter(
      (s) => s.key === k && !picked.some((p) => p.id === s.id),
    );
    if (rows.length === 0) return { ok: false, error: "no_shard" };
    picked.push(rows.reduce((a, b) => (a.at <= b.at ? a : b)));
  }
  const tier = picked[0].tier;
  if (picked.some((p) => p.tier !== tier)) return { ok: false, error: "mixed_tier" };

  const targets = await fusionTargets(tier);
  const target = targets.find((t) => t.key === targetKey);
  if (!target) return { ok: false, error: "bad_target" };

  const ids = new Set(picked.map((p) => p.id));
  const shard = makeShard(target);
  state.shards = [shard, ...state.shards.filter((s) => !ids.has(s.id))].slice(
    0,
    SHARD_CAP,
  );
  pushLog({
    at: shard.at,
    tone: "reroll",
    label: `Fusão → ${shard.name}`,
    detail: `${FUSION_INPUT} fragmentos ${TIER_META[tier].label.toLowerCase()}s fundidos no fragmento escolhido.`,
  });
  return { ok: true, shard };
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
  state.shards = [full, ...state.shards].slice(0, SHARD_CAP);
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
  state.shards = [full, ...state.shards].slice(0, SHARD_CAP);
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
