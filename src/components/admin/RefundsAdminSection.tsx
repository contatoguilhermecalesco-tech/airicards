import { useEffect, useState } from "react";
import { Undo2, Loader2, RefreshCw, ShoppingBag, Trash2 } from "lucide-react";
import { PROFILES } from "@/lib/profile";
import { ArlysIcon } from "@/components/StatChip";
import {
  adminListPurchasesFn,
  adminRefundPurchaseFn,
  type AdminPurchaseRow,
} from "@/lib/admin-refunds.functions";
import { loadWallet, currentProfileForWallet } from "@/lib/wallet-store";

const KIND_LABEL: Record<string, string> = {
  cosmetic: "Cosmético",
  powerup: "Power-up",
  bundle: "Bundle",
  pack: "Pack",
  deck: "Deck",
};

export function RefundsAdminSection() {
  const [rows, setRows] = useState<AdminPurchaseRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminPurchaseRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    try {
      setRows(await adminListPurchasesFn());
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function handleRefund(row: AdminPurchaseRow, removeItems: boolean) {
    setBusy(row.id);
    try {
      const r = await adminRefundPurchaseFn({
        data: { purchaseId: row.id, refundArlys: true, removeItems },
      });
      const cur = currentProfileForWallet();
      if (cur && cur === r.profileId) await loadWallet(cur, true);
      setMsg(`Reembolsado ${r.refunded} ✦ para ${nameFor(r.profileId)}.`);
      setTimeout(() => setMsg(null), 2600);
      await load();
    } catch {
      setMsg("Não foi possível reembolsar.");
      setTimeout(() => setMsg(null), 2600);
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  function nameFor(id: string) {
    return PROFILES.find((p) => p.id === id)?.name ?? id;
  }

  const list = (rows ?? []).filter((r) => filter === "all" || r.buyer_profile_id === filter);

  return (
    <section className="ios-card rounded-3xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
            <Undo2 className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Reembolsos</h2>
            <p className="text-xs text-muted-foreground">
              Devolve os Arlys e remove o item do inventário
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-white/[0.09]"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
          Atualizar
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            filter === "all"
              ? "bg-white/15 text-foreground"
              : "border border-white/10 text-foreground/60 hover:bg-white/[0.06]"
          }`}
        >
          Todos
        </button>
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === p.id
                ? "bg-white/15 text-foreground"
                : "border border-white/10 text-foreground/60 hover:bg-white/[0.06]"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {msg}
        </p>
      )}

      {rows === null ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Nenhuma compra registrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {r.item_name ?? (r.deck_id ? "Deck publicado" : "Item")}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-foreground/50">
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 uppercase tracking-wider">
                      {KIND_LABEL[r.item_kind] ?? r.item_kind}
                    </span>
                    <span>{nameFor(r.buyer_profile_id)}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums text-violet-300">
                      <ArlysIcon className="h-3 w-3" strokeWidth={2.5} />
                      {r.price_paid}
                    </span>
                    <span>
                      {new Date(r.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
                <button
                  disabled={busy === r.id}
                  onClick={() => setConfirm(r)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {busy === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <Undo2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  Reembolsar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[oklch(0.16_0.03_290)] p-5 shadow-2xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
              <ShoppingBag className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h3 className="mt-3 text-base font-semibold">Reembolsar compra?</h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground/60">
              <strong className="text-foreground/85">
                {confirm.item_name ?? "Item"}
              </strong>{" "}
              de {nameFor(confirm.buyer_profile_id)}. Serão devolvidos{" "}
              <strong className="text-violet-200">{confirm.price_paid} ✦</strong>.
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => void handleRefund(confirm, true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                Devolver Arlys e remover item
              </button>
              <button
                onClick={() => void handleRefund(confirm, false)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-foreground/85 transition hover:bg-white/[0.09]"
              >
                Só devolver os Arlys
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="w-full rounded-2xl px-4 py-2 text-xs text-foreground/50 transition hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
