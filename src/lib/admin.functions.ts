// Server functions para operações de admin.
// Cada função:
//  1. Exige sessão autenticada (middleware requireSupabaseAuth).
//  2. Valida `has_role(current_profile_id, 'admin')` no banco.
//  3. Só então carrega `supabaseAdmin` (service role) para escrever em wallets
//     ou duelos de OUTROS perfis (o que a RLS bloqueia para o cliente).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: {
  supabase: {
    rpc: (
      name: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
}) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error || data !== true) {
    throw new Error("Forbidden: caller is not admin");
  }
}

// ---- Wallets ---------------------------------------------------------------

export const adminFetchWalletsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("wallets")
      .select("profile_id, crystals");
    if (error) throw error;
    return (data ?? []) as Array<{ profile_id: string; crystals: number }>;
  });

const grantSchema = z.object({
  profileId: z.string().min(1).max(64),
  delta: z.number().int().gte(-1_000_000).lte(1_000_000),
});

export const adminGrantArlysFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => grantSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Garante wallet
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
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

// ---- Duels -----------------------------------------------------------------

export const adminFetchActiveDuelsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("duels")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Array<Record<string, unknown>>;
  });

const forceEndSchema = z.object({
  duelId: z.string().uuid(),
  winner: z.string().min(1).max(64).nullable(),
  forfeitBy: z.string().min(1).max(64).nullable().optional(),
});

export const adminForceEndDuelFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => forceEndSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

// ---- PIN reset (admin) -----------------------------------------------------

const setPinSchema = z.object({
  profileId: z.string().min(1).max(64),
  newPin: z.string().regex(/^\d{4,8}$/),
});

export const adminSetPinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setPinSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Usa o RPC set_profile_pin diretamente pelo cliente autenticado — a função
    // é SECURITY DEFINER e valida se o caller é admin ou dono.
    const { error } = await context.supabase.rpc("set_profile_pin", {
      _profile_id: data.profileId,
      _new_pin: data.newPin,
    });
    if (error) throw error;
    return { ok: true as const };
  });

// ---- Unlink profile (admin — força novo PIN + novo dispositivo) ------------

const unlinkSchema = z.object({
  profileId: z.string().min(1).max(64),
});

export const adminUnlinkProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => unlinkSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_profiles")
      .update({ auth_user_id: null, pin_hash: null })
      .eq("id", data.profileId);
    if (error) throw error;
    return { ok: true as const };
  });
