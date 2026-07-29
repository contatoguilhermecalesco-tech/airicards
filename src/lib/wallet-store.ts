// Arlys ✦ — moeda virtual do app. Sincronizada via Supabase (tabela `wallets`).
// Foco em consistência: ganho vem de streak, rank, duelos e exames.
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileId } from "@/lib/social-store";

export type Cosmetic = string; // key identifier (e.g. "deck_frame:aurora")

export type CosmeticSlot = "nameplate" | "decoration" | "badge" | "effect" | "overlay" | "companion" | "veil" | "table";

export type EquippedMap = Partial<Record<CosmeticSlot, string>>;

export type WalletState = {
  profileId: string;
  crystals: number;
  cosmetics: string[];
  equipped: EquippedMap;
  powerups: Record<string, number>;
  bio: string;
  avatarUrl: string;
  loaded: boolean;
};

const empty = (id = ""): WalletState => ({
  profileId: id,
  crystals: 0,
  cosmetics: [],
  equipped: {},
  powerups: {},
  bio: "",
  avatarUrl: "",
  loaded: false,
});


let state: WalletState = empty();
const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

export function getWallet(): WalletState {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function subscribeWallet(cb: () => void) {
  return subscribe(cb);
}

export function useWallet(): WalletState {
  return useSyncExternalStore(subscribe, () => state, () => empty());
}

const WELCOME_BONUS = 150;

type WalletRow = {
  profile_id: string;
  crystals: number;
  inventory: {
    cosmetics?: string[];
    equipped?: EquippedMap;
    powerups?: Record<string, number>;
    bio?: string;
    avatarUrl?: string;
  } | null;
};

function normalize(row: WalletRow, profileId: string): WalletState {
  const inv = row.inventory ?? {};
  return {
    profileId,
    crystals: row.crystals ?? 0,
    cosmetics: Array.isArray(inv.cosmetics) ? inv.cosmetics : [],
    equipped: inv.equipped && typeof inv.equipped === "object" ? inv.equipped : {},
    powerups: inv.powerups && typeof inv.powerups === "object" ? inv.powerups : {},
    bio: typeof inv.bio === "string" ? inv.bio : "",
    avatarUrl: typeof inv.avatarUrl === "string" ? inv.avatarUrl : "",
    loaded: true,
  };
}


let currentProfileId: string | null = null;
let loadPromise: Promise<void> | null = null;

export async function loadWallet(profileId: string, force = false) {
  if (!force && currentProfileId === profileId && state.loaded) return;
  currentProfileId = profileId;
  loadPromise = (async () => {
    const { data } = await supabase
      .from("wallets")
      .select("profile_id, crystals, inventory")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (data) {
      state = normalize(data as unknown as WalletRow, profileId);
    } else {
      // First login: try to create wallet with welcome bonus.
      const { data: created, error: insertErr } = await supabase
        .from("wallets")
        .insert({
          profile_id: profileId,
          crystals: WELCOME_BONUS,
          inventory: { cosmetics: [], equipped: {}, powerups: {} },
        })
        .select("profile_id, crystals, inventory")
        .maybeSingle();
      if (insertErr || !created) {
        // BUGFIX: antes fingíamos que o usuário tinha WELCOME_BONUS mesmo
        // quando o insert falhava (ex.: RLS bloqueou porque o perfil ainda
        // não foi vinculado). Isso mostrava saldo fantasma. Agora paramos
        // em estado zerado e `loaded=true` só se o insert deu certo.
        if (insertErr) console.error("[airi] wallet insert failed", insertErr);
        state = empty(profileId);
      } else {
        state = normalize(created as unknown as WalletRow, profileId);
      }
    }
    emit();
  })();
  await loadPromise;
}

async function persist() {
  if (!currentProfileId) return;
  await supabase
    .from("wallets")
    .update({
      crystals: state.crystals,
      inventory: {
        cosmetics: state.cosmetics,
        equipped: state.equipped,
        powerups: state.powerups,
        bio: state.bio,
        avatarUrl: state.avatarUrl,
      },
    })
    .eq("profile_id", currentProfileId);
}

export async function setBio(bio: string) {
  if (!currentProfileId) return;
  state.bio = bio.slice(0, 180);
  emit();
  await persist();
}

export async function setAvatarUrl(dataUrl: string) {
  if (!currentProfileId) return;
  state.avatarUrl = dataUrl;
  emit();
  await persist();
}


export async function earn(amount: number, reason: string) {
  if (!currentProfileId || amount <= 0) return;
  state.crystals += Math.floor(amount);
  emit();
  emitEarnedEvent({ amount: Math.floor(amount), reason, at: Date.now() });
  await persist();
}

export async function spend(amount: number): Promise<boolean> {
  if (!currentProfileId) return false;
  if (state.crystals < amount) return false;
  state.crystals -= Math.floor(amount);
  emit();
  await persist();
  return true;
}

export async function grantCosmetic(key: string) {
  if (!currentProfileId) return;
  if (!state.cosmetics.includes(key)) {
    state.cosmetics = [...state.cosmetics, key];
    emit();
    await persist();
  }
}

// Slot dentro da chave — formato "<slot>:<id>". Aceita apenas os slots
// canônicos; qualquer outro valor cai em "effect" para não perder o item.
function slotFromKey(key: string): CosmeticSlot {
  const raw = key.split(":")[0]?.toLowerCase() ?? "";
  if (raw === "table" || raw.includes("mesa")) return "table";
  if (raw === "overlay" || raw.includes("sakura") || raw.includes("petal") || raw.includes("petala"))
    return "overlay";

  if (raw === "veil" || raw.includes("veu")) return "veil";
  if (raw === "companion" || raw.includes("kitsune") || raw.includes("pet"))
    return "companion";
  if (raw.includes("frame") || raw.includes("deck") || raw.includes("nameplate"))
    return "nameplate";
  if (raw.includes("aura") || raw.includes("decoration")) return "decoration";
  if (raw.includes("badge") || raw.includes("emblem")) return "badge";
  return "effect";
}

export function slotOf(cosmeticKey: string): CosmeticSlot {
  return slotFromKey(cosmeticKey);
}

export async function equipCosmetic(key: string) {
  if (!currentProfileId) return;
  if (!state.cosmetics.includes(key)) return;
  const slot = slotFromKey(key);
  state.equipped = { ...state.equipped, [slot]: key };
  emit();
  await persist();
}

export async function unequipSlot(slot: CosmeticSlot) {
  if (!currentProfileId) return;
  if (!state.equipped[slot]) return;
  const next = { ...state.equipped };
  delete next[slot];
  state.equipped = next;
  emit();
  await persist();
}

export async function grantPowerup(effect: string, uses = 1) {
  if (!currentProfileId) return;
  state.powerups = {
    ...state.powerups,
    [effect]: (state.powerups[effect] ?? 0) + uses,
  };
  emit();
  await persist();
}

export async function consumePowerup(effect: string): Promise<boolean> {
  if (!currentProfileId) return false;
  const cur = state.powerups[effect] ?? 0;
  if (cur <= 0) return false;
  const next = { ...state.powerups, [effect]: cur - 1 };
  if (next[effect] <= 0) delete next[effect];
  state.powerups = next;
  emit();
  await persist();
  return true;
}

// ---- earning events (UI toast) ----
export type EarnEvent = { amount: number; reason: string; at: number };
const earnListeners = new Set<(e: EarnEvent) => void>();
function emitEarnedEvent(e: EarnEvent) {
  earnListeners.forEach((l) => l(e));
}
export function onCrystalsEarned(cb: (e: EarnEvent) => void) {
  earnListeners.add(cb);
  return () => {
    earnListeners.delete(cb);
  };
}

// Convenience for external code
export function currentProfileForWallet(): string | null {
  return currentProfileId;
}

export type EarnSource =
  | { kind: "streak"; days: number }
  | { kind: "rank_division" }
  | { kind: "rank_tier" }
  | { kind: "duel_win" }
  | { kind: "exam_done"; score?: number };

export function amountFor(source: EarnSource): number {
  switch (source.kind) {
    case "streak":
      return 20 + source.days * 5;
    case "rank_division":
      return 60;
    case "rank_tier":
      return 200;
    case "duel_win":
      return 40;
    case "exam_done":
      return 120 + Math.round((source.score ?? 0) * 0.4);
  }
}

export type ProfileIdT = ProfileId;
