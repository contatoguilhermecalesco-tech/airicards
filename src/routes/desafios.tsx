import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Gift,
  PenLine,
  Repeat2,
  Sparkles,
  Swords,
  Target,
} from "lucide-react";
import {
  CHEST_REWARD,
  claimDailyChest,
  claimMission,
  dailyMissionsTotals,
  onMissionClaimed,
  useDailyMissions,
  type DailyMission,
  type MissionType,
} from "@/lib/daily-missions";

export const Route = createFileRoute("/desafios")({
  component: DailyChallengesPage,
  head: () => ({
    meta: [
      { title: "Desafios diários · airi" },
      {
        name: "description",
        content:
          "Missões diárias de inglês no airi: revise cartas, derrote inimigas e treine escrita para ganhar Arlys ✦ e LP.",
      },
      { property: "og:title", content: "Desafios diários · airi" },
      {
        property: "og:description",
        content:
          "Três missões por dia para treinar inglês e ganhar Arlys ✦ e LP, mais o Baú do Dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ICONS: Record<MissionType, typeof Target> = {
  review_n: Repeat2,
  correct_n: Target,
  defeat_enemies: Swords,
  writing: PenLine,
  study_session: BookOpen,
  duel: Swords,
};

const ROUTES: Record<MissionType, string> = {
  review_n: "/review",
  correct_n: "/review",
  defeat_enemies: "/enemies",
  writing: "/study/writing",
  study_session: "/study",
  duel: "/duel",
};

const CTA: Record<MissionType, string> = {
  review_n: "Revisar",
  correct_n: "Revisar",
  defeat_enemies: "Ir à Arena",
  writing: "Escrever",
  study_session: "Estudar",
  duel: "Duelar",
};

function DailyChallengesPage() {
  const { missions, loaded, chestClaimed } = useDailyMissions();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ title: string; reward: number; lp: number } | null>(
    null,
  );

  useEffect(() => {
    const unsub = onMissionClaimed((m) => {
      setFlash(m);
      setTimeout(() => setFlash(null), 2200);
    });
    return () => {
      unsub();
    };
  }, []);

  const totals = dailyMissionsTotals();
  const allClaimed = missions.length > 0 && missions.every((m) => m.claimed);
  const percent = Math.round((totals.earned / Math.max(1, totals.total)) * 100);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8 sm:pt-10">
      <header className="mb-6">
        <p className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/50">
          <Sparkles className="h-3 w-3" strokeWidth={2.5} />
          Missões de hoje
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">
          Desafios diários
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Três missões novas todo dia. Treine inglês, colete{" "}
          <span className="text-white/80">Arlys ✦</span> e ganhe{" "}
          <span className="text-white/80">LP</span> no seu rank.
        </p>
      </header>

      {/* Resumo */}
      <div className="glass-panel relative overflow-hidden rounded-3xl border p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/[0.10] blur-3xl"
        />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Coletado hoje
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {totals.earned} <span className="text-base text-white/60">✦</span>
            </p>
            <p className="mt-0.5 text-[12px] text-white/45">
              de {totals.total} ✦ disponíveis
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70">
            {totals.done}/{totals.count} concluídas
          </span>
        </div>
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400/80 to-violet-300/80 transition-[width] duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Missões */}
      <ul className="mt-4 space-y-3">
        {!loaded &&
          [0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-[86px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            />
          ))}

        {loaded &&
          missions.map((m) => (
            <MissionRow
              key={m.id}
              mission={m}
              busy={busy === m.id}
              onClaim={async () => {
                setBusy(m.id);
                await claimMission(m.id);
                setBusy(null);
              }}
            />
          ))}
      </ul>

      {/* Baú do dia */}
      {loaded && (
        <section className="mt-5">
          <div
            className={`relative overflow-hidden rounded-3xl border p-5 transition ${
              chestClaimed
                ? "border-emerald-400/15 bg-emerald-400/[0.04]"
                : allClaimed
                  ? "border-violet-300/25 bg-white/[0.04]"
                  : "border-white/[0.06] bg-white/[0.015]"
            }`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${
                  chestClaimed
                    ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/25"
                    : allClaimed
                      ? "bg-violet-400/15 text-violet-200 ring-violet-300/25"
                      : "bg-white/[0.04] text-white/40 ring-white/[0.07]"
                }`}
              >
                {chestClaimed ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <Gift className="h-5 w-5" strokeWidth={2.25} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">Baú do dia</p>
                <p className="mt-0.5 text-[13px] text-white/55">
                  {chestClaimed
                    ? "Você já abriu o baú de hoje. Volte amanhã."
                    : allClaimed
                      ? `Pronto para abrir: +${CHEST_REWARD.arlys} ✦ e +${CHEST_REWARD.lp} LP.`
                      : `Conclua as ${missions.length} missões para liberar +${CHEST_REWARD.arlys} ✦ e +${CHEST_REWARD.lp} LP.`}
                </p>
              </div>
              {!chestClaimed && allClaimed && (
                <button
                  type="button"
                  onClick={async () => {
                    setBusy("chest");
                    await claimDailyChest();
                    setBusy(null);
                  }}
                  disabled={busy === "chest"}
                  className="shrink-0 rounded-full bg-white/95 px-4 py-2 text-[12px] font-semibold text-black transition hover:bg-white disabled:opacity-60"
                >
                  {busy === "chest" ? "..." : "Abrir"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-[12px] text-white/35">
        As missões renovam à meia-noite. Progresso não coletado não acumula.
      </p>

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-10">
          <div className="animate-fade-in rounded-full border border-white/15 bg-black/80 px-4 py-2 text-[12.5px] font-medium text-white/90 shadow-lg backdrop-blur">
            {flash.title} · +{flash.reward} ✦ · +{flash.lp} LP
          </div>
        </div>
      )}
    </main>
  );
}

function MissionRow({
  mission,
  busy,
  onClaim,
}: {
  mission: DailyMission;
  busy: boolean;
  onClaim: () => void;
}) {
  const Icon = ICONS[mission.type];
  const ready = mission.progress >= mission.target && !mission.claimed;
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border p-4 transition ${
        mission.claimed
          ? "border-emerald-400/12 bg-emerald-400/[0.03]"
          : ready
            ? "border-violet-300/25 bg-white/[0.045]"
            : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${
            mission.claimed
              ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/25"
              : "bg-white/[0.05] text-violet-200 ring-white/[0.08]"
          }`}
        >
          {mission.claimed ? (
            <Check className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white/90">
              {mission.title}
            </span>
            <span className="shrink-0 text-[11px] text-white/60">
              +{mission.reward} ✦ · +{mission.lp} LP
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-white/55">
            {mission.description}
          </p>
          {!mission.claimed && (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-violet-300/80 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-white/45">
                {mission.progress}/{mission.target}
              </span>
            </div>
          )}
        </div>

        {mission.claimed ? null : ready ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={busy}
            className="shrink-0 rounded-full bg-white/95 px-3.5 py-1.5 text-[11.5px] font-semibold text-black transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "..." : "Coletar"}
          </button>
        ) : (
          <Link
            to={ROUTES[mission.type]}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11.5px] font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            {CTA[mission.type]}
          </Link>
        )}
      </div>
    </li>
  );
}
