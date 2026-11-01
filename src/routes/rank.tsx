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
    <main className="mx-auto min-h-screen max-w-[1240px] px-2 pb-10 pt-2 text-white sm:px-5 sm:pt-4">
      <div className="overflow-hidden border border-white/[0.10] bg-[#1b1b1d] shadow-[0_24px_70px_rgba(0,0,0,.35)]">
        <header className="flex min-w-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-[#202022] px-2 sm:min-h-11 sm:px-6">
          <nav className="flex h-11 min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap text-[8px] font-black uppercase tracking-[0.09em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 sm:text-[9px] sm:tracking-[0.13em]">
            <Link to="/" className="flex h-full shrink-0 items-center border-b-2 border-[#ff5a1f] px-1.5 text-white/90 hover:text-white">AIRI</Link>
            <Link to="/study" className="shrink-0 text-white/40 transition hover:text-white">Estudar</Link>
            <Link to="/desafios" className="shrink-0 text-white/40 transition hover:text-white">Desafios</Link>
            <Link to="/conquistas" className="shrink-0 text-white/40 transition hover:text-white">Conquistas</Link>
          </nav>
          <button onClick={() => setShareOpen(true)} aria-label="Compartilhar rank" className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 bg-[#ff5a1f] px-2 text-[8px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#ff713e] sm:px-4 sm:text-[9px] sm:tracking-[0.12em]"><Share2 className="h-3 w-3" /><span className="hidden sm:inline">Compartilhar</span><span className="sm:hidden">Share</span></button>
        </header>

        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#242426] px-3 sm:min-h-10 sm:px-6">
          <nav className="flex h-10 min-w-0 flex-1 items-center gap-4 overflow-x-auto whitespace-nowrap text-[7px] font-bold uppercase tracking-[0.08em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-8 sm:text-[8px] sm:tracking-[0.12em]">
            <a href="#liga" className="flex h-full shrink-0 items-center border-b border-[#ff5a1f] text-white">Visão geral</a>
            <a href="#ladder" className="shrink-0 text-white/40 transition hover:text-white">Atividades</a>
            <a href="#temporada" className="shrink-0 text-white/40 transition hover:text-white">Temporada</a>
          </nav>
          <span className="hidden shrink-0 text-[8px] uppercase tracking-[0.12em] text-white/30 sm:inline">Temporada atual</span>
        </div>

        <section id="liga" className="px-4 pb-6 pt-6 sm:px-6 lg:px-7">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/75">Sua liga</p>
          <div className="grid overflow-hidden bg-[#151517] lg:grid-cols-[156px_minmax(210px,1fr)_minmax(245px,1.15fr)]">
            <div className="flex flex-col items-center justify-center border-b border-white/[0.07] bg-[#111113] px-3 py-5 text-center lg:border-b-0 lg:border-r lg:border-white/[0.06]">
              <div className="relative"><div className="absolute inset-0 scale-125 rounded-full blur-2xl" style={{ background: colors.glow }} /><RankEmblem tier={rank.tier} division={rank.division} size={100} /></div>
              <p className="mt-2 text-xs font-black uppercase tracking-wide" style={{ color: colors.text }}>{tierLabel(rank)}</p>
              <p className="mt-0.5 text-[8px] text-white/35">Seu elo atual</p>
            </div>

            <div className="grid grid-cols-2 content-center gap-x-5 gap-y-4 border-b border-white/[0.07] px-4 py-5 sm:px-6 lg:border-b-0 lg:border-r lg:border-white/[0.06]">
              <Metric label="League rank" value={`${rank.lp} LP`} accent={colors.text} />
              <Metric label="League points" value={rank.totalEarned.toLocaleString("pt-BR")} />
              <Metric label="% de acerto" value={`${winRate}%`} />
              <Metric label="Resultados recentes" value={rank.history.length ? `${rank.history.filter((event) => event.delta > 0).length} vitórias` : "—"} />
              <div className="col-span-2">
                <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-[0.12em] text-white/35"><span>Progresso para {progress.label}</span><span>{progressPct}%</span></div>
                <div className="h-1 overflow-hidden bg-white/10"><div className="h-full" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${colors.from}, ${colors.ring})` }} /></div>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <div className="mb-2 flex items-center justify-between"><p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/55">Leaderboard</p><span className="text-[8px] text-white/30">Perfis locais</span></div>
              <ProfilesLeaderboard />
            </div>
          </div>
        </section>

        <section id="ladder" className="px-4 pb-6 sm:px-6 lg:px-7">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">Atividades em destaque</h2><span className="text-[8px] uppercase tracking-[0.12em] text-white/30">Continue evoluindo</span></div>
          <div className="grid gap-2.5 md:grid-cols-3">
            <ActivityBanner to="/study" eyebrow="Treino diário" title="SESSÃO DE ESTUDO" subtitle="Revise cartas e ganhe LP" tone="green" />
            <ActivityBanner to="/desafios" eyebrow="Desafios" title="DESAFIE-SE" subtitle="Complete metas e avance" tone="red" />
            <ActivityBanner to="/conquistas" eyebrow="Progresso" title="CONQUISTAS" subtitle="Veja tudo que já desbloqueou" tone="violet" />
          </div>
        </section>

        <section id="temporada" className="grid gap-6 border-t border-white/[0.08] bg-[#171719] px-4 py-5 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-7">
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">Caminho dos elos</h2><span className="text-[8px] text-white/30">{progress.label}</span></div>
            <div className="grid grid-cols-5 gap-y-3 sm:grid-cols-10">
              {(["iron", "bronze", "silver", "gold", "platinum", "emerald", "diamond", "master", "grandmaster", "challenger"] as Tier[]).map((tier, index, all) => {
                const currentIndex = all.indexOf(rank.tier);
                const current = tier === rank.tier;
                return <div key={tier} className={`flex flex-col items-center ${current ? "opacity-100" : index < currentIndex ? "opacity-60" : "opacity-20"}`}><RankEmblem tier={tier} division={4} size={30} /><span className="mt-1 text-[7px] font-bold uppercase" style={{ color: TIER_COLORS[tier].text }}>{TIER_LABEL[tier]}</span></div>;
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.08] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <Metric label="LP ganhos" value={rank.totalEarned.toLocaleString("pt-BR")} accent={colors.text} />
            <Metric label="LP perdidos" value={rank.totalLost.toLocaleString("pt-BR")} accent="#e87979" />
            <Metric label="Cartas dominadas" value={cardsMastered.toLocaleString("pt-BR")} />
            <Metric label="Pico da carreira" value={isElite(rank.peakTier) ? TIER_LABEL[rank.peakTier] : `${TIER_LABEL[rank.peakTier]} ${DIVISION_ROMAN[rank.peakDivision as 1 | 2 | 3 | 4]}`} />
            <div className="col-span-2 border-t border-white/[0.08] pt-3">
              <h3 className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/50"><Trophy className="h-3 w-3 text-[#c5a46b]" /> Histórico recente</h3>
              {rank.history.length === 0 ? <p className="text-[10px] text-white/30">Nenhuma atividade registrada.</p> : <ul className="grid gap-x-5 sm:grid-cols-2">{rank.history.slice(0, 4).map((event, index) => <li key={index} className="flex items-center justify-between gap-2 border-b border-white/[0.05] py-1.5"><span className="truncate text-[9px] text-white/65">{reasonLabel(event.reason)}</span><span className={`shrink-0 text-[9px] font-bold ${event.delta > 0 ? "text-emerald-400" : event.delta < 0 ? "text-rose-400" : "text-white/35"}`}>{event.delta > 0 ? "+" : ""}{event.delta} LP</span></li>)}</ul>}
            </div>
          </div>
        </section>
      </div>
      {currentProfile && <ShareAchievement open={shareOpen} onClose={() => setShareOpen(false)} profile={currentProfile} rank={rank} streak={streak} cardsMastered={cardsMastered} totalCards={cards.length} />}
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return <div className="min-w-0"><p className="truncate text-[8px] font-bold uppercase tracking-[0.13em] text-white/35">{label}</p><p className="mt-1 truncate text-sm font-bold tabular-nums" style={{ color: accent ?? "#f1f1f2" }}>{value}</p></div>;
}

function ActivityBanner({ to, eyebrow, title, subtitle, tone }: { to: "/study" | "/desafios" | "/conquistas"; eyebrow: string; title: string; subtitle: string; tone: "green" | "red" | "violet" }) {
  const tones = {
    green: "from-emerald-700/90 via-emerald-900/80 to-[#10251f]",
    red: "from-orange-700/90 via-rose-900/80 to-[#28151b]",
    violet: "from-violet-700/90 via-purple-950/80 to-[#1c172b]",
  };
  return <Link to={to} className={`group relative flex min-h-[142px] flex-col justify-between overflow-hidden bg-gradient-to-br ${tones[tone]} p-3.5 transition hover:brightness-110`}>
    <div className="absolute -right-5 -top-8 h-36 w-36 rotate-12 border-[18px] border-white/[0.06] transition duration-500 group-hover:rotate-6" />
    <div className="relative flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.13em] text-white/75"><span className="h-1.5 w-1.5 rounded-full bg-lime-400" />{eyebrow}</div>
    <div className="relative"><p className="text-center text-xl font-black italic leading-none tracking-tight text-white drop-shadow-lg sm:text-2xl">{title}</p><p className="mt-2 text-center text-[8px] font-bold uppercase tracking-[0.1em] text-white/70">{subtitle}</p></div>
    <div className="relative flex items-center justify-between border-t border-white/20 pt-2 text-[7px] font-black uppercase tracking-[0.12em] text-white/70"><span>Entrar</span><span className="text-sm transition group-hover:translate-x-1">→</span></div>
  </Link>;
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
