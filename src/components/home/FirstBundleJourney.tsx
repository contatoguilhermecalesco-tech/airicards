// Card de "Provações do Primeiro Bundle" — visível somente enquanto o
// usuário ainda não comprou nenhum bundle. Sem prazo: cada passo fica
// aberto até ser cumprido e reivindicado.
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Gift, Sparkles, Lock } from "lucide-react";
import {
  useJourney,
  claimJourneyStep,
  currentJourneyStep,
  journeyTotals,
  onJourneyStepClaimed,
  type JourneyStep,
} from "@/lib/daily-challenges";

const STEP_ROUTES: Record<string, string> = {
  step_review: "/review",
  step_correct: "/review",
  step_enemies: "/enemies",
  step_writing: "/writing",
  step_duel: "/social",
  step_rank: "/rank",
};

const STEP_CTA: Record<string, string> = {
  step_review: "Revisar cartas",
  step_correct: "Revisar cartas",
  step_enemies: "Ir à Arena",
  step_writing: "Escrever",
  step_duel: "Ir ao Duelo",
  step_rank: "Ver o Rank",
};

export function FirstBundleJourney() {
  const journey = useJourney();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<JourneyStep | null>(null);

  useEffect(() => {
    const unsub = onJourneyStepClaimed((step) => {
      setFlash(step);
      setTimeout(() => setFlash(null), 2400);
    });
    return () => {
      unsub();
    };
  }, []);

  if (!journey.loaded || journey.hasFirstBundle) return null;

  const totals = journeyTotals();
  const current = currentJourneyStep();
  const percent = Math.round((totals.earned / Math.max(1, totals.total)) * 100);
  const allClaimed = totals.completed === totals.count;

  return (
    <section
      className="animate-fade-in mt-6 lg:col-span-8 lg:col-start-1 lg:row-start-3 lg:mt-0"
      style={{ animationDelay: "90ms", animationFillMode: "backwards" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_16px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {/* Rim light */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Aura sutil */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-violet-500/[0.06] blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/50">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                Jornada · Primeiro bundle
              </div>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-white">
                Provações do primeiro bundle
              </h3>
              <p className="mt-0.5 text-[13px] text-white/55">
                Cumpra no seu ritmo — sem prazo. Recompensas somam{" "}
                <span className="text-white/80">{totals.total} ✦</span>, o
                bastante para o seu primeiro bundle mítico.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-xs text-white/50">
                {totals.completed}/{totals.count}
              </span>
              <span className="mt-1 text-sm font-semibold text-white/85">
                {totals.earned} ✦
              </span>
            </div>
          </div>

          {/* Progress bar geral */}
          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400/80 to-violet-300/80 transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Passos */}
          <ul className="mt-5 space-y-2">
            {journey.steps.map((step, idx) => {
              const isCurrent = current?.id === step.id;
              const ready = step.progress >= step.target && !step.claimed;
              const locked =
                !step.claimed &&
                !isCurrent &&
                !ready &&
                journey.steps
                  .slice(0, idx)
                  .some((prev) => !prev.claimed);

              return (
                <li
                  key={step.id}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    step.claimed
                      ? "border-emerald-400/12 bg-emerald-400/[0.03]"
                      : ready
                        ? "border-violet-300/20 bg-white/[0.04]"
                        : isCurrent
                          ? "border-white/[0.08] bg-white/[0.025]"
                          : "border-white/[0.04] bg-white/[0.012]"
                  }`}
                >
                  <StepBadge step={step} locked={locked} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-medium ${
                          locked ? "text-white/40" : "text-white/90"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] ${
                          step.claimed ? "text-emerald-200/80" : "text-white/60"
                        }`}
                      >
                        +{step.reward} ✦
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`truncate text-[12px] ${
                          locked ? "text-white/30" : "text-white/55"
                        }`}
                      >
                        {step.description}
                      </span>
                      {!step.claimed && !locked && (
                        <span className="shrink-0 text-[11px] tabular-nums text-white/45">
                          {step.progress}/{step.target}
                        </span>
                      )}
                    </div>
                  </div>
                  <StepAction
                    step={step}
                    ready={ready}
                    locked={locked}
                    claiming={claimingId === step.id}
                    onClaim={async () => {
                      setClaimingId(step.id);
                      await claimJourneyStep(step.id);
                      setClaimingId(null);
                    }}
                  />
                </li>
              );
            })}
          </ul>

          {allClaimed && (
            <div className="mt-4 rounded-xl border border-violet-300/15 bg-white/[0.03] p-3 text-center">
              <p className="text-[13px] text-white/75">
                Jornada completa — use seus ✦ na loja para desbloquear o
                primeiro bundle.
              </p>
              <Link
                to="/shop"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white"
              >
                <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                Ir à loja
              </Link>
            </div>
          )}
        </div>

        {/* Flash de recompensa reivindicada */}
        {flash && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
            <div className="animate-fade-in rounded-full border border-white/15 bg-black/70 px-3.5 py-1.5 text-[12px] font-medium text-white/85 shadow-lg backdrop-blur">
              Provação cumprida · +{flash.reward} ✦
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StepBadge({ step, locked }: { step: JourneyStep; locked: boolean }) {
  if (step.claimed) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (locked) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-white/40 ring-1 ring-white/[0.06]">
        <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    );
  }
  const pct = Math.min(100, Math.round((step.progress / step.target) * 100));
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ring-1 ring-fuchsia-300/25"
      style={{
        background: `conic-gradient(#e879f9 ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
      }}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-black/70">
        {pct}%
      </span>
    </span>
  );
}

function StepAction({
  step,
  ready,
  locked,
  claiming,
  onClaim,
}: {
  step: JourneyStep;
  ready: boolean;
  locked: boolean;
  claiming: boolean;
  onClaim: () => void;
}) {
  if (step.claimed) return null;
  if (ready) {
    return (
      <button
        type="button"
        onClick={onClaim}
        disabled={claiming}
        className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400 px-3 py-1.5 text-[11.5px] font-semibold text-fuchsia-950 shadow-[0_4px_16px_-6px_rgba(232,121,249,0.6)] transition hover:brightness-110 disabled:opacity-60"
      >
        {claiming ? "..." : "Coletar"}
      </button>
    );
  }
  if (locked) return null;
  return (
    <Link
      to={STEP_ROUTES[step.id] ?? "/"}
      className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    >
      {STEP_CTA[step.id] ?? "Começar"}
    </Link>
  );
}
