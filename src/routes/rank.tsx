import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, TrendingUp, Sparkles, Lock, Check, Info, Users, RefreshCw, Share2 } from "lucide-react";
import {
  useRank,
  tierLabel,
  progressToNext,
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
  lpToReachTier,
  readRankForProfile,
  subscribeAllRanks,
  type Tier,
  type RankState,
} from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";
import { PROFILES, getCurrentProfile, useCurrentProfile } from "@/lib/profile";
import { useStore, useStreak } from "@/lib/flashcards-store";
import { ShareAchievement } from "@/components/ShareAchievement";


export const Route = createFileRoute("/rank")({
  component: RankPage,
  head: () => ({
    meta: [
      { title: "Rank — airi" },
      { name: "description", content: "Sua jornada de rank estilo LoL no airi." },
      { property: "og:title", content: "Rank — airi" },
      { property: "og:description", content: "Do Ferro ao Desafiante — evolua com cada carta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

      {/* O que é o rank */}
      <section className={`${GLASS} mt-4 p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">O que é o Rank?</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm leading-relaxed text-foreground">
              O rank transforma o seu estudo de inglês em uma jornada de progressão.
              Assim como nas ligas de e-sports, você sobe de elo conforme acerta
              cartas, derrota inimigos e mantém constância nos estudos.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Mostra o quanto você evoluiu de forma visual e motivadora.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Cria metas de longo prazo: do Ferro ao Desafiante.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Recompensa acertos, streaks e aulas com LP.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>Penaliza abandono e erros repetidos, mantendo o desafio real.</span>
            </li>
          </ul>
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

      {/* Leaderboard entre perfis */}
      <ProfilesLeaderboard glass={GLASS} />



      {/* Divisões — trilha com LP necessário por tier */}
      <section className={`${GLASS} mt-4 p-5`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Trilha de rank</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">LP total acumulado</span>
        </div>

        {/* LP acumulado ganho pelo jogador — usado para marcar tiers alcançados */}
        {(() => {
          const earned = rank.totalEarned - rank.totalLost;
          const TIERS: Tier[] = [
            "iron", "bronze", "silver", "gold", "platinum",
            "emerald", "diamond", "master", "grandmaster", "challenger",
          ];
          const currentIdx = TIERS.indexOf(rank.tier);
          return (
            <ol className="space-y-1.5">
              {TIERS.map((t, i) => {
                const c = TIER_COLORS[t];
                const lpNeeded = lpToReachTier(t);
                const isCurrent = i === currentIdx;
                const reached = i <= currentIdx;
                const remaining = Math.max(0, lpNeeded - Math.max(0, earned));
                return (
                  <li
                    key={t}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                      isCurrent
                        ? "border-white/20 bg-white/[0.06]"
                        : reached
                        ? "border-white/[0.08] bg-white/[0.025]"
                        : "border-white/[0.05] bg-white/[0.015] opacity-70"
                    }`}
                    style={isCurrent ? { boxShadow: `0 0 22px ${c.glow}` } : undefined}
                  >
                    <div className="shrink-0">
                      <RankEmblem tier={t} division={4} size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[13px] font-semibold tracking-tight"
                          style={{ color: c.text }}
                        >
                          {TIER_LABEL[t]}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/80">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {i === 0
                          ? "Ponto de partida"
                          : `Requer ${lpNeeded.toLocaleString("pt-BR")} LP acumulados`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {reached ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Alcançado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/60">
                          <Lock className="h-3 w-3" strokeWidth={2.25} />
                          faltam {remaining.toLocaleString("pt-BR")} LP
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        })()}

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Cada divisão custa 100 LP e a promoção exige 3 vitórias com no máximo 2 derrotas.
          Recompensas foram calibradas para uma progressão mais lenta e valiosa.
        </p>
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
            ["Acerto fácil", "+3"],
            ["Acerto médio", "+2"],
            ["Acerto difícil", "+1"],
            ["Derrotar inimigo", "+8"],
            ["Aula de gramática", "até +10"],
            ["Redação ≥ 70", "+15"],
            ["Redação ≥ 90", "+30"],
            ["Prova mensal (aprovado)", "+25 a +123"],
            ["Bônus diário de streak", "+2 a +12"],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums text-emerald-400">{val}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-5 text-sm font-semibold text-foreground">Como perder LP</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          O rank não é um caminho de mão única — descuido custa LP.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {[
            ["Errar carta", "−4"],
            ["Carta virou inimiga", "−12"],
            ["Prova mensal reprovado (<50%)", "−25"],
            ["Streak quebrado (1–2 dias)", "−10"],
            ["Streak quebrado (3–6 dias)", "−20"],
            ["Streak quebrado (7+ dias)", "−35"],
            ["Inimigo ignorado (>24h)", "−3 cada · cap −15/dia"],
            ["Inatividade (a partir do Ouro)", "−2/dia após 3 dias · cap −12/dia"],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-rose-500/15 bg-rose-500/[0.06] px-3 py-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums text-rose-400">{val}</span>
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

function ProfilesLeaderboard({ glass }: { glass: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    const unsub = subscribeAllRanks(() => setTick((t) => t + 1));
    return () => {
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, []);
  void tick;


  const active = getCurrentProfile();
  const entries: {
    profileId: string;
    name: string;
    gradient: string;
    isActive: boolean;
    rank: RankState | null;
  }[] = PROFILES.map((p) => ({
    profileId: p.id,
    name: p.name,
    gradient: p.gradient,
    isActive: active?.id === p.id,
    rank: readRankForProfile(p.id),
  }));

  entries.sort((a, b) => {
    const la = a.rank?.totalEarned ?? -1;
    const lb = b.rank?.totalEarned ?? -1;
    return lb - la;
  });

  return (
    <section className={`${glass} mt-4 p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Ranking dos perfis
          </h2>
        </div>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Atualizar
        </button>
      </div>

      <ol className="space-y-2">
        {entries.map((e, idx) => {
          const rank = e.rank;
          const colors = TIER_COLORS[rank?.tier ?? "iron"];
          const position = rank ? idx + 1 : "—";
          return (
            <li
              key={e.profileId}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
            >
              <span
                aria-hidden
                className="w-6 text-center text-xs font-semibold tabular-nums text-muted-foreground"
              >
                {position}
              </span>
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundImage: e.gradient }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  {e.isActive && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Você
                    </span>
                  )}
                </div>
                {rank ? (
                  <p className="mt-0.5 text-xs tabular-nums" style={{ color: colors.text }}>
                    {tierLabel(rank)} · {rank.lp} LP
                    <span className="text-muted-foreground">
                      {" · "}+{rank.totalEarned} / −{rank.totalLost}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sem histórico neste dispositivo
                  </p>
                )}
              </div>
              {rank ? (
                <RankEmblem tier={rank.tier} division={rank.division} size={40} />
              ) : (
                <span className="h-10 w-10 rounded-full border border-dashed border-white/10" />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        O rank é salvo por perfil neste dispositivo. Perfis que ainda não estudaram aqui aparecem sem histórico.
      </p>
    </section>
  );
}
