import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, RotateCcw, Target, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import { evaluateParabel, type ParabelFeedback } from "@/lib/parabel.functions";
import { addParabelEntry, useParabelHistory } from "@/lib/parabel-store";

export const Route = createFileRoute("/study/parabel")({
  head: () => ({ meta: [
    { title: "PARABEL — Simulações reais | airi" },
    { name: "description", content: "Pratique inglês em situações reais e receba feedback personalizado." },
  ] }),
  component: ParabelPage,
});

type Level = "beginner" | "intermediate" | "advanced";
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "beginner", label: "Básico", hint: "Frases simples e situações previsíveis" },
  { id: "intermediate", label: "Intermediário", hint: "Mais contexto e respostas conectadas" },
  { id: "advanced", label: "Avançado", hint: "Nuance, imprevistos e situações complexas" },
];
const SCENARIOS = [
  { id: "restaurant", emoji: "🍽️", title: "Pedir em um restaurante", category: "Dia a dia", context: "Você está em um restaurante no exterior. O atendente pergunta o que deseja. Peça uma refeição, pergunte sobre um ingrediente e solicite uma bebida." },
  { id: "message", emoji: "💬", title: "Responder uma mensagem", category: "Comunicação", context: "Você recebeu uma mensagem de alguém que conhece. Responda de forma natural, considerando o tom e a intenção da conversa." },
  { id: "email", emoji: "📧", title: "Escrever um e-mail formal", category: "Profissional", context: "Escreva para uma empresa ou profissional para solicitar uma informação e explicar brevemente o motivo do contato. Use tom educado e estrutura adequada." },
  { id: "hotel", emoji: "🏨", title: "Fazer check-in em um hotel", category: "Viagem", context: "Você chegou ao hotel, tem uma reserva em seu nome e precisa fazer o check-in. Confirme os dados e pergunte sobre o café da manhã." },
  { id: "interview", emoji: "💼", title: "Entrevista de emprego", category: "Profissional", context: "Você está em uma entrevista. O recrutador pede que fale sobre sua experiência, suas habilidades e por que deseja a vaga." },
  { id: "billing", emoji: "💳", title: "Resolver uma cobrança incorreta", category: "Resolução de problemas", context: "Você percebeu uma cobrança duplicada no cartão. Entre em contato com o atendimento, explique o problema e solicite uma solução." },
  { id: "airport", emoji: "✈️", title: "Problema no aeroporto", category: "Viagem", context: "Seu voo foi cancelado. Converse com um funcionário da companhia aérea para entender as opções e reorganizar sua viagem." },
  { id: "shopping", emoji: "🛍️", title: "Trocar ou devolver um produto", category: "Dia a dia", context: "Você comprou um produto que veio com defeito. Explique o problema na loja e pergunte sobre troca ou reembolso." },
  { id: "call", emoji: "📞", title: "Ligação profissional", category: "Profissional", context: "Você liga para uma empresa para falar com uma pessoa específica. Apresente-se, explique o motivo e peça para deixar um recado, se necessário." },
  { id: "hosting", emoji: "🏠", title: "Problema com hospedagem", category: "Viagem", context: "Você chegou à acomodação reservada, mas o quarto não está como anunciado. Explique a situação ao responsável e proponha uma solução." },
  { id: "doctor", emoji: "🩺", title: "Consulta médica", category: "Dia a dia", context: "Você está em uma consulta no exterior. Explique ao profissional o que está sentindo, há quanto tempo e como isso afeta sua rotina." },
  { id: "driver", emoji: "🚕", title: "Conversar com um motorista", category: "Dia a dia", context: "Você está em um carro por aplicativo. Confirme o destino, explique uma preferência de rota e faça uma pergunta sobre o trajeto." },
  { id: "meeting", emoji: "🤝", title: "Participar de uma reunião", category: "Profissional", context: "Você participa de uma reunião de equipe. Apresente uma ideia, explique seu ponto de vista e responda a uma pergunta de um colega." },
  { id: "appointment", emoji: "📅", title: "Marcar ou reagendar", category: "Comunicação", context: "Você precisa marcar um compromisso, mas o horário oferecido não funciona. Sugira outra data ou horário de maneira educada." },
] as const;

