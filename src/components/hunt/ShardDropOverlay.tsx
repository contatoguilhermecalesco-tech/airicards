// Pop-up de drop — aparece na revisão quando um fragmento cai.
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import {
  TIER_META,
  SLOT_LABEL,
  SHARDS_PER_FORGE,
  FORGE_ARLYS_COST,
  shardCountFor,
  type ShardDrop,
} from "@/lib/relic-hunt";
import { ShardIcon } from "@/components/hunt/ShardDropToast";

export function ShardDropOverlay({
  drop,
  onClose,
}: {
  drop: ShardDrop;
  onClose: () => void;
}) {
  const tier = TIER_META[drop.tier];
  const [count] = useState(() => Math.min(SHARDS_PER_FORGE, shardCountFor(drop.key)));
  const missing = Math.max(0, SHARDS_PER_FORGE - count);

  useEffect(() => {
    const t = setTimeout(onClose, 6500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[92] grid place-items-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Fragmento recebido: ${drop.name}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_260ms_ease-out] bg-black/72 backdrop-blur-md"
      />

      <div
        className="luminho-pop relative w-full max-w-sm overflow-hidden rounded-3xl border p-6 text-center"
        style={{
          borderColor: `${tier.color}55`,
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(160deg, rgba(22,13,36,0.96), rgba(10,6,18,0.98))",
          boxShadow: `0 0 90px -30px ${tier.color}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="tap-target absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <p
          className="text-[11px] font-bold uppercase tracking-[0.3em]"
          style={{ color: tier.color }}
        >
          Fragmento {tier.label}
        </p>

        <div className="mt-4 grid place-items-center">
          <span
            aria-hidden
            className="luminho-halo absolute h-32 w-32 rounded-full"
            style={{ background: `radial-gradient(circle, ${tier.color}44, transparent 70%)` }}
          />
          <ShardIcon accent={drop.accent} tier={tier.color} size={104} />
        </div>

        <p className="mt-4 text-lg font-bold tracking-tight text-foreground">{drop.name}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {SLOT_LABEL[drop.slot] ?? drop.slot}
        </p>

        {/* Progresso */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {Array.from({ length: SHARDS_PER_FORGE }).map((_, i) => (
            <span
              key={i}
              className="grid h-7 w-7 place-items-center rounded-lg border"
              style={{
                borderColor: i < count ? tier.color : "rgba(255,255,255,0.14)",
                background: i < count ? `${tier.color}26` : "transparent",
              }}
            >
              {i < count && <Check className="h-4 w-4" style={{ color: tier.color }} />}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {missing === 0
            ? `Pronto para forjar por ${FORGE_ARLYS_COST} ✦`
            : `Faltam ${missing} fragmento(s) + ${FORGE_ARLYS_COST} ✦ para forjar`}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="tap-target flex-1 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-foreground"
          >
            Continuar revisão
          </button>
          <Link
            to="/forja"
            className="tap-target grid place-items-center rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{ background: `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`, color: "#170c26" }}
          >
            Ver forja
          </Link>
        </div>
      </div>
    </div>
  );
}
