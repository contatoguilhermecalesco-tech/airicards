// Server functions para operações de admin.
// Cada função exige sessão autenticada, valida `is_admin()` no banco e só então
// carrega `supabaseAdmin` (service role) para escrever em wallets ou duelos de
// OUTROS perfis (o que a RLS bloqueia para o cliente normal).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabaseClient: unknown) {
  const client = supabaseClient as {
    rpc: (
      name: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data, error } = await client.rpc("is_admin");
  if (error || data !== true) {
    throw new Error("Forbidden: caller is not admin");
  }
}

export type WalletRow = { profile_id: string; crystals: number };

export const adminFetchWalletsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WalletRow[]> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("wallets")
      .select("profile_id, crystals");
    if (error) throw error;
    return (data ?? []) as WalletRow[];
  });

const grantSchema = z.object({
  profileId: z.string().min(1).max(64),
  delta: z.number().int().gte(-1_000_000).lte(1_000_000),
});

export const adminGrantArlysFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => grantSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ crystals: number }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: existing } = await supabaseAdmin
      .from("wallets")
      .select("crystals")
      .eq("profile_id", data.profileId)
      .maybeSingle();
    let current = 0;
    if (!existing) {
      await supabaseAdmin.from("wallets").insert({
        profile_id: data.profileId,
        crystals: 0,
        inventory: { cosmetics: [], powerups: {} },
      });
    } else {
      current = (existing as { crystals: number }).crystals ?? 0;
    }
    const next = Math.max(0, current + Math.floor(data.delta));
    await supabaseAdmin
      .from("wallets")
      .update({ crystals: next })
      .eq("profile_id", data.profileId);
    return { crystals: next };
  });

const setSchema = z.object({
  profileId: z.string().min(1).max(64),
  amount: z.number().int().gte(0).lte(10_000_000),
});

export const adminSetArlysFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ crystals: number }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: existing } = await supabaseAdmin
      .from("wallets")
      .select("crystals")
      .eq("profile_id", data.profileId)
      .maybeSingle();
    if (!existing) {
      await supabaseAdmin.from("wallets").insert({
        profile_id: data.profileId,
        crystals: 0,
        inventory: { cosmetics: [], powerups: {} },
      });
    }
    const next = Math.max(0, Math.floor(data.amount));
    await supabaseAdmin
      .from("wallets")
      .update({ crystals: next })
      .eq("profile_id", data.profileId);
    return { crystals: next };
  });

export type AdminDuelRawRow = {
  id: string;
  week_key: string;
  deck_name: string;
  created_by: string;
  status: string;
  winner: string | null;
  forfeit_by: string | null;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
};

export const adminFetchActiveDuelsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDuelRawRow[]> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("duels")
      .select(
        "id, week_key, deck_name, created_by, status, winner, forfeit_by, expires_at, created_at, completed_at",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminDuelRawRow[];
  });

const forceEndSchema = z.object({
  duelId: z.string().uuid(),
  winner: z.string().min(1).max(64).nullable(),
  forfeitBy: z.string().min(1).max(64).nullable().optional(),
});

export const adminForceEndDuelFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => forceEndSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("duels")
      .update({
        status: "completed",
        winner: data.winner,
        forfeit_by: data.forfeitBy ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.duelId);
    if (error) throw error;
    return { ok: true as const };
  });

const setPinSchema = z.object({
  profileId: z.string().min(1).max(64),
  newPin: z.string().regex(/^\d{4,8}$/),
});

export const adminSetPinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setPinSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase);
    // O RPC set_profile_pin é SECURITY DEFINER e já valida admin/dono.
    const client = context.supabase as unknown as {
      rpc: (
        name: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;
    };
    const { error } = await client.rpc("set_profile_pin", {
      _profile_id: data.profileId,
      _new_pin: data.newPin,
    });
    if (error) throw error;
    return { ok: true as const };
  });

const unlinkSchema = z.object({
  profileId: z.string().min(1).max(64),
});

