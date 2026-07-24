import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  Crown,
  Eye,
  Flame,
  Gem,
  Gift,
  Heart,
  HelpCircle,
  Moon,
  Palette,
  Plane,
  Plus,
  ShoppingBag,
  Shield,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCurrentProfile } from "@/lib/profile";
import { useWallet, loadWallet } from "@/lib/wallet-store";
import {
  buyPublishedDeck,
  buyShopItem,
  listShopItems,
  type ShopItem,
} from "@/lib/shop";
import { listPublishedDecks, type PublishedDeckRow } from "@/lib/marketplace";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Loja airi — Arlys ✦" },
      {
        name: "description",
        content:
          "Troque Arlys por decks premium, packs temáticos, cosméticos e power-ups. Ganhe Arlys mantendo streak, subindo de rank e vencendo duelos.",
      },
      { property: "og:title", content: "Loja airi — Arlys ✦" },
      {
        property: "og:description",
        content: "Arlys: a economia do seu inglês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShopPage,
});

type Tab = "decks" | "pack" | "cosmetic" | "powerup";

const TABS: { id: Tab; label: string }[] = [
  { id: "decks", label: "Decks" },
  { id: "pack", label: "Packs" },
  { id: "cosmetic", label: "Cosméticos" },
  { id: "powerup", label: "Power-ups" },
];

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  plane: Plane,
  briefcase: Briefcase,
  sparkles: Sparkles,
  crown: Crown,
  shield: Shield,
  zap: Zap,
  plus: Plus,
  palette: Palette,
  flame: Flame,
  moon: Moon,
  sun: Sun,
  book: BookOpen,
  swords: Swords,
  star: Star,
  target: Target,
  trophy: Trophy,
  heart: Heart,
  gift: Gift,
};

const ACCENTS: Record<string, string> = {
  sky: "from-sky-400/20 to-sky-500/10 text-sky-200 border-sky-400/30",
  amber: "from-amber-400/20 to-orange-500/10 text-amber-200 border-amber-400/30",
  pink: "from-pink-400/20 to-fuchsia-500/10 text-pink-200 border-pink-400/30",
  violet: "from-violet-400/20 to-purple-500/10 text-violet-200 border-violet-400/30",
  emerald: "from-emerald-400/20 to-teal-500/10 text-emerald-200 border-emerald-400/30",
  lavender: "from-indigo-400/20 to-violet-500/10 text-indigo-200 border-indigo-400/30",
};

