import { useEffect, useState } from "react";
import { Hand } from "lucide-react";

import { ProfileAvatar } from "@/components/ProfileAvatar";
import { profileMeta } from "@/lib/social-store";
import { markPokeSeen, useIncomingPoke, usePokesSync } from "@/lib/pokes";
import { isQuietNow, getPrefs } from "@/lib/notification-prefs";
import { playChime, vibratePulse } from "@/lib/notification-sound";

/** Aviso flutuante: "<nome> cutucou você". */
export function PokeOverlay() {
  usePokesSync();
  const poke = useIncomingPoke();
  const [visible, setVisible] = useState(false);

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
    const hide = setTimeout(() => setVisible(false), 2600);
    const ack = setTimeout(() => {
      void markPokeSeen(poke.id);
    }, 2900);
    return () => {
      clearTimeout(hide);
      clearTimeout(ack);
    };
  }, [poke?.id]);

  if (!poke) return null;
  const from = profileMeta(poke.fromProfile);

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[90] w-[min(92vw,360px)] -translate-x-1/2">
      <button
        onClick={() => {
          setVisible(false);
          void markPokeSeen(poke.id);
        }}
        className={`pointer-events-auto flex w-full items-center gap-3 rounded-[22px] border border-white/[0.09] bg-[oklch(0.19_0.02_290/0.94)] px-3.5 py-3 text-left shadow-[0_22px_50px_-18px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        <div className="relative shrink-0">
          <ProfileAvatar
            profileId={poke.fromProfile}
            initial={from.initial}
            gradient={from.gradient}
            size={40}
          />
          <span className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-background ring-1 ring-white/10">
            <Hand className="h-2.5 w-2.5 text-primary" strokeWidth={2.6} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-tight text-foreground">
            {from.name} cutucou você {poke.emoji}
          </p>
          <p className="mt-0.5 text-[11.5px] text-foreground/60">
            Que tal responder a cutucada?
          </p>
        </div>
      </button>
    </div>
  );
}
