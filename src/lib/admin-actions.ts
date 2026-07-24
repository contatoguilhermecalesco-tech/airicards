// Admin helpers — operações diretas em wallets e duels para o painel /admin.
// RLS das tabelas é aberto entre os dois perfis do app, então isso roda no client.
import { supabase } from "@/integrations/supabase/client";
import { PROFILES } from "@/lib/profile";

const anySb = supabase as any;

export type WalletSummary = {
  profileId: string;
  crystals: number;
};

export async function adminFetchWallets(): Promise<WalletSummary[]> {
  const { data } = await anySb
    .from("wallets")
    .select("profile_id, crystals");
  const rows = (data ?? []) as Array<{ profile_id: string; crystals: number }>;
  return PROFILES.map((p) => {
    const found = rows.find((r) => r.profile_id === p.id);
    return { profileId: p.id, crystals: found?.crystals ?? 0 };
  });
}

async function ensureWallet(profileId: string): Promise<number> {
  const { data } = await anySb
    .from("wallets")
    .select("crystals")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (data) return (data as { crystals: number }).crystals ?? 0;
  await anySb.from("wallets").insert({
    profile_id: profileId,
    crystals: 0,
    inventory: { cosmetics: [], powerups: {} },
  });
  return 0;
}

export async function adminGrantArlys(profileId: string, delta: number): Promise<number> {
  const current = await ensureWallet(profileId);
  const next = Math.max(0, current + Math.floor(delta));
  await anySb.from("wallets").update({ crystals: next }).eq("profile_id", profileId);
  return next;
}

export async function adminSetArlys(profileId: string, amount: number): Promise<number> {
  await ensureWallet(profileId);
  const next = Math.max(0, Math.floor(amount));
  await anySb.from("wallets").update({ crystals: next }).eq("profile_id", profileId);
  return next;
}

// ------------------ Duelos ------------------

export type AdminDuelRow = {
  id: string;
  weekKey: string;
  deckName: string;
  createdBy: string;
  status: "active" | "completed";
  winner: string | null;
  forfeitBy: string | null;
  expiresAt: string;
  createdAt: string;
};

export async function adminFetchActiveDuels(): Promise<AdminDuelRow[]> {
  const { data } = await anySb
    .from("duels")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    weekKey: row.week_key,
    deckName: row.deck_name,
    createdBy: row.created_by,
    status: row.status,
    winner: row.winner,
    forfeitBy: row.forfeit_by ?? null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

/**
 * Força o encerramento de um duelo ativo.
 * winner: id do vencedor, ou null para empate/cancelado.
 * forfeitBy: opcional — quem levou WO.
 */
export async function adminForceEndDuel(
  duelId: string,
  winner: string | null,
  forfeitBy: string | null = null,
): Promise<void> {
  await anySb
    .from("duels")
    .update({
      status: "completed",
      winner,
      forfeit_by: forfeitBy,
      completed_at: new Date().toISOString(),
    })
    .eq("id", duelId);
}

export async function adminCancelDuel(duelId: string): Promise<void> {
  // Cancela sem vencedor.
  await adminForceEndDuel(duelId, null, null);
}
