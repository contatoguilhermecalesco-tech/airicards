import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ChevronLeft,
  Flame,
  Trophy,
  Sparkles,
  Skull,
  Library,
  Target,
} from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { PROFILES, useCurrentProfile } from "@/lib/profile";
import {
  readRankForProfile,
  subscribeAllRanks,
  tierLabel,
  TIER_COLORS,
  type RankState,
  TIER_ORDER,
} from "@/lib/rank-store";
import {
  startSocialStatsSync,
  useProfileStats,
  deriveStats,
  type DerivedStats,
} from "@/lib/social-stats";
import { useState } from "react";

export const Route = createFileRoute("/social/stats")({
  head: () => ({
    meta: [
      { title: "Comparação · Social — airi" },
      {
        name: "description",
        content: "Streak, elo, cartas dominadas e pontos fracos lado a lado.",
      },
      { property: "og:title", content: "Comparação · Social — airi" },
      {
        property: "og:description",
        content: "Perfis lado a lado — streak, elo, domínio e pontos fracos.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const me = useCurrentProfile();
  const [, setTick] = useState(0);

  useEffect(() => {
    startSocialStatsSync();
    const unsub = subscribeAllRanks(() => setTick((t) => t + 1));
    return () => {
      unsub();
    };
  }, []);

  const g = PROFILES[0];
  const a = PROFILES[1];
  const gStats = deriveStats(useProfileStats(g.id));
  const aStats = deriveStats(useProfileStats(a.id));
  const gRank = readRankForProfile(g.id);
  const aRank = readRankForProfile(a.id);

  if (!me) return null;

  return (
    <div className="mx-auto max-w-3xl px-[clamp(0.75rem,3vw,1.5rem)] pb-24 pt-6 sm:pb-10">
      {/* Header */}
      <header className="animate-fade-in mb-6">
        <Link
          to="/social"
          className="mb-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Comparação
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
          Perfis lado a lado
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Streak, elo, cartas dominadas e pontos fracos — os dois perfis em tempo real.
        </p>
      </header>

      {/* Player headers */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <PlayerHeader profile={g} rank={gRank} isMe={me.id === g.id} />
        <PlayerHeader profile={a} rank={aRank} isMe={me.id === a.id} />
      </div>

      {/* Metric rows */}
      <div className="space-y-2.5">
        <MetricRow
          icon={<Flame className="h-4 w-4 text-orange-400" strokeWidth={2.25} />}
          label="Sequência atual"
          leftValue={gStats.streakCurrent}
          rightValue={aStats.streakCurrent}
          unit="dias"
          higherWins
        />
        <MetricRow
          icon={<Flame className="h-4 w-4 text-orange-300/70" strokeWidth={2.25} />}
          label="Maior sequência"
          leftValue={gStats.streakLongest}
          rightValue={aStats.streakLongest}
          unit="dias"
          higherWins
        />
        <MetricRow
          icon={<Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.25} />}
          label="Elo"
          leftValue={gRank ? tierLabel(gRank) : "—"}
          rightValue={aRank ? tierLabel(aRank) : "—"}
          leftScore={rankScore(gRank)}
          rightScore={rankScore(aRank)}
          higherWins
        />
        <MetricRow
          icon={<Library className="h-4 w-4 text-primary" strokeWidth={2.25} />}
          label="Cartas totais"
          leftValue={gStats.totalCards}
          rightValue={aStats.totalCards}
          higherWins
        />
        <MetricRow
          icon={<Sparkles className="h-4 w-4 text-emerald-300" strokeWidth={2.25} />}
          label="Dominadas"
          leftValue={gStats.mastered}
          rightValue={aStats.mastered}
          higherWins
        />
        <MetricRow
          icon={<Target className="h-4 w-4 text-primary" strokeWidth={2.25} />}
          label="Taxa de domínio"
          leftValue={`${gStats.masteryPct}%`}
          rightValue={`${aStats.masteryPct}%`}
          leftScore={gStats.masteryPct}
          rightScore={aStats.masteryPct}
          higherWins
        />
        <MetricRow
          icon={<Skull className="h-4 w-4 text-destructive" strokeWidth={2.25} />}
          label="Cartas inimigas"
          leftValue={gStats.enemies}
          rightValue={aStats.enemies}
          higherWins={false}
        />
      </div>

      {/* Mastery bars */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Composição do baralho
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MasteryBar profile={g} stats={gStats} />
          <MasteryBar profile={a} stats={aStats} />
        </div>
      </section>

      {/* Weak points */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Pontos fracos (cartas inimigas por tipo)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <WeakPointsCard profile={g} stats={gStats} />
          <WeakPointsCard profile={a} stats={aStats} />
        </div>
      </section>

      <p className="mt-6 px-1 text-[11.5px] text-muted-foreground">
        Uma carta é considerada "dominada" quando tem pelo menos 3 acertos e menos
        de 3 lapsos. "Inimigas" são cartas erradas 3 vezes ou mais.
      </p>
    </div>
  );
}

// ----------------------------------------------------------------
// Blocos
// ----------------------------------------------------------------

function rankScore(r: RankState | null): number {
  if (!r) return 0;
  // score comparável entre tiers/divisões
  const tierIdx = TIER_ORDER.indexOf(r.tier);
  const divPart = r.division ? (5 - r.division) * 25 : 100;
  return tierIdx * 400 + divPart + (r.lp ?? 0) / 4;
}

function PlayerHeader({
  profile,
  rank,
  isMe,
}: {
  profile: { id: string; name: string; initial: string; gradient: string };
  rank: RankState | null;
  isMe: boolean;
}) {
  const colors = rank ? TIER_COLORS[rank.tier] : null;
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-4 ${
        isMe
          ? "border-primary/30 bg-primary/[0.05]"
          : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: profile.gradient }}
      />
      <div className="relative flex items-center gap-3">
        <ProfileAvatar
          profileId={profile.id}
          initial={profile.initial}
          gradient={profile.gradient}
          size={44}
          radius={16}
          fontScale={0.36}
          className="shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {profile.name}
            {isMe && (
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                você
              </span>
            )}
          </p>
          {rank ? (
            <p
              className="truncate text-[11.5px] font-medium tabular-nums"
              style={{ color: colors?.text ?? "hsl(var(--muted-foreground))" }}
            >
              {tierLabel(rank)} · {rank.lp} LP
            </p>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">Sem rank ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  leftValue,
  rightValue,
  leftScore,
  rightScore,
  unit,
  higherWins,
}: {
  icon: React.ReactNode;
  label: string;
  leftValue: number | string;
  rightValue: number | string;
  leftScore?: number;
  rightScore?: number;
  unit?: string;
  higherWins: boolean;
}) {
  const l = leftScore ?? (typeof leftValue === "number" ? leftValue : 0);
  const r = rightScore ?? (typeof rightValue === "number" ? rightValue : 0);
  const leftWins = higherWins ? l > r : l < r;
  const rightWins = higherWins ? r > l : r < l;
  const tied = l === r;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <ValueCell value={leftValue} unit={unit} highlight={!tied && leftWins} align="right" />
      <div className="flex flex-col items-center gap-0.5 px-1">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10">
          {icon}
        </div>
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <ValueCell value={rightValue} unit={unit} highlight={!tied && rightWins} align="left" />
    </div>
  );
}

function ValueCell({
  value,
  unit,
  highlight,
  align,
}: {
  value: number | string;
  unit?: string;
  highlight: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className={`text-[18px] font-semibold tabular-nums ${
          highlight ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {value}
        {unit && (
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      {highlight && (
        <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-primary">
          liderando
        </p>
      )}
    </div>
  );
}

function MasteryBar({
  profile,
  stats,
}: {
  profile: { name: string; gradient: string };
  stats: DerivedStats;
}) {
  const total = Math.max(1, stats.totalCards);
  const m = (stats.mastered / total) * 100;
  const l = (stats.learning / total) * 100;
  const e = (stats.enemies / total) * 100;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="mb-2 text-[11.5px] font-semibold text-foreground">{profile.name}</p>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div className="bg-emerald-400/80" style={{ width: `${m}%` }} />
        <div className="bg-primary/70" style={{ width: `${l}%` }} />
        <div className="bg-destructive/70" style={{ width: `${e}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground">
        <span>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80 align-middle" />
          {stats.mastered}
        </span>
        <span>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/70 align-middle" />
          {stats.learning}
        </span>
        <span>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive/70 align-middle" />
          {stats.enemies}
        </span>
      </div>
    </div>
  );
}

function WeakPointsCard({
  profile,
  stats,
}: {
  profile: { name: string; gradient: string };
  stats: DerivedStats;
}) {
  const w = stats.weakByCategory;
  const items: { label: string; count: number }[] = [
    { label: "Palavras", count: w.word },
    { label: "Frases", count: w.sentence },
    { label: "Expressões", count: w.expression },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="mb-2 text-[11.5px] font-semibold text-foreground">{profile.name}</p>
      {total === 0 ? (
        <p className="py-2 text-center text-[11.5px] text-muted-foreground">
          Nenhum ponto fraco 👏
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
            return (
              <li key={it.label} className="flex items-center gap-2">
                <span className="w-[70px] text-[11px] text-muted-foreground">
                  {it.label}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="absolute inset-y-0 left-0 bg-destructive/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] font-semibold tabular-nums text-foreground">
                  {it.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
