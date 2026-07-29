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
  lastSeenAt: string | null;
};

function normalizeWallet(row: {
  crystals: number;
  inventory: {
    cosmetics?: string[];
    equipped?: EquippedMap;
    powerups?: Record<string, number>;
    bio?: string;
    avatarUrl?: string;
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
    avatarUrl: typeof inv.avatarUrl === "string" ? inv.avatarUrl : "",
    loaded: true,
  };
}

export async function fetchProfileSnapshot(profileId: string): Promise<ProfileSnapshot | null> {
  // RPC SECURITY DEFINER: retorna apenas dados públicos do perfil (sem conteúdo
  // das cartas), permitindo que um perfil veja o outro sem afrouxar as RLS.
  const { data, error } = await supabase.rpc("get_public_profile_snapshot", {
    _profile_id: profileId,
  });
  if (error || !data) return null;

  const row = data as {
    crystals?: number;
    inventory?: {
      cosmetics?: string[];
      equipped?: EquippedMap;
      powerups?: Record<string, number>;
      bio?: string;
      avatarUrl?: string;
    } | null;
    rank?: RankState | null;
    streak?: Streak | null;
    cards_total?: number;
    mastered?: number;
    enemies?: number;
    decks_count?: number;
    updated_at?: string | null;
  };

  return {
    profileId,
    wallet: normalizeWallet(
      { crystals: row.crystals ?? 0, inventory: row.inventory ?? null },
      profileId,
    ),
    rank: row.rank ?? null,
    streak: row.streak ?? null,
    cardsTotal: row.cards_total ?? 0,
    mastered: row.mastered ?? 0,
    enemies: row.enemies ?? 0,
    decksCount: row.decks_count ?? 0,
    lastSeenAt: row.updated_at ?? null,
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
