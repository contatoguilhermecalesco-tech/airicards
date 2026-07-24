// Timeline vertical de atividade — reviews/rank/streak/duelos/presentes.
import { useMemo } from "react";
import {
  Flame,
  Gift,
  Sparkles,
  Swords,
  Trophy,
  Target,
} from "lucide-react";
import { useProfileTimeline, type ActivityEvent } from "@/lib/social-store";

type FeedRow = {
  id: string;
  when: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: string;
  title: string;
  detail?: string;
};

function relTime(ts: number): string {
  const d = Date.now() - ts;
  const s = Math.max(1, Math.round(d / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const day = Math.round(h / 24);
  if (day < 7) return `há ${day}d`;
  const w = Math.round(day / 7);
  if (w < 5) return `há ${w}sem`;
  const mo = Math.round(day / 30);
  return `há ${mo}mês`;
}

function fromEvent(e: ActivityEvent): FeedRow {
  const p = e.payload as Record<string, unknown>;
  const when = new Date(e.createdAt).getTime();
  switch (e.kind) {
    case "rank_up":
      return {
        id: `evt:${e.id}`,
        when,
        icon: Trophy,
        tone: "#fbbf24",
        title: "Subiu de rank",
        detail: p.kind === "tier" ? "Novo tier conquistado ✦" : "Promovido de divisão",
      };
    case "streak_milestone":
      return {
        id: `evt:${e.id}`,
        when,
        icon: Flame,
        tone: "#f87171",
        title: `Streak de ${(p.days as number) ?? "?"} dias`,
        detail: p.lpGained ? `+${p.lpGained as number} LP` : undefined,
      };
    case "duel_won":
      return {
        id: `evt:${e.id}`,
        when,
        icon: Swords,
        tone: "#a78bfa",
        title: "Venceu um duelo",
        detail: typeof p.score === "number" ? `${p.score} pontos` : undefined,
      };
    case "exam_done":
      return {
        id: `evt:${e.id}`,
        when,
        icon: Target,
        tone: "#38bdf8",
        title: "Concluiu prova mensal",
        detail: typeof p.score === "number" ? `Nota ${p.score}` : undefined,
      };
    case "enemy_defeated":
      return {
        id: `evt:${e.id}`,
        when,
        icon: Sparkles,
        tone: "#34d399",
        title: "Carta inimiga derrotada",
        detail: typeof p.card === "string" ? String(p.card) : undefined,
      };
  }
}

export function ProfileActivityFeed({
  profileId,
  limit = 12,
}: {
  profileId: string;
  limit?: number;
}) {
  const { events, duels, gifts } = useProfileTimeline(profileId);

  const rows = useMemo<FeedRow[]>(() => {
    const list: FeedRow[] = [];

    for (const e of events) list.push(fromEvent(e));

    for (const d of duels) {
      const when = new Date(d.completedAt ?? d.createdAt).getTime();
      const won = d.winner === profileId;
      const forfeit = d.forfeitBy === profileId;
      list.push({
        id: `duel:${d.id}`,
        when,
        icon: Swords,
        tone: won ? "#a78bfa" : forfeit ? "#f87171" : "#94a3b8",
        title: won
          ? "Venceu um duelo"
          : forfeit
            ? "Duelo perdido por W.O."
            : d.winner
              ? "Duelo perdido"
              : "Duelo empatado",
        detail: d.deckName ? `Deck: ${d.deckName}` : undefined,
      });
    }

    for (const g of gifts) {
      const when = new Date(g.createdAt).getTime();
      const isSender = g.fromProfile === profileId;
      list.push({
        id: `gift:${g.id}`,
        when,
        icon: Gift,
        tone: "#f472b6",
        title: isSender ? "Enviou uma carta de presente" : "Recebeu uma carta",
        detail: g.front ? `"${g.front.slice(0, 40)}"` : undefined,
      });
    }

    list.sort((a, b) => b.when - a.when);
    return list.slice(0, limit);
  }, [events, duels, gifts, profileId, limit]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-[12px] text-white/50">
          Nenhuma atividade recente. Estude, duele ou envie uma carta para preencher sua timeline.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 pl-6">
      <span
        aria-hidden
        className="absolute bottom-2 left-[11px] top-2 w-px"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))",
        }}
      />
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <li key={r.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[19px] top-2.5 grid h-6 w-6 place-items-center rounded-full"
              style={{
                background: "#1e1f22",
                color: r.tone,
                boxShadow: `0 0 0 3px ${r.tone}22, 0 0 12px ${r.tone}44`,
              }}
            >
              <Icon className="h-3 w-3" strokeWidth={2.75} />
            </span>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 transition hover:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-white">{r.title}</p>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {relTime(r.when)}
                </span>
              </div>
              {r.detail && (
                <p className="mt-0.5 truncate text-[12px] text-white/55">{r.detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
