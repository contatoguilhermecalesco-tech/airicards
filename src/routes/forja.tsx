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
  shardSlotsLeft,
  dissolveLeft,
  fuseShards,
  fusionTargets,
  TIER_META,
  SLOT_LABEL,
  SHARDS_PER_FORGE,
  FORGE_ARLYS_COST,
  REROLL_WEEKLY_LIMIT,
  SHARD_CAP,
  DROP_DAILY_CAP,
  DROP_COOLDOWN_MIN,
  dropsLeftToday,
  FUSION_INPUT,
  DISSOLVE_WEEKLY_CAP,
  CRIT_FORGE_CHANCE,
  PLATINA_FORGE_CHANCE,
  type ShardStack,
  type ShardTier,
  type ForgeVariant,
  type FusionTarget,
} from "@/lib/relic-hunt";
import { ShardCard, ShardTile, ShardRow } from "@/components/hunt/ShardCard";
import { ShardArt } from "@/components/hunt/ShardArt";
import { ShardGiftDialog } from "@/components/hunt/ShardGiftDialog";
import { ShardGiftsPanel } from "@/components/hunt/ShardGiftsPanel";
import { useAutoClaimShardGifts } from "@/lib/shard-gifts";

import { ForgeOverlay } from "@/components/hunt/ForgeOverlay";
import { ItemPreviewModal } from "@/components/shop/ItemPreviewModal";
import { listShopItems, type ShopItem } from "@/lib/shop";
import { useWallet } from "@/lib/wallet-store";
import { useCurrentProfile } from "@/lib/profile";
import { toast } from "sonner";



const SEEN_KEY = "airi.forja.tutorial.v2";

