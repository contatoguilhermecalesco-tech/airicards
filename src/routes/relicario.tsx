import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowLeft, History, Coins, Wand2, Crown } from "lucide-react";
import {
  useHunt,
  openRelic,
  canForge,
  RELIC_META,
  LUMINHOS_PER_RELIC,
  LUMINHOS_PER_PRISM,
  type RelicKind,
  type RelicReward,
} from "@/lib/relic-hunt";
import { LuminhoSprite } from "@/components/hunt/LuminhoDropToast";
import { RelicOpenOverlay } from "@/components/hunt/RelicOpenOverlay";

export const Route = createFileRoute("/relicario")({
  head: () => ({
    meta: [
      { title: "Relicário — Caça aos Luminhos | airi" },
      {
        name: "description",
        content:
          "Colete Luminhos revisando cartas no airi e forje Relicários com recompensas aleatórias: Arlys, power-ups e cosméticos de bundle.",
      },
      { property: "og:title", content: "Relicário — Caça aos Luminhos | airi" },
      {
        property: "og:description",
        content:
          "Espíritos de luz aparecem nas suas revisões. Junte-os e abra relicários por recompensas aleatórias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelicarioPage,
});

function RelicarioPage() {
  const hunt = useHunt();
  const [opening, setOpening] = useState<RelicKind | null>(null);
  const [reward, setReward] = useState<RelicReward | null>(null);

  async function forge(kind: RelicKind) {
    if (!canForge(kind) || opening) return;
    setReward(null);
    setOpening(kind);
    const r = await openRelic(kind);
    if (!r) {
      setOpening(null);
      return;
    }
    setReward(r);
  }

  const nextRelic = LUMINHOS_PER_RELIC - (hunt.luminhos % LUMINHOS_PER_RELIC);
  const pct = ((hunt.luminhos % LUMINHOS_PER_RELIC) / LUMINHOS_PER_RELIC) * 100;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:pt-6">
      <Link
        to="/"
        className="tap-target mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgba(167,139,250,0.22), transparent 60%), linear-gradient(160deg, rgba(24,14,40,0.9), rgba(12,7,22,0.95))",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 80% 10%, rgba(216,180,254,0.10) 0deg 3deg, transparent 3deg 14deg)",
            maskImage: "radial-gradient(closest-side at 80% 10%, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(closest-side at 80% 10%, black, transparent 70%)",
          }}
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">
            Modo colecionável
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Caça aos Luminhos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Espíritos de luz aparecem sozinhos quando você acerta cartas — sem
            meta, sem prazo. Junte {LUMINHOS_PER_RELIC} Luminhos para forjar um
            Relicário Selado, ou {LUMINHOS_PER_PRISM} prismáticos para o
            Relicário Prismático, que quase sempre solta cosmético.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatBox
              label="Luminhos"
              value={hunt.luminhos}
              accent="#d8b4fe"
              sprite="comum"
            />
            <StatBox
              label="Prismáticos"
              value={hunt.prismas}
              accent="#7dd3fc"
              sprite="prisma"
            />
            <StatBox label="Relicários abertos" value={hunt.opened} accent="#fbbf24" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Próximo relicário</span>
              <span className="font-semibold text-foreground">
                faltam {nextRelic}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #a78bfa, #e9d5ff)",
                  boxShadow: "0 0 14px rgba(167,139,250,0.6)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Relicários */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["selado", "prismatico"] as RelicKind[]).map((kind) => {
          const meta = RELIC_META[kind];
          const ready = canForge(kind);
          const have = kind === "selado" ? hunt.luminhos : hunt.prismas;
          const need = kind === "selado" ? LUMINHOS_PER_RELIC : LUMINHOS_PER_PRISM;
          return (
            <div
              key={kind}
              className="relative overflow-hidden rounded-3xl border p-5"
              style={{
                borderColor: ready ? `${meta.accent}55` : "rgba(255,255,255,0.08)",
                background: "linear-gradient(155deg, rgba(22,13,36,0.85), rgba(12,7,22,0.9))",
                boxShadow: ready ? `0 0 48px -22px ${meta.glow}` : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold tracking-tight" style={{ color: meta.accent }}>
                    {meta.name}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {meta.tagline}
                  </p>
                </div>
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${ready ? "relic-idle" : "opacity-45"}`}
                  style={{
                    background: `linear-gradient(140deg, ${meta.accent}33, rgba(255,255,255,0.05))`,
                    border: `1px solid ${meta.accent}44`,
                  }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: meta.accent }} />
                </span>
              </div>

              <p className="mt-4 text-[12px] text-muted-foreground">
                {have}/{need} — {meta.cost}
              </p>

              <button
                type="button"
                disabled={!ready || opening !== null}
                onClick={() => void forge(kind)}
                className="tap-target mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: ready
                    ? `linear-gradient(120deg, ${meta.accent}, ${meta.accent}aa)`
                    : "rgba(255,255,255,0.06)",
                  color: ready ? "#170c26" : undefined,
                }}
              >
                {ready ? "Abrir relicário" : "Luminhos insuficientes"}
              </button>
            </div>
          );
        })}
      </section>

      {/* Histórico */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-surface/50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <History className="h-4 w-4 text-muted-foreground" /> Últimas aberturas
        </h2>
        {hunt.log.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Nada por aqui ainda. Vá revisar e deixe os Luminhos aparecerem.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/6">
            {hunt.log.map((e) => {
              const Icon = e.tone === "arlys" ? Coins : e.tone === "powerup" ? Wand2 : Crown;
              const accent = RELIC_META[e.kind].accent;
              return (
                <li key={e.at} className="flex items-center gap-3 py-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${accent}1f`, border: `1px solid ${accent}33` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{e.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {e.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(e.at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {opening && (
        <RelicOpenOverlay
          kind={opening}
          reward={reward}
          onClose={() => {
            setOpening(null);
            setReward(null);
          }}
        />
      )}
    </main>
  );
}

function StatBox({
  label,
  value,
  accent,
  sprite,
}: {
  label: string;
  value: number;
  accent: string;
  sprite?: "comum" | "prisma";
}) {
  return (
    <div
      className="rounded-2xl border p-3"
      style={{ borderColor: `${accent}2e`, background: "rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-2">
        {sprite ? (
          <LuminhoSprite accent={accent} prism={sprite === "prisma"} size={26} />
        ) : (
          <Sparkles className="h-5 w-5" style={{ color: accent }} />
        )}
        <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
          {value}
        </span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
