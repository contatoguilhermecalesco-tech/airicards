export type AiriShopMood = "seller" | "broke" | "welcome";

export function resolveAiriShopMood(balance: number): AiriShopMood {
  if (balance < 100) return "broke";
  if (balance >= 500) return "seller";
  return "welcome";
}

export function missingArlys(balance: number, price: number): number {
  return Math.max(0, price - balance);
}