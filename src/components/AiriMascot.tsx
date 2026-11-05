import { Link } from "@tanstack/react-router";
import airiEstudoFeito from "@/assets/airi-emotes/airi-estudo-feito.png.asset.json";
import airiStreakPerdida from "@/assets/airi-emotes/airi-streak-perdida.png.asset.json";
import airiCorreStreak from "@/assets/airi-emotes/airi-corre-streak.png.asset.json";
import airiMeiaNoite from "@/assets/airi-emotes/airi-meia-noite.png.asset.json";
import { useStreak, useCardsReviewedToday } from "@/lib/flashcards-store";

export type AiriMood = "done" | "lost" | "urgent" | "pending";

export const AIRI_MOODS: Record<AiriMood, { img: string; title: string; detail: string; tone: string }> = {
  done: { img: airiEstudoFeito.url, title: "Estudo do dia feito!", detail: "Sua chama está protegida por hoje. A Airi aprova.", tone: "text-emerald-300" },
  lost: { img: airiStreakPerdida.url, title: "A chama congelou…", detail: "Sua sequência foi perdida, mas toda lenda recomeça. Estude hoje e acenda a chama de novo.", tone: "text-sky-300" },
  urgent: { img: airiMeiaNoite.url, title: "Meia-noite se aproxima!", detail: "Restam poucas horas para registrar o estudo de hoje e salvar sua sequência.", tone: "text-rose-300" },
  pending: { img: airiCorreStreak.url, title: "Corra para não perder a streak!", detail: "Ainda não há estudo registrado hoje. Uma revisão rápida já mantém a chama acesa.", tone: "text-orange-300" },
};

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAiriMood(): AiriMood {
  const streak = useStreak();
  const reviewedToday = useCardsReviewedToday();
  const history = streak.history ?? {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (history[key(today)] === "done" || reviewedToday > 0) return "done";
  if (streak.current === 0 && history[key(yesterday)] === "done") return "lost";
  if (today.getHours() >= 20) return "urgent";
  return "pending";
}

/** Airi grande com balão de fala. */
export function AiriSpeech({ mood, title, detail, to, size = "md" }: { mood: AiriMood; title?: string; detail?: string; to?: "/streak" | "/review"; size?: "md" | "lg" }) {
  const m = AIRI_MOODS[mood];
  const img = size === "lg" ? "h-36 w-36 sm:h-44 sm:w-44" : "h-28 w-28 sm:h-32 sm:w-32";
  const body = (
    <div className="flex items-end gap-3 sm:gap-4">
      <img src={m.img} alt="Airi" className={`${img} shrink-0 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]`} loading="lazy" />
      <div className="relative mb-4 min-w-0 flex-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur sm:p-4">
        <span className="absolute -left-1.5 bottom-2 h-3 w-3 rotate-45 border-b border-l border-white/10 bg-white/[0.05]" />
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${m.tone}`}>Airi diz</p>
        <p className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">{title ?? m.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{detail ?? m.detail}</p>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}
