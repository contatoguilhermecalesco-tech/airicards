import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { PROFILES, getCurrentProfile } from "@/lib/profile";
import {
  adminFetchStreaksFn,
  adminSetStreakFn,
  type StreakRow,
} from "@/lib/admin.functions";

export function StreakAdminSection() {
  const [rows, setRows] = useState<StreakRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<{ id: string; value: number } | null>(null);

  async function load() {
    const data = await adminFetchStreaksFn();
    setRows(data);
  }
  useEffect(() => {
    void load();
  }, []);

  const merged: StreakRow[] = PROFILES.map((p) => {
    const found = rows.find((r) => r.profile_id === p.id);
    return (
      found ?? {
        profile_id: p.id,
        current: 0,
        longest: 0,
        lastDay: "",
        startedOn: null,
      }
    );
  });

  async function commit(profileId: string, current: number) {
    if (!Number.isFinite(current) || current < 0) return;
    const cur = Math.max(0, Math.floor(current));
    setBusy(profileId);
    try {
      const row = await adminSetStreakFn({
        data: { profileId, current: cur },
      });
      setRows((prev) => {
        const next = prev.filter((r) => r.profile_id !== profileId);
        next.push(row);
        return next;
      });
      setDraft((m) => ({ ...m, [profileId]: "" }));
      setFlash({ id: profileId, value: cur });
      setTimeout(() => setFlash(null), 1600);
      const me = getCurrentProfile();
      if (me?.id === profileId) {
        setTimeout(() => window.location.reload(), 900);
      }
    } finally {
      setBusy(null);
    }
  }

  const QUICK: number[] = [0, 1, 7, 30, 100];

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
          <Flame className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Streak</h2>
          <p className="text-xs text-muted-foreground">
            Ajuste a sequência de dias de cada perfil. O maior valor (longest) sobe se o novo current for maior.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {merged.map((r) => {
          const profile = PROFILES.find((p) => p.id === r.profile_id);
          const isFlashing = flash?.id === r.profile_id;
          const key = r.profile_id;
          return (
            <li
              key={key}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{
                      backgroundImage:
                        profile?.gradient ??
                        "linear-gradient(135deg, #333, #111)",
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {profile?.name ?? r.profile_id}
                    </p>
                    <p className="flex items-center gap-1 text-xs tabular-nums text-orange-300">
                      <Flame className="h-3 w-3" strokeWidth={2.5} />
                      {r.current} dias · recorde {r.longest}
                      {r.lastDay ? ` · último ${r.lastDay}` : ""}
                    </p>
                  </div>
                </div>
                {isFlashing && (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    = {flash!.value}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK.map((v) => (
                  <button
                    key={v}
                    disabled={busy === key}
                    onClick={() => void commit(key, v)}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    {v === 0 ? "Zerar" : `${v}d`}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Definir sequência (dias)"
                  value={draft[key] ?? ""}
                  onChange={(e) =>
                    setDraft((m) => ({ ...m, [key]: e.target.value }))
                  }
                  className="flex-1 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-sm tabular-nums outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
                />
                <button
                  disabled={busy === key || !draft[key]}
                  onClick={() => void commit(key, Number(draft[key] ?? 0))}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
                >
                  Definir
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
