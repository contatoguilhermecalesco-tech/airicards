import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Swords,
  Skull,
  Flame,
  Trophy,
  HelpCircle,
  Search,
  X,
  Sparkles,
  Gift,
  Check,
} from "lucide-react";
import {
  useStore,
  isEnemy,
  isDefeated,
  type Card,
} from "@/lib/flashcards-store";
import {
  enemyTier,
  tierRank,
  TIER_META,
  useMissions,
  claimMission,
  type EnemyTier,
} from "@/lib/enemy-system";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/enemies")({
  head: () => ({
    meta: [
      { title: "Arena — Cartas inimigas | Airi" },
      {
        name: "description",
        content:
          "Enfrente as cartas que mais te desafiam. Filtre por nível de perigo, cumpra missões diárias e derrote chefões.",
      },
      { property: "og:title", content: "Arena — Cartas inimigas | Airi" },
      {
        property: "og:description",
        content:
          "Cace inimigas, encare chefões e ganhe Arlys nas missões da Arena.",
      },
    ],
  }),
  component: EnemiesPage,
});

const FILTER_TIERS: (EnemyTier | "all" | "active" | "defeated")[] = [
  "active",
  "nemesis",
  "boss",
  "elite",
  "wounded",
  "defeated",
];
const FILTER_LABEL: Record<(typeof FILTER_TIERS)[number], string> = {
  active: "Ativas",
  nemesis: "Nêmesis",
  boss: "Chefão",
  elite: "Elite",
  wounded: "Ferida",
  defeated: "Derrotadas",
  all: "Todas",
};

