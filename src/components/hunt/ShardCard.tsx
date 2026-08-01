// Cartões do inventário da Forja na linguagem visual do airi: vidro escuro,
// cantos arredondados, acento roxo suave e detalhes por raridade.
import { Hammer, Recycle, Shuffle, Gift } from "lucide-react";
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

/** Painel de arte: vidro arredondado, halo da raridade e contador de pilha. */
function ShardPanel({
  st,
  color,
  height,
  artSize,
}: {
  st: ShardStack;
  color: string;
  height: number;
  artSize: number;
}) {
  const pct = Math.min(100, (st.count / SHARDS_PER_FORGE) * 100);
  return (
    <span
      className="relative block w-full overflow-hidden rounded-2xl border"
      style={{
        height,
        borderColor: st.ready ? `${color}55` : "rgba(255,255,255,0.08)",
        background: `radial-gradient(90% 80% at 50% 10%, ${color}22, transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
      }}
    >
      <span className="relative grid h-full w-full place-items-center">
        <ShardArt
          cosmeticKey={st.key}
          accent={st.accent}
          tierColor={color}
          size={artSize}
          complete={st.ready}
        />
      </span>

      {/* contador de pilha */}
      <span className="absolute left-2 top-2 rounded-full border border-white/12 bg-black/45 px-2 py-[2px] text-[10.5px] font-semibold tabular-nums text-foreground/85 backdrop-blur-md">
        {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE}
        {st.count > SHARDS_PER_FORGE && (
          <span style={{ color }}> ·{st.count}</span>
        )}
      </span>

      {st.ready && (
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ background: `${color}e6`, color: "#0b0710" }}
        >
          Pronto
        </span>
      )}

      {/* progresso da pilha */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/8">
        <span
          className="block h-full rounded-r-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
          }}
        />
      </span>
    </span>
  );
}

/** Botão de ação no estilo iOS do app. */
function ShardButton({
  label,
  icon: Icon,
  primary,
  disabled,
  title,
  onClick,
  className = "",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`tap-target flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${
        primary
          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.9)] hover:brightness-110"
          : "border border-white/10 bg-white/6 text-foreground/85 hover:bg-white/10"
      } ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function TierTag({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ color, border: `1px solid ${color}44`, background: `${color}14` }}
    >
      {label}
    </span>
  );
}

function IconButton({
  icon: Icon,
  label,
  disabled,
  title,
  onClick,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      className={`tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/6 text-foreground/70 transition hover:bg-white/10 hover:text-foreground disabled:opacity-35 ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/** Card completo (visão Detalhado). */
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

  return (
    <div
      className="relative rounded-3xl border bg-surface/60 p-3 backdrop-blur-xl transition hover:border-white/16"
      style={{ borderColor: st.ready ? `${tier.color}44` : "rgba(255,255,255,0.09)" }}
    >
      <ShardPanel st={st} color={tier.color} height={150} artSize={92} />

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-tight">{st.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {SLOT_LABEL[st.slot] ?? st.slot}
          </p>
        </div>
        <TierTag color={tier.color} label={tier.label} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {st.ready ? "Conjunto completo" : `Faltam ${st.missing} fragmento(s)`}
        </span>
        <span className="font-semibold tabular-nums text-primary">
          {FORGE_ARLYS_COST} ✦
        </span>
      </div>

      <ShardButton
        className="mt-3 w-full"
        icon={Hammer}
        primary={st.ready && affordable}
        disabled={disabled || !st.ready}
        label={
          !st.ready
            ? `Faltam ${st.missing}`
            : affordable
              ? "Forjar"
              : `Faltam ${FORGE_ARLYS_COST - crystals} ✦`
        }
        onClick={() => onForge(st)}
      />

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <ShardButton
          icon={Shuffle}
          label={`Trocar ${left}`}
          disabled={disabled || left <= 0}
          title={
            left > 0
              ? `Trocar 1 fragmento por outro cosmético (${left} restantes)`
              : "Sem trocas nesta semana"
          }
          onClick={() => onSwap(st)}
        />
        <ShardButton
          icon={Gift}
          label="Enviar"
          disabled={disabled || !canGift}
          title={canGift ? "Enviar 1 fragmento" : "Entre com seu perfil para presentear"}
          onClick={() => onGift(st)}
        />
        <ShardButton
          icon={Recycle}
          label={`+${st.dissolveValue}`}
          disabled={disabled}
          title={`Dissolver 1 fragmento por ${st.dissolveValue} ✦`}
          onClick={() => onDissolve(st)}
        />
      </div>
    </div>
  );
}

/** Tile (visão Grade). */
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

  return (
    <div
      className="relative rounded-3xl border bg-surface/60 p-2.5 backdrop-blur-xl transition hover:border-white/16"
      style={{ borderColor: st.ready ? `${tier.color}40` : "rgba(255,255,255,0.09)" }}
    >
      <ShardPanel st={st} color={tier.color} height={122} artSize={80} />

      <p className="mt-2 truncate text-[12.5px] font-bold tracking-tight">{st.name}</p>
      <p
        className="mt-0.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: tier.color, opacity: 0.85 }}
      >
        {tier.label}
      </p>

      <div className="mt-2 flex gap-1.5">
        <ShardButton
          className="flex-1"
          icon={Hammer}
          primary={st.ready && affordable}
          disabled={disabled || !st.ready}
          label={st.ready ? "Forjar" : `Faltam ${st.missing}`}
          onClick={() => onForge(st)}
        />
        <IconButton
          icon={Gift}
          label={`Presentear fragmento de ${st.name}`}
          title="Enviar de presente"
          disabled={disabled || !canGift}
          onClick={() => onGift(st)}
        />
      </div>
    </div>
  );
}

/** Linha (visão Lista). */
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
      className="flex items-center gap-3 rounded-2xl border bg-surface/55 px-3 py-2.5 backdrop-blur-xl transition hover:border-white/16"
      style={{ borderColor: st.ready ? `${tier.color}3d` : "rgba(255,255,255,0.08)" }}
    >
      <span
        className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
        style={{
          borderColor: `${tier.color}33`,
          background: `radial-gradient(circle at 50% 40%, ${tier.color}1f, transparent 74%)`,
        }}
      >
        <ShardArt
          cosmeticKey={st.key}
          accent={st.accent}
          tierColor={tier.color}
          size={36}
          complete={st.ready}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold tracking-tight">
            {st.name}
          </span>
          <TierTag color={tier.color} label={tier.label} />
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-[3px] w-24 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${tier.color}77, ${tier.color})`,
              }}
            />
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE} ·{" "}
            {SLOT_LABEL[st.slot] ?? st.slot}
          </span>
        </span>
      </span>

      <ShardButton
        className="hidden shrink-0 sm:flex"
        icon={Hammer}
        primary={st.ready && affordable}
        disabled={disabled || !st.ready}
        label={st.ready ? "Forjar" : `Faltam ${st.missing}`}
        onClick={() => onForge(st)}
      />
      <IconButton
        icon={Hammer}
        label={`Forjar ${st.name}`}
        disabled={disabled || !st.ready}
        onClick={() => onForge(st)}
        className="sm:hidden"
      />
      <IconButton
        icon={Gift}
        label={`Presentear fragmento de ${st.name}`}
        title="Enviar de presente"
        disabled={disabled || !canGift}
        onClick={() => onGift(st)}
      />
    </div>
  );
}
