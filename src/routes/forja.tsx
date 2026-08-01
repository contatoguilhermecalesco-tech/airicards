import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, History, Hammer, Recycle, Sparkles, Coins } from "lucide-react";
import {
  useHunt,
  shardStacks,
  forgeShard,
  dissolveShard,
  pruneOwnedShards,
  FORGE_BASE_RATE,
  TIER_META,
  SLOT_LABEL,
  type ShardStack,
} from "@/lib/relic-hunt";
import { ShardIcon } from "@/components/hunt/ShardDropToast";
import { ForgeOverlay } from "@/components/hunt/ForgeOverlay";
import { useWallet } from "@/lib/wallet-store";
import { toast } from "sonner";

export const Route = createFileRoute("/forja")({
  head: () => ({
    meta: [
      { title: "Forja de Fragmentos | airi" },
      {
        name: "description",
        content:
          "Fragmentos de cosméticos caem nas suas revisões no airi. Junte-os no inventário e forje o item pagando uma fração do preço em Arlys.",
      },
      { property: "og:title", content: "Forja de Fragmentos | airi" },
      {
        property: "og:description",
        content:
          "Colete fragmentos revisando cartas e forje cosméticos de bundle com desconto em Arlys ✦.",
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

  useEffect(() => {
    pruneOwnedShards();
  }, [wallet.cosmetics.length]);

  const stacks = shardStacks(hunt);

  async function forge(stack: ShardStack) {
    if (forging) return;
    if (wallet.crystals < stack.cost) {
      toast.error(`Faltam ${stack.cost - wallet.crystals} ✦ para forjar.`);
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
            : "Fragmento não encontrado.",
      );
      return;
    }
    setDone(true);
  }

  async function dissolve(stack: ShardStack) {
    const v = await dissolveShard(stack.key);
    if (v > 0) toast.success(`+${v} ✦ pela dissolução do fragmento.`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:pt-6">
      <Link
        to="/"
        className="tap-target mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

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
            Revisando cartas, fragmentos de cosméticos caem sozinhos — sem meta,
            sem prazo. O fragmento não é o item: ele libera a forja por{" "}
            <strong className="text-foreground">
              {Math.round(FORGE_BASE_RATE * 100)}% do preço
            </strong>{" "}
            em Arlys. Fragmentos repetidos do mesmo cosmético deixam a forja mais
            barata (até 15% do preço), e os que você não quer viram Arlys.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatBox label="Fragmentos" value={hunt.shards.length} accent="#d8b4fe" />
            <StatBox label="Forjados" value={hunt.forged} accent="#fbbf24" />
            <StatBox label="Arlys ✦" value={wallet.crystals} accent="#7dd3fc" />
          </div>
        </div>
      </section>

      {/* Inventário */}
      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <Sparkles className="h-4 w-4 text-muted-foreground" /> Inventário de fragmentos
        </h2>

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
              const affordable = wallet.crystals >= st.cost;
              return (
                <div
                  key={st.key}
                  className="relative overflow-hidden rounded-3xl border p-4"
                  style={{
                    borderColor: `${tier.color}3d`,
                    background:
                      "linear-gradient(155deg, rgba(22,13,36,0.85), rgba(12,7,22,0.9))",
                    boxShadow: `0 0 48px -26px ${tier.color}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="relative grid h-14 w-14 shrink-0 place-items-center">
                      <ShardIcon accent={st.accent} tier={tier.color} size={48} />
                      {st.count > 1 && (
                        <span
                          className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            background: tier.color,
                            color: "#170c26",
                          }}
                        >
                          ×{st.count}
                        </span>
                      )}
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
                        {SLOT_LABEL[st.slot] ?? st.slot} · preço cheio {st.price} ✦
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">
                      Forjar por
                    </span>
                    <span className="text-sm font-bold" style={{ color: tier.color }}>
                      {st.cost} ✦
                      <span className="ml-1 text-[11px] font-medium text-muted-foreground line-through">
                        {st.price}
                      </span>
                    </span>
                  </div>
                  {st.count === 1 && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Outro fragmento igual baixa para {st.nextCost} ✦.
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={forging !== null}
                      onClick={() => void forge(st)}
                      className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-40"
                      style={{
                        background: affordable
                          ? `linear-gradient(120deg, ${tier.color}, ${tier.color}aa)`
                          : "rgba(255,255,255,0.06)",
                        color: affordable ? "#170c26" : undefined,
                      }}
                    >
                      <Hammer className="h-4 w-4" />
                      {affordable ? "Forjar" : `Faltam ${st.cost - wallet.crystals} ✦`}
                    </button>
                    <button
                      type="button"
                      title={`Dissolver 1 fragmento por ${st.dissolveValue} ✦`}
                      onClick={() => void dissolve(st)}
                      className="tap-target grid w-12 place-items-center rounded-2xl border border-white/12 bg-white/6 text-muted-foreground transition hover:text-foreground"
                    >
                      <Recycle className="h-4 w-4" />
                    </button>
                  </div>
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
                e.tone === "forge" ? Hammer : e.tone === "dissolve" ? Coins : Sparkles;
              const accent =
                e.tone === "forge" ? "#fbbf24" : e.tone === "dissolve" ? "#7dd3fc" : "#d8b4fe";
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
