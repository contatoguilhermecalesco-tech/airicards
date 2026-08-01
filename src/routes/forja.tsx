import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  History,
  Hammer,
  Recycle,
  Sparkles,
  Coins,
  HelpCircle,
  Shuffle,
  X,
  Check,
  Gem,
  Flame,
  ChevronRight,
} from "lucide-react";
import {
  useHunt,
  shardStacks,
  forgeShard,
  dissolveShard,
  rerollShard,
  rerollsLeft,
  pruneOwnedShards,
  SHARDS_PER_FORGE,
  FORGE_ARLYS_COST,
  REROLL_WEEKLY_LIMIT,
  TIER_META,
  SLOT_LABEL,
  type ShardStack,
} from "@/lib/relic-hunt";
import { ShardIcon } from "@/components/hunt/ShardDropToast";
import { ForgeOverlay } from "@/components/hunt/ForgeOverlay";
import { useWallet } from "@/lib/wallet-store";
import { toast } from "sonner";

const SEEN_KEY = "airi.forja.tutorial.v2";

export const Route = createFileRoute("/forja")({
  head: () => ({
    meta: [
      { title: "Forja de Fragmentos | airi" },
      {
        name: "description",
        content:
          "Junte 3 fragmentos do mesmo cosmético nas suas revisões no airi e forje o item por 150 Arlys ✦. Troque ou dissolva fragmentos que não quiser.",
      },
      { property: "og:title", content: "Forja de Fragmentos | airi" },
      {
        property: "og:description",
        content:
          "3 fragmentos + 150 Arlys ✦ = cosmético permanente. Fragmentos caem revisando cartas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForjaPage,
});

type Filter = "todos" | "prontos" | "progresso";

function ForjaPage() {
  const hunt = useHunt();
  const wallet = useWallet();
  const [forging, setForging] = useState<ShardStack | null>(null);
  const [done, setDone] = useState(false);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");

  useEffect(() => {
    pruneOwnedShards();
  }, [wallet.cosmetics.length]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setHelp(true);
        localStorage.setItem(SEEN_KEY, "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const stacks = shardStacks(hunt);
  const readyStacks = stacks.filter((s) => s.ready);
  const ready = readyStacks.length;
  const left = rerollsLeft(hunt);

  const visible = useMemo(
    () =>
      filter === "prontos"
        ? stacks.filter((s) => s.ready)
        : filter === "progresso"
          ? stacks.filter((s) => !s.ready)
          : stacks,
    [stacks, filter],
  );

  async function forge(stack: ShardStack) {
    if (forging) return;
    if (!stack.ready) {
      toast.error(`Faltam ${stack.missing} fragmento(s) deste cosmético.`);
      return;
    }
    if (wallet.crystals < FORGE_ARLYS_COST) {
      toast.error(`Faltam ${FORGE_ARLYS_COST - wallet.crystals} ✦ para forjar.`);
      return;
    }
    setDone(false);
    setForging(stack);
    const res = await forgeShard(stack.key);
    if (!res.ok) {
      setForging(null);
      toast.error(
        res.error === "insufficient"
          ? "Arlys insuficientes."
          : res.error === "owned"
            ? "Você já tem esse item — fragmentos dissolvidos em Arlys."
            : res.error === "incomplete"
              ? `Você precisa de ${SHARDS_PER_FORGE} fragmentos iguais.`
              : "Fragmento não encontrado.",
      );
      return;
    }
    setDone(true);
  }

  async function dissolve(stack: ShardStack) {
    setBusy(stack.key);
    const v = await dissolveShard(stack.key);
    setBusy(null);
    if (v > 0) toast.success(`+${v} ✦ pela dissolução do fragmento.`);
  }

  async function swap(stack: ShardStack) {
    setBusy(stack.key);
    const res = await rerollShard(stack.key);
    setBusy(null);
    if (!res.ok) {
      toast.error(
        res.error === "limit"
          ? `Você já usou suas ${REROLL_WEEKLY_LIMIT} trocas desta semana.`
          : res.error === "empty_pool"
            ? "Não há outro cosmético disponível para troca agora."
            : "Fragmento não encontrado.",
      );
      return;
    }
    toast.success(`Novo fragmento: ${res.shard.name} · ${res.left} troca(s) restantes.`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="tap-target inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="tap-target inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" /> Como funciona
        </button>
      </div>

      {/* ---- Câmara da forja ---- */}
      <section
        className="relative overflow-hidden rounded-[28px] border border-white/10"
        style={{
          background:
            "radial-gradient(90% 120% at 50% 118%, rgba(251,146,60,0.24), transparent 62%), radial-gradient(110% 90% at 12% -10%, rgba(167,139,250,0.26), transparent 58%), linear-gradient(165deg, rgba(26,15,44,0.94), rgba(10,6,19,0.97))",
        }}
      >
        {/* brasas subindo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="forge-spark absolute bottom-0 rounded-full"
              style={
                {
                  left: `${6 + i * 6.7}%`,
                  height: i % 3 === 0 ? 3 : 2,
                  width: i % 3 === 0 ? 3 : 2,
                  background: i % 2 ? "#fbbf24" : "#d8b4fe",
                  filter: "blur(0.4px)",
                  "--spark-delay": `${(i * 0.63).toFixed(2)}s`,
                  "--spark-duration": `${6 + (i % 5)}s`,
                  "--spark-drift": `${(i % 2 ? 1 : -1) * (10 + i * 2)}px`,
                  "--spark-opacity": i % 3 === 0 ? 0.8 : 0.5,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        {/* raios lentos */}
        <div
          aria-hidden
          className="relic-rays pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 50% 108%, rgba(251,191,36,0.14) 0deg 2deg, transparent 2deg 15deg)",
            maskImage: "radial-gradient(closest-side at 50% 108%, black, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(closest-side at 50% 108%, black, transparent 72%)",
          }}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span
              className="forge-anvil grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/12 sm:h-16 sm:w-16"
              style={{
                background:
                  "linear-gradient(150deg, rgba(251,191,36,0.28), rgba(167,139,250,0.18))",
                boxShadow: "0 0 46px -16px #fbbf24",
              }}
            >
              <Hammer className="h-7 w-7 text-amber-200 sm:h-8 sm:w-8" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">
                Modo colecionável
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-4xl">
                Forja de Fragmentos
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Revise cartas, colete fragmentos dos bundles ativos e transforme{" "}
                <strong className="text-foreground">
                  {SHARDS_PER_FORGE} iguais + {FORGE_ARLYS_COST} ✦
                </strong>{" "}
                em um cosmético permanente.
              </p>
            </div>
          </div>

          {/* trilha */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <Step n={1} label="Revise cartas" />
            <Sep />
            <Step n={2} label={`Junte ${SHARDS_PER_FORGE} iguais`} />
            <Sep />
            <Step n={3} label={`Pague ${FORGE_ARLYS_COST} ✦`} />
            <Sep />
            <Step n={4} label="Permanente" done />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatBox
              label="Fragmentos"
              value={hunt.shards.length}
              accent="#d8b4fe"
              icon={Gem}
            />
            <StatBox label="Prontos" value={ready} accent="#34d399" icon={Hammer} />
            <StatBox label="Forjados" value={hunt.forged} accent="#fbbf24" icon={Flame} />
            <StatBox
              label="Arlys ✦"
              value={wallet.crystals}
              accent="#7dd3fc"
              icon={Sparkles}
            />
          </div>

          {ready > 0 && (
            <button
              type="button"
              onClick={() => setFilter("prontos")}
              className="tap-target mt-5 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:bg-white/6"
              style={{
                borderColor: "rgba(52,211,153,0.4)",
                background: "rgba(52,211,153,0.10)",
              }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/20">
                <Hammer className="h-4 w-4 text-emerald-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-emerald-200">
                  {ready} cosmético{ready > 1 ? "s" : ""} pronto
                  {ready > 1 ? "s" : ""} para forjar
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {readyStacks
                    .slice(0, 2)
                    .map((s) => s.name)
                    .join(" · ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-emerald-300" />
            </button>
          )}
        </div>
      </section>

      {/* ---- Inventário ---- */}
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <Gem className="h-4 w-4 text-muted-foreground" /> Inventário de fragmentos
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Shuffle className="h-3 w-3" />
            {left}/{REROLL_WEEKLY_LIMIT} trocas nesta semana
          </span>
        </div>

        {stacks.length > 0 && (
          <div className="mt-3 flex gap-1.5 rounded-2xl border border-white/8 bg-white/4 p-1">
            {(
              [
                ["todos", `Todos ${stacks.length}`],
                ["prontos", `Prontos ${ready}`],
                ["progresso", `Em progresso ${stacks.length - ready}`],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`tap-target flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                  filter === id
                    ? "bg-primary/22 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {stacks.length === 0 ? (
          <div className="mt-3 overflow-hidden rounded-3xl border border-dashed border-white/14 bg-surface/50 p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Gem className="h-7 w-7 text-primary/70" />
            </span>
            <p className="mt-4 text-[15px] font-bold tracking-tight">
              A bigorna está fria
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Nenhum fragmento ainda. Revise cartas — eles caem sozinhos, e cartas
              inimigas aumentam a chance.
            </p>
            <Link
              to="/"
              className="tap-target mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Flame className="h-4 w-4" /> Revisar agora
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-white/10 bg-surface/50 p-6 text-center text-[13px] text-muted-foreground">
            Nenhum fragmento neste filtro.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visible.map((st) => {
              const tier = TIER_META[st.tier];
              const affordable = wallet.crystals >= FORGE_ARLYS_COST;
              const disabled = busy === st.key || forging !== null;
              const pct = Math.min(100, (st.count / SHARDS_PER_FORGE) * 100);
              return (
                <div
                  key={st.key}
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
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] opacity-25 forge-sheen"
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
                      <p className="mt-1.5 truncate text-[16px] font-bold tracking-tight">
                        {st.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {SLOT_LABEL[st.slot] ?? st.slot}
                      </p>
                    </div>
                  </div>

                  {/* progresso */}
                  <div className="relative mt-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground/80">
                        {Math.min(st.count, SHARDS_PER_FORGE)}/{SHARDS_PER_FORGE} fragmentos
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: st.ready ? tier.color : undefined }}
                      >
                        {st.ready
                          ? `Pronto · ${FORGE_ARLYS_COST} ✦`
                          : `Faltam ${st.missing}`}
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
                            borderColor:
                              i < st.count ? tier.color : "rgba(255,255,255,0.12)",
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
                    onClick={() => void forge(st)}
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
                        : `Faltam ${FORGE_ARLYS_COST - wallet.crystals} ✦`}
                  </button>

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={disabled || left <= 0}
                      title={
                        left > 0
                          ? `Trocar 1 fragmento por outro cosmético (${left} restantes)`
                          : "Sem trocas nesta semana"
                      }
                      onClick={() => void swap(st)}
                      className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/12 bg-white/6 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                    >
                      <Shuffle className="h-3.5 w-3.5" /> Trocar
                      <span className="text-[10px] opacity-70">({left})</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      title={`Dissolver 1 fragmento por ${st.dissolveValue} ✦`}
                      onClick={() => void dissolve(st)}
                      className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/12 bg-white/6 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                    >
                      <Recycle className="h-3.5 w-3.5" /> Dissolver
                      <span className="text-[10px] opacity-70">+{st.dissolveValue} ✦</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- Histórico ---- */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-surface/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <History className="h-4 w-4 text-muted-foreground" /> Histórico da forja
        </h2>
        {hunt.log.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">Nada por aqui ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/6">
            {hunt.log.map((e, i) => {
              const Icon =
                e.tone === "forge"
                  ? Hammer
                  : e.tone === "dissolve"
                    ? Coins
                    : e.tone === "reroll"
                      ? Shuffle
                      : Sparkles;
              const accent =
                e.tone === "forge"
                  ? "#fbbf24"
                  : e.tone === "dissolve"
                    ? "#7dd3fc"
                    : e.tone === "reroll"
                      ? "#34d399"
                      : "#d8b4fe";
              return (
                <li key={`${e.at}-${i}`} className="flex items-center gap-3 py-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${accent}1f`, border: `1px solid ${accent}33` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {e.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {e.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(e.at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {help && <HelpModal onClose={() => setHelp(false)} />}

      {forging && (
        <ForgeOverlay
          stack={forging}
          done={done}
          onClose={() => {
            setForging(null);
            setDone(false);
          }}
        />
      )}
    </main>
  );
}

function Sep() {
  return (
    <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
  );
}

function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
      style={{
        borderColor: done ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.1)",
        background: done ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.05)",
        color: done ? "#fcd34d" : undefined,
      }}
    >
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
        style={{
          background: done ? "rgba(251,191,36,0.28)" : "color-mix(in oklab, var(--primary) 28%, transparent)",
          color: done ? "#fde68a" : "var(--primary)",
        }}
      >
        {n}
      </span>
      {label}
    </span>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[96] grid place-items-end sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Como funciona a Forja de Fragmentos"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 p-6 sm:rounded-3xl"
        style={{
          background:
            "radial-gradient(110% 70% at 50% 0%, rgba(167,139,250,0.18), transparent 62%), linear-gradient(165deg, rgba(24,14,40,0.98), rgba(11,6,20,0.99))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Guia rápido
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Como funciona a Forja</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 space-y-3.5 text-[13px] leading-relaxed text-muted-foreground">
          <HelpItem n={1} title="Fragmentos caem revisando">
            Ao acertar cartas na revisão existe chance de cair um fragmento. Cartas
            inimigas e sequências longas aumentam a chance.
          </HelpItem>
          <HelpItem n={2} title="Só cosméticos de bundles ativos">
            Fragmentos vêm apenas de itens cosméticos que estão em bundles ativos na loja
            — e só de itens que você ainda não possui.
          </HelpItem>
          <HelpItem n={3} title={`${SHARDS_PER_FORGE} iguais + ${FORGE_ARLYS_COST} ✦`}>
            Junte {SHARDS_PER_FORGE} fragmentos do mesmo cosmético e pague{" "}
            {FORGE_ARLYS_COST} Arlys ✦ para forjá-lo. O item fica permanente na sua conta.
          </HelpItem>
          <HelpItem n={4} title="Não gostou? Troque ou dissolva">
            Trocar transforma o fragmento em outro cosmético — você tem{" "}
            {REROLL_WEEKLY_LIMIT} trocas por semana. Dissolver devolve Arlys ✦ conforme a
            raridade (20 a 60 ✦).
          </HelpItem>
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="tap-target mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

function HelpItem({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/20 text-[12px] font-bold text-primary">
        {n}
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-foreground">{title}</span>
        {children}
      </span>
    </li>
  );
}

function StatBox({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        borderColor: `${accent}2e`,
        background: `linear-gradient(160deg, ${accent}14, rgba(255,255,255,0.03))`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ background: `${accent}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
        <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
          {value}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
