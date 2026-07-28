// Loja airi ✦ — catálogo de decks pagos, packs, cosméticos e power-ups.
import { supabase } from "@/integrations/supabase/client";
import { getWallet, spend, grantCosmetic, grantPowerup } from "@/lib/wallet-store";
import { importPublishedDeck, type PublishedDeckRow } from "@/lib/marketplace";
import { markFirstBundlePurchased } from "@/lib/daily-challenges";

export type ShopKind = "pack" | "cosmetic" | "powerup" | "bundle";

export type ShopItem = {
  id: string;
  kind: ShopKind;
  name: string;
  description: string;
  price: number;
  payload: Record<string, unknown>;
  icon: string;
  accent: string;
  active: boolean;
  sort_order: number;
};

export async function listShopItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as unknown as ShopItem[];
}

// Admin-only: returns every item, active or not.
export async function listAllShopItems(): Promise<ShopItem[]> {
  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as unknown as ShopItem[];
}

export async function updateShopItem(
  id: string,
  patch: Partial<Pick<ShopItem, "active" | "sort_order" | "price" | "name" | "description">>,
): Promise<void> {
  const { error } = await supabase
    .from("shop_items")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteShopItem(id: string): Promise<void> {
  const { error } = await supabase.from("shop_items").delete().eq("id", id);
  if (error) throw error;
}

export async function listMyPurchases(profileId: string) {
  const { data } = await supabase
    .from("shop_purchases")
    .select("*")
    .eq("buyer_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as Array<{
    id: string;
    buyer_profile_id: string;
    item_kind: string;
    item_id: string | null;
    deck_id: string | null;
    price_paid: number;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
}

export type BuyResult =
  | { ok: true; kind: ShopKind | "deck"; message: string; deckId?: string }
  | { ok: false; reason: "insufficient" | "already_owned" | "error" };

async function logPurchase(row: {
  buyer_profile_id: string;
  item_kind: string;
  item_id?: string | null;
  deck_id?: string | null;
  price_paid: number;
  payload?: Record<string, unknown>;
}) {
  await supabase.from("shop_purchases").insert(row as never);
}

export async function buyShopItem(profileId: string, item: ShopItem): Promise<BuyResult> {
  const wallet = getWallet();

  if (item.kind === "cosmetic") {
    const key = String(item.payload.key ?? item.id);
    const slot = String(item.payload.slot ?? "cosmetic");
    const full = `${slot}:${key}`;
    if (wallet.cosmetics.includes(full)) return { ok: false, reason: "already_owned" };
  }

  if (wallet.crystals < item.price) return { ok: false, reason: "insufficient" };
  const ok = await spend(item.price);
  if (!ok) return { ok: false, reason: "insufficient" };

  try {
    if (item.kind === "cosmetic") {
      const key = String(item.payload.key ?? item.id);
      const slot = String(item.payload.slot ?? "cosmetic");
      await grantCosmetic(`${slot}:${key}`);
    } else if (item.kind === "powerup") {
      const effect = String(item.payload.effect ?? item.id);
      const uses = Number(item.payload.uses ?? 1) || 1;
      await grantPowerup(effect, uses);
    } else if (item.kind === "bundle") {
      // Grant every contained item at once — bundle price is charged once above.
      const contained = await getBundleContents(item);
      for (const child of contained) {
        try {
          if (child.kind === "cosmetic") {
            const key = String(child.payload.key ?? child.id);
            const slot = String(child.payload.slot ?? "cosmetic");
            const full = `${slot}:${key}`;
            // Skip cosmetics already owned so nothing breaks
            const w = getWallet();
            if (!w.cosmetics.includes(full)) await grantCosmetic(full);
          } else if (child.kind === "powerup") {
            const effect = String(child.payload.effect ?? child.id);
            const uses = Number(child.payload.uses ?? 1) || 1;
            await grantPowerup(effect, uses);
          }
        } catch {
          // best-effort per child
        }
      }
      // A jornada de boas-vindas encerra com a primeira compra de bundle.
      markFirstBundlePurchased();
    }
    await logPurchase({
      buyer_profile_id: profileId,
      item_kind: item.kind,
      item_id: item.id,
      price_paid: item.price,
      payload: item.payload,
    });
    return {
      ok: true,
      kind: item.kind,
      message:
        item.kind === "pack"
          ? "Pack liberado — em breve na sua biblioteca."
          : item.kind === "cosmetic"
            ? "Item cosmético desbloqueado."
            : item.kind === "bundle"
              ? "Bundle desbloqueado — todos os itens já estão no seu inventário."
              : "Power-up adicionado ao inventário.",
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/* --------------------------- Bundle helpers --------------------------- */

export function bundleItemIds(item: ShopItem): string[] {
  const arr = (item.payload as { items?: unknown })?.items;
  return Array.isArray(arr) ? (arr as unknown[]).map((x) => String(x)).filter(Boolean) : [];
}

export async function getBundleContents(item: ShopItem): Promise<ShopItem[]> {
  const ids = bundleItemIds(item);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("shop_items")
    .select("*")
    .in("id", ids);
  if (error || !data) return [];
  const map = new Map<string, ShopItem>();
  (data as unknown as ShopItem[]).forEach((r) => map.set(r.id, r));
  // Preserve the admin-defined order
  return ids.map((id) => map.get(id)).filter((x): x is ShopItem => Boolean(x));
}

export async function createShopBundle(input: {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  icon?: string;
  accent?: string;
  sort_order?: number;
}): Promise<ShopItem> {
  const row = {
    id: input.id,
    kind: "bundle",
    name: input.name,
    description: input.description,
    price: Math.max(0, Math.round(input.price)),
    payload: { items: input.items },
    icon: input.icon ?? "crown",
    accent: input.accent ?? "lavender",
    active: true,
    sort_order: input.sort_order ?? 0,
  };
  const { data, error } = await supabase
    .from("shop_items")
    .insert(row as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ShopItem;
}

export async function updateShopBundle(
  id: string,
  patch: {
    name?: string;
    description?: string;
    price?: number;
    items?: string[];
    icon?: string;
    accent?: string;
    active?: boolean;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price));
  if (patch.icon !== undefined) row.icon = patch.icon;
  if (patch.accent !== undefined) row.accent = patch.accent;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.items !== undefined) row.payload = { items: patch.items };
  const { error } = await supabase.from("shop_items").update(row as never).eq("id", id);
  if (error) throw error;
}

export async function buyPublishedDeck(
  profileId: string,
  deck: PublishedDeckRow,
): Promise<BuyResult> {
  if (deck.owner_profile_id === profileId) {
    // Owner "buys" own deck = free import
    const id = await importPublishedDeck(deck);
    return { ok: true, kind: "deck", message: "Deck importado.", deckId: id };
  }
  const wallet = getWallet();
  if (deck.price > 0) {
    if (wallet.crystals < deck.price) return { ok: false, reason: "insufficient" };
    const ok = await spend(deck.price);
    if (!ok) return { ok: false, reason: "insufficient" };
  }
  try {
    const newId = await importPublishedDeck(deck);
    await logPurchase({
      buyer_profile_id: profileId,
      item_kind: "deck",
      item_id: null,
      deck_id: deck.id,
      price_paid: deck.price ?? 0,
      payload: { deck_name: deck.name, owner: deck.owner_name },
    });
    return {
      ok: true,
      kind: "deck",
      deckId: newId,
      message: deck.price > 0 ? "Deck adquirido!" : "Deck importado.",
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
