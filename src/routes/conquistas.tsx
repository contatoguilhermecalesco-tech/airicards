import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Check, Crown, Flame, Lock, Medal, Swords,
  Target, Trophy, Sparkles, Star, ShieldCheck,
} from "lucide-react";
import { useStore, useStreak, isDefeated } from "@/lib/flashcards-store";
import { useRank, TIER_ORDER } from "@/lib/rank-store";
import { useDuelHistory } from "@/lib/social-store";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Conquistas — airi" },
      { name: "description", content: "Acompanhe suas conquistas e marcos de aprendizado no airi." },
    ],
  }),
  component: AchievementsPage,
});

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  current: number;
  target: number;
  unlocked: boolean;
  category: "Estudos" | "Jornada" | "Competitivo";
  accent: string;
  trophy: "Bronze" | "Prata" | "Ouro" | "Platina";
};

function AchievementsPage() {
  const cards = useStore((s) => s.cards);
  const streak = useStreak();
  const rank = useRank();
  const duels = useDuelHistory();
  const [filter, setFilter] = useState<"Todas" | "Desbloqueadas">("Todas");

  const achievements = useMemo<Achievement[]>(() => {
    const reviewed = cards.reduce((sum, card) => sum + (card.successes ?? 0) + (card.lapses ?? 0), 0);
    const defeated = cards.filter(isDefeated).length;
    const peak = TIER_ORDER.indexOf(rank.peakTier);
    const studyDays = Math.max(Object.keys(streak.history ?? {}).length, streak.longest > 0 ? 1 : 0);
    const completedDuels = duels.length;
    const milestones: Omit<Achievement, "unlocked">[] = [
      { id: "first-study", title: "Primeiro passo", description: "Complete seu primeiro dia de estudos.", icon: BookOpen, current: Math.min(studyDays, 1), target: 1, category: "Estudos", accent: "#b69ae8", trophy: "Bronze" },
      { id: "reviews-10", title: "Aquecimento", description: "Revise 10 cartas.", icon: Target, current: Math.min(reviewed, 10), target: 10, category: "Estudos", accent: "#b69ae8", trophy: "Bronze" },
      { id: "reviews-100", title: "Memória em construção", description: "Revise 100 cartas.", icon: Target, current: Math.min(reviewed, 100), target: 100, category: "Estudos", accent: "#8f9ce8", trophy: "Bronze" },
      { id: "reviews-500", title: "Ritmo de aprendizado", description: "Revise 500 cartas.", icon: BookOpen, current: Math.min(reviewed, 500), target: 500, category: "Estudos", accent: "#8f9ce8", trophy: "Prata" },
      { id: "reviews-1000", title: "Mente afiada", description: "Revise 1.000 cartas.", icon: Star, current: Math.min(reviewed, 1000), target: 1000, category: "Estudos", accent: "#d6b36a", trophy: "Ouro" },
      { id: "reviews-5000", title: "Biblioteca viva", description: "Revise 5.000 cartas.", icon: Medal, current: Math.min(reviewed, 5000), target: 5000, category: "Estudos", accent: "#d6b36a", trophy: "Ouro" },
      { id: "streak-7", title: "Uma semana por você", description: "Mantenha 7 dias seguidos de estudos.", icon: Flame, current: Math.min(streak.longest, 7), target: 7, category: "Jornada", accent: "#e99a69", trophy: "Bronze" },
      { id: "streak-30", title: "Constância lendária", description: "Alcance 30 dias de sequência.", icon: Flame, current: Math.min(streak.longest, 30), target: 30, category: "Jornada", accent: "#e99a69", trophy: "Prata" },
      { id: "streak-100", title: "Disciplina de aço", description: "Alcance 100 dias de sequência.", icon: Flame, current: Math.min(streak.longest, 100), target: 100, category: "Jornada", accent: "#d6b36a", trophy: "Ouro" },
      { id: "first-duel", title: "Primeiro confronto", description: "Finalize seu primeiro duelo.", icon: Swords, current: Math.min(completedDuels, 1), target: 1, category: "Competitivo", accent: "#8e9de8", trophy: "Bronze" },
      { id: "duels-10", title: "Veterano da arena", description: "Finalize 10 duelos.", icon: Swords, current: Math.min(completedDuels, 10), target: 10, category: "Competitivo", accent: "#8e9de8", trophy: "Prata" },
      { id: "rank-silver", title: "Prata conquistada", description: "Alcance o Rank Prata.", icon: Medal, current: Math.min(peak + 1, TIER_ORDER.indexOf("silver") + 1), target: TIER_ORDER.indexOf("silver") + 1, category: "Competitivo", accent: "#c0c5d0", trophy: "Bronze" },
      { id: "gold-rank", title: "Em busca do ouro", description: "Alcance o Rank Ouro.", icon: Crown, current: Math.min(peak + 1, TIER_ORDER.indexOf("gold") + 1), target: TIER_ORDER.indexOf("gold") + 1, category: "Competitivo", accent: "#e5c16e", trophy: "Prata" },
      { id: "rank-diamond", title: "Além do limite", description: "Alcance o Rank Diamante.", icon: Star, current: Math.min(peak + 1, TIER_ORDER.indexOf("diamond") + 1), target: TIER_ORDER.indexOf("diamond") + 1, category: "Competitivo", accent: "#8fd7e8", trophy: "Ouro" },
      { id: "first-enemy", title: "Caçador de nêmesis", description: "Derrote sua primeira carta inimiga.", icon: ShieldCheck, current: Math.min(defeated, 1), target: 1, category: "Jornada", accent: "#d58b9b", trophy: "Bronze" },
      { id: "enemies-10", title: "Limpando o caminho", description: "Derrote 10 cartas inimigas.", icon: ShieldCheck, current: Math.min(defeated, 10), target: 10, category: "Jornada", accent: "#d58b9b", trophy: "Prata" },
    ];
    const earned = milestones.filter((item) => item.current >= item.target).length;
    const allEarned = earned === milestones.length;
    return [
      ...milestones.map((item) => ({ ...item, unlocked: item.current >= item.target })),
      { id: "platinum", title: "Lenda do AIRI", description: "Desbloqueie todos os outros troféus da coleção.", icon: Trophy, current: allEarned ? 1 : earned, target: milestones.length, unlocked: allEarned, category: "Jornada" as const, accent: "#c9b8f2", trophy: "Platina" as const },
    ];
  }, [cards, streak, rank, duels]);
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const platinum = achievements.find((item) => item.id === "platinum")!;
  const trophyCounts = (["Bronze", "Prata", "Ouro", "Platina"] as const).map((tier) => ({ tier, count: achievements.filter((item) => item.trophy === tier && item.unlocked).length, total: achievements.filter((item) => item.trophy === tier).length }));
  const visible = filter === "Desbloqueadas" ? achievements.filter((item) => item.unlocked) : achievements;

  return (
    <main className="min-h-dvh bg-[#111214] px-4 pb-28 pt-5 text-[#f3f3f5] sm:px-6 sm:pb-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#92949b] transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar</Link>

        <header className="mb-6 border-b border-white/[0.08] pb-5">
          <div className="flex items-center justify-between gap-4">
            <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#aaaeb8]">AIRI · PERFIL DO JOGADOR</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Troféus</h1><p className="mt-1.5 text-sm text-[#92949b]">Sua coleção de conquistas e marcos de estudo.</p></div>
            <div className="shrink-0 text-right"><p className="text-3xl font-semibold tabular-nums tracking-tight">{unlockedCount}<span className="text-lg text-[#777a82]">/{achievements.length}</span></p><p className="text-[9px] uppercase tracking-[0.2em] text-[#92949b]">desbloqueados</p></div>
          </div>
          <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-[#8b79bd] to-[#c9b8f2] transition-all duration-700" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} /></div><span className="text-[11px] tabular-nums text-[#a6a7ad]">{Math.round((unlockedCount / achievements.length) * 100)}%</span></div>
        </header>

        <section className="mb-7 overflow-hidden rounded-2xl border border-[#c9b8f2]/20 bg-[radial-gradient(ellipse_at_80%_20%,rgba(169,139,220,0.16),transparent_48%),linear-gradient(120deg,#24212b,#19191e_65%,#17171b)] p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full border border-[#d7c5ff]/35 bg-[radial-gradient(circle_at_35%_25%,#625579,#30283e_58%,#211c2a)] text-[#e2d5ff] shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_5px_rgba(255,255,255,0.18)]"><div className="absolute inset-1 rounded-full border border-white/10" /><Trophy className="h-9 w-9 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" strokeWidth={1.4} /></div>
            <div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#c9b8f2]">Troféu especial · Platina</p><h2 className="mt-1 text-lg font-semibold tracking-tight">{platinum.unlocked ? "Lenda do AIRI" : "A Platina espera por você"}</h2><p className="mt-1 text-xs leading-relaxed text-[#a6a1af]">{platinum.unlocked ? "Coleção completa. Você alcançou o topo." : "Desbloqueie todos os troféus para completar sua coleção."}</p></div>
            <div className="text-right"><p className="text-lg font-semibold tabular-nums text-[#d8c8ff]">{platinum.current}<span className="text-xs text-[#8d849a]">/{platinum.target}</span></p><p className="text-[9px] uppercase tracking-wider text-[#8d849a]">marcos</p></div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {trophyCounts.map(({ tier, count, total }) => <div key={tier} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-2 text-center"><p className={"text-[9px] font-bold uppercase tracking-[0.16em] " + (tier === "Bronze" ? "text-[#c58b61]" : tier === "Prata" ? "text-[#c5cbd5]" : tier === "Ouro" ? "text-[#e5c16e]" : "text-[#c9b8f2]")}>{tier}</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-[#e7e7eb]">{count}<span className="text-[10px] text-[#777a82]">/{total}</span></p></div>)}
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold">Coleção de troféus</h2><p className="mt-0.5 text-[11px] text-[#858890]">Cada emblema representa uma conquista.</p></div>
          <div className="flex rounded-lg border border-white/[0.08] bg-[#191a1e] p-1">{(["Todas", "Desbloqueadas"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition ${filter === item ? "bg-[#35343d] text-white shadow-sm" : "text-[#858890] hover:text-white"}`}>{item}</button>)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {visible.map((item) => {
            const Icon = item.icon;
            const metal = item.trophy === "Bronze" ? { main: "#c58b61", light: "#edc29b", dark: "#68452f" } : item.trophy === "Prata" ? { main: "#c5cbd5", light: "#f3f5f8", dark: "#656b75" } : item.trophy === "Ouro" ? { main: "#e5c16e", light: "#fff0b5", dark: "#80632b" } : { main: "#c9b8f2", light: "#f0e7ff", dark: "#665187" };
            const progress = Math.min(100, (item.current / item.target) * 100);
            return <article key={item.id} className={`relative flex min-h-[174px] flex-col items-center overflow-hidden rounded-xl border px-3 py-4 text-center transition sm:min-h-[190px] ${item.unlocked ? "border-white/[0.13] bg-[linear-gradient(145deg,#292a2f,#202126_58%,#1b1c20)] shadow-[0_5px_18px_rgba(0,0,0,0.16)]" : "border-white/[0.055] bg-[#191a1e]"}`}>
              <div className="absolute right-2.5 top-2.5 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: item.unlocked ? metal.main : "#656870" }}>{item.trophy}</div>
              <div className="relative mt-2 grid h-[66px] w-[66px] place-items-center rounded-full border shadow-[inset_0_2px_5px_rgba(255,255,255,0.16),0_5px_12px_rgba(0,0,0,0.28)]" style={{ color: item.unlocked ? metal.light : "#62656d", borderColor: item.unlocked ? `${metal.main}88` : "#45474d", background: item.unlocked ? `radial-gradient(circle at 35% 25%,${metal.main},${metal.dark} 78%)` : "radial-gradient(circle at 35% 25%,#42444b,#292b30 78%)", filter: item.unlocked ? "none" : "saturate(0.25)" }}><div className="absolute inset-[5px] rounded-full border" style={{ borderColor: item.unlocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)" }} /><Icon className="relative h-7 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]" strokeWidth={1.6} />{item.unlocked && <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#24252a] bg-[#d8d9dc] text-[#25262a]"><Check className="h-3 w-3" /></span>}</div>
              <h3 className={`mt-3 text-xs font-semibold leading-tight ${item.unlocked ? "text-[#f0f0f3]" : "text-[#a0a2a9]"}`}>{item.title}</h3>
              <p className="mt-1 line-clamp-2 min-h-[28px] text-[10px] leading-relaxed text-[#858890]">{item.description}</p>
              {!item.unlocked ? <div className="mt-auto flex w-full items-center gap-2 pt-3"><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: metal.main }} /></div><span className="text-[9px] tabular-nums text-[#92949b]">{item.current.toLocaleString("pt-BR")}/{item.target.toLocaleString("pt-BR")}</span></div> : <p className="mt-auto pt-3 text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: metal.main }}>Desbloqueado</p>}
            </article>;
          })}
          {visible.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-[#858890]">Você ainda não desbloqueou troféus. Continue estudando para conquistar o primeiro.</div>}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4"><p className="flex items-center gap-2 text-[11px] text-[#858890]"><Medal className="h-4 w-4 text-[#aaaeb8]" /> Sua jornada continua.</p><Link to="/desafios" className="text-[11px] font-semibold text-[#c9b8f2] transition hover:text-white">Ver desafios →</Link></div>
      </div>
    </main>
  );
}
