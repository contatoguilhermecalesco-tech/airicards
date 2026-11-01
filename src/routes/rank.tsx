import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Share2, Trophy } from "lucide-react";
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
      { name: "description", content: "Sua jornada ranqueada no airi." },
      { property: "og:title", content: "Rank — airi" },
      { property: "og:description", content: "Evolua com cada carta." },
    ],
  }),
});

function reasonLabel(reason: string): string {
  const labels: Record<string, string> = {
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
  return labels[reason] ?? reason;
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
    () => cards.filter((card) => (card.reps ?? 0) >= 3 && (card.lapses ?? 0) === 0).length,
    [cards],
  );
  const [shareOpen, setShareOpen] = useState(false);
  const winRate = useMemo(() => {
    const total = rank.totalEarned + rank.totalLost;
    return total === 0 ? 0 : Math.round((rank.totalEarned / total) * 100);
  }, [rank.totalEarned, rank.totalLost]);

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] px-3 pb-10 pt-3 text-white sm:px-6 sm:pt-5">
      <div className="overflow-hidden border border-white/[0.12] bg-[#17181c] shadow-[0_22px_70px_rgba(0,0,0,.32)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] bg-[#202126] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 transition hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Início
            </Link>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white">AIRI <span className="text-[#c5a46b]">/ RANK</span></span>
          </div>
          <nav className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 sm:gap-6">
            <a href="#visao-geral" className="text-[#d7b879]">Visão geral</a>
            <a href="#classificacao" className="transition hover:text-white">Classificação</a>
            <a href="#temporada" className="transition hover:text-white">Temporada</a>
          </nav>
          <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-1.5 bg-[#d85a36] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.13em] text-white transition hover:bg-[#ed6841]">
            <Share2 className="h-3 w-3" /> Compartilhar
          </button>
        </header>

        <section id="visao-geral" className="grid gap-6 border-b border-white/[0.09] bg-[linear-gradient(110deg,#191b20_0%,#141519_58%,#1b1918_100%)] px-4 py-6 sm:px-6 lg:grid-cols-[1.25fr_.9fr] lg:gap-9 lg:px-8 lg:py-7">
          <div>
            <p className="mb-4 text-[9px] font-black uppercase tracking-[0.24em] text-[#c5a46b]">Sua liga</p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-4 sm:block sm:text-center">
                <div className="relative"><div className="absolute inset-0 scale-110 rounded-full blur-2xl" style={{ background: colors.glow }} /><RankEmblem tier={rank.tier} division={rank.division} size={104} /></div>
                <div className="sm:mt-2"><p className="text-lg font-black uppercase tracking-wide" style={{ color: colors.text }}>{tierLabel(rank)}</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.17em] text-white/40">Temporada atual</p></div>
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 border-l border-white/[0.09] pl-0 sm:pl-6">
                <Metric label="Pontuação" value={`${rank.lp} LP`} accent={colors.text} />
                <Metric label="Taxa de acerto" value={`${winRate}%`} />
                <Metric label="LP conquistados" value={rank.totalEarned.toLocaleString("pt-BR")} />
                <Metric label="Sequência atual" value={`${streak.current} dias`} />
                <div className="col-span-2 pt-1">
                  <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-white/45"><span>Progresso da divisão</span><span>{progressPct}%</span></div>
                  <div className="h-1.5 overflow-hidden bg-white/[0.10]"><div className="h-full transition-all" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg,${colors.from},${colors.ring})` }} /></div>
                  <p className="mt-1.5 text-[9px] text-white/35">{Math.max(0, progress.max - progress.value)} LP para {progress.label}</p>
                </div>
              </div>
            </div>
          </div>
          <div id="classificacao" className="border-t border-white/[0.09] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div className="mb-3 flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#c5a46b]">Classificação local</p><span className="text-[9px] text-white/30">Neste dispositivo</span></div>
            <ProfilesLeaderboard />
          </div>
        </section>

        <section id="temporada" className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.10] pb-2.5">
            <div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#c5a46b]">Atividade ranqueada</p><h2 className="mt-1 text-sm font-bold uppercase tracking-[0.08em]">Sua jornada</h2></div>
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">Temporada atual</span>
          </div>
          <div className="grid gap-0 md:grid-cols-3">
            <section className="border-b border-white/[0.09] pb-5 md:border-b-0 md:border-r md:pr-6">
              <h3 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/55">Caminho dos elos</h3>
              <div className="grid grid-cols-5 gap-x-1 gap-y-3 sm:grid-cols-10 md:grid-cols-5">
                {(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"] as Tier[]).map((tier, index, all) => {
                  const currentIndex = all.indexOf(rank.tier);
                  const current = tier === rank.tier;
                  return <div key={tier} className={`flex flex-col items-center ${current ? "opacity-100" : index < currentIndex ? "opacity-65" : "opacity-25"}`}>
                    <RankEmblem tier={tier} division={4} size={32} />
                    <span className="mt-1 text-[7px] font-bold uppercase" style={{ color: TIER_COLORS[tier].text }}>{TIER_LABEL[tier]}</span>
                  </div>;
                })}
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.08] pt-3">
                <RankEmblem tier={rank.tier} division={rank.division} size={38} />
                <div className="min-w-0"><p className="text-[8px] uppercase tracking-widest text-white/35">Próximo objetivo</p><p className="text-xs font-semibold text-white/85">{progress.label}</p></div>
              </div>
            </section>

            <section className="border-b border-white/[0.09] py-5 md:border-b-0 md:border-r md:px-6 md:py-0">
              <h3 className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/55">Desempenho da temporada</h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                <Metric label="LP ganhos" value={rank.totalEarned.toLocaleString("pt-BR")} accent={colors.text} />
                <Metric label="LP perdidos" value={rank.totalLost.toLocaleString("pt-BR")} accent="#e87979" />
                <Metric label="Cartas dominadas" value={cardsMastered.toLocaleString("pt-BR")} />
                <Metric label="Pico da carreira" value={isElite(rank.peakTier) ? TIER_LABEL[rank.peakTier] : `${TIER_LABEL[rank.peakTier]} ${DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]}`} />
              </div>
            </section>

            <section className="pt-5 md:pl-6 md:pt-0">
              <h3 className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"><Trophy className="h-3 w-3 text-[#c5a46b]" /> Histórico recente</h3>
              {rank.history.length === 0 ? <p className="py-2 text-xs text-white/35">Nenhuma atividade registrada.</p> : <ul className="divide-y divide-white/[0.07]">{rank.history.slice(0, 4).map((event, index) => <li key={index} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="truncate text-[10px] text-white/75">{reasonLabel(event.reason)}</p><p className="text-[8px] text-white/30">{new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div><span className={`shrink-0 text-[10px] font-bold tabular-nums ${event.delta > 0 ? "text-emerald-400" : event.delta < 0 ? "text-rose-400" : "text-white/35"}`}>{event.delta > 0 ? "+" : ""}{event.delta} LP</span></li>)}</ul>}
            </section>
          </div>
        </section>
      </div>
      {currentProfile && <ShareAchievement open={shareOpen} onClose={() => setShareOpen(false)} profile={currentProfile} rank={rank} streak={streak} cardsMastered={cardsMastered} totalCards={cards.length} />}
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return <div className="min-w-0"><p className="truncate text-[8px] font-bold uppercase tracking-[0.15em] text-white/35">{label}</p><p className="mt-1 truncate text-sm font-bold tabular-nums" style={{ color: accent ?? "#f1f1f2" }}>{value}</p></div>;
}

function ProfilesLeaderboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((value) => value + 1);
    window.addEventListener("focus", onFocus);
    const unsubscribe = subscribeAllRanks(() => setTick((value) => value + 1));
    return () => { window.removeEventListener("focus", onFocus); unsubscribe(); };
  }, []);
  void tick;
  const active = getCurrentProfile();
  const entries = PROFILES.map((profile) => ({ profileId: profile.id, name: profile.name, gradient: profile.gradient, isActive: active?.id === profile.id, rank: readRankForProfile(profile.id) }));
  entries.sort((a, b) => (b.rank?.totalEarned ?? -1) - (a.rank?.totalEarned ?? -1));
  return <div>
    <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] gap-2 border-b border-white/[0.09] pb-2 text-[8px] font-bold uppercase tracking-[0.13em] text-white/30"><span>#</span><span>Jogador</span><span className="text-right">Liga / LP</span></div>
    {entries.map((entry, index) => {
      const tier = entry.rank?.tier ?? "iron";
      return <div key={entry.profileId} className={`grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.06] py-2 ${entry.isActive ? "bg-white/[0.035]" : ""}`}>
        <span className={`text-[10px] font-bold tabular-nums ${index === 0 ? "text-[#d7b879]" : "text-white/30"}`}>{entry.rank ? index + 1 : "—"}</span>
        <div className="flex min-w-0 items-center gap-2"><span className="h-6 w-6 shrink-0 rounded-full border border-white/10" style={{ backgroundImage: entry.gradient }} /><span className="truncate text-[10px] font-semibold text-white/80">{entry.name}{entry.isActive ? <span className="ml-1 text-[8px] text-[#d7b879]">VOCÊ</span> : null}</span></div>
        {entry.rank ? <span className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: TIER_COLORS[tier].text }}><RankEmblem tier={tier} division={entry.rank.division} size={25} /><span className="whitespace-nowrap">{tierLabel(entry.rank)} · {entry.rank.lp} LP</span></span> : <span className="text-[9px] text-white/25">Sem rank</span>}
      </div>;
    })}
    <div className="flex justify-end pt-2"><button onClick={() => setTick((value) => value + 1)} className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-white/30 transition hover:text-white/70"><RefreshCw className="h-2.5 w-2.5" /> Atualizar</button></div>
  </div>;
}
