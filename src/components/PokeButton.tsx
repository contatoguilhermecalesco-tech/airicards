import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import { toast } from "sonner";

import { useCurrentProfile } from "@/lib/profile";
import { otherProfile, profileMeta, type ProfileId } from "@/lib/social-store";
import { pokeCooldownLeft, sendPoke, usePokesSync } from "@/lib/pokes";

export function PokeButton({
  targetId,
  variant = "pill",
}: {
  targetId?: ProfileId;
  variant?: "pill" | "icon";
}) {
  usePokesSync();
  const me = useCurrentProfile();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCooldown(Math.ceil(pokeCooldownLeft() / 1000)), 500);
    return () => clearInterval(t);
  }, []);

  if (!me) return null;
  const to = targetId ?? otherProfile(me.id as ProfileId);
  if (to === me.id) return null;
  const target = profileMeta(to);

  const disabled = sending || cooldown > 0;

  const handle = async () => {
    setSending(true);
    const res = await sendPoke(me.id as ProfileId, to);
    setSending(false);
    if (res.ok) {
      toast.success(`Você cutucou ${target.name} 👆`, { duration: 2000 });
      setCooldown(Math.ceil(pokeCooldownLeft() / 1000));
    } else if (res.error === "cooldown") {
      toast(`Espere um pouco para cutucar de novo`, { duration: 2000 });
    } else {
      toast.error("Não foi possível cutucar agora", { duration: 2000 });
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handle}
        disabled={disabled}
        aria-label={`Cutucar ${target.name}`}
        title={cooldown > 0 ? `Aguarde ${cooldown}s` : `Cutucar ${target.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/80 transition hover:bg-white/[0.09] hover:text-foreground disabled:opacity-40"
      >
        <Hand className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/12 px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-45"
    >
      <Hand className="h-3.5 w-3.5" strokeWidth={2.5} />
      {cooldown > 0 ? `Cutucar · ${cooldown}s` : "Cutucar"}
    </button>
  );
}