export const adminUnlinkProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => unlinkSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("app_profiles")
      .update({ auth_user_id: null, pin_hash: null })
      .eq("id", data.profileId);
    if (error) throw error;
    return { ok: true as const };
  });

const resetSchema = z.object({ profileId: z.string().min(1).max(64) });

export const adminResetHomeSessionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resetSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabaseAdmin
      .from("profile_data")
      .update({
        home_sessions: { day: today, count: 0, reviewed: 0 },
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", data.profileId);
    if (error) throw error;
    return { ok: true as const };
  });

export const adminResetExamsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resetSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("profile_data")
      .update({
        exams: { history: [], nextEligibleAt: null },
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", data.profileId);
    if (error) throw error;
    return { ok: true as const };
  });

export type ProfileSessionRow = {
  profile_id: string;
  home_sessions: {
    day?: string;
    count?: number;
    reviewed?: number;
  } | null;
};

export const adminFetchAllProfileSessionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileSessionRow[]> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("profile_data")
      .select("profile_id, home_sessions");
    if (error) throw error;
    return (data ?? []) as ProfileSessionRow[];
  });

// ---------- Backup / Import (decks + cartas) --------------------------------

const backupExportSchema = z.object({ profileId: z.string().min(1).max(64) });

export type ProfileBackup = {
  version: 1;
  exportedAt: string;
  profileId: string;
  data: unknown;
};

export const adminExportProfileDataFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => backupExportSchema.parse(input))
  .handler(async ({ data, context }): Promise<ProfileBackup> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("profile_data")
      .select("data")
      .eq("profile_id", data.profileId)
      .maybeSingle();
    if (error) throw error;
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      profileId: data.profileId,
      data: row?.data ?? { decks: [], cards: [] },
    };
  });

const backupImportSchema = z.object({
  profileId: z.string().min(1).max(64),
  // Aceita tanto o formato de export (com wrapper) quanto o payload puro.
  payload: z.unknown(),
  // Estratégia: "merge" mescla decks/cartas por id, "replace" sobrescreve.
  strategy: z.enum(["merge", "replace"]),
});

type FlashState = {
  decks: Array<{ id: string; [k: string]: unknown }>;
  cards: Array<{ id: string; [k: string]: unknown }>;
};

function coercePayload(payload: unknown): FlashState {
  const pRec = payload as Record<string, unknown> | null;
  const inner =
    pRec && typeof pRec === "object" && "data" in pRec
      ? (pRec.data as unknown)
      : payload;
  const rec = (inner ?? {}) as Record<string, unknown>;
  const decks = Array.isArray(rec.decks) ? (rec.decks as FlashState["decks"]) : [];
  const cards = Array.isArray(rec.cards) ? (rec.cards as FlashState["cards"]) : [];
  return { decks, cards };
}

export const adminImportProfileDataFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => backupImportSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ decks: number; cards: number }> => {
    await assertAdmin(context.supabase);
    const incoming = coercePayload(data.payload);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    let nextState: FlashState = incoming;
    if (data.strategy === "merge") {
      const { data: existing } = await supabaseAdmin
        .from("profile_data")
        .select("data")
        .eq("profile_id", data.profileId)
        .maybeSingle();
      const current = coercePayload(existing?.data ?? null);
      const deckMap = new Map(current.decks.map((d) => [d.id, d]));
      for (const d of incoming.decks) deckMap.set(d.id, d);
      const cardMap = new Map(current.cards.map((c) => [c.id, c]));
      for (const c of incoming.cards) cardMap.set(c.id, c);
      nextState = {
        decks: Array.from(deckMap.values()),
        cards: Array.from(cardMap.values()),
      };
    }

    const { error } = await supabaseAdmin.from("profile_data").upsert(
      {
        profile_id: data.profileId,
        data: nextState as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );
    if (error) throw error;
    return { decks: nextState.decks.length, cards: nextState.cards.length };
  });
