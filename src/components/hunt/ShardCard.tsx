// Cartões do inventário da Forja no estilo "cofre de espólios": moldura hextech
// com cantos chanfrados, faixa de raridade, contador de pilha e ações douradas.
import { Hammer, Recycle, Shuffle, Gift } from "lucide-react";
import { ShardArt } from "@/components/hunt/ShardArt";
import {
  SHARDS_PER_FORGE,
  FORGE_ARLYS_COST,
  TIER_META,
  SLOT_LABEL,
  type ShardStack,
} from "@/lib/relic-hunt";

const GOLD = "#c8aa6e";
const GOLD_SOFT = "#f0e6d2";

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

/** Painel de arte com moldura chanfrada, faixa de raridade e contador de pilha. */
function LootArt({
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
  return (
    <span
      className="loot-clip relative block w-full overflow-hidden border"
      style={{
        height,
        borderColor: st.ready ? `${color}88` : "rgba(255,255,255,0.10)",
        background: `radial-gradient(90% 80% at 50% 12%, ${color}26, transparent 70%), linear-gradient(180deg, rgba(9,13,20,0.92), rgba(4,6,10,0.96))`,
      }}
    >
      <span aria-hidden className="loot-hexgrid absolute inset-0 opacity-50" />
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
      <span
        className="absolute left-0 top-0 px-2 py-[3px] loot-label"
        style={{ background: "rgba(3,5,9,0.82)", color: GOLD_SOFT }}
      >
        {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE}
      </span>
      {st.count > SHARDS_PER_FORGE && (
        <span
          className="absolute right-0 top-0 px-2 py-[3px] text-[11px] font-bold tabular-nums"
          style={{ background: "rgba(3,5,9,0.82)", color: GOLD }}
        >
          ×{st.count}
        </span>
      )}

      {/* faixa de raridade */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${color}33, ${color}, ${color}33)` }}
      />
      {st.ready && (
        <span
          className="absolute inset-x-0 bottom-[3px] py-1 text-center loot-label"
          style={{ background: `${color}d9`, color: "#0a0c12" }}
        >
          Pronto
        </span>
      )}
    </span>
  );
}

/** Botão de ação com a linguagem dourada do cofre. */
function LootButton({
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
      className={`tap-target loot-clip-sm flex min-w-0 items-center justify-center gap-1.5 border px-3 py-2 loot-label transition disabled:opacity-35 ${className}`}
      style={{
        borderColor: primary ? GOLD : "rgba(200,170,110,0.35)",
        color: primary ? "#0a0c12" : GOLD_SOFT,
        background: primary
          ? `linear-gradient(180deg, ${GOLD_SOFT}, ${GOLD})`
          : "rgba(200,170,110,0.10)",
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function TierTag({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex loot-label px-1.5 py-[2px]"
      style={{ color, border: `1px solid ${color}55`, background: `${color}16` }}
    >
      {label}
    </span>
  );
}

/** Card completo (visão Detalhado) — painel de espólio com todas as ações. */
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
      className="loot-clip relative border p-3"
      style={{
        borderColor: st.ready ? `${tier.color}66` : "rgba(200,170,110,0.20)",
        background:
          "linear-gradient(170deg, rgba(14,19,28,0.95), rgba(5,7,12,0.97))",
      }}
    >
      <LootArt st={st} color={tier.color} height={150} artSize={92} />

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
        <span className="font-bold tabular-nums" style={{ color: GOLD }}>
          {FORGE_ARLYS_COST} ✦
        </span>
      </div>

      <LootButton
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
        <LootButton
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
        <LootButton
          icon={Gift}
          label="Enviar"
          disabled={disabled || !canGift}
          title={canGift ? "Enviar 1 fragmento" : "Entre com seu perfil para presentear"}
          onClick={() => onGift(st)}
        />
        <LootButton
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

/** Tile do cofre (visão Grade). */
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
      className="loot-clip relative border p-2.5"
      style={{
        borderColor: st.ready ? `${tier.color}66` : "rgba(200,170,110,0.18)",
        background: "linear-gradient(170deg, rgba(14,19,28,0.94), rgba(5,7,12,0.97))",
      }}
    >
      <LootArt st={st} color={tier.color} height={122} artSize={80} />

      <p className="mt-2 truncate text-[12.5px] font-bold tracking-tight">{st.name}</p>
      <p
        className="truncate loot-label mt-0.5"
        style={{ color: tier.color, opacity: 0.85 }}
      >
        {tier.label}
      </p>

      <div className="mt-2 flex gap-1.5">
        <LootButton
          className="flex-1"
          icon={Hammer}
          primary={st.ready && affordable}
          disabled={disabled || !st.ready}
          label={st.ready ? "Forjar" : `Faltam ${st.missing}`}
          onClick={() => onForge(st)}
        />
        <button
          type="button"
          disabled={disabled || !canGift}
          onClick={() => onGift(st)}
          aria-label={`Presentear fragmento de ${st.name}`}
          title="Enviar de presente"
          className="tap-target loot-clip-sm grid h-9 w-9 shrink-0 place-items-center border disabled:opacity-30"
          style={{
            borderColor: "rgba(200,170,110,0.35)",
            background: "rgba(200,170,110,0.10)",
            color: GOLD_SOFT,
          }}
        >
          <Gift className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Linha do cofre (visão Lista). */
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
      className="loot-clip-sm flex items-center gap-3 border px-3 py-2.5"
      style={{
        borderColor: st.ready ? `${tier.color}55` : "rgba(200,170,110,0.16)",
        background: "linear-gradient(180deg, rgba(13,18,27,0.9), rgba(5,7,12,0.94))",
      }}
    >
      <span
        className="loot-clip-sm relative grid h-12 w-12 shrink-0 place-items-center border"
        style={{
          borderColor: `${tier.color}44`,
          background: `radial-gradient(circle at 50% 40%, ${tier.color}22, transparent 72%)`,
        }}
      >
        <ShardArt
          cosmeticKey={st.key}
          accent={st.accent}
          tierColor={tier.color}
          size={36}
          complete={st.ready}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: tier.color }}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold tracking-tight">
            {st.name}
          </span>
          <TierTag color={tier.color} label={tier.label} />
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span className="h-[3px] w-24 overflow-hidden bg-white/10">
            <span
              className="block h-full"
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

      <LootButton
        className="hidden shrink-0 sm:flex"
        icon={Hammer}
        primary={st.ready && affordable}
        disabled={disabled || !st.ready}
        label={st.ready ? "Forjar" : `Faltam ${st.missing}`}
        onClick={() => onForge(st)}
      />
      <button
        type="button"
        disabled={disabled || !st.ready}
        onClick={() => onForge(st)}
        aria-label={`Forjar ${st.name}`}
        className="tap-target loot-clip-sm grid h-9 w-9 shrink-0 place-items-center border disabled:opacity-30 sm:hidden"
        style={{
          borderColor: "rgba(200,170,110,0.35)",
          background: "rgba(200,170,110,0.10)",
          color: GOLD_SOFT,
        }}
      >
        <Hammer className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={disabled || !canGift}
        onClick={() => onGift(st)}
        aria-label={`Presentear fragmento de ${st.name}`}
        title="Enviar de presente"
        className="tap-target loot-clip-sm grid h-9 w-9 shrink-0 place-items-center border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        style={{
          borderColor: "rgba(200,170,110,0.25)",
          background: "rgba(200,170,110,0.07)",
        }}
      >
        <Gift className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
