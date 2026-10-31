import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Check, Crown, Flame, Lock, Medal, Swords,
  Target, Trophy, Sparkles, Star, ShieldCheck,
} from "lucide-react";
import { useStore, useStreak, isDefeated } from "@/lib/flashcards-store";
import { useRank, TIER_ORDER, TIER_LABEL } from "@/lib/rank-store";
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
    const reachedGold = TIER_ORDER.indexOf(rank.peakTier) >= TIER_ORDER.indexOf("gold");
    const studiedOnce = streak.longest >= 1 || Object.keys(streak.history ?? {}).length > 0;
    const completedDuels = duels.length;

    return [
      { id: "first-study", title: "Primeiro passo", description: "Complete seu primeiro dia de estudos.", icon: BookOpen, current: studiedOnce ? 1 : 0, target: 1, unlocked: studiedOnce, category: "Estudos", accent: "#b69ae8" },
      { id: "reviews-100", title: "Memória em construção", description: "Revise 100 cartas.", icon: Target, current: Math.min(reviewed, 100), target: 100, unlocked: reviewed >= 100, category: "Estudos", accent: "#8f9ce8" },
      { id: "reviews-1000", title: "Mente afiada", description: "Revise 1.000 cartas.", icon: Star, current: Math.min(reviewed, 1000), target: 1000, unlocked: reviewed >= 1000, category: "Estudos", accent: "#d6b36a" },
      { id: "streak-30", title: "Constância lendária", description: "Alcance 30 dias de sequência.", icon: Flame, current: Math.min(streak.longest, 30), target: 30, unlocked: streak.longest >= 30, category: "Jornada", accent: "#e99a69" },
      { id: "first-duel", title: "Primeiro confronto", description: "Finalize seu primeiro duelo.", icon: Swords, current: Math.min(completedDuels, 1), target: 1, unlocked: completedDuels >= 1, category: "Competitivo", accent: "#8e9de8" },
      { id: "gold-rank", title: "Em busca do ouro", description: "Alcance o Rank Ouro pela primeira vez.", icon: Crown, current: reachedGold ? 1 : Math.min(TIER_ORDER.indexOf(rank.peakTier) + 1, TIER_ORDER.indexOf("gold") + 1), target: TIER_ORDER.indexOf("gold") + 1, unlocked: reachedGold, category: "Competitivo", accent: "#e5c16e" },
      { id: "first-enemy", title: "Caçador de nêmesis", description: "Derrote sua primeira carta inimiga.", icon: ShieldCheck, current: Math.min(defeated, 1), target: 1, unlocked: defeated > 0, category: "Jornada", accent: "#d58b9b" },
    ];
  }, [cards, streak, rank, duels]);

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const visible = filter === "Desbloqueadas" ? achievements.filter((item) => item.unlocked) : achievements;

  return (
    <main className="min-h-dvh bg-background px-4 pb-28 pt-5 text-foreground sm:px-6 sm:pb-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/" className="mb-7 inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 text-sm text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/75">
            <Trophy className="h-3.5 w-3.5" /> Sua jornada
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Conquistas</h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Cada pequena evolução conta. Veja o que você já alcançou e o que vem pela frente.</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-semibold tabular-nums">{unlockedCount}<span className="text-base text-muted-foreground">/{achievements.length}</span></p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">conquistadas</p>
            </div>
          </div>
        </header>

        <section className="mb-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground/85">Sua coleção</span>
            <span className="tabular-nums text-muted-foreground">{Math.round((unlockedCount / achievements.length) * 100)}% completa</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Continue estudando para revelar novas conquistas.
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Marcos disponíveis</h2>
          <div className="flex rounded-full border border-white/[0.08] bg-white/[0.025] p-1">
            {(["Todas", "Desbloqueadas"] as const).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${filter === item ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {visible.map((item) => {
            const Icon = item.icon;
            const progress = Math.min(100, (item.current / item.target) * 100);
            return (
              <article key={item.id} className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition sm:gap-4 sm:p-4 ${item.unlocked ? "border-primary/20 bg-primary/[0.045]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[15px] border" style={{ color: item.unlocked ? item.accent : "hsl(var(--muted-foreground))", borderColor: item.unlocked ? `${item.accent}45` : "rgba(255,255,255,0.07)", background: item.unlocked ? `${item.accent}16` : "rgba(255,255,255,0.025)" }}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                  {item.unlocked && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground"><Check className="h-2.5 w-2.5" /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-[13px] font-semibold ${item.unlocked ? "text-foreground" : "text-foreground/85"}`}>{item.title}</h3>
                    {item.unlocked && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">Conquistada</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>
                  {!item.unlocked && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: item.accent }} />
                      </div>
                      <span className="min-w-[52px] text-right text-[10px] tabular-nums text-muted-foreground">{item.current.toLocaleString("pt-BR")}/{item.target.toLocaleString("pt-BR")}</span>
                    </div>
                  )}
                </div>
                {!item.unlocked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45" />}
              </article>
            );
          })}
          {visible.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-muted-foreground">Você ainda não desbloqueou conquistas. Sua próxima pode estar logo ali.</div>}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Medal className="h-4 w-4 text-primary" /> Continue construindo sua jornada.</div>
          <Link to="/desafios" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:opacity-80">Ver desafios <ArrowLeft className="h-3.5 w-3.5 rotate-180" /></Link>
        </div>
      </div>
    </main>
  );
}
