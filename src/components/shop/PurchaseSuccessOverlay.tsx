// Confirmação escancarada de compra — takeover estilo "unlock" de LoL.
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { ArlysIcon } from "@/components/StatChip";

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

  if (!data) return null;
  const accent = data.accent ?? "#c084fc";

  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      className={`fixed inset-0 z-[90] grid place-items-center overflow-hidden px-5 transition-opacity duration-300 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(6,3,14,0.86)", backdropFilter: "blur(14px)" }}
    >
      {/* Raios de luz */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130vmax] w-[130vmax] -translate-x-1/2 -translate-y-1/2 opacity-50"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${accent}22 6deg, transparent 14deg, transparent 40deg, ${accent}18 46deg, transparent 54deg, transparent 90deg, ${accent}22 96deg, transparent 104deg, transparent 150deg, ${accent}14 156deg, transparent 164deg, transparent 220deg, ${accent}20 226deg, transparent 234deg, transparent 300deg, ${accent}16 306deg, transparent 314deg)`,
          animation: "spin 26s linear infinite",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}55, transparent 68%)` }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md text-center transition-all duration-500 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Selo */}
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 shadow-2xl"
          style={{
            borderColor: `${accent}88`,
            background: `radial-gradient(circle at 30% 25%, ${accent}55, rgba(0,0,0,0.6))`,
            boxShadow: `0 0 44px ${accent}66`,
          }}
        >
          <Check className="h-8 w-8 text-white" strokeWidth={3} />
        </div>

        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.42em]"
          style={{ color: accent }}
        >
          Compra concluída
        </p>

        {data.art ? (
          <div className="relative mx-auto mt-4 h-40 w-40">
            <div
              aria-hidden
              className="absolute inset-0 rounded-3xl blur-2xl"
              style={{ background: `radial-gradient(circle, ${accent}77, transparent 70%)` }}
            />
            <img
              src={data.art}
              alt=""
              className="relative h-full w-full rounded-3xl border border-white/15 object-cover shadow-2xl"
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-3xl border border-white/15"
            style={{ background: `linear-gradient(150deg, ${accent}44, rgba(0,0,0,0.35))` }}
          >
            <Sparkles className="h-10 w-10 text-white/85" strokeWidth={1.75} />
          </div>
        )}

        <h2 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-tight text-white">
          {data.name}
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">
          {data.kindLabel}
        </p>

        {data.message && (
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/65">
            {data.message}
          </p>
        )}

        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 font-semibold tabular-nums text-rose-200">
            <ArlysIcon className="h-3.5 w-3.5" strokeWidth={2.5} />−{data.price}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-semibold tabular-nums text-white/80">
            Saldo {data.balance} ✦
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl border border-white/15 bg-white/95 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
