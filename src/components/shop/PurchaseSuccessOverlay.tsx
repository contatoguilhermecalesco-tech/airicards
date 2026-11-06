// Confirmação escancarada de compra — takeover estilo "unlock" de LoL.
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ArlysIcon } from "@/components/StatChip";
import { Button } from "@/components/ui/button";
import { AIRI_SHOP_EMOTES } from "@/components/shop/AiriShopMascot";

export type PurchaseCelebration = {
  name: string;
  kindLabel: string;
  price: number;
  balance: number;
  art?: string | null;
  accent?: string;
  message?: string;
};

export function PurchaseSuccessOverlay({
  data,
  onClose,
}: {
  data: PurchaseCelebration | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!data) {
      setShown(false);
      return;
    }
    const t = setTimeout(() => setShown(true), 10);
    const auto = setTimeout(onClose, 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(auto);
    };
  }, [data, onClose]);

  useEffect(() => {
    if (!data) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Compra concluída"
      onClick={onClose}
      className={`fixed inset-0 z-[150] grid place-items-center overflow-y-auto bg-background/95 px-5 py-6 backdrop-blur-xl transition-opacity duration-300 motion-reduce:transition-none ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md text-center transition-all duration-500 motion-reduce:transition-none ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <img src={AIRI_SHOP_EMOTES.success} alt="Airi festejando sua compra com confetes" className="mx-auto h-48 w-48 object-contain sm:h-56 sm:w-56" />
        <p className="mt-3 text-2xl font-semibold text-foreground">Venda fechada!</p>

        <p
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-primary"
        >
          <Check className="h-4 w-4" /> Compra concluída
        </p>

        {data.art ? (
          <div className="relative mx-auto mt-4 h-24 w-24">
            <img
              src={data.art}
              alt=""
              className="relative h-full w-full rounded-lg border border-border object-cover shadow-lg"
            />
          </div>
        ) : null}

        <h2 className="mt-5 text-balance text-2xl font-bold leading-tight text-foreground">
          {data.name}
        </h2>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          {data.kindLabel}
        </p>

        {data.message && (
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {data.message}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 font-semibold tabular-nums text-secondary-foreground">
            <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />−{data.price}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 font-semibold tabular-nums text-secondary-foreground">
            Saldo {data.balance} ✦
          </span>
        </div>

        <Button
          onClick={onClose}
          autoFocus
          className="mt-6 w-full"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