export const Route = createFileRoute("/forja")({
  head: () => ({
    meta: [
      { title: "Forja de Relíquias | airi" },
      {
        name: "description",
        content:
          "Junte 3 fragmentos do mesmo cosmético nas suas revisões no airi e forje o item por 150 Arlys ✦. Troque ou dissolva fragmentos que não quiser.",
      },
      { property: "og:title", content: "Forja de Relíquias | airi" },
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
  const [variant, setVariant] = useState<ForgeVariant | null>(null);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");
  const [view, setView] = useState<View>("grade");
  const [gifting, setGifting] = useState<ShardStack | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fusionOpen, setFusionOpen] = useState(false);
  const [preview, setPreview] = useState<{ stack: ShardStack; item: ShopItem } | null>(
    null,
  );
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);


  useAutoClaimShardGifts(profile?.id, (g) =>
    toast.success(`Fragmento recebido: ${g.shardName}`),
  );

  useEffect(() => {
    pruneOwnedShards();
  }, [wallet.cosmetics.length]);

  // Catálogo da loja para abrir o provador antes de forjar.
  useEffect(() => {
    let alive = true;
    void listShopItems()
      .then((items) => {
        if (alive) setShopItems(items);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);


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
  const slots = shardSlotsLeft(hunt);
  const cashLeft = dissolveLeft(hunt);
  const full = slots <= 0;

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

  /** Encontra o item da loja correspondente ao fragmento (para o provador). */
  function shopItemFor(stack: ShardStack): ShopItem | null {
    return (
      shopItems.find((i) => {
        if (i.kind !== "cosmetic") return false;
        const key = String(i.payload?.key ?? i.id);
        const slot = String(i.payload?.slot ?? "cosmetic");
        return `${slot}:${key}` === stack.key;
      }) ?? null
    );
  }

  /** Abre o provador antes da forja; sem item na loja, forja direto. */
  function askForge(stack: ShardStack) {
    if (forging) return;
    if (!stack.ready) {
      toast.error(`Faltam ${stack.missing} fragmento(s) deste cosmético.`);
      return;
    }
    const item = shopItemFor(stack);
    if (!item) {
      void forge(stack);
      return;
    }
    setPreview({ stack, item });
  }

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
    setVariant(null);
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
    setVariant(res.variant);
    setDone(true);
  }

  async function dissolve(stack: ShardStack) {
    setBusy(stack.key);
    const res = await dissolveShard(stack.key);
    setBusy(null);
    if (res.paid > 0) {
      toast.success(
        res.capped > 0
          ? `+${res.paid} ✦ — teto semanal de ${DISSOLVE_WEEKLY_CAP} ✦ atingido.`
          : `+${res.paid} ✦ pela dissolução do fragmento.`,
      );
    } else if (res.capped > 0) {
      toast.error(
        `Teto semanal de ${DISSOLVE_WEEKLY_CAP} ✦ atingido — dissolva na próxima semana.`,
      );
    }
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

      {/* ---- Cabeçalho da Forja ---- */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-2xl">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 90% at 50% -25%, hsl(var(--primary)/0.20), transparent 65%)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)/0.55), transparent)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/12 sm:h-14 sm:w-14">
              <Hammer className="h-6 w-6 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                Forja
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Forja de Relíquias
              </h1>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                {SHARDS_PER_FORGE} fragmentos iguais + {FORGE_ARLYS_COST} ✦ = cosmético
                permanente. Toda forja tem chance de sair crítica.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VaultStat
              label="Fragmentos"
              value={`${hunt.shards.length}/${SHARD_CAP}`}
              icon={Gem}
              highlight={full}
            />
            <VaultStat label="Prontos" value={ready} icon={Hammer} highlight={ready > 0} />
            <VaultStat label="Forjados" value={hunt.forged} icon={Flame} />
            <VaultStat label="Arlys ✦" value={wallet.crystals} icon={Sparkles} />
          </div>

          {/* Capacidade do inventário — força decisões */}
          <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-[11.5px] font-medium">
              <span className="text-muted-foreground">
                Capacidade da bancada
                <span className={full ? "ml-1.5 text-rose-300" : "ml-1.5 text-foreground/80"}>
                  {hunt.shards.length}/{SHARD_CAP}
                </span>
              </span>
              <span className="text-muted-foreground">
                Quedas hoje: {DROP_DAILY_CAP - dropsLeftToday(hunt)}/{DROP_DAILY_CAP} ·
                Saque semanal: {cashLeft}/{DISSOLVE_WEEKLY_CAP} ✦
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <span
                className="block h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (hunt.shards.length / SHARD_CAP) * 100)}%`,
                  background: full
                    ? "linear-gradient(90deg,#f43f5e,#fb7185)"
                    : "linear-gradient(90deg,hsl(var(--primary)),#d1a8ff)",
                }}
              />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              {full
                ? "Bancada cheia: nenhum fragmento novo cai até você forjar, fundir ou dissolver."
                : `${slots} espaço(s) livre(s). Fragmentos guardados mais de duas semanas perdem brilho e valem menos ao dissolver.`}
            </p>
            <button
              type="button"
              onClick={() => setFusionOpen(true)}
              className="tap-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 py-2.5 text-[12.5px] font-semibold text-foreground/90 transition hover:bg-white/10"
            >
              <Recycle className="h-4 w-4 text-primary" />
              Fundir {FUSION_INPUT} fragmentos diferentes
            </button>
          </div>


          {ready > 0 && (
            <button
              type="button"
              onClick={() => setFilter("prontos")}
              className="tap-target mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/12 px-4 py-3 text-left transition hover:bg-primary/18"
            >
              <Hammer className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold tracking-tight">
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
              <ChevronRight className="h-4 w-4 shrink-0 text-primary/80" />
            </button>
          )}
        </div>
      </section>

      {/* ---- Inventário ---- */}
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Gem className="h-4 w-4 text-primary/80" /> Inventário
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <Shuffle className="h-3 w-3" />
              {left}/{REROLL_WEEKLY_LIMIT} trocas
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="tap-target inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 text-[12px] font-semibold text-foreground/85 transition hover:bg-white/10"
            >
              <History className="h-3.5 w-3.5" strokeWidth={2.4} />
              Histórico
            </button>
            <div
              role="group"
              aria-label="Modo de visualização"
              className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-1"
            >
              {VIEWS.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => pickView(id)}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${
                    view === id
                      ? "bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary)/0.9)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {stacks.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className={`tap-target flex-1 whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-semibold transition ${
                  filter === id
                    ? "bg-primary/18 text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
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
                onForge={(s) => askForge(s)}
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
                onForge={(s) => askForge(s)}
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
                onForge={(s) => askForge(s)}
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

      {preview && (
        <ItemPreviewModal
          item={preview.item}
          owned={false}
          canAfford={wallet.crystals >= FORGE_ARLYS_COST}
          busy={false}
          actionLabel="Forjar agora"
          blockedLabel="Arlys insuficientes"
          priceValue={FORGE_ARLYS_COST}
          priceLabel="✦ da forja"
          onBuy={() => {
            const target = preview.stack;
            setPreview(null);
            void forge(target);
          }}
          onClose={() => setPreview(null)}
        />
      )}

      {fusionOpen && (
        <FusionModal
          stacks={stacks}
          onClose={() => setFusionOpen(false)}
          onDone={(name) => {
            setFusionOpen(false);
            toast.success(`Fusão concluída: fragmento de ${name}.`);
          }}
        />
      )}

      {forging && (
        <ForgeOverlay
          stack={forging}
          done={done}
          variant={variant}
          onClose={() => {
            setForging(null);
            setDone(false);
            setVariant(null);
          }}
        />
      )}

    </main>
  );
}


/**
 * Fusão: escolhe 3 fragmentos de cosméticos DIFERENTES da mesma raridade e
 * troca por 1 fragmento de um cosmético escolhido — sem ficar com sobras.
 */
function FusionModal({
  stacks,
  onClose,
  onDone,
}: {
  stacks: ShardStack[];
  onClose: () => void;
  onDone: (name: string) => void;
}) {
  const tierCounts = useMemo(() => {
    const counts = new Map<ShardTier, number>();
    for (const s of stacks) counts.set(s.tier, (counts.get(s.tier) ?? 0) + 1);
    return counts;
  }, [stacks]);

  const tiers = useMemo(
    () =>
      (["mitico", "epico", "raro", "comum"] as ShardTier[]).filter(
        (t) => (tierCounts.get(t) ?? 0) > 0,
      ),
    [tierCounts],
  );

  const [tier, setTier] = useState<ShardTier | null>(
    // Abre já na raridade que dá pra fundir, evitando parecer que a fusão está travada.
    tiers.find((t) => (tierCounts.get(t) ?? 0) >= FUSION_INPUT) ?? tiers[0] ?? null,
  );

  const [picked, setPicked] = useState<string[]>([]);
  const [targets, setTargets] = useState<FusionTarget[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pool = useMemo(
    () => (tier ? stacks.filter((s) => s.tier === tier) : []),
    [stacks, tier],
  );

  useEffect(() => {
    setPicked([]);
    setTarget(null);
    setTargets([]);
    if (!tier) return;
    let alive = true;
    void fusionTargets(tier)
      .then((t) => {
        if (alive) setTargets(t);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [tier]);

  function toggle(key: string) {
    setPicked((cur) =>
      cur.includes(key)
        ? cur.filter((k) => k !== key)
        : cur.length >= FUSION_INPUT
          ? cur
          : [...cur, key],
    );
  }

  const ready = picked.length === FUSION_INPUT && Boolean(target);

  async function run() {
    if (!ready || !target) return;
    setBusy(true);
    const res = await fuseShards(picked, target);
    setBusy(false);
    if (!res.ok) {
      toast.error(
        res.error === "need_three"
          ? `Escolha ${FUSION_INPUT} cosméticos diferentes.`
          : res.error === "same_item"
            ? "Os fragmentos precisam ser de cosméticos diferentes."
            : res.error === "mixed_tier"
              ? "Todos os fragmentos precisam ser da mesma raridade."
              : res.error === "bad_target"
                ? "Escolha um cosmético da mesma raridade."
                : "Fragmento não encontrado.",
      );
      return;
    }
    onDone(res.shard.name);
  }

  return (
    <div
      className="fixed inset-0 z-[96] grid place-items-end sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Fundir fragmentos"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface/95 backdrop-blur-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              Fusão
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              {FUSION_INPUT} diferentes → 1 escolhido
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              Mesma raridade. Você decide qual fragmento sai da bancada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/6 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tiers.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-[13px] text-muted-foreground">
              Você ainda não tem fragmentos para fundir.
            </p>
          ) : (
            <>
              <div className="flex gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tiers.map((t) => {
                  const n = tierCounts.get(t) ?? 0;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`tap-target flex-1 whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-semibold transition ${
                        tier === t
                          ? "bg-primary/18 text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                          : n >= FUSION_INPUT
                            ? "text-muted-foreground hover:text-foreground"
                            : "text-muted-foreground/50"
                      }`}
                      style={tier === t ? { color: TIER_META[t].color } : undefined}
                    >
                      {TIER_META[t].label} · {n}/{FUSION_INPUT}
                    </button>
                  );
                })}

              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sacrificar · {picked.length}/{FUSION_INPUT}
              </p>
              {pool.length < FUSION_INPUT ? (
                <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[12.5px] text-muted-foreground">
                  Você precisa de {FUSION_INPUT} cosméticos diferentes desta raridade.
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {pool.map((s) => {
                    const on = picked.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggle(s.key)}
                        className={`tap-target flex items-center gap-2 rounded-2xl border p-2 text-left transition ${
                          on
                            ? "border-primary/45 bg-primary/12"
                            : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]"
                        }`}
                      >
                        <ShardArt
                          cosmeticKey={s.key}
                          accent={s.accent}
                          tierColor={TIER_META[s.tier].color}
                          size={38}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-semibold">
                            {s.name}
                          </span>
                          <span className="block text-[10.5px] text-muted-foreground">
                            x{s.count}
                          </span>
                        </span>
                        {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Receber
              </p>
              <div className="mt-2 space-y-1.5">
                {targets.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[12.5px] text-muted-foreground">
                    Nenhum cosmético desta raridade disponível agora.
                  </p>
                ) : (
                  targets.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTarget(t.key)}
                      className={`tap-target flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition ${
                        target === t.key
                          ? "border-primary/45 bg-primary/12"
                          : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]"
                      }`}
                    >
                      <ShardArt
                        cosmeticKey={t.key}
                        accent={t.accent}
                        tierColor={TIER_META[t.tier].color}
                        size={34}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">
                          {t.name}
                        </span>
                        <span className="block truncate text-[10.5px] text-muted-foreground">
                          {SLOT_LABEL[t.slot] ?? t.slot}
                        </span>
                      </span>
                      {target === t.key && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-white/[0.07] bg-black/25 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => void run()}
            disabled={!ready || busy}
            className="tap-target w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-40"
          >
            {busy ? "Fundindo…" : `Fundir ${FUSION_INPUT} fragmentos`}
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {

  return (
    <div
      className="fixed inset-0 z-[96] grid place-items-end sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Como funciona a Forja de Relíquias"
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
          <HelpItem n={2} title={`${SHARDS_PER_FORGE} iguais + ${FORGE_ARLYS_COST} ✦`}>
            Junte {SHARDS_PER_FORGE} fragmentos do mesmo cosmético e pague{" "}
            {FORGE_ARLYS_COST} Arlys ✦ para forjá-lo. Antes de confirmar você prova o item
            no provador, vendo como ele fica equipado.
          </HelpItem>
          <HelpItem n={3} title="Forja crítica">
            Toda forja tem {Math.round(CRIT_FORGE_CHANCE * 100)}% de chance de sair na
            variante Áurea e {Math.round(PLATINA_FORGE_CHANCE * 100)}% de sair Platina —
            versões especiais do mesmo cosmético.
          </HelpItem>
          <HelpItem n={4} title={`Fusão: ${FUSION_INPUT} diferentes → 1 escolhido`}>
            Sobrou fragmento de item que você não quer? Funda {FUSION_INPUT} fragmentos de
            cosméticos diferentes da mesma raridade e receba 1 fragmento do cosmético que
            você escolher.
          </HelpItem>
          <HelpItem n={5} title="Bancada limitada e brilho">
            A bancada guarda até {SHARD_CAP} fragmentos — cheia, nada novo cai. Os drops são
            raros: no máximo {DROP_DAILY_CAP} fragmentos por dia, com pelo menos{" "}
            {DROP_COOLDOWN_MIN} min entre um e outro. Fragmentos parados mais de 2 semanas
            perdem brilho e valem menos ao dissolver, e o saque por dissolução tem teto de{" "}
            {DISSOLVE_WEEKLY_CAP} ✦ por semana.
          </HelpItem>
          <HelpItem n={6} title="Não gostou? Troque ou dissolva">
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
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  highlight?: boolean;
}) {

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${
        highlight
          ? "border-primary/30 bg-primary/12"
          : "border-white/8 bg-white/[0.04]"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className={`text-[15px] font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
        <p className="truncate text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
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
