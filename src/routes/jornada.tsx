import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Compass, Lock, Sparkles, Anchor, Quote, Gift, Check } from "lucide-react";
import { PROFILES, useCurrentProfile } from "@/lib/profile";
import {
  JOURNEY_STOPS,
  JOURNEY_TOTAL_XP,
  claimJourneyStop,
  journeyProgressPct,
  nextStop,
  stopStatus,
  useJourney,
  useJourneySync,
  type JourneyStop,
} from "@/lib/journey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada Compartilhada — airi" },
      {
        name: "description",
        content:
          "O mapa do casal no airi: cada sessão de estudo, de qualquer um dos dois, move o barco e abre paradas com diálogos, curiosidades de inglês e Arlys ✦.",
      },
      { property: "og:title", content: "Jornada Compartilhada — airi" },
      {
        property: "og:description",
        content:
          "Progresso somado entre os dois perfis: quem estuda hoje leva o barco de vocês mais longe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JourneyPage,
});

const KIND_META: Record<
  JourneyStop["kind"],
  { label: string; icon: typeof Quote; color: string }
> = {
  dialogo: { label: "Diálogo da Bússola", icon: Quote, color: "#a78bfa" },
  curiosidade: { label: "Curiosidade de inglês", icon: Sparkles, color: "#60a5fa" },
  recompensa: { label: "Marco da jornada", icon: Gift, color: "#fbbf24" },
};

