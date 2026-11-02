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
  ArrowUpRight,
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
        content: "Missões diárias de inglês no airi: revise cartas, treine e ganhe Arlys ✦ e LP.",
      },
      { property: "og:title", content: "Desafios diários · airi" },
      {
        property: "og:description",
        content: "Três missões por dia para treinar inglês e ganhar recompensas.",
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
  defeat_enemies: "Arena",
  writing: "Escrever",
  study_session: "Estudar",
  duel: "Duelar",
};

function DailyChallengesPage() {
  const { missions, loaded, chestClaimed } = useDailyMissions();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ title: string; reward: number; lp: number } | null>(null);

  useEffect(() => {
    const unsub = onMissionClaimed((m) => {
      setFlash(m);
      setTimeout(() => setFlash(null), 2200);
    });
    return () => { unsub(); };
  }, []);

  const totals = dailyMissionsTotals();
  const allClaimed = missions.length > 0 && missions.every((m) => m.claimed);
  const percent = Math.round((totals.done / Math.max(1, totals.count)) * 100);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-xl px-5 pb-28 pt-7 sm:px-6 sm:pt-9">
      <header className="mb-7">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8f36a]">
            <Sparkles className="mr-1.5 inline h-3 w-3" /> Desafios
          </p>
          <span className="text-[11px] capitalize text-muted-foreground">{dateLabel}</span>
        </div>
        <h1 className="mt-2 text-[27px] font-semibold tracking-tight text-foreground sm:text-3xl">
          Um passo de cada vez.
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Complete suas missões e avance nos estudos.
        </p>
      </header>

      <section className="mb-7 flex items-center gap-4 border-y border-white/[0.08] py-4">
        <div
          className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full p-[5px]"
          style={{
            background: `conic-gradient(#c8f36a ${percent}%, rgba(255,255,255,.09) 0)`,
          }}
          aria-label={`${percent}% das missões coletadas`}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-[#151515]">
            <span className="text-[15px] font-semibold tabular-nums text-white">{percent}%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[14px] font-semibold text-foreground">Seu progresso hoje</p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {totals.done}/{totals.count} concluídas
            </p>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.09]">
            <div
              className="h-full rounded-full bg-[#c8f36a] transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-[#c8f36a]">{totals.earned} ✦</span>
            {" "}de {totals.total} ✦ resgatáveis hoje
          </p>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-foreground">Missões de hoje</h2>
          <span className="text-[10px] text-muted-foreground">Renovam à meia-noite</span>
        </div>
        <ul className="divide-y divide-white/[0.07]">
          {!loaded &&
            [0, 1, 2].map((i) => (
              <li key={i} className="h-[82px] animate-pulse border-b border-white/[0.05]" />
            ))}
          {loaded &&
            missions.map((mission) => (
              <MissionRow
                key={mission.id}
                mission={mission}
                busy={busy === mission.id}
                onClaim={async () => {
                  setBusy(mission.id);
                  await claimMission(mission.id);
                  setBusy(null);
                }}
              />
            ))}
        </ul>
      </section>

      {loaded && (
        <section className="mt-7 border-t border-white/[0.08] pt-5">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                chestClaimed ? "bg-[#c8f36a]/15 text-[#c8f36a]" : "bg-white/[0.06] text-[#c8f36a]"
              }`}
            >
              {chestClaimed ? <Check className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">Recompensa final</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {chestClaimed
                  ? "Resgatada. Amanhã tem mais."
                  : allClaimed
                    ? `Baú liberado · +${CHEST_REWARD.arlys} ✦ · +${CHEST_REWARD.lp} LP`
                    : `Complete as ${missions.length} missões para liberar o baú.`}
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
                className="rounded-full bg-[#c8f36a] px-3.5 py-2 text-[11px] font-semibold text-[#18200a] transition hover:bg-[#d5fa83] disabled:opacity-60"
              >
                {busy === "chest" ? "..." : "Resgatar"}
              </button>
            )}
          </div>
        </section>
      )}

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-10">
          <div className="animate-fade-in rounded-full border border-[#c8f36a]/20 bg-[#171b10]/95 px-4 py-2 text-[12px] font-medium text-white shadow-lg backdrop-blur">
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
    <li className="py-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            mission.claimed
              ? "bg-[#c8f36a]/15 text-[#c8f36a]"
              : "bg-white/[0.045] text-white/65"
          }`}
        >
          {mission.claimed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={1.9} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[13px] font-semibold text-foreground">{mission.title}</p>
            <span className="text-[10px] text-[#c8f36a]">+{mission.reward} ✦</span>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {mission.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 max-w-[150px] flex-1 overflow-hidden rounded-full bg-white/[0.09]">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  mission.claimed ? "bg-[#c8f36a]" : "bg-white/55"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {mission.progress}/{mission.target}
            </span>
            <span className="text-[10px] text-muted-foreground/65">· +{mission.lp} LP</span>
          </div>
        </div>

        {mission.claimed ? (
          <span className="shrink-0 text-[10px] font-medium text-[#c8f36a]">Feito</span>
        ) : ready ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={busy}
            className="shrink-0 rounded-full bg-[#c8f36a] px-3 py-1.5 text-[10.5px] font-semibold text-[#18200a] transition hover:bg-[#d5fa83] disabled:opacity-60"
          >
            {busy ? "..." : "Coletar"}
          </button>
        ) : (
          <Link
            to={ROUTES[mission.type]}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[10.5px] font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            {CTA[mission.type]} <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </li>
  );
}
