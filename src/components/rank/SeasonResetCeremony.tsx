import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Gift, Sparkles, X } from "lucide-react";
import { RankEmblem } from "@/components/RankBadge";
import {
  claimSeasonReward,
  dismissSeasonTransition,
  TIER_COLORS,
  TIER_LABEL,
  DIVISION_ROMAN,
  isElite,
  useRank,
  type Division,
  type Tier,
} from "@/lib/rank-store";
import { PLACEMENT_EVENTS, seasonLabel } from "@/lib/season-engine";
import { earn } from "@/lib/wallet-store";
import airiCeremony from "@/assets/airi-emotes/airi-season-ceremony.png";

function rankName(tier: Tier, division: Division) {
  return isElite(tier)
    ? TIER_LABEL[tier]
    : `${TIER_LABEL[tier]} ${DIVISION_ROMAN[division as Exclude<Division, null>]}`;
}

/** Cerimônia global da virada: memória do split, soft reset, prêmio e novo elo. */
export function SeasonResetCeremony() {
  const rank = useRank();
  const transition = rank.seasonTransition;
  const transitionKey = transition ? `${transition.from.season}:${transition.toSeason}` : "";
  const [stage, setStage] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!transition) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStage(reduced ? 2 : 0);
    setClaimedAmount(0);
    setClaiming(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [transitionKey]);

  useEffect(() => {
    if (!transition || stage >= 2) return;
    const timer = window.setTimeout(() => setStage((value) => value + 1), stage === 0 ? 1500 : 1350);
    return () => window.clearTimeout(timer);
  }, [stage, transitionKey]);

  useEffect(() => {
    if (!transition) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissSeasonTransition();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [transitionKey]);

  const particles = useMemo(() => Array.from({ length: 20 }, (_, index) => ({
    index,
    x: ((index * 47) % 120) - 60,
    y: 90 + ((index * 31) % 170),
    rotate: (index * 71) % 300,
    delay: (index % 7) * 70,
    size: 5 + (index % 4) * 2,
  })), []);

  if (!transition) return null;

  const oldColors = TIER_COLORS[transition.from.tier];
  const newColors = TIER_COLORS[transition.toTier];
  const pending = rank.pendingSeasonReward ?? 0;

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    const amount = claimSeasonReward();
    if (amount > 0) await earn(amount, "season.reward");
    setClaimedAmount(amount);
    setClaiming(false);
    setStage(3);
  };

  return (
    <div className="season-ceremony fixed inset-0 z-[140] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="season-ceremony-title">
      <div className="season-ceremony-backdrop absolute inset-0" aria-hidden="true" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          ref={closeRef}
          type="button"
          onClick={dismissSeasonTransition}
          className="season-ceremony-close absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border border-border bg-surface/80 text-muted-foreground backdrop-blur-xl transition hover:bg-accent hover:text-foreground"
          aria-label="Fechar cerimônia de temporada"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="season-ceremony-panel relative my-auto w-full max-w-[480px] overflow-hidden rounded-[28px] border border-border bg-card/95 text-center shadow-card backdrop-blur-2xl">
          <div className="season-ceremony-grid absolute inset-0" aria-hidden="true" />
          <div
            className="season-ceremony-halo absolute left-1/2 top-[32%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, ${stage === 3 ? newColors.glow : oldColors.glow}, transparent 68%)` }}
            aria-hidden="true"
          />

          {stage >= 2 && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {particles.map((particle) => (
                <span
                  key={particle.index}
                  className="season-ceremony-confetti absolute left-1/2 top-[18%] rounded-[2px]"
                  style={{
                    width: particle.size,
                    height: particle.size * 1.8,
                    animationDelay: `${particle.delay}ms`,
                    "--season-x": `${particle.x}vw`,
                    "--season-y": `${particle.y}px`,
                    "--season-rotate": `${particle.rotate}deg`,
                  } as CSSProperties}
                />
              ))}
            </div>
          )}

          <div className="relative flex min-h-[540px] flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pt-8">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Virada de temporada
            </div>

            {stage === 0 && (
              <div className="season-stage flex flex-1 flex-col items-center justify-center py-6" key="finished">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{seasonLabel(transition.from.season)} concluída</p>
                <h2 id="season-ceremony-title" className="mt-3 max-w-xs font-display text-3xl font-semibold leading-tight text-foreground">Sua marca ficou na história.</h2>
                <div className="season-old-emblem relative my-8" style={{ filter: `drop-shadow(0 0 28px ${oldColors.glow})` }}>
                  <RankEmblem tier={transition.from.tier} division={transition.from.division} size={148} />
                </div>
                <p className="text-sm text-muted-foreground">Seu pico nesta temporada</p>
                <p className="mt-1 text-xl font-semibold" style={{ color: oldColors.text }}>{rankName(transition.from.tier, transition.from.division)}</p>
              </div>
            )}

            {stage === 1 && (
              <div className="season-stage flex flex-1 flex-col items-center justify-center py-6" key="reset">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Reset de elo</p>
                <h2 id="season-ceremony-title" className="mt-3 font-display text-3xl font-semibold text-foreground">Uma nova corrida começa.</h2>
                <div className="season-reset-emblem relative my-9" style={{ filter: `drop-shadow(0 0 32px ${oldColors.glow})` }}>
                  <RankEmblem tier={transition.from.tier} division={transition.from.division} size={154} />
                  <span className="season-reset-flash absolute inset-0" aria-hidden="true" />
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">O brasão anterior vira história. Seu progresso abre espaço para uma nova ascensão.</p>
              </div>
            )}

            {stage === 2 && (
              <div className="season-stage flex flex-1 flex-col items-center justify-center py-4" key="reward">
                <img
                  src={airiCeremony}
                  alt="Airi comemorando com uma taça cheia de Arlys"
                  className="season-ceremony-airi my-0 h-auto w-full max-w-[340px] object-contain"
                  draggable={false}
                />
                <h2 id="season-ceremony-title" className="-mt-2 font-display text-[28px] font-semibold leading-tight text-foreground">Mandou bem. De verdade.</h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">“Seu esforço virou Arlys. Gaste com sabedoria… ou não.”</p>
                <div className="season-reward-chip mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-lg font-bold text-foreground">
                  <Gift className="h-5 w-5 text-primary" />
                  +{transition.from.reward} <span aria-label="Arlys">✦</span>
                </div>
                <button
                  type="button"
                  onClick={claim}
                  disabled={claiming}
                  className="mt-6 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {claiming ? "Resgatando…" : pending > 0 ? "Resgatar e revelar meu novo elo" : "Revelar meu novo elo"}
                  {!claiming && <ArrowRight className="h-4 w-4" />}
                </button>
                <button type="button" onClick={dismissSeasonTransition} className="mt-2 min-h-11 touch-manipulation px-4 text-xs font-medium text-muted-foreground transition hover:text-foreground">
                  Resgatar depois
                </button>
              </div>
            )}

            {stage === 3 && (
              <div className="season-stage flex flex-1 flex-col items-center justify-center py-5" key="new-rank">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{seasonLabel(transition.toSeason)}</p>
                <h2 id="season-ceremony-title" className="mt-3 font-display text-3xl font-semibold text-foreground">Seu novo ponto de partida.</h2>
                <div className="season-new-emblem relative my-8" style={{ filter: `drop-shadow(0 0 32px ${newColors.glow})` }}>
                  <RankEmblem tier={transition.toTier} division={transition.toDivision} size={152} />
                </div>
                <p className="text-2xl font-semibold" style={{ color: newColors.text }}>{rankName(transition.toTier, transition.toDivision)}</p>
                <p className="mt-2 text-xs text-muted-foreground">0 LP · soft reset concluído{claimedAmount > 0 ? ` · +${claimedAmount} ✦ resgatados` : ""}</p>
                <div className="mt-5 w-full rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs leading-relaxed text-foreground">
                  <strong>Calibração ativa:</strong> {PLACEMENT_EVENTS} acertos sem perda de LP e com +50% de ganho.
                </div>
                <button
                  type="button"
                  onClick={dismissSeasonTransition}
                  className="mt-6 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Começar nova temporada <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {stage < 2 && (
              <button type="button" onClick={() => setStage(2)} className="min-h-11 touch-manipulation px-5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
                Pular animação
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