function ParabelPage() {
  const [level, setLevel] = useState<Level>("beginner");
  const [scenarioId, setScenarioId] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<ParabelFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluate = useServerFn(evaluateParabel);
  const history = useParabelHistory();
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  const levelLabel = LEVELS.find((item) => item.id === level)?.label ?? "Básico";
  const criteria: [string, number][] = feedback ? [
    ["Gramática", feedback.criteria.grammar],
    ["Vocabulário", feedback.criteria.vocabulary],
    ["Clareza", feedback.criteria.clarity],
    ["Naturalidade", feedback.criteria.naturalness],
    ["Contexto", feedback.criteria.contextFit],
    ["Estrutura", feedback.criteria.structure],
  ] : [];

  function resetAnswer() { setAnswer(""); setFeedback(null); setError(null); }
  async function submit() {
    if (!scenario || answer.trim().length < 2) return;
    setLoading(true); setError(null); setFeedback(null);
    try {
      const result = await evaluate({ data: { scenario: scenario.title, context: scenario.context, level, answer: answer.trim() } });
      setFeedback(result);
      addParabelEntry({ scenarioId: scenario.id, scenarioTitle: scenario.title, level, answer: answer.trim(), feedback: result });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível avaliar sua resposta.");
    } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-28 pt-8 sm:px-6 sm:pt-12">
      <Link to="/study" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Áreas de estudo</Link>
      <header className="relative mt-5 mb-7 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">AIRI · SIMULAÇÕES PRÁTICAS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">PARABEL</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Pratique inglês em situações reais. Responda com suas próprias palavras e descubra como se comunicar de forma mais natural.</p></div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-3xl">🗣️</span>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5">Respostas livres</span><span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5">Feedback com IA</span><span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5">Evolução registrada</span></div>
      </header>

      {!feedback && <>
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">1. Escolha seu nível</h2></div>
          <div className="grid grid-cols-3 gap-2">{LEVELS.map((item) => <button key={item.id} type="button" onClick={() => setLevel(item.id)} className={`rounded-2xl border p-3 text-left transition ${level === item.id ? "border-violet-400/50 bg-violet-400/10" : "border-border bg-surface/50 hover:bg-accent"}`}><span className={`block text-sm font-semibold ${level === item.id ? "text-violet-200" : "text-foreground"}`}>{item.label}</span><span className="mt-1 hidden text-[11px] leading-4 text-muted-foreground sm:block">{item.hint}</span></button>)}</div>
        </section>
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">2. Escolha uma situação</h2></div>
          <div className="grid gap-2 sm:grid-cols-2">{SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => { setScenarioId(item.id); resetAnswer(); }} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${scenarioId === item.id ? "border-violet-400/50 bg-violet-400/10" : "border-border bg-surface/50 hover:border-violet-300/30 hover:bg-accent"}`}><span className="text-2xl">{item.emoji}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{item.category}</span></span>{scenarioId === item.id && <CheckCircle2 className="h-4 w-4 text-violet-300" />}</button>)}</div>
        </section>
        {scenario && <section className="rounded-3xl border bg-surface/60 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Sua missão · {levelLabel}</p><h2 className="mt-1 text-lg font-semibold">{scenario.emoji} {scenario.title}</h2></div><span className="rounded-full bg-violet-400/10 px-3 py-1 text-[10px] font-medium text-violet-200">Situação real</span></div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">{scenario.context}</p>
          <label htmlFor="parabel-answer" className="mt-5 block text-sm font-medium">Sua resposta em inglês</label>
          <textarea id="parabel-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} maxLength={2500} placeholder="Write your response in English..." className="mt-2 w-full resize-y rounded-2xl border border-border bg-background/60 px-4 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-muted-foreground/60 focus:border-violet-400/50" />
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>Não tenha medo de errar. O objetivo é aprender.</span><span>{answer.length}/2500</span></div>
          {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          <button type="button" onClick={submit} disabled={answer.trim().length < 2 || loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando sua resposta...</> : <><Sparkles className="h-4 w-4" /> Avaliar minha resposta</>}</button>
        </section>}
      </>}

      {feedback && scenario && <section className="space-y-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Resultado da simulação</p><h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2></div><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10"><strong className="text-2xl tabular-nums">{feedback.score}</strong><span className="text-[9px] uppercase text-muted-foreground">/ 100</span></div></div>
        <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Visão geral</h3><p className="mt-2 text-sm leading-relaxed text-foreground/85">{feedback.overallFeedback}</p><div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{criteria.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-400" style={{ width: `${value}%` }} /></div></div>)}</div></div>
        {feedback.strengths.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> O que você fez bem</h3><ul className="mt-3 space-y-2">{feedback.strengths.map((item, i) => <li key={i} className="flex gap-2 text-sm text-foreground/85"><span className="text-emerald-300">•</span>{item}</li>)}</ul></div>}
        <div className="rounded-3xl border border-violet-300/20 bg-violet-400/[0.07] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Forma mais natural</p><p className="mt-3 text-lg font-medium leading-relaxed">{feedback.naturalAlternative}</p></div>
        {feedback.corrections.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Pontos para melhorar</h3><div className="mt-3 space-y-3">{feedback.corrections.map((item, i) => <article key={i} className="rounded-2xl border bg-background/40 p-3"><p className="text-xs text-muted-foreground line-through">{item.original}</p><p className="mt-1 text-sm font-semibold text-emerald-200">{item.correction}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.explanation}</p></article>)}</div></div>}
        {feedback.nextSteps.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Próximos passos</h3><ul className="mt-3 space-y-2">{feedback.nextSteps.map((item, i) => <li key={i} className="flex gap-2 text-sm text-foreground/85"><span className="text-primary">→</span>{item}</li>)}</ul></div>}
        <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={resetAnswer} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent"><RotateCcw className="h-4 w-4" /> Tentar novamente</button><button type="button" onClick={() => { setScenarioId(""); resetAnswer(); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Novo cenário <ArrowRight className="h-4 w-4" /></button></div>
      </section>}

      <section className="mt-10 border-t border-border/70 pt-6">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sua evolução</p><h2 className="mt-1 text-lg font-semibold">Últimas simulações</h2></div><span className="rounded-full border border-border px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">{history.length} registradas</span></div>
        {history.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Suas respostas avaliadas aparecerão aqui.</p> : <div className="space-y-2">{history.slice(0, 5).map((entry) => <article key={entry.id} className="flex items-center gap-3 rounded-2xl border bg-surface/40 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-sm font-bold text-violet-200">{entry.feedback.score}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{entry.scenarioTitle}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" />{new Date(entry.createdAt).toLocaleDateString("pt-BR")} · {LEVELS.find((item) => item.id === entry.level)?.label}</p></div></article>)}</div>}
      </section>
    </main>
  );
}
