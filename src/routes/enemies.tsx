import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Swords, Skull, Flame, Trophy, ArrowRight, Search, X } from "lucide-react";
import {
  useStore,
  isEnemy,
  isDefeated,
} from "@/lib/flashcards-store";

export const Route = createFileRoute("/enemies")({
  head: () => ({
    meta: [
      { title: "Cartas Inimigas — Airi" },
      {
        name: "description",
        content:
          "Enfrente as cartas que mais te desafiam. Um espaço dedicado às suas cartas inimigas.",
      },
      { property: "og:title", content: "Arena de Cartas Inimigas — Airi" },
      {
        property: "og:description",
        content: "Suas cartas mais difíceis, reunidas em um só lugar.",
      },
    ],
  }),
  component: EnemiesPage,
});

function enemyLevelLabel(lapses: number, successes: number) {
  const net = lapses - successes;
  if (net >= 5) return { label: "Chefão", tone: "boss" as const };
  if (net >= 3) return { label: "Elite", tone: "elite" as const };
  return { label: "Inimiga", tone: "regular" as const };
}

function EnemiesPage() {
  const cards = useStore((s) => s.cards);
  const decks = useStore((s) => s.decks);
  const [query, setQuery] = useState("");

  const enemies = useMemo(
    () =>
      cards
        .filter(isEnemy)
        .sort((a, b) => {
          const ad = (a.lapses ?? 0) - (a.successes ?? 0);
          const bd = (b.lapses ?? 0) - (b.successes ?? 0);
          return bd - ad;
        }),
    [cards],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enemies;
    return enemies.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.targetWord ?? "").toLowerCase().includes(q),
    );
  }, [enemies, query]);

  const active = enemies.filter((c) => !isDefeated(c)).length;
  const defeated = enemies.filter(isDefeated).length;
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
            "radial-gradient(55% 60% at 20% 0%, hsl(var(--destructive) / 0.18), transparent 70%), radial-gradient(45% 55% at 85% 5%, hsl(var(--destructive) / 0.10), transparent 70%)",
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
              : `${active} ativa${active === 1 ? "" : "s"} · ${defeated} derrotada${defeated === 1 ? "" : "s"} · ${totalLapses} tropeço${totalLapses === 1 ? "" : "s"} no total`}
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

      {/* Stats strip */}
      {enemies.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile
            icon={<Swords className="h-4 w-4" strokeWidth={2.5} />}
            label="Ativas"
            value={active}
            tone="destructive"
          />
          <StatTile
            icon={<Trophy className="h-4 w-4" strokeWidth={2.5} />}
            label="Derrotadas"
            value={defeated}
            tone="success"
          />
          <StatTile
            icon={<Skull className="h-4 w-4" strokeWidth={2.5} />}
            label="Tropeços"
            value={totalLapses}
            tone="muted"
          />
        </div>
      )}

      {/* Search */}
      {enemies.length > 0 && (
        <div className="relative mt-6">
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
            Nenhuma inimiga para “{query}”.
          </p>
        ) : (
          <ul className="grid gap-3">
            {filtered.map((c) => {
              const lapses = c.lapses ?? 0;
              const successes = c.successes ?? 0;
              const defeated = isDefeated(c);
              const meta = enemyLevelLabel(lapses, successes);
              const hpMax = Math.max(lapses, 1);
              const hpNow = Math.max(0, lapses - successes);
              const hpPct = Math.max(6, Math.min(100, (hpNow / hpMax) * 100));
              return (
                <li
                  key={c.id}
                  className={`group relative overflow-hidden rounded-[22px] border p-4 backdrop-blur-md transition ${
                    defeated
                      ? "border-success/25 bg-success/[0.05]"
                      : "border-destructive/25 bg-gradient-to-br from-destructive/[0.08] via-transparent to-transparent"
                  }`}
                  style={{
                    boxShadow: defeated
                      ? "inset 0 1px 0 hsl(var(--success)/0.10)"
                      : "inset 0 1px 0 hsl(var(--destructive)/0.15), 0 20px 40px -30px hsl(var(--destructive)/0.4)",
                  }}
                >
                  {/* corner glow */}
                  {!defeated && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-2xl"
                      style={{
                        background:
                          "radial-gradient(closest-side, hsl(var(--destructive)/0.4), transparent 70%)",
                      }}
                    />
                  )}

                  <div className="relative flex items-start gap-3">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${
                        defeated
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                      style={{
                        boxShadow: defeated
                          ? "inset 0 0 0 1px hsl(var(--success)/0.25)"
                          : "inset 0 0 0 1px hsl(var(--destructive)/0.3)",
                      }}
                    >
                      {defeated ? (
                        <Trophy className="h-5 w-5" strokeWidth={2.5} />
                      ) : (
                        <Swords className="h-5 w-5" strokeWidth={2.5} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                            defeated
                              ? "bg-success/15 text-success"
                              : meta.tone === "boss"
                              ? "bg-destructive text-destructive-foreground"
                              : meta.tone === "elite"
                              ? "bg-destructive/25 text-destructive"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {defeated ? "Derrotada" : meta.label}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {deckName(c.deckId)}
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
                            className={
                              defeated ? "text-success" : "text-destructive/90"
                            }
                          >
                            {defeated ? "Domínio" : "Resistência"}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {successes}/{lapses}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`hp-fill h-full rounded-full ${
                              defeated
                                ? "bg-gradient-to-r from-success/70 to-success"
                                : "bg-gradient-to-r from-destructive/80 to-destructive"
                            }`}
                            style={{
                              width: defeated ? "100%" : `${hpPct}%`,
                              boxShadow: defeated
                                ? "0 0 10px hsl(var(--success)/0.5)"
                                : "0 0 10px hsl(var(--destructive)/0.5)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "destructive" | "success" | "muted";
}) {
  const toneCls =
    tone === "destructive"
      ? "border-destructive/25 bg-destructive/[0.08] text-destructive"
      : tone === "success"
      ? "border-success/25 bg-success/[0.08] text-success"
      : "border-white/10 bg-white/[0.04] text-muted-foreground";
  return (
    <div
      className={`rounded-2xl border px-3 py-3 backdrop-blur-md ${toneCls}`}
      style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.05)" }}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
        {icon}
        {label}
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
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
