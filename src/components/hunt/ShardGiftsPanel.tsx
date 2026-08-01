// Trocas de fragmentos entre os dois perfis: recebidos, enviados e histórico.
import { useEffect, useState } from "react";
import { Gift, Check, X, Send, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ShardArt } from "@/components/hunt/ShardArt";
import { TIER_META, SLOT_LABEL } from "@/lib/relic-hunt";
import {
  useShardGiftsSync,
  useIncomingShardGifts,
  useOutgoingShardGifts,
  useShardGiftHistory,
  acceptShardGift,
  declineShardGift,
  reclaimDeclinedShardGifts,
  type ShardGift,
} from "@/lib/shard-gifts";
import { PROFILES } from "@/lib/profile";

function meta(id: string) {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

export function ShardGiftsPanel({ myId }: { myId: string | undefined }) {
  useShardGiftsSync();
  const incoming = useIncomingShardGifts(myId);
  const outgoing = useOutgoingShardGifts(myId);
  const history = useShardGiftHistory(6);
  const [busy, setBusy] = useState<string | null>(null);

  // Fragmentos de presentes recusados voltam para quem enviou.
  useEffect(() => {
    const n = reclaimDeclinedShardGifts(myId);
    if (n > 0) toast.info(`${n} fragmento(s) devolvido(s) ao seu inventário.`);
  }, [myId, history.length]);

  if (!myId) return null;

  async function accept(g: ShardGift) {
    setBusy(g.id);
    const ok = await acceptShardGift(g);
    setBusy(null);
    toast[ok ? "success" : "error"](
      ok ? `Fragmento de ${g.shardName} guardado!` : "Não foi possível aceitar agora.",
    );
  }

  async function decline(g: ShardGift) {
    setBusy(g.id);
    const ok = await declineShardGift(g);
    setBusy(null);
    if (!ok) toast.error("Não foi possível recusar agora.");
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-surface/50 p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight">
          <ArrowLeftRight className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">Trocas de fragmentos</span>
        </h2>
        {incoming.length > 0 && (
          <span className="shrink-0 rounded-full bg-primary/18 px-2.5 py-1 text-[11px] font-bold text-primary">
            {incoming.length} novo{incoming.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {incoming.length === 0 && outgoing.length === 0 && history.length === 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Use o botão <Gift className="inline h-3.5 w-3.5" /> <strong>Presentear</strong>{" "}
          em qualquer fragmento para enviar ao outro perfil — ótimo para completar um
          conjunto que falta pouco.
        </p>
      )}

      {incoming.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {incoming.map((g) => {
            const sender = meta(g.fromProfile);
            const tier = TIER_META[g.tier] ?? TIER_META.comum;
            return (
              <li
                key={g.id}
                className="rounded-2xl border p-3.5"
                style={{
                  borderColor: `${tier.color}44`,
                  background: `linear-gradient(160deg, ${tier.color}14, rgba(255,255,255,0.02))`,
                }}
              >
                <div className="flex items-start gap-3">
                  <ShardArt
                    cosmeticKey={g.shardKey}
                    accent={g.accent}
                    tierColor={tier.color}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <ProfileAvatar
                        profileId={sender.id}
                        initial={sender.initial}
                        gradient={sender.gradient}
                        size={18}
                        fontScale={0.42}
                      />
                      De {sender.name}
                    </p>
                    <p className="mt-1 truncate text-[15px] font-bold tracking-tight">
                      {g.shardName}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {SLOT_LABEL[g.slot] ?? g.slot} · {tier.label}
                    </p>
                    {g.note && (
                      <p className="mt-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-[12px] italic text-muted-foreground">
                        "{g.note}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy === g.id}
                    onClick={() => void accept(g)}
                    className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Guardar
                  </button>
                  <button
                    type="button"
                    disabled={busy === g.id}
                    onClick={() => void decline(g)}
                    aria-label="Recusar presente"
                    className="tap-target grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {outgoing.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Aguardando resposta
          </p>
          <ul className="mt-2 space-y-2">
            {outgoing.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-3 py-2.5"
              >
                <Send className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-[12.5px]">
                  {g.shardName} → {meta(g.toProfile).name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Histórico
          </p>
          <ul className="mt-2 divide-y divide-white/6">
            {history.map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: g.status === "accepted" ? "#34d3991f" : "#f871711f",
                  }}
                >
                  {g.status === "accepted" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
                  {meta(g.fromProfile).name} → {meta(g.toProfile).name}:{" "}
                  <span className="text-foreground">{g.shardName}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(g.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
