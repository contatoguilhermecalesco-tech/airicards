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
