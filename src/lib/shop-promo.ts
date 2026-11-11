// Promoções da loja: preço padrão riscado + selo "Desconto" ou "Black Friday".
// Guardado em shop_items.payload.promo = { type, price }.
export type PromoType = "discount" | "black";
export type ShopPromo = { type: PromoType; price: number; original: number; pct: number };

export function readPromo(basePrice: number, payload: unknown): ShopPromo | null {
  const p = (payload as { promo?: { type?: unknown; price?: unknown } } | null)?.promo;
  if (!p || (p.type !== "discount" && p.type !== "black")) return null;
  const price = Math.round(Number(p.price));
  if (!Number.isFinite(price) || price < 0 || price >= basePrice) return null;
  return { type: p.type, price, original: basePrice, pct: Math.round((1 - price / basePrice) * 100) };
}

export function effectivePrice(basePrice: number, payload: unknown): number {
  return readPromo(basePrice, payload)?.price ?? basePrice;
}
