// Reembolso de compras da loja (admin).
// Valida `is_admin()` no banco e só então usa service role para devolver Arlys,
// remover o item do inventário do comprador e apagar o registro da compra.
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
  if (error || data !== true) throw new Error("Forbidden: caller is not admin");
}

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type AdminPurchaseRow = {
  id: string;
  buyer_profile_id: string;
  item_kind: string;
  item_id: string | null;
  deck_id: string | null;
  price_paid: number;
  payload: Record<string, Json>;
  created_at: string;
  item_name: string | null;
};

export const adminListPurchasesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPurchaseRow[]> => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("shop_purchases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const rows = (data ?? []) as unknown as AdminPurchaseRow[];

    const ids = Array.from(
      new Set(rows.map((r) => r.item_id).filter(Boolean) as string[]),
    );
    let names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: items } = await supabaseAdmin
        .from("shop_items")
        .select("id, name")
        .in("id", ids);
      names = new Map(
        ((items ?? []) as Array<{ id: string; name: string }>).map((i) => [
          i.id,
          i.name,
        ]),
      );
    }
    return rows.map((r) => ({
      ...r,
      item_name: r.item_id ? (names.get(r.item_id) ?? r.item_id) : null,
    }));
  });

type Inventory = {
  cosmetics?: string[];
  equipped?: Record<string, string>;
  powerups?: Record<string, number>;
  [k: string]: unknown;
};

function removeCosmetic(inv: Inventory, full: string): Inventory {
  const cosmetics = (inv.cosmetics ?? []).filter((c) => c !== full);
  const equipped = { ...(inv.equipped ?? {}) };
  for (const [slot, value] of Object.entries(equipped)) {
    if (value === full) delete equipped[slot];
  }
  return { ...inv, cosmetics, equipped };
}

function removePowerup(inv: Inventory, effect: string, uses: number): Inventory {
  const powerups = { ...(inv.powerups ?? {}) };
  const next = (powerups[effect] ?? 0) - uses;
  if (next > 0) powerups[effect] = next;
  else delete powerups[effect];
  return { ...inv, powerups };
}

const refundSchema = z.object({
  purchaseId: z.string().uuid(),
  refundArlys: z.boolean().default(true),
  removeItems: z.boolean().default(true),
});

export const adminRefundPurchaseFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => refundSchema.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; refunded: number; profileId: string }> => {
      await assertAdmin(context.supabase);
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );

      const { data: purchase, error: pErr } = await supabaseAdmin
        .from("shop_purchases")
        .select("*")
        .eq("id", data.purchaseId)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!purchase) throw new Error("Compra não encontrada");

      const row = purchase as unknown as {
        buyer_profile_id: string;
        item_kind: string;
        item_id: string | null;
        price_paid: number;
        payload: Record<string, unknown>;
      };

      const { data: walletRow } = await supabaseAdmin
        .from("wallets")
        .select("crystals, inventory")
        .eq("profile_id", row.buyer_profile_id)
        .maybeSingle();
      if (!walletRow) throw new Error("Carteira não encontrada");

      const current = (walletRow as { crystals: number }).crystals ?? 0;
      let inv = (((walletRow as { inventory: Inventory | null }).inventory ??
        {}) as Inventory);

      if (data.removeItems) {
        const applyOne = (
          kind: string,
          id: string,
          payload: Record<string, unknown>,
        ) => {
          if (kind === "cosmetic") {
            const key = String(payload.key ?? id);
            const slot = String(payload.slot ?? "cosmetic");
            inv = removeCosmetic(inv, `${slot}:${key}`);
          } else if (kind === "powerup") {
            const effect = String(payload.effect ?? id);
            const uses = Number(payload.uses ?? 1) || 1;
            inv = removePowerup(inv, effect, uses);
          }
        };

        if (row.item_kind === "bundle") {
          const childIds = Array.isArray(
            (row.payload as { items?: unknown }).items,
          )
            ? ((row.payload as { items: unknown[] }).items.map(String))
            : [];
          if (childIds.length > 0) {
            const { data: children } = await supabaseAdmin
              .from("shop_items")
              .select("id, kind, payload")
              .in("id", childIds);
            for (const c of (children ?? []) as Array<{
              id: string;
              kind: string;
              payload: Record<string, unknown>;
            }>) {
              applyOne(c.kind, c.id, c.payload ?? {});
            }
          }
        } else if (row.item_id) {
          applyOne(row.item_kind, row.item_id, row.payload ?? {});
        }
      }

      const refunded = data.refundArlys ? Math.max(0, row.price_paid) : 0;
      const { error: wErr } = await supabaseAdmin
        .from("wallets")
        .update({
          crystals: current + refunded,
          inventory: inv as never,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", row.buyer_profile_id);
      if (wErr) throw wErr;

      const { error: dErr } = await supabaseAdmin
        .from("shop_purchases")
        .delete()
        .eq("id", data.purchaseId);
      if (dErr) throw dErr;

      return {
        ok: true as const,
        refunded,
        profileId: row.buyer_profile_id,
      };
    },
  );
