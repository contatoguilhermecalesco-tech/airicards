import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PROFILES, getCurrentProfile } from "@/lib/profile";
import { TIER_COLORS, tierLabel, readRankForProfile, subscribeAllRanks, type RankState } from "@/lib/rank-store";
import { RankEmblem } from "@/components/RankBadge";

export function ProfilesRankOverview() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    const unsub = subscribeAllRanks(() => setTick((t) => t + 1));
    return () => {
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, []);

  const active = getCurrentProfile();
  const entries: {
    profileId: string;
    name: string;
    gradient: string;
    isActive: boolean;
    rank: RankState | null;
  }[] = PROFILES.map((p) => ({
    profileId: p.id,
    name: p.name,
    gradient: p.gradient,
    isActive: active?.id === p.id,
    rank: readRankForProfile(p.id),
  }));

  entries.sort((a, b) => {
    const la = a.rank?.totalEarned ?? -1;
    const lb = b.rank?.totalEarned ?? -1;
    return lb - la;
  });

  void tick;

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Elo dos usuários
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ranking atual de cada perfil cadastrado neste dispositivo.
          </p>
        </div>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Atualizar
        </button>
      </div>

      <ol className="space-y-2">
        {entries.map((e, idx) => {
          const rank = e.rank;
          const colors = TIER_COLORS[rank?.tier ?? "iron"];
          const position = rank ? idx + 1 : "—";
          return (
            <li
              key={e.profileId}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
            >
              <span
                aria-hidden
                className="w-6 text-center text-xs font-semibold tabular-nums text-muted-foreground"
              >
                {position}
              </span>
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                style={{ backgroundImage: e.gradient }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  {e.isActive && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Você
                    </span>
                  )}
                </div>
                {rank ? (
                  <p
                    className="mt-0.5 text-xs tabular-nums"
                    style={{ color: colors.text }}
                  >
                    {tierLabel(rank)} · {rank.lp} LP
                    <span className="text-muted-foreground">
                      {" · "}+{rank.totalEarned} / −{rank.totalLost}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sem histórico neste dispositivo
                  </p>
                )}
              </div>
              {rank ? (
                <RankEmblem tier={rank.tier} division={rank.division} size={40} />
              ) : (
                <span className="h-10 w-10 rounded-full border border-dashed border-white/10" />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        O rank é salvo localmente por perfil. Perfis que ainda não estudaram
        neste navegador aparecem sem histórico.
      </p>
    </section>
  );
}
