import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, Share2, RefreshCw } from "lucide-react";
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
    <main className="mx-auto min-h-screen max-w-6xl bg-[#0d0e12] px-3 pb-10 pt-3 text-white sm:px-6 sm:pt-5">
      <Link to="/" className="mb-3 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      <section className="relative mb-5 overflow-hidden border-y border-white/10 bg-[#15161b]">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(110deg, " + colors.glow + " 0%, transparent 48%), linear-gradient(90deg, rgba(255,255,255,.035), transparent 70%)" }} />
        <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <RankEmblem tier={rank.tier} division={rank.division} size={82} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Seu rank</p>
              <h1 className="mt-1 text-3xl font-black uppercase italic tracking-tight sm:text-4xl" style={{ color: colors.text }}>{tierLabel(rank)}</h1>
              <p className="mt-1 text-sm text-white/65"><strong className="text-white">{rank.lp} LP</strong><span className="mx-2 text-white/25">|</span>{progress.label}</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-4 sm:ml-8">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-[10px] text-white/45"><span>Progresso</span><span>{progressPct}%</span></div>
              <div className="h-2 overflow-hidden bg-white/10">
                <div className="h-full" style={{ width: progressPct + "%", background: "linear-gradient(90deg, " + colors.from + ", " + colors.ring) }} />
              </div>
              <p className="mt-1 text-[10px] text-white/40">{Math.max(0, progress.max - progress.value)} LP para o próximo objetivo</p>
            </div>
            <button onClick={() => setShareOpen(true)} className="shrink-0 border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10">
              <Share2 className="mr-1.5 inline h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>
        </div>
      </section>

      <section className="mb-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <h2 className="text-sm font-bold tracking-wide text-white">Leaderboard</h2>
          <span className="text-[10px] uppercase tracking-wider text-white/35">Perfis deste dispositivo</span>
        </div>
        <ProfilesLeaderboard />
      </section>

      <div className="grid gap-7 border-t border-white/10 pt-5 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Todos os elos</h2>
            <span className="text-[10px] text-white/35">{progress.label}</span>
          </div>
          <ol className="grid grid-cols-5 gap-y-4 border-y border-white/[0.08] py-4 sm:grid-cols-10">
            {(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"] as Tier[]).map((t) => {
              const current = t === rank.tier;
              const reached = ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].indexOf(t) <= ["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"].indexOf(rank.tier);
              return <li key={t} className={"flex flex-col items-center text-center " + (current ? "opacity-100" : reached ? "opacity-75" : "opacity-30")}><div className={current ? "drop-shadow-[0_0_9px_rgba(168,85,247,.4)]" : ""}><RankEmblem tier={t} division={4} size={38} /></div><span className="mt-1 text-[8px] font-bold uppercase" style={{ color: TIER_COLORS[t].text }}>{TIER_LABEL[t]}</span>{current && <span className="mt-1 text-[8px] font-bold uppercase text-primary">Atual</span>}</li>;
            })}
          </ol>
          <div className="mt-3 flex items-center gap-3">
            <RankEmblem tier={rank.tier} division={rank.division} size={48} />
            <div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-widest text-white/40">Próximo objetivo</p><p className="text-sm font-semibold text-white">{progress.label}</p></div>
            <p className="text-right text-sm font-bold text-primary">{Math.max(0, progress.max - progress.value)} LP<span className="block text-[9px] font-normal text-white/40">restantes</span></p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/60">Temporada</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-y border-white/[0.08] py-4">
            <StatCard label="LP ganhos" value={rank.totalEarned.toLocaleString("pt-BR")} accent={colors.ring} />
            <StatCard label="LP perdidos" value={rank.totalLost.toLocaleString("pt-BR")} accent="#fb7185" />
            <StatCard label="Taxa de acerto" value={winRate + "%"} accent="#34d399" />
            <StatCard label="Pico da carreira" value={isElite(rank.peakTier) ? TIER_LABEL[rank.peakTier] : TIER_LABEL[rank.peakTier] + " " + DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]} accent={TIER_COLORS[rank.peakTier].ring} />
          </div>
          <div className="mt-5">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60"><Trophy className="h-3.5 w-3.5 text-primary" /> Histórico recente</h2>
            {rank.history.length === 0 ? <p className="py-3 text-xs text-white/40">Nenhuma atividade registrada.</p> : <ul className="divide-y divide-white/[0.07]">{rank.history.slice(0, 5).map((event, i) => <li key={i} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="truncate text-xs text-white/80">{reasonLabel(event.reason)}</p><p className="text-[9px] text-white/35">{new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div><span className={"shrink-0 text-xs font-bold tabular-nums " + (event.delta > 0 ? "text-emerald-400" : event.delta < 0 ? "text-rose-400" : "text-white/40")}>{event.delta > 0 ? "+" : ""}{event.delta} LP</span></li>)}</ul>}
          </div>
        </section>
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

function ProfilesLeaderboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    const unsub = subscribeAllRanks(() => setTick((t) => t + 1));
    return () => { window.removeEventListener("focus", onFocus); unsub(); };
  }, []);
  void tick;
  const active = getCurrentProfile();
  const entries = PROFILES.map((p) => ({ profileId: p.id, name: p.name, gradient: p.gradient, isActive: active?.id === p.id, rank: readRankForProfile(p.id) }));
  entries.sort((a, b) => (b.rank?.totalEarned ?? -1) - (a.rank?.totalEarned ?? -1));
  const ranked = entries.filter((entry) => entry.rank);
  const podium = ranked.slice(0, 3);
  const rest = [...ranked.slice(3), ...entries.filter((entry) => !entry.rank)];
  return (
    <div className="min-w-0">
      {podium.length > 0 && <div className="mb-4 grid grid-cols-3 gap-px bg-white/[0.08]">
        {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => {
          const place = ranked.findIndex((item) => item.profileId === entry.profileId) + 1;
          const first = place === 1;
          const medal = place === 1 ? "#e9bd65" : place === 2 ? "#c7cbd2" : "#c88a58";
          return <div key={entry.profileId} className={"relative flex min-w-0 flex-col items-center bg-[#15161b] px-2 py-4 text-center " + (first ? "sm:py-5" : "")}>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: medal }}>{place === 1 ? "1º lugar" : place === 2 ? "2º lugar" : "3º lugar"}</span>
            <span className="my-2 h-10 w-10 rounded-full border border-white/15" style={{ backgroundImage: entry.gradient }} />
            <p className="w-full truncate text-xs font-semibold text-white/90">{entry.name}</p>
            <div className="mt-1"><RankEmblem tier={entry.rank!.tier} division={entry.rank!.division} size={first ? 54 : 44} /></div>
            <p className="mt-1 text-[10px] font-semibold text-white/60">{tierLabel(entry.rank!)}</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-white">{entry.rank!.lp} <span className="text-[9px] font-medium text-white/40">LP</span></p>
            {entry.isActive && <span className="mt-2 text-[8px] font-bold uppercase tracking-widest text-primary">Você</span>}
          </div>;
        })}
      </div>}
      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          <div className="grid grid-cols-[42px_minmax(0,1fr)_minmax(90px,.7fr)_minmax(95px,.7fr)] items-center bg-[#24252b] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/45">
            <span>#</span><span>Jogador</span><span>LP total</span><span className="text-right">Rank</span>
          </div>
          {rest.map((entry) => {
            const place = ranked.findIndex((item) => item.profileId === entry.profileId) + 1;
            const tc = TIER_COLORS[entry.rank?.tier ?? "iron"];
            return <div key={entry.profileId} className={"grid grid-cols-[42px_minmax(0,1fr)_minmax(90px,.7fr)_minmax(95px,.7fr)] items-center border-b border-white/[0.08] px-3 py-2.5 " + (entry.isActive ? "bg-white/[0.045]" : "bg-[#191a1f]")}>
              <span className="text-xs tabular-nums text-white/45">{entry.rank ? place : "—"}</span>
              <div className="flex min-w-0 items-center gap-2"><span className="h-7 w-7 shrink-0 rounded-full border border-white/10" style={{ backgroundImage: entry.gradient }} /><span className="truncate text-xs font-medium text-white/85">{entry.name}{entry.isActive ? " · você" : ""}</span></div>
              <span className="text-xs tabular-nums text-white/65">{entry.rank ? entry.rank.totalEarned.toLocaleString("pt-BR") : "—"}</span>
              {entry.rank ? <span className="flex items-center justify-end gap-1.5 text-[10px] font-semibold" style={{ color: tc.text }}><RankEmblem tier={entry.rank.tier} division={entry.rank.division} size={25} />{tierLabel(entry.rank)}</span> : <span className="text-right text-[10px] text-white/30">Sem rank</span>}
            </div>;
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] text-white/30"><span>Classificação local</span><button onClick={() => setTick((t) => t + 1)} className="inline-flex items-center gap-1 hover:text-white/65"><RefreshCw className="h-3 w-3" /> Atualizar</button></div>
    </div>
  );
}
