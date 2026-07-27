import { RefreshCw, RotateCcw } from "lucide-react";
import type { ProfileSessionInfo } from "@/lib/flashcards-store";

export function SessionsPanel({
  merged,
  loading,
  load,
  busyId,
  onAskReset,
  nameFor,
  gradientFor,
}: {
  merged: ProfileSessionInfo[];
  loading: boolean;
  load: () => void;
  busyId: string | null;
  onAskReset: (id: string) => void;
  nameFor: (id: string) => string;
  gradientFor: (id: string) => string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-end">
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
      ) : (
        <ul className="space-y-2">
          {merged.map((r) => (
            <li
              key={r.profileId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                  style={{ backgroundImage: gradientFor(r.profileId) }}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{nameFor(r.profileId)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {r.count} sessões
                    {" · "}
                    {r.reviewed} revisadas
                    {r.day ? ` · ${r.day}` : ""}
                  </p>
                </div>
              </div>
              <button
                disabled={busyId === r.profileId}
                onClick={() => onAskReset(r.profileId)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                Zerar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
