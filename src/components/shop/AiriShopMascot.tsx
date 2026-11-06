import seller from "@/assets/airi-emotes/airi-shop-seller.png";
import broke from "@/assets/airi-emotes/airi-shop-broke.png";
import success from "@/assets/airi-emotes/airi-shop-success.png";
import { missingArlys, resolveAiriShopMood } from "@/lib/airi-shop-mood";

export const AIRI_SHOP_EMOTES = { seller, broke, success };

export function AiriShopMascot({ balance }: { balance: number }) {
  const mood = resolveAiriShopMood(balance);
  return (
    <section aria-label="Airi vendedora" className="mb-4 flex min-w-0 items-center gap-3 border-y border-shop-gold/20 py-3 sm:gap-5">
      <img src={mood === "broke" ? broke : seller} alt={mood === "broke" ? "Airi mostrando os bolsos vazios" : "Airi vendedora com olhos de cristal"} className="h-28 w-28 shrink-0 object-contain sm:h-36 sm:w-36" />
      <div className="min-w-0 max-w-md">
        <p className="text-xs font-semibold text-shop-gold-bright">Airi · Vendedora misteriosa</p>
        <p className="mt-1 text-base font-semibold leading-snug text-foreground sm:text-lg">
          {mood === "broke" ? "Até a mariposa fugiu do bolso…" : mood === "seller" ? "Esses Arlys estão pedindo um novo look!" : "Só olhando? Eu também dizia isso…"}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {mood === "broke" ? "Mais uns desafios e a gente volta às compras." : mood === "seller" ? "Pode escolher. Eu prometo não olhar seu saldo… muito." : "Vou guardar as melhores peças por aqui."}
        </p>
      </div>
    </section>
  );
}

export function AiriShopFundsNotice({ balance, price }: { balance: number; price: number }) {
  const missing = missingArlys(balance, price);
  if (missing === 0) return null;
  return (
    <div role="status" className="flex items-center gap-3 px-4 py-2">
      <img src={broke} alt="Airi com os bolsos vazios" className="h-20 w-20 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Meu bolso fez eco…</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Faltam {missing} ✦ para essa compra.</p>
      </div>
    </div>
  );
}