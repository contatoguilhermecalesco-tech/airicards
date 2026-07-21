import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Trophy, TrendingUp, Sparkles } from "lucide-react";
import {
  useRank,
  tierLabel,
  progressToNext,
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
} from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";

export const Route = createFileRoute("/rank")({
  component: RankPage,
  head: () => ({
    meta: [
      { title: "Rank — airi" },
      { name: "description", content: "Sua jornada de rank estilo LoL no airi." },
      { property: "og:title", content: "Rank — airi" },
      { property: "og:description", content: "Do Ferro ao Desafiante — evolua com cada carta." },
    ],
  }),
});

const GLASS =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_16px_40px_-24px_rgba(0,0,0,0.55)]";

function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    "review.easy": "Acerto (fácil)",
    "review.good": "Acerto (médio)",
    "review.hard": "Acerto (difícil)",
    "review.wrong": "Errou uma carta",
    "enemy.defeated": "Inimigo derrotado",
    "enemy.evolved": "Inimigo evoluiu",
    "streak.day": "Bônus de streak",
    "streak.broken": "Streak quebrado",
    "grammar.lesson": "Aula de gramática",
    "writing.good": "Redação corrigida",
    "writing.great": "Redação excelente",
    "exam.completed": "Prova mensal",
  };
  return map[reason] ?? reason;
}

function RankPage() {
  const rank = useRank();
  const colors = TIER_COLORS[rank.tier];
  const progress = progressToNext(rank);
  const progressPct = Math.min(100, Math.round((progress.value / Math.max(1, progress.max)) * 100));

  const winRate = useMemo(() => {
    const total = rank.totalEarned + rank.totalLost;
    if (total === 0) return 0;
    return Math.round((rank.totalEarned / total) * 100);
  }, [rank.totalEarned, rank.totalLost]);

  return (
    <main className="mx-auto max-w-3xl px-[clamp(0.75rem,4vw,1.5rem)] py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      {/* Hero do rank */}
      <section
        className={`${GLASS} p-6 sm:p-8`}
        style={{
          backgroundImage: `radial-gradient(120% 100% at 50% -10%, ${colors.glow}, transparent 60%)`,
        }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0">
            <RankEmblem tier={rank.tier} division={rank.division} size={128} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Seu rank atual
            </p>
            <h1
              className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: colors.text }}
            >
              {tierLabel(rank)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rank.lp} LP · {progress.label}
            </p>

            {/* Barra de LP */}
            <div className="mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${colors.from}, ${colors.ring})`,
                    boxShadow: `0 0 20px ${colors.glow}`,
                  }}
                />
              </div>
            </div>

            {/* Série de promoção */}
            {rank.promo && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: colors.ring }} />
                  Série de promoção
                </div>
                <div className="inline-flex items-center gap-1">
                  {Array.from({ length: rank.promo.target + rank.promo.maxLosses - 1 }).map((_, i) => {
                    const isWin = i < rank.promo!.wins;
                    const isLoss = i >= rank.promo!.wins && i < rank.promo!.wins + rank.promo!.losses;
                    return (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-white/20"
                        style={{
                          background: isWin ? colors.ring : isLoss ? "#c94a5a" : "transparent",
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground">
                  {rank.promo.wins}V · {rank.promo.losses}D · precisa de {rank.promo.target}V
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="LP ganho" value={rank.totalEarned} accent={colors.ring} />
        <StatCard label="LP perdido" value={rank.totalLost} accent="#c94a5a" />
        <StatCard label="Taxa de acerto" value={`${winRate}%`} accent={colors.ring} />
        <StatCard
          label="Pico"
          value={
            isElite(rank.peakTier)
              ? TIER_LABEL[rank.peakTier]
              : `${TIER_LABEL[rank.peakTier]} ${DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]}`
          }
          accent={TIER_COLORS[rank.peakTier].ring}
        />
      </section>

      {/* Divisões — trilha visual */}
      <section className={`${GLASS} mt-4 p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Sua trilha</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"] as const).map((t) => {
            const c = TIER_COLORS[t];
            const active = t === rank.tier;
            return (
              <div
                key={t}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-2.5 py-2 transition ${
                  active
                    ? "border-white/25 bg-white/[0.08]"
                    : "border-white/[0.06] bg-white/[0.02] opacity-60"
                }`}
                style={active ? { boxShadow: `0 0 24px ${c.glow}` } : undefined}
              >
                <RankEmblem tier={t} division={4} size={36} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: c.text }}
                >
                  {TIER_LABEL[t]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Histórico */}
      <section className={`${GLASS} mt-4 p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Histórico recente</h2>
        </div>
        {rank.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento ainda. Comece a revisar cartas para ganhar LP.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {rank.history.slice(0, 20).map((e, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">{reasonLabel(e.reason)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    e.delta > 0 ? "text-emerald-400" : e.delta < 0 ? "text-rose-400" : "text-muted-foreground"
                  }`}
                >
                  {e.delta > 0 ? "+" : ""}
                  {e.delta} LP
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Explicação de LP */}
      <section className={`${GLASS} mt-4 p-5`}>
        <h2 className="text-sm font-semibold text-foreground">Como ganhar LP</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {[
            ["Acerto fácil", "+2"],
            ["Acerto médio", "+4"],
            ["Acerto difícil", "+6"],
            ["Derrotar inimigo", "+15"],
            ["Aula de gramática", "+25"],
            ["Redação ≥ 7", "+30"],
            ["Prova mensal", "+50 a +200"],
            ["Bônus de streak/dia", "+5 a +30"],
            ["Erro em revisão", "−3"],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <span
                className={`font-semibold tabular-nums ${
                  val.startsWith("-") || val.startsWith("−") ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`${GLASS} p-4`}>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
