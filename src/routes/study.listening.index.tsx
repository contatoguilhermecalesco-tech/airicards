import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Headphones,
  Play,
  Square,
  RefreshCw,
  Loader2,
  Sparkles,
  Volume2,
  Eye,
  EyeOff,
  Check,
  Plus,
  Library,
  History,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  generateListening,
  gradeListening,
  type ListeningPassage,
  type ListeningGrade,
} from "@/lib/listening.functions";
import { speak, stopSpeaking, ttsAvailable } from "@/lib/speech";
import { createCard, useStore } from "@/lib/flashcards-store";
import { addStudyEntry } from "@/lib/study-history-store";

export const Route = createFileRoute("/study/listening/")({
  head: () => ({
    meta: [
      { title: "Listening — airi" },
      { name: "description", content: "Treino de compreensão auditiva com IA no airi." },
      { property: "og:title", content: "Listening — airi" },
      { property: "og:description", content: "Escute, transcreva e receba correção didática." },
    ],
  }),
  component: ListeningPage,
});

function ListeningPage() {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [topic, setTopic] = useState("");
  const [rate, setRate] = useState(0.95);
  const [passage, setPassage] = useState<ListeningPassage | null>(null);
  const [attempt, setAttempt] = useState("");
  const [grade, setGrade] = useState<ListeningGrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playCountRef = useRef(0);

  const gen = useServerFn(generateListening);
  const grader = useServerFn(gradeListening);

  const decks = useStore((s) => s.decks);
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [pickedVocab, setPickedVocab] = useState<Record<number, boolean>>({});
  const [includePassage, setIncludePassage] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (!selectedDeck && decks.length > 0) setSelectedDeck(decks[0].id);
  }, [decks, selectedDeck]);

  // Reset picker whenever a new passage loads
  useEffect(() => {
    if (!passage) return;
    const init: Record<number, boolean> = {};
    passage.vocabulary.forEach((_, i) => (init[i] = true));
    setPickedVocab(init);
    setIncludePassage(false);
    setSavedCount(0);
  }, [passage]);

  const pickedCount = useMemo(
    () =>
      (passage?.vocabulary ?? []).reduce(
        (n, _, i) => n + (pickedVocab[i] ? 1 : 0),
        0,
      ) + (includePassage ? 1 : 0),
    [passage, pickedVocab, includePassage],
  );

  function toggleVocab(i: number) {
    setPickedVocab((p) => ({ ...p, [i]: !p[i] }));
  }

  function selectAllVocab(v: boolean) {
    if (!passage) return;
    const next: Record<number, boolean> = {};
    passage.vocabulary.forEach((_, i) => (next[i] = v));
    setPickedVocab(next);
  }

  function saveCards() {
    if (!passage || !selectedDeck || pickedCount === 0) return;
    let n = 0;
    passage.vocabulary.forEach((v, i) => {
      if (!pickedVocab[i]) return;
      createCard(selectedDeck, v.word, v.meaning, {
        mode: "word",
        source: `Listening · ${passage.title}`,
      });
      n++;
    });
    if (includePassage) {
      createCard(selectedDeck, passage.transcript, passage.translation, {
        mode: "sentence",
        source: `Listening · ${passage.title}`,
      });
      n++;
    }
    setSavedCount(n);
  }

  async function loadNew() {
    setError(null);
    setLoading(true);
    setPassage(null);
    setAttempt("");
    setGrade(null);
    setShowTranscript(false);
    playCountRef.current = 0;
    try {
      const p = await gen({ data: { level, topic: topic.trim() || undefined } });
      setPassage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar áudio.");
    } finally {
      setLoading(false);
    }
  }

  function play() {
    if (!passage || !ttsAvailable()) return;
    playCountRef.current += 1;
    setPlaying(true);
    speak(passage.transcript, {
      rate,
      onEnd: () => setPlaying(false),
    });
  }

  function stop() {
    stopSpeaking();
    setPlaying(false);
  }

  async function submitAttempt() {
    if (!passage || !attempt.trim()) return;
    setGrading(true);
    setError(null);
    try {
      const g = await grader({
        data: { reference: passage.transcript, attempt: attempt.trim() },
      });
      setGrade(g);
      addStudyEntry("listening", {
        title: passage.title || "Listening",
        level,
        score: g.score,
        payload: { passage, attempt: attempt.trim(), grade: g },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao corrigir.");
    } finally {
      setGrading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/study"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Áreas de estudo
        </Link>
        <Link
          to="/study/listening/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-foreground/90 transition hover:bg-accent"
        >
          <History className="h-3.5 w-3.5" strokeWidth={2.25} />
          Histórico
        </Link>
      </div>

      <header className="mt-4 mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/10 ring-1 ring-white/10">
          <Headphones className="h-5 w-5 text-emerald-300" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Terça</p>
          <h1 className="text-2xl font-semibold tracking-tight">Listening</h1>
        </div>
      </header>

      {/* Config */}
      <section className="glass-panel rounded-3xl border p-5">
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Nível
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`tap-target rounded-2xl border px-3 py-2 text-sm transition ${
                level === l
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-border bg-surface/40 text-foreground/80 hover:bg-accent"
              }`}
            >
              {l === "beginner" ? "Iniciante" : l === "intermediate" ? "Intermediário" : "Avançado"}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Tema (opcional)
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ex.: café da manhã, viagem, tecnologia…"
          className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-emerald-400/40"
        />

        <button
          onClick={loadNew}
          disabled={loading}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              {passage ? "Novo áudio" : "Gerar áudio"}
            </>
          )}
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {/* Player */}
      {passage && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Áudio</p>
              <p className="mt-0.5 truncate text-base font-semibold">{passage.title}</p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">
              {playCountRef.current} escutas
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!playing ? (
              <button
                onClick={play}
                className="tap-target inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15"
              >
                <Play className="h-4 w-4" strokeWidth={2.25} /> Tocar
              </button>
            ) : (
              <button
                onClick={stop}
                className="tap-target inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15"
              >
                <Square className="h-4 w-4" strokeWidth={2.25} /> Parar
              </button>
            )}
            <button
              onClick={play}
              disabled={playing}
              className="tap-target inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-sm transition hover:bg-accent disabled:opacity-50"
              title="Repetir"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              <input
                type="range"
                min={0.6}
                max={1.2}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-24 accent-emerald-400"
              />
              <span className="tabular-nums">{rate.toFixed(2)}x</span>
            </div>
          </div>

          {!ttsAvailable() && (
            <p className="mt-3 text-xs text-amber-300/90">
              Seu navegador não suporta síntese de voz. Use Safari (iOS) ou Chrome.
            </p>
          )}

          {/* Transcription input */}
          <div className="mt-5">
            <label className="block text-xs uppercase tracking-wider text-muted-foreground">
              Sua transcrição (em inglês)
            </label>
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              rows={5}
              placeholder="Escreva o que você ouviu…"
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface/40 px-4 py-3 text-sm outline-none focus:border-emerald-400/40"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={submitAttempt}
                disabled={!attempt.trim() || grading}
                className="tap-target inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {grading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Corrigindo…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.25} /> Enviar transcrição
                  </>
                )}
              </button>
              <button
                onClick={() => setShowTranscript((s) => !s)}
                className="tap-target inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-xs transition hover:bg-accent"
              >
                {showTranscript ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Ocultar texto
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Ver texto
                  </>
                )}
              </button>
            </div>
          </div>

          {showTranscript && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Original
                </p>
                <p className="mt-1 text-sm leading-relaxed">{passage.transcript}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tradução
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {passage.translation}
                </p>
              </div>
              {passage.vocabulary.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Vocabulário
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {passage.vocabulary.map((v, i) => (
                      <li key={i}>
                        <span className="font-medium">{v.word}</span>
                        <span className="text-muted-foreground"> — {v.meaning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {passage.questions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Compreensão
                  </p>
                  <ul className="mt-1 space-y-2 text-sm">
                    {passage.questions.map((q, i) => (
                      <li key={i}>
                        <p className="font-medium">{q.q}</p>
                        <p className="text-muted-foreground">↳ {q.a}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Save to deck */}
      {passage && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-emerald-300" strokeWidth={2.25} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Salvar como cartas
            </p>
          </div>

          {decks.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <p className="text-muted-foreground">
                Você ainda não tem decks. Crie um na biblioteca para salvar cartas a partir deste
                áudio.
              </p>
              <Link
                to="/library"
                className="tap-target mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/15"
              >
                <Plus className="h-3.5 w-3.5" /> Ir para biblioteca
              </Link>
            </div>
          ) : (
            <>
              <label className="mt-3 block text-[10px] uppercase tracking-wider text-muted-foreground">
                Deck
              </label>
              <select
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-emerald-400/40"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {passage.vocabulary.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Vocabulário ({passage.vocabulary.length})
                    </p>
                    <div className="flex gap-1 text-[11px]">
                      <button
                        onClick={() => selectAllVocab(true)}
                        className="rounded-full px-2 py-1 text-emerald-300 hover:bg-emerald-400/10"
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => selectAllVocab(false)}
                        className="rounded-full px-2 py-1 text-muted-foreground hover:bg-white/5"
                      >
                        Nenhum
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {passage.vocabulary.map((v, i) => (
                      <li key={i}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                          <input
                            type="checkbox"
                            checked={!!pickedVocab[i]}
                            onChange={() => toggleVocab(i)}
                            className="mt-0.5 accent-emerald-400"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="font-medium">{v.word}</span>
                            <span className="text-muted-foreground"> — {v.meaning}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                <input
                  type="checkbox"
                  checked={includePassage}
                  onChange={(e) => setIncludePassage(e.target.checked)}
                  className="mt-0.5 accent-emerald-400"
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">Passagem completa</span>
                  <span className="block text-xs text-muted-foreground">
                    Frente: texto em inglês · Verso: tradução
                  </span>
                </span>
              </label>

              <button
                onClick={saveCards}
                disabled={pickedCount === 0 || !selectedDeck}
                className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {pickedCount === 0
                  ? "Selecione ao menos uma carta"
                  : `Adicionar ${pickedCount} carta${pickedCount > 1 ? "s" : ""}`}
              </button>

              {savedCount > 0 && (
                <p className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                  ✓ {savedCount} carta{savedCount > 1 ? "s" : ""} adicionada
                  {savedCount > 1 ? "s" : ""} ao deck.
                </p>
              )}
            </>
          )}
        </section>
      )}


      {/* Feedback */}
      {grade && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Correção</p>
            <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 tabular-nums">
              {grade.score}/100
            </div>
          </div>
          {grade.accuracy && <p className="mt-3 text-sm">{grade.accuracy}</p>}

          {grade.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-emerald-300">Você acertou</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                {grade.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {grade.misses.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-amber-300">Onde escapou</p>
              <ul className="mt-2 space-y-2">
                {grade.misses.map((m, i) => (
                  <li key={i} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                    <p>
                      <span className="text-muted-foreground">Você escreveu:</span>{" "}
                      <span className="line-through">{m.heard}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Correto:</span>{" "}
                      <span className="font-medium text-emerald-200">{m.actual}</span>
                    </p>
                    {m.tip && (
                      <p className="mt-1 text-xs text-muted-foreground">💡 {m.tip}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {grade.advice && (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm">
              <p className="text-xs font-medium text-emerald-300">Próximo passo</p>
              <p className="mt-1">{grade.advice}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
