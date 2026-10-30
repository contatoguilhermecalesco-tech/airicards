import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Brain, CalendarDays, Clock3, Flame,
  GraduationCap, Layers3, Target, TrendingUp,
} from "lucide-react";
import { useStore, useStreak, getDueCards } from "@/lib/flashcards-store";
import {
  classifyCard, getWeaknesses, useStudySessions,
  type StudySessionRecord,
} from "@/lib/performance-store";

export const Route = createFileRoute("/study/desempenho")({ component: PerformancePage });

type Tab = "overview" | "sessions" | "vocabulary" | "weaknesses" | "review";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Desempenho" },
  { id: "sessions", label: "Sessões" },
  { id: "vocabulary", label: "Vocabulário" },
  { id: "weaknesses", label: "Fraquezas" },
  { id: "review", label: "Revisão inteligente" },
];

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
function duration(ms: number) {
  const mins = Math.max(1, Math.round(ms / 60000));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
}
function dateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function launchLink(ids: string[]) {
  return { to: "/review" as const, search: { cards: ids.join(",") } };
}

function PerformancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const cards = useStore((state) => state.cards);
  const decks = useStore((state) => state.decks);
  const sessions = useStudySessions();
  const streak = useStreak();
  const now = Date.now();
  const dueCards = useMemo(() => getDueCards(), [cards]);
  const categories = useMemo(() => ({
    forgetting: cards.filter((card) => classifyCard(card, now) === "forgetting"),
    unstable: cards.filter((card) => classifyCard(card, now) === "unstable"),
    almost: cards.filter((card) => classifyCard(card, now) === "almost"),
    mastered: cards.filter((card) => classifyCard(card, now) === "mastered"),
  }), [cards, now]);
  const weaknesses = useMemo(() => getWeaknesses(cards), [cards]);
  const totalReviewed = sessions.reduce((sum, session) => sum + session.cards, 0);
  const totalCorrect = sessions.reduce((sum, session) => sum + session.correct, 0);
  const totalTime = sessions.reduce((sum, session) => sum + session.durationMs, 0);
  const accuracy = totalReviewed ? Math.round((totalCorrect / totalReviewed) * 100) : 0;
  const avgCards = sessions.length ? Math.round(totalReviewed / sessions.length) : 0;
  const activeDays = new Set(sessions.map((session) => dayKey(session.date))).size;
  const studiedDays = new Set(sessions.map((session) => dayKey(session.date)));
  const daysWithoutStudy = Math.max(0, 30 - [...Array(30)].filter((_, i) => {
    const date = new Date(); date.setDate(date.getDate() - i); return studiedDays.has(dayKey(date.getTime()));
  }).length);
  const hourCounts = new Map<number, number>();
  sessions.forEach((session) => hourCounts.set(session.hour, (hourCounts.get(session.hour) ?? 0) + 1));
  const bestHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const last7 = [...Array(7)].map((_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - i));
    const key = dayKey(date.getTime());
    return { label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), count: sessions.filter((s) => dayKey(s.date) === key).reduce((sum, s) => sum + s.cards, 0) };
  });
  const last30 = [...Array(4)].map((_, i) => {
    const start = new Date(); start.setDate(start.getDate() - (27 - i * 7));
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return { label: `Sem. ${i + 1}`, count: sessions.filter((s) => s.date >= start.getTime() && s.date < end.getTime()).reduce((sum, s) => sum + s.cards, 0) };
  });
  const monthly = [...Array(6)].map((_, i) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - i));
    const next = new Date(date); next.setMonth(next.getMonth() + 1);
    return { label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), count: sessions.filter((session) => session.date >= date.getTime() && session.date < next.getTime()).reduce((sum, session) => sum + session.cards, 0) };
  });
  const vocabularyCards = cards.filter((card) => card.mode !== "sentence");
  const vocab = {
    studied: vocabularyCards.length,
    learning: vocabularyCards.filter((card) => ["unstable", "almost"].includes(classifyCard(card, now))).length,
    mastered: vocabularyCards.filter((card) => classifyCard(card, now) === "mastered").length,
    due: vocabularyCards.filter((card) => card.dueAt <= now).length,
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <Link to="/study" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Áreas de estudo</Link>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">AIRI · CENTRAL DE APRENDIZADO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Desempenho</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Entenda seu ritmo, acompanhe o vocabulário e descubra o que merece mais atenção.</p>
        </div>
        <div className="rounded-2xl border bg-surface px-4 py-3">
          <div className="flex items-center gap-2 text-orange-300"><Flame className="h-4 w-4" /><span className="text-xs font-semibold">Maior streak</span></div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{streak.longest} <span className="text-xs font-medium text-muted-foreground">dias</span></p>
        </div>
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border bg-surface/60 p-1">
        {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${tab === item.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}
      </nav>

      {tab === "overview" && <>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<Layers3 className="h-4 w-4" />} label="Cartas revisadas" value={totalReviewed.toLocaleString("pt-BR")} />
          <Metric icon={<Target className="h-4 w-4" />} label="Taxa de acerto" value={sessions.length ? `${accuracy}%` : "—"} />
          <Metric icon={<Clock3 className="h-4 w-4" />} label="Tempo estudado" value={totalTime ? duration(totalTime) : "—"} />
          <Metric icon={<CalendarDays className="h-4 w-4" />} label="Frequência" value={`${activeDays} dias`} />
          <Metric icon={<BookOpen className="h-4 w-4" />} label="Média por sessão" value={sessions.length ? `${avgCards} cartas` : "—"} />
          <Metric icon={<Flame className="h-4 w-4" />} label="Streak atual" value={`${streak.current} dias`} />
          <Metric icon={<TrendingUp className="h-4 w-4" />} label="Dias sem estudar (30d)" value={String(daysWithoutStudy)} />
          <Metric icon={<Clock3 className="h-4 w-4" />} label="Melhor horário" value={bestHour === undefined ? "—" : `${String(bestHour).padStart(2, "0")}h`} />
        </section>
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <ChartPanel title="Cartas revisadas · últimos 7 dias" subtitle="Volume diário de prática">
            <Bars items={last7} />
          </ChartPanel>
          <ChartPanel title="Evolução semanal · últimos 30 dias" subtitle="Quantidade de cartas por semana">
            <Bars items={last30} />
          </ChartPanel>
          <div className="lg:col-span-2"><ChartPanel title="Evolução mensal · últimos 6 meses" subtitle="Quantidade de cartas revisadas por mês"><Bars items={monthly} /></ChartPanel></div>
        </section>
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-surface p-5">
            <h2 className="font-semibold">Vocabulário</h2>
            <p className="mt-1 text-xs text-muted-foreground">Visão atual das suas cartas cadastradas</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Palavras estudadas" value={vocab.studied} />
              <MiniStat label="Em aprendizado" value={vocab.learning} />
              <MiniStat label="Dominadas" value={vocab.mastered} />
              <MiniStat label="Precisam de revisão" value={vocab.due} />
            </div>
            <button onClick={() => setTab("vocabulary")} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">Ver vocabulário <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
          <div className="rounded-2xl border bg-surface p-5">
            <h2 className="font-semibold">Atenção recomendada</h2>
            <p className="mt-1 text-xs text-muted-foreground">Temas com mais reincidência de erros nas cartas</p>
            <div className="mt-4 space-y-3">
              {weaknesses.slice(0, 3).map((item) => <div key={item.id} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{item.label}</p><p className="text-[11px] text-muted-foreground">{item.cards.length} cartas relacionadas</p></div><span className="text-xs font-semibold tabular-nums">{item.rate}% erros</span></div>)}
              {!weaknesses.length && <p className="text-xs text-muted-foreground">Adicione cartas para começar a identificar padrões.</p>}
            </div>
            <button onClick={() => setTab("weaknesses")} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">Explorar fraquezas <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </>}

      {tab === "sessions" && <section className="rounded-2xl border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Histórico de sessões</h2><p className="mt-1 text-xs text-muted-foreground">Acertos, erros, duração e pontos registrados em cada sessão. O histórico começa a contar após esta atualização.</p></div><span className="text-xs text-muted-foreground">{sessions.length} sessões</span></div>
        <div className="space-y-2">
          {sessions.map((session) => <SessionRow key={session.id} session={session} />)}
          {!sessions.length && <Empty text="Suas sessões concluídas aparecerão aqui. Termine uma revisão de cartas para começar seu histórico." />}
        </div>
      </section>}

      {tab === "vocabulary" && <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<BookOpen className="h-4 w-4" />} label="Estudadas" value={String(vocab.studied)} />
          <Metric icon={<Brain className="h-4 w-4" />} label="Em aprendizado" value={String(vocab.learning)} />
          <Metric icon={<GraduationCap className="h-4 w-4" />} label="Dominadas" value={String(vocab.mastered)} />
          <Metric icon={<Clock3 className="h-4 w-4" />} label="Para revisar" value={String(vocab.due)} />
        </div>
        <div className="rounded-2xl border bg-surface p-5">
          <h2 className="font-semibold">Evolução do vocabulário</h2>
          <p className="mt-1 text-xs text-muted-foreground">Cartas cadastradas e dominadas ao longo do tempo.</p>
          <div className="mt-4 space-y-3">
            {decks.map((deck) => {
              const deckCards = cards.filter((card) => card.deckId === deck.id);
              const mastered = deckCards.filter((card) => classifyCard(card, now) === "mastered").length;
              const pct = deckCards.length ? Math.round(mastered / deckCards.length * 100) : 0;
              return <div key={deck.id}><div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate">{deck.name}</span><span className="tabular-nums text-muted-foreground">{mastered}/{deckCards.length} dominadas</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} /></div></div>;
            })}
            {!decks.length && <Empty text="Crie um baralho e adicione palavras para acompanhar seu vocabulário." />}
          </div>
        </div>
      </section>}

      {tab === "weaknesses" && <section className="rounded-2xl border bg-surface p-5">
        <div className="mb-4"><h2 className="font-semibold">Sistema de fraquezas</h2><p className="mt-1 text-xs text-muted-foreground">Estimativa baseada no histórico de lapsos e acertos das cartas. Listening e escrita dependem de cartas com origem identificada.</p></div>
        <div className="space-y-3">
          {weaknesses.map((item) => <div key={item.id} className="rounded-xl border bg-background/50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">{item.label}</h3><p className="text-xs text-muted-foreground">{item.detail} · {item.cards.length} cartas</p></div><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">{item.rate}% reincidência</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${item.rate}%` }} /></div><Link {...launchLink(item.cards.map((card) => card.id))} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Treinar este tema <ArrowRight className="h-3.5 w-3.5" /></Link></div>)}
          {!weaknesses.length && <Empty text="Ainda não há dados suficientes para detectar dificuldades. Revise algumas cartas primeiro." />}
        </div>
      </section>}

      {tab === "review" && <section className="space-y-3">
        <p className="text-sm text-muted-foreground">As cartas são classificadas pela combinação entre vencimento, lapsos e acertos registrados.</p>
        <ReviewGroup color="red" title="🔴 Esquecendo" description="Cartas vencidas com reincidência de erros." cards={categories.forgetting} />
        <ReviewGroup color="orange" title="🟠 Instáveis" description="Cartas com poucos acertos em relação aos erros." cards={categories.unstable} />
        <ReviewGroup color="yellow" title="🟡 Quase dominadas" description="Cartas em progresso ou que chegaram ao momento de revisão." cards={categories.almost} />
        <ReviewGroup color="green" title="🟢 Dominadas" description="Cartas com histórico consistente de acertos." cards={categories.mastered} />
        <Link to="/review" className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-accent">Iniciar revisão normal <ArrowRight className="h-4 w-4" /></Link>
      </section>}
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border bg-surface p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div><p className="mt-3 text-2xl font-bold tabular-nums">{value}</p></div>;
}
function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-background/60 p-3"><p className="text-xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div>;
}
function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-surface p-5"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p><div className="mt-5">{children}</div></div>;
}
function Bars({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <div className="flex h-36 items-end gap-2">{items.map((item) => <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] tabular-nums text-muted-foreground">{item.count || ""}</span><div className="flex h-24 w-full items-end rounded-t-md bg-muted/60"><div className="w-full rounded-t-md bg-primary/70 transition-all" style={{ height: `${item.count / max * 100}%`, minHeight: item.count ? "4px" : 0 }} /></div><span className="text-[10px] text-muted-foreground">{item.label}</span></div>)}</div>;
}
function SessionRow({ session }: { session: StudySessionRecord }) {
  const rate = session.cards ? Math.round(session.correct / session.cards * 100) : 0;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/40 p-3"><div className="min-w-[130px] flex-1"><p className="text-sm font-semibold">{session.deckName || "Todos os baralhos"}</p><p className="mt-1 text-[11px] text-muted-foreground">{dateLabel(session.date)} · {String(session.hour).padStart(2, "0")}h</p></div><div className="flex flex-wrap gap-3 text-xs"><span>{session.cards} cartas</span><span className="text-emerald-400">{session.correct} acertos</span><span className="text-red-400">{session.wrong} erros</span><span>{duration(session.durationMs)}</span><span>+{session.lp} LP</span><span>+{session.xp} XP</span><span className="font-semibold">{rate}%</span></div></div>;
}
function ReviewGroup({ color, title, description, cards }: { color: "red" | "orange" | "yellow" | "green"; title: string; description: string; cards: { id: string; front: string }[] }) {
  const colors = { red: "border-red-400/25", orange: "border-orange-400/25", yellow: "border-yellow-400/25", green: "border-emerald-400/25" };
  return <div className={`rounded-2xl border bg-surface p-4 ${colors[color]}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{title} <span className="text-xs text-muted-foreground">({cards.length})</span></h3><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>{cards.length > 0 && <Link {...launchLink(cards.map((card) => card.id))} className="shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-accent">Reforçar</Link>}</div><div className="mt-3 flex flex-wrap gap-2">{cards.slice(0, 12).map((card) => <span key={card.id} className="rounded-lg bg-background/70 px-2.5 py-1.5 text-xs">{card.front}</span>)}{cards.length > 12 && <span className="px-2 py-1 text-xs text-muted-foreground">+{cards.length - 12}</span>}</div></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-6 text-center text-xs leading-relaxed text-muted-foreground">{text}</div>;
}
