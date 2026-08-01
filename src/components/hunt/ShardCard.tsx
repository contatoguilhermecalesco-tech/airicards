// Cartões do inventário da Forja: versão completa (grade) e versão compacta
// (prateleira horizontal estilo Spotify).
import { Hammer, Recycle, Shuffle, Check, Gift } from "lucide-react";
import { ShardArt } from "@/components/hunt/ShardArt";
import {
  SHARDS_PER_FORGE,
  FORGE_ARLYS_COST,
  TIER_META,
  SLOT_LABEL,
  type ShardStack,
} from "@/lib/relic-hunt";

export type ShardActions = {
  onForge: (s: ShardStack) => void;
  onSwap: (s: ShardStack) => void;
  onDissolve: (s: ShardStack) => void;
  onGift: (s: ShardStack) => void;
};

type CommonProps = ShardActions & {
  stack: ShardStack;
  crystals: number;
  disabled: boolean;
  rerollsLeft: number;
  canGift: boolean;
};

export function ShardCard({
  stack: st,
  crystals,
  disabled,
  rerollsLeft: left,
  canGift,
  onForge,
  onSwap,
  onDissolve,
  onGift,
}: CommonProps) {
  const tier = TIER_META[st.tier];
  const affordable = crystals >= FORGE_ARLYS_COST;
  const pct = Math.min(100, (st.count / SHARDS_PER_FORGE) * 100);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border p-4 transition ${
        st.ready ? "forge-breathe" : ""
      }`}
      style={
        {
          borderColor: st.ready ? `${tier.color}80` : `${tier.color}2e`,
          background: st.ready
            ? `radial-gradient(120% 100% at 80% 0%, ${tier.color}22, transparent 62%), linear-gradient(155deg, rgba(24,14,40,0.9), rgba(12,7,22,0.94))`
            : "linear-gradient(155deg, rgba(22,13,36,0.85), rgba(12,7,22,0.9))",
          boxShadow: st.ready ? undefined : `0 0 48px -32px ${tier.color}`,
          "--forge-glow": tier.color,
        } as React.CSSProperties
      }
    >
      {st.ready && (
        <span
          aria-hidden
          className="forge-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] opacity-25"
          style={{
            background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
          }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <span
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border"
          style={{
            borderColor: `${tier.color}33`,
            background: `radial-gradient(circle at 50% 40%, ${tier.color}26, transparent 70%)`,
          }}
        >
          <ShardArt
            cosmeticKey={st.key}
            accent={st.accent}
            tierColor={tier.color}
            size={50}
            complete={st.ready}
          />
          {st.count > SHARDS_PER_FORGE && (
            <span
              className="absolute -bottom-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: tier.color, color: "#170c26" }}
            >
              ×{st.count}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{
              color: tier.color,
              background: `${tier.color}1a`,
              border: `1px solid ${tier.color}33`,
            }}
          >
            {tier.label}
          </span>
          <p className="mt-1.5 truncate text-[16px] font-bold tracking-tight">{st.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {SLOT_LABEL[st.slot] ?? st.slot}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground/80">
            {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE} fragmentos
          </span>
          <span
            className="font-semibold"
            style={{ color: st.ready ? tier.color : undefined }}
          >
            {st.ready ? `Pronto · ${FORGE_ARLYS_COST} ✦` : `Faltam ${st.missing}`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
            }}
          />
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: SHARDS_PER_FORGE }).map((_, i) => (
            <span
              key={i}
              className="grid h-6 flex-1 place-items-center rounded-lg border"
              style={{
                borderColor: i < st.count ? tier.color : "rgba(255,255,255,0.12)",
                background: i < st.count ? `${tier.color}20` : "transparent",
              }}
            >
              {i < st.count && (
                <Check className="h-3.5 w-3.5" style={{ color: tier.color }} />
              )}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || !st.ready}
        onClick={() => onForge(st)}
        className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-40"
        style={{
          background:
            st.ready && affordable
              ? `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`
              : "rgba(255,255,255,0.06)",
          color: st.ready && affordable ? "#170c26" : undefined,
        }}
      >
        <Hammer className="h-4 w-4" />
        {!st.ready
          ? `Faltam ${st.missing} fragmento(s)`
          : affordable
            ? `Forjar por ${FORGE_ARLYS_COST} ✦`
            : `Faltam ${FORGE_ARLYS_COST - crystals} ✦`}
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <SmallAction
          icon={Shuffle}
          label="Trocar"
          hint={`(${left})`}
          disabled={disabled || left <= 0}
          title={
            left > 0
              ? `Trocar 1 fragmento por outro cosmético (${left} restantes)`
              : "Sem trocas nesta semana"
          }
          onClick={() => onSwap(st)}
        />
        <SmallAction
          icon={Gift}
          label="Presentear"
          disabled={disabled || !canGift}
          title={
            canGift
              ? "Enviar 1 fragmento de presente"
              : "Entre com seu perfil para presentear"
          }
          onClick={() => onGift(st)}
        />
        <SmallAction
          icon={Recycle}
          label="Dissolver"
          hint={`+${st.dissolveValue} ✦`}
          disabled={disabled}
          title={`Dissolver 1 fragmento por ${st.dissolveValue} ✦`}
          onClick={() => onDissolve(st)}
        />
      </div>
    </div>
  );
}

function SmallAction({
  icon: Icon,
  label,
  hint,
  disabled,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className="tap-target flex min-w-0 items-center justify-center gap-1 rounded-2xl border border-white/12 bg-white/6 px-2 py-2.5 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-30"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {hint && <span className="shrink-0 text-[10px] opacity-70">{hint}</span>}
    </button>
  );
}

/** Card compacto usado na visão em grade. */
export function ShardTile({
  stack: st,
  crystals,
  disabled,
  canGift,
  onForge,
  onGift,
}: Omit<CommonProps, "rerollsLeft" | "onSwap" | "onDissolve">) {
  const tier = TIER_META[st.tier];
  const affordable = crystals >= FORGE_ARLYS_COST;
  const pct = Math.min(100, (st.count / SHARDS_PER_FORGE) * 100);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border p-3 transition"
      style={{
        borderColor: st.ready ? `${tier.color}70` : `${tier.color}26`,
        background: st.ready
          ? `radial-gradient(120% 90% at 70% 0%, ${tier.color}22, transparent 64%), linear-gradient(160deg, rgba(24,14,40,0.92), rgba(12,7,22,0.95))`
          : "linear-gradient(160deg, rgba(22,13,36,0.85), rgba(12,7,22,0.92))",
      }}
    >

      <span
        className="relative mx-auto grid h-[104px] w-full place-items-center rounded-xl border"
        style={{
          borderColor: `${tier.color}26`,
          background: `radial-gradient(circle at 50% 40%, ${tier.color}22, transparent 72%)`,
        }}
      >
        <ShardArt
          cosmeticKey={st.key}
          accent={st.accent}
          tierColor={tier.color}
          size={78}
          complete={st.ready}
        />
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: `${tier.color}26`, color: tier.color }}
        >
          {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE}
        </span>
      </span>

      <p className="mt-2.5 truncate text-[13px] font-bold tracking-tight">{st.name}</p>
      <p className="truncate text-[10.5px] text-muted-foreground">
        {SLOT_LABEL[st.slot] ?? st.slot}
      </p>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
          }}
        />
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          disabled={disabled || !st.ready}
          onClick={() => onForge(st)}
          className="tap-target flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11.5px] font-bold transition disabled:opacity-40"
          style={{
            background:
              st.ready && affordable
                ? `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`
                : "rgba(255,255,255,0.06)",
            color: st.ready && affordable ? "#170c26" : undefined,
          }}
        >
          <Hammer className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{st.ready ? "Forjar" : `Faltam ${st.missing}`}</span>
        </button>
        <button
          type="button"
          disabled={disabled || !canGift}
          onClick={() => onGift(st)}
          aria-label={`Presentear fragmento de ${st.name}`}
          title="Enviar de presente"
          className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        >
          <Gift className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Linha compacta usada na visão em lista (igual à biblioteca). */
export function ShardRow({
  stack: st,
  crystals,
  disabled,
  canGift,
  onForge,
  onGift,
}: Omit<CommonProps, "rerollsLeft" | "onSwap" | "onDissolve">) {
  const tier = TIER_META[st.tier];
  const affordable = crystals >= FORGE_ARLYS_COST;
  const pct = Math.min(100, (st.count / SHARDS_PER_FORGE) * 100);

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
      style={{
        borderColor: st.ready ? `${tier.color}55` : "rgba(255,255,255,0.08)",
        background: st.ready ? `${tier.color}0f` : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
        style={{
          borderColor: `${tier.color}26`,
          background: `radial-gradient(circle at 50% 40%, ${tier.color}20, transparent 72%)`,
        }}
      >
        <ShardArt
          cosmeticKey={st.key}
          accent={st.accent}
          tierColor={tier.color}
          size={34}
          complete={st.ready}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold tracking-tight">
            {st.name}
          </span>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: tier.color, background: `${tier.color}1a` }}
          >
            {tier.label}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span className="h-1 w-24 overflow-hidden rounded-full bg-white/8">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
              }}
            />
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE} ·{" "}
            {SLOT_LABEL[st.slot] ?? st.slot}
          </span>
        </span>
      </span>

      <button
        type="button"
        disabled={disabled || !st.ready}
        onClick={() => onForge(st)}
        className="tap-target hidden shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition disabled:opacity-40 sm:inline-flex"
        style={{
          background:
            st.ready && affordable
              ? `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`
              : "rgba(255,255,255,0.06)",
          color: st.ready && affordable ? "#170c26" : undefined,
        }}
      >
        <Hammer className="h-3.5 w-3.5" />
        {st.ready ? "Forjar" : `Faltam ${st.missing}`}
      </button>
      <button
        type="button"
        disabled={disabled || !st.ready}
        onClick={() => onForge(st)}
        aria-label={`Forjar ${st.name}`}
        className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 disabled:opacity-30 sm:hidden"
      >
        <Hammer className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={disabled || !canGift}
        onClick={() => onGift(st)}
        aria-label={`Presentear fragmento de ${st.name}`}
        title="Enviar de presente"
        className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
      >
        <Gift className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
