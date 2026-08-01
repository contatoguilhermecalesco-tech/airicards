// Enviar 1 fragmento de presente para o outro perfil.
import { useState } from "react";
import { Gift, X, Send } from "lucide-react";
import { toast } from "sonner";
import { ShardArt } from "@/components/hunt/ShardArt";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { TIER_META, SLOT_LABEL, type ShardStack } from "@/lib/relic-hunt";
import { sendShardGift, partnerOf } from "@/lib/shard-gifts";
import { PROFILES } from "@/lib/profile";

export function ShardGiftDialog({
  stack,
  myId,
  onClose,
}: {
  stack: ShardStack;
  myId: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const tier = TIER_META[stack.tier];
  const partner = partnerOf(myId);
  const partnerProfile = PROFILES.find((p) => p.id === partner.id) ?? PROFILES[0];

  async function send() {
    setBusy(true);
    const res = await sendShardGift({
      from: myId,
      to: partner.id,
      key: stack.key,
      note,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Fragmento enviado para ${partner.name}.`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[97] grid place-items-end sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Presentear fragmento"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div
        className="relative w-full max-w-md rounded-t-3xl border border-white/12 p-6 sm:rounded-3xl"
        style={{
          background:
            "radial-gradient(110% 70% at 50% 0%, rgba(167,139,250,0.18), transparent 62%), linear-gradient(165deg, rgba(24,14,40,0.98), rgba(11,6,20,0.99))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Presente
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Enviar fragmento</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/6 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-3">
          <ShardArt
            cosmeticKey={stack.key}
            accent={stack.accent}
            tierColor={tier.color}
            size={52}
            complete={stack.ready}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight">{stack.name}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {SLOT_LABEL[stack.slot] ?? stack.slot} · {tier.label} · você tem{" "}
              {stack.count}
            </p>
          </div>
          <ProfileAvatar
            profileId={partnerProfile.id}
            initial={partnerProfile.initial}
            gradient={partnerProfile.gradient}
            size={36}
            fontScale={0.36}
          />
        </div>

        <label
          htmlFor="shard-gift-note"
          className="mt-4 block text-[12px] font-semibold text-muted-foreground"
        >
          Recado (opcional)
        </label>
        <input
          id="shard-gift-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 120))}
          placeholder={`Para você, ${partner.name} ✦`}
          className="mt-1.5 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-[14px] outline-none transition focus:border-primary/50"
        />

        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          Sai 1 fragmento do seu inventário agora. Se {partner.name} recusar, ele volta
          para você.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void send()}
          className="tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Gift className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {busy ? "Enviando…" : `Enviar para ${partner.name}`}
        </button>
      </div>
    </div>
  );
}
