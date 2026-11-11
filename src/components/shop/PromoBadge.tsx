import type { ShopPromo } from "@/lib/shop-promo";

export function PromoBadge({ promo }: { promo: ShopPromo }) {
  const black = promo.type === "black";
  return (
    <span
      className={`ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
        black
          ? "border-primary/60 bg-background text-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.6)]"
          : "border-primary/30 bg-primary/15 text-primary"
      }`}
    >
      {black ? "Black Friday" : "Promo"} -{promo.pct}%
    </span>
  );
}

export function PromoStrike({ promo }: { promo: ShopPromo }) {
  return <span className="mr-0.5 text-[11px] font-medium text-muted-foreground line-through tabular-nums">{promo.original}</span>;
}
