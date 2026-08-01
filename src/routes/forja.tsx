import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

function ForjaPage() {
  const hunt = useHunt();
  const wallet = useWallet();
  const [forging, setForging] = useState<ShardStack | null>(null);
  const [done, setDone] = useState(false);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

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
  const ready = stacks.filter((s) => s.ready).length;
  const left = rerollsLeft(hunt);

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

      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgba(167,139,250,0.22), transparent 60%), linear-gradient(160deg, rgba(24,14,40,0.9), rgba(12,7,22,0.95))",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 80% 10%, rgba(216,180,254,0.10) 0deg 3deg, transparent 3deg 14deg)",
            maskImage: "radial-gradient(closest-side at 80% 10%, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(closest-side at 80% 10%, black, transparent 70%)",
          }}
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">
            Modo colecionável
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Forja de Fragmentos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Revisando cartas, fragmentos de cosméticos dos bundles ativos caem
            sozinhos. Junte{" "}
            <strong className="text-foreground">{SHARDS_PER_FORGE} fragmentos iguais</strong> e
            pague{" "}
            <strong className="text-foreground">{FORGE_ARLYS_COST} ✦</strong> para forjar o
            item permanentemente.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Step n={1} label="Revise cartas" />
            <Step n={2} label={`Junte ${SHARDS_PER_FORGE} iguais`} />
            <Step n={3} label={`Pague ${FORGE_ARLYS_COST} ✦`} />
            <Step n={4} label="Cosmético permanente" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Fragmentos" value={hunt.shards.length} accent="#d8b4fe" />
            <StatBox label="Prontos" value={ready} accent="#34d399" />
            <StatBox label="Forjados" value={hunt.forged} accent="#fbbf24" />
            <StatBox label="Arlys ✦" value={wallet.crystals} accent="#7dd3fc" />
          </div>
        </div>
      </section>

      {/* Inventário */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <Sparkles className="h-4 w-4 text-muted-foreground" /> Inventário de fragmentos
          </h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
            Trocas: {left}/{REROLL_WEEKLY_LIMIT} nesta semana
          </span>
        </div>

        {stacks.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-white/10 bg-surface/50 p-6 text-center">
            <p className="text-[13px] text-muted-foreground">
              Nenhum fragmento ainda. Vá revisar cartas — eles caem sozinhos, e
              cartas inimigas aumentam a chance.
            </p>
            <Link
              to="/"
              className="tap-target mt-4 inline-flex rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Revisar agora
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {stacks.map((st) => {
              const tier = TIER_META[st.tier];
              const affordable = wallet.crystals >= FORGE_ARLYS_COST;
              const disabled = busy === st.key || forging !== null;
              return (
                <div
                  key={st.key}
                  className="relative overflow-hidden rounded-3xl border p-4"
                  style={{
                    borderColor: st.ready ? `${tier.color}7a` : `${tier.color}30`,
                    background:
                      "linear-gradient(155deg, rgba(22,13,36,0.85), rgba(12,7,22,0.9))",
                    boxShadow: st.ready
                      ? `0 0 60px -20px ${tier.color}`
                      : `0 0 48px -32px ${tier.color}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="relative grid h-14 w-14 shrink-0 place-items-center">
                      <ShardIcon accent={st.accent} tier={tier.color} size={48} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: tier.color }}
                      >
                        {tier.label}
                      </p>
                      <p className="truncate text-[15px] font-bold tracking-tight">
                        {st.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {SLOT_LABEL[st.slot] ?? st.slot}
                      </p>
                    </div>
                  </div>

                  {/* Progresso 3 fragmentos */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {Array.from({ length: SHARDS_PER_FORGE }).map((_, i) => (
                        <span
                          key={i}
                          className="grid h-6 w-6 place-items-center rounded-lg border"
                          style={{
                            borderColor: i < st.count ? tier.color : "rgba(255,255,255,0.14)",
                            background: i < st.count ? `${tier.color}26` : "transparent",
                          }}
                        >
                          {i < st.count && (
                            <Check className="h-3.5 w-3.5" style={{ color: tier.color }} />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {st.ready
                        ? `Pronto para forjar · ${FORGE_ARLYS_COST} ✦`
                        : `Faltam ${st.missing} fragmento(s)`}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={disabled || !st.ready}
                      onClick={() => void forge(st)}
                      className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-40"
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
                        ? `${st.count}/${SHARDS_PER_FORGE} fragmentos`
                        : affordable
                          ? `Forjar · ${FORGE_ARLYS_COST} ✦`
                          : `Faltam ${FORGE_ARLYS_COST - wallet.crystals} ✦`}
                    </button>
                    <button
                      type="button"
                      disabled={disabled || left <= 0}
                      title={
                        left > 0
                          ? `Trocar 1 fragmento por outro cosmético (${left} restantes)`
                          : "Sem trocas nesta semana"
                      }
                      onClick={() => void swap(st)}
                      className="tap-target grid w-12 place-items-center rounded-2xl border border-white/12 bg-white/6 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                    >
                      <Shuffle className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      title={`Dissolver 1 fragmento por ${st.dissolveValue} ✦`}
                      onClick={() => void dissolve(st)}
                      className="tap-target grid w-12 place-items-center rounded-2xl border border-white/12 bg-white/6 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                    >
                      <Recycle className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Trocar = vira fragmento de outro cosmético · Dissolver = +
                    {st.dissolveValue} ✦
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-surface/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <History className="h-4 w-4 text-muted-foreground" /> Histórico da forja
        </h2>
        {hunt.log.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Nada por aqui ainda.
          </p>
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
                    <span className="block truncate text-[13px] font-semibold">{e.label}</span>
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

function Step({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-foreground/85">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/25 text-[10px] font-bold text-primary">
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
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 bg-surface/95 p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Guia rápido
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Como funciona a Forja
            </h2>
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
            Fragmentos vêm apenas de itens cosméticos que estão em bundles ativos na
            loja — e só de itens que você ainda não possui.
          </HelpItem>
          <HelpItem n={3} title={`${SHARDS_PER_FORGE} iguais + ${FORGE_ARLYS_COST} ✦`}>
            Junte {SHARDS_PER_FORGE} fragmentos do mesmo cosmético e pague{" "}
            {FORGE_ARLYS_COST} Arlys ✦ para forjá-lo. O item fica permanente na sua
            conta.
          </HelpItem>
          <HelpItem n={4} title="Não gostou? Troque ou dissolva">
            Trocar transforma o fragmento em outro cosmético — você tem{" "}
            {REROLL_WEEKLY_LIMIT} trocas por semana. Dissolver devolve Arlys ✦
            conforme a raridade (20 a 60 ✦).
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
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: `${accent}2e`, background: "rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: accent }} />
        <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
          {value}
        </span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
