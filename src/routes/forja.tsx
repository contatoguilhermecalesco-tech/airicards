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
  List as ListIcon,
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
  type ShardStack,
} from "@/lib/relic-hunt";
import { ShardCard, ShardTile, ShardRow } from "@/components/hunt/ShardCard";
import { ShardGiftDialog } from "@/components/hunt/ShardGiftDialog";
import { ShardGiftsPanel } from "@/components/hunt/ShardGiftsPanel";
import { useAutoClaimShardGifts } from "@/lib/shard-gifts";

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
type View = "grade" | "lista" | "detalhado";

const VIEW_KEY = "airi.forja.view.v2";
const VIEWS: [View, string, typeof LayoutGrid][] = [
  ["grade", "Grade", LayoutGrid],
  ["lista", "Lista", ListIcon],
  ["detalhado", "Detalhado", Rows3],
];


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
  const [historyOpen, setHistoryOpen] = useState(false);

  useAutoClaimShardGifts(profile?.id, (g) =>
    toast.success(`Fragmento recebido: ${g.shardName}`),
  );

  useEffect(() => {
    pruneOwnedShards();
  }, [wallet.cosmetics.length]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grade" || v === "lista" || v === "detalhado") setView(v);
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

  // Ordena: prontos primeiro, depois quem está mais perto de completar.
  const sorted = useMemo(
    () =>
      [...visible].sort(
        (a, b) => Number(b.ready) - Number(a.ready) || a.missing - b.missing,
      ),
    [visible],
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

      {/* ---- Cofre de espólios ---- */}
      <section
        className="loot-clip relative overflow-hidden border"
        style={{
          borderColor: "rgba(200,170,110,0.34)",
          background:
            "radial-gradient(120% 100% at 50% -20%, rgba(200,170,110,0.16), transparent 62%), linear-gradient(170deg, rgba(12,17,26,0.96), rgba(4,6,11,0.98))",
        }}
      >
        <span aria-hidden className="loot-hexgrid absolute inset-0 opacity-60" />
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,170,110,0.9), transparent)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span
              className="loot-clip-sm grid h-12 w-12 shrink-0 place-items-center border sm:h-14 sm:w-14"
              style={{
                borderColor: "rgba(200,170,110,0.55)",
                background: "rgba(200,170,110,0.12)",
              }}
            >
              <Hammer className="h-6 w-6" style={{ color: "#f0e6d2" }} />
            </span>
            <div className="min-w-0">
              <p className="loot-label" style={{ color: "#c8aa6e" }}>
                Cofre de espólios
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Forja de Fragmentos
              </h1>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                {SHARDS_PER_FORGE} fragmentos iguais + {FORGE_ARLYS_COST} ✦ = cosmético
                permanente.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border sm:grid-cols-4"
            style={{ borderColor: "rgba(200,170,110,0.22)", background: "rgba(200,170,110,0.18)" }}
          >
            <VaultStat label="Fragmentos" value={hunt.shards.length} icon={Gem} />
            <VaultStat label="Prontos" value={ready} icon={Hammer} highlight={ready > 0} />
            <VaultStat label="Forjados" value={hunt.forged} icon={Flame} />
            <VaultStat label="Arlys ✦" value={wallet.crystals} icon={Sparkles} />
          </div>

          {ready > 0 && (
            <button
              type="button"
              onClick={() => setFilter("prontos")}
              className="tap-target loot-clip-sm mt-3 flex w-full items-center gap-3 border px-4 py-3 text-left transition hover:brightness-110"
              style={{
                borderColor: "rgba(200,170,110,0.6)",
                background:
                  "linear-gradient(90deg, rgba(200,170,110,0.20), rgba(200,170,110,0.05))",
              }}
            >
              <Hammer className="h-4 w-4 shrink-0" style={{ color: "#f0e6d2" }} />
              <span className="min-w-0 flex-1">
                <span className="block loot-label" style={{ color: "#f0e6d2" }}>
                  {ready} conjunto{ready > 1 ? "s" : ""} pronto{ready > 1 ? "s" : ""} para
                  forjar
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {readyStacks
                    .slice(0, 2)
                    .map((s) => s.name)
                    .join(" · ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#c8aa6e" }} />
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
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="tap-target inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-white/10 bg-white/[0.03] px-3 text-[12.5px] font-medium text-foreground/85 backdrop-blur-md transition hover:bg-white/[0.06]"
            >
              <History className="h-3.5 w-3.5" strokeWidth={2.4} />
              Histórico
            </button>
            <div
              role="group"
              aria-label="Modo de visualização"
              className="flex items-center gap-0.5 rounded-[14px] border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md"
            >
              {VIEWS.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => pickView(id)}
                  className={`grid h-8 w-8 place-items-center rounded-[10px] transition ${
                    view === id
                      ? "bg-white/[0.12] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
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
        ) : view === "detalhado" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sorted.map((st) => (
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
        ) : view === "grade" ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((st) => (
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
        ) : (
          <div className="mt-3 space-y-2">
            {sorted.map((st) => (
              <ShardRow
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
        )}
      </section>

      {historyOpen && (
        <HistoryModal
          log={hunt.log}
          myId={profile?.id}
          onClose={() => setHistoryOpen(false)}
        />
      )}


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

function VaultStat({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  highlight?: boolean;
}) {
  const color = highlight ? "#f0e6d2" : "#c8aa6e";
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5"
      style={{ background: "rgba(6,9,15,0.92)" }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-[15px] font-bold tabular-nums" style={{ color }}>
          {value}
        </p>
        <p className="loot-label truncate text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

type ForgeLog = ReturnType<typeof useHunt>["log"];

function HistoryModal({
  log,
  myId,
  onClose,
}: {
  log: ForgeLog;
  myId: string | undefined;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"forja" | "trocas">("forja");
  return (
    <div
      className="fixed inset-0 z-[96] grid place-items-end sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Histórico da forja"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div
        className="relative max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 p-5 sm:rounded-3xl sm:p-6"
        style={{
          background:
            "radial-gradient(110% 70% at 50% 0%, rgba(167,139,250,0.16), transparent 62%), linear-gradient(165deg, rgba(24,14,40,0.98), rgba(11,6,20,0.99))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Registro
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Histórico</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-1.5 rounded-2xl border border-white/8 bg-white/4 p-1">
          {(
            [
              ["forja", "Forja"],
              ["trocas", "Trocas"],
            ] as ["forja" | "trocas", string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`tap-target flex-1 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition ${
                tab === id
                  ? "bg-primary/22 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "trocas" ? (
            <ShardGiftsPanel myId={myId} />
          ) : log.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nada por aqui ainda.</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {log.map((e, i) => {
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
                      style={{
                        background: `${accent}1f`,
                        border: `1px solid ${accent}33`,
                      }}
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
        </div>
      </div>
    </div>
  );
}
