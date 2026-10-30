import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, RotateCcw, Target, CheckCircle2,
  AlertCircle, Clock3, BookOpen, MessageCircle, Trophy, Brain, Send, GraduationCap,
} from "lucide-react";
import { evaluateParabel, continueParabelConversation, type ParabelFeedback, type ParabelConversationMessage } from "@/lib/parabel.functions";
import { addParabelEntry, useParabelHistory } from "@/lib/parabel-store";

export const Route = createFileRoute("/study/parabel")({
  head: () => ({ meta: [
    { title: "PARABEL — Simulações reais | airi" },
    { name: "description", content: "Pratique inglês em situações reais e receba feedback personalizado." },
  ] }),
  component: ParabelPage,
});

type Level = "beginner" | "intermediate" | "advanced";
const LEVELS: { id: Level; label: string; hint: string; challenge: string }[] = [
  { id: "beginner", label: "Básico", hint: "Frases simples e situações previsíveis", challenge: "Faça pedidos e responda perguntas diretas." },
  { id: "intermediate", label: "Intermediário", hint: "Mais contexto e respostas conectadas", challenge: "Explique preferências e lide com uma mudança." },
  { id: "advanced", label: "Avançado", hint: "Nuance, imprevistos e situações complexas", challenge: "Negocie uma solução com autonomia e naturalidade." },
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

const PHRASES: Record<string, { en: string; pt: string }[]> = {
  "Dia a dia": [
    { en: "I'd like...", pt: "Eu gostaria de..." },
    { en: "Could I have...?", pt: "Poderia me trazer...?" },
    { en: "Could you help me, please?", pt: "Você poderia me ajudar, por favor?" },
    { en: "The problem is...", pt: "O problema é..." },
  ],
  "Viagem": [
    { en: "I have a reservation under...", pt: "Tenho uma reserva em nome de..." },
    { en: "Could you tell me where... is?", pt: "Poderia me dizer onde fica...?" },
    { en: "My flight was cancelled.", pt: "Meu voo foi cancelado." },
    { en: "What are my options?", pt: "Quais são minhas opções?" },
  ],
  "Profissional": [
    { en: "Thank you for taking the time to meet with me.", pt: "Obrigado por reservar um tempo para conversar comigo." },
    { en: "I'd like to clarify...", pt: "Gostaria de esclarecer..." },
    { en: "In my experience...", pt: "Na minha experiência..." },
    { en: "Would it be possible to...?", pt: "Seria possível...?" },
  ],
  "Comunicação": [
    { en: "Thanks for getting back to me.", pt: "Obrigado por me responder." },
    { en: "Just to make sure I understand...", pt: "Só para ter certeza de que entendi..." },
    { en: "Would another time work for you?", pt: "Outro horário funcionaria para você?" },
    { en: "I appreciate your help.", pt: "Agradeço sua ajuda." },
  ],
  "Resolução de problemas": [
    { en: "I noticed an issue with...", pt: "Percebi um problema com..." },
    { en: "I was charged twice.", pt: "Fui cobrado duas vezes." },
    { en: "Could you look into this?", pt: "Poderia verificar isso?" },
    { en: "I'd like to request a refund.", pt: "Gostaria de solicitar um reembolso." },
  ],
};

const ERROR_LABELS: Record<string, string> = {
  verb_tense: "Tempos verbais", articles: "Artigos (a / an / the)", prepositions: "Preposições",
  word_order: "Ordem das palavras", verb_pattern: "Estrutura dos verbos", vocabulary: "Vocabulário",
  politeness: "Tom e educação", spelling: "Ortografia", subject_verb: "Concordância",
};

function ParabelPage() {
  const [level, setLevel] = useState<Level>("beginner");
  const [scenarioId, setScenarioId] = useState("");
  const [messages, setMessages] = useState<ParabelConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<ParabelFeedback | null>(null);
  const [retryDraft, setRetryDraft] = useState("");
  const [retryFeedback, setRetryFeedback] = useState<ParabelFeedback | null>(null);
  const [started, setStarted] = useState(false);
  const [conversationDone, setConversationDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"practice" | "review" | "progress">("practice");
  const evaluate = useServerFn(evaluateParabel);
  const continueConversation = useServerFn(continueParabelConversation);
  const history = useParabelHistory();
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  const selectedLevel = LEVELS.find((item) => item.id === level) ?? LEVELS[0];
  const userTurns = messages.filter((message) => message.role === "user").length;
  const xp = history.reduce((sum, entry) => sum + (entry.xp ?? Math.max(20, Math.round(entry.feedback.score * 0.6))), 0);
  const average = history.length ? Math.round(history.reduce((sum, entry) => sum + entry.feedback.score, 0) / history.length) : 0;
  const errorStats = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((entry) => (entry.feedback.errorTags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);
  const missions = [
    { title: "Primeira conversa", done: history.length >= 1, detail: "Conclua sua primeira simulação." },
    { title: "Prática consistente", done: history.length >= 5, detail: "Conclua cinco simulações." },
    { title: "Explorador de níveis", done: new Set(history.map((entry) => entry.level)).size === 3, detail: "Pratique nos três níveis." },
    { title: "Comunicação confiante", done: history.some((entry) => entry.feedback.score >= 85), detail: "Alcance 85 pontos em uma simulação." },
  ];

  function resetSession() {
    setMessages([]); setDraft(""); setFeedback(null); setRetryDraft(""); setRetryFeedback(null);
    setStarted(false); setConversationDone(false); setError(null);
  }

  async function startConversation() {
    if (!scenario) return;
    setLoading(true); setError(null); setFeedback(null);
    try {
      const result = await continueConversation({ data: { scenario: scenario.title, context: scenario.context, level, messages: [] } });
      setMessages([{ role: "assistant", content: result.reply }]);
      setConversationDone(result.done);
      setStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar a simulação.");
    } finally { setLoading(false); }
  }

  async function sendMessage() {
    if (!scenario || draft.trim().length < 2 || loading || conversationDone) return;
    const studentMessage: ParabelConversationMessage = { role: "user", content: draft.trim() };
    const nextMessages = [...messages, studentMessage];
    setMessages(nextMessages); setDraft(""); setLoading(true); setError(null);
    try {
      const result = await continueConversation({ data: { scenario: scenario.title, context: scenario.context, level, messages: nextMessages } });
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      setConversationDone(result.done || nextMessages.filter((message) => message.role === "user").length >= 6);
    } catch (e) {
      setMessages(messages);
      setDraft(studentMessage.content);
      setError(e instanceof Error ? e.message : "Não foi possível continuar a conversa.");
    } finally { setLoading(false); }
  }

  async function finishConversation() {
    if (!scenario || userTurns === 0 || loading) return;
    const transcript = messages.map((message) => `${message.role === "user" ? "ALUNO" : "INTERLOCUTOR"}: ${message.content}`).join("\n");
    setLoading(true); setError(null);
    try {
      const result = await evaluate({ data: { scenario: scenario.title, context: scenario.context, level, answer: transcript } });
      setFeedback(result); setRetryFeedback(null); setRetryDraft("");
      addParabelEntry({ scenarioId: scenario.id, scenarioTitle: scenario.title, level, answer: transcript, feedback: result, xp: Math.max(20, Math.round(result.score * 0.6) + 20) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível avaliar sua conversa.");
    } finally { setLoading(false); }
  }

  async function submitRetry() {
    if (!scenario || retryDraft.trim().length < 2 || loading) return;
    setLoading(true); setError(null);
    try {
      const result = await evaluate({ data: {
        scenario: `Revisão: ${scenario.title}`,
        context: `O aluno está refazendo uma resposta após estudar o feedback anterior. Situação original: ${scenario.context}. Use estas orientações para avaliar a nova tentativa: ${feedback?.corrections.map((item) => item.explanation).join("; ") ?? feedback?.learningTip ?? ""}. Valorize a aplicação correta do que foi aprendido.`,
        level, answer: retryDraft.trim(),
      } });
      setRetryFeedback(result);
      addParabelEntry({ scenarioId: scenario.id, scenarioTitle: `Revisão: ${scenario.title}`, level, answer: retryDraft.trim(), feedback: result, xp: Math.max(10, Math.round(result.score * 0.3)) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível avaliar sua nova tentativa.");
    } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-28 pt-8 sm:px-6 sm:pt-12">
      <Link to="/study" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Áreas de estudo</Link>
      <header className="relative mt-5 mb-6 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">AIRI · SIMULAÇÕES PRÁTICAS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">PARABEL</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Pratique inglês em situações reais. Converse, aprenda com seus erros e evolua a cada missão.</p></div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-3xl">🗣️</span>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/10 p-2.5"><p className="text-lg font-bold tabular-nums">{history.length}</p><p className="text-[10px] text-muted-foreground">Simulações</p></div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-2.5"><p className="text-lg font-bold tabular-nums">{xp} XP</p><p className="text-[10px] text-muted-foreground">Experiência</p></div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-2.5"><p className="text-lg font-bold tabular-nums">{average || "—"}</p><p className="text-[10px] text-muted-foreground">Média geral</p></div>
        </div>
      </header>

      <nav className="mb-6 grid grid-cols-3 rounded-xl border bg-surface/60 p-1">
        <button onClick={() => setActiveTab("practice")} className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition ${activeTab === "practice" ? "bg-violet-400/15 text-violet-200" : "text-muted-foreground hover:text-foreground"}`}><MessageCircle className="mr-1 inline h-3.5 w-3.5"/> Simulações</button>
        <button onClick={() => setActiveTab("review")} className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition ${activeTab === "review" ? "bg-violet-400/15 text-violet-200" : "text-muted-foreground hover:text-foreground"}`}><Brain className="mr-1 inline h-3.5 w-3.5"/> Revisão</button>
        <button onClick={() => setActiveTab("progress")} className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition ${activeTab === "progress" ? "bg-violet-400/15 text-violet-200" : "text-muted-foreground hover:text-foreground"}`}><Trophy className="mr-1 inline h-3.5 w-3.5"/> Evolução</button>
      </nav>

      {activeTab === "practice" && <>
        {!feedback && !started && <>
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">1. Escolha seu nível</h2></div>
            <div className="grid grid-cols-3 gap-2">{LEVELS.map((item) => <button key={item.id} type="button" onClick={() => setLevel(item.id)} className={`rounded-2xl border p-3 text-left transition ${level === item.id ? "border-violet-400/50 bg-violet-400/10" : "border-border bg-surface/50 hover:bg-accent"}`}><span className={`block text-sm font-semibold ${level === item.id ? "text-violet-200" : "text-foreground"}`}>{item.label}</span><span className="mt-1 hidden text-[11px] leading-4 text-muted-foreground sm:block">{item.hint}</span></button>)}</div>
            <p className="mt-2 text-xs text-muted-foreground">Desafio deste nível: {selectedLevel.challenge}</p>
          </section>
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">2. Escolha uma situação</h2></div>
            <div className="grid gap-2 sm:grid-cols-2">{SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => { setScenarioId(item.id); resetSession(); }} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${scenarioId === item.id ? "border-violet-400/50 bg-violet-400/10" : "border-border bg-surface/50 hover:border-violet-300/30 hover:bg-accent"}`}><span className="text-2xl">{item.emoji}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{item.category}</span></span>{scenarioId === item.id && <CheckCircle2 className="h-4 w-4 text-violet-300" />}</button>)}</div>
          </section>
          {scenario && <section className="rounded-3xl border bg-surface/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Preparação · {selectedLevel.label}</p><h2 className="mt-1 text-lg font-semibold">{scenario.emoji} {scenario.title}</h2></div><span className="rounded-full bg-violet-400/10 px-3 py-1 text-[10px] font-medium text-violet-200">Aquecimento</span></div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{scenario.context}</p>
            <div className="mt-5 flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-300"/><h3 className="text-sm font-semibold">Expressões que podem ajudar</h3></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{(PHRASES[scenario.category] ?? PHRASES["Dia a dia"]).map((phrase) => <div key={phrase.en} className="rounded-xl border bg-background/40 p-3"><p className="text-sm font-medium">{phrase.en}</p><p className="mt-1 text-xs text-muted-foreground">{phrase.pt}</p></div>)}</div>
            <div className="mt-5 rounded-xl bg-violet-400/[0.07] p-3"><p className="text-xs font-semibold text-violet-200">Sua missão</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selectedLevel.challenge} O interlocutor poderá trazer uma surpresa durante a conversa. Não precisa decorar as expressões: use suas próprias palavras.</p></div>
            {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
            <button type="button" onClick={startConversation} disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40">{loading ? <><Loader2 className="h-4 w-4 animate-spin"/> Preparando a situação...</> : <><MessageCircle className="h-4 w-4"/> Começar simulação</>}</button>
          </section>}
        </>}

        {started && !feedback && scenario && <section className="rounded-3xl border bg-surface/60 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Conversa em andamento</p><h2 className="mt-1 font-semibold">{scenario.emoji} {scenario.title}</h2></div><span className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground">{userTurns}/6 falas</span></div>
          <div className="mb-4 space-y-3">{messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-violet-500/15 text-foreground" : "border bg-background/70"}`}><p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{message.role === "user" ? "Você" : "Interlocutor"}</p>{message.content}</div></div>)}
            {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin"/> O interlocutor está respondendo...</div>}</div>
          {conversationDone && <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-xs text-emerald-200">A situação parece resolvida. Você já pode avaliar sua conversa ou continuar respondendo.</div>}
          {error && <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="space-y-2">
            <label htmlFor="parabel-message" className="text-xs font-semibold">Sua resposta em inglês</label>
            <textarea id="parabel-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={1200} disabled={loading || conversationDone} placeholder="Write your response in English..." className="w-full resize-y rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground/60 focus:border-violet-400/50 disabled:opacity-50"/>
            <div className="grid gap-2 sm:grid-cols-2"><button type="submit" disabled={draft.trim().length < 2 || loading || conversationDone} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4"/> Enviar resposta</button><button type="button" onClick={finishConversation} disabled={userTurns === 0 || loading} className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-40"><GraduationCap className="h-4 w-4"/> Finalizar e avaliar</button></div>
          </form>
          <button type="button" onClick={resetSession} className="mt-4 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="mr-1 inline h-3 w-3"/> Reiniciar simulação</button>
        </section>}

        {feedback && scenario && <section className="space-y-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Resultado da simulação</p><h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2></div><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10"><strong className="text-2xl tabular-nums">{feedback.score}</strong><span className="text-[9px] uppercase text-muted-foreground">/ 100</span></div></div>
          <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Visão geral</h3><p className="mt-2 text-sm leading-relaxed text-foreground/85">{feedback.overallFeedback}</p><div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{([["Gramática", feedback.criteria.grammar],["Vocabulário", feedback.criteria.vocabulary],["Clareza", feedback.criteria.clarity],["Naturalidade", feedback.criteria.naturalness],["Contexto", feedback.criteria.contextFit],["Estrutura", feedback.criteria.structure]] as [string,number][]).map(([label,value]) => <div key={label}><div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-400" style={{width:`${value}%`}}/></div></div>)}</div></div>
          {feedback.strengths.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-300"/> O que você fez bem</h3><ul className="mt-3 space-y-2">{feedback.strengths.map((item,i)=><li key={i} className="flex gap-2 text-sm text-foreground/85"><span className="text-emerald-300">•</span>{item}</li>)}</ul></div>}
          <div className="rounded-3xl border border-violet-300/20 bg-violet-400/[0.07] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Forma mais natural</p><p className="mt-3 text-lg font-medium leading-relaxed">{feedback.naturalAlternative}</p></div>
          {feedback.corrections.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Aprenda com seus erros</h3><div className="mt-3 space-y-3">{feedback.corrections.map((item,i)=><article key={i} className="rounded-2xl border bg-background/40 p-3"><p className="text-xs text-muted-foreground line-through">{item.original}</p><p className="mt-1 text-sm font-semibold text-emerald-200">{item.correction}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.explanation}</p></article>)}</div></div>}
          {feedback.learningTip && <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4"><p className="text-xs font-semibold text-sky-200">💡 Dica para guardar</p><p className="mt-1 text-sm leading-relaxed">{feedback.learningTip}</p></div>}
          {feedback.nextSteps.length > 0 && <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Próximos passos</h3><ul className="mt-3 space-y-2">{feedback.nextSteps.map((item,i)=><li key={i} className="flex gap-2 text-sm text-foreground/85"><span className="text-primary">→</span>{item}</li>)}</ul></div>}
          <div className="rounded-3xl border bg-surface/60 p-5"><div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-violet-300"/><h3 className="text-sm font-semibold">Tente novamente sem olhar</h3></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Agora que você viu as explicações, escreva novamente uma resposta para a mesma situação, usando o que acabou de aprender.</p><textarea value={retryDraft} onChange={(event)=>{setRetryDraft(event.target.value);setRetryFeedback(null);}} rows={3} maxLength={1200} placeholder="Write a new, improved response..." className="mt-3 w-full resize-y rounded-xl border bg-background/60 px-3 py-3 text-sm outline-none focus:border-violet-400/50"/><button type="button" onClick={submitRetry} disabled={retryDraft.trim().length<2 || loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-40">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>} Avaliar minha nova tentativa</button>
            {retryFeedback && <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3"><p className="text-sm font-semibold text-emerald-200">Nova nota: {retryFeedback.score}/100</p><p className="mt-1 text-xs leading-relaxed">{retryFeedback.overallFeedback}</p></div>}
          </div>
          {error && <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}
          <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={resetSession} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-semibold transition hover:bg-accent"><RotateCcw className="h-4 w-4"/> Tentar novamente</button><button type="button" onClick={()=>{resetSession();setScenarioId("");}} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Novo cenário <ArrowRight className="h-4 w-4"/></button></div>
        </section>}
      </>}

      {activeTab === "review" && <section className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Professor inteligente</p><h2 className="mt-1 text-xl font-semibold">O que vale revisar agora?</h2><p className="mt-1 text-sm text-muted-foreground">O AIRI observa os padrões de erro nas suas simulações e sugere onde concentrar a prática.</p></div>
        {errorStats.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center"><Brain className="mx-auto h-8 w-8 text-violet-300"/><p className="mt-3 text-sm font-medium">Seu diagnóstico está começando</p><p className="mt-1 text-xs text-muted-foreground">Conclua algumas simulações para identificar padrões que merecem revisão.</p><button onClick={()=>setActiveTab("practice")} className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Começar a praticar</button></div> : <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Pontos de atenção mais frequentes</h3><div className="mt-4 space-y-4">{errorStats.map(([tag,count])=><div key={tag}><div className="mb-1 flex items-center justify-between gap-2"><span className="text-sm">{ERROR_LABELS[tag] ?? tag.replaceAll("_"," ")}</span><span className="text-xs tabular-nums text-muted-foreground">{count} ocorrência(s)</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-400" style={{width:`${Math.min(100,count/Math.max(...errorStats.map((item)=>item[1]))*100)}%`}}/></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">As tendências são calculadas a partir das etiquetas de erro fornecidas pelo avaliador nas suas respostas.</p></div>}
        <div className="rounded-2xl border p-4"><p className="text-sm font-semibold">Ciclo de aprendizagem</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{["Simular","Entender","Refazer","Consolidar"].map((step,i)=><div key={step} className="rounded-xl bg-violet-400/[0.07] p-3 text-center"><span className="text-xs font-bold text-violet-300">0{i+1}</span><p className="mt-1 text-xs font-semibold">{step}</p></div>)}</div></div>
      </section>}

      {activeTab === "progress" && <section className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Sua evolução</p><h2 className="mt-1 text-xl font-semibold">Cada conversa conta</h2></div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border bg-surface/60 p-4"><Trophy className="h-5 w-5 text-amber-300"/><p className="mt-2 text-2xl font-bold tabular-nums">{xp}</p><p className="text-xs text-muted-foreground">XP conquistado</p></div><div className="rounded-2xl border bg-surface/60 p-4"><Target className="h-5 w-5 text-violet-300"/><p className="mt-2 text-2xl font-bold tabular-nums">{average || "—"}</p><p className="text-xs text-muted-foreground">Média das notas</p></div></div>
        <div className="rounded-3xl border bg-surface/60 p-5"><h3 className="text-sm font-semibold">Missões e conquistas</h3><div className="mt-3 space-y-3">{missions.map((mission)=><div key={mission.title} className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${mission.done?"bg-emerald-400/10 text-emerald-300":"bg-muted text-muted-foreground"}`}>{mission.done?<CheckCircle2 className="h-5 w-5"/>:<Target className="h-5 w-5"/>}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{mission.title}</p><p className="text-xs text-muted-foreground">{mission.detail}</p></div>{mission.done&&<span className="text-[10px] font-semibold text-emerald-300">Concluída</span>}</div>)}</div></div>
        <div className="rounded-3xl border bg-surface/60 p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Últimas simulações</h3><span className="text-xs text-muted-foreground">{history.length} registradas</span></div>{history.length===0?<p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Suas respostas avaliadas aparecerão aqui.</p>:<div className="space-y-2">{history.slice(0,8).map((entry)=><article key={entry.id} className="flex items-center gap-3 rounded-xl border bg-background/30 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-sm font-bold text-violet-200">{entry.feedback.score}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{entry.scenarioTitle}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3"/>{new Date(entry.createdAt).toLocaleDateString("pt-BR")} · {LEVELS.find((item)=>item.id===entry.level)?.label}</p></div><span className="text-xs font-semibold text-amber-300">+{entry.xp ?? 0} XP</span></article>)}</div>}</div>
      </section>}
    </main>
  );
}
