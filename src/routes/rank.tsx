import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, TrendingUp, Sparkles, Info, Users, RefreshCw, Share2 } from "lucide-react";
import {
  useRank,
  tierLabel,
  progressToNext,
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
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
    <main className="relative mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Início
      </Link>

      {/* Cabeçalho competitivo */}
      <section className="relative mb-5 overflow-hidden border-b border-white/[0.12] pb-5">
        <div className="absolute inset-0 -z-10 opacity-70" style={{ backgroundImage: \`radial-gradient(75% 130% at 12% 0%, \${colors.glow}, transparent 70%), linear-gradient(90deg, rgba(255,255,255,0.035), transparent 65%)\` }} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-1 rounded-full blur-xl" style={{ background: colors.glow }} />
              <div className="relative"><RankEmblem tier={rank.tier} division={rank.division} size={92} /></div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Seu elo atual</p>
              <h1 className="mt-0.5 text-3xl font-black uppercase italic tracking-tight sm:text-4xl" style={{ color: colors.text }}>{tierLabel(rank)}</h1>
              <p className="mt-1 text-xs text-white/55"><strong className="text-white">{rank.lp} LP</strong><span className="mx-2 text-white/20">·</span>{progress.label}</p>
              <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: \`\${progressPct}%\`, background: \`linear-gradient(90deg, \${colors.from}, \${colors.ring})\` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto sm:justify-end">
            {rank.promo && <div className="text-xs text-white/55"><span className="font-semibold text-white">Promoção</span><span className="mx-2 text-white/20">·</span>{rank.promo.wins}V {rank.promo.losses}D / {rank.promo.target}V</div>}
            <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </section>

      {/* Classificação em primeiro plano */}
      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between border-b border-white/[0.1] pb-2">
          <div>
            <h2 className="text-sm font-bold text-white">Classificação dos perfis</h2>
            <p className="mt-0.5 text-[10px] text-white/40">Compare a evolução dos perfis deste dispositivo</p>
          </div>
        </div>
        <ProfilesLeaderboard glass={GLASS} />
      </section>

      {/* Informações secundárias */}
      <div className="grid items-start gap-6 border-t border-white/[0.1] pt-5 lg:grid-cols-[1fr_1fr]">
        <div className="min-w-0">
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Progressão de elo</h2>
              <span className="text-[10px] text-white/35">{progress.label}</span>
            </div>
            <div className="relative py-2">
              <div className="absolute left-3 right-3 top-7 h-px bg-gradient-to-r from-white/15 via-primary/60 to-amber-400/60" />
              <ol className="relative grid grid-cols-5 gap-x-1 gap-y-4">
                {(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"] as Tier[]).map((t, i) => {
                  const tierColors = TIER_COLORS[t];
                  const isCurrent = t === rank.tier;
                  const reached = ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].indexOf(t) <= ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].indexOf(rank.tier);
                  return <li key={t} className="flex min-w-0 flex-col items-center text-center"><div className={\`relative z-10 \${isCurrent ? "drop-shadow-[0_0_10px_rgba(168,85,247,0.45)]" : "opacity-75"}\`}><RankEmblem tier={t} division={4} size={34} /></div><span className="mt-1 text-[8px] font-bold uppercase tracking-wide" style={{ color: reached ? tierColors.text : "rgba(255,255,255,0.3)" }}>{TIER_LABEL[t]}</span>{isCurrent && <span className="mt-0.5 text-[8px] font-bold uppercase text-primary">Atual</span>}</li>;
                })}
              </ol>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.08] pt-3">
              <RankEmblem tier={rank.tier} division={rank.division} size={44} />
              <div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-widest text-white/40">Próximo objetivo</p><p className="text-sm font-semibold text-white">{progress.label}</p></div>
              <p className="text-right text-xs font-semibold text-primary">{Math.max(0, progress.max - progress.value)} LP<br /><span className="text-[9px] font-normal text-white/40">restantes</span></p>
            </div>
          </section>
        </div>
        <div className="min-w-0">
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/60">Temporada</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 border-y border-white/[0.09] py-3">
              <StatCard label="LP ganhos" value={rank.totalEarned.toLocaleString("pt-BR")} accent={colors.ring} />
              <StatCard label="LP perdidos" value={rank.totalLost.toLocaleString("pt-BR")} accent="#fb7185" />
              <StatCard label="Taxa de acerto" value={\`\${winRate}%\`} accent="#34d399" />
              <StatCard label="Pico da carreira" value={isElite(rank.peakTier) ? TIER_LABEL[rank.peakTier] : \`\${TIER_LABEL[rank.peakTier]} \${DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]}\`} accent={TIER_COLORS[rank.peakTier].ring} />
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-primary" /><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Atividade recente</h2></div>
            {rank.history.length === 0 ? <p className="py-3 text-xs text-white/40">Nenhuma atividade registrada ainda.</p> : <ul className="divide-y divide-white/[0.07]">{rank.history.slice(0, 5).map((event, i) => <li key={i} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="truncate text-xs text-white/80">{reasonLabel(event.reason)}</p><p className="text-[9px] text-white/35">{new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div><span className={\`shrink-0 text-xs font-bold tabular-nums \${event.delta > 0 ? "text-emerald-400" : event.delta < 0 ? "text-rose-400" : "text-white/40"}\`}>{event.delta > 0 ? "+" : ""}{event.delta} LP</span></li>)}</ul>}
          </section>
        </div>
      </div>

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
    <div className="min-w-0 border-l border-white/[0.12] pl-3 first:border-0 first:pl-0">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-1 truncate text-lg font-bold tabular-nums tracking-tight" style={{ color: accent }}>{value}</p>
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

  entries.sort((a, b) => (b.rank?.totalEarned ?? -1) - (a.rank?.totalEarned ?? -1));
  const rankedEntries = entries.filter((entry) => entry.rank);
  const podium = rankedEntries.slice(0, 3);
  const remainingEntries = [...rankedEntries.slice(3), ...entries.filter((entry) => !entry.rank)];

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Classificação</h2>
        <button onClick={() => setTick((t) => t + 1)} className="text-[10px] font-semibold text-white/45 transition hover:text-white/80">
          <RefreshCw className="mr-1 inline h-3 w-3" /> Atualizar
        </button>
      </div>
      {podium.length > 0 && (
        <div className="mb-3 grid grid-cols-3 items-end gap-2">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => {
            const position = rankedEntries.findIndex((item) => item.profileId === entry.profileId) + 1;
            const first = position === 1;
            const medal = position === 1 ? "text-amber-300" : position === 2 ? "text-slate-300" : "text-orange-300";
            return (
              <div key={entry.profileId} className={"flex min-w-0 flex-col items-center border-b-2 px-1 pb-3 pt-2 text-center " + (first ? "min-h-[148px] border-amber-400 bg-white/[0.045]" : "min-h-[132px] border-white/10")}>
                <span className={"text-lg font-black italic " + medal}>{position}</span>
                <span className="mt-1 h-9 w-9 rounded-full border border-white/15" style={{ backgroundImage: entry.gradient }} />
                <p className="mt-1.5 w-full truncate text-[11px] font-semibold text-white/90">{entry.name}</p>
                <RankEmblem tier={entry.rank!.tier} division={entry.rank!.division} size={first ? 38 : 32} />
                <p className="text-[9px] font-semibold text-white/60">{tierLabel(entry.rank!)}</p>
                <p className="text-[10px] font-bold tabular-nums text-white/85">{entry.rank!.lp} LP</p>
                {entry.isActive && <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-primary">Você</span>}
              </div>
            );
          })}
        </div>
      )}
      <div className="divide-y divide-white/[0.07] border-y border-white/[0.08]">
        <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-2 py-2 text-[9px] font-bold uppercase tracking-widest text-white/35">
          <span>#</span><span>Perfil</span><span>Rank</span>
        </div>
        {remainingEntries.map((entry) => {
          const position = rankedEntries.findIndex((item) => item.profileId === entry.profileId) + 1;
          const tierColors = TIER_COLORS[entry.rank?.tier ?? "iron"];
          return (
            <div key={entry.profileId} className={"grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 py-2.5 " + (entry.isActive ? "bg-white/[0.035]" : "")}>
              <span className="text-xs tabular-nums text-white/45">{entry.rank ? position : "—"}</span>
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-7 w-7 shrink-0 rounded-full border border-white/10" style={{ backgroundImage: entry.gradient }} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white/85">{entry.name}{entry.isActive ? " · você" : ""}</p>
                  <p className="text-[9px] text-white/35">{entry.rank ? entry.rank.lp + " LP" : "Sem partidas"}</p>
                </div>
              </div>
              {entry.rank ? <div className="flex items-center gap-1.5"><RankEmblem tier={entry.rank.tier} division={entry.rank.division} size={24} /><span className="text-[10px] font-semibold" style={{ color: tierColors.text }}>{tierLabel(entry.rank)}</span></div> : <span className="text-[10px] text-white/30">—</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
