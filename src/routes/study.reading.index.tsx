import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Sparkles,
  Check,
  X,
  Library,
  Plus,
  Languages,
  ChevronDown,
  ChevronUp,
  Wand2,
  Scissors,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  generateReading,
  gradeReading,
  type ReadingPassage,
  type ReadingGrade,
} from "@/lib/reading.functions";
import { translateEnToPt } from "@/lib/translate.functions";
import { createCard, useStore } from "@/lib/flashcards-store";

export const Route = createFileRoute("/study/reading/")({
  head: () => ({
    meta: [
      { title: "Reading — airi" },
      {
        name: "description",
        content: "Leitura guiada em inglês com IA: textos, glossário e interpretação corrigida no airi.",
      },
      { property: "og:title", content: "Reading — airi" },
      {
        property: "og:description",
        content: "Leia, interprete e receba correção didática dos seus textos em inglês.",
      },
    ],
  }),
  component: ReadingPage,
});

type Genre = "story" | "article" | "dialogue" | "letter" | "opinion";
const GENRES: { id: Genre; label: string }[] = [
  { id: "article", label: "Artigo" },
  { id: "story", label: "História" },
  { id: "dialogue", label: "Diálogo" },
  { id: "letter", label: "Carta" },
  { id: "opinion", label: "Opinião" },
];

