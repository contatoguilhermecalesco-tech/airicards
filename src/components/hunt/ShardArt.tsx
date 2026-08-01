// Miniatura do cosmético usada na Forja — mesma linguagem visual do toast de
// fragmento: arte real do item, em cinza quando o conjunto está incompleto.
import { getEquippedArt } from "@/lib/shop-asset-overrides";
import { ShardIcon } from "@/components/hunt/ShardDropToast";

export function ShardArt({
  cosmeticKey,
  accent,
  tierColor,
  size = 50,
  complete = false,
  badge,
}: {
  cosmeticKey: string;
  accent: string;
  tierColor: string;
  size?: number;
  complete?: boolean;
  badge?: React.ReactNode;
}) {
  const art = getEquippedArt(cosmeticKey);

  if (!art) {
    return (
      <span className="relative inline-flex">
        <ShardIcon accent={accent} tier={tierColor} size={size} />
        {badge}
      </span>
    );
  }

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40"
      style={{
        width: size,
        height: size,
        boxShadow: `inset 0 0 16px ${tierColor}26`,
      }}
    >
      <img
        src={art}
        alt=""
        aria-hidden
        className="object-contain transition-all duration-300"
        style={{
          width: size * 0.82,
          height: size * 0.82,
          filter: complete ? "none" : "grayscale(0.85) brightness(0.78)",
          opacity: complete ? 1 : 0.9,
        }}
      />
      {badge}
    </span>
  );
}
