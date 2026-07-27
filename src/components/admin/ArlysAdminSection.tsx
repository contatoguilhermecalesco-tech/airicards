import { useEffect, useState } from "react";
import { Coins, Minus, Plus } from "lucide-react";
import { PROFILES } from "@/lib/profile";
import { ArlysIcon } from "@/components/StatChip";
import {
  adminFetchWallets,
  adminGrantArlys,
  adminSetArlys,
  type WalletSummary,
} from "@/lib/admin-actions";
import { loadWallet, currentProfileForWallet } from "@/lib/wallet-store";

const QUICK_GRANTS = [50, 100, 250, 500, 1000];

export function ArlysAdminSection() {
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<{ id: string; kind: "grant" | "set" | "remove"; amount: number } | null>(null);

  async function load() {
    const rows = await adminFetchWallets();
    setWallets(rows);
  }
  useEffect(() => {
    void load();
  }, []);

  async function refreshCurrent() {
    const cur = currentProfileForWallet();
    if (cur) await loadWallet(cur, true);
  }

  async function handleGrant(profileId: string, amount: number) {
    if (!amount) return;
    setBusy(profileId);
    try {
      await adminGrantArlys(profileId, amount);
      await load();
      await refreshCurrent();
      setFlash({ id: profileId, kind: amount > 0 ? "grant" : "remove", amount: Math.abs(amount) });
      setTimeout(() => setFlash(null), 1600);
    } finally {
      setBusy(null);
    }
  }

  async function handleSet(profileId: string) {
    const raw = customAmount[profileId];
    if (!raw) return;
    const n = Math.max(0, Math.floor(Number(raw)));
    if (!Number.isFinite(n)) return;
    setBusy(profileId);
    try {
      await adminSetArlys(profileId, n);
      await load();
      await refreshCurrent();
      setCustomAmount((m) => ({ ...m, [profileId]: "" }));
      setFlash({ id: profileId, kind: "set", amount: n });
      setTimeout(() => setFlash(null), 1600);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <ArlysIcon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Arlys ✦</h2>
          <p className="text-xs text-muted-foreground">
            Conceder, remover ou definir o saldo de cada perfil
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {wallets.map((w) => {
          const profile = PROFILES.find((p) => p.id === w.profileId);
          const isFlashing = flash?.id === w.profileId;
          return (
            <li
              key={w.profileId}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ backgroundImage: profile?.gradient ?? "linear-gradient(135deg, #333, #111)" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{profile?.name ?? w.profileId}</p>
                    <p className="flex items-center gap-1 text-xs tabular-nums text-amber-300">
                      <Coins className="h-3 w-3" strokeWidth={2.5} />
                      {w.crystals.toLocaleString("pt-BR")} Arlys
                    </p>
                  </div>
                </div>
                {isFlashing && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      flash!.kind === "remove"
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {flash!.kind === "set"
                      ? `= ${flash!.amount}`
                      : flash!.kind === "remove"
                        ? `−${flash!.amount}`
                        : `+${flash!.amount}`}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK_GRANTS.map((v) => (
                  <button
                    key={v}
                    disabled={busy === w.profileId}
                    onClick={() => void handleGrant(w.profileId, v)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.75} />
                    {v}
                  </button>
                ))}
                <button
                  disabled={busy === w.profileId || w.crystals <= 0}
                  onClick={() => void handleGrant(w.profileId, -Math.min(100, w.crystals))}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Minus className="h-3 w-3" strokeWidth={2.75} />
                  100
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Definir saldo exato"
                  value={customAmount[w.profileId] ?? ""}
                  onChange={(e) =>
                    setCustomAmount((m) => ({ ...m, [w.profileId]: e.target.value }))
                  }
                  className="flex-1 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-sm tabular-nums outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
                />
                <button
                  disabled={busy === w.profileId || !customAmount[w.profileId]}
                  onClick={() => void handleSet(w.profileId)}
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
