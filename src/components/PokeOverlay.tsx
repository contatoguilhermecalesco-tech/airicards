import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import pokeCheek from "@/assets/airi-emotes/airi-poke-cheek.png";
import pokeFlying from "@/assets/airi-emotes/airi-poke-flying.png";
import { profileMeta, type ProfileId } from "@/lib/social-store";
import { markPokeSeen, sendPoke, useIncomingPoke, usePokesSync } from "@/lib/pokes";
import { isQuietNow, getPrefs } from "@/lib/notification-prefs";
import { playChime, vibratePulse } from "@/lib/notification-sound";

const POKE_VARIANTS = [
  {
    img: pokeCheek,
    title: "AI, MINHA BOCHECHA!",
    text: (n: string) => `${n} te cutucou sem dó nem piedade. A Airi ficou até tonta com o impacto!`,
    primary: "Cutucar de volta ⚡",
    secondary: "Fingir demência",
  },
  {
    img: pokeFlying,
    title: "GOLPE CRÍTICO!",
    text: (n: string) => `${n} acabou de te dar um empurrão daqueles! A Airi quase foi parar fora da tela.`,
    primary: "Revidar agora 💥",
    secondary: "Deixar passar",
  },
];

/** Janela da Airi: "<nome> cutucou você" — sorteia um dos dois emotes. */
export function PokeOverlay() {
  usePokesSync();
  const poke = useIncomingPoke();
  const [visible, setVisible] = useState(false);

  const variant = useMemo(() => {
    if (!poke) return POKE_VARIANTS[0];
    const seed = [...poke.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return POKE_VARIANTS[seed % POKE_VARIANTS.length];
  }, [poke?.id]);

  useEffect(() => {
    if (!poke) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const prefs = getPrefs();
    if (!isQuietNow(prefs)) {
      if (prefs.sound) playChime();
      if (prefs.vibration) vibratePulse();
    }
  }, [poke?.id]);

  if (!poke) return null;
  const from = profileMeta(poke.fromProfile);

  const close = () => {
    setVisible(false);
    void markPokeSeen(poke.id);
  };

  const pokeBack = async () => {
    const res = await sendPoke(poke.toProfile as ProfileId, poke.fromProfile as ProfileId);
    if (res.ok) toast.success(`Cutucada devolvida para ${from.name}!`);
    else if (res.error === "cooldown") toast("Calma! Espere alguns segundos para cutucar de novo.");
    else toast.error("Não deu para cutucar agora.");
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[130] grid place-items-center bg-background/70 px-5 backdrop-blur-md transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={close}
      role="dialog"
      aria-label={`${from.name} cutucou você`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[360px] rounded-[28px] border border-border/60 bg-card/95 p-5 pt-3 text-center shadow-2xl transition-transform duration-300 ${
          visible ? "animate-[airi-duty-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)]" : "scale-95"
        }`}
      >
        <img
          src={variant.img}
          alt="Airi levando uma cutucada"
          className="mx-auto -mt-16 h-[190px] w-auto object-contain drop-shadow-2xl"
        />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {from.name} cutucou você
        </p>
        <h2 className="mt-1 text-[22px] font-bold tracking-tight text-foreground">{variant.title}</h2>
        <p className="mt-2 text-[14px] leading-snug text-muted-foreground">{variant.text(from.name)}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            autoFocus
            onClick={pokeBack}
            className="h-12 rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            {variant.primary}
          </button>
          <button
            onClick={close}
            className="h-10 rounded-2xl text-[14px] font-medium text-muted-foreground hover:text-foreground"
          >
            {variant.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}
