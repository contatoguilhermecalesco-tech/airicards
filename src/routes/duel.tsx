import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Swords, Trophy, Clock, Check, X, Sparkles, Layers, AlertCircle, TimerReset, ShieldAlert } from "lucide-react";
import { useCurrentProfile, PROFILES } from "@/lib/profile";
import { useStore } from "@/lib/flashcards-store";
import {
  useWeeklyDuel,
  useDuelResults,
  useDuelScore,
  useDuelHistory,
  createWeeklyDuel,
  submitDuelResult,
  otherProfile,
  profileMeta,
  currentWeekKey,
  duelDeadline,
  DUEL_WINDOW_HOURS,
  type ProfileId,
  type Duel,
  type DuelCardSnapshot,
} from "@/lib/social-store";

export const Route = createFileRoute("/duel")({
  head: () => ({
    meta: [
      { title: "Duelo semanal — airi" },
      { name: "description", content: "Guilherme × Arlayne — mesmo baralho, cronometrado. Quem vence a semana?" },
      { property: "og:title", content: "Duelo semanal — airi" },
      { property: "og:description", content: "Mesmas 5 cartas, cronômetro, melhor acurácia vence." },
    ],
  }),
  component: DuelPage,
});

function DuelPage() {
  const me = useCurrentProfile();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const duel = useWeeklyDuel();
  const results = useDuelResults(duel?.id);
  const score = useDuelScore();
  const history = useDuelHistory();
  const [creating, setCreating] = useState(false);
  const [pickDeckId, setPickDeckId] = useState<string>("");
  const [playing, setPlaying] = useState(false);

  if (!me) return null;
  const meId = me.id as ProfileId;
  const oppId = otherProfile(meId);
  const opp = profileMeta(oppId);

  const myResult = results.find((r) => r.profileId === meId);
  const oppResult = results.find((r) => r.profileId === oppId);

  async function handleCreate() {
    if (!pickDeckId) return;
    const deck = decks.find((d) => d.id === pickDeckId);
    if (!deck) return;
    const deckCards: DuelCardSnapshot[] = cards
      .filter((c) => c.deckId === deck.id)
      .map((c) => ({ id: c.id, front: c.front, back: c.back, category: c.mode }));
    if (deckCards.length < 3) {
      alert("Este deck precisa de pelo menos 3 cartas para duelar.");
      return;
    }
    setCreating(true);
    await createWeeklyDuel(meId, { id: deck.id, name: deck.name }, deckCards);
    setCreating(false);
  }

  if (playing && duel) {
    return (
      <DuelPlay
        duel={duel}
        meId={meId}
        onDone={() => setPlaying(false)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-24 sm:pb-6">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" strokeWidth={2.25} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Duelo semanal · {currentWeekKey()}
          </p>
        </div>
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
          Guilherme × Arlayne
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mesmas cartas · cronômetro · melhor acurácia vence.
        </p>
      </header>

      {/* Placar histórico */}
      <div className="grid grid-cols-2 gap-2.5">
        {PROFILES.map((p) => {
          const wins = p.id === "guilherme" ? score.g : score.a;
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: p.gradient }}
                >
                  {p.initial}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Vitórias
                  </p>
                  <p className="text-[20px] font-semibold tabular-nums text-foreground">
                    {wins}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado do duelo da semana */}
      <section className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
        {!duel ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Ainda não há duelo esta semana
            </p>
            <p className="mt-1 text-[15px] font-medium text-foreground">
              Escolha um baralho para o desafio
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              O sistema sorteia 5 cartas — as mesmas para os dois duelistas.
            </p>

            {decks.length === 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[13px] text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Você ainda não tem baralhos. Crie um na biblioteca.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {decks.map((d) => {
                  const count = cards.filter((c) => c.deckId === d.id).length;
                  const selected = pickDeckId === d.id;
                  const eligible = count >= 3;
                  const accent = d.color || "hsl(265 85% 65%)";
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={!eligible}
                      onClick={() => setPickDeckId(d.id)}
                      className={`group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                        selected
                          ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_10px_30px_-12px_hsl(var(--primary)/0.5)]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                      } ${!eligible ? "opacity-50" : ""}`}
                    >
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
                        style={{ background: accent }}
                      />
                      <div className="relative flex items-start gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-inner"
                          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
                        >
                          <Layers className="h-4.5 w-4.5" strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-foreground">
                            {d.name}
                          </p>
                          <p className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
                            {count} {count === 1 ? "carta" : "cartas"}
                            {!eligible && " · mín. 3"}
                          </p>
                        </div>
                        {selected && (
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              disabled={!pickDeckId || creating}
              onClick={handleCreate}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              {creating ? "Criando duelo…" : "Criar duelo desta semana"}
            </button>
          </>
        ) : duel.status === "completed" ? (
          <DuelSummary duel={duel} meId={meId} results={results} />
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Duelo em andamento · {duel.deckName}
            </p>
            <p className="mt-1 text-[15px] font-medium text-foreground">
              {duel.cardsSnapshot.length} cartas · criado por {profileMeta(duel.createdBy).name}
            </p>

            <DeadlinePill duel={duel} />

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <PlayerStatus profile={me} result={myResult} isMe />
              <PlayerStatus profile={opp} result={oppResult} />
            </div>

            {!myResult ? (
              <button
                onClick={() => setPlaying(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
              >
                <Swords className="h-4 w-4" strokeWidth={2.5} />
                Jogar minha rodada
              </button>
            ) : !oppResult ? (
              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-center text-[13px] text-muted-foreground">
                Você jogou. Aguardando {opp.name}… Se ela não jogar no prazo, você vence por WO.
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Histórico */}
      {history.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Trophy className="h-4 w-4 text-amber-300" />
            <h2 className="text-[17px] font-semibold tracking-tight">Semanas anteriores</h2>
          </div>
          <ul className="space-y-2">
            {history.map((d) => {
              const winner = d.winner ? profileMeta(d.winner) : null;
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {d.weekKey}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-foreground">
                      {d.deckName}
                    </p>
                  </div>
                  {winner ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
                        style={{ background: winner.gradient }}
                      >
                        {winner.initial}
                      </div>
                      <Trophy className="h-3.5 w-3.5 text-amber-300" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">empate</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function PlayerStatus({
  profile,
  result,
  isMe,
}: {
  profile: { id: string; name: string; initial: string; gradient: string };
  result: { correct: number; total: number; timeMs: number; accuracy: number } | undefined;
  isMe?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <div
          className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: profile.gradient }}
        >
          {profile.initial}
        </div>
        <p className="text-[12px] font-semibold text-foreground">
          {isMe ? "Você" : profile.name}
        </p>
      </div>
      {result ? (
        <div className="mt-2">
          <p className="text-[18px] font-semibold tabular-nums text-foreground">
            {Math.round(result.accuracy * 100)}%
          </p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {result.correct}/{result.total} · {Math.round(result.timeMs / 1000)}s
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-muted-foreground">Aguardando…</p>
      )}
    </div>
  );
}

function DuelSummary({
  duel,
  meId,
  results,
}: {
  duel: Duel;
  meId: ProfileId;
  results: ReturnType<typeof useDuelResults>;
}) {
  const winner = duel.winner ? profileMeta(duel.winner) : null;
  const iWon = duel.winner === meId;
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Semana concluída · {duel.deckName}
      </p>
      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
        {winner ? (
          <>
            <Trophy className="mx-auto h-6 w-6 text-amber-300" strokeWidth={2.25} />
            <p className="mt-2 text-[18px] font-semibold text-foreground">
              {iWon ? "Você venceu!" : `${winner.name} venceu`}
            </p>
          </>
        ) : (
          <p className="text-[15px] font-semibold text-foreground">Empate técnico</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {PROFILES.map((p) => {
          const r = results.find((x) => x.profileId === p.id);
          return (
            <PlayerStatus key={p.id} profile={p} result={r} isMe={p.id === meId} />
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// Sessão de jogo
// ============================================================

function DuelPlay({
  duel,
  meId,
  onDone,
}: {
  duel: Duel;
  meId: ProfileId;
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startedAt.current), 200);
    return () => clearInterval(t);
  }, []);

  const total = duel.cardsSnapshot.length;
  const card = duel.cardsSnapshot[idx];

  async function answer(hit: boolean) {
    const nextCorrect = correct + (hit ? 1 : 0);
    setCorrect(nextCorrect);
    if (idx + 1 >= total) {
      const timeMs = Date.now() - startedAt.current;
      setFinished(true);
      await submitDuelResult(duel, meId, {
        correct: nextCorrect,
        total,
        timeMs,
      });
      setTimeout(onDone, 1600);
    } else {
      setFlipped(false);
      setIdx((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 text-center">
        <div>
          <Trophy className="mx-auto h-10 w-10 text-amber-300" strokeWidth={2} />
          <p className="mt-3 text-[22px] font-semibold text-foreground">Rodada enviada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correct}/{total} · {Math.round(elapsed / 1000)}s
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between text-[12px] text-muted-foreground">
        <span className="tabular-nums">
          {idx + 1}/{total}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock className="h-3.5 w-3.5" />
          {Math.round(elapsed / 1000)}s
        </span>
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="grid min-h-[260px] cursor-pointer place-items-center rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 text-center transition active:scale-[0.995]"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {flipped ? "Verso" : "Frente"}
          </p>
          <p className="mt-3 text-[22px] font-semibold text-foreground">
            {flipped ? card.back : card.front}
          </p>
          {!flipped && (
            <p className="mt-4 text-[12px] text-muted-foreground">Toque para virar</p>
          )}
        </div>
      </div>

      {flipped && (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => answer(false)}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/10 py-3 text-[14px] font-semibold text-destructive hover:bg-destructive/15 active:scale-[0.99]"
          >
            <X className="h-4 w-4" strokeWidth={2.5} /> Errei
          </button>
          <button
            onClick={() => answer(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.99]"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} /> Acertei
          </button>
        </div>
      )}
    </main>
  );
}
