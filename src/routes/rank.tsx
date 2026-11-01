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
  "relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#10131b]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.07)_inset,0_18px_50px_-28px_rgba(0,0,0,0.9)]";

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
  const currentProfile = useCurrentProfile();
  const streak = useStreak();
  const cards = useStore((s) => s.cards);
  const cardsMastered = useMemo(
    () => cards.filter((c) => (c.reps ?? 0) >= 3 && (c.lapses ?? 0) === 0).length,
    [cards],
  );
  const [shareOpen, setShareOpen] = useState(false);

  const winRate = useMemo(() => {
    const total = rank.totalEarned + rank.totalLost;
    if (total === 0) return 0;
    return Math.round((rank.totalEarned / total) * 100);
  }, [rank.totalEarned, rank.totalLost]);

  return (
    <main className="relative mx-auto max-w-4xl px-[clamp(0.75rem,4vw,1.5rem)] py-6 before:pointer-events-none before:absolute before:inset-x-8 before:top-20 before:-z-10 before:h-72 before:rounded-full before:bg-primary/[0.07] before:blur-[100px]">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      {/* Hero do rank */}
      <section
        className={`${GLASS} border-white/[0.14] p-6 sm:p-8`}
        style={{
          backgroundImage: `radial-gradient(90% 110% at 85% 0%, ${colors.glow}, transparent 58%), linear-gradient(135deg, rgba(255,255,255,0.035), transparent 55%)`,
        }}
      >
        <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/45">Competitive season</div>
        <div className="flex flex-col items-center gap-4 pt-5 sm:flex-row sm:items-center sm:gap-7 sm:pt-0">
          <div className="relative shrink-0">
            <div className="absolute inset-2 rounded-full blur-2xl" style={{ background: colors.glow }} />
            <div className="relative drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"><RankEmblem tier={rank.tier} division={rank.division} size={144} /></div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground sm:justify-start">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.ring, boxShadow: `0 0 10px ${colors.glow}` }} /> Seu rank atual
            </p>
            <h1
              className="mt-1 text-4xl font-black uppercase italic tracking-tight sm:text-5xl"
              style={{ color: colors.text }}
            >
              {tierLabel(rank)}
            </h1>
            <p className="mt-1 text-sm font-medium text-white/65">
              <span className="font-black tabular-nums text-foreground">{rank.lp} LP</span><span className="mx-2 text-white/20">/</span>{progress.label}
            </p>

            <div className="mt-3 flex justify-center sm:justify-start">
              <button
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur-md transition hover:bg-white/[0.12]"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                Compartilhar conquista
              </button>
            </div>

            {/* Barra de LP */}
            <div className="mt-4">
              <div className="h-3 w-full overflow-hidden rounded-full border border-white/[0.08] bg-black/50 p-[2px]">
                <div
                  className="h-full rounded-full transition-all duration-700"
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

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="min-w-0">
          <ProfilesLeaderboard glass={GLASS} />
        </div>

        <div className="min-w-0 space-y-4">
          {/* Trilha de progressão */}
          <section className={`${GLASS} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase italic tracking-[0.12em] text-foreground">Trilha de rank</h2>
              </div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            {(() => {
              const TIERS: Tier[] = ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"];
              const currentIdx = TIERS.indexOf(rank.tier);
              return (
                <div className="relative">
                  <div className="absolute left-3 right-3 top-6 h-px bg-gradient-to-r from-white/15 via-primary/70 to-amber-400/70" />
                  <ol className="relative grid grid-cols-5 gap-x-1 gap-y-4 sm:grid-cols-5">
                    {TIERS.map((t, i) => {
                      const tierColors = TIER_COLORS[t];
                      const isCurrent = i === currentIdx;
                      const reached = i <= currentIdx;
                      return (
                        <li key={t} className="flex min-w-0 flex-col items-center text-center">
                          <div className={`relative z-10 rounded-full p-1 ${isCurrent ? "bg-[#171321] ring-2 ring-primary shadow-[0_0_18px_rgba(168,85,247,0.45)]" : "bg-[#10131b]"}`}>
                            <RankEmblem tier={t} division={4} size={34} />
                          </div>
                          <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: reached ? tierColors.text : "rgba(255,255,255,0.38)" }}>{TIER_LABEL[t]}</span>
                          {isCurrent && <span className="mt-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-primary">Atual</span>}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })()}
            <div className="mt-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.12] to-transparent p-3">
              <div className="flex items-center gap-3">
                <RankEmblem tier={rank.tier} division={rank.division} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Sua posição atual</p>
                  <p className="text-lg font-black uppercase italic" style={{ color: colors.text }}>{tierLabel(rank)}</p>
                  <p className="text-xs text-muted-foreground">{rank.lp.toLocaleString("pt-BR")} LP</p>
                </div>
                <div className="border-l border-white/10 pl-3 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Próximo objetivo</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{progress.label}</p>
                  <p className="text-xs text-primary">{Math.max(0, progress.max - progress.value)} LP restantes</p>
                </div>
              </div>
            </div>
          </section>

          {/* Estatísticas */}
          <section className={`${GLASS} p-5`}>
            <h2 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-foreground">Estatísticas gerais</h2>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="LP ganhos" value={rank.totalEarned.toLocaleString("pt-BR")} accent={colors.ring} />
              <StatCard label="LP perdidos" value={rank.totalLost.toLocaleString("pt-BR")} accent="#fb7185" />
              <StatCard label="Taxa de acerto" value={`${winRate}%`} accent="#34d399" />
              <StatCard label="Pico da carreira" value={isElite(rank.peakTier) ? TIER_LABEL[rank.peakTier] : `${TIER_LABEL[rank.peakTier]} ${DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]}`} accent={TIER_COLORS[rank.peakTier].ring} />
            </div>
          </section>

          {/* Atividade recente */}
          <section className={`${GLASS} p-5`}>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-foreground">Atividade recente</h2>
            </div>
            {rank.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento ainda. Comece a revisar cartas para ganhar LP.</p>
            ) : (
              <ul className="divide-y divide-white/[0.07]">
                {rank.history.slice(0, 5).map((event, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{reasonLabel(event.reason)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-black tabular-nums ${event.delta > 0 ? "text-emerald-400" : event.delta < 0 ? "text-rose-400" : "text-muted-foreground"}`}>{event.delta > 0 ? "+" : ""}{event.delta} LP</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Sobre o sistema de rank e regras de LP */}
      <section className={`${GLASS} mt-4 p-5`}>
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase italic tracking-[0.12em] text-foreground">Como funciona o rank</h2>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Seu rank transforma o estudo em uma jornada competitiva. Você ganha LP ao acertar cartas, derrotar inimigos e manter a constância; erros e abandono podem reduzir sua pontuação.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400">Como ganhar LP</h3>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {[
                ["Acerto fácil", "+3"], ["Acerto médio", "+2"], ["Acerto difícil", "+1"],
                ["Derrotar inimigo", "+8"], ["Aula de gramática", "até +10"],
                ["Redação ≥ 70", "+15"], ["Redação ≥ 90", "+30"],
                ["Prova mensal (aprovado)", "+25 a +123"], ["Bônus diário de streak", "+2 a +12"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2">
                  <span className="text-muted-foreground">{label}</span><span className="font-bold text-emerald-400">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-400">Como perder LP</h3>
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              {[
                ["Errar carta", "−4"], ["Carta virou inimiga", "−12"],
                ["Prova mensal reprovado (<50%)", "−25"], ["Streak quebrado (1–2 dias)", "−10"],
                ["Streak quebrado (3–6 dias)", "−20"], ["Streak quebrado (7+ dias)", "−35"],
                ["Inimigo ignorado (>24h)", "−3 cada · cap −15/dia"],
                ["Inatividade (a partir do Ouro)", "−2/dia após 3 dias · cap −12/dia"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/15 bg-rose-500/[0.05] px-2.5 py-2">
                  <span className="text-muted-foreground">{label}</span><span className="font-bold text-rose-400">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground">Cada divisão custa 100 LP e a promoção exige 3 vitórias com no máximo 2 derrotas.</p>
      </section>

      {currentProfile && (
        <ShareAchievement
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          profile={currentProfile}
          rank={rank}
          streak={streak}
          cardsMastered={cardsMastered}
          totalCards={cards.length}
        />
      )}
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`${GLASS} group p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 sm:p-4`}>
      <div className="mb-2 h-0.5 w-7 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums tracking-tight sm:text-2xl" style={{ color: accent }}>
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-black uppercase italic tracking-[0.16em] text-foreground">
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
              className={`relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 transition ${e.isActive ? "border-primary/35 bg-primary/[0.07] shadow-[0_0_24px_rgba(255,255,255,0.035)]" : "border-white/[0.07] bg-black/20 hover:border-white/15 hover:bg-white/[0.035]"}`}
            >
              <span
                aria-hidden
                className={`w-6 text-center text-sm font-black italic tabular-nums ${idx === 0 && rank ? "text-amber-300" : idx === 1 && rank ? "text-slate-300" : idx === 2 && rank ? "text-orange-300" : "text-muted-foreground"}`}
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