function JourneyPage() {
  useJourneySync();
  const me = useCurrentProfile();
  const journey = useJourney();
  const [openStop, setOpenStop] = useState<JourneyStop | null>(null);

  const pct = journeyProgressPct(journey);
  const upcoming = nextStop(journey);
  const opened = JOURNEY_STOPS.filter((s) => journey.claimed.includes(s.id)).length;

  const contrib = useMemo(() => {
    const g = journey.contributions["guilherme"] ?? 0;
    const a = journey.contributions["arlayne"] ?? 0;
    const total = g + a;
    return {
      g,
      a,
      gPct: total ? (g / total) * 100 : 50,
      aPct: total ? (a / total) * 100 : 50,
      total,
    };
  }, [journey.contributions]);

  return (
    <div className="page-container pb-24 pt-4 sm:pt-6">
      {/* Hero */}
      <header className="ios-card relative overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.16 285 / 0.55), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <Compass className="h-3.5 w-3.5" /> Jornada Compartilhada
          </div>
          <h1 className="h-title mt-3 font-semibold text-foreground">
            O mapa de vocês dois
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Não importa quem estudou: cada revisão soma no mesmo barco. Se um de
            vocês não conseguiu hoje, o outro carrega um pouco — e a jornada
            continua andando.
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                {journey.xp.toLocaleString("pt-BR")}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                milhas navegadas
              </div>
            </div>
            <div>
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                {opened}/{JOURNEY_STOPS.length}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                paradas abertas
              </div>
            </div>
            {upcoming && (
              <div>
                <div className="text-3xl font-semibold tabular-nums text-foreground">
                  {Math.max(0, upcoming.at - journey.xp).toLocaleString("pt-BR")}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  até {upcoming.title.split(" ")[0]}
                </div>
              </div>
            )}
          </div>

          {/* Barra global */}
          <div className="mt-5">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                style={{
                  width: `${pct}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.68 0.13 250), oklch(0.62 0.16 300))",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>Porto</span>
              <span>{JOURNEY_TOTAL_XP.toLocaleString("pt-BR")} milhas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Remadas de cada um */}
      <section className="glass-panel mt-4 rounded-[24px] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Quem remou até agora</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sem competição: os dois lados somam no mesmo total.
        </p>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full transition-[width] duration-700"
            style={{ width: `${contrib.gPct}%`, background: PROFILES[0]!.gradient }}
          />
          <div
            className="h-full transition-[width] duration-700"
            style={{ width: `${contrib.aPct}%`, background: PROFILES[1]!.gradient }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {PROFILES.map((p, i) => {
            const value = i === 0 ? contrib.g : contrib.a;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3",
                  me?.id === p.id && "border-primary/40",
                )}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: p.gradient }}
                >
                  {p.initial}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground">
                    {value.toLocaleString("pt-BR")} milhas
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mapa */}
      <section className="mt-4">
        <h2 className="px-1 text-sm font-semibold text-foreground">Rota</h2>
        <ol className="relative mt-3 space-y-3">
          {/* trilha */}
          <span
            aria-hidden
            className="absolute left-[26px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
          />
          {JOURNEY_STOPS.map((stop) => {
            const status = stopStatus(stop, journey);
            const meta = KIND_META[stop.kind];
            const Icon = status === "locked" ? Lock : status === "opened" ? Check : meta.icon;
            const isHere =
              status !== "locked" &&
              (upcoming ? stop.at <= journey.xp && (JOURNEY_STOPS.find((s) => s.at > journey.xp)?.at ?? Infinity) > stop.at : true) &&
              stop.at === Math.max(...JOURNEY_STOPS.filter((s) => s.at <= journey.xp).map((s) => s.at));
            const localPct =
              status === "locked"
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      ((journey.xp -
                        (JOURNEY_STOPS.filter((s) => s.at <= journey.xp).slice(-1)[0]?.at ?? 0)) /
                        Math.max(
                          1,
                          stop.at -
                            (JOURNEY_STOPS.filter((s) => s.at <= journey.xp).slice(-1)[0]?.at ?? 0),
                        )) *
                        100,
                    ),
                  )
                : 100;

            return (
              <li key={stop.id} className="relative">
                <button
                  type="button"
                  onClick={() => status !== "locked" && setOpenStop(stop)}
                  disabled={status === "locked"}
                  className={cn(
                    "tap-target flex w-full items-start gap-3 rounded-[22px] border p-3 text-left transition-all duration-200 sm:p-4",
                    status === "locked"
                      ? "cursor-default border-white/[0.06] bg-white/[0.015] opacity-70"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                    isHere && "border-primary/50 shadow-[0_0_0_1px_var(--primary)_inset]",
                  )}
                >
                  <span
                    className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor:
                        status === "locked" ? "rgba(255,255,255,0.1)" : `${meta.color}66`,
                      background:
                        status === "locked"
                          ? "rgba(255,255,255,0.04)"
                          : `color-mix(in oklab, ${meta.color} 22%, transparent)`,
                      color: status === "locked" ? "rgba(255,255,255,0.4)" : meta.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {stop.title}
                      </span>
                      {isHere && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          <Anchor className="h-3 w-3" /> vocês estão aqui
                        </span>
                      )}
                      {status === "available" && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                          abrir
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {meta.label} · {stop.at.toLocaleString("pt-BR")} milhas ·{" "}
                      {stop.reward} ✦
                    </span>
                    {status === "locked" && (
                      <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <span
                          className="block h-full rounded-full bg-white/25"
                          style={{ width: `${localPct}%` }}
                        />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {openStop && (
        <StopDialog stop={openStop} onClose={() => setOpenStop(null)} />
      )}
    </div>
  );
}

function StopDialog({ stop, onClose }: { stop: JourneyStop; onClose: () => void }) {
  const journey = useJourney();
  const status = stopStatus(stop, journey);
  const meta = KIND_META[stop.kind];
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    await claimJourneyStop(stop.id);
    setClaiming(false);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={stop.title}
    >
      <div
        className="glass-panel max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] p-5 sm:rounded-[28px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            background: `color-mix(in oklab, ${meta.color} 18%, transparent)`,
            color: meta.color,
          }}
        >
          <meta.icon className="h-3.5 w-3.5" /> {meta.label}
        </div>
        <h3 className="mt-3 text-xl font-semibold text-foreground">{stop.title}</h3>

        <blockquote className="mt-4 rounded-2xl border-l-2 border-primary/60 bg-white/[0.04] p-4 text-sm italic leading-relaxed text-foreground/90">
          “{stop.dialogue}”
        </blockquote>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            O que essa parada ensina
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{stop.insight}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          {status === "available" ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="tap-target flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {claiming ? "Abrindo…" : `Abrir parada · +${stop.reward} ✦`}
            </button>
          ) : (
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
              Parada já aberta
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="tap-target rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-white/[0.05]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
