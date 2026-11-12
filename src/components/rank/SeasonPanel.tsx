import { useEffect, useState } from "react";
import { CalendarClock, Gift, ShieldCheck } from "lucide-react";
import { useRank, TIER_LABEL, DIVISION_ROMAN } from "@/lib/rank-store";
import { seasonReward, seasonFor, seasonLabel, PLACEMENT_EVENTS } from "@/lib/season-engine";

export function SeasonPanel() {
  const rank = useRank();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;
  const season = seasonFor(now);
  const days = Math.max(0, Math.ceil((season.end.getTime() - now.getTime()) / 86400000));
  const left = rank.placementsLeft ?? 0;
  const history = rank.seasonHistory ?? [];


  return (
    <section className="border-b border-border/60 bg-card/40 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Temporada atual</p>
            <p className="text-sm font-semibold text-foreground">{seasonLabel(season.id)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Reset de elo em <span className="font-semibold text-foreground">{days} {days === 1 ? "dia" : "dias"}</span></p>
      </div>

      {left > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Calibração: {PLACEMENT_EVENTS - left}/{PLACEMENT_EVENTS} acertos · sem perda de LP e +50% de LP
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Gift className="h-4 w-4 text-primary" />
        Recompensa prevista pelo seu pico: <span className="font-semibold text-foreground">{seasonReward(rank.peakTier)} ✦</span> · liberada só no fim do split
      </div>

      {history.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {history.map((h, hIndex) => (
            <span key={`${h.season}-${hIndex}`} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              {h.season.replace("-", " ")} · {TIER_LABEL[h.tier]}{h.division ? ` ${DIVISION_ROMAN[h.division]}` : ""}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
