import { Link } from "@tanstack/react-router";
import airiEstudoFeito from "@/assets/airi-emotes/airi-estudo-feito-cut.png";
import airiStreakPerdida from "@/assets/airi-emotes/airi-streak-perdida-cut.png";
import airiCorreStreak from "@/assets/airi-emotes/airi-corre-streak-cut.png";
import airiMeiaNoite from "@/assets/airi-emotes/airi-meia-noite-cut.png";

import { useStreak, useCardsReviewedToday } from "@/lib/flashcards-store";

export type AiriMood = "done" | "lost" | "urgent" | "pending";
export type StudySkill = "reading" | "listening" | "speaking" | "grammar" | "writing";
export type AiriFocusMood = StudySkill | "missions_done" | "missions_pending";
type AiriRoute = "/study/reading" | "/study/listening" | "/study/speaking" | "/study/grammar" | "/study/writing" | "/desafios" | "/review";

export const AIRI_MOODS: Record<AiriMood, { img: string; title: string; detail: string; tone: string }> = {
  done: { img: airiEstudoFeito, title: "Estudo do dia feito!", detail: "Sua chama está protegida por hoje. A Airi aprova.", tone: "text-emerald-300" },
  lost: { img: airiStreakPerdida, title: "A chama congelou…", detail: "Sua sequência foi perdida, mas toda lenda recomeça. Estude hoje e acenda a chama de novo.", tone: "text-sky-300" },
  urgent: { img: airiMeiaNoite, title: "Meia-noite se aproxima!", detail: "Restam poucas horas para registrar o estudo de hoje e salvar sua sequência.", tone: "text-rose-300" },
  pending: { img: airiCorreStreak, title: "Corra para não perder a streak!", detail: "Ainda não há estudo registrado hoje. Uma revisão rápida já mantém a chama acesa.", tone: "text-orange-300" },
};

export const AIRI_FOCUS_CONFIG: Record<AiriFocusMood, { img: string; title: string; detail: string; route: AiriRoute; badgeColor: string }> = {
  reading: { img: airiEstudoFeito, title: "Vamos mergulhar nessa leitura!", detail: "Leia com atenção, observe o contexto e descubra o sentido antes de consultar a tradução.", route: "/study/reading", badgeColor: "var(--study-reading)" },
  listening: { img: airiCorreStreak, title: "Hora de afiar os ouvidos!", detail: "Escute primeiro a ideia geral. Depois, preste atenção nas palavras e expressões.", route: "/study/listening", badgeColor: "var(--study-listening)" },
  speaking: { img: airiEstudoFeito, title: "Solta a voz!", detail: "Fale em voz alta, sem medo de errar. Clareza e fluência melhoram com prática.", route: "/study/speaking", badgeColor: "var(--study-speaking)" },
  grammar: { img: airiEstudoFeito, title: "Vamos desvendar essa regra!", detail: "Observe a estrutura, compare exemplos e aplique a regra em frases próprias.", route: "/study/grammar", badgeColor: "var(--study-grammar)" },
  writing: { img: airiCorreStreak, title: "Modo Hacker ativado!", detail: "Organize suas ideias em inglês. Escreva primeiro; depois revise estrutura e vocabulário.", route: "/study/writing", badgeColor: "var(--study-writing)" },
  missions_done: { img: airiEstudoFeito, title: "Missões concluídas!", detail: "Você completou os desafios de hoje. Hora de resgatar suas recompensas.", route: "/desafios", badgeColor: "var(--primary)" },
  missions_pending: { img: airiCorreStreak, title: "Seu próximo desafio espera!", detail: "Entre em uma missão, pratique inglês e conquiste Arlys e LP.", route: "/desafios", badgeColor: "var(--primary)" },
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

/** Airi grande com balão de fala para os estados de streak/revisão. */
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

/** Banner temático reutilizável para as habilidades e missões. */
export function AiriFocusBanner({ mood, title, detail, actionLabel = "Iniciar treino", compact = false }: {
  mood: AiriFocusMood; title?: string; detail?: string; actionLabel?: string; compact?: boolean;
}) {
  const config = AIRI_FOCUS_CONFIG[mood];
  return (
    <Link to={to ?? config.route} className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-white/20 hover:bg-white/[0.07] sm:gap-4 sm:p-4">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: config.badgeColor }} />
      <img src={config.img} alt={`Airi — ${mood}`} className={`${compact ? "h-20 w-20 sm:h-24 sm:w-24" : "h-28 w-28 sm:h-32 sm:w-32"} relative z-10 shrink-0 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.45)]`} loading="lazy" />
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: config.badgeColor }}>Airi · foco do dia</span>
        <span className="mt-1 block text-base font-semibold leading-tight text-foreground sm:text-lg">{title ?? config.title}</span>
        <span className={`mt-1 block text-xs leading-relaxed text-muted-foreground ${compact ? "line-clamp-2" : "sm:text-sm"}`}>{detail ?? config.detail}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground transition group-hover:gap-2.5">
          {actionLabel} <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}

export function AiriFocusSticker({ mood, caption, className = "", pulse = false }: {
  mood: AiriFocusMood; caption?: string; className?: string; pulse?: boolean;
}) {
  const config = AIRI_FOCUS_CONFIG[mood];
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 ${className}`}>
      <img src={config.img} alt={`Airi — ${mood}`} className={`h-20 w-20 shrink-0 object-contain ${pulse ? "animate-pulse drop-shadow-[0_0_18px_rgba(168,85,247,.55)]" : ""}`} loading="lazy" />
      {caption && <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>}
    </div>
  );
}