function ShopPage() {
  const profile = useCurrentProfile();
  const wallet = useWallet();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("decks");
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [decks, setDecks] = useState<PublishedDeckRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [preview, setPreview] = useState<ShopItem | null>(null);

  useEffect(() => {
    if (profile) void loadWallet(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    listShopItems().then(setItems);
    listPublishedDecks().then(setDecks);
  }, []);

  // Auto-abre o guia na primeira visita
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("airi.shop.helpSeen")) {
      setHelpOpen(true);
      localStorage.setItem("airi.shop.helpSeen", "1");
    }
  }, []);

  const filteredItems = useMemo(
    () => (items ?? []).filter((i) => i.kind === tab),
    [items, tab],
  );

  const paidDecks = useMemo(
    () => (decks ?? []).filter((d) => (d.price ?? 0) > 0),
    [decks],
  );

  function toast(kind: "ok" | "err", msg: string) {
    setFlash({ kind, msg });
    setTimeout(() => setFlash(null), 2200);
  }

  async function handleBuyItem(it: ShopItem) {
    if (!profile || busy) return;
    setBusy(it.id);
    const r = await buyShopItem(profile.id, it);
    setBusy(null);
    if (r.ok) toast("ok", r.message);
    else
      toast(
        "err",
        r.reason === "insufficient"
          ? "Arlys insuficientes."
          : r.reason === "already_owned"
            ? "Você já tem este item."
            : "Não foi possível comprar.",
      );
  }

  async function handleBuyDeck(row: PublishedDeckRow) {
    if (!profile || busy) return;
    setBusy(row.id);
    const r = await buyPublishedDeck(profile.id, row);
    setBusy(null);
    if (r.ok) {
      toast("ok", r.message);
      if (r.deckId) setTimeout(() => router.navigate({ to: `/library/${r.deckId}` }), 700);
    } else {
      toast(
        "err",
        r.reason === "insufficient" ? "Arlys insuficientes." : "Não foi possível comprar.",
      );
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-indigo-500/15 p-6 shadow-glow">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.5} />
              Loja airi
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Troque Arlys por conquistas
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Ganhe Arlys ✦ mantendo streak, subindo de rank e vencendo duelos. Gaste em decks
              premium, packs, cosméticos e power-ups.
            </p>
            <button
              onClick={() => setHelpOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-foreground/90 backdrop-blur transition hover:bg-white/[0.09]"
            >
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              Como funciona a loja?
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
            <Gem className="h-5 w-5 text-violet-300" strokeWidth={2.25} />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Saldo
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {wallet.crystals}{" "}
                <span className="text-[11px] font-medium text-muted-foreground">Arlys ✦</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-10 -mx-2 mt-5 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-[oklch(0.14_0.02_285)]/85 p-1 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {flash && (
        <div
          className={`fixed inset-x-0 top-24 z-40 mx-auto w-max max-w-[90%] rounded-full px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur ${
            flash.kind === "ok"
              ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
              : "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/30"
          }`}
        >
          {flash.msg}
        </div>
      )}

      <section className="mt-5">
        {tab === "decks" ? (
          decks === null ? (
            <SkeletonGrid />
          ) : paidDecks.length === 0 ? (
            <EmptyState
              title="Nenhum deck pago no momento"
              hint="Publique um deck com preço na biblioteca para aparecer aqui."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paidDecks.map((d) => (
                <DeckCard
                  key={d.id}
                  deck={d}
                  isMine={profile?.id === d.owner_profile_id}
                  canAfford={wallet.crystals >= d.price}
                  busy={busy === d.id}
                  onBuy={() => handleBuyDeck(d)}
                />
              ))}
            </ul>
          )
        ) : items === null ? (
          <SkeletonGrid />
        ) : filteredItems.length === 0 ? (
          <EmptyState title="Nada por aqui" hint="Volte em breve — a loja é atualizada com frequência." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((it) => {
              const owned =
                it.kind === "cosmetic" &&
                wallet.cosmetics.includes(
                  `${String(it.payload.slot ?? "cosmetic")}:${String(it.payload.key ?? it.id)}`,
                );
              const stack =
                it.kind === "powerup"
                  ? (wallet.powerups[String(it.payload.effect ?? it.id)] ?? 0)
                  : 0;
              return (
                <ItemCard
                  key={it.id}
                  item={it}
                  owned={owned}
                  stack={stack}
                  canAfford={wallet.crystals >= it.price}
                  busy={busy === it.id}
                  onBuy={() => handleBuyItem(it)}
                />
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Como ganhar Arlys? Streak diário, subir de rank, vencer duelos, tirar boas notas na prova
        mensal.
      </p>

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </main>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.14_0.02_285)] shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/25 via-fuchsia-500/15 to-indigo-500/25 px-6 pt-6 pb-5">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-500/30 blur-3xl" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-foreground/70 hover:bg-white/10 hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200">
            <Gem className="h-3.5 w-3.5" strokeWidth={2.5} />
            Arlys ✦
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Como funciona a Loja</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua consistência em inglês vira Arlys. Gaste em decks, cosméticos e power-ups.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          <Section title="1 · Como ganhar Arlys" tone="violet">
            <RewardRow
              icon={<Flame className="h-4 w-4" strokeWidth={2.5} />}
              label="Streak diário"
              value="+20 base + 5 por dia"
              hint="Estudou hoje? Recebe. Cada dia extra vale mais."
              accent="amber"
            />
            <RewardRow
              icon={<Trophy className="h-4 w-4" strokeWidth={2.5} />}
              label="Subir divisão de rank"
              value="+60 ✦"
              accent="sky"
            />
            <RewardRow
              icon={<Crown className="h-4 w-4" strokeWidth={2.5} />}
              label="Subir de tier"
              value="+200 ✦"
              hint="Bronze → Prata, Prata → Ouro, etc."
              accent="violet"
            />
            <RewardRow
              icon={<Swords className="h-4 w-4" strokeWidth={2.5} />}
              label="Vitória em duelo"
              value="+40 ✦"
              accent="pink"
            />
            <RewardRow
              icon={<Star className="h-4 w-4" strokeWidth={2.5} />}
              label="Prova mensal"
              value="+120 a +160 ✦"
              hint="Quanto melhor a nota, mais Arlys."
              accent="emerald"
            />
          </Section>

          <Section title="2 · O que você pode comprar" tone="pink">
            <Tile
              icon={<BookOpen className="h-4 w-4" strokeWidth={2.5} />}
              title="Decks premium"
              text="Decks curados da comunidade e da equipe airi. Prontos para estudar."
            />
            <Tile
              icon={<Palette className="h-4 w-4" strokeWidth={2.5} />}
              title="Cosméticos"
              text="Molduras de deck, emblemas de perfil e auras — sem impacto no aprendizado, só estilo."
            />
            <Tile
              icon={<Shield className="h-4 w-4" strokeWidth={2.5} />}
              title="Power-ups"
              text="Escudo de streak, congelamento inimigo, boost de revisão e Dobrador de Arlys."
            />
          </Section>

          <Section title="3 · Boas práticas" tone="emerald">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Cosméticos são permanentes: comprou uma vez, é seu.</li>
              <li>• Power-ups são consumíveis e empilham no inventário.</li>
              <li>• Decks comprados viram cópias na sua biblioteca — edite à vontade.</li>
              <li>• Você começa com 150 ✦ de boas-vindas.</li>
            </ul>
          </Section>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            Entendi, bora comprar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "violet" | "pink" | "emerald";
  children: React.ReactNode;
}) {
  const dot =
    tone === "violet" ? "bg-violet-400" : tone === "pink" ? "bg-pink-400" : "bg-emerald-400";
  return (
    <div>
      <h3 className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RewardRow({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: keyof typeof ACCENTS;
}) {
  const acc = ACCENTS[accent] ?? ACCENTS.lavender;
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border bg-gradient-to-br p-3 ${acc}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
          {icon}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Tile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[12px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function DeckCard({
  deck,
  isMine,
  canAfford,
  busy,
  onBuy,
}: {
  deck: PublishedDeckRow;
  isMine: boolean;
  canAfford: boolean;
  busy: boolean;
  onBuy: () => void;
}) {
  return (
    <li className="ios-card flex h-full flex-col rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            por {deck.owner_name}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-semibold">{deck.name}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
          {deck.card_count} cartas
        </span>
      </div>
      <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
        {deck.description || "Sem descrição."}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-base font-semibold text-violet-200">
          <Gem className="h-4 w-4" strokeWidth={2.25} />
          {deck.price}
        </span>
        <button
          onClick={onBuy}
          disabled={busy || (!isMine && !canAfford)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-40"
        >
          {busy ? (
            <>
              <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.5} />
              Comprando…
            </>
          ) : isMine ? (
            "Importar (grátis)"
          ) : canAfford ? (
            "Comprar"
          ) : (
            "Sem Arlys"
          )}
        </button>
      </div>
    </li>
  );
}

function ItemCard({
  item,
  owned,
  stack,
  canAfford,
  busy,
  onBuy,
}: {
  item: ShopItem;
  owned: boolean;
  stack: number;
  canAfford: boolean;
  busy: boolean;
  onBuy: () => void;
}) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  const accent = ACCENTS[item.accent] ?? ACCENTS.lavender;
  return (
    <li
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 backdrop-blur ${accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        {stack > 0 && (
          <span className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] font-semibold">
            Estoque: {stack}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-foreground">{item.name}</h3>
      <p className="mt-1 min-h-[3rem] text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-base font-semibold">
          <Gem className="h-4 w-4" strokeWidth={2.25} />
          {item.price}
        </span>
        <button
          onClick={onBuy}
          disabled={busy || owned || !canAfford}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/95 px-3.5 py-1.5 text-xs font-semibold text-background transition hover:opacity-95 disabled:opacity-40"
        >
          {busy ? (
            "Comprando…"
          ) : owned ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
              Adquirido
            </>
          ) : canAfford ? (
            "Comprar"
          ) : (
            "Sem Arlys"
          )}
        </button>
      </div>
    </li>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="ios-card h-44 animate-pulse rounded-3xl bg-white/[0.03]" />
      ))}
    </ul>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="ios-card grid place-items-center rounded-3xl px-6 py-14 text-center">
      <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={2} />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
