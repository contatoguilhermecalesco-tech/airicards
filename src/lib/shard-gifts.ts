// Presentes de fragmentos — troca de fragmentos da Forja entre os dois perfis.
// Tabela: public.shard_gifts (RLS por current_profile_id()).
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES } from "@/lib/profile";
import {
  takeShardForGift,
  receiveGiftedShard,
  restoreShard,
  type ShardTier,
} from "@/lib/relic-hunt";

export type ShardGift = {
  id: string;
  fromProfile: string;
  toProfile: string;
  shardKey: string;
  shardName: string;
  slot: string;
  price: number;
  accent: string;
  tier: ShardTier;
  note: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
};

type State = { gifts: ShardGift[]; loaded: boolean };

let state: State = { gifts: [], loaded: false };
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function mapRow(r: Record<string, unknown>): ShardGift {
  return {
    id: String(r.id),
    fromProfile: String(r.from_profile),
    toProfile: String(r.to_profile),
    shardKey: String(r.shard_key),
    shardName: String(r.shard_name),
    slot: String(r.slot ?? "cosmetic"),
    price: Number(r.price ?? 0),
    accent: String(r.accent ?? "#d8b4fe"),
    tier: (String(r.tier ?? "comum") as ShardTier),
    note: (r.note as string | null) ?? null,
    status: (String(r.status ?? "pending") as ShardGift["status"]),
    createdAt: String(r.created_at),
    respondedAt: (r.responded_at as string | null) ?? null,
  };
}

export async function fetchShardGifts(): Promise<void> {
  const { data } = await (supabase as any)
    .from("shard_gifts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);
  state = { gifts: (data ?? []).map(mapRow), loaded: true };
  emit();
}

let started = false;
export function startShardGiftsSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchShardGifts();
  supabase
    .channel("shard-gifts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shard_gifts" },
      () => {
        void fetchShardGifts();
      },
    )
    .subscribe();
}

export function useShardGiftsSync() {
  useEffect(() => {
    startShardGiftsSync();
  }, []);
}

function useGifts(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

/** Presentes pendentes recebidos por mim. */
export function useIncomingShardGifts(myId: string | undefined): ShardGift[] {
  const { gifts } = useGifts();
  if (!myId) return [];
  return gifts.filter((g) => g.toProfile === myId && g.status === "pending");
}

/** Presentes que eu enviei e ainda não foram respondidos. */
export function useOutgoingShardGifts(myId: string | undefined): ShardGift[] {
  const { gifts } = useGifts();
  if (!myId) return [];
  return gifts.filter((g) => g.fromProfile === myId && g.status === "pending");
}

export function partnerOf(myId: string): { id: string; name: string } {
  const other = PROFILES.find((p) => p.id !== myId) ?? PROFILES[0];
  return { id: other.id, name: other.name };
}

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Envia 1 fragmento do inventário local para o outro perfil. O fragmento sai
 * do inventário imediatamente e volta se o presente for recusado.
 */
export async function sendShardGift(input: {
  from: string;
  to: string;
  key: string;
  note?: string;
}): Promise<SendResult> {
  const toName = partnerOf(input.from).name;
  const shard = takeShardForGift(input.key, toName);
  if (!shard) return { ok: false, error: "Fragmento não encontrado." };

  const { error } = await (supabase as any).from("shard_gifts").insert({
    from_profile: input.from,
    to_profile: input.to,
    shard_key: shard.key,
    shard_name: shard.name,
    slot: shard.slot,
    price: shard.price,
    accent: shard.accent,
    tier: shard.tier,
    note: input.note?.trim() || null,
    status: "pending",
  });

  if (error) {
    restoreShard(shard, "Envio do presente falhou — fragmento devolvido.");
    return { ok: false, error: "Não foi possível enviar agora." };
  }
  await fetchShardGifts();
  return { ok: true };
}

/** Aceita um presente: guarda o fragmento no inventário de quem recebeu. */
export async function acceptShardGift(gift: ShardGift): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("shard_gifts")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", gift.id)
    .eq("status", "pending");
  if (error) return false;

  receiveGiftedShard(
    {
      key: gift.shardKey,
      name: gift.shardName,
      slot: gift.slot,
      price: gift.price,
      accent: gift.accent,
      tier: gift.tier,
    },
    partnerOf(gift.toProfile).name,
  );
  await fetchShardGifts();
  return true;
}

/** Recusa o presente — o fragmento fica registrado como devolvido. */
export async function declineShardGift(gift: ShardGift): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("shard_gifts")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", gift.id)
    .eq("status", "pending");
  if (error) return false;
  await fetchShardGifts();
  return true;
}
