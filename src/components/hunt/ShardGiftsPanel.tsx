// Trocas de fragmentos entre os dois perfis: recebidos e enviados.
// O fragmento sai do inventário de quem envia e entra no de quem recebe.
import { Gift, Check, Send, ArrowLeftRight } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ShardArt } from "@/components/hunt/ShardArt";
import { TIER_META, SLOT_LABEL } from "@/lib/relic-hunt";
import {
  useShardGiftsSync,
  useOutgoingShardGifts,
  useReceivedShardGifts,
  useShardGiftHistory,
} from "@/lib/shard-gifts";
import { PROFILES } from "@/lib/profile";

function meta(id: string) {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

export function ShardGiftsPanel({ myId }: { myId: string | undefined }) {
  useShardGiftsSync();
  const received = useReceivedShardGifts(myId, 8);
  const outgoing = useOutgoingShardGifts(myId);
  const history = useShardGiftHistory(8);

  if (!myId) return null;

  return (
    <div>
      <h3 className="flex items-center gap-2 text-[13px] font-bold tracking-tight">
        <ArrowLeftRight className="h-4 w-4 shrink-0 text-primary" />
        Trocas de fragmentos
      </h3>

      {received.length === 0 && outgoing.length === 0 && history.length === 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Use o botão <Gift className="inline h-3.5 w-3.5" /> <strong>Presentear</strong>{" "}
          em qualquer fragmento para enviar ao outro perfil — o fragmento sai da sua conta
          e vai direto para a dela.
        </p>
      )}

      {received.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recebidos
          </p>
          <ul className="mt-2 space-y-2">
            {received.map((g) => {
              const sender = meta(g.fromProfile);
              const tier = TIER_META[g.tier] ?? TIER_META.comum;
              return (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{
                    borderColor: `${tier.color}3a`,
                    background: `linear-gradient(160deg, ${tier.color}12, rgba(255,255,255,0.02))`,
                  }}
                >
                  <ShardArt
                    cosmeticKey={g.shardKey}
                    accent={g.accent}
                    tierColor={tier.color}
                    size={38}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <ProfileAvatar
                        profileId={sender.id}
                        initial={sender.initial}
                        gradient={sender.gradient}
                        size={16}
                        fontScale={0.42}
                      />
                      De {sender.name}
                    </span>
                    <span className="block truncate text-[13.5px] font-semibold">
                      {g.shardName}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {SLOT_LABEL[g.slot] ?? g.slot} · {tier.label}
                    </span>
                    {g.note && (
                      <span className="mt-1 block truncate text-[11.5px] italic text-muted-foreground">
                        "{g.note}"
                      </span>
                    )}
                  </span>
                  <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Enviados
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
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/12">
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
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
    </div>
  );
}
