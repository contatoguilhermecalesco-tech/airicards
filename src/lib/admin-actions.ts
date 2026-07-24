// Wrapper thin em torno das server functions de admin.
// Mantém a mesma API que o painel /admin já consumia — as chamadas agora
// passam pela camada server que valida `is_admin()` no banco antes de tocar
// em wallets/duels com service role.
import {
  adminFetchWalletsFn,
  adminGrantArlysFn,
  adminSetArlysFn,
  adminFetchActiveDuelsFn,
  adminForceEndDuelFn,
  adminSetPinFn,
  adminUnlinkProfileFn,
} from "@/lib/admin.functions";
import { PROFILES } from "@/lib/profile";

export type WalletSummary = {
  profileId: string;
  crystals: number;
};

export async function adminFetchWallets(): Promise<WalletSummary[]> {
  const rows = await adminFetchWalletsFn();
  return PROFILES.map((p) => {
    const found = rows.find((r) => r.profile_id === p.id);
    return { profileId: p.id, crystals: found?.crystals ?? 0 };
  });
}

export async function adminGrantArlys(
  profileId: string,
  delta: number,
): Promise<number> {
  const { crystals } = await adminGrantArlysFn({
    data: { profileId, delta: Math.floor(delta) },
  });
  return crystals;
}

export async function adminSetArlys(
  profileId: string,
  amount: number,
): Promise<number> {
  const { crystals } = await adminSetArlysFn({
    data: { profileId, amount: Math.max(0, Math.floor(amount)) },
  });
  return crystals;
}

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
  const rows = await adminFetchActiveDuelsFn();
  return rows.map((r) => ({
    id: r.id,
    weekKey: r.week_key,
    deckName: r.deck_name,
    createdBy: r.created_by,
    status: r.status as "active" | "completed",
    winner: r.winner,
    forfeitBy: r.forfeit_by ?? null,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));
}

export async function adminForceEndDuel(
  duelId: string,
  winner: string | null,
  forfeitBy: string | null = null,
): Promise<void> {
  await adminForceEndDuelFn({
    data: { duelId, winner, forfeitBy },
  });
}

export async function adminCancelDuel(duelId: string): Promise<void> {
  await adminForceEndDuel(duelId, null, null);
}

// PIN management -------------------------------------------------------------

export async function adminSetProfilePin(
  profileId: string,
  newPin: string,
): Promise<void> {
  await adminSetPinFn({ data: { profileId, newPin } });
}

export async function adminUnlinkProfile(profileId: string): Promise<void> {
  await adminUnlinkProfileFn({ data: { profileId } });
}