function EnemiesPage() {
  const cards = useStore((s) => s.cards);
  const decks = useStore((s) => s.decks);
  const missions = useMissions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<(typeof FILTER_TIERS)[number]>("active");

  const enemies = useMemo(() => cards.filter(isEnemy), [cards]);

  const withTier = useMemo(
    () => enemies.map((c) => ({ card: c, tier: enemyTier(c) })),
    [enemies],
  );

  const tierCounts = useMemo(() => {
    const c: Record<EnemyTier, number> = {
      wounded: 0,
      elite: 0,
      boss: 0,
      nemesis: 0,
      defeated: 0,
    };
    withTier.forEach(({ tier }) => (c[tier] += 1));
    return c;
  }, [withTier]);

  const filtered = useMemo(() => {
    let list = withTier;
    if (filter === "active") list = list.filter((x) => x.tier !== "defeated");
    else if (filter === "defeated") list = list.filter((x) => x.tier === "defeated");
    else if (filter !== "all") list = list.filter((x) => x.tier === filter);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        ({ card: c }) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q) ||
          (c.targetWord ?? "").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => {
      const rd = tierRank(b.tier) - tierRank(a.tier);
      if (rd !== 0) return rd;
      const ad = (a.card.lapses ?? 0) - (a.card.successes ?? 0);
      const bd = (b.card.lapses ?? 0) - (b.card.successes ?? 0);
      return bd - ad;
    });
  }, [withTier, filter, query]);

  const active = enemies.filter((c) => !isDefeated(c)).length;
  const defeatedCount = tierCounts.defeated;
  const totalLapses = enemies.reduce((n, c) => n + (c.lapses ?? 0), 0);

  const deckName = (id: string) =>
    decks.find((d) => d.id === id)?.name ?? "sem deck";

  return (
    <main className="relative mx-auto max-w-3xl px-5 pt-6 pb-24 sm:pt-10">
      {/* Ambient blood-red halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] opacity-70"
        style={{
          background:
            "radial-gradient(55% 60% at 20% 0%, hsl(var(--destructive) / 0.20), transparent 70%), radial-gradient(45% 55% at 85% 5%, hsl(280 90% 60% / 0.12), transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-destructive">
            <Skull className="h-3 w-3" strokeWidth={2.75} />
            Arena
          </p>
          <h1 className="mt-2 bg-linear-to-br from-foreground to-foreground/55 bg-clip-text text-[34px] font-bold leading-tight tracking-tight text-transparent sm:text-[42px]">
            Cartas inimigas
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {enemies.length === 0
              ? "Nenhuma inimiga por aqui. Continue estudando — elas aparecem quando você erra uma carta 3 vezes."
              : `${active} ativa${active === 1 ? "" : "s"} · ${defeatedCount} derrotada${defeatedCount === 1 ? "" : "s"} · ${totalLapses} tropeço${totalLapses === 1 ? "" : "s"} no total`}
          </p>
        </div>
        {active > 0 && (
          <Link
            to="/review"
            search={{ mode: "enemies" }}
            className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl border border-destructive/40 bg-destructive px-4 py-2.5 text-[14px] font-semibold text-destructive-foreground shadow-[0_10px_30px_-10px_hsl(var(--destructive)/0.7)] transition active:scale-95"
          >
            <Flame className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Enfrentar {active}</span>
            <span className="sm:hidden">Enfrentar</span>
          </Link>
        )}
      </header>

      {/* Missions */}
      {enemies.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Missões da Arena
              </p>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Recompensa · Arlys ✦
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[...missions.daily, ...missions.weekly].map((m) => {
              const isWeekly = missions.weekly.some((w) => w.id === m.id);
              const done = m.progress >= m.target;
              const pct = Math.min(100, (m.progress / m.target) * 100);
              return (
                <div
                  key={m.id}
                  className={`relative overflow-hidden rounded-2xl border p-3 transition ${
                    m.claimed
                      ? "border-success/25 bg-success/[0.06] opacity-70"
                      : done
                      ? "border-primary/40 bg-primary/[0.08]"
                      : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            isWeekly
                              ? "bg-primary/20 text-primary"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {isWeekly ? "Semanal" : "Diária"}
                        </span>
                        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {m.progress}/{m.target}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[14px] font-semibold text-foreground">
                        {m.label}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {m.hint}
                      </p>
                    </div>
                    <button
                      disabled={!done || m.claimed}
                      onClick={() => void claimMission(m.id)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                        m.claimed
                          ? "bg-success/20 text-success"
                          : done
                          ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)] hover:opacity-95"
                          : "bg-white/[0.06] text-muted-foreground"
                      }`}
                    >
                      {m.claimed ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3" /> Pego
                        </span>
                      ) : done ? (
                        <span className="inline-flex items-center gap-1">
                          <Gift className="h-3 w-3" /> +{m.rewardArlys}✦
                        </span>
                      ) : (
                        <span>+{m.rewardArlys}✦</span>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={`h-full rounded-full ${
                        m.claimed
                          ? "bg-success/60"
                          : done
                          ? "bg-primary"
                          : "bg-destructive/70"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stats strip */}
      {enemies.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
          <TierTile tier="nemesis" value={tierCounts.nemesis} />
          <TierTile tier="boss" value={tierCounts.boss} />
          <TierTile tier="elite" value={tierCounts.elite} />
          <TierTile tier="wounded" value={tierCounts.wounded} />
        </div>
      )}

      {/* Filters */}
      {enemies.length > 0 && (
        <div className="mt-6 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_TIERS.map((f) => {
            const isActive = filter === f;
            const count =
              f === "active"
                ? active
                : f === "all"
                ? enemies.length
                : tierCounts[f as EnemyTier] ?? 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-destructive/60 bg-destructive/20 text-destructive"
                    : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"
                }`}
              >
                {FILTER_LABEL[f]}
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      {enemies.length > 0 && (
        <div className="relative mt-4">
          <div className="relative flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-2xl transition focus-within:border-destructive/40">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar entre inimigas…"
              className="w-full min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enemy list */}
      <div className="mt-6">
        {enemies.length === 0 ? (
          <EmptyEnemies />
        ) : filtered.length === 0 ? (
          <p className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
            Nenhuma inimiga para esse filtro.
          </p>
        ) : (
          <ul className="grid gap-3">
            {filtered.map(({ card: c, tier }) => (
              <EnemyRow key={c.id} card={c} tier={tier} deckName={deckName(c.deckId)} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function EnemyRow({
  card: c,
  tier,
  deckName,
}: {
  card: Card;
  tier: EnemyTier;
  deckName: string;
}) {
  const lapses = c.lapses ?? 0;
  const successes = c.successes ?? 0;
  const defeated = tier === "defeated";
  const meta = TIER_META[tier];
  const hpMax = Math.max(lapses, 1);
  const hpNow = Math.max(0, lapses - successes);
  const hpPct = Math.max(6, Math.min(100, (hpNow / hpMax) * 100));

  return (
    <li
      className={`group relative overflow-hidden rounded-[22px] border p-4 backdrop-blur-md transition ${
        defeated
          ? "border-success/25 bg-success/[0.05]"
          : "border-white/[0.08] bg-white/[0.03]"
      }`}
      style={{
        boxShadow: defeated
          ? "inset 0 1px 0 hsl(var(--success)/0.10)"
          : `inset 0 1px 0 ${meta.glow}, 0 20px 40px -30px ${meta.glow}`,
      }}
    >
      {/* corner glow */}
      {!defeated && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-2xl"
          style={{
            background: `radial-gradient(closest-side, ${meta.glow}, transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-lg"
          style={{
            background: defeated
              ? "hsl(var(--success) / 0.12)"
              : "rgba(255,255,255,0.04)",
            boxShadow: `inset 0 0 0 1px ${meta.glow}`,
          }}
        >
          {defeated ? (
            <Trophy className="h-5 w-5 text-success" strokeWidth={2.5} />
          ) : (
            <span aria-hidden>{meta.icon}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                background: defeated
                  ? "hsl(var(--success) / 0.15)"
                  : `${meta.color.replace(")", " / 0.18)")}`,
                color: defeated ? "hsl(var(--success))" : meta.color,
              }}
            >
              {meta.label}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {deckName}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
            {c.front}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
            {c.back}
          </p>

          {/* HP bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
              <span
                style={{ color: defeated ? "hsl(var(--success))" : meta.color }}
              >
                {defeated ? "Domínio" : "Resistência"}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {successes}/{lapses}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="hp-fill h-full rounded-full"
                style={{
                  width: defeated ? "100%" : `${hpPct}%`,
                  background: defeated
                    ? "linear-gradient(90deg, hsl(var(--success)/0.7), hsl(var(--success)))"
                    : `linear-gradient(90deg, ${meta.color.replace(")", " / 0.6)")}, ${meta.color})`,
                  boxShadow: `0 0 10px ${meta.glow}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function TierTile({ tier, value }: { tier: EnemyTier; value: number }) {
  const meta = TIER_META[tier];
  return (
    <div
      className="rounded-2xl border px-3 py-3 backdrop-blur-md"
      style={{
        borderColor: meta.glow,
        background: "rgba(255,255,255,0.03)",
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.05), inset 0 0 30px -20px ${meta.glow}`,
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
        <span aria-hidden className="text-[11px]">{meta.icon}</span>
        {meta.label}
      </div>
      <div className="mt-1 text-[22px] font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

function EmptyEnemies() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-2xl">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-success/25 bg-success/10 text-success">
        <Trophy className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Nenhuma inimiga na arena</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Uma carta vira inimiga quando você erra ela 3 vezes. Continue revisando —
        os desafios aparecem naturalmente.
      </p>
      <Link
        to="/library"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-95"
      >
        Ir para a biblioteca
        <Swords className="h-4 w-4" />
      </Link>
    </div>
  );
}
