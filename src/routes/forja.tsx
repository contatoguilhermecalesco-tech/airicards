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
  LayoutGrid,
  Rows3,
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
import { ShardArt } from "@/components/hunt/ShardArt";
import { ShardCard, ShardTile } from "@/components/hunt/ShardCard";
import { ShardGiftDialog } from "@/components/hunt/ShardGiftDialog";
import { ShardGiftsPanel } from "@/components/hunt/ShardGiftsPanel";

import { ForgeOverlay } from "@/components/hunt/ForgeOverlay";
import { useWallet } from "@/lib/wallet-store";
import { useCurrentProfile } from "@/lib/profile";
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
type View = "grade" | "prateleira";

const VIEW_KEY = "airi.forja.view.v1";

function ForjaPage() {
  const hunt = useHunt();
  const wallet = useWallet();
  const profile = useCurrentProfile();
  const [forging, setForging] = useState<ShardStack | null>(null);
  const [done, setDone] = useState(false);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");
  const [view, setView] = useState<View>("grade");
  const [gifting, setGifting] = useState<ShardStack | null>(null);

  useEffect(() => {
    pruneOwnedShards();
  }, [wallet.cosmetics.length]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grade" || v === "prateleira") setView(v);
      if (!localStorage.getItem(SEEN_KEY)) {
        setHelp(true);
        localStorage.setItem(SEEN_KEY, "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  function pickView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  }

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

  // Prateleiras estilo Spotify: faixas horizontais por contexto.
  const shelves = useMemo(() => {
    const rows: {
      id: string;
      title: string;
      hint: string;
      items: ShardStack[];
    }[] = [];
    const prontos = visible.filter((s) => s.ready);
    const quase = visible.filter((s) => !s.ready && s.missing === 1);
    const resto = visible.filter((s) => !s.ready && s.missing > 1);
    if (prontos.length)
      rows.push({
        id: "prontos",
        title: "Prontos para forjar",
        hint: `${SHARDS_PER_FORGE} fragmentos completos — só falta pagar ${FORGE_ARLYS_COST} ✦.`,
        items: prontos,
      });
    if (quase.length)
      rows.push({
        id: "quase",
        title: "Falta 1 fragmento",
        hint: "Uma revisão de sorte (ou um presente) fecha o conjunto.",
        items: quase,
      });
    if (resto.length)
      rows.push({
        id: "colecao",
        title: "Coleção em progresso",
        hint: "Fragmentos guardados dos bundles ativos.",
        items: resto,
      });
    return rows;
  }, [visible]);

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Shuffle className="h-3 w-3" />
              {left}/{REROLL_WEEKLY_LIMIT} trocas nesta semana
            </span>
            <div
              role="group"
              aria-label="Modo de visualização"
              className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1"
            >
              {(
                [
                  ["grade", "Grade", LayoutGrid],
                  ["prateleira", "Prateleira", Rows3],
                ] as [View, string, typeof LayoutGrid][]
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => pickView(id)}
                  className={`tap-target inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                    view === id
                      ? "bg-primary/22 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
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
        ) : view === "grade" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visible.map((st) => (
              <ShardCard
                key={st.key}
                stack={st}
                crystals={wallet.crystals}
                disabled={busy === st.key || forging !== null}
                rerollsLeft={left}
                canGift={Boolean(profile?.id)}
                onForge={(s) => void forge(s)}
                onSwap={(s) => void swap(s)}
                onDissolve={(s) => void dissolve(s)}
                onGift={(s) => setGifting(s)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-6">
            {shelves.map((shelf) => (
              <div key={shelf.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <h3 className="min-w-0 truncate text-[13px] font-bold tracking-tight">
                    {shelf.title}
                  </h3>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {shelf.items.length}
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground">{shelf.hint}</p>
                <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {shelf.items.map((st) => (
                    <ShardTile
                      key={st.key}
                      stack={st}
                      crystals={wallet.crystals}
                      disabled={busy === st.key || forging !== null}
                      canGift={Boolean(profile?.id)}
                      onForge={(s) => void forge(s)}
                      onGift={(s) => setGifting(s)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ShardGiftsPanel myId={profile?.id} />

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

      {gifting && profile?.id && (
        <ShardGiftDialog
          stack={gifting}
          myId={profile.id}
          onClose={() => setGifting(null)}
        />
      )}

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
