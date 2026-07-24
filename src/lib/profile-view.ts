// Snapshot cross-perfil — busca dados públicos (wallet, rank, streak, cards)
// de outro perfil. As policies permitem SELECT para usuários autenticados.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WalletState, CosmeticSlot, EquippedMap } from "@/lib/wallet-store";
import type { RankState } from "@/lib/rank-store";
import type { Card, Streak } from "@/lib/flashcards-store";

export type ProfileSnapshot = {
  profileId: string;
  wallet: WalletState;
  rank: RankState | null;
  streak: Streak | null;
  cardsTotal: number;
  mastered: number;
  enemies: number;
  decksCount: number;
};

function normalizeWallet(row: {
  crystals: number;
  inventory: {
    cosmetics?: string[];
    equipped?: EquippedMap;
    powerups?: Record<string, number>;
    bio?: string;
  } | null;
}, id: string): WalletState {
  const inv = row.inventory ?? {};
  return {
    profileId: id,
    crystals: row.crystals ?? 0,
    cosmetics: Array.isArray(inv.cosmetics) ? inv.cosmetics : [],
    equipped: (inv.equipped && typeof inv.equipped === "object" ? inv.equipped : {}) as Partial<Record<CosmeticSlot, string>>,
    powerups: (inv.powerups && typeof inv.powerups === "object" ? inv.powerups : {}) as Record<string, number>,
    bio: typeof inv.bio === "string" ? inv.bio : "",
    loaded: true,
  };
}

export async function fetchProfileSnapshot(profileId: string): Promise<ProfileSnapshot | null> {
  const [walletRes, dataRes] = await Promise.all([
    supabase.from("wallets").select("crystals, inventory").eq("profile_id", profileId).maybeSingle(),
    supabase.from("profile_data").select("data, home_sessions, rank").eq("profile_id", profileId).maybeSingle(),
  ]);
  if (walletRes.error && dataRes.error) return null;
  const wallet = walletRes.data
    ? normalizeWallet(walletRes.data as { crystals: number; inventory: { cosmetics?: string[]; equipped?: EquippedMap; powerups?: Record<string, number>; bio?: string } | null }, profileId)
    : normalizeWallet({ crystals: 0, inventory: null }, profileId);


  const d = (dataRes.data ?? {}) as {
    data?: { decks?: unknown[]; cards?: Card[] } | null;
    home_sessions?: { streak?: Streak } | null;
    rank?: RankState | null;
  };

  const cards = (d.data?.cards ?? []) as Card[];
  let mastered = 0;
  let enemies = 0;
  for (const c of cards) {
    const lapses = c.lapses ?? 0;
    const successes = c.successes ?? 0;
    if (lapses >= 3) enemies++;
    else if (successes >= 3) mastered++;
  }

  return {
    profileId,
    wallet,
    rank: d.rank_state ?? null,
    streak: d.home_sessions?.streak ?? null,
    cardsTotal: cards.length,
    mastered,
    enemies,
    decksCount: (d.data?.decks ?? []).length,
  };
}

export function useProfileSnapshot(profileId: string | undefined): {
  snapshot: ProfileSnapshot | null;
  loading: boolean;
} {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    if (!profileId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfileSnapshot(profileId).then((s) => {
      if (!alive) return;
      setSnapshot(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [profileId]);
  return { snapshot, loading };
}
