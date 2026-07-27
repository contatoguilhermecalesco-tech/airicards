import { useEffect, useState } from "react";
import { RefreshCw, Swords, Trophy, X as XIcon } from "lucide-react";
import { PROFILES } from "@/lib/profile";
import {
  adminFetchActiveDuels,
  adminForceEndDuel,
  adminCancelDuel,
  type AdminDuelRow,
} from "@/lib/admin-actions";

export function DuelsAdminSection() {
  const [duels, setDuels] = useState<AdminDuelRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await adminFetchActiveDuels();
      setDuels(rows);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function endWith(duelId: string, winner: string | null, forfeit: string | null) {
    setBusy(duelId);
    try {
      await adminForceEndDuel(duelId, winner, forfeit);
      await load();
    } finally {
      setBusy(null);
    }
  }
  async function cancel(duelId: string) {
    setBusy(duelId);
    try {
      await adminCancelDuel(duelId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  function nameOf(id: string) {
    return PROFILES.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
            <Swords className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Duelos ativos</h2>
            <p className="text-xs text-muted-foreground">Encerrar manualmente ou cancelar</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : duels.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum duelo ativo no momento.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {duels.map((d) => {
            const opp = d.createdBy === "guilherme" ? "arlayne" : "guilherme";
            const expires = new Date(d.expiresAt);
            const msLeft = expires.getTime() - Date.now();
            const hoursLeft = Math.round(msLeft / 3_600_000);
            const overdue = msLeft <= 0;
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.deckName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.weekKey} · criado por {nameOf(d.createdBy)}
                    </p>
                    <p
                      className={`mt-1 text-[11px] font-medium tabular-nums ${
                        overdue ? "text-rose-300" : "text-muted-foreground"
                      }`}
                    >
                      {overdue
                        ? `⌛ expirou há ${Math.abs(hoursLeft)}h`
                        : `expira em ${hoursLeft}h`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    ativo
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, d.createdBy, opp)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <Trophy className="h-3 w-3" strokeWidth={2.5} />
                    {nameOf(d.createdBy)} vence (WO)
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, opp, d.createdBy)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <Trophy className="h-3 w-3" strokeWidth={2.5} />
                    {nameOf(opp)} vence (WO)
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void endWith(d.id, null, null)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/80 transition hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    Empate
                  </button>
                  <button
                    disabled={busy === d.id}
                    onClick={() => void cancel(d.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XIcon className="h-3 w-3" strokeWidth={2.75} />
                    Cancelar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