function ReadingPage() {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate",
  );
  const [genre, setGenre] = useState<Genre>("article");
  const [topic, setTopic] = useState("");
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTranslation, setShowTranslation] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [mcqRevealed, setMcqRevealed] = useState<Record<number, boolean>>({});

  const [openAnswer, setOpenAnswer] = useState("");
  const [grade, setGrade] = useState<ReadingGrade | null>(null);
  const [grading, setGrading] = useState(false);

  // Save-to-deck
  const decks = useStore((s) => s.decks);
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [pickedGloss, setPickedGloss] = useState<Record<number, boolean>>({});
  const [includePassage, setIncludePassage] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);

  // Snip-to-card (selection popover)
  const articleRef = useRef<HTMLElement | null>(null);
  const [snipChip, setSnipChip] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const [snip, setSnip] = useState<{
    front: string;
    back: string;
    deckId: string;
    translating: boolean;
    saving: boolean;
    saved: boolean;
    error: string | null;
  } | null>(null);

  const gen = useServerFn(generateReading);
  const grader = useServerFn(gradeReading);
  const translate = useServerFn(translateEnToPt);

  useEffect(() => {
    if (!selectedDeck && decks.length > 0) setSelectedDeck(decks[0].id);
  }, [decks, selectedDeck]);

  useEffect(() => {
    if (!passage) return;
    const init: Record<number, boolean> = {};
    passage.glossary.forEach((_, i) => (init[i] = true));
    setPickedGloss(init);
    setIncludePassage(false);
    setSavedCount(0);
    setMcqAnswers({});
    setMcqRevealed({});
    setOpenAnswer("");
    setGrade(null);
    setShowTranslation(false);
    setSaveOpen(false);
  }, [passage]);

  const pickedCount = useMemo(
    () =>
      (passage?.glossary ?? []).reduce(
        (n, _, i) => n + (pickedGloss[i] ? 1 : 0),
        0,
      ) + (includePassage ? 1 : 0),
    [passage, pickedGloss, includePassage],
  );

  const correctCount = useMemo(() => {
    if (!passage) return 0;
    return passage.mcq.reduce(
      (n, m, i) =>
        n + (mcqRevealed[i] && mcqAnswers[i] === m.correct ? 1 : 0),
      0,
    );
  }, [passage, mcqAnswers, mcqRevealed]);

  async function loadNew() {
    setError(null);
    setLoading(true);
    setPassage(null);
    try {
      const p = await gen({
        data: { level, genre, topic: topic.trim() || undefined },
      });
      setPassage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar texto.");
    } finally {
      setLoading(false);
    }
  }

  function pickOption(qi: number, oi: number) {
    if (mcqRevealed[qi]) return;
    setMcqAnswers((a) => ({ ...a, [qi]: oi }));
  }
  function reveal(qi: number) {
    if (mcqAnswers[qi] === undefined) return;
    setMcqRevealed((r) => ({ ...r, [qi]: true }));
  }

  async function submitOpen() {
    if (!passage || !openAnswer.trim()) return;
    setGrading(true);
    setError(null);
    try {
      const g = await grader({
        data: {
          text: passage.text,
          question: passage.open.q,
          guidance: passage.open.guidance,
          answer: openAnswer.trim(),
        },
      });
      setGrade(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao corrigir.");
    } finally {
      setGrading(false);
    }
  }

  function toggleGloss(i: number) {
    setPickedGloss((p) => ({ ...p, [i]: !p[i] }));
  }
  function selectAllGloss(v: boolean) {
    if (!passage) return;
    const next: Record<number, boolean> = {};
    passage.glossary.forEach((_, i) => (next[i] = v));
    setPickedGloss(next);
  }
  function saveCards() {
    if (!passage || !selectedDeck || pickedCount === 0) return;
    let n = 0;
    passage.glossary.forEach((v, i) => {
      if (!pickedGloss[i]) return;
      createCard(selectedDeck, v.word, v.meaning, {
        mode: "word",
        source: `Reading · ${passage.title}`,
      });
      n++;
    });
    if (includePassage) {
      createCard(selectedDeck, passage.text, passage.translation, {
        mode: "sentence",
        source: `Reading · ${passage.title}`,
      });
      n++;
    }
    setSavedCount(n);
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/30 to-sky-500/10 ring-1 ring-white/10">
          <BookOpen className="h-5 w-5 text-sky-300" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Segunda
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Reading</h1>
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
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                  : "border-border bg-surface/40 text-foreground/80 hover:bg-accent"
              }`}
            >
              {l === "beginner"
                ? "Iniciante"
                : l === "intermediate"
                  ? "Intermediário"
                  : "Avançado"}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Formato
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`tap-target rounded-full border px-3 py-1.5 text-xs transition ${
                genre === g.id
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                  : "border-border bg-surface/40 text-foreground/80 hover:bg-accent"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Tema (opcional)
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ex.: viagem, tecnologia, esporte…"
          className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-sky-400/40"
        />

        <button
          onClick={loadNew}
          disabled={loading}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              {passage ? "Novo texto" : "Gerar texto"}
            </>
          )}
        </button>
      </section>

      {error && (
        <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {/* Passage */}
      {passage && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Texto
              </p>
              <h2 className="mt-0.5 text-lg font-semibold">{passage.title}</h2>
            </div>
            <button
              onClick={() => setShowTranslation((s) => !s)}
              className="tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
            >
              <Languages className="h-3.5 w-3.5" />
              {showTranslation ? "Ocultar tradução" : "Ver tradução"}
            </button>
          </div>

          <article className="prose-reading mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">
            {passage.text}
          </article>

          {showTranslation && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tradução
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {passage.translation}
              </p>
            </div>
          )}

          {passage.glossary.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Glossário
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {passage.glossary.map((v, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{v.word}</span>
                    <span className="text-muted-foreground"> — {v.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* MCQ */}
      {passage && passage.mcq.length > 0 && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Compreensão
            </p>
            <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs text-sky-200 tabular-nums">
              {correctCount}/{passage.mcq.length}
            </span>
          </div>
          <ol className="mt-3 space-y-4">
            {passage.mcq.map((m, qi) => {
              const revealed = !!mcqRevealed[qi];
              const chosen = mcqAnswers[qi];
              return (
                <li key={qi}>
                  <p className="text-sm font-medium">
                    {qi + 1}. {m.q}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {m.options.map((opt, oi) => {
                      const isChosen = chosen === oi;
                      const isCorrect = m.correct === oi;
                      let cls =
                        "border-white/10 bg-black/20 hover:bg-black/30";
                      if (revealed && isCorrect)
                        cls =
                          "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
                      else if (revealed && isChosen && !isCorrect)
                        cls = "border-rose-400/40 bg-rose-400/10 text-rose-100";
                      else if (!revealed && isChosen)
                        cls = "border-sky-400/40 bg-sky-400/10 text-sky-100";
                      return (
                        <li key={oi}>
                          <button
                            onClick={() => pickOption(qi, oi)}
                            disabled={revealed}
                            className={`tap-target flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition ${cls}`}
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-[11px] tabular-nums">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="min-w-0 flex-1">{opt}</span>
                            {revealed && isCorrect && (
                              <Check
                                className="h-4 w-4 text-emerald-300"
                                strokeWidth={2.5}
                              />
                            )}
                            {revealed && isChosen && !isCorrect && (
                              <X
                                className="h-4 w-4 text-rose-300"
                                strokeWidth={2.5}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {!revealed ? (
                    <button
                      onClick={() => reveal(qi)}
                      disabled={chosen === undefined}
                      className="tap-target mt-2 text-xs text-sky-300 hover:text-sky-200 disabled:opacity-40"
                    >
                      Conferir resposta
                    </button>
                  ) : (
                    m.rationale && (
                      <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          Por quê:
                        </span>{" "}
                        {m.rationale}
                      </p>
                    )
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Open interpretation */}
      {passage && passage.open.q && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Interpretação
          </p>
          <p className="mt-2 text-sm font-medium">{passage.open.q}</p>
          <textarea
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            rows={5}
            placeholder="Responda em português ou inglês…"
            className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface/40 px-4 py-3 text-sm outline-none focus:border-sky-400/40"
          />
          <button
            onClick={submitOpen}
            disabled={!openAnswer.trim() || grading}
            className="tap-target mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {grading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Corrigindo…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" strokeWidth={2.25} /> Enviar resposta
              </>
            )}
          </button>

          {grade && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Correção
                </p>
                <div className="rounded-full bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-200 tabular-nums">
                  {grade.score}/100
                </div>
              </div>
              {grade.summary && <p className="text-sm">{grade.summary}</p>}
              {grade.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-300">
                    Você mandou bem
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {grade.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {grade.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-300">
                    Para aprofundar
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
                    {grade.improvements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {grade.modelAnswer && (
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-300">
                    Resposta modelo
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{grade.modelAnswer}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Save to deck */}
      {passage && (
        <section className="glass-panel mt-4 rounded-3xl border p-5">
          <button
            onClick={() => setSaveOpen((s) => !s)}
            className="flex w-full items-center gap-2 text-left"
          >
            <Library className="h-4 w-4 text-sky-300" strokeWidth={2.25} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Salvar como cartas
            </p>
            <span className="ml-auto text-muted-foreground">
              {saveOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          {saveOpen && (
            <div className="mt-3">
              {decks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                  <p className="text-muted-foreground">
                    Você ainda não tem decks. Crie um na biblioteca para salvar
                    cartas a partir deste texto.
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
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    Deck
                  </label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-surface/40 px-4 py-2.5 text-sm outline-none focus:border-sky-400/40"
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  {passage.glossary.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Glossário ({passage.glossary.length})
                        </p>
                        <div className="flex gap-1 text-[11px]">
                          <button
                            onClick={() => selectAllGloss(true)}
                            className="rounded-full px-2 py-1 text-sky-300 hover:bg-sky-400/10"
                          >
                            Todos
                          </button>
                          <button
                            onClick={() => selectAllGloss(false)}
                            className="rounded-full px-2 py-1 text-muted-foreground hover:bg-white/5"
                          >
                            Nenhum
                          </button>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {passage.glossary.map((v, i) => (
                          <li key={i}>
                            <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm transition hover:bg-black/30">
                              <input
                                type="checkbox"
                                checked={!!pickedGloss[i]}
                                onChange={() => toggleGloss(i)}
                                className="mt-0.5 accent-sky-400"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="font-medium">{v.word}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  — {v.meaning}
                                </span>
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
                      className="mt-0.5 accent-sky-400"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">Texto completo</span>
                      <span className="block text-xs text-muted-foreground">
                        Frente: texto em inglês · Verso: tradução
                      </span>
                    </span>
                  </label>

                  <button
                    onClick={saveCards}
                    disabled={pickedCount === 0 || !selectedDeck}
                    className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                    {pickedCount === 0
                      ? "Selecione ao menos uma carta"
                      : `Adicionar ${pickedCount} carta${pickedCount > 1 ? "s" : ""}`}
                  </button>

                  {savedCount > 0 && (
                    <p className="mt-3 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-200">
                      ✓ {savedCount} carta{savedCount > 1 ? "s" : ""} adicionada
                      {savedCount > 1 ? "s" : ""} ao deck.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
