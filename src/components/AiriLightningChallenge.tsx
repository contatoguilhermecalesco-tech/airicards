import { useEffect, useRef, useState } from "react";
import { Timer, Zap, X, Hourglass, Lock } from "lucide-react";
import { useStore } from "@/lib/flashcards-store";
import { earn } from "@/lib/wallet-store";
import { useCurrentProfile } from "@/lib/profile";
import { useAppSettings } from "@/lib/app-settings";
import { awardLp } from "@/lib/rank-store";
import {
  LIGHTNING_MIN_CARDS, LIGHTNING_SECONDS, LIGHTNING_TARGET, GRADE_TABLE,
  buildQuestion, comboMultiplier, gradeFor, lpFor, nextFastStreak, lightningAccess, lightningDay, lightningKey, msUntilNextChallenge, resolveAnswer, rewardFor,
  type LightningGrade, type LightningResult, type QuizQuestion,
} from "@/lib/lightning-challenge";
import startImg from "@/assets/airi-emotes/airi-lightning-start.png";
import winImg from "@/assets/airi-emotes/airi-lightning-win.png";
import failImg from "@/assets/airi-emotes/airi-lightning-fail.png";

type Phase = "intro" | "countdown" | "play" | LightningResult;

export function AiriLightningCard() {
  const profile = useCurrentProfile();
  const cards = useStore((s) => s.cards);
  const [playedToday, setPlayedToday] = useState<string | null>("loading");
  const [open, setOpen] = useState(false);
  const { lightning } = useAppSettings();

  useEffect(() => {
    if (!profile) return;
    try { setPlayedToday(localStorage.getItem(lightningKey(profile.id))); } catch { setPlayedToday(null); }
  }, [profile]);

  if (!profile || playedToday === "loading" || cards.length < LIGHTNING_MIN_CARDS) return null;
  const access = lightningAccess(lightning.mode, lightning.releasedAt, playedToday);
  const played = access === "played";

  const markPlayed = (r: LightningResult) => {
    const v = `${lightningDay()}:${r}:${Date.now()}`;
    try { localStorage.setItem(lightningKey(profile.id), v); } catch { /* ignore */ }
    setPlayedToday(v);
  };

  return (
    <>
      {access === "closed" && !open ? (
        <div className="mt-5 flex w-full items-center gap-4 rounded-[22px] border border-border/60 bg-card/50 p-4 backdrop-blur-xl">
          <img src={startImg} alt="" className="h-16 w-16 shrink-0 object-contain opacity-50 grayscale" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Desafio Relâmpago fechado
            </div>
            <p className="mt-1 text-[14px] text-foreground">A Airi guardou o cronômetro por enquanto. Volte mais tarde!</p>
          </div>
        </div>
      ) : played && !open ? (
        <LightningCooldown onReset={() => setPlayedToday(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mt-5 flex w-full items-center gap-4 overflow-hidden rounded-[22px] border border-primary/25 bg-card/70 p-4 text-left backdrop-blur-xl transition hover:border-primary/50"
        >
          <img src={startImg} alt="" className="h-20 w-20 shrink-0 object-contain drop-shadow-lg transition group-hover:scale-105" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Zap className="h-3.5 w-3.5" /> Desafio Relâmpago
            </div>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{LIGHTNING_TARGET} cartas em {LIGHTNING_SECONDS}s</p>
            <p className="text-[13px] text-muted-foreground">Até +{GRADE_TABLE.S.arlys} Arlys ✦ e +{GRADE_TABLE.S.lp} LP · errou uma, acabou.</p>
          </div>
        </button>
      )}
      {open && <LightningModal onClose={() => setOpen(false)} onFinish={markPlayed} />}
    </>
  );
}

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(t / 3600))}h ${p(Math.floor((t % 3600) / 60))}m ${p(t % 60)}s`;
}

function LightningCooldown({ onReset }: { onReset: () => void }) {
  const [ms, setMs] = useState(() => msUntilNextChallenge());
  useEffect(() => {
    const t = window.setInterval(() => {
      const left = msUntilNextChallenge();
      setMs(left);
      if (left > 86_390_000) onReset();
    }, 1000);
    return () => window.clearInterval(t);
  }, [onReset]);
  return (
    <div className="mt-5 flex w-full items-center gap-4 rounded-[22px] border border-border/60 bg-card/50 p-4 backdrop-blur-xl">
      <img src={startImg} alt="" className="h-16 w-16 shrink-0 object-contain opacity-60 grayscale-[40%]" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Hourglass className="h-3.5 w-3.5" /> Desafio de hoje encerrado
        </div>
        <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">Próximo desafio em {fmt(ms)}</p>
      </div>
    </div>
  );
}

function LightningModal({ onClose, onFinish }: { onClose: () => void; onFinish: (r: LightningResult) => void }) {
  const cards = useStore((s) => s.cards);
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(LIGHTNING_SECONDS);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState<QuizQuestion | null>(null);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState<"wrong" | "time" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [fastStreak, setFastStreak] = useState(0);
  const [maxMult, setMaxMult] = useState(1);
  const [score, setScore] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [grade, setGrade] = useState<LightningGrade | null>(null);
  const [lpGained, setLpGained] = useState(0);
  const [arlysGained, setArlysGained] = useState(0);
  const startedAt = useRef(0);
  const questionAt = useRef(0);
  const done = useRef(false);

  const next = () => { setQ(buildQuestion(cards)); questionAt.current = Date.now(); };

  const finish = (r: LightningResult) => {
    if (done.current) return;
    done.current = true;
    const secs = (Date.now() - startedAt.current) / 1000;
    setElapsed(secs);
    setPhase(r);
    onFinish(r);
    const amount = rewardFor(r, secs);
    const lp = lpFor(r, secs);
    setArlysGained(amount);
    setLpGained(lp);
    if (r === "win") setGrade(gradeFor(secs));
    if (amount > 0) void earn(amount, "Desafio Relâmpago");
    if (lp > 0) awardLp(lp, "lightning.win");
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { startedAt.current = Date.now(); next(); setPhase("play"); return; }
    const t = window.setTimeout(() => setCount((c) => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "play") return;
    const t = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const remaining = Math.max(0, LIGHTNING_SECONDS - elapsed);
      setLeft(remaining);
      if (remaining <= 0) { setReason("time"); finish("fail"); }
    }, 100);
    return () => window.clearInterval(t);
  }, [phase]);

  const answer = (opt: string) => {
    if (!q || phase !== "play" || flash || done.current) return;
    const ok = opt === q.answer;
    setPicked(opt);
    setFlash(ok ? "ok" : "bad");
    if (navigator.vibrate) navigator.vibrate(ok ? 20 : [60, 40, 60]);
    const c = ok ? correct + 1 : correct;
    if (ok) {
      setCorrect(c);
      const fs = nextFastStreak(fastStreak, (Date.now() - questionAt.current) / 1000);
      const mult = comboMultiplier(fs);
      setFastStreak(fs);
      setMaxMult((m) => Math.max(m, mult));
      setScore((sc) => sc + Math.round(100 * mult));
      if (mult > 1) setPulse((p) => p + 1);
    }
    const outcome = resolveAnswer(ok, c, (Date.now() - startedAt.current) / 1000);
    if (outcome === "fail") {
      setReason("wrong");
      window.setTimeout(() => finish("fail"), 650);
      return;
    }
    if (outcome === "win") { finish("win"); return; }
    window.setTimeout(() => { setFlash(null); setPicked(null); next(); }, 180);
  };

  const pct = (left / LIGHTNING_SECONDS) * 100;
  const danger = left <= 10;
  const canClose = phase !== "play" && phase !== "countdown";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-background/80 p-5 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-[28px] border border-primary/25 bg-card/95 p-6 text-center shadow-2xl">
        {canClose && (
          <button onClick={onClose} aria-label="Fechar" className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}

        {phase === "intro" && (
          <>
            <img src={startImg} alt="Airi cronometrista" className="mx-auto h-44 w-44 object-contain animate-[airi-duty-pop_0.6s_ease-out]" />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Desafio Relâmpago</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Acerte {LIGHTNING_TARGET} em {LIGHTNING_SECONDS} segundos</h2>
            <p className="mt-2 text-sm text-muted-foreground">Inglês ↔ português, 4 alternativas. Responda em menos de 3s para subir o combo. Errou uma, acabou.</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px]">
              {(["S", "A", "B"] as const).map((g) => (
                <div key={g} className="rounded-xl bg-muted/40 px-2 py-2">
                  <p className="text-base font-bold text-foreground">{g}</p>
                  <p className="text-muted-foreground">{GRADE_TABLE[g].label}</p>
                  <p className="font-semibold text-primary">+{GRADE_TABLE[g].arlys} ✦ · +{GRADE_TABLE[g].lp} LP</p>
                </div>
              ))}
            </div>
            <button onClick={() => setPhase("countdown")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground">
              <Timer className="h-4 w-4" /> Aceitar desafio
            </button>
            <button onClick={onClose} className="mt-2 w-full py-2 text-sm text-muted-foreground">Agora não</button>
          </>
        )}

        {phase === "countdown" && (
          <div className="py-16 text-7xl font-bold text-primary">{count === 0 ? "JÁ!" : count}</div>
        )}

        {phase === "play" && q && (
          <>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{correct}/{LIGHTNING_TARGET}</span>
              <span className={danger ? "text-destructive animate-pulse" : "text-primary"}>{Math.ceil(left)}s</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full transition-[width] duration-100 ${danger ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-4 flex justify-center gap-1.5">
              {Array.from({ length: LIGHTNING_TARGET }).map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${i < correct ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {q.direction === "en-pt" ? "🇺🇸 ➔ 🇧🇷" : "🇧🇷 ➔ 🇺🇸"}
              </span>
              <span
                key={pulse}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums transition ${
                  comboMultiplier(fastStreak) > 1
                    ? "bg-primary/25 text-primary shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_55%,transparent)] animate-[lightning-combo_0.45s_ease-out]"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <Zap className="mr-1 inline h-3 w-3" />
                Combo {comboMultiplier(fastStreak)}x
              </span>
            </div>
            <p className={`mt-4 min-h-[64px] text-2xl font-semibold text-foreground transition ${flash === "bad" ? "text-destructive" : ""}`}>{q.prompt}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {q.options.map((o) => (
                <button
                  key={o}
                  onClick={() => answer(o)}
                  className={`min-h-[64px] break-words rounded-2xl border px-3 py-3 text-[14px] font-medium leading-snug transition active:scale-[0.97] ${
                    flash && o === q.answer ? "border-primary bg-primary/20 text-foreground"
                      : flash === "bad" && o === picked ? "border-destructive bg-destructive/20 text-destructive"
                      : "border-border bg-muted/40 text-foreground hover:border-primary/50"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}

        {(phase === "win" || phase === "fail") && (
          <>
            <img src={phase === "win" ? winImg : failImg} alt="" className="mx-auto h-48 w-48 object-contain animate-[airi-duty-pop_0.6s_ease-out]" />
            <p className={`mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${phase === "win" ? "text-primary" : "text-destructive"}`}>
              {phase === "win" ? "Vitória" : reason === "wrong" ? "Morte súbita" : "Tempo esgotado"}
            </p>
            {phase === "win" && grade && <GradeSeal grade={grade} />}
            <h2 className="mt-1 text-2xl font-semibold text-foreground">
              {phase === "win" ? `No bolso! +${arlysGained} Arlys ✦` : "Fim de jogo!"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {phase === "win"
                ? `Grau ${grade} · +${lpGained} LP no seu rank da temporada.`
                : reason === "wrong" ? "Errou uma tradução — a Airi apitou na hora." : "O cronômetro zerou antes das 5 cartas."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-lg font-semibold tabular-nums text-foreground">{correct}/{LIGHTNING_TARGET}</p>
                <p className="text-[11px] text-muted-foreground">acertos</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-lg font-semibold tabular-nums text-foreground">{Math.min(elapsed, LIGHTNING_SECONDS).toFixed(1)}s</p>
                <p className="text-[11px] text-muted-foreground">tempo</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-lg font-semibold tabular-nums text-foreground">{maxMult}x</p>
                <p className="text-[11px] text-muted-foreground">combo máx.</p>
              </div>
            </div>
            <p className="mt-2 text-[12px] tabular-nums text-muted-foreground">Pontuação: {score}</p>
            <button onClick={onClose} autoFocus className="mt-5 w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground">
              {phase === "win" ? "Resgatar e concluir" : "Tentar amanhã"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GradeSeal({ grade }: { grade: LightningGrade }) {
  const style =
    grade === "S"
      ? "border-primary bg-gradient-to-br from-primary/40 to-accent/30 text-primary-foreground shadow-[0_0_32px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
      : grade === "A"
        ? "border-foreground/40 bg-gradient-to-br from-foreground/25 to-muted/40 text-foreground shadow-[0_0_20px_color-mix(in_oklab,var(--foreground)_25%,transparent)]"
        : "border-border bg-muted/50 text-foreground";
  return (
    <div className="relative mx-auto mt-3 grid h-16 w-16 place-items-center">
      {grade === "S" && (
        <span aria-hidden className="absolute inset-0 rounded-full border border-primary/60 animate-ping" />
      )}
      <span className={`grid h-16 w-16 place-items-center rounded-full border-2 text-3xl font-black animate-[airi-duty-pop_0.6s_ease-out] ${style}`}>
        {grade}
      </span>
    </div>
  );
}
