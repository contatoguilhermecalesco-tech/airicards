import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  Loader2,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Plus,
  Library,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  generateSpeaking,
  gradeSpeaking,
  type SpeakingPrompt,
  type SpeakingGrade,
} from "@/lib/speaking.functions";
import { speak, stopSpeaking, ttsAvailable, sttAvailable, startRecognition, type STTHandle } from "@/lib/speech";
import { createCard, useStore } from "@/lib/flashcards-store";

export const Route = createFileRoute("/study/speaking/")({
  head: () => ({
    meta: [
      { title: "Speaking — airi" },
      { name: "description", content: "Prática de fala em inglês com IA no airi." },
      { property: "og:title", content: "Speaking — airi" },
      { property: "og:description", content: "Fale, receba correção de pronúncia e fluência." },
    ],
  }),
  component: SpeakingPage,
});

function SpeakingPage() {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [focus, setFocus] = useState<"pronunciation" | "fluency" | "conversation">("conversation");
  const [prompt, setPrompt] = useState<SpeakingPrompt | null>(null);
  const [spoken, setSpoken] = useState("");
  const [interim, setInterim] = useState("");
  const [grade, setGrade] = useState<SpeakingGrade | null>(null);
  const [recHandle, setRecHandle] = useState<STTHandle | null>(null);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);

  const gen = useServerFn(generateSpeaking);
  const grader = useServerFn(gradeSpeaking);

  const decks = useStore((s) => s.decks);
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [includeModel, setIncludeModel] = useState(true);
  const [pickedAlts, setPickedAlts] = useState<Record<number, boolean>>({});
  const [savedCount, setSavedCount] = useState(0);

  useEffect(
    () => () => {
      stopSpeaking();
      recHandle?.abort();
    },
    [recHandle],
  );

  useEffect(() => {
    if (!selectedDeck && decks.length > 0) setSelectedDeck(decks[0].id);
  }, [decks, selectedDeck]);

  useEffect(() => {
    if (!prompt) return;
    setIncludeModel(true);
    const init: Record<number, boolean> = {};
    prompt.altAnswers.forEach((_, i) => (init[i] = false));
    setPickedAlts(init);
    setSavedCount(0);
  }, [prompt]);

  const pickedCount = useMemo(() => {
    const alts = prompt?.altAnswers ?? [];
    return (includeModel ? 1 : 0) + alts.reduce((n, _, i) => n + (pickedAlts[i] ? 1 : 0), 0);
  }, [prompt, includeModel, pickedAlts]);

  function saveCards() {
    if (!prompt || !selectedDeck || pickedCount === 0) return;
    let n = 0;
    const src = `Speaking · ${prompt.prompt.slice(0, 40)}${prompt.prompt.length > 40 ? "…" : ""}`;
    if (includeModel) {
      createCard(selectedDeck, prompt.modelAnswer, prompt.translation, {
        mode: "sentence",
        source: src,
      });
      n++;
    }
    prompt.altAnswers.forEach((alt, i) => {
      if (!pickedAlts[i]) return;
      createCard(selectedDeck, alt, prompt.translation, {
        mode: "sentence",
        source: src,
      });
      n++;
    });
    setSavedCount(n);
  }

  async function loadNew() {
    setError(null);
    setLoading(true);
    setPrompt(null);
    setSpoken("");
    setInterim("");
    setGrade(null);
    setShowModel(false);
    try {
      const p = await gen({ data: { level, focus } });
      setPrompt(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  function playModel() {
    if (!prompt) return;
    speak(prompt.modelAnswer, { rate: 0.95 });
  }

  function toggleRecord() {
    if (listening) {
      recHandle?.stop();
      return;
    }
    if (!sttAvailable()) {
      setError("Reconhecimento de voz não disponível. Use Safari (iOS) ou Chrome.");
      return;
    }
    setError(null);
    setSpoken("");
    setInterim("");
    setGrade(null);
    setListening(true);
    const handle = startRecognition({
      lang: "en-US",
      onInterim: (t) => setInterim(t),
      onFinal: (t) => {
        setSpoken(t);
        setInterim("");
      },
      onError: (err) => {
        setError(`Erro no microfone: ${err}`);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        setRecHandle(null);
      },
    });
    setRecHandle(handle);
  }

  async function submit() {
    if (!prompt || !spoken.trim()) return;
    setGrading(true);
    setError(null);
    try {
      const g = await grader({
        data: {
          target: prompt.modelAnswer,
          spoken: spoken.trim(),
          altAnswers: prompt.altAnswers,
        },
      });
      setGrade(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao corrigir.");
    } finally {
      setGrading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link
        to="/study"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Áreas de estudo
      </Link>

      <header className="mt-4 mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/30 to-orange-500/10 ring-1 ring-white/10">
          <Mic className="h-5 w-5 text-orange-300" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Quarta</p>
          <h1 className="text-2xl font-semibold tracking-tight">Speaking</h1>
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
                  ? "border-orange-400/40 bg-orange-400/10 text-orange-200"
                  : "border-border bg-surface/40 text-foreground/80 hover:bg-accent"
              }`}
            >
              {l === "beginner" ? "Iniciante" : l === "intermediate" ? "Intermediário" : "Avançado"}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Foco
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["pronunciation", "Pronúncia"],
              ["fluency", "Fluência"],
              ["conversation", "Conversa"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFocus(id)}
              className={`tap-target rounded-2xl border px-3 py-2 text-sm transition ${
                focus === id
                  ? "border-orange-400/40 bg-orange-400/10 text-orange-200"
                  : "border-border bg-surface/40 text-foreground/80 hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={loadNew}
          disabled={loading}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              {prompt ? "Novo exercício" : "Gerar exercício"}
            </>
          )}
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {/* Prompt */}
      {prompt && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Situação</p>
          <p className="mt-1 text-base leading-relaxed">{prompt.prompt}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={playModel}
              disabled={!ttsAvailable()}
              className="tap-target inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15 disabled:opacity-50"
            >
              <Play className="h-4 w-4" strokeWidth={2.25} /> Ouvir modelo
            </button>
            <button
              onClick={() => setShowModel((s) => !s)}
              className="tap-target inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-xs transition hover:bg-accent"
            >
              {showModel ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Ver modelo
                </>
              )}
            </button>
          </div>

          {showModel && (
            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <p>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Modelo
                </span>
                <br />
                <span className="font-medium">{prompt.modelAnswer}</span>
              </p>
              <p className="text-muted-foreground">{prompt.translation}</p>
              {prompt.altAnswers.length > 0 && (
                <div>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Alternativas
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {prompt.altAnswers.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {prompt.focusPoints.length > 0 && (
                <div>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Preste atenção em
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {prompt.focusPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recorder */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleRecord}
                className={`tap-target flex h-14 w-14 items-center justify-center rounded-full transition ${
                  listening
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse"
                    : "bg-orange-500/90 text-white hover:bg-orange-500"
                }`}
                aria-label={listening ? "Parar gravação" : "Iniciar gravação"}
              >
                {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {listening ? "Ouvindo…" : "Sua fala"}
                </p>
                <p className="mt-1 min-h-[1.5em] text-sm">
                  {spoken || (
                    <span className="text-muted-foreground">
                      {interim || "Toque no microfone e diga em inglês."}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {!sttAvailable() && (
              <p className="mt-3 text-xs text-amber-300/90">
                Reconhecimento de voz não suportado neste navegador. Use Safari (iOS) ou Chrome.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={submit}
                disabled={!spoken.trim() || grading}
                className="tap-target inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {grading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analisando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.25} /> Avaliar fala
                  </>
                )}
              </button>
              {spoken && !listening && (
                <button
                  onClick={() => {
                    setSpoken("");
                    setGrade(null);
                  }}
                  className="tap-target inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-xs transition hover:bg-accent"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refazer
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Save to deck */}
      {prompt && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-orange-300" strokeWidth={2.25} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Salvar como cartas
            </p>
          </div>

          {decks.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <p className="text-muted-foreground">
                Você ainda não tem decks. Crie um na biblioteca para salvar cartas deste exercício.
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
                className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-orange-400/40"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                <input
                  type="checkbox"
                  checked={includeModel}
                  onChange={(e) => setIncludeModel(e.target.checked)}
                  className="mt-0.5 accent-orange-400"
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">Resposta modelo</span>
                  <span className="block text-xs text-muted-foreground">
                    {prompt.modelAnswer}
                  </span>
                </span>
              </label>

              {prompt.altAnswers.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Alternativas
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {prompt.altAnswers.map((alt, i) => (
                      <li key={i}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                          <input
                            type="checkbox"
                            checked={!!pickedAlts[i]}
                            onChange={() =>
                              setPickedAlts((p) => ({ ...p, [i]: !p[i] }))
                            }
                            className="mt-0.5 accent-orange-400"
                          />
                          <span className="min-w-0 flex-1">{alt}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-[11px] text-muted-foreground">
                Frente: frase em inglês · Verso: {prompt.translation}
              </p>

              <button
                onClick={saveCards}
                disabled={pickedCount === 0 || !selectedDeck}
                className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {pickedCount === 0
                  ? "Selecione ao menos uma carta"
                  : `Adicionar ${pickedCount} carta${pickedCount > 1 ? "s" : ""}`}
              </button>

              {savedCount > 0 && (
                <p className="mt-3 rounded-2xl border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-xs text-orange-200">
                  ✓ {savedCount} carta{savedCount > 1 ? "s" : ""} adicionada
                  {savedCount > 1 ? "s" : ""} ao deck.
                </p>
              )}
            </>
          )}
        </section>
      )}



      {/* Grade */}
      {grade && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Análise</p>
            <div className="rounded-full bg-orange-400/15 px-3 py-1 text-sm font-semibold text-orange-200 tabular-nums">
              {grade.score}/100
            </div>
          </div>
          {grade.fidelity && <p className="mt-3 text-sm">{grade.fidelity}</p>}
          {grade.refinedAttempt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Interpretação: <span className="italic">"{grade.refinedAttempt}"</span>
            </p>
          )}

          {grade.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-emerald-300">Pontos fortes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                {grade.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {grade.issues.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-amber-300">Ajustes</p>
              <ul className="mt-2 space-y-2">
                {grade.issues.map((it, i) => (
                  <li key={i} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                    <p className="font-medium">{it.word}</p>
                    <p className="text-muted-foreground">{it.problem}</p>
                    {it.tip && <p className="mt-1 text-xs">💡 {it.tip}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {grade.advice && (
            <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-400/5 p-3 text-sm">
              <p className="text-xs font-medium text-orange-300">Próximo passo</p>
              <p className="mt-1">{grade.advice}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
