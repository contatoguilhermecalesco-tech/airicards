export type AiriShopMood = "seller" | "broke" | "welcome";

export function resolveAiriShopMood(balance: number): AiriShopMood {
  if (balance < 100) return "broke";
  if (balance >= 500) return "seller";
  return "welcome";
}

export function missingArlys(balance: number, price: number): number {
  return Math.max(0, price - balance);
}

/** Escolhe a Airi da Loja: o admin pode fixar "normal" ou "black"; "auto" segue as promoções ativas. */
export function resolveShopMascotVariant(
  mode: "auto" | "normal" | "black",
  hasBlackPromo: boolean,
): "normal" | "black" {
  if (mode === "normal" || mode === "black") return mode;
  return hasBlackPromo ? "black" : "normal";
}
