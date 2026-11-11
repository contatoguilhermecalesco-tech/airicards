import { describe, it, expect } from "vitest";
import { readPromo, effectivePrice } from "./shop-promo";
describe("promo", () => {
  it("black friday 900 por 550 = -39%", () => {
    expect(readPromo(900, { promo: { type: "black", price: 550 } })).toEqual({ type: "black", price: 550, original: 900, pct: 39 });
  });
  it("sem promo cobra preço padrão", () => expect(effectivePrice(900, {})).toBe(900));
  it("promo maior ou igual ao padrão é ignorada", () => expect(effectivePrice(900, { promo: { type: "discount", price: 900 } })).toBe(900));
});
