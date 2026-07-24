// Loja airi ✦ — catálogo de decks pagos, packs, cosméticos e power-ups.
import { supabase } from "@/integrations/supabase/client";
import { getWallet, spend, grantCosmetic, grantPowerup } from "@/lib/wallet-store";
import { importPublishedDeck, type PublishedDeckRow } from "@/lib/marketplace";

export type ShopKind = "pack" | "cosmetic" | "powerup";

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
  await supabase.from("shop_purchases").insert(row);
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
            : "Power-up adicionado ao inventário.",
    };
  } catch {
    return { ok: false, reason: "error" };
  }
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
